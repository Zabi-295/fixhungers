const cloudinary = require('cloudinary').v2;

const isConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                     process.env.CLOUDINARY_API_KEY && 
                     process.env.CLOUDINARY_API_SECRET;

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log("🌲 Cloudinary storage client initialized successfully.");
} else {
  console.warn("⚠️ Cloudinary credentials missing in environment variables. Falling back to MongoDB storage.");
}

/**
 * Uploads a base64 file string to Cloudinary.
 * @param {string} base64Str - The base64 file string (with data URI prefix)
 * @returns {Promise<string|null>} - The secure url of the uploaded file, or null if configuration missing/failed.
 */
async function uploadToBase64(base64Str) {
  if (!isConfigured) {
    return null;
  }

  try {
    const uploadResponse = await cloudinary.uploader.upload(base64Str, {
      resource_type: 'auto',
      folder: 'fixhunger_support'
    });
    return uploadResponse.secure_url;
  } catch (err) {
    console.error("Cloudinary upload failed:", err.message);
    return null;
  }
}

module.exports = {
  uploadToBase64,
  isConfigured
};
