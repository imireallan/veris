import { useState, useRef, useCallback } from "react";

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
  const [data, setData] = useState<T>(() => {
    // Check if we are in the browser environment
    if (typeof window !== "undefined" && persistKey) {
      const saved = localStorage.getItem(persistKey);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse wizard draft", e);
        }
      }
    }
    return initialData;
  });

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const submittedRef = useRef(false);

  // persist draft
  const update = useCallback(
    (key: keyof T) => (value: any) => {
      setData((prev) => {
        const next = { ...prev, [key]: value };
        if (persistKey) {
          localStorage.setItem(persistKey, JSON.stringify(next));
        }
        return next;
      });
    },
    [persistKey],
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
