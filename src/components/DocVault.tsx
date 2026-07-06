/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { UserProfile, Application } from '../types.js';
import { FileCheck, FileWarning, ArrowUp, CheckCircle, ShieldAlert, Edit3, Trash2, CheckCircle2, User, Landmark, HelpCircle } from 'lucide-react';

interface DocVaultProps {
  profile: UserProfile | null;
  applications: Application[];
  onUploadDoc: (appId: string, docName: string) => void;
  onUpdateProfile: (profile: UserProfile) => void;
}

export default function DocVault({ profile, applications, onUploadDoc, onUpdateProfile }: DocVaultProps) {
  const [isEditingProfile, setIsEditingProfile] = React.useState<boolean>(false);
  const [editName, setEditName] = React.useState<string>(profile?.name || '');
  const [editAddress, setEditAddress] = React.useState<string>(profile?.address || '');
  const [editIncome, setEditIncome] = React.useState<number>(profile?.incomeBracket || 120000);
  const [editHousehold, setEditHousehold] = React.useState<number>(profile?.householdSize || 4);
  const [dragActive, setDragActive] = React.useState<boolean>(false);
  const [uploadFeedback, setUploadFeedback] = React.useState<string>('');

  if (!profile) return null;

  // Gather unique missing documents across all matched applications
  const allMissingDocs = Array.from(
    new Set(applications.flatMap(app => app.missingDocuments))
  );

  // Gather all unique submitted documents across all matched applications
  const allSubmittedDocs = Array.from(
    new Set(applications.flatMap(app => app.submittedDocuments))
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0] && allMissingDocs.length > 0) {
      const file = e.dataTransfer.files[0];
      const targetDoc = allMissingDocs[0]; // Upload to the first requested missing document automatically
      simulateUpload(targetDoc);
    }
  };

  const simulateUpload = (docName: string) => {
    // Find applications that require this document
    const targetedApps = applications.filter(app => app.missingDocuments.includes(docName));
    if (targetedApps.length > 0) {
      targetedApps.forEach(app => {
        onUploadDoc(app.id, docName);
      });
      setUploadFeedback(`Successfully uploaded "${docName}" to document vault. Checked off across ${targetedApps.length} programs!`);
      setTimeout(() => setUploadFeedback(''), 5000);
    }
  };

  const handleProfileUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...profile,
      name: editName,
      address: editAddress,
      incomeBracket: Number(editIncome),
      householdSize: Number(editHousehold)
    };
    onUpdateProfile(updated);
    setIsEditingProfile(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* 1. Profile Details Panel */}
      <div className="bg-[#FFFAF0] border-2 border-[#81912F] border-opacity-30 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#81912F] border-opacity-20 pb-3 mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#181C06] flex items-center gap-1.5">
            <User className="w-4 h-4 text-[#E03F4F]" />
            Survivor Intake File
          </h2>
          
          {!isEditingProfile && (
            <button
              id="edit-profile-btn"
              onClick={() => {
                setEditName(profile.name);
                setEditAddress(profile.address);
                setEditIncome(profile.incomeBracket);
                setEditHousehold(profile.householdSize);
                setIsEditingProfile(true);
              }}
              className="text-[10px] font-bold text-[#E03F4F] flex items-center gap-1 hover:underline"
            >
              <Edit3 className="w-3 h-3" />
              Modify Details
            </button>
          )}
        </div>

        {isEditingProfile ? (
          <form onSubmit={handleProfileUpdateSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-[#181C06] uppercase tracking-wider mb-1">Legal Name</label>
              <input 
                id="edit-name-input"
                type="text" 
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-[#FFFAF0] border border-[#81912F] border-opacity-30 rounded-lg px-3 py-1.5 text-xs text-[#181C06]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#181C06] uppercase tracking-wider mb-1">Address Location</label>
              <input 
                id="edit-address-input"
                type="text" 
                required
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                className="w-full bg-[#FFFAF0] border border-[#81912F] border-opacity-30 rounded-lg px-3 py-1.5 text-xs text-[#181C06]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-[#181C06] uppercase tracking-wider mb-1">Household Dependents</label>
                <input 
                  id="edit-household-input"
                  type="number" 
                  min="1"
                  required
                  value={editHousehold}
                  onChange={(e) => setEditHousehold(Number(e.target.value))}
                  className="w-full bg-[#FFFAF0] border border-[#81912F] border-opacity-30 rounded-lg px-3 py-1.5 text-xs text-[#181C06]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#181C06] uppercase tracking-wider mb-1">Income Bracket (₹)</label>
                <input 
                  id="edit-income-input"
                  type="number" 
                  required
                  value={editIncome}
                  onChange={(e) => setEditIncome(Number(e.target.value))}
                  className="w-full bg-[#FFFAF0] border border-[#81912F] border-opacity-30 rounded-lg px-3 py-1.5 text-xs text-[#181C06]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end pt-2">
              <button
                id="cancel-edit-btn"
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-3 py-1 rounded-lg text-xs font-bold border border-[#181C06] border-opacity-20 text-[#181C06]"
              >
                Cancel
              </button>
              <button
                id="save-edit-btn"
                type="submit"
                className="px-4 py-1 bg-[#81912F] text-[#FFFAF0] rounded-lg text-xs font-bold"
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold text-[#181C06] opacity-50 uppercase block">Survivor Name</span>
              <p className="text-sm font-bold text-[#181C06]">{profile.name}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-[#181C06] opacity-50 uppercase block">Assigned Address Coordinates</span>
              <p className="text-xs font-medium text-[#181C06] leading-relaxed">{profile.address}</p>
              <p className="text-[9px] text-[#81912F] font-semibold mt-0.5">
                Latitude: {profile.location.lat.toFixed(5)} / Longitude: {profile.location.lng.toFixed(5)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-[#181C06] opacity-50 uppercase block">Hazard Type</span>
                <p className="text-xs font-semibold text-[#E03F4F] uppercase tracking-wider mt-0.5">{profile.disasterType}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#181C06] opacity-50 uppercase block">Family Size</span>
                <p className="text-xs font-bold text-[#181C06] mt-0.5">{profile.householdSize} Dependents</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-[#181C06] opacity-50 uppercase block">Annual Income</span>
                <p className="text-xs font-bold text-[#181C06] mt-0.5">₹{profile.incomeBracket.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#181C06] opacity-50 uppercase block">Occupancy Type</span>
                <p className="text-xs font-semibold text-[#81912F] uppercase tracking-wider mt-0.5">{profile.occupancyType}</p>
              </div>
            </div>

            <div className="bg-[#FFFAF0] border border-[#81912F] border-opacity-20 rounded-lg p-3">
              <span className="text-[10px] font-bold text-[#181C06] opacity-50 uppercase block">Special Conditions</span>
              <p className="text-xs font-medium text-[#181C06] mt-1 leading-relaxed">
                {profile.hasSpecialNeeds 
                  ? profile.specialNeedsDetails || 'Accommodation Requested (Language/Disability)'
                  : 'No critical medical or language accessibility accommodation declared.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. File Checkpoints Missing List */}
      <div className="bg-[#FFFAF0] border-2 border-[#81912F] border-opacity-30 rounded-xl p-5 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#181C06] border-b border-[#81912F] border-opacity-20 pb-3 mb-4 flex items-center gap-1.5">
          <Landmark className="w-4 h-4 text-[#E03F4F]" />
          Required Checkpoint Documents
        </h2>

        {/* Upload feedback */}
        {uploadFeedback && (
          <div className="bg-[#81912F] bg-opacity-10 border border-[#81912F] text-[#81912F] text-[10px] font-semibold p-2.5 rounded-lg mb-3">
            {uploadFeedback}
          </div>
        )}

        {allMissingDocs.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-8 h-8 text-[#81912F] mx-auto opacity-70 mb-2 animate-bounce" />
            <p className="text-xs font-bold text-[#81912F]">Dossier Fully Compliant!</p>
            <p className="text-[10px] text-[#181C06] opacity-65 mt-1 leading-relaxed">
              All initial required documents are successfully matched and uploaded.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[11px] text-[#E03F4F] font-semibold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              Pending verification across matched programs:
            </p>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {allMissingDocs.map((doc, idx) => (
                <div 
                  key={doc} 
                  className="bg-[#FFFAF0] border border-[#E03F4F] border-opacity-30 p-3 rounded-lg flex items-center justify-between gap-3 shadow-sm hover:border-opacity-100 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#E03F4F] bg-opacity-10 flex items-center justify-center text-[10px] font-bold text-[#E03F4F]">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-medium text-[#181C06]">{doc}</span>
                  </div>
                  
                  <button
                    id={`upload-btn-${idx}`}
                    type="button"
                    onClick={() => simulateUpload(doc)}
                    className="px-2.5 py-1 bg-[#E03F4F] text-[#FFFAF0] font-bold text-[10px] rounded hover:bg-opacity-90 active:scale-95 transition flex items-center gap-0.5"
                  >
                    <ArrowUp className="w-3 h-3" />
                    Upload
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* List of successfully uploaded files */}
        {allSubmittedDocs.length > 0 && (
          <div className="mt-5 pt-4 border-t border-dashed border-[#81912F] border-opacity-25">
            <span className="text-[10px] font-bold uppercase text-[#181C06] opacity-60">Verified Document Vault:</span>
            <div className="mt-2 space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
              {allSubmittedDocs.map(doc => (
                <div key={doc} className="flex items-center justify-between text-xs text-[#81912F] font-semibold">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {doc}
                  </span>
                  <span className="text-[10px] opacity-60">Verified</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Dropzone Upload Panel */}
      <div className="bg-[#FFFAF0] border-2 border-[#81912F] border-opacity-30 rounded-xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#181C06] border-b border-[#81912F] border-opacity-20 pb-3 mb-4 flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-[#81912F]" />
            Claim Document Dropzone
          </h2>

          <div
            id="drag-drop-zone"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center transition-all ${
              dragActive 
                ? 'border-[#81912F] bg-opacity-20 bg-[#81912F]' 
                : 'border-[#81912F] border-opacity-35 hover:border-opacity-100'
            } ${allMissingDocs.length === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => {
              if (allMissingDocs.length > 0) {
                simulateUpload(allMissingDocs[0]);
              }
            }}
          >
            <ArrowUp className="w-8 h-8 text-[#81912F] opacity-50 animate-bounce" />
            <p className="text-xs font-bold text-[#181C06] mt-2">
              {dragActive ? 'Drop files here' : 'Drag & drop file or click to upload'}
            </p>
            <p className="text-[10px] text-[#181C06] opacity-60 mt-1 max-w-[180px] mx-auto leading-relaxed">
              {allMissingDocs.length > 0 
                ? `System will auto-assign to next required file: "${allMissingDocs[0]}"`
                : 'All requirements met.'}
            </p>
          </div>
        </div>

        <div className="mt-4 bg-[#FFFAF0] border border-[#F8C463] p-3 rounded-lg flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-[#F8C463] flex-shrink-0 mt-0.5" />
          <p className="text-[9px] text-[#181C06] opacity-75 leading-relaxed">
            <strong>How it works:</strong> ClaimCompass acts as an RPA agent. Files uploaded to this vault are parsed, cryptographically signed, and auto-submitted directly when requested by State or National portals.
          </p>
        </div>

      </div>

    </div>
  );
}
