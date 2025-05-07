const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

let kickQueue = [];
let spawnQueue = [];

app.use(express.json());

app.use((req, res, next) => {
  if (req.headers['authorization'] !== API_KEY) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
});
// Kick Functions
app.post('/roblox/kick', (req, res) => {
  const { username, reason } = req.body;
  if (!username) return res.status(400).json({ error: 'Missing username' });

  // Store the command in a queue
  kickQueue.push({ username, reason });
  console.log(`Queued kick: ${username} - ${reason}`);

  res.json({ success: true, message: `Kick command queued for ${username}` });
});

// Roblox will poll this
app.get('/roblox/kick-queue', (req, res) => {
  const commands = [...kickQueue];
  kickQueue = []; // Clear after sending
  res.json(commands);
});
// Spawn Functions
app.post('/roblox/spawn', (req, res) => {
  const { username, pokemon, level, shiny, ha, forme } = req.body;
  if (!username) return res.status(400).json({ error: 'Missing username' });

  // Store the command in a queue
  spawnQueue.push({ username, pokemon, level, shiny, ha, forme });
  console.log(`Queued spawn: ${username} - ${pokemon} - ${level} - ${shiny} - ${ha} - ${forme}`);

  res.json({ success: true, message: `Spawn command queued for ${username}` });
});

// Roblox will poll this
app.get('/roblox/spawn-queue', (req, res) => {
  const commands = [...spawnQueue];
  spawnQueue = []; // Clear after sending
  res.json(commands);
});

// Frequent Ping to avoid Inactivity on the Server API
function infiniteLoopWithWait(callback, delay) {
  setInterval(callback, delay);
}

// Example usage:
infiniteLoopWithWait(() => {
  console.log("Pinging to avoid inactivity.");
}, 200000);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
