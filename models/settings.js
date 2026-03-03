const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    carouselImages: { 
        type: [String], 
        default: [
            "https://images.unsplash.com/photo-1605337222543-85b4f620f4c3",
            "https://images.unsplash.com/photo-1583391733959-1c667ce14620",
            "https://images.unsplash.com/photo-1550614000-4b95d4ebdaea"
        ] 
    }
});

module.exports = mongoose.model('Settings', settingsSchema);