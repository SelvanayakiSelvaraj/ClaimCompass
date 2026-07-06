# ClaimCompass 🧭 — Disaster Relief Active Dossier Portfolio & ReliefBot

ClaimCompass is a full-stack, responsive, and empathetic platform built to help disaster survivors navigate complex relief grants, track their application progress, maintain a secure document vault, and interact with an AI companion in their native language.

### 🌐 Live Application Links
- **Active Development URL**: [ClaimCompass Dev Portal](https://ais-dev-ormqbqnsnav7x6brq3stsw-56517989814.asia-southeast1.run.app)

The application leverages **React (TypeScript) + Vite** on the frontend, **Express** on the backend, and is integrated with **Google Gemini 3.5 Flash** to provide personalized, multilingual support.

---

## 🎨 Visual Identity & Architecture

- **Human-Centric & Accessible Aesthetics**: High-contrast, custom color systems engineered specifically for readability and eye comfort in high-stress crisis scenarios.
- **Multilingual Support**: Supports conversing and guiding survivors in **English**, **Hindi (हिन्दी)**, **Tamil (தமிழ்)**, **Telugu (తెలుగు)**, and **Bengali (বাংলা)**.
- **Dossier Mapping**: Automates mapping survivor profiles with matched federal, state, and NGO disaster grants.

---

## ✨ Features

### 1. 📋 Onboarding & Intake Protocol
- Multi-step interactive intake wizard gathering survival details, occupancy type, crop/house insurance, and accommodation requirements.
- Uses client-side state storage to prevent session loss.

### 2. 🗃️ Survivor Active Dossier Portfolio
- Displays status cards matching relief programs like **PM-KISAN Emergency Agricultural Grant**, **NDRF Urgent Structural Grant**, and **SDRF Subsistence Grant**.
- Features high-contrast, fully readable tags with clean typography.

### 3. 💬 ReliefBot (AI Assistant)
- An AI chatbot powered by **Gemini 3.5 Flash** that answers questions, guides users through missing documents, and coordinates next steps.
- Supports language selector switches with instant fallback capabilities in case of API rate limits.

### 4. 🗂️ Document Vault
- Drag-and-drop file upload component tracking necessary files (e.g., Aadhaar, Crop Damage Photos, Renter Leases).
- Real-time status sync between file uploads and Kanban status progression.

### 5. 🗺️ Geolocation Map & Activity Feed
- Live map marking nearby active aid centers, medical units, and NGO coordinates.
- Timestamped audit feed log tracing state transitions.

---

## 🚀 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion (for animations), Lucide React.
- **Backend**: Node.js, Express, WebSocket synchronization.
- **Generative AI**: Google Gen AI SDK (`@google/genai`) with Gemini 3.5 Flash.

---

## 🛠️ Installation & Local Setup

### 1. Prerequisites
Ensure you have **Node.js (v18+)** installed.

### 2. Clone and Install Dependencies
```bash
# Clone this repository (or unzip the export)
git clone <your-repository-url>
cd claimcompass

# Install dependencies
npm install
```

### 3. Environment Variables Setup
Create a `.env` file in the root directory (based on `.env.example`):
```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
APP_URL="http://localhost:3000"
```
*Note: You can obtain your API key from [Google AI Studio](https://aistudio.google.com/).*

### 4. Run the Application
Start the unified full-stack development environment:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

---

## 📦 Production Build & Deployment

To compile static assets and bundle the server for production:

```bash
npm run build
```

This generates:
1. Compiled frontend files inside `dist/`.
2. A single, bundled, self-contained server executable `dist/server.cjs` via **esbuild** for high performance and low-latency startup on serverless platforms (like Google Cloud Run).

To start the production server:
```bash
npm start
```

---

## 📄 License

This project is licensed under the Apache-2.0 License. See the LICENSE file for details.
