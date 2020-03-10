let passport = require("passport");
let mongoose = require("mongoose");
let User = mongoose.model("User");

module.exports.signUp = (req, res) => {
  if (!req.body.username || !req.body.password) {
    return res.status(400).json("Username and password required");
  }

  User.findOne({ username: req.body.username })
    .then(user => {
      if (user)
        return res
          .status(409)
          .send(`Username ${req.body.username} already exists`);

      let newUser = new User();
      newUser.username = req.body.username;
      newUser.setPassword(req.body.password);

      newUser.save(err => {
        let token = newUser.generateJwt();
        res.status(200);
        res.json({
          token: token
        });
      });
    })
    .catch(err => res.status(500).json("Internal server error"));
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
