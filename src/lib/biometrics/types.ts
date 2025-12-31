// --- 1. FACE DATA TYPES ---

// Standard bio-metric data captured during "First Time" setup
export interface FaceBioMetric {
  id: string; // UUID of the metric
  userId: string;
  type: 'face_id' | 'iris_pattern' | 'face_geometry' | 'skin_tone';
  value: string; // Base64 string or hash
  confidence: number; // 0.0 to 1.0
}

// --- 2. PALM DATA TYPES ---

// Data captured from an "Ink" scanner or Palm Print device
export interface PalmBioMetric {
  id: string;
  userId: string;
  type: 'fingerprint' | 'palm_geometry' | 'vein_pattern';
  points: Float32Array; // The raw 3D point cloud or image buffer
  features: {
    ridges: string[];
    minutiae: string[]; // Specific features (e.g., "delta_x")
  };
  // Interaction state (Command Center)
  handPosition: { x: number; y: number; z: number }; // Current 3D pos of hand
  gesture: 'wave' | 'pinch' | 'swipe_left' | 'swipe_right' | 'idle';
}

// --- 3. BIOMETRIC EVENT TYPES ---

// Events triggered by the system
export interface BiometricEvent {
  id: string;
  type: 'enrollment' | 'verification' | 'palm_print';
  timestamp: number;
  success: boolean;
  confidence: number;
  details?: any;
}
