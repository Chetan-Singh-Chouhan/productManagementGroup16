const express = require('express');
const router = express.Router();
const { isValidObjectId } = require('mongoose')

const {createUser, userLogin, userProfile,updateUser} = require('../controller/userController');
const {createProduct, getFilteredProduct, getProductById,updateProduct,deleteProductById} = require('../controller/productController');
const {authentication,authorization}=require("../middlewares/middleware")


router.post("/register", createUser);
router.post('/login', userLogin);
router.get('/user/:userId/profile',authentication, userProfile);
router.put('/user/:userId/profile',authentication,authorization, updateUser)
//product api's
router.post('/products', createProduct);
router.get('/products',getFilteredProduct);
router.get('/products/:productId',getProductById)
router.put('/products/:productId',updateProduct)
router.delete('/products/:productId',deleteProductById)
module.exports = router;