const express = require('express');
const router = express.Router();
const { isValidObjectId } = require('mongoose')

const { createUser, userLogin, userProfile, updateUser } = require('../controller/userController');
const { createProduct, getFilteredProduct, getProductById, updateProduct, deleteProductById } = require('../controller/productController');
const { updateCart, createCart, getCart, deleteCartById } = require("../controller/cartController")
const { authentication, authorization } = require("../middlewares/middleware")


router.post("/register", createUser);
router.post('/login', userLogin);
router.get('/user/:userId/profile', authentication, userProfile);
router.put('/user/:userId/profile', authentication, authorization, updateUser)
//product api's
router.post('/products', createProduct);
router.get('/products', getFilteredProduct);
router.get('/products/:productId', getProductById)
router.put('/products/:productId', updateProduct)
router.delete('/products/:productId', deleteProductById)
//card API
router.post("/users/:userId/cart", authentication, authorization, createCart)
router.put("/users/:userId/cart", authentication, authorization, updateCart)
router.get("/users/:userId/cart", authentication, authorization, getCart)
router.delete('/users/:userId/cart', authentication, authorization, deleteCartById)

module.exports = router;