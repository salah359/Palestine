const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadFileToGCS = require('../utils/gcsUpload');

// Import Database Models
const Product = require('../models/product');
const Order = require('../models/Order');
const Settings = require('../models/settings');

// Configure Multer to store files temporarily in the server's RAM
// Increased limits for multiple high-res photos and video
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit total
});

// ==========================================
// 1. PRODUCT MANAGEMENT
// ==========================================
router.post('/products', upload.fields([{ name: 'images', maxCount: 5 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
    try {
        let imageUrls = [];
        let videoUrl = null;

        // Process Multiple Images (Up to 5)
        if (req.files['images'] && req.files['images'].length > 0) {
            // Map over the array of physical files and trigger Google Cloud upload for each
            const uploadPromises = req.files['images'].map(file => {
                return uploadFileToGCS(file, 'products/images');
            });
            // Wait for all images to finish uploading
            imageUrls = await Promise.all(uploadPromises);
        }

        // Process Optional Video
        if (req.files['video'] && req.files['video'][0]) {
            videoUrl = await uploadFileToGCS(req.files['video'][0], 'products/videos');
        }

        // Parse array data safely
        let parsedSizes = [];
        if (req.body.sizes && typeof req.body.sizes === 'string') {
            parsedSizes = req.body.sizes.split(',').map(s => s.trim());
        }

        // Determine Stock Status
        const isInStock = req.body.inStock === 'true' || req.body.inStock === true;

        // Construct Database Object (Tolerant of empty optional fields)
        const newProduct = new Product({
            name: req.body.name || 'Unnamed Product',
            price: parseFloat(req.body.price) || 0.00,
            discountPercentage: parseInt(req.body.discountPercentage) || 0,
            description: req.body.description || '',
            sizes: parsedSizes,
            inStock: isInStock,
            images: imageUrls, // Store the array of GCS URLs
            video: videoUrl
        });

        // Save to DB
        await newProduct.save();
        res.status(201).json({ message: "Product and multiple media files securely uploaded!", product: newProduct });

    } catch (error) {
        console.error("Critical Admin Upload Error:", error);
        res.status(500).json({ error: "Failed to upload product and media. Check server logs." });
    }
});

// ==========================================
// 2. CAROUSEL SETTINGS
// ==========================================
router.put('/settings/carousel', upload.array('carouselImages', 3), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "Please upload at least one image." });
        }

        // Upload all files to Google Cloud concurrently
        const uploadPromises = req.files.map(file => uploadFileToGCS(file, 'carousel'));
        const imageUrls = await Promise.all(uploadPromises);

        // Find and Update MongoDB Settings Document
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings({ carouselImages: imageUrls });
        } else {
            settings.carouselImages = imageUrls;
        }
        
        await settings.save();
        res.status(200).json({ message: "Main Carousel media updated securely!", settings });

    } catch (error) {
        console.error("Carousel upload error:", error);
        res.status(500).json({ error: "Failed to update carousel media." });
    }
});

// ==========================================
// 3. ORDER MANAGEMENT
// ==========================================
router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: "Failed to fetch orders." });
    }
});

router.put('/orders/:id/approve', async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { adminStatus: 'Approved' }, 
            { new: true } 
        );
        
        if (!order) {
            return res.status(404).json({ error: "Order not found." });
        }

        res.status(200).json({ message: "Order approved for shipping!", order });
    } catch (error) {
        console.error("Error approving order:", error);
        res.status(500).json({ error: "Failed to approve the order." });
    }
});

module.exports = router;