const { default: mongoose } = require("mongoose");
const Admin = require("../models/admin");
const Center = require("../models/center");
const Installment = require("../models/installment");
const Member = require("../models/member");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');


exports.login = async (req,res) => {
    try{
        const data = await Admin.findOne(
            { email: req.body.email });
        
        if(data && bcrypt.compareSync(req.body.password , data.password)) {
            const token = jwt.sign({email:req.body.email},'admin-secerete');
            data.token = token;
            await data.save();
            res.json({success : true , message:"Login successfully",token:token});
        } else {
            res.json({success : false , message:"Invalid credentials" });
        }
        
    }catch(e) {
        res.json({success : false , message:e.message});
    }
    
}

exports.register = async (req,res) => {
    try{
        const admin = new Admin({
            name:"Amit",
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password , 10)
        });

        await admin.save();
        res.json({success : true , message:"Register successfully"});
        
    }catch(e) {
        res.json({success : false , message:e.message});
    }
    
}

exports.logout = async (req,res) => {
    try{
    
        res.json({success : true , message:"Logout successfully"});
        
    }catch(e) {
        res.json({success : false , message:e.message});
    }
    
}

exports.dashboardData = async (req,res) => {
  try {
    const monthNames = [
        "Jan", "Feb", "Mar", "Apr",
        "May", "June", "July", "August",
        "Sep", "Oct", "Nov", "Dec"
      ];
    
    const collectionArray = [];
    const disbursMentArray = [];
    const collectionData = await getCollection(req,res);
    const disbursmentData = await getDisbursment(req,res);
    const demandOdData = await getDemandOdData(req,res);
   
    const centers = await Center.find();
    const members = await Member.find();

    collectionData.forEach((item) => {
        collectionArray.push({name:monthNames[item.month-1] , collection : item.total ,num: item.month});
    });
    disbursmentData.forEach((item) => {
        disbursMentArray.push({name:monthNames[item.month-1] , disbursment : item.total ,num: item.month});
    });

     const testArray = [];

    if(!collectionArray.length) {
        disbursMentArray.forEach((item) => {
            item.collection = 0 ;
            testArray.push(item.num);
        });
    } else {
        collectionArray.forEach((item) => {
            disbursMentArray.forEach((ineerItem) => {
                
                if(!testArray.includes(ineerItem.num)) {
                    if(item.num === ineerItem.num) {
                        ineerItem.collection = item.collection;
                    }else {
                       
                        ineerItem.collection = 0 ;
                    }
                    testArray.push(ineerItem.num);
                }
            });
        });

        disbursMentArray.forEach((item) => {
            collectionArray.forEach((ineerItem) => {
                
                if(!testArray.includes(ineerItem.num)) {
                    if(item.num === ineerItem.num) {
                        ineerItem.disbursment = item.disbursment;
                    }else {
                        ineerItem.disbursment = 0 ;
                    }
                    testArray.push(ineerItem.num);
                }
            });
           
        });

        Array.prototype.push.apply(disbursMentArray,collectionArray);
    }

 

    for (let i=1; i <= 12; i++) {
        if (!testArray.includes(i)) {
            disbursMentArray.push( {name :  monthNames[i-1] , disbursment : 0, collection :  0, num : i });
        } 
      }


      disbursMentArray.sort(function(a, b) {
        let keyA = a.num;
         let keyB = b.num;
        
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
      });

    //console.log(disbursMentArray , 'assememem');

      res.json({success : true, centers : centers, members : members, map : disbursMentArray , demandData : demandOdData});
  } catch(err) {
    res.json({success : false, message:err.message});
  }
    
}


const getCollection  = async( req,res) => {
    const year_filter = req.query.year_filter;
    let matchInner = {         
        paid_on: { $ne: null },
        $expr: {
            $eq: [{ $year: "$paid_on" }, +year_filter] 
        }
    }

    let matchData = {
        $match: matchInner
    }

    let groupbyData =  {
        $group: {
            _id: { $month: "$paid_on" },
            total: { $sum: "$paid_amount" }
        }
    }


    let aggregateData = [matchData , groupbyData , {
        $project: {
            _id: 0,
            month: "$_id",
            total: "$total",
        }
    }];
 
    if(req.query.c != "ALL") {
        const centerId = new mongoose.Types.ObjectId(req.query.c);
         lookupData =  {
            $lookup: {
                from: "members",
                localField: "member_id",
                foreignField: "_id", 
                as: "member_info" 
            }
        }

        unwindData = {
            $unwind: "$member_info"
        }

        matchInner = {...matchInner , "member_info.center_id": centerId }

        matchData =  {
            $match: matchInner
        }


        aggregateData = [
            lookupData,
            unwindData,
            matchData,
            groupbyData,
             {
                $project: {
                    _id: 0, // Exclude _id
                    month: "$_id",
                    total: "$total",
                }
            }
            
        ];

    }

    if(req.query.m != "ALL") {
        const memberId = new mongoose.Types.ObjectId(req.query.m);
        matchInner = {...matchInner , "member_id": memberId }

        matchData =  {
            $match: matchInner
        }

        aggregateData = [
            lookupData,
            unwindData,
            matchData,
            groupbyData,
             {
                $project: {
                    _id: 0, // Exclude _id
                    month: "$_id",
                    total: "$total",
                }
            }
            
        ];

    }
    try{

        const collection = await Installment.aggregate(aggregateData);
       
        return collection;
        
    }catch(e) {
        res.json({success : false , message:e.message});
    }
}
const getDisbursment  = async( req,res) => {
    const year_filter = req.query.year_filter;
   

    let matchInner = {
        disb_date: { $ne: null },
        $expr: {
            $eq: [{ $year: "$disb_date" }, +year_filter] 
        }
    }
  
    let matchData = {
        $match: matchInner
    }

    if(req.query.c != "ALL") {
        const centerId = new mongoose.Types.ObjectId(req.query.c);
        matchInner = {...matchInner , 
            center_id : centerId
        }
         matchData = {
            $match: matchInner
        }
    }

    if(req.query.m != "ALL") {
        const memberId = new mongoose.Types.ObjectId(req.query.m);
        matchInner = {...matchInner , 
            _id : memberId
        }
         matchData = {
            $match: matchInner
        }
    }

    const aggregateData = [
        matchData
        ,
        {
            $group: {
                _id: { $month: "$disb_date" } ,
                total: { $sum: "$disb_amount" }
              
            }
        },

        {
            $project: {
                _id:0,
                month: "$_id", // Project the month
                total: "$total",
            }
        },

    ];

    try{
        const disbursment = await Member.aggregate(aggregateData);
        return disbursment;
        
    }catch(e) {
        res.json({success : false , message:e.message});
    }


   
}

const getDemandOdData = async (req,res) =>{

    const monthNames = [
        "Jan", "Feb", "Mar", "Apr",
        "May", "June", "July", "August",
        "Sep", "Oct", "Nov", "Dec"
      ];

     const year_filter = req.query.year_filter;

    let matchInner = {
        due_date: { $ne: null }, // Ensure due_date is not null
        $expr: {
            $eq: [{ $year: "$due_date" }, +year_filter] // Filter for the year 2024
        }
    }
  
    let matchData = {
        $match: matchInner
    }

    let groupbyData = {
        $group: {
            _id: {
                month: { $month: "$due_date" }, // Group by month
                year: { $year: "$due_date" } // Include year in the grouping
            },
            demand: { $sum: "$inst_amount" }, // Sum of ins_amount
            od: { $sum: "$remain_amount" } // Sum of remain_amount
        }
    }

    let aggregateData = [matchData , groupbyData ,{
        $project: {
            month: "$_id.month", // Project the month
           // year: "$_id.year", // Project the year
            demand: 1, // Include the demand
            od: 1, // Include the od
            _id: 0 // Exclude the default _id field
        }
    },
    {
        $sort: { year: 1, month: 1 } // Sort by year and month
    }
];
 
    if(req.query.c != "ALL") {
        const centerId = new mongoose.Types.ObjectId(req.query.c);
         lookupData =  {
            $lookup: {
                from: "members",
                localField: "member_id",
                foreignField: "_id", 
                as: "member_info" 
            }
        }

        unwindData = {
            $unwind: "$member_info"
        }

        matchInner = {...matchInner , "member_info.center_id": centerId }

        matchData =  {
            $match: matchInner
        }

        aggregateData = [
            lookupData,
            unwindData,
            matchData,
            groupbyData,
            {
                $project: {
                    month: "$_id.month", // Project the month
                    year: "$_id.year", // Project the year
                    demand: 1, // Include the demand
                    od: 1, // Include the od
                    _id: 0 // Exclude the default _id field
                }
            },
            {
                $sort: { year: 1, month: 1 } // Sort by year and month
            }
            
        ];

     

    }
    if(req.query.m != "ALL") {
        const memberId = new mongoose.Types.ObjectId(req.query.m);
        matchInner = {...matchInner , "member_id": memberId }

        matchData =  {
            $match: matchInner
        }

        aggregateData = [
            lookupData,
            unwindData,
            matchData,
            groupbyData,
            {
                $project: {
                    month: "$_id.month", // Project the month
                    //year: "$_id.year", // Project the year
                    demand: 1, // Include the demand
                    od: 1, // Include the od
                    _id: 0 // Exclude the default _id field
                }
            },
            {
                $sort: { year: 1, month: 1 } // Sort by year and month
            }
            
        ];

    }

    try{
        const demandOd = await Installment.aggregate(aggregateData);
        const test = [];
        demandOd.forEach((item) => {
        item.name = monthNames[item.month-1];
           
            test.push(item.month);
        });

        for (let i=1; i <= 12; i++) {
            if (!test.includes(i)) {
                demandOd.push( {name :  monthNames[i-1] , demand : 0, od :  0, month : i });
            } 
          }
          
          demandOd.sort(function(a, b) {
            let keyA = a.month;
             let keyB = b.month;
            
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
          });

          //console.log(demandOd , 'ssssss');

        return demandOd;
        
    }catch(e) {
        res.json({success : false , message:e.message});
    }
}