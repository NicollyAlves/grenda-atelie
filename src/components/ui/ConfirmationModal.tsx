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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-border/50 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`p-3 rounded-full ${config.iconBg}`}>
            {config.icon}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-display font-bold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
          </div>

          <div className="flex flex-col w-full gap-2 pt-2">
            <button 
              onClick={onConfirm}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${config.btnClass}`}
            >
              {confirmText}
            </button>
            <button 
              onClick={onCancel}
              className="w-full py-3 rounded-xl font-semibold text-sm border border-border/50 text-muted-foreground hover:bg-muted/50 transition-all active:scale-[0.98]"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
