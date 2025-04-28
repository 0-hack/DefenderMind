// Required imports
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Setup Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

// Configuration options
const disableConfig = process.env.DISABLE_CONFIG === 'true';

// Make config status available to the client
app.get('/config-status', (req, res) => {
  res.json({
    disableConfig: disableConfig
  });
});

// Default incidents array (keep your existing array here)
const defaultIncidents = [
  // Your existing defaultIncidents array
];

// Data paths
const dataDir = path.join(__dirname, 'data');
const incidentsFilePath = path.join(dataDir, 'security-incidents.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
}

// Route to save incidents
app.post('/save-incidents', (req, res) => {
  // Check if configuration is disabled
  if (disableConfig) {
    return res.status(403).json({ success: false, message: 'Configuration is disabled' });
  }

  const incidents = req.body;
  
  // Validate that incidents is an array
  if (!Array.isArray(incidents)) {
    return res.status(400).json({ success: false, message: 'Invalid data format. Expected an array.' });
  }

  try {
    // Write to file with pretty formatting
    fs.writeFileSync(incidentsFilePath, JSON.stringify(incidents, null, 2));
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving incidents:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Route to load incidents for first load
app.get('/data/security-incidents.json', (req, res) => {
  try {
    // Check if file exists
    if (fs.existsSync(incidentsFilePath)) {
      // Read from file
      const data = fs.readFileSync(incidentsFilePath, 'utf8');
      res.type('application/json').send(data);
    } else {
      // Use default incidents if file doesn't exist
      fs.writeFileSync(incidentsFilePath, JSON.stringify(defaultIncidents, null, 2));
      res.json(defaultIncidents);
    }
  } catch (err) {
    console.error('Error loading incidents:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Configuration interface is ${disableConfig ? 'disabled' : 'enabled'}`);
  console.log(`Data directory: ${dataDir}`);
});
