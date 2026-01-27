module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define('Booking', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    businessId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Businesses',
        key: 'id'
      }
    },
    serviceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Services',
        key: 'id'
      }
    },
    clientName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    clientEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    clientPhone: {
      type: DataTypes.STRING
    },
    clientAddress: {
      type: DataTypes.TEXT
    },
    bookingDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    bookingTime: {
      type: DataTypes.TIME,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled'),
      defaultValue: 'pending'
    },
    notes: {
      type: DataTypes.TEXT
    },
    // Google Calendar Integration
    googleCalendarEventId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Chat Integration
    hasChatHistory: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastChatMessageAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Payment tracking (for future use)
    isPaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    paymentAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    // Cancellation info
    cancelledBy: {
      type: DataTypes.ENUM('client', 'business'),
      allowNull: true
    },
    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    timestamps: true,
    hooks: {
      beforeUpdate: async (booking, options) => {
        // Track cancellation details
        if (booking.changed('status') && booking.status === 'cancelled') {
          booking.cancelledAt = new Date();
          // You can add logic to determine who cancelled based on context
        }
      }
    }
  });

  return Booking;
};