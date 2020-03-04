let passport = require("passport");
let mongoose = require("mongoose");
let User = mongoose.model("User");

module.exports.signUp = (req, res) => {
  if (!req.body.username || !req.body.password) {
    return res.status(400).json("Username and password required");
  }

  let user = new User();
  user.username = req.body.username;
  user.setPassword(req.body.password);

  user.save(err => {
    let token = user.generateJwt();
    res.status(200);
    res.json({
      token: token
    });
  });
};

module.exports.signIn = (req, res) => {
  if (!req.body.username || !req.body.password) {
    return res.status(400).json("Username and password required");
  }

  passport.authenticate("local", (err, user, info) => {
    if (err) return res.status(404).json(err);
    if (!user) return res.status(401).json(info);

    res.json({ token: user.generateJwt() });
  })(req, res);
};
