let express = require("express");
let router = express.Router();
let jwt = require("express-jwt");
let auth = jwt({
  secret: "MY_SECRET",
  userProperty: "payload"
});

let authenticationController = require("../controllers/authentication");

// router.get('/example', auth, ctrlExample.example);

// Authentication
router.post("/users/signup", authenticationController.signUp);
router.post("/users/signin", authenticationController.signIn);

module.exports = router;
