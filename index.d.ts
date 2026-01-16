export type FlxdbStats = {
  startedAt: Date;
  lastOpAt: Date | null;

  reads: number;
  writes: number;
  deletes: number;

  calls: Record<string, number>;

  uptimeMs: number;
  uptimeSeconds: number;

  fileSizeBytes: number | null;
};

export type WithStatsOptions = {
  /**
   * flxdb'nin JSON dosya yolu (fileSizeBytes hesaplamak için).
   * Örn: "./flxdb/flxdb.json"
   */
  filePath?: string;
};

/**
 * flxdb instance'ını sarar, tüm orijinal API'yi korur ve getStats() ekler.
 */
export declare function withStats<T extends object>(
  db: T,
  opts?: WithStatsOptions
): T & {
  getStats(): FlxdbStats;

  /**
   * İstersen sembol ile de stats alabilirsin (opsiyonel)
   * Symbol.for("flxdb.stats")
   */
  [key: symbol]: unknown;
};
