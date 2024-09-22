const { default: mongoose } = require("mongoose");
const Installment = require("../models/installment");


exports.updateInstallment = async (req,res) => {
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

    // try {
    //     $date = $request->disb_date ? Carbon::parse($request->disb_date) : Carbon::now();
    //     if ($request->paid_amount_single && $request->paid_amount_single != 0 && $request->remain_amount_single && $request->remain_amount_single != 0) {
  
    //       $updatedata = [
    //         "paid_amount" => $request->paid_amount_single,
    //         "remain_amount" => $request->remain_amount_single,
    //         "partialy_paid_on" => $date,
    //         "paid_on" => $date,
    //         "status" => 2 // half payment done
    //       ];
    //     } else {
    //       $updatedata = [
    //         "paid_amount" => $request->partialy_update ? $request->partialy_update : $request->insst_amnt,
    //         "remain_amount" => 0,
    //         "paid_on" => $date,
    //         "status" => 1 // full payment done
    //       ];
    //     }
    //     MemberInstallment::where('id', $request->inst_id)->update($updatedata);
    //    // $install = MemberInstallment::where('id', $request->inst_id)->first();
    //     return response()->json(['success' => $request->inst_id.'-'.time(), 'meassage' => "Update Installment Successfully"]);
    //   } catch (Exception $e) {
    //     return response()->json(['success' => false, 'message' => "Internal error please try later !"]);
    //   }
    
}

