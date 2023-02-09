const userModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { isValidObjectId } = require('mongoose')
const { validName, validMail, validNumber, validPin, validCity, validStreet, isValidImage, validPassword, trimData } = require('../validations/validator');
const { uploadFile } = require('../middlewares/middleware');

//========================================Create User==================================================================//
const createUser = async function (req, res) {
    try {
        let body = req.body;

        // validations --
        // trimData(body);
        if (Object.keys(body).length == 0) return res.status(400).send({ status: false, message: 'please enter all required details to register a user' });
        let { fname, lname, email, phone, profileImage, password, address, ...rest } = req.body;
        if (Object.keys(rest).length > 0) return res.status(400).send({ status: false, message: `please remove unnecessary key` });
        if (!fname) return res.status(400).send({ status: false, message: 'fname is required, please enter fname to register a user' });
        if (!validName(fname)) return res.status(400).send({ status: false, message: 'fname is invalid, please enter a valid fname to register a user' });
        if (!lname) return res.status(400).send({ status: false, message: 'lname is required, please enter lname to register a user' });
        if (!validName(lname)) return res.status(400).send({ status: false, message: 'lname is invalid, please enter a valid lname to register a user' });
        if (!email) return res.status(400).send({ status: false, message: 'email is required, please enter email to register a user' });
        if (!validMail(email)) return res.status(400).send({ status: false, message: 'email is invalid, please enter a valid email' });
        if (!phone) return res.status(400).send({ status: false, message: 'phone number is required, please enter phone number to register a user' });
        if (!validNumber(phone)) return res.status(400).send({ status: false, message: 'phone number is invalid, please enter a valid phone number to register a user' });
        if (!password) return res.status(400).send({ status: false, message: 'password is required, please enter password to register a user' });
        if (!validPassword.validate(password)) return res.status(400).send({ status: false, message: 'password is weak, please enter a strong password to register a user' });

        address = JSON.parse(address);
        if (!address) return res.status(400).send({ status: false, message: 'address is required, please enter address to register a user' });
        if (typeof address != 'object') return res.status(400).send({ status: false, message: 'address format is invalid, please enter address in a valid format' });
        const { shipping, billing } = address;
        if (!shipping) return res.status(400).send({ status: false, message: 'shipping address is required, please enter shipping address' });
        if (typeof shipping != 'object') return res.status(400).send({ status: false, message: 'shipping address format is invalid, please enter shipping address in a valid format' });
        if (!billing) return res.status(400).send({ status: false, message: 'billing address is required, please enter billing address' });
        if (typeof billing != 'object') return res.status(400).send({ status: false, message: 'billing address format is invalid. please enter billing address in a valid format' });
        const sStreet = shipping.street;
        const sCity = shipping.city;
        const sPincode = shipping.pincode;
        const bStreet = billing.street;
        const bCity = billing.city;
        const bPincode = billing.pincode;
        if (!sStreet) return res.status(400).send({ status: false, message: 'street is required for shipping address' });
        if (!validStreet(sStreet)) return res.status(400).send({ status: false, message: 'street is invlaid for shipping address, please enter a valid street name or number' });
        if (!sCity) return res.status(400).send({ status: false, message: 'city name is required for shipping address' });
        if (!validCity(sCity)) return res.status(400).send({ status: false, message: 'city name is invalid for shipping address, please enter a valid city name' });
        if (!sPincode) return res.status(400).send({ status: false, message: 'pincode is required for shipping address' });
        if (!validPin(sPincode)) return res.status(400).send({ status: false, message: 'pincode is invalid for shipping address, please enter a valid pincode' });
        if (!bStreet) return res.status(400).send({ status: false, message: 'street is required for billing addresss' });
        if (!validStreet(bStreet)) return res.status(400).send({ status: false, message: 'street name is invalid for billing address, please enter a valid street name or number' });
        if (!bCity) return res.status(400).send({ status: false, message: 'city name is required for billing address' });
        if (!validCity(bCity)) return res.status(400).send({ status: false, message: 'city name is invalid for billing address, please enter a valid city name' });

        if (!validPin(bPincode)) return res.status(400).sned({ status: false, message: 'pincode is invalid for billing address, please enter a valid pincode' });
        body.address = address;
        // password hashing ----------------
        const saltRound = 5;
        bcrypt.hash(password, saltRound, function (err, hash) {
            body.password = hash;
        });

        // for unique email and phone -------------

        let user = await userModel.findOne({ $or: [{ email: email }, { phone: phone }] });
        if (user) {
            if (user.email == email)
                return res.status(409).send({ status: false, message: 'email already in use, please enter a unique email to register a user' });
            if (user.phone == phone)
                return res.status(409).send({ status: false, message: 'phone number is already in use, please enter a unique phone number to register a user' });
        };

        //creating link using aws------------------------
        profileImage = req.files;
        if (!isValidImage(profileImage[0].originalname)) return res.status(400).send({ status: false, message: 'please provide valid image file' });
        if (Object.keys(profileImage).length == 0) return res.status(400).send({ status: false, message: "Please upload Profile Image" });
        if (req.files.length > 1) return res.status(400).send({ status: false, message: "cannot upload more than one image" })

        let image = await uploadFile(profileImage[0]);

        body.profileImage = image;
        //-------------------------

        const userCreated = await userModel.create(body);
        res.status(201).send({ status: true, message: 'User created successfully', data: userCreated });

    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
};
//===================================================Login User========================================================//
const userLogin = async function (req, res) {
    try {
        const body = req.body;
        const { email, password } = body;
        if (!email) return res.status(400).send({ status: false, message: 'email is required, please enter email to login a user' });
        if (!password) return res.status(400).send({ status: false, message: 'password is required, please enter password to login a user' });
        const user = await userModel.findOne({ email: email });
        if (!user) return res.status(400).send({ status: false, message: 'email is incorrect' });
        //console.log(user.password);
        bcrypt.compare(password, user.password, function (err, result) {
            if (result) {
                let payload = { userId: user._id, iat: Date.now() }
                let token = jwt.sign(payload, "group16")
                let decodedToken = jwt.verify(token, "group16");
                let userId = decodedToken.userId
                //res.setHeader("x-api-key", token);
                res.status(200).send({ status: true, message: 'user logged in successfully', data: { userId: userId, token: token } })
            }
            else { return res.status(400).send({ status: false, message: 'password is incorrect' }) }
        })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
};
//==========================================================get User Profile===================================================//
const userProfile = async function (req, res) {
    try {
        let userId = req.params.userId
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Enter valid user Id " })
        let findUserDetails = await userModel.findById({ _id: userId })
        if (!findUserDetails) return res.status(404).send({ status: false, message: "user detail is not present " })
        return res.status(200).send({ status: true, message: 'User profile details', data: findUserDetails })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }

};

//=========================================================update User=======================================================
const updateUser = async function (req, res) {
    try {
        let userId = req.params.userId
        let data = req.body;
        trimData(data);
        let files = req.files
        const { fname, lname, email, phone, password, address, ...rest } = data;
        if (Object.keys(rest).length > 0) return res.status(400).send({ status: false, message: `please remove unnecessary key` });
        let updateData = {}
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "pls provide valid object" })
        let getUser = await userModel.findById({ _id: userId })
        if (!getUser) return res.status(404).send({ status: false, message: "user have no credentials" })

        if (files && files.length != 0) {

            let uploadFileUrl = await uploadFile(files[0]);
            updateData.profileImage = uploadFileUrl;
        }
        // else {
        //     return res.status(400).send({ status: false, message: "Profile Image can not be updated" });

        // }

        //const { validName, validMail, validNumber, validPin, validCity, validStreet, validPassword }


        if (fname) {
            if (!validName(fname) || fname == " ") return res.status(400).send({ status: false, message: "pls provide valid full name" })

            updateData.fname = fname
        }
        if (lname) {
            if (!validName(lname || lname == " ")) return res.status(400).send({ status: false, message: "pls provide valid last name" })
            updateData.lname = lname
        }

        // for unique email and phone -------------

        let user = await userModel.findOne({ $or: [{ email: email }, { phone: phone }] });
        if (user) {
            if (user.email == email)
                return res.status(409).send({ status: false, message: 'email already in use, please enter a unique email to register a user' });
            if (user.phone == phone)
                return res.status(409).send({ status: false, message: 'phone number is already in use, please enter a unique phone number to register a user' });
        };
        if (email) {
            if (!validMail(email) || email == " ") return res.status(400).send({ status: false, message: "pls provide valid email" })
            updateData.email = email
        }

        if (phone) {
            if (!validNumber(phone) || phone == " ") return res.status(400).send({ status: false, message: "pls provide valid phone number" })
            updateData.phone = phone
        }


        if (password) {
            if (!validPassword.validate(password) || password == " ") return res.status(400).send({ status: false, message: "pls provide valid password" })
            //if (password.length < 8 || password.length > 15) return res.status(400).send({ status: false, message: "pls provide password in between of 8 to 15" })
            let saltRound = 10
            let hashPassword = await bcrypt.hash(password, saltRound)
            updateData.password = hashPassword
        }


        if (address) {
            addr = JSON.parse(address)
            // console.log(addr)
            // console.log(address)
            if (addr.shipping) {
                const { street, city, pincode } = addr.shipping
                //console.log(address.shipping)


                if (street) {
                    if (!validStreet(street) || street == " ") return res.status(400).send({ status: false, message: "pls provide valid street name" })
                    getUser.address.shipping.street = street

                }
                if (city) {
                    if (!validCity(city) || city == " ") return res.status(400).send({ status: false, message: "pls provide valid city name" })
                    getUser.address.shipping.city = city
                }
                if (pincode) {
                    if (!validPin(pincode) || pincode == " ") return res.status(400).send({ status: false, message: "pls provide valid pincode" })
                    getUser.address.shipping.pincode = pincode

                }
            }

            if (addr.billing) {
                const { street, city, pincode } = addr.billing
                if (street) {
                    if (!validStreet(street) || street == " ") return res.status(400).send({ status: false, message: "pls provide valid street name" })
                    getUser.address.billing.street = street
                }
                if (city) {
                    if (!validCity(city) || city == " ") return res.status(400).send({ status: false, message: "pls provide valid city name" })
                    getUser.address.billing.city = city
                }
                if (pincode) {
                    if (!validPin(pincode) || pincode == " ") return res.status(400).send({ status: false, message: "pls provide valid pincode" })
                    getUser.address.billing.pincode = pincode
                }

            }

            updateData["address"] = getUser.address
        }

        updateData.updatedAt = Date.now();
        console.log(updateData);
        let modifiedData = await userModel.findByIdAndUpdate({ _id: userId }, updateData, { new: true });
        return res.status(200).send({ status: true, message: "User profile updated", data: modifiedData });

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


module.exports = { createUser, userLogin, userProfile, updateUser };