import React from "react";

interface Props {
  currentStep: number;
}

export function RegistrationWizardHeader({ currentStep }: Props) {
  const steps = [
    { number: 1, label: "Select Tournament" },
    { number: 2, label: "Select Horse & Eligibility" },
    { number: 3, label: "Confirm Registration" },
  ];

  return (
    <div className="mb-6 w-full border-b border-slate-100 py-4">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4">
        {steps.map((step, idx) => {
          const isCompleted = currentStep > step.number;
          const isActive = currentStep === step.number;
          return (
            <React.Fragment key={step.number}>
              <div className="relative flex flex-1 flex-col items-center text-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-md text-sm font-bold transition-all duration-300 ${
                    isCompleted
                      ? "bg-[#006d5b] text-white shadow-sm"
                      : isActive
                        ? "bg-[#006d5b] text-white ring-4 ring-[#006d5b]/15"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isCompleted ? "OK" : step.number}
                </div>
                <span
                  className={`mt-2 text-xs font-bold transition-colors duration-300 ${
                    isActive ? "text-[#006d5b]" : "text-slate-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`-mt-4 mx-2 h-0.5 flex-1 rounded transition-all duration-300 ${
                    currentStep > step.number ? "bg-[#006d5b]" : "bg-slate-100"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
