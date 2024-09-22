const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const server = express();
const productRouter = require('./routes/product');
const adminRouter = require('./routes/admin');
const centerRouter = require('./routes/center');
const memberRouter = require('./routes/member');
const cors = require('cors');
require('dotenv').config();



mongoose.connect(process.env.MONGO_URL)
.then(async () => console.log('server started ...'))
.catch((e) => console.log('message: ', e.message));


server.use(cors());
server.use(express.json());
server.use(express.static(path.resolve(__dirname , 'build')));


server.use('/admin',adminRouter.router);
server.use('/products',productRouter.router);
server.use('/centers',centerRouter.router);
server.use('/members',memberRouter.router);
server.use('*' ,(req,res)=>{
res.sendFile( path.resolve(__dirname ,'build','index.html' ));
})


server.listen(process.env.PORT , () => {
    console.log('server start ...')
})