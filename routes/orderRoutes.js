const express = require('express');
const router = express.Router();
const Order = require('../models/Order'); 

/**
 * POST Route: Submit a new customer order
 * Triggered when the user clicks 'Confirm & Send to WhatsApp'
 */
router.post('/', async (req, res) => {
    try {
        // Extract the expanded data payload sent from the frontend script.js
        const { 
            customerName, 
            email, 
            phone, 
            address, 
            postCode, 
            items, 
            totalAmount 
        } = req.body;

        // Expanded validation to ensure critical fields are not left blank
        if (!customerName || !phone || !address || !postCode) {
            return res.status(400).json({ error: "Missing required contact or delivery details." });
        }
        if (!items || items.length === 0) {
            return res.status(400).json({ error: "Cannot process an empty cart." });
        }

        // Create a new order document matching the updated Order schema
        const newOrder = new Order({
            customerName: customerName,
            email: email,
            phone: phone,
            address: address,
            postCode: postCode,
            items: items,
            totalAmount: totalAmount,
            paymentStatus: 'Pending', // Awaiting manual confirmation via WhatsApp
            adminStatus: 'Reviewing'
        });

        // Save the comprehensive order to AWS MongoDB
        await newOrder.save();
        
        // Send success confirmation back to frontend
        res.status(201).json({ message: "Order placed securely in database!", orderId: newOrder._id });
    } catch (error) {
        console.error("Checkout processing error inside orderRoutes:", error);
        res.status(500).json({ error: "Failed to process the order due to a server error." });
    }
});

module.exports = router;