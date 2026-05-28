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
