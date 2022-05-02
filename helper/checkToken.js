const jwt = require("jsonwebtoken")
const connection = require("../config/database")
const moment = require('moment-timezone');

const checkDriverToken = async (req, res, next) => {
    try {
        const token = req.header("token")
        if(!token){
            return res.status(400).json({
                error: "No token provided",
                success: false
            })
        }
        let driver_table = "drivers"

        const date = moment.utc()
        const tz = 'America/New_York';
        const day = date.tz(tz).format('dddd')

        if(day === "Friday"){
            driver_table = "drivers_f"
        }
        
        const decoded = jwt.verify(token,process.env.JWT_SECRET_KEY)
        const QUERY = `SELECT * FROM ${driver_table} WHERE ID = "${decoded._id}" AND is_deleted = false`
        connection.query(QUERY, (error,data) => {
            if(data.length === 0){
                return res.status(400).json({
                    error: "User not found with this token",
                    success: false
                })
            }else if(decoded.role !== 2){
                return res.status(400).json({
                    error: "Unauthorized",
                    success: false
                }) 
            }else{
                   next()
            }
        })
    } catch (error) {
        return res.status(400).json({
            error: error.message,
            success: false
        })
    }
} 

const checkSuperAdminToken = async (req, res, next) => {
    try {
        const token = req.header("token")
        if(!token){
            return res.status(400).json({
                error: "No token provided",
                success: false
            })
        }

        const decoded = jwt.verify(token,process.env.JWT_SECRET_KEY)
        const QUERY = `SELECT * FROM drivers WHERE ID = "${decoded._id}" AND IS_DELETED = false`
        connection.query(QUERY, (error,data) => {
                if(data && data.length === 0){
                    return res.status(400).json({
                        error: "Superadmin not found with this token",
                        success: false
                    })
                }else if(decoded.role !== 1){
                    return res.status(400).json({
                        error: "Unauthorized",
                        success: false
                    })
                }else{
                    next()
                }
            })
    } catch (error) {
        return res.status(400).json({
            error: error.message,
            success: false
        })
    }
}

module.exports = {
    checkDriverToken,
    checkSuperAdminToken
}
