import React, { useState, useEffect } from 'react';
import { Server, CheckCircle2, XCircle, Save, Activity } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  currentUrl: string;
  onSave: (url: string) => void;
  onClose: () => void;
  canClose: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  currentUrl,
  onSave,
  onClose,
  canClose,
}) => {
  const [urlInput, setUrlInput] = useState(currentUrl);
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    setUrlInput(currentUrl);
  }, [currentUrl]);

  if (!isOpen) return null;

  const handleSmokeTest = async () => {
    setStatus('testing');
    setStatusMsg('Conectando con el servidor...');

    // Remove ANY trailing slashes using regex
    const cleanUrl = urlInput.replace(/\/+$/, '');

    try {
      console.log(`[Config] Probando conexión: ${cleanUrl}/`);
      
      const response = await fetch(`${cleanUrl}/`, {
        method: 'GET',
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });

      if (response.ok) {
        setStatus('success');
        setStatusMsg('Sistema En Línea: 200 OK');
      } else {
        setStatus('error');
        setStatusMsg(`Error: ${response.status} ${response.statusText}`);
      }
    } catch (err: any) {
      setStatus('error');
      console.error("Error de conexión:", err);
      
      let displayMsg = 'Falló la conexión.';
      if (err.message && (err.message.includes("Failed to fetch") || err.message.includes("NetworkError"))) {
        displayMsg = "Error de conexión. Verifica Colab y la URL.";
      }
      setStatusMsg(displayMsg);
    }
  };

  const handleSave = () => {
    const cleanUrl = urlInput.replace(/\/+$/, '');
    
    if (status !== 'success') {
      if (!confirm("La prueba de conexión no fue exitosa. ¿Guardar de todos modos?")) return;
    }
    
    onSave(cleanUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-black/10 dark:border-dark-border transition-colors">
        <div className="px-6 py-4 border-b border-black/5 dark:border-dark-border flex items-center justify-between bg-white dark:bg-dark-card">
          <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-black dark:text-white" />
            Configuración de API
          </h2>
          {canClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
              ✕
            </button>
          )}
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-bold leading-none text-black dark:text-white">
              URL Base (Ngrok)
            </label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setStatus('idle');
              }}
              placeholder="https://xxxx.ngrok-free.app"
              className="flex h-10 w-full rounded-md border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg px-3 py-2 text-sm text-black dark:text-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:border-transparent transition-all"
            />
            <p className="text-[0.8rem] text-gray-500 dark:text-gray-400">
              Ingresa la URL pública generada por Ngrok.
            </p>
          </div>

          {/* Status Indicator */}
          <div className={`flex items-center gap-3 p-3 rounded-md text-sm border ${
            status === 'idle' ? 'bg-gray-50 dark:bg-dark-border border-gray-200 dark:border-dark-border text-gray-500 dark:text-gray-400' :
            status === 'testing' ? 'bg-blue-50 dark:bg-blue-900/20 border-google-blue/20 text-google-blue' :
            status === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-google-green/20 text-google-green' :
            'bg-red-50 dark:bg-red-900/20 border-google-red/20 text-google-red'
          }`}>
             {status === 'idle' && <Activity className="w-4 h-4" />}
             {status === 'testing' && <div className="w-4 h-4 border-2 border-google-blue border-t-transparent rounded-full animate-spin" />}
             {status === 'success' && <CheckCircle2 className="w-4 h-4" />}
             {status === 'error' && <XCircle className="w-4 h-4" />}
             <span className="font-semibold">{statusMsg || "Listo para probar"}</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSmokeTest}
              disabled={!urlInput || status === 'testing'}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white disabled:opacity-50 disabled:pointer-events-none border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg hover:bg-gray-50 dark:hover:bg-dark-hover hover:text-black dark:hover:text-white h-10 px-4 py-2 w-full text-gray-700 dark:text-gray-300"
            >
              Probar Conexión
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center justify-center rounded-md text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white disabled:opacity-50 disabled:pointer-events-none bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 h-10 px-4 py-2 w-full gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;