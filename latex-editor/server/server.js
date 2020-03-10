let http = require("http");
let path = require("path");
let cors = require("cors"); // delete when ready to deploy
let express = require("express");
let bodyParser = require("body-parser");
let mongoose = require("mongoose");
let passport = require("passport");
require("./models/project");
require("./models/document");
require("./models/user");
require("./config/passport");
let apiRoute = require("./routes/index");
let app = express();

// UNCOMMENT WHEN READY TO DEPLOY
// app.use(express.static(path.join(__dirname, "../dist/latex-editor")));
// app.get("/*", (req, res) => res.sendFile(path.join(__dirname)));
app.use(cors()); // delete when rdy to deploy
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use("/api", apiRoute);

app.use((req, res, next) => {
  let error = new Error("Not Found");
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  if (err.name === "UnauthorizedError") {
    return res.status(401).json("Unauthorized access");
  }
});

mongoose.connect("mongodb://localhost/latex-editor", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.connection.on(
  "error",
  console.error.bind(console, "MongoDB connection error:")
);

const server = http.createServer(app);
const port = process.env.PORT || 4201;
server.listen(port, () =>
  console.log(`Server running on: http://localhost:${port}`)
);
