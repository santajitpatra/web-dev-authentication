const crypto = require("node:crypto");
const express = require("express");
const { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions,verifyAuthenticationResponse } = require("@simplewebauthn/server");
const { error } = require("node:console");

if (!globalThis.crypto) {
  globalThis.crypto = crypto;
}

const port = 3000;
const app = express();

app.use(express.static("./public"));
app.use(express.json());

// states
const userStore = {};
const challengeStore = {};
const loginChallengeStore = {};

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

app.post("/register-challenge", async (req, res) => {
  const { userId } = req.body;

  if (!userStore[userId]) return res.status(404).json({ error: "User not found" });

  const user = userStore[userId];

  const challengePayload = await generateRegistrationOptions({
    rpID: "localhost",
    rpName: "Localhost Machine",
    userName: user.username,
  });

  challengeStore[userId] = challengePayload.challenge;

  return res.json({ options: challengePayload });
});

app.post("/register-verify", async (req, res) => {
  const { userId, response } = req.body;

  if (!userStore[userId]) return res.status(404).json({ error: "User not found" });

  const user = userStore[userId];
  const challenge = challengeStore[userId];


  const verifyRegistrationResult = await verifyRegistrationResponse({
    expectedChallenge: challenge,
    expectedOrigin: "http://localhost:3000",
    expectedRPID: "localhost",
    response: response,
  })

  if (!verifyRegistrationResult.verified) {
    return res.status(400).json({ error: "Invalid registration response" });
  }
  userStore[userId].passkey = verifyRegistrationResult.registrationInfo

  return res.json({ verified: true });
})

app.post("/login-challenge", async (req, res) => {
  const { userId } = req.body;
  if (!userStore[userId]) return res.status(404).json({ error: "User not found" });
  
  const opts = await generateAuthenticationOptions({
    rpID: "localhost",
  });

  loginChallengeStore[userId] = opts.challenge;

  return res.json({ options: opts });
});

app.post("/login-verify", async (req, res) => {
  const { userId, response } = req.body;

  if (!userStore[userId])
    return res.status(404).json({ error: "User not found" });

  const user = userStore[userId];
  const challenge = loginChallengeStore[userId];

  const verifyLoginResult = await verifyAuthenticationResponse({
    expectedChallenge: challenge,
    expectedOrigin: "http://localhost:3000",
    expectedRPID: "localhost",
    response: response,
    authenticator: user.passkey,
  });

  if (!verifyLoginResult.verified) {
    return res.status(400).json({ error: "Invalid registration response" });
  }

  return res.json({ success: true, userId }); 
});
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
