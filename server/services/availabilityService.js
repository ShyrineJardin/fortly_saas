const moment = require('moment-timezone');

/**
 * AvailabilityService
 *
 * Handles all booking slot logic:
 * - appointment services: slot interval = service duration, slots blocked when concurrent count >= maxConcurrentBookings
 * - preparation services: multi-day prep, client picks delivery date, NO slots blocked (business handles capacity via maxConcurrentBookings)
 * - occupancy services: multi-day, client picks start date, all spanned dates blocked when concurrent count >= maxConcurrentBookings
 *
 * Buffer time: added AFTER each appointment slot (cleanup/prep between appointments)
 * Rest time: no slots generated that overlap the rest period
 * Concurrent bookings: business can set maxConcurrentBookings > 1 to accept parallel appointments
 */

class AvailabilityService {

  // ─────────────────────────────────────────────
  // PUBLIC: Main entry point
  // ─────────────────────────────────────────────

  /**
   * Returns { availableSlots, takenSlots, closedDay, blockedByOccupancy }
   */
  async getAvailableSlotsWithStatus(business, service, date, existingBookings) {
    try {
      const tz = business.timezone || 'UTC';
      const maxConcurrent = business.maxConcurrentBookings || 1;
      const serviceType = service.serviceType || 'appointment';
      const requestedDate = moment.tz(date, tz);
      const dayOfWeek = requestedDate.format('dddd');

      // ── 1. Check business is open on this day ──
      const schedule = business.schedules?.find(s => s.dayOfWeek === dayOfWeek);
      if (!schedule || !schedule.enabled) {
        return { availableSlots: [], takenSlots: [], closedDay: true, blockedByOccupancy: false };
      }

      // ── 2. Check if date is blocked by occupancy-type bookings ──
      const blockedByOccupancy = this._isDateBlockedByOccupancy(date, existingBookings, maxConcurrent, service.id);
      if (blockedByOccupancy) {
        return { availableSlots: [], takenSlots: [], closedDay: false, blockedByOccupancy: true };
      }

      // ── 3. Parse durations ──
      const serviceDurationMinutes = this.parseDuration(service.duration);
      const bufferMinutes = business.bufferTime ? this.parseDuration(business.bufferTime) : 0;

      // ── 4. Auto-detect: if serviceType is appointment but duration >= 1 day,
      //       treat as preparation so multi-day services return pickup time slots ──
      let effectiveType = serviceType;
      if (effectiveType === 'appointment' && serviceDurationMinutes >= 24 * 60) {
        effectiveType = 'preparation';
      }

      // ── 5. Branch by effective service type ──
      if (effectiveType === 'preparation') {
        return this._getPreparationSlots(schedule, date, tz, bufferMinutes, existingBookings, maxConcurrent);
      }

      if (effectiveType === 'occupancy') {
        return this._getOccupancySlots(schedule, date, tz, serviceDurationMinutes, existingBookings, maxConcurrent);
      }

      // Default: appointment (sub-day duration)
      return this._getAppointmentSlots(schedule, date, tz, serviceDurationMinutes, bufferMinutes, existingBookings, maxConcurrent);

    } catch (error) {
      console.error('❌ AvailabilityService error:', error);
      return { availableSlots: [], takenSlots: [], closedDay: false, blockedByOccupancy: false };
    }
  }

  // ─────────────────────────────────────────────
  // APPOINTMENT slots (regular services)
  // Interval = service duration. Buffer added after each slot.
  // ─────────────────────────────────────────────

  _getAppointmentSlots(schedule, date, tz, serviceDuration, bufferMinutes, existingBookings, maxConcurrent) {
    const availableSlots = [];
    const takenSlots = [];

    const dayStart = moment.tz(`${date} ${schedule.startTime}`, 'YYYY-MM-DD HH:mm', tz);
    const dayEnd = moment.tz(`${date} ${schedule.endTime}`, 'YYYY-MM-DD HH:mm', tz);
    const now = moment.tz(tz);

    // Rest period
    let restStart = null, restEnd = null;
    if (schedule.hasRest && schedule.restStartTime && schedule.restEndTime) {
      restStart = moment.tz(`${date} ${schedule.restStartTime}`, 'YYYY-MM-DD HH:mm', tz);
      restEnd = moment.tz(`${date} ${schedule.restEndTime}`, 'YYYY-MM-DD HH:mm', tz);
    }

    // Slot interval = service duration (not hardcoded 30min)
    const slotInterval = serviceDuration;
    let current = dayStart.clone();

    while (current.clone().add(serviceDuration, 'minutes').isSameOrBefore(dayEnd)) {
      const slotEnd = current.clone().add(serviceDuration, 'minutes');
      const timeStr = current.format('HH:mm');
      const display = this.formatTime(timeStr);

      // Skip slots overlapping rest period
      if (restStart && restEnd && this._overlaps(current, slotEnd, restStart, restEnd)) {
        current.add(slotInterval, 'minutes');
        continue;
      }

      // Count how many existing bookings overlap this slot
      const overlapCount = this._countOverlappingAppointments(current, slotEnd, existingBookings, tz);

      if (overlapCount >= maxConcurrent) {
        // Fully booked
        takenSlots.push({ time: timeStr, display, reason: 'Fully booked', status: 'booked' });
      } else if (current.isSameOrBefore(now)) {
        // Past time
        takenSlots.push({ time: timeStr, display, reason: 'Past time', status: 'unavailable' });
      } else {
        availableSlots.push({ time: timeStr, display, available: true });
      }

      current.add(slotInterval + bufferMinutes, 'minutes');
    }

    return { availableSlots, takenSlots, closedDay: false, blockedByOccupancy: false };
  }

  // ─────────────────────────────────────────────
  // PREPARATION slots (e.g. custom cake - 3 day prep)
  // Client picks a delivery/pickup date.
  // No time blocking — business handles workload via maxConcurrentBookings.
  // Show pickup time slots during business hours.
  // ─────────────────────────────────────────────

  _getPreparationSlots(schedule, date, tz, bufferMinutes, existingBookings, maxConcurrent) {
    const availableSlots = [];
    const takenSlots = [];
    const now = moment.tz(tz);

    const dayStart = moment.tz(`${date} ${schedule.startTime}`, 'YYYY-MM-DD HH:mm', tz);
    const dayEnd = moment.tz(`${date} ${schedule.endTime}`, 'YYYY-MM-DD HH:mm', tz);

    // Offer pickup slots every hour
    const slotInterval = 60;
    let current = dayStart.clone();

    while (current.clone().add(30, 'minutes').isSameOrBefore(dayEnd)) {
      const timeStr = current.format('HH:mm');
      const display = this.formatTime(timeStr);

      // Count how many preparation bookings already scheduled for this pickup time
      const pickupCount = existingBookings.filter(b => {
        const bTime = moment.tz(`${b.bookingDate} ${b.bookingTime}`, 'YYYY-MM-DD HH:mm:ss', tz);
        return bTime.format('HH:mm') === timeStr;
      }).length;

      if (pickupCount >= maxConcurrent) {
        takenSlots.push({ time: timeStr, display, reason: 'Pickup slot full', status: 'booked' });
      } else if (current.isSameOrBefore(now)) {
        takenSlots.push({ time: timeStr, display, reason: 'Past time', status: 'unavailable' });
      } else {
        availableSlots.push({ time: timeStr, display, available: true });
      }

      current.add(slotInterval, 'minutes');
    }

    return { availableSlots, takenSlots, closedDay: false, blockedByOccupancy: false };
  }

  // ─────────────────────────────────────────────
  // OCCUPANCY slots (e.g. 3-day event setup)
  // Client picks a start date.
  // System blocks all spanned dates when concurrent count >= max.
  // Show a single "All day" slot or specific start times.
  // ─────────────────────────────────────────────

  _getOccupancySlots(schedule, date, tz, serviceDurationMinutes, existingBookings, maxConcurrent) {
    const availableSlots = [];
    const takenSlots = [];
    const now = moment.tz(tz);

    const dayStart = moment.tz(`${date} ${schedule.startTime}`, 'YYYY-MM-DD HH:mm', tz);
    const dayEnd = moment.tz(`${date} ${schedule.endTime}`, 'YYYY-MM-DD HH:mm', tz);
    const serviceDays = Math.ceil(serviceDurationMinutes / (24 * 60));

    // Offer just a few start times (beginning of day, and every 2hrs)
    const slotInterval = 120;
    let current = dayStart.clone();

    while (current.clone().isBefore(dayEnd)) {
      const slotEnd = current.clone().add(serviceDurationMinutes, 'minutes');
      const timeStr = current.format('HH:mm');
      const display = this.formatTime(timeStr);

      // Count overlapping occupancy bookings across the entire span
      const overlapCount = this._countOverlappingOccupancy(current, slotEnd, existingBookings, tz);

      if (overlapCount >= maxConcurrent) {
        takenSlots.push({ time: timeStr, display, reason: `Fully booked (${serviceDays}-day span)`, status: 'booked' });
      } else if (current.isSameOrBefore(now)) {
        takenSlots.push({ time: timeStr, display, reason: 'Past time', status: 'unavailable' });
      } else {
        availableSlots.push({ time: timeStr, display, available: true, spanDays: serviceDays });
      }

      current.add(slotInterval, 'minutes');
    }

    return { availableSlots, takenSlots, closedDay: false, blockedByOccupancy: false };
  }

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────

  /**
   * Check if a date is entirely blocked by occupancy bookings
   * (i.e., an occupancy booking's span covers this date and fills max concurrent)
   */
  _isDateBlockedByOccupancy(date, existingBookings, maxConcurrent, currentServiceId) {
    const targetDate = moment(date, 'YYYY-MM-DD');

    const occupancyBookings = existingBookings.filter(b => {
      const sType = b.Service?.serviceType || 'appointment';
      return sType === 'occupancy';
    });

    if (occupancyBookings.length === 0) return false;

    // Count how many occupancy bookings span this date
    const spanCount = occupancyBookings.filter(b => {
      const start = moment(b.bookingDate, 'YYYY-MM-DD');
      const endDate = b.bookingEndDate
        ? moment(b.bookingEndDate, 'YYYY-MM-DD')
        : start.clone().add(this.parseDuration(b.Service.duration), 'minutes');

      return targetDate.isSameOrAfter(start, 'day') && targetDate.isSameOrBefore(endDate, 'day');
    }).length;

    return spanCount >= maxConcurrent;
  }

  /**
   * Count appointment bookings that overlap a time window
   */
  _countOverlappingAppointments(slotStart, slotEnd, existingBookings, tz) {
    return existingBookings.filter(b => {
      const sType = b.Service?.serviceType || 'appointment';
      if (sType !== 'appointment') return false;

      const bStart = moment.tz(`${b.bookingDate} ${b.bookingTime}`, 'YYYY-MM-DD HH:mm:ss', tz);
      const bDuration = this.parseDuration(b.Service.duration);
      const bEnd = bStart.clone().add(bDuration, 'minutes');

      return this._overlaps(slotStart, slotEnd, bStart, bEnd);
    }).length;
  }

  /**
   * Count occupancy bookings whose full span overlaps a time window
   */
  _countOverlappingOccupancy(slotStart, slotEnd, existingBookings, tz) {
    return existingBookings.filter(b => {
      const sType = b.Service?.serviceType || 'appointment';
      if (sType !== 'occupancy') return false;

      const bStart = moment.tz(`${b.bookingDate} ${b.bookingTime}`, 'YYYY-MM-DD HH:mm:ss', tz);
      const bDuration = this.parseDuration(b.Service.duration);
      const bEnd = b.bookingEndDate
        ? moment.tz(`${b.bookingEndDate} ${b.bookingTime}`, 'YYYY-MM-DD HH:mm:ss', tz)
        : bStart.clone().add(bDuration, 'minutes');

      return this._overlaps(slotStart, slotEnd, bStart, bEnd);
    }).length;
  }

  /**
   * True if [aStart, aEnd) overlaps [bStart, bEnd)
   */
  _overlaps(aStart, aEnd, bStart, bEnd) {
    return aStart.isBefore(bEnd) && aEnd.isAfter(bStart);
  }

  /**
   * Parse duration string to minutes.
   * Supports: "60 minutes", "2 hours", "3 days", "1 week", etc.
   */
  parseDuration(durationStr) {
    if (!durationStr) return 0;
    const match = String(durationStr).match(/^(\d+(?:\.\d+)?)\s*(\w+)$/);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 'minute': case 'minutes': case 'min': case 'mins': return value;
      case 'hour': case 'hours': case 'hr': case 'hrs': return value * 60;
      case 'day': case 'days': return value * 24 * 60;
      case 'week': case 'weeks': return value * 7 * 24 * 60;
      case 'month': case 'months': return value * 30 * 24 * 60;
      default: return 0;
    }
  }

  /**
   * Calculate the end date of a booking given start date and duration string
   */
  calculateEndDate(startDate, startTime, durationStr, tz) {
    const durationMinutes = this.parseDuration(durationStr);
    const start = moment.tz(`${startDate} ${startTime}`, 'YYYY-MM-DD HH:mm', tz);
    const end = start.clone().add(durationMinutes, 'minutes');
    return {
      endDate: end.format('YYYY-MM-DD'),
      endTime: end.format('HH:mm'),
      spansDays: end.format('YYYY-MM-DD') !== startDate
    };
  }

  /**
   * Get minimum advance booking days required
   * For preparation services: bufferDays + prepDays
   * For appointment/occupancy: just bufferDays
   */
  getMinAdvanceDays(bufferTime, serviceDuration = 0, serviceType = 'appointment') {
    const bufferMinutes = this.parseDuration(bufferTime);
    const serviceDurationMinutes = this.parseDuration(serviceDuration);

    if (serviceType === 'preparation') {
      // Must book at least (prep duration + buffer) days before pickup
      const totalMinutes = serviceDurationMinutes + bufferMinutes;
      return Math.ceil(totalMinutes / (24 * 60));
    }

    return Math.ceil(bufferMinutes / (24 * 60));
  }

  /**
   * Check if a specific date is available for booking (used by frontend calendar)
   */
  isDateAvailable(requestDate, today, service, bufferTime, existingBookings = [], maxConcurrent = 1) {
    const minAdvanceDays = this.getMinAdvanceDays(bufferTime, service.duration, service.serviceType || 'appointment');
    const minDate = moment(today).add(minAdvanceDays, 'days');

    if (moment(requestDate).isBefore(minDate, 'day')) return false;

    // For occupancy: check if fully blocked by existing occupancy bookings
    if ((service.serviceType || 'appointment') === 'occupancy') {
      return !this._isDateBlockedByOccupancy(requestDate, existingBookings, maxConcurrent, service.id);
    }

    return true;
  }

  /**
   * Format HH:mm to 12-hour display
   */
  formatTime(time24) {
    const [hours, minutes] = time24.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHour}:${String(minutes).padStart(2, '0')} ${ampm}`;
  }

  /**
   * Convert HH:mm to minutes since midnight
   */
  timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

module.exports = new AvailabilityService();