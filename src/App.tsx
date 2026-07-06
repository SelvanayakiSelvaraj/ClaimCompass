/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef } from 'react';
import { 
  UserProfile, 
  Application, 
  StatusHistoryEntry, 
  ActivityNotification, 
  DashboardStats 
} from './types.js';
import OnboardingWizard from './components/OnboardingWizard.tsx';
import MapComponent from './components/MapComponent.tsx';
import KanbanBoard from './components/KanbanBoard.tsx';
import ActivityFeed from './components/ActivityFeed.tsx';
import DocVault from './components/DocVault.tsx';
import Chatbot from './components/Chatbot.tsx';
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  RefreshCw, 
  Info, 
  ShieldAlert, 
  FileText, 
  Map, 
  FolderLock, 
  AlertTriangle,
  UserCheck
} from 'lucide-react';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalMatched: 0,
    applicationsSubmitted: 0,
    applicationsApproved: 0,
    estTotalAidAmount: 0
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'kanban' | 'documents'>('dashboard');
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Load initial data and connect websocket
  useEffect(() => {
    // 1. Initial REST fetch for state
    fetchStateRest();

    // 2. Setup WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    console.log('Connecting to WebSocket on:', wsUrl);

    const connectWs = () => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket successfully connected.');
        setWsConnected(true);
        ws.send(JSON.stringify({ type: 'auth', userId: 'default-user' }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'full_state') {
            const { profile, applications, statusHistory, notifications, stats } = message.payload;
            setProfile(profile);
            setApplications(applications);
            setHistory(statusHistory);
            setNotifications(notifications);
            setStats(stats);
          }
        } catch (err) {
          console.warn('WebSocket optional message parse notice:', err);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected. Reconnecting in 5 seconds...');
        setWsConnected(false);
        setTimeout(connectWs, 5000);
      };

      ws.onerror = (err) => {
        console.log('WebSocket connection state notice (falling back to REST):', err);
        ws.close();
      };
    };

    connectWs();

    // 3. Fallback Periodic Polling (every 4 seconds) to guarantee updates if WebSockets are closed
    const pollInterval = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        fetchStateRest();
      }
    }, 4000);

    return () => {
      clearInterval(pollInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const fetchStateRest = async () => {
    try {
      const [profileRes, appsRes, histRes, notifsRes, statsRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/applications'),
        fetch('/api/history'),
        fetch('/api/notifications'),
        fetch('/api/stats')
      ]);

      if (profileRes.ok) {
        const p = await profileRes.json();
        setProfile(p);
      }
      if (appsRes.ok) {
        const apps = await appsRes.json();
        setApplications(apps);
      }
      if (histRes.ok) {
        const hist = await histRes.json();
        setHistory(hist);
      }
      if (notifsRes.ok) {
        const notifs = await notifsRes.json();
        setNotifications(notifs);
      }
      if (statsRes.ok) {
        const st = await statsRes.json();
        setStats(st);
      }
    } catch (err) {
      console.warn('REST fallback fetch encountered an issue (Server initializing/rebuilding):', err);
    }
  };

  const handleOnboardingComplete = async (newProfile: UserProfile) => {
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile)
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        fetchStateRest();
        setActiveTab('dashboard');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  const handleUploadDocument = async (appId: string, documentName: string) => {
    try {
      const res = await fetch(`/api/applications/${appId}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentName })
      });
      if (res.ok) {
        fetchStateRest();
      }
    } catch (err) {
      console.error('Error uploading document:', err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST'
      });
      if (res.ok) {
        // Optimistically set status
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset your file details and clear active agent applications?')) {
      try {
        const res = await fetch('/api/reset', { method: 'POST' });
        if (res.ok) {
          setProfile(null);
          setApplications([]);
          setHistory([]);
          setNotifications([]);
          setStats({
            totalMatched: 0,
            applicationsSubmitted: 0,
            applicationsApproved: 0,
            estTotalAidAmount: 0
          });
          setActiveTab('dashboard');
        }
      } catch (err) {
        console.error('Error resetting simulation:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFAF0] text-[#181C06] flex flex-col justify-between">
      
      {/* 1. Header Area */}
      <header className="bg-[#FFFAF0] border-b-2 border-[#81912F] border-opacity-25 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#E03F4F] text-[#FFFAF0] rounded-xl flex items-center justify-center font-bold text-lg shadow-sm">
            CC
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#181C06] flex items-center gap-1.5">
              ClaimCompass
              <span className="text-[10px] bg-[#81912F] text-[#FFFAF0] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Active Agent
              </span>
            </h1>
            <p className="text-[10px] text-[#181C06] opacity-70 font-medium">
              Autonomous Disaster Aid Matcher & Auto-Submission Engine
            </p>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
          <div className="flex items-center gap-2 bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-lg text-[#181C06]">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: wsConnected ? '#81912F' : '#E03F4F' }}></span>
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {wsConnected ? 'Satellites Connected' : 'Sync Polling Fallback'}
            </span>
          </div>

          {profile && (
            <button 
              id="reset-simulation-btn"
              onClick={handleReset}
              className="px-3 py-1.5 border border-[#E03F4F] border-opacity-30 rounded-lg text-[#E03F4F] hover:bg-[#E03F4F] hover:text-[#FFFAF0] transition active:scale-95"
            >
              Reset Protocol
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="flex-grow p-6 flex flex-col items-center">
        {!profile ? (
          /* Profile Intake Loading or First Time Onboarding */
          <div className="w-full flex justify-center py-8">
            <OnboardingWizard onComplete={handleOnboardingComplete} />
          </div>
        ) : (
          /* Active Client Dashboard Wrapper */
          <div className="w-full max-w-7xl space-y-6">
            
            {/* Disclaimer Bar */}
            <div className="bg-[#FFFAF0] border-2 border-dashed border-[#F8C463] text-[#181C06] rounded-xl p-4 flex items-start gap-3 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-[#E03F4F] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">Prototype Simulation Disclosure</h4>
                <p className="text-[10px] opacity-80 leading-relaxed mt-1">
                  This ClaimCompass instance is a fully sandboxed autonomous simulation. Submissions undergo multi-stage rules matching and narrative timeline writing without submitting actual legal petitions to real governmental agencies (such as FEMA or NDMA) or private commercial insurers. Real auto-submission requires valid Power of Attorney releases and direct governmental portal RPA keys.
                </p>
              </div>
            </div>

            {/* Navigation tabs */}
            <div className="flex border-b border-[#81912F] border-opacity-25 text-xs font-bold gap-1 pb-px">
              <button
                id="tab-dashboard"
                onClick={() => setActiveTab('dashboard')}
                className={`px-5 py-3 border-t-2 border-x transition flex items-center gap-2 rounded-t-xl ${
                  activeTab === 'dashboard' 
                    ? 'border-[#81912F] border-x-[#81912F] border-x-opacity-20 border-t-4 bg-white text-[#81912F] border-b-[#FFFAF0] -mb-px shadow-sm' 
                    : 'border-transparent text-[#181C06] opacity-70 hover:opacity-100 hover:bg-stone-50'
                }`}
              >
                <Map className="w-4 h-4" />
                Coordination Dashboard
              </button>
              <button
                id="tab-kanban"
                onClick={() => setActiveTab('kanban')}
                className={`px-5 py-3 border-t-2 border-x transition flex items-center gap-2 rounded-t-xl ${
                  activeTab === 'kanban' 
                    ? 'border-[#81912F] border-x-[#81912F] border-x-opacity-20 border-t-4 bg-white text-[#81912F] border-b-[#FFFAF0] -mb-px shadow-sm' 
                    : 'border-transparent text-[#181C06] opacity-70 hover:opacity-100 hover:bg-stone-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                Kanban Tracker
              </button>
              <button
                id="tab-documents"
                onClick={() => setActiveTab('documents')}
                className={`px-5 py-3 border-t-2 border-x transition flex items-center gap-2 rounded-t-xl ${
                  activeTab === 'documents' 
                    ? 'border-[#81912F] border-x-[#81912F] border-x-opacity-20 border-t-4 bg-white text-[#81912F] border-b-[#FFFAF0] -mb-px shadow-sm' 
                    : 'border-transparent text-[#181C06] opacity-70 hover:opacity-100 hover:bg-stone-50'
                }`}
              >
                <FolderLock className="w-4 h-4" />
                Dossier Vault
              </button>
            </div>

            {/* TAB CONTENT: 1. Dashboard */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                
                {/* 4 Summary Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  
                  {/* Card 1: Total Matched */}
                  <div className="bg-[#FFFAF0] border-2 border-[#81912F] border-opacity-30 rounded-xl p-4.5 shadow-sm">
                    <div className="flex items-center justify-between text-[#81912F]">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Programs Matched</span>
                      <Sparkles className="w-4.5 h-4.5" />
                    </div>
                    <p className="text-2xl font-bold mt-2 text-[#181C06]">{stats.totalMatched}</p>
                    <span className="text-[9px] text-[#181C06] opacity-60">Verified eligibility matches</span>
                  </div>

                  {/* Card 2: Applications Submitted */}
                  <div className="bg-[#FFFAF0] border-2 border-[#81912F] border-opacity-30 rounded-xl p-4.5 shadow-sm">
                    <div className="flex items-center justify-between text-[#F8C463]">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Auto-Submissions</span>
                      <Send className="w-4.5 h-4.5" />
                    </div>
                    <p className="text-2xl font-bold mt-2 text-[#181C06]">{stats.applicationsSubmitted}</p>
                    <span className="text-[9px] text-[#181C06] opacity-60">Files transmitted securely</span>
                  </div>

                  {/* Card 3: Applications Approved */}
                  <div className="bg-[#FFFAF0] border-2 border-[#81912F] border-opacity-30 rounded-xl p-4.5 shadow-sm">
                    <div className="flex items-center justify-between text-[#81912F]">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Grants Issued</span>
                      <CheckCircle2 className="w-4.5 h-4.5" />
                    </div>
                    <p className="text-2xl font-bold mt-2 text-[#181C06]">{stats.applicationsApproved}</p>
                    <span className="text-[9px] text-[#181C06] opacity-60">Approved relief decisions</span>
                  </div>

                  {/* Card 4: Est Total Aid Amount (Rupees, Counter animation) */}
                  <div className="bg-[#FFFAF0] border-2 border-[#81912F] border-opacity-30 rounded-xl p-4.5 shadow-sm bg-gradient-to-br from-transparent to-stone-50">
                    <div className="flex items-center justify-between text-[#E03F4F]">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Secured Aid Value</span>
                      <span className="text-xs font-black">₹</span>
                    </div>
                    <p className="text-2xl font-black mt-2 text-[#E03F4F] font-mono tracking-tight animate-pulse">
                      ₹{stats.estTotalAidAmount.toLocaleString('en-IN')}
                    </p>
                    <span className="text-[9px] text-[#181C06] opacity-60">Active / Approved cash value</span>
                  </div>

                </div>

                {/* Main Dashboard Panel Layout (Map & Feed) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Interactive Map */}
                  <div className="lg:col-span-2 h-[450px] lg:h-[520px]">
                    <MapComponent userLocation={profile.location} applications={applications} />
                  </div>

                  {/* Live Activity Stream */}
                  <div className="h-[450px] lg:h-[520px]">
                    <ActivityFeed notifications={notifications} onMarkRead={handleMarkRead} />
                  </div>
                </div>

                {/* Additional Quick Action Row */}
                <div className="bg-[#FFFAF0] border-2 border-[#81912F] border-opacity-30 rounded-xl p-5 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#181C06] mb-3.5 flex items-center gap-2">
                    <UserCheck className="w-4.5 h-4.5 text-[#81912F]" />
                    Survivor Active Dossier Portfolio
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {applications.map(app => {
                      let statusBadge = (
                        <span className="px-2.5 py-1 text-[9px] font-extrabold bg-[#F8C463] text-[#181C06] rounded-md uppercase">
                          {app.status.replace('_', ' ')}
                        </span>
                      );
                      if (app.status === 'approved') {
                        statusBadge = (
                          <span className="px-2.5 py-1 text-[9px] font-extrabold bg-[#81912F] text-white rounded-md uppercase">
                            Approved
                          </span>
                        );
                      }
                      if (app.status === 'denied' || app.status === 'documents_requested') {
                        statusBadge = (
                          <span className="px-2.5 py-1 text-[9px] font-extrabold bg-[#E03F4F] text-white rounded-md uppercase">
                            {app.status.replace('_', ' ')}
                          </span>
                        );
                      }

                      return (
                        <div key={app.id} className="border border-[#81912F] border-opacity-25 rounded-lg p-3.5 bg-white shadow-sm flex flex-col justify-between h-28">
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[9px] font-bold text-[#181C06] opacity-55">{app.agency}</span>
                              {statusBadge}
                            </div>
                            <h4 className="text-xs font-bold text-[#181C06] mt-1.5 line-clamp-1">{app.programName}</h4>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-opacity-10 border-[#181C06] mt-2">
                            <span className="font-semibold text-[#181C06] opacity-75">Target Aid:</span>
                            <span className="font-bold text-[#E03F4F]">₹{app.amountRequested.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT: 2. Kanban Tracker */}
            {activeTab === 'kanban' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-[#FFFAF0] border-2 border-[#81912F] border-opacity-30 rounded-xl p-5">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#181C06]">
                    Autonomous Stage Pipeline
                  </h2>
                  <p className="text-xs text-[#181C06] opacity-70 mt-1">
                    ClaimCompass auto-submits, re-bundles, and transmits documentation in sequence. Click any card to read the AI operational timeline.
                  </p>
                </div>

                <KanbanBoard 
                  applications={applications} 
                  history={history} 
                  onUploadDoc={handleUploadDocument} 
                />
              </div>
            )}

            {/* TAB CONTENT: 3. Documents & Profile */}
            {activeTab === 'documents' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-[#FFFAF0] border-2 border-[#81912F] border-opacity-30 rounded-xl p-5">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#181C06]">
                    Claim Dossier & Personal File Settings
                  </h2>
                  <p className="text-xs text-[#181C06] opacity-70 mt-1">
                    Edit your coordinates or intake profile details to trigger re-matching. Upload files to check off program missing document requirements.
                  </p>
                </div>

                <DocVault 
                  profile={profile} 
                  applications={applications} 
                  onUploadDoc={handleUploadDocument} 
                  onUpdateProfile={handleOnboardingComplete}
                />
              </div>
            )}

          </div>
        )}
      </main>

      {/* 3. Footer Area */}
      <footer className="bg-[#FFFAF0] border-t border-[#81912F] border-opacity-25 px-6 py-4.5 text-center mt-8">
        <p className="text-[10px] text-[#181C06] opacity-65 leading-relaxed">
          <strong>ClaimCompass</strong> — Simulating autonomous relief aid submissions under strict ethical RPA patterns. 
          <br className="hidden md:block" />
          Designed within a strict 4-Color Palette: base <span className="font-mono">#FFFAF0</span> | highlight <span className="font-mono">#E03F4F</span> | success <span className="font-mono">#81912F</span> | progress <span className="font-mono">#F8C463</span>.
        </p>
      </footer>

      {/* Floating Support Chatbot */}
      <Chatbot />

    </div>
  );
}
