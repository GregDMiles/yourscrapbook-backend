const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const Media = require('../models/Media');
const auth = require('../middleware/authMiddleware');
const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/upload', auth, upload.single('file'), (req, res) => {
  const file = req.file;
  const stream = cloudinary.uploader.upload_stream(
    { resource_type: 'auto' },
    async (error, result) => {
      if (error) return res.status(500).json({ error: 'Upload failed' });

      const media = await Media.create({
        userId: req.user._id,
        url: result.secure_url,
        type: result.resource_type
      });

      res.json(media);
    }
  );

  streamifier.createReadStream(file.buffer).pipe(stream);
});

router.get('/media', auth, async (req, res) => {
  const media = await Media.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json(media);
});

module.exports = router;
