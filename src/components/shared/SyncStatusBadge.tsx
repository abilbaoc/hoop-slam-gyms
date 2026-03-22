interface SyncStatusBadgeProps {
  synced: boolean;
}

export default function SyncStatusBadge({ synced }: SyncStatusBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1.5 text-xs">
      <span
        className={`h-2 w-2 rounded-full ${
          synced ? 'bg-[#7BFF00]' : 'bg-yellow-400 animate-pulse'
        }`}
      />
      <span className={synced ? 'text-[#7BFF00]' : 'text-yellow-400'}>
        {synced ? 'Sincronizado' : 'Sincronizando...'}
      </span>
    </div>
  );
}
