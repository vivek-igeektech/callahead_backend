const express = require("express")
const http = require("http")
const socketio = require('socket.io')
const bp = require("body-parser")
require("dotenv").config()
require("./config/database")
const cors = require("cors")
const PORT = process.env.PORT
const app = express()
const server = http.createServer(app)
const io = socketio(server,{ origins: '*'})
const bodyParser = require("body-parser")

app.use(cors())

app.use(express.static(__dirname + '/images'));
app.use(express.static(__dirname + '/imageToBeUpload'));

app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: false,
}))

app.use(express.json())
app.use(express.urlencoded({extended: false }))
app.use(bp.urlencoded({ extended: true }));

app.use("/api", require("./router/userRouter"))
app.use("/api", require("./router/routeRouter"))
app.use("/api", require("./services/imageUpload"))

io.on('connection', (socket) => {
    socket.on("driverLocation", (data) => {
        console.log(data);
        io.emit(`driverLocation/${data.driver_id}`,data)
    })
})

// "192.168.29.158"

server.listen(PORT,() => {
    console.log(`Application running on ${PORT}`);
})
