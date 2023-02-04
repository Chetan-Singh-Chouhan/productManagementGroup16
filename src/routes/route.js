const express = require('express');
const router = express.Router();
const { isValidObjectId } = require('mongoose')

const {createUser, userLogin, userProfile,updateUser} = require('../controller/userController');
const {authentication,authorization}=require("../middlewares/middleware")


router.post("/register", createUser);
router.post('/login', userLogin);
router.get('/user/:userId/profile',authentication, userProfile);
router.put('/user/:userId/profile',authentication,authorization, updateUser)
module.exports = router;