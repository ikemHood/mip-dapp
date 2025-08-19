import { useCallback, useEffect, useRef, useState } from "react";
import type { AssetIP } from "@/src/types/asset";
import { collectionsService } from "@/src/services/collections.service";
import { CONTRACTS } from "@/src/services/constant";

export interface PublicTimelineState {
  assets: AssetIP[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Helper to sort assets descending by registration date, then tokenId
function sortAssetsDesc(a: AssetIP, b: AssetIP): number {
  const aTime = a.registrationDate && !isNaN(Date.parse(a.registrationDate))
    ? new Date(a.registrationDate).getTime()
    : a.timestamp && !isNaN(Date.parse(a.timestamp))
    ? new Date(a.timestamp).getTime()
    : 0;
  const bTime = b.registrationDate && !isNaN(Date.parse(b.registrationDate))
    ? new Date(b.registrationDate).getTime()
    : b.timestamp && !isNaN(Date.parse(b.timestamp))
    ? new Date(b.timestamp).getTime()
    : 0;
  if (bTime !== aTime) return bTime - aTime;

  const aId = Number(a.tokenId ?? a.id ?? 0);
  const bId = Number(b.tokenId ?? b.id ?? 0);
  return bId - aId;
}

/**
 * Fetch latest IP assets for the public timeline.
 * Initial implementation focuses on the primary MEDIOLANO collection,
 * returns the full list. The consumer (Timeline) handles filtering and pagination.
 */
export function usePublicTimeline(): PublicTimelineState {
  const [allAssets, setAllAssets] = useState<AssetIP[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchedRef = useRef(false);

  const loadCollectionOnce = useCallback(async () => {
    if (fetchedRef.current) return;
    setIsLoading(true);
    setError(null);
    try {
      const assets = await collectionsService.getCollectionAssets(CONTRACTS.MEDIOLANO);
      const sorted = [...assets].sort(sortAssetsDesc);
      setAllAssets(sorted);
      fetchedRef.current = true;
    } catch (e: any) {
      console.error("Failed to load public timeline assets:", e);
      setError(e?.message ?? "Failed to load timeline");
      setAllAssets([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCollectionOnce();
  }, [loadCollectionOnce]);

  return {
    assets: allAssets,
    isLoading,
    error,
    refetch: loadCollectionOnce,
  };
}
