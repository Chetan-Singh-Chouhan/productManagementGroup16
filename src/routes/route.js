const express = require('express');
const router = express.Router();

const {createUser, userLogin, userProfile} = require('../controller/userController');


router.post("/register", createUser);
router.post('/login', userLogin);
router.get('/user/:userId/profile', userProfile);
module.exports = router;