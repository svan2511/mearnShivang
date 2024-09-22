const { Schema, default: mongoose } = require("mongoose");

const CenterSchema = new Schema({
  center_name:String,
  center_address:String,
    status:{
        type: Number,
        default: 1
      },
});

const Center = mongoose.model('Center'  , CenterSchema);
module.exports = Center;