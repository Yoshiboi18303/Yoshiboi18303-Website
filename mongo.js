const mongoose = require("mongoose");

(async () => {
  await mongoose
    .connect(process.env.MONGO_CS, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    })
    .catch((e) => console.error(`${`${e}`.red}`));
  console.log(`Connected to ${"MongoDB".green}!`);
})();
