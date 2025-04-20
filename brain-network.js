// Brain Network Visualization
document.addEventListener('DOMContentLoaded', function() {
  // Device detection for responsive design
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                || window.innerWidth < 1024;
  const isPortrait = window.innerHeight > window.innerWidth;
  
  console.log(`Device detected: ${isMobile ? 'Mobile' : 'Desktop'}, Orientation: ${isPortrait ? 'Portrait' : 'Landscape'}`);
  
  // Initialize Three.js - enable preserveDrawingBuffer to fix potential display issues
  const scene = new THREE.Scene();
  
  // Calculate appropriate scale factors based on screen dimensions
  function calculateScaleFactor() {
    // Base scaling on screen dimensions
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const screenRatio = screenWidth / screenHeight;
    
    // Base calculations
    let scaleFactor = {
      x: 1.0,
      y: 1.0,
      z: 1.0
    };
    
    if (isMobile) {
      if (isPortrait) {
        // For portrait mode, we want to scale based on width primarily
        // Start with a good baseline and adjust accordingly
        const widthFactor = Math.min(Math.max(screenWidth / 400, 0.45), 0.9);
        
        scaleFactor.x = widthFactor;
        scaleFactor.y = widthFactor * 0.9; // Slightly smaller y scale for better fit
        
        console.log(`Portrait mode adaptive scaling: ${widthFactor.toFixed(2)} (width: ${screenWidth}px)`);
      } else {
        // For landscape, we have more width, so can be more generous
        const baseScale = Math.min(Math.max(screenWidth / 800, 0.6), 0.85);
        scaleFactor.x = baseScale;
        scaleFactor.y = baseScale;
      }
    }
    
    return scaleFactor;
  }
  
  // Calculate camera distance based on screen size and orientation
  function calculateCameraDistance() {
    if (!isMobile) return 22.5; // Desktop distance
    
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    if (isPortrait) {
      // In portrait mode, distance is based primarily on width
      // Narrower screens need camera further back
      return 40 + (450 - Math.min(screenWidth, 450)) / 10;
    } else {
      // In landscape, distance can be closer
      return 30 + (800 - Math.min(screenWidth, 800)) / 30;
    }
  }
  
  // Get calculated scale factor
  const scaleFactor = calculateScaleFactor();
  const cameraDistance = calculateCameraDistance();
  
  // Responsive camera parameters
  const cameraParams = {
    desktop: {
      fov: 75,
      position: { x: 0, y: 0, z: 22.5 }
    },
    mobile: {
      fov: 70,
      position: { x: 0, y: 0, z: cameraDistance }
    }
  };
  
  // Select camera parameters based on device
  const params = isMobile ? cameraParams.mobile : cameraParams.desktop;
  
  // Create camera with selected parameters
  const camera = new THREE.PerspectiveCamera(
    params.fov, 
    window.innerWidth / window.innerHeight, 
    0.1, 
    1000
  );
  
  // Enhanced renderer config to handle depth and layering properly
  const renderer = new THREE.WebGLRenderer({ 
    antialias: !isMobile, // Disable antialiasing on mobile for performance
    alpha: true,
    preserveDrawingBuffer: true, 
    logarithmicDepthBuffer: true // Helps with depth sorting
  });
  
  // Optimize renderer for mobile
  if (isMobile) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  }
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 1); // Pure black background
  renderer.sortObjects = true; // Enable manual sorting of transparent objects
  
  // Add the renderer to the document
  document.body.appendChild(renderer.domElement);
  
  // Setup camera position based on device type and orientation
  camera.position.x = params.position.x;
  camera.position.y = params.position.y;
  camera.position.z = params.position.z;
  
  // Global variables
  const clock = new THREE.Clock();
  let accumulatedTime = 0;
  let isPaused = false;
  let brainNodes = []; // Changed from const to let so we can populate it directly
  const nodeConnections = [];
  const particlesPool = [];
  
  // To store original positions for resizing
  let originalNodePositions = [];
  
  // Camera animation variables
  let isZooming = false;
  let zoomTarget = new THREE.Vector3();
  let zoomStart = new THREE.Vector3();
  let zoomProgress = 0;
  let zoomDuration = 1.0; // 1 second animation
  let originalCameraPosition = new THREE.Vector3(
    params.position.x, 
    params.position.y, 
    params.position.z
  );
  
  // Variables for auto and user-controlled rotation
  let enableAutoRotation = true;
  let userControlling = false;
  
  // Target rotation - for smooth interpolation
  let targetRotationX = 0;
  let targetRotationY = 0;
  let currentRotationX = 0;
  let currentRotationY = 0;
  
  // Inertia variables for smooth rotation continue after drag
  let rotationVelocityX = 0;
  let rotationVelocityY = 0;
  let rotationDamping = 0.95; // Damping factor (0-1) - higher = longer continuation
  let rotationInertiaActive = false;
  let lastDragTime = 0;
  let dragDeltaX = 0;
  let dragDeltaY = 0;
  let dragTimeout = null;
  
  // Adjust sensitivity based on device
  const rotationSensitivity = isMobile ? 0.005 : 0.003;
  
  // Camera control object for zoom functionality
  const cameraControl = {
    zoomTo: function(targetPosition) {
      // Store original camera position if this is our first zoom
      if (!isZooming) {
        originalCameraPosition.copy(camera.position);
      }
      
      // Setup zoom animation
      zoomStart.copy(camera.position);
      
      // Calculate zoom target position - closer to the node
      zoomTarget.copy(targetPosition);
      
      // Calculate direction from camera to target
      const direction = new THREE.Vector3().subVectors(targetPosition, camera.position).normalize();
      
      // Set target to be 5 units away from the node in the direction from origin to node
      const nodeToOrigin = new THREE.Vector3().subVectors(new THREE.Vector3(), targetPosition).normalize();
      zoomTarget.copy(targetPosition).add(nodeToOrigin.multiplyScalar(5));
      
      // Reset zoom progress
      zoomProgress = 0;
      isZooming = true;
    },
    
    zoomOut: function(immediate = false) {
      if (immediate) {
        // Reset camera position immediately
        camera.position.copy(originalCameraPosition);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        isZooming = false;
      } else {
        // Setup smooth zoom out animation
        zoomStart.copy(camera.position);
        zoomTarget.copy(originalCameraPosition);
        zoomProgress = 0;
        isZooming = true;
      }
    },
    
    update: function(deltaTime) {
      if (isZooming) {
        // Update progress
        zoomProgress += deltaTime / zoomDuration;
        
        if (zoomProgress >= 1.0) {
          // Animation complete
          zoomProgress = 1.0;
          isZooming = false;
          
          // Ensure we're exactly at target position
          camera.position.copy(zoomTarget);
        } else {
          // Smooth easing function for animation
          const t = zoomProgress < 0.5 
            ? 2 * zoomProgress * zoomProgress  // Ease in
            : 1 - Math.pow(-2 * zoomProgress + 2, 2) / 2;  // Ease out
          
          // Update camera position with easing
          camera.position.lerpVectors(zoomStart, zoomTarget, t);
        }
        
        // Always look at center
        camera.lookAt(new THREE.Vector3(0, 0, 0));
      }
    }
  };
  
  // Create stars background with more stars - MODIFIED to prevent overlap with brain nodes
  function createStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.06, // Small stars
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true, // Ensure stars change size with distance
      alphaTest: 0.1, // Helps prevent square artifacts
      depthWrite: false // Prevent depth fighting
    });
    
    const starsVertices = [];
    const brainRadius = 25; // Much larger exclusion zone around the brain
    
    // Reduce star count on mobile
    const starCount = isMobile ? 2000 : 3000;
    
    for (let i = 0; i < starCount; i++) { // Reduced number of stars
      let x, y, z;
      let distanceFromCenter;
      
      // Place stars very far away from the brain network
      x = (Math.random() - 0.5) * 800;
      y = (Math.random() - 0.5) * 800;
      z = (Math.random() - 0.5) * 800;
      
      distanceFromCenter = Math.sqrt(x*x + y*y + z*z);
      
      // Only add stars that are very far from the brain center
      if (distanceFromCenter > brainRadius * 1.5) {
        starsVertices.push(x, y, z);
      }
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    stars.renderOrder = -1; // Ensure stars render behind everything else
    scene.add(stars);
    
    return stars;
  }
  
  // Create brain nodes with better distribution and spacing - MODIFIED with scaling factors
  function createBrainNodes() {
    // Adjust node count based on device
    const totalNodes = isMobile ? 130 : 162;
    
    // Base brain dimensions
    const baseBrainWidth = 13.5;  // Reduced from 15 by 10%
    const baseBrainHeight = 10.8; // Reduced from 12 by 10%
    const baseBrainDepth = 11.7;  // Reduced from 13 by 10%
    
    // Apply device-specific scaling
    const brainWidth = baseBrainWidth * scaleFactor.x;
    const brainHeight = baseBrainHeight * scaleFactor.y;
    const brainDepth = baseBrainDepth * scaleFactor.z;
    
    // Node positions tracking for better spacing
    const positions = [];
    const occupiedPositions = new Set();
    const minDistance = isMobile ? 1.5 : 2.0; // Reduced minimum distance on mobile
    
    // Create nodes with anatomical distribution
    for (let i = 0; i < totalNodes; i++) {
      // Create a more brain-like shape using parametric equations
      const t = i / totalNodes;
      const theta = t * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      // Base coordinates
      let x = Math.sin(phi) * Math.cos(theta);
      let y = Math.sin(phi) * Math.sin(theta);
      let z = Math.cos(phi);
      
      // Shape modifications to match brain morphology
      // Enhance the two-hemisphere structure
      if (x > 0) {
        x = 0.8 * x + 0.3 * Math.pow(x, 3);
      } else {
        x = 0.8 * x - 0.3 * Math.pow(-x, 3);
      }
      
      // Add asymmetry for more natural look
      x *= 1.2;
      
      // Scale to brain proportions
      let xPos = x * brainWidth * (0.95 + Math.random() * 0.1);
      let yPos = y * brainHeight * (0.95 + Math.random() * 0.1);
      let zPos = z * brainDepth * (0.95 + Math.random() * 0.1);
      
      // Create the longitudinal fissure (central groove)
      if (Math.abs(xPos) < 1.0) {
        yPos -= Math.abs(xPos) * 0.5;
      }
      
      // Round positions to create grid-like spacing
      const roundFactor = isMobile ? 1.5 : 1.8;
      const roundedX = Math.round(xPos / roundFactor) * roundFactor;
      const roundedY = Math.round(yPos / roundFactor) * roundFactor;
      const roundedZ = Math.round(zPos / roundFactor) * roundFactor;
      
      // Check if position is already occupied
      const posKey = `${roundedX},${roundedY},${roundedZ}`;
      
      // Check minimum distance from other nodes
      let tooClose = false;
      for (const pos of positions) {
        const dx = roundedX - pos.x;
        const dy = roundedY - pos.y;
        const dz = roundedZ - pos.z;
        const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (distance < minDistance) {
          tooClose = true;
          break;
        }
      }
      
      if (!occupiedPositions.has(posKey) && !tooClose) {
        // Add to positions
        positions.push({x: roundedX, y: roundedY, z: roundedZ});
        occupiedPositions.add(posKey);
        
        // Store original position for resizing later
        originalNodePositions.push({
          x: roundedX / scaleFactor.x,
          y: roundedY / scaleFactor.y,
          z: roundedZ / scaleFactor.z
        });
        
        // Create node mesh
        const nodeGeometry = new THREE.SphereGeometry(0.2, 12, 12); // Reduced from 0.22 by ~10%
        const nodeMaterial = new THREE.MeshBasicMaterial({
          color: 0x66ccff,
          transparent: true,
          opacity: 0.8
        });
        
        const mesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
        mesh.position.set(roundedX, roundedY, roundedZ);
        
        // Add glow to each node
        const nodeGlowGeometry = new THREE.SphereGeometry(0.32, 16, 16); // Reduced from 0.35 by ~10%
        const nodeGlowMaterial = new THREE.MeshBasicMaterial({
          color: 0x66ccff,
          transparent: true,
          opacity: 0.3,
          blending: THREE.AdditiveBlending
        });
        const nodeGlow = new THREE.Mesh(nodeGlowGeometry, nodeGlowMaterial);
        mesh.add(nodeGlow);
        
        scene.add(mesh);
        brainNodes.push({
          mesh: mesh,
          position: new THREE.Vector3(roundedX, roundedY, roundedZ)
        });
      }
    }
    
    // Center brain in portrait mode
    if (isMobile && isPortrait) {
      scene.position.y = 2; // Offset to center in portrait mode
    }
  }
  
  // Create connections between nodes
  function createConnections() {
    // Reduce connections on mobile for performance
    const maxConnectionsPerNode = isMobile ? 3 : 4;
    const connectionMap = new Set();
    
    // First pass: connect nearby nodes
    brainNodes.forEach((node, index) => {
      const neighbors = brainNodes
        .map((neighbor, nIndex) => ({
          index: nIndex,
          distance: node.position.distanceTo(neighbor.position)
        }))
        .filter(n => n.index !== index)
        .sort((a, b) => a.distance - b.distance);
      
      // Get closest nodes to connect
      const nodesToConnect = neighbors.slice(0, maxConnectionsPerNode);
      
      nodesToConnect.forEach(neighborInfo => {
        const minIndex = Math.min(index, neighborInfo.index);
        const maxIndex = Math.max(index, neighborInfo.index);
        const connectionId = `${minIndex}-${maxIndex}`;
        
        if (!connectionMap.has(connectionId)) {
          const neighbor = brainNodes[neighborInfo.index];
          const distance = neighborInfo.distance;
          
          // Create straight connection
          createStraightConnection(node, neighbor, distance < 5.4, connectionId, connectionMap); // Reduced threshold from 6 by 10%
        }
      });
    });
    
    // Second pass: add some long-distance connections (small world network)
    // Reduce long connections on mobile
    const longConnectionChance = isMobile ? 0.15 : 0.3;
    const maxConnections = isMobile ? 250 : 315;
    
    for (let i = 0; i < brainNodes.length; i++) {
      if (Math.random() < longConnectionChance) { // Reduced chance for long connections
        const nodeA = brainNodes[i];
        
        for (let j = 0; j < brainNodes.length; j++) {
          if (i !== j) {
            const nodeB = brainNodes[j];
            const distance = nodeA.position.distanceTo(nodeB.position);
            
            // Only create long-distance connections - adjusted thresholds
            if (distance > 9 && distance < 22.5 && Math.random() < 0.08) { // Reduced from 10 and 25 by 10%
              const minIndex = Math.min(i, j);
              const maxIndex = Math.max(i, j);
              const connectionId = `${minIndex}-${maxIndex}`;
              
              if (!connectionMap.has(connectionId)) {
                createStraightConnection(nodeA, nodeB, false, connectionId, connectionMap);
                
                // Limit total connections
                if (nodeConnections.length > maxConnections) break;
              }
            }
          }
        }
      }
    }
  }
  
  // Helper function to create straight connections
  function createStraightConnection(nodeA, nodeB, isMajorConnection, connectionId, connectionMap) {
    // For straight lines, we only need 2 points, but we'll create more points along the line
    // for smooth particle movement
    const numPoints = isMobile ? 12 : 18; // Fewer points on mobile
    const points = [];
    
    // Create points along the straight line
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      const x = nodeA.position.x + t * (nodeB.position.x - nodeA.position.x);
      const y = nodeA.position.y + t * (nodeB.position.y - nodeA.position.y);
      const z = nodeA.position.z + t * (nodeB.position.z - nodeA.position.z);
      
      points.push(new THREE.Vector3(x, y, z));
    }
    
    // Create simple geometry for the straight line
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // Different color and opacity based on connection importance
    const color = isMajorConnection ? 0x33bbff : 0x0077cc;
    const opacity = isMajorConnection ? 0.7 : 0.4;
    
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: color, 
      transparent: true, 
      opacity: opacity
    });
    
    const line = new THREE.Line(lineGeometry, lineMaterial);
    
    // Store connection information for animations
    line.userData = {
      points: points,
      particles: [],
      nextParticleTime: Math.random() * 3 * (isMobile ? 2 : 1), // Slower particles on mobile
      isMajorConnection: isMajorConnection
    };
    
    scene.add(line);
    nodeConnections.push(line);
    connectionMap.add(connectionId);
  }
  
  // Create particles for neural signal visualization - MODIFIED for mobile
  function createParticlesPool(count) {
    // Reduce particle count on mobile
    const particleCount = isMobile ? Math.floor(count * 0.6) : count;
    const particleSize = isMobile ? 0.015 : 0.018; // Smaller particles on mobile
    
    for (let i = 0; i < particleCount; i++) {
      const particleGeometry = new THREE.SphereGeometry(particleSize, 6, 6);
      const particleMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00aaff,
        transparent: true,
        opacity: 0.5, // Further reduced opacity
        blending: THREE.AdditiveBlending
      });
      
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.visible = false;
      particle.userData = {
        inUse: false,
        progress: 0,
        speed: 0,
        connection: null
      };
      
      scene.add(particle);
      particlesPool.push(particle);
    }
  }
  
  // Get available particle from pool
  function getAvailableParticle() {
    for (let i = 0; i < particlesPool.length; i++) {
      if (!particlesPool[i].userData.inUse) {
        return particlesPool[i];
      }
    }
    return null;
  }
  
  // Create brain glow with better shape matching - MODIFIED for mobile
  function createBrainGlow() {
    // Reduce glow particle count on mobile
    const innerGlowCount = isMobile ? 1200 : 1800;
    const outerGlowCount = isMobile ? 900 : 1350;
    
    // Inner glow - more dense points
    const innerGlowGeometry = new THREE.BufferGeometry();
    const innerGlowVertices = [];
    
    for (let i = 0; i < innerGlowCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      let x = Math.sin(phi) * Math.cos(theta);
      let y = Math.sin(phi) * Math.sin(theta);
      let z = Math.cos(phi);
      
      // Shape modifications
      if (x > 0) {
        x = 0.8 * x + 0.3 * Math.pow(x, 3);
      } else {
        x = 0.8 * x - 0.3 * Math.pow(-x, 3);
      }
      
      // Create the longitudinal fissure
      if (Math.abs(x) < 0.5) {
        y -= Math.abs(x) * 0.4;
      }
      
      // Scale to brain shape - reduced by 10%
      const scaleX = (14.4 + Math.random() * 1.8) * scaleFactor.x;
      const scaleY = (11.7 + Math.random() * 1.8) * scaleFactor.y;
      const scaleZ = (12.6 + Math.random() * 1.8) * scaleFactor.z;
      
      innerGlowVertices.push(x * scaleX, y * scaleY, z * scaleZ);
    }
    
    innerGlowGeometry.setAttribute('position', new THREE.Float32BufferAttribute(innerGlowVertices, 3));
    
    const innerGlowMaterial = new THREE.PointsMaterial({
      color: 0x3377aa,
      transparent: true,
      opacity: 0.2,
      size: isMobile ? 0.4 : 0.45, // Smaller glow points on mobile
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true, // Ensure points change size with distance
      alphaTest: 0.1, // Helps prevent square artifacts
      depthWrite: false // Prevent depth fighting
    });
    
    const innerGlow = new THREE.Points(innerGlowGeometry, innerGlowMaterial);
    innerGlow.renderOrder = -2; // Ensure it renders behind nodes but above stars
    scene.add(innerGlow);
    
    // Outer glow - less dense, larger area
    const outerGlowGeometry = new THREE.BufferGeometry();
    const outerGlowVertices = [];
    
    for (let i = 0; i < outerGlowCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      let x = Math.sin(phi) * Math.cos(theta);
      let y = Math.sin(phi) * Math.sin(theta);
      let z = Math.cos(phi);
      
      // Shape modifications
      if (x > 0) {
        x = 0.8 * x + 0.3 * Math.pow(x, 3);
      } else {
        x = 0.8 * x - 0.3 * Math.pow(-x, 3);
      }
      
      // Create the longitudinal fissure
      if (Math.abs(x) < 0.5) {
        y -= Math.abs(x) * 0.4;
      }
      
      // Scale to brain shape plus buffer - reduced by 10% and using scaleFactor
      const scaleX = (16.2 + Math.random() * 3.6) * scaleFactor.x;
      const scaleY = (13.5 + Math.random() * 3.6) * scaleFactor.y;
      const scaleZ = (14.4 + Math.random() * 3.6) * scaleFactor.z;
      
      outerGlowVertices.push(x * scaleX, y * scaleY, z * scaleZ);
    }
    
    outerGlowGeometry.setAttribute('position', new THREE.Float32BufferAttribute(outerGlowVertices, 3));
    
    const outerGlowMaterial = new THREE.PointsMaterial({
      color: 0x114477,
      transparent: true,
      opacity: 0.15,
      size: isMobile ? 0.65 : 0.72, // Slightly smaller on mobile
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true, // Ensure points change size with distance
      alphaTest: 0.1, // Helps prevent square artifacts  
      depthWrite: false // Prevent depth fighting
    });
    
    const outerGlow = new THREE.Points(outerGlowGeometry, outerGlowMaterial);
    outerGlow.renderOrder = -3; // Ensure it renders behind inner glow
    scene.add(outerGlow);
    
    return { innerGlow, outerGlow };
  }
  
  // Initialize particle system
  function initializeParticleSystem() {
    // Add neuron signal particles - reduced for mobile
    const particleCount = isMobile ? 120 : 180;
    createParticlesPool(particleCount);
    
    // Initial delay for particle creation
    setTimeout(() => {
      setInterval(() => {
        if (!isPaused) {
          updateParticles(0.016); // Approximate time for 60fps
        }
      }, 16);
    }, 1000);
  }
  
  // Update particles position and create new ones
  function updateParticles(deltaTime) {
    // Update existing particles
    particlesPool.forEach(particle => {
      if (particle.userData.inUse) {
        // Update progress
        particle.userData.progress += deltaTime * particle.userData.speed;
        
        if (particle.userData.progress >= 1) {
          // Reset particle
          particle.userData.inUse = false;
          particle.visible = false;
        } else {
          // Calculate position along the path
          const pointIndex = Math.floor(particle.userData.progress * (particle.userData.connection.userData.points.length - 1));
          const remainingProgress = particle.userData.progress * (particle.userData.connection.userData.points.length - 1) - pointIndex;
          
          if (pointIndex < particle.userData.connection.userData.points.length - 1) {
            const currentPoint = particle.userData.connection.userData.points[pointIndex];
            const nextPoint = particle.userData.connection.userData.points[pointIndex + 1];
            
            // Interpolate between points
            particle.position.lerpVectors(currentPoint, nextPoint, remainingProgress);
          }
        }
      }
    });
    
    // Create new particles - less frequently on mobile
    const particleMultiplier = isMobile ? 1.5 : 1.0;
    
    nodeConnections.forEach(connection => {
      connection.userData.nextParticleTime -= deltaTime;
      
      if (connection.userData.nextParticleTime <= 0) {
        // Reset timer with random interval - slower on mobile
        connection.userData.nextParticleTime = connection.userData.isMajorConnection ? 
                                               (1.5 + Math.random() * 3) * particleMultiplier : 
                                               (3 + Math.random() * 6) * particleMultiplier;
        
        // 50% chance to skip particle creation for minor connections (70% on mobile)
        const skipChance = isMobile ? 0.7 : 0.5;
        if (!connection.userData.isMajorConnection && Math.random() < skipChance) {
          return;
        }
        
        // Create new particle
        const particle = getAvailableParticle();
        if (particle) {
          particle.userData.inUse = true;
          particle.userData.progress = 0;
          particle.userData.speed = connection.userData.isMajorConnection ? 
                                    0.4 + Math.random() * 0.3 : // Faster for major connections
                                    0.2 + Math.random() * 0.2;  // Slower for minor connections
          particle.userData.connection = connection;
          
          // Set initial position
          particle.position.copy(connection.userData.points[0]);
          
          // Make visible
          particle.visible = true;
          
          // Adjust size based on connection importance
          particle.scale.set(
            connection.userData.isMajorConnection ? 1.5 : 1,
            connection.userData.isMajorConnection ? 1.5 : 1,
            connection.userData.isMajorConnection ? 1.5 : 1
          );
        }
      }
    });
  }
  
  // Resize brain network when window size changes
  function resizeBrainNetwork() {
    // Recalculate scale factors based on new screen dimensions
    const newScaleFactor = calculateScaleFactor();
    const newCameraDistance = calculateCameraDistance();
    
    // Update camera
    camera.position.z = newCameraDistance;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // Reset scene positioning
    const newIsPortrait = window.innerHeight > window.innerWidth;
    scene.position.y = newIsPortrait ? 2 : 0;
    
    // Update node positions if we have original positions stored
    if (originalNodePositions.length > 0 && brainNodes.length > 0) {
      brainNodes.forEach((node, index) => {
        if (node.mesh && originalNodePositions[index]) {
          const original = originalNodePositions[index];
          
          // Apply new scale
          node.mesh.position.x = original.x * newScaleFactor.x;
          node.mesh.position.y = original.y * newScaleFactor.y;
          
          // Update node's position property
          if (node.position) {
            node.position.x = node.mesh.position.x;
            node.position.y = node.mesh.position.y;
          }
        }
      });
    }
    
    // Update renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  // Helper to check if a click/touch is on an interactive element
  function isInteractiveElement(event) {
    // If no specific target (e.g., during some synthetic events), assume not interactive
    if (!event || !event.target) return false;
    
    // Get the target element
    const target = event.target;
    
    // Check if it's the canvas itself - canvas should allow rotation
    if (target === renderer.domElement) return false;
    
    // Comprehensive list of elements to avoid rotating when clicking
    const interactiveSelectors = [
      '.node-label',           // Incident node labels
      '.search-container',     // Search bar and results
      '#configPanel',          // Config panel
      '#configButton',         // Config button
      '#resetViewButton',      // Reset view button
      '.incident-panel',       // Incident details panel
      '.incident-close-btn',   // Close button on incident panel
      '.step-item',            // Steps in incident details
      'input',                 // Any input elements
      'button',                // Any buttons
      'a',                     // Any links
      '.search-result-item',   // Search result items
      '.digital-counter',      // Digital counters in UI
      '.step-description'      // Step descriptions
    ];
    
    // Check if target or any parent matches the selectors
    for (const selector of interactiveSelectors) {
      if (target.matches && target.matches(selector)) return true;
      if (target.closest && target.closest(selector)) return true;
    }
    
    // Additional checks for specific element types
    if (target.tagName === 'INPUT' || 
        target.tagName === 'BUTTON' || 
        target.tagName === 'A' || 
        target.tagName === 'SELECT' || 
        target.tagName === 'TEXTAREA') {
      return true;
    }
    
    // Check for role attributes commonly used in interactive elements
    if (target.getAttribute && 
        (target.getAttribute('role') === 'button' || 
         target.getAttribute('role') === 'link' || 
         target.getAttribute('role') === 'menuitem')) {
      return true;
    }
    
    // Safe default - not an interactive element
    return false;
  }
  
  // Setup the 3D scene and start animation
  function initialize() {
    // Clear any background textures or cubes that might be in the scene
    renderer.setClearColor(0x000000, 1); // Set to pure black
    
    // Create stars first so they're at the back of the rendering order
    const stars = createStars();
    
    // Create brain nodes and connections
    createBrainNodes();
    createConnections();
    
    // Create brain glow effect
    const brainGlow = createBrainGlow();
    
    // Setup raycaster for interactions
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Track mouse position
    document.addEventListener('mousemove', (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });
    
    // Initialize particle system
    initializeParticleSystem();
    
    // Initialize security incident UI with camera control
    window.SecurityIncidents.initializeUI(
      (pause) => { isPaused = pause; },
      cameraControl
    );
    
    // Create security incident nodes
    window.SecurityIncidents.createNodes(brainNodes);
    
    // Setup incident node interactions
    window.SecurityIncidents.setupInteractions(raycaster, mouse, camera, brainNodes);
    window.brainNodes = brainNodes;
    
    // Add rotation controls - consolidated for desktop and mobile
    setupRotationControls();
    
    // Add specific mobile controls for pinch zoom
    if (isMobile) {
      setupMobilePinchZoom();
      createResetButton();
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
      // Check if orientation changed on mobile
      const wasPortrait = isPortrait;
      const newIsPortrait = window.innerHeight > window.innerWidth;
      
      resizeBrainNetwork();
      
      // Update orientation flag
      isPortrait = newIsPortrait;
    });
    
    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      
      // Get delta time once per frame
      const delta = clock.getDelta();
      
      if (!isPaused) {
        accumulatedTime += delta;
        
        // Update rotation with smooth interpolation
        updateRotation(delta);
        
        brainNodes.forEach(node => {
          if (node.mesh) {
            node.mesh.updateMatrix();
            node.mesh.updateMatrixWorld(true);
          }
        });
        
        // Animate security incident nodes
        window.SecurityIncidents.animateNodes(window.brainNodes || brainNodes, accumulatedTime);
      }
      
      // Always update camera zoom animation, even when paused
      // Use fixed delta time for more consistent animation speed
      cameraControl.update(Math.min(delta, 0.016)); // Limit delta to avoid large jumps
      
      // Render scene
      window.SecurityIncidents.updateNodeLabels(camera);
      renderer.render(scene, camera);
    }
    
    // Start animation
    animate();
  }
  
  // Update rotation based on various factors (auto, user control, inertia)
  function updateRotation(deltaTime) {
    // If user is actively controlling, they have full control
    if (userControlling) {
      // Apply rotation directly
      scene.rotation.x = targetRotationX;
      scene.rotation.y = targetRotationY;
      
      // Store current values for transitions
      currentRotationX = targetRotationX;
      currentRotationY = targetRotationY;
      return;
    }
    
    // Apply inertia if active
    if (rotationInertiaActive) {
      // Update rotation based on velocity
      targetRotationY += rotationVelocityY;
      targetRotationX += rotationVelocityX;
      
      // Apply damping
      rotationVelocityY *= rotationDamping;
      rotationVelocityX *= rotationDamping;
      
      // Stop inertia if velocity is very small
      if (Math.abs(rotationVelocityY) < 0.0002 && Math.abs(rotationVelocityX) < 0.0002) {
        rotationInertiaActive = false;
        // Resume auto rotation once inertia stops
        setTimeout(() => {
          enableAutoRotation = true;
        }, 500);
      }
      
      // Smooth interpolation to target rotation
      currentRotationY += (targetRotationY - currentRotationY) * 0.2;
      currentRotationX += (targetRotationX - currentRotationX) * 0.2;
      
      // Apply rotation
      scene.rotation.y = currentRotationY;
      scene.rotation.x = currentRotationX;
      return;
    }
    
    // Apply auto rotation when nothing else is controlling
    if (enableAutoRotation) {
      // Auto rotation with sine wave
      const targetAutoY = Math.sin(accumulatedTime * 0.1) * 0.08;
      const targetAutoX = Math.sin(accumulatedTime * 0.15) * 0.03;
      
      // Smoothly interpolate to auto rotation
      currentRotationY += (targetAutoY - currentRotationY) * 0.02;
      currentRotationX += (targetAutoX - currentRotationX) * 0.02;
      
      // Apply rotation
      scene.rotation.y = currentRotationY;
      scene.rotation.x = currentRotationX;
      
      // Update targets for smooth transition if user takes control
      targetRotationY = currentRotationY;
      targetRotationX = currentRotationX;
    }
  }
  
  // Setup consolidated rotation controls for both desktop and mobile
  function setupRotationControls() {
    // State variables
    let isPointerDown = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let pointerDownTime = 0;
    
    // Mouse down / touch start
    document.addEventListener(isMobile ? 'touchstart' : 'mousedown', function(event) {
      // For touch events, use the first touch point
      const clientX = isMobile ? event.touches[0].clientX : event.clientX;
      const clientY = isMobile ? event.touches[0].clientY : event.clientY;
      
      // Skip if interactive element
      if (isInteractiveElement(event)) return;
      
      // Start rotation control
      isPointerDown = true;
      lastPointerX = clientX;
      lastPointerY = clientY;
      pointerDownTime = Date.now();
      
      // Disable auto rotation
      enableAutoRotation = false;
      userControlling = true;
      
      // Stop any inertia
      rotationInertiaActive = false;
      rotationVelocityX = 0;
      rotationVelocityY = 0;
      
      // Store current rotation as target
      targetRotationY = scene.rotation.y;
      targetRotationX = scene.rotation.x;
      
      // Reset tracking variables for inertia
      dragDeltaX = 0;
      dragDeltaY = 0;
      
      // Prevent default behavior only on non-interactive elements
      if (event.preventDefault) event.preventDefault();
    }, { passive: false });
    
    // Mouse move / touch move
    document.addEventListener(isMobile ? 'touchmove' : 'mousemove', function(event) {
      if (!isPointerDown) return;
      
      // For touch events, use the first touch point
      const clientX = isMobile ? event.touches[0].clientX : event.clientX;
      const clientY = isMobile ? event.touches[0].clientY : event.clientY;
      
      // Calculate movement delta
      const deltaX = clientX - lastPointerX;
      const deltaY = clientY - lastPointerY;
      
      // Update tracking for inertia
      dragDeltaX = deltaX;
      dragDeltaY = deltaY;
      lastDragTime = Date.now();
      
      // Apply rotation with sensitivity adjustment
      targetRotationY += deltaX * rotationSensitivity;
      targetRotationX += deltaY * rotationSensitivity;
      
      // Clamp vertical rotation to avoid flipping
      targetRotationX = Math.max(Math.min(targetRotationX, Math.PI / 4), -Math.PI / 4);
      
      // Update last position
      lastPointerX = clientX;
      lastPointerY = clientY;
      
      // Clear any pending timeout
      if (dragTimeout) clearTimeout(dragTimeout);
      
      // Set a timeout to detect when dragging stops without pointer up
      dragTimeout = setTimeout(() => {
        if (isPointerDown) {
          isPointerDown = false;
          userControlling = false;
          startInertiaRotation();
        }
      }, 150);
      
      // Prevent default to avoid page scrolling during drag
      if (event.preventDefault) event.preventDefault();
    }, { passive: false });
    
    // Mouse up / touch end
    document.addEventListener(isMobile ? 'touchend' : 'mouseup', function(event) {
      if (!isPointerDown) return;
      
      isPointerDown = false;
      userControlling = false;
      
      // Calculate time since pointer down
      const releaseTime = Date.now();
      const pressDuration = releaseTime - pointerDownTime;
      
      // Start inertia if drag was recent and not a click/tap
      if (pressDuration > 100) {
        startInertiaRotation();
      } else {
        // If it was a quick tap/click with minimal movement, just resume auto rotation
        setTimeout(() => {
          enableAutoRotation = true;
        }, 300);
      }
    });
    
    // Pointer leave - handle case when pointer exits window
    document.addEventListener(isMobile ? 'touchcancel' : 'mouseleave', function() {
      if (isPointerDown) {
        isPointerDown = false;
        userControlling = false;
        startInertiaRotation();
      }
    });
  }
  
  // Initialize inertia based on recent drag speed
  function startInertiaRotation() {
    // Calculate how recent the last drag was
    const timeSinceLastDrag = Date.now() - lastDragTime;
    
    // Only apply inertia if the drag was recent and had significant movement
    if (timeSinceLastDrag < 100 && (Math.abs(dragDeltaX) > 0.5 || Math.abs(dragDeltaY) > 0.5)) {
      // Scale factor for inertia - higher = stronger effect
      const inertiaFactor = 0.003;
      
      // Calculate velocities based on recent movement
      rotationVelocityY = dragDeltaX * inertiaFactor;
      rotationVelocityX = dragDeltaY * inertiaFactor;
      
      // Activate inertia
      rotationInertiaActive = true;
    } else {
      // If no recent movement, just resume auto rotation after a delay
      setTimeout(() => {
        enableAutoRotation = true;
      }, 500);
    }
  }
  
  // Setup mobile-specific pinch zoom controls
  function setupMobilePinchZoom() {
    let initialPinchDistance = 0;
    
    document.addEventListener('touchstart', function(e) {
      if (e.touches.length === 2) {
        initialPinchDistance = getPinchDistance(e);
        
        // Stop auto rotation during pinch zoom
        enableAutoRotation = false;
      }
    });
    
    document.addEventListener('touchmove', function(e) {
      if (e.touches.length === 2) {
        const currentDistance = getPinchDistance(e);
        const delta = currentDistance - initialPinchDistance;
        
        // Only handle significant changes
        if (Math.abs(delta) > 5) {
          // Zoom in or out
          const zoomFactor = delta > 0 ? -1 : 1;
          camera.position.z += zoomFactor * 1.5;
          
          // Limit zoom range
          const minZ = isPortrait ? 25 : 20;
          const maxZ = isPortrait ? 60 : 45;
          
          if (camera.position.z < minZ) camera.position.z = minZ;
          if (camera.position.z > maxZ) camera.position.z = maxZ;
          
          camera.updateProjectionMatrix();
          initialPinchDistance = currentDistance;
        }
      }
    });
    
    document.addEventListener('touchend', function(e) {
      // Resume auto rotation after pinch zoom if no fingers remain
      if (e.touches.length === 0) {
        setTimeout(() => {
          enableAutoRotation = true;
        }, 500);
      }
    });
    
    // Helper function to calculate distance between touch points
    function getPinchDistance(e) {
      return Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }
  
  // Create reset view button for mobile
  function createResetButton() {
    if (document.getElementById('resetViewButton')) return;
    
    const resetBtn = document.createElement('button');
    resetBtn.id = 'resetViewButton';
    resetBtn.textContent = 'Reset View';
    resetBtn.style.position = 'fixed';
    resetBtn.style.bottom = '15px';
    resetBtn.style.left = '0';
    resetBtn.style.right = '0';
    resetBtn.style.margin = '0 auto';
    resetBtn.style.width = '150px';
    resetBtn.style.zIndex = '9000';
    resetBtn.style.background = 'rgba(0, 20, 50, 0.8)';
    resetBtn.style.color = '#66ccff';
    resetBtn.style.border = '1px solid rgba(0, 100, 200, 0.4)';
    resetBtn.style.borderRadius = '20px';
    resetBtn.style.padding = '10px 12px';
    resetBtn.style.fontFamily = "'Exo 2', sans-serif";
    resetBtn.style.fontSize = '14px';
    resetBtn.style.cursor = 'pointer';
    resetBtn.style.fontWeight = 'bold';
    resetBtn.style.boxShadow = '0 0 15px rgba(0, 100, 255, 0.3)';
    
    resetBtn.addEventListener('click', function() {
      // Reset rotation state
      targetRotationX = 0;
      targetRotationY = 0;
      currentRotationX = 0;
      currentRotationY = 0;
      
      // Reset scene rotation immediately
      scene.rotation.x = 0;
      scene.rotation.y = 0;
      
      // Reset velocities and inertia
      rotationVelocityX = 0;
      rotationVelocityY = 0;
      rotationInertiaActive = false;
      
      // Re-enable auto-rotation
      enableAutoRotation = true;
      
      // Reset camera position
      const newIsPortrait = window.innerHeight > window.innerWidth;
      camera.position.z = calculateCameraDistance();
      camera.position.y = 0;
      camera.position.x = 0;
      camera.updateProjectionMatrix();
      
      // Recalculate and apply scaling
      const newScaleFactor = calculateScaleFactor();
      
      // Center appropriately
      scene.position.y = newIsPortrait ? 2 : 0;
      
      // Update node positions if we have original positions stored
      if (originalNodePositions.length > 0 && brainNodes.length > 0) {
        brainNodes.forEach((node, index) => {
          if (node.mesh && originalNodePositions[index]) {
            const original = originalNodePositions[index];
            
            // Apply new scale
            node.mesh.position.x = original.x * newScaleFactor.x;
            node.mesh.position.y = original.y * newScaleFactor.y;
            
            // Update node's position property
            if (node.position) {
              node.position.x = node.mesh.position.x;
              node.position.y = node.mesh.position.y;
            }
          }
        });
      }
      
      // Give visual feedback
      this.textContent = "✓ View Reset";
      setTimeout(() => {
        this.textContent = "Reset View";
      }, 1000);
    });
    
    document.body.appendChild(resetBtn);
  }
  
  // Start everything
  initialize();
});
