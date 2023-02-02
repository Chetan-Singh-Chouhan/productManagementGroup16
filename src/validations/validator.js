const isValidEmailid = function(email){
    let regexEmail=  /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return regexEmail.test(email)
}

const isValidPassword = function(password){
    let regexpassword = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/;
    return regexpassword.test(password)
}


module.exports={isValidEmailid,isValidPassword}