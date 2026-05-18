/* KrishiBondhu MySQL schema */
CREATE DATABASE IF NOT EXISTS krishibondhu;
USE krishibondhu;

-- Users table (authentication & profile)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fullname VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  division VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'farmer',
  profile_image LONGTEXT,
  custom_id VARCHAR(50),
  total_land_area VARCHAR(50),
  soil_type VARCHAR(50),
  water_source VARCHAR(50),
  farming_since VARCHAR(10),
  ph_level VARCHAR(10),
  sand_pct INT,
  silt_pct INT,
  clay_pct INT,
  designation VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crops owned by a user
CREATE TABLE IF NOT EXISTS crops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  area_acres DECIMAL(6,2) NOT NULL,
  stage VARCHAR(30) NOT NULL,
  health_score INT NOT NULL,
  status VARCHAR(30) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Irrigation schedules
CREATE TABLE IF NOT EXISTS irrigation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id INT NOT NULL,
  crop_id INT NOT NULL,
  schedule DATETIME NOT NULL,
  quantity_liters INT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (crop_id) REFERENCES farmer_crops(id) ON DELETE CASCADE
);

-- Disease / health logs
CREATE TABLE IF NOT EXISTS diseases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id INT NOT NULL,
  crop_id INT NOT NULL,
  severity VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  image_url LONGTEXT,
  action_taken TEXT,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (crop_id) REFERENCES farmer_crops(id) ON DELETE CASCADE
);

-- Fertilizer application logs
CREATE TABLE IF NOT EXISTS fertilizer_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id INT NOT NULL,
  crop_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  quantity_kg DECIMAL(6,2) NOT NULL,
  applied_at DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (crop_id) REFERENCES farmer_crops(id) ON DELETE CASCADE
);

-- Optional weather logs (static demo now)
CREATE TABLE IF NOT EXISTS weather_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  division VARCHAR(50) NOT NULL,
  day DATE NOT NULL,
  icon VARCHAR(10),
  description VARCHAR(255),
  temperature VARCHAR(10),
  humidity VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master table for all available crops and their details
CREATE TABLE IF NOT EXISTS crop_master (
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
  suitability_tag VARCHAR(50) -- e.g., 'সেরা উপযুক্ত', 'খুব উপযুক্ত', 'উপযুক্ত'
);

-- Mapping of form inputs to recommended crops
CREATE TABLE IF NOT EXISTS recommendation_mappings (
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
);

-- Emergency & Weather Alerts
CREATE TABLE IF NOT EXISTS emergency_alerts (
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
);
 
 -- Agri Officers table
 CREATE TABLE IF NOT EXISTS agri_officers (
   id INT AUTO_INCREMENT PRIMARY KEY,
   fullname VARCHAR(100) NOT NULL,
   phone VARCHAR(20) NOT NULL,
   email VARCHAR(100) NOT NULL UNIQUE,
   division VARCHAR(50) NOT NULL,
   password_hash VARCHAR(255) NOT NULL,
   profile_image LONGTEXT,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 );
 
 -- Researchers table
 CREATE TABLE IF NOT EXISTS researchers (
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
 );


