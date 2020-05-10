// Create the express app
const express = require("express")
const app = express()
const db = require("./database.js") // Link the database.js file
const md5 = require("md5")
const path = require("path");

// Use bodyparser middleware to POST data
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// set the view engine to ejs
// Use express to get static folder routing
app.use(express.static('public'));
// app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "views"));
// app.use(express.static(path.join(__dirname, "public")));
// app.use(express.urlencoded({ extended: false }));

// Define server port number
const HTTP_PORT = 3000 
// Start the server
app.listen(HTTP_PORT, () => {
    console.log("Server is running on port %PORT%".replace("%PORT%",HTTP_PORT))
});
// Routing to the / with GET and get message response of json format
app.get("/", (req, res, next) => {
    res.json({"message":"App is up and running"})
    //res.render('index')
});

/*
_____________________________________________________________
| Operations 	            | HTTP Method  | Endpoint       |
____________________________________________________________|
| Get a list of entities 	| GET 	       | /api/users/    |
| Get a single entity by id | GET 	       | /api/user/{id} |
| Create entity 	        | POST 	       | /api/user/     |
| Update entity by id 	    | PATCH        | /api/user/{id} |
| Delete entity by id 	    | DELETE 	   | /api/user/{id} |
|___________________________________________________________|
thanks to: https://developerhowto.com/2018/12/29/build-a-rest-api-with-node-js-and-express-js/
*/

// API endpoints
// Get a list of entities GET method, all users (/api/users/)
app.get("/api/users", (req, res, next) => {
    let sql = "select * from user"
    let params = []
    db.all(sql, params, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
         res.json({
             //"message":"success",
             "data":rows
         })
        //res.render("users", {model:rows});
      });
});

// Get a single entity by id GET method, a user by id (/api/user/{id})
app.get("/api/user/:id", (req, res, next) => {
    let sql = "select * from user where id = ?"
    let params = [req.params.id]
    db.get(sql, params, (err, row) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.json({
            "message":"success",
            "data":row
        })
      });
});

// Create entity POST method, create new user (/api/user/}
app.post("/api/user/", (req, res, next) => {
    let errors=[]
    if (!req.body.password){
        errors.push("No password specified");
    }
    if (!req.body.email){
        errors.push("No email specified");
    }
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }
    let data = {
        name: req.body.name,
        email: req.body.email,
        password : md5(req.body.password)
    }
    let sql ='INSERT INTO user (name, email, password) VALUES (?,?,?)'
    let params =[data.name, data.email, data.password]
    db.run(sql, params, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            return;
        }
        res.json({
            "message": "success",
            "data": data,
            "id" : this.lastID
        })
    });
})

// Update entity by id PATCH method, update user(/api/user/{id})
app.patch("/api/user/:id", (req, res, next) => {
    let data = {
        name: req.body.name,
        email: req.body.email,
        password : req.body.password ? md5(req.body.password) : null
    }
    db.run(
        `UPDATE user set 
           name = COALESCE(?,name), 
           email = COALESCE(?,email), 
           password = COALESCE(?,password) 
           WHERE id = ?`,
        [data.name, data.email, data.password, req.params.id],
        function (err, result) {
            if (err){
                res.status(400).json({"error": res.message})
                return;
            }
            res.json({
                message: "success",
                data: data,
                changes: this.changes
            })
    });
})

// Delete entity by id DELETE method, a user (/api/user/{id})
app.delete("/api/user/:id", (req, res, next) => {
    db.run(
        'DELETE FROM user WHERE id = ?',
        req.params.id,
        function (err, result) {
            if (err){
                res.status(400).json({"error": res.message})
                return;
            }
            res.json({"message":"deleted", changes: this.changes})
    });
})

// Use status 404 as default response for any other request
app.use(function(req, res){
    res.status(404);
});