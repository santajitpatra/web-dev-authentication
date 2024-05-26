const express = require('express');

const port = 3000;
const app = express();

app.use(express.static('./public'));
app.use(express.json());

// states
const userStore = {}

app.post('/register', (req, res) => {
    const {username, password} = req.body;
    const id = `user_${Date.now()}`;

    const user = {
        id,
        username,
        password
    }

    userStore[id] = user;

    console.log(`Registered user with id`, userStore[id]);

    return res.json({ id });

})

app.listen(port, () => {
    console.log(`Server started on port ${port}`);})