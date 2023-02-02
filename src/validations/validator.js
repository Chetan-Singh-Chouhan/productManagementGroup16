const validName = (name) => /^[a-zA-Z ]{3,20}$/.test(name);
const validMail = (mail) => /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(mail);
const validNumber = (number) => (/^[6-9]{1}?[0-9]{9}$/).test(number);
const validPin = (pin) => (/^[1-9]{1}?[0-9]{5}$/).test(pin);
const validStreet = (street) => /^[a-zA-Z0-9 ]{3,20}$/.test(street);
const validCity = (city) => /^[a-zA-Z ]{3,20}$/.test(city);
const passwordValidator = require('password-validator');
const validPassword = new passwordValidator();
validPassword
    .is().min(8)
    .is().max(15)
    .has().uppercase()
    .has().lowercase()
    .has().digits()
    .has().symbols()
    .not().spaces();
module.exports = {validName, validMail, validNumber, validPin, validStreet, validCity, validPassword}