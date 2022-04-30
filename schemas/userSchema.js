const { Schema, model } = require("mongoose");

const userSchema = Schema({
  id: {
    type: String,
    required: true,
  },
  blacklisted: {
    type: Boolean,
    default: false,
  },
});

module.exports = model("users", userSchema);
