const userModel = require("../models/userModel")
const jwt = require('jsonwebtoken');
const { isValidObjectId } = require('mongoose')
const authentication = async function (req, res, next) {
    try {
        let bearerHeader = req.headers.authorization

        if (!bearerHeader) return res.status(400).send({ status: false, message: "pls provide token in headers" })
        let bearerToken = bearerHeader.split(" ")

        let token = bearerToken[1]


        let decodedToken = jwt.verify(token, "group16")
        req.userId = decodedToken.userId;

        next()

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }

}

const authorization = async function (req, res, next) {
    let data = req.params.userId
    if (!isValidObjectId(data)) return res.status(400).send({ status: false, message: "pls provide valid user Id" })
    let authUser = await userModel.findOne({ _id: data })
    if (!authUser) return res.status(404).send({ status: false, message: "user not found" })
    let validUser = authUser._id.toString()
    if (req.userId == validUser) {
        next()
    }
    else {
        return res.status(403).send({ status: false, message: "user are not authorized" })
    }
}

module.exports = { authentication, authorization }