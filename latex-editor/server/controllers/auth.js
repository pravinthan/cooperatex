exports.register = (req, res) => {
  console.log("Registering user: " + req.body.email);
  res.status(200);
  res.json({
    message: "User registered: " + req.body.email
  });
};

exports.login = (req, res) => {
  console.log("User: " + req.body.email + " logged in");
  res.status(200);
  res.json({
    message: "User: " + req.body.email + " logged in"
  });
};
