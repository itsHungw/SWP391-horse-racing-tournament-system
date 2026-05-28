# Luồng Đăng ký Giải đấu Nhiều Bước cho Horse Owner - Kế hoạch Triển khai (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai luồng đăng ký giải đấu nhiều bước (3-step Wizard) chuyên nghiệp cho Horse Owner trên Frontend React, tích hợp tự động kiểm tra hạn giấy tờ y tế COGGINS và HEALTH_CERTIFICATE, cùng giao diện theo dõi Timeline tiến trình trạng thái trực quan, đảm bảo xử lý triệt để các trạng thái loading, dữ liệu trống và lỗi.

**Architecture:** Sử dụng kiến trúc Modular chia nhỏ màn hình đăng ký chính thành các Component con riêng biệt được điều phối trạng thái (State Coordination) từ trang cha `OwnerTournamentRegistrationsPage.tsx`. Giao tiếp giữa các bước thông qua props tường minh. Thực hiện kiểm tra eligibility ở phía Frontend để hỗ trợ UX và gọi các API hiện có để đảm bảo tối giản.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Axios, Vitest, React Testing Library.

---

## Danh sách Tệp Tạo mới & Sửa đổi (File Mapping)
```text
frontend/src/pages/owner/
├── OwnerTournamentRegistrationsPage.tsx        # Cập nhật (Trang chính, điều phối trạng thái)
├── OwnerTournamentRegistrationsPage.test.tsx   # Cập nhật (Kiểm thử Vitest)
└── components/
    ├── RegistrationWizardHeader.tsx            # Tạo mới (Stepper tiến trình)
    ├── StepSelectTournament.tsx                # Tạo mới (Bước 1: Chọn giải đấu)
    ├── StepSelectHorse.tsx                     # Tạo mới (Bước 2: Chọn ngựa & check y tế)
    ├── StepConfirmRegistration.tsx             # Tạo mới (Bước 3: Ghi chú & Xác nhận)
    └── RegistrationStatusTimeline.tsx          # Tạo mới (Timeline trạng thái)
```

---

## Kế hoạch Thực hiện Từng bước (Step-by-Step Tasks)

### Task 1: Tạo Component Wizard Header & Step 1 (Chọn Giải đấu)

**Files:**
- Create: `frontend/src/pages/owner/components/RegistrationWizardHeader.tsx`
- Create: `frontend/src/pages/owner/components/StepSelectTournament.tsx`

- [ ] **Step 1: Tạo tệp RegistrationWizardHeader.tsx**
  Thực hiện tạo Stepper hiển thị 3 bước đăng ký với phong cách thiết kế sang trọng:
  ```typescript
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
  ```

- [ ] **Step 2: Tạo tệp StepSelectTournament.tsx**
  Hiển thị danh sách các giải đấu mở đăng ký dưới dạng Thẻ lưới (Card Grid) kèm chi tiết và trạng thái trống (empty state):
  ```typescript
  import { Tournament } from "../../../types/racing";

  interface Props {
    tournaments: Tournament[];
    loading: boolean;
    onSelect: (tournament: Tournament) => void;
  }

  export function StepSelectTournament({ tournaments, loading, onSelect }: Props) {
    const openTournaments = tournaments.filter(t => t.status === "OPEN_REGISTRATION");

    if (loading) {
      return (
        <div className="py-12 text-center text-slate-500 font-medium">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006d5b] mx-auto mb-3"></div>
          Đang tải danh sách giải đấu...
        </div>
      );
    }

    if (openTournaments.length === 0) {
      return (
        <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
          <p className="text-slate-500 font-bold mb-2">Hiện tại không có giải đấu nào mở đăng ký.</p>
          <p className="text-xs text-slate-400">Vui lòng quay lại sau khi ban tổ chức công bố giải đấu mới.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-800 mb-4">Bước 1: Chọn Giải Đấu Muốn Đăng Ký</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {openTournaments.map((tournament) => (
            <div
              key={tournament.id}
              className="border border-slate-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 flex flex-col justify-between bg-white transform hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-black border border-emerald-100 uppercase tracking-wider">
                    Đang Mở
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    Hạn đăng ký: {tournament.registrationEndAt ? new Date(tournament.registrationEndAt).toLocaleDateString("vi-VN") : "N/A"}
                  </span>
                </div>
                <h3 className="font-black text-slate-800 text-lg mb-2">{tournament.name}</h3>
                <p className="text-slate-500 text-xs leading-relaxed line-clamp-3 mb-4">
                  {tournament.description || "Không có mô tả chi tiết."}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-4 border-t border-slate-50 pt-3">
                  <div>
                    <span className="block text-slate-400">Thời gian diễn ra:</span>
                    <span className="font-bold text-slate-700">
                      {tournament.startDate} - {tournament.endDate}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Địa điểm:</span>
                    <span className="font-bold text-slate-700">{tournament.location || "N/A"}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onSelect(tournament)}
                className="w-full bg-[#006d5b] text-white py-2.5 rounded-lg text-xs font-black hover:bg-[#004d3d] transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
              >
                Đăng ký Giải đấu này →
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 3: Commit code Task 1**
  Run: `git add src/pages/owner/components/RegistrationWizardHeader.tsx src/pages/owner/components/StepSelectTournament.tsx`
  Commit: `feat: add wizard stepper header and step 1 tournament selection components`

---

### Task 2: Tạo Component Step 2 (Chọn Ngựa & Kiểm tra Y tế)

**Files:**
- Create: `frontend/src/pages/owner/components/StepSelectHorse.tsx`

- [ ] **Step 1: Tạo tệp StepSelectHorse.tsx**
  Triển khai logic gọi API documents, tính toán eligibility (approved status, coggins, health certificate còn hạn đến giải kết thúc) và hiển thị checklist chi tiết kèm nút Refresh và các cảnh báo UX:
  ```typescript
  import { useEffect, useState, useCallback } from "react";
  import { getOwnerHorseDocuments } from "../../../api/racingApi";
  import type { Horse, Tournament, HorseDocument } from "../../../types/racing";

  interface Props {
    selectedTournament: Tournament;
    horses: Horse[];
    onPrev: () => void;
    onNext: (horse: Horse) => void;
  }

  type DocumentCheckStatus = {
    hasCoggins: boolean;
    cogginsValid: boolean;
    cogginsExpiry?: string;
    hasHealthCert: boolean;
    healthCertValid: boolean;
    healthCertExpiry?: string;
    horseApproved: boolean;
    isEligible: boolean;
  };

  export function StepSelectHorse({ selectedTournament, horses, onPrev, onNext }: Props) {
    const [selectedHorseId, setSelectedHorseId] = useState<number | "">("");
    const [docs, setDocs] = useState<HorseDocument[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [errorDocs, setErrorDocs] = useState<string | null>(null);
    const [checkStatus, setCheckStatus] = useState<DocumentCheckStatus | null>(null);

    const approvedHorses = horses.filter((h) => h.status === "APPROVED");

    const fetchDocuments = useCallback(async (horseId: number) => {
      setLoadingDocs(true);
      setErrorDocs(null);
      try {
        const documents = await getOwnerHorseDocuments(horseId);
        setDocs(documents);
        
        // Tính toán kiểm tra điều kiện y tế dựa vào tournament.endDate
        const tourEndDate = selectedTournament.endDate ? new Date(selectedTournament.endDate) : null;
        const horse = horses.find(h => h.id === horseId);
        
        const coggins = documents.find(d => d.documentType === "COGGINS");
        const healthCert = documents.find(d => d.documentType === "HEALTH_CERTIFICATE");

        const hasCoggins = !!coggins;
        const cogginsValid = hasCoggins && tourEndDate && coggins.expiryDate ? new Date(coggins.expiryDate) >= tourEndDate : false;

        const hasHealthCert = !!healthCert;
        const healthCertValid = hasHealthCert && tourEndDate && healthCert.expiryDate ? new Date(healthCert.expiryDate) >= tourEndDate : false;

        const horseApproved = horse?.status === "APPROVED";
        const isEligible = horseApproved && cogginsValid && healthCertValid;

        setCheckStatus({
          hasCoggins,
          cogginsValid,
          cogginsExpiry: coggins?.expiryDate,
          hasHealthCert,
          healthCertValid,
          healthCertExpiry: healthCert?.expiryDate,
          horseApproved,
          isEligible
        });
      } catch (err) {
        setErrorDocs("Không thể tải danh sách tài liệu y tế của ngựa.");
        setCheckStatus(null);
      } finally {
        setLoadingDocs(false);
      }
    }, [selectedTournament, horses]);

    useEffect(() => {
      if (selectedHorseId) {
        void fetchDocuments(Number(selectedHorseId));
      } else {
        setDocs([]);
        setCheckStatus(null);
      }
    }, [selectedHorseId, fetchDocuments]);

    const handleRefresh = () => {
      if (selectedHorseId) {
        void fetchDocuments(Number(selectedHorseId));
      }
    };

    const handleNext = () => {
      if (selectedHorseId && checkStatus?.isEligible) {
        const horse = horses.find(h => h.id === Number(selectedHorseId));
        if (horse) onNext(horse);
      }
    };

    if (approvedHorses.length === 0) {
      return (
        <div className="space-y-4">
          <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
            <p className="text-slate-500 font-bold mb-2">Bạn cần có ít nhất một chú ngựa được phê duyệt (APPROVED) để tham gia đăng ký giải đấu.</p>
            <p className="text-xs text-slate-400 mb-4">
              Các ngựa ở trạng thái PENDING hoặc REJECTED sẽ không đủ tư cách đăng ký giải đấu.
            </p>
            <a
              href="/owner/horses"
              className="inline-block bg-[#006d5b] text-white px-5 py-2 rounded-lg text-xs font-black hover:bg-[#004d3d]"
            >
              Quản lý danh sách ngựa của tôi ↗
            </a>
          </div>
          <button
            type="button"
            onClick={onPrev}
            className="text-xs font-black text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
          >
            ← Quay lại Chọn Giải Đấu
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-black text-slate-800">Bước 2: Chọn Ngựa & Đối Soát Hồ Sơ Y Tế</h2>
          <p className="text-xs text-slate-500 mt-1">
            Đăng ký yêu cầu chứng nhận y tế COGGINS và HEALTH CERTIFICATE còn thời hạn qua ngày kết thúc giải đấu (
            <span className="font-bold text-slate-700">{selectedTournament.endDate}</span>).
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.2fr_1.8fr]">
          {/* Lựa chọn ngựa */}
          <div className="space-y-4">
            <label className="block space-y-1 text-sm font-bold text-slate-700">
              <span>Lựa chọn ngựa thi đấu</span>
              <select
                className="min-h-11 w-full rounded-md border border-slate-300 px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006d5b]"
                value={selectedHorseId}
                onChange={(e) => setSelectedHorseId(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">-- Chọn chú ngựa --</option>
                {approvedHorses.map((horse) => (
                  <option key={horse.id} value={horse.id}>
                    {horse.name} (ID: {horse.id})
                  </option>
                ))}
              </select>
            </label>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onPrev}
                className="w-1/2 border border-slate-300 text-slate-700 py-2.5 rounded-lg text-xs font-black hover:bg-slate-50 cursor-pointer"
              >
                ← Quay lại
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!selectedHorseId || !checkStatus?.isEligible || loadingDocs}
                className="w-1/2 bg-[#006d5b] text-white py-2.5 rounded-lg text-xs font-black hover:bg-[#004d3d] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Tiếp tục →
              </button>
            </div>
          </div>

          {/* Kiểm tra điều kiện (Eligibility Check) */}
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-slate-800 text-sm">Danh Sách Điều Kiện Y Tế</h3>
              {selectedHorseId && (
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={loadingDocs}
                  className="text-xs font-black text-[#006d5b] hover:text-[#004d3d] flex items-center gap-1 cursor-pointer"
                >
                  Làm mới 🔄
                </button>
              )}
            </div>

            {loadingDocs ? (
              <div className="py-8 text-center text-xs text-slate-500 font-semibold">
                Đang kiểm tra tài liệu y tế của ngựa...
              </div>
            ) : errorDocs ? (
              <div className="py-4 text-center text-xs text-rose-600 font-bold bg-rose-50 border border-rose-100 rounded-lg">
                {errorDocs}
              </div>
            ) : checkStatus ? (
              <div className="space-y-4">
                <div className="divide-y divide-slate-100 bg-white border border-slate-150 rounded-xl overflow-hidden shadow-sm">
                  {/* Điều kiện Approved status */}
                  <div className="flex items-center justify-between p-3.5">
                    <span className="text-xs font-bold text-slate-600">Trạng thái phê duyệt của ngựa:</span>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                      checkStatus.horseApproved ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    }`}>
                      {checkStatus.horseApproved ? "✓ Đã phê duyệt" : "✗ Chưa phê duyệt"}
                    </span>
                  </div>

                  {/* COGGINS check */}
                  <div className="p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">Xét duyệt chứng nhận COGGINS:</span>
                      <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                        checkStatus.cogginsValid ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                      }`}>
                        {checkStatus.cogginsValid ? "✓ Hợp lệ" : !checkStatus.hasCoggins ? "✗ Thiếu hồ sơ" : "✗ Hết hạn"}
                      </span>
                    </div>
                    {checkStatus.cogginsExpiry && (
                      <span className="block text-[10px] text-slate-400 font-medium">
                        Ngày hết hạn: {new Date(checkStatus.cogginsExpiry).toLocaleDateString("vi-VN")}
                      </span>
                    )}
                  </div>

                  {/* HEALTH CERTIFICATE check */}
                  <div className="p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">Chứng nhận sức khỏe (HEALTH CERTIFICATE):</span>
                      <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                        checkStatus.healthCertValid ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                      }`}>
                        {checkStatus.healthCertValid ? "✓ Hợp lệ" : !checkStatus.hasHealthCert ? "✗ Thiếu hồ sơ" : "✗ Hết hạn"}
                      </span>
                    </div>
                    {checkStatus.healthCertExpiry && (
                      <span className="block text-[10px] text-slate-400 font-medium">
                        Ngày hết hạn: {new Date(checkStatus.healthCertExpiry).toLocaleDateString("vi-VN")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Cảnh báo Alert đỏ nếu không đủ điều kiện */}
                {!checkStatus.isEligible && (
                  <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg space-y-2">
                    <p className="text-xs text-rose-700 font-bold leading-relaxed">
                      ⚠️ Phát hiện giấy tờ y tế không hợp lệ! Chú ngựa được chọn không đủ điều kiện thi đấu do thiếu hoặc hết hạn chứng nhận COGGINS / HEALTH_CERTIFICATE trước ngày kết thúc giải đấu.
                    </p>
                    <a
                      href={`/owner/horses`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs font-black text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Cập nhật giấy tờ y tế của ngựa ngay (Mở Tab mới) ↗
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 font-bold">
                Vui lòng chọn một chú ngựa để tiến hành đối soát điều kiện.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit code Task 2**
  Run: `git add src/pages/owner/components/StepSelectHorse.tsx`
  Commit: `feat: add step 2 horse selection with medical eligibility checking`

---

### Task 3: Tạo Component Step 3 (Xác nhận & Gửi)

**Files:**
- Create: `frontend/src/pages/owner/components/StepConfirmRegistration.tsx`

- [ ] **Step 1: Tạo tệp StepConfirmRegistration.tsx**
  Thiển thị tóm tắt, trường ghi chú, xử lý spin loading, hiển thị cảnh báo lỗi chi tiết khi submit thất bại:
  ```typescript
  import { Tournament, Horse } from "../../../types/racing";

  interface Props {
    selectedTournament: Tournament;
    selectedHorse: Horse;
    note: string;
    onChangeNote: (note: string) => void;
    saving: boolean;
    submitError: string | null;
    onPrev: () => void;
    onSubmit: () => void;
  }

  export function StepConfirmRegistration({
    selectedTournament,
    selectedHorse,
    note,
    onChangeNote,
    saving,
    submitError,
    onPrev,
    onSubmit,
  }: Props) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-black text-slate-800">Bước 3: Xác Nhận Thông Tin Đăng Ký</h2>
          <p className="text-xs text-slate-500 mt-1">
            Vui lòng kiểm tra kỹ lưỡng các thông tin đối chiếu bên dưới trước khi bấm xác nhận nộp đăng ký lên ban tổ chức.
          </p>
        </div>

        {submitError && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg text-xs font-bold text-rose-700">
            Gửi đơn đăng ký không thành công: {submitError}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {/* Tóm tắt giải đấu */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
            <span className="text-[10px] uppercase font-black tracking-widest text-[#006d5b]">Giải Đấu Đăng Ký</span>
            <h3 className="font-black text-slate-800 text-base mt-1">{selectedTournament.name}</h3>
            <div className="mt-3 space-y-1.5 text-xs text-slate-500 font-semibold border-t border-slate-50 pt-2.5">
              <p>📍 Địa điểm: {selectedTournament.location}</p>
              <p>📅 Thời gian diễn ra: {selectedTournament.startDate} - {selectedTournament.endDate}</p>
            </div>
          </div>

          {/* Tóm tắt Ngựa */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
            <span className="text-[10px] uppercase font-black tracking-widest text-[#006d5b]">Ngựa Thi Đấu</span>
            <h3 className="font-black text-slate-800 text-base mt-1">{selectedHorse.name}</h3>
            <div className="mt-3 space-y-1.5 text-xs text-slate-500 font-semibold border-t border-slate-50 pt-2.5">
              <p>🐴 Mã Đăng Ký: {selectedHorse.registrationCode || "Chưa cấp"}</p>
              <p>🧬 Giới Tính / Giống: {selectedHorse.gender} / {selectedHorse.breed || "Không xác định"}</p>
            </div>
          </div>
        </div>

        {/* Trường ghi chú */}
        <label className="block space-y-1 text-sm font-bold text-slate-700">
          <span>Ghi chú gửi kèm ban tổ chức (Không bắt buộc)</span>
          <textarea
            className="w-full min-h-24 rounded-md border border-slate-300 p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006d5b]"
            placeholder="Ví dụ: Cung cấp thêm thông tin đặc thù về chế độ chăm sóc ngựa..."
            value={note}
            onChange={(e) => onChangeNote(e.target.value)}
            disabled={saving}
          />
        </label>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onPrev}
            disabled={saving}
            className="w-1/2 border border-slate-300 text-slate-700 py-3 rounded-lg text-xs font-black hover:bg-slate-50 cursor-pointer disabled:opacity-50"
          >
            ← Quay lại
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving}
            className="w-1/2 bg-[#006d5b] text-white py-3 rounded-lg text-xs font-black hover:bg-[#004d3d] shadow-sm flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Đang gửi đơn...
              </>
            ) : (
              "Xác Nhận Nộp Đăng Ký ✓"
            )}
          </button>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit code Task 3**
  Run: `git add src/pages/owner/components/StepConfirmRegistration.tsx`
  Commit: `feat: add step 3 confirm registration and final submit component`

---

### Task 4: Tạo Component Lịch sử Đăng ký & Timeline Trạng thái

**Files:**
- Create: `frontend/src/pages/owner/components/RegistrationStatusTimeline.tsx`

- [ ] **Step 1: Tạo tệp RegistrationStatusTimeline.tsx**
  Hiển thị timeline trạng thái đăng ký của chú ngựa gồm Submitted -> Pending -> Approved/Rejected/Withdrawn:
  ```typescript
  import { TournamentRegistration } from "../../../types/racing";

  interface Props {
    registration: TournamentRegistration;
    onClose: () => void;
  }

  export function RegistrationStatusTimeline({ registration, onClose }: Props) {
    const isPending = registration.status === "PENDING";
    const isApproved = registration.status === "APPROVED";
    const isRejected = registration.status === "REJECTED";
    const isWithdrawn = registration.status === "WITHDRAWN";

    // Phân loại nhãn màu cho Huy hiệu trạng thái chính
    const statusBadges: Record<string, string> = {
      PENDING: "bg-amber-50 text-amber-700 border-amber-200",
      APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
      REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
      WITHDRAWN: "bg-slate-50 text-slate-600 border-slate-200",
    };

    return (
      <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-[#006d5b]">Đơn đăng ký giải đấu</span>
            <h3 className="font-black text-slate-800 text-lg">{registration.tournamentName}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Ngựa tham gia: <span className="font-bold text-slate-600">{registration.horseName}</span></p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-black text-slate-400 hover:text-slate-600 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg cursor-pointer"
          >
            Đóng bảng theo dõi ✕
          </button>
        </div>

        {/* Trạng thái Tổng quát */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500">Trạng thái hiện tại:</span>
          <span className={`text-xs font-black px-3 py-1 rounded-full border ${statusBadges[registration.status] || "bg-slate-100"}`}>
            {registration.status}
          </span>
        </div>

        {/* Timeline Chi tiết */}
        <div className="relative border-l border-slate-200 ml-3 pl-6 space-y-6">
          {/* Mốc 1: Submitted */}
          <div className="relative">
            <span className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white font-black">
              ✓
            </span>
            <h4 className="text-xs font-black text-slate-800">Đăng ký được gửi lên hệ thống</h4>
            <p className="text-[10px] text-slate-400 font-semibold">
              Gửi bởi: {registration.ownerName || "Chủ ngựa"} • {registration.createdAt ? new Date(registration.createdAt).toLocaleString("vi-VN") : "N/A"}
            </p>
            {registration.note && (
              <p className="text-xs text-slate-500 italic mt-1 bg-slate-50 p-2 rounded border border-slate-100">
                Ghi chú: "{registration.note}"
              </p>
            )}
          </div>

          {/* Mốc 2: Ban tổ chức kiểm duyệt */}
          <div className="relative">
            <span className={`absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-black text-white ${
              isPending ? "bg-amber-500 animate-pulse" : "bg-[#006d5b]"
            }`}>
              {isPending ? "⏰" : "✓"}
            </span>
            <h4 className="text-xs font-black text-slate-800">Ban tổ chức đang kiểm duyệt hồ sơ</h4>
            <p className="text-[10px] text-slate-400 font-semibold">
              {isPending ? "Hồ sơ y tế đang được đối soát trực quan bởi Admin." : "Đã hoàn thành kiểm duyệt hồ sơ y tế."}
            </p>
          </div>

          {/* Mốc 3: Kết quả cuối cùng */}
          {(isApproved || isRejected || isWithdrawn) && (
            <div className="relative">
              <span className={`absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-black text-white ${
                isApproved ? "bg-emerald-500" : isRejected ? "bg-rose-500" : "bg-slate-400"
              }`}>
                {isApproved ? "✓" : isRejected ? "✗" : "!"}
              </span>
              <h4 className="text-xs font-black text-slate-800">
                {isApproved ? "Đã duyệt - Đăng ký Thành Công" : isRejected ? "Đã Từ Chối Đăng Ký" : "Đã Rút Đơn Đăng Ký"}
              </h4>
              <p className="text-[10px] text-slate-400 font-semibold">
                Cập nhật lúc: {registration.reviewedAt ? new Date(registration.reviewedAt).toLocaleString("vi-VN") : new Date().toLocaleString("vi-VN")}
              </p>
              {isRejected && registration.rejectionReason && (
                <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-xs p-3 rounded-r-lg font-bold mt-2 leading-relaxed">
                  Lý do từ chối: "{registration.rejectionReason}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit code Task 4**
  Run: `git add src/pages/owner/components/RegistrationStatusTimeline.tsx`
  Commit: `feat: add registration timeline component for status tracking`

---

### Task 5: Tái Cấu Trúc Trang Đăng Ký Chính (OwnerTournamentRegistrationsPage)

**Files:**
- Modify: `frontend/src/pages/owner/OwnerTournamentRegistrationsPage.tsx`

- [ ] **Step 1: Thay thế logic biểu mẫu cũ bằng Wizard Controller & Quản lý state**
  Thực hiện thay thế toàn bộ mã nguồn của trang `OwnerTournamentRegistrationsPage.tsx` bằng mã nguồn tích hợp Wizard và Lịch sử Đăng ký:
  ```typescript
  import { useCallback, useEffect, useState } from "react";
  import {
    createOwnerTournamentRegistration,
    getOwnerHorses,
    getOwnerTournamentRegistrations,
    getPublicTournaments,
    withdrawOwnerTournamentRegistration,
  } from "../../api/racingApi";
  import { useDocumentTitle } from "../../hooks/useDocumentTitle";
  import { OwnerLayout } from "../../layouts/OwnerLayout";
  import type { Horse, Tournament, TournamentRegistration } from "../../types/racing";
  import { getApiErrorMessage } from "../../utils/apiError";

  // Import Sub-components
  import { RegistrationWizardHeader } from "./components/RegistrationWizardHeader";
  import { StepSelectTournament } from "./components/StepSelectTournament";
  import { StepSelectHorse } from "./components/StepSelectHorse";
  import { StepConfirmRegistration } from "./components/StepConfirmRegistration";
  import { RegistrationStatusTimeline } from "./components/RegistrationStatusTimeline";

  export function OwnerTournamentRegistrationsPage() {
    useDocumentTitle("Đăng ký Giải đấu - Owner");

    // Wizard States
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
    const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null);
    const [note, setNote] = useState("");

    // Database States
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [horses, setHorses] = useState<Horse[]>([]);
    const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);

    // Operation UI States
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pageMessage, setPageMessage] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [activeTimelineReg, setActiveTimelineReg] = useState<TournamentRegistration | null>(null);

    const loadWorkspaceData = useCallback(async () => {
      setLoading(true);
      try {
        const [tournamentData, horseData, registrationData] = await Promise.all([
          getPublicTournaments(),
          getOwnerHorses(),
          getOwnerTournamentRegistrations(),
        ]);
        setTournaments(Array.isArray(tournamentData) ? tournamentData : []);
        setHorses(Array.isArray(horseData) ? horseData : []);
        setRegistrations(Array.isArray(registrationData) ? registrationData : []);
        setPageMessage(null);
      } catch (error) {
        setPageMessage(getApiErrorMessage(error, "Không thể tải dữ liệu đăng ký."));
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      void loadWorkspaceData();
    }, [loadWorkspaceData]);

    const handleSelectTournament = (tournament: Tournament) => {
      setSelectedTournament(tournament);
      setCurrentStep(2);
    };

    const handleSelectHorse = (horse: Horse) => {
      setSelectedHorse(horse);
      setCurrentStep(3);
    };

    const handleBackStep = () => {
      setSubmitError(null);
      setCurrentStep((prev) => prev - 1);
    };

    const handleFinalSubmit = async () => {
      if (!selectedTournament || !selectedHorse) return;

      setSaving(true);
      setSubmitError(null);
      try {
        const payload = {
          tournamentId: selectedTournament.id,
          horseId: selectedHorse.id,
          note: note.trim() || undefined,
        };
        const newReg = await createOwnerTournamentRegistration(payload);
        
        // Reset state wizard về ban đầu
        setSelectedTournament(null);
        setSelectedHorse(null);
        setNote("");
        setCurrentStep(1);

        setPageMessage("Đơn đăng ký giải đấu đã được gửi và đang chờ kiểm duyệt!");
        await loadWorkspaceData();

        // Tự động mở Timeline xem chi tiết đơn đăng ký vừa tạo
        const updatedReg = newReg.id ? newReg : null;
        if (updatedReg) {
          setActiveTimelineReg(updatedReg);
        }
      } catch (error) {
        setSubmitError(getApiErrorMessage(error, "Không thể thực hiện đăng ký giải đấu."));
      } finally {
        setSaving(false);
      }
    };

    const handleWithdraw = async (registration: TournamentRegistration) => {
      setSaving(true);
      setPageMessage(null);
      try {
        await withdrawOwnerTournamentRegistration(registration.id);
        setPageMessage(`Chú ngựa ${registration.horseName} đã được rút khỏi giải đấu ${registration.tournamentName}.`);
        await loadWorkspaceData();
        if (activeTimelineReg && activeTimelineReg.id === registration.id) {
          setActiveTimelineReg({ ...activeTimelineReg, status: "WITHDRAWN" });
        }
      } catch (error) {
        setPageMessage(getApiErrorMessage(error, "Không thể rút đơn đăng ký giải đấu này."));
      } finally {
        setSaving(false);
      }
    };

    return (
      <OwnerLayout>
        <section aria-labelledby="owner-registrations-title" className="space-y-6">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-[#006d5b]">Tournament desk</p>
            <h1 id="owner-registrations-title" className="mt-2 text-4xl font-black tracking-tight">
              Đăng Ký Giải Đấu Đua Ngựa
            </h1>
            <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">
              Đăng ký các ngựa đã được duyệt y tế vào khung đăng ký mở giải đấu và theo dõi tiến trình kiểm duyệt của ban tổ chức.
            </p>
          </div>

          {pageMessage && (
            <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-xs font-bold text-slate-700 shadow-sm flex justify-between items-center" role="status">
              <span>{pageMessage}</span>
              <button onClick={() => setPageMessage(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
          )}

          {/* Hộp Wizard Panel */}
          <div className="border border-slate-200 rounded-xl bg-white p-6 shadow-sm">
            <RegistrationWizardHeader currentStep={currentStep} />

            <div className="mt-6">
              {currentStep === 1 && (
                <StepSelectTournament
                  tournaments={tournaments}
                  loading={loading}
                  onSelect={handleSelectTournament}
                />
              )}

              {currentStep === 2 && selectedTournament && (
                <StepSelectHorse
                  selectedTournament={selectedTournament}
                  horses={horses}
                  onPrev={handleBackStep}
                  onNext={handleSelectHorse}
                />
              )}

              {currentStep === 3 && selectedTournament && selectedHorse && (
                <StepConfirmRegistration
                  selectedTournament={selectedTournament}
                  selectedHorse={selectedHorse}
                  note={note}
                  onChangeNote={setNote}
                  saving={saving}
                  submitError={submitError}
                  onPrev={handleBackStep}
                  onSubmit={handleFinalSubmit}
                />
              )}
            </div>
          </div>

          {/* Bảng theo dõi trạng thái Timeline chi tiết */}
          {activeTimelineReg && (
            <RegistrationStatusTimeline
              registration={activeTimelineReg}
              onClose={() => setActiveTimelineReg(null)}
            />
          )}

          {/* Bảng Lịch sử Đăng ký */}
          <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-800">Lịch Sử & Trạng Thái Đăng Ký</h2>
            {loading ? (
              <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-sm font-bold text-slate-400">
                Đang tải danh sách lịch sử...
              </div>
            ) : registrations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-sm font-bold text-slate-400">
                Chưa có đơn đăng ký giải đấu nào được ghi nhận.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-6 py-3.5">Giải Đấu</th>
                        <th className="px-6 py-3.5">Ngựa Đăng Ký</th>
                        <th className="px-6 py-3.5">Trạng Thái</th>
                        <th className="px-6 py-3.5">Ghi Chú</th>
                        <th className="px-6 py-3.5 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-semibold text-slate-700">
                      {registrations.map((registration) => (
                        <tr key={registration.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-black text-slate-800">{registration.tournamentName}</td>
                          <td className="px-6 py-4">{registration.horseName}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black border uppercase ${
                              registration.status === "APPROVED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : registration.status === "PENDING"
                                ? "bg-amber-50 text-amber-700 border-amber-100"
                                : registration.status === "REJECTED"
                                ? "bg-rose-50 text-rose-700 border-rose-100"
                                : "bg-slate-50 text-slate-500 border-slate-100"
                            }`}>
                              {registration.status}
                            </span>
                            {registration.rejectionReason && (
                              <p className="mt-1 text-[10px] text-rose-600 font-medium">Lý do: {registration.rejectionReason}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-normal italic">{registration.note || "Không có ghi chú"}</td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              className="text-xs font-black text-[#006d5b] hover:underline cursor-pointer"
                              onClick={() => setActiveTimelineReg(registration)}
                              type="button"
                            >
                              Theo Dõi Trạng Thái
                            </button>
                            <button
                              className="text-xs font-black text-rose-600 hover:text-rose-800 hover:underline disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                              disabled={registration.status !== "PENDING" || saving}
                              onClick={() => handleWithdraw(registration)}
                              type="button"
                            >
                              Rút Đơn
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      </OwnerLayout>
    );
  }
  ```

- [ ] **Step 2: Commit code Task 5**
  Run: `git add src/pages/owner/OwnerTournamentRegistrationsPage.tsx`
  Commit: `refactor: coordinate multi-step registration wizard on main page`

---

### Task 6: Cập nhật Cài đặt Kiểm thử (Unit/Integration Testing)

**Files:**
- Modify: `frontend/src/pages/owner/OwnerTournamentRegistrationsPage.test.tsx`

- [ ] **Step 1: Cập nhật mã nguồn file test**
  Chỉnh sửa file test để kiểm chứng luồng Wizard 3 bước và trạng thái đối soát y tế ở Frontend:
  ```typescript
  import { fireEvent, render, screen, waitFor } from "@testing-library/react";
  import { MemoryRouter } from "react-router-dom";
  import { beforeEach, describe, expect, it, vi } from "vitest";

  import {
    createOwnerTournamentRegistration,
    getOwnerHorses,
    getOwnerTournamentRegistrations,
    getPublicTournaments,
    getOwnerHorseDocuments,
  } from "../../api/racingApi";
  import { OwnerTournamentRegistrationsPage } from "./OwnerTournamentRegistrationsPage";

  vi.mock("../../api/racingApi", () => ({
    createOwnerTournamentRegistration: vi.fn(),
    getOwnerHorses: vi.fn(),
    getOwnerTournamentRegistrations: vi.fn(),
    getPublicTournaments: vi.fn(),
    getOwnerHorseDocuments: vi.fn(),
    withdrawOwnerTournamentRegistration: vi.fn(),
  }));

  describe("OwnerTournamentRegistrationsPage", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.mocked(getPublicTournaments).mockResolvedValue([
        { id: 1, name: "Spring Cup", status: "OPEN_REGISTRATION", endDate: "2026-06-01" },
        { id: 2, name: "Closed Cup", status: "CLOSED_REGISTRATION", endDate: "2026-07-01" },
      ]);
      vi.mocked(getOwnerHorses).mockResolvedValue([
        { id: 3, name: "Approved Horse", gender: "MALE", status: "APPROVED" },
        { id: 4, name: "Pending Horse", gender: "FEMALE", status: "PENDING" },
      ]);
      vi.mocked(getOwnerTournamentRegistrations).mockResolvedValue([]);
      vi.mocked(getOwnerHorseDocuments).mockResolvedValue([
        { id: 10, horseId: 3, documentType: "COGGINS", referenceNumber: "COG123", expiryDate: "2026-09-01", fileUrl: "url" },
        { id: 11, horseId: 3, documentType: "HEALTH_CERTIFICATE", referenceNumber: "HEA123", expiryDate: "2026-09-01", fileUrl: "url" },
      ]);
      vi.mocked(createOwnerTournamentRegistration).mockResolvedValue({
        id: 8,
        tournamentId: 1,
        tournamentName: "Spring Cup",
        horseId: 3,
        horseName: "Approved Horse",
        status: "PENDING",
      });
    });

    it("runs through the 3-step wizard registration with document validation", async () => {
      render(
        <MemoryRouter>
          <OwnerTournamentRegistrationsPage />
        </MemoryRouter>,
      );

      // --- BƯỚC 1: Chọn Giải Đấu ---
      expect(await screen.findByRole("heading", { name: /đăng ký giải đấu/i })).toBeInTheDocument();
      const registerButton = await screen.findByRole("button", { name: /đăng ký giải đấu này/i });
      fireEvent.click(registerButton);

      // --- BƯỚC 2: Chọn Ngựa ---
      expect(await screen.findByText(/Bước 2: Chọn Ngựa/i)).toBeInTheDocument();
      const selectHorse = screen.getByRole("combobox");
      fireEvent.change(selectHorse, { target: { value: "3" } });

      // Đối soát tài liệu y tế
      await waitFor(() => {
        expect(getOwnerHorseDocuments).toHaveBeenCalledWith(3);
      });
      expect(await screen.findByText(/✓ Hợp lệ/i)).toBeInTheDocument();

      const nextButton = screen.getByRole("button", { name: /tiếp tục →/i });
      fireEvent.click(nextButton);

      // --- BƯỚC 3: Xác Nhận ---
      expect(await screen.findByText(/Bước 3: Xác Nhận Thông Tin/i)).toBeInTheDocument();
      const noteInput = screen.getByPlaceholderText(/ví dụ: cung cấp thêm/i);
      fireEvent.change(noteInput, { target: { value: "Cần vận chuyển đặc biệt" } });

      const confirmButton = screen.getByRole("button", { name: /xác nhận nộp đăng ký/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(createOwnerTournamentRegistration).toHaveBeenCalledWith({
          tournamentId: 1,
          horseId: 3,
          note: "Cần vận chuyển đặc biệt",
        });
      });
    });
  });
  ```

- [ ] **Step 2: Chạy bộ kiểm thử để xác nhận tất cả pass**
  Run: `npm run test` hoặc `npx vitest run src/pages/owner/OwnerTournamentRegistrationsPage.test.tsx` trong thư mục `frontend`
  Expected output: PASS

- [ ] **Step 3: Commit code Task 6**
  Run: `git add src/pages/owner/OwnerTournamentRegistrationsPage.test.tsx`
  Commit: `test: update vitest integration tests for tournament registration wizard`

---

## Tự Đánh giá Kế hoạch (Plan Self-Review)
1. **Spec Coverage:** Kế hoạch bao phủ 100% đặc tả thiết kế, bao gồm Stepper Header, Step 1 chọn giải đấu, Step 2 kiểm tra y tế + nút Refresh, Step 3 confirm + note + error alert, timeline trạng thái, và các trạng thái loading/empty/error chi tiết.
2. **Placeholder Scan:** Không chứa bất kỳ placeholder "TBD", "TODO", hay các phần triển khai trống nào.
3. **Type Consistency:** Các Interface trong component kế thừa chuẩn từ tệp `racing.ts` sẵn có của dự án.
