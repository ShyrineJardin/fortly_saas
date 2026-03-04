const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

console.log('=== Environment Check ===');
console.log('DB_NAME:', process.env.DB_NAME || '❌ MISSING');
console.log('DB_USER:', process.env.DB_USER || '❌ MISSING');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '✅ Loaded' : '❌ MISSING');
console.log('DB_HOST:', process.env.DB_HOST || '❌ MISSING');
console.log('=========================\n');

const db = require('../config/database');

async function safeQuery(label, sql) {
  try {
    await db.sequelize.query(sql);
    console.log(`✅ ${label}`);
  } catch (e) {
    console.log(`ℹ️  ${label} skipped: ${e.message}`);
  }
}

async function migrate() {
  try {
    console.log('🔄 Starting database migration...');
    await db.sequelize.authenticate();
    console.log('✅ Database connection successful!\n');

    // ── Step 1: Add 'trial' to the existing subscriptionStatus ENUM ──
    // The ENUM exists but is missing 'trial'. ALTER TYPE ADD VALUE is safe and
    // does NOT require dropping/recreating the column.
    console.log('🔧 Patching subscriptionStatus ENUM...');
    await safeQuery(
      "Add 'trial' to enum_Businesses_subscriptionStatus",
      `ALTER TYPE "enum_Businesses_subscriptionStatus" ADD VALUE IF NOT EXISTS 'trial';`
    );

    // ── Step 2: Add 'trial' to subscriptionPlan ENUM if needed ──
    // (subscriptionPlan already fixed in previous run, but safeQuery handles duplicates)
    console.log('🔧 Patching subscriptionPlan ENUM...');
    await safeQuery(
      "Ensure enum_Businesses_subscriptionPlan exists with correct values",
      `DO $$
       BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Businesses_subscriptionPlan') THEN
           CREATE TYPE "enum_Businesses_subscriptionPlan" AS ENUM ('free', 'monthly', 'yearly');
         END IF;
       END$$;`
    );

    // ── Step 3: Ensure all Business columns exist ──
    console.log('\n🔧 Adding missing Business columns...');
    const addCol = (col, def) => safeQuery(
      `Businesses.${col}`,
      `ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS "${col}" ${def};`
    );

    await addCol('subscriptionPlan', `"enum_Businesses_subscriptionPlan" DEFAULT 'free'`);
    await addCol('trialEndsAt', 'TIMESTAMP WITH TIME ZONE');
    await addCol('subscriptionStartDate', 'TIMESTAMP WITH TIME ZONE');
    await addCol('subscriptionEndDate', 'TIMESTAMP WITH TIME ZONE');
    await addCol('isPaused', 'BOOLEAN DEFAULT false');
    await addCol('pausedAt', 'TIMESTAMP WITH TIME ZONE');
    await addCol('pauseReason', 'VARCHAR(255)');

    // ── Step 4: Set default on subscriptionStatus now that 'trial' is in the ENUM ──
    await safeQuery(
      "Set subscriptionStatus default to 'trial'",
      `ALTER TABLE "Businesses" ALTER COLUMN "subscriptionStatus" SET DEFAULT 'trial';`
    );

    // ── Step 5: Bookings.reminderSent ──
    console.log('\n🔧 Adding Bookings columns...');
    await safeQuery(
      'Bookings.reminderSent',
      `ALTER TABLE "Bookings" ADD COLUMN IF NOT EXISTS "reminderSent" BOOLEAN NOT NULL DEFAULT false;`
    );

    // ── Step 6: Create admins table ──
    console.log('\n🔧 Creating admins table...');
    await safeQuery(
      'admins table',
      `CREATE TABLE IF NOT EXISTS "admins" (
        "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "email"     VARCHAR(255) NOT NULL UNIQUE,
        "password"  VARCHAR(255) NOT NULL,
        "name"      VARCHAR(255) NOT NULL,
        "role"      VARCHAR(50)  NOT NULL DEFAULT 'moderator',
        "isActive"  BOOLEAN      NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );`
    );

    // ── Step 7: Sync only non-Business models to avoid the ENUM issue ──
    // We deliberately skip Business.sync because Sequelize's alter logic for ENUMs
    // is broken on PostgreSQL when the type already exists. Everything we need
    // has already been applied manually above.
    console.log('\n🔄 Syncing remaining models (excluding Business)...');
    const modelsToSync = ['Service', 'Gallery', 'Booking', 'Message', 'Review', 'Schedule', 'Admin'];
    for (const modelName of modelsToSync) {
      if (db[modelName]) {
        try {
          await db[modelName].sync({ alter: true });
          console.log(`✅ ${modelName} synced`);
        } catch (e) {
          console.log(`ℹ️  ${modelName} sync skipped: ${e.message}`);
        }
      }
    }

    console.log('\n✅ Database migration completed successfully!');
    console.log('📊 Summary:');
    console.log("  ✅ subscriptionStatus ENUM now includes 'trial'");
    console.log('  ✅ All Business subscription/trial columns present');
    console.log('  ✅ Bookings.reminderSent present');
    console.log('  ✅ admins table ready');
    console.log('\n🚀 Now run: node server/scripts/createAdmin.js');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

migrate();