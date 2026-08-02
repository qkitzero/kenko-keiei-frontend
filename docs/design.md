# デザインガイド

UI を追加・変更するときはこのガイドに従う。クラス文字列を既存ページから書き写さず、共通コンポーネントとセマンティックトークンを使う。画面が扱う概念と上流サービスの癖は `docs/domain.md` を見る。

**このアプリは事業者が業務で使う管理ツール**。装飾より情報密度と一貫性を優先する。

## カラー

`src/app/globals.css` で3層に分ける。

1. **パレット層**: `--zinc-200` `--blue-700` などの生の色。`globals.css` の外では参照しない
2. **セマンティック層**: `--surface` `--primary` など用途を表す名前
3. **Tailwind テーマ層**: `@theme inline` で `bg-surface` などのユーティリティとして公開

コンポーネントからはセマンティックなユーティリティだけを使う。`bg-zinc-50` のようなパレット直接指定や `bg-[#fafafa]` のような任意値は使わない。

| トークン                          | 用途                                             |
| --------------------------------- | ------------------------------------------------ |
| `background`                      | アプリの地。カードが浮いて見えるよう薄いグレー   |
| `surface`                         | カード・サイドバー・トップバー（白）             |
| `surface-muted`                   | テーブルのヘッダー行など、沈める領域             |
| `border` / `border-strong`        | 罫線 / より強い罫線                              |
| `hover`                           | ホバーの重ね色。半透明なのでどの地の上でも使える |
| `foreground` / `muted` / `subtle` | 本文 / 補助 / さらに弱い                         |
| `primary`                         | 主操作。`danger` の赤と混同しない青にしている    |
| `danger` / `warning` / `success`  | 破壊的操作 / 注意 / 成功                         |
| `placeholder`                     | ローディングスケルトン                           |

## 寸法

- **コントロールの高さ**: `sm` = 32px / `md` = 36px（既定）/ `lg` = 40px。`src/components/control.ts` に持つ
- **角丸**: コントロールと入力は `rounded-md`、カードとテーブルは `rounded-lg`、バッジは `rounded`。`rounded-full` はアバターだけ
- **影**: ポップオーバーとドロワーだけ。カードは罫線で分ける
- **文字サイズ**: ページ見出し `text-xl` / カード見出し `text-sm font-semibold` / 本文 `text-sm` / 補助 `text-xs`。`text-2xl` 以上は数値の強調にだけ使う
- **余白**: ページ内のブロック間とカード内のセクション間は `gap-6`、フォームの項目間は `gap-4`

## レイアウト

### アプリシェル

`AppShell` が全ページを包む（`/register` を除く）。

- 左の `Sidebar`（幅 224px。`md` 以上で固定表示、未満はドロワー）が**機能への移動**を担う
- 上の `TopBar` が**スコープ**（`TenantSwitcher`）と**アカウント**を担う
- 同じ行き先をサイドバーとトップバーの両方に置かない

### ページ

`PageContainer` + `PageHeader` で始める。

```tsx
<PageContainer>
  <PageHeader
    title="顧客"
    description="株式会社テストに登録されている顧客の一覧です。"
    actions={<PrimaryLink href="/customers/register">顧客を登録</PrimaryLink>}
  />
  ...
</PageContainer>
```

- 幅は `PageContainer` が持つ。外枠は常に `max-w-7xl` で、`TopBar` と左端が揃う
- `width="detail"` は入力主体のページ用。外枠は同じまま中身だけ `max-w-4xl` に絞る。**中央寄せにしない**（ページごとに見出しの位置が動く）
- ローディングは `PageSkeleton`。実物と同じ形にする
- **全面のメッセージ（`PageMessage`）はページ全体が成立しない場合に限る**（未サインイン、ユーザー情報やテナント情報の取得失敗など）。見出しは成立していて一覧だけ取れなかった場合は、見出しを残したまま一覧の位置に `StateCard` を置く。画面全体を差し替えると、失敗したのが一覧だけなのか画面全体なのかが読み取れない

### 一覧

一覧は `DataTable` で組む。カラムヘッダー・行リンク・横スクロールが揃う。件数は `SectionHeader` の `count` か、表の上のツールバー行に出す。

- 行全体をリンクにするときは `rowHref` を渡す。先頭セルのリンクが `after:absolute` で行を覆うので、**同じ行に別のボタンを置かない**（覆われて押せなくなる）。行内に操作が要るときは `rowHref` を使わず、先頭セルに `Link` を置く
- 0 件のときは `empty` に `StateCard` を渡す
- 幅が足りないときは横スクロールさせる。列を落とさない

### フォーム

`Card` の中で「`fieldset` + `legend` のセクション + 2カラムグリッド」に分ける。参照実装: `src/components/CustomerFields.tsx`

- 入力は `label` 付きの `TextField` / `Select` / `TextArea` / `Checkbox`。`id` は自動生成され label と関連付く
- **セクションは `h3` ではなく `fieldset` + `legend`**（`FIELD_LEGEND`）。同じラベル（「氏名」「電話番号」など）が別セクションに現れても支援技術で区別できる
- グリッドは `FIELD_GRID`。幅を取る項目だけ `sm:col-span-2` で1行に広げる
- 送信中の無効化は**各入力ではなく `fieldset` の `disabled`** に渡す
- **必須はラベル末尾に ` *`**。任意項目だけのセクションは `legend` に「（任意）」を付ける
- **主操作は `PrimaryButton`**。保存や登録を `SecondaryButton` にしない
- 検証エラーは**送信ボタンの直前**に `text-danger` で1件だけ表示する。カードの外や上部に置くと長いフォームで画面外になり、ボタンが反応していないように見える
- 利用者本人以外の情報を入力するフォーム（顧客など）は、ブラウザが操作者自身の情報を埋めないよう全項目に `autoComplete="off"` を明示する
- 登録画面と編集画面で同じ項目を扱うときは入力群をコンポーネントに切り出す。`values` / `onChange` / `disabled` を受け取り、状態はページ側で持つ

### 破壊的操作

削除など取り消せない操作は `DangerZone` に隔離し、`window.confirm` で確認する。通常のカードと同じ視覚的重みで並べない。

### オンボーディング

アプリのナビゲーション文脈の外にある画面（`/register`）だけ、シェル無しの中央寄せカードにする。アプリ内の CRUD 画面にこの形を使わない。

## 共通コンポーネント

`src/components/` から選ぶ。props はコードの型定義を見る（ここには書かない）。

| 用途                     | コンポーネント                                                     |
| ------------------------ | ------------------------------------------------------------------ |
| 外枠                     | `AppShell` / `Sidebar` / `TopBar`                                  |
| ページの骨格・全面の状態 | `PageContainer` / `PageHeader` / `PageSkeleton` / `PageMessage`    |
| ブロック                 | `Card` / `SectionHeader` / `DangerZone` / `StateCard` / `StatTile` |
| 一覧                     | `DataTable`                                                        |
| 入力                     | `TextField` / `Select` / `TextArea` / `Checkbox`（土台は `Field`） |
| 操作・状態               | `PrimaryButton` / `PrimaryLink` / `SecondaryButton` / `Badge`      |

- **ボタンとリンクを1つのコンポーネントに兼用させない**。`href` と `disabled` / `onClick` が同時に受け取れると、渡しても効かない props が型を通ってしまう
- `className` は基底クラスと**競合しない**追加クラス（`flex-1`, `w-full` など）に使う。余白やサイズのバリエーションは `padding` / `size` の props で表す。足りないバリエーションはクラスをコピーせずコンポーネント側に追加する
- 新しい入力部品は `Field.tsx` の `FIELD_BASE` / `FIELD_SIZE`、新しいボタンは `control.ts` の `CONTROL_*` を使う

## 検証とフォーマット

画面をまたいで判定がずれないよう、`src/lib/` の1箇所に置く。

- 文字数上限と制御文字: `text.ts`（`TEXT_MAX_LENGTH` / `isTooLong` / `hasControlChar`）。上限をエンティティごとに再定義すると、数え方（コードポイントか UTF-16 か）がずれてサーバーの判定と食い違う
- 日付の妥当性・未来判定・`yyyy-mm-dd` と `google.type.Date` の変換: `date.ts`
- UUID の形式判定: `uuid.ts`
- ペイロード組み立て: エンティティごとの `lib/*.ts`（例: `buildCustomerPayload`）
