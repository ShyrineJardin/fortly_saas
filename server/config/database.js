const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.Business = require('../models/Business')(sequelize, Sequelize);
db.Service = require('../models/Service')(sequelize, Sequelize);
db.Gallery = require('../models/Gallery')(sequelize, Sequelize);
db.Booking = require('../models/Booking')(sequelize, Sequelize);
db.Message = require('../models/Message')(sequelize, Sequelize);
db.Review = require('../models/Review')(sequelize, Sequelize);
db.Schedule = require('../models/Schedule')(sequelize, Sequelize);
db.Admin = require('../models/Admin')(sequelize, Sequelize); 

// Define associations
// Business has many Services
db.Business.hasMany(db.Service, {
  foreignKey: 'businessId',
  as: 'services'
});
db.Service.belongsTo(db.Business, {
  foreignKey: 'businessId'
});

// Business has many Gallery items
db.Business.hasMany(db.Gallery, {
  foreignKey: 'businessId',
  as: 'gallery'
});
db.Gallery.belongsTo(db.Business, {
  foreignKey: 'businessId'
});

// Business has many Bookings
db.Business.hasMany(db.Booking, {
  foreignKey: 'businessId',
  as: 'bookings'
});
db.Booking.belongsTo(db.Business, {
  foreignKey: 'businessId'
});

// Business has many Messages
db.Business.hasMany(db.Message, {
  foreignKey: 'businessId',
  as: 'messages'
});
db.Message.belongsTo(db.Business, {
  foreignKey: 'businessId'
});

// Business has many Reviews
db.Business.hasMany(db.Review, {
  foreignKey: 'businessId',
  as: 'reviews'
});
db.Review.belongsTo(db.Business, {
  foreignKey: 'businessId'
});

// Business has many Schedules
db.Business.hasMany(db.Schedule, {
  foreignKey: 'businessId',
  as: 'schedules'
});
db.Schedule.belongsTo(db.Business, {
  foreignKey: 'businessId'
});

// Service has many Bookings
db.Service.hasMany(db.Booking, {
  foreignKey: 'serviceId',
  as: 'bookings'
});
db.Booking.belongsTo(db.Service, {
  foreignKey: 'serviceId'
});

module.exports = db;