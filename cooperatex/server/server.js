let http = require("http");
let path = require("path");
let cors = require("cors"); // delete when ready to deploy
let express = require("express");
let bodyParser = require("body-parser");
let mongoose = require("mongoose");
let passport = require("passport");
let socketIO = require("socket.io");
require("./models/project");
require("./models/user");
require("./config/passport");
let apiRoute = require("./routes/index");
let app = express();

// UNCOMMENT WHEN READY TO DEPLOY
// app.use(express.static(path.join(__dirname, "../dist/cooperatex")));
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
    return res.status(401).send("Unauthorized access");
  }
});

mongoose.connect("mongodb://localhost/cooperatex", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
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

const io = socketIO(server);
io.sockets.on("connection", socket => {
  socket.on("joinUserSession", userId => {
    if (!socket.rooms[userId]) socket.join(userId);
  });

  socket.on("joinProjectSession", (projectId, user) => {
    socket.join(projectId, () => {
      socket.to(projectId).emit("joinedProjectSession", user);
    });
  });

  socket.on("leaveProjectSession", (projectId, user) => {
    socket.leave(projectId, err => {
      if (!err) socket.to(projectId).emit("leftProjectSession", user);
    });
  });

  socket.on("cursorChange", (projectId, data) => {
    socket.to(projectId).emit("cursorChange", data);
  });

  socket.on("fileContentsChange", (projectId, data) => {
    socket.to(projectId).emit("fileContentsChange", data);
  });

  socket.on("invitationChange", user => {
    io.sockets.to(user._id).emit("invitationChange");
  });

  socket.on("collaboratorChange", user => {
    io.sockets.to(user._id).emit("collaboratorChange");
  });

  socket.on("projectAvailabilityChange", user => {
    io.sockets.to(user._id).emit("projectAvailabilityChange");
  });
});
