const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

// Base tables schema defined in the original init_db.js
const baseTables = [
  {
    name: 'users',
    sql: `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fullname VARCHAR(100) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      division VARCHAR(50) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'farmer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  },
  {
    name: 'crops',
    sql: `CREATE TABLE IF NOT EXISTS crops (
      id INT AUTO_INCREMENT PRIMARY KEY,
      farmer_id INT NOT NULL,
      name VARCHAR(50) NOT NULL,
      area_acres DECIMAL(6,2) NOT NULL,
      stage VARCHAR(30) NOT NULL,
      health_score INT NOT NULL,
      status VARCHAR(30) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  },
  {
    name: 'irrigation',
    sql: `CREATE TABLE IF NOT EXISTS irrigation (
      id INT AUTO_INCREMENT PRIMARY KEY,
      farmer_id INT NOT NULL,
      crop_id INT NOT NULL,
      schedule DATETIME NOT NULL,
      quantity_liters INT NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (crop_id) REFERENCES farmer_crops(id) ON DELETE CASCADE
    )`
  },
  {
    name: 'diseases',
    sql: `CREATE TABLE IF NOT EXISTS diseases (
      id INT AUTO_INCREMENT PRIMARY KEY,
      farmer_id INT NOT NULL,
      crop_id INT NOT NULL,
      severity VARCHAR(20) NOT NULL,
      description TEXT NOT NULL,
      action_taken TEXT,
      request_suggestion TINYINT(1) DEFAULT 0,
      resolved_by VARCHAR(50) DEFAULT 'None',
      officer_reply TEXT,
      replied_at TIMESTAMP NULL,
      logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (crop_id) REFERENCES farmer_crops(id) ON DELETE CASCADE
    )`
  },
  {
    name: 'fertilizer_logs',
    sql: `CREATE TABLE IF NOT EXISTS fertilizer_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      farmer_id INT NOT NULL,
      crop_id INT NOT NULL,
      type VARCHAR(50) NOT NULL,
      quantity_kg DECIMAL(6,2) NOT NULL,
      applied_at DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (crop_id) REFERENCES farmer_crops(id) ON DELETE CASCADE
    )`
  },
  {
    name: 'weather_logs',
    sql: `CREATE TABLE IF NOT EXISTS weather_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      division VARCHAR(50) NOT NULL,
      day DATE NOT NULL,
      icon VARCHAR(10),
      description VARCHAR(255),
      temperature VARCHAR(10),
      humidity VARCHAR(10),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  },
  {
    name: 'crop_master',
    sql: `CREATE TABLE IF NOT EXISTS crop_master (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name_bn VARCHAR(100) NOT NULL,
      name_en VARCHAR(100) NOT NULL,
      variety VARCHAR(100),
      image_url VARCHAR(255),
      season VARCHAR(100),
      duration VARCHAR(50),
      yield VARCHAR(50),
      water_requirement VARCHAR(50),
      market_demand VARCHAR(50),
      estimated_profit VARCHAR(100),
      suitability_tag VARCHAR(50)
    )`
  },
  {
    name: 'recommendation_mappings',
    sql: `CREATE TABLE IF NOT EXISTS recommendation_mappings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      soil_type VARCHAR(50),
      season VARCHAR(50),
      goal VARCHAR(50),
      crop1_id INT,
      crop2_id INT,
      crop3_id INT,
      FOREIGN KEY (crop1_id) REFERENCES crop_master(id),
      FOREIGN KEY (crop2_id) REFERENCES crop_master(id),
      FOREIGN KEY (crop3_id) REFERENCES crop_master(id)
    )`
  },
  {
    name: 'agri_officers',
    sql: `CREATE TABLE IF NOT EXISTS agri_officers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fullname VARCHAR(100) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      division VARCHAR(50) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      profile_image LONGTEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  },
  {
    name: 'researchers',
    sql: `CREATE TABLE IF NOT EXISTS researchers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fullname VARCHAR(100) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      division VARCHAR(50) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      institution VARCHAR(255),
      specialization VARCHAR(100),
      research_area VARCHAR(255),
      profile_image LONGTEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  },
  {
    name: 'emergency_alerts',
    sql: `CREATE TABLE IF NOT EXISTS emergency_alerts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      officer_id INT NOT NULL,
      division VARCHAR(50) NOT NULL,
      type VARCHAR(30) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      severity VARCHAR(20) DEFAULT 'Warning',
      is_active TINYINT(1) DEFAULT 1,
      expires_at DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  },
  {
    name: 'notifications',
    sql: `CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      user_role VARCHAR(20) DEFAULT 'farmer',
      title VARCHAR(100) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(30) NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      action_url VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  },
  {
    name: 'soil_tests',
    sql: `CREATE TABLE IF NOT EXISTS soil_tests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      farmer_id INT NOT NULL,
      test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(20) DEFAULT 'pending',
      location_details TEXT,
      land_type VARCHAR(50),
      soil_texture VARCHAR(50),
      irrigation_source VARCHAR(50),
      current_crop VARCHAR(100),
      crop_type VARCHAR(100),
      fertilizer_history TEXT,
      problem_description TEXT,
      image_url LONGTEXT,
      request_message TEXT,
      deadline VARCHAR(50),
      soil_type VARCHAR(50),
      ph_level DECIMAL(4,2),
      sand_pct INT,
      silt_pct INT,
      clay_pct INT,
      organic_matter DECIMAL(4,2),
      nitrogen_level VARCHAR(20),
      phosphorus_level VARCHAR(20),
      potassium_level VARCHAR(20),
      recommendations TEXT,
      officer_id INT,
      FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (officer_id) REFERENCES agri_officers(id) ON DELETE SET NULL
    )`
  },
  {
    name: 'field_visits',
    sql: `CREATE TABLE IF NOT EXISTS field_visits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      farmer_id INT,
      officer_id INT NOT NULL,
      farmer_name VARCHAR(100) NOT NULL,
      location VARCHAR(255) NOT NULL,
      purpose VARCHAR(255) NOT NULL,
      visit_date DATE NOT NULL,
      status VARCHAR(20) DEFAULT 'Upcoming',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (officer_id) REFERENCES agri_officers(id) ON DELETE CASCADE
    )`
  },
  {
    name: 'consultations',
    sql: `CREATE TABLE IF NOT EXISTS consultations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      farmer_id INT NOT NULL,
      subject VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      category VARCHAR(50) DEFAULT 'Others',
      status VARCHAR(20) DEFAULT 'Pending',
      officer_reply TEXT,
      replied_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  }
];

const migrations = [
  'create_consultations_table.js',
  'create_emergency_alerts_table.js',
  'create_field_visits_table.js',
  'create_notifications_table.js',
  'create_researchers_table.js',
  'create_soil_tests_table.js',
  'migrate_consultations_category.js',
  'migrate_farmer_crops.js',
  'migrate_crop_stage.js',
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

async function main() {
  console.log('=== KRISHIBONDHU DATABASE RESTORATION SCRIPT ===');
  
  console.log('Connecting to MySQL host...');
  const conn = await mysql.createConnection(dbConfig);
  
  try {
    // 1. Create database
    console.log('Creating database "krishibondhu" if not exists...');
    await conn.execute('CREATE DATABASE IF NOT EXISTS krishibondhu');
    await conn.end();

    // Re-connect to krishibondhu database
    const conn2 = await mysql.createConnection({
      ...dbConfig,
      database: 'krishibondhu'
    });

    console.log('Successfully connected to "krishibondhu" database.');

    // 2. Drop existing tables safely to start completely fresh
    console.log('Dropping any existing tables to avoid conflicts...');
    await conn2.execute('SET FOREIGN_KEY_CHECKS = 0');
    const tablesToDrop = [
      'users', 'crops', 'farmer_crops', 'irrigation', 'diseases', 'fertilizer_logs', 
      'weather_logs', 'crop_master', 'recommendation_mappings', 'emergency_alerts', 
      'agri_officers', 'researchers', 'notifications', 'soil_tests', 'field_visits', 
      'consultations', 'research_projects', 'datasets', 'publications'
    ];
    for (const tbl of tablesToDrop) {
      await conn2.execute(`DROP TABLE IF EXISTS ${tbl}`);
    }
    await conn2.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('All existing tables dropped.');

    // 3. Create all base tables
    for (const t of baseTables) {
      console.log(`Creating base table: ${t.name}...`);
      await conn2.execute(t.sql);
    }
    console.log('Base tables created successfully!');

    // Close the manual connection to run external migration scripts
    await conn2.end();

    // 4. Execute all migration scripts in correct sequence
    console.log('\nExecuting all schema migrations in order...');
    for (const migration of migrations) {
      const filePath = path.join(__dirname, migration);
      if (fs.existsSync(filePath)) {
        console.log(`Executing: node ${migration}...`);
        try {
          execSync(`node "${filePath}"`, { stdio: 'inherit' });
        } catch (err) {
          console.error(`Warning: migration ${migration} encountered an error:`, err.message);
        }
      } else {
        console.log(`Skipping (not found): ${migration}`);
      }
    }
    console.log('All migrations completed!\n');

    // 5. Reconnect to seed crop_master and mappings
    const connection = await mysql.createConnection({
      ...dbConfig,
      database: 'krishibondhu'
    });

    console.log('Seeding crop_master and recommendation_mappings...');
    const crops = [
      ['ধান', 'Rice', 'BRRI dhan 52', 'https://m.media-amazon.com/images/I/41Xeo32PAxL._AC_UF350,350_QL80_.jpg', 'আমন', '১২০ - ১৩০ দিন', '১৮ - ২০ মণ/একর', 'মাঝারি', 'উচ্চ', '৳ ১৮,০০০ - ২২,০০০/একর', 'সেরা উপযুক্ত'],
      ['মুগ ডাল', 'Mung Bean', 'বারি মুগ-৬', 'https://healthynz.in/wp-content/uploads/2023/05/chana-dal.jpg', 'খরিফ পরবর্তী', '৬০ - ৬৫ দিন', '৬ - ৭ মণ/একর', 'কম', 'উচ্চ', '৳ ১৬,০০০ - ১৮,০০০/একর', 'খুব উপযুক্ত'],
      ['ভুট্টা', 'Maize', 'হাইব্রিড', 'https://kj1bcdn.b-cdn.net/media/52074/maize-farming.jpg', 'খরিফ', '৯০ - ১০০ দিন', '২৫ - ৩০ মণ/একর', 'মাঝারি', 'উচ্চ', '৳ ২০,০০০ - ২৫,০০০/একর', 'উপযুক্ত'],
      ['গম', 'Wheat', 'বারি গম-৩৩', 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=400', 'রবি', '১০০ - ১১০ দিন', '১৫ - ১৮ মণ/একর', 'মাঝারি', 'উচ্চ', '৳ ১৫,০০০ - ২০,০০০/একর', 'সেরা উপযুক্ত'],
      ['আলু', 'Potato', 'ডায়মন্ড', 'https://pagefournews.com/wp-content/uploads/2023/03/potato-1.jpg', 'রবি', '৮৫ - ৯০ দিন', '৮০ - ১০০ মণ/একর', 'মাঝারি', 'খুব উচ্চ', '৳ ৩৫,০০০ - ৪০,০০০/একর', 'সেরা উপযুক্ত'],
      ['সরিষা', 'Mustard', 'বারি-১৪', 'https://cdn.banglatribune.net/contents/cache/images/400x0x0/uploads/media/2025/01/10/472164146_504151482153993_1513336067765825647_n-c0b3b2d6a3c27fe4c1fa115a46c7f705.jpg', 'রবি', '৭৫ - ৮০ দিন', '৫ - ৬ মণ/একর', 'কম', 'উচ্চ', '৳ ১০,০০০ - ১২,০০০/একর', 'খুব উপযুক্ত'],
      ['তরমুজ', 'Watermelon', 'ড্রাগন', 'https://www.songbadprokash.com/media/imgAll/2022July/tormuj-20230409094826.gif', 'খরিফ-১', '৮০ - ৯০ দিন', '৪০০ - ৫০০ মণ/একর', 'মাঝারি', 'খুব উচ্চ', '৳ ৫০,০০০ - ৬০,০০০/একর', 'সেরা উপযুক্ত'],
      ['পাট', 'Jute', 'O-9897', 'https://www.sahapedia.org/sites/default/files/Jute-Species_Corchorus%20Capsularis-(Sada%20pat_White%20Jute).jpg', 'খরিফ-১', '১১০ - ১২০ দিন', '১০ - ১২ মণ/একর', 'বেশি', 'উচ্চ', '৳ ১৮,০০০ - ২২,০০০/একর', 'খুব উপযুক্ত'],
      ['টমেটো', 'Tomato', 'বারি-৪', 'https://cdn.jagonews24.com/media/imgAllNew/BG/2019November/tomato-1-20191208153224.jpg', 'রবি', '৯০ - ১০০ দিন', '১০০ - ১৫০ মণ/একর', 'মাঝারি', 'উচ্চ', '৳ ২৫,০০০ - ৩০,০০০/একর', 'খুব উপযুক্ত'],
      ['বেগুন', 'Brinjal', 'মুক্তকেশী', 'https://dukaan.b-cdn.net/1000x1000/webp/media/a3afa2cd-3276-454a-8492-a42f6335f69d.png', 'সারা বছর', '১২ো - ১৫০ দিন', '১৫০ - ২০০ মণ/একর', 'মাঝারি', 'মাঝারি', '৳ ২০,০০০ - ২৫,০০০/একর', 'উপযুক্ত']
    ];

    const cropIds = {};
    for (const c of crops) {
      const [res] = await connection.execute(
        'INSERT INTO crop_master (name_bn, name_en, variety, image_url, season, duration, yield, water_requirement, market_demand, estimated_profit, suitability_tag) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        c
      );
      cropIds[c[0]] = res.insertId;
    }

    const mappings = [
      ['Loamy Soil', 'Kharif-2 (Monsoon/Aman)', 'High Yield', 'ধান', 'মুগ ডাল', 'ভুট্টা'],
      ['Clayey Soil', 'Kharif-2 (Monsoon/Aman)', 'High Yield', 'ধান', 'পাট', 'বেগুন'],
      ['Sandy Soil', 'Kharif-1 (Summer)', 'High Market Value', 'তরমুজ', 'সরিষা', 'মুগ ডাল'],
      ['Loamy Soil', 'Rabi (Winter/Boro)', 'High Yield', 'আলু', 'গম', 'টমেটো'],
      ['Silty Soil', 'Rabi (Winter/Boro)', 'Low Cost', 'সরিষা', 'গম', 'মুগ ডাল'],
      ['Red Soil', 'Kharif-1 (Summer)', 'High Yield', 'ভুট্টা', 'মুগ ডাল', 'বেগুন'],
      ['Saline Soil', 'Rabi (Winter/Boro)', 'High Yield', 'ধান', 'সরিষা', 'টমেটো']
    ];

    for (const m of mappings) {
      await connection.execute(
        'INSERT INTO recommendation_mappings (soil_type, season, goal, crop1_id, crop2_id, crop3_id) VALUES (?, ?, ?, ?, ?, ?)',
        [m[0], m[1], m[2], cropIds[m[3]], cropIds[m[4]], cropIds[m[5]]]
      );
    }
    console.log('Crop recommendations seeded successfully.');

    // 6. Seeding core profiles (Farmer, Agri-Officer, Researcher)
    console.log('\nSeeding standard testing accounts...');
    const hashedPass = await bcrypt.hash('password123', 10);
    
    // Seed Manik Miya (Farmer)
    const [resFarmer] = await connection.execute(`
      INSERT INTO users (id, fullname, phone, email, division, password_hash, role, total_land_area, soil_type, water_source, farming_since, ph_level, sand_pct, silt_pct, clay_pct)
      VALUES (1, 'Manik Miya', '01711111111', 'manik23@gmail.com', 'Rangpur', ?, 'farmer', '4.5 acres', 'Loamy Soil (Sandy Loam)', 'Deep Tubewell & Canal (Borewell + Canal)', '2019', '6.2', 60, 25, 15)
    `, [hashedPass]);
    console.log(`Farmer (Manik Miya) seeded. ID: ${resFarmer.insertId}`);

    // Seed Jannatul Aurpy (Agri-Officer)
    const [resOfficer] = await connection.execute(`
      INSERT INTO agri_officers (id, fullname, phone, email, division, password_hash, designation)
      VALUES (1, 'Jannatul Aurpy', '01722222222', 'jannatul23@gmail.com', 'Rangpur', ?, 'Senior Agricultural Officer')
    `, [hashedPass]);
    console.log(`Agri-Officer (Jannatul Aurpy) seeded. ID: ${resOfficer.insertId}`);

    // Seed Mehar Nigar (Researcher)
    const [resResearcher] = await connection.execute(`
      INSERT INTO researchers (id, fullname, phone, email, division, password_hash, institution, specialization, research_area, designation, education, experience_years, custom_id, projects_led, h_index, datasets_contributed, peer_reviews)
      VALUES (1, 'Mehar Nigar', '01733333333', 'mehar23@gmail.com', 'Rangpur', ?, 'Bangladesh Rice Research Institute (BRRI)', 'Soil Science & Agronomy', 'Soil Nutrient Optimization & Crop Health Management', 'Principal Researcher', 'PhD in Agronomy', 10, 'RES-7492', 5, 12, 8, 24)
    `, [hashedPass]);
    console.log(`Researcher (Mehar Nigar) seeded. ID: ${resResearcher.insertId}`);

    // 7. Seeding rich mock data for dashboards
    console.log('\nSeeding dashboard records...');

    // Seed crops and farmer_crops (in sync)
    await connection.execute(`
      INSERT INTO farmer_crops (id, farmer_id, crop_name, variety, season, field_plot, sowing_date, harvest_date, area, area_unit, irrigation_type, notes, status, current_stage)
      VALUES 
      (1, 1, 'ধান', 'BRRI dhan 52', 'Monsoon', 'রংপুর মাঠ এ', '2026-05-01', '2026-08-30', 2.50, 'Acre', 'Irrigated', 'সবুজ ও সতেজ বাড়ন্ত পর্যায়', 'Growing', 'Vegetative'),
      (2, 1, 'আলু', 'Diamond', 'Winter', 'রংপুর মাঠ বি', '2026-02-10', '2026-05-15', 2.00, 'Acre', 'Sprinkler', 'ফলন বেশ ভালো হয়েছে এবং তোলার উপযুক্ত', 'Growing', 'Harvest')
    `);
    
    await connection.execute(`
      INSERT INTO crops (id, farmer_id, name, area_acres, stage, health_score, status)
      VALUES 
      (1, 1, 'ধান', 2.50, 'Vegetative', 95, 'Growing'),
      (2, 1, 'আলু', 2.00, 'Harvest', 88, 'Growing')
    `);
    console.log('Farmer crops seeded.');

    // Seed irrigation schedules
    await connection.execute(`
      INSERT INTO irrigation (farmer_id, crop_id, schedule, quantity_liters, status)
      VALUES 
      (1, 1, '2026-05-20 08:00:00', 500, 'pending'),
      (1, 1, '2026-05-15 08:00:00', 450, 'completed')
    `);
    console.log('Irrigation schedules seeded.');

    // Seed disease logs
    await connection.execute(`
      INSERT INTO diseases (farmer_id, crop_id, severity, description, action_taken, image_url, request_suggestion, resolved_by)
      VALUES 
      (1, 1, 'Medium', 'ধানের পাতায় হালকা বাদামী দাগ দেখা যাচ্ছে। পাতার প্রান্তগুলো শুকিয়ে যাচ্ছে।', 'Applied organic compost and copper fungicide', 'https://agriknowledge.org/images/rice-brown-spot.jpg', 1, 'None')
    `);
    console.log('Disease logs seeded.');

    // Seed fertilizer logs
    await connection.execute(`
      INSERT INTO fertilizer_logs (farmer_id, crop_id, type, quantity_kg, applied_at, status, is_deleted)
      VALUES 
      (1, 1, 'Urea', 50.00, '2026-05-10', 'completed', 0),
      (1, 1, 'Potash', 25.00, '2026-05-22', 'pending', 0)
    `);
    console.log('Fertilizer logs seeded.');

    // Seed soil tests
    await connection.execute(`
      INSERT INTO soil_tests (id, farmer_id, test_date, status, location_details, land_type, soil_texture, irrigation_source, current_crop, crop_type, fertilizer_history, problem_description, soil_type, ph_level, sand_pct, silt_pct, clay_pct, organic_matter, nitrogen_level, phosphorus_level, potassium_level, recommendations, officer_id, researcher_id, officer_pdf_url, lab_report_url)
      VALUES 
      (1, 1, '2026-05-10 14:00:00', 'completed', 'North Block, Rangpur', 'Medium High', 'Sandy Loam', 'Deep Tube Well', 'None', 'Cereal', 'Urea and TSP used in previous crop', 'Yellowish leaves in previous rice crop.', 'Loamy Soil', 6.5, 60, 25, 15, 1.80, 'Medium', 'Low', 'Medium', 'Apply organic compost 5 tons/acre. Increase nitrogen input slightly. Use balanced NPK.', 1, 1, 'http://localhost:5001/reports/soil_report_1.pdf', 'http://localhost:5001/reports/lab_report_1.pdf'),
      (2, 1, '2026-05-17 11:30:00', 'pending', 'South Block, Rangpur', 'Low Land', 'Clayey', 'Canal Water', 'ধান', 'Cereal', 'None this season', 'Water logged soil, checking fertility.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL)
    `);
    console.log('Soil test requests seeded.');

    // Seed consultations
    await connection.execute(`
      INSERT INTO consultations (id, farmer_id, subject, message, category, status, officer_reply, replied_at)
      VALUES 
      (1, 1, 'ধানের পোকা দমন', 'ধানের পাতায় এক ধরণের ছোট বাদামী পোকা দেখা যাচ্ছে যা পাতা খেয়ে ফেলছে, কি করব?', 'Crops & Farming', 'Resolved', 'রংপুর কৃষি অফিসে যোগাযোগ করে কীটনাশক ল্যাম্বডা-সাইহ্যালোথ্রিন ব্যবহার করুন অথবা কৃষি ব্লক সুপারভাইজারের সাথে যোগাযোগ করুন।', '2026-05-17 15:00:00'),
      (2, 1, 'সার প্রয়োগের নিয়ম', 'আমন ধানে দ্বিতীয় কিস্তির ইউরিয়া সার কখন এবং কি পরিমাণে দিতে হবে?', 'Fertilizers', 'Pending', NULL, NULL)
    `);
    console.log('Consultations seeded.');

    // Seed field visits
    await connection.execute(`
      INSERT INTO field_visits (id, farmer_id, officer_id, farmer_name, location, purpose, visit_date, status)
      VALUES 
      (1, 1, 1, 'Manik Miya', 'রংপুর মাঠ এ', 'Soil Sample Collection & Inspection', '2026-05-22', 'Upcoming'),
      (2, 1, 1, 'Manik Miya', 'North Block, Rangpur', 'Disease Diagnosis', '2026-05-12', 'Completed')
    `);
    console.log('Field visits seeded.');

    // Seed emergency alerts
    await connection.execute(`
      INSERT INTO emergency_alerts (id, officer_id, division, type, title, message, severity, is_active, expires_at)
      VALUES 
      (1, 1, 'Rangpur', 'Weather Alert', 'ভারী ঝড়-বৃষ্টির সতর্কতা', 'আগামী ৪৮ ঘণ্টায় রংপুর অঞ্চলে তীব্র ঝড় ও শিলাবৃষ্টির সম্ভাবনা রয়েছে। ফসল নিরাপদে সংরক্ষণ করুন।', 'High', 1, '2026-05-25 00:00:00')
    `);
    console.log('Emergency alerts seeded.');

    // Seed researcher projects, datasets, and publications
    await connection.execute(`
      INSERT INTO research_projects (id, researcher_id, title, budget, duration, team_size, type, description, status)
      VALUES 
      (1, 1, 'Rangpur Soil Nutrient Analysis & Optimization', '৳ ৫,০০,০০০', '৬ মাস', 4, 'Soil Science', 'Study on optimizing soil nutrients in Rangpur division to increase crop yield.', 'Active'),
      (2, 1, 'Drought Resistant Wheat Variety Trial in Northern Region', '৳ ৮,০০,০০০', '১ বছর', 6, 'Crop Genetics', 'Research and testing of breeding drought-resistant wheat varieties.', 'Pending')
    `);
    
    await connection.execute(`
      INSERT INTO datasets (id, name, type, region, size, division, file_url)
      VALUES 
      (1, 'Rangpur Soil Health Dataset 2025', 'Excel / CSV', 'Rangpur Division', '1.2 MB', 'Rangpur', 'http://localhost:5001/datasets/rangpur_soil_2025.csv')
    `);

    await connection.execute(`
      INSERT INTO publications (id, title, authors, journal, year, impact_factor, file_url)
      VALUES 
      (1, 'Nutrient Optimization Strategies for Loamy Soil in Northern Bangladesh', 'Dr. Mehar Nigar, Dr. Kamal Uddin', 'Bangladesh Journal of Agriculture', 2025, '2.8', 'http://localhost:5001/publications/loamy_soil_nutrient.pdf')
    `);
    console.log('Researcher projects, datasets, and publications seeded.');

    // Seed notifications
    await connection.execute(`
      INSERT INTO notifications (user_id, user_role, title, message, type, is_read)
      VALUES 
      (1, 'farmer', 'নতুন মাটির রিপোর্ট', 'আপনার মাটির পরীক্ষার রিপোর্ট সম্পন্ন হয়েছে। অনুগ্রহ করে ড্যাশবোর্ডে গিয়ে দেখুন।', 'soil', 0),
      (1, 'farmer', 'কৃষি ব্লক পরামর্শ', 'কর্মকর্তা আপনার ধানের পোকা দমনের প্রশ্নটির উত্তর দিয়েছেন।', 'consultation', 1),
      (1, 'officer', 'নতুন মাটির পরীক্ষা অনুরোধ', 'মানিক মিয়া একটি নতুন মাটির পরীক্ষার অনুরোধ পাঠিয়েছেন।', 'soil', 0),
      (1, 'researcher', 'ল্যাব রিপোর্ট অনুরোধ', 'মাটির নমুনা পরীক্ষার জন্য কর্মকর্তা ড্যাশবোর্ডে ফরওয়ার্ড করেছেন।', 'soil', 0)
    `);
    console.log('Notifications seeded.');

    console.log('\n======================================================');
    console.log('DATABASE SUCCESSFULLY RESTORED AND FULLY POPULATED!');
    console.log('Standard accounts are ready to log in immediately:');
    console.log('1. Farmer: manik23@gmail.com / password123');
    console.log('2. Agri-Officer: jannatul23@gmail.com / password123');
    console.log('3. Researcher: mehar23@gmail.com / password123');
    console.log('======================================================');
    
    await connection.end();
  } catch (err) {
    console.error('An error occurred during database restoration:', err);
  }
}

main();
