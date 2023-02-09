const { isValidObjectId } = require('mongoose')
const userModel = require('../models/userModel')
const cartModel = require('../models/cartModel')
const orderModel = require("../models/orderModel")
const { findOneAndDelete } = require('../models/userModel')


//=============================================Create Cart ==============================================//
const createOrder = async (req,res)=>{
    try{
        let userId = req.params.userId;
        if(!isValidObjectId(userId)) return res.status(400).send({status:false,message:'invalid userId'});

        let data = req.body;
        if(Object.keys(data).length==0) return res.status(400).send({status:false, message:'please give some data'});

        let {cartId,cancellable,status,...a} = data;
        if(Object.keys(a).length!=0) return res.status(400).send({status:false, message:'remove unnecessary key'});

        if(!cartId) return res.status.send({status:false, message:'cartId required'});
        cartId=String(cartId)
        if(!isValidObjectId(cartId)) return res.status(400).send({status:false, message:'invalid cartId'});

        if(cancellable){
            if(cancellable!=true&&cancellable!=false) return res.status(400).send({status:false,message:'only true or false are allowed in cancellable key'});
        }else{
            cancellable = true;
        }

        if(status){
            status = status.trim();
            if(status !="pending") return res.status(400).send({status:false, message:'can only give pending status'});
        }else{
            status = "pending"
        }
         let userExist= await userModel.findOne({_id:userId})
         if(!userExist) return res.status(404).send({status:false, message:"user not found"})

        let cart = await cartModel.findOne({_id:cartId}).select({_id:0,items:1,totalItems:1,totalPrice:1,totalQuantity:1}).lean()
        if(!cart) return res.status(404).send({status:false, message:'cart not found'});
        if(cart.items.length==0) return res.status(404).send({status:false, message:"No item in cart"})
            let value=0
        for(let i=0; i<cart.items.length; i++){
            value+=cart.items[i].quantity
        }
   

        let obj={...cart,userId:userId,...data,totalQuantity:value}
    
        await cartModel.findOneAndUpdate({_id:cartId},{items:[],totalItems:0,totalPrice:0})
         let order = await orderModel.create(obj);

         res.status(201).send({status:true, message:"Success",data:order});
         
    }catch(err){
        res.status(500).send({status:false, message:err.message})
    }
}


const updateOrder = async (req, res) => {
    try {
        let userId = req.params.userId;
        if(!isValidObjectId(userId)) return res.send('invalid userId')

        let data = req.body;
        if (Object.keys(data).length == 0) return res.status(400).send({status: false, message: 'give status to update'})

        let { orderId, status, ...a } = data;
        if (Object.keys(a).length != 0) return res.status(400).send({status: false, message: 'please remove unnecessary fields'})

        if (!orderId) return res.send('orderId required');
         orderId=String(orderId)
        if (!isValidObjectId(orderId)) return res.status(400).send({status: false, message: 'invalid orderId'})

        if (!status) return res.send('status required');
        status = status.trim()
        if (!["pending", "completed", "cancled"].includes(status)) return res.status(400).send({status: false, message: 'can only give pending, completed, cancelled'});

        let user = await userModel.findOne({ _id: userId })
        if (!user) return res.status(404).send({status: false, message: 'no user found with given userId'});

        let order = await orderModel.findOne({ _id: orderId, userId: userId, isDeleted: false });
        if (!order) return res.status(404).send({status: false, message: 'order not found with given orderId'});

        if (status == "cancled") {
            if (order.cancellable == false) return res.status(400).send({status: false, message: 'order is not cancellable'})
        }
        let updatedOrder = await orderModel.findByIdAndUpdate(orderId, { status: status }, { new: true });
        res.status(200).send({status: true, message: 'order updated', data: updatedOrder})

    } catch (err) {
        res.status(500).send({status: false, message: err.message})
    }
}

module.exports = { createOrder, updateOrder }
