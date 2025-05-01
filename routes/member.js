const express = require('express');
const { getAll, getSingle, create, deleteData, updateInstallment, getMemeberByName } = require('../controllers/member');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Function to get the correct images directory path
function getImagesPath() {
  // In development
  if (process.env.NODE_ENV === 'development') {
    return path.join(__dirname, '..', 'images');
  }
  // In production (packaged app)
  return path.join(process.resourcesPath, 'images');
}

// Create images directory if it doesn't exist
const imagesPath = getImagesPath();
if (!fs.existsSync(imagesPath)) {
  fs.mkdirSync(imagesPath, { recursive: true });
  console.log('Created images directory at:', imagesPath);
}

const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagesPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to avoid name conflicts
  },
});

const upload = multer({ storage: storage });

router.get('/' , getAll)
.get('/:id' , getSingle)
.post('/',  upload.single('mem_img') , create)
.post('/updateInst',updateInstallment)
.post('/name/:name' ,getMemeberByName)
.delete('/:id',deleteData);

exports.router = router;