const jwt = require("jsonwebtoken")

const generateToken = (role,id) => {
    let jwtSecretKey = process.env.JWT_SECRET_KEY;
    const data = {
        role: role,
        _id: id
    }
    const token = jwt.sign(data, jwtSecretKey);
  
    return token
}

module.exports = {
    generateToken
}