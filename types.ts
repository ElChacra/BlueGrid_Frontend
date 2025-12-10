

// Definitions based on the provided API Contract (Bluegrid_OCRv2)

export type UserRole = 'admin' | 'supervisor' | 'buzo';

export interface User {
  username: string;
  name: string;
  role: UserRole;
}

export interface MatrixCell {
  fila: string | number; // Backend now sends "Fila 1", but we support number for legacy/internal use
  col: number;
  valor: string;
  confianza: number;
  // New fields for Human-in-the-Loop training
  ref_id?: string;     // Unique ID from backend (e.g., "R0_C1") to map specific cropped files
  recorte_base64?: string; // Legacy: Base64 image crop
  valor_original?: string; // To store the initial prediction if needed explicitly
}

export interface IA_Result {
  status: string; // 'procesado_ia_tablilla' | 'simulacion' | 'error'
  promedio_confianza: number;
  matriz: MatrixCell[];
}

export interface OCRResponse {
  id: number;
  estado: string; // e.g., 'pendiente_validacion'
  zona_id: number;
  resultado_ia: IA_Result;
}

export interface ValidationRequest {
  cambios: MatrixCell[];
  comentarios?: string;
}

export type AppView = 'setup' | 'upload' | 'editor' | 'success';

export interface ZoneOption {
  id: string;
  name: string;
}

// Mock zones translated to Spanish
export const MOCK_ZONES: ZoneOption[] = [
  { id: '1', name: 'Zona Norte - Jaula 101' },
  { id: '2', name: 'Zona Sur - Jaula 205' },
  { id: '3', name: 'Laboratorio Central' },
  { id: '4', name: 'Área de Cuarentena' },
];

// --- DASHBOARD TYPES & MOCKS ---

export interface KPI {
  id: string;
  label: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  iconName: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface DashboardZoneData {
  kpis: KPI[];
  barData: ChartDataPoint[];
  pieData: ChartDataPoint[];
}

export const MOCK_DASHBOARD_DATA: Record<string, DashboardZoneData> = {
  'all': {
    kpis: [
      { id: '1', label: 'Captura Total Pulpos', value: '1,240', trend: 'up', trendValue: '+12%', iconName: 'Octopus' },
      { id: '2', label: '% Ocupación Cuevas', value: '85%', trend: 'up', trendValue: '+5%', iconName: 'Home' },
      { id: '3', label: 'Tasa Reproductiva', value: '32%', trend: 'down', trendValue: '-2%', iconName: 'Baby' },
      { id: '4', label: 'Eficiencia Operativa', value: '98%', trend: 'neutral', trendValue: '0%', iconName: 'Activity' },
    ],
    barData: [
      { name: 'Lun', value: 120 }, { name: 'Mar', value: 150 }, { name: 'Mie', value: 180 },
      { name: 'Jue', value: 140 }, { name: 'Vie', value: 200 }, { name: 'Sab', value: 250 }, { name: 'Dom', value: 200 }
    ],
    pieData: [
      { name: 'Machos', value: 400 }, { name: 'Hembras', value: 500 },
      { name: 'Hembras c/H', value: 200 }, { name: 'Vacíos', value: 140 }
    ]
  },
  'norte': {
    kpis: [
      { id: '1', label: 'Captura Zona Norte', value: '450', trend: 'up', trendValue: '+8%', iconName: 'Octopus' },
      { id: '2', label: '% Ocupación', value: '92%', trend: 'up', trendValue: '+10%', iconName: 'Home' },
      { id: '3', label: 'Tasa Reproductiva', value: '28%', trend: 'down', trendValue: '-5%', iconName: 'Baby' },
      { id: '4', label: 'Eficiencia', value: '95%', trend: 'up', trendValue: '+1%', iconName: 'Activity' },
    ],
    barData: [
      { name: 'Lun', value: 50 }, { name: 'Mar', value: 60 }, { name: 'Mie', value: 80 },
      { name: 'Jue', value: 40 }, { name: 'Vie', value: 90 }, { name: 'Sab', value: 100 }, { name: 'Dom', value: 30 }
    ],
    pieData: [
      { name: 'Machos', value: 150 }, { name: 'Hembras', value: 200 },
      { name: 'Hembras c/H', value: 50 }, { name: 'Vacíos', value: 50 }
    ]
  },
  'calbuco': {
    kpis: [
      { id: '1', label: 'Captura Calbuco', value: '380', trend: 'down', trendValue: '-4%', iconName: 'Octopus' },
      { id: '2', label: '% Ocupación', value: '70%', trend: 'down', trendValue: '-12%', iconName: 'Home' },
      { id: '3', label: 'Tasa Reproductiva', value: '45%', trend: 'up', trendValue: '+15%', iconName: 'Baby' },
      { id: '4', label: 'Eficiencia', value: '100%', trend: 'up', trendValue: 'Max', iconName: 'Activity' },
    ],
    barData: [
      { name: 'Lun', value: 40 }, { name: 'Mar', value: 40 }, { name: 'Mie', value: 50 },
      { name: 'Jue', value: 50 }, { name: 'Vie', value: 60 }, { name: 'Sab', value: 80 }, { name: 'Dom', value: 60 }
    ],
    pieData: [
      { name: 'Machos', value: 80 }, { name: 'Hembras', value: 100 },
      { name: 'Hembras c/H', value: 150 }, { name: 'Vacíos', value: 50 }
    ]
  },
  'chiloe': {
    kpis: [
      { id: '1', label: 'Captura Chiloé', value: '410', trend: 'up', trendValue: '+20%', iconName: 'Octopus' },
      { id: '2', label: '% Ocupación', value: '88%', trend: 'up', trendValue: '+2%', iconName: 'Home' },
      { id: '3', label: 'Tasa Reproductiva', value: '30%', trend: 'neutral', trendValue: '0%', iconName: 'Baby' },
      { id: '4', label: 'Eficiencia', value: '99%', trend: 'up', trendValue: '+5%', iconName: 'Activity' },
    ],
    barData: [
      { name: 'Lun', value: 30 }, { name: 'Mar', value: 50 }, { name: 'Mie', value: 50 },
      { name: 'Jue', value: 50 }, { name: 'Vie', value: 50 }, { name: 'Sab', value: 70 }, { name: 'Dom', value: 110 }
    ],
    pieData: [
      { name: 'Machos', value: 170 }, { name: 'Hembras', value: 200 },
      { name: 'Hembras c/H', value: 0 }, { name: 'Vacíos', value: 40 }
    ]
  }
};