import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger'
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: <X className="h-6 w-6 text-destructive" />,
      btnClass: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
      iconBg: 'bg-destructive/10'
    },
    warning: {
      icon: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
      btnClass: 'bg-yellow-500 hover:bg-yellow-600 text-white',
      iconBg: 'bg-yellow-500/10'
    },
    info: {
      icon: <AlertTriangle className="h-6 w-6 text-primary" />,
      btnClass: 'btn-hero',
      iconBg: 'bg-primary/10'
    }
  };

  const config = typeConfig[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="bg-background/95 rounded-3xl p-8 w-full max-w-sm shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border border-border/40 animate-in zoom-in-95 duration-300 relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Abstract background highlight */}
        <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-10 blur-3xl ${type === 'danger' ? 'bg-destructive' : 'bg-primary'}`} />
        
        <div className="flex flex-col items-center text-center space-y-6">
          <div className={`p-4 rounded-2xl ${config.iconBg} shadow-inner`}>
            {config.icon}
          </div>
          
          <div className="space-y-3">
            <h3 className="text-2xl font-display font-medium text-foreground tracking-tight">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed px-2 font-medium">{message}</p>
          </div>

          <div className="flex flex-col w-full gap-3 pt-4">
            <button 
              onClick={onConfirm}
              className={`w-full py-4 rounded-2xl font-bold text-sm transition-all duration-300 active:scale-[0.97] shadow-lg shadow-black/20 ${config.btnClass}`}
            >
              {confirmText}
            </button>
            <button 
              onClick={onCancel}
              className="w-full py-4 rounded-2xl font-bold text-sm border border-border/50 text-muted-foreground hover:bg-muted/30 transition-all duration-300 active:scale-[0.97]"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
