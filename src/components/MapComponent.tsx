/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { GeolocationData, Application } from '../types.js';

interface MapComponentProps {
  userLocation: GeolocationData | null;
  applications: Application[];
}

export default function MapComponent({ userLocation, applications }: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [showDeclaredZone, setShowDeclaredZone] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'centers' | 'applications'>('all');
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  // Default coordinate if user hasn't onboarded yet (Chennai, TN Disaster Coordination Hub)
  const defaultCenter: [number, number] = [13.0827, 80.2707];
  const centerCoord: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lng] 
    : defaultCenter;

  // Static mock disaster recovery centers (NDMA / NGO relief hubs)
  const recoveryCenters = [
    {
      id: 'center-1',
      name: 'NDMA Primary District Recovery Hub (FEMA Equivalent)',
      type: 'ndma',
      lat: centerCoord[0] + 0.009,
      lng: centerCoord[1] + 0.012,
      contact: '+91 44-2859-9000',
      status: 'Fully Operational',
      services: ['Emergency Shelter', 'Direct Relief Registration', 'Medical Checkups']
    },
    {
      id: 'center-2',
      name: 'Indian Red Cross & NGO Alliance Distribution Base',
      type: 'ngo',
      lat: centerCoord[0] - 0.011,
      lng: centerCoord[1] - 0.015,
      contact: 'Toll-Free 1800-425-0000',
      status: 'Supplies Dispatching',
      services: ['Drinking Water', 'Dry Rations', 'Blankets & Hygiene Kits']
    },
    {
      id: 'center-3',
      name: 'State SDRF Logistics & Shelter Base',
      type: 'sdrf',
      lat: centerCoord[0] + 0.018,
      lng: centerCoord[1] - 0.008,
      contact: '+91 44-2561-5000',
      status: 'Restricted Access - High Priority',
      services: ['Rescue Equipment', 'Temporary Power Grids', 'Debris Clearance']
    }
  ];

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up if map is already initialized
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Create Map
    const map = L.map(mapContainerRef.current, {
      center: centerCoord,
      zoom: 13,
      zoomControl: true,
      layers: []
    });

    mapInstanceRef.current = map;

    // Load OpenStreetMap tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20
    }).addTo(map);

    // Group for dynamically-rebuilt markers
    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;

    // Create the Disaster Area Overlay Polygon
    const delta = 0.035; // Overlay scale
    const polygonPoints: [number, number][] = [
      [centerCoord[0] + delta, centerCoord[1] - delta],
      [centerCoord[0] + delta * 1.2, centerCoord[1] + delta * 0.8],
      [centerCoord[0] - delta * 0.5, centerCoord[1] + delta * 1.5],
      [centerCoord[0] - delta * 1.3, centerCoord[1] + delta * 0.3],
      [centerCoord[0] - delta * 0.8, centerCoord[1] - delta * 1.1]
    ];

    const polygon = L.polygon(polygonPoints, {
      color: '#E03F4F', // Red
      fillColor: '#E03F4F',
      fillOpacity: 0.08,
      weight: 2,
      dashArray: '6, 6'
    });

    if (showDeclaredZone) {
      polygon.addTo(map);
    }
    polygonLayerRef.current = polygon;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [userLocation]); // Re-init on user location change to center correctly

  // Re-render markers when filter, showDeclaredZone, or applications change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    // Clear existing markers
    markersGroup.clearLayers();

    // 1. User Position Marker
    const userMarkerIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="absolute inset-0 bg-[#81912F] opacity-35 rounded-full animate-ping"></div>
          <div class="w-4 h-4 bg-[#81912F] rounded-full border-2 border-[#FFFAF0] shadow-md z-10"></div>
        </div>
      `,
      className: 'custom-user-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    L.marker(centerCoord, { icon: userMarkerIcon })
      .addTo(markersGroup)
      .bindPopup(`
        <div class="p-1">
          <h3 class="font-bold text-sm text-[#81912F] uppercase tracking-wide">Your Location</h3>
          <p class="text-xs text-[#181C06] mt-1">${userLocation?.address || 'Disaster Impact Zone Coordination Hub'}</p>
          <span class="inline-block mt-2 px-2 py-0.5 bg-opacity-15 bg-[#81912F] text-[#81912F] text-[10px] font-semibold rounded border border-[#81912F]">ACTIVE USER</span>
        </div>
      `);

    // 2. Add Relief Centers Markers (if selected)
    if (activeTab === 'all' || activeTab === 'centers') {
      recoveryCenters.forEach(center => {
        const isNgo = center.type === 'ngo';
        const color = isNgo ? '#F8C463' : '#E03F4F'; // Amber vs Red
        const badgeBg = isNgo ? 'rgba(248, 196, 99, 0.15)' : 'rgba(224, 63, 79, 0.15)';
        
        const centerIcon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center w-10 h-10">
              <div class="absolute w-8 h-8 rounded-full flex items-center justify-center" style="background-color: ${color}; border: 2px solid #FFFAF0; box-shadow: 0 4px 6px rgba(0,0,0,0.15);">
                <span class="text-white text-xs font-bold">${isNgo ? 'NGO' : 'GOV'}</span>
              </div>
            </div>
          `,
          className: `custom-center-marker-${center.id}`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const servicesList = center.services.map(s => `<li>• ${s}</li>`).join('');

        L.marker([center.lat, center.lng], { icon: centerIcon })
          .addTo(markersGroup)
          .bindPopup(`
            <div class="p-1 max-w-[240px]">
              <h3 class="font-bold text-xs" style="color: ${color};">${center.name}</h3>
              <p class="text-[11px] text-[#181C06] font-medium mt-1">Status: <span class="font-semibold" style="color: ${color};">${center.status}</span></p>
              <ul class="text-[10px] text-[#181C06] opacity-90 mt-2 space-y-0.5">
                ${servicesList}
              </ul>
              <div class="mt-3 pt-2 border-t border-opacity-10 border-[#181C06] flex items-center justify-between text-[10px] font-semibold">
                <span>Contact: ${center.contact}</span>
              </div>
            </div>
          `);
      });
    }

    // 3. Add Dynamic Applications Markers (if selected)
    if (activeTab === 'all' || activeTab === 'applications') {
      applications.forEach((app, index) => {
        // Distribute them around center for visualization
        const offsetLat = (index % 2 === 0 ? 1 : -1) * (0.006 + (index * 0.003));
        const offsetLng = (index % 3 === 0 ? 1 : -1) * (0.008 + (index * 0.002));
        const appLat = centerCoord[0] + offsetLat;
        const appLng = centerCoord[1] + offsetLng;

        // Color based on status
        let statusColor = '#F8C463'; // Amber default
        if (app.status === 'approved') statusColor = '#81912F'; // Green
        if (app.status === 'denied' || app.status === 'documents_requested') statusColor = '#E03F4F'; // Red

        const appIcon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center w-10 h-10">
              <div class="absolute w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#FFFAF0]" style="background-color: ${statusColor}; box-shadow: 0 4px 6px rgba(0,0,0,0.15);">
                <span class="text-white text-[10px] font-bold">₹</span>
              </div>
            </div>
          `,
          className: `custom-app-marker-${app.id}`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        L.marker([appLat, appLng], { icon: appIcon })
          .addTo(markersGroup)
          .bindPopup(`
            <div class="p-1 max-w-[220px]">
              <span class="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border" style="background-color: ${statusColor}1c; color: ${statusColor}; border-color: ${statusColor};">
                ${app.status.toUpperCase().replace('_', ' ')}
              </span>
              <h3 class="font-bold text-xs mt-2 text-[#181C06]">${app.programName}</h3>
              <p class="text-[10px] text-[#181C06] opacity-75 mt-0.5">${app.agency}</p>
              
              <div class="mt-3 pt-2 border-t border-opacity-10 border-[#181C06] flex items-center justify-between text-xs">
                <span class="font-semibold text-[#181C06]">Aid Value:</span>
                <span class="font-bold" style="color: ${statusColor};">₹${app.amountRequested.toLocaleString('en-IN')}</span>
              </div>
            </div>
          `);
      });
    }

  }, [activeTab, applications, showDeclaredZone, centerCoord, userLocation]);

  // Handle polygon visibility
  useEffect(() => {
    const polygon = polygonLayerRef.current;
    const map = mapInstanceRef.current;
    if (!polygon || !map) return;

    if (showDeclaredZone) {
      polygon.addTo(map);
    } else {
      polygon.remove();
    }
  }, [showDeclaredZone]);

  return (
    <div className="bg-[#FFFAF0] border-2 border-[#81912F] border-opacity-30 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
      {/* Map Actions Header */}
      <div className="bg-[#FFFAF0] p-4 border-b border-[#81912F] border-opacity-20 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#E03F4F] rounded-full animate-pulse"></div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#181C06]">
            Interactive Disaster Aid Coordinates Map
          </h2>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 text-xs">
          <button 
            id="map-filter-all"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 font-semibold rounded-lg border transition ${
              activeTab === 'all' 
                ? 'bg-[#81912F] text-[#FFFAF0] border-[#81912F]' 
                : 'bg-transparent text-[#181C06] border-opacity-20 border-[#181C06] hover:bg-opacity-5 hover:bg-[#81912F]'
            }`}
          >
            Show All
          </button>
          <button 
            id="map-filter-centers"
            onClick={() => setActiveTab('centers')}
            className={`px-3 py-1.5 font-semibold rounded-lg border transition ${
              activeTab === 'centers' 
                ? 'bg-[#E03F4F] text-[#FFFAF0] border-[#E03F4F]' 
                : 'bg-transparent text-[#181C06] border-opacity-20 border-[#181C06] hover:bg-opacity-5 hover:bg-[#E03F4F]'
            }`}
          >
            Relief Centers
          </button>
          <button 
            id="map-filter-apps"
            onClick={() => setActiveTab('applications')}
            className={`px-3 py-1.5 font-semibold rounded-lg border transition ${
              activeTab === 'applications' 
                ? 'bg-[#F8C463] text-[#181C06] border-[#F8C463]' 
                : 'bg-transparent text-[#181C06] border-opacity-20 border-[#181C06] hover:bg-opacity-5 hover:bg-[#F8C463]'
            }`}
          >
            Applications
          </button>
        </div>

        {/* Heatmap/Toggle */}
        <div className="flex items-center gap-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={showDeclaredZone} 
              onChange={() => setShowDeclaredZone(!showDeclaredZone)} 
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#FFFAF0] after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#E03F4F]"></div>
            <span className="ml-2 text-xs font-semibold text-[#181C06] select-none">
              Disaster Zone Overlay
            </span>
          </label>
        </div>
      </div>

      {/* Map Container Leaflet Element */}
      <div className="relative flex-grow min-h-[350px]">
        <div 
          id="claimcompass-leaflet-map" 
          ref={mapContainerRef} 
          className="absolute inset-0 w-full h-full"
        ></div>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-[#FFFAF0] border border-[#81912F] border-opacity-30 rounded-lg p-3 shadow-lg z-[400] text-[10px] space-y-1.5 max-w-[150px]">
          <h4 className="font-bold text-[#181C06] border-b border-opacity-10 border-[#181C06] pb-1 uppercase tracking-wider">Map Legend</h4>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#81912F] rounded-full inline-block"></span>
            <span className="font-semibold text-[#181C06]">Your Location</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#E03F4F] rounded-full inline-block"></span>
            <span className="font-semibold text-[#181C06]">NDMA Centers</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#F8C463] rounded-full inline-block"></span>
            <span className="font-semibold text-[#181C06]">Red Cross / NGO</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 text-2 border border-[#E03F4F] bg-[#E03F4F] bg-opacity-10 inline-block h-2"></span>
            <span className="font-semibold text-[#181C06]">Declared Impact Zone</span>
          </div>
        </div>
      </div>
    </div>
  );
}
