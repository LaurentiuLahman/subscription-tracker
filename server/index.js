const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
    req.user = { id: '64a7f0c5e1b2c3d4e5f6a7b8' }; // Mock user ID for testing
    next();
});

const subscriptionRoutes = require('./routes/subscriptionRoutes')

app.use ('/api/subscriptions', subscriptionRoutes);

app.get('/', (req, res) => {
    res.send('API Subscription Tracker is running...');
})


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectat la MongoDB cu succes!'))
  .catch((err) => console.error('❌ Eroare conectare MongoDB:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Serverul rulează pe portul ${PORT}`);
});