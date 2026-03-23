import { useState, useRef, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Button } from '../ui/Button';

interface ExportButtonProps {
  onExportCSV: () => void;
  onExportPDF?: () => void;
  loading?: boolean;
}

export default function ExportButton({ onExportCSV, onExportPDF, loading }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen(o => !o)}
        disabled={loading}
      >
        <Download size={16} />
        Exportar
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-[#1C1C1E] border border-[#2C2C2E] rounded-xl shadow-xl overflow-hidden min-w-[160px]">
          <button
            className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#2C2C2E] transition-colors"
            onClick={() => { onExportCSV(); setOpen(false); }}
          >
            Exportar CSV
          </button>
          {onExportPDF && (
            <button
              className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#2C2C2E] transition-colors border-t border-[#2C2C2E]"
              onClick={() => { onExportPDF(); setOpen(false); }}
            >
              Exportar PDF
            </button>
          )}
        </div>
      )}
    </div>
  );
}
