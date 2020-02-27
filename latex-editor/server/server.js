let express = require("express");
let bodyParser = require("body-parser");
let mongodb = require("mongodb");

let app = express();
app.use(bodyParser.json());

let db;

// Connect to the database
mongodb.MongoClient.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/test",
  (err, client) => {
    if (err) {
      console.log(err);
      process.exit(1);
    }

    db = client.db();
    console.log("db ready");

    // Initialize the app.
    let server = app.listen(process.env.PORT || 8080, () => {
      let port = server.address().port;
      console.log("App running on port", port);
    });
  }
);
