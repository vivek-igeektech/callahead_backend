const express = require("express")
const router = express.Router()

const UserController = require("../controller/UserController")
const { checkSuperAdminToken, checkDriverToken } = require("../helper/checkToken")

router.post("/add_driver",checkSuperAdminToken,UserController.addDriver)
router.post("/create_superadmin",UserController.createSuperAdmin)
router.post("/login_superadmin",UserController.loginOfSuperAdmin)
router.post("/login",UserController.login)
router.get("/drivers",checkSuperAdminToken,UserController.getDrivers)
router.get("/friday_drivers",checkSuperAdminToken,UserController.getFridayDrivers)
router.get("/driver",checkSuperAdminToken,UserController.getDriver)
router.post("/update_driver",checkSuperAdminToken,UserController.updateDriverByAdmin)
router.post("/update_driver_for_driver",checkDriverToken,UserController.updateDriverForDriver)
router.post("/delete_driver",checkSuperAdminToken,UserController.deleteDriver)
router.post("/update_driver_last_location",checkDriverToken,UserController.updateDriverLastLocation)
router.get("/get_driver_last_location",checkSuperAdminToken,UserController.getDriverLastLocation)
router.post("/update_code",UserController.updateCode)

module.exports = router