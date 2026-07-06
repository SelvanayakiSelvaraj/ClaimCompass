/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { 
  UserProfile, 
  AidProgram, 
  Application, 
  ApplicationStatus, 
  StatusHistoryEntry, 
  ActivityNotification, 
  DashboardStats 
} from './src/types.js';

// Resolve directory name for ESM / CommonJS compatibility
const currentDirname = typeof __dirname !== 'undefined'
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));

// Initialize Gemini SDK if API Key is available
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log('Gemini AI initialized for realistic agent story generation.');
  } catch (err) {
    console.warn('Information: Gemini SDK optional initialization did not complete (will use seeding):', err);
  }
} else {
  console.log('No GEMINI_API_KEY found. Agent will use pre-seeded narrative patterns.');
}

// In-Memory Database State
let userProfile: UserProfile | null = null;
let applications: Application[] = [];
let statusHistory: StatusHistoryEntry[] = [];
let notifications: ActivityNotification[] = [];

// Seeded programs in Indian Rupees (₹)
const SEEDED_PROGRAMS: AidProgram[] = [
  {
    id: 'pm-kisan-disaster',
    name: 'PM-KISAN Emergency Agricultural & Asset Grant',
    agency: 'Ministry of Agriculture & Farmers Welfare, India',
    disasterType: ['flood', 'wildfire', 'hurricane', 'earthquake'],
    maxAward: 45000,
    description: 'Provides direct financial assistance to agricultural and rural households suffering from immediate asset, soil, or equipment damage following a declared natural calamity.',
    requirementsDescription: 'Requires rural location, total annual household income under ₹1,50,000, and verified household damage.',
    eligibilityCriteria: {
      maxIncome: 150000,
    }
  },
  {
    id: 'ndrf-structural',
    name: 'NDRF Urgent Structural Rehabilitation Grant',
    agency: 'National Disaster Management Authority (NDMA)',
    disasterType: ['hurricane', 'wildfire', 'flood', 'earthquake'],
    maxAward: 350000,
    description: 'Assists families with severe structural damages to their primary homes. Funds are meant for rebuilding support, debris clearance, and structural stabilization.',
    requirementsDescription: 'Requires legal homeowner occupancy and verified structural instability.',
    eligibilityCriteria: {
      occupancyType: ['homeowner']
    }
  },
  {
    id: 'sdrf-household',
    name: 'SDRF Immediate Household & Subsistence Support',
    agency: 'State Disaster Response Force (SDRF)',
    disasterType: ['hurricane', 'wildfire', 'flood', 'earthquake', 'other'],
    maxAward: 25000,
    description: 'Provides immediate cash support for purchasing food, clothing, clean drinking water, medical supplies, and temporary household goods immediately after an evacuation.',
    requirementsDescription: 'Available for any disaster survivor. Open to both renters and homeowners.',
    eligibilityCriteria: {}
  },
  {
    id: 'pm-cares-rehab',
    name: "Prime Minister's Citizen Assistance (PM-CARES) Rehabilitation Fund",
    agency: "Prime Minister's Office (PMO)",
    disasterType: ['hurricane', 'wildfire', 'flood', 'earthquake', 'other'],
    maxAward: 800000,
    description: 'A comprehensive rehabilitation grant designed for vulnerable segments (households with special needs, disabled members, language barriers, or critical income deficits) experiencing severe losses.',
    requirementsDescription: 'Requires household income under ₹4,000,000 and presence of special needs/disability or severe shelter loss.',
    eligibilityCriteria: {
      maxIncome: 400000,
      requiresSpecialNeeds: true
    }
  },
  {
    id: 'pmfby-crop-asset',
    name: 'National Crop & Property Insurance Co-Fund (PMFBY)',
    agency: 'Agricultural Insurance Company of India',
    disasterType: ['flood', 'wildfire', 'hurricane'],
    maxAward: 180000,
    description: 'Bridges the gap between private/cooperative crop or home insurance coverage and the real damage value incurred during natural catastrophes.',
    requirementsDescription: 'Requires active property or crop insurance coverage.',
    eligibilityCriteria: {
      requiresInsurance: true
    }
  },
  {
    id: 'red-cross-mutual-aid',
    name: 'Disaster Coalition Mutual Cash Relief',
    agency: 'Indian Red Cross Society & NGO Alliance',
    disasterType: ['hurricane', 'wildfire', 'flood', 'earthquake', 'other'],
    maxAward: 15000,
    description: 'Immediate, unconditional mutual aid funds disbursed within 48 hours for vulnerable and uninsured families, especially renters who lack structural coverage.',
    requirementsDescription: 'Requires uninsured status and annual household income under ₹2,50,000.',
    eligibilityCriteria: {
      maxIncome: 250000,
      requiresUninsured: true
    }
  }
];

// Express App Setup
const app = express();
app.use(express.json());


// Helper to calculate total stats
function calculateStats(): DashboardStats {
  const matched = applications.length;
  const submitted = applications.filter(a => 
    a.status !== 'matched' && a.status !== 'auto_filled'
  ).length;
  const approved = applications.filter(a => a.status === 'approved').length;
  const estTotalAidAmount = applications.reduce((acc, app) => {
    if (app.status === 'approved') {
      return acc + (app.amountApproved || 0);
    } else if (app.status !== 'denied') {
      // Estimated pending/eligible aid
      return acc + app.amountRequested;
    }
    return acc;
  }, 0);

  return {
    totalMatched: matched,
    applicationsSubmitted: submitted,
    applicationsApproved: approved,
    estTotalAidAmount: estTotalAidAmount
  };
}

// REST Endpoints
app.get('/api/programs', (req, res) => {
  res.json(SEEDED_PROGRAMS);
});

app.get('/api/profile', (req, res) => {
  res.json(userProfile);
});

app.post('/api/profile', (req, res) => {
  const profile: UserProfile = req.body;
  userProfile = profile;
  
  // Clean start on profile submit: Perform Eligibility Match!
  applications = [];
  statusHistory = [];
  notifications = [];
  
  const matches = SEEDED_PROGRAMS.filter(program => {
    // 1. Disaster type check
    if (!program.disasterType.includes(profile.disasterType)) {
      return false;
    }
    // 2. Max income check
    if (program.eligibilityCriteria.maxIncome && profile.incomeBracket > program.eligibilityCriteria.maxIncome) {
      return false;
    }
    // 3. Occupancy check
    if (program.eligibilityCriteria.occupancyType && !program.eligibilityCriteria.occupancyType.includes(profile.occupancyType)) {
      return false;
    }
    // 4. Insurance requirements
    if (program.eligibilityCriteria.requiresInsurance && profile.insuranceStatus !== 'insured') {
      return false;
    }
    if (program.eligibilityCriteria.requiresUninsured && profile.insuranceStatus !== 'uninsured') {
      return false;
    }
    // 5. Special needs check
    if (program.eligibilityCriteria.requiresSpecialNeeds && !profile.hasSpecialNeeds) {
      return false;
    }
    return true;
  });

  // Create initial 'matched' applications
  matches.forEach(prog => {
    const requested = Math.round(prog.maxAward * (0.7 + Math.random() * 0.3)); // Request between 70% and 100% of max
    const app: Application = {
      id: `app-${prog.id}-${Date.now()}`,
      userId: 'default-user',
      programId: prog.id,
      programName: prog.name,
      agency: prog.agency,
      status: 'matched',
      amountRequested: requested,
      lastUpdated: new Date().toISOString(),
      missingDocuments: getRequiredDocumentsForProgram(prog, profile),
      submittedDocuments: []
    };
    applications.push(app);

    // Initial match notification
    const notif: ActivityNotification = {
      id: `notif-match-${prog.id}-${Date.now()}`,
      userId: 'default-user',
      applicationId: app.id,
      type: 'match',
      title: 'Program Eligibility Match',
      message: `ReliefPath mapped your profile and matched you with: ${prog.name}. Potential assistance of up to ₹${prog.maxAward.toLocaleString('en-IN')}.`,
      timestamp: new Date().toISOString(),
      status: 'unread',
      severity: 'info'
    };
    notifications.push(notif);

    // Add status history
    statusHistory.push({
      id: `history-match-${prog.id}-${Date.now()}`,
      applicationId: app.id,
      programName: prog.name,
      previousStatus: 'none',
      newStatus: 'matched',
      timestamp: new Date().toISOString(),
      reasoning: `ReliefPath autonomous agent analyzed geographic records, income tiers, and residency details to confirm eligibility for ${prog.name}.`
    });
  });

  // Trigger immediate async agent workflow step
  broadcastState();

  res.json({ success: true, matchedCount: matches.length, profile });
});

app.get('/api/applications', (req, res) => {
  res.json(applications);
});

app.get('/api/history', (req, res) => {
  res.json(statusHistory);
});

app.get('/api/notifications', (req, res) => {
  res.json(notifications);
});

app.post('/api/notifications/:id/read', (req, res) => {
  const notif = notifications.find(n => n.id === req.params.id);
  if (notif) {
    notif.status = 'read';
  }
  res.json({ success: true });
});

app.get('/api/stats', (req, res) => {
  res.json(calculateStats());
});

app.post('/api/applications/:id/upload', (req, res) => {
  const { documentName } = req.body;
  const appItem = applications.find(a => a.id === req.params.id);
  if (appItem && documentName) {
    // Remove from missing, add to submitted
    appItem.missingDocuments = appItem.missingDocuments.filter(d => d !== documentName);
    if (!appItem.submittedDocuments.includes(documentName)) {
      appItem.submittedDocuments.push(documentName);
    }
    appItem.lastUpdated = new Date().toISOString();

    // If it was in 'documents_requested' state, move to 'resubmitted'
    const prevStatus = appItem.status;
    if (appItem.status === 'documents_requested' && appItem.missingDocuments.length === 0) {
      appItem.status = 'resubmitted';
      
      const notif: ActivityNotification = {
        id: `notif-upload-${appItem.id}-${Date.now()}`,
        userId: 'default-user',
        applicationId: appItem.id,
        type: 'doc_request',
        title: 'Documents Successfully Resubmitted',
        message: `Your missing document "${documentName}" was auto-packaged by ReliefPath agent and resubmitted to ${appItem.agency}.`,
        timestamp: new Date().toISOString(),
        status: 'unread',
        severity: 'success'
      };
      notifications.unshift(notif);

      // Add status history
      statusHistory.unshift({
        id: `history-resub-${appItem.id}-${Date.now()}`,
        applicationId: appItem.id,
        programName: appItem.programName,
        previousStatus: prevStatus,
        newStatus: 'resubmitted',
        timestamp: new Date().toISOString(),
        reasoning: `ReliefPath successfully captured, encrypted, and compiled your uploaded document "${documentName}" and forwarded it directly to the agency's secondary processing portal.`
      });
    } else {
      // Just general upload notification
      const notif: ActivityNotification = {
        id: `notif-upload-gen-${appItem.id}-${Date.now()}`,
        userId: 'default-user',
        applicationId: appItem.id,
        type: 'doc_request',
        title: 'Document Added to Vault',
        message: `Successfully uploaded ${documentName} to document vault.`,
        timestamp: new Date().toISOString(),
        status: 'unread',
        severity: 'info'
      };
      notifications.unshift(notif);
    }

    broadcastState();
    res.json({ success: true, application: appItem });
  } else {
    res.status(404).json({ error: 'Application or document not specified' });
  }
});

app.post('/api/reset', (req, res) => {
  userProfile = null;
  applications = [];
  statusHistory = [];
  notifications = [];
  broadcastState();
  res.json({ success: true });
});

// Chatbot endpoint with preferred language support
app.post('/api/chat', async (req, res) => {
  const { message, history, language } = req.body;
  const selectedLanguage = language || 'English';

  if (ai) {
    try {
      const systemInstruction = `You are ReliefBot, an empathetic, helpful disaster relief assistant for ClaimCompass.
Your primary role is to help disaster survivors navigate relief programs, understand their application status, manage documents in the vault, and explain details of their active cases.
The user's preferred language is: ${selectedLanguage}. You MUST converse entirely in ${selectedLanguage}.
If the user's message is in a different language, translate it mentally but respond beautifully and gracefully in ${selectedLanguage}.
Be compassionate and supportive as the user is a survivor of a recent disaster. Use rich Markdown format with bullet points where appropriate.`;

      const contents = [];
      if (history && Array.isArray(history)) {
        history.forEach((h: { role: 'user' | 'model'; text: string }) => {
          contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          });
        });
      }
      
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
        }
      });

      const responseText = response.text || "I apologize, but I could not formulate a response at this time.";
      res.json({ text: responseText });
    } catch (err) {
      console.warn('Gemini chatbot temporary rate-limit/quota notice, running fallback engine:', err);
      res.json({ text: getLocalFallbackResponse(message, selectedLanguage) });
    }
  } else {
    res.json({ text: getLocalFallbackResponse(message, selectedLanguage) });
  }
});

function getLocalFallbackResponse(message: string, language: string): string {
  const normalizedLang = language.toLowerCase();
  
  if (normalizedLang.includes('hindi') || normalizedLang.includes('hi')) {
    return `रिलीफबॉट (ReliefBot) में आपका स्वागत है। मैं आपकी पसंदीदा भाषा **हिन्दी** में सहायता करने के लिए तैयार हूँ।

मैं एक एआई-संचालित सहायक हूँ और निम्नलिखित विषयों में आपकी मदद कर सकता हूँ:
1. **योग्यता मैपिंग (Eligibility Matching)**: आपकी सहायता राशि योग्यताओं की जाँच करना (जैसे पीएम-किसान, एनडीआरएफ, एसडीआरएफ)।
2. **दस्तावेज़ प्रबंधन (Document Management)**: यह जाँचना कि कौन-से दस्तावेज़ जैसे आधार कार्ड या घर के कागजात आपके आवेदन के लिए आवश्यक हैं।
3. **स्थिति अपडेट (Status Tracking)**: आपकी सक्रिय राहत फाइलों की लाइव प्रगति और समीक्षा इतिहास को समझना।

कृपया मुझे बताएं कि मैं आपकी क्या सहायता कर सकता हूँ!`;
  }
  
  if (normalizedLang.includes('tamil') || normalizedLang.includes('ta')) {
    return `ரிலீஃப்பாட் (ReliefBot) உதவி மையத்திற்கு உங்களை வரவேற்கிறோம். உங்களது விருப்பமான மொழியான **தமிழ்** மூலம் உரையாட நான் தயாராக உள்ளேன்.

உங்களுக்கு உதவக்கூடிய சில முக்கிய அம்சங்கள்:
1. **தகுதி மானிய விவரங்கள்**: பிஎம்-கிசான் (PM-KISAN), என்டிஆர்எஃப் (NDRF), மற்றும் எஸ்டிஆர்எஃப் (SDRF) போன்ற நிவாரண நிதி திட்டங்களுடன் உங்கள் சுயவிவரத்தைப் பொருத்துதல்.
2. **ஆவண மேலாண்மை**: தேவையான சான்றிதழ்கள், ஆதார் மற்றும் சொத்து ஆவணங்களை உங்கள் பெட்டகத்தில் சமர்ப்பிப்பதை சரிபார்த்தல்.
3. **விண்ணப்பத்தின் தற்போதைய நிலை**: உங்கள் விண்ணப்பங்கள் ஏன் 'மதிப்பாய்வு' அல்லது 'அங்கீகரிக்கப்பட்டது' என்ற நிலைக்கு மாறின என்பதைக் கண்டறிதல்.

உங்களுக்கு நான் எவ்வாறு உதவ வேண்டும் என்பதைத் தயவுசெய்து கூறுங்கள்!`;
  }

  if (normalizedLang.includes('telugu') || normalizedLang.includes('te')) {
    return `రిలీఫ్ బాట్ (ReliefBot) సహాయ కేంద్రానికి స్వాగతం. మీ ప్రాధాన్యత కలిగిన **తెలుగు** భాషలో మీకు సేవలు అందించడానికి నేను సిద్ధంగా ఉన్నాను.

నేను మీకు ఈ క్రింది విషయాలలో సహాయపడగలను:
1. **సహాయ నిధుల అర్హత**: పిఎమ్-కిసాన్, ఎన్ డి ఆర్ ఎఫ్, మరియు ఎస్ డి ఆర్ ఎఫ్ గ్రాంట్లకు మీ అర్హతలను సరిపోల్చడం.
2. **డాక్యుమెంట్ల నిర్వహణ**: మీ దరఖాస్తుకు అవసరమైన ఆధార్, ఇంటి రిజిస్ట్రేషన్ పత్రాలు వంటి వివరాలను సమీక్షించడం.
3. **దరఖాస్తు స్థితి పరిశీలన**: మీ అప్లికేషన్ ప్రాసెస్ ఏ దశలో ఉందో అర్థం చేసుకోవడం.

నేను మీకు ఏ విధంగా సహాయం చేయగలను? దయచేసి నాకు తెలియజేయండి!`;
  }

  if (normalizedLang.includes('bengali') || normalizedLang.includes('bn')) {
    return `রিলিফবট (ReliefBot) সহায়তা কেন্দ্রে আপনাকে স্বাগত। আপনার পছন্দের ভাষা **বাংলা**-তে আপনাকে সাহায্য করতে আমি প্রস্তুত।

আমি আপনাকে নিম্নলিখিত বিষয়ে সহায়তা করতে পারি:
1. **যোগ্যতা নিরূপণ**: পিএম-কিসান, এনডিআরএফ, এবং এসডিআরএফ তহবিলের সাথে আপনার প্রোফাইল মিলিয়ে নেওয়া।
2. **নথিপত্র যাচাইকরণ**: আপনার আবেদনের জন্য প্রয়োজনীয় আধার কার্ড বা সম্পত্তির দলিল ইত্যাদি নিরীক্ষণ করা।
3. **আবেদনের অগ্রগতি**: আপনার ত্রাণ আবেদনের বর্তমান অবস্থা এবং ইতিহাস ট্র্যাক করা।

দয়া করে বলুন আমি আপনাকে কীভাবে সাহায্য করতে পারি!`;
  }

  return `Welcome to **ReliefBot**, your ClaimCompass disaster relief companion! I am ready to assist you in **English**.

Here is how I can help you manage your relief applications:
1. **Eligibility & Grants**: I can map your profile status against PM-KISAN, NDRF, and SDRF grants.
2. **Document Checklist**: I can help you understand what files are required (like Aadhaar card, damage photos, or renter leases) to unblock pending reviews.
3. **Status Transitions**: I can explain the stages of your application, such as why it transitioned to 'Under Review' or 'Action Needed'.

Please ask me any questions about your dossier, matched programs, or missing documents!`;
}


// Helper to determine program missing documents
function getRequiredDocumentsForProgram(program: AidProgram, profile: UserProfile): string[] {
  const docs = ['Identity Proof (Aadhaar / Voter ID)'];
  if (profile.occupancyType === 'homeowner') {
    docs.push('Property Registry / Homeowner Deed');
    docs.push('Damage Photos (Before/After)');
  } else {
    docs.push('Active Rent Agreement');
  }
  if (profile.insuranceStatus === 'insured') {
    docs.push('Insurance Policy Copy');
    docs.push('Insurance Claim Rejection or Gap Letter');
  }
  if (profile.hasSpecialNeeds) {
    docs.push('Medical Certificate / Disability Proof');
  }
  return docs;
}

// WebSocket Setup
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('Client connected to WebSocket. Total:', clients.size);

  // Send current state on connect
  sendFullState(ws);

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected from WebSocket. Total:', clients.size);
  });

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message.toString());
      if (parsed.type === 'auth') {
        console.log('User authorized in WebSocket session');
        sendFullState(ws);
      }
    } catch (err) {
      console.warn('Information: Handled optional WS payload parse event:', err);
    }
  });
});

function sendFullState(ws: WebSocket) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'full_state',
      payload: {
        profile: userProfile,
        applications,
        statusHistory,
        notifications,
        stats: calculateStats()
      }
    }));
  }
}

function broadcastState() {
  const data = JSON.stringify({
    type: 'full_state',
    payload: {
      profile: userProfile,
      applications,
      statusHistory,
      notifications,
      stats: calculateStats()
    }
  });
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Dynamic Narrative Story Generator (combines rules with Gemini API fallback)
async function generateNarrativeStory(
  programName: string,
  agency: string,
  prevStatus: string,
  nextStatus: ApplicationStatus,
  profile: UserProfile,
  amount: number
): Promise<string> {
  const disasterName = profile.disasterType.charAt(0).toUpperCase() + profile.disasterType.slice(1);
  const rupeesFormatted = `₹${amount.toLocaleString('en-IN')}`;

  if (ai) {
    const prompt = `You are the narrative engine for ClaimCompass, an autonomous AI-powered disaster aid agent that assists survivors of a ${profile.disasterType} disaster.
Generate a professional, reassuring, and highly realistic single-sentence update log for the status change of the application.
Details:
- User Name: ${profile.name}
- Location: ${profile.address}
- Disaster: ${disasterName}
- Program: ${programName}
- Agency: ${agency}
- Previous Status: ${prevStatus}
- New Status: ${nextStatus}
- Amount: ${rupeesFormatted}
- Occupancy Type: ${profile.occupancyType}
- Insurance: ${profile.insuranceStatus === 'insured' ? 'Insured' : 'Uninsured'}
- Special Needs: ${profile.hasSpecialNeeds ? 'Yes (requires language/disability access)' : 'No'}

Generate a crisp, factual narrative story from the perspective of either the ClaimCompass autonomous agent or the processing agency office (e.g. "The ClaimCompass agent auto-completed form NDRF-IV-B using secure location coordinates..." or "State reviewer completed inspection of homeowner deed...").
Keep it under 35 words. Return ONLY the sentence. No extra characters or quotes.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });
      const text = response.text?.trim();
      if (text) {
        return text;
      }
    } catch (err) {
      console.log('Gemini API quota notice. Using backup narrative template engine:', err);
    }
  }

  // Backup Template Narrative Generator
  switch (nextStatus) {
    case 'auto_filled':
      return `ClaimCompass agent successfully compiled and auto-filled the online relief application forms, linking verified geo-coordinates from ${profile.address}.`;
    case 'submitted':
      return `ClaimCompass autonomous submission engine established secure portal access with ${agency} and submitted the complete dossier.`;
    case 'under_review':
      return `An agency officer at ${agency} has been assigned to your case and is actively reviewing the structural/income eligibility parameters.`;
    case 'documents_requested':
      const doc = profile.occupancyType === 'homeowner' ? 'Property Registry / Homeowner Deed' : 'Active Rent Agreement';
      return `The agency has requested additional proof. Specifically: ${doc}. ClaimCompass has flagged this in your Document Vault.`;
    case 'resubmitted':
      return `ClaimCompass gathered and encrypted the newly-uploaded document, packaging it with your existing file for official re-submission.`;
    case 'approved':
      return `CONGRATULATIONS: ${agency} officially approved your relief petition! Grant award of ${rupeesFormatted} has been issued for immediate bank transfer.`;
    case 'denied':
      return `The review committee at ${agency} rejected the claim, citing primary residency verification rules or alternative program overlap. ClaimCompass will pivot to other matches.`;
    default:
      return `Application moved to ${nextStatus} for ${programName}.`;
  }
}

// Background simulation loop representing the "autonomous agent"
// It polls every 12 seconds, selects one application that is in progress, and advances it to the next step
async function startAgentSimulationLoop() {
  console.log('ReliefPath Autonomous Agent loop started.');
  
  setInterval(async () => {
    if (!userProfile || applications.length === 0) return;

    // Find applications that can be advanced
    const pendingApps = applications.filter(a => 
      a.status !== 'approved' && a.status !== 'denied' && a.status !== 'documents_requested'
    );

    if (pendingApps.length === 0) {
      // Check if we can resolve some resubmitted ones
      const resubmittedApps = applications.filter(a => a.status === 'resubmitted');
      if (resubmittedApps.length > 0) {
        // Advance resubmitted directly to approved or under_review
        const target = resubmittedApps[Math.floor(Math.random() * resubmittedApps.length)];
        await advanceApplicationState(target);
      }
      return;
    }

    // Pick a random application to advance
    const targetApp = pendingApps[Math.floor(Math.random() * pendingApps.length)];
    await advanceApplicationState(targetApp);

  }, 12000); // Advances one step somewhere every 12 seconds
}

async function advanceApplicationState(appItem: Application) {
  if (!userProfile) return;

  const prevStatus = appItem.status;
  let nextStatus: ApplicationStatus = prevStatus;
  let notificationType: ActivityNotification['type'] = 'status_change';
  let notificationSeverity: ActivityNotification['severity'] = 'info';
  let notifTitle = '';
  let notifMsg = '';

  // Calculate next status path:
  // matched -> auto_filled -> submitted -> under_review -> (documents_requested) -> approved/denied
  if (prevStatus === 'matched') {
    nextStatus = 'auto_filled';
    notificationType = 'auto_fill';
    notificationSeverity = 'info';
    notifTitle = 'Agent Auto-Filled Form';
    notifMsg = `ClaimCompass agent mapped and auto-filled the application fields for ${appItem.programName}.`;
  } else if (prevStatus === 'auto_filled') {
    nextStatus = 'submitted';
    notificationType = 'submission';
    notificationSeverity = 'success';
    notifTitle = 'Application Submitted';
    notifMsg = `Dossier securely filed via ClaimCompass to ${appItem.agency}.`;
  } else if (prevStatus === 'submitted') {
    nextStatus = 'under_review';
    notificationType = 'status_change';
    notificationSeverity = 'warning';
    notifTitle = 'Status: Under Review';
    notifMsg = `Official verification team at ${appItem.agency} is reviewing your relief claim.`;
  } else if (prevStatus === 'under_review') {
    // 25% chance of requesting docs if there are missing documents, otherwise move to approved/denied
    if (appItem.missingDocuments.length > 0 && Math.random() < 0.4) {
      nextStatus = 'documents_requested';
      notificationType = 'doc_request';
      notificationSeverity = 'alert';
      notifTitle = 'Action Needed: Missing Documents';
      notifMsg = `${appItem.agency} requires you to upload missing files: ${appItem.missingDocuments.join(', ')}.`;
    } else {
      // Move to final resolution: 85% approval chance, 15% denial
      nextStatus = Math.random() < 0.85 ? 'approved' : 'denied';
      if (nextStatus === 'approved') {
        notificationType = 'approval';
        notificationSeverity = 'success';
        notifTitle = 'GRANT APPROVED!';
        // Set actual approved amount
        appItem.amountApproved = appItem.amountRequested;
        notifMsg = `Grant of ₹${appItem.amountApproved.toLocaleString('en-IN')} approved for ${appItem.programName}!`;
      } else {
        notificationType = 'denial';
        notificationSeverity = 'alert';
        notifTitle = 'Application Declined';
        notifMsg = `Claim for ${appItem.programName} was declined by reviewers.`;
      }
    }
  } else if (prevStatus === 'resubmitted') {
    // Resubmitted moves back to under_review or approved
    nextStatus = Math.random() < 0.6 ? 'approved' : 'under_review';
    if (nextStatus === 'approved') {
      notificationType = 'approval';
      notificationSeverity = 'success';
      notifTitle = 'GRANT APPROVED!';
      appItem.amountApproved = appItem.amountRequested;
      notifMsg = `Post-review Grant of ₹${appItem.amountApproved.toLocaleString('en-IN')} approved for ${appItem.programName}!`;
    } else {
      notificationType = 'status_change';
      notificationSeverity = 'info';
      notifTitle = 'Documents Accepted: Back Under Review';
      notifMsg = `Your uploaded documents were processed. Application is back under review at ${appItem.agency}.`;
    }
  }

  // Update application details
  appItem.status = nextStatus;
  appItem.lastUpdated = new Date().toISOString();

  // Generate dynamic narrative narrative story (using Gemini or fallback)
  const reasoning = await generateNarrativeStory(
    appItem.programName,
    appItem.agency,
    prevStatus,
    nextStatus,
    userProfile,
    appItem.amountRequested
  );

  // Add notification
  const notif: ActivityNotification = {
    id: `notif-${nextStatus}-${appItem.id}-${Date.now()}`,
    userId: 'default-user',
    applicationId: appItem.id,
    type: notificationType,
    title: notifTitle,
    message: notifMsg,
    timestamp: new Date().toISOString(),
    status: 'unread',
    severity: notificationSeverity
  };
  notifications.unshift(notif); // Slide in at top

  // Add history
  statusHistory.unshift({
    id: `history-${nextStatus}-${appItem.id}-${Date.now()}`,
    applicationId: appItem.id,
    programName: appItem.programName,
    previousStatus: prevStatus,
    newStatus: nextStatus,
    timestamp: new Date().toISOString(),
    reasoning: reasoning
  });

  // Broadcast to all clients
  broadcastState();
}

async function setupViteAndListen() {
  // Serve frontend SPA via Vite Dev Server middleware in development or static dist/ folder in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(currentDirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start Server on Port 3000
  const PORT = 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Full-Stack ClaimCompass Server is listening on port ${PORT}`);
  });
}

// Start simulation loop
startAgentSimulationLoop();

// Boot server
setupViteAndListen().catch(err => {
  console.error('Critical: Failed to start ClaimCompass server:', err);
});
