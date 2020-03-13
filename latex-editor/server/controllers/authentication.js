let passport = require("passport");
let mongoose = require("mongoose");
let User = mongoose.model("User");

module.exports.signUp = (req, res) => {
  if (!req.body.username || !req.body.password) {
    return res.status(400).send("Username and password required");
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
        res.json({ token: newUser.generateJWT() });
      });
    })
    .catch(err => res.sendStatus(500));
};

module.exports.signIn = (req, res) => {
  if (!req.body.username || !req.body.password) {
    return res.status(400).send("Username and password required");
  }

  passport.authenticate("local", (err, user, info) => {
    if (err) return res.status(404).send(err);
    if (!user) return res.status(401).send(info);

    res.json({ token: user.generateJWT() });
  })(req, res);
};
