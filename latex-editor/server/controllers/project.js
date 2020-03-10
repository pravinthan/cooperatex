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
    .catch(err => res.status(500).json("Internal server error"));
};

module.exports.retrieveProjectById = (req, res) => {
  Project.findById(req.params.id)
    .populate("owner", "_id username")
    .populate("collaborators", "_id username")
    .populate("lastUpdatedBy", "_id username")
    .exec()
    .then(project => {
      if (!project)
        return res.status(404).json(`Project ${req.params.id} does not exist`);

      res.json(project);
    })
    .catch(err => res.status(500).json("Internal server error"));
};

module.exports.retrieveAllProjects = (req, res) => {
  Project.find({ owner: req.user._id })
    .populate("owner", "_id username")
    .populate("collaborators", "_id username")
    .populate("lastUpdatedBy", "_id username")
    .exec()
    .then(projects => res.json(projects))
    .catch(err => res.status(500).json("Internal server error"));
};

module.exports.deleteProjectById = (req, res) => {
  Project.findByIdAndDelete(req.params.id)
    .then(project => {
      if (!project)
        return res.status(404).json(`Project ${req.params.id} does not exist`);

      res.json(project);
    })
    .catch(err => res.status(500).json("Internal server error"));
};
