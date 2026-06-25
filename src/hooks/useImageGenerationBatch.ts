import { useMemo, useState } from "react";
import type { ImageSize } from "../types";

export type ImageGenerationRecipe = {
  prompt: string;
  style: string;
  size: ImageSize;
  referenceIds: string[];
  count: number;
};

export type ImageBatchSlot =
  | { status: "pending" }
  | { status: "fulfilled"; filename: string }
  | { status: "rejected"; error: string };

export function useImageGenerationBatch() {
  const [recipe, setRecipe] = useState<ImageGenerationRecipe | null>(null);
  const [slots, setSlots] = useState<ImageBatchSlot[]>([]);

  const start = (nextRecipe: ImageGenerationRecipe) => {
    setRecipe(nextRecipe);
    setSlots(Array.from({ length: nextRecipe.count }, () => ({ status: "pending" })));
  };

  const settle = (nextSlots: ImageBatchSlot[]) => setSlots(nextSlots);
  const clear = () => {
    setRecipe(null);
    setSlots([]);
  };

  const retryableIndexes = useMemo(() => slots.flatMap((slot, index) =>
    slot.status === "rejected" ? [index] : []), [slots]);
  const summary = recipe ? {
    recipe,
    slots,
    successCount: slots.filter((slot) => slot.status === "fulfilled").length,
    failedCount: retryableIndexes.length,
  } : null;

  return { summary, retryableIndexes, start, settle, clear };
}
