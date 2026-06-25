import { useState } from "react";

import { BANKS } from "./banks";

// Logos live at `public/banks/<CODE>.<ext>` and the set uses mixed formats
// (VCB.png, ACB.svg, BIDV.jpeg, HDB.jpg…), so we probe these in priority order.
const EXTENSIONS = ["svg", "jpeg", "jpg", "png"];

/**
 * Renders a bank's brand logo from `public/banks/<code>.<ext>`, probing the known
 * extensions and falling back to a coloured monogram chip when none resolve (so the
 * picker still works for banks without an asset). Drop logos at `frontend/public/banks/`.
 */
export function BankLogo({ code, size = 36 }: { code: string; size?: number }) {
  const [probe, setProbe] = useState({ code, extIndex: 0 });

  // Reset the probe whenever the bank changes. Without this, a component instance
  // reused across list re-renders (search/filtering reorders the picker) keeps a
  // stale extIndex and shows the monogram fallback for a bank whose logo exists at
  // a lower-priority extension. Pattern: reset derived state during render.
  if (probe.code !== code) {
    setProbe({ code, extIndex: 0 });
  }
  const extIndex = probe.code === code ? probe.extIndex : 0;

  const bank = BANKS.find((item) => item.code === code);
  const color = bank?.color ?? "#3a4a44";
  const dimension = { width: size, height: size };

  if (extIndex < EXTENSIONS.length) {
    return (
      <img
        src={`/banks/${code}.${EXTENSIONS[extIndex]}`}
        alt=""
        aria-hidden="true"
        onError={() => setProbe((prev) => ({ code, extIndex: (prev.code === code ? prev.extIndex : 0) + 1 }))}
        style={dimension}
        className="shrink-0 rounded-lg bg-white object-contain p-1 ring-1 ring-white/10"
      />
    );
  }

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-lg font-data text-[10px] font-bold leading-none text-white"
      style={{ ...dimension, backgroundColor: color }}
      aria-hidden="true"
    >
      {code}
    </span>
  );
}
