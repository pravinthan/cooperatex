let express = require("express");
let bodyParser = require("body-parser");
let mongodb = require("mongodb");
let mongoose = require("mongoose");
let passport = require('passport');

require('./api/models/db');
require('./api/config/passport');

let app = express();
app.use(bodyParser.json());

app.use(passport.initialize());
app.use('/api', routesApi);

let mongoDB = "mongodb://127.0.0.1/latex-editor";
mongoose.connect(mongoDB, { useNewUrlParser: true });

let db = mongoose.connection;
let Schema = mongoose.Schema;

db.on("error", console.error.bind(console, "MongoDB connection error:"));


// Initialize the app.
let server = app.listen(process.env.PORT || 8080, () => {
  console.log("App running on port", server.address().port);
});

//https://www.sitepoint.com/user-authentication-mean-stack/


server.post('/signup', function (req, res, next){

});