const { isValidObjectId } = require('mongoose')

const orderModel = require("../models/orderModel")


//=============================================Create Cart ==============================================//
const createOrder = async (req,res)=>{
    try{
        let userId = req.params.userId;
        if(!isValidObjectId(userId)) return res.send('invalid userId');

        //if(req.decodedToken!= userId) return res.send('unauthorised');

        let data = req.body;
        if(Object.keys(data).length==0) return res.send('please give some data');

        let {cartId,cancellable,status,...a} = data;
        if(Object.keys(a).length!=0) return res.send('remove unnecessary key');

        if(!cartId) return res.send('cartId required');
        if(!isValidObjectId(cartId)) return res.send('invalid cartId');

        if(cancellable){
            if(cancellable!=true&&cancellable!=false) return res.send('only true or false allowed');
        }else{
            cancellable = true;
        }

        if(status){
            status = status.trim();
            if(!["pending", "completed", "cancled"].includes(status)) return res.send('can only give pending, completed, cancled');
        }else{
            status = "pending"
        }
         let userExist= await userModel.findOne({_id:userId})
         if(!userExist) return res.status(404).send({status:false, message:"user not found"})

        let cart = await cartModel.findOne({_id:cartId}).select({_id:0,items:1,totalItems:1,totalPrice:1,totalQuantity:1}).lean()
        if(!cart) return res.send('cart not found');
        if(cart.items.length==0) return res.send("No item in cart")
            let value=0
        for(let i=0; i<cart.items.length; i++){
            value+=cart.items[i].quantity
        }
        console.log(value)

        let obj={...cart,userId:userId,...data,totalQuantity:value}
        //console.log(obj)
        await cartModel.findOneAndUpdate({_id:cartId},{items:[],totalItems:0,totalPrice:0})
         let order = await orderModel.create(obj);

         res.send(order);
    }
    catch(err){
        res.send(err.message)
    }
}
const updateOrder = async (req, res) => {
    try {
        let userId = req.params.userId;
        if(!isValidObjectId(userId)) return res.send('invalid userId')
        if(userId!=req.decodedToken) return res.send("unauthorised")
        let data = req.body;
        if (Object.keys(data).length == 0) return res.send('give status to update')

        let { orderId, status, ...a } = data;
        if (Object.keys(a).length != 0) return res.send('only status can be updated');

        if (!orderId) return res.send('orderId required');
        if (!isValidObjectId(orderId)) return res.send('invalid orderId');

        if (!status) return res.send('status required');
        status = status.trim()
        if (!["pending", "completed", "cancled"].includes(status)) return res.send('can only give pending, completed, cancled');

        let user = await userModel.findOne({ _id: userId })
        if (!user) return res.send('user doesnot exist');

        let order = await orderModel.findOne({ _id: orderId, userId: userId, isDeleted: false });
        if (!order) return res.send('order not found');

        if (status == "cancled") {
            if (order.cancellable == false) return res.send('order is not cancelable')
        }
        let updatedOrder = await orderModel.findByIdAndUpdate(orderId, { status: status }, { new: true });
        res.send(updatedOrder)

    } catch (err) {
        res.send(err.message)
    }
}

module.exports = { createOrder, updateOrder }