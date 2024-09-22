const { Types, default: mongoose } = require("mongoose");
const Member = require("../models/member");
const Installment = require("../models/installment");
const { addMonths } = require('date-fns');


exports.getAll = async (req,res) => {
    try{
        // const data = await Member.find().populate('center_id');
        const data =  await Member.aggregate([
            {
                $lookup:{
                    from: "centers",
                    localField: "center_id",
                    foreignField: "_id",
                    as: "center"
                },
             
            },
       
            {
                $unwind: '$center' // Deconstruct the array to get a single object
            }
          
        ]);


        res.json({success : true , message:"All Members" , members:data});

    }catch(e) {
        res.json({success : false , message:e.message}); 
    }
    
}

exports.getMemeberByName = async (req,res) => {
    const name =  req.params.name;
    const regex = new RegExp(name, 'i');
    try{
        const data =  await Member.aggregate([
            {
                $match:{ mem_name: { $regex: regex } }
            },
            {
                $lookup:{
                    from: "centers",
                    localField: "center_id",
                    foreignField: "_id",
                    as: "center"
                },
             
            },
       
            {
                $unwind: '$center' // Deconstruct the array to get a single object
            }
          
        ]);


        res.json({success : true , message:"All Members" , members:data});

    }catch(e) {
        res.json({success : false , message:e.message}); 
    }
    
}

exports.create = async (req,res) => {

    const url = req.protocol+'://'+req.get('host')+'/'+req.file.filename;
    try{
        const member = new Member({
            mem_name:req.body.mem_name,
            mem_img: url,
            center_id:req.body.center_id,
            disb_amount:req.body.disb_amount,
            mem_tenor:req.body.mem_tenor,
            monthly_inst:req.body.monthly_inst,
            mem_phone:req.body.mem_phone,
            disb_date:req.body.disb_date,
        });
        const data = await member.save();
        if(data) {
            let disDate = new Date(data.disb_date); 
            for(let i=1;i<=data.mem_tenor;i++) {
                let nextMonth = addMonths(disDate, i);
                const installment = new Installment({
                    inst_name:"INSTALLMENT_"+i,
                    inst_amount:data.monthly_inst,
                    member_id:data._id,
                    due_date:nextMonth
                });
                await installment.save();
            }
        }
       
        res.json({success : true , message:"Create Successfully" , member:data});

    }catch(e) {
        res.json({success : false , message:e.message});
    }
    
}

exports.getSingle = async (req,res) => {
    const id = req.params.id;
    try{

        const data =  await Member.aggregate([
            {
                
                $match: { _id: new mongoose.Types.ObjectId(id) }  // starting point (e.g., manager)
                      
            },
            {
                $lookup:{
                    from: "centers",
                    localField: "center_id",
                    foreignField: "_id",
                    as: "center"
                },
             
            },
            {
                $lookup:{
                    from: "installments",
                    localField: "_id",
                    foreignField: "member_id",
                    as: "installments"
                },
             
            },
       
            {
                $unwind: '$center' // Deconstruct the array to get a single object
            }
          
        ]);


        res.json({success : true , message:"Single Member" , member:data[0]});

    }catch(e) {
        res.json({success : false , message:e.message});
    }
    
}

// exports.update = async (req,res) => {
//     const id = req.params.id;
//     try{
//         const data = await Member.findByIdAndUpdate(id , req.body , {new:true});
//         res.json({success : true , message:"Member updated" , Member:data});

//     }catch(e) {
//         res.json({success : false , message:e.message});
//     }
    
// }

exports.deleteData = async (req,res) => {
    const id = req.params.id;
    try{ 
        const data = await Member.findByIdAndDelete(id, {new:true});
        if(data) {
            const installment = mongoose.model('Installment');
            await installment.deleteMany({ member_id: id });
            res.json({success : true , message:"Member deleted" , member:data});
        } else {
            res.json({success : false , message:'internal error'});
        }
       

    }catch(e) {
        res.json({success : false , message:e.message});
    }
    
}

exports.updateInstallment = async (req,res) => {
    const instDate = req.body.disb_date ? new Date(req.body.disb_date) : new Date();
    let updatedata;
  try{

      if (req.body.paid_amount_single && req.body.paid_amount_single != 0 && req.body.remain_amount_single && req.body.remain_amount_single != 0) { 

                   updatedata = {
                      paid_amount : req.body.paid_amount_single,
                      remain_amount :req.body.remain_amount_single,
                      partialy_paid_on: instDate,
                      paid_on : instDate,
                      status : 2   // half payment done
                  }
      
      } else {
        if (req.body.remain_amount_single && req.body.remain_amount_single === +req.body.insst_amnt) { 
            updatedata = {
                paid_amount : req.body.paid_amount_single,
                remain_amount :req.body.remain_amount_single,
                partialy_paid_on: instDate,
                paid_on : instDate,
                status : 2   // half payment done
            }
        } else {
            updatedata = {
                paid_amount : req.body.partialy_update ? req.body.partialy_update : req.body.insst_amnt,
                remain_amount : 0,
                paid_on : instDate,
                status : 1 // full payment done
            }
        }
           
      }

      //console.log( req.body.inst_id , updatedata,'there....');

      const installment = await Installment.findByIdAndUpdate(req.body.inst_id, updatedata, {
          new: true, // Return the updated document
      });

    
      if(installment) {
          const randomString = generateRandomString(4);
          res.json({success : req.body.inst_id+'-'+randomString , message:"Update Installment Successfully"});
      } else {
          res.json({success : false , message:'internal error'});
      }

  
  }catch(e) {
      res.json({success : false , message:e.message});
  }
  
}

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }
    return result;
}