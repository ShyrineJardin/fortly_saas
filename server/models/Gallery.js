module.exports = (sequelize, DataTypes) => {
  const Gallery = sequelize.define('Gallery', {
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
    mediaUrl: {  
      type: DataTypes.STRING,
      allowNull: false
    },
    mediaType: {  
      type: DataTypes.ENUM('image', 'video'),
      allowNull: false,
      defaultValue: 'image'
    },
    caption: {
      type: DataTypes.TEXT
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    timestamps: true
  });

  return Gallery;
};