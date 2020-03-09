let mongoose = require("mongoose");
let crypto = require("crypto");
let jwt = require("jsonwebtoken");
const Document = mongoose.model("Document");
const Schema = mongoose.Schema;

let userSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  hash: String,
  salt: String,
  projects: [{ document: Document }]
});

userSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString("hex");
  this.hash = crypto
    .pbkdf2Sync(password, this.salt, 1000, 64, "sha512")
    .toString("hex");
};

userSchema.methods.validPassword = function(password) {
  let hash = crypto
    .pbkdf2Sync(password, this.salt, 1000, 64, "sha512")
    .toString("hex");
  return this.hash === hash;
};

userSchema.methods.generateJwt = function() {
  let expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);

  return jwt.sign(
    {
      _id: this._id,
      name: this.name,
      exp: parseInt(expiry.getTime() / 1000)
    },
    "MY_SECRET"
  ); // DO NOT KEEP YOUR SECRET IN THE CODE!
};

mongoose.model("User", userSchema);
