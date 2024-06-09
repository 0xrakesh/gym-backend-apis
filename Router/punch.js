const mongoose = require("mongoose")
const punch = require("../Schema/punch")
const Customer = require("../Schema/customer")
const {messager} = require("./sender")

exports.intime = async(req,res) => {
    let now = new Date();
    const {id} = req.body;
    const user = await Customer.findOne({ID:id});
    if(!user) {
        return res.status(404).json({status:"User not found."})
    }

    let a = new Date();
    let dateString = `${a.getUTCFullYear()}-${(a.getUTCMonth() + 1).toString().padStart(2, "0")}-${a.getUTCDate().toString().padStart(2, "0")}`;
    let date = new Date(dateString);

    let Checking = await punch.findOne({CUSTOMER_PROFILE_ID:id, IN_TIME: {$lte: a, $gte: date}, CREATED_DATE: {$lte: a, $gte: date}})

    if(Checking)
        return res.json({status:"You already punch in for today."});


    const UserPunch = new punch({
        CUSTOMER_PROFILE_ID: id,
        CUSTOMER_NAME:user.NAME,
        PHONE:user.PHONE,
        IN_TIME: now,
        OUT_TIME:null,
        SLOT:"",
        PHONE:user.PHONE,
        CREATED_BY:"",
        CREATED_DATE: now
    });
    UserPunch.save().
    then(() => {
        a = new Date()
        let hours = a.getHours() + 5 + parseInt((a.getMinutes+30)/60);
        let min = (a.getMinutes() + 30)%60;
        let msg = `Hi ${user.NAME},
        Great to see you! You’ve punched in for your workout session at ${hours}:${min}. Remember, you have 1 hour to crush your goals. Let’s make it count!
    
        Keep pushing,
        Titanfitnessstudio`
        messager(msg,user.PHONE,'in time entry message.')
        return res.status(200).json({status:"In time entried."})
    }).
    catch(() => {
        return res.status(500).json({status:"Internal Server Error"})
    })
}

exports.outTime = async(req,res) => {
    const {id} = req.body;
    let a = new Date();
    const user = await Customer.findOne({ID:id});
    if(!user) {
        return res.status(302).json({status:"User id not found"})
    }
    let dateString = `${a.getUTCFullYear()}-${(a.getUTCMonth() + 1).toString().padStart(2, "0")}-${a.getUTCDate().toString().padStart(2, "0")}`;
    let date = new Date(dateString);

    let Checking = await punch.findOne({CUSTOMER_PROFILE_ID:id, IN_TIME: {$lte: a, $gte: date}, CREATED_DATE: {$lte: a, $gte: date}})
    if(!Checking) {
        return res.status(404).json({status:`In time not found for this user ${id}`})
    }

    if(Checking) {
        if(Checking.OUT_TIME !== null) {
            return res.status(301).json({status:`Out time already exist for this user ${id}`})
        }
    }

    await punch.findOneAndUpdate({CUSTOMER_PROFILE_ID:id, IN_TIME: {$lte: a, $gte: date}},{OUT_TIME:a},{new:true}).
    then((data) => {
        let msg = `Punch out from the gym at ${a.getHours()}:${a.getMinutes()}.
        
        Keep pushing,
        Titalfitnessstudio`
        // messager(msg,user.PHONE,'in time entry message.')
        return res.status(200).json({status:"Out Time Entry"})
    }).
    catch((err) => {
        return res.status(500).json({status:"Internal Server Error",error:err})
    });

}

exports.getIn = async(req,res) => {
    const userId = req.query.userId;
    let today = new Date();
    try {
        if(userId) {
            let timing = await punch.findOne({CUSTOMER_PROFILE_ID:userId,
                $expr: {
                    $and: [
                        { $eq: [{ $dayOfMonth: "$CREATED_DATE" }, today.getDate()] },
                        { $eq: [{ $month: "$CREATED_DATE" }, today.getMonth() + 1] },
                        { $eq: [{ $year: "$CREATED_DATE"}, today.getUTCFullYear()]}
                    ]
                }
            },{OUT_TIME:0});
            if(timing===null)
                timing = [];
            return res.status(200).json({timing:timing});
        }
        let timing = await punch.find({
            $expr: {
                $and: [
                    { $eq: [{ $dayOfMonth: "$CREATED_DATE" }, today.getDate()] },
                    { $eq: [{ $month: "$CREATED_DATE" }, today.getMonth() + 1] },
                    { $eq: [{ $year: "$CREATED_DATE"}, today.getUTCFullYear()]}
                ]
            }
        },{OUT_TIME:0})
        return res.status(200).json({timing: timing});
    }
    catch(err) {
        console.log(err)
        return res.status(500).json({status:"Internal Server Error",error:err})
    }
}

exports.getOut = async(req,res) => {
    const userId = req.query.userId;
    let today = new Date();
    try {
        if(userId) {
            let timing = await punch.findOne({CUSTOMER_PROFILE_ID:userId,
                $expr: {
                    $and: [
                        { $eq: [{ $dayOfMonth: "$CREATED_DATE" }, today.getDate()] },
                        { $eq: [{ $month: "$CREATED_DATE" }, today.getMonth() + 1] },
                        { $eq: [{ $year: "$CREATED_DATE"}, today.getUTCFullYear()]}
                    ]
                }
            });
            if(timing===null)
                timing = [];
            return res.status(200).json({timing:timing});
        }
        let timing = await punch.find({
            $expr: {
                $and: [
                    { $eq: [{ $dayOfMonth: "$CREATED_DATE" }, today.getDate()] },
                    { $eq: [{ $month: "$CREATED_DATE" }, today.getMonth() + 1] },
                    { $eq: [{ $year: "$CREATED_DATE"}, today.getUTCFullYear()]}
                ]
            }
        })
        return res.status(200).json({timing: timing});
    }
    catch(err) {
        return res.status(500).json({status:"Internal Server Error"})
    }
}
