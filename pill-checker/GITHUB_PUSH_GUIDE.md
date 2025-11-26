# GitHubにコードをプッシュして自動デプロイする方法（非エンジニア向け）

## 📋 このガイドについて

このガイドでは、**既にVercelでプロジェクトを作成済み**の方に向けて、GitHubにコードをプッシュして自動デプロイをトリガーする方法を説明します。

**所要時間**: 約10-15分（初回のみ）

---

## ✅ 前提条件

- [ ] Vercelでプロジェクトが作成済み
- [ ] GitHubアカウントを持っている（まだの場合は後述の手順で作成）
- [ ] Windows PCを使用している

---

## 🎯 全体の流れ

1. **GitHubアカウントの準備**（まだの場合）
2. **GitHub Desktopをインストール**（まだの場合）
3. **GitHubリポジトリを作成**
4. **プロジェクトをGitHubにアップロード**
5. **VercelとGitHubを連携**（既に連携済みの場合はスキップ）
6. **自動デプロイの確認**

---

## ステップ1: GitHubアカウントの準備（5分）

### 1-1. GitHubアカウントを持っているか確認

1. ブラウザで https://github.com を開く
2. ログインできるか確認
   - **ログインできる場合** → ステップ2へ
   - **ログインできない場合** → 1-2へ

### 1-2. GitHubアカウントを作成（まだの場合）

1. https://github.com を開く
2. 右上の「Sign up」をクリック
3. メールアドレス、パスワード、ユーザー名を入力
4. メール認証を完了

---

## ステップ2: GitHub Desktopをインストール（5分）

### 2-1. GitHub Desktopがインストールされているか確認

1. Windowsのスタートメニューで「GitHub Desktop」を検索
2. **見つかった場合** → ステップ3へ
3. **見つからない場合** → 2-2へ

### 2-2. GitHub Desktopをダウンロード・インストール

1. ブラウザで https://desktop.github.com を開く
2. 「Download for Windows」をクリック
3. ダウンロードされたファイル（`GitHubDesktopSetup.exe`）を実行
4. インストールウィザードに従ってインストール
5. インストール完了後、GitHub Desktopを起動
6. GitHubアカウントでログイン

---

## ステップ3: GitHubリポジトリを確認・準備（2分）

### 3-1. 既存のリポジトリがあるか確認

1. ブラウザで https://github.com にログイン
2. 右上のプロフィール画像をクリック
3. 「Your repositories」をクリック
4. `pill-checker`というリポジトリが存在するか確認
   - **存在する場合** → ステップ3-2へ（既存リポジトリを使用）
   - **存在しない場合** → ステップ3-3へ（新規作成）

### 3-2. 既存のリポジトリを使用する場合（推奨）

既に`pill-checker`リポジトリが存在する場合、新規作成する必要はありません。既存のリポジトリを使用します。

1. リポジトリ一覧から`pill-checker`をクリック
2. リポジトリのページが開きます（現在この画面にいます）
3. **URLをコピーする方法（2つの方法があります）**

   **方法A: 「Quick setup」セクションからコピー（最も簡単）**
   - 画面の下の方にある「Quick setup — if you've done this kind of thing before」という青いボックスを見つけます
   - その中に「HTTPS」というボタンと、その下にURLが表示されています
   - URLの例：`https://github.com/neco3bucchan-ship-it/pill-checker.git`
   - URLの右側にあるコピーアイコン（📋）をクリックしてURLをコピー

   **方法B: 「Code」ボタンからコピー**
   - 画面の上部にある緑色の「Code」ボタンをクリック
   - ドロップダウンメニューが開きます
   - 「HTTPS」タブが選択されていることを確認
   - URLの右側にあるコピーアイコン（📋）をクリックしてURLをコピー

4. URLをコピーしたら、メモ帳などに貼り付けて保存しておくと便利です
   - 例：`https://github.com/neco3bucchan-ship-it/pill-checker.git`
5. **ステップ4へ進みます**（ステップ3-3はスキップ）

### 3-3. 新しいリポジトリを作成する場合

⚠️ **注意**: 既に`pill-checker`リポジトリが存在する場合は、この手順は不要です。ステップ3-2を使用してください。

1. ブラウザで https://github.com にログイン
2. 右上の「+」マークをクリック
3. 「New repository」をクリック
4. リポジトリ名を入力（例：`pill-checker-2`など、既存のものと異なる名前）
   - ⚠️ **重要**: 既に`pill-checker`が存在する場合、別の名前を使用してください
5. 「Public」または「Private」を選択（どちらでもOK）
6. **「Add a README file」のチェックは外す**（既にプロジェクトがあるため）
7. **「Add .gitignore」のチェックも外す**（既にプロジェクトにあるため）
8. **「Choose a license」も選択しない**（既にプロジェクトがあるため）
9. 「Create repository」をクリック
10. リポジトリのURLをコピー（ステップ3-2の5と同じ手順）

---

## ステップ4: プロジェクトをGitHubにアップロード（5分）

### 4-1. GitHub Desktopでリポジトリを追加

1. GitHub Desktopを起動
2. メニューバーから「File」→「Add Local Repository」をクリック
3. 「Choose...」ボタンをクリック
4. **プロジェクトの親フォルダを選択**
   - フォルダパス: `C:\Users\t-ich\Documents\いまにゅClaud AI Cording202507\合宿202511\お薬飲み忘れツール`
   - ⚠️ **重要**: `pill-checker`フォルダではなく、その**親フォルダ**（`お薬飲み忘れツール`）を選択
5. 「Add repository」をクリック

### 4-2. リポジトリが既にGitで管理されている場合

もし「This directory does not appear to be a Git repository」というメッセージが表示された場合：

1. 「create a repository」をクリック
2. リポジトリ名を入力（例：`pill-checker`）
3. 「Create Repository」をクリック

### 4-3. 初回コミット（変更を記録）

1. GitHub Desktopの左側に、変更されたファイルのリストが表示されます
2. すべてのファイルが選択されていることを確認（チェックボックスがオン）
3. 左下の「Summary」欄に「Initial commit」と入力
4. 「Commit to main」ボタンをクリック
5. 数秒待つと、コミットが完了します

### 4-4. GitHubにプッシュ（アップロード）

#### パターンA: まだGitHubにリポジトリが存在しない場合

1. GitHub Desktopの上部に「Publish repository」ボタンが表示されます
2. 「Publish repository」をクリック
3. リポジトリ名を確認（例：`pill-checker`）
4. 「Keep this code private」のチェックを外す（Publicにする場合）
5. 「Publish repository」をクリック
6. 数秒待つと、GitHubにアップロードされます

#### パターンB: 既にGitHubにリポジトリが存在する場合（このケースに該当）

既に`pill-checker`リポジトリが存在する場合、この手順を使用します。

1. GitHub Desktopのメニューバーから「Repository」→「Repository settings...」をクリック
2. 「Remote」タブをクリック
3. 「Primary remote repository」の「Remote URL」に、ステップ3-2でコピーしたURLを貼り付け
   - 例：`https://github.com/neco3bucchan-ship-it/pill-checker.git`
4. 「Save」をクリック
5. GitHub Desktopの上部に「Push origin」ボタンが表示されます
6. 「Push origin」をクリック
   - ⚠️ **注意**: 既存のリポジトリにファイルがある場合、競合が発生する可能性があります
   - その場合は、後述の「競合が発生した場合」を参照してください
7. 数秒待つと、GitHubにアップロードされます

---

## ステップ5: VercelとGitHubを連携（3分）

### 5-1. 既に連携済みか確認

1. Vercelのダッシュボード（https://vercel.com/dashboard）に移動
2. プロジェクト（`pill-checker-4`または`pill-checker`）をクリック
3. 「Settings」タブをクリック
4. 左側のメニューから「Git」をクリック
5. 「Connected Git Repository」にリポジトリが表示されているか確認
   - **表示されている場合** → ステップ6へ（自動デプロイが開始されているはず）
   - **表示されていない場合** → 5-2へ

### 5-2. GitHubリポジトリをVercelに接続

1. Vercelのプロジェクトページで「Settings」→「Git」を開く
2. 「Connect Git Repository」をクリック
3. GitHubリポジトリ一覧から、先ほど作成したリポジトリを選択
4. 「Connect」をクリック
5. 接続が完了すると、自動的にデプロイが開始されます

---

## ステップ6: 自動デプロイの確認（2分）

### 6-1. デプロイ状況を確認

1. Vercelのプロジェクトページで「Deployments」タブをクリック
2. デプロイ履歴が表示されます
3. 最新のデプロイの状態を確認：
   - **「Building」** → ビルド中（2-3分待つ）
   - **「Ready」** → デプロイ成功！
   - **「Error」** → エラーが発生（ログを確認）

### 6-2. デプロイが成功した場合

1. 「Ready」と表示されたら、デプロイ成功です
2. 「Visit」ボタンをクリックすると、アプリが開きます
3. URLは `https://pill-checker-4.vercel.app` のような形式です

### 6-3. エラーが発生した場合

1. エラーが表示されたデプロイをクリック
2. ビルドログを確認
3. エラーメッセージを確認して、必要に応じて修正
4. 修正後、GitHubに再度プッシュすると、自動的に再デプロイが開始されます

---

## 🔄 今後の更新方法

コードを変更した後、再度デプロイする方法：

### 方法1: GitHub Desktopを使う（推奨）

1. ローカルでコードを変更
2. GitHub Desktopを開く
3. 変更されたファイルが表示されます
4. 「Summary」に変更内容を入力（例：「薬の登録機能を追加」）
5. 「Commit to main」をクリック
6. 「Push origin」をクリック
7. Vercelが自動的に再デプロイを開始します（数分で完了）

### 方法2: Vercelのダッシュボードから手動デプロイ

1. Vercelのプロジェクトページで「Deployments」タブを開く
2. 右上の「Redeploy」ボタンをクリック
3. デプロイが開始されます

---

## ❓ よくある質問

### Q: 「pill-checker already exists」というエラーが出る

**A**: 既に`pill-checker`リポジトリが存在します。新規作成する必要はありません。ステップ3-2の手順で既存リポジトリを使用してください。

### Q: GitHub Desktopで「Publish repository」ボタンが表示されない

**A**: 既にGitHubにリポジトリが存在する可能性があります。パターンB（ステップ4-4）を試してください。

### Q: プッシュ時に競合エラーが発生した

**A**: 既存のリポジトリにファイルがある場合、以下のいずれかの方法で解決できます：

**方法1: 既存のファイルを上書きする（推奨）**
1. GitHub Desktopで「Repository」→「Repository settings...」を開く
2. 「Remote」タブで「Remote URL」を確認
3. コマンドプロンプトまたはPowerShellを開く
4. プロジェクトの親フォルダに移動
5. 以下のコマンドを実行：
   ```powershell
   git push -u origin main --force
   ```
   ⚠️ **注意**: このコマンドは既存のファイルを上書きします。既存のファイルが重要な場合は、方法2を使用してください。

**方法2: 既存のファイルを保持する**
1. GitHub Desktopで「Fetch origin」をクリック
2. 競合しているファイルを手動でマージ
3. 再度「Push origin」をクリック

### Q: 「Push origin」ボタンが表示されない

**A**: リモートリポジトリが設定されていない可能性があります。ステップ4-4のパターンBを試してください。

### Q: デプロイが自動的に開始されない

**A**: 以下を確認してください：
1. VercelとGitHubが正しく連携されているか（ステップ5）
2. GitHubにコードがプッシュされているか
3. Vercelの「Deployments」タブで最新の状態を確認

### Q: エラーが発生した

**A**: ビルドログを確認してください。よくある原因：
- Root Directoryの設定が間違っている（`pill-checker`に設定する必要がある）
- 依存関係のエラー（`package.json`の問題）
- TypeScriptのエラー

---

## ✅ チェックリスト

- [ ] GitHubアカウントを作成・ログイン
- [ ] GitHub Desktopをインストール
- [ ] GitHubリポジトリを作成
- [ ] プロジェクトをGitHubにプッシュ
- [ ] VercelとGitHubを連携
- [ ] 自動デプロイが開始されたことを確認
- [ ] デプロイが成功したことを確認

---

## 🎉 完了！

これで、GitHubにコードをプッシュするたびに、Vercelが自動的にデプロイを実行するようになりました。

今後は、コードを変更してGitHubにプッシュするだけで、自動的に最新版がデプロイされます！

