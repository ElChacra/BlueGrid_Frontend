import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface NotificationToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ 
  message, 
  type, 
  onClose, 
  duration = 4000 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const enterTimer = setTimeout(() => setIsVisible(true), 10);
    
    // Trigger exit
    const exitTimer = setTimeout(() => {
      setIsVisible(false);
    }, duration - 300); // Start exit animation slightly before unmount

    // Actual unmount
    const closeTimer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(closeTimer);
    };
  }, [onClose, duration]);

  return (
    <div 
      className={`
        fixed bottom-6 right-6 z-[100] flex w-full max-w-sm items-center gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-xl transition-all duration-300 ease-in-out dark:border-zinc-800 dark:bg-zinc-950
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
      `}
      role="alert"
    >
      <div className="flex-shrink-0">
        {type === 'success' ? (
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
        ) : (
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500" />
        )}
      </div>
      
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {type === 'success' ? 'Operación Exitosa' : 'Error'}
        </h3>
        <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
          {message}
        </div>
      </div>

      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="group -my-1.5 -mr-1.5 ml-auto flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-transparent text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
      >
        <span className="sr-only">Close</span>
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default NotificationToast;