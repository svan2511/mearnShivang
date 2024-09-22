const { Schema, default: mongoose } = require("mongoose");

const AdminSchema = new Schema({
    name:String,
    email:String,
    password:String,
    token:String
});

const Admin = mongoose.model('Admin'  , AdminSchema);
module.exports = Admin;