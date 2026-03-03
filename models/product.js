const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    region: { type: String, required: true },
    sizes: { type: [String], default: ['S', 'M', 'L', 'XL'] },
    colors: { type: [String], default: [] },
    discountPercentage: { type: Number, default: 0 },
    inStock: { type: Boolean, default: true },
    // MEDIA FIELDS (Will store Google Cloud URLs)
    image: { type: String, required: true }, 
    video: { type: String, default: null } // NEW: Optional product video
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);