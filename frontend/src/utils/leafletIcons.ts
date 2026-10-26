import L from 'leaflet';

/**
 * Creates a prominent, high-contrast SVG-based Leaflet DivIcon for the Candidate Business Site.
 * Styled in high-visibility crimson red with white borders and drop shadow.
 */
export function createCandidateIcon(label?: string): L.DivIcon {
  const html = `
    <div class="custom-candidate-marker" title="${label || 'Candidate Business Site'}">
      <div class="marker-pulse-ring"></div>
      <div class="marker-pin-svg">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="36" height="46">
          <path d="M16 0C7.16 0 0 7.16 0 16c0 12.5 16 28 16 28s16-15.5 16-28C32 7.16 24.84 0 16 0z" fill="#ef4444" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round"/>
          <circle cx="16" cy="15" r="6" fill="#ffffff"/>
          <circle cx="16" cy="15" r="3" fill="#ef4444"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'leaflet-candidate-div-icon',
    html,
    iconSize: [36, 46],
    iconAnchor: [18, 46],
    popupAnchor: [0, -48],
  });
}

/**
 * Creates a secondary marker for key Kolhapur landmark wards.
 */
export function createWardCenterIcon(name: string): L.DivIcon {
  const html = `
    <div class="ward-center-marker" title="Ward: ${name}">
      <div class="ward-dot"></div>
      <span class="ward-label">${name}</span>
    </div>
  `;

  return L.divIcon({
    className: 'leaflet-ward-div-icon',
    html,
    iconSize: [120, 24],
    iconAnchor: [10, 12],
    popupAnchor: [0, -14],
  });
}

/**
 * Creates sector and category-colored POI pins for multi-sector business & anchor analysis.
 * Engineered with high-contrast dual borders and drop-shadows to ensure 100% crystal-clear visibility
 * across both OSM Standard Mode (bright map) and Google Satellite Mode (dark photography).
 */
export function createRetailPoiIcon(categoryOrSector: string, name: string): L.DivIcon {
  let color = '#3b82f6';
  let iconSvg = '';

  const cat = (categoryOrSector || '').toLowerCase();

  switch (cat) {
    case 'school':
    case 'college':
    case 'education':
      color = '#2563eb'; // Royal Blue
      iconSvg = `<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>`;
      break;
    case 'hotel':
    case 'hospitality':
      color = '#d97706'; // Amber / Gold
      iconSvg = `<path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"/><path d="m9 16 .348-.24c1.465-1.013 3.84-1.013 5.304 0L15 16"/><path d="M8 7h.01"/><path d="M16 7h.01"/><path d="M12 7h.01"/><path d="M12 11h.01"/><path d="M16 11h.01"/><path d="M8 11h.01"/>`;
      break;
    case 'transit':
      color = '#7c3aed'; // Purple
      iconSvg = `<rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M8 15h.01"/><path d="M16 15h.01"/><path d="m6 19-2 2"/><path d="m18 21-2-2"/>`;
      break;
    case 'hospital':
      color = '#e11d48'; // Rose Red
      iconSvg = `<path d="M12 6v12"/><path d="M6 12h12"/><rect width="18" height="18" x="3" y="3" rx="2"/>`;
      break;
    case 'cafe':
      color = '#f59e0b'; // Warm Amber
      iconSvg = `<path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>`;
      break;
    case 'restaurant':
      color = '#ef4444'; // Red
      iconSvg = `<path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2M6 2v20M21 15v7M15 15v7"/>`;
      break;
    case 'supermarket':
      color = '#10b981'; // Green
      iconSvg = `<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>`;
      break;
    case 'apparel':
      color = '#a855f7'; // Purple
      iconSvg = `<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0"/>`;
      break;
    case 'pharmacy':
      color = '#06b6d4'; // Cyan
      iconSvg = `<path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/>`;
      break;
    case 'electronics':
      color = '#6366f1'; // Indigo
      iconSvg = `<rect width="18" height="12" x="3" y="4" rx="2"/><line x1="2" x2="22" y1="20" y2="20"/>`;
      break;
    case 'bank':
      color = '#0d9488'; // Teal
      iconSvg = `<path d="m2 7 10-5 10 5"/><path d="M4 10v10"/><path d="M10 10v10"/><path d="M14 10v10"/><path d="M20 10v10"/><path d="M2 20h20"/>`;
      break;
    case 'mall':
    case 'retail':
      color = '#f97316'; // Coral / Orange
      iconSvg = `<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>`;
      break;
    default:
      color = '#3b82f6'; // Blue
      iconSvg = `<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>`;
  }

  const html = `
    <div class="retail-poi-marker high-contrast-poi" style="--poi-color: ${color};" title="${name}">
      <div class="poi-pin-circle">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
          ${iconSvg}
        </svg>
      </div>
      <div class="poi-stem"></div>
    </div>
  `;

  return L.divIcon({
    className: 'leaflet-retail-div-icon',
    html,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -34],
  });
}
