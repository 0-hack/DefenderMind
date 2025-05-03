// Security Incident Definitions and Visualization
// This file manages security incident data and UI elements for the brain network

// Global variables
// Initialize with empty array - will be populated from JSON
window.securityIncidents = [];

// Flag to track if we've already loaded incidents from JSON
let incidentsLoadedFromJSON = false;

// Load data from JSON on startup
document.addEventListener('DOMContentLoaded', function() {
  console.log('Attempting to load incidents from JSON file...');
  
  fetch('/data/security-incidents.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('JSON file not found');
    }
    return response.json();
  })
  .then(data => {
    if (Array.isArray(data) && data.length > 0) {
      console.log(`Successfully loaded ${data.length} incidents from JSON file`);
      window.securityIncidents = data;
      incidentsLoadedFromJSON = true;
      
      // Update visualization if brain nodes are available
      if (window.brainNodes) {
        createIncidentNodes(window.brainNodes);
      }
    } else {
      throw new Error('Invalid data format or empty array');
    }
  })
  .catch(error => {
    console.log('Error loading incidents from JSON:', error.message);
    
    // If we don't have incidents yet, try the server endpoint as backup
    if (!incidentsLoadedFromJSON && window.securityIncidents.length === 0) {
      console.log('Trying server endpoint as backup');
      fetch('/load-incidents')
        .then(response => response.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            console.log(`Loaded ${data.length} incidents from server endpoint`);
            window.securityIncidents = data;
            incidentsLoadedFromJSON = true;
            
            // Update visualization if brain nodes are available
            if (window.brainNodes) {
              createIncidentNodes(window.brainNodes);
            }
          } else {
            console.error('No valid incidents found from server endpoint');
          }
        })
        .catch(serverError => {
          console.error('Failed to load incidents from server:', serverError);
        });
    }
  });
});

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
let currentIncidentData = null;
let panelOverlay = null;

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

  // Ensure the Three.js canvas is properly positioned in z-index hierarchy
const canvas = document.querySelector('canvas');
if (canvas) {
  canvas.style.zIndex = '50'; // Lower than UI elements but high enough for interaction
  canvas.style.position = 'fixed';
  canvas.style.pointerEvents = 'auto';
}
  
  // Create incident panel - IMPROVED POSITIONING
incidentPanel = document.createElement('div');
incidentPanel.className = 'incident-panel';
incidentPanel.style.position = 'fixed'; // Fixed for best overlay behavior
incidentPanel.style.top = '50%';
incidentPanel.style.left = '50%';
incidentPanel.style.transform = 'translate(-50%, -50%) scale(0.8)';
incidentPanel.style.width = '500px';
incidentPanel.style.maxWidth = '90vw';
incidentPanel.style.maxHeight = '85vh'; // Slightly taller for mobile
incidentPanel.style.background = 'rgba(0,15,40,0.95)';
incidentPanel.style.color = '#a4ceff';
incidentPanel.style.padding = '0'; // Remove padding - will add inside
incidentPanel.style.border = '1px solid #0099ff';
incidentPanel.style.borderRadius = '12px';
incidentPanel.style.display = 'none';
incidentPanel.style.zIndex = '12000'; // Ensure highest z-index
incidentPanel.style.backdropFilter = 'blur(8px)';
incidentPanel.style.boxShadow = '0 0 30px #004488, 0 0 15px #0066cc inset';
incidentPanel.style.transition = 'all 0.5s cubic-bezier(0.19, 1, 0.22, 1)';
incidentPanel.style.opacity = '0';
incidentPanel.style.boxSizing = 'border-box';
incidentPanel.style.display = 'flex';
incidentPanel.style.flexDirection = 'column';
incidentPanel.style.overflowY = 'hidden'; // Prevent whole panel scrolling
  
// Create a background overlay
panelOverlay = document.createElement('div');
panelOverlay.className = 'incident-panel-overlay';
panelOverlay.style.position = 'fixed';
panelOverlay.style.top = '0';
panelOverlay.style.left = '0';
panelOverlay.style.width = '100%';
panelOverlay.style.height = '100%';
panelOverlay.style.background = 'rgba(0,10,30,0.7)';
panelOverlay.style.backdropFilter = 'blur(3px)';
panelOverlay.style.zIndex = '11000'; // Higher than all other UI elements except panel
panelOverlay.style.opacity = '0';
panelOverlay.style.transition = 'opacity 0.4s ease';
panelOverlay.style.display = 'none';
panelOverlay.style.pointerEvents = 'none'; // Start with none to allow clicks to pass through
document.body.appendChild(panelOverlay);

// Add click handler to overlay to close panel when clicking outside
panelOverlay.addEventListener('click', (e) => {
  if (e.target === panelOverlay) {
    closeIncidentPanel();
  }
});

  // Create incident panel header - IMPROVED WITH FIXED POSITION
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
  headerBar.style.zIndex = '100';
  headerBar.style.borderRadius = '12px 12px 0 0'; // Match panel border radius on top
  
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
  incidentTitle.style.overflow = 'hidden';
  incidentTitle.style.textOverflow = 'ellipsis';
  incidentTitle.style.whiteSpace = 'nowrap';
  incidentTitle.style.maxWidth = 'calc(100% - 50px)'; // Ensure space for close button
  titleContainer.appendChild(incidentTitle);
  
  headerBar.appendChild(titleContainer);
  
  // Create close button - IMPROVED POSITIONING
  const incidentClose = document.createElement('div');
  incidentClose.textContent = '✕';
  incidentClose.className = 'incident-close-btn';
  incidentClose.style.position = 'absolute';
  incidentClose.style.top = '10px';
  incidentClose.style.right = '15px';
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
  incidentClose.style.zIndex = '101'; // Higher than header
  
  incidentClose.addEventListener('click', (e) => {
    e.stopPropagation();
    closeIncidentPanel();
  });
  
  // Create content container - IMPROVED STRUCTURE FOR SCROLLING
  const contentContainer = document.createElement('div');
  contentContainer.style.flex = '1';
  contentContainer.style.padding = '20px 25px';
  contentContainer.style.overflowY = 'auto'; // Only the content area scrolls
  contentContainer.style.position = 'relative';
  contentContainer.style.maxHeight = 'calc(80vh - 45px)'; // Subtract header height
  contentContainer.style.boxSizing = 'border-box';
  
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
  incidentContent.style.width = '100%'; // Ensure full width
  playbookSection.appendChild(incidentContent);
  
  contentContainer.appendChild(playbookSection);
  
  // Assemble the panel in the correct order
  incidentPanel.appendChild(headerBar);
  incidentPanel.appendChild(contentContainer);
  incidentPanel.appendChild(incidentClose); // Add close button last so it's on top
  
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
      transition: all 0.3s ease-out;
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
      max-height: none;
      height: auto;
      padding: 8px 10px;
      margin-top: 5px;
      margin-bottom: 15px;
      border-left: 2px solid rgba(0,100,200,0.4);
      overflow-y: visible;
    }
    
    .condition-option {
      padding: 8px 12px;
      margin: 8px 0 15px 0;
      border-radius: 4px;
      background: rgba(0,50,100,0.4);
      border: 1px solid rgba(0,100,200,0.3);
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }

    .step-container {
      position: relative;
      margin-bottom: 5px;
    }

    /* Improved scrollbar styling */
    .incident-panel > div:nth-child(2)::-webkit-scrollbar {
      width: 8px;
    }
    
    .incident-panel > div:nth-child(2)::-webkit-scrollbar-track {
      background: rgba(0,20,50,0.3);
      border-radius: 4px;
    }
    
    .incident-panel > div:nth-child(2)::-webkit-scrollbar-thumb {
      background: rgba(0,100,200,0.5);
      border-radius: 4px;
    }
    
    .incident-panel > div:nth-child(2)::-webkit-scrollbar-thumb:hover {
      background: rgba(0,120,220,0.7);
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
    
    .condition-option {
      padding: 8px 12px;
      margin: 5px 0;
      border-radius: 4px;
      background: rgba(0,50,100,0.4);
      border: 1px solid rgba(0,100,200,0.3);
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
    }
    
    .condition-option:hover {
      background: rgba(0,70,140,0.6);
      border-color: rgba(0,120,230,0.5);
      box-shadow: 0 0 10px rgba(0,100,255,0.3);
    }
    
    .condition-icon {
      margin-right: 8px;
      color: #66ccff;
    }
    
    .condition-title {
      flex: 1;
      font-weight: bold;
      color: #ffffff;
    }
    
    .condition-description {
      margin-top: 3px;
      font-size: 12px;
      color: #b9d8ff;
    }
    
    .link-button {
      display: inline-flex;
      align-items: center;
      padding: 6px 10px;
      margin: 5px 0;
      background: rgba(0,60,120,0.5);
      border: 1px solid rgba(0,120,220,0.4);
      border-radius: 4px;
      color: #66ccff;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .link-button:hover {
      background: rgba(0,80,160,0.7);
      box-shadow: 0 0 10px rgba(0,120,255,0.4);
    }
    
    .link-icon {
      margin-right: 6px;
    }
    
    .step-container.condition {
      border-left: 3px solid #ffcc00;
    }
    
    .step-container.has-links {
      border-bottom: 1px dashed rgba(0,100,200,0.3);
      padding-bottom: 10px;
      margin-bottom: 5px;
    }
    
    .step-links-container {
      margin-top: 8px;
      padding: 5px;
      background: rgba(0,30,70,0.3);
      border-radius: 4px;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .incident-panel {
        width: 90vw !important;
        max-height: 85vh !important;
      }
      
      .step-description.expanded {
        max-height: none; // Allow full content viewing
        overflow-y: visible;
      }
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
        (step.description && step.description.toLowerCase().includes(query)) ||
        // Search in conditions
        (step.type === 'condition' && step.conditions && 
         step.conditions.some(condition => 
           condition.title.toLowerCase().includes(query) || 
           condition.description.toLowerCase().includes(query))) ||
        // Search in links
        (step.links && step.links.some(link => 
           link.title.toLowerCase().includes(query) || 
           link.description.toLowerCase().includes(query)))
      )) {
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
      if ((step.title && step.title.toLowerCase().includes(query)) || 
          (step.description && step.description.toLowerCase().includes(query))) {
        matchingStep = `Step: "${step.title}"`;
      }
      // Check conditions too
      if (step.type === 'condition' && step.conditions) {
        step.conditions.forEach(condition => {
          if ((condition.title && condition.title.toLowerCase().includes(query)) ||
              (condition.description && condition.description.toLowerCase().includes(query))) {
            matchingStep = `Condition: "${condition.title}"`;
          }
        });
      }
      // Check links too
      if (step.links) {
        step.links.forEach(link => {
          if ((link.title && link.title.toLowerCase().includes(query)) ||
              (link.description && link.description.toLowerCase().includes(query))) {
            matchingStep = `Link: "${link.title}"`;
          }
        });
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

// Navigate to step by reference - ENHANCED TO SUPPORT TARGETSTEP
function navigateToStep(stepRef, targetIndex, targetStep) {
  if (!currentIncidentData) return;
  
  // Handle step references - format: "step:X"
  if (typeof stepRef === 'string' && stepRef.startsWith('step:')) {
    const stepIndex = parseInt(stepRef.substring(5)) - 1;
    if (stepIndex >= 0 && stepIndex < currentIncidentData.steps.length) {
      // Find the step element
      const stepElements = document.querySelectorAll('.step-container');
      if (stepIndex < stepElements.length) {
        const targetStepEl = stepElements[stepIndex];
        
        // Scroll to the step
        requestAnimationFrame(() => {
          targetStepEl.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center'
          });
          
          // Highlight the step
          targetStepEl.style.animation = 'none';
          setTimeout(() => {
            targetStepEl.style.animation = 'step-highlight 0.8s 3';
            targetStepEl.style.boxShadow = '0 0 15px rgba(0,120,255,0.6)';
            
            setTimeout(() => {
              targetStepEl.style.boxShadow = 'none';
            }, 2400);
          }, 10);
          
          // Expand the step description
          const descriptionEl = targetStepEl.querySelector('.step-description');
          if (descriptionEl) {
            document.querySelectorAll('.step-description.expanded').forEach(desc => {
              desc.classList.remove('expanded');
            });
            
            descriptionEl.classList.add('expanded');
          }
        });
      }
    }
  } else if (stepRef === 'next') {
    // For backward compatibility, find the current step and navigate to the next one
    const currentStepElements = document.querySelectorAll('.step-container');
    let activeStepIndex = -1;
    
    // Find the current visible/active step
    currentStepElements.forEach((el, idx) => {
      if (el.querySelector('.step-description.expanded')) {
        activeStepIndex = idx;
      }
    });
    
    // Navigate to the next step if we found the current one
    if (activeStepIndex >= 0 && activeStepIndex < currentStepElements.length - 1) {
      const nextStepEl = currentStepElements[activeStepIndex + 1];
      // Use the step's data attribute to get the correct step index
      const nextStepIndex = parseInt(nextStepEl.getAttribute('data-step-index'));
      
      // Use existing step navigation code
      requestAnimationFrame(() => {
        nextStepEl.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center'
        });
        
        nextStepEl.style.animation = 'none';
        setTimeout(() => {
          nextStepEl.style.animation = 'step-highlight 0.8s 3';
          nextStepEl.style.boxShadow = '0 0 15px rgba(0,120,255,0.6)';
          
          setTimeout(() => {
            nextStepEl.style.boxShadow = 'none';
          }, 2400);
        }, 10);
        
        // Expand the next step description
        const descriptionEl = nextStepEl.querySelector('.step-description');
        if (descriptionEl) {
          document.querySelectorAll('.step-description.expanded').forEach(desc => {
            desc.classList.remove('expanded');
          });
          
          descriptionEl.classList.add('expanded');
        }
      });
    }
  } else {
    // Navigate to another incident
    // Find the target incident by name
    const targetIncident = window.securityIncidents.find(incident => incident.title === stepRef);
    
    if (targetIncident) {
      // Find the corresponding node
      const brainNodes = window.brainNodes || [];
      let targetNode = null;
      
      // Try finding by targetIndex first (more efficient)
      if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex < brainNodes.length) {
        targetNode = brainNodes[targetIndex];
      } 
      // If not found, try finding by incident index
      else if (targetIncident.index < brainNodes.length) {
        targetNode = brainNodes[targetIncident.index];
      }
      
      // Fade out current content
      incidentContent.style.transition = 'opacity 0.3s ease';
      incidentContent.style.opacity = '0';
      
      // Update the title with new incident color
      incidentTitle.textContent = targetIncident.title;
      if (targetIncident.color) {
        incidentTitle.style.color = targetIncident.color;
      } else {
        incidentTitle.style.color = '#FFCC00'; // Default color
      }
      
      // After fade out completes, update content and fade back in
      setTimeout(() => {
        // Update current incident data
        currentIncidentData = targetIncident;
        
        // Zoom camera to the node if found (during transition)
        if (targetNode && targetNode.mesh && cameraControlCallback) {
          cameraControlCallback.zoomTo(targetNode.mesh.position);
        }
        
        // Clear and rebuild content
        incidentContent.innerHTML = '';
        
        // Populate content - this code is similar to showIncidentPanel
        if (targetIncident.steps && targetIncident.steps.length > 0) {
          const stepContainer = document.createElement('div');
          stepContainer.style.display = 'flex';
          stepContainer.style.flexDirection = 'column';
          stepContainer.style.gap = '10px';
          
          targetIncident.steps.forEach((step, index) => {
            // Different handling based on step type
            const stepType = step.type || 'standard';
            
            const stepItem = document.createElement('div');
            stepItem.className = 'step-container ' + stepType;
            if (step.links && step.links.length > 0) {
              stepItem.classList.add('has-links');
            }
            stepItem.setAttribute('data-step-index', index);
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
            
            // For conditional steps, add a hierarchical branch icon
            if (stepType === 'condition') {
              const typeIndicator = document.createElement('div');
              typeIndicator.innerHTML = `<svg width="20" height="18" viewBox="0 0 24 24" style="display: inline-block; vertical-align: middle;">
                <path d="M12,2 L12,9 M5,15 L12,9 L19,15 M5,15 L5,20 M12,15 L12,20 M19,15 L19,20" 
                      stroke="#66CCFF" 
                      fill="none" 
                      stroke-width="2"
                      stroke-linecap="round" />
                <circle cx="12" cy="2" r="2" fill="#66CCFF" />
                <circle cx="5" cy="15" r="2" fill="#66CCFF" />
                <circle cx="12" cy="15" r="2" fill="#66CCFF" />
                <circle cx="19" cy="15" r="2" fill="#66CCFF" />
              </svg>`;
              typeIndicator.title = 'This step has multiple path options';
              typeIndicator.style.marginLeft = '5px';
              typeIndicator.style.display = 'inline-block';
              titleText.appendChild(typeIndicator);
            }
            
            // For steps with links, add an indicator
            if (step.links && step.links.length > 0) {
              const linkIndicator = document.createElement('div');
              linkIndicator.innerHTML = '🔗';
              linkIndicator.title = 'This step has links to other playbooks';
              linkIndicator.style.marginLeft = '5px';
              linkIndicator.style.fontSize = '10px';
              linkIndicator.style.display = 'inline-block';
              linkIndicator.style.verticalAlign = 'middle';
              titleText.appendChild(linkIndicator);
            }
            
            const mainContent = document.createElement('div');
            
            // Handle different step types
            if (stepType === 'standard') {
              // Standard step with description
              const descriptionDiv = document.createElement('div');
              descriptionDiv.className = 'step-description';
              
              // Create a text container for the description
              const descriptionText = document.createElement('div');
              descriptionText.textContent = step.description;
              descriptionDiv.appendChild(descriptionText);
              
              // Add links section inside the collapsible description div
              if (step.links && step.links.length > 0) {
                const linksContainer = document.createElement('div');
                linksContainer.className = 'step-links-container';
                linksContainer.style.marginTop = '15px'; // Add space between description and links
                
                const linksTitle = document.createElement('div');
                linksTitle.textContent = 'Related Playbooks:';
                linksTitle.style.fontSize = '12px';
                linksTitle.style.fontWeight = 'bold';
                linksTitle.style.marginBottom = '5px';
                linksTitle.style.color = '#8eb8ff';
                linksContainer.appendChild(linksTitle);
                
                step.links.forEach(link => {
                  const linkButton = document.createElement('div');
                  linkButton.className = 'link-button';
                  
                  const linkIcon = document.createElement('span');
                  linkIcon.className = 'link-icon';
                  linkIcon.innerHTML = '🔗';
                  
                  const linkText = document.createElement('span');
                  linkText.textContent = link.title;
                  
                  linkButton.appendChild(linkIcon);
                  linkButton.appendChild(linkText);
                  
                  // Add title with description
                  linkButton.title = link.description || 'Navigate to related playbook';
                  
                  // Add click handler, pass along both targetIndex and targetStep
                  linkButton.addEventListener('click', () => {
                    navigateToStep(link.target, link.targetIndex, link.targetStep);
                  });
                  
                  linksContainer.appendChild(linkButton);
                });
                
                descriptionDiv.appendChild(linksContainer);
              }
              
              stepHeader.addEventListener('click', () => {
                document.querySelectorAll('.step-description').forEach(desc => {
                  desc.classList.remove('expanded');
                });
                
                descriptionDiv.classList.toggle('expanded');
              });
              
              mainContent.appendChild(descriptionDiv);
            } else if (stepType === 'condition') {
              // Conditional step with options
              const conditionsDiv = document.createElement('div');
              conditionsDiv.className = 'step-description conditions-container';
              
              if (step.conditions && step.conditions.length > 0) {
                const conditionsDescription = document.createElement('div');
                conditionsDescription.textContent = step.description || 'Select the appropriate condition:';
                conditionsDescription.style.marginBottom = '10px';
                conditionsDescription.style.fontStyle = 'italic';
                conditionsDiv.appendChild(conditionsDescription);
                
                step.conditions.forEach((condition, condIndex) => {
                  // Condition options code here (unchanged)
                  const condOption = document.createElement('div');
                  condOption.style.marginBottom = '5px';
                  condOption.className = 'condition-option';
                  
                  const condIcon = document.createElement('span');
                  condIcon.className = 'condition-icon';
                  condIcon.innerHTML = '➤';
                  
                  const condContent = document.createElement('div');
                  condContent.style.flex = '1';
                  
                  const condTitle = document.createElement('div');
                  condTitle.className = 'condition-title';
                  condTitle.textContent = condition.title;
                  
                  const condDescription = document.createElement('div');
                  condDescription.className = 'condition-description';
                  condDescription.textContent = condition.description;
                  
                  condContent.appendChild(condTitle);
                  condContent.appendChild(condDescription);
                  
                  condOption.appendChild(condIcon);
                  condOption.appendChild(condContent);
                  
                  // Add click handler to follow condition
                  condOption.addEventListener('click', () => {
                    // Navigate based on target type
                    if (condition.target) {
                      navigateToStep(condition.target, condition.targetIndex, condition.targetStep);
                    }
                  });
                  
                  conditionsDiv.appendChild(condOption);
                });
              }
              
              // Add links section inside the conditional container
              if (step.links && step.links.length > 0) {
                const linksContainer = document.createElement('div');
                linksContainer.className = 'step-links-container';
                linksContainer.style.marginTop = '15px';
                
                const linksTitle = document.createElement('div');
                linksTitle.textContent = 'Related Playbooks:';
                linksTitle.style.fontSize = '12px';
                linksTitle.style.fontWeight = 'bold';
                linksTitle.style.marginBottom = '5px';
                linksTitle.style.color = '#8eb8ff';
                linksContainer.appendChild(linksTitle);
                
                step.links.forEach(link => {
                  const linkButton = document.createElement('div');
                  linkButton.className = 'link-button';
                  
                  const linkIcon = document.createElement('span');
                  linkIcon.className = 'link-icon';
                  linkIcon.innerHTML = '🔗';
                  
                  const linkText = document.createElement('span');
                  linkText.textContent = link.title;
                  
                  linkButton.appendChild(linkIcon);
                  linkButton.appendChild(linkText);
                  
                  // Add title with description
                  linkButton.title = link.description || 'Navigate to related playbook';
                  
                  // Add click handler
                  linkButton.addEventListener('click', () => {
                    navigateToStep(link.target, link.targetIndex, link.targetStep);
                  });
                  
                  linksContainer.appendChild(linkButton);
                });
                
                conditionsDiv.appendChild(linksContainer);
              }
              
              // Show conditions when clicking header
              stepHeader.addEventListener('click', () => {
                document.querySelectorAll('.step-description').forEach(desc => {
                  desc.classList.remove('expanded');
                });
                
                conditionsDiv.classList.toggle('expanded');
              });
              
              mainContent.appendChild(conditionsDiv);
            }
            
            stepHeader.appendChild(numberCircle);
            stepHeader.appendChild(titleText);
            
            stepItem.appendChild(stepHeader);
            stepItem.appendChild(mainContent);
            stepContainer.appendChild(stepItem);
          });
          
          incidentContent.appendChild(stepContainer);
        }
        
        // Fade content back in
        setTimeout(() => {
          incidentContent.style.opacity = '1';
          
          // If a specific target step is specified, navigate to it
          if (typeof targetStep === 'number' && targetStep >= 0 && targetStep < targetIncident.steps.length) {
            // Slight delay to ensure DOM is updated
            setTimeout(() => {
              // Find the specific step
              const stepElements = document.querySelectorAll('.step-container');
              if (targetStep < stepElements.length) {
                const targetStepEl = stepElements[targetStep];
                
                // Scroll to the step
                targetStepEl.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'center'
                });
                
                // Highlight the step
                targetStepEl.style.animation = 'none';
                setTimeout(() => {
                  targetStepEl.style.animation = 'step-highlight 0.8s 3';
                  targetStepEl.style.boxShadow = '0 0 15px rgba(0,120,255,0.6)';
                  
                  setTimeout(() => {
                    targetStepEl.style.boxShadow = 'none';
                  }, 2400);
                }, 10);
                
                // Expand the step description
                const descriptionEl = targetStepEl.querySelector('.step-description');
                if (descriptionEl) {
                  descriptionEl.classList.add('expanded');
                }
              }
            }, 100);
          }
        }, 50);
      }, 300); // After fade out animation completes
    }
  }
}

// Close incident panel with improved camera reset
function closeIncidentPanel() {
  // Begin panel closing animation
  incidentPanel.style.opacity = '0';
  panelOverlay.style.opacity = '0';
  incidentPanel.style.transform = 'translate(-50%, -50%) scale(0.8)';
  
  // Disable pointer events immediately
  panelOverlay.style.pointerEvents = 'none';
  
  // Ensure z-index is reset
  setTimeout(() => {
    incidentPanel.style.display = 'none';
    panelOverlay.style.display = 'none';
    
    // Make node labels visible again
    nodeLabels.forEach(label => {
      if (label.style.visibility !== 'hidden') {
        label.style.display = 'block';
      }
    });
    
    // Resume animation
    if (isPauseCallback) isPauseCallback(false);
    
    // Always use smooth transition when resetting the camera
    if (window.resetCameraView) {
      window.resetCameraView(true); // Use smooth transition
    } else if (cameraControlCallback) {
      cameraControlCallback.zoomOut(false); // Fallback to direct zoom out
    }
    
    // Reset tracking variables
    currentIncidentData = null;
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
      padding: 8px 12px; /* Larger padding for better touch targets */
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
      -webkit-tap-highlight-color: transparent; /* Remove tap highlight on mobile */
      touch-action: manipulation; /* Optimize for touch */
      max-width: 85vw; /* Prevent labels from extending beyond screen */
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    /* Mobile-specific enhancements */
    @media (max-width: 768px) {
      .node-label {
        padding: 6px 10px;
        font-size: 8px; /* Smaller font for mobile */
        max-width: 60vw; /* More restrictive width on mobile */
      }
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
    // Prevent default behaviors to avoid interference on mobile
    e.preventDefault();
    
    raycaster.setFromCamera(mouse, camera);
    
    // First try to click only incident nodes with a slightly larger threshold for mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const raycasterThreshold = isMobile ? 0.03 : 0.01; // Larger threshold on mobile
    
    // Set threshold for Points if it exists
    if (raycaster.params && raycaster.params.Points) {
      raycaster.params.Points.threshold = raycasterThreshold;
    }
    
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
        
        // Hide all labels when showing panel
        nodeLabels.forEach(label => {
          label.style.display = 'none';
        });
        
        // Show panel with higher z-index to overlay everything
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

// Modified showIncidentPanel function to fix overlay and timing issues
function showIncidentPanel(incidentData, targetStep) {
  currentIncidentData = incidentData;
  incidentTitle.textContent = incidentData.title;
  incidentContent.innerHTML = '';
  
  // Make sure the panel and overlay are fully set up before showing
  // Set highest z-index values to ensure overlay works
  incidentPanel.style.zIndex = '12000';
  panelOverlay.style.zIndex = '11000';
  
  // Show panel and overlay first with display property
  incidentPanel.style.display = 'flex';
  panelOverlay.style.display = 'block';
  
  // Enable pointer events on overlay for mobile
  panelOverlay.style.pointerEvents = 'all';
  
  // Update title color to match incident color
  if (incidentData.color) {
    incidentTitle.style.color = incidentData.color;
  } else {
    incidentTitle.style.color = '#FFCC00'; // Default color
  }
  
  // Populate content
  if (incidentData.steps && incidentData.steps.length > 0) {
    const stepContainer = document.createElement('div');
    stepContainer.style.display = 'flex';
    stepContainer.style.flexDirection = 'column';
    stepContainer.style.gap = '10px';
    
    incidentData.steps.forEach((step, index) => {
      // Different handling based on step type
      const stepType = step.type || 'standard';
      
      const stepItem = document.createElement('div');
      stepItem.className = 'step-container ' + stepType;
      if (step.links && step.links.length > 0) {
        stepItem.classList.add('has-links');
      }
      stepItem.setAttribute('data-step-index', index);
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
      
      // For conditional steps, add a hierarchical branch icon in blue theme color
      if (stepType === 'condition') {
        const typeIndicator = document.createElement('div');
        // Create SVG branch icon that exactly matches the image
        typeIndicator.innerHTML = `<svg width="20" height="18" viewBox="0 0 24 24" style="display: inline-block; vertical-align: middle;">
          <path d="M12,2 L12,9 M5,15 L12,9 L19,15 M5,15 L5,20 M12,15 L12,20 M19,15 L19,20" 
                stroke="#66CCFF" 
                fill="none" 
                stroke-width="2"
                stroke-linecap="round" />
          <circle cx="12" cy="2" r="2" fill="#66CCFF" />
          <circle cx="5" cy="15" r="2" fill="#66CCFF" />
          <circle cx="12" cy="15" r="2" fill="#66CCFF" />
          <circle cx="19" cy="15" r="2" fill="#66CCFF" />
        </svg>`;
        typeIndicator.title = 'This step has multiple path options';
        typeIndicator.style.marginLeft = '5px';
        typeIndicator.style.display = 'inline-block';
        titleText.appendChild(typeIndicator);
      }
      
      // For steps with links, add an indicator
      if (step.links && step.links.length > 0) {
        const linkIndicator = document.createElement('div');
        linkIndicator.innerHTML = '🔗';
        linkIndicator.title = 'This step has links to other playbooks';
        linkIndicator.style.marginLeft = '5px';
        linkIndicator.style.fontSize = '10px';
        linkIndicator.style.display = 'inline-block'; // Make it display inline
        linkIndicator.style.verticalAlign = 'middle'; // Align vertically with text
        titleText.appendChild(linkIndicator);
      }
      
      const mainContent = document.createElement('div');
      
      // Handle different step types
      if (stepType === 'standard') {
        // Standard step with description
        const descriptionDiv = document.createElement('div');
        descriptionDiv.className = 'step-description';
        
        // Create a text container for the description
        const descriptionText = document.createElement('div');
        descriptionText.textContent = step.description;
        descriptionDiv.appendChild(descriptionText);
        
        // Add links section inside the collapsible description div
        if (step.links && step.links.length > 0) {
          const linksContainer = document.createElement('div');
          linksContainer.className = 'step-links-container';
          linksContainer.style.marginTop = '15px'; // Add space between description and links
          
          const linksTitle = document.createElement('div');
          linksTitle.textContent = 'Related Playbooks:';
          linksTitle.style.fontSize = '12px';
          linksTitle.style.fontWeight = 'bold';
          linksTitle.style.marginBottom = '5px';
          linksTitle.style.color = '#8eb8ff';
          linksContainer.appendChild(linksTitle);
          
          step.links.forEach(link => {
            const linkButton = document.createElement('div');
            linkButton.className = 'link-button';
            
            const linkIcon = document.createElement('span');
            linkIcon.className = 'link-icon';
            linkIcon.innerHTML = '🔗';
            
            const linkText = document.createElement('span');
            linkText.textContent = link.title;
            
            linkButton.appendChild(linkIcon);
            linkButton.appendChild(linkText);
            
            // Add title with description
            linkButton.title = link.description || 'Navigate to related playbook';
            
            // Add click handler, pass along both targetIndex and targetStep
            linkButton.addEventListener('click', () => {
              navigateToStep(link.target, link.targetIndex, link.targetStep);
            });
            
            linksContainer.appendChild(linkButton);
          });
          
          descriptionDiv.appendChild(linksContainer);
        }
        
        stepHeader.addEventListener('click', () => {
          document.querySelectorAll('.step-description').forEach(desc => {
            desc.classList.remove('expanded');
          });
          
          descriptionDiv.classList.toggle('expanded');
        });
        
        mainContent.appendChild(descriptionDiv);
      } else if (stepType === 'condition') {
        // Conditional step with options
        const conditionsDiv = document.createElement('div');
        conditionsDiv.className = 'step-description conditions-container';
        
        if (step.conditions && step.conditions.length > 0) {
          const conditionsDescription = document.createElement('div');
          conditionsDescription.textContent = step.description || 'Select the appropriate condition:';
          conditionsDescription.style.marginBottom = '10px';
          conditionsDescription.style.fontStyle = 'italic';
          conditionsDiv.appendChild(conditionsDescription);
          
          step.conditions.forEach((condition, condIndex) => {
            // Condition options code here (unchanged)
            const condOption = document.createElement('div');
            condOption.style.marginBottom = '5px';
            condOption.className = 'condition-option';
            
            const condIcon = document.createElement('span');
            condIcon.className = 'condition-icon';
            condIcon.innerHTML = '➤';
            
            const condContent = document.createElement('div');
            condContent.style.flex = '1';
            
            const condTitle = document.createElement('div');
            condTitle.className = 'condition-title';
            condTitle.textContent = condition.title;
            
            const condDescription = document.createElement('div');
            condDescription.className = 'condition-description';
            condDescription.textContent = condition.description;
            
            condContent.appendChild(condTitle);
            condContent.appendChild(condDescription);
            
            condOption.appendChild(condIcon);
            condOption.appendChild(condContent);
            
            // Add click handler to follow condition
            condOption.addEventListener('click', () => {
              // Navigate based on target type
              if (condition.target) {
                navigateToStep(condition.target, condition.targetIndex, condition.targetStep);
              }
            });
            
            conditionsDiv.appendChild(condOption);
          });
        }
        
        // Add links section inside the conditional container
        if (step.links && step.links.length > 0) {
          const linksContainer = document.createElement('div');
          linksContainer.className = 'step-links-container';
          linksContainer.style.marginTop = '15px';
          
          const linksTitle = document.createElement('div');
          linksTitle.textContent = 'Related Playbooks:';
          linksTitle.style.fontSize = '12px';
          linksTitle.style.fontWeight = 'bold';
          linksTitle.style.marginBottom = '5px';
          linksTitle.style.color = '#8eb8ff';
          linksContainer.appendChild(linksTitle);
          
          step.links.forEach(link => {
            const linkButton = document.createElement('div');
            linkButton.className = 'link-button';
            
            const linkIcon = document.createElement('span');
            linkIcon.className = 'link-icon';
            linkIcon.innerHTML = '🔗';
            
            const linkText = document.createElement('span');
            linkText.textContent = link.title;
            
            linkButton.appendChild(linkIcon);
            linkButton.appendChild(linkText);
            
            // Add title with description
            linkButton.title = link.description || 'Navigate to related playbook';
            
            // Add click handler
            linkButton.addEventListener('click', () => {
              navigateToStep(link.target, link.targetIndex, link.targetStep);
            });
            
            linksContainer.appendChild(linkButton);
          });
          
          conditionsDiv.appendChild(linksContainer);
        }
        
        // Show conditions when clicking header
        stepHeader.addEventListener('click', () => {
          document.querySelectorAll('.step-description').forEach(desc => {
            desc.classList.remove('expanded');
          });
          
          conditionsDiv.classList.toggle('expanded');
        });
        
        mainContent.appendChild(conditionsDiv);
      }
      
      stepHeader.appendChild(numberCircle);
      stepHeader.appendChild(titleText);
      
      stepItem.appendChild(stepHeader);
      stepItem.appendChild(mainContent);
      stepContainer.appendChild(stepItem);
    });
    
    incidentContent.appendChild(stepContainer);
  }
  
  // Use requestAnimationFrame for better animation timing
  requestAnimationFrame(() => {
    // Animation with optimized timing
    setTimeout(() => {
      incidentPanel.style.opacity = '1';
      panelOverlay.style.opacity = '1';
      incidentPanel.style.transform = 'translate(-50%, -50%) scale(1)';
      
      // If a specific target step is specified, navigate to it
      if (typeof targetStep === 'number' && targetStep >= 0 && targetStep < incidentData.steps.length) {
        // Delay navigation to ensure panel is visible first
        setTimeout(() => {
          navigateToStep(`step:${targetStep + 1}`);
        }, 300);
      }
    }, 20); // Small delay for DOM to update
  });
  
  if (isPauseCallback) isPauseCallback(true);
}

// Animation for incident nodes
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
  console.log(`Saving ${incidents.length} incidents to global state`);
  
  // Make a deep copy to avoid reference issues
  window.securityIncidents = JSON.parse(JSON.stringify(incidents));
  
  // Set the flag to indicate we have custom data loaded
  incidentsLoadedFromJSON = true;
  
  if (window.brainNodes) {
    createIncidentNodes(window.brainNodes);
  }
  
  return { success: true };
}

function loadIncidents() {
  return [...window.securityIncidents];
}

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
