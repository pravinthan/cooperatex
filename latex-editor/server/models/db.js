let mongoose = require("mongoose");
let gracefulShutdown;
let uri = "mongodb://localhost/latex-editor";

if (process.env.NODE_ENV === "production") {
  uri = process.env.MONGOLAB_URI;
}

mongoose.connect(uri);

mongoose.connection.on("connected", () => {
  console.log(`Mongoose connected to ${uri}`);
});
mongoose.connection.on("disconnected", () => {
  console.log(`Mongoose disconnected from ${uri}`);
});
mongoose.connection.on("error", err => {
  console.log(`Mongoose connection error: ${err}`);
});

shutDown = (message, cb) => {
  mongoose.connection.close(function() {
    console.log(`Mongoose disconnected: ${message}`);
    cb();
  });
};

// For nodemon restarts
process.once("SIGUSR2", () => {
  gracefulShutdown("Nodemon restarted", () => {
    process.kill(process.pid, "SIGUSR2");
  });
});

// For app termination
process.on("SIGINT", () => {
  gracefulShutdown("App terminated", () => {
    process.exit(0);
  });
});

// // For Heroku app termination
// process.on("SIGTERM", function() {
//   gracefulShutdown("Heroku app termination", function() {
//     process.exit(0);
//   });
// });

require("./users");
