import { Check } from "lucide-react";
import type { AssetItem } from "../types";

export function ReferencePicker({ assets, selected, onChange }: { assets: AssetItem[]; selected: string[]; onChange: (ids: string[]) => void }) {
  return (
    <div className="reference-picker">
      <span>参考图（最多 4 张）</span>
      <div className="reference-grid">
        {assets.slice(0, 12).map((asset) => {
          const checked = selected.includes(asset.id);
          return (
            <button
              type="button"
              key={asset.id}
              className={checked ? "selected" : ""}
              onClick={() => {
                if (checked) onChange(selected.filter((id) => id !== asset.id));
                else if (selected.length < 4) onChange([...selected, asset.id]);
              }}
            >
              <img src={asset.url} alt={asset.filename} loading="lazy" />
              {checked && <Check size={16} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
