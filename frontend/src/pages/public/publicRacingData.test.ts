import { describe, expect, it } from "vitest";
import { championshipStatus, toneClasses } from "./publicRacingData";

describe("championshipStatus", () => {
  it("không nhầm CLOSED_REGISTRATION thành đã kết thúc", () => {
    // Bug cũ: so khớp chuỗi con, "CLOSED_REGISTRATION".includes("CLOSED") -> "Concluded".
    // Giải mới đóng đăng ký, chưa chạy, mà hiện xám như đã xong.
    const closed = championshipStatus("CLOSED_REGISTRATION");
    expect(closed.tone).not.toBe("done");
    expect(closed.label).toBe("Registration Closed");
  });

  it("tách bạch đang chạy với đã publish lịch", () => {
    const running = championshipStatus("ONGOING");
    const published = championshipStatus("SCHEDULE_PUBLISHED");

    expect(running.tone).not.toBe(published.tone);
    expect(running.label).not.toBe(published.label);
  });

  it("map đúng từng trạng thái công khai", () => {
    expect(championshipStatus("OPEN_REGISTRATION").tone).toBe("open");
    expect(championshipStatus("ONGOING").tone).toBe("live");
    expect(championshipStatus("SCHEDULE_PUBLISHED").tone).toBe("soon");
    expect(championshipStatus("COMPLETED").tone).toBe("done");
  });

  it("không vỡ với trạng thái lạ", () => {
    expect(championshipStatus(undefined).label).toBe("Scheduled");
    expect(championshipStatus("SOMETHING_NEW").tone).toBe("neutral");
  });
});

describe("toneClasses", () => {
  it("chỉ tô nền đặc cho hai trạng thái hành động được", () => {
    expect(toneClasses.live.solid).toBe(true);
    expect(toneClasses.open.solid).toBe(true);
    expect(toneClasses.soon.solid).toBe(false);
    expect(toneClasses.closed.solid).toBe(false);
    expect(toneClasses.done.solid).toBe(false);
  });

  it("mỗi tông có nền/viền riêng — đây là thứ trước đây trùng nhau", () => {
    // Kiểm tra `ring` (nền + viền) chứ không phải `text`: hai tông nền đặc đều dùng
    // chữ tối, thứ tách chúng ra là màu nền gold vs emerald.
    const tones = ["live", "open", "soon", "closed", "done"] as const;
    const rings = tones.map((tone) => toneClasses[tone].ring);
    expect(new Set(rings).size).toBe(tones.length);
  });

  it("Running và Schedule Published không còn dùng chung màu chữ vàng", () => {
    // Chính xác cặp mà người dùng báo là nhìn không phân biệt được.
    expect(toneClasses.live.ring).not.toBe(toneClasses.soon.ring);
    expect(toneClasses.live.solid).not.toBe(toneClasses.soon.solid);
  });
});
