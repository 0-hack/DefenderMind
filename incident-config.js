// Configuration Panel for Security Incidents
// This file manages the configuration interface for adding, editing, and removing incident nodes

// Global variables to improve performance
let configPanel = null;
let configButton = null;
let incidentsData = [];
let isButtonClickable = true;
let isPanelCreated = false;
let isPanelVisible = false;
let securityIncidentsReadyInterval = null;

// Constants for node limitations
const MAX_BRAIN_NODES = 162; // Maximum nodes available (desktop version)

// Function to show notification messages
function showNotification(message, type = 'info') {
  // Create notification container if it doesn't exist
  let notificationContainer = document.getElementById('notification-container');
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      max-width: 300px;
      z-index: 10000;
      font-family: 'Exo 2', sans-serif;
    `;
    document.body.appendChild(notificationContainer);
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    margin-bottom: 10px;
    padding: 12px 15px;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0,0,0,0.3);
    color: white;
    font-size: 14px;
    transition: all 0.3s ease;
    opacity: 0;
    transform: translateX(50px);
  `;
  
  // Set color based on notification type
  if (type === 'success') {
    notification.style.background = 'rgba(0,120,60,0.9)';
    notification.style.borderLeft = '4px solid #00cc66';
  } else if (type === 'error') {
    notification.style.background = 'rgba(150,30,30,0.9)';
    notification.style.borderLeft = '4px solid #ff5555';
  } else {
    notification.style.background = 'rgba(0,60,120,0.9)';
    notification.style.borderLeft = '4px solid #33aaff';
  }
  
  notification.textContent = message;
  
  // Add to container
  notificationContainer.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  }, 10);
  
  // Animate out after delay
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(50px)';
    
    // Remove from DOM after animation
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Wait for DOM content to be loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("Loading configuration module");
  
  // Check if configuration should be disabled based on server environment
  const configDisabled = window.DEFENDER_CONFIG && window.DEFENDER_CONFIG.disableConfig;
  
  if (!configDisabled) {
    // Create config button immediately to improve responsiveness
    createConfigButton();
    
    // Check for SecurityIncidents module with a more reliable method
    waitForSecurityIncidents();
  } else {
    console.log("Configuration interface disabled by server environment setting");
  }
});

// Wait for SecurityIncidents to be fully initialized
function waitForSecurityIncidents() {
  // Clear any existing interval to prevent duplicates
  if (securityIncidentsReadyInterval) {
    clearInterval(securityIncidentsReadyInterval);
  }
  
  // Use interval instead of timeout for more reliability
  securityIncidentsReadyInterval = setInterval(function() {
    if (window.SecurityIncidents && typeof window.SecurityIncidents.loadIncidents === 'function') {
      console.log("SecurityIncidents module found - ready to use");
      clearInterval(securityIncidentsReadyInterval);
      
      // Pre-load incident data
      incidentsData = window.SecurityIncidents.loadIncidents();
      
      // Pre-create the panel structure (without display) for faster response
      if (!isPanelCreated) {
        createConfigPanelStructure();
      }
      
      // Enable button fully
      if (configButton) {
        configButton.style.opacity = "1";
        configButton.disabled = false;
      }
    }
  }, 100); // Check every 100ms instead of waiting 500ms
  
  // Set a timeout to eventually stop checking to prevent infinite loops
  setTimeout(function() {
    if (securityIncidentsReadyInterval) {
      clearInterval(securityIncidentsReadyInterval);
      console.warn("SecurityIncidents module not found after timeout - some features may be limited");
      // Still enable the button but with warning
      if (configButton) {
        configButton.style.opacity = "0.7";
        configButton.disabled = false;
      }
    }
  }, 5000); // Give up after 5 seconds
}

// Function to create the floating config button
function createConfigButton() {
  // Check if button already exists
  if (document.getElementById('configButton')) {
    console.log("Config button already exists");
    return;
  }
  
  // Create button with all styles at once to reduce reflows
  configButton = document.createElement('button');
  configButton.id = 'configButton';
  
  // Use only icon for cleaner mobile experience
  configButton.innerHTML = '<span>⚙️</span>';
  
  // Apply all styles at once using cssText for better performance
  configButton.style.cssText = `
    position: fixed;
    top: 15px;
    right: 15px;
    z-index: 9000;
    background: rgba(0, 20, 50, 0.8);
    color: #66ccff;
    border: 1px solid rgba(0, 100, 200, 0.4);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    padding: 0;
    font-size: 18px;
    cursor: pointer;
    font-weight: bold;
    box-shadow: 0 0 15px rgba(0, 100, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    opacity: 0.6;
  `;
  
  // Disable button until SecurityIncidents is ready
  configButton.disabled = true;
  
  // Use event delegation and debounce pattern for better performance
  configButton.addEventListener('click', handleConfigButtonClick);
  
  // Add title attribute for accessibility
  configButton.title = "Configuration";
  
  document.body.appendChild(configButton);
  console.log("Config button created");
}

// Debounce mechanism for button clicks
function handleConfigButtonClick(e) {
  // Prevent multiple rapid clicks
  if (!isButtonClickable) return;
  
  // Set flag to prevent multiple clicks
  isButtonClickable = false;
  console.log("Config button clicked");
  
  // Create visual feedback
  configButton.style.transform = "scale(0.95)";
  
  // Create the full panel if we haven't yet
  if (!isPanelCreated) {
    createConfigPanelStructure();
  }
  
  // Toggle panel visibility with optimized approach
  toggleConfigPanel();
  
  // Reset button state after a short delay
  setTimeout(() => {
    configButton.style.transform = "scale(1)";
    isButtonClickable = true;
  }, 300);
}

// Create just the panel structure without content for faster initial rendering
function createConfigPanelStructure() {
  if (isPanelCreated) return;
  
  console.log("Creating config panel structure");
  
  // Create the panel container with all styles at once
  configPanel = document.createElement('div');
  configPanel.id = 'configPanel';
  
  // Apply all styles at once using cssText for better performance
  configPanel.style.cssText = `
    position: fixed;
    top: 70px;
    right: 15px;
    width: 500px;
    max-width: 90vw;
    max-height: 80vh;
    background: rgba(0,15,40,0.95);
    border-radius: 8px;
    box-shadow: 0 0 30px rgba(0,100,255,0.3);
    z-index: 8999;
    display: none;
    opacity: 0;
    transform: translateY(-20px);
    transition: opacity 0.25s ease, transform 0.25s ease;
    backdrop-filter: blur(5px);
    border: 1px solid rgba(0,100,200,0.3);
    overflow: hidden;
    flex-direction: column;
    padding: 20px;
    box-sizing: border-box;
    font-family: 'Exo 2', sans-serif;
    color: #c4e0ff;
  `;
  
  // Create header with all styles at once
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(0,100,200,0.3);
  `;
  
  const headerTitleContainer = document.createElement('div');
  headerTitleContainer.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
  `;
  
  const headerTitle = document.createElement('h2');
  headerTitle.textContent = 'Node Configuration';
  headerTitle.style.cssText = `
    margin: 0;
    font-size: 18px;
    color: #66ccff;
    text-shadow: 0 0 10px rgba(0,150,255,0.3);
  `;
  
  // Create capacity indicator
  const capacityIndicator = document.createElement('span');
  capacityIndicator.id = 'node-capacity-indicator';
  capacityIndicator.style.cssText = `
    font-size: 14px;
    color: #a4ddff;
    background: rgba(0,50,100,0.3);
    padding: 3px 8px;
    border-radius: 12px;
    font-weight: normal;
    border: 1px solid rgba(0,120,200,0.3);
  `;
  capacityIndicator.textContent = '0/' + MAX_BRAIN_NODES + ' nodes';
  
  headerTitleContainer.appendChild(headerTitle);
  headerTitleContainer.appendChild(capacityIndicator);
  
  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕';
  closeBtn.style.cssText = `
    background: rgba(0,40,80,0.5);
    color: #66ccff;
    border: 1px solid rgba(0,100,200,0.3);
    border-radius: 50%;
    width: 30px;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(0,100,255,0.2);
    font-size: 16px;
    transition: all 0.3s ease;
  `;
  
  closeBtn.addEventListener('click', toggleConfigPanel);
  
  header.appendChild(headerTitleContainer);
  header.appendChild(closeBtn);
  
  // Create content area (scrollable)
  const contentArea = document.createElement('div');
  contentArea.style.cssText = `
    overflow-y: auto;
    flex: 1;
    margin-bottom: 15px;
    padding-right: 5px;
    max-height: calc(80vh - 150px);
  `;
  
  // Create incident list container (will be populated when visible)
  const incidentList = document.createElement('div');
  incidentList.id = 'incidentList';
  incidentList.style.cssText = `
    border-radius: 4px;
    margin-bottom: 20px;
  `;
  contentArea.appendChild(incidentList);
  
  // Add button
  const addBtn = document.createElement('button');
  addBtn.id = 'addIncidentBtn';
  addBtn.textContent = '+ Add New Incident';
  addBtn.style.cssText = `
    width: 100%;
    padding: 10px;
    background: rgba(0,80,160,0.5);
    color: #ffffff;
    border: 1px solid rgba(0,120,255,0.4);
    border-radius: 4px;
    cursor: pointer;
    font-family: 'Exo 2', sans-serif;
    font-size: 14px;
    margin-bottom: 20px;
    transition: all 0.3s ease;
  `;
  
  addBtn.addEventListener('click', () => {
    // Check if we've reached maximum node capacity
    if (incidentsData.length >= MAX_BRAIN_NODES) {
      showNotification(`Cannot add more incidents. Maximum limit of ${MAX_BRAIN_NODES} nodes reached.`, 'error');
      return;
    }
    
    // Create a new empty incident and open the editor
    const newIncident = {
      title: 'New Incident',
      steps: [
        { 
          title: 'First step', 
          description: 'Description for first step',
          type: 'standard'
        }
      ],
      index: getNextAvailableIndex(),
      color: '#FFCC00' // Default yellow color
    };
    
    showIncidentEditor(newIncident, true);
  });
  
  contentArea.appendChild(addBtn);
  
  // Save all button
  const saveAllBtn = document.createElement('button');
  saveAllBtn.textContent = '💾 Save All Changes';
  saveAllBtn.style.cssText = `
    width: 100%;
    padding: 12px;
    background: rgba(0,120,40,0.6);
    color: #ffffff;
    border: 1px solid rgba(0,180,80,0.4);
    border-radius: 4px;
    cursor: pointer;
    font-family: 'Exo 2', sans-serif;
    font-size: 16px;
    font-weight: bold;
    box-shadow: 0 0 15px rgba(0,150,80,0.2);
    transition: all 0.3s ease;
  `;
  
  saveAllBtn.addEventListener('click', saveAllChanges);
  
  // Add export/import buttons
  const importExportContainer = document.createElement('div');
  importExportContainer.style.cssText = `
    display: flex;
    gap: 10px;
    margin-top: 10px;
  `;
  
  // Export button
  const exportBtn = document.createElement('button');
  exportBtn.textContent = '📤 Export';
  exportBtn.style.cssText = `
    flex: 1;
    padding: 8px;
    background: rgba(40,40,120,0.6);
    color: #d0e0ff;
    border: 1px solid rgba(80,80,180,0.4);
    border-radius: 4px;
    cursor: pointer;
    font-family: 'Exo 2', sans-serif;
    font-size: 14px;
    transition: all 0.3s ease;
  `;
  
  exportBtn.addEventListener('click', exportIncidents);
  
  // Import button
  const importBtn = document.createElement('button');
  importBtn.textContent = '📥 Import';
  importBtn.style.cssText = `
    flex: 1;
    padding: 8px;
    background: rgba(40,40,120,0.6);
    color: #d0e0ff;
    border: 1px solid rgba(80,80,180,0.4);
    border-radius: 4px;
    cursor: pointer;
    font-family: 'Exo 2', sans-serif;
    font-size: 14px;
    transition: all 0.3s ease;
  `;
  
  // Create hidden file input for import
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.id = 'import-file';
  fileInput.accept = '.json';
  fileInput.style.display = 'none';
  
  fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      showNotification('Please select a JSON file', 'error');
      return;
    }
    
    // Show loading notification
    showNotification('Reading file...', 'info');
    
    const reader = new FileReader();
    
    reader.onload = function(event) {
      try {
        // Parse the JSON data
        const imported = JSON.parse(event.target.result);
        
        if (Array.isArray(imported) && imported.length > 0) {
          // Basic validation
          const valid = imported.every(item => 
            typeof item === 'object' && 
            item.title && 
            typeof item.index === 'number' &&
            Array.isArray(item.steps)
          );
          
          if (valid) {
            // Show confirmation dialog
            const confirmOverwrite = confirm(`This will replace ${imported.length} incident(s) in your configuration. Continue?`);
            
            if (!confirmOverwrite) {
              showNotification('Import cancelled', 'info');
              return;
            }
            
            // Check if the import would exceed the maximum node limit
            if (imported.length > MAX_BRAIN_NODES) {
              alert(`Import contains ${imported.length} incidents, but the maximum limit is ${MAX_BRAIN_NODES}. Only the first ${MAX_BRAIN_NODES} will be imported.`);
              // Truncate the imported array to maximum allowed
              incidentsData = imported.slice(0, MAX_BRAIN_NODES);
            } else {
              incidentsData = imported;
            }
  
            // Update the UI
            renderIncidentList();
            updateCapacityIndicator();
            
            // Save to server
            showNotification('Saving imported data...', 'info');
            
            fetch('/save-incidents', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(incidentsData)
            })
            .then(response => {
              if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
              }
              return response.json();
            })
            .then(data => {
              if (data.success) {
                // Update the visualization
                if (window.SecurityIncidents && typeof window.SecurityIncidents.saveIncidents === 'function') {
                  window.SecurityIncidents.saveIncidents(incidentsData);
                }
                showNotification(`Successfully imported ${incidentsData.length} incident(s)!`, 'success');
              } else {
                throw new Error(data.message || 'Unknown server error');
              }
            })
            .catch(error => {
              console.error('Server error:', error);
              showNotification(`Import error: ${error.message}`, 'error');
            });
          } else {
            showNotification('Invalid incident data format. Please check your JSON file.', 'error');
          }
        } else {
          showNotification('No valid incident data found in file.', 'error');
        }
      } catch (error) {
        console.error('Import parsing error:', error);
        showNotification(`JSON parsing error: ${error.message}`, 'error');
      }
  
      // Reset file input to allow same file selection
      fileInput.value = '';
    };
  
    reader.onerror = function(error) {
      console.error('File reading error:', error);
      showNotification(`Failed to read file: ${error.message}`, 'error');
      fileInput.value = '';
    };
    
    reader.readAsText(file);
  });
  
  document.body.appendChild(fileInput);
  
  importBtn.addEventListener('click', function(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Reset the file input to ensure change event fires even with same file
    fileInput.value = '';
  
    // Trigger file selection dialog
    fileInput.click();
  });
  
  importExportContainer.appendChild(exportBtn);
  importExportContainer.appendChild(importBtn);
  
  // Assemble panel
  configPanel.appendChild(header);
  configPanel.appendChild(contentArea);
  configPanel.appendChild(saveAllBtn);
  configPanel.appendChild(importExportContainer);
  
  document.body.appendChild(configPanel);
  isPanelCreated = true;
  
  console.log("Config panel structure created");
}

// Update the capacity indicator
function updateCapacityIndicator() {
  const capacityIndicator = document.getElementById('node-capacity-indicator');
  if (capacityIndicator) {
    const usedNodes = incidentsData.length;
    const remainingNodes = MAX_BRAIN_NODES - usedNodes;
    capacityIndicator.textContent = `${usedNodes}/${MAX_BRAIN_NODES} nodes`;
    
    // Change color based on capacity
    if (usedNodes >= MAX_BRAIN_NODES) {
      capacityIndicator.style.color = '#ff9999';
      capacityIndicator.style.borderColor = 'rgba(200,50,50,0.4)';
      capacityIndicator.style.background = 'rgba(80,0,0,0.3)';
    } else if (usedNodes >= MAX_BRAIN_NODES * 0.8) { // Over 80% usage
      capacityIndicator.style.color = '#ffcc99';
      capacityIndicator.style.borderColor = 'rgba(200,150,50,0.4)';
      capacityIndicator.style.background = 'rgba(80,50,0,0.3)';
    } else {
      capacityIndicator.style.color = '#a4ddff';
      capacityIndicator.style.borderColor = 'rgba(0,120,200,0.3)';
      capacityIndicator.style.background = 'rgba(0,50,100,0.3)';
    }
    
    // Update add button state
    const addButton = document.getElementById('addIncidentBtn');
    if (addButton) {
      if (usedNodes >= MAX_BRAIN_NODES) {
        addButton.disabled = true;
        addButton.style.opacity = '0.5';
        addButton.style.cursor = 'not-allowed';
        addButton.title = 'Maximum node limit reached';
      } else {
        addButton.disabled = false;
        addButton.style.opacity = '1';
        addButton.style.cursor = 'pointer';
        addButton.title = '';
      }
    }
  }
}

// Load incident data from the main security incidents array
function loadIncidentData() {
  console.log("Loading memory");
  
  if (window.SecurityIncidents && typeof window.SecurityIncidents.loadIncidents === 'function') {
    // Load fresh data
    incidentsData = window.SecurityIncidents.loadIncidents();
    console.log(`Loaded ${incidentsData.length} incidents`);
    
    // Use requestAnimationFrame for smoother rendering
    requestAnimationFrame(() => {
      renderIncidentList();
      updateCapacityIndicator();
    });
    
    return true;
  } else {
    console.error('SecurityIncidents module not available or loadIncidents function not found');
    showNotification('Error memory', 'error');
    return false;
  }
}

// Function to toggle config panel visibility with better performance
function toggleConfigPanel() {
  // If panel isn't created yet, create it
  if (!isPanelCreated) {
    createConfigPanelStructure();
  }
  
  console.log("Toggling config panel. Current state:", isPanelVisible ? "visible" : "hidden");
  
  // Toggle visibility flag
  isPanelVisible = !isPanelVisible;
  
  if (isPanelVisible) {
    // Load data before showing panel
    loadIncidentData();
    
    // Show panel with optimized animation
    configPanel.style.display = 'flex';
    
    // Use requestAnimationFrame to ensure display change has taken effect
    requestAnimationFrame(() => {
      configPanel.style.opacity = '1';
      configPanel.style.transform = 'translateY(0)';
    });
  } else {
    // Hide with optimized animation
    configPanel.style.opacity = '0';
    configPanel.style.transform = 'translateY(-20px)';
    
    // Use a direct timeout instead of a nested one
    setTimeout(() => {
      configPanel.style.display = 'none';
    }, 250); // Match the CSS transition time
  }
}

// Optimized incident list rendering with documentFragment
function renderIncidentList() {
  const incidentList = document.getElementById('incidentList');
  if (!incidentList) {
    console.error("incidentList element not found");
    return;
  }
  
  // Use document fragment for better performance
  const fragment = document.createDocumentFragment();
  
  // Clear existing list with more efficient method
  while (incidentList.firstChild) {
    incidentList.removeChild(incidentList.firstChild);
  }
  
  // Create list items
  if (incidentsData.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.textContent = 'No incidents configured. Add one to get started!';
    emptyMessage.style.cssText = `
      text-align: center;
      padding: 20px;
      color: #8eb8ff;
      font-style: italic;
    `;
    fragment.appendChild(emptyMessage);
  } else {
    // Build all items and add them to the fragment
    incidentsData.forEach((incident, index) => {
      const item = createIncidentListItem(incident, index);
      fragment.appendChild(item);
    });
  }
  
  // Add all items to DOM at once
  incidentList.appendChild(fragment);
  
  // Update capacity indicator
  updateCapacityIndicator();
}

// Helper function to create incident list item
function createIncidentListItem(incident, index) {
  const item = document.createElement('div');
  item.className = 'incident-item';
  item.style.cssText = `
    background: rgba(0,30,70,0.7);
    padding: 12px 15px;
    border-radius: 4px;
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    transition: all 0.3s ease;
    cursor: pointer;
  `;
  
  // Left side - incident info
  const infoContainer = document.createElement('div');
  infoContainer.style.cssText = `
    flex: 1;
    overflow: hidden;
    display: flex;
    align-items: center;
  `;
  
  // Add color indicator
  const colorIndicator = document.createElement('div');
  colorIndicator.style.cssText = `
    width: 16px;
    height: 16px;
    background-color: ${incident.color || '#FFCC00'};
    border-radius: 50%;
    margin-right: 10px;
    box-shadow: 0 0 8px rgba(255,255,255,0.2);
  `;
  infoContainer.appendChild(colorIndicator);
  
  const titleContainer = document.createElement('div');
  titleContainer.style.flex = '1';
  
  const title = document.createElement('div');
  title.textContent = incident.title;
  title.style.cssText = `
    font-size: 16px;
    font-weight: bold;
    color: #ffffff;
    margin-bottom: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `;
  titleContainer.appendChild(title);
  
  // Count special step types
  let conditionCount = 0;
  let linksCount = 0;
  
  incident.steps.forEach(step => {
    if (step.type === 'condition') conditionCount++;
    if (step.links && step.links.length) linksCount += step.links.length;
  });
  
  // Add badges for special types
  const badges = document.createElement('div');
  badges.style.cssText = `
    display: flex;
    gap: 5px;
    margin-bottom: 3px;
  `;
  
  if (conditionCount > 0) {
    const conditionBadge = document.createElement('span');
    conditionBadge.textContent = `${conditionCount} ${conditionCount === 1 ? 'Condition' : 'Conditions'}`;
    conditionBadge.style.cssText = `
      font-size: 10px;
      padding: 2px 5px;
      background: rgba(255,204,0,0.2);
      border: 1px solid rgba(255,204,0,0.4);
      border-radius: 3px;
      color: #ffcc00;
    `;
    badges.appendChild(conditionBadge);
  }
  
  if (linksCount > 0) {
    const linksBadge = document.createElement('span');
    linksBadge.textContent = `${linksCount} ${linksCount === 1 ? 'Link' : 'Links'}`;
    linksBadge.style.cssText = `
      font-size: 10px;
      padding: 2px 5px;
      background: rgba(102,204,255,0.2);
      border: 1px solid rgba(102,204,255,0.4);
      border-radius: 3px;
      color: #66ccff;
    `;
    badges.appendChild(linksBadge);
  }
  
  if (conditionCount > 0 || linksCount > 0) {
    titleContainer.appendChild(badges);
  }
  
  const details = document.createElement('div');
  details.textContent = `Node: ${incident.index} • Steps: ${incident.steps.length}`;
  details.style.cssText = `
    font-size: 12px;
    color: #8eb8ff;
  `;
  titleContainer.appendChild(details);
  
  infoContainer.appendChild(titleContainer);
  
  // Right side - action buttons
  const actionContainer = document.createElement('div');
  actionContainer.style.cssText = `
    display: flex;
    gap: 5px;
  `;
  
  const editBtn = document.createElement('button');
  editBtn.innerHTML = '✏️';
  editBtn.title = 'Edit';
  editBtn.style.cssText = `
    width: 30px;
    height: 30px;
    background: rgba(0,80,160,0.6);
    border: 1px solid rgba(0,120,240,0.3);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
  `;
  
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showIncidentEditor(incident, false);
  });
  
  const deleteBtn = document.createElement('button');
  deleteBtn.innerHTML = '🗑️';
  deleteBtn.title = 'Delete';
  deleteBtn.style.cssText = `
    width: 30px;
    height: 30px;
    background: rgba(160,0,0,0.6);
    border: 1px solid rgba(240,0,0,0.3);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
  `;
  
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    confirmDeletion(index);
  });
  
  actionContainer.appendChild(editBtn);
  actionContainer.appendChild(deleteBtn);
  
  // Add all elements to item
  item.appendChild(infoContainer);
  item.appendChild(actionContainer);
  
  // Add click handler to entire item
  item.addEventListener('click', () => {
    showIncidentEditor(incident, false);
  });
  
  return item;
}

// Helper function to get the next available index for new incidents
function getNextAvailableIndex() {
  if (incidentsData.length === 0) return 0;
  
  // Find unused indices between existing ones
  const usedIndices = incidentsData.map(incident => incident.index).sort((a, b) => a - b);
  
  for (let i = 0; i < usedIndices.length; i++) {
    if (i === 0 && usedIndices[i] > 0) return 0;
    if (i < usedIndices.length - 1 && usedIndices[i + 1] - usedIndices[i] > 1) {
      return usedIndices[i] + 1;
    }
  }
  
  // Return the next index after the highest used one
  return Math.max(...usedIndices) + 1;
}

// Show the incident editor panel with enhanced support for conditions and links
function showIncidentEditor(incident, isNew) {
  console.log(`Opening incident editor for: ${incident.title} (isNew: ${isNew})`);
  
  // Create a deep copy of the incident to edit
  const editingIncident = JSON.parse(JSON.stringify(incident));
  
  // Initialize step types if they don't exist
  editingIncident.steps.forEach(step => {
    if (!step.type) step.type = 'standard';
  });
  
  // Create overlay for modal
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,10,30,0.7);
    backdrop-filter: blur(5px);
    z-index: 9001;
    display: flex;
    justify-content: center;
    align-items: center;
    touch-action: none;
    overflow: hidden;
  `;
  
  // Create editor panel
  const editor = document.createElement('div');
  editor.style.cssText = `
    background: rgba(0,20,50,0.95);
    border-radius: 8px;
    box-shadow: 0 0 30px rgba(0,120,255,0.4);
    width: 650px;
    max-width: 90vw;
    max-height: 85vh;
    padding: 25px;
    display: flex;
    flex-direction: column;
    position: relative;
    border: 1px solid rgba(0,120,255,0.3);
    box-sizing: border-box;
    color: #c4e0ff;
    font-family: 'Exo 2', sans-serif;
    overflow: hidden;
  `;
  
  // Editor header
  const editorHeader = document.createElement('div');
  editorHeader.style.cssText = `
    margin-bottom: 20px;
    border-bottom: 1px solid rgba(0,120,255,0.3);
    padding-bottom: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  
  const editorTitle = document.createElement('h2');
  editorTitle.textContent = isNew ? 'Add New Incident Response Playbook' : 'Edit Incident Response Playbook';
  editorTitle.style.cssText = `
  margin: 0;
  color: #66ccff;
  font-size: 20px;
  text-shadow: 0 0 10px rgba(0,150,255,0.3);
`;
  
  const closeEditorBtn = document.createElement('button');
  closeEditorBtn.innerHTML = '✕';
  closeEditorBtn.style.cssText = `
    background: rgba(0,40,80,0.5);
    color: #66ccff;
    border: 1px solid rgba(0,100,200,0.3);
    border-radius: 50%;
    width: 30px;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(0,100,255,0.2);
    font-size: 16px;
    transition: all 0.3s ease;
  `;
  
  closeEditorBtn.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
  
  editorHeader.appendChild(editorTitle);
  editorHeader.appendChild(closeEditorBtn);
  
  // Content area (scrollable)
  const editorContent = document.createElement('div');
  editorContent.style.cssText = `
    overflow-y: auto;
    overflow-x: hidden;
    flex: 1;
    max-height: calc(85vh - 150px);
    padding-right: 10px;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
    touch-action: pan-y;
    position: relative;
  `;
  
  // Title input
  const titleLabel = document.createElement('label');
  titleLabel.textContent = 'Playbook Title';
  titleLabel.style.cssText = `
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  `;
  
  const titleInput = document.createElement('input');
  titleInput.value = editingIncident.title;
  titleInput.maxLength = 30; // Add character limit 
  titleInput.style.cssText = `
    width: 100%;
    padding: 10px;
    margin-bottom: 15px;
    background: rgba(0,30,70,0.7);
    border: 1px solid rgba(0,100,200,0.4);
    border-radius: 4px;
    color: #ffffff;
    font-family: 'Exo 2', sans-serif;
    font-size: 16px;
    box-sizing: border-box;
    transition: all 0.3s ease;
  `;
  
  // Color picker
  const colorLabel = document.createElement('label');
  colorLabel.textContent = 'Incident Node Color';
  colorLabel.style.cssText = `
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  `;
  
  const colorRow = document.createElement('div');
  colorRow.style.cssText = `
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    gap: 10px;
  `;
  
  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.value = editingIncident.color || '#FFCC00';
  colorInput.style.cssText = `
    width: 50px;
    height: 40px;
    border: none;
    border-radius: 4px;
    background: transparent;
    cursor: pointer;
  `;
  
  const colorPreview = document.createElement('div');
  colorPreview.style.cssText = `
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background-color: ${editingIncident.color || '#FFCC00'};
    box-shadow: 0 0 10px rgba(255,255,255,0.2);
  `;
  
  // Manual hex color input
  const colorHexInput = document.createElement('input');
  colorHexInput.type = 'text';
  colorHexInput.value = editingIncident.color || '#FFCC00';
  colorHexInput.placeholder = '#RRGGBB';
  colorHexInput.maxLength = 7;
  colorHexInput.style.cssText = `
    padding: 8px 10px;
    width: 90px;
    background: rgba(0,30,70,0.7);
    border: 1px solid rgba(0,100,200,0.4);
    border-radius: 4px;
    color: #ffffff;
    font-family: monospace;
    font-size: 14px;
    text-transform: uppercase;
  `;
  
  // Validation helper
  function isValidHexColor(color) {
    return /^#([0-9A-F]{3}){1,2}$/i.test(color);
  }
  
  // Color presets
  const presetColors = [
    { name: 'Yellow', value: '#FFCC00' },
    { name: 'Red', value: '#FF6666' },
    { name: 'Blue', value: '#66CCFF' },
    { name: 'Green', value: '#99CC66' },
    { name: 'Purple', value: '#CC66FF' },
    { name: 'Orange', value: '#FF9933' }
  ];
  
  const colorPresets = document.createElement('div');
  colorPresets.style.cssText = `
    display: flex;
    gap: 8px;
    margin-top: 8px;
    flex-wrap: wrap;
  `;
  
  presetColors.forEach(preset => {
    const presetBtn = document.createElement('button');
    presetBtn.title = preset.name;
    presetBtn.style.cssText = `
      width: 25px;
      height: 25px;
      border-radius: 4px;
      background-color: ${preset.value};
      border: 1px solid rgba(255,255,255,0.3);
      cursor: pointer;
      box-shadow: 0 0 5px rgba(0,0,0,0.3);
      transition: all 0.2s ease;
    `;
    
    presetBtn.addEventListener('click', () => {
      colorInput.value = preset.value;
      colorHexInput.value = preset.value.toUpperCase();
      colorPreview.style.backgroundColor = preset.value;
      editingIncident.color = preset.value;
    });
    
    colorPresets.appendChild(presetBtn);
  });
  
  // Update both inputs when color picker changes
  colorInput.addEventListener('input', (e) => {
    const newColor = e.target.value;
    colorPreview.style.backgroundColor = newColor;
    colorHexInput.value = newColor.toUpperCase();
    editingIncident.color = newColor;
  });
  
  // Update from hex input when it changes
  colorHexInput.addEventListener('input', (e) => {
    let newColor = e.target.value;
    
    // Auto-add # if missing
    if (newColor.charAt(0) !== '#' && newColor.length > 0) {
      newColor = '#' + newColor;
      colorHexInput.value = newColor;
    }
    
    // Only update if valid hex
    if (isValidHexColor(newColor)) {
      colorInput.value = newColor;
      colorPreview.style.backgroundColor = newColor;
      editingIncident.color = newColor;
      
      // Remove error styling
      colorHexInput.style.borderColor = 'rgba(0,100,200,0.4)';
    } else {
      // Add error styling for invalid hex
      colorHexInput.style.borderColor = 'rgba(255,100,100,0.7)';
    }
  });
  
  // Handle blur event to correct invalid values
  colorHexInput.addEventListener('blur', () => {
    if (!isValidHexColor(colorHexInput.value)) {
      // Reset to current valid color
      colorHexInput.value = editingIncident.color || '#FFCC00';
      colorHexInput.style.borderColor = 'rgba(0,100,200,0.4)';
    }
  });
  
  colorRow.appendChild(colorInput);
  colorRow.appendChild(colorPreview);
  colorRow.appendChild(colorHexInput);
  
  // Node index input (which brain node this incident will map to)
  const nodeIndexLabel = document.createElement('label');
  nodeIndexLabel.textContent = 'Node Index (determines which network node will display this incident)';
  nodeIndexLabel.style.cssText = `
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  `;
  
  const nodeIndexInput = document.createElement('input');
  nodeIndexInput.type = 'number';
  nodeIndexInput.min = '0';
  nodeIndexInput.max = '161';
  nodeIndexInput.value = editingIncident.index;
  nodeIndexInput.style.cssText = `
    width: 100%;
    padding: 10px;
    margin-bottom: 20px;
    background: rgba(0,30,70,0.7);
    border: 1px solid rgba(0,100,200,0.4);
    border-radius: 4px;
    color: #ffffff;
    font-family: 'Exo 2', sans-serif;
    font-size: 16px;
    box-sizing: border-box;
    transition: all 0.3s ease;
  `;
  
  // Steps section
  const stepsLabel = document.createElement('div');
  stepsLabel.textContent = 'Playbook Steps';
  stepsLabel.style.cssText = `
    font-weight: bold;
    margin-bottom: 10px;
    padding-bottom: 5px;
    border-bottom: 1px solid rgba(0,100,200,0.3);
  `;
  
  // Add helper text about step types
  const stepTypesHelper = document.createElement('div');
  stepTypesHelper.innerHTML = `
    <p style="margin: 5px 0 15px; font-style: italic; font-size: 13px; color: #8eb8ff;">
      Use different step types to create interactive playbooks:<br>
      • <strong>Standard steps</strong> for normal instructions<br>
      • <strong>Condition steps</strong> for decision points with multiple paths<br>
      • <strong>Add links</strong> to navigate between different playbooks
    </p>
  `;
  
  // Container for steps
  const stepsContainer = document.createElement('div');
  stepsContainer.id = 'stepsList';
  stepsContainer.style.cssText = `
    margin-bottom: 15px;
  `;
  
  // Function to create target step selection controls
  function createTargetStepSelect(container, targetPlaybook, targetStepValue) {
    // Create container for target step selection
    const targetStepContainer = document.createElement('div');
    targetStepContainer.style.cssText = `
      margin-top: 8px;
      padding: 8px 12px;
      background: rgba(0,40,80,0.5);
      border-radius: 4px;
      border-left: 2px solid #66CCFF;
    `;
    
    const targetStepLabel = document.createElement('label');
    targetStepLabel.textContent = 'Target Specific Step';
    targetStepLabel.style.cssText = `
      display: block;
      margin-bottom: 5px;
      font-size: 13px;
      color: #66CCFF;
      font-weight: bold;
    `;
    
    const targetStepSelect = document.createElement('select');
    targetStepSelect.style.cssText = `
      width: 100%;
      padding: 6px 8px;
      background: rgba(0,30,60,0.7);
      border: 1px solid rgba(0,100,200,0.4);
      border-radius: 3px;
      color: #ffffff;
      font-family: 'Exo 2', sans-serif;
      font-size: 13px;
    `;
    
    // Default option - first step (step 0)
    const defaultOption = document.createElement('option');
    defaultOption.value = "0";
    defaultOption.textContent = "First step (Default)";
    targetStepSelect.appendChild(defaultOption);
    
    // If we have a valid playbook, add its steps as options
    if (targetPlaybook && targetPlaybook.steps && targetPlaybook.steps.length > 0) {
      targetPlaybook.steps.forEach((step, idx) => {
        if (idx === 0) return; // Skip first step as it's already the default
        
        const option = document.createElement('option');
        option.value = idx.toString();
        option.textContent = `Step ${idx + 1}: ${step.title}`;
        targetStepSelect.appendChild(option);
      });
    }
    
    // Set current selection
    if (targetStepValue !== undefined && targetStepValue !== null) {
      targetStepSelect.value = targetStepValue.toString();
    }
    
    targetStepContainer.appendChild(targetStepLabel);
    targetStepContainer.appendChild(targetStepSelect);
    
    container.appendChild(targetStepContainer);
    
    return targetStepSelect;
  }
  
  // Function to create condition UI with enhanced target step selection
  function createConditionUI(container, conditions = [], stepIndex) {
    const conditionsContainer = document.createElement('div');
    conditionsContainer.className = 'conditions-editor';
    conditionsContainer.style.cssText = `
      background: rgba(0,30,60,0.5);
      border-radius: 4px;
      padding: 10px;
      margin-top: 10px;
      border-left: 3px solid #ffcc00;
    `;
    
    const conditionsHeader = document.createElement('div');
    conditionsHeader.textContent = 'Conditions (Decision Points)';
    conditionsHeader.style.cssText = `
      font-weight: bold;
      margin-bottom: 10px;
      color: #ffcc00;
    `;
    conditionsContainer.appendChild(conditionsHeader);
    
    const conditionsHelp = document.createElement('div');
    conditionsHelp.textContent = 'Add options for the user to choose from. Each condition can lead to the next step, another step, or a different playbook.';
    conditionsHelp.style.cssText = `
      margin-bottom: 15px;
      font-style: italic;
      font-size: 12px;
      color: #8eb8ff;
    `;
    conditionsContainer.appendChild(conditionsHelp);
    
    // Create list for conditions
    const conditionsList = document.createElement('div');
    conditionsList.className = 'conditions-list';
    conditionsList.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 10px;
    `;
    
    // Function to render conditions
    function renderConditions() {
      conditionsList.innerHTML = '';
      
      if (!editingIncident.steps[stepIndex].conditions) {
        editingIncident.steps[stepIndex].conditions = [];
      }
      
      const stepConditions = editingIncident.steps[stepIndex].conditions;
      
      stepConditions.forEach((condition, condIndex) => {
        const condItem = document.createElement('div');
        condItem.className = 'condition-item';
        condItem.style.cssText = `
          background: rgba(0,40,80,0.6);
          border-radius: 4px;
          padding: 10px;
          position: relative;
        `;
        
        const condHeader = document.createElement('div');
        condHeader.style.cssText = `
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        `;
        
        const condTitle = document.createElement('div');
        condTitle.textContent = `Condition ${condIndex + 1}`;
        condTitle.style.cssText = `
          font-weight: bold;
          color: #ffffff;
        `;
        
        const deleteCondBtn = document.createElement('button');
        deleteCondBtn.innerHTML = '🗑️';
        deleteCondBtn.title = 'Delete Condition';
        deleteCondBtn.style.cssText = `
          background: rgba(150,20,20,0.6);
          border: 1px solid rgba(200,50,50,0.4);
          border-radius: 4px;
          width: 24px;
          height: 24px;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
        `;
        
        deleteCondBtn.addEventListener('click', () => {
          // Remove condition and re-render
          stepConditions.splice(condIndex, 1);
          renderConditions();
        });
        
        condHeader.appendChild(condTitle);
        condHeader.appendChild(deleteCondBtn);
        
        const condContent = document.createElement('div');
        
        // Title input
        const condTitleLabel = document.createElement('label');
        condTitleLabel.textContent = 'Option Text';
        condTitleLabel.style.cssText = `
          display: block;
          margin-bottom: 3px;
          font-size: 13px;
        `;
        
        const condTitleInput = document.createElement('input');
        condTitleInput.value = condition.title || '';
        condTitleInput.placeholder = 'Option text (e.g., "Low severity", "Contains malware")';
        condTitleInput.style.cssText = `
          width: 100%;
          padding: 6px 8px;
          margin-bottom: 8px;
          background: rgba(0,30,60,0.7);
          border: 1px solid rgba(0,100,200,0.4);
          border-radius: 3px;
          color: #ffffff;
          font-family: 'Exo 2', sans-serif;
          font-size: 13px;
          box-sizing: border-box;
        `;
        
        condTitleInput.addEventListener('input', (e) => {
          condition.title = e.target.value;
        });
        
        // Description input
        const condDescLabel = document.createElement('label');
        condDescLabel.textContent = 'Description';
        condDescLabel.style.cssText = `
          display: block;
          margin-bottom: 3px;
          font-size: 13px;
        `;
        
        const condDescInput = document.createElement('input');
        condDescInput.value = condition.description || '';
        condDescInput.placeholder = 'Brief explanation of this option';
        condDescInput.style.cssText = `
          width: 100%;
          padding: 6px 8px;
          margin-bottom: 8px;
          background: rgba(0,30,60,0.7);
          border: 1px solid rgba(0,100,200,0.4);
          border-radius: 3px;
          color: #ffffff;
          font-family: 'Exo 2', sans-serif;
          font-size: 13px;
          box-sizing: border-box;
        `;
        
        condDescInput.addEventListener('input', (e) => {
          condition.description = e.target.value;
        });
        
        // Target type selector
        const targetTypeLabel = document.createElement('label');
        targetTypeLabel.textContent = 'When Selected, Go To:';
        targetTypeLabel.style.cssText = `
          display: block;
          margin-bottom: 3px;
          font-size: 13px;
        `;
        
        const targetTypeRow = document.createElement('div');
        targetTypeRow.style.cssText = `
          display: flex;
          gap: 10px;
          margin-bottom: 8px;
        `;
        
        const targetTypeSelect = document.createElement('select');
        targetTypeSelect.style.cssText = `
          flex: 1;
          padding: 6px 8px;
          background: rgba(0,30,60,0.7);
          border: 1px solid rgba(0,100,200,0.4);
          border-radius: 3px;
          color: #ffffff;
          font-family: 'Exo 2', sans-serif;
          font-size: 13px;
        `;
        
        // Add options for the select
        const targetOptions = [
          { value: 'step', text: 'Jump to Step #' },
          { value: 'playbook', text: 'Go to Another Playbook' }
        ];
        
        targetOptions.forEach(option => {
          const optEl = document.createElement('option');
          optEl.value = option.value;
          optEl.textContent = option.text;
          targetTypeSelect.appendChild(optEl);
        });
        
        // Additional inputs based on target type
        const targetValueContainer = document.createElement('div');
        targetValueContainer.style.cssText = `
          flex: 1;
          display: none;
        `;
        
        const stepNumberInput = document.createElement('input');
        stepNumberInput.type = 'number';
        stepNumberInput.min = '1';
        stepNumberInput.placeholder = 'Step #';
        stepNumberInput.style.cssText = `
          width: 100%;
          padding: 6px 8px;
          background: rgba(0,30,60,0.7);
          border: 1px solid rgba(0,100,200,0.4);
          border-radius: 3px;
          color: #ffffff;
          font-family: 'Exo 2', sans-serif;
          font-size: 13px;
          box-sizing: border-box;
        `;
        
        const playbookSelect = document.createElement('select');
        playbookSelect.style.cssText = `
          width: 100%;
          padding: 6px 8px;
          background: rgba(0,30,60,0.7);
          border: 1px solid rgba(0,100,200,0.4);
          border-radius: 3px;
          color: #ffffff;
          font-family: 'Exo 2', sans-serif;
          font-size: 13px;
        `;
        
        // Add playbook options
        const playbooks = window.securityIncidents || [];
        playbooks.forEach(playbook => {
          const optEl = document.createElement('option');
          optEl.value = playbook.title;
          optEl.dataset.index = playbook.index;
          optEl.textContent = `${playbook.title} (Node ${playbook.index})`;
          playbookSelect.appendChild(optEl);
        });
        
        // Variable to hold target step selection element
        let targetStepSelect = null;
        
        // Set current selection based on condition target
        let currentTargetType = 'step';
        let selectedPlaybook = null;
        stepNumberInput.value = '1'; // Default to next step

        if (condition.target && condition.target.startsWith('step:')) {
          currentTargetType = 'step';
          const stepNum = condition.target.split(':')[1];
          stepNumberInput.value = stepNum;
        } else if (condition.target && condition.target !== 'next') {
          currentTargetType = 'playbook';
          
          // Find the target playbook for step selection
          selectedPlaybook = playbooks.find(p => p.title === condition.target);
          
          // Select the playbook in the dropdown
          const playbookOptions = Array.from(playbookSelect.options);
          const targetOption = playbookOptions.find(opt => opt.value === condition.target);
          if (targetOption) {
            playbookSelect.value = targetOption.value;
          }
        } else if (condition.target === 'next') {
          // Handle legacy 'next' target by converting it to the next step
          currentTargetType = 'step';
          stepNumberInput.value = (index + 2).toString(); // Current step + 1 (as indexing starts at 0)
        }
        
        // Make sure the dropdown has a value that exists
        if (currentTargetType === 'next') {
          // Handle legacy 'next' value by changing UI to use 'step' 
          // but keep original target intact until user makes changes
          targetTypeSelect.value = 'step';
          // Calculate next step number (current step index + 1)
          stepNumberInput.value = (index + 2).toString();
        } else {
          targetTypeSelect.value = currentTargetType;
        }
        
        // Function to create or update target step selection UI
        function createOrUpdateTargetStepUI() {
          // Remove any existing target step UI first
          const existingStepUI = targetValueContainer.querySelector('.target-step-container');
          if (existingStepUI) {
            targetValueContainer.removeChild(existingStepUI);
          }
          
          // Only show for playbook targets
          if (targetTypeSelect.value === 'playbook' && selectedPlaybook) {
            const stepContainer = document.createElement('div');
            stepContainer.className = 'target-step-container';
            
            targetStepSelect = createTargetStepSelect(
              stepContainer, 
              selectedPlaybook, 
              condition.targetStep || 0
            );
            
            // Add event listener to update the condition
            targetStepSelect.addEventListener('change', () => {
              condition.targetStep = parseInt(targetStepSelect.value, 10);
            });
            
            targetValueContainer.appendChild(stepContainer);
          }
        }
        
        // Show appropriate input based on target type
        // Update target inputs based on target type
        function updateTargetInputs() {
          targetValueContainer.innerHTML = '';
          
          if (targetTypeSelect.value === 'step') {
            targetValueContainer.appendChild(stepNumberInput);
            targetValueContainer.style.display = 'block';
            // Reset target step since we're not targeting a playbook
            delete condition.targetStep;
          } else if (targetTypeSelect.value === 'playbook') {
            targetValueContainer.appendChild(playbookSelect);
            targetValueContainer.style.display = 'block';
            
            // Find current target playbook for step selection
            const selectedOption = playbookSelect.options[playbookSelect.selectedIndex];
            if (selectedOption) {
              selectedPlaybook = playbooks.find(p => p.title === selectedOption.value);
            }
            
            // Add target step selection
            createOrUpdateTargetStepUI();
          } else {
            // This shouldn't happen with our new UI, but handle it just in case
            // Simply default to 'step' for backward compatibility
            targetTypeSelect.value = 'step';
            targetValueContainer.appendChild(stepNumberInput);
            targetValueContainer.style.display = 'block';
            // Ensure step number is set
            if (!stepNumberInput.value) {
              stepNumberInput.value = '1';
            }
            // Reset target step since we're not targeting a playbook
            delete condition.targetStep;
          }
        } 
        
        updateTargetInputs();
        
        // Update target when selection changes
        targetTypeSelect.addEventListener('change', () => {
          updateTargetInputs();
          
          // Update condition target
          if (targetTypeSelect.value === 'step') {
            const stepNum = stepNumberInput.value || '1';
            condition.target = `step:${stepNum}`;
            delete condition.targetIndex;
            delete condition.targetStep;
          } else if (targetTypeSelect.value === 'playbook') {
            const selectedOption = playbookSelect.options[playbookSelect.selectedIndex];
            condition.target = selectedOption.value;
            condition.targetIndex = parseInt(selectedOption.dataset.index);
            
            // Default to first step (0) if not already set
            if (condition.targetStep === undefined) {
              condition.targetStep = 0;
            }
          }
        });
        
        // Update when step number changes
        stepNumberInput.addEventListener('input', () => {
          // Ensure we have a valid step number
          const stepNum = stepNumberInput.value || '1';
          condition.target = `step:${stepNum}`;
        });
        
        // Update when playbook selection changes
        playbookSelect.addEventListener('change', () => {
          const selectedOption = playbookSelect.options[playbookSelect.selectedIndex];
          if (selectedOption) {
            // Update link target
            link.target = selectedOption.value;
            link.targetIndex = parseInt(selectedOption.dataset.index);
            
            // Always update link text to match the playbook title
            linkTextInput.value = selectedOption.value;
            link.title = selectedOption.value;
            
            // Find the playbook for target step selection
            selectedPlaybook = playbooks.find(p => p.title === selectedOption.value);
            
            // Reset to first step when playbook changes
            link.targetStep = 0;
            
            // Update target step UI
            createOrUpdateTargetStepUI();
          }
        });
        
        targetTypeRow.appendChild(targetTypeSelect);
        targetTypeRow.appendChild(targetValueContainer);
        
        condContent.appendChild(condTitleLabel);
        condContent.appendChild(condTitleInput);
        condContent.appendChild(condDescLabel);
        condContent.appendChild(condDescInput);
        condContent.appendChild(targetTypeLabel);
        condContent.appendChild(targetTypeRow);
        
        condItem.appendChild(condHeader);
        condItem.appendChild(condContent);
        
        conditionsList.appendChild(condItem);
      });
    }
    
    // Add new condition button
    const addConditionBtn = document.createElement('button');
    addConditionBtn.textContent = '+ Add Condition';
    addConditionBtn.style.cssText = `
      padding: 6px 10px;
      background: rgba(0,80,160,0.5);
      color: #ffffff;
      border: 1px solid rgba(0,120,255,0.4);
      border-radius: 4px;
      cursor: pointer;
      font-family: 'Exo 2', sans-serif;
      font-size: 13px;
      align-self: flex-start;
      margin-top: 5px;
      transition: all 0.3s ease;
    `;
    
    addConditionBtn.addEventListener('click', () => {
      // Add new condition to the step
      if (!editingIncident.steps[stepIndex].conditions) {
        editingIncident.steps[stepIndex].conditions = [];
      }
      
      // Default to the next step (current step index + 1)
      const nextStepNum = stepIndex + 2; // +1 for 0-based index, +1 for next step
      
      editingIncident.steps[stepIndex].conditions.push({
        title: 'New Condition',
        description: 'Description for new condition',
        target: `step:${nextStepNum}`
      });
      
      renderConditions();
    });
    
    conditionsContainer.appendChild(conditionsList);
    conditionsContainer.appendChild(addConditionBtn);
    container.appendChild(conditionsContainer);
    
    renderConditions();
  }
  
  // Function to create links UI with enhanced target step selection
  function createLinksUI(container, links = [], stepIndex) {
    const linksContainer = document.createElement('div');
    linksContainer.className = 'links-editor';
    linksContainer.style.cssText = `
      background: rgba(0,30,60,0.5);
      border-radius: 4px;
      padding: 10px;
      margin-top: 10px;
      border-left: 3px solid #66ccff;
    `;
    
    const linksHeader = document.createElement('div');
    linksHeader.textContent = 'Playbook Links';
    linksHeader.style.cssText = `
      font-weight: bold;
      margin-bottom: 10px;
      color: #66ccff;
    `;
    linksContainer.appendChild(linksHeader);
    
    const linksHelp = document.createElement('div');
    linksHelp.textContent = 'Add optional links to other playbooks that the user can follow.';
    linksHelp.style.cssText = `
      margin-bottom: 15px;
      font-style: italic;
      font-size: 12px;
      color: #8eb8ff;
    `;
    linksContainer.appendChild(linksHelp);
    
    // Create list for links
    const linksList = document.createElement('div');
    linksList.className = 'links-list';
    linksList.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 10px;
    `;
    
    // Function to render links
    function renderLinks() {
      linksList.innerHTML = '';
      
      if (!editingIncident.steps[stepIndex].links) {
        editingIncident.steps[stepIndex].links = [];
      }
      
      const stepLinks = editingIncident.steps[stepIndex].links;
      
      stepLinks.forEach((link, linkIndex) => {
        const linkItem = document.createElement('div');
        linkItem.className = 'link-item';
        linkItem.style.cssText = `
          background: rgba(0,40,80,0.6);
          border-radius: 4px;
          padding: 10px;
          position: relative;
        `;
        
        const linkHeader = document.createElement('div');
        linkHeader.style.cssText = `
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        `;
        
        const linkTitle = document.createElement('div');
        linkTitle.textContent = `Link ${linkIndex + 1}`;
        linkTitle.style.cssText = `
          font-weight: bold;
          color: #ffffff;
        `;
        
        const deleteLinkBtn = document.createElement('button');
        deleteLinkBtn.innerHTML = '🗑️';
        deleteLinkBtn.title = 'Delete Link';
        deleteLinkBtn.style.cssText = `
          background: rgba(150,20,20,0.6);
          border: 1px solid rgba(200,50,50,0.4);
          border-radius: 4px;
          width: 24px;
          height: 24px;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
        `;
        
        deleteLinkBtn.addEventListener('click', () => {
          // Remove link and re-render
          stepLinks.splice(linkIndex, 1);
          renderLinks();
        });
        
        linkHeader.appendChild(linkTitle);
        linkHeader.appendChild(deleteLinkBtn);
        
        const linkContent = document.createElement('div');
        
        // Link text input
        // Link text input - moved after playbook selection
        const linkTextLabel = document.createElement('label');
        linkTextLabel.textContent = 'Link Text (leave empty to use playbook title)';
        linkTextLabel.style.cssText = `
          display: block;
          margin-bottom: 3px;
          font-size: 13px;
        `;

        const linkTextInput = document.createElement('input');
        linkTextInput.value = link.title || '';
        linkTextInput.placeholder = 'Custom text for link (optional)';
        linkTextInput.style.cssText = `
          width: 100%;
          padding: 6px 8px;
          margin-bottom: 8px;
          background: rgba(0,30,60,0.7);
          border: 1px solid rgba(0,100,200,0.4);
          border-radius: 3px;
          color: #ffffff;
          font-family: 'Exo 2', sans-serif;
          font-size: 13px;
          box-sizing: border-box;
        `;
        
        linkTextInput.addEventListener('input', (e) => {
          link.title = e.target.value;
        });
        
        // Description input
        const linkDescLabel = document.createElement('label');
        linkDescLabel.textContent = 'Description (shown as tooltip)';
        linkDescLabel.style.cssText = `
          display: block;
          margin-bottom: 3px;
          font-size: 13px;
        `;
        
        const linkDescInput = document.createElement('input');
        linkDescInput.value = link.description || '';
        linkDescInput.placeholder = 'Brief explanation of this link';
        linkDescInput.style.cssText = `
          width: 100%;
          padding: 6px 8px;
          margin-bottom: 8px;
          background: rgba(0,30,60,0.7);
          border: 1px solid rgba(0,100,200,0.4);
          border-radius: 3px;
          color: #ffffff;
          font-family: 'Exo 2', sans-serif;
          font-size: 13px;
          box-sizing: border-box;
        `;
        
        linkDescInput.addEventListener('input', (e) => {
          link.description = e.target.value;
        });
        
        // Target playbook selector
        const playbookLabel = document.createElement('label');
        playbookLabel.textContent = 'Target Playbook';
        playbookLabel.style.cssText = `
          display: block;
          margin-bottom: 3px;
          font-size: 13px;
        `;
        
        const playbookSelect = document.createElement('select');
        playbookSelect.style.cssText = `
          width: 100%;
          padding: 6px 8px;
          margin-bottom: 8px;
          background: rgba(0,30,60,0.7);
          border: 1px solid rgba(0,100,200,0.4);
          border-radius: 3px;
          color: #ffffff;
          font-family: 'Exo 2', sans-serif;
          font-size: 13px;
        `;
        
        // Variable to hold reference to selected playbook and target step UI
        let selectedPlaybook = null;
        let targetStepSelect = null;
        
        // Add playbook options
        const playbooks = window.SecurityIncidents ? window.SecurityIncidents.getIncidents() : [];
        playbooks.forEach(playbook => {
          // Skip current incident to prevent circular reference
          if (playbook.title !== editingIncident.title) {
            const optEl = document.createElement('option');
            optEl.value = playbook.title;
            optEl.dataset.index = playbook.index;
            optEl.textContent = `${playbook.title} (Node ${playbook.index})`;
            playbookSelect.appendChild(optEl);
          }
        });
        
        // Find the target playbook for step selection
        if (link.target) {
          selectedPlaybook = playbooks.find(p => p.title === link.target);
          
          // Set current selection
          const playbookOptions = Array.from(playbookSelect.options);
          const targetOption = playbookOptions.find(opt => opt.value === link.target);
          if (targetOption) {
            playbookSelect.value = targetOption.value;
          }
        } else if (playbookSelect.options.length > 0) {
          // Default to first playbook if none selected
          const defaultPlaybook = playbookSelect.options[0].value;
          link.target = defaultPlaybook;
          link.targetIndex = parseInt(playbookSelect.options[0].dataset.index);
          selectedPlaybook = playbooks.find(p => p.title === defaultPlaybook);
        }
        
        // Function to create or update target step selection UI
        const targetStepContainer = document.createElement('div');
        targetStepContainer.className = 'target-step-container';
        targetStepContainer.style.marginTop = '8px';

        // Function to create or update target step selection UI
        function createOrUpdateTargetStepUI() {
          // Clear the container
          targetStepContainer.innerHTML = '';
          
          // Only create if we have a valid playbook
          if (selectedPlaybook) {
            targetStepSelect = createTargetStepSelect(
              targetStepContainer, 
              selectedPlaybook, 
              link.targetStep || 0
            );
            
            // Add event listener to update the link
            targetStepSelect.addEventListener('change', () => {
              link.targetStep = parseInt(targetStepSelect.value, 10);
            });
          }
        }
        
        // Create target step selection UI right after the playbook dropdown
        createOrUpdateTargetStepUI(linkContent);
        
        // Update when selection changes
        playbookSelect.addEventListener('change', () => {
          const selectedOption = playbookSelect.options[playbookSelect.selectedIndex];
          if (selectedOption) {
            link.target = selectedOption.value;
            link.targetIndex = parseInt(selectedOption.dataset.index);
            
            // Find the target playbook for step selection
            selectedPlaybook = playbooks.find(p => p.title === selectedOption.value);
            
            // Reset to first step when playbook changes
            link.targetStep = 0;
            
            // Update target step UI
            createOrUpdateTargetStepUI(linkContent);
          }
        });
        
        linkContent.appendChild(playbookLabel);
        linkContent.appendChild(playbookSelect);
        linkContent.appendChild(targetStepContainer); // Add target step container right after playbook select
        linkContent.appendChild(linkTextLabel);
        linkContent.appendChild(linkTextInput);
        linkContent.appendChild(linkDescLabel);
        linkContent.appendChild(linkDescInput);
        
        linkItem.appendChild(linkHeader);
        linkItem.appendChild(linkContent);
        
        linksList.appendChild(linkItem);
      });
    }
    
    // Add new link button
    const addLinkBtn = document.createElement('button');
    addLinkBtn.textContent = '+ Add Link';
    addLinkBtn.style.cssText = `
      padding: 6px 10px;
      background: rgba(0,80,160,0.5);
      color: #ffffff;
      border: 1px solid rgba(0,120,255,0.4);
      border-radius: 4px;
      cursor: pointer;
      font-family: 'Exo 2', sans-serif;
      font-size: 13px;
      align-self: flex-start;
      margin-top: 5px;
      transition: all 0.3s ease;
    `;
    
    addLinkBtn.addEventListener('click', () => {
      // Add new link to the step
      if (!editingIncident.steps[stepIndex].links) {
        editingIncident.steps[stepIndex].links = [];
      }
      
      // Get available playbooks
      const availablePlaybooks = window.SecurityIncidents ? 
                               window.SecurityIncidents.getIncidents().filter(p => p.title !== editingIncident.title) : 
                               [];
      
      // Select first available playbook that's not this one
      let targetPlaybook = null;
      let targetIndex = null;
      
      if (availablePlaybooks.length > 0) {
        targetPlaybook = availablePlaybooks[0].title;
        targetIndex = availablePlaybooks[0].index;
      }
      
      if (!targetPlaybook) {
        showNotification('No other playbooks available to link to. Create another incident first.', 'error');
        return;
      }
      
      editingIncident.steps[stepIndex].links.push({
        title: '', // Use playbook title as default link text
        description: '', // Start with empty description
        target: targetPlaybook,
        targetIndex: targetIndex,
        targetStep: 0 // Default to first step
      });
      
      renderLinks();
    });
    
    linksContainer.appendChild(linksList);
    linksContainer.appendChild(addLinkBtn);
    container.appendChild(linksContainer);
    
    renderLinks();
  }
  
  // Function to render steps
  function renderSteps() {
    // Create a document fragment for better performance
    const stepsFragment = document.createDocumentFragment();
    
    editingIncident.steps.forEach((step, index) => {
      const stepItem = document.createElement('div');
      stepItem.className = 'step-item';
      stepItem.style.cssText = `
        background: rgba(0,40,80,0.5);
        border-radius: 4px;
        padding: 15px;
        margin-bottom: 15px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        position: relative;
      `;
      
      // Step number
      const stepNumber = document.createElement('div');
      stepNumber.textContent = (index + 1).toString();
      stepNumber.style.cssText = `
        position: absolute;
        top: 10px;
        left: 10px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: rgba(0,100,200,0.6);
        color: #ffffff;
        display: flex;
        justify-content: center;
        align-items: center;
        font-weight: bold;
        font-size: 12px;
        box-shadow: 0 0 5px rgba(0,150,255,0.5);
      `;
      
      // Step title input
      const stepTitleLabel = document.createElement('label');
      stepTitleLabel.textContent = 'Step Title';
      stepTitleLabel.style.cssText = `
        display: block;
        margin-bottom: 5px;
        margin-left: 30px;
        font-weight: bold;
      `;
      
      const stepTitleInput = document.createElement('input');
      stepTitleInput.value = step.title;
      stepTitleInput.style.cssText = `
        width: 100%;
        padding: 8px;
        margin-bottom: 10px;
        background: rgba(0,30,60,0.7);
        border: 1px solid rgba(0,100,200,0.4);
        border-radius: 4px;
        color: #ffffff;
        font-family: 'Exo 2', sans-serif;
        font-size: 14px;
        box-sizing: border-box;
        transition: all 0.3s ease;
      `;
      
      // Update the step title when input changes
      stepTitleInput.addEventListener('input', (e) => {
        editingIncident.steps[index].title = e.target.value;
      });
      
      // Step type selector
      const stepTypeLabel = document.createElement('label');
      stepTypeLabel.textContent = 'Step Type';
      stepTypeLabel.style.cssText = `
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
      `;
      
      const stepTypeSelect = document.createElement('select');
      stepTypeSelect.style.cssText = `
        width: 100%;
        padding: 8px;
        margin-bottom: 15px;
        background: rgba(0,30,60,0.7);
        border: 1px solid rgba(0,100,200,0.4);
        border-radius: 4px;
        color: #ffffff;
        font-family: 'Exo 2', sans-serif;
        font-size: 14px;
      `;
      
      // Step type options
      const stepTypes = [
        { value: 'standard', text: 'Standard Step' },
        { value: 'condition', text: 'Condition Step (Decision Point)' }
      ];
      
      stepTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.value;
        option.textContent = type.text;
        stepTypeSelect.appendChild(option);
      });
      
      // Set current type
      stepTypeSelect.value = step.type || 'standard';
      
      // Step description
      const stepDescLabel = document.createElement('label');
      stepDescLabel.textContent = 'Step Description';
      stepDescLabel.style.cssText = `
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
      `;
      
      const stepDescInput = document.createElement('textarea');
      stepDescInput.value = step.description || '';
      stepDescInput.style.cssText = `
        width: 100%;
        padding: 8px;
        height: 80px;
        margin-bottom: 10px;
        background: rgba(0,30,60,0.7);
        border: 1px solid rgba(0,100,200,0.4);
        border-radius: 4px;
        color: #ffffff;
        font-family: 'Exo 2', sans-serif;
        font-size: 14px;
        resize: vertical;
        box-sizing: border-box;
        transition: all 0.3s ease;
      `;
      
      // Update the step description when input changes
      stepDescInput.addEventListener('input', (e) => {
        editingIncident.steps[index].description = e.target.value;
      });
      
      // Container for dynamic content (conditions, links)
      const dynamicContent = document.createElement('div');
      dynamicContent.className = 'step-dynamic-content';
      
      // Update dynamic content when step type changes
      function updateDynamicContent() {
        dynamicContent.innerHTML = '';
        
        // Set step type
        editingIncident.steps[index].type = stepTypeSelect.value;
        
        // Add appropriate content based on step type
        if (stepTypeSelect.value === 'condition') {
          createConditionUI(dynamicContent, step.conditions || [], index);
        }
        
        // Always show links option regardless of step type
        createLinksUI(dynamicContent, step.links || [], index);
      }
      
      // Initial dynamic content
      updateDynamicContent();
      
      // Listen for type changes
      stepTypeSelect.addEventListener('change', updateDynamicContent);
      
      // Delete step button
      const deleteStepBtn = document.createElement('button');
      deleteStepBtn.textContent = 'Delete Step';
      deleteStepBtn.style.cssText = `
        background: rgba(150,20,20,0.6);
        color: #ffffff;
        border: 1px solid rgba(200,50,50,0.4);
        border-radius: 4px;
        padding: 5px 10px;
        cursor: pointer;
        margin-top: 15px;
        font-family: 'Exo 2', sans-serif;
        font-size: 12px;
        transition: all 0.3s ease;
      `;
      
      // Only allow deleting if there's more than one step
      deleteStepBtn.disabled = editingIncident.steps.length <= 1;
      if (deleteStepBtn.disabled) {
        deleteStepBtn.style.opacity = '0.5';
        deleteStepBtn.style.cursor = 'not-allowed';
      }
      
      deleteStepBtn.addEventListener('click', () => {
        if (editingIncident.steps.length > 1) {
          editingIncident.steps.splice(index, 1);
          renderSteps();
        }
      });
      
      // Assemble step item
      stepItem.appendChild(stepNumber);
      stepItem.appendChild(stepTitleLabel);
      stepItem.appendChild(stepTitleInput);
      stepItem.appendChild(stepTypeLabel);
      stepItem.appendChild(stepTypeSelect);
      stepItem.appendChild(stepDescLabel);
      stepItem.appendChild(stepDescInput);
      stepItem.appendChild(dynamicContent);
      stepItem.appendChild(deleteStepBtn);
      
      stepsFragment.appendChild(stepItem);
    });
    
    // Clear existing steps and add all at once
    while (stepsContainer.firstChild) {
      stepsContainer.removeChild(stepsContainer.firstChild);
    }
    stepsContainer.appendChild(stepsFragment);
  }
  
  // Add step button
  const addStepBtn = document.createElement('button');
  addStepBtn.textContent = '+ Add Step';
  addStepBtn.style.cssText = `
    width: 100%;
    padding: 8px;
    background: rgba(0,80,160,0.5);
    color: #ffffff;
    border: 1px solid rgba(0,120,255,0.4);
    border-radius: 4px;
    cursor: pointer;
    font-family: 'Exo 2', sans-serif;
    font-size: 14px;
    margin-bottom: 20px;
    transition: all 0.3s ease;
  `;
  
  addStepBtn.addEventListener('click', () => {
    editingIncident.steps.push({
      title: 'New Step',
      description: 'Description for new step',
      type: 'standard'
    });
    
    renderSteps();
  });
  
  // Save button
  const saveBtn = document.createElement('button');
  saveBtn.textContent = '💾 Save Incident';
  saveBtn.style.cssText = `
    width: 100%;
    padding: 12px;
    background: rgba(0,120,40,0.6);
    color: #ffffff;
    border: 1px solid rgba(0,180,80,0.4);
    border-radius: 4px;
    cursor: pointer;
    font-family: 'Exo 2', sans-serif;
    font-size: 16px;
    font-weight: bold;
    box-shadow: 0 0 15px rgba(0,150,80,0.2);
    transition: all 0.3s ease;
  `;
  
  saveBtn.addEventListener('click', () => {
    // Update incident data
    editingIncident.title = titleInput.value;
    editingIncident.index = parseInt(nodeIndexInput.value, 10);
    editingIncident.color = colorInput.value;
    
    // Fill in empty link titles with target playbook title
editingIncident.steps.forEach(step => {
  if (step.links && step.links.length > 0) {
    step.links.forEach(link => {
      // If title is empty, use the target playbook's title
      if (!link.title && link.target) {
        link.title = link.target;
      }
    });
  }
});
    // Add or update in the incidents array
    if (isNew) {
      // First check if we've reached maximum capacity
      if (incidentsData.length >= MAX_BRAIN_NODES) {
        showNotification(`Cannot add more incidents. Maximum limit of ${MAX_BRAIN_NODES} nodes reached.`, 'error');
        return;
      }
      
      incidentsData.push(editingIncident);
    } else {
      // Replace the existing incident with the same title
      const index = incidentsData.findIndex(i => i.title === incident.title);
      if (index !== -1) {
        incidentsData[index] = editingIncident;
      } else {
        incidentsData.push(editingIncident);
      }
    }
    
    // Refresh the list
    renderIncidentList();
    
    // Update capacity indicator
    updateCapacityIndicator();
    
    // Close the editor
    document.body.removeChild(overlay);
    
    // Show notification
    showNotification('Incident saved!', 'success');
  });
  
  // Assemble the editor components
  editorContent.appendChild(titleLabel);
  editorContent.appendChild(titleInput);
  
  editorContent.appendChild(colorLabel);
  editorContent.appendChild(colorRow);
  editorContent.appendChild(colorPresets);
  
  editorContent.appendChild(nodeIndexLabel);
  editorContent.appendChild(nodeIndexInput);
  editorContent.appendChild(stepsLabel);
  editorContent.appendChild(stepTypesHelper);
  editorContent.appendChild(stepsContainer);
  editorContent.appendChild(addStepBtn);
  
  editor.appendChild(editorHeader);
  editor.appendChild(editorContent);
  editor.appendChild(saveBtn);
  
  overlay.appendChild(editor);
  document.body.appendChild(overlay);
  
  // Render the steps
  renderSteps();
  
  // Focus the title input
  setTimeout(() => {
    titleInput.focus();
  }, 100);
}

// Confirm deletion of an incident
function confirmDeletion(index) {
  // Create overlay for confirmation dialog
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,10,30,0.7);
    backdrop-filter: blur(5px);
    z-index: 9001;
    display: flex;
    justify-content: center;
    align-items: center;
  `;
  
  // Create dialog
  const dialog = document.createElement('div');
  dialog.style.cssText = `
    background: rgba(0,20,50,0.95);
    border-radius: 8px;
    box-shadow: 0 0 30px rgba(200,50,50,0.4);
    width: 400px;
    max-width: 90vw;
    padding: 25px;
    text-align: center;
    border: 1px solid rgba(200,50,50,0.3);
  `;
  
  const warningIcon = document.createElement('div');
  warningIcon.textContent = '⚠️';
  warningIcon.style.cssText = `
    font-size: 32px;
    margin-bottom: 15px;
  `;
  
  const title = document.createElement('h3');
  title.textContent = 'Confirm Deletion';
  title.style.cssText = `
    margin: 0 0 15px 0;
    color: #ff6666;
  `;
  
  const message = document.createElement('p');
  message.textContent = `Are you sure you want to delete "${incidentsData[index].title}"? This cannot be undone.`;
  message.style.cssText = `
    margin-bottom: 25px;
    color: #c4e0ff;
  `;
  
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    justify-content: center;
    gap: 15px;
  `;
  
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.style.cssText = `
    padding: 10px 15px;
    background: rgba(50,50,70,0.6);
    color: #ffffff;
    border: 1px solid rgba(100,100,150,0.4);
    border-radius: 4px;
    cursor: pointer;
  `;
  
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.style.cssText = `
    padding: 10px 20px;
    background: rgba(150,20,20,0.6);
    color: #ffffff;
    border: 1px solid rgba(200,50,50,0.4);
    border-radius: 4px;
    cursor: pointer;
  `;
  
  cancelBtn.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
  
  deleteBtn.addEventListener('click', () => {
    // Remove the incident
    incidentsData.splice(index, 1);
    
    // Re-render the list
    renderIncidentList();
    
    // Update capacity indicator
    updateCapacityIndicator();
    
    // Close the dialog
    document.body.removeChild(overlay);
    
    // Show success notification
    showNotification('Incident deleted successfully!', 'success');
  });
  
  buttonContainer.appendChild(cancelBtn);
  buttonContainer.appendChild(deleteBtn);
  
  dialog.appendChild(warningIcon);
  dialog.appendChild(title);
  dialog.appendChild(message);
  dialog.appendChild(buttonContainer);
  
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
}

// Save all changes to the SecurityIncidents module and the server
function saveAllChanges() {
  console.log("Saving all changes...");
  
  // Check if configuration is disabled server-side
  if (window.DEFENDER_CONFIG && window.DEFENDER_CONFIG.disableConfig) {
    showNotification('Configuration is disabled in this environment', 'error');
    return;
  }
  
  // First update the visualization
  if (window.SecurityIncidents && typeof window.SecurityIncidents.saveIncidents === 'function') {
    const result = window.SecurityIncidents.saveIncidents(incidentsData);
    
    if (result && result.success) {
      showNotification('Changes applied to visualization', 'success');
      
      // Then save to the JSON file via the server
      fetch('/save-incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incidentsData)
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showNotification('Changes saved to server!', 'success');
        } else {
          showNotification('Error saving to server: ' + data.message, 'error');
        }
      })
      .catch(error => {
        console.error('Server error:', error);
        showNotification('Error saving to server. Check console for details.', 'error');
      });
    } else {
      showNotification('Error applying changes to visualization', 'error');
    }
  } else {
    console.error('SecurityIncidents module not available or saveIncidents function not found');
    showNotification('Error: SecurityIncidents module not available', 'error');
  }
}

// Export incidents to a JSON file
function exportIncidents() {
  try {
    console.log("Starting export process...");
    
    // First save any pending changes
    saveAllChanges();
    
    // Direct the browser to the download endpoint
    const downloadUrl = '/download-incidents?t=' + new Date().getTime();
    
    // Simply open the download URL directly
    window.location.href = downloadUrl;
    
    showNotification('Download started!', 'success');
  } catch (error) {
    console.error('Export failed:', error);
    showNotification('Export failed: ' + error.message, 'error');
  }
}
