const Customer = require("../Schema/customer");
const {messager} = require("./sender")
const bcrypt = require("bcryptjs")

exports.createUser = async (req,res) => {
    const {image,password, name, mobile, email, dob, address, refer, diet} = req.body;

    const existUser = await Customer.findOne({EMAIL:email});
    if(existUser) {
        return res.status(409).json({status:"Already user exist"})
    }

    // if(existUser.PHONE == mobile) {
    //     return res.status(409).json({status:"Phone number already exist"})
    // }

    let nowDate = new Date()

    let ID = await Customer.countDocuments();

    let encPwd = bcrypt.hashSync(password,5);

    try {
        const user = await Customer({
            ID: ID+1,
            IMAGE_PATH: image,
            NAME: name,
            PHONE: mobile,
            EMAIL: email,
            DOB: dob,
            ADDRESS: address,
            REFERENCE: refer,
            CREATED_DATE: nowDate,
            CREATED_BY:"",
            PASSWORD:encPwd,
            LAST_MODIFIED_DATE:null,
            LAST_MODIFIED_BY:null,
            GYM_PROFILE_ID:1,
            STATUS:1
        });

        user.save().
        then((data) => {
            if(diet){
                let msg = `Hello ${user.NAME},
                
                Welcome aboard! Your account registration was successful. To kickstart your fitness journey, here’s your personalized diet plan: ${diet}. Let's achieve your goals together!
                
                Cheers,
                Titanfitnessstudio`
                messager(msg,mobile,"diet plan");
            }
            return res.json({status:"created",userID:ID+1}).status(200)
        }).
        catch((err) => {
            return res.json({status:"not created", err: err}.status(301));
        })
    }
    catch(err){
        return res.json({status:"error", err: err})
    }
}

exports.userList = async(req,res) => {
    try {
        const User = await Customer.find({});
        return res.status(200).json({users: User});
    }
    catch(err) {
        return res.status(500).json({status:"Something went wrong", error: err});
    }
}

exports.user = async(req,res) => {
    const {userID} = req.params;
    try {
        const User = await Customer.findOne({_id:userID});
        if(!User) {
            return res.status(404).json({user:"User not found"})
        }
        return res.status(200).json({user:User})
    }
    catch(err) {
        return res.status(500).json({error:err})
    }
}

exports.userSearch = async(req,res) => {
    let {customerID, name, mobile, dob, memberID} = req.query;

    if(memberID) {
        const User = await Customer.findOne({ID:memberID});
        if(!User) 
            return res.status(404).json({user:"Not found"})
        return res.status(200).json({user:User})
    }

    if(!name && !mobile && !dob) {
        const User = await Customer.find()
        return res.status(200).json({user:User})
    }

    customerID = customerID ? customerID : ''
    name = name ? name : '/^(?!)$/'
    mobile = mobile ? mobile : '/^(?!)$/'
    dob = dob ? dob : null

    try {
        console.log(name,mobile,dob)
        const User = await Customer.find({
            $or: [ 
                {DOB: dob},
                {NAME: {$regex: name}}, 
                {PHONE: {$regex: mobile}}
            ]
        })
        if(!User) {
            return res.status(404).json({user: "User not found"})
        }
        return res.status(200).json({user:User})
    }
    catch(err) {

    }
}

exports.nonactive = async(req,res) => {
    const {userID} = req.body;
    const user = await Customer.findOne({_id:userID});
    if(!user) 
        return res.status(404).json({status:"User not found."})
    if(user?.STATUS == 0) 
        return res.status(406).json({status:`User ${user.NAME} has already been non-active`});
    await Customer.findOneAndUpdate({_id:userID},{STATUS:0}).then(async (user) => {
        let msg = `Hi ${user.NAME},

We noticed that your payment is pending. To avoid any disruption to your access, please complete your payment as soon as possible. Until then, your account is temporarily inactivated.

Thank you,
Titanfitnessstudio
        `
        await messager(msg, user.PHONE, "non-active")
        return res.json({status:`User ${user.NAME} has been non-active. And send a notification.`})
    });
}

exports.active = async(req,res) => {
    const {userID} = req.body;
    const user = await Customer.findOne({_id:userID});
    if(user?.STATUS == 1) 
        return res.status(406).json({status:`User ${user.NAME} has already been active.`});
    await Customer.findOneAndUpdate({_id:userID},{STATUS:1}).then(async (user) => {
        await messager("Your gym account has been active now. You can enjoy our gym services.", user.PHONE, "active")
        return res.json({status:`User ${user.NAME} has been active now. You can enjoy our gym services.`})
    });
}