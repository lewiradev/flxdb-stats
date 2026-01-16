// flxdb-stats/index.js
const fs = require("fs");
const path = require("path");

/**
 * flxdb-stats
 * flxdb instance'ını Proxy ile sarar, istatistik toplar.
 *
 * @param {object} db - require("flxdb") sonucu gelen instance
 * @param {object} [opts]
 * @param {string} [opts.filePath] - flxdb JSON dosyasının yolu (ör: "./flxdb/flxdb.json")
 */
function withStats(db, opts = {}) {
  if (!db || (typeof db !== "object" && typeof db !== "function")) {
    throw new TypeError("withStats(db): flxdb instance gerekli");
  }

  const stats = {
    startedAt: new Date(),
    lastOpAt: null,

    reads: 0,
    writes: 0,
    deletes: 0,

    calls: Object.create(null) // her metod ayrı sayılır
  };

  const filePath = opts.filePath ? path.resolve(opts.filePath) : null;

  // 🔍 flxdb README API'sine göre sınıflandırma
  const READ_METHODS = new Set([
    "get",
    "fetch",
    "has",
    "all",
    "allArray",
    "keys",
    "startsWith",
    "type"
  ]);

  const WRITE_METHODS = new Set([
    "set",       // hem set(key, val) hem set(object)
    "ensure",
    "add",
    "subtract",
    "push",
    "pull"
  ]);

  const DELETE_METHODS = new Set([
    "delete",
    "deleteAll"
  ]);

  function touch(methodName) {
    const name = String(methodName);
    const lower = name.toLowerCase();

    stats.lastOpAt = new Date();
    stats.calls[name] = (stats.calls[name] || 0) + 1;

    if (READ_METHODS.has(lower)) stats.reads++;
    else if (WRITE_METHODS.has(lower)) stats.writes++;
    else if (DELETE_METHODS.has(lower)) stats.deletes++;
  }

  function getFileSizeBytes() {
    if (!filePath) return null;
    try {
      return fs.statSync(filePath).size;
    } catch {
      return null;
    }
  }

  function getStats() {
    const now = Date.now();
    const uptimeMs = now - stats.startedAt.getTime();

    return {
      startedAt: stats.startedAt,
      lastOpAt: stats.lastOpAt,

      reads: stats.reads,
      writes: stats.writes,
      deletes: stats.deletes,

      calls: { ...stats.calls },

      uptimeMs,
      uptimeSeconds: Math.floor(uptimeMs / 1000),

      fileSizeBytes: getFileSizeBytes()
    };
  }

  const STATS_SYMBOL = Symbol.for("flxdb.stats");

  const proxy = new Proxy(db, {
    get(target, prop, receiver) {
      if (prop === "getStats") return getStats;
      if (prop === STATS_SYMBOL) return getStats;

      const value = Reflect.get(target, prop, receiver);

      if (typeof value === "function") {
        return function (...args) {
          touch(prop);
          return value.apply(target, args);
        };
      }

      return value;
    }
  });

  return proxy;
}

module.exports = { withStats };
