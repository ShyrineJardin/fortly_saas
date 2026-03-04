const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const Business = sequelize.define('Business', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    businessName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    ownerName: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING },
    location: { type: DataTypes.TEXT },
    category: { type: DataTypes.STRING },
    tagline: { type: DataTypes.TEXT },
    description: { type: DataTypes.TEXT },
    timezone: {
      type: DataTypes.STRING,
      defaultValue: 'Asia/Manila'
    },
    logo: { type: DataTypes.STRING },
    coverImage: { type: DataTypes.STRING },
    facebook: { type: DataTypes.STRING },
    twitter: { type: DataTypes.STRING },
    instagram: { type: DataTypes.STRING },
    linkedin: { type: DataTypes.STRING },

    // Booking Policy
    bookingPolicyTitle: {
      type: DataTypes.STRING,
      defaultValue: 'Booking Policy'
    },
    bookingPolicyDescription: { type: DataTypes.TEXT },
    bookingPolicyList: {
      type: DataTypes.JSON,
      defaultValue: []
    },

    // Scheduling settings
    bufferTime: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      comment: 'Cooldown/prep time added after each appointment slot. e.g. "15 minutes"'
    },
    maxConcurrentBookings: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '1 = sequential (one at a time). 2+ = concurrent (e.g. salon with multiple staff)'
    },
    subscriptionPlan: {
      type: DataTypes.ENUM('free', 'monthly', 'yearly'),
      defaultValue: 'free'
    },
    subscriptionStatus: {
      type: DataTypes.ENUM('active', 'paused', 'cancelled', 'trial'),
      defaultValue: 'trial'
    },
    trialEndsAt: {
      type: DataTypes.DATE,
      defaultValue: () => {
        const date = new Date();
        date.setDate(date.getDate() + 30); // 30 day trial
        return date;
      }
    },
    subscriptionStartDate: {
      type: DataTypes.DATE
    },
    subscriptionEndDate: {
      type: DataTypes.DATE
    },
    isPaused: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    pausedAt: {
      type: DataTypes.DATE
    },
    pauseReason: {
      type: DataTypes.STRING
    },

    // Password Reset
    resetPasswordToken: { type: DataTypes.STRING, allowNull: true },
    resetPasswordExpires: { type: DataTypes.DATE, allowNull: true },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    onboardingCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    timestamps: true,
    hooks: {
      beforeCreate: async (business) => {
        if (business.password) {
          const salt = await bcrypt.genSalt(10);
          business.password = await bcrypt.hash(business.password, salt);
        }
        if (business.businessName && !business.slug) {
          business.slug = business.businessName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        }
      }
    }
  });

  Business.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  return Business;
};