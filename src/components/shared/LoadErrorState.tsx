import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface LoadErrorStateProps {
  message?: string;
  onRetry: () => void;
}

/** Estado de error de carga con botón de reintento. */
export default function LoadErrorState({ message, onRetry }: LoadErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-[#FF453A]/10 flex items-center justify-center mb-4">
        <AlertTriangle size={24} className="text-[#FF453A]" />
      </div>
      <p className="text-white font-medium">No se pudieron cargar los datos</p>
      <p className="text-sm text-[#8E8E93] mt-1">{message ?? 'Comprueba tu conexión e inténtalo de nuevo.'}</p>
      <Button variant="secondary" className="mt-4" onClick={onRetry}>
        <RotateCw size={14} /> Reintentar
      </Button>
    </div>
  );
}
