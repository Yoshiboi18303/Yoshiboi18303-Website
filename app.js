const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const path = require("path");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const Users = require("./schemas/userSchema");

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
app.use("/logout", require("./routes/logout"))

app.get(["/", "/home"], async (req, res) => {
  res.status(200).render("index", {
    req
  });
});

app.get("/about", async (req, res) => {
  res.status(200).render("about", {
    req
  });
});

app.get("/bots", async (req, res) => {
  res.status(200).render("bots", {
    req
  });
});

app.get(["/audio", "/music"], (req, res) => {
  res.status(200).render("music", {
    req
  })
})

app.listen(port);
console.log(
  `The website for ${"Yoshiboi18303".green} is now listening on port ${
    `${port}`.blue
  }!`
);
