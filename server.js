// Required imports
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Setup Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));

// Configuration options
const disableConfig = process.env.DISABLE_CONFIG === 'true';

// Make config status available to the client
app.get('/config-status', (req, res) => {
  res.json({
    disableConfig: disableConfig
  });
});

// If configuration is disabled, redirect config.html to index.html
if (disableConfig) {
  app.get('/config.html', (req, res) => {
    res.redirect('/index.html');
  });
}

// Static file serving - comes after the config.html redirect for correct precedence
app.use(express.static(path.join(__dirname)));

// Data paths
const dataDir = path.join(__dirname, 'data');
const incidentsFilePath = path.join(dataDir, 'security-incidents.json');

// Default incidents for first-time initialization
const DEFAULT_INCIDENTS = [
  {
    title: 'Malware Attack',
    steps: [
      {
        title: 'Initial Detection & Containment',
        description: 'Immediately isolate affected systems from the network. Document initial indicators including timestamp of detection, affected systems, and observable symptoms.',
        type: 'standard'
      },
      {
        title: 'Assess Malware Type',
        description: 'Identify the specific malware family and threat actor if possible. Use sandbox analysis and threat intelligence sources.',
        type: 'condition',
        conditions: [
          {
            title: 'Ransomware Detected',
            target: 'Ransomware Attack',
            targetIndex: 95,
            description: 'Encryption behaviors detected - follow ransomware response protocol'
          },
          {
            title: 'Data Exfiltration Malware',
            target: 'Data Breach',
            targetIndex: 55,
            description: 'Evidence of data theft behaviors - follow data breach protocol'
          },
          {
            title: 'Trojan/Backdoor',
            target: 'step:3',
            description: 'Malware providing persistent unauthorized access to systems'
          },
          {
            title: 'Worm/Self-propagating',
            target: 'step:4',
            description: 'Malware with lateral movement capabilities spreading through network'
          }
        ]
      },
      {
        title: 'Establish Incident Scope',
        description: 'Create inventory of all affected systems. Determine entry vector, timeline, and potentially compromised accounts. Review related logs including network flow, authentication, and endpoint activity.',
        type: 'standard'
      },
      {
        title: 'Block Command & Control',
        description: 'Identify and block malware command & control channels at network boundary. Update firewall rules, DNS blocks, and email filtering settings to prevent further communication.',
        type: 'standard',
        links: [
          {
            title: 'Document IoCs & Engage Threat Intelligence Team',
            target: 'Data Breach',
            targetIndex: 55,
            targetStep: 3,
            description: 'Document IoCs and engage the threat intelligence team for contextual analysis'
          },
          {
            title: 'Investigate Possible Insider Involvement',
            target: 'Insider Threat',
            targetIndex: 80,
            targetStep: 1,
            description: 'If the infection vector suggests internal assistance, investigate potential insider threat'
          }
        ]
      },
      {
        title: 'Remove Malware & Persistence Mechanisms',
        description: 'Check for backdoors, scheduled tasks, registry modifications, and other persistence techniques. Scan with enterprise anti-malware tools. Look for living-off-the-land techniques.',
        type: 'standard'
      },
      {
        title: 'Recovery & Verification',
        description: 'Restore systems from clean backups or rebuild from trusted images. Verify systems are free of malware through scanning and monitoring for suspicious activity.',
        type: 'standard'
      },
      {
        title: 'Patch & Harden Systems',
        description: 'Apply necessary security patches to remediate the vulnerability that led to the attack. Implement additional security controls to prevent similar incidents.',
        type: 'standard'
      },
      {
        title: 'Post-Incident Analysis',
        description: 'Document lessons learned including successes, challenges, and improvement areas. Update incident response procedures based on findings. Consider advanced detection rules for similar future attacks.',
        type: 'standard',
        links: [
          {
            title: 'Review Phishing Prevention',
            target: 'Phishing',
            targetIndex: 45,
            targetStep: 5,
            description: 'If malware originated from phishing, review email security measures'
          }
        ]
      }
    ],
    index: 20,
    color: '#99CC66'
  },
  {
    title: 'Phishing',
    steps: [
      {
        title: 'Acknowledge & Document Report',
        description: 'Record initial report information including reporting user, timestamp, and email details. Preserve original email headers and attachment information.',
        type: 'standard'
      },
      {
        title: 'Analyze Phishing Message',
        description: 'Securely analyze email content, links, attachments, sender information, and impersonation attempts. Look for suspicious domains, brand impersonation, and urgent language.',
        type: 'condition',
        conditions: [
          {
            title: 'Credential Harvesting',
            target: 'step:3',
            description: 'Email contains links to fake login pages designed to steal credentials'
          },
          {
            title: 'Malicious Attachment',
            target: 'Malware Attack',
            targetIndex: 20,
            targetStep: 1,
            description: 'Email contains malware-laden attachments like documents with macros or executable files'
          },
          {
            title: 'Business Email Compromise',
            target: 'Business Email Compromise',
            targetIndex: 30,
            targetStep: 1,
            description: 'Targeted attempt to impersonate executive or vendor for financial fraud'
          },
          {
            title: 'Reconnaissance/Relationship Building',
            target: 'step:5',
            description: 'Early-stage phishing without malicious payload, focused on building trust or gathering information'
          }
        ]
      },
      {
        title: 'Assess Exposure & Impact',
        description: 'Determine if users interacted with the phishing content (clicked links, downloaded attachments, entered credentials). Review email server logs and web proxy logs for evidence of access.',
        type: 'standard'
      },
      {
        title: 'Implement Immediate Containment',
        description: 'Block sender domains in email gateway. Remove phishing email from all inboxes. Block malicious URLs at the web proxy and DNS level. Isolate any potentially compromised devices.',
        type: 'standard'
      },
      {
        title: 'Credential Compromise Response',
        description: 'For credential theft attempts, force password resets for targeted accounts. Enable MFA where possible. Monitor for suspicious login activity. Check for mail forwarding rules or delegations.',
        type: 'standard',
        links: [
          {
            title: 'Investigate Potential Data Breach',
            target: 'Data Breach',
            targetIndex: 55,
            targetStep: 3,
            description: 'If credentials were compromised, investigate potential data access/exfiltration'
          }
        ]
      },
      {
        title: 'Communication & User Guidance',
        description: 'Send organization-wide awareness message with screenshots and specific warning indicators. Provide clear reporting instructions for similar messages.',
        type: 'standard',
        links: [
          {
            title: 'Check for Malware Infection',
            target: 'Malware Attack',
            targetIndex: 20,
            targetStep: 0,
            description: 'If users interacted with attachments, investigate potential malware infection'
          }
        ]
      },
      {
        title: 'Report to External Parties',
        description: 'Report phishing site to hosting providers, domain registrars, and anti-phishing partnerships. Report impersonated brands to their security teams. Share IOCs with industry groups.',
        type: 'standard'
      },
      {
        title: 'Enhance Security Controls',
        description: 'Update email security rules based on observed techniques. Add discovered IOCs to security tools. Consider enhancements to email filtering, attachment scanning, or link protection.',
        type: 'standard',
        links: [
          {
            title: 'Review BEC Prevention',
            target: 'Business Email Compromise',
            targetIndex: 30,
            targetStep: 7,
            description: 'If phishing involved executive impersonation, review BEC prevention measures'
          }
        ]
      }
    ],
    index: 45,
    color: '#FFCC00'
  },
  {
    title: 'DDoS Attack',
    steps: [
      {
        title: 'Detect & Validate Attack',
        description: 'Confirm legitimate DDoS attack vs. system issue or traffic spike. Gather network traffic data, system performance metrics, and user impact reports.',
        type: 'standard'
      },
      {
        title: 'Implement Emergency Response',
        description: 'Activate DDoS response team. Alert key stakeholders and management. Begin attack documentation including start time, affected systems, and observable symptoms.',
        type: 'standard'
      },
      {
        title: 'Assess Attack Characteristics',
        description: 'Analyze attack type, volume, source IPs, and targeted services or infrastructure.',
        type: 'condition',
        conditions: [
          {
            title: 'Network/Transport Layer (L3/L4)',
            target: 'step:4',
            description: 'Volumetric attacks including UDP/TCP floods, amplification attacks, SYN floods'
          },
          {
            title: 'Application Layer (L7)',
            target: 'step:5',
            description: 'HTTP/HTTPS floods, slow attacks, API abuse targeting application resources'
          },
          {
            title: 'Multi-vector Attack',
            target: 'step:6',
            description: 'Sophisticated attack using multiple attack methods simultaneously'
          },
          {
            title: 'Potential Diversionary Attack',
            target: 'Ransomware Attack',
            targetIndex: 95,
            targetStep: 0,
            description: 'DDoS appears to be a smokescreen for other attacks like ransomware deployment'
          }
        ]
      },
      {
        title: 'Network-Level Mitigation',
        description: 'Implement traffic filtering at edge routers. Apply rate limiting. Activate BGP flowspec rules. Engage ISP for upstream filtering. Consider blackhole routing for severe attacks.',
        type: 'standard'
      },
      {
        title: 'Application Protection',
        description: 'Implement Web Application Firewall rules. Enable bot protection measures. Adjust application throttling and caching. Scale application resources if possible.',
        type: 'standard'
      },
      {
        title: 'Activate External Mitigation',
        description: 'Engage DDoS protection service provider. Implement traffic scrubbing. Consider CDN activation or scaling. Request additional protections from cloud service providers.',
        type: 'standard'
      },
      {
        title: 'Monitor Mitigation Effectiveness',
        description: 'Continuously analyze traffic patterns. Adjust mitigation strategies based on attack evolution. Maintain communication with stakeholders about status.',
        type: 'standard',
        links: [
          {
            title: 'Check for Data Exfiltration',
            target: 'Data Breach',
            targetIndex: 55,
            targetStep: 0,
            description: 'DDoS attacks are sometimes used as a smokescreen for data theft'
          },
          {
            title: 'Investigate Malware Activity',
            target: 'Malware Attack',
            targetIndex: 20,
            targetStep: 2,
            description: 'Search for malware that may have been deployed during DDoS distraction'
          }
        ]
      },
      {
        title: 'Service Restoration',
        description: 'Gradually restore services with monitoring. Verify application functionality. Communicate status updates to users and stakeholders. Maintain heightened monitoring.',
        type: 'standard'
      },
      {
        title: 'Post-Attack Analysis',
        description: 'Document attack details, timeline, source information, and mitigation effectiveness. Update protection mechanisms based on observations. Consider threat intelligence for attribution.',
        type: 'standard'
      }
    ],
    index: 70,
    color: '#66CCFF'
  },
  {
    title: 'Ransomware Attack',
    steps: [
      {
        title: 'Initial Containment & Isolation',
        description: 'Immediately disconnect affected systems from the network. Disable shared network resources. Take critical systems offline. Document initial indicators and affected systems.',
        type: 'standard'
      },
      {
        title: 'Activate Incident Response Team',
        description: 'Declare formal security incident. Assemble technical response team. Engage legal, communications, and executive stakeholders. Establish command center and communication channels.',
        type: 'standard'
      },
      {
        title: 'Assess Ransomware Variant & Scope',
        description: 'Identify ransomware family and specific variant. Determine encryption mechanism if possible. Document ransom note details, bitcoin addresses, and attacker communication methods.',
        type: 'condition',
        conditions: [
          {
            title: 'Limited System Encryption',
            target: 'step:4',
            description: 'Few non-critical systems encrypted, limited operational impact'
          },
          {
            title: 'Critical System Encryption',
            target: 'step:5',
            description: 'Business-critical systems or data encrypted, significant operational impact'
          },
          {
            title: 'Enterprise-wide Encryption',
            target: 'step:6',
            description: 'Widespread encryption across multiple systems and locations'
          },
          {
            title: 'Data Theft Evidence',
            target: 'Data Breach',
            targetIndex: 55,
            targetStep: 2,
            description: 'Indicators of data exfiltration prior to encryption (double extortion attack)'
          }
        ]
      },
      {
        title: 'Evidence Preservation',
        description: 'Collect and preserve ransomware binaries. Create disk images of affected systems. Save memory dumps if possible. Document encrypted file extensions and ransom note content.',
        type: 'standard'
      },
      {
        title: 'Engage External Support',
        description: 'Contact cyber insurance provider. Engage external forensic team if needed. Consider FBI/law enforcement notification. Consult legal counsel regarding regulatory requirements.',
        type: 'standard'
      },
      {
        title: 'Attacker Communication Assessment',
        description: 'Determine whether to engage with attackers (consult legal and management). If communicating, use separate devices and designated personnel. Document all interactions.',
        type: 'condition',
        conditions: [
          {
            title: 'No Communication/No Payment',
            target: 'step:8',
            description: 'Organization decides not to engage or pay'
          },
          {
            title: 'Negotiate/Gather Intelligence',
            target: 'step:7',
            description: 'Communicate with attackers to gather information or verify decryption capability'
          }
        ]
      },
      {
        title: 'Ransom Payment Consideration',
        description: 'Assess legal and regulatory implications of payment. Verify decryption capability (request sample decryption). Prepare cryptocurrency if payment approved. Document decision process.',
        type: 'standard'
      },
      {
        title: 'Recovery & Restoration',
        description: 'Begin systematic restoration from clean backups. Prioritize critical business systems. Scan all systems before reconnection. Rebuild systems that cannot be recovered.',
        type: 'standard',
        links: [
          {
            title: 'Check for persistence mechanisms',
            target: 'Malware Attack',
            targetIndex: 20,
            targetStep: 4,
            description: 'Look for backdoors and other persistence mechanisms before restoration'
          },
          {
            title: 'Investigate Initial Access Vector',
            target: 'Phishing',
            targetIndex: 45,
            targetStep: 1,
            description: 'If phishing was the suspected entry point, review email security'
          }
        ]
      },
      {
        title: 'Security Gap Remediation',
        description: 'Address initial access vector. Implement enhanced monitoring. Deploy additional preventative controls. Consider architectural improvements for segmentation.',
        type: 'standard'
      },
      {
        title: 'Business Continuity Improvement',
        description: 'Enhance backup strategy based on lessons learned. Update disaster recovery procedures. Test restoration processes. Conduct tabletop exercises for future incidents.',
        type: 'standard',
        links: [
          {
            title: 'Investigate Potential Insider Involvement',
            target: 'Insider Threat',
            targetIndex: 80,
            targetStep: 1,
            description: 'If internal assistance is suspected, investigate potential insider involvement'
          }
        ]
      }
    ],
    index: 95,
    color: '#FF6666'
  },
  {
    title: 'Data Breach',
    steps: [
      {
        title: 'Initial Assessment & Containment',
        description: 'Document initial indicators of compromise and affected systems. Contain affected systems by isolation or account restrictions. Preserve forensic evidence and establish incident timeline.',
        type: 'standard'
      },
      {
        title: 'Assemble Response Team',
        description: 'Activate incident response team with technical, legal, communications, and executive representation. Establish secure communication channels. Brief key stakeholders on initial findings.',
        type: 'standard'
      },
      {
        title: 'Validate Data Compromise',
        description: 'Confirm actual data exfiltration vs. access only. Identify compromised data types (PII, financial, intellectual property, credentials, etc.).',
        type: 'condition',
        conditions: [
          {
            title: 'Regulated Data Exposed',
            target: 'step:4',
            description: 'Breach involving regulated data (PII, PHI, financial, etc.) requiring notification'
          },
          {
            title: 'Intellectual Property Theft',
            target: 'step:5',
            description: 'Theft of trade secrets, product information, or other intellectual property'
          },
          {
            title: 'Credential Compromise',
            target: 'step:6',
            description: 'User account or system credentials exposed'
          },
          {
            title: 'Third-party/Supply Chain',
            target: 'step:7',
            description: 'Breach affecting vendor systems or data shared with third parties'
          }
        ]
      },
      {
        title: 'Forensic Investigation',
        description: 'Determine attack vectors, timeline, attacker activity, and data access/exfiltration scope. Identify affected records count and impacted individuals. Collect evidence for potential legal proceedings.',
        type: 'standard',
        links: [
          {
            title: 'Investigate Insider Involvement',
            target: 'Insider Threat',
            targetIndex: 80,
            targetStep: 2,
            description: 'If internal involvement is suspected, initiate insider threat investigation'
          }
        ]
      },
      {
        title: 'Legal & Regulatory Assessment',
        description: 'Evaluate notification requirements under relevant regulations (GDPR, HIPAA, state laws, etc.). Determine contractual obligations with clients, partners, and vendors. Consider law enforcement notification.',
        type: 'standard'
      },
      {
        title: 'Credential Reset & Access Control',
        description: 'Force password changes for affected accounts. Review and restrict privileged access. Implement additional authentication controls. Monitor for unauthorized access attempts.',
        type: 'standard',
        links: [
          {
            title: 'Prevent Further Access',
            target: 'Malware Attack',
            targetIndex: 20,
            targetStep: 3,
            description: 'Check for and block malware command & control channels'
          }
        ]
      },
      {
        title: 'Third-party/Vendor Coordination',
        description: 'Engage affected third parties. Coordinate response activities with vendors. Review and enhance vendor security requirements. Consider contract modifications for future engagements.',
        type: 'standard',
        links: [
          {
            title: 'Check for Business Email Compromise',
            target: 'Business Email Compromise',
            targetIndex: 30,
            targetStep: 1,
            description: 'Investigate if vendor emails were compromised for fraudulent purposes'
          }
        ]
      },
      {
        title: 'Prepare Notifications',
        description: 'Draft notifications for affected individuals, regulators, partners, and other stakeholders. Prepare customer support resources, FAQs, and credit monitoring services if appropriate.',
        type: 'standard'
      },
      {
        title: 'External Communications',
        description: 'Execute communication plan with prepared statements. Provide consistent messaging across channels. Establish media response team. Monitor social media and coverage.',
        type: 'standard'
      },
      {
        title: 'Long-term Remediation',
        description: 'Develop and implement enhanced data protection controls. Conduct security architecture review. Update security monitoring capabilities. Consider structural changes to reduce risk.',
        type: 'standard'
      }
    ],
    index: 55,
    color: '#CC66FF'
  },
  {
    title: 'Insider Threat',
    steps: [
      {
        title: 'Receive & Validate Alert',
        description: 'Document initial indicators of suspicious activity. Validate alert authenticity. Preserve evidence of unusual access or data movement. Establish incident timeline based on available logs.',
        type: 'standard'
      },
      {
        title: 'Preliminary Investigation',
        description: 'Carefully review logs without alerting subject. Check for unusual access patterns, data transfers, or privilege escalation. Document findings with timestamps and affected systems.',
        type: 'standard'
      },
      {
        title: 'Assess Insider Activity',
        description: 'Categorize the type of insider threat activity based on evidence.',
        type: 'condition',
        conditions: [
          {
            title: 'Data Exfiltration',
            target: 'Data Breach',
            targetIndex: 55,
            targetStep: 2,
            description: 'Employee stealing sensitive information for personal gain or to share with competitors'
          },
          {
            title: 'Sabotage',
            target: 'step:4',
            description: 'Intentional damage to systems, data, or operations'
          },
          {
            title: 'Unauthorized Access',
            target: 'step:5',
            description: 'Accessing systems or data beyond authorized permissions'
          },
          {
            title: 'Policy Violation',
            target: 'step:6',
            description: 'Misuse of resources or violation of acceptable use policies without malicious intent'
          }
        ]
      },
      {
        title: 'Engage Required Stakeholders',
        description: 'Assemble specialized response team including HR, legal, executive management, and physical security. Maintain strict confidentiality about the investigation. Document all discussions and decisions.',
        type: 'standard'
      },
      {
        title: 'Detailed Evidence Collection',
        description: 'Conduct thorough forensic analysis of affected systems. Review email/communication content if legally permitted. Document chain of custody for all evidence. Prepare for potential legal proceedings.',
        type: 'standard'
      },
      {
        title: 'Access Control Actions',
        description: 'Implement appropriate access restrictions based on threat severity. Monitor subject\'s activities without alerting if investigation continues. Prepare for potential immediate termination of access.',
        type: 'standard'
      },
      {
        title: 'Develop Action Plan',
        description: 'Coordinate with HR and legal on employee interview strategy. Prepare for potential disciplinary actions. Create evidence presentation package for HR/legal proceedings.',
        type: 'standard'
      },
      {
        title: 'Execute Response Actions',
        description: 'Conduct employee interview with proper representation. Implement decided personnel actions (suspension, termination, etc.). Secure physical assets including badges, devices, and physical access.',
        type: 'standard',
        links: [
          {
            title: 'Check for Data Exposure',
            target: 'Data Breach',
            targetIndex: 55,
            targetStep: 7,
            description: 'If data was exposed, prepare appropriate notifications'
          },
          {
            title: 'Investigate Malware Involvement',
            target: 'Malware Attack',
            targetIndex: 20,
            targetStep: 2,
            description: 'Check if insider installed malware or backdoors'
          }
        ]
      },
      {
        title: 'Containment & Recovery',
        description: 'Reset affected passwords and access credentials. Recover or secure exposed data if possible. Implement additional monitoring on affected systems. Review access logs for related activity.',
        type: 'standard'
      },
      {
        title: 'Control Improvement',
        description: 'Review access controls and permission structures. Enhance monitoring for similar behavior patterns. Update insider threat program based on lessons learned. Consider security awareness improvements.',
        type: 'standard'
      }
    ],
    index: 80,
    color: '#FF9933'
  },
  {
    title: 'Business Email Compromise',
    steps: [
      {
        title: 'Detect & Validate Incident',
        description: 'Document suspicious email or activity. Determine if email is truly fraudulent through header analysis, sender verification, and content review. Preserve original email with complete headers.',
        type: 'standard'
      },
      {
        title: 'Initial Assessment',
        description: 'Identify targeted employees, impersonated executives, and requested actions. Document financial or data transfer requests. Determine if any action has been taken on fraudulent requests.',
        type: 'condition',
        conditions: [
          {
            title: 'Executive Impersonation',
            target: 'step:3',
            description: 'Attacker impersonating C-level executive requesting action'
          },
          {
            title: 'Vendor/Supplier Fraud',
            target: 'step:4',
            description: 'Compromise or impersonation of vendor email to redirect payments'
          },
          {
            title: 'Account Compromise',
            target: 'step:5',
            description: 'Actual compromise of internal email account being used for fraud'
          },
          {
            title: 'Attorney Impersonation',
            target: 'step:6',
            description: 'Impersonation of legal counsel requesting confidential information or urgent wire transfers'
          }
        ]
      },
      {
        title: 'Contain & Block Executive Impersonation',
        description: 'Identify if funds or data were transferred. If financial transaction occurred, contact financial institutions immediately to recall funds. Implement email blocks for spoofed executive addresses.',
        type: 'standard'
      },
      {
        title: 'Address Vendor Email Compromise',
        description: 'Contact vendor through verified phone numbers (not email) to confirm legitimacy. Place holds on recent or pending payments. Verify and update vendor banking details through secure channels.',
        type: 'standard'
      },
      {
        title: 'Remediate Account Compromise',
        description: 'Force password reset on compromised account. Enable MFA if not already active. Review and remove suspicious inbox rules, delegates, and forwarding. Check for other compromised accounts.',
        type: 'standard',
        links: [
          {
            title: 'Investigate Malware Presence',
            target: 'Malware Attack',
            targetIndex: 20,
            targetStep: 0,
            description: 'Check for malware that may have led to credential compromise'
          },
          {
            title: 'Assess Data Access',
            target: 'Data Breach',
            targetIndex: 55,
            targetStep: 2,
            description: 'Determine if sensitive data was accessed through compromised account'
          }
        ]
      },
      {
        title: 'Mitigate Attorney Impersonation',
        description: 'Establish verified contact with actual legal counsel. Create special verification procedures for legal requests. Review any information already shared. Implement specific filtering for legal domains.',
        type: 'standard'
      },
      {
        title: 'Financial Recovery Efforts',
        description: 'If funds were transferred, work with financial institutions on recall. File reports with FBI IC3, FinCEN, and relevant financial crime units. Document all recovery attempts for insurance claims.',
        type: 'standard'
      },
      {
        title: 'Implement Protective Measures',
        description: 'Create warning banners for external emails. Implement DMARC, SPF, and DKIM if not already in place. Configure additional rules for executive names in external emails. Review financial approval processes.',
        type: 'standard'
      },
      {
        title: 'Training & Awareness',
        description: 'Conduct targeted training for finance, executive assistants, and other high-risk employees. Create BEC-specific examples with recent attempt details. Implement verification procedures for financial requests.',
        type: 'standard',
        links: [
          {
            title: 'Review Phishing Protections',
            target: 'Phishing',
            targetIndex: 45,
            targetStep: 7,
            description: 'Enhance email security rules and protections'
          },
          {
            title: 'Insider Threat Assessment',
            target: 'Insider Threat',
            targetIndex: 80,
            targetStep: 1,
            description: 'If internal assistance is suspected, investigate potential insider involvement'
          }
        ]
      }
    ],
    index: 30,
    color: '#FF99CC'
  }
];

// Initialize data directory and default incidents file if needed
function initializeDataDirectory() {
  try {
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      console.log(`Creating data directory: ${dataDir}`);
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Check if incidents file exists
    if (!fs.existsSync(incidentsFilePath)) {
      console.log(`Incidents file not found at: ${incidentsFilePath}`);
      console.log('Creating default incidents file');
      
      // Write default incidents to file
      fs.writeFileSync(incidentsFilePath, JSON.stringify(DEFAULT_INCIDENTS, null, 2));
      console.log(`Default incidents saved to: ${incidentsFilePath}`);
    } else {
      console.log(`Using existing incidents file: ${incidentsFilePath}`);
    }
  } catch (err) {
    console.error('Error initializing data directory:', err);
  }
}

// Call initialization function
initializeDataDirectory();

// Route to save incidents
app.post('/save-incidents', (req, res) => {
  // Check if configuration is disabled
  if (disableConfig) {
    return res.status(403).json({ success: false, message: 'Configuration is disabled' });
  }

  const incidents = req.body;
  
  // Validate that incidents is an array
  if (!Array.isArray(incidents)) {
    return res.status(400).json({ success: false, message: 'Invalid data format. Expected an array.' });
  }

  try {
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Write to file with pretty formatting
    fs.writeFileSync(incidentsFilePath, JSON.stringify(incidents, null, 2));
    console.log(`Saved ${incidents.length} incidents to ${incidentsFilePath}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving incidents:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Route to load incidents explicitly (useful for config page)
app.get('/load-incidents', (req, res) => {
  try {
    if (fs.existsSync(incidentsFilePath)) {
      const fileData = fs.readFileSync(incidentsFilePath, 'utf8');
      const incidents = JSON.parse(fileData);
      
      if (Array.isArray(incidents)) {
        console.log(`Loaded ${incidents.length} incidents from ${incidentsFilePath}`);
        res.json(incidents);
      } else {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid data format in incidents file'
        });
      }
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Incidents file not found, default incidents will be used'
      });
    }
  } catch (err) {
    console.error('Error loading incidents:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Route to download incidents file
app.get('/download-incidents', (req, res) => {
  try {
    if (fs.existsSync(incidentsFilePath)) {
      // Set headers for attachment download
      res.setHeader('Content-Disposition', 'attachment; filename=security-incidents.json');
      res.setHeader('Content-Type', 'application/json');
      
      // Stream the file directly
      const fileStream = fs.createReadStream(incidentsFilePath);
      fileStream.pipe(res);
    } else {
      res.status(404).json({ success: false, message: 'Incidents file not found' });
    }
  } catch (err) {
    console.error('Error downloading incidents:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Handle 404 errors
app.use((req, res, next) => {
  if (req.path.endsWith('.html') || req.path === '/') {
    // Check if requested page exists
    const requestedPath = req.path === '/' ? '/index.html' : req.path;
    const filePath = path.join(__dirname, requestedPath);
    
    if (!fs.existsSync(filePath)) {
      // Redirect to index.html if file doesn't exist
      return res.redirect('/index.html');
    }
  }
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Configuration interface is ${disableConfig ? 'disabled' : 'enabled'}`);
  console.log(`Data directory: ${dataDir}`);
});
