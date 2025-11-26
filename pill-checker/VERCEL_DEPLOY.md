# Vercelデプロイ手順（完全版・非エンジニア向け）

## 📋 このガイドについて

このガイドでは、**お薬飲み忘れツール**をVercelにデプロイする手順を、非エンジニアの方でも理解できるよう、ステップバイステップで説明します。

**所要時間**: 約15-20分（初回のみ）

---

## ✅ デプロイ前の準備

### 必要なもの
- [ ] インターネット接続
- [ ] GitHubアカウント（無料）
- [ ] Vercelアカウント（無料）
- [ ] ブラウザ（Chrome、Edge、Safariなど）

### 確認事項
- [ ] プロジェクトが正常にビルドできること（`npm run build`が成功すること）

---

## ステップ1: GitHubアカウントの準備（5分）

### 1-1. GitHubアカウントを作成（まだ持っていない場合）

1. ブラウザで https://github.com を開く
2. 右上の「Sign up」をクリック
3. メールアドレス、パスワード、ユーザー名を入力
4. メール認証を完了

### 1-2. 新しいリポジトリを作成

1. GitHubにログイン後、右上の「+」→「New repository」をクリック
2. リポジトリ名を入力（例：`pill-checker`）
3. 「Public」または「Private」を選択（どちらでもOK）
4. **「Add a README file」のチェックは外す**（既にプロジェクトがあるため）
5. 「Create repository」をクリック

---

## ステップ2: プロジェクトをGitHubにアップロード（10分）

### 方法A: GitHub Desktopを使う（最も簡単・推奨）

#### 2A-1. GitHub Desktopをインストール

1. https://desktop.github.com にアクセス
2. 「Download for Windows」をクリックしてダウンロード
3. インストールを実行
4. GitHub Desktopを起動し、GitHubアカウントでログイン

#### 2A-2. リポジトリを追加

1. GitHub Desktopで「File」→「Add Local Repository」をクリック
2. 「Choose...」をクリック
3. **プロジェクトの親フォルダを選択**（`お薬飲み忘れツール`フォルダ）
   - ⚠️ 注意：`pill-checker`フォルダではなく、その**親フォルダ**を選択
4. 「Add repository」をクリック

#### 2A-3. 初回コミット

1. 左側に変更されたファイルのリストが表示されます
2. 左下の「Summary」に「Initial commit」と入力
3. 「Commit to main」をクリック

#### 2A-4. GitHubにプッシュ

1. 上部の「Publish repository」をクリック
2. リポジトリ名を確認（例：`pill-checker`）
3. 「Keep this code private」のチェックを外す（Publicにする場合）
4. 「Publish repository」をクリック
5. 数秒待つと、GitHubにアップロードされます

### 方法B: コマンドラインを使う（上級者向け）

**注意**: この方法は、コマンドプロンプトやPowerShellを使える方向けです。

1. **Gitをインストール**（まだの場合）
   - https://git-scm.com/download/win からダウンロード
   - インストール時はデフォルト設定でOK

2. **プロジェクトフォルダでコマンドを実行**

   PowerShellまたはコマンドプロンプトを開き、以下を実行：

   ```powershell
   # プロジェクトの親フォルダに移動
   cd "C:\Users\t-ich\Documents\いまにゅClaud AI Cording202507\合宿202511\お薬飲み忘れツール"
   
   # Gitリポジトリを初期化
   git init
   
   # すべてのファイルを追加
   git add .
   
   # 初回コミット
   git commit -m "Initial commit"
   
   # メインブランチに名前を変更
   git branch -M main
   
   # GitHubリポジトリを追加（[YOUR-USERNAME]と[REPO-NAME]を置き換える）
   git remote add origin https://github.com/[YOUR-USERNAME]/[REPO-NAME].git
   
   # GitHubにプッシュ
   git push -u origin main
   ```

3. GitHubのユーザー名とパスワード（またはPersonal Access Token）を入力

---

## ステップ3: Vercelでデプロイ（5分）

### 3-1. Vercelアカウントを作成

1. ブラウザで https://vercel.com を開く
2. 右上の「Sign Up」をクリック
3. 「Continue with GitHub」をクリック（推奨）
4. GitHubアカウントで認証
5. Vercelへのアクセス許可を承認

### 3-2. プロジェクトをインポート

1. Vercelのダッシュボード（https://vercel.com/dashboard）に移動
2. 「Add New...」→「Project」をクリック
3. GitHubリポジトリ一覧から、先ほど作成したリポジトリを選択
4. 「Import」をクリック

### 3-3. プロジェクト設定（重要！）

Vercelが自動的に設定を検出しますが、**プロジェクトがサブフォルダにある場合**は以下を設定：

1. **「Root Directory」**の設定：
   - 「Edit」をクリック
   - 「Root Directory」を選択
   - `pill-checker` を入力（または「Browse」で選択）
   - 「Continue」をクリック

2. **Framework Preset**: `Next.js`（自動検出されるはず）

3. **Build Command**: `npm run build`（自動設定される）

4. **Output Directory**: `.next`（自動設定される）

5. **Install Command**: `npm install`（自動設定される）

### 3-4. デプロイ実行

1. 設定を確認したら、「Deploy」をクリック
2. デプロイが開始されます（2-3分かかります）
3. 進行状況が画面に表示されます

### 3-5. デプロイ完了

1. 「Congratulations!」と表示されたら完了です
2. 「Visit」ボタンをクリックすると、アプリが開きます
3. URLは `https://your-app-name.vercel.app` の形式です
4. **自動的にHTTPSが有効になっています**（🔒マークが表示されます）

---

## ステップ4: 動作確認（5分）

### 4-1. 基本動作の確認

1. **HTTPS接続の確認**
   - ブラウザのアドレスバーに🔒マークがあることを確認
   - URLが `https://` で始まっていることを確認

2. **アプリの表示確認**
   - ページが正常に表示されるか確認
   - ユーザー切替ボタンが表示されるか確認
   - 時間帯ボタンが表示されるか確認

3. **機能の確認**
   - 薬登録フォームが動作するか確認
   - カメラ機能が動作するか確認（カメラへのアクセス許可が必要）

### 4-2. PWAとしてインストール（iPhone）

1. Safariでアプリを開く
2. 共有ボタン（□↑）をタップ
3. 「ホーム画面に追加」を選択
4. ホーム画面から起動できることを確認

### 4-3. エラーの確認

- ブラウザの開発者ツール（F12キー）でエラーがないか確認
- コンソールにエラーメッセージが表示されていないか確認

---

## 🔧 トラブルシューティング

### 問題1: ビルドエラーが発生する

**症状**: デプロイ中にエラーが表示される

**対処法**:
1. Vercelのデプロイログを確認
2. エラーメッセージをコピー
3. よくある原因：
   - `Root Directory`が正しく設定されていない → `pill-checker`に設定
   - 依存関係のエラー → `package.json`を確認
   - TypeScriptエラー → ローカルで`npm run build`を実行して確認

### 問題2: カメラが動かない

**症状**: カメラボタンを押しても何も起こらない

**対処法**:
1. **HTTPS接続を確認**（必須）
   - URLが `https://` で始まっているか確認
   - ブラウザのアドレスバーに🔒マークがあるか確認
2. ブラウザのカメラ権限を確認
   - ブラウザの設定でカメラへのアクセスを許可

### 問題3: PWAがインストールできない

**症状**: 「ホーム画面に追加」が表示されない

**対処法**:
1. **HTTPS接続を確認**（必須）
2. `manifest.json`が正しく読み込まれているか確認
   - ブラウザの開発者ツール（F12）→「Application」タブ→「Manifest」で確認
3. Service Workerが登録されているか確認
   - 「Application」タブ→「Service Workers」で確認

### 問題4: ページが表示されない

**症状**: 404エラーや白い画面が表示される

**対処法**:
1. `Root Directory`の設定を確認（`pill-checker`に設定されているか）
2. ビルドログを確認してエラーがないか確認
3. Vercelの設定画面で「Settings」→「General」を確認

---

## 📝 今後の更新方法

コードを変更した後、再度デプロイする方法：

### 方法1: GitHub経由（自動デプロイ・推奨）

1. ローカルでコードを変更
2. GitHub Desktopでコミット＆プッシュ
3. Vercelが自動的に再デプロイを開始
4. 数分で新しいバージョンが公開されます

### 方法2: Vercel CLIを使う（上級者向け）

```bash
# Vercel CLIをインストール
npm i -g vercel

# プロジェクトフォルダで実行
cd pill-checker
vercel
```

---

## ✅ デプロイ完了チェックリスト

- [ ] GitHubにプロジェクトがアップロードされている
- [ ] Vercelでプロジェクトが作成されている
- [ ] デプロイが成功している（エラーがない）
- [ ] URLが `https://` で始まっている
- [ ] ブラウザのアドレスバーに🔒マークが表示されている
- [ ] アプリが正常に表示される
- [ ] カメラ機能が動作する
- [ ] PWAとしてインストールできる

---

## 🎉 完了！

これで、世界中のどこからでも安全なHTTPS接続でアプリにアクセスできるようになりました！

**デプロイされたURL**: `https://your-app-name.vercel.app`

このURLをブックマークして、いつでもアクセスできます。

---

## 💡 よくある質問

**Q: 無料プランでもHTTPSは使えますか？**  
A: はい、Vercelの無料プランでも自動的にHTTPSが提供されます。

**Q: デプロイに時間はかかりますか？**  
A: 初回は2-3分、2回目以降は1-2分程度です。

**Q: カスタムドメインは使えますか？**  
A: はい、Vercelの設定画面からカスタムドメインを追加できます。自動的にHTTPS証明書が発行されます。

**Q: デプロイ後にコードを変更したらどうなりますか？**  
A: GitHubにプッシュすると、Vercelが自動的に再デプロイを開始します。

---

## 📞 サポート

問題が解決しない場合は、以下を確認してください：
- Vercelのドキュメント: https://vercel.com/docs
- Vercelのコミュニティ: https://github.com/vercel/vercel/discussions

