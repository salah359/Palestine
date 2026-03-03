/**
 * ======================================================================
 * MONGODB SCHEMA: PRODUCT
 * ======================================================================
 * Defines the structure for the heritage clothing items.
 * Updated to support multiple images, optional fields, and stock status.
 */
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    // Core Product Information
    name: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        default: '' // Optional field fallback
    },
    
    // Pricing & Discounts
    price: { 
        type: Number, 
        default: 0 // Optional field fallback
    },
    discountPercentage: { 
        type: Number, 
        default: 0 
    },
    
    // Inventory & Variations
    sizes: { 
        type: [String], 
        default: ['S', 'M', 'L', 'XL'] 
    },
    inStock: { 
        type: Boolean, 
        default: true 
    },
    
    // Media URLs (Hosted on Google Cloud Storage)
    image: { 
        type: String, 
        default: null // Legacy fallback for older products
    },
    images: { 
        type: [String], 
        default: [] // NEW: Array for multiple product images (Carousel)
    }, 
    video: { 
        type: String, 
        default: null 
    }
}, { 
    timestamps: true // Automatically manages createdAt and updatedAt
});

module.exports = mongoose.model('Product', productSchema);