const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadFileToGCS = require('../utils/gcsUpload');

// Import Database Models (matching your exact file names)
const Product = require('../models/product');
const Order = require('../models/Order');
const Settings = require('../models/settings');

// Configure Multer to store files temporarily in the server's RAM before sending to Google Cloud
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit to allow for videos
});

// ==========================================
// 1. PRODUCT MANAGEMENT
// ==========================================
// The 'upload.fields' middleware grabs the 'image' and 'video' physical files from the incoming request.
router.post('/products', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
    try {
        let imageUrl = '';
        let videoUrl = null;

        // Step 1: Upload the mandatory image to Google Cloud
        if (req.files['image'] && req.files['image'][0]) {
            imageUrl = await uploadFileToGCS(req.files['image'][0], 'products/images');
        } else {
            return res.status(400).json({ error: "Main product image is required." });
        }

        // Step 2: Upload the optional video to Google Cloud
        if (req.files['video'] && req.files['video'][0]) {
            videoUrl = await uploadFileToGCS(req.files['video'][0], 'products/videos');
        }

        // Step 3: Parse arrays from the frontend FormData (which sends arrays as comma-separated strings)
        const parsedSizes = req.body.sizes ? req.body.sizes.split(',').map(s => s.trim()) : ['S', 'M', 'L', 'XL'];
        const parsedColors = req.body.colors ? req.body.colors.split(',').map(c => c.trim()) : [];

        // Step 4: Construct the new Product object and save it to MongoDB
        const newProduct = new Product({
            name: req.body.name,
            price: parseFloat(req.body.price),
            region: req.body.region,
            discountPercentage: parseInt(req.body.discountPercentage) || 0,
            description: req.body.description,
            sizes: parsedSizes,
            colors: parsedColors,
            image: imageUrl, // Saving the generated Google Cloud URL
            video: videoUrl  // Saving the generated Google Cloud URL (or null)
        });

        await newProduct.save();
        res.status(201).json({ message: "Product and media securely uploaded!", product: newProduct });

    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Failed to upload product and media." });
    }
});

// ==========================================
// 2. CAROUSEL SETTINGS
// ==========================================
// Allow uploading up to 3 images for the homepage carousel
router.put('/settings/carousel', upload.array('carouselImages', 3), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "Please upload at least one image." });
        }

        // Upload all files to Google Cloud concurrently for speed
        const uploadPromises = req.files.map(file => uploadFileToGCS(file, 'carousel'));
        const imageUrls = await Promise.all(uploadPromises);

        // Update MongoDB Settings Document (or create one if it doesn't exist)
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings({ carouselImages: imageUrls });
        } else {
            settings.carouselImages = imageUrls;
        }
        
        await settings.save();
        res.status(200).json({ message: "Carousel media updated securely on Google Cloud!", settings });

    } catch (error) {
        console.error("Carousel upload error:", error);
        res.status(500).json({ error: "Failed to update carousel media." });
    }
});

// ==========================================
// 3. ORDER MANAGEMENT
// ==========================================

// Get all incoming customer orders for the dashboard table
router.get('/orders', async (req, res) => {
    try {
        // Fetch orders and sort by newest first (descending order of creation time)
        const orders = await Order.find().sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: "Failed to fetch orders." });
    }
});

// Approve an order for shipping
router.put('/orders/:id/approve', async (req, res) => {
    try {
        // Find the specific order by its MongoDB ID and change its status to 'Approved'
        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { adminStatus: 'Approved' }, 
            { new: true } // Returns the updated document instead of the old one
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