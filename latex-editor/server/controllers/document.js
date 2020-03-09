let mongoose = require("mongoose");
let Document = mongoose.model("Document");
let User = mongoose.model("User");

module.exports.createDocument = (req, res) => {
  Document.create(
    {
      owner: req.user.username,
      content: "test",
      dateCreated: Date.now()
    },
    (err, document) => {
      if (err) res.status(500).json("Internal server error");

      res.json(document);
    }
  );
};

module.exports.retrieveDocumentById = (req, res) => {
  Document.findById(req.params.id, (err, document) => {
    if (err) res.status(500).json("Internal server error");
    if (!document)
      res.status(404).json(`Document ${req.params.id} does not exist`);

    res.json(document);
  });
};
