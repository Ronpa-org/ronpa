# RONPA（論破）

日本語ネイティブ対応のリアルタイムディベート × AI採点プラットフォーム

共同開発先は [Ronpa-org/ronpa](https://github.com/Ronpa-org/ronpa) です。
開発前に [AGENTS.md](AGENTS.md) と [開発・CI・連携設定の手順](docs/development.md) を確認してください。
以下には過去の構想も含まれます。実装済み・未確認の範囲は開発ガイドで区別しています。

## 技術スタック
- **バックエンド**: Python + FastAPI（[backend/](backend/README.md)）
- **フロントエンド**: Next.js 16 + TypeScript + Tailwind CSS 4（frontend/web/）
- **AI**: OpenAI GPT-4o（対戦相手 + 4軸採点）
- **認証・データ保存・対人通信**: Supabase — 接続コードあり。DB・権限設定の再現手順は未整備
- **課金**: Stripe — 予定

## ローカル開発

```bash
# バックエンド (http://localhost:8000)
cd backend
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
cp .env.example .env   # OPENAI_API_KEY を設定（未設定ならモックモード）
./venv/bin/uvicorn app.main:app --reload --port 8000

# フロントエンド (http://localhost:3000)
cd frontend/web
npm ci
npm run dev
```

## デプロイ

| 対象 | サービス | 設定 |
|---|---|---|
| バックエンド | Render | リポジトリ接続で `render.yaml` が自動認識。環境変数 `OPENAI_API_KEY` と `FRONTEND_ORIGINS`（VercelのURL）をダッシュボードで設定 |
| フロントエンド | Vercel | Root Directory を `frontend/web` に設定。環境変数 `NEXT_PUBLIC_API_URL` にRenderのURLを設定 |
