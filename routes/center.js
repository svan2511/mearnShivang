const express = require('express');
const { getAll, getSingle, create, deleteData, getCenterByName } = require('../controllers/centers');
const router = express.Router();

router.get('/' , getAll)
.get('/:id/:name?' , getSingle)
.post('/name/:center',getCenterByName)
.post('/',create)
.delete('/:id',deleteData);


 exports.router = router ;