let path = require("path");
let latex = require("node-latex");
let exec = require("child_process").exec;
let fs = require("fs");
let mongoose = require("mongoose");
let Project = mongoose.model("Project");
let User = mongoose.model("User");

module.exports.createProject = (req, res) => {
  if (!req.body.title || req.body.title.length > 50)
    return res
      .status(400)
      .json("Title required and must be less than or equal to 50 characters");

  Project.create({
    owner: { _id: req.user._id, username: req.user.username },
    title: req.body.title,
    collaborators: [],
    lastUpdated: Date.now(),
    lastUpdatedBy: { _id: req.user._id, username: req.user.username }
  })
    .then(project => res.json(project))
    .catch(err => res.sendStatus(500));
};

module.exports.retrieveProjectById = (req, res) => {
  Project.findById(req.params.id)
    .then(project => {
      if (!project)
        return res.status(404).send(`Project ${req.params.id} does not exist`);

      if (project.owner._id != req.user._id) return res.sendStatus(403);

      res.json(project);
    })
    .catch(err => res.sendStatus(500));
};

module.exports.retrieveAllProjects = (req, res) => {
  Project.find({ "owner._id": req.user._id })
    .then(projects => res.json(projects))
    .catch(err => res.sendStatus(500));
};

module.exports.deleteProjectById = (req, res) => {
  Project.findById(req.params.id)
    .then(project => {
      if (!project)
        return res.status(404).send(`Project ${req.params.id} does not exist`);

      if (project.owner._id != req.user._id) return res.sendStatus(403);

      Project.findByIdAndDelete(project._id).then(project =>
        res.sendStatus(200)
      );
    })
    .catch(err => res.sendStatus(500));
};

module.exports.uploadFiles = (req, res) => {
  Project.findById(req.params.id)
    .then(project => {
      if (!project)
        return res.status(404).send(`Project ${req.params.id} does not exist`);

      if (project.owner._id != req.user._id) return res.sendStatus(403);

      const existingFileNames = project.files.map(file => file.originalname);
      for (const file of req.files) {
        if (existingFileNames.includes(file.originalname)) {
          return res
            .status(409)
            .send(`File ${file.originalname} already exists`);
        }
      }

      let promises = [];
      for (let i = 0; i < req.files.length; i++) {
        promises.push(
          Project.findByIdAndUpdate(
            project._id,
            {
              $push: { files: { ...req.files[i], isMain: false } }
            },
            { new: true }
          )
        );
      }

      Promise.all(promises).then(projects =>
        res.json(projects[promises.length - 1].files)
      );
    })
    .catch(err => res.sendStatus(500));
};

module.exports.retrieveAllFiles = (req, res) => {
  Project.findById(req.params.id)
    .then(project => {
      if (!project)
        return res.status(404).send(`Project ${req.params.id} does not exist`);

      if (project.owner._id != req.user._id) return res.sendStatus(403);

      res.json(project.files);
    })
    .catch(err => res.sendStatus(500));
};

module.exports.retrieveFile = (req, res) => {
  Project.findById(req.params.projectId)
    .then(project => {
      if (!project)
        return res
          .status(404)
          .send(`Project ${req.params.projectId} does not exist`);

      if (project.owner._id != req.user._id) return res.sendStatus(403);

      const file = project.files.find(file => file._id == req.params.fileId);
      res.sendFile(file.path);
    })
    .catch(err => res.sendStatus(500));
};

module.exports.deleteFile = (req, res) => {
  if (!req.params.fileId || !req.params.projectId) {
    return res.status(400).send("File id and project id required");
  }

  Project.findById(req.params.projectId)
    .then(project => {
      if (!project)
        return res
          .status(404)
          .send(`Project ${req.params.projectId} does not exist`);

      if (project.owner._id != req.user._id) return res.sendStatus(403);

      Project.findByIdAndUpdate(project._id, {
        $pull: { files: { _id: req.params.fileId } }
      }).then(project => res.sendStatus(200));
    })
    .catch(err => res.sendStatus(500));
};

const assignMain = (projectId, fileId) => {
  return Project.findOneAndUpdate(
    { _id: projectId, "files._id": fileId },
    { $set: { "files.$.isMain": true } }
  );
};

module.exports.patchFile = (req, res) => {
  Project.findById(req.params.projectId)
    .then(project => {
      if (!project)
        return res
          .status(404)
          .send(`Project ${req.params.projectId} does not exist`);

      if (project.owner._id != req.user._id) return res.sendStatus(403);

      if (req.body.operation == "replaceMain") {
        if (project.files.find(file => file.isMain)) {
          Project.findOneAndUpdate(
            { _id: project._id, "files.isMain": true },
            { $set: { "files.$.isMain": false } }
          ).then(project => {
            assignMain(project._id, req.params.fileId).then(project =>
              res.sendStatus(200)
            );
          });
        } else {
          assignMain(project._id, req.params.fileId).then(project =>
            res.sendStatus(200)
          );
        }
      } else if (req.body.operation == "replaceName") {
        if (project.files.find(file => file.originalname == req.body.newName))
          return res.status(409).send("File name exists");

        const oldName = project.files.find(
          file => file._id == req.params.fileId
        ).originalname;
        const newName =
          req.body.newName + oldName.substring(oldName.indexOf("."));
        Project.findOneAndUpdate(
          { _id: project._id, "files._id": req.params.fileId },
          { $set: { "files.$.originalname": newName } }
        ).then(project => res.sendStatus(200));
      } else if (req.body.operation == "replaceContents") {
        const fileToUpdate = project.files.find(
          file => file._id == req.params.fileId
        );

        fs.readFile(fileToUpdate.path, "utf8", (err, data) => {
          if (err) return res.sendStatus(500);

          fs.writeFile(fileToUpdate.path, req.body.newContents, "utf8", err => {
            if (err) return res.sendStatus(500);

            return res.sendStatus(200);
          });
        });
      }
    })
    .catch(err => res.sendStatus(500));
};

module.exports.retrieveOutputPdf = (req, res) => {
  Project.findById(req.params.id)
    .then((project, reject) => {
      if (!project)
        return res.status(404).send(`Project ${req.params.id} does not exist`);

      if (project.owner._id != req.user._id) return res.sendStatus(403);

      const mainFile = project.files.find(file => file.isMain);
      const outputPath = mainFile.path + ".pdf";
      const logPath = mainFile.path + ".log";
      let input = fs.createReadStream(mainFile.path);
      let output = fs.createWriteStream(outputPath);
      let pdf = latex(input, { errorLogs: logPath });
      pdf.pipe(output);

      pdf.on("error", err => {
        fs.readFile(logPath, (err, data) => {
          if (err) reject(err);
          return res.status(409).send(data.toString());
        });
      });

      pdf.on("finish", () => res.sendFile(outputPath));

      // let afterCompile = function(err) {
      //   if (err) console.log(err);

      //   // store the logs for the user here
      //   fs.readFile(logPath, (err, data) => {
      //     if (err) console.log(err);
      //     response.logs = data ? data.toString() : "";
      //     res.sendFile(outputPath);
      //   });
      // };

      // exec(
      //   `pdflatex -interaction=nonstopmode -jobname=${mainFile.filename} ${mainFile.filename} > /dev/null 2>&1`,
      //   { cwd: mainFile.destination },
      //   afterCompile
      // );
    })
    .catch(err => res.sendStatus(500));
};

module.exports.inviteCollaborator = (req, res) => {
  Project.findById(req.params.id)
    .then(project => {
      if (!project)
        return res.status(404).send(`Project ${req.params.id} does not exist`);

      if (project.owner._id != req.user._id) return res.sendStatus(403);

      User.findOne({ username: req.body.username }).then(user => {
        if (!user)
          return res
            .status(404)
            .send(`Username ${req.body.username} does not exist`);

        if (
          project.collaborators.find(collaborator =>
            collaborator.user._id.equals(user._id)
          )
        ) {
          return res
            .status(409)
            .send(`Username ${user.username} already exists as a collaborator`);
        }

        const newCollaborator = {
          access: req.body.access,
          user: { _id: user._id, username: user.username }
        };
        Project.findByIdAndUpdate(project._id, {
          $push: { collaborators: newCollaborator }
        }).then(project => res.json(newCollaborator));
      });
    })
    .catch(err => res.sendStatus(500));
};

module.exports.removeCollaborator = (req, res) => {
  Project.findById(req.params.projectId)
    .then(project => {
      if (!project)
        return res
          .status(404)
          .send(`Project ${req.params.projectId} does not exist`);

      if (project.owner._id != req.user._id) return res.sendStatus(403);

      User.findById(req.params.userId).then(user => {
        if (!user)
          return res
            .status(404)
            .send(`User ${req.params.userId} does not exist`);

        if (
          !project.collaborators.find(collaborator =>
            collaborator.user._id.equals(user._id)
          )
        ) {
          return res
            .status(404)
            .send(`User ${user._id} does not exist as a collaborator`);
        }

        Project.findByIdAndUpdate(project._id, {
          $pull: { collaborators: { "user._id": user._id } }
        }).then(project => res.sendStatus(200));
      });
    })
    .catch(err => res.sendStatus(500));
};
