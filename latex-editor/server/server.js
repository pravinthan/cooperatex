let http = require("http");
let path = require("path");
let express = require("express");
let bodyParser = require("body-parser");
let mongodb = require("mongodb");
let mongoose = require("mongoose");
let passport = require("passport");
// require("./models/db");
require("./models/users");
require("./config/passport");
let route = require("./routes/index");
let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(passport.initialize());

app.use(express.static(path.join(__dirname, "../dist/latex-editor")));
app.get("/*", (req, res) => res.sendFile(path.join(__dirname)));
app.use("/api", route);

app.use((req, res, next) => {
  let error = new Error("Not Found");
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  if (err.name === "UnauthorizedError") {
    res.status(401).json({ message: err.name + ": " + err.message });
  }
});

mongoose.connect("mongodb://localhost/latex-editor", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
let db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));

const server = http.createServer(app);
const port = process.env.PORT || 4201;
server.listen(port, () =>
  console.log(`App running on: http://localhost:${port}`)
);

//https://www.sitepoint.com/user-authentication-mean-stack/
