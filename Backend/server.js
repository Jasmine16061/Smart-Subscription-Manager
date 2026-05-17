const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/auth');
require('dotenv').config();

const app = express();

// 1. Enable Cross-Origin Resource Sharing (CORS) and JSON parsing middleware
app.use(cors({
    origin: function (origin, callback) {
        callback(null, true);
    },
    credentials: true
}));
app.use(express.json());

// Auth Routes
app.use('/api/auth', authRoutes);

// 2. Test Route: Access http://localhost:5001
app.get('/', (req, res) => {
    res.send('Subscription Track API is running successfully!');
});

// 3. API - Get all subscription items for a specific user (Read)
app.get('/api/subscriptions', authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. API - Add a new subscription item (Create)
app.post('/api/subscriptions', authMiddleware, async (req, res) => {
    const { name, amount, category, startDateStr, expiryDateStr, frequency, duration } = req.body;
    const user_id = req.user.id;

    // Validation: Check for required fields
    if (!name || !amount || !category || !startDateStr || !expiryDateStr || !frequency) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO subscriptions (user_id, name, amount, category, start_date, expiry_date, frequency, duration) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, name, amount, category, startDateStr, expiryDateStr, frequency, duration || 1]
        );
        res.status(201).json({ message: 'Subscription added successfully', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. API - Delete a subscription item (Delete)
app.delete('/api/subscriptions/:id', authMiddleware, async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM subscriptions WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Subscription not found or not authorized' });
        }
        res.json({ message: 'Subscription deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Set server listening port
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});