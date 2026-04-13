import { useState, useRef, useCallback, useEffect } from "react";

type WizardOptions<T> = {
  initialData: T;
  totalSteps: number;
  onSubmit: (data: T) => Promise<void> | void;
  persistKey?: string;
};

export function useWizardForm<T>({
  initialData,
  totalSteps,
  onSubmit,
  persistKey,
}: WizardOptions<T>) {
  const [data, setData] = useState<T>(initialData);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const submittedRef = useRef(false);

  // Load from localStorage after hydration
  useEffect(() => {
    if (!persistKey) {
      setIsHydrated(true);
      return;
    }
    try {
      const saved = localStorage.getItem(persistKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setData(parsed);
      }
    } catch (e) {
      console.error("Failed to parse wizard draft", e);
    }
    setIsHydrated(true);
  }, [persistKey]);

  // persist draft
  const update = useCallback(
    (key: keyof T) => (value: any) => {
      setData((prev) => {
        const next = { ...prev, [key]: value };
        if (persistKey && isHydrated) {
          localStorage.setItem(persistKey, JSON.stringify(next));
        }
        return next;
      });
    },
    [persistKey, isHydrated],
  );

  const next = useCallback(() => {
    setStep((s) => Math.min(s + 1, totalSteps));
  }, [totalSteps]);

  const back = useCallback(() => {
    setStep((s) => Math.max(s - 1, 1));
  }, []);

  const goTo = useCallback(
    (s: number) => {
      setStep(Math.max(1, Math.min(s, totalSteps)));
    },
    [totalSteps],
  );

  const submit = useCallback(async () => {
    if (step !== totalSteps) return;

    if (submittedRef.current) return;
    submittedRef.current = true;

    try {
      setSubmitting(true);
      await onSubmit(data);

      if (persistKey) {
        localStorage.removeItem(persistKey);
      }
    } finally {
      setSubmitting(false);
    }
  }, [data, step, totalSteps, onSubmit, persistKey]);

  return {
    data,
    step,
    submitting,
    update,
    next,
    back,
    goTo,
    submit,
    isLastStep: step === totalSteps,
  };
}
