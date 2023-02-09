const { isValidObjectId } = require('mongoose')
const userModel = require("../models/userModel")
const productModel = require("../models/productModel")
const cartModel = require("../models/cartModel")

//=============================================Create Cart ==============================================//
const createCart = async (req, res) => {
    try {
        let userId = req.params.userId;
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Invalid userId" });

        let { productId, cartId, ...others } = req.body;
        if (Object.keys(req.body).length == 0) return res.status(400).send({ status: false, message: "Please provide productId and cartId" })
        if (Object.keys(others).length != 0) return res.status(400).send({ status: false, message: `please remove ${object.keys(others)} key` });

        if (!productId) return res.status(400).send({ status: false, messsage: "Please provide productId" })
        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Invalid productId" });

        let checkUser = await userModel.findOne({ _id: userId });
        if (!checkUser) return res.status(404).send({ status: false, message: `User not found with ${userId} Id` });

        let checkProduct = await productModel.findOne({ _id: productId, isDeleted: false });
        if (!checkProduct) return res.status(404).send({ status: false, message: `product not with ${productId} Id` });

        if (cartId) {
            if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "Invalid cartId" });
            let checkGivenCartId = await cartModel.findById(cartId)
            if (!checkGivenCartId) return res.status(404).send({ status: false, message: `cart not found with ${cartId} Id` })
        }

        let checkCart = await cartModel.findOne({ userId: userId }).lean();

        if (!checkCart) {
            let final = {};
            final.userId = userId;
            final.items = [{ productId: productId, quantity: 1 }];
            final.totalPrice = checkProduct.price;
            final.totalItems = 1;
            let createdCart = await cartModel.create(final);
            return res.status(201).send({ status: true, message: "Success", data: createdCart });
        }

        if (checkCart) {
            for (let i = 0; i < checkCart.items.length; i++) {

                if (checkCart.items[i].productId == productId) {

                    checkCart.items[i].quantity += 1
                    checkCart.totalPrice += checkProduct.price

                    let addedItem = await cartModel.findOneAndUpdate({ _id: checkCart._id }, checkCart, { new: true });
                    return res.status(201).send({ status: true, message: "Success", data: addedItem })
                }
            }
            checkCart.items.push({ productId: productId, quantity: 1 })
            checkCart.totalPrice += checkProduct.price
            checkCart.totalItems += 1
            let addNewItem = await cartModel.findOneAndUpdate({ _id: checkCart._id }, checkCart, { new: true });
            return res.status(201).send({ status: true, message: "Success", data: addNewItem })
        }

    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}

//===========================================Update cart===================================================//

const updateCart = async (req, res) => {

    try {
        let userId = req.params.userId
        let { cartId, productId, removeProduct, ...others } = req.body

        if (Object.keys(req.body).length == 0) return res.status(400).send({ status: false, message: "Please provide productId,cartId,removeProduct" })
        if (Object.keys(others).length != 0) return res.status(400).send({ status: false, message: `please remove ${object.keys(others)} key` });

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "invalid user Id" })

        if (!cartId) return res.status(400).send({ status: false, message: "Please provide cartId" })
        if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "invalid cart_Id " })

        if (!productId) return res.status(400).send({ status: false, message: "Please provide productId" })
        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "invalid productId " })

        if (typeof (removeProduct) != "number") return res.status(400).send({ status: false, message: "please provide valid remove product" })
        if (removeProduct != 0 && removeProduct != 1) return res.status(400).send({ status: false, message: "please provide 0 or 1 in removeProduct" })

        let cartExist = await cartModel.findOne({ _id: cartId }).lean()
        if (!cartExist) return res.status(404).send({ status: false, message: "cartId doesn't exist" })

        let userExist = await userModel.findOne({ _id: userId })
        if (!userExist) return res.status(404).send({ status: false, message: "user doesn't exist" })

        let productExist = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!productExist) return res.status(404).send({ status: false, message: "product doesnot exist" })

        if (removeProduct == 0) {
            for (let i = 0; i < cartExist.items.length; i++) {
                if (cartExist.items[i].productId == productId) {
                    cartExist.totalPrice -= productExist.price * cartExist.items[i].quantity
                    cartExist.totalItems -= 1
                    cartExist.items.splice(i, 1)
                }
            }
            let upadatedProducts = await cartModel.findOneAndUpdate({ _id: cartId }, cartExist, { new: true })
            return res.status(200).send({ status: true, message: "Success", data: upadatedProducts })
        }
        if (removeProduct == 1) {
            for (let i = 0; i < cartExist.items.length; i++) {
                if (cartExist.items[i].productId == productId) {
                    if (cartExist.items[i].quantity > 1) {
                        cartExist.items[i].quantity -= 1
                        cartExist.totalPrice -= productExist.price
                        let upadatedProduct = await cartModel.findOneAndUpdate({ _id: cartId }, cartExist, { new: true })
                        return res.status(200).send({ status: true, message: "Success", data: upadatedProduct })
                    } cartExist.totalPrice -= productExist.price * cartExist.items[i].quantity
                    cartExist.totalItems -= 1
                    cartExist.items.splice(i, 1)
                    let upadatedProducts = await cartModel.findOneAndUpdate({ _id: cartId }, cartExist, { new: true })
                    return res.status(200).send({ status: true, message: "Success", data: upadatedProducts })
                }
            }
        }
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

//====================================get Cart =========================================================//

const getCart = async function (req, res) {
    try {
        let userId = req.params.userId;

        let cartDetails = await cartModel.findOne({ userId }).populate("items.productId")

        if (!cartDetails)
            return res.status(404).send({ status: false, message: "Cart not found" });

        return res.status(200).send({ status: true, message: "Cart details with Product details", data: cartDetails, });

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })

    }
}
//====================================delete Cart =========================================================//
const deleteCartById = async function (req, res) {
    try {
        const userId = req.params.userId
        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: "Please Enter valid Object Id" });
        const isUserExist = await userModel.findOne({ _id: userId }).count()
        if (isUserExist == 0)
            return res.status(404).send({ status: false, message: "User Not Found or already deleted" });
        await cartModel.findOneAndUpdate({ userId: userId }, { $set: { items: [], totalPrice: 0, totalItems: 0 } }, { new: true })
        return res.status(200).send({ status: true, message: "User's Cart has been Deleted" });
    }
    catch (err) {
        res.status(500).send({ status: false, error: err.message });
    }
}

module.exports = { updateCart, createCart, getCart, deleteCartById }