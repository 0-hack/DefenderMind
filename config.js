// Configuration Page for Security Incidents
// This file handles the configuration interface for the standalone configuration page

// Global variables
let incidentsData = [];
const MAX_BRAIN_NODES = 162; // Maximum nodes available
let selectedIncident = null;
let isNewIncident = false;

// Wait for DOM content loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("Config page initialized");
  
  // Setup event listeners
  document.getElementById('homeButton').addEventListener('click', function() {
    window.location.href = 'index.html';
  });
  
  document.getElementById('addIncidentBtn').addEventListener('click', function() {
    createNewIncident();
  });
  
  document.getElementById('saveAllBtn').addEventListener('click', function() {
    saveAllChanges();
  });
  
  document.getElementById('exportBtn').addEventListener('click', function() {
    exportIncidents();
  });
  
  document.getElementById('importBtn').addEventListener('click', function() {
    document.getElementById('importFile').click();
  });
  
  document.getElementById('importFile').addEventListener('change', function(e) {
    handleFileUpload(e);
  });
  
  // Initialize by loading incidents
  loadIncidents();
});

// Function to show notification messages
function showNotification(message, type = 'info') {
  const notificationContainer = document.getElementById('notification-container');
  
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

// Load incidents from server
function loadIncidents() {
  console.log("Loading incidents");
  showNotification('Loading incidents...', 'info');
  
  // Check if securityIncidents is available (loaded from security-incidents.js)
  if (window.securityIncidents) {
    incidentsData = [...window.securityIncidents];
    renderIncidentList();
    updateCapacityIndicator();
    showNotification('Incidents loaded successfully', 'success');
  } else {
    // If not available, fetch from server
    fetch('/data/security-incidents.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load incidents');
        }
        return response.json();
      })
      .then(data => {
        incidentsData = data;
        renderIncidentList();
        updateCapacityIndicator();
        showNotification('Incidents loaded successfully', 'success');
      })
      .catch(error => {
        console.error('Error loading incidents:', error);
        showNotification('Error loading incidents: ' + error.message, 'error');
      });
  }
}

// Render the list of incidents
function renderIncidentList() {
  const incidentList = document.getElementById('incidentList');
  incidentList.innerHTML = '';
  
  if (incidentsData.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.textContent = 'No incidents configured. Add one to get started!';
    emptyMessage.style.cssText = `
      text-align: center;
      padding: 20px;
      color: #8eb8ff;
      font-style: italic;
    `;
    incidentList.appendChild(emptyMessage);
    return;
  }
  
  // Sort by index for consistency
  const sortedIncidents = [...incidentsData].sort((a, b) => a.index - b.index);
  
  sortedIncidents.forEach((incident, index) => {
    const item = createIncidentListItem(incident, index);
    incidentList.appendChild(item);
  });
}

// Create a single incident list item
function createIncidentListItem(incident, index) {
  const item = document.createElement('div');
  item.className = 'incident-item';
  
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
    editIncident(incident);
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
    editIncident(incident);
  });
  
  return item;
}

// Handle file upload
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Validate file type
  if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
    showNotification('Please select a JSON file', 'error');
    return;
  }
  
  showNotification('Reading file...', 'info');
  
  const reader = new FileReader();
  
  reader.onload = function(event) {
    try {
      const imported = JSON.parse(event.target.result);
      
      if (Array.isArray(imported) && imported.length > 0) {
        // Validate structure
        const isValid = validateImportedData(imported);
        
        if (isValid) {
          // Confirm overwrite
          if (confirm(`This will replace ${imported.length} incident(s) in your configuration. Continue?`)) {
            // Check max limit
            if (imported.length > MAX_BRAIN_NODES) {
              alert(`Import contains ${imported.length} incidents, but the maximum limit is ${MAX_BRAIN_NODES}. Only the first ${MAX_BRAIN_NODES} will be imported.`);
              incidentsData = imported.slice(0, MAX_BRAIN_NODES);
            } else {
              incidentsData = imported;
            }
            
            renderIncidentList();
            updateCapacityIndicator();
            saveAllChanges();
          } else {
            showNotification('Import cancelled', 'info');
          }
        } else {
          showNotification('Invalid incident data format', 'error');
        }
      } else {
        showNotification('No valid incident data found in file', 'error');
      }
    } catch (error) {
      console.error('Import parsing error:', error);
      showNotification('JSON parsing error: ' + error.message, 'error');
    }
    
    // Reset file input
    document.getElementById('importFile').value = '';
  };
  
  reader.onerror = function(error) {
    console.error('File reading error:', error);
    showNotification('Failed to read file: ' + error.message, 'error');
    document.getElementById('importFile').value = '';
  };
  
  reader.readAsText(file);
}

// Validate imported data
function validateImportedData(data) {
  if (!Array.isArray(data)) return false;
  if (data.length === 0) return false;
  
  // Check each incident for required fields
  for (const incident of data) {
    if (!incident.title || typeof incident.title !== 'string') return false;
    if (typeof incident.index !== 'number') return false;
    if (!Array.isArray(incident.steps) || incident.steps.length === 0) return false;
    
    // Check steps
    for (const step of incident.steps) {
      if (!step.title || typeof step.title !== 'string') return false;
    }
  }
  
  return true;
}

// Update capacity indicator
function updateCapacityIndicator() {
  const capacityIndicator = document.getElementById('node-capacity-indicator');
  const usedNodes = incidentsData.length;
  
  capacityIndicator.textContent = `${usedNodes}/${MAX_BRAIN_NODES} nodes`;
  
  // Change color based on capacity
  if (usedNodes >= MAX_BRAIN_NODES) {
    capacityIndicator.style.color = '#ff9999';
    capacityIndicator.style.borderColor = 'rgba(200,50,50,0.4)';
    capacityIndicator.style.background = 'rgba(80,0,0,0.3)';
  } else if (usedNodes >= MAX_BRAIN_NODES * 0.8) {
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

// Create a new incident
function createNewIncident() {
  // Check if we've reached maximum node capacity
  if (incidentsData.length >= MAX_BRAIN_NODES) {
    showNotification(`Cannot add more incidents. Maximum limit of ${MAX_BRAIN_NODES} nodes reached.`, 'error');
    return;
  }
  
  // Create a new incident with default values
  const newIncident = {
    title: 'New Incident',
    steps: [
      {
        title: 'Initial Step',
        description: 'Description for first step',
        type: 'standard'
      }
    ],
    index: getNextAvailableIndex(),
    color: '#FFCC00' // Default yellow color
  };
  
  isNewIncident = true;
  selectedIncident = newIncident;
  showIncidentEditor();
}

// Get next available index
function getNextAvailableIndex() {
  if (incidentsData.length === 0) return 0;
  
  // Find unused indices
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

// Edit an existing incident
function editIncident(incident) {
  isNewIncident = false;
  // Create a deep copy to avoid modifying the original until save
  selectedIncident = JSON.parse(JSON.stringify(incident));
  showIncidentEditor();
}

// Show incident editor modal
function showIncidentEditor() {
  const modalOverlay = document.getElementById('modalOverlay');
  const modalContainer = document.getElementById('modalContainer');
  
  // Clear previous content
  modalContainer.innerHTML = '';
  
  // Create editor content
  const editorHeader = document.createElement('div');
  editorHeader.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid rgba(0,120,255,0.3);
  `;
  
  const editorTitle = document.createElement('h2');
  editorTitle.textContent = isNewIncident ? 'Add New Incident' : 'Edit Incident';
  editorTitle.style.cssText = `
    margin: 0;
    color: #66ccff;
    font-size: 20px;
    text-shadow: 0 0 10px rgba(0,150,255,0.3);
  `;
  
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '✕';
  closeButton.style.cssText = `
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
  `;
  
  closeButton.addEventListener('click', () => {
    modalOverlay.style.display = 'none';
  });
  
  editorHeader.appendChild(editorTitle);
  editorHeader.appendChild(closeButton);
  
  // Create basic form elements
  const form = document.createElement('div');
  form.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 15px;
    overflow-y: auto;
    max-height: calc(85vh - 150px);
  `;
  
  // Title input
  const titleGroup = createFormGroup('Incident Title', 'text', selectedIncident.title, (value) => {
    selectedIncident.title = value;
  }, 'Full title of the incident (e.g., "Ransomware Attack")');
  
  // Color picker
  const colorGroup = createColorPicker(selectedIncident.color, (value) => {
    selectedIncident.color = value;
  });
  
  // Node index
  const nodeIndexGroup = createFormGroup('Node Index', 'number', selectedIncident.index, (value) => {
    selectedIncident.index = parseInt(value);
  }, 'Position in the brain network (0-161)');
  nodeIndexGroup.querySelector('input').min = '0';
  nodeIndexGroup.querySelector('input').max = '161';
  
  // Steps section header
  const stepsHeader = document.createElement('div');
  stepsHeader.innerHTML = '<h3 style="margin: 10px 0; color: #66ccff;">Incident Steps</h3>';
  stepsHeader.style.borderBottom = '1px solid rgba(0,100,200,0.3)';
  stepsHeader.style.paddingBottom = '5px';
  
  // Steps container
  const stepsContainer = document.createElement('div');
  stepsContainer.id = 'stepsContainer';
  stepsContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 15px;
  `;
  
  // Populate steps
  selectedIncident.steps.forEach((step, index) => {
    const stepElement = createStepElement(step, index);
    stepsContainer.appendChild(stepElement);
  });
  
  // Add step button
  const addStepButton = document.createElement('button');
  addStepButton.textContent = '+ Add Step';
  addStepButton.style.cssText = `
    padding: 8px;
    background: rgba(0,80,160,0.5);
    color: #ffffff;
    border: 1px solid rgba(0,120,255,0.4);
    border-radius: 4px;
    cursor: pointer;
    font-family: 'Exo 2', sans-serif;
    font-size: 14px;
    align-self: flex-start;
    margin-top: 10px;
  `;
  
  addStepButton.addEventListener('click', () => {
    // Add a new step
    selectedIncident.steps.push({
      title: 'New Step',
      description: 'Description for new step',
      type: 'standard'
    });
    
    // Refresh steps container
    const newStepElement = createStepElement(selectedIncident.steps[selectedIncident.steps.length - 1], selectedIncident.steps.length - 1);
    stepsContainer.appendChild(newStepElement);
  });
  
  // Save button
  const saveButton = document.createElement('button');
  saveButton.textContent = '💾 Save Incident';
  saveButton.style.cssText = `
    padding: 12px;
    background: rgba(0,120,40,0.6);
    color: #ffffff;
    border: 1px solid rgba(0,180,80,0.4);
    border-radius: 4px;
    cursor: pointer;
    font-family: 'Exo 2', sans-serif;
    font-size: 16px;
    font-weight: bold;
    margin-top: 20px;
  `;
  
  saveButton.addEventListener('click', () => {
    saveIncident();
    modalOverlay.style.display = 'none';
  });
  
  // Assemble form
  form.appendChild(titleGroup);
  form.appendChild(colorGroup);
  form.appendChild(nodeIndexGroup);
  form.appendChild(stepsHeader);
  form.appendChild(stepsContainer);
  form.appendChild(addStepButton);
  form.appendChild(saveButton);
  
  // Add everything to the modal
  modalContainer.appendChild(editorHeader);
  modalContainer.appendChild(form);
  
  // Show the modal
  modalOverlay.style.display = 'flex';
}

// Create a form group for the editor
function createFormGroup(label, type, value, onChange, placeholder = '') {
  const group = document.createElement('div');
  group.style.marginBottom = '15px';
  
  const labelElement = document.createElement('label');
  labelElement.textContent = label;
  labelElement.style.cssText = `
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  `;
  
  const input = document.createElement('input');
  input.type = type;
  input.value = value;
  input.placeholder = placeholder;
  input.style.cssText = `
    width: 100%;
    padding: 8px;
    background: rgba(0,30,60,0.7);
    border: 1px solid rgba(0,100,200,0.4);
    border-radius: 4px;
    color: #ffffff;
    font-family: 'Exo 2', sans-serif;
    font-size: 14px;
    box-sizing: border-box;
  `;
  
  input.addEventListener('input', (e) => {
    onChange(e.target.value);
  });
  
  group.appendChild(labelElement);
  group.appendChild(input);
  
  return group;
}

// Create a color picker
function createColorPicker(initialColor, onChange) {
  const group = document.createElement('div');
  group.style.marginBottom = '15px';
  
  const label = document.createElement('label');
  label.textContent = 'Incident Color';
  label.style.cssText = `
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  `;
  
  const colorRow = document.createElement('div');
  colorRow.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
  `;
  
  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.value = initialColor || '#FFCC00';
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
    background-color: ${initialColor || '#FFCC00'};
    box-shadow: 0 0 10px rgba(255,255,255,0.2);
  `;
  
  const colorHexInput = document.createElement('input');
  colorHexInput.type = 'text';
  colorHexInput.value = initialColor || '#FFCC00';
  colorHexInput.placeholder = '#RRGGBB';
  colorHexInput.maxLength = 7;
  colorHexInput.style.cssText = `
    padding: 8px;
    width: 90px;
    background: rgba(0,30,60,0.7);
    border: 1px solid rgba(0,100,200,0.4);
    border-radius: 4px;
    color: #ffffff;
    font-family: monospace;
    font-size: 14px;
  `;
  
  // Color presets
  const presetContainer = document.createElement('div');
  presetContainer.style.cssText = `
    display: flex;
    gap: 8px;
    margin-top: 10px;
    flex-wrap: wrap;
  `;
  
  const presetColors = [
    '#FFCC00', '#FF6666', '#66CCFF', '#99CC66', '#CC66FF', '#FF9933'
  ];
  
  presetColors.forEach(color => {
    const preset = document.createElement('button');
    preset.style.cssText = `
      width: 25px;
      height: 25px;
      border-radius: 4px;
      background-color: ${color};
      border: 1px solid rgba(255,255,255,0.3);
      cursor: pointer;
    `;
    
    preset.addEventListener('click', () => {
      colorInput.value = color;
      colorHexInput.value = color;
      colorPreview.style.backgroundColor = color;
      onChange(color);
    });
    
    presetContainer.appendChild(preset);
  });
  
  // Color picker event
  colorInput.addEventListener('input', e => {
    const newColor = e.target.value;
    colorHexInput.value = newColor;
    colorPreview.style.backgroundColor = newColor;
    onChange(newColor);
  });
  
  // Hex input event
  colorHexInput.addEventListener('input', e => {
    let newColor = e.target.value;
    if (newColor.match(/^#[0-9A-Fa-f]{6}$/)) {
      colorInput.value = newColor;
      colorPreview.style.backgroundColor = newColor;
      onChange(newColor);
    }
  });
  
  colorRow.appendChild(colorInput);
  colorRow.appendChild(colorPreview);
  colorRow.appendChild(colorHexInput);
  
  group.appendChild(label);
  group.appendChild(colorRow);
  group.appendChild(presetContainer);
  
  return group;
}

// Create step element
function createStepElement(step, index) {
  const stepElement = document.createElement('div');
  stepElement.className = 'step-element';
  stepElement.style.cssText = `
    background: rgba(0,40,80,0.5);
    border-radius: 4px;
    padding: 15px;
    position: relative;
    margin-bottom: 15px;
  `;
  
  // Step number badge
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
  `;
  
  // Title input
  const titleLabel = document.createElement('label');
  titleLabel.textContent = 'Step Title';
  titleLabel.style.cssText = `
    display: block;
    margin-bottom: 5px;
    margin-left: 30px;
    font-weight: bold;
  `;
  
  const titleInput = document.createElement('input');
  titleInput.value = step.title || '';
  titleInput.style.cssText = `
    width: 100%;
    padding: 8px;
    background: rgba(0,30,60,0.7);
    border: 1px solid rgba(0,100,200,0.4);
    border-radius: 4px;
    color: #ffffff;
    font-family: 'Exo 2', sans-serif;
    font-size: 14px;
    box-sizing: border-box;
    margin-bottom: 10px;
  `;
  
  titleInput.addEventListener('input', (e) => {
    step.title = e.target.value;
  });
  
  // Step type selector
  const typeLabel = document.createElement('label');
  typeLabel.textContent = 'Step Type';
  typeLabel.style.cssText = `
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  `;
  
  const typeSelect = document.createElement('select');
  typeSelect.style.cssText = `
    width: 100%;
    padding: 8px;
    background: rgba(0,30,60,0.7);
    border: 1px solid rgba(0,100,200,0.4);
    border-radius: 4px;
    color: #ffffff;
    font-family: 'Exo 2', sans-serif;
    font-size: 14px;
    box-sizing: border-box;
    margin-bottom: 10px;
  `;
  
  // Add options
  const typeOptions = [
    { value: 'standard', text: 'Standard Step' },
    { value: 'condition', text: 'Condition Step (Decision Point)' }
  ];
  
  typeOptions.forEach(option => {
    const optElement = document.createElement('option');
    optElement.value = option.value;
    optElement.textContent = option.text;
    typeSelect.appendChild(optElement);
  });
  
  // Set current type
  typeSelect.value = step.type || 'standard';
  
  // Description input
  const descLabel = document.createElement('label');
  descLabel.textContent = 'Description';
  descLabel.style.cssText = `
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  `;
  
  const descInput = document.createElement('textarea');
  descInput.value = step.description || '';
  descInput.style.cssText = `
    width: 100%;
    padding: 8px;
    height: 80px;
    background: rgba(0,30,60,0.7);
    border: 1px solid rgba(0,100,200,0.4);
    border-radius: 4px;
    color: #ffffff;
    font-family: 'Exo 2', sans-serif;
    font-size: 14px;
    box-sizing: border-box;
    resize: vertical;
    margin-bottom: 10px;
  `;
  
  descInput.addEventListener('input', (e) => {
    step.description = e.target.value;
  });
  
  // Container for dynamic content (conditions, links)
  const dynamicContent = document.createElement('div');
  dynamicContent.className = 'step-dynamic-content';
  
  // Update dynamic content when step type changes
  function updateDynamicContent() {
    dynamicContent.innerHTML = '';
    
    // Set step type
    step.type = typeSelect.value;
    
    // Add appropriate content based on step type
    if (typeSelect.value === 'condition') {
      // Initialize conditions array if it doesn't exist
      if (!step.conditions) {
        step.conditions = [];
      }
      createConditionUI(dynamicContent, step.conditions, index);
    }
    
    // Always show links option regardless of step type
    // Initialize links array if it doesn't exist
    if (!step.links) {
      step.links = [];
    }
    createLinksUI(dynamicContent, step.links, index);
  }
  
  // Initial dynamic content
  updateDynamicContent();
  
  // Listen for type changes
  typeSelect.addEventListener('change', updateDynamicContent);
  
  // Delete step button (disabled if only one step)
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '🗑️ Delete Step';
  deleteBtn.style.cssText = `
    background: rgba(150,20,20,0.6);
    color: #ffffff;
    border: 1px solid rgba(200,50,50,0.4);
    border-radius: 4px;
    padding: 5px 10px;
    cursor: pointer;
    font-family: 'Exo 2', sans-serif;
    font-size: 12px;
    margin-top: 10px;
  `;
  
  // Disable if only one step
  if (selectedIncident.steps.length <= 1) {
    deleteBtn.disabled = true;
    deleteBtn.style.opacity = '0.5';
    deleteBtn.style.cursor = 'not-allowed';
  }
  
  deleteBtn.addEventListener('click', () => {
    if (selectedIncident.steps.length > 1) {
      // Remove step
      selectedIncident.steps.splice(index, 1);
      
      // Refresh the editor
      showIncidentEditor();
    }
  });
  
  // Assemble step element
  stepElement.appendChild(stepNumber);
  stepElement.appendChild(titleLabel);
  stepElement.appendChild(titleInput);
  stepElement.appendChild(typeLabel);
  stepElement.appendChild(typeSelect);
  stepElement.appendChild(descLabel);
  stepElement.appendChild(descInput);
  stepElement.appendChild(dynamicContent);
  stepElement.appendChild(deleteBtn);
  
  return stepElement;
}

// Create condition UI for handling conditional steps
function createConditionUI(container, conditions = [], stepIndex) {
  const conditionsContainer = document.createElement('div');
  conditionsContainer.className = 'conditions-editor';
  conditionsContainer.style.cssText = `
    background: rgba(0,30,60,0.5);
    border-radius: 4px;
    padding: 10px;
    margin-bottom: 15px;
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
    
    // Make sure the conditions array exists
    if (!selectedIncident.steps[stepIndex].conditions) {
      selectedIncident.steps[stepIndex].conditions = [];
    }
    
    const stepConditions = selectedIncident.steps[stepIndex].conditions;
    
    if (stepConditions.length === 0) {
      const noConditionsMessage = document.createElement('div');
      noConditionsMessage.textContent = 'No conditions added yet. Add one below.';
      noConditionsMessage.style.cssText = `
        font-style: italic;
        padding: 10px;
        color: #8eb8ff;
        text-align: center;
        background: rgba(0,40,80,0.3);
        border-radius: 4px;
      `;
      conditionsList.appendChild(noConditionsMessage);
    } else {
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
        const playbooks = incidentsData;
        playbooks.forEach(playbook => {
          // Skip current incident to prevent circular reference
          if (isNewIncident || playbook.title !== selectedIncident.title) {
            const optEl = document.createElement('option');
            optEl.value = playbook.title;
            optEl.dataset.index = playbook.index;
            optEl.textContent = `${playbook.title} (Node ${playbook.index})`;
            playbookSelect.appendChild(optEl);
          }
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
          if (selectedPlaybook) {
            const playbookOptions = Array.from(playbookSelect.options);
            const targetOption = playbookOptions.find(opt => opt.value === condition.target);
            if (targetOption) {
              playbookSelect.value = targetOption.value;
            }
          }
        } else if (condition.target === 'next') {
          // Handle legacy 'next' target by converting it to the next step
          currentTargetType = 'step';
          stepNumberInput.value = (stepIndex + 2).toString(); // Current step + 1 (as indexing starts at 0)
        }
        
        // Make sure the dropdown has a value that exists
        if (currentTargetType === 'next') {
          // Handle legacy 'next' value by changing UI to use 'step' 
          // but keep original target intact until user makes changes
          targetTypeSelect.value = 'step';
          // Calculate next step number (current step index + 1)
          stepNumberInput.value = (stepIndex + 2).toString();
        } else {
          targetTypeSelect.value = currentTargetType;
        }
        
        // Function to create target step selection UI
        function createTargetStepUI() {
          // Create container for target step selection
          const stepContainer = document.createElement('div');
          stepContainer.className = 'target-step-container';
          stepContainer.style.cssText = `
            margin-top: 8px;
            padding: 8px;
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
          
          targetStepSelect = document.createElement('select');
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
          if (selectedPlaybook && selectedPlaybook.steps && selectedPlaybook.steps.length > 0) {
            selectedPlaybook.steps.forEach((step, idx) => {
              if (idx === 0) return; // Skip first step as it's already the default
              
              const option = document.createElement('option');
              option.value = idx.toString();
              option.textContent = `Step ${idx + 1}: ${step.title}`;
              targetStepSelect.appendChild(option);
            });
          }
          
          // Set current selection
          if (condition.targetStep !== undefined && condition.targetStep !== null) {
            targetStepSelect.value = condition.targetStep.toString();
          }
          
          stepContainer.appendChild(targetStepLabel);
          stepContainer.appendChild(targetStepSelect);
          
          return stepContainer;
        }
        
        // Function to update the UI based on target type
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
            if (selectedPlaybook) {
              const stepContainer = createTargetStepUI();
              targetValueContainer.appendChild(stepContainer);
              
              // Add event listener to update the condition
              targetStepSelect.addEventListener('change', () => {
                condition.targetStep = parseInt(targetStepSelect.value, 10);
              });
            }
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
        
        // Initial update of target inputs
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
            // Update condition target
            condition.target = selectedOption.value;
            condition.targetIndex = parseInt(selectedOption.dataset.index);
            
            // Find the playbook for target step selection
            selectedPlaybook = playbooks.find(p => p.title === selectedOption.value);
            
            // Reset to first step when playbook changes
            condition.targetStep = 0;
            
            // Update target step UI
            targetValueContainer.innerHTML = '';
            targetValueContainer.appendChild(playbookSelect);
            
            // Recreate and append step selection container
            if (selectedPlaybook) {
              const stepContainer = createTargetStepUI();
              targetValueContainer.appendChild(stepContainer);
              
              // Add event listener to update the condition
              targetStepSelect.addEventListener('change', () => {
                condition.targetStep = parseInt(targetStepSelect.value, 10);
              });
            }
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
    if (!selectedIncident.steps[stepIndex].conditions) {
      selectedIncident.steps[stepIndex].conditions = [];
    }
    
    // Default to the next step (current step index + 1)
    const nextStepNum = stepIndex + 2; // +1 for 0-based index, +1 for next step
    
    selectedIncident.steps[stepIndex].conditions.push({
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

// Create links UI for adding playbook links
function createLinksUI(container, links = [], stepIndex) {
  const linksContainer = document.createElement('div');
  linksContainer.className = 'links-editor';
  linksContainer.style.cssText = `
    background: rgba(0,30,60,0.5);
    border-radius: 4px;
    padding: 10px;
    margin-bottom: 15px;
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
    
    // Ensure the links array exists
    if (!selectedIncident.steps[stepIndex].links) {
      selectedIncident.steps[stepIndex].links = [];
    }
    
    const stepLinks = selectedIncident.steps[stepIndex].links;
    
    if (stepLinks.length === 0) {
      const noLinksMessage = document.createElement('div');
      noLinksMessage.textContent = 'No links added yet. Add one below.';
      noLinksMessage.style.cssText = `
        font-style: italic;
        padding: 10px;
        color: #8eb8ff;
        text-align: center;
        background: rgba(0,40,80,0.3);
        border-radius: 4px;
      `;
      linksList.appendChild(noLinksMessage);
    } else {
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
        
        // Variable to hold reference to selected playbook
        let selectedPlaybook = null;
        
        // Add playbook options
        const playbooks = incidentsData;
        playbooks.forEach(playbook => {
          // Skip current incident to prevent circular reference
          if (isNewIncident || playbook.title !== selectedIncident.title) {
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
          if (selectedPlaybook) {
            const playbookOptions = Array.from(playbookSelect.options);
            const targetOption = playbookOptions.find(opt => opt.value === link.target);
            if (targetOption) {
              playbookSelect.value = targetOption.value;
            }
          }
        } else if (playbookSelect.options.length > 0) {
          // Default to first playbook if none selected
          const defaultPlaybook = playbookSelect.options[0].value;
          link.target = defaultPlaybook;
          link.targetIndex = parseInt(playbookSelect.options[0].dataset.index);
          selectedPlaybook = playbooks.find(p => p.title === defaultPlaybook);
        }
        
        // Link text input 
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
        
        // Create target step selection UI
        function createTargetStepUI() {
          // Create container for target step selection
          const targetStepContainer = document.createElement('div');
          targetStepContainer.className = 'target-step-container';
          targetStepContainer.style.cssText = `
            margin-top: 8px;
            padding: 8px;
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
          if (selectedPlaybook && selectedPlaybook.steps && selectedPlaybook.steps.length > 0) {
            selectedPlaybook.steps.forEach((step, idx) => {
              if (idx === 0) return; // Skip first step as it's already the default
              
              const option = document.createElement('option');
              option.value = idx.toString();
              option.textContent = `Step ${idx + 1}: ${step.title}`;
              targetStepSelect.appendChild(option);
            });
          }
          
          // Set current selection
          if (link.targetStep !== undefined && link.targetStep !== null) {
            targetStepSelect.value = link.targetStep.toString();
          }
          
          targetStepSelect.addEventListener('change', () => {
            link.targetStep = parseInt(targetStepSelect.value, 10);
          });
          
          targetStepContainer.appendChild(targetStepLabel);
          targetStepContainer.appendChild(targetStepSelect);
          
          return targetStepContainer;
        }
        
        // Add the target step UI
        const targetStepContainer = createTargetStepUI();
        
        // Update when selection changes
        playbookSelect.addEventListener('change', () => {
          const selectedOption = playbookSelect.options[playbookSelect.selectedIndex];
          if (selectedOption) {
            // Update link target
            link.target = selectedOption.value;
            link.targetIndex = parseInt(selectedOption.dataset.index);
            
            // Find the target playbook for step selection
            selectedPlaybook = playbooks.find(p => p.title === selectedOption.value);
            
            // Reset to first step when playbook changes
            link.targetStep = 0;
            
            // Replace the target step container with a new one
            const oldContainer = linkContent.querySelector('.target-step-container');
            if (oldContainer) {
              const newContainer = createTargetStepUI();
              linkContent.replaceChild(newContainer, oldContainer);
            }
          }
        });
        
        linkContent.appendChild(playbookLabel);
        linkContent.appendChild(playbookSelect);
        linkContent.appendChild(targetStepContainer);
        linkContent.appendChild(linkTextLabel);
        linkContent.appendChild(linkTextInput);
        linkContent.appendChild(linkDescLabel);
        linkContent.appendChild(linkDescInput);
        
        linkItem.appendChild(linkHeader);
        linkItem.appendChild(linkContent);
        
        linksList.appendChild(linkItem);
      });
    }
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
    if (!selectedIncident.steps[stepIndex].links) {
      selectedIncident.steps[stepIndex].links = [];
    }
    
    // Get available playbooks
    const availablePlaybooks = incidentsData.filter(p => isNewIncident || p.title !== selectedIncident.title);
    
    // Select first available playbook that's not this one
    let targetPlaybook = null;
    let targetIndex = null;
    
    if (availablePlaybooks.length > 0) {
      targetPlaybook = availablePlaybooks[0].title;
      targetIndex = availablePlaybooks[0].index;
    } else {
      showNotification('No other playbooks available to link to. Create another incident first.', 'error');
      return;
    }
    
    selectedIncident.steps[stepIndex].links.push({
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

// Save the current incident
function saveIncident() {
  // Validate first
  if (!selectedIncident.title) {
    showNotification('Incident title is required', 'error');
    return false;
  }
  
  // Fill in empty link titles with target playbook title
  selectedIncident.steps.forEach(step => {
    if (step.links && step.links.length > 0) {
      step.links.forEach(link => {
        // If title is empty, use the target playbook's title
        if (!link.title && link.target) {
          link.title = link.target;
        }
      });
    }
  });
  
  if (isNewIncident) {
    // Add to incidents
    incidentsData.push(selectedIncident);
  } else {
    // Update existing
    const index = incidentsData.findIndex(inc => inc.title === selectedIncident.title);
    if (index !== -1) {
      incidentsData[index] = selectedIncident;
    } else {
      // If title changed, add as new
      incidentsData.push(selectedIncident);
    }
  }
  
  // Re-render and update
  renderIncidentList();
  updateCapacityIndicator();
  showNotification('Incident saved successfully', 'success');
  
  return true;
}

// Confirm deletion of an incident
function confirmDeletion(index) {
  if (confirm(`Are you sure you want to delete "${incidentsData[index].title}"? This cannot be undone.`)) {
    // Remove from array
    incidentsData.splice(index, 1);
    
    // Update UI
    renderIncidentList();
    updateCapacityIndicator();
    showNotification('Incident deleted', 'success');
  }
}

// Save all changes to server
function saveAllChanges() {
  showNotification('Saving changes...', 'info');
  
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
      showNotification('All changes saved successfully!', 'success');
    } else {
      throw new Error(data.message || 'Unknown server error');
    }
  })
  .catch(error => {
    console.error('Server error:', error);
    showNotification(`Error saving changes: ${error.message}`, 'error');
  });
}

// Export incidents
function exportIncidents() {
  // Send a request to download
  window.location.href = '/download-incidents?t=' + new Date().getTime();
  showNotification('Download started!', 'success');
}
