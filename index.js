const express = require("express");
const { generateRegistrationOptions } = require("@simplewebauthn/server");

const port = 3000;
const app = express();

app.use(express.static("./public"));
app.use(express.json());

// states
const userStore = {};
const challengeStore = {};

app.post("/register", (req, res) => {
  const { username, password } = req.body;
  const id = `user_${Date.now()}`;

  const user = {
    id,
    username,
    password,
  };

  userStore[id] = user;

  console.log(`Registered user with id`, userStore[id]);

  return res.json({ id });
});

app.post("register-challenge", async (req, res) => {
  const { userId } = req.body;

  if (!userStore[userId]) {
    return res.status(404).json({ message: "User not found" });
  }
  const challengePayload = await generateRegistrationOptions({
    // id: userId,
    rpId: "localhost",
    rpName: "Localhost",
    username: userStore[userId].username,
    // password: userStore[userId].password,
    // authenticatorSelection: {
    //   authenticatorAttachment: "platform",
    //   userVerification: "required",
    // },
    // timeout: 60000,
  });

  challengeStore[userId] = challengePayload.challenge;

  return res.json({ option: challengePayload });
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
