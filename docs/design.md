# デザインガイド

UI を追加・変更するときはこのガイドに従う。クラス文字列を既存ページから手書きコピーせず、共通コンポーネントとセマンティックトークンを使う。

## カラートークン

`src/app/globals.css` で3層構造のカラートークンを定義している。

1. **パレット層**: `--orange-700` `--zinc-50` などの生の色。`globals.css` の外では参照しない
2. **セマンティック層**: `--surface` `--muted` `--primary` など用途を表す名前。パレット層の色を割り当てる
3. **Tailwind テーマ層**: `@theme inline` で `bg-surface` `text-muted` などのユーティリティとして公開

コンポーネントからは必ずセマンティックなユーティリティ（`bg-surface`, `text-muted`, `border-border` など）を使う。`bg-zinc-50` のようなパレット直接指定や `bg-[#fafafa]` のような任意値は使わない。

### 背景の使い分け

- ページ背景は `layout.tsx` の `bg-background`（白）に任せる。ページ側で全面の背景色を塗らない
- `bg-surface-muted` はオンボーディング画面（`/register`）の全面背景のみに使う
- ローディングスケルトンは `bg-placeholder` を使う

## レイアウトパターン

### アプリ内画面（業務画面）

「白背景 + `PageContainer` + `Card`」で構成する。参照実装: `src/app/groups/page.tsx`

```tsx
<PageContainer>
  <section>
    <h1 className="text-foreground text-3xl font-semibold tracking-tight">
      タイトル
    </h1>
    <p className="text-muted mt-2">説明文</p>
  </section>
  <Card>...</Card>
</PageContainer>
```

ローディング中・未サインイン・エラーなどの状態も `PageContainer` を使う。中央寄せのメッセージ表示には `<PageContainer centered>` を使う。

### オンボーディング画面

サインイン直後などアプリのナビゲーション文脈の外にある画面のみ、`bg-surface-muted` の全面背景 + 中央寄せカードで構成する。参照実装: `src/app/register/page.tsx`

```tsx
<div className="bg-surface-muted flex flex-1 flex-col items-center justify-center px-6">
  <Card as="div" padding="lg" className="w-full max-w-sm">
    ...
  </Card>
</div>
```

顧客登録のようなアプリ内の CRUD 画面にこのパターンを使わない。

## 共通コンポーネント

`src/components/` にあるレイアウト・フォーム部品を使う。

- **PageContainer**: ページのルート。`main` + 余白 + `max-w-3xl`。`centered` で中央寄せ
- **Card**: `bg-surface` + border + rounded のカード。`as`（`section` / `div`）、`padding`（`md` / `lg`）、`dashed`（空状態用の破線）を指定できる。`href` を渡すと hover 付きの `Link` になる
- **TextField**: テキスト入力。`label` を渡すと label 付きのブロックになり、省略するとインラインフォーム用の input 単体になる。`id` は省略すると自動生成され label と関連付く。`onChange` は文字列を受け取る。`className` は常に最外要素に当たる
- **Select**: セレクト。`size`（`sm` / `md`）を指定できる。`onChange` は文字列を受け取る
- **PrimaryButton**: 塗りのプライマリボタン。`size`（`md` = h-11 / `lg` = h-12）を指定できる
- **SecondaryButton**: アウトラインボタン。`variant="danger"` で削除などの破壊的操作用になる

ボタンの `type` はデフォルトで `button`。フォーム送信ボタンには `type="submit"` を明示する。

`className` は基底クラスと**競合しない**追加クラス（`flex-1`, `w-full`, `text-center` など）に使う。基底クラスと競合するバリエーション（余白やサイズなど）は `className` で上書きせず、`padding` や `size` などの props で表現する。足りないバリエーションはクラスをコピーせずコンポーネント側に追加する。

新しい画面はまずこれらで組み立てる。
