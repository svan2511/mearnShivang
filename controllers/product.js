const Product = require("../models/product");


exports.getAll = async (req,res) => {
    try{
        const data = await Product.find();
        res.json({status : true , message:"All products" , products:data});

    }catch(e) {
        res.json({status : false , message:e.message});
    }
    
}

exports.create = async (req,res) => {

    try{
        const product = new Product(req.body)
        const data = await product.save();
        res.json({status : true , message:"Create Successfully" , product:data});

    }catch(e) {
        res.json({status : false , message:e.message});
    }
    
}

exports.getSingle = async (req,res) => {
    const id = req.params.id;
    try{
        const data = await Product.findById(id);
        res.json({status : true , message:"Single Product" , product:data});

    }catch(e) {
        res.json({status : false , message:e.message});
    }
    
}

exports.update = async (req,res) => {
    const id = req.params.id;
    try{
        const data = await Product.findByIdAndUpdate(id , req.body , {new:true});
        res.json({status : true , message:"Product updated" , product:data});

    }catch(e) {
        res.json({status : false , message:e.message});
    }
    
}

exports.deleteData = async (req,res) => {
    const id = req.params.id;
    try{ 
        const data = await Product.findByIdAndDelete(id, {new:true});
        res.json({status : true , message:"Product deleted" , product:data});

    }catch(e) {
        res.json({status : false , message:e.message});
    }
    
}