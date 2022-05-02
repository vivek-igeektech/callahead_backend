const moment = require('moment-timezone');
const GeoCodingFactory = require("@mapbox/mapbox-sdk/services/geocoding")
const connection = require("../config/database")
const {sendMail} = require("../services/sendMail")
const successMail = require("../utils/mail-template-success")
const failedMail = require("../utils/mail-template-failed")
const partiallyMail = require("../utils/mail-template-partially")
const axios = require("axios")

let accessToken = process.env.MAPBOXACCESSTOKEN;
const GeoCoding = GeoCodingFactory({accessToken});

const getRouteOfDriver = async (req, res) => {
    try {
        const id = req.query.id                      // Take driver ID from admin side
        if(!id){
            return res.status(400).json({
                error: "Please enter ID",
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

        const QUERY = `SELECT * FROM ${driver_table} WHERE ID = "${id}" AND IS_DELETED = false`              // Check driver exist or not
        connection.query(QUERY, (error,data) => {
            if(error){
                return res.status(400).json({
                    error: error.message,
                    success: false
                }) 
            }else if(data.length > 0){
                const driver = data[0]
                const routeNumber = driver.ROUTE                                               // Take driver's route_number for find route 
                const routeDay = driver.ROUTE_DAY                                               // Take driver's route_day for find route_day     
                
                const routeQuery = `SELECT * FROM jrtf01
                                    LEFT JOIN jcusf01 ON jrtf01.custnum = jcusf01.custnum 
                                    LEFT JOIN jcusf09 ON jrtf01.custnum = jcusf09.custnum
                                    LEFT JOIN routes ON jrtf01.routenum = routes.route_number AND jrtf01.stopnum = routes.stop_number AND routes.is_active = true
                                    WHERE
                                    jrtf01.routenum = "${routeNumber}" AND jrtf01.routeday = "${routeDay}" ORDER BY jrtf01.stopnum`

                    connection.query(routeQuery, async (error, route) => { // First find Route from jrtf01 --> then take customer from jrtf01 --> find customer info from jcusf01 and jcusf09 --> then find submitedRoute info from routes table 
                    
                    if(error){
                        return res.status(400).json({
                            error: error.message,
                            success: false
                        })
                    }else if(route.length > 0){   
                        let destructureData = route.map((e) => {
                            const {
                                id,routenum,routeday,stopnum,custnum,routecode,routeid,rtmemo,driver_id,route_number,customer_number,
                                route_day,stop_number,status,reason,GPS_screenshot,is_completed,created_at,updated_at,cocode,custmast,startdate,sitename,siteaddr,
                                siteaddr2,sitecity,sitestate,sitezip,sitephone,custmemo,map,maplat,maplong,email,email2,emaillst } = e
                            
                            return {
                                route:{                         // This destructuring is for route 
                                    id,routenum,routeday,stopnum,custnum,rtmemo,routecode,routeid
                                },
                                submited_route: {               // This destructuring is for submited_route 
                                    driver_id,route_number,customer_number,route_day,stop_number,status,reason,GPS_screenshot,is_completed,created_at,updated_at
                                },
                                customer : {                    // This destructuring is for customer 
                                    custnum,cocode,custmast,startdate,sitename,siteaddr,siteaddr2,sitecity,sitestate,sitezip,sitephone,custmemo,map,maplat,maplong,email,email2,emaillst
                                }
                            }
                        })
                        
                        const latAndfLong = destructureData.filter((f) => {
                            return (f.customer.maplat || f.customer.maplat) === ''
                        })
                        let query = ""
                        let latLong = ""
                        
                        const add = await Promise.allSettled(latAndfLong.map(async (a) => {      
                            query =  String(a.customer.siteaddr + " " + a.customer.siteaddr2 + "" +a.customer.sitecity + " " + a.customer.sitestate + " " + "USA" + " " + a.customer.sitezip),   // FInd lat and long from address
                            latLong = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${accessToken}`)
                            return {
                                ...a,
                                customer:{
                                    ...a.customer,
                                    maplat: latLong.data.features[0].center[1],                       // Set lat and long in old data
                                    maplong:latLong.data.features[0].center[0],
                                }
                            }
                        }))
                        
                        // const add = await Promise.allSettled(latAndfLong.map(async (a) => {         // FInd lat and long from address
                        //     const latLong = await GeoCoding.forwardGeocode({
                        //         query: String(a.customer.sitename + a.customer.siteaddr + a.customer.siteaddr2 + a.customer.sitecity + a.customer.sitestate),
                        //         limit:1
                        //       }).send()
                        //       return {
                        //           ...a,
                        //           customer:{
                        //               ...a.customer,
                        //               maplat: latLong.body.features[0].center[1],                       // Set lat and long in old data
                        //               maplong:latLong.body.features[0].center[0],
                        //           }
                        //       }
                        // }))

                        destructureData = destructureData.map((a)=>{                            // Set new object with old object
                            const exist = add.find((ad) => ad.value.route.custnum === a.route.custnum)
                            if(exist){
                                return exist.value
                            }else{
                                return a;
                            }
                        })

                        return res.status(200).json({
                            data: destructureData,
                            success: true
                        })
                    }else{
                        return res.status(400).json({
                            error: "Route not found for this driver",
                            success: false
                        })
                    }
                })
            }else{
                return res.status(400).json({
                    error: "Driver not found with this ID",
                    success: false
                })
            }
        })
    } catch (error) {
        return res.status(400).json({
            error: error.message,
            success: false
        })
    }
}

const submitRoute = async (req, res) => {
    try {
        const driverId = req.body.driver_id
        const customerId = req.body.customer_number
        const routeNumber = req.body.route_number
        const routeDay = req.body.route_day
        const status = req.body.status                                             // Take data from admin side for submit route
        const reason = req.body.reason
        const stopNumber = req.body.stop_number
        let GPSScreenshot = req.body.GPS_screenshot
        const createdAt = moment().format("YYYY-MM-DD HH:mm:ss")
        const updatedAt = moment().format("YYYY-MM-DD HH:mm:ss")
        let isCompleted;

        let driver_table = "drivers"

        const date = moment.utc()
        const tz = 'America/New_York';
        const day = date.tz(tz).format('dddd')

        if(day === "Friday"){
            driver_table = "drivers_f"
        }
        
        if(!driverId){
            return res.status(400).json({
                error: "Please enter driver_id",
                success: false
            })
        }

        if(!customerId){
            return res.status(400).json({
                error: "Please enter customer_number",                  
                success: false
            })
        }

        if(!routeNumber){
            return res.status(400).json({
                error: "Please enter route_number",                     // There are some mendatory field 
                success: false
            })
        }

        if(!routeDay){
            return res.status(400).json({
                error: "Please enter route_day",
                success: false
            })
        }

        if(!stopNumber){
            return res.status(400).json({
                error: "Please enter stop_number",
                success: false
            })
        }
        
        if(!status){
            return res.status(400).json({
                error: "Please enter status",
                success: false
            })
        }

        if(!(status && status === "success" || status === "pending") && !(reason)) {            // IF route status is not success and pending then driver have to give reason 
            return res.status(400).json({
                error: "Please enter reason",
                success: false
            })
        }

        if(((status === "success" || status === "failed" || status === "Partially Completed") && reason !== "Missed") &&  !(GPSScreenshot)) {            // IF route status is not success and pending then driver have to give reason 
            return res.status(400).json({
                error: "Please add GPS_screenshot",
                success: false
            })
        }
        
        if(status && status === "success"){
            isCompleted = true    
        }else{
            isCompleted = false
        }
        
        const checkDriverExistOrNot = `SELECT * FROM ${driver_table} WHERE ID = "${driverId}" AND ROLE = 2 AND IS_DELETED = false`
        connection.query(checkDriverExistOrNot, (error,driver) => {
            if(error){
                return res.status(400).json({
                    error: error.message,
                    success: false
                })
            }else if(driver.length > 0){
                const checkRouteExistORNot = `SELECT * FROM jrtf01 WHERE routenum = "${routeNumber}"`
                connection.query(checkRouteExistORNot, (error,route) => {
                    if(error){
                        return res.status(400).json({
                            error: error.message,
                            success: false
                        })
                    }else if(route.length > 0){
                        const checkCustomerExistORNot = `SELECT * FROM jcusf01 INNER JOIN jcusf09 ON jcusf01.custnum = jcusf09.custnum WHERE jcusf01.custnum = "${customerId}"`
                        connection.query(checkCustomerExistORNot, (error,customer) => {
                            if(error){
                                return res.status(400).json({
                                    error: error.message,
                                    success: false
                                })
                            }else if(customer.length > 0){
                                const checkRouteExistOrNot = `SELECT * FROM routes
                                                            WHERE
                                                            driver_id = "${driverId}" AND route_number = "${routeNumber}" AND customer_number = "${customerId}" AND route_day = "${routeDay}" AND stop_number = "${stopNumber}" AND is_completed = true`

                                connection.query(checkRouteExistOrNot, (error,data) => {            // Check route already submited or not
                                    if(error){
                                        return res.status(400).json({
                                            error: error.message,
                                            success: false
                                        })
                                    }else if(data.length > 0){
                                        return res.status(400).json({
                                            error: "Route already submited",
                                            success: false
                                        })
                                    }else{                                                          // Submite route
                                        const checkSubmitedRouteExistOrNot = `SELECT * FROM routes
                                        WHERE
                                        driver_id = "${driverId}" AND route_number = "${routeNumber}" AND customer_number = "${customerId}" AND route_day = "${routeDay}" AND stop_number = "${stopNumber}" AND is_active = true`

                                        connection.query(checkSubmitedRouteExistOrNot,(error,subData) => {
                                            if(error){
                                                return res.status(400).json({
                                                    error: error.message,
                                                    success: false
                                                })
                                            }else if(subData.length > 0){
                                                const updateData = `UPDATE routes SET is_active = false WHERE id = "${subData[0].id}"`
                                                connection.query(updateData,(error,updateDatas) => {
                                                    if(error){
                                                        return res.status(400).json({
                                                            error: error.message,
                                                            success: false
                                                        })
                                                    }
                                                })
                                            }
                                        })

                                        const QUERY = `INSERT INTO routes (driver_id,route_number,customer_number,route_day,stop_number,status,reason,GPS_screenshot,is_completed,created_at,updated_at)
                                                        VALUES
                                                        ("${driverId}","${routeNumber}","${customerId}","${routeDay}","${stopNumber}","${status}","${reason ? reason : ""}","${GPSScreenshot ? GPSScreenshot : ""}",${isCompleted},"${createdAt}","${updatedAt}")`
                                        
                                        connection.query(QUERY,async (error,data) => {
                                            if(error){
                                               return res.status(400).json({
                                                    error: error.message,
                                                    success: false
                                                })
                                            }else{
                                                const customerData = customer[0]                                          // Get customer address
                                                const driverPhoto = driver[0].PHOTO
                                                const driverName = driver[0].NAME
                                                const custSiteName = customerData.sitename ? customerData.sitename + ", " : "" + ""
                                                const custAddress = customerData.siteaddr ? customerData.siteaddr + ", " : "" + ""
                                                const custAddress2 = customerData.siteaddr2 ? customerData.siteaddr2 + ", " : "" + ""
                                                const custCityName = customerData.sitecity ? customerData.sitecity + ", " : "" + ""
                                                const custState = customerData.sitestate ? customerData.sitestate : ""
                                                const address = custSiteName + custAddress + custAddress2 + custCityName + custState       // Merge customer address data to make full address
                                                const custNum = customerData.custnum
                                                const date = moment.utc()
                                                const tz = 'America/New_York';
                                                const dateAndTime = date.tz(tz).format('dddd MMMM Do YYYY, h:mm a')
                                                
                                                if(customerData.email2){
                                                    if(status === "success"){
                                                        const message = {
                                                            to: customerData.email2,
                                                            subject: "Callahead Service Notification",
                                                            reason,
                                                            status,
                                                            successData: "Your Callahead Technician has successfully completed servicing your unit(s) at",
                                                            address,
                                                            dateAndTime,
                                                            driverName,
                                                            driverPhoto,
                                                            GPSScreenshot,
                                                            custNum
                                                        }
                                                        sendMail(message)
                                                    }else if(status === "failed" && (reason === "Locked" || reason === "Blocked" || reason === "Do Not Service requested by a person onsite")){
                                                        const message = {
                                                            to: customerData.email2,
                                                            subject: "Callahead Service Notification",
                                                            reason,
                                                            status,
                                                            successData: "Your Callahead Technician was unable to service your unit(s) at",
                                                            address,
                                                            dateAndTime,
                                                            driverName,
                                                            driverPhoto,
                                                            GPSScreenshot,
                                                            custNum
                                                        }
                                                        sendMail(message)
                                                    }else if(status === "Partially Completed" && (reason === "Locked" || reason === "Blocked" || reason === "Do Not Service requested by a person onsite")){
                                                        const message = {
                                                            to: customerData.email2,
                                                            subject: "Callahead Service Notification",
                                                            reason,
                                                            status,
                                                            successData: "Your Callahead Technician has partially completed servicing your unit(s) at",
                                                            address,
                                                            dateAndTime,
                                                            driverName,
                                                            driverPhoto,
                                                            GPSScreenshot,
                                                            custNum
                                                        }
                                                        sendMail(message)
                                                    }
                                                }
                                                const submitedRoute = `SELECT * FROM routes WHERE id = "${data.insertId}"`
                                                await connection.query(submitedRoute, (error,route) => {
                                                    if(error){
                                                        return res.status(400).json({
                                                            error: error.message,
                                                            success: false
                                                        })
                                                    }else{
                                                        return res.status(200).json({
                                                            data: route,
                                                            success: true
                                                        })
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })
                            }else{
                                return res.status(400).json({
                                    error: "Customer not found",
                                    success: false
                                })
                            }
                        })
                    }else{
                        return res.status(400).json({
                            error: "Route not found",
                            success: false
                        })
                    }
                })
            }else{
                return res.status(400).json({
                    error: "Driver not found",
                    success: false
                })
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
    getRouteOfDriver,
    submitRoute,
}

// const message = {
//     to: customerData.email2,
//     subject: "Callahead Service Notification",
//     html: partiallyMail(reason,address,dateAndTime,driverName,driverPhoto,GPSScreenshot,custNum),
// }
// sendMail(message)