let mongoose = require("mongoose");
const Schema = mongoose.Schema;

let projectSchema = new Schema({
  owner: {
    _id: {
      type: Schema.Types.ObjectId
    },
    username: String
  },
  title: String,
  collaborators: [
    {
      pendingInvitation: { type: Boolean, default: true },
      acceptedInvitation: { type: Boolean, default: false },
      access: {
        type: String,
        enum: ["read", "readWrite"]
      },
      user: {
        _id: {
          type: Schema.Types.ObjectId
        },
        username: String
      }
    }
  ],
  files: [
    {
      fieldname: String,
      originalname: String,
      encoding: String,
      mimetype: String,
      size: String,
      destination: String,
      filename: String,
      path: String,
      buffer: Array,
      isMain: Boolean
    }
  ],
  dateCreated: { type: Date, default: Date.now },
  lastUpdated: Date,
  lastUpdatedBy: {
    _id: {
      type: Schema.Types.ObjectId
    },
    username: String
  }
});

mongoose.model("Project", projectSchema);
