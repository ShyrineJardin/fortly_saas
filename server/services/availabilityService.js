const moment = require('moment-timezone');

/**
 * Availability Service
 * Handles complex booking availability logic including:
 * - Business hours
 * - Rest/break times
 * - Buffer time between appointments
 * - Existing bookings
 * - Service duration
 * - Preparation time for multi-day services
 */

class AvailabilityService {
  /**
   * Get available time slots for a specific date
   */
  async getAvailableSlots(business, service, date, existingBookings = []) {
    try {
      // Parse the requested date
      const requestedDate = moment.tz(date, business.timezone);
      const dayOfWeek = requestedDate.format('dddd'); // e.g., "Monday"

      console.log('🔍 Checking availability:', {
        date: requestedDate.format('YYYY-MM-DD'),
        dayOfWeek,
        timezone: business.timezone
      });

      // Find business hours for this day
      const daySchedule = business.schedules.find(s => s.dayOfWeek === dayOfWeek);

      if (!daySchedule || !daySchedule.enabled) {
        console.log('❌ Business is closed on', dayOfWeek);
        return [];
      }

      // Parse service duration
      const serviceDuration = this.parseDuration(service.duration);
      
      // Parse buffer time
      const bufferTime = business.bufferTime ? this.parseDuration(business.bufferTime) : 0;

      console.log('⏱️ Time settings:', {
        serviceDuration: `${serviceDuration} minutes`,
        bufferTime: `${bufferTime} minutes`,
        totalSlotTime: `${serviceDuration + bufferTime} minutes`
      });

      // Generate all possible slots
      const allSlots = this.generateTimeSlots(
        daySchedule,
        serviceDuration,
        bufferTime,
        requestedDate
      );

      console.log('📋 Generated', allSlots.length, 'potential slots');

      // Filter out booked slots
      const availableSlots = this.filterBookedSlots(
        allSlots,
        existingBookings,
        serviceDuration,
        bufferTime
      );

      console.log('✅ Available slots:', availableSlots.length);

      return availableSlots;
    } catch (error) {
      console.error('❌ Error getting available slots:', error);
      throw error;
    }
  }

  /**
   * Parse duration string to minutes
   * Supports: "60 minutes", "2 hours", "1 day", "24 hours", etc.
   */
  parseDuration(durationStr) {
    if (!durationStr) return 0;

    const match = durationStr.match(/^(\d+(?:\.\d+)?)\s*(\w+)$/);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 'minute':
      case 'minutes':
      case 'min':
      case 'mins':
        return value;
      case 'hour':
      case 'hours':
      case 'hr':
      case 'hrs':
        return value * 60;
      case 'day':
      case 'days':
        return value * 24 * 60;
      case 'week':
      case 'weeks':
        return value * 7 * 24 * 60;
      case 'month':
      case 'months':
        return value * 30 * 24 * 60;
      default:
        return 0;
    }
  }

  /**
   * Generate all possible time slots for a day
   */
  generateTimeSlots(daySchedule, serviceDuration, bufferTime, date) {
    const slots = [];
    
    // Parse start and end times
    const [startHour, startMin] = daySchedule.startTime.split(':').map(Number);
    const [endHour, endMin] = daySchedule.endTime.split(':').map(Number);
    
    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    // Total time needed for one slot (service + buffer)
    const slotInterval = serviceDuration + bufferTime;

    // For multi-day services, only show end-of-day pickup/delivery times
    if (serviceDuration >= 24 * 60) {
      // Multi-day service - only offer a few pickup times
      const pickupTimes = this.getPickupTimeSlots(daySchedule);
      return pickupTimes.map(time => ({
        time: time,
        startMinutes: this.timeToMinutes(time),
        display: this.formatTime(time),
        type: 'pickup'
      }));
    }

    // Regular service - generate slots throughout the day
    while (currentMinutes + serviceDuration <= endMinutes) {
      const hour = Math.floor(currentMinutes / 60);
      const minute = currentMinutes % 60;
      const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      
      // Check if this slot conflicts with rest time
      if (!this.isInRestPeriod(currentMinutes, serviceDuration, daySchedule)) {
        slots.push({
          time: timeString,
          startMinutes: currentMinutes,
          endMinutes: currentMinutes + serviceDuration,
          display: this.formatTime(timeString),
          type: 'regular'
        });
      }

      currentMinutes += slotInterval;
    }

    return slots;
  }

  /**
   * Get pickup/delivery time slots for multi-day services
   */
  getPickupTimeSlots(daySchedule) {
    const [startHour] = daySchedule.startTime.split(':').map(Number);
    const [endHour] = daySchedule.endTime.split(':').map(Number);
    
    // Offer slots every 2 hours between open and close
    const pickupSlots = [];
    for (let hour = startHour; hour <= endHour - 1; hour += 2) {
      pickupSlots.push(`${String(hour).padStart(2, '0')}:00`);
    }
    
    return pickupSlots;
  }

  /**
   * Check if a time slot conflicts with rest period
   */
  isInRestPeriod(startMinutes, duration, daySchedule) {
    if (!daySchedule.hasRest || !daySchedule.restStartTime || !daySchedule.restEndTime) {
      return false;
    }

    const [restStartHour, restStartMin] = daySchedule.restStartTime.split(':').map(Number);
    const [restEndHour, restEndMin] = daySchedule.restEndTime.split(':').map(Number);
    
    const restStart = restStartHour * 60 + restStartMin;
    const restEnd = restEndHour * 60 + restEndMin;
    const slotEnd = startMinutes + duration;

    // Check if slot overlaps with rest period
    return (startMinutes < restEnd && slotEnd > restStart);
  }

  /**
   * Filter out slots that conflict with existing bookings
   */
  filterBookedSlots(allSlots, bookings, serviceDuration, bufferTime) {
    return allSlots.filter(slot => {
      // Check if this slot conflicts with any existing booking
      const hasConflict = bookings.some(booking => {
        const bookingStartMinutes = this.timeToMinutes(booking.bookingTime);
        
        // Get the service duration for this booking
        const bookingDuration = this.parseDuration(booking.Service.duration);
        const bookingEndMinutes = bookingStartMinutes + bookingDuration;

        // Check overlap with buffer time included
        const slotStart = slot.startMinutes;
        const slotEnd = slot.endMinutes + bufferTime;

        return (slotStart < bookingEndMinutes + bufferTime && slotEnd > bookingStartMinutes);
      });

      return !hasConflict;
    });
  }

  /**
   * Convert time string to minutes
   */
  timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Format time to 12-hour format with AM/PM
   */
  formatTime(time24) {
    const [hours, minutes] = time24.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHour}:${String(minutes).padStart(2, '0')} ${ampm}`;
  }

  /**
   * Check if a date is available for booking
   * Considers preparation time for multi-day services
   */
  isDateAvailable(requestDate, today, service, bufferTime) {
    const serviceDuration = this.parseDuration(service.duration);
    const bufferMinutes = this.parseDuration(bufferTime);

    // Calculate minimum advance time needed
    let minAdvanceMinutes = bufferMinutes;
    
    // For multi-day services, add the service duration to the buffer
    if (serviceDuration >= 24 * 60) {
      minAdvanceMinutes += serviceDuration;
    }

    // Calculate minimum date
    const minDate = moment(today).add(minAdvanceMinutes, 'minutes');
    
    return moment(requestDate).isSameOrAfter(minDate, 'day');
  }

  /**
   * Get minimum advance booking days required
   */
  getMinAdvanceDays(bufferTime, serviceDuration = 0) {
    const bufferMinutes = this.parseDuration(bufferTime);
    const serviceDurationMinutes = this.parseDuration(serviceDuration);
    
    // For multi-day services, preparation starts before pickup
    const totalMinutes = serviceDurationMinutes >= 24 * 60 
      ? bufferMinutes + serviceDurationMinutes 
      : bufferMinutes;
    
    return Math.ceil(totalMinutes / (24 * 60));
  }

  /**
   * Validate if a specific booking slot is available
   */
  async validateBookingSlot(business, service, date, time, existingBookings) {
    const availableSlots = await this.getAvailableSlots(
      business,
      service,
      date,
      existingBookings
    );

    return availableSlots.some(slot => slot.time === time);
  }
}

module.exports = new AvailabilityService();