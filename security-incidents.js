// Security Incident Definitions and Visualization
// This file manages security incident data and UI elements for the brain network

// Create global variables
window.securityIncidents = [
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
    index: 20,
    color: '#FFCC00' // Default yellow color
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
    index: 50,
    color: '#FF6666' // Red color
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
    index: 80,
    color: '#66CCFF' // Blue color
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
    index: 100,
    color: '#99CC66' // Green color
  }
];

// UI element variables
let tooltip = null;
let incidentPanel = null;
let incidentContent = null;
let incidentTitle = null;
let isPauseCallback = null;
let cameraControlCallback = null;
let nodeLabels = [];
let searchBar = null;
let searchResults = null;

// Initialize incident UI components
function initializeIncidentUI(pauseCallback, cameraCallback) {
  isPauseCallback = pauseCallback;
  cameraControlCallback = cameraCallback;
  
  // Create tooltip
  tooltip = document.createElement('div');
  tooltip.style.position = 'absolute';
  tooltip.style.padding = '5px 10px';
  tooltip.style.background = 'rgba(0,0,0,0.7)';
  tooltip.style.color = '#00ccff';
  tooltip.style.borderRadius = '4px';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.display = 'none';
  tooltip.style.fontSize = '13px';
  tooltip.style.fontFamily = 'Exo 2, sans-serif';
  tooltip.style.zIndex = '8000';
  document.body.appendChild(tooltip);
  
  // Create incident panel
  incidentPanel = document.createElement('div');
  incidentPanel.style.position = 'absolute';
  incidentPanel.style.top = '50%';
  incidentPanel.style.left = '50%';
  incidentPanel.style.transform = 'translate(-50%, -50%) scale(0.8)';
  incidentPanel.style.width = '450px';
  incidentPanel.style.maxWidth = '90vw';
  incidentPanel.style.maxHeight = '80vh';
  incidentPanel.style.background = 'rgba(0,15,40,0.95)';
  incidentPanel.style.color = '#a4ceff';
  incidentPanel.style.padding = '25px';
  incidentPanel.style.border = '1px solid #0099ff';
  incidentPanel.style.borderRadius = '12px';
  incidentPanel.style.display = 'none';
  incidentPanel.style.zIndex = '8000';
  incidentPanel.style.backdropFilter = 'blur(8px)';
  incidentPanel.style.boxShadow = '0 0 30px #004488, 0 0 15px #0066cc inset';
  incidentPanel.style.transition = 'all 0.5s cubic-bezier(0.19, 1, 0.22, 1)';
  incidentPanel.style.opacity = '0';
  incidentPanel.style.overflow = 'auto';
  incidentPanel.style.boxSizing = 'border-box';
  
  // Create incident panel header
  const headerBar = document.createElement('div');
  headerBar.className = 'incident-header';
  headerBar.style.position = 'sticky';
  headerBar.style.top = '0';
  headerBar.style.left = '0';
  headerBar.style.width = '100%';
  headerBar.style.height = '45px';
  headerBar.style.background = 'linear-gradient(90deg, rgba(10,70,130,0.9), rgba(0,30,70,0.9))';
  headerBar.style.borderBottom = '1px solid #0099ff';
  headerBar.style.boxShadow = 'inset 0 -5px 10px -5px rgba(0,100,255,0.2)';
  headerBar.style.display = 'flex';
  headerBar.style.alignItems = 'center';
  headerBar.style.padding = '0 15px';
  headerBar.style.boxSizing = 'border-box';
  headerBar.style.zIndex = '1';
  
  // Add alert icon
  const alertIcon = document.createElement('div');
  alertIcon.innerHTML = '⚠️';
  alertIcon.style.fontSize = '16px';
  alertIcon.style.marginRight = '8px';
  headerBar.appendChild(alertIcon);
  
  // Create title container
  const titleContainer = document.createElement('div');
  titleContainer.style.position = 'relative';
  titleContainer.style.display = 'flex';
  titleContainer.style.alignItems = 'center';
  titleContainer.style.flex = '1';
  titleContainer.style.maxWidth = 'calc(100% - 40px)';
  
  // Create title border
  const titleBorder = document.createElement('div');
  titleBorder.style.width = '3px';
  titleBorder.style.alignSelf = 'stretch';
  titleBorder.style.background = 'linear-gradient(to bottom, #6ab0ff, #003366)';
  titleBorder.style.marginRight = '10px';
  titleContainer.appendChild(titleBorder);
  
  // Create title
  incidentTitle = document.createElement('div');
  incidentTitle.className = 'incident-title';
  incidentTitle.style.fontFamily = 'Exo 2, sans-serif';
  incidentTitle.style.fontSize = '18px';
  incidentTitle.style.fontWeight = 'bold';
  incidentTitle.style.color = '#ffcc00';
  incidentTitle.style.textAlign = 'left';
  titleContainer.appendChild(incidentTitle);
  
  headerBar.appendChild(titleContainer);
  incidentPanel.appendChild(headerBar);
  
  // Create close button
  const incidentClose = document.createElement('div');
  incidentClose.textContent = '✕';
  incidentClose.className = 'incident-close-btn';
  incidentClose.style.position = 'absolute';
  incidentClose.style.top = '12px';
  incidentClose.style.right = '12px';
  incidentClose.style.cursor = 'pointer';
  incidentClose.style.color = '#ff7777';
  incidentClose.style.fontSize = '16px';
  incidentClose.style.width = '25px';
  incidentClose.style.height = '25px';
  incidentClose.style.display = 'flex';
  incidentClose.style.justifyContent = 'center';
  incidentClose.style.alignItems = 'center';
  incidentClose.style.borderRadius = '50%';
  incidentClose.style.background = 'rgba(80,0,0,0.3)';
  
  incidentClose.addEventListener('click', (e) => {
    e.stopPropagation();
    closeIncidentPanel();
  });
  
  incidentPanel.appendChild(incidentClose);
  
  // Create content container
  const contentContainer = document.createElement('div');
  contentContainer.style.marginTop = '45px';
  contentContainer.style.padding = '15px 0 5px 0';
  contentContainer.style.position = 'relative';
  
  const playbookSection = document.createElement('div');
  playbookSection.className = 'playbook-container';
  playbookSection.style.marginTop = '10px';
  playbookSection.style.background = 'rgba(0,20,60,0.7)';
  playbookSection.style.padding = '15px';
  playbookSection.style.borderRadius = '5px';
  playbookSection.style.border = '1px solid rgba(0,120,220,0.4)';
  
  const playbookTitle = document.createElement('div');
  playbookTitle.textContent = 'INCIDENT RESPONSE PLAYBOOK';
  playbookTitle.style.fontSize = '14px';
  playbookTitle.style.fontWeight = 'bold';
  playbookTitle.style.color = '#66ccff';
  playbookTitle.style.marginBottom = '10px';
  playbookTitle.style.textAlign = 'center';
  playbookSection.appendChild(playbookTitle);
  
  incidentContent = document.createElement('div');
  incidentContent.style.fontSize = '14px';
  incidentContent.style.lineHeight = '1.6';
  playbookSection.appendChild(incidentContent);
  
  contentContainer.appendChild(playbookSection);
  incidentPanel.appendChild(contentContainer);
  
  document.body.appendChild(incidentPanel);
  
  // Add CSS styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse-glow {
      0% { opacity: 0.7; text-shadow: 0 0 5px rgba(255,204,0,0.3); }
      100% { opacity: 1; text-shadow: 0 0 15px rgba(255,204,0,0.8); }
    }
    
    @keyframes step-highlight {
      0% { background-color: rgba(0,60,120,0.3); }
      100% { background-color: rgba(0,80,160,0.5); }
    }
    
    .node-label {
      position: absolute;
      padding: 5px 8px;
      background: rgba(0,15,40,0.8);
      color: #ffcc00;
      border: 1px solid rgba(255,204,0,0.5);
      border-radius: 4px;
      font-family: 'Exo 2', sans-serif;
      font-size: 12px;
      font-weight: bold;
      pointer-events: auto;
      z-index: 100;
      box-shadow: 0 0 8px rgba(255,204,0,0.3);
      opacity: 0.9;
      white-space: nowrap;
      cursor: pointer;
    }
    
    .step-description {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-out, padding 0.3s ease-out;
      background: rgba(0,30,60,0.5);
      border-radius: 0 0 4px 4px;
      margin-top: 0;
      padding: 0 10px;
      box-sizing: border-box;
      color: #b9d8ff;
      font-size: 13px;
      line-height: 1.5;
    }
    
    .step-description.expanded {
      max-height: 200px;
      padding: 8px 10px;
      margin-top: 5px;
      border-left: 2px solid rgba(0,100,200,0.4);
    }

    .search-container {
      position: fixed;
      top: 15px;
      left: 15px;
      width: 300px;
      max-width: 50vw;
      z-index: 9000;
      font-family: 'Exo 2', sans-serif;
    }

    .search-input {
      width: 100%;
      padding: 10px 15px;
      border-radius: 6px;
      border: 1px solid rgba(0,100,200,0.4);
      background: rgba(0,20,50,0.8);
      color: #ffffff;
      font-family: 'Exo 2', sans-serif;
      font-size: 14px;
      box-shadow: 0 0 15px rgba(0,100,255,0.3);
      transition: all 0.3s ease;
    }

    .search-input:focus {
      outline: none;
      box-shadow: 0 0 20px rgba(0,120,255,0.5);
      border-color: rgba(0,120,255,0.6);
    }

    .search-results {
      position: absolute;
      top: 100%;
      left: 0;
      width: 100%;
      max-height: 300px;
      overflow-y: auto;
      background: rgba(0,20,50,0.95);
      border-radius: 0 0 6px 6px;
      border: 1px solid rgba(0,100,200,0.4);
      border-top: none;
      display: none;
      backdrop-filter: blur(5px);
    }

    .search-result-item {
      padding: 10px 15px;
      cursor: pointer;
      transition: all 0.2s ease;
      border-bottom: 1px solid rgba(0,50,100,0.3);
    }

    .search-result-item:hover {
      background: rgba(0,50,100,0.5);
    }

    .search-result-title {
      color: #ffffff;
      font-weight: bold;
      margin-bottom: 2px;
    }

    .search-result-details {
      color: rgba(255,255,255,0.7);
      font-size: 12px;
    }

    .search-result-color {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 6px;
      vertical-align: middle;
    }
  `;
  document.head.appendChild(style);

  // Create search bar
  createSearchBar();
}

// Create search bar for finding incidents
function createSearchBar() {
  const searchContainer = document.createElement('div');
  searchContainer.className = 'search-container';
  
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'search-input';
  searchInput.placeholder = 'Search for...';
  
  searchResults = document.createElement('div');
  searchResults.className = 'search-results';
  
  searchContainer.appendChild(searchInput);
  searchContainer.appendChild(searchResults);
  document.body.appendChild(searchContainer);
  
  // Store for later reference
  searchBar = searchInput;
  
  // Add event listeners
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    
    if (query.length < 2) {
      searchResults.style.display = 'none';
      return;
    }
    
    // Filter incidents
    const filteredIncidents = window.securityIncidents.filter(incident => {
      // Search in title
      if (incident.title.toLowerCase().includes(query)) {
        return true;
      }
      
      // Search in steps
      if (incident.steps.some(step => 
        step.title.toLowerCase().includes(query) || 
        step.description.toLowerCase().includes(query))) {
        return true;
      }
      
      return false;
    });
    
    // Display results
    displaySearchResults(filteredIncidents, query);
  });
  
  searchInput.addEventListener('focus', () => {
    if (searchInput.value.length >= 2) {
      searchResults.style.display = 'block';
    }
  });
  
  // Close results when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchContainer.contains(e.target)) {
      searchResults.style.display = 'none';
    }
  });
}

// Display search results
function displaySearchResults(incidents, query) {
  searchResults.innerHTML = '';
  
  if (incidents.length === 0) {
    const noResults = document.createElement('div');
    noResults.className = 'search-result-item';
    noResults.textContent = 'No incidents found';
    noResults.style.fontStyle = 'italic';
    noResults.style.color = 'rgba(255,255,255,0.6)';
    searchResults.appendChild(noResults);
    searchResults.style.display = 'block';
    return;
  }
  
  incidents.forEach(incident => {
    const resultItem = document.createElement('div');
    resultItem.className = 'search-result-item';
    
    const resultTitle = document.createElement('div');
    resultTitle.className = 'search-result-title';
    
    // Add color indicator
    const colorIndicator = document.createElement('span');
    colorIndicator.className = 'search-result-color';
    colorIndicator.style.backgroundColor = incident.color || '#FFCC00';
    resultTitle.appendChild(colorIndicator);
    
    // Add title with highlighted match
    const titleText = document.createTextNode(incident.title);
    resultTitle.appendChild(titleText);
    
    const resultDetails = document.createElement('div');
    resultDetails.className = 'search-result-details';
    
    // Find matching step if any
    let matchingStep = '';
    incident.steps.forEach(step => {
      if (step.title.toLowerCase().includes(query)) {
        matchingStep = `Step: "${step.title}"`;
      }
    });
    
    resultDetails.textContent = matchingStep || `Node: ${incident.index}`;
    
    resultItem.appendChild(resultTitle);
    resultItem.appendChild(resultDetails);
    
    // Add click handler
    resultItem.addEventListener('click', () => {
      // Find the node
      const brainNodes = window.brainNodes || [];
      if (incident.index < brainNodes.length) {
        const node = brainNodes[incident.index];
        if (node && node.mesh) {
          // Hide search results
          searchResults.style.display = 'none';
          searchBar.value = '';
          
          // Show the incident panel
          showIncidentPanel(incident);
          
          // Zoom to the node
          if (cameraControlCallback) {
            cameraControlCallback.zoomTo(node.mesh.position);
          }
        }
      }
    });
    
    searchResults.appendChild(resultItem);
  });
  
  searchResults.style.display = 'block';
}

// Close incident panel
function closeIncidentPanel() {
  incidentPanel.style.opacity = '0';
  incidentPanel.style.transform = 'translate(-50%, -50%) scale(0.8)';
  
  setTimeout(() => {
    incidentPanel.style.display = 'none';
    nodeLabels.forEach(label => {
      if (label.style.visibility !== 'hidden') {
        label.style.display = 'block';
      }
    });
    
    if (isPauseCallback) isPauseCallback(false);
    if (cameraControlCallback) cameraControlCallback.zoomOut(false);
  }, 500);
}

// Create incident nodes
function createIncidentNodes(brainNodes) {
  console.log("Creating incident nodes");
  
  // Clear existing labels
  nodeLabels.forEach(label => {
    if (label && label.parentNode) {
      label.parentNode.removeChild(label);
    }
  });
  nodeLabels = [];
  
  // First, reset all nodes that might have been previously incident nodes
  brainNodes.forEach(node => {
    if (node && node.mesh) {
      // Reset any node that was an incident node
      if (node.mesh.userData.isIncidentNode) {
        // Clear incident-specific userData
        node.mesh.userData.hoverText = null;
        node.mesh.userData.incidentData = null;
        node.mesh.userData.isIncidentNode = false;
        node.mesh.userData.label = null;
        
        // Reset to default appearance
        node.mesh.material.color.set(0x66ccff); // Original blue color
        node.mesh.material.opacity = 0.8;
        
        // Clear all child elements (glows)
        while (node.mesh.children.length > 0) {
          node.mesh.remove(node.mesh.children[0]);
        }
        
        // Add default glow back
        const nodeGlowGeometry = new THREE.SphereGeometry(0.32, 16, 16);
        const nodeGlowMaterial = new THREE.MeshBasicMaterial({
          color: 0x66ccff,
          transparent: true,
          opacity: 0.3,
          blending: THREE.AdditiveBlending
        });
        const nodeGlow = new THREE.Mesh(nodeGlowGeometry, nodeGlowMaterial);
        node.mesh.add(nodeGlow);
      }
    }
  });
  
  // Now create new incident nodes for the current incidents
  window.securityIncidents.forEach(incident => {
    const { title, index, color } = incident;
    
    if (index < brainNodes.length) {
      const node = brainNodes[index];
      
      if (!node || !node.mesh) {
        console.warn(`Node at index ${index} not found`);
        return;
      }
      
      // Clear existing children
      while (node.mesh.children.length > 0) {
        node.mesh.remove(node.mesh.children[0]);
      }
      
      // Parse color and convert to THREE.js color format
      const nodeColor = color ? new THREE.Color(color) : new THREE.Color(0xFFCC00);
      
      // Create node materials
      node.mesh.material.color.copy(nodeColor);
      node.mesh.material.opacity = 0.9;
      node.mesh.material.transparent = true;
      
      // Create inner glow
      const innerGlow = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 16, 16),
        new THREE.MeshBasicMaterial({
          color: nodeColor,
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
      );
      node.mesh.add(innerGlow);
      
      // Create outer glow
      const outerGlow = new THREE.Mesh(
        new THREE.SphereGeometry(0.65, 16, 16),
        new THREE.MeshBasicMaterial({
          color: nodeColor,
          transparent: true,
          opacity: 0.2,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
      );
      node.mesh.add(outerGlow);
      
      // Add metadata
      node.mesh.userData.hoverText = title;
      node.mesh.userData.incidentData = incident;
      node.mesh.userData.isIncidentNode = true;
      
      // Create label with custom color
      const nodeLabel = document.createElement('div');
      nodeLabel.className = 'node-label';
      nodeLabel.textContent = title;
      nodeLabel.style.display = 'block';
      nodeLabel.style.position = 'absolute';
      
      // Adapt label color to incident color
      nodeLabel.style.color = color || '#FFCC00';
      nodeLabel.style.borderColor = hexToRgba(color || '#FFCC00', 0.5);
      
      // Make label clickable - add event listener
      nodeLabel.addEventListener('click', () => {
        showIncidentPanel(incident);
        nodeLabels.forEach(label => {
          label.style.display = 'none';
        });
        
        if (cameraControlCallback) {
          cameraControlCallback.zoomTo(node.mesh.position);
        }
      });
      
      document.body.appendChild(nodeLabel);
      
      // Store label with node
      node.mesh.userData.label = nodeLabel;
      nodeLabels.push(nodeLabel);
    }
  });
  
  console.log(`Created ${nodeLabels.length} incident node labels`);
  
  // Enhance label styling
  enhanceIncidentLabels();
}

// Helper function to convert hex to rgba
function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(255, 204, 0, ${alpha})`;
  
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex.split('').map(h => h+h).join('');
  }
  
  // Parse hex values
  const r = parseInt(hex.substring(0,2), 16);
  const g = parseInt(hex.substring(2,4), 16);
  const b = parseInt(hex.substring(4,6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Enhanced label styling with improved visibility and interaction
function enhanceIncidentLabels() {
  // Add enhanced styling for node labels
  const labelStyle = document.createElement('style');
  labelStyle.textContent = `
    .node-label {
      transition: all 0.2s ease-out;
      padding: 6px 10px;
      background: rgba(0,20,50,0.85);
      border-radius: 4px;
      font-family: 'Exo 2', sans-serif;
      font-size: 12px;
      font-weight: bold;
      pointer-events: auto;
      z-index: 1000;
      box-shadow: 0 0 8px rgba(255,204,0,0.3);
      opacity: 0.95;
      white-space: nowrap;
      cursor: pointer;
      user-select: none;
      backdrop-filter: blur(2px);
    }
    
    .node-label:hover {
      background: rgba(40,40,60,0.9);
      transform: scale(1.05);
    }
    
    .node-label.active {
      animation: label-pulse 1.5s infinite alternate ease-in-out;
    }
    
    @keyframes label-pulse {
      0% { opacity: 0.9; transform: translateY(0); }
      100% { opacity: 1; transform: translateY(-2px); }
    }
  `;
  
  // Remove any existing style with the same content to avoid duplicates
  const existingStyles = document.querySelectorAll('style');
  let exists = false;
  existingStyles.forEach(style => {
    if (style.textContent.includes('.node-label:hover')) {
      exists = true;
    }
  });
  
  if (!exists) {
    document.head.appendChild(labelStyle);
  }
}

// Update node labels with smart positioning to avoid overlap
function updateNodeLabels(camera) {
  if (!camera) return;
  
  // First calculate positions for all labels
  const labelPositions = [];
  
  nodeLabels.forEach(label => {
    for (let i = 0; i < window.securityIncidents.length; i++) {
      const index = window.securityIncidents[i].index;
      const brainNodes = window.brainNodes || [];
      
      if (index < brainNodes.length) {
        const node = brainNodes[index];
        if (node && node.mesh && node.mesh.userData.label === label) {
          // Update position
          node.mesh.updateMatrixWorld();
          const position = new THREE.Vector3().setFromMatrixPosition(node.mesh.matrixWorld);
          const vector = position.clone().project(camera);
          
          // Convert to screen coordinates
          const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
          const y = -(vector.y * 0.5 - 0.5) * window.innerHeight;
          
          if (vector.z < 1 && vector.z > -1) {
            // Store projected position and z-depth for this label
            labelPositions.push({
              label: label,
              x: x + 15, // Offset from node
              y: y - 8,  // Offset from node
              z: vector.z,
              incident: window.securityIncidents[i]
            });
          }
          
          break;
        }
      }
    }
  });
  
  // Sort labels by z-depth to prioritize visibility
  labelPositions.sort((a, b) => {
    // Lower z values are closer to the camera
    return a.z - b.z;
  });
  
  // Reset all labels to hidden first
  nodeLabels.forEach(label => {
    label.style.display = 'none';
  });
  
  // Apply calculated positions to labels, handling overlaps
  const occupiedAreas = []; // Track areas already occupied by labels
  const margin = 5; // Margin between labels to avoid overlap
  
  labelPositions.forEach(pos => {
    const label = pos.label;
    
    // Position the label
    label.style.left = `${pos.x}px`;
    label.style.top = `${pos.y}px`;
    
    // Get label dimensions
    const labelWidth = label.offsetWidth;
    const labelHeight = label.offsetHeight;
    
    // Define the label's area
    const labelArea = {
      left: pos.x - margin,
      right: pos.x + labelWidth + margin,
      top: pos.y - margin,
      bottom: pos.y + labelHeight + margin
    };
    
    // Check for overlaps with already positioned labels
    let overlapping = false;
    for (const area of occupiedAreas) {
      if (!(labelArea.right < area.left || 
            labelArea.left > area.right || 
            labelArea.bottom < area.top || 
            labelArea.top > area.bottom)) {
        overlapping = true;
        break;
      }
    }
    
    // If not overlapping or it's one of the first few labels, make it visible
    if (!overlapping || occupiedAreas.length < 3) {
      label.style.display = 'block';
      
      // Enhance label styling
      label.style.zIndex = `${Math.floor(1000 - pos.z * 100)}`; // Higher z-index for closer nodes
      
      // Color adaptation based on incident color
      const color = pos.incident.color || '#FFCC00';
      label.style.color = color;
      label.style.borderColor = hexToRgba(color, 0.5);
      label.style.boxShadow = `0 0 8px ${hexToRgba(color, 0.3)}`;
      
      // Add hover effect to make it easier to see which label is which
      label.onmouseover = () => {
        label.style.boxShadow = `0 0 15px ${hexToRgba(color, 0.7)}`;
        label.style.transform = 'scale(1.05)';
        label.style.zIndex = '2000'; // Bring to front on hover
      };
      
      label.onmouseout = () => {
        label.style.boxShadow = `0 0 8px ${hexToRgba(color, 0.3)}`;
        label.style.transform = 'scale(1)';
        label.style.zIndex = `${Math.floor(1000 - pos.z * 100)}`;
      };
      
      // Add the label's area to occupied areas
      occupiedAreas.push(labelArea);
    } else {
      // For overlapping labels, find a new position
      // Try positioning above the node instead
      const newY = pos.y - labelHeight - 20; // Position above the node
      
      labelArea.top = newY - margin;
      labelArea.bottom = newY + labelHeight + margin;
      
      // Check again for overlaps in the new position
      let stillOverlapping = false;
      for (const area of occupiedAreas) {
        if (!(labelArea.right < area.left || 
              labelArea.left > area.right || 
              labelArea.bottom < area.top || 
              labelArea.top > area.bottom)) {
          stillOverlapping = true;
          break;
        }
      }
      
      if (!stillOverlapping) {
        label.style.display = 'block';
        label.style.top = `${newY}px`;
        label.style.zIndex = `${Math.floor(1000 - pos.z * 100)}`;
        
        // Color adaptation based on incident color
        const color = pos.incident.color || '#FFCC00';
        label.style.color = color;
        label.style.borderColor = hexToRgba(color, 0.5);
        label.style.boxShadow = `0 0 8px ${hexToRgba(color, 0.3)}`;
        
        // Add the same hover effects
        label.onmouseover = () => {
          label.style.boxShadow = `0 0 15px ${hexToRgba(color, 0.7)}`;
          label.style.transform = 'scale(1.05)';
          label.style.zIndex = '2000';
        };
        
        label.onmouseout = () => {
          label.style.boxShadow = `0 0 8px ${hexToRgba(color, 0.3)}`;
          label.style.transform = 'scale(1)';
          label.style.zIndex = `${Math.floor(1000 - pos.z * 100)}`;
        };
        
        occupiedAreas.push(labelArea);
      }
    }
  });
}

// Set up interactions with priority handling for overlapping nodes
function setupIncidentInteractions(raycaster, mouse, camera, brainNodes) {
  let hoveredNode = null;
  
  function updateTooltip(e) {
    raycaster.setFromCamera(mouse, camera);
    
    // First pass: Attempt to intersect with incident nodes only
    const incidentNodes = brainNodes
      .filter(n => n.mesh && n.mesh.userData.isIncidentNode)
      .map(n => n.mesh);
    
    let intersects = raycaster.intersectObjects(incidentNodes);
    
    // If no incident nodes were hit, try all nodes
    if (intersects.length === 0) {
      intersects = raycaster.intersectObjects(brainNodes.map(n => n.mesh));
    }
    
    document.body.style.cursor = 'default';
    
    if (hoveredNode) {
      if (hoveredNode.userData.label) {
        hoveredNode.userData.label.classList.remove('active');
      }
    }
    
    if (intersects.length > 0) {
      const hitNode = intersects[0].object;
      
      if (hitNode.userData.isIncidentNode) {
        hoveredNode = hitNode;
        document.body.style.cursor = 'pointer';
        
        if (hitNode.userData.label) {
          hitNode.userData.label.classList.add('active');
        }
        
        tooltip.style.display = 'block';
        tooltip.textContent = 'Click for details';
        tooltip.style.left = `${e.clientX + 10}px`;
        tooltip.style.top = `${e.clientY + 10}px`;
        return;
      }
    }
    
    hoveredNode = null;
    tooltip.style.display = 'none';
  }
  
  function onClick(e) {
    raycaster.setFromCamera(mouse, camera);
    
    // First try to click only incident nodes
    const incidentNodes = brainNodes
      .filter(n => n.mesh && n.mesh.userData.isIncidentNode)
      .map(n => n.mesh);
    
    let intersects = raycaster.intersectObjects(incidentNodes);
    
    // If no incident nodes were hit, check all nodes
    if (intersects.length === 0) {
      intersects = raycaster.intersectObjects(brainNodes.map(n => n.mesh));
    }
    
    if (intersects.length > 0) {
      const hitNode = intersects[0].object;
      
      if (hitNode.userData.isIncidentNode && hitNode.userData.incidentData) {
        e.stopPropagation();
        tooltip.style.display = 'none';
        
        nodeLabels.forEach(label => {
          label.style.display = 'none';
        });
        
        showIncidentPanel(hitNode.userData.incidentData);
        
        if (cameraControlCallback) {
          cameraControlCallback.zoomTo(hitNode.position);
        }
      }
    }
  }
  
  document.addEventListener('mousemove', updateTooltip);
  document.addEventListener('click', onClick);
  
  return { updateTooltip, onClick };
}

// Show incident panel
function showIncidentPanel(incidentData) {
  incidentTitle.textContent = incidentData.title;
  incidentContent.innerHTML = '';
  
  // Update title color to match incident color
  if (incidentData.color) {
    incidentTitle.style.color = incidentData.color;
  } else {
    incidentTitle.style.color = '#FFCC00'; // Default color
  }
  
  if (incidentData.steps && incidentData.steps.length > 0) {
    const stepContainer = document.createElement('div');
    stepContainer.style.display = 'flex';
    stepContainer.style.flexDirection = 'column';
    stepContainer.style.gap = '10px';
    
    incidentData.steps.forEach((step, index) => {
      const stepItem = document.createElement('div');
      stepItem.style.display = 'flex';
      stepItem.style.flexDirection = 'column';
      stepItem.style.borderRadius = '5px';
      stepItem.style.overflow = 'hidden';
      
      const stepHeader = document.createElement('div');
      stepHeader.style.display = 'flex';
      stepHeader.style.alignItems = 'center';
      stepHeader.style.padding = '8px 10px';
      stepHeader.style.background = 'rgba(0,40,90,0.4)';
      stepHeader.style.animation = 'step-highlight 2s infinite alternate';
      stepHeader.style.animationDelay = `${index * 0.2}s`;
      stepHeader.style.cursor = 'pointer';
      
      const numberCircle = document.createElement('div');
      numberCircle.textContent = (index + 1).toString();
      numberCircle.style.display = 'flex';
      numberCircle.style.justifyContent = 'center';
      numberCircle.style.alignItems = 'center';
      numberCircle.style.width = '24px';
      numberCircle.style.height = '24px';
      numberCircle.style.borderRadius = '50%';
      numberCircle.style.background = 'rgba(0,100,200,0.6)';
      numberCircle.style.color = '#ffffff';
      numberCircle.style.fontWeight = 'bold';
      numberCircle.style.fontSize = '13px';
      numberCircle.style.marginRight = '10px';
      
      const titleText = document.createElement('div');
      titleText.className = 'step-title';
      titleText.textContent = step.title;
      titleText.style.flex = '1';
      titleText.style.color = '#c4e0ff';
      
      const descriptionDiv = document.createElement('div');
      descriptionDiv.className = 'step-description';
      descriptionDiv.textContent = step.description;
      
      stepHeader.appendChild(numberCircle);
      stepHeader.appendChild(titleText);
      
      stepHeader.addEventListener('click', () => {
        document.querySelectorAll('.step-description').forEach(desc => {
          desc.classList.remove('expanded');
        });
        
        descriptionDiv.classList.toggle('expanded');
      });
      
      stepItem.appendChild(stepHeader);
      stepItem.appendChild(descriptionDiv);
      stepContainer.appendChild(stepItem);
    });
    
    incidentContent.appendChild(stepContainer);
  }
  
  incidentPanel.style.display = 'block';
  
  setTimeout(() => {
    incidentPanel.style.opacity = '1';
    incidentPanel.style.transform = 'translate(-50%, -50%) scale(1)';
  }, 10);
  
  if (isPauseCallback) isPauseCallback(true);
}

// Animation
function animateIncidentNodes(brainNodes, accumulatedTime) {
  if (!brainNodes || !Array.isArray(brainNodes)) return;
  
  brainNodes.forEach(node => {
    if (node && node.mesh && node.mesh.userData && node.mesh.userData.isIncidentNode) {
      if (node.mesh.children.length >= 2) {
        // Animate glows
        const innerGlow = node.mesh.children[0];
        const innerScale = 1 + Math.sin(accumulatedTime * 2) * 0.2;
        innerGlow.scale.set(innerScale, innerScale, innerScale);
        
        const outerGlow = node.mesh.children[1];
        const outerScale = 1 + Math.sin(accumulatedTime * 1.5) * 0.3;
        outerGlow.scale.set(outerScale, outerScale, outerScale);
      }
    }
  });
}

// Load/save incidents
function saveIncidents(incidents) {
  window.securityIncidents = incidents;
  
  if (window.brainNodes) {
    createIncidentNodes(window.brainNodes);
  }
  
  return { success: true };
}

function loadIncidents() {
  return [...window.securityIncidents];
}

// Load data from JSON on startup
document.addEventListener('DOMContentLoaded', function() {
  fetch('/data/security-incidents.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('JSON file not found');
      }
      return response.json();
    })
    .then(data => {
      if (Array.isArray(data) && data.length > 0) {
        window.securityIncidents = data;
        
        if (window.brainNodes) {
          createIncidentNodes(window.brainNodes);
        }
      }
    })
    .catch(error => {
      console.log('Using default incidents:', error.message);
    });
});

// Export module
window.SecurityIncidents = {
  getIncidents: () => window.securityIncidents,
  initializeUI: initializeIncidentUI,
  createNodes: createIncidentNodes,
  setupInteractions: setupIncidentInteractions,
  animateNodes: animateIncidentNodes,
  updateNodeLabels: updateNodeLabels,
  saveIncidents: saveIncidents,
  loadIncidents: loadIncidents
};