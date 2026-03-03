/**
 * ======================================================================
 * TATREEZ ELEGANCE - FULL STACK SERVER ARCHITECTURE
 * ======================================================================
 * Features enabled:
 * - Express JSON payload parsing
 * - Cross-Origin Resource Sharing (CORS)
 * - Static file serving (HTML, CSS, JS bridging)
 * - Mongoose AWS Database Connection Pool
 * - RESTful routing for Products, Orders, and Admin utilities.
 */

// --- 1. Essential Dependency Injections ---
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); 
require('dotenv').config(); 

// --- 2. Express Engine Initialization ---
const app = express();

// --- 3. Middleware Configuration Pipeline ---
// Allows frontend domain to make API requests without security blocks
app.use(cors()); 

// Interprets incoming JSON bodies from `fetch` calls
app.use(express.json()); 

// Interprets incoming form data strings
app.use(express.urlencoded({ extended: true }));

// Binds the root directory as a public static folder, enabling index.html to load style.css automatically
app.use(express.static(__dirname));

// --- 4. API Routing Infrastructure ---
// Connect external router files to maintain clean modular codebase
const productRoutes = require('./routes/productRoutes');
const adminRoutes = require('./routes/adminRoutes'); 
const orderRoutes = require('./routes/orderRoutes'); 

// Mount routers to specific base URL prefixes
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);

// --- 5. Frontend Client Serving Rules ---
// Forces the server to act as a web host, delivering the physical HTML file to the browser
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Explicitly protects the routing path to the admin dashboard
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// --- 6. AWS Database Handshake ---
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Defensive check to prevent server boot if credentials are missing
if (!MONGO_URI) {
    console.error("❌ CRITICAL BOOT ERROR: MONGO_URI missing. Check .env file integrity.");
    process.exit(1); 
}

// Initiate persistent connection pool to MongoDB Atlas
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ Server authenticated and connected to AWS MongoDB Cluster');
        
        // --- 7. Ignite Listening Port ---
        app.listen(PORT, () => {
            console.log(`=========================================`);
            console.log(`🚀 System Online - Active on Port ${PORT}`);
            console.log(`🌍 Public Interface: http://localhost:${PORT}/`);
            console.log(`🔐 Control Center:   http://localhost:${PORT}/admin`);
            console.log(`=========================================`);
        });
    })
    .catch((err) => {
        console.error('❌ FATAL: Failed to establish database connection sequence.');
        console.error(err);
        process.exit(1); 
    });

// --- 8. Unhandled Rejection Safety Net ---
// Prevents node crashes in the event of an un-caught asynchronous error
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Critical Warning: Unhandled Promise Rejection at:', promise, 'reason:', reason);
});