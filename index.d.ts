// flxdb-stats/index.d.ts

export type FlxdbMethodKind = "read" | "write" | "delete" | "other";

export interface FlxdbMethodTiming {
  count: number;
  totalMs: number;
  maxMs: number;
  avgMs: number;
}

export interface FlxdbLatencyStats {
  totalMs: number;
  maxMs: number;
  avgMs: number;
}

export interface FlxdbLastOperation {
  method: string | null;
  kind: FlxdbMethodKind | null;
  at: Date | null;
  durationMs: number | null;
}

export interface FlxdbStats {
  /** İstersen opts.label ile instance'ı isimlendirebilirsin (örn: "main-db"). */
  label: string | null;

  /** Proxy ilk oluşturulduğunda. */
  startedAt: Date;
  /** Son herhangi bir method çağrısının zamanı (yoksa null). */
  lastOpAt: Date | null;

  /** Toplam operasyon sayısı (read+write+delete+other). */
  totalOps: number;

  /** Sınıflandırmaya göre okuma sayısı. */
  reads: number;
  /** Yazma sayısı. */
  writes: number;
  /** Silme sayısı. */
  deletes: number;
  /** Diğer (hiçbir sete uymayan) method çağrıları. */
  other: number;

  /**
   * Method bazlı çağrı sayısı.
   * Örn: { get: 10, set: 3, delete: 1 }
   */
  calls: Record<string, number>;

  /**
   * Method bazlı timing istatistikleri.
   * Sadece trackLatency açıksa dolar (aksi halde boş obje dönebilir).
   */
  timings: Record<string, FlxdbMethodTiming>;

  /**
   * Global latency istatistikleri (tüm method çağrıları).
   */
  latency: FlxdbLatencyStats;

  /** Son operasyon hakkındaki detaylı bilgi. */
  lastOperation: FlxdbLastOperation;

  /** Proxy'nin çalışmaya başladığından beri geçen süre (ms). */
  uptimeMs: number;
  /** Aynısının saniye cinsinden hali (Math.floor). */
  uptimeSeconds: number;

  /**
   * flxdb JSON dosyasının boyutu (byte).
   * filePath verilemediyse veya dosya bulunamazsa null.
   */
  fileSizeBytes: number | null;
}

/**
 * JSON.stringify için uygun versiyon:
 * Date -> string (ISO) dönüştürülmüş hali.
 */
export interface FlxdbStatsJSON {
  label: string | null;

  startedAt: string | null;
  lastOpAt: string | null;

  totalOps: number;

  reads: number;
  writes: number;
  deletes: number;
  other: number;

  calls: Record<string, number>;

  timings: Record<
    string,
    {
      count: number;
      totalMs: number;
      maxMs: number;
      avgMs: number;
    }
  >;

  latency: {
    totalMs: number;
    maxMs: number;
    avgMs: number;
  };

  lastOperation: {
    method: string | null;
    kind: FlxdbMethodKind | null;
    at: string | null;
    durationMs: number | null;
  };

  uptimeMs: number;
  uptimeSeconds: number;

  fileSizeBytes: number | null;
}

export interface WithStatsOptions {
  /**
   * flxdb'nin JSON dosya yolu (fileSizeBytes hesaplamak için).
   * Örn: "./flxdb/flxdb.json"
   *
   * Vermezsen ve db.filePath string ise otomatik ondan okunur.
   */
  filePath?: string;

  /**
   * Her method çağrısının süresini ms cinsinden ölç.
   * Varsayılan: true (JS tarafında opts.trackLatency !== false)
   */
  trackLatency?: boolean;

  /**
   * İstatistiğe dahil etmek istemediğin method isimleri.
   * Örn: ["on", "off"] gibi event listener metodlarını ignore etmek için.
   */
  ignoreMethods?: string[];

  /**
   * Bu flxdb instance'ını etiketlemek için opsiyonel isim.
   * Stats içinde "label" alanına yazılır.
   */
  label?: string;
}

/**
 * flxdb.stats erişimi için kullanılan Symbol.
 * JS tarafında Symbol.for("flxdb.stats") döner.
 *
 * NOT: Symbol.for global registry kullandığı için `unique symbol` olamaz.
 */
export declare const STATS_SYMBOL: symbol;

/**
 * flxdb instance'ını sarar, tüm orijinal API'yi korur ve
 * getStats() / resetStats() ekler.
 */
export declare function withStats<T extends object | Function>(
  db: T,
  opts?: WithStatsOptions
): T & {
  /** Anlık istatistik snapshot'ı döndürür. */
  getStats(): FlxdbStats;

  /** Tüm sayaçları ve timing bilgilerini sıfırlar, startedAt'i de günceller. */
  resetStats(): void;

  /** db[STATS_SYMBOL]() ile de stats alınabilir. */
  [key: typeof STATS_SYMBOL]: () => FlxdbStats;
};

/**
 * FlxdbStats snapshot'ını JSON-friendly hale getirir.
 * Date -> ISO string dönüşümü yapar.
 */
export declare function statsToJSON(stats: FlxdbStats): FlxdbStatsJSON;
