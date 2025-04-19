const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Define JSON file path
const jsonFilePath = path.join(dataDir, 'security-incidents.json');

// Check if the JSON file exists, create with default data if not
if (!fs.existsSync(jsonFilePath)) {
  // Default incident data in case we can't extract from JS file
  const defaultIncidents = [
    {
      title: 'Phishing',
      steps: [
        {
          title: 'Identify phishing email',
          description: 'Analyze suspicious emails for common phishing indicators such as spoofed sender addresses, suspicious links, urgent language, or unexpected attachments.'
        },
        {
          title: 'Report to security team',
          description: 'Forward the suspected phishing email to the security team immediately using the established reporting process.'
        },
        {
          title: 'Block sender domain',
          description: 'Add the malicious sender domain to email filtering systems to prevent further messages from reaching users.'
        },
        {
          title: 'Scan affected systems',
          description: 'Run full malware scans on any systems that may have interacted with the phishing content.'
        },
        {
          title: 'Train users on spotting phishing',
          description: 'Conduct targeted training with affected users and send organization-wide reminders about phishing awareness.'
        }
      ],
      index: 20
    },
    {
      title: 'Ransomware',
      steps: [
        {
          title: 'Isolate infected machines',
          description: 'Immediately disconnect affected systems from the network to prevent lateral movement and further encryption.'
        },
        {
          title: 'Disable shared drives',
          description: 'Turn off access to networked storage to minimize the spread of encryption across shared resources.'
        },
        {
          title: 'Notify IT security',
          description: 'Engage the incident response team with details of the attack and affected systems.'
        },
        {
          title: 'Begin backups restore',
          description: 'Prepare clean systems and begin restoration process from verified offline backups.'
        },
        {
          title: 'Conduct forensic analysis',
          description: 'Analyze attack vectors, ransomware variant, and IOCs to improve defense and share intelligence.'
        }
      ],
      index: 50
    },
    {
      title: 'DDoS Attack',
      steps: [
        {
          title: 'Alert hosting provider',
          description: 'Contact your hosting or cloud provider immediately to activate their DDoS mitigation services.'
        },
        {
          title: 'Activate rate-limiting',
          description: 'Implement rate limiting at your edge network to reduce the impact of the incoming traffic flood.'
        },
        {
          title: 'Deploy WAF/anti-DDoS',
          description: 'Enable Web Application Firewall rules specifically designed to filter attack traffic patterns.'
        },
        {
          title: 'Monitor attack source',
          description: 'Analyze traffic to identify attack signatures, source IPs, and attack methods being used.'
        },
        {
          title: 'Block bad IPs or geo-ranges',
          description: 'Implement IP blocking for identified attack sources or entire geographic regions if necessary.'
        }
      ],
      index: 80
    },
    {
      title: 'Malware Attack',
      steps: [
        {
          title: 'Isolate affected systems',
          description: 'Immediately remove infected systems from the network to prevent malware from spreading.'
        },
        {
          title: 'Block suspicious connections',
          description: 'Identify and block any command and control traffic at the firewall and DNS levels.'
        },
        {
          title: 'Scan for persistence mechanisms',
          description: 'Check for backdoors, scheduled tasks, registry modifications, and other persistence techniques.'
        },
        {
          title: 'Remove malicious files',
          description: 'Clean systems using enterprise anti-malware tools or rebuild from trusted images if necessary.'
        },
        {
          title: 'Patch vulnerable systems',
          description: 'Apply necessary security patches to prevent reinfection through the same vulnerability.'
        }
      ],
      index: 100
    }
  ];
  
  try {
    // Write the default incidents to the JSON file
    fs.writeFileSync(jsonFilePath, JSON.stringify(defaultIncidents, null, 2));
    console.log('Created default security-incidents.json file');
  } catch (writeError) {
    console.error('Error creating default incidents file:', writeError);
  }
}

// Get configuration settings from environment variables
const disableConfig = process.env.DISABLE_CONFIG === 'true';
console.log(`Configuration interface is ${disableConfig ? 'disabled' : 'enabled'}`);

// Middleware to provide access to the incidents.json in the data folder
app.use('/data', express.static(dataDir));

// Add middleware to inject configuration state variable
app.use((req, res, next) => {
  // Exclude files from this middleware
  if (req.path.match(/\.(js|css|png|jpg|ico|svg)$/)) {
    return next();
  }
  
  // Add a hook into the index.html
  if (req.path === '/' || req.path === '/index.html') {
    // Read the index.html file
    const indexPath = path.join(__dirname, 'index.html');
    fs.readFile(indexPath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading index.html:', err);
        return next(err);
      }
      
      // Inject the configuration status
      const configScript = `
      <script>
        // Configuration state from server environment
        window.DEFENDER_CONFIG = {
          disableConfig: ${disableConfig}
        };
        console.log("Configuration disabled:", ${disableConfig});
      </script>
      `;
      
      // Insert before the existing scripts
      const modifiedData = data.replace('<!-- Load scripts in the correct order -->', 
        `${configScript}\n  <!-- Load scripts in the correct order -->`);
      
      // Send the modified index.html
      res.setHeader('Content-Type', 'text/html');
      res.send(modifiedData);
    });
  } else {
    next();
  }
});

// Serve static files from the current directory
app.use(express.static('./'));

// Parse JSON bodies
app.use(express.json({ limit: '5mb' }));

// Endpoint to save incidents
app.post('/save-incidents', (req, res) => {
  // Block saving if configuration is disabled
  if (disableConfig) {
    return res.status(403).json({ 
      success: false, 
      message: 'Configuration is disabled on this server' 
    });
  }
  
  try {
    const incidents = req.body;
    
    if (!Array.isArray(incidents)) {
      return res.status(400).json({ success: false, message: 'Invalid data format' });
    }
    
    // Write the data to the JSON file
    fs.writeFileSync(jsonFilePath, JSON.stringify(incidents, null, 2));
    
    res.json({ success: true, message: 'Incidents saved successfully' });
  } catch (error) {
    console.error('Error saving incidents:', error);
    res.status(500).json({ success: false, message: 'Error saving file' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`JSON file path: ${jsonFilePath}`);
});