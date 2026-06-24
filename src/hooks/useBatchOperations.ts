import { useCallback, useState } from "react";
import type { AssetItem } from "../types";

interface BatchOperationResult {
  success: number;
  failed: number;
  errors: string[];
}

export function useBatchOperations() {
  const [isProcessing, setIsProcessing] = useState(false);

  const batchRename = useCallback(async (
    assets: AssetItem[],
    pattern: string,
    replacement: string
  ): Promise<BatchOperationResult> => {
    setIsProcessing(true);
    const result: BatchOperationResult = { success: 0, failed: 0, errors: [] };

    try {
      for (const asset of assets) {
        try {
          const newName = asset.filename.replace(new RegExp(pattern, "g"), replacement);
          if (newName !== asset.filename) {
            result.success++;
          } else {
            result.failed++;
            result.errors.push(`No match in ${asset.filename}`);
          }
        } catch (err) {
          result.failed++;
          result.errors.push(`Error processing ${asset.filename}: ${err}`);
        }
      }
    } finally {
      setIsProcessing(false);
    }

    return result;
  }, []);

  const batchAddTag = useCallback(async (
    assets: AssetItem[],
    addTag: (assetId: string, tag: string) => void,
    tag: string
  ): Promise<BatchOperationResult> => {
    setIsProcessing(true);
    const result: BatchOperationResult = { success: 0, failed: 0, errors: [] };

    try {
      for (const asset of assets) {
        try {
          addTag(asset.id, tag);
          result.success++;
        } catch (err) {
          result.failed++;
          result.errors.push(`Error tagging ${asset.filename}: ${err}`);
        }
      }
    } finally {
      setIsProcessing(false);
    }

    return result;
  }, []);

  const batchMoveToFolder = useCallback(async (
    assets: AssetItem[],
    moveAsset: (assetId: string, folderId: string) => void,
    folderId: string
  ): Promise<BatchOperationResult> => {
    setIsProcessing(true);
    const result: BatchOperationResult = { success: 0, failed: 0, errors: [] };

    try {
      for (const asset of assets) {
        try {
          moveAsset(asset.id, folderId);
          result.success++;
        } catch (err) {
          result.failed++;
          result.errors.push(`Error moving ${asset.filename}: ${err}`);
        }
      }
    } finally {
      setIsProcessing(false);
    }

    return result;
  }, []);

  return { isProcessing, batchRename, batchAddTag, batchMoveToFolder };
}
