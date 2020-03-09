let express = require("express");
let router = express.Router();
let jwt = require("express-jwt");
let auth = jwt({
  secret: "MY_SECRET",
  userProperty: "payload"
});

let authenticationController = require("../controllers/authentication");
let documentController = require("../controllers/document");

// router.get('/example', auth, ctrlExample.example);

// Authentication
router.post("/users/signup", authenticationController.signUp);
router.post("/users/signin", authenticationController.signIn);

// Document
router.post("/documents", documentController.createDocument);

module.exports = router;
