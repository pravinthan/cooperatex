let express = require("express");
let router = express.Router();
let path = require("path");
let { param, body } = require("express-validator");
let jwt = require("express-jwt");
let multer = require("multer");
let multerS3 = require("multer-s3");
let aws = require("aws-sdk");
aws.config.update({
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  region: process.env.S3_BUCKET_REGION,
});
let s3 = new aws.S3();
let auth = jwt({ secret: process.env.JWT_SECRET });
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
let upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.S3_BUCKET_NAME,
    key: (req, file, cb) => {
      cb(null, `${req.params.id}/${file.originalname}`);
    },
  }),
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 20 },
});

let authenticationController = require("../controllers/authentication");
let projectController = require("../controllers/project");

// Authentication
router.post(
  "/users/signup",
  [
    body("username")
      .trim()
      .isAlphanumeric()
      .isLength({ min: 3, max: 20 })
      .escape(),
    body("password").trim().isLength({ min: 8, max: 20 }).escape(),
  ],
  authenticationController.signUp
);
router.post(
  "/users/signin",
  [
    body("username")
      .trim()
      .isLength({ min: 3, max: 20 })
      .isAlphanumeric()
      .escape(),
    body("password").trim().isLength({ min: 8, max: 20 }).escape(),
  ],
  authenticationController.signIn
);

// Projects
router.post(
  "/projects",
  auth,
  [
    body("title")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isLength({ min: 1, max: 50 })
      .escape(),
    body("template")
      .exists({ checkNull: true, checkFalsy: true })
      .isIn(["default", "cover-letter", "title-page", "resume"]),
  ],
  projectController.createProject
);
router.get("/projects", auth, projectController.retrieveAllProjects);
router.get(
  "/projects/:id",
  auth,
  [
    param("id")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isMongoId()
      .escape(),
  ],
  projectController.retrieveProjectById
);
router.delete(
  "/projects/:id",
  auth,
  [
    param("id")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isMongoId()
      .escape(),
  ],
  projectController.deleteProjectById
);
router.post(
  "/projects/:id/files",
  auth,
  [
    param("id")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isMongoId()
      .escape(),
  ],
  upload.array("files"),
  projectController.uploadFiles
);
router.get(
  "/projects/:id/files",
  auth,
  [
    param("id")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isMongoId()
      .escape(),
  ],
  projectController.retrieveAllFiles
);
router.get(
  "/projects/:projectId/files/:fileId",
  auth,
  [
    param("projectId")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isMongoId()
      .escape(),
    param("fileId")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isMongoId()
      .escape(),
  ],
  projectController.retrieveFile
);
router.delete(
  "/projects/:projectId/files/:fileId",
  auth,
  [
    param("projectId")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isMongoId()
      .escape(),
    param("fileId")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isMongoId()
      .escape(),
  ],
  projectController.deleteFile
);
router.patch(
  "/projects/:projectId/files/:fileId",
  auth,
  [
    param("projectId")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isMongoId()
      .escape(),
    param("fileId")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isMongoId()
      .escape(),
    body("operation")
      .exists({ checkNull: true, checkFalsy: true })
      .isIn(["replaceMain", "replaceName", "replaceContents"]),
    body("newName")
      .if(body("newName").exists({ checkNull: true, checkFalsy: true }))
      .trim()
      .isLength({ min: 1, max: 50 })
      .escape(),
  ],
  projectController.patchFile
);
router.get(
  "/projects/:id/output",
  auth,
  [
    param("id")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isMongoId()
      .escape(),
  ],
  projectController.retrieveOutputPdf
);
router.get(
  "/projects/:id/source",
  auth,
  [
    param("id")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isMongoId()
      .escape(),
  ],
  projectController.retrieveSourceFiles
);
router.get(
  "/projects/:id/collaborators",
  auth,
  [
    param("id")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isMongoId()
      .escape(),
  ],
  projectController.retrieveCollaborators
);
router.post(
  "/projects/:id/collaborators",
  auth,
  [
    param("id")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isMongoId()
      .escape(),
    body("username")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .escape(),
    body("access")
      .exists({ checkNull: true, checkFalsy: true })
      .isIn(["read", "readWrite"]),
  ],
  projectController.inviteCollaborator
);
router.delete(
  "/projects/:projectId/collaborators/:userId",
  auth,
  [
    param("projectId")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isMongoId()
      .escape(),
    param("userId")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isMongoId()
      .escape(),
  ],
  projectController.removeCollaborator
);
router.patch(
  "/projects/:id/collaborators",
  auth,
  [
    param("id")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isMongoId()
      .escape(),
    body("operation")
      .exists({ checkNull: true, checkFalsy: true })
      .isIn(["accept", "reject"]),
  ],
  projectController.patchCollaborator
);

// Invitations
router.get("/invitations", auth, projectController.retrieveInvitations);

module.exports = router;
