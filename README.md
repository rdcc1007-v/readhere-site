# 讀到這裡 — 官方網站

「讀到這裡」App 的產品介紹網站：[https://read.dreamdiary.workers.dev/](https://read.dreamdiary.workers.dev/)

一本留在手機上的讀書筆記。把正在看的書放到書架，記下讀到第幾頁、當下的心情，和一句話。
日曆會標出有讀書的日子。筆記只存在這台手機，沒有帳號、不上傳。

## 結構

| 檔案 | 說明 |
|---|---|
| `index.html` | 首頁：Hero（手機示意圖＋三間書房配色切換）、功能、書房、使用步驟、隱私重點、FAQ、支援 |
| `apply/index.html` | Android APP 申請表單（`/api/apply` → D1 `readhere-apply`）＋網頁版註冊連結 |
| `worker.js` / `wrangler.toml` | Cloudflare Worker：靜態檔＋申請 API |
| `privacy/index.html` | 隱私權說明（生效日期：2026-10-21） |
| `styles.css` | 全站樣式（深色「午夜寂靜」基調；含隱私頁樣式） |
| `app.js` | 書房配色切換、進場動畫、頁尾年份（無框架、無相依） |
| `icon.png` | App 圖示 512×512 |
| `404.html` / `robots.txt` / `sitemap.xml` / `site.webmanifest` | 站台基本配備 |

## 部署（Cloudflare Workers 靜態資產）

- Worker 名稱：`read`（網址 `read.dreamdiary.workers.dev`）
- 部署方式與原版相同：將本目錄檔案（即原 `site/` 資料夾內容）上傳／部署即可，無建置步驟。
- `.DS_Store` 不要上傳。

## 版本

- v2（2026-10-21）：首頁由單屏擴充為完整產品頁；隱私頁內文未更動，僅套用新版面並新增「聯絡」一節。
- v1（2026-10-21）：初版上線（單屏首頁＋隱私頁）。

## Deploy

```bash
npx wrangler@4 deploy
```

Static site lives in `public/`. Apply form posts to Worker `/api/apply` (D1 `readhere-apply`).
