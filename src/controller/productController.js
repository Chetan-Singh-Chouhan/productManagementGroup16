const productModel = require("../models/productModel")
const aws = require("aws-sdk");
const { isValidObjectId } = require('mongoose')
const {isValidAlpha,isValidPrice} = require("../validations/validator")

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

//===============================Create API==========================================================//

const createProduct = async (req, res) => {
  try {
    let productData = req.body;

    if (Object.keys(productData).length == 0) return res.status(400).send({ status: false, message: "Please provide product details to create a product" })

    let { title, description, price, currencyId, currencyFormat, isFreeShipping, productImage, availableSizes, style, installments, ...others } = productData

    if (!title) return res.status(400).send({ status: false, message: "please provide title" })
    if (!isValidAlpha(title)) return res.status(400).send({ status: false, message: "please provide valid title" })

    if (!description) return res.status(400).send({ status: false, message: "please provide description" })
    if (!isValidAlpha(description)) return res.status(400).send({ status: false, message: "please provide valid description" })
     console.log(req.body)
    if (!price) return res.status(400).send({ status: false, message: "please provide price" })
    if (!isValidPrice(price)) return res.status(400).send({ status: false, message: "please provide valid price" })
    productData.price = parseFloat(price).toFixed(2);

    if (!currencyId) return res.status(400).send({ status: false, message: "please provide currencyId" })
    if (currencyId && currencyId != "INR") {
      productData.currencyId = "INR"
    }

    if (!currencyFormat) return res.status(400).send({ status: false, message: "please provide currencyFormat" })
    if (currencyFormat && currencyFormat != "₹") {
      productData.currencyFormat = "₹"
    }

    if (!availableSizes) return res.status(400).send({ status: false, message: "please provide availableSizes" })
    availableSizes = availableSizes.split(",")
    let arrOfSize = []
    for (i of availableSizes) {
      if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(i.trim())) return res.status(400).send({ status: false, message: "please provide availableSizes in [S, XS, M, X, L, XXL, XL]" })
      if (!arrOfSize.includes(i)) {
        arrOfSize.push(i.trim())
      }
    }

    productData.availableSizes = arrOfSize

    if (Object.keys(others).length != 0) { return res.status(400).send({ status: false, message: `Please remove ${Object.keys(others)} key` }) }

    let checkUniqueTitle = await productModel.findOne({ title: title })
    if (checkUniqueTitle) return res.status(400).send({ status: false, message: `Title ${checkUniqueTitle.title} is already present` })

    productImage = req.files;
    if (Object.keys(productImage).length == 0) return res.status(400).send({ status: false, message: "Please upload Product Image" });
    if (req.files.length > 1) return res.status(400).send({ status: false, message: "cannot upload more than one image" })
    let image = await uploadFile(productImage[0]);
    productData.productImage = image;

    let productCreated = await productModel.create(productData)
    res.status(201).send({ status: true, message: "Success", data: productCreated })

  } catch (err) {
    res.status(500).send({ status: false, message: err.message })
  }
}
//=====================================================  getProduct by Filter Api  ===================================//
const getFilteredProduct = async function (req, res) {
  try {
    let data = req.query
    let conditions = { isDeleted: false }
    if (data.priceSort) {
      if (!["1", "-1"].includes(data.priceSort) < 0) { return res.status(400).send({ status: false, message: "Please enter a valid sort order between 1 or -1" }) }
    }

    if (Object.keys(data).length == 0) {
      let getProducts = await productModel.find(conditions)
      if (getProducts.length == 0) return res.status(404).send({ status: false, message: "No products found" });
      return res.status(200).send({ status: true, message: "Success", data: getProducts })
    }

    

    if (data.size) {
      data.size = data.size.toUpperCase();
      if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(data.size)) return res.status(400).send({ status: false, message: "please enter a valid  size" })
      conditions.availableSizes = { $in: data.size }
    }

    if (data.name) { conditions.title = { $regex: data.name, $options: 'i' } }


    if (data.priceGreaterThan || data.priceLessThan) {

      if (data.priceGreaterThan && data.priceLessThan) {
        if (!isValidPrice(data.priceGreaterThan) || !isValidPrice(data.priceLessThan)) return res.status(400).send({ status: false, message: "Enter a valid price to get your product" })
        conditions.price = { $gt: data.priceGreaterThan, $lt: data.priceLessThan }
      }
      else if (data.priceGreaterThan) {
        if (!isValidPrice(data.priceGreaterThan)) return res.status(400).send({ status: false, message: "Enter a valid price to get your product" })
        conditions.price = { $gt: data.priceGreaterThan }
      }
      else {
        if (!isValidPrice(data.priceLessThan)) return res.status(400).send({ status: false, message: "Enter a valid price to get your product" })
        conditions.price = { $lte: data.priceLessThan }
      }
    }


    let getFilterProduct = await productModel.find(conditions).sort({ price: data.priceSort })
    if (getFilterProduct.length == 0) return res.status(404).send({ status: false, message: "No products found" });

    res.status(200).send({ status: true, message: "Success", data: getFilterProduct })
  }
  catch (err) {
    
    res.status(500).send({ status: false, error: err.message });
  }
}
//=======================================  getProduct By ID ==================================//
const getProductById = async function (req, res) {
  try {
    const productId = req.params.productId
    if (!isValidObjectId(productId))
      return res.status(400).send({ status: false, message: "Please Enter valid Object Id" });
    const getProductDetail = await productModel.findOne({ _id: productId, isDeleted: false })
    if (!getProductDetail)
      return res.status(404).send({ status: false, message: "Product Not Found or already deleted" });
    res.status(200).send({ status: true, message: 'Success', data: getProductDetail });

  }
  catch (err) {
    res.status(500).send({ status: false, error: err.message });
  }
}

//=======================================  updateProductBY Id  ===========================================//

const updateProduct= async (req,res)=>{
  try{
  let productId=req.params.productId
  let updateProductData=req.body
  
  //if(Object.keys(updateProductData).length==0) return res.status(400).send({status:false, message:"Please provide product details to update product"})

  if(!isValidObjectId(productId)) return res.status(400).send({status:false, message:`${productId} is invalid`})
       
  let {title,description,price,currencyId,currencyFormat,isFreeShipping,productImage,availableSizes,style,installments,...others}=updateProductData
  //console.log(availableSizes.trim())
  if(title)
  if(!isValidAlpha(title)) return res.status(400).send({status:false, message:"please provide valid title"})
  if(description)
  if(!isValidAlpha(description)) return res.status(400).send({status:false, message:"please provide valid description"})
  if(price)
  if(!isValidPrice(price)) return res.status(400).send({status:false, message:"please provide valid description"})
  
  if(currencyId&&currencyId!="INR"){
    updateProductData.currencyId="INR"
  }

  if(currencyFormat&&currencyFormat!="₹"){
    updateProductData.currencyFormat="₹"
  }
  if(availableSizes){
  availableSizes=availableSizes.split(",")
  let arrOfSize=[]
  for(i of availableSizes){
     i=i.trim()
    if(!["S","XS","M","X","L","XXL","XL"].includes(i)) return res.status(400).send({status:false, message:"please provide availableSizes in [S, XS, M, X, L, XXL, XL]"})
    if(!arrOfSize.includes(i)) {
     arrOfSize.push(i.trim())
     }
  }
  updateProductData.availableSizes=arrOfSize
}
  
  if(productImage){
  productImage = req.files;
  if (Object.keys(productImage).length == 0) return res.status(400).send({ status: false, message: "Please upload Product Image" });
  if(req.files.length>1) return res.status(400).send({status:false, message:"cannot upload more than one image"})

  if (Object.keys(others).length!=0) { return res.status(400).send({ status:false, message:`Please remove ${Object.keys(others)} key` }) }
   
  let image = await uploadFile(productImage[0]);
  updateProductData.productImage = image;
  }
  
  let updatedProduct= await  productModel.findOneAndUpdate({_id:productId, isDeleted:false},{$set:updateProductData},{new:true})
  
  if(!updatedProduct) return res.status(400).send({status:false, message:`productId ${productId} does not exist`})
  res.status(201).send({status:true, message:"Success", data:updatedProduct})
      
   }catch(err){
      return res.status(500).send({status:false, message:err.message})
  }
}

//=============================================  DeleteProduct By ID===========================//
const deleteProductById = async function (req, res) {
  try {
    const productId = req.params.productId
    if (!isValidObjectId(productId))
      return res.status(400).send({ status: false, message: "Please Enter valid Object Id" });
    const isProductExist = await productModel.findOne({ _id: productId, isDeleted: false }).count()
    if (isProductExist == 0)
      return res.status(404).send({ status: false, message: "Product Not Found or already deleted" });
    await productModel.findByIdAndUpdate(productId, { $set: { isDeleted: true } }, { new: true })
    return res.status(200).send({ status: true, message: "Product has been Deleted" });
  }
  catch (err) {
    res.status(500).send({ status: false, error: err.message });
  }
}

module.exports = { createProduct, getFilteredProduct, getProductById,updateProduct, deleteProductById }