const express = require('express');
const router = express.Router();
const Product = require('../models/product'); // Matches your lowercase 'product.js'

// GET Route: Fetch all products from the database to display on the live site
router.get('/', async (req, res) => {
    try {
        // Find all products in MongoDB
        const products = await Product.find();
        
        // Send them back to the frontend
        res.status(200).json(products);
    } catch (error) {
        console.error("Database fetch error:", error);
        res.status(500).json({ message: "Server Error fetching products" });
    }
});

module.exports = router;