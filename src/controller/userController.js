const userModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {isValidObjectId} = require('mongoose')
const {validName, validMail, validNumber, validPin, validCity, validStreet, validPassword} = require('../validations/validator');
const aws = require("aws-sdk");


//---------aws config---------------------
aws.config.update({
    accessKeyId: "AKIAY3L35MCRZNIRGT6N",
    secretAccessKey: "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",
    region: "ap-south-1"
})
const uploadFile = async (file) => {
    return new Promise (function (resolve, reject) {
        const s3 = new aws.S3({ apiVersion: '2006-03-01'});
        const uploadParams = {
            ACL: "public-read",
            Bucket: "classroom-training-bucket",
            Key: "/chetan" + file.originalname,
            Body: file.buffer

        }
        console.log(uploadParams)
        s3.upload(uploadParams, function (err, data) {
            if (err) {
                return reject({ "error": err })
            }
            console.log("-> ", data)
            console.log("file uploaded succesfully")
            return resolve(data.Location)
        })
    })
}
//----------------------------------------------------------
const createUser = async function (req, res) {
    /*try {*/
        let body = req.body;
        
        // validations --
        if (Object.keys(body).length == 0) return res.status(400).send({status: false, message: 'please enter all required details to register a user'});
        let { fname, lname, email, phone, profileImage,password } = req.body;
        console.log(fname)
        if (!fname) return res.status(400).send({ status: false, message: 'fname is required, please enter fname to register a user' });
        if (!validName(fname)) return res.status(400).send({ status: false, message: 'fname is invalid, please enter a valid fname to register a user' });
        if (!lname) return res.status(400).send({ status: false, message: 'lname is required, please enter lname to register a user' });
        if (!validName(lname)) return res.status(400).send({ status: false, message: 'lname is invalid, please enter a valid lname to register a user' });
        if (!email) return res.status(400).send({ status: false, message: 'email is required, please enter email to register a user' });
        if (!validMail(email)) return res.status(400).send({ status: false, message: 'email is invalid, please enter a valid email' });
        if (!phone) res.status(400).send({ status: false, message: 'phone number is required, please enter phone number to register a user' });
        if (!validNumber(phone)) res.status(400).send({ status: false, message: 'phone number is invalid, please enter a valid phone number to register a user' });
        //if (!profileImage) return res.status(400).send({ status: false, message: 'profile image is required, please enter profile image to register a user' });
        //if (!profileImage) return res.status(400).send({ status: false, message: 'profile image is invalid, please enter a valid profile image to register a user' });
        if (!password) return res.status(400).send({ status: false, message: 'password is required, please enter password to register a user' });
        if (!validPassword.validate(password)) return res.status(400).send({ status: false, message: 'password is weak, please enter a strong password to register a user' });

        const address = JSON.parse(body.address);
        if (!address) return res.status(400).send({ status: false, message: 'address is required, please enter address to register a user' });
        if (typeof address != 'object') return res.status(400).send({ status: false, message: 'address format is invalid, please enter address in a valid format' });
        const { shipping, billing } = address;
        if (!shipping) return res.status(400).send({ status: false, message: 'shipping address is required, please enter shipping address' });
        if (typeof shipping != 'object') return res.status(400).send({ status: false, message: 'shipping address format is invalid, please enter shipping address in a valid format' });
        if (!billing) return res.status(400).send({ status: false, message: 'billing address is required, please enter billing address' });
        if (typeof billing != 'object') return res.status(400).send({ status: false, message: 'billing address format is invalid. please enter billing address in a valid format' });
        const sStreet = shipping.street;
        const sCity = shipping.city;
        const sPincode = shipping.pincode;
        const bStreet = billing.street;
        const bCity = billing.city;
        const bPincode = billing.pincode;
        if (!sStreet) return res.status(400).send({ status: false, message: 'street is required for shipping address' });
        if (!validStreet(sStreet)) return res.status(400).send({ status: false, message: 'street is invlaid for shipping address, please enter a valid street name or number' });
        if (!sCity) return res.status(400).send({ status: false, message: 'city name is required for shipping address' });
        if (!validCity(sCity)) return res.status(400).send({ status: false, message: 'city name is invalid for shipping address, please enter a valid city name' });
        if (!sPincode) return res.status(400).send({ status: false, message: 'pincode is required for shipping address' });
        if (!validPin(sPincode)) return res.status(400).send({ status: false, message: 'pincode is invalid for shipping address, please enter a valid pincode' });
        if (!bStreet) return res.status(400).send({ status: false, message: 'street is required for billing addresss' });
        if (!validStreet(bStreet)) return res.status(400).send({ status: false, message: 'street name is invalid for billing address, please enter a valid street name or number' });
        if (!bCity) return res.status(400).send({ status: false, message: 'city name is required for billing address' });
        if (!validCity(bCity)) return res.status(400).send({ status: false, message: 'city name is invalid for billing address, please enter a valid city name' });

        if (!validPin(bPincode)) return res.status(400).sned({ status: false, message: 'pincode is invalid for billing address, please enter a valid pincode' });
        body.address = address;
        // password hashing ----------------
        const saltRound = 5;
        bcrypt.hash(password, saltRound, function (err, hash) {
            body.password = hash;
        });

        // for unique email and phone -------------
        let user = {};
        user = await userModel.findOne({ email: email })
        if (user) return res.status(409).send({ status: false, message: 'email already in use, please enter a unique email to register a user' });
        user = await userModel.findOne({ phone: phone });
        if (user) return res.status(409).send({ status: false, message: 'phone number is already in use, please enter a unique phone number to register a user' });
        //creating link using aws------------------------
        profileImage = req.files;
        if (Object.keys(profileImage).length == 0) return res.status(400).send({ status: false, message: "Please upload Profile Image" });
    
        let image = await uploadFile(profileImage[0]);

        body.profileImage = image;
        //-------------------------
       
        const userCreated = await userModel.create(body);
        res.status(201).send({ status: true, message: 'User created successfully', data: userCreated });
        // creating a user --------------------
        // body.address = address;
        
    /*} catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }*/
};

const userLogin = async function (req, res) {
    try {
        const body = req.body;
        const { email, password } = body;
        if (!email) return res.status(400).send({ status: false, message: 'email is required, please enter email to login a user' });
        if (!password) return res.status(400).send({ status: false, message: 'password is required, please enter password to login a user' });
        const user = await userModel.findOne({ email: email });
        if (!user) return res.status(400).send({status: false, message: 'email is incorrect'});
        console.log(user.password);
        bcrypt.compare(password, user.password, function (err, result) {
            if (result) {
            res.status(200).send({ status: true, message: 'user logged in successfully' })}
            else {return res.status(400).send({ status: false, message: 'password is incorrect' })}
        })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
};

const userProfile = async function(req,res){
    try{
    let userId = req.params.userId
    if(!isValidObjectId(userId)) return res.status(400).send({status:false,message:"Enter valid user Id "})
    let findUserDetails= await userModel.findById({_id:userId})
    if(!findUserDetails) return res.status(404).send({status:false,message:"user detail is not present "})
    return res.status(200).send({status:true,data:findUserDetails})
}
catch(error){
    return res.status(500).send({status:false,message:error.message})
}
    
};


module.exports = { createUser, userLogin, userProfile };