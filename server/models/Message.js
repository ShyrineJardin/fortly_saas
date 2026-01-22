module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
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
    clientEmail: {
      type: DataTypes.STRING,
      allowNull: false
    },
    clientName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    sender: {
      type: DataTypes.ENUM('client', 'business'),
      allowNull: false
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    messageType: {
    type: DataTypes.ENUM('text', 'image', 'video'),
    defaultValue: 'text'
    },
    fileContent: {
      type: DataTypes.TEXT('long'),
      allowNull: true
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: true
    }

  }, {
    timestamps: true
  });

  return Message;
};