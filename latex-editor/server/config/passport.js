let passport = require("passport");
let LocalStrategy = require("passport-local").Strategy;
let mongoose = require("mongoose");
let User = mongoose.model("User");

passport.use(
  new LocalStrategy(
    { usernameField: "username" },
    (username, password, done) => {
      User.findOne({ username: username }, (err, user) => {
        if (err) return done(err);
        if (!user) return done(null, false, "User was not found");
        if (!user.validPassword(password))
          return done(null, false, "Password was incorrect");

        // Credentials are correct
        return done(null, user);
      });
    }
  )
);
