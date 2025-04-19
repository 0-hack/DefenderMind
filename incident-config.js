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
  
  const headerTitle = document.createElement('h2');
  headerTitle.textContent = 'Node Configuration';
  headerTitle.style.cssText = `
    margin: 0;
    font-size: 18px;
    color: #66ccff;
    text-shadow: 0 0 10px rgba(0,150,255,0.3);
  `;
  
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
  
  header.appendChild(headerTitle);
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
    // Create a new empty incident and open the editor
    const newIncident = {
      title: 'New Incident',
      steps: [
        { title: 'First step', description: 'Description for first step' }
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
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        try {
          const imported = JSON.parse(event.target.result);
          if (Array.isArray(imported) && imported.length > 0) {
            // Basic validation that these are incident objects
            const valid = imported.every(item => 
              typeof item === 'object' && 
              item.title && 
              typeof item.index === 'number' &&
              Array.isArray(item.steps)
            );
            
            if (valid) {
              incidentsData = imported;
              renderIncidentList();
              showNotification('Incidents imported successfully!', 'success');
            } else {
              showNotification('Invalid incident data format', 'error');
            }
          } else {
            showNotification('No valid data found in file', 'error');
          }
        } catch (error) {
          showNotification('Error parsing JSON file', 'error');
          console.error(error);
        }
      };
      reader.readAsText(file);
    }
  });
  
  document.body.appendChild(fileInput);
  
  importBtn.addEventListener('click', function() {
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

// Show the incident editor panel (optimized)
function showIncidentEditor(incident, isNew) {
  console.log(`Opening incident editor for: ${incident.title} (isNew: ${isNew})`);
  
  // Create a deep copy of the incident to edit
  const editingIncident = JSON.parse(JSON.stringify(incident));
  
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
  `;
  
  // Create editor panel
  const editor = document.createElement('div');
  editor.style.cssText = `
    background: rgba(0,20,50,0.95);
    border-radius: 8px;
    box-shadow: 0 0 30px rgba(0,120,255,0.4);
    width: 600px;
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
  editorTitle.textContent = isNew ? 'Add New Incident' : 'Edit Incident';
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
    flex: 1;
    max-height: calc(85vh - 150px);
    padding-right: 10px;
  `;
  
  // Title input
  const titleLabel = document.createElement('label');
  titleLabel.textContent = 'Incident Title';
  titleLabel.style.cssText = `
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  `;
  
  const titleInput = document.createElement('input');
  titleInput.value = editingIncident.title;
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
  colorLabel.textContent = 'Incident Color';
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
  nodeIndexInput.max = '200';
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
  stepsLabel.textContent = 'Incident Response Steps';
  stepsLabel.style.cssText = `
    font-weight: bold;
    margin-bottom: 10px;
    padding-bottom: 5px;
    border-bottom: 1px solid rgba(0,100,200,0.3);
  `;
  
  // Container for steps
  const stepsContainer = document.createElement('div');
  stepsContainer.id = 'stepsList';
  stepsContainer.style.cssText = `
    margin-bottom: 15px;
  `;
  
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
        margin-bottom: 10px;
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
      
      // Step description
      const stepDescLabel = document.createElement('label');
      stepDescLabel.textContent = 'Step Description';
      stepDescLabel.style.cssText = `
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
      `;
      
      const stepDescInput = document.createElement('textarea');
      stepDescInput.value = step.description;
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
        margin-top: 5px;
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
      stepItem.appendChild(stepDescLabel);
      stepItem.appendChild(stepDescInput);
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
      description: 'Description for new step'
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
    
    // Add or update in the incidents array
    if (isNew) {
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
  
  if (window.SecurityIncidents && typeof window.SecurityIncidents.saveIncidents === 'function') {
    const result = window.SecurityIncidents.saveIncidents(incidentsData);
    
    if (result && result.success) {
      // First update the visualization
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
          showNotification('File saved successfully!', 'success');
        } else {
          showNotification('Error saving to file: ' + data.message, 'error');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        showNotification('Server error. Make sure the server is running.', 'error');
      });
    } else {
      showNotification('Error applying changes', 'error');
    }
  } else {
    console.error('SecurityIncidents module not available or saveIncidents function not found');
    showNotification('Error saving changes', 'error');
  }
}

// Export incidents to a JSON file
function exportIncidents() {
  const dataStr = JSON.stringify(incidentsData, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'security-incidents.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showNotification('Incidents exported successfully!', 'success');
}

// Create notification toast - optimized version
function showNotification(message, type = 'info') {
  // Check if a notification already exists and remove it
  const existingNotification = document.querySelector('.notification-toast');
  if (existingNotification) {
    document.body.removeChild(existingNotification);
  }
  
  // Create notification
  const notification = document.createElement('div');
  notification.className = 'notification-toast';
  notification.textContent = message;
  
  // Set base styles
  let baseStyles = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    padding: 12px 20px;
    border-radius: 6px;
    font-family: 'Exo 2', sans-serif;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    opacity: 0;
    transition: opacity 0.25s ease, transform 0.25s ease;
  `;
  
  // Type-specific styles
  let typeStyles = '';
  if (type === 'success') {
    typeStyles = `
      background: rgba(0,150,50,0.9);
      color: #ffffff;
      border: 1px solid rgba(0,180,80,0.4);
    `;
  } else if (type === 'error') {
    typeStyles = `
      background: rgba(180,30,30,0.9);
      color: #ffffff;
      border: 1px solid rgba(220,50,50,0.4);
    `;
  } else {
    typeStyles = `
      background: rgba(20,80,150,0.9);
      color: #ffffff;
      border: 1px solid rgba(50,120,220,0.4);
    `;
  }
  
  // Apply all styles at once
  notification.style.cssText = baseStyles + typeStyles;
  document.body.appendChild(notification);
  
  // Show with animation using requestAnimationFrame for better performance
  requestAnimationFrame(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(-50%) translateY(0)';
  });
  
  // Hide and remove after 3 seconds
  const timeout = setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(-50%) translateY(20px)';
    
    // Clean up the element after animation
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 250);
  }, 3000);
  
  // Store the timeout on the element itself for cleanup
  notification.closeTimeout = timeout;
}