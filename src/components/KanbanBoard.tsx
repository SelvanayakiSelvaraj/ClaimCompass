/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { Application, ApplicationStatus, StatusHistoryEntry } from '../types.js';
import { Clock, CheckCircle2, AlertTriangle, XCircle, Search, HelpCircle, ArrowRight, FileText, ChevronRight, CornerDownRight } from 'lucide-react';

interface KanbanBoardProps {
  applications: Application[];
  history: StatusHistoryEntry[];
  onUploadDoc: (appId: string, docName: string) => void;
}

export default function KanbanBoard({ applications, history, onUploadDoc }: KanbanBoardProps) {
  const [selectedApp, setSelectedApp] = React.useState<Application | null>(null);
  const [selectedDocToUpload, setSelectedDocToUpload] = React.useState<string>('');

  // Define Kanban columns
  const COLUMNS: { id: ApplicationStatus | 'resolved'; title: string; subtitle: string; color: string }[] = [
    { 
      id: 'matched', 
      title: 'Matched', 
      subtitle: 'Eligible & Mapped', 
      color: 'rgba(248, 196, 99, 0.1)' // Amber hint
    },
    { 
      id: 'submitted', 
      title: 'Submitted', 
      subtitle: 'Filed to Portal', 
      color: 'rgba(248, 196, 99, 0.15)' // Amber
    },
    { 
      id: 'under_review', 
      title: 'Under Review', 
      subtitle: 'Verification Team', 
      color: 'rgba(248, 196, 99, 0.2)' // Rich Amber
    },
    { 
      id: 'documents_requested', 
      title: 'Action Needed', 
      subtitle: 'Missing Documents', 
      color: 'rgba(224, 63, 79, 0.1)' // Crimson Red
    },
    { 
      id: 'resolved', 
      title: 'Resolution', 
      subtitle: 'Approved or Denied', 
      color: 'rgba(129, 145, 47, 0.1)' // Olive Green
    }
  ];

  // Map helper to filter applications by column
  const getAppsForColumn = (colId: string) => {
    if (colId === 'resolved') {
      return applications.filter(a => a.status === 'approved' || a.status === 'denied');
    }
    if (colId === 'submitted') {
      // Group both submitted and auto_filled/resubmitted under 'Submitted' for visual simplicity
      return applications.filter(a => a.status === 'submitted' || a.status === 'auto_filled' || a.status === 'resubmitted');
    }
    return applications.filter(a => a.status === colId);
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'matched':
        return <span className="bg-[#F8C463] text-[#181C06] text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">Matched</span>;
      case 'auto_filled':
        return <span className="bg-[#F8C463] text-[#181C06] text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">Auto-Filled</span>;
      case 'submitted':
        return <span className="bg-[#F8C463] text-[#181C06] text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">Submitted</span>;
      case 'under_review':
        return <span className="bg-[#F8C463] text-[#181C06] text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">In Review</span>;
      case 'documents_requested':
        return <span className="bg-[#E03F4F] text-white text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">Doc Request</span>;
      case 'resubmitted':
        return <span className="bg-[#81912F] text-white text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">Resubmitted</span>;
      case 'approved':
        return <span className="bg-[#81912F] text-white text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">Approved</span>;
      case 'denied':
        return <span className="bg-[#E03F4F] text-white text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">Declined</span>;
      default:
        return null;
    }
  };

  // Get filtered status log for the selected drawer application
  const getAppHistory = (appId: string) => {
    return history.filter(h => h.applicationId === appId);
  };

  const handleDocumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedApp && selectedDocToUpload) {
      onUploadDoc(selectedApp.id, selectedDocToUpload);
      // Update local state copy to match
      const updatedApp = { ...selectedApp };
      updatedApp.missingDocuments = updatedApp.missingDocuments.filter(d => d !== selectedDocToUpload);
      updatedApp.submittedDocuments.push(selectedDocToUpload);
      if (updatedApp.status === 'documents_requested' && updatedApp.missingDocuments.length === 0) {
        updatedApp.status = 'resubmitted';
      }
      setSelectedApp(updatedApp);
      setSelectedDocToUpload('');
    }
  };

  return (
    <div className="w-full">
      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => {
          const colApps = getAppsForColumn(col.id);
          
          return (
            <div 
              key={col.id} 
              className="bg-[#FFFAF0] border-2 border-[#81912F] border-opacity-20 rounded-xl p-4 flex flex-col min-h-[450px]"
              style={{ backgroundColor: col.color }}
            >
              {/* Column Header */}
              <div className="mb-4 pb-2 border-b border-[#81912F] border-opacity-25">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#181C06]">
                    {col.title}
                  </h3>
                  <span className="text-[10px] font-bold bg-white border border-[#81912F] border-opacity-30 px-2 py-0.5 rounded-full text-[#181C06]">
                    {colApps.length}
                  </span>
                </div>
                <p className="text-[10px] text-[#181C06] opacity-70 mt-0.5 font-medium">{col.subtitle}</p>
              </div>

              {/* Column Cards Container */}
              <div className="flex-grow space-y-3 overflow-y-auto max-h-[380px] pr-1">
                {colApps.length === 0 ? (
                  <div className="border-2 border-dashed border-[#81912F] border-opacity-20 rounded-xl p-6 text-center flex flex-col items-center justify-center h-28">
                    <Clock className="w-5 h-5 text-[#81912F] opacity-35" />
                    <span className="text-[10px] text-[#181C06] opacity-60 font-semibold mt-1">Empty Column</span>
                  </div>
                ) : (
                  colApps.map(app => {
                    const isApproved = app.status === 'approved';
                    const isDenied = app.status === 'denied';
                    const needsDocs = app.status === 'documents_requested';
                    
                    let cardBorder = 'border-[#81912F] border-opacity-30';
                    if (isApproved) cardBorder = 'border-[#81912F] border-opacity-100 shadow-[0_2px_8px_rgba(129,145,47,0.15)]';
                    if (isDenied || needsDocs) cardBorder = 'border-[#E03F4F] border-opacity-60 shadow-[0_2px_8px_rgba(224,63,79,0.1)]';

                    return (
                      <div
                        id={`kanban-card-${app.id}`}
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        className={`bg-[#FFFAF0] border-2 rounded-xl p-3.5 hover:scale-[1.02] cursor-pointer transition shadow-sm select-none ${cardBorder}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-bold font-mono text-[#181C06] opacity-65">
                            {app.agency.split(' ')[0]}
                          </span>
                          {getStatusBadge(app.status)}
                        </div>

                        <h4 className="font-bold text-xs text-[#181C06] mt-2 line-clamp-2 hover:text-[#E03F4F] transition">
                          {app.programName}
                        </h4>

                        <div className="mt-4 pt-2.5 border-t border-dashed border-[#81912F] border-opacity-20 flex items-center justify-between">
                          <span className="text-[10px] text-[#181C06] opacity-65 font-medium">Requested Aid</span>
                          <span className="text-xs font-bold text-[#E03F4F]">
                            ₹{app.amountRequested.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {app.amountApproved !== undefined && isApproved && (
                          <div className="mt-1 flex items-center justify-between text-[#81912F]">
                            <span className="text-[10px] font-bold">Approved Cash:</span>
                            <span className="text-xs font-black">
                              ₹{app.amountApproved.toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}

                        {needsDocs && (
                          <div className="mt-2.5 bg-[#E03F4F] bg-opacity-10 text-[#E03F4F] text-[9px] font-bold p-1.5 rounded border border-[#E03F4F] border-opacity-20 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                            <span>Action Required: Upload Files</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Drawer Overlay */}
      {selectedApp && (
        <div className="fixed inset-0 bg-[#181C06] bg-opacity-40 backdrop-blur-sm flex justify-end z-[999] transition-opacity duration-300">
          
          {/* Drawer Panel */}
          <div className="w-full max-w-lg bg-[#FFFAF0] h-full shadow-2xl flex flex-col justify-between border-l-4 border-[#81912F] p-8 animate-slide-in-right overflow-y-auto">
            <div>
              {/* Drawer Header */}
              <div className="flex items-start justify-between pb-4 border-b border-[#81912F] border-opacity-30">
                <div>
                  <span className="text-[10px] font-bold text-[#181C06] opacity-60 uppercase tracking-widest">
                    Application ID Dossier: {selectedApp.id.substring(0, 10)}...
                  </span>
                  <h2 className="text-lg font-bold text-[#181C06] mt-1 pr-4">
                    {selectedApp.programName}
                  </h2>
                  <p className="text-xs font-semibold text-[#81912F] mt-0.5">{selectedApp.agency}</p>
                </div>
                <button
                  id="close-drawer"
                  onClick={() => setSelectedApp(null)}
                  className="w-8 h-8 rounded-full border border-[#181C06] border-opacity-20 flex items-center justify-center font-bold text-sm hover:bg-[#E03F4F] hover:text-[#FFFAF0] hover:border-[#E03F4F] active:scale-90 transition"
                >
                  ✕
                </button>
              </div>

              {/* Stats Card inside drawer */}
              <div className="grid grid-cols-2 gap-4 my-6 bg-[#FFFAF0] border-2 border-[#81912F] border-opacity-25 rounded-xl p-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#181C06] opacity-60">Status Stage</span>
                  <div className="mt-1">{getStatusBadge(selectedApp.status)}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#181C06] opacity-60">Financial Demand</span>
                  <p className="text-sm font-bold text-[#E03F4F] mt-0.5">
                    ₹{selectedApp.amountRequested.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Document Checkpoints inside drawer */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-[#181C06] uppercase tracking-wider mb-3">Document Checkpoint</h3>
                
                {selectedApp.missingDocuments.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs text-[#E03F4F] font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      Missing Files Requested by {selectedApp.agency}:
                    </p>
                    
                    <form onSubmit={handleDocumentSubmit} className="flex gap-2">
                      <select
                        id="drawer-doc-select"
                        required
                        value={selectedDocToUpload}
                        onChange={(e) => setSelectedDocToUpload(e.target.value)}
                        className="flex-grow bg-[#FFFAF0] border-2 border-[#81912F] border-opacity-30 rounded-xl px-3 py-2 text-xs text-[#181C06]"
                      >
                        <option value="">-- Choose file to upload --</option>
                        {selectedApp.missingDocuments.map(doc => (
                          <option key={doc} value={doc}>{doc}</option>
                        ))}
                      </select>
                      <button
                        id="drawer-doc-submit"
                        type="submit"
                        className="px-4 py-2 bg-[#E03F4F] text-[#FFFAF0] font-bold text-xs rounded-xl hover:bg-opacity-90 active:scale-95 transition flex items-center gap-1"
                      >
                        Upload
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-[#81912F] bg-opacity-10 border border-[#81912F] p-3 rounded-lg text-xs font-semibold text-[#81912F] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>All initial document prerequisites met. Dossier fully certified.</span>
                  </div>
                )}

                {selectedApp.submittedDocuments.length > 0 && (
                  <div className="mt-4">
                    <span className="text-[10px] font-bold uppercase text-[#181C06] opacity-60">Submitted Files:</span>
                    <div className="mt-1.5 space-y-1">
                      {selectedApp.submittedDocuments.map(doc => (
                        <div key={doc} className="flex items-center gap-1.5 text-xs text-[#81912F] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{doc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Chronological Timeline History */}
              <div>
                <h3 className="text-xs font-bold text-[#181C06] uppercase tracking-wider mb-3.5">
                  Agent Operational Narrative Timeline
                </h3>
                
                <div className="relative border-l border-[#81912F] border-opacity-35 pl-4 ml-2 space-y-6">
                  {getAppHistory(selectedApp.id).length === 0 ? (
                    <p className="text-xs font-mono text-[#181C06] opacity-50">No operational updates registered yet.</p>
                  ) : (
                    getAppHistory(selectedApp.id).map(log => (
                      <div key={log.id} className="relative">
                        {/* Dot */}
                        <span className="absolute -left-[21px] top-1 w-3 h-3 rounded-full border border-[#81912F] bg-[#FFFAF0] flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#81912F]"></span>
                        </span>
                        
                        <div className="flex items-center justify-between text-[10px] font-bold text-[#181C06] opacity-60">
                          <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-[#81912F]">{log.newStatus.replace('_', ' ').toUpperCase()}</span>
                        </div>
                        
                        <p className="text-xs font-medium text-[#181C06] mt-1 leading-relaxed">
                          {log.reasoning}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-8 pt-6 border-t border-dashed border-[#81912F] border-opacity-30">
              <p className="text-[9px] text-[#181C06] opacity-65 leading-relaxed">
                * Note: This agency timeline represents a sandbox autonomous agent simulation. Submissions have been directed into a mock agency portal pipeline.
              </p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
