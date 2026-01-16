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

**flxdb-stats**, Node.js için geliştirilen  
hafif, hızlı ve sıfır-konfigürasyonlu **flxdb** veritabanı için hazırlanmış bir  
**istatistik ve metrik izleme eklentisidir**.

flxdb-stats, flxdb instance’ını **Proxy** ile sararak tüm işlemleri izler ve  
okuma, yazma, silme, uptime, dosya boyutu gibi bilgileri **gerçek zamanlı** toplar.

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

> ℹ️ Tüm flxdb metodları **aynı şekilde çalışmaya devam eder**.  
> flxdb-stats yalnızca istatistik toplar.

---

## 🔧 Features

- 📊 Okuma / yazma / silme sayaçları  
- 🕒 Uptime & son işlem zamanı  
- 📁 JSON dosya boyutu ölçümü  
- 🔍 Metod bazlı çağrı istatistikleri  
- 🔌 Proxy tabanlı (API’ye dokunmaz)  
- ⚙️ Sıfır konfigürasyon  
- 🚀 Ultra hafif ve hızlı  

---

## 🧩 API

### `withStats(db, options?)`

flxdb instance’ını sarar ve istatistik toplamayı başlatır.

| Parametre | Tür | Açıklama |
|---------|----|---------|
| `db` | `object` | `require("flxdb")` ile alınan instance |
| `options.filePath` | `string?` | flxdb JSON dosya yolu (opsiyonel) |

---

### `getStats()`

```js
{
  startedAt: Date,
  lastOpAt: Date | null,

  reads: number,
  writes: number,
  deletes: number,

  calls: {
    set: number,
    get: number,
    add: number,
    delete: number
  },

  uptimeMs: number,
  uptimeSeconds: number,
  fileSizeBytes: number | null
}
```

---

## 🧠 How It Works

- flxdb instance’ı bir **Proxy** içine alınır
- Tüm metod çağrıları otomatik olarak izlenir
- Hiçbir flxdb fonksiyonu override edilmez
- Return değerleri bire bir korunur

Bu sayede:
✔ %100 uyumluluk  
✔ Minimum performans kaybı  
✔ Güvenli ve sade kullanım  

---

## 🧪 Example: Live Monitoring

```js
setInterval(() => {
  console.clear();
  console.table(statsDb.getStats());
}, 2000);
```

---

## 🧩 TypeScript Support

`index.d.ts` sayesinde otomatik IntelliSense desteği vardır:

```ts
import { withStats } from "flxdb-stats";

const stats = statsDb.getStats();
stats.reads;
stats.writes;
stats.fileSizeBytes;
```

---

## 🛠 Suitable For

- CLI araçları  
- Local JSON cache sistemleri  
- Monitoring & debug araçları  
- Discord / Telegram botları  
- Küçük ve orta ölçekli Node.js projeleri  

---

## 📄 License

**MIT License**

---

## ⭐ Support

Projeyi beğendiysen ⭐ bırakmayı unutma!  
Katkı, issue ve önerilere her zaman açıktır.
