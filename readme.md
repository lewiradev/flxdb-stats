# 📊 flxdb-stats
<p align="left">
  <a href="https://www.npmjs.com/package/flxdb-stats">
    <img src="https://img.shields.io/npm/v/flxdb-stats?color=%2300c853&style=for-the-badge" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/flxdb-stats">
    <img src="https://img.shields.io/npm/dm/flxdb-stats?color=%230098ee&style=for-the-badge" alt="npm downloads" />
  </a>
  <a href="https://github.com/lewiradev/flxdb-stats">
    <img src="https://img.shields.io/github/stars/lewiradev/flxdb-stats?color=%23ffca28&style=for-the-badge" alt="stars" />
  </a>
  <a href="https://github.com/lewiradev/flxdb-stats/issues">
    <img src="https://img.shields.io/github/issues/lewiradev/flxdb-stats?color=%23e57373&style=for-the-badge" alt="issues" />
  </a>
  <a href="https://github.com/lewiradev/flxdb-stats/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/flxdb-stats?color=%23796eff&style=for-the-badge" alt="license" />
  </a>
</p>

**flxdb-stats** is a lightweight, fast and zero-configuration  
**statistics & metrics plugin** for the **flxdb** database in Node.js.

It wraps your flxdb instance using a **Proxy**, transparently tracking  
reads, writes, deletes, latency, uptime, file size and more —  
**in real time**, without touching the original API.

---

## 📦 Installation

```bash
npm install flxdb flxdb-stats
```

---

## 🚀 Quick Usage

```js
const db = require("flxdb");
const { withStats } = require("flxdb-stats");

const statsDb = withStats(db, {
  filePath: "./flxdb/flxdb.json"
});

statsDb.set("user.name", "Lewira");
statsDb.add("system.uptime", 1);
statsDb.get("user.name");
statsDb.delete("user.session");

console.log(statsDb.getStats());
```

> ℹ️ All flxdb methods continue to work **exactly the same**.  
> flxdb-stats only observes and collects statistics.

---

## 🔧 Features

- 📊 Read / write / delete counters  
- 🕒 Uptime & last operation tracking  
- 📁 JSON file size measurement  
- 🔍 Per-method call statistics  
- ⚡ Latency measurement (avg / max / total / per-method)  
- 🔌 Proxy-based (no API overrides)  
- ⚙️ Zero configuration  
- 🚀 Ultra-lightweight & fast  
- 🟦 Full TypeScript support  

---

## 🧩 API

### `withStats(db, options?)`

Wraps a flxdb instance and starts collecting statistics.

| Parameter | Type | Description |
|--------|------|------------|
| `db` | `object` | flxdb instance (`require("flxdb")`) |
| `options.filePath` | `string?` | Path to flxdb JSON file (optional) |
| `options.trackLatency` | `boolean?` | Enable latency tracking (default: true) |
| `options.ignoreMethods` | `string[]?` | Methods to ignore |
| `options.label` | `string?` | Custom instance label |

---

### `getStats()`

```js
{
  label: string | null,

  startedAt: Date,
  lastOpAt: Date | null,

  totalOps: number,

  reads: number,
  writes: number,
  deletes: number,
  other: number,

  calls: Record<string, number>,
  timings: Record<string, MethodTiming>,
  latency: {
    totalMs: number,
    maxMs: number,
    avgMs: number
  },

  lastOperation: {
    method: string | null,
    kind: "read" | "write" | "delete" | "other" | null,
    at: Date | null,
    durationMs: number | null
  },

  uptimeMs: number,
  uptimeSeconds: number,
  fileSizeBytes: number | null
}
```

---

## 🧠 How It Works

- flxdb instance is wrapped inside a **Proxy**
- Every method call is intercepted automatically
- Operations are classified (read / write / delete / other)
- Execution time and timestamps are recorded
- Original return values are preserved

✔ 100% compatibility  
✔ Minimal overhead  
✔ Safe and transparent usage  

---

## 🧪 Example: Live Monitoring

```js
setInterval(() => {
  console.clear();
  console.table(statsDb.getStats());
}, 2000);
```

---

## 🔑 Symbol Access

Stats can also be accessed via a global symbol:

```js
const { STATS_SYMBOL } = require("flxdb-stats");

const stats = statsDb[STATS_SYMBOL]();
```

---

## 🔄 JSON-safe Serialization

```js
const { statsToJSON } = require("flxdb-stats");

const json = statsToJSON(statsDb.getStats());
console.log(JSON.stringify(json, null, 2));
```

---

## 🧩 TypeScript Support

Full IntelliSense is provided via `index.d.ts`:

```ts
import { withStats, FlxdbStats, FlxdbStatsJSON } from "flxdb-stats";

const stats: FlxdbStats = statsDb.getStats();
const json: FlxdbStatsJSON = statsToJSON(stats);
```

---

## 🛠 Suitable For

- CLI tools  
- Local JSON cache systems  
- Monitoring & debug tools  
- Discord / Telegram bots  
- Small & medium Node.js projects  

---

# 📄 Changelog — v0.1.2

### 🚀 Stable Release Improvements

- Full Proxy-based tracking  
- Improved read/write/delete classification  
- Per-method call counters  
- Latency tracking (global & per-method)  
- Enhanced last operation snapshot  
- Uptime and file size tracking  
- JSON-safe serialization (`statsToJSON`)  
- Complete TypeScript definitions  
- Symbol-based stats access  
- README improved and merged  
- Version updated to **v0.1.2**  

---

## 📄 License

**MIT License**

---

## ⭐ Support

If you like this project, don’t forget to leave a ⭐  
Issues, suggestions and contributions are always welcome.
