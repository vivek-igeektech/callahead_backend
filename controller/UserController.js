const connection = require("../config/database")
const { generateToken } = require("../services/token")
const moment = require('moment-timezone');

const addDriver = async (req,res) => {
    try {
        const name = req.body.name
        const photo = req.body.photo || ""
        const phone = req.body.phone || ""
        const inOut = req.body.in_out || ""
        const route = req.body.route || ""
        const routeDay = req.body.route_day || ""                      
        const routeDown = req.body.route_down || ""                  // Take driver data from admin side
        const county = req.body.county || ""
        const truck = req.body.truck || ""
        const mb = req.body.mb || ""
        const notes = req.body.notes || ""
        const last_location = ""
        const role = 2
        let id = req.body.id
        const is_friday_driver = req.body.is_friday_driver || false
        
        if(!name){
            return res.status(400).json({
                error: "Please enter name",
                success: false
            })
        }
        
        if(!phone){                                                  
            return res.status(400).json({
                error: "Please enter phone",                      // This 3 data are require for add_driver
                success: false
            })
        }

        if(!id){
            return res.status(400).json({
                error: "Please enter ID",
                success: false
            })
        }

        if(!route){
            return res.status(400).json({
                error: "Please enter route",
                success: false
            })
        }

        if(!mb){
            return res.status(400).json({
                error: "Please enter MB",
                success: false
            })
        }

        if(isNaN(mb)){
            return res.status(400).json({
                error: "Please enter valid MB",
                success: false
            })
        }

        const driver_table = is_friday_driver ? "drivers_f" : "drivers"
        
        const existDriverWithPhoneQuery = `SELECT * FROM ${driver_table} WHERE PHONE = "${phone}" AND IS_DELETED = false`                        // Check driver exist or not with given Phone
        connection.query(existDriverWithPhoneQuery, (error,data) => {
            if(error){
                return res.status(400).json({
                    error: error.message,
                    success: false
                })
            }
            if(data.length > 0){
                return res.status(400).json({
                    error: "Driver already exist with this Phone number",
                    success: false
                })
            }else{
                const existDriverWithIdQuery = `SELECT * FROM ${driver_table} WHERE ID = "${id}" AND IS_DELETED = false`          // Check driver exist or not with given ID
                connection.query(existDriverWithIdQuery, (error,data) => {
                    if(data.length > 0){
                        return res.status(400).json({
                            error: "Driver already exist with this ID",
                            success: false
                        })
                    }else{     
                        if(truck){                                                          // If admin give the truck value then it's going to this condition and add data with truck
                            const checkDriverWithTruck = `SELECT * FROM ${driver_table} WHERE truck = "${truck}" AND IS_DELETED = false`
                            connection.query(checkDriverWithTruck,(error,truckData) => {
                                if(error){
                                    return res.status(400).json({
                                        error: error.message,
                                        success: false
                                    })
                                }else if(truckData.length > 0){
                                    return res.status(400).json({
                                        error: "This truck has been already assign to the other driver",                            // If exist then we return with this error message
                                        success: false
                                    })
                                }else{
                                    const checkDriverWithRoute = `SELECT * FROM ${driver_table} WHERE ROUTE = "${route}" AND IS_DELETED = false`       // Check driver exist or not with given ROUTE
                                    connection.query(checkDriverWithRoute, (error,routeData) => {
                                        if(error){
                                            return res.status(400).json({
                                                error: error.message,
                                                success: false
                                            })
                                        }else if(routeData.length > 0){                                     // If exist then we return with this error message
                                            return res.status(400).json({
                                                error: "This route has been already assign to the other driver",
                                                success: false
                                            })
                                        }else{
                                            const checkDriverWithRoute = `SELECT * FROM ${driver_table} WHERE MB = "${mb}" AND IS_DELETED = false`       // Check driver exist or not with given MB
                                            connection.query(checkDriverWithRoute, (error,mbData) => {
                                                if(error){
                                                    return res.status(400).json({
                                                        error: error.message,
                                                        success: false
                                                    })
                                                }else if(mbData.length > 0){
                                                    return res.status(400).json({
                                                        error: "MB already exist",                            // If exist then we return with this error message
                                                        success: false
                                                    })
                                                }else{
                                                    const QUERY = `INSERT INTO ${driver_table}
                                                                    (NAME,PHOTO,IN_OUT,ROUTE,ROUTE_DAY,ROUTE_DOWN,COUNTY,TRUCK,MB,NOTES,PHONE,ROLE,LAST_LOCATION,ID)
                                                                    VALUES
                                                                    ("${name}","${photo}","${inOut}","${route}","${routeDay}","${routeDown}","${county}","${truck}","${mb}","${notes}","${phone}","${role}","${last_location}","${id}")`
                                                    
                                                    connection.query(QUERY, (error,data) => {
                                                        if(error && (error.message.includes("ER_DUP_ENTRY") && error.message.includes("ROUTE"))){
                                                            return res.status(400).json({
                                                                error: "This route has been already assign to the other driver",
                                                                success: false
                                                            })
                                                        }else if(error && (error.message.includes("ER_DUP_ENTRY") && error.message.includes("MB_2"))){
                                                            return res.status(400).json({
                                                                error: "MB already exist",
                                                                success: false
                                                            })
                                                        }else{
                                                            const getDriver = `SELECT * FROM ${driver_table} WHERE D_ID = ${data.insertId}`                // Return driver_data in response
                                                            connection.query(getDriver, (error, driver) => {
                                                                if(error){
                                                                    return res.status(400).json({
                                                                        error: error.message,
                                                                        success: false
                                                                    })
                                                                }else{
                                                                    return res.status(200).json({
                                                                        data: driver,
                                                                        success: true
                                                                    })
                                                                }
                                                            })
                                                        }
                                                    }) 
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }else{
                            const checkDriverWithRoute = `SELECT * FROM ${driver_table} WHERE MB = "${mb}" AND IS_DELETED = false`       // Check driver exist or not with given MB
                            connection.query(checkDriverWithRoute, (error,mbData) => {
                                if(error){
                                    return res.status(400).json({
                                        error: error.message,
                                        success: false
                                    })
                                }else if(mbData.length > 0){
                                    return res.status(400).json({
                                        error: "MB already exist",                            // If exist then we return with this error message
                                        success: false
                                    })
                                }else{
                                    const QUERY = `INSERT INTO ${driver_table}
                                                    (NAME,PHOTO,IN_OUT,ROUTE,ROUTE_DAY,ROUTE_DOWN,COUNTY,TRUCK,MB,NOTES,PHONE,ROLE,LAST_LOCATION,ID)
                                                    VALUES
                                                    ("${name}","${photo}","${inOut}","${route}","${routeDay}","${routeDown}","${county}","${truck}","${mb}","${notes}","${phone}","${role}","${last_location}","${id}")`
                                
                                    connection.query(QUERY, (error,data) => {
                                        if(error && (error.message.includes("ER_DUP_ENTRY") && error.message.includes("ROUTE"))){
                                            return res.status(400).json({
                                                error: "This route has been already assign to the other driver",
                                                success: false
                                            })
                                        }else if(error && (error.message.includes("ER_DUP_ENTRY") && error.message.includes("MB_2"))){
                                            return res.status(400).json({
                                                error: "MB already exist",
                                                success: false
                                            })
                                        }else{
                                            const getDriver = `SELECT * FROM ${driver_table} WHERE D_ID = ${data.insertId}`                // Return driver_data in response
                                            connection.query(getDriver, (error, driver) => {
                                                if(error){
                                                    return res.status(400).json({
                                                        error: error.message,
                                                        success: false
                                                    })
                                                }else{
                                                    return res.status(200).json({
                                                        data: driver,
                                                        success: true
                                                    })
                                                }
                                            })
                                        }
                                    }) 
                                }
                            })
                        }                                                
                    }
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

const createSuperAdmin = async (req, res) => {
    try {
        const name = req.body.name || "superAdmin"
        const phone = req.body.phone || ""
        const inOut = req.body.in_out || ""
        const route = req.body.route || ""
        const routeDay = req.body.route_day || ""
        const routeDown = req.body.routeDown || ""
        const county = req.body.county || ""                                            // Take data from admin for create admin
        const truck = req.body.truck || ""
        const mb = req.body.mb || ""
        const notes = req.body.notes || ""
        const role = 1
        const id = req.body.id || "SA1140"

        const QUERY = `INSERT INTO drivers (NAME,IN_OUT,ROUTE,ROUTE_DAY,ROUTE_DOWN,COUNTY,TRUCK,MB,NOTES,PHONE,ROLE,ID)
                        VALUES
                        ("${name}","${inOut}","${route}","${routeDay}","${routeDown}","${county}","${truck}","${mb}","${notes}","${phone}","${role}","${id}")`

        connection.query(QUERY, (error,data) => {                                                               // Insert superadmin data
            if(error){
                return res.status(400).json({
                    error: error.message,
                    success: false
                })
            }else{
                return res.status(200).json({
                    data: "Superadmin added",
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

const loginOfSuperAdmin = async (req, res) => {
    try {
        const email = req.body.email
        const password = req.body.password
        
        if(!(email && password)){
            return res.status(400).json({
                error: "Please provide credentails",                                        // If email and password doest not exist, we return with this error
                success: false
            })
        }

        if(email === "" && password === ""){                   // We put static data for match credentails, if credentails match then only we move to next step
            const QUERY = `SELECT * FROM drivers WHERE ROLE = 1`                           // Find superadmin from database with given credentials
            connection.query(QUERY,(error,data) => {
                if(error){
                    return res.status(400).json({
                        error: error.message,
                        success: false
                    })
                }else if(data.length >= 1){                                                // If superadmin exist then we generate token
                        const role = data[0].ROLE
                        const id = data[0].ID
                        const token = generateToken(role,id)                               // Generate token with ID and role
                    
                        return res.status(200).json({
                            data: data,token,
                            success: true
                        })
                }else{
                    return res.status(400).json({                                          // If superadmin not found then we return with this error message
                        error: "Superadmin not found",              
                        success: false
                    })
                }
            })
        }else {                                                                            // IF credentials does not match then return with error message
            return res.status(400).json({
                error: "Credentails does not match",
                success: false
            })
        }
    } catch (error) {
        return res.status(400).json({
            error: error.message,
            success: false
        })
    }
}

const login = async (req, res) => {
    try {
        let driver_table = "drivers"

        const date = moment.utc()
        const tz = 'America/New_York';
        const day = date.tz(tz).format('dddd')

        if(day === "Friday"){
            driver_table = "drivers_f"
        }

        const id = req.body.id                                                  // Take ID from driver
        if(!id){
            return res.status(400).json({
                error: "Please provide id",
                success: false
            })
        }

        const QUERY = `SELECT * FROM ${driver_table} WHERE ID = "${id}" AND role = 2`      // Find driver this given ID
        connection.query(QUERY,(error,data) => {
            if(error){
                return res.status(400).json({
                    error: error.message,
                    success: false
                })
            }else if(data.length > 0){                                             // If driver exist with given ID then we generateToken 
                const driver = data[0]
                const role = driver.ROLE
                const id = driver.ID
                const token = generateToken(role,id)                               // Generate token with ID and role

                return res.status(200).json({
                    data: data[0],token,
                    success: true
                })
            }else{                                                                // If driver not exist with given ID 
                return res.status(400).json({
                    error: day === "Friday" ? "You have no routes in the system today. You cannot login." : "Driver not found",
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

const getDrivers = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1
        const limit = req.query.limit || 10
        const skip = (page - 1) * limit
        const search = req.query.search
        
        const QUERY = `SELECT * FROM drivers WHERE ROLE = 2 AND IS_DELETED = false ${search ? `AND NAME LIKE "%${search}%"`:""} LIMIT ${limit} OFFSET ${skip}`
        const allDriverQueary = `SELECT * FROM drivers WHERE ROLE = 2 AND IS_DELETED = false`
        
        connection.query(limit === "all" ? allDriverQueary : QUERY,(error,data) => {
            if(error){
                return res.status(400).json({
                    error: error.message,
                    success: false
                })
            }else if(data.length > 0){
                const COUNT = `SELECT COUNT(*) FROM drivers WHERE ROLE = 2 AND IS_DELETED = false`                          // Find total record
                connection.query(COUNT, (error,count) => {
                    if(count){
                        const totalPages = Math.ceil(count[0]["COUNT(*)"]/limit)                                            // Find total pages 
                        return res.status(200).json({
                            data: {
                                data: data,
                                page: page,
                                totalPages: limit === "all" ? 1 : totalPages,
                                perPage: limit,
                                count: count[0]["COUNT(*)"]
                              },
                            success: true
                        })
                    }
                })
            }else{
                return res.status(400).json({                                                      // IF driver does not exist
                    error: "Drivers not found",
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

const getFridayDrivers = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1
        const limit = req.query.limit || 10
        const skip = (page - 1) * limit
        const search = req.query.search
        
        const QUERY = `SELECT * FROM drivers_f WHERE ROLE = 2 AND IS_DELETED = false ${search ? `AND NAME LIKE "%${search}%"`:""} LIMIT ${limit} OFFSET ${skip}`
        const allDriverQueary = `SELECT * FROM drivers_f WHERE ROLE = 2 AND IS_DELETED = false`
        
        connection.query(limit === "all" ? allDriverQueary : QUERY,(error,data) => {
            if(error){
                return res.status(400).json({
                    error: error.message,
                    success: false
                })
            }else if(data.length > 0){
                const COUNT = `SELECT COUNT(*) FROM drivers_f WHERE ROLE = 2 AND IS_DELETED = false`                          // Find total record
                connection.query(COUNT, (error,count) => {
                    if(count){
                        const totalPages = Math.ceil(count[0]["COUNT(*)"]/limit)                                            // Find total pages 
                        return res.status(200).json({
                            data: {
                                data: data,
                                page: page,
                                totalPages: limit === "all" ? 1 : totalPages,
                                perPage: limit,
                                count: count[0]["COUNT(*)"]
                              },
                            success: true
                        })
                    }
                })
            }else{
                return res.status(400).json({                                                      // IF driver does not exist
                    error: "Drivers not found",
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

const getDriver = async (req, res) => {
    try {
        const id = req.query.id                                                 // Take driverID from admin side to find perticular driver
        if(!id){
            return res.status(400).json({
                error: "Please enter ID",
                success: false
            })
        }
        const QUERY = `SELECT * FROM drivers WHERE ROLE = 2 AND ID = "${id}" AND IS_DELETED = false`          // Find driver from database using given ID
        connection.query(QUERY, (error, data) => {
            if(error){
                return res.status(400).json({
                    error: error.message,
                    success: false
                })
            }else if(data.length > 0){
                return res.status(200).json({
                    data: data,
                    success: true
                })
            }else{                                                                                            // IF driver not found with given ID
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

const updateDriverByAdmin = async (req, res) => {
    try { 
        const id = req.body.id
        const dId = req.body.d_id
        const name = req.body.name
        const photo = req.body.photo
        const phone = req.body.phone || ""
        const inOut = req.body.in_out || ""
        const route = req.body.route || ""
        const routeDay = req.body.route_day || ""                                       // Take data from admin side for update
        const routeDown = req.body.route_down || ""
        const county = req.body.county || ""
        const truck = req.body.truck || ""
        const mb = req.body.mb || ""
        const notes = req.body.notes || ""
        const is_friday_drivers = req.body.is_friday_drivers || false
        const role = 2

        if(!(id || dId)){
            return res.status(400).json({
                error: "Please enter ID",
                success: false
            })
        }
        // IF admin want to change driver phone then i have to check driver already exist OR not with this phone
        
        const checkDriverFoundOrNot = `SELECT * FROM ${is_friday_drivers ? "drivers_f" : "drivers"} WHERE ID = "${id}" AND IS_DELETED = false`
        const checkDriverFoundOrNotWithDid = `SELECT * FROM ${is_friday_drivers ? "drivers_f" : "drivers"} WHERE D_ID = "${dId}" AND IS_DELETED = false`
        
        connection.query(id ? checkDriverFoundOrNot : checkDriverFoundOrNotWithDid, (error,driverData) => {
            if(error){
                return res.status(400).json({
                    error: error.message,
                    success: false
                })
            }else if(driverData.length > 0){
                const checkDriverWithPhone = `SELECT * FROM ${is_friday_drivers ? "drivers_f" : "drivers"} 
                                            WHERE
                                            PHONE = "${phone}" AND ID != "${id}" AND IS_DELETED = false`

                const checkDriverWithPhoneWithDid = `SELECT * FROM ${is_friday_drivers ? "drivers_f" : "drivers"} 
                                            WHERE
                                            PHONE = "${phone}" AND D_ID != "${dId}" AND IS_DELETED = false`

                connection.query(id ? checkDriverWithPhone : checkDriverWithPhoneWithDid, async (error, data) => {
                    if(error){
                        return res.status(400).json({
                            error: error.message,
                            success: false
                        })
                    }else if(data.length > 0){                                                  // IF driver already exist with given phone then return with error message
                        return res.status(400).json({
                            error: "Driver already exist with this phone number",
                            success: false
                        })
                    }else {                                // IF admin give truck value and admin want to change driver truck then i have to check driver already exist OR not with this truck
                        if(truck){
                            const checkDriverWithTruck = `SELECT * FROM ${is_friday_drivers ? "drivers_f" : "drivers"}
                                                        WHERE
                                                        truck = "${truck}" AND ID != "${id}" AND IS_DELETED = false`

                            const checkDriverWithTruckWithDid = `SELECT * FROM ${is_friday_drivers ? "drivers_f" : "drivers"} 
                                                        WHERE
                                                        truck = "${truck}" AND D_ID != "${dId}" AND IS_DELETED = false`
                            await new Promise((resolve)=>{
                                connection.query(id ? checkDriverWithTruck : checkDriverWithTruckWithDid, (error, truckData) => {
                                    if(error){
                                        return res.status(400).json({
                                            error: error.message,
                                            success: false
                                        })
                                    }else if(truckData.length > 0){             // IF driver already exist with truck
                                        return res.status(400).json({
                                            error: "This truck has been already assign to other driver",
                                            success: false
                                        })
                                    }
                                    resolve();
                                })   
                            })
                        }
                        const QUERY = `UPDATE ${is_friday_drivers ? "drivers_f" : "drivers"}
                        SET
                        NAME = "${name}",PHOTO = "${photo}",PHONE = "${phone}",IN_OUT = "${inOut}",ROUTE_DAY = "${routeDay}",ROUTE_DOWN = "${routeDown}",COUNTY = "${county}", TRUCK = "${truck}", NOTES = "${notes}", ROLE = "${role}"
                        WHERE
                        ID = "${id}" AND ROLE = 2 AND IS_DELETED = false`

                        const QUERYWithId = `UPDATE ${is_friday_drivers ? "drivers_f" : "drivers"}
                        SET
                        NAME = "${name}",PHOTO = "${photo}",PHONE = "${phone}",IN_OUT = "${inOut}",ROUTE_DAY = "${routeDay}",ROUTE_DOWN = "${routeDown}",COUNTY = "${county}", TRUCK = "${truck}", NOTES = "${notes}", ROLE = "${role}"
                        WHERE
                        D_ID = "${dId}" AND ROLE = 2 AND IS_DELETED = false`

                        connection.query(id ? QUERY : QUERYWithId,(error,data) => {
                            if(error){
                                return res.status(400).json({
                                    error: error.message,
                                    success: false
                                })
                            }else{
                                const driverRoute = driverData[0].ROUTE
                                const driverMb = driverData[0].MB

                                if(driverRoute !== route){
                                    const checkDriverWithRoute = `SELECT * FROM ${is_friday_drivers ? "drivers_f" : "drivers"} WHERE ROUTE = "${route}" AND ID != "${id}" AND IS_DELETED = false`
                                    const checkDriverWithRouteWithDid = `SELECT * FROM ${is_friday_drivers ? "drivers_f" : "drivers"} WHERE ROUTE = "${route}" AND D_ID != "${dId}" AND IS_DELETED = false`

                                    connection.query(id ? checkDriverWithRoute : checkDriverWithRouteWithDid, (error,routeData) => {
                                        if(error){
                                            return res.status(400).json({
                                                error: error.message,
                                                success: false
                                            })
                                        }else if(routeData.length > 0){
                                            return res.status(400).json({
                                                error: "This route has been already assign to the other driver",
                                                success: false
                                            })
                                        }else{
                                            const updateData = `UPDATE ${is_friday_drivers ? "drivers_f" : "drivers"}
                                            SET
                                            ROUTE = "${route}"
                                            WHERE
                                            ID = "${id}" AND ROLE = 2 AND IS_DELETED = false`

                                            const updateDataWithDid = `UPDATE ${is_friday_drivers ? "drivers_f" : "drivers"}
                                            SET
                                            ROUTE = "${route}"
                                            WHERE
                                            D_ID = "${dId}" AND ROLE = 2 AND IS_DELETED = false`

                                            connection.query(id ? updateData : updateDataWithDid, (error,updateMb) => {
                                                if(error && (error.message.includes("ER_DUP_ENTRY") && error.message.includes("ROUTE"))){
                                                    return res.status(400).json({
                                                        error: "This route has been already assign to the other driver",
                                                        success: false
                                                    })
                                                }else if(error){
                                                    return res.status(400).json({
                                                        error: error.message,
                                                        success: false
                                                    })
                                                }else if(driverMb !== mb){
                                                    const checkDriverWithMb = `SELECT * FROM ${is_friday_drivers ? "drivers_f" : "drivers"} WHERE MB = "${mb}" AND ID != "${id}" AND IS_DELETED = false`
                                                    const checkDriverWithMbWithDid = `SELECT * FROM ${is_friday_drivers ? "drivers_f" : "drivers"} WHERE MB = "${mb}" AND D_ID != "${dId}" AND IS_DELETED = false`

                                                    connection.query(id ? checkDriverWithMb : checkDriverWithMbWithDid, (error,mbData) => {
                                                        if(error){
                                                            return res.status(400).json({
                                                                error: error.message,
                                                                success: false
                                                            })
                                                        }else if(mbData.length > 0){
                                                            return res.status(400).json({
                                                                error: "MB already exist",
                                                                success: false
                                                            })
                                                        }else{
                                                            const updateData = `UPDATE ${is_friday_drivers ? "drivers_f" : "drivers"}
                                                            SET
                                                            MB = "${mb}"
                                                            WHERE
                                                            ID = "${id}" AND ROLE = 2 AND IS_DELETED = false`

                                                            const updateDataWithDid = `UPDATE ${is_friday_drivers ? "drivers_f" : "drivers"}
                                                            SET
                                                            MB = "${mb}"
                                                            WHERE
                                                            D_ID = "${dId}" AND ROLE = 2 AND IS_DELETED = false`

                                                            connection.query(id ? updateData : updateDataWithDid, (error,updateMb) => {
                                                                if(error && (error.message.includes("ER_DUP_ENTRY") && error.message.includes("MB_2"))){
                                                                    return res.status(400).json({
                                                                        error: "MB already exist",
                                                                        success: false
                                                                    })
                                                                }else if(error){
                                                                    return res.status(400).json({
                                                                        error: error.message,
                                                                        success: false
                                                                    })
                                                                }else{
                                                                    return res.status(200).json({
                                                                        data: "Driver updated",
                                                                        success: true
                                                                    })
                                                                }
                                                            })
                                                        }
                                                    })
                                                }else{ 
                                                    return res.status(200).json({
                                                        data: "Driver updated",
                                                        success: true
                                                    })
                                                }
                                            })
                                        }
                                    })
                                }else if(driverMb !== mb){
                                    const checkDriverWithMb = `SELECT * FROM ${is_friday_drivers ? "drivers_f" : "drivers"} WHERE MB = "${mb}" AND ID != "${id}" AND IS_DELETED = false`
                                    const checkDriverWithMbWithDid = `SELECT * FROM ${is_friday_drivers ? "drivers_f" : "drivers"} WHERE MB = "${mb}" AND D_ID != "${dId}" AND IS_DELETED = false`

                                    connection.query(id ? checkDriverWithMb :checkDriverWithMbWithDid, (error,mbData) => {
                                        if(error){
                                            return res.status(400).json({
                                                error: error.message,
                                                success: false
                                            })
                                        }else if(mbData.length > 0){
                                            return res.status(400).json({
                                                error: "MB already exist",
                                                success: false
                                            })
                                        }else{
                                            const updateData = `UPDATE ${is_friday_drivers ? "drivers_f" : "drivers"}
                                            SET
                                            MB = "${mb}"
                                            WHERE
                                            ID = "${id}" AND ROLE = 2 AND IS_DELETED = false`

                                            const updateDataWithDid = `UPDATE ${is_friday_drivers ? "drivers_f" : "drivers"}
                                            SET
                                            MB = "${mb}"
                                            WHERE
                                            D_ID = "${dId}" AND ROLE = 2 AND IS_DELETED = false`
                                            
                                            connection.query(id ? updateData : updateDataWithDid , (error,updateMb) => {
                                                if(error){
                                                    return res.status(400).json({
                                                        error: error.message,
                                                        success: false
                                                    })
                                                }else if(driverRoute !== route){
                                                    const checkDriverWithRoute = `SELECT * FROM ${is_friday_drivers ? "drivers_f" : "drivers"} WHERE ROUTE = "${route}" AND ID != "${id}" AND IS_DELETED = false`
                                                    const checkDriverWithRouteWithDid = `SELECT * FROM ${is_friday_drivers ? "drivers_f" : "drivers"} WHERE ROUTE = "${route}" AND D_ID != "${dId}" AND IS_DELETED = false`

                                                    connection.query(id ? checkDriverWithRoute : checkDriverWithRouteWithDid, (error,updateRoute) => {
                                                        if(error){
                                                            return res.status(400).json({
                                                                error: error.message,
                                                                success: false
                                                            })
                                                        }else{
                                                            return res.status(200).json({
                                                                data: "Driver updated",
                                                                success: true
                                                            })
                                                        }
                                                    })
                                                }else{
                                                    return res.status(200).json({
                                                        data: "Driver updated",
                                                        success: true
                                                    })
                                                }
                                            })
                                        }
                                    })
                                }else{
                                    return res.status(200).json({
                                        data: "Driver updated",
                                        success: true
                                    })
                                }
                            }
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

const updateDriverForDriver = async (req, res) => {
    try {
        const id = req.body.id                      // Take driverID from driver side to find perticular driver
        if(!id){
            return res.status(400).json({
                error: "Please enter ID",
                success: false
            })
        }

        const name = req.body.name
        const photo = req.body.photo
        const phone = req.body.phone

        const checkDriverWithPhone = `SELECT * FROM drivers
                                    WHERE
                                    PHONE = "${phone}" AND ID != "${id}" AND IS_DELETED = false`

        connection.query(checkDriverWithPhone, (error, data) => {
            if(error){
                return res.status(400).json({
                    error: error.message,
                    success: false
                })
            }else if(data.length > 0){                                                  // IF driver already exist with given phone then return with error message
                return res.status(400).json({
                    error: "Driver already exist with this phone",
                    success: false
                })
            }else{
                const QUERY = `UPDATE drivers
                                SET
                                NAME = "${name}", PHONE = "${phone}", PHOTO = "${photo}"
                                WHERE
                                ID = "${id}" AND ROLE = 2 AND IS_DELETED = false`
    
                connection.query(QUERY,(error,data) => {
                    if(error){
                        return res.status(400).json({
                            error: error.message,
                            success: false
                        })
                    }else{
                        const checkDriverExistOrNotInDriver_f = `SELECT * FROM drivers_f WHERE ID = "${id}" AND IS_DELETED = false`
                        connection.query(checkDriverExistOrNotInDriver_f, (error,data) => {
                            if(error){
                                return res.status(400).json({
                                    error: error.message,
                                    success: false
                                })
                            }else if(data.length > 0){
                                const checkDriverWithPhoneInDriver_f = `SELECT * FROM drivers_f
                                WHERE
                                PHONE = "${phone}" AND ID != "${id}" AND IS_DELETED = false`

                                connection.query(checkDriverWithPhoneInDriver_f, (error,data) => {
                                    if(error){
                                        return res.status(400).json({
                                            error: error.message,
                                            success: false
                                        })
                                    }else if(data.length > 0){                                                // IF driver already exist with given phone then return with error message
                                        return res.status(400).json({
                                            error: "Driver already exist with this phone in driver_f",
                                            success: false
                                        })
                                    }else{
                                        const QUERYInDriver_f = `UPDATE drivers_f
                                                                SET
                                                                NAME = "${name}", PHONE = "${phone}", PHOTO = "${photo}"
                                                                WHERE
                                                                ID = "${id}" AND ROLE = 2 AND IS_DELETED = false`
                                        connection.query(QUERYInDriver_f,(error,data) => {
                                            if(error){
                                                return res.status(400).json({
                                                    error: error.message,
                                                    success: false
                                                })
                                            }else{
                                                return res.status(200).json({
                                                    data: "Driver updated",
                                                    success: true
                                                })
                                            }
                                        })  
                                    }
                                })
                            }else{
                                return res.status(200).json({
                                    data: "Driver updated",
                                    success: true
                                })
                            }
                        })
                    }
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

const deleteDriver = async (req, res) => {
    try {
        const id = req.body.id                                                 // Take ID from driver
        const is_friday_drivers = req.body.is_friday_drivers || false

        if(!id){
            return res.status(400).json({
                error: "Please enter ID",
                success: false
            })
        }
        
        const checkDriverExistORNot = `SELECT * FROM drivers WHERE ID = "${id}" AND ROLE = 2 AND IS_DELETED = false`    // Check driver exist or not with this ID
        const checkFridayDriverExistORNot = `SELECT * FROM drivers_f WHERE ID = "${id}" AND ROLE = 2 AND IS_DELETED = false`    // Check driver exist or not with this ID

        connection.query(is_friday_drivers ? checkFridayDriverExistORNot : checkDriverExistORNot, (error,data) => {
            if(error){
                return res.status(400).json({
                    error: error.message,
                    success: false
                })  
            }else if(data.length > 0){
                const QUERY = `UPDATE drivers SET IS_DELETED = true WHERE ID = "${id}" AND ROLE = 2 AND IS_DELETED = false`  // Delete driver
                const fDriverQUERY = `UPDATE drivers_f SET IS_DELETED = true WHERE ID = "${id}" AND ROLE = 2 AND IS_DELETED = false`  // Delete driver

                connection.query(is_friday_drivers ? fDriverQUERY : QUERY,(error,data) => {
                    if(error){
                        return res.status(400).json({
                            error: error.message,
                            success: false
                        })
                    }else {
                        return res.status(200).json({
                            data: "Driver deleted",
                            success: true
                        })
                    }
                })
            }else{                                                                  // IF driver not exist then return with this error
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

const updateDriverLastLocation = async (req, res) => {
    try {

        const id = req.body.id
        if(!id){
            return res.status(400).json({
                error: "Please provide id",
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
        
        const locationData = req.body.last_location_data
        if(!locationData){
            return res.status(400).json({
                error: "Please provide last_location_data",
                success: false
            })
        }
        const QUERY = `UPDATE ${driver_table} SET last_location = "${locationData}" WHERE ID = "${id}"`
        connection.query(QUERY, (error,data) => {
            if(error){
                res.status(400).json({
                    error: error.message,
                    success: false
                })
            }else{
                res.status(200).json({
                    data: "Location updated",
                    success: true
                })
            }
        })
    } catch (error) {
        res.status(400).json({
            error: error.message,
            success: false
        })
    }
}

const getDriverLastLocation = async (req, res) => {
    try {
        const id = req.query.id
        if(!id){
            return res.status(400).json({
                error: "Please provide id",
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
        
        const QUERY = `SELECT D_ID, ID, LAST_LOCATION FROM ${driver_table} WHERE ID = "${id}" AND IS_DELETED = false`
        connection.query(QUERY, (error,data) => {
            if(error){
                res.status(400).json({
                    error: error.message,
                    success: false
                })
            }else if(data.length > 0){
                const latAndLongData = data[0].LAST_LOCATION.split(",")
                let lat = latAndLongData[0]
                let long = latAndLongData[1]
                const newData = {
                    D_ID: data[0].D_ID,
                    ID: data[0].ID,
                    lat : lat,
                    long: long
                }

                res.status(200).json({
                    data: newData,
                    success: false
                })
            }else{
                return res.status(400).json({
                    error: "Driver not found",
                    success: false
                })
            }
        })
    } catch (error) {
        res.status(400).json({
            error: error.message,
            success: false
        })
    }
}

const updateCode = async (req, res) => {
    try {
        const oldCode = req.body.old_code
        const newCode = req.body.new_code
        const id = req.body.id
        const is_friday_driver = req.body.is_friday_driver
        const drivers_table = is_friday_driver ? "drivers_f" : "drivers"

        if(!(oldCode || id)){
            return res.status(400).json({
                error: "Please enter old_code OR Id",
                success: false
            })
        }

        if(!newCode){
            return res.status(400).json({
                error: "Please enter new_code",
                success: false
            })
        }
        
        const QUERY = `SELECT * FROM ${drivers_table} WHERE ID = "${oldCode}" AND IS_DELETED=false`
        const QUERYWithId = `SELECT * FROM ${drivers_table} WHERE D_ID = "${id}" AND IS_DELETED=false`

        connection.query(oldCode ? QUERY : QUERYWithId, (error,driver) => {
            if(error){
                return res.status(400).json({
                    error: error.message,
                    success: false
                })
            }else if(driver.length > 0){
                let d_id = ""
                
                if(!oldCode){
                    d_id = driver[0].D_ID
                }
                
                const checkDriverExistOrNot = `SELECT * FROM ${drivers_table} WHERE ID = "${newCode}" AND ID != "${oldCode}" AND IS_DELETED=false`
                const checkDriverExistOrNotWithId = `SELECT * FROM ${drivers_table} WHERE ID = "${newCode}" AND D_ID != "${id}" AND IS_DELETED=false`

                connection.query(oldCode ? checkDriverExistOrNot : checkDriverExistOrNotWithId, (error,data) => {
                    if(error){
                        return res.status(400).json({
                            error: error.message,
                            success: false
                        })
                    }else if(data.length > 0){
                        return res.status(400).json({
                            error: "Driver already exist with new code",
                            success: false
                        })
                    }else{
                            const updateDriver = `UPDATE ${drivers_table} SET ID = "${newCode}" WHERE ID = "${oldCode}"`
                            const updateDriverWithId = `UPDATE ${drivers_table} SET ID = "${newCode}" WHERE D_ID = "${id}"`

                            connection.query(oldCode ? updateDriver : updateDriverWithId,(error,updatedDriver) => {
                                if(error){
                                    return res.status(400).json({
                                        error: error.message,
                                        success: false
                                    })
                                }else{
                                    const updateCodeInRoutes = `UPDATE routes SET driver_id = "${newCode}" WHERE driver_id = "${oldCode}"`
                                    const updateCodeInRoutesWithId = `UPDATE routes SET driver_id = "${newCode}" WHERE driver_id = "${d_id}"`
                                    connection.query(oldCode ? updateCodeInRoutes : updateCodeInRoutesWithId, (error,updatedRoutes) => {
                                        if(error){
                                            return res.status(400).json({
                                                error: error.message,
                                                success: false
                                            })
                                        }else{
                                            return res.status(200).json({
                                                data: "Code updated",
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
    addDriver,
    createSuperAdmin,
    loginOfSuperAdmin,
    login,
    getDrivers,
    getFridayDrivers,
    getDriver,
    updateDriverByAdmin,
    updateDriverForDriver,
    deleteDriver,
    updateDriverLastLocation,
    getDriverLastLocation,
    updateCode
}
