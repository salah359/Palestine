const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    items: [{
        productName: String,
        price: Number,
        size: String,
        quantity: Number
    }],
    totalAmount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Paid' },
    adminStatus: { type: String, enum: ['Reviewing', 'Approved', 'Shipped'], default: 'Reviewing' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);