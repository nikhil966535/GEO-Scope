export interface KolhapurArea {
  id: string;
  name: string;
  lat: number;
  lng: number;
  zoom: number;
  category: 'commercial' | 'retail' | 'residential_prime' | 'student_hub' | 'heritage_tourism';
  description: string;
  recommendedRadius: number; // in meters
}

export interface KolhapurHotspot {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  ward: string;
}

export const KOLHAPUR_CENTER = {
  lat: 16.7050,
  lng: 74.2433,
  zoom: 14,
  name: 'Kolhapur City Center',
};

export const KOLHAPUR_AREAS: KolhapurArea[] = [
  {
    id: 'rajarampuri',
    name: 'Rajarampuri (Commercial & Retail Corridor)',
    lat: 16.6917,
    lng: 74.2442,
    zoom: 16,
    category: 'commercial',
    description: 'Premier retail and commercial zone spanning 1st to 14th lane; high spending power and retail density.',
    recommendedRadius: 500,
  },
  {
    id: 'tarabai-park',
    name: 'Tarabai Park (High-Income Residential & Offices)',
    lat: 16.7118,
    lng: 74.2312,
    zoom: 16,
    category: 'residential_prime',
    description: 'Upscale residential neighborhood with corporate branch offices, clinics, specialty boutique cafes.',
    recommendedRadius: 1000,
  },
  {
    id: 'shahupuri',
    name: 'Shahupuri (Trade, Hotels & Financial Hub)',
    lat: 16.7025,
    lng: 74.2383,
    zoom: 16,
    category: 'commercial',
    description: 'Historic commercial center near Central Bus Stand and Railway Station; heavy floating business traffic.',
    recommendedRadius: 500,
  },
  {
    id: 'bindu-chowk',
    name: 'Bindu Chowk / Mahalaxmi Temple (Heritage & Tourism)',
    lat: 16.6956,
    lng: 74.2237,
    zoom: 16,
    category: 'heritage_tourism',
    description: 'Cultural nucleus surrounding Ambabai Temple; intense weekend and festival footfall from pilgrims and tourists.',
    recommendedRadius: 500,
  },
  {
    id: 'shivaji-university',
    name: 'Shivaji University / Vidyanagar (Student Hub)',
    lat: 16.6775,
    lng: 74.2547,
    zoom: 15,
    category: 'student_hub',
    description: 'Youth demographic hub with university campus, engineering colleges, hostels, and student budget dining.',
    recommendedRadius: 1000,
  },
  {
    id: 'nagala-park',
    name: 'Nagala Park (Administrative & Upscale Mixed)',
    lat: 16.7170,
    lng: 74.2260,
    zoom: 16,
    category: 'residential_prime',
    description: 'Government collector office zone, lush residential streets, and fine-dining restaurants.',
    recommendedRadius: 1000,
  },
  {
    id: 'kasba-bawada',
    name: 'Kasba Bawada (North Commercial & Agro-Industrial)',
    lat: 16.7320,
    lng: 74.2520,
    zoom: 15,
    category: 'commercial',
    description: 'Expanding northern suburb along the Panchganga river corridor; mixed trade and growing residential clusters.',
    recommendedRadius: 1500,
  },
];

export const KOLHAPUR_HOTSPOTS: KolhapurHotspot[] = [
  {
    id: 'rajarampuri-lane-2',
    name: 'Rajarampuri 2nd Lane',
    category: 'Retail & Cafes',
    lat: 16.6925,
    lng: 74.2448,
    ward: 'Rajarampuri',
  },
  {
    id: 'dyp-mall',
    name: 'DYP City Mall (Sayaji)',
    category: 'Mall & High Footfall',
    lat: 16.7088,
    lng: 74.2410,
    ward: 'Tarabai Park',
  },
  {
    id: 'mahalaxmi-gate',
    name: 'Mahalaxmi Temple Gate',
    category: 'Pilgrimage Tourism',
    lat: 16.6956,
    lng: 74.2237,
    ward: 'Bindu Chowk',
  },
  {
    id: 'rankala-chowpatty',
    name: 'Rankala Chowpatty',
    category: 'Evening Food / Leisure',
    lat: 16.6908,
    lng: 74.2155,
    ward: 'Bindu Chowk / Rankala',
  },
  {
    id: 'cyber-chowk',
    name: 'Cyber Chowk',
    category: 'Student Hub & QSR',
    lat: 16.6795,
    lng: 74.2520,
    ward: 'Shivaji University',
  },
  {
    id: 'cbs-station',
    name: 'Railway Station (CBS)',
    category: 'Transit & Hotels',
    lat: 16.7025,
    lng: 74.2383,
    ward: 'Shahupuri',
  },
];
