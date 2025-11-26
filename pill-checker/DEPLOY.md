# デプロイ手順ガイド（非エンジニア向け）

## 📌 重要なポイント

**VercelとNetlifyは自動的にHTTPSを提供します。**  
特別な設定は不要です。デプロイするだけで、自動的に安全なHTTPS接続が有効になります。

---

## 🚀 方法1: Vercelにデプロイする（推奨・簡単）

### ステップ1: Vercelアカウントを作成

1. ブラウザで https://vercel.com を開く
2. 「Sign Up」をクリック
3. GitHubアカウントでログイン（推奨）またはメールアドレスで登録

### ステップ2: プロジェクトをGitHubにアップロード（初回のみ）

**GitHubアカウントがない場合：**
1. https://github.com にアクセス
2. アカウントを作成
3. 新しいリポジトリを作成（「New repository」をクリック）

**プロジェクトをアップロード：**
1. GitHubでリポジトリを作成したら、表示される指示に従う
2. または、GitHub Desktopアプリを使用してアップロード

**コマンドラインを使う場合（上級者向け）：**
```bash
cd pill-checker
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin [あなたのGitHubリポジトリのURL]
git push -u origin main
```

### ステップ3: Vercelでデプロイ

1. Vercelのダッシュボード（https://vercel.com/dashboard）にログイン
2. 「Add New...」→「Project」をクリック
3. GitHubリポジトリを選択（初回は認証が必要）
4. プロジェクト設定：
   - **Framework Preset**: Next.js（自動検出されるはず）
   - **Root Directory**: `pill-checker` を選択（プロジェクトがサブフォルダにある場合）
   - **Build Command**: `npm run build`（自動設定される）
   - **Output Directory**: `.next`（自動設定される）
5. 「Deploy」をクリック
6. 2-3分待つと、デプロイが完了します
7. 完了後、自動的にHTTPSのURLが表示されます（例：`https://your-app.vercel.app`）

### ステップ4: 確認

1. 表示されたURLをクリックしてアプリが表示されるか確認
2. ブラウザのアドレスバーに🔒マーク（HTTPS）が表示されていることを確認
3. iPhoneでPWAとしてインストールできることを確認

---

## 🌐 方法2: Netlifyにデプロイする

### ステップ1: Netlifyアカウントを作成

1. ブラウザで https://www.netlify.com を開く
2. 「Sign up」をクリック
3. GitHubアカウントでログイン（推奨）またはメールアドレスで登録

### ステップ2: プロジェクトをGitHubにアップロード

（Vercelのステップ2と同じ手順）

### ステップ3: Netlifyでデプロイ

1. Netlifyのダッシュボード（https://app.netlify.com）にログイン
2. 「Add new site」→「Import an existing project」をクリック
3. GitHubを選択してリポジトリを選択
4. ビルド設定：
   - **Base directory**: `pill-checker`（プロジェクトがサブフォルダにある場合）
   - **Build command**: `npm run build`
   - **Publish directory**: `pill-checker/.next`（Next.jsの場合、通常は自動検出）
5. 「Deploy site」をクリック
6. 2-3分待つと、デプロイが完了します
7. 完了後、自動的にHTTPSのURLが表示されます（例：`https://your-app.netlify.app`）

### ステップ4: 確認

1. 表示されたURLをクリックしてアプリが表示されるか確認
2. ブラウザのアドレスバーに🔒マーク（HTTPS）が表示されていることを確認
3. iPhoneでPWAとしてインストールできることを確認

---

## 🔧 トラブルシューティング

### ビルドエラーが出る場合

1. **エラーメッセージを確認**
   - Vercel/Netlifyのデプロイログを確認
   - エラーメッセージをコピーして保存

2. **よくある原因と対処法**
   - **依存関係エラー**: `package.json`に問題がある可能性
   - **ビルドコマンドエラー**: 設定画面でビルドコマンドを確認
   - **環境変数エラー**: 環境変数が必要な場合、設定画面で追加

### カメラが動かない場合

1. **HTTPS接続を確認**
   - URLが `https://` で始まっているか確認
   - ブラウザのアドレスバーに🔒マークがあるか確認

2. **ブラウザの権限を確認**
   - カメラへのアクセス許可を確認
   - ブラウザの設定でカメラ権限を許可

### PWAがインストールできない場合

1. **HTTPS接続を確認**（必須）
2. **manifest.jsonが正しく設定されているか確認**
3. **Service Workerが正しく動作しているか確認**

---

## 📝 カスタムドメインを使う場合（オプション）

独自のドメイン（例：`your-app.com`）を使いたい場合：

### Vercelの場合
1. プロジェクト設定 →「Domains」タブ
2. ドメイン名を入力
3. 表示されるDNS設定をドメイン管理画面で設定
4. 自動的にHTTPS証明書が発行されます

### Netlifyの場合
1. サイト設定 →「Domain management」
2. 「Add custom domain」をクリック
3. ドメイン名を入力
4. 表示されるDNS設定をドメイン管理画面で設定
5. 自動的にHTTPS証明書が発行されます

---

## ✅ デプロイ後のチェックリスト

- [ ] アプリが正常に表示される
- [ ] URLが `https://` で始まっている
- [ ] ブラウザのアドレスバーに🔒マークが表示されている
- [ ] カメラ機能が動作する
- [ ] PWAとしてインストールできる（iPhone/Android）
- [ ] 薬の登録・編集・削除が動作する
- [ ] 画像判定機能が動作する

---

## 💡 よくある質問

**Q: HTTPSの設定は必要ですか？**  
A: いいえ、VercelとNetlifyは自動的にHTTPSを提供します。特別な設定は不要です。

**Q: 証明書の更新は必要ですか？**  
A: いいえ、自動的に更新されます。

**Q: 無料プランでもHTTPSは使えますか？**  
A: はい、無料プランでもHTTPSは利用できます。

**Q: デプロイに時間はかかりますか？**  
A: 初回は2-3分、2回目以降は1-2分程度です。

---

## 🎉 完了！

デプロイが完了すれば、世界中のどこからでも安全なHTTPS接続でアプリにアクセスできます！

