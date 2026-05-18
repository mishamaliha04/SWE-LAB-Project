// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Register
router.post('/register', async (req, res, next) => {
  const { fullname, phone, email, division, password, role, institution, specialization, research_area } = req.body;
  
  // Normalize role and check if it's an officer
  const normalizedRole = role === 'officer' ? 'agri_officer' : (role || 'farmer');
  const isOfficer = normalizedRole === 'agri_officer';
  
  try {
    // Check both tables for email uniqueness
    const [existsUser] = await req.db.execute('SELECT id FROM users WHERE email = ?', [email]);
    const [existsOfficer] = await req.db.execute('SELECT id FROM agri_officers WHERE email = ?', [email]);
    const [existsResearcher] = await req.db.execute('SELECT id FROM researchers WHERE email = ?', [email]);
    
    if (existsUser.length || existsOfficer.length || existsResearcher.length) {
      return res.status(400).json({ message: 'Email already used' });
    }

    const hash = await bcrypt.hash(password, 10);
    
    let query, params;
    if (isOfficer) {
      query = 'INSERT INTO agri_officers (fullname, phone, email, division, password_hash) VALUES (?,?,?,?,?)';
      params = [fullname, phone, email, division, hash];
    } else if (normalizedRole === 'researcher') {
      query = 'INSERT INTO researchers (fullname, phone, email, division, password_hash, institution, specialization, research_area) VALUES (?,?,?,?,?,?,?,?)';
      params = [fullname, phone, email, division, hash, institution || null, specialization || null, research_area || null];
    } else {
      query = 'INSERT INTO users (fullname, phone, email, division, password_hash, role) VALUES (?,?,?,?,?,?)';
      params = [fullname, phone, email, division, hash, normalizedRole];
    }

    const [result] = await req.db.execute(query, params);
    const token = jwt.sign({ id: result.insertId, role: normalizedRole }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      token, 
      id: result.insertId,
      fullname, 
      division,
      role: normalizedRole,
      profile_image: null
    });
  } catch (err) { next(err); }
});

// Login
router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;
  try {
    // Check users table first
    let [rows] = await req.db.execute('SELECT * FROM users WHERE email = ?', [email]);
    let user = rows[0];
    let role = user?.role;

    // If not in users, check agri_officers
    if (!user) {
      [rows] = await req.db.execute('SELECT * FROM agri_officers WHERE email = ?', [email]);
      user = rows[0];
      if (user) role = 'agri_officer';
    }

    // If still not found, check researchers
    if (!user) {
      [rows] = await req.db.execute('SELECT * FROM researchers WHERE email = ?', [email]);
      user = rows[0];
      if (user) role = 'researcher';
    }

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      token, 
      id: user.id,
      role: role,
      fullname: user.fullname,
      division: user.division,
      profile_image: user.profile_image
    });
  } catch (err) { next(err); }
});

// Delete Account
router.delete('/account/:id', async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.query;

  try {
    if (role === 'agri_officer' || role === 'officer') {
      await req.db.execute('DELETE FROM agri_officers WHERE id = ?', [id]);
    } else if (role === 'researcher') {
      await req.db.execute('DELETE FROM researchers WHERE id = ?', [id]);
    } else {
      await req.db.execute('DELETE FROM users WHERE id = ?', [id]);
    }
    res.json({ message: 'Account deleted successfully' });
  } catch (err) { next(err); }
});

// Reset Password
router.post('/reset-password', async (req, res, next) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ message: 'Email and new password are required' });
  }

  try {
    const hash = await bcrypt.hash(newPassword, 10);
    
    // Check users
    const [userRes] = await req.db.execute('UPDATE users SET password_hash = ? WHERE email = ?', [hash, email]);
    if (userRes.affectedRows > 0) return res.json({ message: 'Password updated successfully' });

    // Check agri_officers
    const [officerRes] = await req.db.execute('UPDATE agri_officers SET password_hash = ? WHERE email = ?', [hash, email]);
    if (officerRes.affectedRows > 0) return res.json({ message: 'Password updated successfully' });

    // Check researchers
    const [researcherRes] = await req.db.execute('UPDATE researchers SET password_hash = ? WHERE email = ?', [hash, email]);
    if (researcherRes.affectedRows > 0) return res.json({ message: 'Password updated successfully' });

    // If not found anywhere
    return res.status(404).json({ message: 'Account not found with this email' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
