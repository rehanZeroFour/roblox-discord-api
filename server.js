const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

app.use(express.json());

app.use((req, res, next) => {
  if (req.headers['authorization'] !== API_KEY) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
});

app.post('/roblox/kick', (req, res) => {
  const { username } = req.body;
  console.log(`Kick command received for ${username}`);
  res.json({ status: 'kick received' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
