let express = require("express");
let router = express.Router();
let path = require("path");
let { param, body } = require("express-validator");
let jwt = require("express-jwt");
let auth = jwt({ secret: "MY_SECRET" });
const fileFilter = (req, file, callback) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "application/x-tex" ||
    file.mimetype === "application/x-latex" ||
    file.mimetype === "application/octet-stream"
  )
    callback(null, true);
  else callback(null, false);
};
let upload = require("multer")({
  dest: path.join(__dirname, "../../uploads"),
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 20 }
});

let authenticationController = require("../controllers/authentication");
let projectController = require("../controllers/project");

// Authentication
router.post(
  "/users/signup",
  [
    body("username")
      .isLength({ min: 3, max: 20 })
      .isAlphanumeric()
      .trim()
      .escape(),
    body("password")
      .isLength({ min: 8, max: 20 })
      .trim()
      .escape()
  ],
  authenticationController.signUp
);
router.post(
  "/users/signin",
  [
    body("username")
      .isLength({ min: 3, max: 20 })
      .isAlphanumeric()
      .trim()
      .escape(),
    body("password")
      .isLength({ min: 8, max: 20 })
      .trim()
      .escape()
  ],
  authenticationController.signIn
);

// Project
router.post("/projects", auth, projectController.createProject);
router.get("/projects", auth, projectController.retrieveAllProjects);
router.get("/projects/:id", auth, projectController.retrieveProjectById);
router.delete("/projects/:id", auth, projectController.deleteProjectById);
router.post(
  "/projects/:id/files",
  auth,
  upload.array("files"),
  projectController.uploadFiles
);
router.get("/projects/:id/files", auth, projectController.retrieveAllFiles);
router.get(
  "/projects/:projectId/files/:fileId",
  auth,
  projectController.retrieveFile
);
router.delete(
  "/projects/:projectId/files/:fileId",
  auth,
  projectController.deleteFile
);
router.patch(
  "/projects/:projectId/files/:fileId",
  auth,
  projectController.patchFile
);
router.get("/projects/:id/output", auth, projectController.retrieveOutputPdf);
router.get(
  "/projects/:id/collaborators",
  auth,
  projectController.retrieveCollaborators
);
router.post(
  "/projects/:id/collaborators",
  auth,
  projectController.inviteCollaborator
);
router.delete(
  "/projects/:projectId/collaborators/:userId",
  auth,
  projectController.removeCollaborator
);
router.patch(
  "/projects/:projectId/collaborators/:userId",
  auth,
  projectController.patchCollaborator
);

router.get("/invitations", auth, projectController.retrieveInvitations);

module.exports = router;
