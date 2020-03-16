let express = require("express");
let router = express.Router();
let path = require("path");
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
router.post("/users/signup", authenticationController.signUp);
router.post("/users/signin", authenticationController.signIn);

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
  "/projects/:projectId/files/:fileId/:fileName",
  auth,
  projectController.editFileName
);

module.exports = router;
