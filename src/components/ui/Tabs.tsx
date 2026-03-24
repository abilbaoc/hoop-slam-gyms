interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}

export default function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex border-b border-[#2C2C2E]">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={[
              'px-4 py-2.5 text-sm font-medium transition-colors relative cursor-pointer',
              isActive ? 'text-white' : 'text-[#8E8E93] hover:text-white',
            ].join(' ')}
          >
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7BFF00] rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// Named export for backwards compatibility
export { Tabs };
