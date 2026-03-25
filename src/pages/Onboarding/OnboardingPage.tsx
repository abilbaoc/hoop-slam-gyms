import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import type { OnboardingData } from '../../types/onboarding';
import { DEFAULT_ONBOARDING } from '../../types/onboarding';
import StepIndicator from './StepIndicator';
import StepGymInfo from './StepGymInfo';
import StepHours from './StepHours';
import StepCourt from './StepCourt';
import StepComplete from './StepComplete';
import { toast } from 'sonner';
import { createGym } from '../../data/api';

const STEP_LABELS = ['Gimnasio', 'Horarios', 'Canasta', 'Listo'];
const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const { isAuthenticated, currentUser, updateUserGymIds, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({ ...DEFAULT_ONBOARDING });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const validateStep = (): boolean => {
    const e: Record<string, string> = {};
    if (currentStep === 0) {
      if (!data.gym.name.trim()) e.name = 'El nombre es obligatorio';
      if (!data.gym.address.trim()) e.address = 'La direccion es obligatoria';
      if (!data.gym.city.trim()) e.city = 'La ciudad es obligatoria';
    }
    if (currentStep === 2) {
      if (!data.court.name.trim()) e.name = 'El nombre de la canasta es obligatorio';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (!validateStep()) return; setErrors({}); setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS - 1)); };
  const handleBack = () => { setErrors({}); setCurrentStep((s) => Math.max(s - 1, 0)); };
  const handleSkip = () => { setErrors({}); setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS - 1)); };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      const newGym = await createGym({
        name: data.gym.name,
        city: data.gym.city,
        address: data.gym.address,
      });
      updateUserGymIds([...(currentUser?.gymIds || []), newGym.id]);
      toast.success(`Club "${newGym.name}" creado correctamente`);
      navigate(`/gym/${newGym.id}/dashboard`);
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Error al crear el club');
    } finally {
      setSubmitting(false);
    }
  };

  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const canSkip = currentStep === 1;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="h-16 border-b border-[#2C2C2E] flex items-center px-6">
        <h1 className="font-display text-xl text-[#7BFF00]">HOOP SLAM</h1>
        <span className="ml-3 text-xs text-[#636366]">Configuracion inicial</span>
        <button
          onClick={signOut}
          className="ml-auto text-xs text-[#636366] hover:text-white transition-colors"
        >
          Cerrar sesión
        </button>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-xl space-y-8">
          <StepIndicator totalSteps={TOTAL_STEPS} currentStep={currentStep} labels={STEP_LABELS} />
          <div className="bg-[#0A0A0F] border border-[#2C2C2E] rounded-2xl p-6 sm:p-8 min-h-[320px]">
            {currentStep === 0 && <StepGymInfo data={data.gym} onChange={(gym) => setData((d) => ({ ...d, gym }))} errors={errors} />}
            {currentStep === 1 && <StepHours data={data.hours} onChange={(hours) => setData((d) => ({ ...d, hours }))} />}
            {currentStep === 2 && <StepCourt data={data.court} onChange={(court) => setData((d) => ({ ...d, court }))} errors={errors} />}
            {currentStep === 3 && <StepComplete data={data} />}
          </div>
          <div className="flex items-center justify-between">
            <div>{currentStep > 0 && !isLastStep && <Button variant="ghost" onClick={handleBack}><ArrowLeft size={16} /> Atras</Button>}</div>
            <div className="flex items-center gap-3">
              {canSkip && <Button variant="ghost" onClick={handleSkip}>Saltar</Button>}
              {isLastStep ? (
                <Button variant="primary" size="lg" onClick={handleFinish} disabled={submitting}>
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Ir al Dashboard'}
                </Button>
              ) : (
                <Button variant="primary" onClick={handleNext}>Siguiente <ArrowRight size={16} /></Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
