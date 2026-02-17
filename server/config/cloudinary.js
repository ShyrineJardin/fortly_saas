const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for gallery images/videos
const galleryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'fortly/gallery',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi', 'webm'],
    resource_type: 'auto', // Automatically detect image or video
  }
});

// Configure Cloudinary storage for business logos
const logoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'fortly/logos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

// Create multer instances
const uploadGallery = multer({ 
  storage: galleryStorage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB for videos
});

const uploadLogo = multer({ storage: logoStorage });

module.exports = {
  cloudinary,
  uploadGallery,
  uploadLogo
};