const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const migrations = [
  'create_consultations_table.js',
  'create_emergency_alerts_table.js',
  'create_field_visits_table.js',
  'create_notifications_table.js',
  'create_researchers_table.js',
  'create_soil_tests_table.js',
  'migrate_consultations_category.js',
  'migrate_crop_stage.js',
  'migrate_farmer_crops.js',
  'migrate_fertilizer_soft_delete.js',
  'migrate_fertilizer_status.js',
  'migrate_notifications_action.js',
  'migrate_notifications_role.js',
  'migrate_soil_tests.js',
  'update_diseases_table.js',
  'update_schema.js',
  'update_soil_tests_schema.js',
  'update_user_profile_data.js',
  'migrate_researcher_features.js'
];

console.log('--- STARTING ALL DB MIGRATIONS ---');

for (const migration of migrations) {
  const filePath = path.join(__dirname, '..', migration);
  if (fs.existsSync(filePath)) {
    console.log(`\nExecuting: node ${migration}...`);
    try {
      const output = execSync(`node "${filePath}"`, { encoding: 'utf-8' });
      console.log(output.trim());
    } catch (err) {
      console.error(`Error running ${migration}:`, err.message);
    }
  } else {
    console.log(`Skipping (not found): ${migration}`);
  }
}

console.log('\n--- ALL DB MIGRATIONS EXECUTED ---');
