import React, { useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'info';
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', duration = 5000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-in-up">
      <div className={`flex items-center gap-3 max-w-md p-4 rounded-lg shadow-lg ${
        type === 'success'
          ? 'bg-green-50 border border-green-200'
          : 'bg-yellow-50 border border-yellow-200'
      }`}>
        {type === 'success' && (
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
        )}
        <p className={`flex-1 text-sm font-medium ${
          type === 'success' ? 'text-green-800' : 'text-yellow-800'
        }`}>
          {message}
        </p>
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${
            type === 'success' ? 'text-green-600 hover:text-green-800' : 'text-yellow-600 hover:text-yellow-800'
          } transition-colors`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
