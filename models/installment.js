const { Schema, default: mongoose } = require("mongoose");

const InstallmentSchema = new Schema({
  inst_name:{type:String},
  inst_amount:{type:Number},
  member_id:{ type: Schema.Types.ObjectId, ref: 'Member' },
  paid_amount:{type:Number , default:0},
  remain_amount:{type:Number,default:0},
  paid_on:{type:Date,default:null},
  partialy_paid_on:{type:Date,default:null},
  due_date:{type:Date , default:null},
    status:{
        type: Number,
        default: 0
      },
});

const Installment = mongoose.model('Installment'  , InstallmentSchema);
module.exports = Installment;