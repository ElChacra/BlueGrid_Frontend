import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Droplets, Home, Activity, Anchor, X, FileText, Calendar } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MOCK_DASHBOARD_DATA, DashboardZoneData } from '../types';

// Component: Dynamically fits map bounds to show all markers
// Handles resize invalidation and dynamic zooming without artificial constraints
const MapBoundsController = ({ zones, selectedZone }: { zones: { coords: [number, number], id: string }[], selectedZone: string }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || zones.length === 0) return;

    // Delay slightly to allow container animations (tabs/fade-in) to finish
    const timer = setTimeout(() => {
      map.invalidateSize();

      if (selectedZone === 'all') {
        // Only fit bounds when viewing the entire region
        const bounds = L.latLngBounds(zones.map(z => z.coords));
        
        map.fitBounds(bounds, { 
          padding: [60, 60], 
          animate: true
        });
      } 
      // Explicitly do nothing if a specific zone is selected to maintain user's view
    }, 150); 

    return () => clearTimeout(timer);
  }, [map, zones, selectedZone]);

  return null;
};

const Dashboard = ({ isDarkMode }: { isDarkMode?: boolean }) => {
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [data, setData] = useState<DashboardZoneData>(MOCK_DASHBOARD_DATA['all']);
  
  // Mobile detection state
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setData(MOCK_DASHBOARD_DATA[selectedZone] || MOCK_DASHBOARD_DATA['all']);
  }, [selectedZone]);

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-google-green" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-google-red" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getIcon = (name: string) => {
    if (name === 'Octopus') return <Anchor className="w-5 h-5" />;
    if (name === 'Home') return <Home className="w-5 h-5" />;
    if (name === 'Baby') return <Droplets className="w-5 h-5" />;
    return <Activity className="w-5 h-5" />;
  };

  const COLORS = ['#4285F4', '#DB4437', '#F4B400', '#0F9D58'];

  // Initial fallback center (immediately overridden by MapBoundsController)
  const defaultCenter: [number, number] = [-41.7, -73.0];

  const zones = [
    { id: 'norte', coords: [-41.4, -72.9] as [number, number], name: 'Centro Norte', color: '#DB4437' },
    { id: 'calbuco', coords: [-41.7, -73.1] as [number, number], name: 'Arch. Calbuco', color: '#4285F4' },
    { id: 'chiloe', coords: [-42.5, -73.8] as [number, number], name: 'Centro Chiloé', color: '#0F9D58' },
  ];

  // Custom Tooltip for Recharts to match Shadcn style
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border p-3 rounded-lg shadow-lg text-sm">
          {label && <p className="font-bold text-gray-700 dark:text-gray-300 mb-1">{label}</p>}
          <p className="font-mono font-bold text-black dark:text-white">
            {payload[0].value} <span className="text-gray-400 font-normal">registros</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom Dot Logic for "Cazas con nidos"
  // Logic: Decrease (Good) -> Green, Increase (Bad) -> Red
  const CustomTrendDot = (props: any) => {
    const { cx, cy, index, value } = props;
    
    // First dot is neutral
    if (index === 0) {
       return <circle cx={cx} cy={cy} r={4} stroke="#a1a1aa" strokeWidth={2} fill={isDarkMode ? '#18181b' : '#fff'} />;
    }

    const prevValue = data.barData[index - 1].value;
    // Condition: "si decience (value < prev) está en verde, si aumenta (value > prev) se pone rojo"
    const isDecrease = value < prevValue;
    const isIncrease = value > prevValue;
    
    let color = '#a1a1aa'; // Neutral (Zinc-400)
    if (isDecrease) color = '#22c55e'; // Green
    if (isIncrease) color = '#ef4444'; // Red

    return (
      <circle cx={cx} cy={cy} r={4} stroke={color} strokeWidth={2} fill={isDarkMode ? '#18181b' : '#fff'} />
    );
  };

  return (
    <div className="animate-in fade-in zoom-in duration-300 w-full pb-20 pt-2">
      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* 1. KPI Section - Order 1 on Mobile (Top) */}
        <div className="lg:col-span-3 order-1 lg:order-none">
          <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
            {data.kpis.map((kpi) => (
              <div key={kpi.id} className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-1.5 md:p-2 bg-gray-50 dark:bg-dark-border rounded-lg border border-gray-100 dark:border-dark-border text-black dark:text-white transition-colors">
                    {getIcon(kpi.iconName)}
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] md:text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-full ${
                    kpi.trend === 'up' ? 'bg-green-50 dark:bg-green-900/20 text-google-green' : 
                    kpi.trend === 'down' ? 'bg-red-50 dark:bg-red-900/20 text-google-red' : 'bg-gray-100 dark:bg-dark-border text-gray-500'
                  }`}>
                    {getTrendIcon(kpi.trend)}
                    {kpi.trendValue}
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-black text-black dark:text-white mb-1 transition-colors">{kpi.value}</div>
                <div className="text-xs md:text-sm text-gray-500 font-medium truncate">{kpi.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Charts Section - Order 2 on Mobile (Middle) */}
        <div className="lg:col-span-1 flex flex-col gap-6 order-2 lg:order-none">
           
           {/* TOP CHART: Cazas Registradas (Blue Bars) - Previously Line */}
           <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-5 shadow-sm h-[240px] flex flex-col min-w-0 transition-colors">
              <h4 className="font-bold text-sm text-gray-600 dark:text-gray-300 mb-4 flex items-center gap-2">
                <span className="text-blue-500">Cazas Registradas</span>
                <span className="text-[10px] font-normal text-gray-400 bg-gray-50 dark:bg-dark-border px-1.5 py-0.5 rounded border border-gray-100 dark:border-dark-border">Tiempo Real</span>
              </h4>
              <div className="w-full h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="blueBarGradientLight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      </linearGradient>
                      <linearGradient id="blueBarGradientDark" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#27272a" : "#f3f4f6"} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fontWeight: 600, fill: '#9ca3af'}} 
                      dy={10} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fill: '#9ca3af'}} 
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: isDarkMode ? '#27272a' : '#f9fafb', radius: 8}} />
                    <Bar 
                      dataKey="value" 
                      fill={isDarkMode ? "url(#blueBarGradientDark)" : "url(#blueBarGradientLight)"} 
                      radius={[8, 8, 8, 8]} 
                      barSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* BOTTOM CHART: Cazas con nidos (Line) - Previously Bar */}
           <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-5 shadow-sm h-[240px] flex flex-col min-w-0 transition-colors">
              <h4 className="font-bold text-sm text-gray-600 dark:text-gray-300 mb-4 flex items-center gap-2">
                <span className="text-green-600 dark:text-green-500">Cazas con nidos registradas</span>
                <span className="text-[10px] font-normal text-gray-400 bg-gray-50 dark:bg-dark-border px-1.5 py-0.5 rounded border border-gray-100 dark:border-dark-border">Semanal</span>
              </h4>
              <div className="w-full h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.barData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grayDropLine" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a1a1aa" stopOpacity={0.3}/>
                        <stop offset="100%" stopColor="#a1a1aa" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#27272a" : "#f3f4f6"} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fontWeight: 600, fill: '#9ca3af'}} 
                      dy={10} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fill: '#9ca3af'}} 
                    />
                    <Tooltip content={<CustomTooltip />} cursor={false} />
                    
                    {/* Neutral Drop Lines */}
                    <Bar 
                      dataKey="value" 
                      barSize={2} 
                      fill="url(#grayDropLine)" 
                      radius={[2, 2, 0, 0]} 
                      isAnimationActive={false}
                    />
                    
                    {/* Line with Dynamic Colored Dots */}
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#a1a1aa" /* Neutral Gray Stroke */
                      strokeWidth={2}
                      dot={<CustomTrendDot />} /* Dynamic Dot Component */
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
           </div>

        </div>

        {/* 3. Map Section - Order 3 on Mobile (Last) */}
        {/* Transparent wrapper container */}
        <div className="lg:col-span-2 order-3 lg:order-none flex flex-col gap-6">
          
          {/* Map Card - Has the card styling */}
          <div className="bg-white dark:bg-dark-card border border-black/10 dark:border-dark-border rounded-xl overflow-hidden shadow-sm h-[300px] md:h-[500px] relative z-0 group transition-colors">
            <div className="absolute top-4 right-4 z-[400] bg-white/90 dark:bg-black/80 backdrop-blur px-3 py-1.5 rounded-md shadow-sm border border-gray-200 dark:border-dark-border text-xs font-bold flex items-center gap-2 text-black dark:text-white">
              <div className={`w-2 h-2 rounded-full ${selectedZone === 'all' ? 'bg-google-blue' : 'bg-black dark:bg-white'}`} />
              <span>Vista: {selectedZone === 'all' ? 'Región de los Lagos' : zones.find(z => z.id === selectedZone)?.name || selectedZone}</span>
              {selectedZone !== 'all' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedZone('all'); }}
                  className="ml-2 p-0.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-gray-500 hover:text-black dark:hover:text-white"
                  title="Restablecer vista"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            
            <MapContainer 
              center={defaultCenter} 
              zoom={9} 
              style={{ height: '100%', width: '100%' }}
              // LOCKED MAP: All interactions disabled for both mobile and desktop
              dragging={false}
              scrollWheelZoom={false}
              touchZoom={false}
              doubleClickZoom={false}
              zoomControl={false}
              boxZoom={false}
              keyboard={false}
              // Remove Leaflet Watermark
              attributionControl={false}
            >
              <MapBoundsController zones={zones} selectedZone={selectedZone} />
              
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {zones.map((zone) => (
                <CircleMarker 
                  key={zone.id}
                  center={zone.coords}
                  pathOptions={{ 
                    color: isDarkMode ? '#18181b' : 'white', 
                    fillColor: zone.id === selectedZone ? (isDarkMode ? '#fff' : '#000') : zone.color, 
                    fillOpacity: 1,
                    weight: 2
                  }}
                  radius={zone.id === selectedZone ? 14 : 8}
                  eventHandlers={{
                    click: () => setSelectedZone(zone.id),
                  }}
                >
                  <Popup autoPan={false}>
                    <div className="text-center">
                      <strong className="block text-sm mb-1 text-black">{zone.name}</strong>
                      <button 
                        onClick={() => setSelectedZone(zone.id)}
                        className="text-xs bg-black text-white px-2 py-1 rounded hover:bg-gray-800 font-bold"
                      >
                        Ver Métricas
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>

          {/* MOBILE-ONLY REPORT SECTION (OUTSIDE MAP CARD) */}
          {/* No borders, no background, large text - Integrated into background */}
          {isMobile && selectedZone !== 'all' && (
            <div className="px-2 animate-in slide-in-from-bottom-6 duration-500">
               {/* Header */}
               <div className="flex items-center gap-3 mb-6">
                 <div className="p-0 text-black dark:text-white">
                   <FileText className="w-6 h-6" />
                 </div>
                 <div>
                   <h3 className="font-black text-xl text-black dark:text-white leading-tight">
                     Reporte Técnico
                   </h3>
                   <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                     {zones.find(z => z.id === selectedZone)?.name}
                   </p>
                 </div>
               </div>
               
               <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-8">
                    <div className="">
                       <span className="text-xs uppercase font-bold text-gray-400 block mb-1">Total Capturas</span>
                       <span className="text-4xl font-black text-black dark:text-white tracking-tighter">
                         {data.barData.reduce((acc, curr) => acc + curr.value, 0)}
                       </span>
                    </div>
                    <div className="">
                       <span className="text-xs uppercase font-bold text-gray-400 block mb-1">Promedio Diario</span>
                       <span className="text-4xl font-black text-black dark:text-white tracking-tighter">
                         {Math.round(data.barData.reduce((acc, curr) => acc + curr.value, 0) / 7)}
                       </span>
                    </div>
                 </div>
                 
                 <div>
                    <h4 className="text-xs font-bold uppercase text-gray-500 mb-4 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Desglose Semanal
                    </h4>
                    <div className="space-y-3">
                       {data.barData.map((day) => (
                         <div key={day.name} className="flex items-center justify-between text-sm">
                            <span className="font-bold text-gray-500 dark:text-gray-400 w-8">{day.name}</span>
                            <div className="flex-1 mx-4 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                               <div 
                                 className="h-full bg-black dark:bg-white rounded-full" 
                                 style={{ width: `${(day.value / 250) * 100}%` }}
                               />
                            </div>
                            <span className="font-bold text-black dark:text-white w-8 text-right">{day.value}</span>
                         </div>
                       ))}
                    </div>
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;