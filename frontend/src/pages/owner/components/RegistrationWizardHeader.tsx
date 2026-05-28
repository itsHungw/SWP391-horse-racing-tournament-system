import React from "react";

interface Props {
  currentStep: number;
}

export function RegistrationWizardHeader({ currentStep }: Props) {
  const steps = [
    { number: 1, label: "Chọn Giải Đấu" },
    { number: 2, label: "Chọn Ngựa & Hồ Sơ Y Tế" },
    { number: 3, label: "Xác Nhận Đăng Ký" },
  ];

  return (
    <div className="w-full py-4 mb-6 border-b border-slate-100">
      <div className="flex items-center justify-between max-w-3xl mx-auto px-4">
        {steps.map((step, idx) => {
          const isCompleted = currentStep > step.number;
          const isActive = currentStep === step.number;
          return (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center flex-1 text-center relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    isCompleted
                      ? "bg-[#006d5b] text-white shadow-sm"
                      : isActive
                      ? "bg-[#006d5b] text-white ring-4 ring-[#006d5b]/15"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isCompleted ? "✓" : step.number}
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
                  className={`h-0.5 flex-1 mx-2 -mt-4 rounded transition-all duration-300 ${
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
