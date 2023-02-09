const validName = (name) => /^[a-zA-Z ]{3,20}$/.test(name);
const validMail = (mail) => /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(mail);
const validNumber = (number) => (/^[6-9]{1}?[0-9]{9}$/).test(number);
const validPin = (pin) => (/^[1-9]{1}?[0-9]{5}$/).test(pin);
const validStreet = (street) => /^[a-zA-Z0-9._ ]{3,20}$/.test(street);
const validCity = (city) => /^[a-zA-Z ]{3,20}$/.test(city);
const isValidAlpha = function (value) {
    if (value.match(/^([a-z A-Z0-9]){2,50}$/)) return true
}
const isValidDesc = (data) => /^[a-zA-Z0-9., ]{3,}$/.test(data);

const trimData = function(value) { //function to check entered data is valid or not
    if (typeof value == 'undefined' || value == null) return false;
    if (typeof value == 'string' && value.trim().length === 0) return false;
    return true;
}

const isValidPrice = function (value) {
    return (/^(?:0|[1-9]\d*)(?:\.(?!.*000)\d+)?$/).test(value)
}

let isValidImage = (value) => /\.(gif|jpe?g|tiff?|png|webp|bmp|jpeg)$/i.test(value)

const passwordValidator = require('password-validator');
const validPassword = new passwordValidator();
validPassword
    .is().min(8)
    .is().max(15)
    .not().spaces();
module.exports = { validName, validMail, validNumber, validPin, validStreet, validCity, isValidAlpha, isValidPrice,isValidImage,trimData, validPassword, isValidDesc }
