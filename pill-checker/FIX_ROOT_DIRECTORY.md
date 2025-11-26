# Root Directory設定の修正方法（package.jsonエラー解決）

## 🔍 エラーの原因

ビルドログに以下のエラーが表示されています：
```
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory, open '/vercel/path0/package.json'
```

これは、Vercelがリポジトリのルートディレクトリで`package.json`を探しているが、実際には`pill-checker`サブフォルダにあるため、見つからないというエラーです。

## ✅ 解決方法

Vercelのプロジェクト設定で「Root Directory」を`pill-checker`に設定する必要があります。

---

## 📝 修正手順（ステップバイステップ）

### ステップ1: Vercelのプロジェクト設定を開く

1. ブラウザで https://vercel.com/dashboard にアクセス
2. ログインします（まだログインしていない場合）
3. プロジェクト一覧から、**`pill-checker-4`または`pill-checker`**をクリック
4. プロジェクトページが開きます

### ステップ2: Settings（設定）を開く

1. プロジェクトページの上部にあるタブから**「Settings」**をクリック
2. 左側のサイドバーから**「Build and Deployment」**をクリック
   - ⚠️ **重要**: 「General」ではなく、「Build and Deployment」を選択してください

### ステップ3: Root Directoryを設定

1. 「Build and Deployment」ページが開きます
2. ページを下にスクロールします
3. **「Root Directory」**というセクションを見つけます
   - 「Framework Settings」や「Build Command」の下あたりにあります
4. 現在の設定を確認：
   - **空白または設定されていない場合** → ステップ4へ
   - **別の値が設定されている場合** → 「Edit」ボタンをクリックして修正

### ステップ4: Root Directoryを編集

1. 「Root Directory」セクションの右側にある**「Edit」**ボタンをクリック
   - または、セクション内の「Edit」リンクをクリック
2. 入力フィールドまたはドロップダウンが表示されます
3. 以下の値を入力または選択：
   ```
   pill-checker
   ```
   ⚠️ **重要**: 正確に`pill-checker`と入力してください（大文字小文字も正確に）
   - 「Browse」ボタンがある場合は、それを使って`pill-checker`フォルダを選択することもできます
4. **「Save」**ボタンをクリック
5. 設定が保存されます

### ステップ5: 再度デプロイを実行

Root Directoryを設定した後、再度デプロイを実行する必要があります。

#### 方法A: 手動でデプロイを実行（推奨）

1. プロジェクトページの上部にあるタブから**「Deployments」**をクリック
2. 右上にある**「Redeploy」**ボタンをクリック
3. ドロップダウンから**「Use existing Build Cache」**を選択（またはそのまま）
4. **「Redeploy」**ボタンをクリック
5. デプロイが開始されます（2-3分かかります）

#### 方法B: GitHubにプッシュして自動デプロイ

1. GitHub Desktopで、何か小さな変更を加える（例：READMEファイルに1行追加）
2. コミットしてプッシュ
3. Vercelが自動的に再デプロイを開始します

### ステップ6: デプロイ結果を確認

1. 「Deployments」タブで、最新のデプロイの状態を確認
2. 以下の状態が表示されます：
   - **「Building」** → ビルド中（2-3分待つ）
   - **「Ready」** → デプロイ成功！✅
   - **「Error」** → まだエラーがある（ログを確認）

---

## ✅ 確認ポイント

Root Directoryが正しく設定されているか確認する方法：

1. 「Settings」→「Build and Deployment」を開く
2. 「Root Directory」のセクションを確認
3. 値が`pill-checker`になっていることを確認

---

## 🎯 期待される結果

Root Directoryを正しく設定すると：

1. Vercelが`pill-checker`フォルダ内の`package.json`を見つけられるようになります
2. `npm install`が正常に実行されます
3. `npm run build`が正常に実行されます
4. デプロイが成功します

---

## ❓ よくある質問

### Q: Root Directoryの設定画面が見つからない

**A**: プロジェクトページの「Settings」→「Build and Deployment」を開いてください。画面を下にスクロールすると「Root Directory」のセクションがあります。「General」タブにはありません。

### Q: 設定を保存してもエラーが続く

**A**: 以下を確認してください：
1. Root Directoryの値が正確に`pill-checker`になっているか（スペースや大文字小文字に注意）
2. 再度デプロイを実行したか
3. 最新のデプロイログを確認して、エラーメッセージが変わったか

### Q: デプロイが成功したかどうか確認する方法

**A**: 「Deployments」タブで、最新のデプロイの状態を確認してください。「Ready」と表示されていれば成功です。

---

## 📝 補足情報

- Root Directoryは、Vercelがプロジェクトのルートディレクトリをどこに設定するかを指定します
- プロジェクトがサブフォルダにある場合、この設定が必須です
- 設定後は、今後のデプロイでも自動的にこの設定が使用されます

---

## 🎉 完了！

Root Directoryを正しく設定すれば、デプロイが成功するはずです！

問題が解決しない場合は、最新のデプロイログを確認して、エラーメッセージを共有してください。

