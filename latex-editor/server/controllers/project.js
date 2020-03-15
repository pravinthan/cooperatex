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

module.exports.uploadFile = (req, res) => {
  Project.findById(req.params.id)
    .then(project => {
      if (!project)
        return res.status(404).send(`Project ${req.params.id} does not exist`);

      if (project.owner != req.user._id) return res.sendStatus(403);

      Project.findByIdAndUpdate(project._id, {
        $push: { files: req.file }
      }).then(result => res.json(req.file));
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
    .catch(err => res.sendStatus(500));
};
