const mysql = require("mysql")

const connection = mysql.createConnection({
    host: "localhost",
    port: 3308,
    user: "root",
    password: "",
    database: "callahea_routes"
})

connection.connect((err) => {
    if(err){
        console.log(err);
    }
    else{
        console.log("Database connected");
    }
})

module.exports = connection