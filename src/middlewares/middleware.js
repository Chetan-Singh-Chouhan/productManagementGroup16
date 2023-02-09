const userModel = require("../models/userModel")
const jwt = require('jsonwebtoken');
const { isValidObjectId } = require('mongoose')
const aws = require("aws-sdk");

const authentication = async function (req, res, next) {
    try {
        let bearerHeader = req.headers.authorization

        if (!bearerHeader) return res.status(400).send({ status: false, message: "please provide token in headers" })
        let bearerToken = bearerHeader.split(" ")

        let token = bearerToken[1]


        jwt.verify(token, "group16", function (err, decoded) {
          if (err) return res.status(401).send({status: false, message: err.message});
          req.userId = decoded.userId;
          next()

        })


    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }

}

const authorization = async function (req, res, next) {
    let data = req.params.userId
    if (!isValidObjectId(data)) return res.status(400).send({ status: false, message: "please provide valid user Id" })
    let authUser = await userModel.findOne({ _id: data })
    if (!authUser) return res.status(404).send({ status: false, message: "user not found" })
    let validUser = authUser._id.toString()
    if (req.userId == validUser) {
        next()
    }
    else {
        return res.status(403).send({ status: false, message: "You are not authorized" })
    }
};

aws.config.update({
    accessKeyId: "AKIAY3L35MCRZNIRGT6N",
    secretAccessKey: "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",
    region: "ap-south-1",
  });
  
  let uploadFile = async (file) => {
    return new Promise(function (resolve, reject) {
      let s3 = new aws.S3({ apiVersion: "2006-03-01" });
  
      var uploadParams = {
        ACL: "public-read",   //Access Control Locator
        Bucket: "classroom-training-bucket",
        Key: "abc/" + file.originalname,
        Body: file.buffer,
      };
  
      s3.upload(uploadParams, function (err, data) {
        if (err) {
          return reject({ error: err });
        }
        console.log("file uploaded succesfully");
        return resolve(data.Location);
      });
    });
  };

module.exports = { authentication, authorization, uploadFile }