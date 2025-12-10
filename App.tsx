import React, { useState, useEffect, useRef } from 'react';
import { Settings, Upload, FileImage, AlertCircle, CheckCircle2, Droplets, LayoutDashboard, ClipboardList, ChevronRight, Moon, Sun, LogOut, Camera, Plus } from 'lucide-react';
import SettingsModal from './components/SettingsModal';
import MatrixEditor from './components/MatrixEditor';
import Dashboard from './components/Dashboard';
import NotificationToast from './components/NotificationToast';
import { OCRResponse, MOCK_ZONES, MatrixCell, AppView, User, UserRole } from './types';

const STORAGE_KEY_URL = 'bluegrid_api_url';
const STORAGE_KEY_THEME = 'bluegrid_theme';
// Default URL provided for auto-connection
const DEFAULT_API_URL = "https://precrystalline-arabella-tuberoid.ngrok-free.dev";

// --- PARTICLE ANIMATION COMPONENT ---
const ParticleNetwork = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth;
    let height = canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight;

    const particles: Particle[] = [];
    const particleCount = 60; // Adjust density
    const connectionDistance = 150;
    const mouse = { x: 0, y: 0 };

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(161, 161, 170, 0.5)'; // Zinc-400 equivalent
        ctx.fill();
      }
    }

    // Init
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Update and draw particles
      particles.forEach(p => {
        p.update();
        p.draw();
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            ctx.beginPath();
            // Monochrome lines (White/Gray)
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 * (1 - distance / connectionDistance)})`; 
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 bg-transparent" />;
};

export default function App() {
  // --- Auth State ---
  const [user, setUser] = useState<User | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // --- App State ---
  const [apiUrl, setApiUrl] = useState<string>(DEFAULT_API_URL);
  const [isInitializing, setIsInitializing] = useState(true);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 'dashboard' is a new top-level view state, separate from the OCR flow state
  const [currentModule, setCurrentModule] = useState<'ocr' | 'dashboard'>('dashboard');
  
  // OCR Sub-states
  // FIX: Default to 'upload' instead of 'setup' to avoid blank screen if connection check fails
  const [view, setView] = useState<AppView>('upload'); 
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Data State
  const [ocrData, setOcrData] = useState<OCRResponse | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // --- Mobile Action Menu State ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // --- Notification State ---
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };

  // --- Effects ---

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem(STORAGE_KEY_THEME, newMode ? 'dark' : 'light');
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    const initAutoConnection = async () => {
      setIsInitializing(true);
      
      const targetUrl = DEFAULT_API_URL;
      const cleanUrl = targetUrl.replace(/\/+$/, '');

      try {
        console.log(`[Init] Intentando conexión automática a: ${cleanUrl}`);
        
        const response = await fetch(`${cleanUrl}/`, {
          method: 'GET',
          headers: { 'ngrok-skip-browser-warning': 'true' },
        });

        if (response.ok) {
          console.log("[Init] Conexión exitosa.");
          setApiUrl(cleanUrl);
          localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
          // view is already 'upload', so we don't strictly need to set it, 
          // but valid connection confirms we are ready.
          setView('upload'); 
        } else {
          throw new Error(`Status ${response.status}`);
        }
      } catch (err) {
        console.warn("[Init] Falló la conexión automática:", err);
        setApiUrl(cleanUrl);
        // We do NOT set view to 'setup' here anymore to avoid locking the UI.
        // User will land on 'upload' and see error if they try to use it.
      } finally {
        setTimeout(() => {
          setIsInitializing(false);
        }, 800);
      }
    };

    initAutoConnection();
  }, []);

  // --- Handlers ---

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    // Mock Authentication Logic
    const u = usernameInput.toLowerCase();
    const p = passwordInput;

    if (p !== '1234') {
      setLoginError('Contraseña incorrecta');
      return;
    }

    let role: UserRole | null = null;
    let name = '';

    if (u === 'admin') {
      role = 'admin';
      name = 'Administrador General';
    } else if (u === 'supervisor') {
      role = 'supervisor';
      name = 'Supervisor de Zona';
    } else if (u === 'buzo') {
      role = 'buzo';
      name = 'Operador de Buceo';
    } else {
      setLoginError('Usuario no encontrado. (Prueba: admin, supervisor, buzo)');
      return;
    }

    setUser({ username: u, name, role });

    // Redirect based on role
    if (role === 'buzo') {
      setCurrentModule('ocr');
    } else {
      setCurrentModule('dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setUsernameInput('');
    setPasswordInput('');
    resetFlow();
  };

  const handleSaveUrl = (url: string) => {
    setApiUrl(url);
    localStorage.setItem(STORAGE_KEY_URL, url);
    setIsSettingsOpen(false);
    // Ensure we are in upload view after saving settings
    setView('upload');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadError(null);
      // Auto-switch to OCR module if file selected via mobile menu
      setCurrentModule('ocr');
      setView('upload');
      setIsMobileMenuOpen(false);
    }
  };

  // Helper functions to trigger hidden inputs
  const triggerCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const triggerGallery = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError("Por favor selecciona un archivo.");
      return;
    }

    const zoneToSend = selectedZone || "1";

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('zona_id', zoneToSend);

    try {
      console.log(`[App] Subiendo a: ${apiUrl}/api/v1/registros Zona: ${zoneToSend}`);
      
      const response = await fetch(`${apiUrl}/api/v1/registros`, {
        method: 'POST',
        body: formData,
        headers: {
           'ngrok-skip-browser-warning': 'true'
        }
      });

      if (!response.ok) {
        let errorMessage = response.statusText;
        try {
          const errorBody = await response.text();
          if (errorBody) {
             try {
               const jsonError = JSON.parse(errorBody);
               errorMessage = jsonError.detail || jsonError.message || JSON.stringify(jsonError);
             } catch {
               errorMessage = errorBody;
             }
          }
        } catch (e) {}
        throw new Error(`Error Servidor (${response.status}): ${errorMessage}`);
      }

      const data: OCRResponse = await response.json();
      setOcrData(data);
      setView('editor');
    } catch (err: any) {
      console.error("[App] Error Carga:", err);
      let displayMsg = err.message || "Error desconocido.";
      if (displayMsg.includes("Failed to fetch") || displayMsg.includes("NetworkError")) {
        displayMsg = "Error de conexión. Verifica que el Colab esté activo y la URL sea correcta.";
      }
      setUploadError(displayMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleValidationSave = async (validatedCells: MatrixCell[]) => {
    if (!ocrData) return;

    try {
      const payload = {
        cambios: validatedCells,
        comentarios: `Validado por ${user?.username || 'WebClient'}`
      };

      const response = await fetch(`${apiUrl}/api/v1/registros/${ocrData.id}/validacion`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
         const errText = await response.text();
         throw new Error(`Falló validación (${response.status}): ${errText}`);
      }

      // Success Notification
      showNotification("Matriz validada y guardada correctamente", "success");
      
      setView('success');
      setSuccessMsg("¡Matriz validada y guardada correctamente!");

    } catch (err: any) {
      console.error("[App] Error validación:", err);
      let displayMsg = err.message;
      if (displayMsg.includes("Failed to fetch")) {
        displayMsg = "Error de conexión.";
      }
      showNotification(`Error al guardar: ${displayMsg}`, "error");
    }
  };

  const resetFlow = () => {
    setSelectedFile(null);
    setOcrData(null);
    setView('upload');
    setSuccessMsg(null);
  };

  // Determine layout width based on content
  const isWideLayout = currentModule === 'dashboard' || (currentModule === 'ocr' && view === 'editor');

  // RBAC Gates
  const canViewDashboard = user?.role === 'admin' || user?.role === 'supervisor';
  const canViewSettings = user?.role === 'admin';
  const isBuzo = user?.role === 'buzo';

  // --- RENDER LOADING SCREEN ---
  if (isInitializing) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-black z-50 animate-in fade-in duration-500">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
             <div className="h-20 w-20 bg-zinc-900 text-white rounded-xl flex items-center justify-center shadow-2xl shadow-zinc-800/50 z-10 relative">
                <Droplets className="w-10 h-10 text-white" />
             </div>
             <div className="absolute inset-0 bg-white/10 blur-xl rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER LOGIN SCREEN (NEW DARK MONOCHROME UI) ---
  if (!user) {
    return (
      <div className="flex h-screen w-full bg-[#050505] text-white overflow-hidden">
        {/* LEFT COLUMN: Login Form */}
        <div className="w-full lg:w-[45%] flex items-center justify-center p-8 z-10 relative">
          <div className="w-full max-w-[350px] space-y-8 animate-in slide-in-left duration-500">
            
            <div className="space-y-2">
              <div className="h-10 w-10 bg-white text-black rounded-lg flex items-center justify-center mb-6">
                <Droplets className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Bienvenido</h1>
              <p className="text-zinc-400 text-sm">Inicia sesión en tu cuenta</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Usuario</label>
                <input 
                  type="text" 
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="admin, supervisor, buzo"
                  className="w-full h-11 px-3 bg-zinc-900/50 border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-all text-sm"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Contraseña</label>
                  <a href="#" className="text-xs font-medium text-zinc-500 hover:text-white transition-colors">¿Olvidaste tu contraseña?</a>
                </div>
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-3 bg-zinc-900/50 border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-all text-sm"
                />
              </div>

              {loginError && (
                <div className="text-red-400 text-xs font-medium flex items-center gap-2 p-3 bg-red-900/10 border border-red-900/20 rounded-md">
                  <AlertCircle className="w-4 h-4" />
                  {loginError}
                </div>
              )}

              <button 
                type="submit"
                className="w-full h-11 bg-white hover:bg-zinc-200 text-black font-bold rounded-md transition-all transform active:scale-[0.99] text-sm mt-2"
              >
                Ingresar
              </button>
            </form>

            <p className="text-center text-xs text-zinc-500">
              ¿No tienes cuenta? <span className="text-white cursor-pointer font-medium hover:underline">Regístrate</span>
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: 3D Animation (Monochrome) */}
        <div className="hidden lg:flex flex-1 relative bg-[#0a0a0a] items-center justify-center overflow-hidden border-l border-zinc-900">
          <ParticleNetwork />
          
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-transparent pointer-events-none" />

          {/* Overlay Content */}
          <div className="relative z-10 max-w-lg px-10 text-center">
             <div className="mb-6 h-16 w-16 mx-auto rounded-full bg-zinc-800/30 flex items-center justify-center border border-zinc-700/30 backdrop-blur-sm">
               <Droplets className="w-8 h-8 text-white" />
             </div>
             <h2 className="text-5xl font-black tracking-tight text-white mb-4">
               Bluegrid
             </h2>
             <p className="text-zinc-400 text-lg">
               Digitalización y monitoreo de zonas acuícolas en tiempo real.
             </p>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER MAIN APP ---
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-black font-sans text-google-text dark:text-gray-100 overflow-hidden transition-colors duration-300">
      
      {/* GLOBAL TOAST NOTIFICATION */}
      {notification && (
        <NotificationToast 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}

      {canViewSettings && (
        <SettingsModal 
          isOpen={isSettingsOpen}
          currentUrl={apiUrl}
          onSave={handleSaveUrl}
          onClose={() => setIsSettingsOpen(false)}
          canClose={!!apiUrl} 
        />
      )}

      {/* Hidden File Inputs for Mobile Menu Actions */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        accept="image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={cameraInputRef} 
        onChange={handleFileSelect} 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
      />

      {/* Left Sidebar (Desktop) */}
      <aside className="hidden md:flex w-64 flex-col bg-white dark:bg-dark-card border-r border-gray-200 dark:border-dark-border h-full shrink-0 z-20 relative transition-colors duration-300">
        {/* Logo Header */}
        <div className="h-20 flex flex-col justify-center px-6 border-b border-gray-100 dark:border-dark-border">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => canViewDashboard && setCurrentModule('dashboard')}>
            <div className="h-8 w-8 bg-black dark:bg-white text-white dark:text-black rounded-md flex items-center justify-center shadow-lg shadow-black/20 dark:shadow-white/10">
              <Droplets className="w-5 h-5" />
            </div>
            <span className="font-black text-xl tracking-tight text-black dark:text-white">Bluegrid<span className="text-gray-400 font-medium">OCR</span></span>
          </div>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-border bg-gray-50/30 dark:bg-white/5">
          <div className="flex items-center gap-3">
             <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${
               user.role === 'admin' ? 'bg-purple-600' :
               user.role === 'supervisor' ? 'bg-blue-600' : 'bg-teal-600'
             }`}>
               {user.username.charAt(0).toUpperCase()}
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-sm font-bold text-black dark:text-white truncate">{user.name}</p>
               <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-mono">{user.role}</p>
             </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {canViewDashboard && (
            <button
              onClick={() => setCurrentModule('dashboard')}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all
                ${currentModule === 'dashboard' 
                  ? 'bg-gray-100 dark:bg-dark-border text-black dark:text-white' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-hover hover:text-black dark:hover:text-white'
                }
              `}
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </button>
          )}

          <button
            onClick={() => setCurrentModule('ocr')}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all
              ${currentModule === 'ocr' 
                ? 'bg-gray-100 dark:bg-dark-border text-black dark:text-white' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-hover hover:text-black dark:hover:text-white'
              }
            `}
          >
            <ClipboardList className="w-5 h-5" />
            Digitalizar
          </button>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg/30 space-y-2">
           {/* Dark Mode Toggle */}
           <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white dark:hover:bg-dark-border transition-colors text-xs font-bold text-gray-600 dark:text-gray-400 border border-transparent hover:border-gray-200 dark:hover:border-dark-border hover:shadow-sm"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-orange-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            {isDarkMode ? "Modo Claro" : "Modo Oscuro"}
          </button>

          {canViewSettings && (
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white dark:hover:bg-dark-border transition-colors text-xs font-bold text-gray-600 dark:text-gray-400 border border-transparent hover:border-gray-200 dark:hover:border-dark-border hover:shadow-sm"
            >
              <Settings className="w-4 h-4" />
              Conexión API
            </button>
          )}

           <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors text-xs font-bold border border-transparent"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
          
          <div className="pt-2 border-t border-gray-200/50 dark:border-dark-border mt-2">
             <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 leading-tight">
               Denoise - DUOC UC <br/> Universidad Austral de Chile
             </p>
             <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">Bluegrid OCR v1.2.0</p>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        
        {/* Mobile Header (Sticky) */}
        <header className="md:hidden bg-white/95 dark:bg-dark-card/95 backdrop-blur-sm border-b border-gray-200 dark:border-dark-border h-16 flex items-center justify-between px-4 shrink-0 z-40 sticky top-0 transition-colors">
           <div className="flex items-center gap-2">
            <div className="h-7 w-7 bg-black dark:bg-white text-white dark:text-black rounded-md flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
            <span className="font-black text-lg tracking-tight text-black dark:text-white">Bluegrid<span className="text-gray-400 font-medium">OCR</span></span>
          </div>
          <div className="flex items-center gap-2">
            {canViewSettings && (
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-md"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            <button onClick={handleLogout} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 scroll-smooth pb-24 md:pb-8">
           <div className={`mx-auto w-full ${isWideLayout ? 'max-w-[1600px]' : 'max-w-5xl'}`}>
            
            {/* DASHBOARD MODULE - Gated */}
            {currentModule === 'dashboard' && canViewDashboard && (
              <Dashboard isDarkMode={isDarkMode} />
            )}

            {/* OCR MODULE - Available to all authenticated */}
            {currentModule === 'ocr' && (
              <>
                {view === 'upload' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto pt-2 md:pt-10">
                    <div className="mb-6 md:mb-8">
                      <h2 className="text-2xl md:text-3xl font-black tracking-tight text-black dark:text-white mb-2">Nueva Digitalización</h2>
                      <p className="text-gray-500 text-base md:text-lg">Procesamiento inteligente de planillas de buceo.</p>
                    </div>

                    <div className="rounded-xl border border-black/10 dark:border-dark-border bg-white dark:bg-dark-card text-black dark:text-white shadow-sm overflow-hidden transition-colors duration-300">
                      <div className="p-4 md:p-8 space-y-6 md:space-y-8">
                        <div className="space-y-3">
                          <label className="text-sm font-bold leading-none flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            Zona Acuícola
                            <span className="text-xs font-normal text-gray-400 bg-gray-100 dark:bg-dark-border px-1.5 py-0.5 rounded">Requerido</span>
                          </label>
                          <div className="relative">
                            <select
                              value={selectedZone}
                              onChange={(e) => setSelectedZone(e.target.value)}
                              className="flex h-12 md:h-14 w-full items-center justify-between rounded-lg border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg px-4 py-2 text-base text-black dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all appearance-none"
                            >
                              <option value="">-- Seleccionar Centro de Cultivo --</option>
                              {MOCK_ZONES.map(z => (
                                <option key={z.id} value={z.id}>{z.name}</option>
                              ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                              <ChevronRight className="w-5 h-5 rotate-90" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-sm font-bold leading-none text-gray-700 dark:text-gray-300">
                            Imagen de Planilla
                          </label>
                          <label 
                            className={`
                              flex flex-col items-center justify-center w-full h-48 md:h-72 border-2 border-dashed rounded-xl cursor-pointer transition-all group relative overflow-hidden
                              ${selectedFile 
                                ? 'border-black dark:border-white bg-gray-50 dark:bg-dark-bg' 
                                : 'border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-hover hover:border-black dark:hover:border-white'
                              }
                            `}
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4 z-10">
                              {selectedFile ? (
                                <>
                                  <div className="p-4 md:p-5 bg-black dark:bg-white text-white dark:text-black rounded-full mb-3 md:mb-4 shadow-xl shadow-black/20 dark:shadow-white/10 group-hover:scale-110 transition-transform">
                                    <FileImage className="w-6 h-6 md:w-8 md:h-8" />
                                  </div>
                                  <p className="text-lg md:text-xl font-bold text-black dark:text-white tracking-tight truncate max-w-[200px] md:max-w-xs">{selectedFile.name}</p>
                                  <p className="text-sm text-gray-500 mt-1 font-mono bg-white dark:bg-dark-card px-2 py-0.5 rounded border border-gray-200 dark:border-dark-border">
                                    {(selectedFile.size / 1024).toFixed(1)} KB
                                  </p>
                                  <p className="text-xs text-google-blue mt-4 md:mt-6 font-bold group-hover:underline flex items-center gap-1">
                                    <Upload className="w-3 h-3" /> Cambiar archivo
                                  </p>
                                </>
                              ) : (
                                <>
                                  <div className="p-4 md:p-5 bg-gray-100 dark:bg-dark-border rounded-full mb-4 md:mb-5 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                                    <Camera className="w-8 h-8 md:w-10 md:h-10 text-gray-400 dark:text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors" />
                                  </div>
                                  <p className="mb-2 text-lg md:text-xl text-black dark:text-white font-bold">Tomar Foto / Subir</p>
                                  <p className="text-sm text-gray-400 max-w-xs mx-auto">Toca para abrir cámara o galería</p>
                                </>
                              )}
                            </div>
                            <input type="file" className="hidden" onChange={handleFileSelect} accept="image/*" />
                          </label>
                        </div>

                        {uploadError && (
                          <div className="bg-red-50 dark:bg-red-900/10 border border-google-red/30 text-google-red text-sm p-4 rounded-lg flex items-start gap-3 animate-in fade-in">
                            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                            <div className="font-medium leading-relaxed">{uploadError}</div>
                          </div>
                        )}

                        <button
                          onClick={handleUpload}
                          disabled={isUploading || !selectedFile}
                          className="inline-flex items-center justify-center rounded-lg text-base font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white disabled:opacity-50 disabled:pointer-events-none bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 h-14 px-8 w-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
                        >
                          {isUploading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin mr-3" />
                              Procesando...
                            </>
                          ) : (
                            "Procesar Planilla"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {view === 'editor' && ocrData && (
                  <MatrixEditor 
                    data={ocrData}
                    imageFile={selectedFile}
                    onSave={handleValidationSave}
                    onNotify={showNotification} 
                    onCancel={resetFlow} 
                  />
                )}

                {view === 'success' && (
                  <div className="flex flex-col items-center justify-center py-10 md:py-20 animate-in zoom-in duration-300 text-center max-w-md mx-auto px-4">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-google-green/20 blur-xl rounded-full"></div>
                      <div className="relative h-24 w-24 md:h-28 md:w-28 bg-white dark:bg-dark-card rounded-full flex items-center justify-center border-4 border-google-green/10 shadow-xl">
                        <CheckCircle2 className="w-12 h-12 md:w-14 md:h-14 text-google-green" />
                      </div>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight text-black dark:text-white mb-4">¡Listo!</h2>
                    <p className="text-gray-500 text-base md:text-lg mb-8 leading-relaxed">
                      Datos guardados y sincronizados correctamente.
                    </p>
                    <button 
                      onClick={resetFlow}
                      className="inline-flex items-center justify-center rounded-lg text-base font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:opacity-50 disabled:pointer-events-none bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 h-14 px-10 shadow-lg w-full md:w-auto"
                    >
                      Nueva Planilla
                    </button>
                  </div>
                )}
              </>
            )}
           </div>
        </main>

        {/* MOBILE OVERLAY ACTION MENU (Z-2000 to be absolutely top) */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[2000] flex flex-col justify-end pb-28 items-center px-4 pointer-events-none">
            {/* Backdrop handled by a click handler on a div behind */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={() => setIsMobileMenuOpen(false)} />
            
            <div 
                className="pointer-events-auto w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl animate-in slide-in-bottom fade-in duration-300 flex flex-col gap-4 relative z-10"
                onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto opacity-50 mb-2" />
              <h3 className="text-white text-center font-bold text-lg mb-2">Nueva Digitalización</h3>

              <button 
                onClick={() => { triggerCamera(); setIsMobileMenuOpen(false); }}
                className="w-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-bold h-14 rounded-xl shadow-sm flex items-center justify-center active:scale-95 transition-all"
              >
                <span className="text-base tracking-wide">Tomar Captura</span>
              </button>
              
              <button 
                onClick={() => { triggerGallery(); setIsMobileMenuOpen(false); }}
                className="w-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-bold h-14 rounded-xl shadow-sm flex items-center justify-center active:scale-95 transition-all"
              >
                <span className="text-base tracking-wide">Cargar Imagen</span>
              </button>
            </div>
          </div>
        )}

        {/* MOBILE BOTTOM FLOATING ACTION BUTTON (md:hidden) - NO BAR CONTAINER */}
        {!selectedFile && (
          <div className="md:hidden fixed bottom-8 left-0 w-full z-[1001] flex justify-center pointer-events-none">
             <button 
               onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
               className={`
                 pointer-events-auto
                 h-20 w-20 rounded-full flex items-center justify-center transition-all duration-300 transform
                 bg-black text-white 
                 shadow-[0_0_30px_rgba(0,0,0,0.5)] dark:shadow-[0_0_30px_rgba(255,255,255,0.2)]
                 ${isMobileMenuOpen ? 'rotate-45 scale-110' : 'hover:scale-105 active:scale-95'}
               `}
             >
               <Plus className="w-10 h-10" />
             </button>
          </div>
        )}

      </div>
    </div>
  );
}