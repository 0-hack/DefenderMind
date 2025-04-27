const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Add robust error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
// Updated defaultIncidents with the new type structure
const defaultIncidents = [
  {
    title: 'Phishing',
    steps: [
      {
        title: 'Identify phishing email',
        description: 'Analyze suspicious emails for common phishing indicators such as spoofed sender addresses, suspicious links, urgent language, or unexpected attachments.',
        type: 'standard'
      },
      {
        title: 'Check email content',
        description: 'Determine what type of phishing attempt this is based on the content.',
        type: 'condition',
        conditions: [
          {
            title: 'Contains malicious URL',
            target: 'next',
            description: 'The email contains suspicious links that may lead to credential theft or malware.'
          },
          {
            title: 'Contains attachment',
            target: 'Malware Attack',
            targetIndex: 100,
            description: 'The email contains suspicious attachments that may contain malware.'
          },
          {
            title: 'Credential phishing',
            target: 'step:4',
            description: 'The email attempts to steal credentials without attachments or links.'
          }
        ]
      },
      {
        title: 'Report to security team',
        description: 'Forward the suspected phishing email to the security team immediately using the established reporting process.',
        type: 'standard'
      },
      {
        title: 'Block sender domain',
        description: 'Add the malicious sender domain to email filtering systems to prevent further messages from reaching users.',
        type: 'standard'
      },
      {
        title: 'Scan affected systems',
        description: 'Run full malware scans on any systems that may have interacted with the phishing content.',
        type: 'standard'
      },
      {
        title: 'Train users on spotting phishing',
        description: 'Conduct targeted training with affected users and send organization-wide reminders about phishing awareness.',
        type: 'standard',
        links: [
          {
            title: 'View Ransomware Response Plan',
            target: 'Ransomware',
            targetIndex: 50,
            description: 'If ransomware is suspected, follow the dedicated response plan'
          }
        ]
      }
    ],
    index: 20,
    color: '#FFCC00'
  },
  {
    title: 'Ransomware',
    steps: [
      {
        title: 'Isolate infected machines',
        description: 'Immediately disconnect affected systems from the network to prevent lateral movement and further encryption.',
        type: 'standard'
      },
      {
        title: 'Disable shared drives',
        description: 'Turn off access to networked storage to minimize the spread of encryption across shared resources.',
        type: 'standard'
      },
      {
        title: 'Assess encryption scope',
        description: 'Determine the extent of encryption and affected systems.',
        type: 'condition',
        conditions: [
          {
            title: 'Limited encryption',
            target: 'next',
            description: 'Only a few systems are affected, and damage is limited.'
          },
          {
            title: 'Widespread encryption',
            target: 'step:5',
            description: 'Multiple systems or critical infrastructure is encrypted.'
          },
          {
            title: 'Potential data theft',
            target: 'DDoS Attack',
            targetIndex: 80,
            description: 'Evidence suggests data exfiltration before encryption. Follow the data breach protocol.'
          }
        ]
      },
      {
        title: 'Notify IT security',
        description: 'Engage the incident response team with details of the attack and affected systems.',
        type: 'standard'
      },
      {
        title: 'Begin backups restore',
        description: 'Prepare clean systems and begin restoration process from verified offline backups.',
        type: 'standard'
      },
      {
        title: 'Conduct forensic analysis',
        description: 'Analyze attack vectors, ransomware variant, and IOCs to improve defense and share intelligence.',
        type: 'standard',
        links: [
          {
            title: 'Check for malware persistence',
            target: 'Malware Attack',
            targetIndex: 100,
            description: 'Follow the malware response plan to ensure complete removal'
          }
        ]
      }
    ],
    index: 50,
    color: '#FF6666'
  },
  {
    title: 'DDoS Attack',
    steps: [
      {
        title: 'Alert hosting provider',
        description: 'Contact your hosting or cloud provider immediately to activate their DDoS mitigation services.',
        type: 'standard'
      },
      {
        title: 'Activate rate-limiting',
        description: 'Implement rate limiting at your edge network to reduce the impact of the incoming traffic flood.',
        type: 'standard'
      },
      {
        title: 'Assess attack type',
        description: 'Determine the type of DDoS attack to implement appropriate countermeasures.',
        type: 'condition',
        conditions: [
          {
            title: 'Volumetric attack',
            target: 'next',
            description: 'Attack that attempts to consume bandwidth with high volume of traffic.'
          },
          {
            title: 'Application layer attack',
            target: 'step:4',
            description: 'Attack targeting application resources and processes.'
          },
          {
            title: 'Mixed or advanced attack',
            target: 'step:5',
            description: 'Sophisticated attack using multiple vectors or techniques.'
          }
        ]
      },
      {
        title: 'Deploy WAF/anti-DDoS',
        description: 'Enable Web Application Firewall rules specifically designed to filter attack traffic patterns.',
        type: 'standard'
      },
      {
        title: 'Monitor attack source',
        description: 'Analyze traffic to identify attack signatures, source IPs, and attack methods being used.',
        type: 'standard'
      },
      {
        title: 'Block bad IPs or geo-ranges',
        description: 'Implement IP blocking for identified attack sources or entire geographic regions if necessary.',
        type: 'standard',
        links: [
          {
            title: 'Check for data exfiltration',
            target: 'Malware Attack',
            targetIndex: 100,
            description: 'DDoS attacks are sometimes used as a smokescreen for data theft'
          }
        ]
      }
    ],
    index: 80,
    color: '#66CCFF'
  },
  {
    title: 'Malware Attack',
    steps: [
      {
        title: 'Isolate affected systems',
        description: 'Immediately remove infected systems from the network to prevent malware from spreading.',
        type: 'standard'
      },
      {
        title: 'Determine malware type',
        description: 'Identify the specific type of malware to guide the response.',
        type: 'condition',
        conditions: [
          {
            title: 'Trojan/Backdoor',
            target: 'next',
            description: 'Malware that provides unauthorized access to the system.'
          },
          {
            title: 'Ransomware',
            target: 'Ransomware',
            targetIndex: 50,
            description: 'Malware that encrypts files and demands ransom payment.'
          },
          {
            title: 'Worm/Self-propagating',
            target: 'step:4',
            description: 'Malware capable of spreading through the network automatically.'
          }
        ]
      },
      {
        title: 'Block suspicious connections',
        description: 'Identify and block any command and control traffic at the firewall and DNS levels.',
        type: 'standard'
      },
      {
        title: 'Scan for persistence mechanisms',
        description: 'Check for backdoors, scheduled tasks, registry modifications, and other persistence techniques.',
        type: 'standard'
      },
      {
        title: 'Remove malicious files',
        description: 'Clean systems using enterprise anti-malware tools or rebuild from trusted images if necessary.',
        type: 'standard'
      },
      {
        title: 'Patch vulnerable systems',
        description: 'Apply necessary security patches to prevent reinfection through the same vulnerability.',
        type: 'standard',
        links: [
          {
            title: 'Review phishing awareness',
            target: 'Phishing',
            targetIndex: 20,
            description: 'If malware originated from phishing, review the email security process'
          }
        ]
      }
    ],
    index: 100,
    color: '#99CC66'
  }
];

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (error) => {
  console.error('Server startup error:', error);
  process.exit(1);
});
