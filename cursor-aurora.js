// More subtle Cursor Aurora Effect with smaller blue particles
document.addEventListener('DOMContentLoaded', function() {
  console.log("Cursor aurora script loaded");

  // Create canvas for cursor aurora
  const canvas = document.createElement('canvas');
  canvas.id = 'cursorAuroraCanvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none'; // Allow clicking through the canvas
  canvas.style.zIndex = '99'; // Higher z-index to ensure visibility
  document.body.appendChild(canvas);
  
  // Set canvas size to match window
  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  
  // Resize initially and on window resize
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Get canvas context
  const ctx = canvas.getContext('2d');
  
  // Aurora particles array
  const particles = [];
  
  // Cursor position tracking
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let lastMouseX = mouseX;
  let lastMouseY = mouseY;
  let mouseSpeed = 0;
  let mouseAngle = 0;
  
  // Create initial particles around cursor
  function createInitialParticles() {
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 15 + Math.random() * 30;
      
      particles.push({
        x: mouseX + Math.cos(angle) * distance,
        y: mouseY + Math.sin(angle) * distance,
        size: 2 + Math.random() * 3, // Smaller particles
        speedX: Math.cos(angle) * (0.5 + Math.random()),
        speedY: Math.sin(angle) * (0.5 + Math.random()),
        life: 0,
        maxLife: 40 + Math.random() * 20,
        color: getRandomColor(),
        sizeChange: 0.1 + Math.random() * 0.2
      });
    }
  }
  
  // Generate blue colors only
  function getRandomColor() {
    // Various shades of blue
    const hue = 210 + Math.random() * 30; // 210-240 (blue range)
    const saturation = 80 + Math.random() * 20; // Very saturated
    const lightness = 60 + Math.random() * 20; // Bright
    
    return `hsla(${hue}, ${saturation}%, ${lightness}%, `;
  }
  
  // Trigger initial mouse move
  setTimeout(() => {
    const event = new MouseEvent('mousemove', {
      'view': window,
      'bubbles': true,
      'cancelable': true,
      'clientX': window.innerWidth / 2,
      'clientY': window.innerHeight / 2
    });
    document.dispatchEvent(event);
  }, 500);
  
  // Track mouse movement
  document.addEventListener('mousemove', (e) => {
    // Calculate mouse speed and direction
    const dx = e.clientX - mouseX;
    const dy = e.clientY - mouseY;
    mouseSpeed = Math.sqrt(dx * dx + dy * dy);
    mouseAngle = Math.atan2(dy, dx);
    
    // Update current position
    lastMouseX = mouseX;
    lastMouseY = mouseY;
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Generate particles based on mouse speed
    const particleCount = Math.min(Math.floor(mouseSpeed / 3) + 1, 5); // Fewer particles
    for (let i = 0; i < particleCount; i++) {
      createParticle();
    }
  });
  
  // Create a new particle
  function createParticle() {
    // Random offset from cursor position
    const offset = 10; // Smaller offset for less spread
    const randomOffsetX = (Math.random() - 0.5) * offset;
    const randomOffsetY = (Math.random() - 0.5) * offset;
    
    // Create particle with direction based on mouse movement
    const directionVariation = (Math.random() - 0.5) * 0.5; // Less variance
    
    particles.push({
      x: mouseX + randomOffsetX,
      y: mouseY + randomOffsetY,
      size: 2 + Math.random() * 3, // Smaller particles
      speedX: -Math.cos(mouseAngle + directionVariation) * (1 + Math.random()), // Slower movement
      speedY: -Math.sin(mouseAngle + directionVariation) * (1 + Math.random()),
      life: 0,
      maxLife: 30 + Math.random() * 20,
      color: getRandomColor(),
      sizeChange: 0.1 + Math.random() * 0.3
    });
  }
  
  // Update and draw particles
  function updateParticles() {
    // Clear the canvas with a complete clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set blending for glow effect
    ctx.globalCompositeOperation = 'lighter';
    
    // Update all particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life++;
      
      // Remove dead particles
      if (p.life >= p.maxLife) {
        particles.splice(i, 1);
        continue;
      }
      
      // Calculate opacity based on life
      const lifeRatio = p.life / p.maxLife;
      const opacity = 1 - lifeRatio;
      
      // Update position
      p.x += p.speedX;
      p.y += p.speedY;
      
      // Dynamic size - grows then shrinks
      let sizeFactor;
      if (lifeRatio < 0.3) {
        // Grow at the beginning
        sizeFactor = p.size * (1 + lifeRatio);
      } else {
        // Shrink toward the end
        sizeFactor = p.size * (1.3 - lifeRatio * 0.5);
      }
      
      // Slower decay for more persistent effect
      p.speedX *= 0.97;
      p.speedY *= 0.97;
      
      // Draw outer glow (smaller)
      ctx.beginPath();
      const gradientOuter = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, sizeFactor * 2);
      gradientOuter.addColorStop(0, p.color + opacity * 0.2 + ')');
      gradientOuter.addColorStop(1, p.color + '0)');
      
      ctx.fillStyle = gradientOuter;
      ctx.arc(p.x, p.y, sizeFactor * 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw middle glow (smaller)
      ctx.beginPath();
      const gradientMid = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, sizeFactor);
      gradientMid.addColorStop(0, p.color + opacity * 0.5 + ')');
      gradientMid.addColorStop(1, p.color + opacity * 0.1 + ')');
      
      ctx.fillStyle = gradientMid;
      ctx.arc(p.x, p.y, sizeFactor, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw center
      ctx.beginPath();
      ctx.fillStyle = `hsla(${parseInt(p.color.substring(5, 8))}, 100%, 90%, ${opacity * 0.8})`;
      ctx.arc(p.x, p.y, sizeFactor * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add ambient particles when few particles exist
    if (particles.length < 30 && Math.random() > 0.9) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 10 + Math.random() * 30;
      
      particles.push({
        x: mouseX + Math.cos(angle) * distance,
        y: mouseY + Math.sin(angle) * distance,
        size: 1.5 + Math.random() * 2, // Even smaller ambient particles
        speedX: Math.cos(angle) * (0.3 + Math.random() * 0.5),
        speedY: Math.sin(angle) * (0.3 + Math.random() * 0.5),
        life: 0,
        maxLife: 20 + Math.random() * 15,
        color: getRandomColor(),
        sizeChange: 0.05 + Math.random() * 0.15
      });
    }
    
    // Continue animation
    requestAnimationFrame(updateParticles);
  }
  
  // Create initial particles
  createInitialParticles();
  
  // Start animation
  updateParticles();
});