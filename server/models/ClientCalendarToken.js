module.exports = (sequelize, DataTypes) => {
  const ClientCalendarToken = sequelize.define('ClientCalendarToken', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    clientEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    googleCalendarTokens: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Stored as JSON string with access_token and refresh_token'
    },
    isConnected: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastSyncedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    businessId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Businesses',
        key: 'id'
      },
      comment: 'Optional: Track which business the client authorized for'
    }
  }, {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['clientEmail'],
        name: 'client_calendar_tokens_email_unique'
      },
      {
        fields: ['businessId'],
        name: 'client_calendar_tokens_business_id'
      }
    ]
  });

  return ClientCalendarToken;
};