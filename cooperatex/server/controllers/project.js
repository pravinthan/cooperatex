let latex = require("node-latex");
let path = require("path");
let fs = require("fs");
let os = require("os");
let mongoose = require("mongoose");
let { validationResult } = require("express-validator");
let aws = require("aws-sdk");
let s3Zip = require("s3-zip");
aws.config.update({
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  region: process.env.S3_BUCKET_REGION,
});
let s3 = new aws.S3();
let Project = mongoose.model("Project");
let User = mongoose.model("User");

const isAllowedAccess = (project, userId) =>
  project.owner._id.equals(userId) ||
  project.collaborators.find(
    (collaborator) =>
      collaborator.user._id.equals(userId) && collaborator.acceptedInvitation
  );

const hasReadWriteAccess = (project, userId) =>
  project.owner._id.equals(userId) ||
  project.collaborators.find(
    (collaborator) =>
      collaborator.user._id.equals(userId) &&
      collaborator.acceptedInvitation &&
      collaborator.access == "readWrite"
  );

const isBadRequest = (req) => !validationResult(req).isEmpty();

module.exports.createProject = async (req, res) => {
  if (isBadRequest(req)) return res.sendStatus(400);

  let createdProject;
  try {
    createdProject = await Project.create({
      owner: { _id: req.user._id, username: req.user.username },
      title: req.body.title,
      collaborators: [],
      lastUpdated: Date.now(),
      lastUpdatedBy: { _id: req.user._id, username: req.user.username },
    });
  } catch (err) {
    return res.sendStatus(500);
  }

  const templateFileName = "main.tex";
  let templateFile;
  try {
    templateFile = await fs.promises.readFile(
      path.join(
        __dirname,
        `../../latex-templates/${req.body.template}/${templateFileName}`
      )
    );
  } catch (err) {
    return res
      .sendStatus(404)
      .send(`Template ${req.body.template} does not exist`);
  }

  try {
    await s3
      .upload({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${createdProject._id}/${templateFileName}`,
        Body: templateFile,
      })
      .promise();

    const fileMetadata = {
      fieldname: "files",
      originalname: templateFileName,
      encoding: "7bit",
      mimetype: "application/octet-stream",
      size: "String",
      isMain: true,
    };
    let updatedProject = await Project.findByIdAndUpdate(
      createdProject._id,
      { $push: { files: fileMetadata } },
      { new: true }
    );

    res.json(updatedProject);
  } catch (err) {
    res.sendStatus(500);
  }
};

module.exports.retrieveProjectById = async (req, res) => {
  if (isBadRequest(req)) return res.sendStatus(400);

  try {
    let project = await Project.findById(req.params.id);

    if (!project)
      return res.status(404).send(`Project ${req.params.id} does not exist`);

    if (!isAllowedAccess(project, req.user._id)) return res.sendStatus(403);

    res.json(project);
  } catch (err) {
    res.sendStatus(500);
  }
};

module.exports.retrieveAllProjects = async (req, res) => {
  try {
    let projects = await Project.find({});

    let projectsRes = [];
    projects.forEach((project) => {
      if (project.owner._id.equals(req.user._id)) projectsRes.push(project);

      project.collaborators.forEach((collaborator) => {
        if (
          collaborator.user._id.equals(req.user._id) &&
          collaborator.acceptedInvitation
        ) {
          projectsRes.push(project);
        }
      });
    });

    res.json(projectsRes);
  } catch (err) {
    res.sendStatus(500);
  }
};

module.exports.deleteProjectById = async (req, res) => {
  if (isBadRequest(req)) return res.sendStatus(400);

  try {
    let project = await Project.findById(req.params.id);

    if (!project)
      return res.status(404).send(`Project ${req.params.id} does not exist`);

    if (project.owner._id != req.user._id) return res.sendStatus(403);

    await Project.findByIdAndDelete(project._id);

    if (project.files.length > 0) {
      await s3
        .deleteObjects({
          Bucket: process.env.S3_BUCKET_NAME,
          Delete: {
            Objects: project.files.map(
              (file) => (file = { Key: `${project._id}/${file.originalname}` })
            ),
          },
        })
        .promise();
    }

    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
  }
};

module.exports.uploadFiles = async (req, res) => {
  if (isBadRequest(req)) return res.sendStatus(400);

  try {
    let project = await Project.findById(req.params.id);

    if (!project)
      return res.status(404).send(`Project ${req.params.id} does not exist`);

    if (
      !isAllowedAccess(project, req.user._id) ||
      !hasReadWriteAccess(project, req.user._id)
    )
      return res.sendStatus(403);

    const existingFileNames = project.files.map((file) => file.originalname);
    for (const file of req.files) {
      if (existingFileNames.includes(file.originalname)) {
        return res.status(409).send(`File ${file.originalname} already exists`);
      }
    }

    let updatedProject;
    for (let i = 0; i < req.files.length; i++) {
      updatedProject = await Project.findByIdAndUpdate(
        project._id,
        {
          $push: { files: { ...req.files[i], isMain: false } },
          $set: {
            lastUpdated: Date.now(),
            lastUpdatedBy: {
              _id: req.user._id,
              username: req.user.username,
            },
          },
        },
        { new: true }
      );
    }

    res.json(updatedProject.files);
  } catch (err) {
    res.sendStatus(500);
  }
};

module.exports.retrieveAllFiles = async (req, res) => {
  if (isBadRequest(req)) return res.sendStatus(400);

  try {
    let project = await Project.findById(req.params.id);

    if (!project)
      return res.status(404).send(`Project ${req.params.id} does not exist`);

    if (!isAllowedAccess(project, req.user._id)) return res.sendStatus(403);

    res.json(project.files);
  } catch (err) {
    res.sendStatus(500);
  }
};

module.exports.retrieveFile = async (req, res) => {
  if (isBadRequest(req)) return res.sendStatus(400);

  try {
    let project = await Project.findById(req.params.projectId);

    if (!project)
      return res
        .status(404)
        .send(`Project ${req.params.projectId} does not exist`);

    if (!isAllowedAccess(project, req.user._id)) return res.sendStatus(403);

    const file = project.files.find((file) => file._id == req.params.fileId);
    if (!file)
      return res.status(404).send(`File ${req.params.fileId} does not exist`);

    const folderPath = path.join(os.tmpdir(), project._id.toString());
    await fs.promises.mkdir(folderPath, { recursive: true });

    const filePath = path.join(folderPath, `./${file.originalname}`);
    let fileStream = fs.createWriteStream(filePath);

    s3.getObject({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `${project._id}/${file.originalname}`,
    })
      .createReadStream()
      .pipe(fileStream);

    fileStream.on("finish", () => res.sendFile(filePath));
  } catch (err) {
    res.sendStatus(500);
  }
};

module.exports.deleteFile = async (req, res) => {
  if (isBadRequest(req)) return res.sendStatus(400);

  try {
    let project = await Project.findById(req.params.projectId);

    if (!project)
      return res
        .status(404)
        .send(`Project ${req.params.projectId} does not exist`);

    if (
      !isAllowedAccess(project, req.user._id) ||
      !hasReadWriteAccess(project, req.user._id)
    )
      return res.sendStatus(403);

    const fileToDelete = project.files.find(
      (file) => file._id == req.params.fileId
    );
    if (!fileToDelete)
      return res.status(404).send(`File ${req.params.fileId} does not exist`);

    await Project.findByIdAndUpdate(project._id, {
      $pull: { files: { _id: fileToDelete._id } },
      $set: {
        lastUpdated: Date.now(),
        lastUpdatedBy: {
          _id: req.user._id,
          username: req.user.username,
        },
      },
    });

    await s3
      .deleteObject({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${project._id}/${fileToDelete.originalname}`,
      })
      .promise();

    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
  }
};

module.exports.patchFile = async (req, res) => {
  if (isBadRequest(req)) return res.sendStatus(400);

  try {
    let project = await Project.findById(req.params.projectId);

    if (!project)
      return res
        .status(404)
        .send(`Project ${req.params.projectId} does not exist`);

    if (
      !isAllowedAccess(project, req.user._id) ||
      !hasReadWriteAccess(project, req.user._id)
    )
      return res.sendStatus(403);

    if (req.body.operation == "replaceMain") {
      if (project.files.find((file) => file.isMain)) {
        await Project.findOneAndUpdate(
          { _id: project._id, "files.isMain": true },
          { $set: { "files.$.isMain": false } }
        );
      }

      await Project.findOneAndUpdate(
        { _id: project._id, "files._id": req.params.fileId },
        {
          $set: {
            "files.$.isMain": true,
            lastUpdated: Date.now(),
            lastUpdatedBy: {
              _id: req.user._id,
              username: req.user.username,
            },
          },
        }
      );
    } else if (req.body.operation == "replaceName") {
      const oldName = project.files.find(
        (file) => file._id == req.params.fileId
      ).originalname;
      const newName =
        req.body.newName + oldName.substring(oldName.indexOf("."));

      if (project.files.find((file) => file.originalname == newName))
        return res.status(409).send("File name exists");

      await Project.findOneAndUpdate(
        { _id: project._id, "files._id": req.params.fileId },
        {
          $set: {
            "files.$.originalname": newName,
            lastUpdated: Date.now(),
            lastUpdatedBy: {
              _id: req.user._id,
              username: req.user.username,
            },
          },
        }
      );

      // Copy object over to a new object (to rename)
      await s3
        .copyObject({
          Bucket: process.env.S3_BUCKET_NAME,
          CopySource: `${process.env.S3_BUCKET_NAME}/${project._id}/${oldName}`,
          Key: `${project._id}/${newName}`,
        })
        .promise();

      // Delete the old object
      await s3
        .deleteObject({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: `${project._id}/${oldName}`,
        })
        .promise();
    } else if (req.body.operation == "replaceContents") {
      const fileToUpdate = project.files.find(
        (file) => file._id == req.params.fileId
      );

      await s3
        .putObject({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: `${project._id}/${fileToUpdate.originalname}`,
          Body: req.body.newContents,
        })
        .promise();

      await Project.findByIdAndUpdate(project._id, {
        $set: {
          lastUpdated: Date.now(),
          lastUpdatedBy: {
            _id: req.user._id,
            username: req.user.username,
          },
        },
      });
    }

    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
  }
};

module.exports.retrieveOutputPdf = async (req, res) => {
  if (isBadRequest(req)) return res.sendStatus(400);

  try {
    let project = await Project.findById(req.params.id);

    if (!project)
      return res.status(404).send(`Project ${req.params.id} does not exist`);

    if (!isAllowedAccess(project, req.user._id)) return res.sendStatus(403);

    const folderPath = path.join(os.tmpdir(), project._id.toString());
    await fs.promises.mkdir(folderPath, { recursive: true });

    // Remove files that are no longer in the project
    const existingFiles = await fs.promises.readdir(folderPath);
    for (const file of existingFiles) {
      if (
        !project.files.find((projectFile) => projectFile.originalname == file)
      )
        await fs.promises.unlink(path.join(folderPath, file));
    }

    // Copy files over to temp directory
    const mainFile = project.files.find((file) => file.isMain);
    for (const file of project.files) {
      if (file._id != mainFile._id) {
        s3.getObject({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: `${project._id}/${file.originalname}`,
        })
          .createReadStream()
          .pipe(fs.createWriteStream(path.join(folderPath, file.originalname)));
      }
    }

    const outputPath = path.join(folderPath, `${mainFile._id}.pdf`);
    const logPath = path.join(folderPath, `${mainFile._id}.log`);
    let input = s3
      .getObject({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${project._id}/${mainFile.originalname}`,
      })
      .createReadStream();
    let output = fs.createWriteStream(outputPath);
    let pdf = latex(input, {
      inputs: folderPath,
      fonts: folderPath,
      errorLogs: logPath,
    });
    pdf.pipe(output);

    pdf.on("error", (err) => {
      fs.readFile(logPath, (err, data) => {
        if (err || !data) throw err;
        return res.status(409).send(data.toString());
      });
    });

    pdf.on("finish", () => res.sendFile(outputPath));
  } catch (err) {
    res.sendStatus(500);
  }
};

module.exports.retrieveSourceFiles = async (req, res) => {
  if (isBadRequest(req)) return res.sendStatus(400);

  try {
    let project = await Project.findById(req.params.id);

    if (!project)
      return res.status(404).send(`Project ${req.params.id} does not exist`);

    if (!isAllowedAccess(project, req.user._id)) return res.sendStatus(403);

    const folderPath = path.join(os.tmpdir(), project._id.toString());
    await fs.promises.mkdir(folderPath, { recursive: true });

    const downloadPath = path.join(folderPath, `${project._id}.zip`);
    let output = fs.createWriteStream(downloadPath);

    const fileNames = project.files.map((file) => (file = file.originalname));
    s3Zip
      .archive(
        {
          region: process.env.S3_BUCKET_REGION,
          bucket: process.env.S3_BUCKET_NAME,
        },
        project._id + "/",
        fileNames
      )
      .pipe(output);

    output.on("close", () =>
      res.download(downloadPath, project.title + ".zip")
    );
  } catch (err) {
    res.sendStatus(500);
  }
};

module.exports.retrieveCollaborators = async (req, res) => {
  if (isBadRequest(req)) return res.sendStatus(400);

  try {
    let project = await Project.findById(req.params.id);

    if (!project)
      return res.status(404).send(`Project ${req.params.id} does not exist`);

    if (!isAllowedAccess(project, req.user._id)) return res.sendStatus(403);

    res.json(project.collaborators);
  } catch (err) {
    res.sendStatus(500);
  }
};

module.exports.inviteCollaborator = async (req, res) => {
  if (isBadRequest(req)) return res.sendStatus(400);

  try {
    let project = await Project.findById(req.params.id);

    if (!project)
      return res.status(404).send(`Project ${req.params.id} does not exist`);

    if (project.owner._id != req.user._id) return res.sendStatus(403);

    let user = await User.findOne({ username: req.body.username });

    if (!user)
      return res
        .status(404)
        .send(`Username ${req.body.username} does not exist`);

    if (
      project.collaborators.find((collaborator) =>
        collaborator.user._id.equals(user._id)
      )
    ) {
      return res
        .status(409)
        .send(`Username ${user.username} already exists as a collaborator`);
    }

    const newCollaborator = {
      pendingInvitation: true,
      acceptedInvitation: false,
      access: req.body.access,
      user: { _id: user._id, username: user.username },
    };
    await Project.findByIdAndUpdate(project._id, {
      $push: { collaborators: newCollaborator },
    });

    res.json(newCollaborator);
  } catch (err) {
    res.sendStatus(500);
  }
};

module.exports.removeCollaborator = async (req, res) => {
  if (isBadRequest(req)) return res.sendStatus(400);

  try {
    let project = await Project.findById(req.params.projectId);

    if (!project)
      return res
        .status(404)
        .send(`Project ${req.params.projectId} does not exist`);

    // Only allow a user that is either owner or the collaborator themselves
    if (
      !(
        project.owner._id.equals(req.user._id) ||
        (project.collaborators.find(
          (collaborator) =>
            collaborator.user._id.equals(req.user._id) &&
            collaborator.acceptedInvitation
        ) &&
          req.params.userId == req.user._id)
      )
    )
      return res.sendStatus(403);

    let user = await User.findById(req.params.userId);

    if (!user)
      return res.status(404).send(`User ${req.params.userId} does not exist`);

    if (
      !project.collaborators.find((collaborator) =>
        collaborator.user._id.equals(user._id)
      )
    ) {
      return res
        .status(404)
        .send(`User ${user._id} does not exist as a collaborator`);
    }

    await Project.findByIdAndUpdate(project._id, {
      $pull: { collaborators: { "user._id": user._id } },
    });

    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
  }
};

module.exports.patchCollaborator = async (req, res) => {
  if (isBadRequest(req)) return res.sendStatus(400);

  try {
    let project = await Project.findById(req.params.id);

    if (!project)
      return res.status(404).send(`Project ${req.params.id} does not exist`);

    // Only allow a user that was invited to accept/reject
    if (
      !project.collaborators.find((collaborator) =>
        collaborator.user._id.equals(req.user._id)
      )
    )
      return res.sendStatus(403);

    await Project.findOneAndUpdate(
      {
        _id: project._id,
        "collaborators.user._id": req.user._id,
      },
      {
        $set: {
          "collaborators.$.pendingInvitation": false,
          "collaborators.$.acceptedInvitation": req.body.operation == "accept",
        },
      }
    );

    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
  }
};

module.exports.retrieveInvitations = async (req, res) => {
  try {
    let projects = await Project.find({});

    let invitations = [];
    projects.forEach((project) => {
      project.collaborators.forEach((collaborator) => {
        if (
          collaborator.user._id.equals(req.user._id) &&
          collaborator.pendingInvitation
        ) {
          invitations.push({
            from: project.owner,
            to: { _id: req.user._id, username: req.user.username },
            projectId: project._id,
            projectTitle: project.title,
          });
        }
      });
    });

    res.json(invitations);
  } catch (err) {
    res.sendStatus(500);
  }
};
