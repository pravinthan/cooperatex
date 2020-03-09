let mongoose = require("mongoose");
const Schema = mongoose.Schema;

let documentSchema = new Schema({
  title: {
    type: String,
    default: "Untitled Document"
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  content: String,
  dateCreated: String
});

mongoose.model("Document", documentSchema);
