/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useState } from 'react';
import { UserProfile, DisasterType } from '../types.js';
import { Shield, MapPin, AlertCircle, Users, IndianRupee, Heart, FileText, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: (profile: UserProfile) => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  // Auth simulation
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // Step state
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [agentProgressMsg, setAgentProgressMsg] = useState<string>('');
  const [agentProgressPct, setAgentProgressPct] = useState<number>(0);

  // Profile Form state
  const [name, setName] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [lat, setLat] = useState<number>(13.0827); // Default Chennai
  const [lng, setLng] = useState<number>(80.2707);
  const [disasterType, setDisasterType] = useState<DisasterType>('flood');
  const [householdSize, setHouseholdSize] = useState<number>(4);
  const [incomeBracket, setIncomeBracket] = useState<number>(120000); // in Rupees
  const [insuranceStatus, setInsuranceStatus] = useState<'insured' | 'uninsured'>('uninsured');
  const [insuranceType, setInsuranceType] = useState<string>('none');
  const [occupancyType, setOccupancyType] = useState<'homeowner' | 'renter'>('homeowner');
  const [hasSpecialNeeds, setHasSpecialNeeds] = useState<boolean>(false);
  const [specialNeedsDetails, setSpecialNeedsDetails] = useState<string>('');
  const [geoStatus, setGeoStatus] = useState<'idle' | 'fetching' | 'success' | 'failed'>('idle');

  // Handle Simple Log in
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please fill in both email and password.');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }
    setIsLoggedIn(true);
    setAuthError('');
  };

  // Browser Geolocation capture
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('failed');
      return;
    }
    setGeoStatus('fetching');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setGeoStatus('success');
        if (!address) {
          setAddress(`Coordinates: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        }
      },
      (error) => {
        console.warn('Browser location not available (expected in sandboxed frames or when permissions are declined), using fallback default coordinates:', error);
        setGeoStatus('failed');
      },
      { timeout: 8000 }
    );
  };

  // Intake wizard steps
  const steps = [
    {
      title: 'Personal Identity',
      icon: <Shield className="w-5 h-5" />,
      description: 'Let us start with your name so the ClaimCompass agent can customize applications.'
    },
    {
      title: 'Location Context',
      icon: <MapPin className="w-5 h-5" />,
      description: 'Your physical address determines your jurisdiction under local state disaster zones.'
    },
    {
      title: 'Incident Details',
      icon: <AlertCircle className="w-5 h-5" />,
      description: 'Different state and NDMA relief funds trigger based on specific hazard types.'
    },
    {
      title: 'Household Demographics',
      icon: <Users className="w-5 h-5" />,
      description: 'FEMA and state emergency stipends scale dynamically depending on family headcounts.'
    },
    {
      title: 'Financial Intake',
      icon: <IndianRupee className="w-5 h-5" />,
      description: 'We calculate your income metrics to matching low-income relief grants.'
    },
    {
      title: 'Occupancy & Protection',
      icon: <FileText className="w-5 h-5" />,
      description: 'Certain rebuilding programs are designated strictly for structural homeowners.'
    },
    {
      title: 'Vulnerability Checklist',
      icon: <Heart className="w-5 h-5" />,
      description: 'Special accommodations (medical/language) unlock premium accessibility funds.'
    }
  ];

  const handleNext = () => {
    if (currentStep === 0 && !name.trim()) return;
    if (currentStep === 1 && !address.trim()) return;
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      triggerAgentOnboarding();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Simulate complex Agent rules-matching state upon submit
  const triggerAgentOnboarding = () => {
    setIsSubmitting(true);
    setAgentProgressPct(0);

    const progressPhases = [
      { pct: 15, msg: 'Initializing ClaimCompass autonomous mapping engine...' },
      { pct: 35, msg: `Scanning regional disaster files for declared ${disasterType.toUpperCase()} occurrences...` },
      { pct: 55, msg: `Mapping income tier ₹${incomeBracket.toLocaleString('en-IN')} against PM-KISAN, SDRF, and PM-CARES regulations...` },
      { pct: 75, msg: `Compiling missing file criteria for ${occupancyType}s in ${address}...` },
      { pct: 90, msg: 'Formulating legal consent release credentials...' },
      { pct: 100, msg: 'Matching complete! Generating relief applications database...' }
    ];

    let currentPhase = 0;
    const interval = setInterval(() => {
      if (currentPhase < progressPhases.length) {
        setAgentProgressPct(progressPhases[currentPhase].pct);
        setAgentProgressMsg(progressPhases[currentPhase].msg);
        currentPhase++;
      } else {
        clearInterval(interval);
        
        // Finalize state
        const profile: UserProfile = {
          name,
          address,
          location: { lat, lng, address },
          disasterType,
          householdSize,
          incomeBracket,
          insuranceStatus,
          insuranceType: insuranceStatus === 'insured' ? insuranceType : undefined,
          occupancyType,
          hasSpecialNeeds,
          specialNeedsDetails: hasSpecialNeeds ? specialNeedsDetails : undefined
        };
        onComplete(profile);
      }
    }, 900);
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md w-full mx-auto bg-[#FFFAF0] border-2 border-[#81912F] border-opacity-30 p-8 rounded-2xl shadow-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#E03F4F] text-[#FFFAF0] rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-2xl tracking-wider shadow-sm">
            CC
          </div>
          <h1 className="text-2xl font-bold text-[#181C06] tracking-tight">Access ClaimCompass</h1>
          <p className="text-xs text-[#181C06] opacity-70 mt-1.5 leading-relaxed">
            AI-driven disaster eligibility navigator & automated submission agent.
          </p>
        </div>

        {authError && (
          <div className="bg-[#E03F4F] bg-opacity-10 border border-[#E03F4F] text-[#E03F4F] text-xs font-semibold p-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#181C06] uppercase tracking-wider mb-1.5">Email Address</label>
            <input 
              id="login-email"
              type="email" 
              required
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#FFFAF0] border-2 border-[#81912F] border-opacity-20 rounded-xl px-4 py-3 text-sm focus:border-opacity-100 focus:border-[#81912F] focus:outline-none transition text-[#181C06]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#181C06] uppercase tracking-wider mb-1.5">Password</label>
            <input 
              id="login-password"
              type="password" 
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#FFFAF0] border-2 border-[#81912F] border-opacity-20 rounded-xl px-4 py-3 text-sm focus:border-opacity-100 focus:border-[#81912F] focus:outline-none transition text-[#181C06]"
            />
          </div>

          <button 
            id="login-submit"
            type="submit"
            className="w-full bg-[#E03F4F] text-[#FFFAF0] font-bold py-3 px-4 rounded-xl shadow transition hover:bg-opacity-90 active:scale-95 text-sm flex items-center justify-center gap-2"
          >
            Authenticate Credentials
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-dashed border-[#81912F] border-opacity-20 text-center">
          <p className="text-[10px] text-[#181C06] opacity-65 leading-relaxed">
            * ClaimCompass uses end-to-end sandbox storage. Mock OTP-style credentials approved.
          </p>
        </div>
      </div>
    );
  }

  if (isSubmitting) {
    return (
      <div className="max-w-xl w-full mx-auto bg-[#FFFAF0] border-2 border-[#81912F] border-opacity-30 p-10 rounded-2xl shadow-sm text-center">
        <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#F8C463] rounded-full opacity-20 animate-ping"></div>
          <div className="absolute inset-2 bg-[#81912F] rounded-full opacity-20 animate-pulse"></div>
          <div className="w-16 h-16 bg-[#81912F] text-[#FFFAF0] rounded-full flex items-center justify-center font-bold text-xl relative z-10 shadow-md">
            <Sparkles className="w-8 h-8 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </div>

        <h2 className="text-xl font-bold text-[#181C06] tracking-tight">ClaimCompass Agent Processing</h2>
        <p className="text-xs text-[#181C06] opacity-70 mt-1 max-w-sm mx-auto">
          The autonomous AI mapping workflow is mapping your demographics against real-time relief schemas.
        </p>

        {/* Dynamic Log Text */}
        <div className="bg-[#FFFAF0] border border-[#81912F] border-opacity-20 rounded-lg p-3 my-6 min-h-[50px] flex items-center justify-center text-xs font-mono text-[#81912F]">
          <span>{agentProgressMsg}</span>
        </div>

        {/* Custom Progress Bar */}
        <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden mb-2">
          <div 
            className="h-full bg-[#81912F] transition-all duration-300"
            style={{ width: `${agentProgressPct}%` }}
          ></div>
        </div>
        <span className="text-[10px] font-bold text-[#181C06] opacity-60">{agentProgressPct}% COMPLETE</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl w-full mx-auto bg-[#FFFAF0] border-2 border-[#81912F] border-opacity-30 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
      
      {/* Onboarding Sidebar Progress tracker */}
      <div className="bg-[#FFFAF0] border-b md:border-b-0 md:border-r border-[#81912F] border-opacity-20 p-6 md:w-64 flex-shrink-0 flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-bold bg-[#F8C463] bg-opacity-25 text-[#181C06] px-2.5 py-1 rounded-full uppercase tracking-wider">
            Intake Protocol
          </span>
          <h2 className="text-lg font-bold text-[#181C06] mt-3">Survivor Profiler</h2>
          <p className="text-[11px] text-[#181C06] opacity-70 mt-1">
            Complete the form to let the agent auto-apply to local programs.
          </p>

          <div className="mt-6 space-y-3.5 hidden md:block">
            {steps.map((s, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center border text-xs font-semibold ${
                  idx === currentStep 
                    ? 'bg-[#E03F4F] text-[#FFFAF0] border-[#E03F4F]' 
                    : idx < currentStep 
                    ? 'bg-[#81912F] text-[#FFFAF0] border-[#81912F]' 
                    : 'bg-transparent text-[#181C06] border-opacity-10 border-[#181C06]'
                }`}>
                  {idx < currentStep ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                </div>
                <span className={`text-[11px] font-semibold ${idx === currentStep ? 'text-[#E03F4F]' : 'text-[#181C06] opacity-70'}`}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-dashed border-[#81912F] border-opacity-20 hidden md:block">
          <div className="flex items-center gap-2 text-[10px] text-[#181C06] opacity-65">
            <Shield className="w-3.5 h-3.5 text-[#81912F]" />
            <span>Secure Sandboxed Session</span>
          </div>
        </div>
      </div>

      {/* Main Intake Form Content */}
      <div className="p-8 flex-grow flex flex-col justify-between min-h-[400px]">
        <div>
          <div className="flex items-center gap-2 mb-2 text-[#E03F4F]">
            {steps[currentStep].icon}
            <span className="text-xs font-bold uppercase tracking-widest">Step {currentStep + 1} of {steps.length}</span>
          </div>
          <h3 className="text-lg font-bold text-[#181C06]">{steps[currentStep].title}</h3>
          <p className="text-xs text-[#181C06] opacity-70 mt-1 mb-6 leading-relaxed">
            {steps[currentStep].description}
          </p>

          <div className="space-y-4">
            {/* STEP 1: Name */}
            {currentStep === 0 && (
              <div>
                <label className="block text-xs font-bold text-[#181C06] uppercase tracking-wider mb-1.5">Full Legal Name</label>
                <input 
                  id="intake-name"
                  type="text" 
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#FFFAF0] border-2 border-[#81912F] border-opacity-20 rounded-xl px-4 py-3 text-sm focus:border-opacity-100 focus:border-[#81912F] focus:outline-none transition text-[#181C06]"
                />
              </div>
            )}

            {/* STEP 2: Address & Geolocation */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#181C06] uppercase tracking-wider mb-1.5">Disaster-Impacted Address</label>
                  <input 
                    id="intake-address"
                    type="text" 
                    required
                    placeholder="e.g. Plot No 12, Gandhi Street, Chennai"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-[#FFFAF0] border-2 border-[#81912F] border-opacity-20 rounded-xl px-4 py-3 text-sm focus:border-opacity-100 focus:border-[#81912F] focus:outline-none transition text-[#181C06]"
                  />
                </div>

                <div className="bg-[#FFFAF0] border border-[#81912F] border-opacity-20 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-[#181C06] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#E03F4F]" />
                    Coordinate Matching
                  </h4>
                  <p className="text-[11px] text-[#181C06] opacity-75 leading-relaxed mb-3">
                    ReliefPath utilizes strict coordinates to match your home location inside local declared zones of catastrophic damage.
                  </p>

                  <div className="flex items-center gap-3">
                    <button 
                      id="intake-get-geo"
                      type="button"
                      onClick={handleGetLocation}
                      disabled={geoStatus === 'fetching'}
                      className="px-3.5 py-1.5 bg-[#81912F] text-[#FFFAF0] rounded-lg text-xs font-bold hover:bg-opacity-90 active:scale-95 transition disabled:opacity-50"
                    >
                      {geoStatus === 'fetching' ? 'Requesting Device...' : 'Use Browser Geolocation'}
                    </button>

                    <div className="text-[11px] font-semibold">
                      {geoStatus === 'idle' && <span className="text-[#181C06] opacity-60">Not fetched yet</span>}
                      {geoStatus === 'fetching' && <span className="text-[#F8C463] animate-pulse">Requesting satellites...</span>}
                      {geoStatus === 'success' && <span className="text-[#81912F]">✓ Satellites Synced ({lat.toFixed(4)}, {lng.toFixed(4)})</span>}
                      {geoStatus === 'failed' && <span className="text-[#E03F4F]">Failed. Manual fallback active.</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Disaster Type */}
            {currentStep === 2 && (
              <div>
                <label className="block text-xs font-bold text-[#181C06] uppercase tracking-wider mb-2.5">Disaster Hazard Occured</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'flood', label: 'Flood / Cyclone' },
                    { id: 'wildfire', label: 'Wildfire / Drought' },
                    { id: 'hurricane', label: 'Cyclone / Hurricane' },
                    { id: 'earthquake', label: 'Earthquake' },
                    { id: 'other', label: 'Other Disaster' }
                  ].map((d) => (
                    <button
                      id={`disaster-select-${d.id}`}
                      key={d.id}
                      type="button"
                      onClick={() => setDisasterType(d.id as DisasterType)}
                      className={`px-4 py-3 text-xs font-bold border-2 rounded-xl text-left transition bg-white ${
                        disasterType === d.id 
                          ? 'border-[#E03F4F] text-[#E03F4F]' 
                          : 'border-stone-200 text-[#181C06] hover:border-stone-400'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: Household Demographics */}
            {currentStep === 3 && (
              <div>
                <label className="block text-xs font-bold text-[#181C06] uppercase tracking-wider mb-1.5">Household Size (No. of dependents)</label>
                <div className="flex items-center gap-4">
                  <button 
                    id="household-dec"
                    type="button"
                    onClick={() => setHouseholdSize(prev => Math.max(1, prev - 1))}
                    className="w-10 h-10 border-2 border-[#81912F] border-opacity-25 rounded-xl font-bold flex items-center justify-center text-lg text-[#181C06] active:scale-95 transition"
                  >
                    -
                  </button>
                  <span className="text-xl font-bold text-[#181C06] w-12 text-center">{householdSize}</span>
                  <button 
                    id="household-inc"
                    type="button"
                    onClick={() => setHouseholdSize(prev => Math.min(15, prev + 1))}
                    className="w-10 h-10 border-2 border-[#81912F] border-opacity-25 rounded-xl font-bold flex items-center justify-center text-lg text-[#181C06] active:scale-95 transition"
                  >
                    +
                  </button>
                </div>
                <p className="text-[10px] text-[#181C06] opacity-65 mt-2 leading-relaxed">
                  * Note: Programs like SDRF Immediate Support scale allocations proportionally per household dependent.
                </p>
              </div>
            )}

            {/* STEP 5: Financial Income */}
            {currentStep === 4 && (
              <div>
                <label className="block text-xs font-bold text-[#181C06] uppercase tracking-wider mb-2.5">Annual Family Income Bracket</label>
                <div className="space-y-2.5">
                  {[
                    { val: 120000, label: 'Less than ₹1.5 Lakhs (Low Income Support Eligible)' },
                    { val: 240000, label: '₹1.5 Lakhs to ₹3.0 Lakhs (Moderate Support)' },
                    { val: 380000, label: '₹3.0 Lakhs to ₹6.0 Lakhs (High Threshold)' },
                    { val: 650000, label: 'Greater than ₹6.0 Lakhs (Limited Direct Grants)' }
                  ].map((tier) => (
                    <button
                      id={`income-select-${tier.val}`}
                      key={tier.val}
                      type="button"
                      onClick={() => setIncomeBracket(tier.val)}
                      className={`w-full px-4 py-3 text-xs font-bold border-2 rounded-xl text-left transition bg-white ${
                        incomeBracket === tier.val 
                          ? 'border-[#81912F] text-[#81912F]' 
                          : 'border-stone-200 text-[#181C06] hover:border-stone-400'
                      }`}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 6: Occupancy & Protection */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#181C06] uppercase tracking-wider mb-2">Primary Residence Occupancy</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      id="occupancy-homeowner"
                      type="button"
                      onClick={() => setOccupancyType('homeowner')}
                      className={`px-4 py-3 text-xs font-bold border-2 rounded-xl text-center transition bg-white ${
                        occupancyType === 'homeowner' 
                          ? 'border-[#E03F4F] text-[#E03F4F]' 
                          : 'border-stone-200 text-[#181C06] hover:border-stone-400'
                      }`}
                    >
                      Homeowner
                    </button>
                    <button
                      id="occupancy-renter"
                      type="button"
                      onClick={() => setOccupancyType('renter')}
                      className={`px-4 py-3 text-xs font-bold border-2 rounded-xl text-center transition bg-white ${
                        occupancyType === 'renter' 
                          ? 'border-[#E03F4F] text-[#E03F4F]' 
                          : 'border-stone-200 text-[#181C06] hover:border-stone-400'
                      }`}
                    >
                      Renter
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#181C06] uppercase tracking-wider mb-2">Insurance Protection Coverage</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      id="insurance-insured"
                      type="button"
                      onClick={() => {
                        setInsuranceStatus('insured');
                        setInsuranceType('crop');
                      }}
                      className={`px-4 py-3 text-xs font-bold border-2 rounded-xl text-center transition bg-white ${
                        insuranceStatus === 'insured' 
                          ? 'border-[#81912F] text-[#81912F]' 
                          : 'border-stone-200 text-[#181C06] hover:border-stone-400'
                      }`}
                    >
                      Insured (Crop / House)
                    </button>
                    <button
                      id="insurance-uninsured"
                      type="button"
                      onClick={() => {
                        setInsuranceStatus('uninsured');
                        setInsuranceType('none');
                      }}
                      className={`px-4 py-3 text-xs font-bold border-2 rounded-xl text-center transition bg-white ${
                        insuranceStatus === 'uninsured' 
                          ? 'border-[#81912F] text-[#81912F]' 
                          : 'border-stone-200 text-[#181C06] hover:border-stone-400'
                      }`}
                    >
                      Uninsured
                    </button>
                  </div>
                </div>

                {insuranceStatus === 'insured' && (
                  <div>
                    <label className="block text-xs font-bold text-[#181C06] uppercase tracking-wider mb-1.5">Insurance Category Type</label>
                    <select
                      id="insurance-type-select"
                      value={insuranceType}
                      onChange={(e) => setInsuranceType(e.target.value)}
                      className="w-full bg-[#FFFAF0] border-2 border-[#81912F] border-opacity-20 rounded-xl px-4 py-3 text-xs focus:border-opacity-100 focus:border-[#81912F] focus:outline-none transition text-[#181C06] font-bold"
                    >
                      <option value="crop">Pradhan Mantri Fasal Bima Yojana (Crop Insurance)</option>
                      <option value="structural">Standard Commercial Homeowner Insurance</option>
                      <option value="government">State-Subsidized General Asset Policy</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* STEP 7: Special Vulnerabilities */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#181C06] uppercase tracking-wider mb-2">Vulnerability / Accessibility Accommodations</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      id="special-needs-yes"
                      type="button"
                      onClick={() => setHasSpecialNeeds(true)}
                      className={`px-4 py-3 text-xs font-bold border-2 rounded-xl text-center transition bg-white ${
                        hasSpecialNeeds === true 
                          ? 'border-[#E03F4F] text-[#E03F4F]' 
                          : 'border-stone-200 text-[#181C06] hover:border-stone-400'
                      }`}
                    >
                      Yes, Special Accommodations
                    </button>
                    <button
                      id="special-needs-no"
                      type="button"
                      onClick={() => {
                        setHasSpecialNeeds(false);
                        setSpecialNeedsDetails('');
                      }}
                      className={`px-4 py-3 text-xs font-bold border-2 rounded-xl text-center transition bg-white ${
                        hasSpecialNeeds === false 
                          ? 'border-[#E03F4F] text-[#E03F4F]' 
                          : 'border-stone-200 text-[#181C06] hover:border-stone-400'
                      }`}
                    >
                      None Required
                    </button>
                  </div>
                </div>

                {hasSpecialNeeds && (
                  <div>
                    <label className="block text-xs font-bold text-[#181C06] uppercase tracking-wider mb-1.5">Specify Medical / Language Requirements</label>
                    <textarea 
                      id="special-needs-textarea"
                      placeholder="Specify disability accommodations, medical oxygen needs, senior citizen status, or language support criteria..."
                      value={specialNeedsDetails}
                      onChange={(e) => setSpecialNeedsDetails(e.target.value)}
                      className="w-full bg-[#FFFAF0] border-2 border-[#81912F] border-opacity-20 rounded-xl px-4 py-3 text-xs focus:border-opacity-100 focus:border-[#81912F] focus:outline-none transition text-[#181C06] h-20"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action button controls */}
        <div className="mt-8 pt-6 border-t border-[#81912F] border-opacity-20 flex items-center justify-between">
          <button
            id="intake-prev"
            type="button"
            onClick={handlePrev}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition border border-[#181C06] border-opacity-20 text-[#181C06] ${
              currentStep === 0 ? 'opacity-0 pointer-events-none' : 'hover:bg-[#81912F] hover:bg-opacity-5'
            }`}
          >
            Back
          </button>

          <button
            id="intake-next"
            type="button"
            onClick={handleNext}
            className="px-6 py-2.5 bg-[#E03F4F] text-[#FFFAF0] rounded-xl text-xs font-bold shadow hover:bg-opacity-90 transition active:scale-95 flex items-center gap-1.5"
          >
            {currentStep === steps.length - 1 ? 'Initiate AI Agent Mapping' : 'Save & Continue'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
