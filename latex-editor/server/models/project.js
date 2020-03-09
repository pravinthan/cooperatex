let mongoose = require("mongoose");
const Schema = mongoose.Schema;

let projectSchema = new Schema({
  title: {
    type: String,
    default: "Untitled Project"
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  // collaborators: [
  //   {
  //     type: mongoose.Schema.ObjectId,
  //     ref: "User"
  //   }
  // ],
  files: [],
  // shareLink: String,
  dateCreated: String
});

mongoose.model("Project", projectSchema);
