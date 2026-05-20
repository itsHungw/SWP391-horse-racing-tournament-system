import { useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isSubmitting: boolean;
};

export function RejectModal({ isOpen, onClose, onConfirm, isSubmitting }: Props) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Lý do từ chối là bắt buộc.");
      return;
    }
    setError("");
    onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900">Từ chối yêu cầu nâng cấp</h3>
        <p className="mt-2 text-sm text-slate-500">
          Vui lòng cung cấp lý do từ chối chi tiết. Lý do này sẽ được gửi tới người dùng.
        </p>

        <form onSubmit={handleSubmit} className="mt-4">
          <div>
            <label htmlFor="reject-reason" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Lý do từ chối
            </label>
            <textarea
              id="reject-reason"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim()) setError("");
              }}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Ví dụ: Tài liệu chứng minh mờ, thông tin không trùng khớp..."
              disabled={isSubmitting}
            />
            {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none"
              disabled={isSubmitting}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 focus:outline-none flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang xử lý..." : "Xác nhận từ chối"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
