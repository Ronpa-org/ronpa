# 開発・CI・連携設定

## 変更を取り込む流れ

`作業ブランチ → PR → CI成功・コメント解決 → main → デプロイ（再接続・自動公開は確認待ち）`

正規リポジトリは [Ronpa-org/ronpa](https://github.com/Ronpa-org/ronpa)。
エージェントは `codex/` で始まる作業ブランチを使う。`main` に直接pushしない。
共同管理者の追加は今回の作業範囲外。
現在の進捗と担当分担は [進捗メモ](progress.md) を参照する。

## mainの保護

[main-protection](https://github.com/Ronpa-org/ronpa/rules/23977555) をActiveで運用する。

- 対象は `refs/heads/main`。
- PR必須、未解決のレビューコメントは解決必須。
- 強制push・ブランチ削除は禁止。バイパス対象者は設定しない。
- 技術担当が実質一人の段階では、他者の承認は0名必須。レビュー体制ができた時点で見直す。
- CIの `Frontend checks` と `Backend tests` は、GitHub上で成功を確認したうえで必須チェックに設定済み。チェックの発行元はGitHub Actionsに限定し、最新mainへの追従も必須とする。
- `school` ブランチにはこのルールを適用しない。

ルールの確認は `gh api repos/Ronpa-org/ronpa/rules/branches/main` で行う。
CI名を変更する場合は、GitHub側の必須チェック名も同時に更新する。

## CIで確認する内容

定義は `.github/workflows/ci.yml`。main向けPRとmainへのpushで両ジョブを実行する。
パスによるスキップは行わず、ドキュメントだけのPRでも必須チェックが返るようにする。

| ジョブ | 実行内容 |
| --- | --- |
| `Frontend checks` | Node.js 22、`npm ci`、警告0件のESLint、Next.jsのルート型生成・TypeScript、本番ビルド |
| `Backend tests` | Python 3.12、依存整合性、構文チェック、FastAPIのモックAPIテスト |

Actionsの権限は `contents: read`。公式ActionはコミットSHAで固定し、checkoutの認証情報を残さない。
本番の環境変数やSecretsはCIに渡さない。バックエンドテストはdotenvを無効化し、OpenAIキーを空にした上でソケット接続を禁止する。

APIテストは日本語／英語・両陣営・4難易度の開始→発言→採点、セッション分離、入力制限、未知のID、対人採点、OpenAI障害時のフォールバック、CORSを確認する。
モックテストは、採点品質やSupabase・OpenAI・Realtimeの実接続を保証しない。

### ローカルで同じチェックを行う

Node.jsはルートの `.nvmrc` の22系、Pythonは3.12系を使用する。

```bash
cd frontend/web
npm ci
npm run lint -- --max-warnings=0
npm run typecheck
npm run build
```

```bash
cd backend
python3 -m venv venv
./venv/bin/python -m pip install -r requirements-dev.txt
./venv/bin/python -m pip check
./venv/bin/python -m compileall -q app tests
./venv/bin/python -m unittest discover -s tests -v
```

Next.jsのGoogle Fonts取得にはネットワークが必要。
Pythonの本番依存は既存の下限指定を維持しており、完全なバージョン固定は今後の整備対象。

### 導入時の検証記録（2026-09-25）

- [初回CI](https://github.com/Ronpa-org/ronpa/actions/runs/36092864035) は両ジョブ成功。対象コミットは `0d10430`。
- ローカルでもLint（警告0件）、型チェック、本番ビルド、APIテスト9件に成功。ローカルはNode.js 25.9.0／Python 3.14.3、CIは指定の22系／3.12系で確認した。
- 本番ビルドをローカル起動し、言語切替・再読み込み後の復元、ゲストのマイページ、サンプル結果、モックAI対戦の開始→発言→採点→保存結果表示をブラウザーで確認した。
- 既存のReact Lint違反は状態更新・保存値読み込み・ref同期の修正で解消した。チェックを無効化して通過させていない。
- Supabase認証後の画面や対人Realtimeの実接続は未検証。

## 移管後のデプロイ連携

当面、既存Vercel／Renderは友人が管理し、ユーザーはGitHubで開発する。
管理画面への招待は前提にしない。まず友人に接続設定を確認・修正してもらい、GitHub側の承認が必要な場合はユーザーが対応する。
招待目的の有料化は進めない。送付用の依頼文と完了条件は [進捗メモ](progress.md) にまとめている。

GitHubの過去のチェック・デプロイ履歴が残っていても、新しいOrganizationから再デプロイできる証拠にはならない。
また、GitHub Environmentの保護だけでは、Vercel／Renderが直接行う自動デプロイを制限できない。

### 確認する設定

| 対象 | 確認内容 |
| --- | --- |
| GitHub App | `Ronpa-org/ronpa` への必要なアクセスがあること。既存のGit連携方式を確認して接続する |
| Vercel | 既存RONPAプロジェクトの接続先が `Ronpa-org/ronpa`、Root Directoryが `frontend/web`、Production Branchが `main` であること |
| Vercelの環境変数 | `NEXT_PUBLIC_API_URL` が対象Render APIを指すこと。Supabaseの公開設定とサイトURLも環境別に確認する |
| Render | 既存 `ronpa-api` の接続先が `Ronpa-org/ronpa`、Branchが `main`、Root Directoryが `backend` であること |
| Renderの起動 | `pip install -r requirements.txt` と `uvicorn app.main:app --host 0.0.0.0 --port $PORT` を確認する |
| Renderの公開条件 | 可能ならCI成功後の自動デプロイを使用する。実際の設定値を確認する |
| Renderの環境変数 | `FRONTEND_ORIGINS` がフロントのURLを許可すること。秘密鍵は画面・ログ・PRに転記しない |

既存プロジェクトを確認する前に、新規プロジェクトの作成、環境変数の上書き、本番の手動再デプロイを行わない。
接続後の検証では、新しいコミットに対するチェック・デプロイ結果とAPIヘルスを確認する。
`/api/health` の成功はOpenAIの疎通成功を意味しない。

### 2026-09-25の調査時点

- 新OrganizationのGitHub Appインストールは0件。
- 確認できたVercel成功記録は2026-07-23の移管前コミットに対するもの。
- GitHub Environment `Production` と `main - ronpa-api` に保護・ブランチ制限はない。
- エージェントが参照できたブラウザーではログイン画面が表示され、既存プロジェクトの接続設定・本番の動作は未確認。
- 再接続確認は、既存プロジェクトを管理している友人へ依頼する。ユーザー自身のログインや、新たなメンバー招待は完了条件ではない。

この一覧は調査時点の記録。再接続を確認できたら、確認日・対象コミット・結果で更新する。
