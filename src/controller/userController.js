
const userModel = require("../models/userModel.js");
const validator = require("../validations/validator")

const bcrypt = require ('bcrypt');

const createLogin = async function(req,res){
    try
    {
        let data = req.body

    const {email,password} =data
    if(Object.keys(files).length) return res.status(400).send({status:false,message:"pls provide data in body"})
    if(!email) return res.status(400).send({status:false,message:"pls provide email in body"})
    if(!validator.isValidEmailid) return res.status.send({status:false,message:"pls provide valid email Id"})
    if(!password) return res.status(400).send({status:false,message:"pls provide password in body"})
    if(!validator.isValidPassword) return res.status(400).send({status:false,message:"pls provide valid password"})

    let loginUser = await userModel.findOne({email:email,password:password})
    if(!loginUser) return res.status(400).send({status:false,message:"invalid login credential"})
    let hash = loginUser.password
    let decryptPassowrd = await bcrypt.compare(password,hash,(err,hash)=>{
        if(err) {
            return res.status(400).send({status:false,message:"password is not correct"})
        }

    })
    let payload = {userId:findUser._id,iat:Date.now()}
    let token = jwt.sign(payload,"group16")
    let decodedToken = jwt.verify(token,"group16");
    let userId = decodedToken.userId
    res.setHeader("x-api-key",token);
    return res.status(200).send({status:false,data:userId,token})
}
catch(error){
    return res.status(500).send({status:false,message:error.message})
}
    





}








module.exports = { }
