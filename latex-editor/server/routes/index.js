let express = require("express");
let router = express.Router();
let jwt = require("express-jwt");
let auth = jwt({ secret: "MY_SECRET" });

let authenticationController = require("../controllers/authentication");
let projectController = require("../controllers/project");
let documentController = require("../controllers/document");

// router.get('/example', auth, ctrlExample.example);

// Authentication
router.post("/users/signup", authenticationController.signUp);
router.post("/users/signin", authenticationController.signIn);

// Project
router.post("/projects", auth, projectController.createProject);
router.get("/projects", auth, projectController.retrieveAllProjects);
router.get("/projects/:id", auth, projectController.retrieveProjectById);
router.delete("/projects/:id", auth, projectController.deleteProjectById);

// Document
// router.post("/documents", documentController.createDocument);

module.exports = router;
