interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'default';
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  variant = 'default',
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="bg-[#1C1C1E] rounded-2xl p-6 w-full max-w-sm mx-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm text-[#8E8E93] mt-2">{message}</p>
        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onCancel}
            className="bg-[#2C2C2E] text-white px-4 py-2 rounded-xl text-sm hover:bg-[#3C3C3E] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              variant === 'danger'
                ? 'bg-[#FF453A] text-white hover:bg-[#FF453A]/80'
                : 'bg-[#7BFF00] text-black hover:bg-[#7BFF00]/80'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
