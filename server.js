const express = require('express');
const app     = express();

const PORT    = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

// ── Health check (anyone can hit this) ────────────────────────────────────────
app.get('/health', (_req, res) => {
  return res.sendStatus(200);
});

// ── Auth middleware for all other routes ─────────────────────────────────────
app.use((req, res, next) => {
  if (req.path === '/health') return next();  // skip auth here
  if (req.headers['authorization'] !== API_KEY) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
});

app.use(express.json());

let kickQueue   = [];
let spawnQueue  = [];
let onlineSet   = new Set();

// ► Presence update (called by your game)
app.post('/roblox/presence-update', (req, res) => {
  const { players } = req.body;
  if (!Array.isArray(players)) {
    return res.status(400).json({ error: 'Missing players array' });
  }
  onlineSet = new Set(players);
  console.log(`Presence updated: [${players.join(', ')}]`);
  res.json({ success: true });
});

// ► Presence check (called by your bot)
app.get('/roblox/online/:username', (req, res) => {
  const user = req.params.username;
  res.json({ online: onlineSet.has(user) });
});

// Kick Functions
app.post('/roblox/kick', (req, res) => {
  const { username, reason } = req.body;
  if (!username) return res.status(400).json({ error: 'Missing username' });

  kickQueue.push({ username, reason });
  console.log(`Queued kick: ${username} - ${reason}`);
  res.json({ success: true, message: `Kick command queued for ${username}` });
});

// Roblox will poll this
app.get('/roblox/kick-queue', (_req, res) => {
  const commands = [...kickQueue];
  kickQueue = [];
  res.json(commands);
});

// Spawn Functions
app.post('/roblox/spawn', (req, res) => {
  const { username, pokemon, level, shiny, ha, forme } = req.body;
  if (!username) return res.status(400).json({ error: 'Missing username' });

  spawnQueue.push({ username, pokemon, level, shiny, ha, forme });
  console.log(`Queued spawn: ${username} - ${pokemon} - ${level} - ${shiny} - ${ha} - ${forme}`);
  res.json({ success: true, message: `Spawn command queued for ${username}` });
});

// Roblox will poll this
app.get('/roblox/spawn-queue', (_req, res) => {
  const commands = [...spawnQueue];
  spawnQueue = [];
  res.json(commands);
});

// Middleware to check auth key
function checkAuth(req, res, next) {
  if (req.query.auth !== API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
}

// Example: /Holo/Loader
app.all('/Holo/Loader', checkAuth, (req, res) => {
  // Do your loader logic here!
  res.json({ status: 'Loader endpoint hit!', method: req.method });
});

// Add at the top of your server file
let latestTeleportPlaceId = null; // stores current teleporter

// Teleporter endpoint
app.post('/Holo/Teleporter', checkAuth, (req, res) => {
    const { placeId } = req.body;
    if (!placeId) {
        return res.status(400).json({ error: 'Missing placeId' });
    }
    latestTeleportPlaceId = placeId;
    console.log(`[Teleporter] Updated placeId: ${placeId}`);
    res.json({ status: 'Teleporter set', placeId });
});

// (Optional) Endpoint to fetch the current teleporter placeId
app.get('/Holo/Teleporter', checkAuth, (req, res) => {
    if (!latestTeleportPlaceId) {
        return res.status(404).json({ error: 'Teleporter not set yet' });
    }
    res.json({ placeId: latestTeleportPlaceId });
});

// Example: /Holo/Assets
app.all('/Holo/Assets', checkAuth, (req, res) => {
  // Do your assets logic here!
  res.json({ status: 'Assets endpoint hit!', method: req.method });
});

// Frequent Ping to avoid Inactivity on the Server API
setInterval(() => {
  console.log("Pinging to avoid inactivity.");
}, 200000);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
