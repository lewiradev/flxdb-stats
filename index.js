// flxdb-stats/index.js
const fs = require("fs");
const path = require("path");

/**
 * @typedef {Object} FlxdbStatsOptions
 * @property {string} [filePath] - flxdb JSON dosyasının yolu (ör: "./flxdb/flxdb.json").
 *                                Eğer verilmezse ve db.filePath string ise otomatik kullanılır.
 * @property {boolean} [trackLatency=true] - Her method çağrısının süresini ms cinsinden ölçsün mü?
 * @property {string[]} [ignoreMethods] - İstatistiğe dahil edilmeyecek method isimleri.
 * @property {string} [label] - Bu flxdb instance'ını isimlendirmek için opsiyonel label.
 */

/**
 * @typedef {Object} FlxdbMethodTiming
 * @property {number} count
 * @property {number} totalMs
 * @property {number} maxMs
 * @property {number} avgMs
 */

/**
 * @typedef {Object} FlxdbStatsSnapshot
 * @property {string|null} label
 * @property {Date} startedAt
 * @property {Date|null} lastOpAt
 * @property {number} totalOps
 * @property {number} reads
 * @property {number} writes
 * @property {number} deletes
 * @property {number} other
 * @property {Record<string, number>} calls
 * @property {Record<string, FlxdbMethodTiming>} timings
 * @property {{ totalMs: number, maxMs: number, avgMs: number }} latency
 * @property {{ method: string | null, kind: "read"|"write"|"delete"|"other" | null, at: Date | null, durationMs: number | null }} lastOperation
 * @property {number} uptimeMs
 * @property {number} uptimeSeconds
 * @property {number|null} fileSizeBytes
 */

/**
 * flxdb.stats erişimi için global symbol.
 * Dışarıdan da kullanılabilsin diye export ediyoruz.
 */
const STATS_SYMBOL = Symbol.for("flxdb.stats");

/**
 * flxdb instance'ını Proxy ile sarar ve istatistik toplar.
 *
 * @param {object|Function} db - require("flxdb") sonucu gelen instance.
 * @param {FlxdbStatsOptions} [opts]
 * @param {FlxdbStatsSnapshot} stats
 * @returns {any} Proxy ile sarılmış flxdb instance.
 *
 * Erişimler:
 *   - proxy.getStats(): FlxdbStatsSnapshot
 *   - proxy.resetStats(): void
 *   - proxy[STATS_SYMBOL](): FlxdbStatsSnapshot
 */
function withStats(db, opts = {}) {
  if (!db || (typeof db !== "object" && typeof db !== "function")) {
    throw new TypeError("withStats(db): flxdb instance gerekli");
  }

  const options = {
    filePath: opts.filePath || null,
    trackLatency: opts.trackLatency !== false, // default true
    ignoreMethods: Array.isArray(opts.ignoreMethods) ? opts.ignoreMethods : [],
    label: typeof opts.label === "string" ? opts.label : null,
  };

  const ignoredMethods = new Set(
    options.ignoreMethods.map((m) => String(m))
  );

  // 🔍 flxdb README API'sine göre sınıflandırma (case-insensitive)
  const READ_METHODS = new Set(
    [
      "get",
      "fetch",
      "has",
      "all",
      "allArray",
      "keys",
      "startsWith",
      "type",
    ].map((m) => m.toLowerCase())
  );

  const WRITE_METHODS = new Set(
    ["set", "ensure", "add", "subtract", "push", "pull"].map((m) =>
      m.toLowerCase()
    )
  );

  const DELETE_METHODS = new Set(
    ["delete", "deleteAll"].map((m) => m.toLowerCase())
  );

  // filePath otomatik tespiti (db.filePath varsa)
  let filePath = null;
  if (options.filePath) {
    filePath = path.resolve(options.filePath);
  } else if (db && typeof db.filePath === "string") {
    filePath = path.resolve(db.filePath);
  }

  // İç istatistik state'i
  const stats = {
    label: options.label,
    startedAt: new Date(),
    lastOpAt: null,

    totalOps: 0,

    reads: 0,
    writes: 0,
    deletes: 0,
    other: 0,

    // Eski davranışla uyumlu: method çağrı sayıları (sadece count)
    calls: Object.create(null),

    // Yeni: timing bilgileri
    timings: Object.create(null),

    latency: {
      totalMs: 0,
      maxMs: 0,
      avgMs: 0,
    },

    lastOperation: {
      method: null,
      kind: null,
      at: null,
      durationMs: null,
    },
  };

  function classifyKind(methodNameLower) {
    if (READ_METHODS.has(methodNameLower)) return "read";
    if (WRITE_METHODS.has(methodNameLower)) return "write";
    if (DELETE_METHODS.has(methodNameLower)) return "delete";
    return "other";
  }

  /**
   * Stat güncelleme helper'ı
   * @param {string|symbol} methodName
   * @param {number|null} durationMs
   */
  function touch(methodName, durationMs) {
    const name =
      typeof methodName === "symbol" ? methodName.toString() : String(methodName);
    const lower = name.toLowerCase();

    const kind = classifyKind(lower);

    stats.lastOpAt = new Date();
    stats.totalOps += 1;

    // Eski 'calls' davranışı (sadece sayıyı tut)
    stats.calls[name] = (stats.calls[name] || 0) + 1;

    // Tür bazlı sayaçlar
    if (kind === "read") stats.reads++;
    else if (kind === "write") stats.writes++;
    else if (kind === "delete") stats.deletes++;
    else stats.other++;

    // Son işlem bilgisi
    stats.lastOperation = {
      method: name,
      kind,
      at: stats.lastOpAt,
      durationMs: typeof durationMs === "number" ? durationMs : null,
    };

    // Latency ölçümü açıksa global + per-method timing
    if (options.trackLatency && typeof durationMs === "number") {
      stats.latency.totalMs += durationMs;
      if (durationMs > stats.latency.maxMs) {
        stats.latency.maxMs = durationMs;
      }
      stats.latency.avgMs =
        stats.totalOps > 0
          ? Math.round(
              (stats.latency.totalMs / stats.totalOps) * 100
            ) / 100
          : 0;

      const t =
        stats.timings[name] ||
        (stats.timings[name] = {
          count: 0,
          totalMs: 0,
          maxMs: 0,
          avgMs: 0,
        });

      t.count += 1;
      t.totalMs += durationMs;
      if (durationMs > t.maxMs) t.maxMs = durationMs;
      t.avgMs = Math.round((t.totalMs / t.count) * 100) / 100;
    }
  }

  function getFileSizeBytes() {
    if (!filePath) return null;
    try {
      return fs.statSync(filePath).size;
    } catch {
      return null;
    }
  }

  /**
   * İstatistiklerin snapshot'ını döndürür (plain object).
   * @returns {FlxdbStatsSnapshot}
   */
  function getStats() {
    const now = Date.now();
    const uptimeMs = now - stats.startedAt.getTime();

    // shallow copy'ler; Date referanslarını aynen döndürmek normal.
    return {
      label: stats.label,

      startedAt: stats.startedAt,
      lastOpAt: stats.lastOpAt,

      totalOps: stats.totalOps,

      reads: stats.reads,
      writes: stats.writes,
      deletes: stats.deletes,
      other: stats.other,

      calls: { ...stats.calls },

      // timings derin kopya (değerler primitive)
      timings: Object.keys(stats.timings).reduce((acc, key) => {
        acc[key] = { ...stats.timings[key] };
        return acc;
      }, {}),

      latency: { ...stats.latency },

      lastOperation: { ...stats.lastOperation },

      uptimeMs,
      uptimeSeconds: Math.floor(uptimeMs / 1000),

      fileSizeBytes: getFileSizeBytes(),
    };
  }

  /**
   * İstatistikleri sıfırlar (startedAt'i de günceller).
   */
  function resetStats() {
    stats.startedAt = new Date();
    stats.lastOpAt = null;

    stats.totalOps = 0;
    stats.reads = 0;
    stats.writes = 0;
    stats.deletes = 0;
    stats.other = 0;

    stats.latency.totalMs = 0;
    stats.latency.maxMs = 0;
    stats.latency.avgMs = 0;

    stats.lastOperation = {
      method: null,
      kind: null,
      at: null,
      durationMs: null,
    };

    // calls ve timings temizle
    for (const k of Object.keys(stats.calls)) {
      delete stats.calls[k];
    }
    for (const k of Object.keys(stats.timings)) {
      delete stats.timings[k];
    }
  }

  const proxy = new Proxy(db, {
    get(target, prop, receiver) {
      // Özel yardımcılar
      if (prop === "getStats") return getStats;
      if (prop === "resetStats") return resetStats;
      if (prop === STATS_SYMBOL) return getStats;

      const value = Reflect.get(target, prop, receiver);

      // Symbol veya ignore listesinde ise wrap etme
      if (typeof prop !== "string" || ignoredMethods.has(prop)) {
        return value;
      }

      if (typeof value === "function") {
        return function (...args) {
          const start = options.trackLatency ? Date.now() : null;
          const result = value.apply(target, args);
          const duration =
            options.trackLatency && start !== null ? Date.now() - start : null;
          touch(prop, duration);
          return result;
        };
      }

      return value;
    },
  });

  return proxy;
}

function statsToJSON(stats) {
  if (!stats || typeof stats !== "object") {
    throw new TypeError("statsToJSON(stats): geçerli bir stats objesi gerekli");
  }

  return {
    ...stats,

    startedAt: stats.startedAt
      ? stats.startedAt.toISOString()
      : null,

    lastOpAt: stats.lastOpAt
      ? stats.lastOpAt.toISOString()
      : null,

    lastOperation: {
      ...stats.lastOperation,
      at: stats.lastOperation?.at
        ? stats.lastOperation.at.toISOString()
        : null,
    },
  };
}

module.exports = {
  withStats,
  STATS_SYMBOL,
  statsToJSON,
};
