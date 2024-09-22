const express = require('express');
const { getAll, create, getSingle, update, deleteData } = require('../controllers/product');
const router = express.Router();

router.get('/' , getAll)
.get('/:id' , getSingle)
.post('/',create)
.patch('/:id',update)
.delete('/:id',deleteData);


 exports.router = router ;