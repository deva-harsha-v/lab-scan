const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload an image buffer to Cloudinary with auto quality and max 1200px width.
 * @param {Buffer} buffer - File buffer from multer memory storage
 * @returns {Promise<string>} secure_url of the uploaded image
 */
function uploadPdf(buffer, originalName) {
  return new Promise((resolve, reject) => {
    const safeName = originalName
      ? originalName
          .replace(/\.[^/.]+$/, "")
          .replace(/[^a-zA-Z0-9_-]/g, "_")
      : `pdf_${Date.now()}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'labscan/pdfs',
        public_id: `${Date.now()}_${safeName}`,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
}


function uploadFile(buffer) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: 'labscan/observations',
        transformation: [
          { width: 1200, crop: 'limit' },
          { quality: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
}

module.exports = { uploadFile, uploadPdf };
