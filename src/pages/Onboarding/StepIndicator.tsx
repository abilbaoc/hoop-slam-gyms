interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
  labels?: string[];
}

export default function StepIndicator({ totalSteps, currentStep, labels }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                i < currentStep
                  ? 'bg-[#7BFF00] text-black'
                  : i === currentStep
                    ? 'bg-[#7BFF00]/20 text-[#7BFF00] ring-2 ring-[#7BFF00]'
                    : 'bg-[#2C2C2E] text-[#636366]'
              }`}
            >
              {i < currentStep ? '✓' : i + 1}
            </div>
            {labels?.[i] && (
              <span className={`text-[10px] ${i <= currentStep ? 'text-[#8E8E93]' : 'text-[#636366]'}`}>
                {labels[i]}
              </span>
            )}
          </div>
          {i < totalSteps - 1 && (
            <div className={`w-12 h-0.5 ${i < currentStep ? 'bg-[#7BFF00]' : 'bg-[#2C2C2E]'} transition-colors duration-300`} />
          )}
        </div>
      ))}
    </div>
  );
}
