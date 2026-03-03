const { Storage } = require('@google-cloud/storage');
const path = require('path');

// Initialize Google Cloud Storage using your .env credentials
const storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    keyFilename: process.env.GCP_KEY_FILE,
});

const bucket = storage.bucket(process.env.GCP_BUCKET_NAME);

/**
 * Uploads a file buffer to Google Cloud Storage and returns the public URL.
 * @param {Object} file - The file object provided by Multer
 * @param {String} folder - The folder name in the GCS bucket (e.g., 'products' or 'carousel')
 */
const uploadFileToGCS = (file, folder = 'misc') => {
    return new Promise((resolve, reject) => {
        if (!file) return reject('No file provided');

        // Clean the file name and make it unique
        const originalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        const blobName = `${folder}/${Date.now()}-${originalName}`;
        const blob = bucket.file(blobName);

        // Create a writable stream to push the file to Google
        const blobStream = blob.createWriteStream({
            resumable: false,
            contentType: file.mimetype,
        });

        blobStream.on('error', (err) => {
            console.error("GCS Upload Error:", err);
            reject(err);
        });

        blobStream.on('finish', () => {
            // Once finished, construct the public URL for MongoDB
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            resolve(publicUrl);
        });

        // End the stream and push the buffer
        blobStream.end(file.buffer);
    });
};

module.exports = uploadFileToGCS;