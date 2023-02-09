const productModel = require("../models/productModel");

const { isValidObjectId } = require('mongoose');
const { isValidAlpha, isValidPrice, isValidImage, trimData, isValidDesc } = require("../validations/validator");
const { uploadFile } = require('../middlewares/middleware');


//===============================Create API==========================================================//

const createProduct = async (req, res) => {
  try {
    let productData = req.body;
    trimData(productData);
    let { title, description, price, currencyId, currencyFormat, isFreeShipping, productImage, availableSizes, style, installments, ...others } = productData
    if (Object.keys(productData).length == 0) return res.status(400).send({ status: false, message: "Please provide product details to create a product" })
    if (Object.keys(others).length != 0) { return res.status(400).send({ status: false, message: `Please remove ${Object.keys(others)} key` }) }


    if (!title) return res.status(400).send({ status: false, message: "please provide title" })

    if (!isValidAlpha(title)) return res.status(400).send({ status: false, message: "please provide valid title" })

    if (!description) return res.status(400).send({ status: false, message: "please provide description" })
    if (!isValidDesc(description)) return res.status(400).send({ status: false, message: "please provide valid description" })
    if (!price) return res.status(400).send({ status: false, message: "please provide price" })
    if (!isValidPrice(price)) return res.status(400).send({ status: false, message: "please provide valid price" })
    productData.price = parseFloat(price).toFixed(2);
    if (isFreeShipping && !['true', 'false'].includes(isFreeShipping)) return res.status(400).send({ status: false, message: 'please enter isFreeshipping value either true or false' });
    if (isFreeShipping == "") return res.status(400).send({ status: false, message: "please enter boolean value in isFreeshipping" })
    if (!currencyId) return res.status(400).send({ status: false, message: "please provide currencyId" })
    if (currencyId != "INR") return res.status(400).send({ status: false, message: 'please enter a valid currencyId, it must be INR' })
    if (installments == "") return res.status(400).send({ status: false, message: 'please enter a valid installments' });

    if (!currencyFormat) return res.status(400).send({ status: false, message: "please provide currencyFormat" })
    if (currencyFormat != "₹") return res.status(400).send({ status: false, message: 'please enter a valid currencyFormat, it must be ₹' })

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
    //if(!trimData(isFreeShipping))

    let checkUniqueTitle = await productModel.findOne({ title: title })
    if (checkUniqueTitle) return res.status(400).send({ status: false, message: `Title ${checkUniqueTitle.title} is already present` })

    productImage = req.files;
    if (!isValidImage(productImage[0].originalname)) return res.status(400).send({ status: false, message: 'image format is invalid, please enter image in a valid format' });
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
    let data = req.query;
    let { size, name, priceGreaterThan, priceLessThan, priceSort, ...rest } = data;
    if (Object.keys(rest).length > 0) return res.status(400).send({ status: false, message: `please remove extra key` })
    let conditions = { isDeleted: false }
    if (data.priceSort) {
      data.priceSort = data.priceSort.trim();
      if (!["1", "-1"].includes(data.priceSort)) { return res.status(400).send({ status: false, message: "Please enter a valid sort order between 1 or -1" }) }
    };

    if (Object.keys(data).length == 0) {
      let getProducts = await productModel.find(conditions)
      if (getProducts.length == 0) return res.status(404).send({ status: false, message: "No products found" });
      return res.status(200).send({ status: true, message: "Success", data: getProducts })
    };

    if (data.size) {
      dataArr = data.size.split(',');
      for (i in dataArr) {
        dataArr[i] = dataArr[i].trim().toUpperCase();
      };
      for (i of dataArr) {
        if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(i)) return res.status(400).send({ status: false, message: "please enter a valid  size" })
      };
      conditions.availableSizes = { $in: dataArr }
    };

    if (data.name) {
      data.name = data.name.trim();
      conditions.title = { $regex: data.name, $options: 'i' }
    };


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

const updateProduct = async (req, res) => {
  try {
    let productId = req.params.productId
    let updateProductData = req.body
    let { title, description, price, currencyId, currencyFormat, isFreeShipping, productImage, availableSizes, style, installments, ...others } = updateProductData
    trimData(updateProductData)
    if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: `${productId} is invalid` })

    if (Object.keys(others).length != 0) { return res.status(400).send({ status: false, message: `Please remove ${Object.keys(others)} key` }) }
    if (title) {
      if (!isValidAlpha(title)) return res.status(400).send({ status: false, message: "please provide valid title" })
      if (!trimData(title)) return res.status(400).send({ status: false, message: 'please enter a valid title' })
    }
    if (description) {
      if (!isValidAlpha(description)) return res.status(400).send({ status: false, message: "please provide valid description" })
      if (description == '') return res.status(400).send({ status: false, message: 'description must not be empty' })
    }
    if (price)
      if (!isValidPrice(price)) return res.status(400).send({ status: false, message: "please provide valid description" })

    if (currencyId && currencyId != "INR") {
      updateProductData.currencyId = "INR"
    }
    updateProductData.updatedAt = Date.now()
    if (currencyFormat && currencyFormat != "₹") {
      updateProductData.currencyFormat = "₹"
    }
    if (availableSizes) {
      availableSizes = availableSizes.split(",")
      let arrOfSize = []
      for (i of availableSizes) {
        i = i.trim()
        if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(i)) return res.status(400).send({ status: false, message: "please provide availableSizes in [S, XS, M, X, L, XXL, XL]" })
        if (!arrOfSize.includes(i)) {
          arrOfSize.push(i.trim())
        }
      }
      updateProductData.availableSizes = arrOfSize
    }

    if (productImage) {
      productImage = req.files;
      if (Object.keys(productImage).length == 0) return res.status(400).send({ status: false, message: "Please upload Product Image" });
      if (req.files.length > 1) return res.status(400).send({ status: false, message: "cannot upload more than one image" })


      let image = await uploadFile(productImage[0]);
      updateProductData.productImage = image;
    }
    const product = await productModel.findOne({ title: title });
    if (product) return res.status(409).send({ status: false, message: 'please enter a unique title to update a product' });
    let updatedProduct = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, { $set: updateProductData }, { new: true })

    if (!updatedProduct) return res.status(404).send({ status: false, message: `productId ${productId} does not exist` })
    res.status(200).send({ status: true, message: "Success", data: updatedProduct })

  } catch (err) {
    return res.status(500).send({ status: false, message: err.message })
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

module.exports = { createProduct, getFilteredProduct, getProductById, updateProduct, deleteProductById }