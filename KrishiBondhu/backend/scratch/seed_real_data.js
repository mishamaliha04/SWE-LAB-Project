const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('=== SEEDING REALISTIC DATA FOR ALL DASHBOARDS ===\n');

  // ─── 1. ADD MORE FARMERS (same division as officer: Rangpur) ───
  console.log('1. Adding farmers...');
  const hash = await bcrypt.hash('farmer123', 10);

  const farmers = [
    ['Rahim Uddin',    '01745678901', 'rahim@gmail.com',    'Rangpur', hash, 'farmer', '3.5 acres', 'Clayey Soil',       'Canal',           '2018', '6.8', 55, 30, 15],
    ['Karim Hossain',  '01756789012', 'karim@gmail.com',    'Rangpur', hash, 'farmer', '5.0 acres', 'Loamy Soil',        'Deep Tubewell',   '2015', '6.5', 60, 25, 15],
    ['Fatema Begum',   '01767890123', 'fatema@gmail.com',   'Rangpur', hash, 'farmer', '2.0 acres', 'Sandy Loam',        'Rainwater',       '2020', '5.9', 70, 20, 10],
    ['Jabbar Ali',     '01778901234', 'jabbar@gmail.com',   'Rangpur', hash, 'farmer', '6.5 acres', 'Silty Soil',        'Deep Tubewell',   '2012', '7.0', 40, 45, 15],
    ['Sufia Khatun',   '01789012345', 'sufia@gmail.com',    'Rangpur', hash, 'farmer', '1.5 acres', 'Red Soil',          'Surface Pump',    '2021', '5.5', 50, 30, 20],
    ['Hashem Mia',     '01790123456', 'hashem@gmail.com',   'Rangpur', hash, 'farmer', '4.0 acres', 'Loamy Soil',        'Canal',           '2017', '6.3', 55, 30, 15],
  ];

  const farmerIds = [];
  for (const f of farmers) {
    try {
      const [result] = await conn.execute(
        `INSERT INTO users (fullname, phone, email, division, password_hash, role, total_land_area, soil_type, water_source, farming_since, ph_level, sand_pct, silt_pct, clay_pct)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, f
      );
      farmerIds.push(result.insertId);
      console.log(`  Added farmer: ${f[0]} (id: ${result.insertId})`);
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        const [existing] = await conn.execute('SELECT id FROM users WHERE email = ?', [f[2]]);
        farmerIds.push(existing[0].id);
        console.log(`  Farmer ${f[0]} already exists (id: ${existing[0].id})`);
      } else throw e;
    }
  }

  // Also include Manik Miya
  const [manikRow] = await conn.execute("SELECT id FROM users WHERE email = 'manik23@gmail.com'");
  const manikId = manikRow.length > 0 ? manikRow[0].id : null;
  if (manikId) farmerIds.unshift(manikId);
  console.log(`  Manik Miya id: ${manikId}`);

  // ─── 2. ADD CROPS FOR NEW FARMERS ───
  console.log('\n2. Adding crops for farmers...');
  const cropData = [
    // [farmer_idx, crop_name, variety, season, field_plot, sowing, harvest, area, unit, irrigation, notes, status, stage]
    [0, 'Boro Rice',  'BRRI dhan 52',     'Kharif-2',     'North Field A', '2026-04-15', '2026-08-20', 3.0, 'Acre', 'Irrigated', 'Growing well', 'Growing', 'Vegetative'],
    [0, 'Potato',     'Diamond',          'Rabi',         'South Field B', '2026-01-10', '2026-04-15', 1.5, 'Acre', 'Sprinkler', 'Good yield',   'Growing', 'Harvest'],
    [1, 'Wheat',      'BARI Gom-33',      'Rabi',         'West Block',    '2026-02-01', '2026-05-25', 2.5, 'Acre', 'Irrigated', 'Healthy',      'Growing', 'Tillering'],
    [1, 'Jute',       'O-9897',           'Kharif-1',     'East Block',    '2026-05-01', '2026-09-15', 2.0, 'Acre', 'Rainfed',   'Good fiber',   'Growing', 'Vegetative'],
    [2, 'Rice',       'BRRI dhan 52',     'Monsoon',      'Main Plot',     '2026-06-01', '2026-10-15', 3.0, 'Acre', 'Irrigated', 'Aman season',  'Growing', 'Seedling'],
    [2, 'Mustard',    'BARI-14',          'Rabi',         'Side Plot',     '2026-01-15', '2026-04-10', 1.0, 'Acre', 'Rainfed',   'Oil crop',     'Growing', 'Flowering'],
    [3, 'Maize',      'Hybrid',           'Kharif',       'Plot 1',        '2026-04-20', '2026-07-30', 2.0, 'Acre', 'Irrigated', 'Feed grade',   'Growing', 'Vegetative'],
    [4, 'Tomato',     'BARI-4',           'Rabi',         'Kitchen garden', '2026-02-10', '2026-05-20', 1.0, 'Acre', 'Drip',      'Good fruiting','Growing', 'Fruiting'],
    [4, 'Brinjal',    'Muktakeshi',       'All-season',   'Home garden',   '2026-03-01', '2026-07-01', 0.5, 'Acre', 'Manual',    'Year-round',   'Growing', 'Vegetative'],
    [5, 'Rice',       'BRRI dhan 52',     'Monsoon',      'Low land',      '2026-06-10', '2026-10-30', 3.0, 'Acre', 'Canal',     'Aman paddy',   'Growing', 'Planned'],
    [6, 'Watermelon', 'Dragon',           'Kharif-1',     'Sandy plot',    '2026-04-01', '2026-06-30', 1.5, 'Acre', 'Drip',      'Summer fruit',  'Growing', 'Fruiting'],
  ];

  const cropIds = {};
  for (const c of cropData) {
    const farmerId = farmerIds[c[0]];
    try {
      const [r] = await conn.execute(
        `INSERT INTO farmer_crops (farmer_id, crop_name, variety, season, field_plot, sowing_date, harvest_date, area, area_unit, irrigation_type, notes, status, current_stage)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [farmerId, c[1], c[2], c[3], c[4], c[5], c[6], c[7], c[8], c[9], c[10], c[11], c[12]]
      );
      if (!cropIds[farmerId]) cropIds[farmerId] = [];
      cropIds[farmerId].push(r.insertId);
      console.log(`  Crop: ${c[1]} for farmer ${farmerId} (crop id: ${r.insertId})`);
    } catch (e) {
      console.log(`  Skipped crop ${c[1]}: ${e.message}`);
    }
  }

  // ─── 3. ADD DISEASE LOGS (some with request_suggestion=1 so officer sees them) ───
  console.log('\n3. Adding disease reports...');
  const diseases = [
    [farmerIds[0], 'Severe',   'ধানের পাতায় ব্লাস্ট রোগ দেখা যাচ্ছে। পাতা শুকিয়ে বাদামী হয়ে যাচ্ছে।',    'Applied Tricyclazole fungicide',          1, 'None'],
    [farmerIds[1], 'Moderate', 'গমের পাতায় হলুদাভ দাগ পড়েছে, সম্ভবত রাস্ট রোগ।',                             'Applied Propiconazole spray',             1, 'None'],
    [farmerIds[2], 'Severe',   'ধানের গোড়ায় পচন ধরেছে, কুশি কমে যাচ্ছে।',                                  'Reduced irrigation, applied Carbendazim', 1, 'None'],
    [farmerIds[3], 'Low',      'ভুট্টার পাতায় হালকা পোকার আক্রমণ, কিছু গর্ত দেখা যাচ্ছে।',                    'Applied neem oil spray',                  1, 'None'],
    [farmerIds[4], 'Moderate', 'টমেটোর ফল ফাটছে এবং কিছু পাতায় কালো দাগ।',                                    'Adjusted watering schedule',               1, 'None'],
    [farmerIds[5], 'Severe',   'ধানে বাদামী গাছফড়িংয়ের ব্যাপক আক্রমণ। ক্ষেতের ৩০% ক্ষতিগ্রস্ত।',             'Emergency insecticide application needed', 1, 'None'],
    [farmerIds[6], 'Moderate', 'তরমুজের পাতায় সাদা পাউডার মতো আবরণ, পাউডারি মিলডিউ সন্দেহ।',                  'Sulfur-based fungicide applied',          0, 'None'],
  ];

  for (const d of diseases) {
    const fCrops = cropIds[d[0]];
    const cid = fCrops && fCrops.length > 0 ? fCrops[0] : null;
    if (!cid) { console.log(`  Skipping disease for farmer ${d[0]} - no crops`); continue; }
    try {
      await conn.execute(
        `INSERT INTO diseases (farmer_id, crop_id, severity, description, action_taken, request_suggestion, resolved_by) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [d[0], cid, d[1], d[2], d[3], d[4], d[5]]
      );
      console.log(`  Disease for farmer ${d[0]}: ${d[1]}`);
    } catch (e) { console.log(`  Skipped disease: ${e.message}`); }
  }

  // ─── 4. ADD IRRIGATION SCHEDULES ───
  console.log('\n4. Adding irrigation schedules...');
  const irrigations = [
    [farmerIds[0], '2026-05-18 07:00:00', 400, 'pending'],
    [farmerIds[0], '2026-05-15 08:00:00', 350, 'Completed'],
    [farmerIds[1], '2026-05-19 06:30:00', 500, 'pending'],
    [farmerIds[2], '2026-05-20 07:30:00', 300, 'pending'],
    [farmerIds[3], '2026-05-17 08:00:00', 250, 'Completed'],
    [farmerIds[4], '2026-05-21 06:00:00', 150, 'pending'],
  ];
  for (const i of irrigations) {
    const fCrops = cropIds[i[0]];
    const cid = fCrops && fCrops.length > 0 ? fCrops[0] : null;
    if (!cid) continue;
    try {
      await conn.execute(
        'INSERT INTO irrigation (farmer_id, crop_id, schedule, quantity_liters, status) VALUES (?, ?, ?, ?, ?)',
        [i[0], cid, i[1], i[2], i[3]]
      );
      console.log(`  Irrigation for farmer ${i[0]}: ${i[2]}L on ${i[1]}`);
    } catch (e) { console.log(`  Skipped: ${e.message}`); }
  }

  // ─── 5. ADD FERTILIZER LOGS ───
  console.log('\n5. Adding fertilizer logs...');
  const fertLogs = [
    [farmerIds[0], 'Urea',   50, '2026-05-10', 'completed'],
    [farmerIds[0], 'TSP',    25, '2026-05-22', 'pending'],
    [farmerIds[1], 'DAP',    40, '2026-05-12', 'completed'],
    [farmerIds[2], 'Urea',   30, '2026-05-08', 'completed'],
    [farmerIds[3], 'MOP',    20, '2026-05-14', 'completed'],
    [farmerIds[4], 'Urea',   15, '2026-05-18', 'pending'],
  ];
  for (const f of fertLogs) {
    const fCrops = cropIds[f[0]];
    const cid = fCrops && fCrops.length > 0 ? fCrops[0] : null;
    if (!cid) continue;
    try {
      await conn.execute(
        'INSERT INTO fertilizer_logs (farmer_id, crop_id, type, quantity_kg, applied_at, status) VALUES (?, ?, ?, ?, ?, ?)',
        [f[0], cid, f[1], f[2], f[3], f[4]]
      );
      console.log(`  Fertilizer: ${f[1]} ${f[2]}kg for farmer ${f[0]}`);
    } catch (e) { console.log(`  Skipped: ${e.message}`); }
  }

  // ─── 6. ADD SOIL TESTS (some pending, some completed) ───
  console.log('\n6. Adding soil tests...');
  const [officerRow] = await conn.execute("SELECT id FROM agri_officers WHERE email = 'jannatul23@gmail.com'");
  const officerId = officerRow.length > 0 ? officerRow[0].id : null;

  const soilTests = [
    [farmerIds[0], 'pending',    'North Block, Rangpur',  'Medium High', 'Sandy Loam',    'Deep Tube Well', 'Boro Rice', 'Cereal',    'Urea and TSP used',           'Yellowish leaves in rice crop',        officerId],
    [farmerIds[1], 'completed',  'South Block, Rangpur',  'Low Land',    'Clayey',         'Canal Water',    'Wheat',     'Cereal',    'None this season',             'Checking fertility for rabi crop',     officerId],
    [farmerIds[2], 'pending',    'East Block, Rangpur',   'High Land',   'Sandy',          'Rainwater',      'Mustard',   'Oil seed',  'Organic compost applied',      'Poor germination rate',                officerId],
    [farmerIds[3], 'requested',  'West Block, Rangpur',   'Medium',      'Silty Loam',     'Deep Tube Well', 'Maize',     'Cereal',    'DAP used last season',         'Soil appears compacted',               officerId],
    [farmerIds[5], 'pending',    'Central Rangpur',       'Low Land',    'Clayey',         'Canal',          'Rice',      'Cereal',    'Regular urea application',     'Waterlogged soil, checking fertility', officerId],
  ];

  for (const s of soilTests) {
    try {
      await conn.execute(
        `INSERT INTO soil_tests (farmer_id, status, location_details, land_type, soil_texture, irrigation_source, current_crop, crop_type, fertilizer_history, problem_description, officer_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, s
      );
      console.log(`  Soil test for farmer ${s[0]}: ${s[1]}`);
    } catch (e) { console.log(`  Skipped: ${e.message}`); }
  }

  // ─── 7. ADD FIELD VISITS ───
  console.log('\n7. Adding field visits...');
  if (officerId) {
    const visits = [
      [farmerIds[0], officerId, 'Manik Miya',     'রংপুর মাঠ এ',          'Soil Sample Collection',        '2026-05-22', 'Upcoming'],
      [farmerIds[1], officerId, 'Rahim Uddin',    'North Block, Rangpur',   'Disease Diagnosis',             '2026-05-12', 'Completed'],
      [farmerIds[2], officerId, 'Karim Hossain',  'South Block, Rangpur',   'Fertilizer Advisory',           '2026-05-25', 'Upcoming'],
      [farmerIds[3], officerId, 'Fatema Begum',   'East Block, Rangpur',    'Crop Inspection',               '2026-05-20', 'Upcoming'],
      [farmerIds[4], officerId, 'Jabbar Ali',     'West Block, Rangpur',    'Pest Management Review',        '2026-05-10', 'Completed'],
      [farmerIds[5], officerId, 'Sufia Khatun',   'Central Rangpur',        'Soil Health Checkup',           '2026-05-28', 'Upcoming'],
    ];
    // Clear old visits first
    await conn.execute('DELETE FROM field_visits WHERE officer_id = ?', [officerId]);
    for (const v of visits) {
      await conn.execute(
        'INSERT INTO field_visits (farmer_id, officer_id, farmer_name, location, purpose, visit_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)', v
      );
      console.log(`  Visit: ${v[2]} on ${v[5]} (${v[6]})`);
    }
  }

  // ─── 8. ADD CONSULTATIONS ───
  console.log('\n8. Adding consultations...');
  const consultations = [
    [farmerIds[0], 'ধানের পোকা দমন',             'ধানের পাতায় এক ধরণের ছোট বাদামী পোকা দেখা যাচ্ছে যা পাতা খেয়ে ফেলছে।',           'Crops & Farming', 'Resolved', 'কীটনাশক ল্যাম্বডা-সাইহ্যালোথ্রিন ব্যবহার করুন।',          '2026-05-17 15:00:00'],
    [farmerIds[1], 'সার প্রয়োগের নিয়ম',         'আমন ধানে দ্বিতীয় কিস্তির ইউরিয়া সার কখন এবং কি পরিমাণে দিতে হবে?',              'Fertilizer',      'Pending',  null, null],
    [farmerIds[2], 'সেচ ব্যবস্থাপনা',            'বোরো ধানে কখন এবং কতটুকু পানি দিতে হবে? খরচ কমানোর উপায় কী?',                     'Irrigation',      'Pending',  null, null],
    [farmerIds[3], 'ভুট্টার জাত নির্বাচন',        'রংপুরে কোন হাইব্রিড ভুট্টার জাত সবচেয়ে ভালো ফলন দেয়?',                            'Seed',            'Resolved', 'NK-40 বা প্যাসিফিক-984 জাত ব্যবহার করুন।',                 '2026-05-16 10:00:00'],
    [farmerIds[4], 'টমেটোর ফল ফাটা সমস্যা',      'টমেটো পাকার সময় ফল ফেটে যাচ্ছে, কিভাবে সমাধান করব?',                                'Crops & Farming', 'Pending',  null, null],
    [farmerIds[5], 'জমির পানি নিষ্কাশন',          'নিচু জমিতে পানি জমে থাকছে, ফসল নষ্ট হচ্ছে। কি করব?',                                'Others',          'Pending',  null, null],
  ];

  for (const c of consultations) {
    try {
      await conn.execute(
        'INSERT INTO consultations (farmer_id, subject, message, category, status, officer_reply, replied_at) VALUES (?, ?, ?, ?, ?, ?, ?)', c
      );
      console.log(`  Consultation: ${c[1]} (${c[4]})`);
    } catch (e) { console.log(`  Skipped: ${e.message}`); }
  }

  // ─── 9. ADD EMERGENCY ALERTS ───
  console.log('\n9. Adding emergency alerts...');
  if (officerId) {
    await conn.execute(
      `INSERT INTO emergency_alerts (officer_id, division, type, title, message, severity, is_active, expires_at)
       VALUES (?, 'Rangpur', 'Weather Alert', 'ভারী ঝড়-বৃষ্টির সতর্কতা', 'আগামী ৪৮ ঘণ্টায় রংপুর অঞ্চলে তীব্র ঝড় ও শিলাবৃষ্টির সম্ভাবনা রয়েছে। ফসল নিরাপদে সংরক্ষণ করুন।', 'High', 1, '2026-05-25 00:00:00')`,
      [officerId]
    );
    await conn.execute(
      `INSERT INTO emergency_alerts (officer_id, division, type, title, message, severity, is_active, expires_at)
       VALUES (?, 'Rangpur', 'Pest Alert', 'বাদামী গাছফড়িং সতর্কতা', 'রংপুর জেলায় বাদামী গাছফড়িংয়ের আক্রমণ বাড়ছে। জরুরি কীটনাশক প্রয়োগ করুন।', 'Critical', 1, '2026-05-30 00:00:00')`,
      [officerId]
    );
    console.log('  Added 2 emergency alerts');
  }

  // ─── 10. ADD RESEARCHER ───
  console.log('\n10. Adding researcher...');
  try {
    const resHash = await bcrypt.hash('password123', 10);
    await conn.execute(
      `INSERT INTO researchers (fullname, phone, email, division, password_hash, institution, specialization, research_area, designation, education, experience_years, custom_id, projects_led, h_index, datasets_contributed, peer_reviews)
       VALUES ('Mehar Nigar', '01733333333', 'mehar23@gmail.com', 'Rangpur', ?, 'Bangladesh Rice Research Institute (BRRI)', 'Soil Science & Agronomy', 'Soil Nutrient Optimization & Crop Health Management', 'Principal Researcher', 'PhD in Agronomy', 10, 'RES-7492', 5, 12, 8, 24)`,
      [resHash]
    );
    console.log('  Researcher Mehar Nigar added');
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') console.log('  Researcher already exists');
    else console.log(`  Skipped researcher: ${e.message}`);
  }

  // ─── 11. ADD NOTIFICATIONS ───
  console.log('\n11. Adding notifications...');
  const notifs = [
    [farmerIds[0], 'farmer',     'মাটির পরীক্ষার আপডেট',      'আপনার মাটির নমুনা সংগ্রহের জন্য কর্মকর্তা আসবেন ২২ মে।',                   'soil',         0],
    [farmerIds[0], 'farmer',     'সেচ অনুস্মারক',             'আজ সকাল ৭টায় ধানের ক্ষেতে সেচ দেওয়ার সময়।',                                'irrigation',   0],
    [farmerIds[1], 'farmer',     'রোগ পরামর্শ',               'আপনার গমের রাস্ট রোগের পরামর্শ দেওয়া হয়েছে।',                               'disease',      0],
    [officerId,    'officer',    'নতুন মাটির পরীক্ষা অনুরোধ',  'মানিক মিয়া একটি নতুন মাটির পরীক্ষার অনুরোধ পাঠিয়েছেন।',                    'soil',         0],
    [officerId,    'officer',    'রোগ পরামর্শ অনুরোধ',         'রহিম উদ্দিন তার গমের রোগের বিষয়ে পরামর্শ চেয়েছেন।',                         'disease',      0],
    [officerId,    'officer',    'জরুরি সতর্কতা পাঠানো হয়েছে', 'রংপুর বিভাগে ঝড়ের সতর্কতা সফলভাবে প্রচার করা হয়েছে।',                      'weather',      1],
  ];

  for (const n of notifs) {
    try {
      await conn.execute(
        'INSERT INTO notifications (user_id, user_role, title, message, type, is_read) VALUES (?, ?, ?, ?, ?, ?)', n
      );
    } catch (e) { /* skip */ }
  }
  console.log(`  Added ${notifs.length} notifications`);

  // ─── VERIFY ───
  console.log('\n=== VERIFICATION ===');
  const counts = ['users', 'farmer_crops', 'diseases', 'irrigation', 'fertilizer_logs', 'soil_tests', 'field_visits', 'consultations', 'emergency_alerts', 'notifications'];
  for (const t of counts) {
    const [r] = await conn.execute(`SELECT COUNT(*) as c FROM ${t}`);
    console.log(`  ${t}: ${r[0].c} rows`);
  }

  console.log('\n✅ ALL DATA SEEDED SUCCESSFULLY!');
  console.log('Refresh both Farmer and Officer dashboards to see real data.');

  await conn.end();
})();
