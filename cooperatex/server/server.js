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
const userPrefix = "user-";
io.sockets.on("connection", socket => {
  socket.on("joinUserSession", userId => {
    if (!socket.rooms[userPrefix + userId]) socket.join(userPrefix + userId);
  });

  socket.on("joinProjectSession", (projectId, user) => {
    socket.join(projectId, () => {
      socket.to(projectId).emit("joinedProjectSession", user);

      let activeUserIds = [];
      Object.keys(io.sockets.adapter.rooms[projectId].sockets).forEach(
        socketId => {
          const userId = Object.keys(
            io.sockets.adapter.sids[socketId]
          ).find(room => room.includes(userPrefix));
          activeUserIds.push(userId.substring(userPrefix.length));
        }
      );

      io.sockets
        .to(projectId)
        .emit("activeUserIdsInProjectSession", activeUserIds);
    });
  });

  socket.on("leaveProjectSession", (projectId, user) => {
    socket.leave(projectId, err => {
      if (!err) socket.to(projectId).emit("leftProjectSession", user);
    });
  });

  socket.on("projectChange", projectId => {
    socket.to(projectId).emit("projectChange");
  });

  socket.on("cursorChange", (projectId, data) => {
    socket.to(projectId).emit("cursorChange", data);
  });

  socket.on("selectionChange", (projectId, data) => {
    socket.to(projectId).emit("selectionChange", data);
  });

  socket.on("fileContentsChange", (projectId, data) => {
    socket.to(projectId).emit("fileContentsChange", data);
  });

  socket.on("invitationChange", user => {
    io.sockets.to(userPrefix + user._id).emit("invitationChange");
  });

  socket.on("collaboratorChange", user => {
    io.sockets.to(userPrefix + user._id).emit("collaboratorChange");
  });

  socket.on("projectAvailabilityChange", user => {
    io.sockets.to(userPrefix + user._id).emit("projectAvailabilityChange");
  });
});
