const mysql = require('mysql2/promise');
require('dotenv').config();

async function seed() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'krishibondhu'
    });

    console.log('Connected to database.');

    try {
        // Clear existing data (optional, but good for idempotency during dev)
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
        await connection.execute('TRUNCATE TABLE recommendation_mappings');
        await connection.execute('TRUNCATE TABLE crop_master');
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

        console.log('Seeding crop_master...');

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
            ['বেগুন', 'Brinjal', 'মুক্তকেশী', 'https://dukaan.b-cdn.net/1000x1000/webp/media/a3afa2cd-3276-454a-8492-a42f6335f69d.png', 'সারা বছর', '১২০ - ১৫০ দিন', '১৫০ - ২০০ মণ/একর', 'মাঝারি', 'মাঝারি', '৳ ২০,০০০ - ২৫,০০০/একর', 'উপযুক্ত']
        ];

        const cropIds = {};
        for (const c of crops) {
            const [res] = await connection.execute(
                'INSERT INTO crop_master (name_bn, name_en, variety, image_url, season, duration, yield, water_requirement, market_demand, estimated_profit, suitability_tag) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                c
            );
            cropIds[c[0]] = res.insertId;
        }

        console.log('Seeding recommendation_mappings...');

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

        console.log('Seeding completed successfully.');
    } catch (err) {
        console.error('Error seeding data:', err);
    } finally {
        await connection.end();
    }
}

seed();
