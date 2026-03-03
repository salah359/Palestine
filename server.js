/**
 * ======================================================================
 * TATREEZ ELEGANCE - FULL STACK SERVER APPLICATION
 * ======================================================================
 */

// --- 1. Import Essential Dependencies ---
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // Core Node.js module for fixing HTML file paths
require('dotenv').config(); 

// --- 2. Initialize the Express Application ---
const app = express();

// --- 3. Configure Global Middleware ---
app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Serve static files (CSS, JS, Images) from the root directory
app.use(express.static(__dirname));

// --- 4. Define API Routes ---
const productRoutes = require('./routes/productRoutes');
const adminRoutes = require('./routes/adminRoutes'); 
const orderRoutes = require('./routes/orderRoutes'); 

// Mount the API endpoints
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);

// --- 5. Frontend Page Routing (The Navigation Fix) ---
// Serve the main website when someone visits localhost:5000/
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the admin dashboard when someone visits localhost:5000/admin
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// --- 6. Database Connection Setup ---
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Validate that the URI exists
if (!MONGO_URI) {
    console.error("❌ CRITICAL ERROR: MONGO_URI is missing from your .env file.");
    process.exit(1); 
}

// Connect to AWS MongoDB
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ Successfully connected to AWS MongoDB Cluster');
        
        // --- 7. Start the Server ---
        app.listen(PORT, () => {
            console.log(`🚀 Server is officially running and listening on port ${PORT}`);
            console.log(`🌍 Live Site:     http://localhost:${PORT}/`);
            console.log(`🔐 Admin Panel:   http://localhost:${PORT}/admin`);
        });
    })
    .catch((err) => {
        console.error('❌ Failed to connect to MongoDB. Error details:');
        console.error(err);
        process.exit(1); 
    });

// --- 8. Global Error Handling ---
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});