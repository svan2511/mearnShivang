const { Schema, default: mongoose } = require("mongoose");

const ProductSchema = new Schema({
    title:String,
    price:Number
});

const Product = mongoose.model('Product'  , ProductSchema);
module.exports = Product;