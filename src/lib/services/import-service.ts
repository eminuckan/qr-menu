import type { AdisyoSyncStats } from "@/lib/integrations/adisyo/types"

export type ImportStats = AdisyoSyncStats

export interface ImportProgress {
    currentCategory: string;
    currentProduct: string;
    stats: ImportStats;
}

export interface ImportContext {
    menuId: string | null;
    categoryIds: string[];
    aborted: boolean;
    paused: boolean;
}

export class ImportRateLimitError extends Error {
    constructor(readonly retryAfterSeconds: number) {
        super(`API rate limit aşıldı. Lütfen ${retryAfterSeconds} saniye bekleyin.`);
        this.name = "ImportRateLimitError";
    }
}

type SyncResponse = {
    success: true;
    runId: string;
    menuId: string;
    stats: ImportStats;
}

export class ImportService {
    static async importMenuFromAdisyo(
        context: ImportContext,
        businessId: string,
        onProgress?: (progress: ImportProgress) => void
    ) {
        const response = await fetch("/api/adisyo/sync", {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                businessId,
                menuId: context.menuId,
            }),
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
            if (response.status === 429 && payload?.retryAfterSeconds) {
                throw new ImportRateLimitError(payload.retryAfterSeconds);
            }

            throw new Error(payload?.message ?? "Adisyo senkronizasyonu başarısız oldu.");
        }

        const result = payload as SyncResponse;
        context.menuId = result.menuId;
        onProgress?.({
            currentCategory: "",
            currentProduct: "",
            stats: result.stats,
        });

        return result;
    }

    static async cleanup(_context: ImportContext) {
        return true;
    }

    static abortImport(context: ImportContext) {
        context.aborted = true;
    }
}
