const express = require('express');
const { getAll, getSingle, create, deleteData, updateInstallment, getMemeberByName } = require('../controllers/member');
const router = express.Router();
const path = require('path');

const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'uploads/');
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
 exports.router = router ;