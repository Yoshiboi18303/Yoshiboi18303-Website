require("colors");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const path = require("path");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const Users = require("./schemas/userSchema");
const {
  Client,
  Intents,
  MessageEmbed,
  MessageActionRow,
  MessageButton,
} = require("discord.js");
const client = new Client({
  intents: Object.values(Intents.FLAGS),
});
const Suggestions = require("./schemas/suggestionSchema");
const bodyParser = require("body-parser");
const colors = require("./colors.json");
const fetch = require("node-fetch");
var ready = false;
const fs = require("fs");

/**
 * Returns an object for a Discord.js MessageEmbed field
 * @param {String} name
 * @param {String} value
 * @param {Boolean} inline
 */
function addField(name, value, inline) {
  if (!name) name = "Unknown Name";
  if (!value) value = "Unknown Value";
  if (!inline) inline = false;

  return {
    name,
    value,
    inline,
  };
}

client.on("debug", (info) => {
  console.log("WEBSITE-DEBUGGER:".yellow + " " + `${info}`.blue);
});

client.on("ready", () => {
  console.log("The client is ready!".green);
  client.user.setActivity({
    name: "yoshiboi18303.tk",
    type: "LISTENING",
  });
  ready = true;
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(
  require("express-session")({
    resave: false,
    saveUninitialized: false,
    secret: process.env.SECRET,
    store: require("connect-mongo").create({
      mongoUrl: process.env.MONGO_CS,
      ttl: 86400 * 2, // 2 days
      mongoOptions: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    }),
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser(async (user, done) => {
  var User = await Users.findOne({ id: user.id });
  if (!user)
    user = new Users({
      id: user.id,
    });

  done(null, {
    id: user.id,
    discord: user,
    // voted: User.voted,
    // blacklisted: User.blacklisted,
  });
});

passport.use(
  new DiscordStrategy(
    {
      clientID: "968755285961371668",
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "/login/callback",
      scope: ["identify", "email", "guilds"],
    },
    (access, refresh, profile, done) => {
      process.nextTick(() => {
        done(null, profile);
      });
    }
  )
);

app.use("/static", express.static("static"));
app.use("/login", require("./routes/login"));
app.use("/logout", require("./routes/logout"));

app.get(["/", "/home"], async (req, res) => {
  var videos = fs.readdirSync(path.join(__dirname, "static", "videos")).filter((file) => file.endsWith(".mp4"))
  res.status(200).render("index", {
    req,
    files: videos,
  });
});

app.get("/about", async (req, res) => {
  res.status(200).render("about", {
    req,
  });
});

app.get("/bots", async (req, res) => {
  res.status(200).render("bots", {
    req,
  });
});

app.get(["/audio", "/music"], (req, res) => {
  res.status(200).render("music", {
    req,
  });
});

app.get("/friends", (req, res) => {
  res.status(200).render("friends", {
    req,
  });
});

app.get("/suggest", (req, res) => {
  if (!ready)
    return res.status(503).render("offline", {
      reason: "Client is offline.",
    });
  res.render("suggest", {
    req,
    env: process.env,
  });
});

app.get("/suggestionsent", (req, res) => {
  if (
    ![
      "yoshiboi18303.tk/sendsuggestion",
      "https://yoshiboi18303.tk/sendsuggestion",
      "http://yoshiboi18303.tk/sendsuggestion",
    ].includes(req.query.referral)
  )
    return res.redirect("/");
  res.status(200).render("suggestionsent");
});

app.get("/suggestionfailed", async (req, res) => {
  if (
    ![
      "yoshiboi18303.tk/sendsuggestion",
      "https://yoshiboi18303.tk/sendsuggestion",
      "http://yoshiboi18303.tk/sendsuggestion",
    ].includes(req.query.referral)
  )
    return res.redirect("/");
  var placeholder_req = await fetch.default(
    "https://yoshiboi18303.tk/sendsuggestion",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.REQUEST_SECRET,
      },
      body: {
        user: req.user,
        bot: "thor",
        suggestion: "adhvhvjafvhaf",
      },
    }
  );
  res.render("suggestionfailed", {
    req: placeholder_req
  });
});

app.get("/suggestionrules", (req, res) => {
  res.status(200).render("suggestionrules");
});

app.post("/sendsuggestion", async (req, res) => {
  if (!ready)
    return res
      .status(503)
      .send({
        code: 503,
        text: "The client is offline, so responses can't be listened for!",
      });
  var object = {
    modman: "Moderation Man",
    musicman: "Musical Man",
    ultron: "Ultron",
    thor: "Thor",
    rockconomy: "Rocket-Conomy"
  };
  if (req.user) {
    var data = new Suggestions({
      user: req.user.id,
      bot: object[req.body.bot],
      suggestion: req.body.suggestion,
    });
    data.save();
    const new_suggestion_embed = new MessageEmbed()
      .setColor(colors.green)
      .setTitle("A New Suggestion!")
      .setDescription("A new suggestion was just submitted!")
      .addFields([
        addField("User", `${req.user.discord.username}`, true),
        addField("For Bot", `${object[req.body.bot]}`, true),
        addField("Suggestion", `${req.body.suggestion}`, true),
      ]);
    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setStyle("SUCCESS")
        .setLabel("Approve")
        .setEmoji("✅")
        .setCustomId("approve-suggestion"),
      new MessageButton()
        .setStyle("DANGER")
        .setLabel("Deny")
        .setEmoji("❌")
        .setCustomId("deny-suggestion")
    );
    var channel = client.channels.cache.get("927333175582158959");
    await channel.send({
      content: "<@697414293712273408>",
      embeds: [new_suggestion_embed],
      components: [row],
    });

    const filter = async (btnInt) => {
      if (btnInt.user.id != "697414293712273408")
        return await btnInt.reply({
          content: "Get your own buttons noob.",
          ephemeral: true,
        });
      return true;
    };

    const collector = channel.createMessageComponentCollector({
      filter,
      max: 1,
    });

    collector.on("end", async (collection) => {
      var first = collection.first();
      if (first?.customId == "approve-suggestion") {
        data = await Suggestions.findOneAndUpdate(
          {
            user: req.user.id,
            suggestion: req.body.suggestion,
          },
          {
            $set: {
              approved: true,
            },
          }
        );
        data.save();
        await first?.reply({
          content: "Suggestion approved!",
          ephemeral: true,
        });
        try {
          await client.users.cache.get(req.user.id).send({
            content: "Your suggestion was approved!",
          });
        } catch (e) {
          return;
        }
      } else if (first?.customId == "deny-suggestion") {
        data = await Suggestions.findOneAndUpdate(
          {
            user: req.body.user.id,
            suggestion: req.body.suggestion,
          },
          {
            $set: {
              denied: true,
            },
          }
        );
        data.save();
        await first?.reply({
          content: "Suggestion denied!",
          ephemeral: true,
        });
        try {
          await client.users.cache.get(req.user.id).send({
            content: "Your suggestion was denied...",
          });
        } catch (e) {
          return;
        }
      }
    });
  } else {
    var data = new Suggestions({
      user: req.body.user.id,
      bot: object[req.body.bot],
      suggestion: req.body.suggestion,
    });
    data.save();
    const new_suggestion_embed = new MessageEmbed()
      .setColor(colors.green)
      .setTitle("A New Suggestion!")
      .setDescription("A new suggestion was just submitted!")
      .addFields([
        addField("User", `${req.body.user.username}`, true),
        addField("For Bot", `${object[req.body.bot]}`, true),
        addField("Suggestion", `${req.body.suggestion}`, true),
      ]);
    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setStyle("SUCCESS")
        .setLabel("Approve")
        .setEmoji("✅")
        .setCustomId("approve-suggestion"),
      new MessageButton()
        .setStyle("DANGER")
        .setLabel("Deny")
        .setEmoji("❌")
        .setCustomId("deny-suggestion")
    );
    var channel = client.channels.cache.get("927333175582158959");
    await channel.send({
      content: "<@697414293712273408>",
      embeds: [new_suggestion_embed],
      components: [row],
    });

    const filter = async (btnInt) => {
      if (btnInt.user.id != "697414293712273408")
        return await btnInt.reply({
          content: "Get your own buttons noob.",
          ephemeral: true,
        });
      return true;
    };

    const collector = channel.createMessageComponentCollector({
      filter,
      max: 1,
    });

    collector.on("end", async (collection) => {
      var first = collection.first();
      if (first?.customId == "approve-suggestion") {
        data = await Suggestions.findOneAndUpdate(
          {
            user: req.body.user.id,
            suggestion: req.body.suggestion,
          },
          {
            $set: {
              approved: true,
            },
          }
        );
        data.save();
        await first?.reply({
          content: "Suggestion approved!",
          ephemeral: true,
        });
        try {
          await client.users.cache.get(req.body.user.id).send({
            content: "Your suggestion was approved!",
          });
        } catch (e) {
          return;
        }
      } else if (first?.customId == "deny-suggestion") {
        data = await Suggestions.findOneAndUpdate(
          {
            user: req.body.user.id,
            suggestion: req.body.suggestion,
          },
          {
            $set: {
              denied: true,
            },
          }
        );
        data.save();
        await first?.reply({
          content: "Suggestion denied!",
          ephemeral: true,
        });
        try {
          await client.users.cache.get(req.body.user.id).send({
            content: "Your suggestion was denied...",
          });
        } catch (e) {
          return;
        }
      }
    });
  }
});

client.login(process.env.TOKEN);

app.listen(port);
console.log(
  `The website for ${"Yoshiboi18303".green} is now listening on port ${
    `${port}`.blue
  }!`
);
