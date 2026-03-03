const express = require('express');
const router = express.Router();
const Product = require('../models/product'); 
const Settings = require('../models/settings'); 

/**
 * GET Route: Fetch all products
 * Used by the live site to populate the shop grid.
 */
router.get('/', async (req, res) => {
    try {
        // Find all products in MongoDB, sorted by newest first
        const products = await Product.find().sort({ createdAt: -1 });
        
        // Send them back to the frontend with a 200 OK status
        res.status(200).json(products);
    } catch (error) {
        console.error("Database fetch error for products:", error);
        res.status(500).json({ message: "Server Error fetching products" });
    }
});

/**
 * GET Route: Fetch Global Site Settings
 * Used by the live site to populate the dynamic homepage carousel.
 */
router.get('/settings', async (req, res) => {
    try {
        // Find the single settings document
        let settings = await Settings.findOne();
        
        // If none exists yet, return a safe default object
        if (!settings) {
            settings = { carouselImages: [] };
        }
        
        res.status(200).json(settings);
    } catch (error) {
        console.error("Database fetch error for settings:", error);
        res.status(500).json({ message: "Server Error fetching settings" });
    }
});

module.exports = router;