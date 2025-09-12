crisis-watcher-river-jp

国土交通省の河川情報（k.river.go.jp）のエリア別JSONから「氾濫・警戒に関する水位情報」を収集し、`public/data/` 以下にJSONとして保存します。フロントエンドは Vite + React で最新JSONを表示します。

Scripts
- `npm run river`: 河川情報をクロールして `public/data/latest.json` と時刻別の `public/data/YYYY/MM/DD/HH/index.json` を生成
- `npm run dev`: フロントエンド開発サーバを起動
- `npm run build`: 本番ビルド
- `npm run preview`: ビルドのローカルプレビュー
- `npm run typecheck`: スクリプトとアプリの型チェック

Usage
- 依存関係インストール: `npm i`
- データ生成のみ: `npm run river`
- 開発サーバ: `npm run dev`（http://localhost:5173）
- GitHub Pages 想定のベースパス: `vite.config.ts` の `base` は `/crisis-watcher-river-jp/`

Data format
- `public/data/latest.json` / `public/data/YYYY/MM/DD/HH/index.json`:
  - `generatedAt`: 生成時刻(UTC ISO8601)
  - `timeZone`: `Asia/Tokyo`
  - `hourPath`: `YYYY/MM/DD/HH`（JST基準で作成）
  - `source`: 収集元URLテンプレート
  - `totalItems`: 全アイテム数
  - `floodCount`: 氾濫基準以上の件数
  - `warningCount`: 警戒基準以上の件数
  - `items[]`: 各観測点の概要
    - 主なフィールド例: `code`, `name`, `observedAt`, `placePref`, `placeCity`, `placeRiver`, `level`, `fladLevel`, `isFlood`, `isWarning`, `latitude`, `longitude`

Notes
- 取得元: `https://k.river.go.jp/swin/files/area_info/current/{prefCode}.json`
- 都道府県・市区町村の付与は `data/k.river.go.jp/pref.json` と `data/k.river.go.jp/twn.json` を参照
- ネットワーク状況により取得が失敗する場合があります（スクリプトはリトライ・スキップ処理あり）
