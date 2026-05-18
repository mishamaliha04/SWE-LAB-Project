const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'krishibondhu'
    });

    try {
        console.log('--- STARTING DATABASE MIGRATION FOR RESEARCHER FEATURES ---');

        // 1. Create research_projects table
        console.log('Creating research_projects table if not exists...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS research_projects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                researcher_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                budget VARCHAR(50),
                duration VARCHAR(50),
                team_size INT DEFAULT 0,
                type VARCHAR(100),
                description TEXT,
                status VARCHAR(20) DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Successfully checked/created: research_projects');

        // 2. Create datasets table
        console.log('Creating datasets table if not exists...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS datasets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL,
                region VARCHAR(100),
                size VARCHAR(50),
                division VARCHAR(50),
                file_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Successfully checked/created: datasets');

        // 3. Create publications table
        console.log('Creating publications table if not exists...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS publications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                authors TEXT NOT NULL,
                journal VARCHAR(255) NOT NULL,
                year INT NOT NULL,
                impact_factor VARCHAR(50),
                file_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Successfully checked/created: publications');

        // Helper to add column gracefully
        const addColumn = async (tableName, columnDef, columnName) => {
            try {
                await connection.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
                console.log(`Successfully added column [${columnName}] to [${tableName}]`);
            } catch (err) {
                if (err.errno === 1060) {
                    console.log(`Column [${columnName}] already exists in [${tableName}].`);
                } else {
                    console.error(`Error adding column [${columnName}] to [${tableName}]:`, err.message);
                }
            }
        };

        // 4. Update soil_tests columns
        console.log('\nUpdating soil_tests columns...');
        await addColumn('soil_tests', 'INT DEFAULT NULL', 'researcher_id');
        await addColumn('soil_tests', 'LONGTEXT DEFAULT NULL', 'officer_pdf_url');
        await addColumn('soil_tests', 'LONGTEXT DEFAULT NULL', 'lab_report_url');

        // 5. Update agri_officers columns
        console.log('\nUpdating agri_officers columns...');
        await addColumn('agri_officers', "VARCHAR(100) DEFAULT 'Agricultural Officer'", 'designation');

        // 6. Update researchers columns
        console.log('\nUpdating researchers columns...');
        await addColumn('researchers', "VARCHAR(100) DEFAULT 'Senior Researcher'", 'designation');
        await addColumn('researchers', 'VARCHAR(255) DEFAULT NULL', 'education');
        await addColumn('researchers', 'INT DEFAULT 0', 'experience_years');
        await addColumn('researchers', 'VARCHAR(50) DEFAULT NULL', 'custom_id');
        await addColumn('researchers', 'INT DEFAULT 0', 'projects_led');
        await addColumn('researchers', 'INT DEFAULT 0', 'h_index');
        await addColumn('researchers', 'INT DEFAULT 0', 'datasets_contributed');
        await addColumn('researchers', 'INT DEFAULT 0', 'peer_reviews');

        console.log('\n--- DATABASE MIGRATION COMPLETED SUCCESSFULLY ---');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await connection.end();
    }
}

runMigration();
