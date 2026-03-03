/**
 * ======================================================================
 * MONGODB SCHEMA: ORDER
 * ======================================================================
 * Stores customer order data generated from the frontend checkout modal.
 */
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    // Customer Contact Details
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    
    // Delivery Details
    address: { type: String, required: true },
    postCode: { type: String, required: true },
    
    // Cart Data
    items: [{
        productName: String,
        price: Number,
        size: String,
        quantity: Number
    }],
    
    // Financials & Status
    totalAmount: { type: Number, required: true },
    paymentStatus: { 
        type: String, 
        enum: ['Pending', 'Paid'], 
        default: 'Pending' // Starts pending until WhatsApp confirms
    },
    adminStatus: { 
        type: String, 
        enum: ['Reviewing', 'Approved', 'Shipped'], 
        default: 'Reviewing' 
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('Order', orderSchema);