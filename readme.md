# Defender Mind

Defender Mind is an interactive 3D visualization platform for security incidents with integrated configuration and management capabilities.

Visit https://mind.defender.zone to experience.

## Overview

This application provides a visually engaging way to display, manage, and respond to security incidents through an interactive neural network visualization. Security incidents are represented as special nodes within a 3D brain-like network, with complete response playbooks that can be displayed when selected.

## Quick Start with Docker

The easiest way to run Defender Mind is using Docker Compose, which handles all dependencies automatically.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Running with Docker Compose

1. Clone or download this repository to your local machine:
   ```bash
   git clone https://github.com/0-hack/DefenderMind.git
   cd DefenderMind
   ```

2. Build and start the container:
   ```bash
   docker-compose up -d
   ```

3. Access the application in your web browser:
   ```
   http://localhost:3000
   ```

### Stopping the Application

To stop the application:
```bash
docker-compose down
```

## Key Features

- **Interactive 3D Brain Network Visualization**: Engaging visualization with responsive design for both desktop and mobile
- **Security Incident Management**: Create, edit, and manage security incident response playbooks
- **Decision-Based Playbooks**: Build incident response flows with conditional branches and decision points
- **Inter-Playbook Navigation**: Create links between different incident types for comprehensive response paths
- **Full-Text Search**: Quickly locate incidents by keywords in titles, steps, conditions, or descriptions
- **Step-by-Step Response Plans**: Each incident includes detailed steps for proper incident response
- **Configurable Incidents**: Add, edit, remove and customize security incidents with a built-in configuration panel
- **Persistent Storage**: All changes are automatically saved to a JSON file in a Docker volume
- **Mobile-Responsive Design**: Automatically adapts to different screen sizes and devices
- **Visual Customization**: Customize incident node colors and appearance
- **Export/Import**: Share incident configurations between deployments
- **Interactive Cursor Effects**: Subtle blue aurora follows cursor movements for enhanced visual experience
- **Camera Controls**: Smooth zooming and rotation for better incident exploration

## Visual Elements

- Animated 3D brain network with glowing nodes and connections
- Interactive security incident nodes with custom colors
- Floating labels that adapt to viewing angle and avoid overlapping
- Step-by-step incident response playbooks with expandable sections
- Conditional branching with visual decision points
- Subtle cursor aurora effects for better interactivity
- Responsive design that works on both desktop and mobile devices

## Incident Playbooks

Defender Mind uses an advanced playbook system with:

- **Standard Steps**: Regular response instructions with expandable details
- **Condition Steps**: Decision points with multiple paths based on scenario variations
- **Cross-Playbook Links**: Navigate between related incidents for comprehensive response
- **Target Step Navigation**: Jump to specific steps within the same or different playbooks
- **Visual Indicators**: Clear icons showing conditions and available links

## Configuration Interface
The in-app configuration panel allows you to:
- Add new security incidents
- Edit existing incidents and their response steps
- Create conditional branches with multiple response paths
- Establish links between different playbooks
- Customize colors and appearance
- Assign incidents to specific network nodes
- Export and import incident configurations

To access:
- Click the ⚙️ gear icon in the top right corner of the main interface
- Access the page directly at `http://localhost:3000/config.html`

## Public Display Mode

For public displays or shared environments where you don't want users to modify incidents, use the `DISABLE_CONFIG` environment variable:

1. Edit the `docker-compose.yml` file and set:
   ```yaml
   environment:
     - NODE_ENV=production
     - DISABLE_CONFIG=true
   ```

2. Restart the container:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

This will hide the configuration button entirely, making it impossible for users to modify incident data. The setting is controlled at the server level for improved security.

## Mobile Improvements

- Responsive design that adapts to different screen sizes
- Touch controls for rotating and zooming the brain network
- Incident node labels are clickable on mobile for easier interaction
- "Reset View" button on mobile to easily return to the default view
- Optimized rendering for better performance on mobile devices
- Pinch-to-zoom gesture support for intuitive navigation
- Automatic adaptation of network density and effects based on device capabilities
- Portrait and landscape mode optimizations

## Search Functionality

- Full-text search across all incident data
- Find incidents by title, step descriptions, or condition content
- Real-time search results with visual indicators
- Direct navigation to found incidents with automatic camera focus
- Highlights matching content in search results

## Persistence

All incident data is saved to a persistent Docker volume. This means your changes will be preserved even if you restart the container.

The default JSON file is stored in both the container at: `/app/data/security-incidents.json`

And in your host machine at: `/var/lib/docker/volumes/defendermind_defender-data/_data/security-incidents.json`

## Manual Data Export/Import

You can manually export and import data through the configuration interface:

1. Click the "⚙️" gear icon button to open the configuration panel
2. Use the "📤 Export" button to download a JSON file
3. Use the "📥 Import" button to load a JSON file

## Default Incidents

The application comes with several pre-configured incident types:
- Malware Attack
- Phishing
- DDoS Attack
- Ransomware Attack
- Data Breach
- Insider Threat
- Business Email Compromise

Each includes a comprehensive playbook with steps, conditions, and cross-references.

## Advanced Configuration

### Custom Port

To change the default port (3000), modify the `docker-compose.yml` file:

```yaml
services:
  defender-zone:
    ports:
      - "8080:3000"  # Change 8080 to your desired port
```

### Server-side Configuration

The application uses a simple Express.js server to handle:

- Serving static files
- Saving and loading incident data
- Configuration state management

### Updating Default Incidents

Default incidents are stored in `server.js` and automatically loaded when no JSON file exists. To change the defaults:

1. Edit the `DEFAULT_INCIDENTS` array in `server.js`
2. Rebuild the container: `docker-compose up -d --build`

## Rebuilding the Application

If you make changes to the source code and need to rebuild:

```bash
docker-compose up -d --build
```

## Technical Components

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **3D Rendering**: Three.js for brain network visualization
- **Backend**: Node.js with Express for saving configuration
- **Containerization**: Docker for easy deployment
- **Storage**: Local JSON file for persistent data

## Performance Considerations

- The application uses hardware acceleration for 3D rendering
- Mobile devices have optimized settings with fewer particles and effects
- Responsive design adapts visualization complexity based on device capabilities
- Brain network automatically scales based on screen dimensions
- Animations and effects are reduced on lower-powered devices

## Browser Compatibility

Tested and optimized for:
- Chrome (latest versions)
- Firefox (latest versions)
- Edge (latest versions)
- Safari (latest versions)

## OS Compatibility

Testing has primarily been performed on:
- Ubuntu 18.04 LTS
- Ubuntu 22.04 LTS

While the application should work on other operating systems, some bugs may surface on untested platforms.

## Troubleshooting

If you encounter issues:

- Check that Docker is running
- Ensure port 3000 is not already in use
- View logs with `docker-compose logs`
- Verify the correct environment variables are set in docker-compose.yml
- Check browser console for JavaScript errors
- Try clearing browser cache and refreshing
- For mobile issues, ensure your device supports WebGL

### Common Issues

1. **Black screen or no visualization**: Your browser may not support WebGL or have it disabled
2. **Configuration button not responding**: Check if configuration is disabled in environment variables
3. **Changes not saving**: Verify Docker volume permissions
4. **Slow performance**: Reduce browser window size or try a device with better graphics capabilities

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Sharing is caring, it's free buddy.

## Credits

- Three.js for 3D rendering capabilities
- Express.js for the backend server
- Docker for containerization
