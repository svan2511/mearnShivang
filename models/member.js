const { Schema, default: mongoose } = require("mongoose");

const MemberSchema = new Schema({
  mem_name:{type:String},
  mem_img:{type:String},
  center_id:{ type: Schema.Types.ObjectId, ref: 'Center' },
  disb_amount:{type:Number},
  mem_tenor:{type:String,default:null},
  monthly_inst:{type:String,default:null},
  mem_phone:{type:String,default:null},
  disb_date:{type:Date},
    status:{
        type: Number,
        default: 1
      },
});

const Member = mongoose.model('Member'  , MemberSchema);
module.exports = Member;