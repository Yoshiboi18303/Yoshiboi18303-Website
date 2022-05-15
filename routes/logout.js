const express = require("express");
const app = express.Router();

app.get("/", (req, res) => {
  req.logout();
  res.redirect("/");
});

module.exports = app;
