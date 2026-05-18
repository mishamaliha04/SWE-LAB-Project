const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

// Get Farmer Profile
router.get('/:id/profile', async (req, res, next) => {
    const { role } = req.query;
    try {
        let rows = [];
        if (role === 'agri_officer' || role === 'officer') {
            [rows] = await req.db.execute('SELECT *, "agri_officer" as role_type FROM agri_officers WHERE id = ?', [req.params.id]);
        } else if (role === 'researcher') {
            [rows] = await req.db.execute('SELECT *, "researcher" as role_type FROM researchers WHERE id = ?', [req.params.id]);
        } else if (role === 'farmer') {
            [rows] = await req.db.execute('SELECT *, "farmer" as role_type FROM users WHERE id = ?', [req.params.id]);
        } else {
            // Fallback for missing role
            [rows] = await req.db.execute('SELECT *, "farmer" as role_type FROM users WHERE id = ?', [req.params.id]);
            if (!rows.length) {
                [rows] = await req.db.execute('SELECT *, "agri_officer" as role_type FROM agri_officers WHERE id = ?', [req.params.id]);
            }
        }

        if (!rows.length) return res.status(404).json({ message: 'User not found' });
        res.json(rows[0]);
    } catch (err) { next(err); }
});

// Update Farmer Profile
router.put('/:id/profile', async (req, res, next) => {
    const updates = req.body;
    const fields = [];
    const values = [];

    const validFields = [
        'fullname', 'phone', 'email', 'division', 'designation', 'education', 'institution',
        'total_land_area', 'soil_type', 'water_source', 'farming_since',
        'ph_level', 'sand_pct', 'silt_pct', 'clay_pct', 'profile_image', 'custom_id',
        'specialization', 'research_area', 'experience_years', 'projects_led', 'h_index', 'datasets_contributed', 'peer_reviews'
    ];

    for (const field of validFields) {
        if (updates[field] !== undefined) {
            fields.push(`${field} = ?`);
            values.push(updates[field]);
        }
    }

    const { role } = req.query;
    values.push(req.params.id);

    try {
        let query;
        if (role === 'agri_officer' || role === 'officer') {
            query = `UPDATE agri_officers SET ${fields.join(', ')} WHERE id = ?`;
        } else if (role === 'researcher') {
            query = `UPDATE researchers SET ${fields.join(', ')} WHERE id = ?`;
        } else if (role === 'farmer') {
            query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
        } else {
            // Fallback: try users first
            const [resUser] = await req.db.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
            if (resUser.affectedRows === 0) {
                await req.db.execute(`UPDATE agri_officers SET ${fields.join(', ')} WHERE id = ?`, values);
            }
            return res.json({ message: 'Profile updated successfully' });
        }

        await req.db.execute(query, values);
        res.json({ message: 'Profile updated successfully' });
    } catch (err) { next(err); }
});

// Get Crops (from farmer_crops)
router.get('/:id/crops', async (req, res, next) => {
    try {
        const [rows] = await req.db.execute(
            `SELECT *,
                id AS crop_id,
                crop_name AS name,
                area AS area_acres,
                current_stage AS stage,
                COALESCE(status, 'Growing') AS status,
                100 AS health_score
            FROM farmer_crops
            WHERE farmer_id = ?
            ORDER BY created_at DESC`,
            [req.params.id]
        );
        res.json(rows);
    } catch (err) { next(err); }
});

// Add Crop
router.post('/:id/crops', async (req, res, next) => {
    const { name, area_acres, stage, health_score, status } = req.body;
    try {
        const [result] = await req.db.execute(
            'INSERT INTO crops (farmer_id, name, area_acres, stage, health_score, status) VALUES (?, ?, ?, ?, ?, ?)',
            [req.params.id, name, area_acres, stage, health_score, status]
        );
        res.json({ message: 'Crop added successfully', id: result.insertId });
    } catch (err) {
        console.error('Error adding crop:', err);
        next(err);
    }
});

// Get Irrigation Schedules
router.get('/:id/irrigation', async (req, res, next) => {
    try {
        const [rows] = await req.db.execute(`
            SELECT i.*, c.crop_name as crop_name 
            FROM irrigation i 
            JOIN farmer_crops c ON i.crop_id = c.id 
            WHERE i.farmer_id = ?
        `, [req.params.id]);
        res.json(rows);
    } catch (err) { next(err); }
});

// Add Irrigation Schedule
router.post('/:id/irrigation', async (req, res, next) => {
    const { crop_id, schedule, quantity_liters, status } = req.body;
    try {
        const [result] = await req.db.execute(
            'INSERT INTO irrigation (farmer_id, crop_id, schedule, quantity_liters, status) VALUES (?, ?, ?, ?, ?)',
            [req.params.id, crop_id, schedule, quantity_liters, status || 'pending']
        );
        res.json({ message: 'Irrigation schedule added', id: result.insertId });
    } catch (err) {
        console.error('Error adding irrigation:', err);
        next(err);
    }
});

// Get Disease Logs
router.get('/:id/diseases', async (req, res, next) => {
    try {
        const [rows] = await req.db.execute(`
            SELECT d.*, c.crop_name as crop_name 
            FROM diseases d 
            JOIN farmer_crops c ON d.crop_id = c.id 
            WHERE d.farmer_id = ?
        `, [req.params.id]);
        res.json(rows);
    } catch (err) { next(err); }
});

// Add Disease Log
router.post('/:id/diseases', async (req, res, next) => {
    const { crop_id, severity, description, image_url, action_taken } = req.body;
    try {
        const [result] = await req.db.execute(
            'INSERT INTO diseases (farmer_id, crop_id, severity, description, image_url, action_taken) VALUES (?, ?, ?, ?, ?, ?)',
            [req.params.id, crop_id, severity, description, image_url, action_taken]
        );
        res.json({ message: 'Disease log added', id: result.insertId });
    } catch (err) {
        console.error('Error adding disease:', err);
        next(err);
    }
});

// Request Advice from Agricultural Officer
router.post('/:id/diseases/:diseaseId/request-officer', async (req, res, next) => {
    try {
        // Check if already requested to prevent double notifications
        const [existing] = await req.db.execute(
            'SELECT request_suggestion FROM diseases WHERE id = ? AND farmer_id = ?',
            [req.params.diseaseId, req.params.id]
        );

        if (existing.length > 0 && existing[0].request_suggestion === 1) {
            return res.json({ message: 'Advice already requested' });
        }

        await req.db.execute(
            'UPDATE diseases SET request_suggestion = 1 WHERE id = ? AND farmer_id = ?',
            [req.params.diseaseId, req.params.id]
        );

        // Find farmer info for notification
        const [farmers] = await req.db.execute('SELECT fullname, division FROM users WHERE id = ?', [req.params.id]);
        if (farmers.length > 0) {
            const farmer = farmers[0];
            // Find officers in the same division
            const [officers] = await req.db.execute('SELECT id FROM agri_officers WHERE division = ?', [farmer.division]);

            for (const officer of officers) {
                await req.db.execute(
                    'INSERT INTO notifications (user_id, user_role, title, message, type) VALUES (?, ?, ?, ?, ?)',
                    [officer.id, 'officer', 'Disease Advice Request', `${farmer.fullname} requested advice for a disease issue.`, 'disease']
                );
            }
        }

        res.json({ message: 'Advice requested from Agricultural Officer' });
    } catch (err) { next(err); }
});

// Resolve Disease
router.post('/:id/diseases/:diseaseId/resolve', async (req, res, next) => {
    const { method } = req.body; // 'AI' or 'Officer'
    try {
        await req.db.execute(
            'UPDATE diseases SET resolved_by = ? WHERE id = ? AND farmer_id = ?',
            [method, req.params.diseaseId, req.params.id]
        );
        res.json({ message: 'Issue marked as resolved' });
    } catch (err) { next(err); }
});

// Get Fertilizer Logs
router.get('/:id/fertilizer', async (req, res, next) => {
    try {
        const [rows] = await req.db.execute(`
            SELECT f.*, c.crop_name as crop_name, f.status, f.is_deleted 
            FROM fertilizer_logs f 
            JOIN farmer_crops c ON f.crop_id = c.id 
            WHERE f.farmer_id = ?
        `, [req.params.id]);
        res.json(rows);
    } catch (err) { next(err); }
});

// Add Fertilizer Log
router.post('/:id/fertilizer', async (req, res, next) => {
    const { crop_id, type, quantity_kg, applied_at, status } = req.body;
    try {
        const [result] = await req.db.execute(
            'INSERT INTO fertilizer_logs (farmer_id, crop_id, type, quantity_kg, applied_at, status) VALUES (?, ?, ?, ?, ?, ?)',
            [req.params.id, crop_id, type, quantity_kg, applied_at, status || 'completed']
        );
        res.json({ message: 'Fertilizer task added', id: result.insertId });
    } catch (err) { next(err); }
});

// Update Fertilizer Task Status
router.put('/:id/fertilizer/:logId', async (req, res, next) => {
    const { status } = req.body;
    try {
        await req.db.execute(
            'UPDATE fertilizer_logs SET status = ? WHERE id = ? AND farmer_id = ?',
            [status, req.params.logId, req.params.id]
        );
        res.json({ message: 'Fertilizer status updated' });
    } catch (err) { next(err); }
});

// Delete Fertilizer Log
router.delete('/:id/fertilizer/:logId', async (req, res, next) => {
    try {
        // Check current status
        const [rows] = await req.db.execute('SELECT status FROM fertilizer_logs WHERE id = ?', [req.params.logId]);
        if (rows.length === 0) return res.status(404).json({ message: 'Log not found' });

        if (rows[0].status === 'pending') {
            // Hard delete for pending (it was never applied)
            await req.db.execute('DELETE FROM fertilizer_logs WHERE id = ? AND farmer_id = ?', [req.params.logId, req.params.id]);
        } else {
            // Soft delete for completed (hide from list but keep in stats)
            await req.db.execute('UPDATE fertilizer_logs SET is_deleted = 1 WHERE id = ? AND farmer_id = ?', [req.params.logId, req.params.id]);
        }
        res.json({ message: 'Fertilizer record updated' });
    } catch (err) { next(err); }
});

// Get Farmer's Personal Crop List
router.get('/:farmerId/personal-crops', async (req, res, next) => {
    try {
        const [rows] = await req.db.execute(
            'SELECT * FROM farmer_crops WHERE farmer_id = ? ORDER BY created_at DESC',
            [req.params.farmerId]
        );
        res.json(rows);
    } catch (err) { next(err); }
});

// Add New Crop to Farmer's List
router.post('/:farmerId/personal-crops', async (req, res, next) => {
    const {
        crop_name, variety, season, field_plot,
        sowing_date, harvest_date, area, area_unit,
        irrigation_type, notes, current_stage
    } = req.body;

    try {
        await req.db.execute(
            `INSERT INTO farmer_crops 
            (farmer_id, crop_name, variety, season, field_plot, sowing_date, harvest_date, area, area_unit, irrigation_type, notes, current_stage) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.params.farmerId,
                crop_name || null,
                variety || null,
                season || null,
                field_plot || null,
                sowing_date || null,
                harvest_date || null,
                area || null,
                area_unit || 'Acre',
                irrigation_type || null,
                notes || null,
                current_stage || 'Seedling'
            ]
        );
        res.status(201).json({ message: 'Crop added successfully' });
    } catch (err) { next(err); }
});

// Update Crop Stage
router.patch('/personal-crops/:cropId/stage', async (req, res, next) => {
    const { stage } = req.body;
    try {
        await req.db.execute(
            'UPDATE farmer_crops SET current_stage = ? WHERE id = ?',
            [stage, req.params.cropId]
        );
        res.json({ message: 'Crop stage updated' });
    } catch (err) { next(err); }
});

// Get Crop Recommendations
router.post('/recommendations', async (req, res, next) => {
    const { soilType, season, goal } = req.body;
    try {
        // Try to find an exact match in mappings
        const [mappings] = await req.db.execute(`
            SELECT crop1_id, crop2_id, crop3_id 
            FROM recommendation_mappings 
            WHERE soil_type = ? AND season = ? AND goal = ?
        `, [soilType, season, goal]);

        let cropIds = [];
        if (mappings.length > 0) {
            cropIds = [mappings[0].crop1_id, mappings[0].crop2_id, mappings[0].crop3_id];
        } else {
            // Fallback: search by soil type and season only
            const [fallback] = await req.db.execute(`
                SELECT crop1_id, crop2_id, crop3_id 
                FROM recommendation_mappings 
                WHERE soil_type = ? AND season = ?
                LIMIT 1
            `, [soilType, season]);

            if (fallback.length > 0) {
                cropIds = [fallback[0].crop1_id, fallback[0].crop2_id, fallback[0].crop3_id];
            } else {
                // Final fallback: just get any 3 crops for the season
                const [finalFallback] = await req.db.execute(`
                    SELECT id FROM crop_master WHERE season LIKE ? LIMIT 3
                `, [`%${season.split(' ')[0]}%`]);
                cropIds = finalFallback.map(c => c.id);
            }
        }

        if (cropIds.length === 0) {
            // Last resort: any 3 crops
            const [lastResort] = await req.db.execute('SELECT id FROM crop_master LIMIT 3');
            cropIds = lastResort.map(c => c.id);
        }

        // Fetch detailed crop info
        const [crops] = await req.db.query('SELECT * FROM crop_master WHERE id IN (?)', [cropIds]);

        // Sort crops to match the order of cropIds
        const sortedCrops = cropIds.map(id => crops.find(c => c.id === id)).filter(Boolean);

        res.json(sortedCrops);
    } catch (err) { next(err); }
});

// Get All Crops from Master
router.get('/all-crops', async (req, res, next) => {
    try {
        const [rows] = await req.db.execute('SELECT * FROM crop_master');
        res.json(rows);
    } catch (err) { next(err); }
});

// Remove Crop from Farmer's List
router.delete('/:farmerId/personal-crops/:cropId', async (req, res, next) => {
    try {
        await req.db.execute(
            'DELETE FROM farmer_crops WHERE id = ? AND farmer_id = ?',
            [req.params.cropId, req.params.farmerId]
        );
        res.json({ message: 'Crop removed successfully' });
    } catch (err) { next(err); }
});

// Remove Irrigation Schedule
router.delete('/:farmerId/irrigation/:taskId', async (req, res, next) => {
    try {
        await req.db.execute(
            'DELETE FROM irrigation WHERE id = ? AND farmer_id = ?',
            [req.params.taskId, req.params.farmerId]
        );
        res.json({ message: 'Irrigation schedule removed successfully' });
    } catch (err) { next(err); }
});

// Update Irrigation Task Status
router.put('/:id/irrigation/:taskId', async (req, res, next) => {
    const { status } = req.body;
    try {
        await req.db.execute(
            'UPDATE irrigation SET status = ? WHERE id = ? AND farmer_id = ?',
            [status, req.params.taskId, req.params.id]
        );
        res.json({ message: 'Irrigation status updated' });
    } catch (err) { next(err); }
});

// Update Disease Log
router.put('/:farmerId/diseases/:issueId', async (req, res, next) => {
    const { crop_id, severity, description, image_url, action_taken } = req.body;
    try {
        await req.db.execute(
            'UPDATE diseases SET crop_id = ?, severity = ?, description = ?, image_url = ?, action_taken = ? WHERE id = ? AND farmer_id = ?',
            [crop_id, severity, description, image_url, action_taken, req.params.issueId, req.params.farmerId]
        );
        res.json({ message: 'Disease log updated successfully' });
    } catch (err) {
        console.error('Error updating disease:', err);
        next(err);
    }
});

// Remove Disease Log
router.delete('/:farmerId/diseases/:issueId', async (req, res, next) => {
    try {
        await req.db.execute(
            'DELETE FROM diseases WHERE id = ? AND farmer_id = ?',
            [req.params.issueId, req.params.farmerId]
        );
        res.json({ message: 'Disease log removed successfully' });
    } catch (err) { next(err); }
});

// Get Notifications
router.get('/:id/notifications', async (req, res, next) => {
    const { role } = req.query;
    const isOfficer = role === 'agri_officer' || role === 'officer';
    try {
        const [rows] = await req.db.execute(
            isOfficer 
                ? 'SELECT * FROM notifications WHERE user_id = ? AND user_role IN ("officer", "agri_officer") ORDER BY created_at DESC LIMIT 20'
                : 'SELECT * FROM notifications WHERE user_id = ? AND user_role = ? ORDER BY created_at DESC LIMIT 20',
            isOfficer ? [req.params.id] : [req.params.id, role || 'farmer']
        );
        res.json(rows);
    } catch (err) { next(err); }
});

// Mark Notification as Read
router.patch('/:id/notifications/:notifId/read', async (req, res, next) => {
    const { role } = req.query;
    const isOfficer = role === 'agri_officer' || role === 'officer';
    try {
        await req.db.execute(
            isOfficer
                ? 'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ? AND user_role IN ("officer", "agri_officer")'
                : 'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ? AND user_role = ?',
            isOfficer ? [req.params.notifId, req.params.id] : [req.params.notifId, req.params.id, role || 'farmer']
        );
        res.json({ message: 'Notification marked as read' });
    } catch (err) { next(err); }
});

// Mark ALL Notifications as Read
router.patch('/:id/notifications/read-all', async (req, res, next) => {
    const { role } = req.query;
    const isOfficer = role === 'agri_officer' || role === 'officer';
    try {
        await req.db.execute(
            isOfficer
                ? 'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND user_role IN ("officer", "agri_officer")'
                : 'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND user_role = ?',
            isOfficer ? [req.params.id] : [req.params.id, role || 'farmer']
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (err) { next(err); }
});

// Delete Notification
router.delete('/:id/notifications/:notifId', async (req, res, next) => {
    try {
        await req.db.execute(
            'DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [req.params.notifId, req.params.id]
        );
        res.json({ message: 'Notification deleted' });
    } catch (err) { next(err); }
});

// Get Regional Stats for Officers
router.get('/stats/division/:division', async (req, res, next) => {
    try {
        const [farmerCount] = await req.db.execute(
            'SELECT COUNT(*) as count FROM users WHERE division = ? AND role = "farmer"',
            [req.params.division]
        );

        const [cropDist] = await req.db.execute(`
            SELECT fc.crop_name as name, COUNT(*) as value 
            FROM farmer_crops fc 
            JOIN users u ON fc.farmer_id = u.id 
            WHERE u.division = ? 
            GROUP BY fc.crop_name
        `, [req.params.division]);

        res.json({
            totalFarmers: farmerCount[0].count,
            cropDistribution: cropDist || []
        });
    } catch (err) { next(err); }
});

// Get all farmers by division
router.get('/division/:division/farmers', async (req, res, next) => {
    try {
        const [rows] = await req.db.execute(
            'SELECT id, custom_id, fullname, phone, email, division, total_land_area, soil_type, water_source, farming_since, profile_image FROM users WHERE division = ? AND role = "farmer"',
            [req.params.division]
        );
        res.json(rows);
    } catch (err) { next(err); }
});

// Get all Agricultural Officers in a division
router.get('/division/:division/officers', async (req, res, next) => {
    try {
        const [rows] = await req.db.execute(
            'SELECT id, fullname, phone, email, division, designation, profile_image FROM agri_officers WHERE division = ?',
            [req.params.division]
        );
        res.json(rows);
    } catch (err) { next(err); }
});

// Officer adding a new farmer
router.post('/add', async (req, res, next) => {
    const { fullname, phone, email, division, custom_id } = req.body;
    const bcrypt = require('bcrypt');
    const defaultPass = 'farmer123';

    try {
        const [exists] = await req.db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (exists.length) return res.status(400).json({ message: 'Email already used' });

        const hash = await bcrypt.hash(defaultPass, 10);
        const [result] = await req.db.execute(
            'INSERT INTO users (fullname, phone, email, division, password_hash, role, custom_id) VALUES (?,?,?,?,?, "farmer", ?)',
            [fullname, phone, email, division, hash, custom_id || null]
        );
        res.json({ message: 'Farmer added successfully', id: result.insertId });
    } catch (err) { next(err); }
});

// Get all disease requests by division
router.get('/diseases/requests/:division', async (req, res, next) => {
    try {
        const [rows] = await req.db.execute(`
            SELECT d.*, u.fullname as farmer_name, u.profile_image as farmer_image, c.crop_name 
            FROM diseases d 
            JOIN users u ON d.farmer_id = u.id 
            JOIN farmer_crops c ON d.crop_id = c.id 
            WHERE u.division = ? AND d.request_suggestion = 1 AND d.resolved_by = 'None'
        `, [req.params.division]);
        res.json(rows);
    } catch (err) { next(err); }
});

// Submit Officer Advice
router.post('/diseases/:diseaseId/advice', async (req, res, next) => {
    const { advice } = req.body;
    try {
        await req.db.execute(
            'UPDATE diseases SET officer_reply = ?, replied_at = CURRENT_TIMESTAMP WHERE id = ?',
            [advice, req.params.diseaseId]
        );

        // Notify the farmer
        const [diseaseRows] = await req.db.execute('SELECT farmer_id, crop_id FROM diseases WHERE id = ?', [req.params.diseaseId]);
        if (diseaseRows.length > 0) {
            const disease = diseaseRows[0];
            const [cropRows] = await req.db.execute('SELECT crop_name FROM farmer_crops WHERE id = ?', [disease.crop_id]);
            const cropName = cropRows.length > 0 ? cropRows[0].crop_name : 'your crop';

            await req.db.execute(
                'INSERT INTO notifications (user_id, user_role, title, message, type) VALUES (?, ?, ?, ?, ?)',
                [disease.farmer_id, 'farmer', 'Expert Advice Received', `An Agricultural Officer has provided a recommendation for your ${cropName} issue.`, 'disease']
            );
        }

        res.json({ message: 'Advice submitted successfully' });
    } catch (err) { next(err); }
});

// Create a new consultation request
router.post('/consultations', async (req, res, next) => {
    const { farmer_id, subject, message, category } = req.body;
    try {
        const [result] = await req.db.execute(
            'INSERT INTO consultations (farmer_id, subject, message, category, status) VALUES (?, ?, ?, ?, "Pending")',
            [farmer_id, subject, message, category || 'Others']
        );

        // Find division of farmer and notify all officers in that division
        const [farmers] = await req.db.execute('SELECT fullname, division FROM users WHERE id = ?', [farmer_id]);
        if (farmers.length > 0) {
            const farmer = farmers[0];
            const [officers] = await req.db.execute('SELECT id FROM agri_officers WHERE division = ?', [farmer.division]);
            for (const officer of officers) {
                await req.db.execute(
                    'INSERT INTO notifications (user_id, user_role, title, message, type) VALUES (?, ?, ?, ?, ?)',
                    [officer.id, 'agri_officer', 'New Support Request', `${farmer.fullname} has a new question: ${subject}`, 'consultation']
                );
            }
        }

        res.json({ message: 'Consultation request submitted', id: result.insertId });
    } catch (err) { next(err); }
});

// Get all consultations for a farmer
router.get('/:id/consultations', async (req, res, next) => {
    try {
        const [rows] = await req.db.execute(
            'SELECT * FROM consultations WHERE farmer_id = ? ORDER BY created_at DESC',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) { next(err); }
});

// Get all general consultations by division
router.get('/consultations/requests/:division', async (req, res, next) => {
    try {
        const [rows] = await req.db.execute(`
            SELECT c.*, u.fullname as farmer_name, u.profile_image as farmer_image 
            FROM consultations c 
            JOIN users u ON c.farmer_id = u.id 
            WHERE u.division = ?
        `, [req.params.division]);
        res.json(rows);
    } catch (err) { next(err); }
});

// Submit Consultation Reply
router.post('/consultations/:id/reply', async (req, res, next) => {
    const { reply } = req.body;
    try {
        await req.db.execute(
            'UPDATE consultations SET officer_reply = ?, status = "Resolved", replied_at = CURRENT_TIMESTAMP WHERE id = ?',
            [reply, req.params.id]
        );

        // Notify the farmer
        const [consRows] = await req.db.execute('SELECT farmer_id, subject FROM consultations WHERE id = ?', [req.params.id]);
        if (consRows.length > 0) {
            const cons = consRows[0];
            await req.db.execute(
                'INSERT INTO notifications (user_id, user_role, title, message, type) VALUES (?, ?, ?, ?, ?)',
                [cons.farmer_id, 'farmer', 'Consultation Reply Received', `An officer has replied to your query: ${cons.subject}`, 'consultation']
            );
        }

        res.json({ message: 'Reply submitted successfully' });
    } catch (err) { next(err); }
});

// Delete Consultation
router.delete('/:farmerId/consultations/:id', async (req, res, next) => {
    try {
        await req.db.execute(
            'DELETE FROM consultations WHERE id = ? AND farmer_id = ?',
            [req.params.id, req.params.farmerId]
        );
        res.json({ message: 'Consultation deleted successfully' });
    } catch (err) { next(err); }
});

// Get Field Visits for an officer
router.get('/field-visits/officer/:id', async (req, res, next) => {
    try {
        const [rows] = await req.db.execute(
            'SELECT * FROM field_visits WHERE officer_id = ? ORDER BY visit_date DESC',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) { next(err); }
});

// Schedule Field Visit
router.post('/field-visits', async (req, res, next) => {
    const { farmer_id, officer_id, farmer_name, location, purpose, visit_date } = req.body;
    try {
        const [result] = await req.db.execute(
            'INSERT INTO field_visits (farmer_id, officer_id, farmer_name, location, purpose, visit_date) VALUES (?, ?, ?, ?, ?, ?)',
            [farmer_id || null, officer_id, farmer_name, location, purpose, visit_date]
        );

        // If a specific farmer is linked, send them a notification
        if (farmer_id) {
            const formattedDate = new Date(visit_date).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            await req.db.execute(
                'INSERT INTO notifications (user_id, user_role, title, message, type) VALUES (?, ?, ?, ?, ?)',
                [
                    farmer_id,
                    'farmer',
                    'Upcoming Field Visit',
                    `An Agricultural Officer is scheduled to visit your field on ${formattedDate} for ${purpose}.`,
                    'visit'
                ]
            );
        }

        res.json({ message: 'Visit scheduled successfully', id: result.insertId });
    } catch (err) { next(err); }
});

// Update Field Visit Status (Confirmation)
router.patch('/field-visits/:id/status', async (req, res, next) => {
    const { status } = req.body;
    try {
        await req.db.execute(
            'UPDATE field_visits SET status = ? WHERE id = ?',
            [status, req.params.id]
        );
        res.json({ message: 'Visit status updated' });
    } catch (err) { next(err); }
});

// Delete Field Visit
router.delete('/field-visits/:id', async (req, res, next) => {
    try {
        // Get visit details before deleting to notify farmer
        const [visits] = await req.db.execute('SELECT farmer_id, visit_date, purpose FROM field_visits WHERE id = ?', [req.params.id]);

        if (visits.length > 0) {
            const visit = visits[0];
            const dateStr = new Date(visit.visit_date).toLocaleDateString();

            // Create notification for farmer
            await req.db.execute(
                'INSERT INTO notifications (user_id, user_role, type, title, message) VALUES (?, "farmer", "visit", ?, ?)',
                [
                    visit.farmer_id,
                    'Field Visit Cancelled',
                    `Your scheduled visit on ${dateStr} for ${visit.purpose} has been cancelled by the officer.`
                ]
            );
        }

        await req.db.execute('DELETE FROM field_visits WHERE id = ?', [req.params.id]);
        res.json({ message: 'Field visit deleted and farmer notified' });
    } catch (err) { next(err); }
});

// Delete a farmer (Officer action)
router.delete('/:id', async (req, res, next) => {
    try {
        await req.db.execute('DELETE FROM users WHERE id = ? AND role = "farmer"', [req.params.id]);
        res.json({ message: 'Farmer deleted successfully' });
    } catch (err) { next(err); }
});

// Get Soil Test Requests by Division
router.get('/soil-tests/division/:division', async (req, res, next) => {
    try {
        const [rows] = await req.db.execute(`
            SELECT s.*, u.fullname as farmer_name, u.phone as farmer_phone, u.profile_image as farmer_image, u.custom_id
            FROM soil_tests s
            JOIN users u ON s.farmer_id = u.id
            WHERE u.division = ?
            ORDER BY s.test_date DESC
        `, [req.params.division]);
        res.json(rows);
    } catch (err) { next(err); }
});

// Submit Soil Test Report
router.post('/soil-tests/:testId/report', async (req, res, next) => {
    const {
        soil_type, ph_level, sand_pct, silt_pct, clay_pct,
        organic_matter, nitrogen_level, phosphorus_level, potassium_level,
        recommendations, officer_id
    } = req.body;

    try {
        await req.db.execute(`
            UPDATE soil_tests SET 
                soil_type = ?, ph_level = ?, sand_pct = ?, silt_pct = ?, clay_pct = ?, 
                organic_matter = ?, nitrogen_level = ?, phosphorus_level = ?, potassium_level = ?, 
                recommendations = ?, officer_id = ?, status = 'completed'
            WHERE id = ?
        `, [
            soil_type, ph_level, sand_pct, silt_pct, clay_pct,
            organic_matter, nitrogen_level, phosphorus_level, potassium_level,
            recommendations, officer_id, req.params.testId
        ]);

        // Also update the farmer's profile with these values for convenience
        const [test] = await req.db.execute('SELECT farmer_id FROM soil_tests WHERE id = ?', [req.params.testId]);
        if (test.length > 0) {
            const farmer_id = test[0].farmer_id;
            await req.db.execute(`
                UPDATE users SET 
                    soil_type = ?, ph_level = ?, sand_pct = ?, silt_pct = ?, clay_pct = ?
                WHERE id = ?
            `, [soil_type, ph_level, sand_pct, silt_pct, clay_pct, farmer_id]);

            // Notify the farmer
            await req.db.execute(
                'INSERT INTO notifications (user_id, user_role, title, message, type) VALUES (?, ?, ?, ?, ?)',
                [farmer_id, 'farmer', 'Soil Test Report Issued', 'Your soil test report is ready. View your profile for details.', 'lab']
            );
        }

        res.json({ message: 'Soil test report issued successfully' });
    } catch (err) { next(err); }
});

// Create Soil Test Request (Manual entry by officer when sample received)
router.post('/soil-tests/request', async (req, res, next) => {
    const { farmer_id, officer_id, status } = req.body;
    try {
        const [result] = await req.db.execute(
            'INSERT INTO soil_tests (farmer_id, officer_id, status) VALUES (?, ?, ?)',
            [farmer_id, officer_id, status || 'pending']
        );
        res.json({ message: 'Soil test request created', id: result.insertId });
    } catch (err) { next(err); }
});

// Officer requests soil information from farmers (Notification-based)
router.post('/soil-tests/request-info', async (req, res, next) => {
    const { farmer_ids, division, message, deadline, officer_id } = req.body;
    try {
        let targets = [];
        if (division) {
            const [farmers] = await req.db.execute('SELECT id FROM users WHERE division = ? AND role = "farmer"', [division]);
            targets = farmers.map(f => f.id);
        } else if (farmer_ids) {
            targets = farmer_ids;
        }

        if (targets.length === 0) return res.status(400).json({ message: 'No farmers selected' });

        for (const fId of targets) {
            const [result] = await req.db.execute(
                'INSERT INTO soil_tests (farmer_id, officer_id, request_message, deadline, status) VALUES (?, ?, ?, ?, "requested")',
                [fId, officer_id, message, deadline]
            );

            await req.db.execute(
                'INSERT INTO notifications (user_id, user_role, title, message, type) VALUES (?, "farmer", ?, ?, "lab")',
                [fId, 'Soil Info Request', message || 'Please submit your soil information for analysis.']
            );
        }

        res.json({ message: `Requests sent to ${targets.length} farmers` });
    } catch (err) { next(err); }
});

// Farmer submits soil information
router.patch('/soil-tests/:testId/submit-info', async (req, res, next) => {
    const {
        location_details,
        land_type,
        soil_texture,
        irrigation_source,
        current_crop,
        crop_type,
        fertilizer_history,
        problem_description,
        image_url
    } = req.body;
    try {
        await req.db.query(`
            UPDATE soil_tests SET 
                location_details = ?, 
                land_type = ?,
                soil_texture = ?,
                irrigation_source = ?,
                current_crop = ?,
                crop_type = ?, 
                fertilizer_history = ?,
                problem_description = ?, 
                image_url = ?, 
                status = 'pending'
            WHERE id = ?
        `, [
            location_details,
            land_type,
            soil_texture,
            irrigation_source,
            current_crop,
            crop_type,
            fertilizer_history,
            problem_description,
            image_url,
            req.params.testId
        ]);

        // Notify the officer if possible
        const [test] = await req.db.execute('SELECT officer_id FROM soil_tests WHERE id = ?', [req.params.testId]);
        if (test.length > 0 && test[0].officer_id) {
            await req.db.execute(
                'INSERT INTO notifications (user_id, user_role, title, message, type) VALUES (?, "officer", "Soil Info Submitted", "A farmer has submitted soil information for review.", "lab")',
                [test[0].officer_id]
            );
        }

        res.json({ message: 'Soil information submitted successfully' });
    } catch (err) { next(err); }
});

// Update soil test status
router.patch('/soil-tests/:testId/status', async (req, res, next) => {
    const { status } = req.body;
    try {
        await req.db.execute(
            'UPDATE soil_tests SET status = ? WHERE id = ?',
            [status, req.params.testId]
        );
        res.json({ message: 'Soil test status updated successfully' });
    } catch (err) { next(err); }
});

// Delete Soil Test (and notify farmer to resubmit)
router.delete('/soil-tests/:testId', async (req, res, next) => {
    try {
        const [testRows] = await req.db.execute('SELECT farmer_id FROM soil_tests WHERE id = ?', [req.params.testId]);
        if (testRows.length > 0) {
            const farmer_id = testRows[0].farmer_id;
            // Notify the farmer to resubmit
            await req.db.execute(
                'INSERT INTO notifications (user_id, user_role, title, message, type) VALUES (?, "farmer", "Soil Info Resubmission Required", "Your previous soil info submission was rejected or deleted. Please resubmit the form with correct details.", "lab")',
                [farmer_id]
            );
        }

        await req.db.execute('DELETE FROM soil_tests WHERE id = ?', [req.params.testId]);
        res.json({ message: 'Soil test deleted and farmer notified' });
    } catch (err) { next(err); }
});

// Get soil tests for a specific farmer
router.get('/:id/soil-tests', async (req, res, next) => {
    try {
        const [rows] = await req.db.execute(
            'SELECT * FROM soil_tests WHERE farmer_id = ? ORDER BY test_date DESC',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) { next(err); }
});


// Register a new farmer (by officer)
router.post('/add', async (req, res, next) => {
    const { fullname, phone, email, division, custom_id } = req.body;
    const defaultPassword = 'farmer123';

    try {
        // Check if email already exists in users or agri_officers
        const [existsUser] = await req.db.execute('SELECT id FROM users WHERE email = ?', [email]);
        const [existsOfficer] = await req.db.execute('SELECT id FROM agri_officers WHERE email = ?', [email]);

        if (existsUser.length || existsOfficer.length) {
            return res.status(400).json({ message: 'Email already used' });
        }

        const hash = await bcrypt.hash(defaultPassword, 10);

        const [result] = await req.db.execute(
            'INSERT INTO users (fullname, phone, email, division, custom_id, password_hash, role) VALUES (?, ?, ?, ?, ?, ?, "farmer")',
            [fullname, phone, email, division, custom_id, hash]
        );

        res.json({ message: 'Farmer registered successfully', id: result.insertId });
    } catch (err) { next(err); }
});

// Delete a farmer
router.delete('/:id', async (req, res, next) => {
    try {
        // Check if farmer exists
        const [rows] = await req.db.execute('SELECT id FROM users WHERE id = ? AND role = "farmer"', [req.params.id]);
        if (!rows.length) return res.status(404).json({ message: 'Farmer not found' });

        // Delete the farmer (cascading deletes will handle related data)
        await req.db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ message: 'Farmer deleted successfully' });
    } catch (err) { next(err); }
});

// Researcher Projects
router.get('/research-projects/:researcherId', async (req, res, next) => {
    try {
        const [rows] = await req.db.execute('SELECT * FROM research_projects WHERE researcher_id = ? ORDER BY created_at DESC', [req.params.researcherId]);
        res.json(rows);
    } catch (err) { next(err); }
});

router.post('/research-projects', async (req, res, next) => {
    const { researcher_id, title, budget, duration, team_size, type, status, description } = req.body;
    try {
        const [result] = await req.db.execute(
            'INSERT INTO research_projects (researcher_id, title, budget, duration, team_size, type, status, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [researcher_id, title, budget, duration, team_size, type, status || 'Pending', description]
        );
        res.json({ message: 'Research project proposed successfully', id: result.insertId });
    } catch (err) { next(err); }
});

router.get('/research-projects', async (req, res, next) => {
    try {
        const [rows] = await req.db.execute('SELECT * FROM research_projects ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) { next(err); }
});

router.put('/research-projects/:id', async (req, res, next) => {
    const { title, budget, duration, team_size, type, status, description } = req.body;
    try {
        await req.db.execute(
            'UPDATE research_projects SET title = ?, budget = ?, duration = ?, team_size = ?, type = ?, status = ?, description = ? WHERE id = ?',
            [title, budget, duration, team_size, type, status || 'Pending', description, req.params.id]
        );
        res.json({ message: 'Research project updated successfully' });
    } catch (err) { next(err); }
});

router.delete('/research-projects/:id', async (req, res, next) => {
    try {
        await req.db.execute('DELETE FROM research_projects WHERE id = ?', [req.params.id]);
        res.json({ message: 'Research project deleted successfully' });
    } catch (err) { next(err); }
});

router.get('/datasets', async (req, res, next) => {
    const { division } = req.query;
    try {
        let query = 'SELECT * FROM datasets';
        let params = [];
        if (division) {
            query += ' WHERE division = ? OR division = "All"';
            params.push(division);
        }
        query += ' ORDER BY created_at DESC';
        const [rows] = await req.db.execute(query, params);
        res.json(rows);
    } catch (err) { next(err); }
});

router.post('/datasets', async (req, res, next) => {
    const { name, type, region, size, division, file_url } = req.body;
    try {
        await req.db.execute(
            'INSERT INTO datasets (name, type, region, size, division, file_url) VALUES (?, ?, ?, ?, ?, ?)',
            [name, type, region, size, division, file_url]
        );
        res.json({ message: 'Dataset uploaded successfully' });
    } catch (err) { next(err); }
});

router.put('/datasets/:id', async (req, res, next) => {
    const { name, type, region, size, division, file_url } = req.body;
    try {
        await req.db.execute(
            'UPDATE datasets SET name = ?, type = ?, region = ?, size = ?, division = ?, file_url = ? WHERE id = ?',
            [name, type, region, size, division, file_url, req.params.id]
        );
        res.json({ message: 'Dataset updated successfully' });
    } catch (err) { next(err); }
});

router.delete('/datasets/:id', async (req, res, next) => {
    try {
        await req.db.execute('DELETE FROM datasets WHERE id = ?', [req.params.id]);
        res.json({ message: 'Dataset deleted successfully' });
    } catch (err) { next(err); }
});

router.get('/publications', async (req, res, next) => {
    try {
        const [rows] = await req.db.execute('SELECT * FROM publications ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) { next(err); }
});

router.post('/publications', async (req, res, next) => {
    const { title, authors, journal, year, impact_factor, file_url } = req.body;
    try {
        await req.db.execute(
            'INSERT INTO publications (title, authors, journal, year, impact_factor, file_url) VALUES (?, ?, ?, ?, ?, ?)',
            [title, authors, journal, year, impact_factor, file_url]
        );
        res.json({ message: 'Publication added successfully' });
    } catch (err) { next(err); }
});

router.put('/publications/:id', async (req, res, next) => {
    const { title, authors, journal, year, impact_factor, file_url } = req.body;
    try {
        await req.db.execute(
            'UPDATE publications SET title = ?, authors = ?, journal = ?, year = ?, impact_factor = ?, file_url = ? WHERE id = ?',
            [title, authors, journal, year, impact_factor, file_url, req.params.id]
        );
        res.json({ message: 'Publication updated successfully' });
    } catch (err) { next(err); }
});

router.delete('/publications/:id', async (req, res, next) => {
    try {
        await req.db.execute('DELETE FROM publications WHERE id = ?', [req.params.id]);
        res.json({ message: 'Publication deleted successfully' });
    } catch (err) { next(err); }
});

router.get('/stats', async (req, res, next) => {
    const { researcherId, division } = req.query;
    try {
        const [[{ projectCount }]] = await req.db.execute('SELECT COUNT(*) as projectCount FROM research_projects WHERE researcher_id = ?', [researcherId]);
        const [[{ datasetCount }]] = await req.db.execute('SELECT COUNT(*) as datasetCount FROM datasets WHERE division = ? OR division = "All"', [division]);
        const [[{ publicationCount }]] = await req.db.execute('SELECT COUNT(*) as publicationCount FROM publications');

        // Count total researchers as collaborators
        const [[{ collaboratorCount }]] = await req.db.execute('SELECT COUNT(*) as collaboratorCount FROM researchers');

        // Get recent projects for the mini-list
        const [recentProjects] = await req.db.execute(
            'SELECT title, status, created_at FROM research_projects WHERE researcher_id = ? ORDER BY created_at DESC LIMIT 3',
            [researcherId]
        );

        res.json({
            projectCount,
            datasetCount,
            publicationCount,
            collaboratorCount,
            recentProjects
        });
    } catch (err) { next(err); }
});

router.get('/researchers', async (req, res, next) => {
    try {
        const [rows] = await req.db.execute('SELECT id, fullname, institution, specialization FROM researchers');
        res.json(rows);
    } catch (err) { next(err); }
});

router.put('/soil-tests/:id/forward', async (req, res, next) => {
    const { id } = req.params;
    const { researcher_id, officer_pdf_url } = req.body;
    try {
        await req.db.execute(
            'UPDATE soil_tests SET researcher_id = ?, officer_pdf_url = ?, status = "sent_to_lab" WHERE id = ?',
            [researcher_id, officer_pdf_url, id]
        );

        // Add notification for researcher
        const [[test]] = await req.db.execute('SELECT farmer_id FROM soil_tests WHERE id = ?', [id]);
        await req.db.execute(
            'INSERT INTO notifications (user_id, user_role, type, message) VALUES (?, "researcher", "soil_test", ?)',
            [researcher_id, `You have a new soil analysis request from an Agricultural Officer.`]
        );

        res.json({ message: 'Soil test forwarded to researcher successfully' });
    } catch (err) { next(err); }
});

router.put('/soil-tests/:id/lab-report', async (req, res, next) => {
    const { id } = req.params;
    const { lab_report_url, status, ph_level, soil_type, sand_pct, silt_pct, clay_pct, organic_matter, nitrogen_level, phosphorus_level, potassium_level, recommendations } = req.body;
    try {
        await req.db.execute(
            `UPDATE soil_tests SET 
                lab_report_url = ?, status = ?, ph_level = ?, soil_type = ?, 
                sand_pct = ?, silt_pct = ?, clay_pct = ?, organic_matter = ?, 
                nitrogen_level = ?, phosphorus_level = ?, potassium_level = ?, 
                recommendations = ? 
             WHERE id = ?`,
            [lab_report_url, status, ph_level, soil_type, sand_pct, silt_pct, clay_pct, organic_matter, nitrogen_level, phosphorus_level, potassium_level, recommendations, id]
        );

        // Notify Officer and Farmer
        const [[test]] = await req.db.execute('SELECT farmer_id, officer_id FROM soil_tests WHERE id = ?', [id]);
        
        const actionUrl = `download_report:${id}`;

        await req.db.execute(
            'INSERT INTO notifications (user_id, user_role, type, title, message, action_url) VALUES (?, "farmer", "lab", "Soil Report Ready", ?, ?)',
            [test.farmer_id, 'Your soil laboratory analysis report is ready. Click to download.', actionUrl]
        );

        if (test.officer_id) {
            await req.db.execute(
                'INSERT INTO notifications (user_id, user_role, type, title, message, action_url) VALUES (?, "officer", "lab", "Soil Report Ready", ?, ?)',
                [test.officer_id, `A researcher has uploaded a laboratory report for a soil test (ID: ${id}) you forwarded. Click to download.`, actionUrl]
            );
        }

        res.json({ message: 'Lab report uploaded successfully' });
    } catch (err) { next(err); }
});

module.exports = router;




