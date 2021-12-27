const express = require("express");
const auth = require("../src/middleware/auth");
const User = require("../src/db/models/users");
const router = new express.Router();
const sharp = require("sharp");
const {
  sendwelcomeEmail,
  sendCanceletionEmail,
} = require("../src/emails/accounts");
const multer = require("multer");
const upload = multer({
  limits: 2000000,
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("cant upload file"));
    }

    cb(undefined, true);
  },
});
router.post("/user", async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    sendwelcomeEmail(user.email, user.name);
    const token = await user.genarateToken();

    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.genarateToken();

    res.status(200).send({ user, token });
  } catch (e) {
    res.status(400).send("error");
  }
});

router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

router.post("/user/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(400).send();
  }
});
router.post("/user/logoutall", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send("logged out from all device ");
  } catch (e) {
    res.status(400).send();
  }
});
router.patch("/user/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdate = ["name", "email", "password", "age"];
  const isvalid = updates.every((update) => allowedUpdate.includes(update));
  if (!isvalid) {
    res.status(404).send("invalid update option");
  }
  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));

    await req.user.save();

    res.send(req.user);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.delete("/users/me", auth, async (req, res) => {
  try {
    req.user.remove();
    sendCanceletionEmail(req.user.email, req.user.name);
    res.send(req.user);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post(
  "/user/me/avater",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.status(200).send("upload successfull");
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.delete("/users/me/avatar", auth, async (req, res) => {
  try {
    req.user.avatar = undefined;
    await req.user.save();
    res.status(200).send("avatar deleted");
  } catch (e) {
    res.status(400).send({ error: e });
  }
});

router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) {
      throw new Error();
    }
    res.set("Content-Type", "image/jpg");
    res.send(user.avatar);
  } catch (e) {
    res.status(400).send();
  }
});
module.exports = router;
