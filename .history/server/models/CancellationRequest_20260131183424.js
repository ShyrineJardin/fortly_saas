module.exports = (sequelize, DataTypes) => {
  const CancellationRequest = sequelize.define('CancellationRequest', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    bookingId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Bookings',
        key: 'id'
      }
    },
    requestedBy: {
      type: DataTypes.ENUM('client', 'business'),
      allowNull: false,
      comment: 'Who initiated the cancellation request'
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Reason for cancellation'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
      comment: 'Status of the cancellation request'
    },
    respondedBy: {
      type: DataTypes.ENUM('client', 'business'),
      allowNull: true,
      comment: 'Who responded to the request'
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the request was responded to'
    },
    responseNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Optional note when approving/rejecting'
    }
  }, {
    timestamps: true,
    indexes: [
      {
        fields: ['bookingId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['requestedBy']
      }
    ]
  });

  CancellationRequest.associate = (models) => {
    CancellationRequest.belongsTo(models.Booking, {
      foreignKey: 'bookingId',
      as: 'Booking'
    });
  };

  return CancellationRequest;
};y