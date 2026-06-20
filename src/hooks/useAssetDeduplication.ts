import { useCallback, useState } from "react";
import type { AssetItem } from "../types";

type DuplicateGroup = {
  id: string;
  assets: AssetItem[];
  reason: string;
};

function findDuplicates(assets: AssetItem[]): DuplicateGroup[] {
  const byFilename = new Map<string, AssetItem[]>();
  const bySize = new Map<number, AssetItem[]>();

  for (const asset of assets) {
    const filename = asset.filename.toLowerCase();
    if (!byFilename.has(filename)) byFilename.set(filename, []);
    byFilename.get(filename)!.push(asset);

    if (!bySize.has(asset.size)) bySize.set(asset.size, []);
    bySize.get(asset.size)!.push(asset);
  }

  const groups: DuplicateGroup[] = [];
  let groupId = 0;

  for (const [filename, group] of byFilename) {
    if (group.length > 1) {
      groups.push({
        id: `filename-${groupId++}`,
        assets: group,
        reason: `相同文件名: ${filename}`,
      });
    }
  }

  for (const [size, group] of bySize) {
    if (group.length > 1 && !groups.some((g) => g.assets.every((a) => group.includes(a)))) {
      groups.push({
        id: `size-${groupId++}`,
        assets: group,
        reason: `相同大小: ${(size / 1024).toFixed(1)}KB`,
      });
    }
  }

  return groups;
}

export function useAssetDeduplication() {
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);

  const scanForDuplicates = useCallback((assets: AssetItem[]) => {
    const found = findDuplicates(assets);
    setDuplicates(found);
    return found;
  }, []);

  return { duplicates, scanForDuplicates };
}
