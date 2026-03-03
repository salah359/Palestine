const express = require('express');
const router = express.Router();
const Order = require('../models/Order'); // Matches your capitalized 'Order.js'

// POST Route: Submit a new customer order from the live site shopping cart
router.post('/', async (req, res) => {
    try {
        // Extract the data sent from the frontend script.js
        const { customerName, email, items, totalAmount } = req.body;

        // Basic validation
        if (!customerName || !email || !items || items.length === 0) {
            return res.status(400).json({ error: "Missing required order details." });
        }

        // Create a new order document
        const newOrder = new Order({
            customerName,
            email,
            items,
            totalAmount,
            paymentStatus: 'Paid',
            adminStatus: 'Reviewing' // Sets default status so the admin knows it's new
        });

        // Save to AWS MongoDB
        await newOrder.save();
        
        res.status(201).json({ message: "Order placed successfully!", orderId: newOrder._id });
    } catch (error) {
        console.error("Checkout processing error:", error);
        res.status(500).json({ error: "Failed to process the order." });
    }
});

module.exports = router;