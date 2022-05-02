const express = require("express")
const router = express.Router()

const RouteController = require("../controller/RouteController")
const { checkDriverToken } = require("../helper/checkToken")

router.get("/get_route",RouteController.getRouteOfDriver)
router.post("/submit_route",checkDriverToken,RouteController.submitRoute)

module.exports = router