const { default: mongoose } = require("mongoose");
const Center = require("../models/center");


exports.getAll = async (req,res) => {
    try{
       const data =  await Center.aggregate([
            {
                $lookup:{
                    from: "members",
                    localField: "_id",
                    foreignField: "center_id",
                    as: "memberInfo"
                },
             
            },
          
             {
                $addFields:{
                    members_count:{$size:"$memberInfo"}, 
                 
                  } 
        },
        {$unset:[ "memberInfo"]}
        ]);
    

        res.json({success : true , message:"All Centers" , allCenters:data});

    }catch(e) {
        res.json({success : false , message:e.message});
    }
    
}

exports.create = async (req,res) => {

    try{
        const center = new Center(req.body)
        const data = await center.save();
        res.json({success : true , message:"Create Successfully" , center:data});

    }catch(e) {
        res.json({success : false , message:e.message});
    }
    
}

exports.getSingle = async (req,res) => {
    
    const id = req.params.id;
    let aggreGateData = [     
        {  
       $match: { 
           _id: new mongoose.Types.ObjectId(id) ,
           
       }
        },
       {
           $lookup:{
               from: "members",
               localField: "_id",
               foreignField: "center_id",
               as: "members"
           },
        
       }, 
   ];

    if (req.params.name) {
        const name =  req.params.name;
        const regex = new RegExp(name, 'i');
        aggreGateData = [...aggreGateData ,  {
            $project: {
              centers: "$$ROOT", 
              members: {
                $filter: {
                  input: "$members",
                  as: "member", 
                  cond: { $regexMatch: { input: "$$member.mem_name", regex: regex } }
                }
              }
            }
          },
          {
            $project: {
              _id: "$centers._id", 
              center_name: "$centers.center_name",
              members: 1 // Include the filtered members array
            }
          },];
    }


    try{
       
        const data =  await Center.aggregate(aggreGateData);

        res.json({success : true , message:"Single Center" , center:data[0]});

    }catch(e) {
        res.json({success : false , message:e.message});
    }
    
}



exports.deleteData = async (req,res) => {
    const id = req.params.id;
    try{ 
        const data = await Center.findByIdAndDelete(id, {new:true});
        res.json({success : true , message:"Center deleted" , center:data});

    }catch(e) {
        res.json({success : false , message:e.message});
    }
    
}

exports.getCenterByName = async (req,res) => {
    
    const center =  req.params.center;
    const regex = new RegExp(center, 'i');
    
    try{
        const data = await Center.aggregate([
            {
                $match:{ center_name: { $regex: regex } } // Match names containing "abn"
            },
            {
                $lookup:{
                    from: "members",
                    localField: "_id",
                    foreignField: "center_id",
                    as: "memberInfo"
                },
             
            },
          
             {
                $addFields:{
                    members_count:{$size:"$memberInfo"}, 
                 
            } 
        },
        {$unset:[ "memberInfo"]}
        ]);
        
        res.json({success : true , message:"All Center" , allCenters:data});

    }catch(e) {
        res.json({success : false , message:e.message});
    }
    
}