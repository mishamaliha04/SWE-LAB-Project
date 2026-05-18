const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('=== SEEDING RESEARCHER SPECIFIC DATA (Mehar Nigar - ID: 3) ===\n');

  // 1. Link and insert Research Projects for Mehar Nigar (ID: 3)
  console.log('1. Setting up research projects...');
  
  // Clear any existing projects for researcher 3 first
  await conn.execute('DELETE FROM research_projects WHERE researcher_id = 3');
  
  const projects = [
    [
      3, 
      'Genetic Variation in Boro Rice (BRRI-52 Genotype Optimization)', 
      '12,50,000', 
      '18 months', 
      6, 
      'Genomics & Breeding', 
      'Deep genomic sequence analysis of BRRI dhan 52 to optimize drought-resistant traits and increase yield by 15% in low-rainfall zones of northern Bangladesh.',
      'Approved'
    ],
    [
      3, 
      'Zinc and Iron Soil Enrichment Strategies for Rice & Wheat in Rangpur', 
      '6,80,000', 
      '12 months', 
      4, 
      'Soil Science', 
      'Field trials mapping micronutrient deficiencies (specifically Zn and Fe) across Rangpur and testing slow-release fertilizer formulations.',
      'Approved'
    ],
    [
      3, 
      'AI-Powered Pest Forecasting & Early Warning System for Maize Farmers', 
      '8,50,000', 
      '12 months', 
      5, 
      'Agri-Tech & IoT', 
      'Development of localized predictive models using computer vision on community smartphone uploads to forecast Fall Armyworm outbreaks.',
      'Pending'
    ],
    [
      3, 
      'Regenerative Agroforestry Models for Barind Tract Slope Stabilization', 
      '15,00,000', 
      '24 months', 
      8, 
      'Conservation Agronomy', 
      'Designing layered crop-tree patterns to restore degraded topsoils and improve moisture conservation in high Barind regions.',
      'Pending'
    ]
  ];

  for (const p of projects) {
    await conn.execute(
      'INSERT INTO research_projects (researcher_id, title, budget, duration, team_size, type, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      p
    );
    console.log(`  Added project: ${p[1]}`);
  }

  // Update older projects to point to researcher 3 as well so they don't look orphaned
  await conn.execute('UPDATE research_projects SET researcher_id = 3 WHERE researcher_id = 1');

  // 2. Insert Datasets
  console.log('\n2. Populating Data Library...');
  await conn.execute('DELETE FROM datasets'); // Fresh datasets
  
  const datasets = [
    [
      'Aman Strain Drought-Resistance Markers',
      'JSON',
      'Rangpur Division',
      '1.5 MB',
      'Rangpur',
      'http://localhost:5001/datasets/aman_drought_markers_2025.json'
    ],
    [
      'Rangpur Division Soil pH & Nutrient Map 2025',
      'CSV',
      'Rangpur Division',
      '2.4 MB',
      'Rangpur',
      'http://localhost:5001/datasets/rangpur_soil_health_2025.csv'
    ],
    [
      'Northern Bangladesh Agro-Ecological Zone GIS Raster',
      'Spatial',
      'Northern Region',
      '8.2 MB',
      'Rangpur',
      'http://localhost:5001/datasets/northern_aez_gis.shp'
    ],
    [
      'Wheat Rust Spore Concentration Time-Series 2024',
      'CSV',
      'All Bangladesh',
      '3.1 MB',
      'All',
      'http://localhost:5001/datasets/wheat_rust_spores_2024.csv'
    ]
  ];

  for (const d of datasets) {
    await conn.execute(
      'INSERT INTO datasets (name, type, region, size, division, file_url) VALUES (?, ?, ?, ?, ?, ?)',
      d
    );
    console.log(`  Added dataset: ${d[0]}`);
  }

  // 3. Insert Publications
  console.log('\n3. Seeding Publications...');
  await conn.execute('DELETE FROM publications'); // Fresh publications

  const publications = [
    [
      'Climate Adaptive Agriculture: Drought Mitigation Strategies in Barind Tract',
      'Dr. Mehar Nigar, Dr. Kamal Uddin, Dr. Faiza Rahman',
      'International Journal of Agronomy',
      2025,
      '3.6',
      'http://localhost:5001/publications/barind_drought_mitigation_2025.pdf'
    ],
    [
      'Evaluation of High-Yielding Boro Rice Varieties under Low Nitrogen Supply',
      'Dr. Mehar Nigar, Prof. M. A. Hashem',
      'Bangladesh Rice Journal',
      2024,
      '2.1',
      'http://localhost:5001/publications/boro_rice_nitrogen_2024.pdf'
    ],
    [
      'GIS-Based Spatial Analysis of Zinc Deficiency in Rangpur Soils',
      'Dr. Mehar Nigar, Prof. Rahman',
      'Soil & Tillage Research',
      2023,
      '4.8',
      'http://localhost:5001/publications/gis_zinc_deficiency_2023.pdf'
    ],
    [
      'Microbiome Diversity in Organic vs Conventional Paddy Soils of Northern Bangladesh',
      'Dr. Faiza Rahman, Dr. Mehar Nigar',
      'Applied Soil Ecology',
      2024,
      '3.2',
      'http://localhost:5001/publications/paddy_microbiome_diversity_2024.pdf'
    ]
  ];

  for (const pb of publications) {
    await conn.execute(
      'INSERT INTO publications (title, authors, journal, year, impact_factor, file_url) VALUES (?, ?, ?, ?, ?, ?)',
      pb
    );
    console.log(`  Added publication: ${pb[0]}`);
  }

  // 4. Link Soil Samples to Researcher (ID: 3)
  console.log('\n4. Assigning/forwarding soil tests to researcher...');
  
  // Forward test 3 (Manik Miya) and test 5 (Karim Hossain) to researcher 3
  await conn.execute(
    'UPDATE soil_tests SET researcher_id = 3, status = "sent_to_lab" WHERE id IN (3, 5)'
  );
  
  console.log('  Updated Soil Test ID 3 (Manik Miya) -> status: "sent_to_lab", researcher_id: 3');
  console.log('  Updated Soil Test ID 5 (Karim Hossain) -> status: "sent_to_lab", researcher_id: 3');

  // Also add some notifications about these tests
  await conn.execute(
    'INSERT INTO notifications (user_id, user_role, type, title, message) VALUES (3, "researcher", "soil_test", "New Soil Test Assigned", "Soil test sample S-1003 has been forwarded to you for lab report submission.")'
  );
  await conn.execute(
    'INSERT INTO notifications (user_id, user_role, type, title, message) VALUES (3, "researcher", "soil_test", "New Soil Test Assigned", "Soil test sample S-1005 has been forwarded to you for lab report submission.")'
  );

  console.log('  Added 2 lab report notifications for researcher');

  // Update researcher profile metrics to reflect achievements beautifully
  await conn.execute(
    `UPDATE researchers SET 
      designation = 'Principal Researcher',
      education = 'PhD in Soil Agronomy (BRRI)',
      experience_years = 12,
      projects_led = 8,
      h_index = 15,
      datasets_contributed = 6,
      peer_reviews = 28
     WHERE id = 3`
  );
  console.log('  Updated researcher profile stats');

  console.log('\n✅ SEEDING COMPLETE FOR RESEARCHER 3');
  
  await conn.end();
})();
