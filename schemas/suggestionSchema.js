const { Schema, model } = require("mongoose");

const suggestionSchema = Schema({
  user: {
    type: String,
    required: true,
  },
  botID: {
    type: String,
    default: "",
  },
  suggestion: {
    type: String,
    default: "",
  },
  approved: {
    type: Boolean,
    default: false,
  },
  denied: {
    type: Boolean,
    default: false,
  },
});

module.exports = model("bot-suggestions", suggestionSchema);
