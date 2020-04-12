require("dotenv").config();
let http = require("http");
let path = require("path");
let cors = require("cors");
let express = require("express");
let bodyParser = require("body-parser");
let mongoose = require("mongoose");
let passport = require("passport");
let socketIO = require("socket.io");
let jwtAuth = require("socketio-jwt-auth");
require("./models/project");
require("./models/user");
require("./config/passport");
let User = mongoose.model("User");
let apiRoute = require("./routes/index");
let app = express();

if (process.env.PORT) {
  app.use(express.static(path.join(__dirname, "../dist/cooperatex")));
  app.get("/*", (req, res) => res.sendFile(path.join(__dirname)));
} else {
  app.use(cors());
}
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

mongoose.connect(process.env.DB_URI || "mongodb://localhost/cooperatex", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
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

// Authentication middleware
io.use(
  jwtAuth.authenticate({ secret: process.env.JWT_SECRET }, (payload, done) => {
    User.findById(payload._id, (err, user) => {
      if (err) return done(err);
      if (!user) return done(null, false, "User does not exist");
      return done(null, { _id: user._id, username: user.username });
    });
  })
);

const userPrefix = "user-";
io.sockets.on("connection", (socket) => {
  socket.on("joinUserSession", () => {
    const prefixedUserId = userPrefix + socket.request.user._id;
    if (!socket.rooms[prefixedUserId]) socket.join(prefixedUserId);
  });

  socket.on("joinProjectSession", (projectId) => {
    socket.join(projectId, () => {
      socket.to(projectId).emit("joinedProjectSession", socket.request.user);

      let activeUserIds = [];
      Object.keys(io.sockets.adapter.rooms[projectId].sockets).forEach(
        (socketId) => {
          const userId = Object.keys(
            io.sockets.adapter.sids[socketId]
          ).find((room) => room.includes(userPrefix));
          if (userId) activeUserIds.push(userId.substring(userPrefix.length));
        }
      );

      io.sockets
        .to(projectId)
        .emit("activeUserIdsInProjectSession", activeUserIds);
    });
  });

  socket.on("leaveProjectSession", (projectId) => {
    socket.leave(projectId, (err) => {
      if (!err)
        socket.to(projectId).emit("leftProjectSession", socket.request.user);
    });
  });

  socket.on("projectChange", (projectId) => {
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

  socket.on("invitationChange", (user) => {
    io.sockets.to(userPrefix + user._id).emit("invitationChange");
  });

  socket.on("collaboratorChange", (user) => {
    io.sockets.to(userPrefix + user._id).emit("collaboratorChange");
  });

  socket.on("projectAvailabilityChange", (user) => {
    io.sockets.to(userPrefix + user._id).emit("projectAvailabilityChange");
  });
});
