let mongoose = require("mongoose");
let Project = mongoose.model("Project");

module.exports.createProject = (req, res) => {
  if (!req.body.title || req.body.title.length > 50)
    return res
      .status(400)
      .json("Title required and must be less than or equal to 50 characters");

  Project.create({
    owner: req.user._id,
    title: req.body.title,
    collaborators: [],
    lastUpdated: Date.now(),
    lastUpdatedBy: req.user._id
  })
    .then(project => res.json(project))
    .catch(err => res.sendStatus(500));
};

module.exports.retrieveProjectById = (req, res) => {
  Project.findById(req.params.id)
    .populate("owner", "_id username")
    .populate("collaborators", "_id username")
    .populate("lastUpdatedBy", "_id username")
    .exec()
    .then(project => {
      if (!project)
        return res.status(404).send(`Project ${req.params.id} does not exist`);

      if (project.owner._id != req.user._id) return res.sendStatus(403);

      res.json(project);
    })
    .catch(err => res.sendStatus(500));
};

module.exports.retrieveAllProjects = (req, res) => {
  Project.find({ owner: req.user._id })
    .populate("owner", "_id username")
    .populate("collaborators", "_id username")
    .populate("lastUpdatedBy", "_id username")
    .exec()
    .then(projects => res.json(projects))
    .catch(err => res.sendStatus(500));
};

module.exports.deleteProjectById = (req, res) => {
  Project.findById(req.params.id)
    .then(project => {
      if (!project)
        return res.status(404).send(`Project ${req.params.id} does not exist`);

      if (project.owner != req.user._id) return res.sendStatus(403);

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

      if (project.owner != req.user._id) return res.sendStatus(403);

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

      if (project.owner != req.user._id) return res.sendStatus(403);

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

      if (project.owner != req.user._id) return res.sendStatus(403);

      const file = project.files.find(file => file._id == req.params.fileId);
      res.sendFile(file.path);
    })
    .catch(err => {
      console.log(err);
      res.sendStatus(500);
    });
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

      if (project.owner != req.user._id) return res.sendStatus(403);

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
  // body: op: replaceFileName/replaceFileMain, id: fileId, val: newName/newMain
  Project.findById(req.params.projectId)
    .then(project => {
      if (!project)
        return res
          .status(404)
          .send(`Project ${req.params.projectId} does not exist`);

      if (project.owner != req.user._id) return res.sendStatus(403);

      if (req.body.operation == "replaceMain") {
        if (project.files.find(file => file.isMain == true)) {
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
        if (project.files.find(file => file.originalname == req.body.newName)) return res.status(409).send("File name exists");
        const oldName = project.files.find(file => file._id == req.params.fileId).originalname;
        let newName = req.body.newName + oldName.substring(oldName.indexOf('.'))
        Project.findOneAndUpdate(
          { _id: project._id, "files._id": req.params.fileId },
          { $set: { "files.$.originalname": newName } }
        ).then(project =>
          res.sendStatus(200)
        );

      }
    })
    .catch(err => res.sendStatus(500));
};
