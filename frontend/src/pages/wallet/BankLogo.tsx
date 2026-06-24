import { useState } from "react";

import { BANKS } from "./banks";

/**
 * Renders a bank's brand logo from `public/banks/<code>.svg`. Falls back to a
 * coloured monogram chip when the asset is missing (so the picker works before
 * the SVGs are added). Drop logos at `frontend/public/banks/<CODE>.svg`.
 */
export function BankLogo({ code, size = 36 }: { code: string; size?: number }) {
  const [extIndex, setExtIndex] = useState(0);
  const extensions = ["svg", "jpeg", "jpg", "png"];

  const bank = BANKS.find((item) => item.code === code);
  const color = bank?.color ?? "#3a4a44";
  const dimension = { width: size, height: size };

  if (extIndex < extensions.length) {
    return (
      <img
        src={`/banks/${code}.${extensions[extIndex]}`}
        alt=""
        aria-hidden="true"
        loading="lazy"
        onError={() => setExtIndex((prev) => prev + 1)}
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
