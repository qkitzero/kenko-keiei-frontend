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

「白背景 + `PageContainer` + `Card`」で構成する。参照実装: `src/app/tenants/page.tsx`

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

ただし**全画面のエラー表示は、ページ全体が成立しない場合に限る**（未サインイン、ユーザー情報やテナント情報の取得失敗など）。ページの見出しは成立していて一覧だけが取得できなかった場合は、見出しを残したまま一覧の位置に `dashed` の `Card` でメッセージと再試行を出す。画面全体を差し替えると、失敗したのが一覧だけなのか画面全体なのかが読み取れない。参照実装: `src/app/customers/page.tsx`

### テナントと組織

**テナント**と**組織**は別の概念で、UI でも語を混ぜない。

- **テナント**: user-service の group。利用者が所属する単位で、`/tenants` で管理する。識別子は `tenantId`（BFF の `/api/group/*` は上流の API 名に合わせて `group` のまま）
- **組織**: fitness-service の Organization。テナント配下にあり顧客の所属先になる。`/organizations` で管理する。識別子は `organizationId`

### テナントスコープ

「いまどのテナントを見ているか」は**ヘッダーの `TenantSwitcher` が唯一の情報源**。`TenantsContext` の `selectedTenantId` / `selectTenant` を使う。

- **ページ内にテナントセレクタを置かない**。同じ意味の選択肢が複数箇所にあると、どれが効いているのか分からなくなる。テナントで絞り込む画面は `selectedTenantId` を読むだけにし、対象のテナント名は見出しの説明文や「登録先のテナント」のような**確認表示**として出す
- 選択値は `localStorage` に保存し、`memberships` に無い値は自動で先頭のテナントにフォールバックする（権限を失ったテナントに固定されないようにする）
- テナントスコープを持つ一覧は URL の `?tenantId=` に反映する（共有・ブックマーク・戻る操作のため）。URL の値が非メンバーなら選択中のテナントで URL を書き直す
- `/tenants/{tenantId}` のように特定のテナントのページを開いたときは、そのテナントを選択状態に同期する。逆にそのページでテナントを切り替えたら、そのテナントの同じページへ移動する
- **同期するのは所属しているテナントのときだけ**。下位テナントのように自分が所属していないテナントのページでは選択状態を変えず、ヘッダーもテナント名を出さない（別テナントを選択中だと主張しない）
- 選択状態を書き換える API は `selectTenant` だけにし、選択が変わった回数（`scopeVersion`）でリンク由来のスコープと利用者の選択を区別する。「リンクの `tenantId` を採用済みか」を ref で覚えると、テナント取得の失敗や effect の実行順で取りこぼす

参照実装: `src/context/TenantsContext.tsx`, `src/components/TenantSwitcher.tsx`, `src/app/customers/page.tsx`

組織も顧客と同じテナントスコープの一覧なので、同じ形（`selectedTenantId` を読む + `?tenantId=` を URL に反映）で作る。参照実装: `src/app/organizations/page.tsx`

一覧を絞り込む**フィルタ**（「無効な顧客も表示する」など）はスコープとは別物なので、ページ内に置いてよい。ただし状態は URL のクエリに反映し、共有・再読込・戻る操作で保たれるようにする。参照実装: `src/app/customers/page.tsx` の `includeInactive`

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

### 複数項目フォーム

項目数が多いフォームは、`Card` の中で「`fieldset` + `legend` のセクション + 2カラムグリッド」に分ける。参照実装: `src/components/CustomerFields.tsx`（`src/app/customers/register/page.tsx` と `src/app/customers/[customerId]/page.tsx` で共有している）

```tsx
<form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-6">
  <fieldset disabled={saving}>
    <legend className="text-subtle text-sm font-medium">基本情報</legend>
    <div className="mt-3 grid gap-4 sm:grid-cols-2">
      <TextField label="氏名 *" value={values.name} onChange={update("name")} />
      <TextField label="建物名" className="sm:col-span-2" ... />
    </div>
  </fieldset>
  {error && <p className="text-danger text-sm">{error}</p>}
  <div className="flex justify-end">
    <PrimaryButton type="submit">登録</PrimaryButton>
  </div>
</form>
```

- 入力には `label` 付きの `TextField` / `Select` を使う（`id` は自動生成され label と関連付く）
- **セクションは `fieldset` + `legend`** にする。`h3` の見出しだけでは支援技術に伝わらず、同じラベル（「氏名」「電話番号」など）が別セクションに現れると区別できない
- 送信中の無効化は**各入力ではなく `fieldset` の `disabled`** に渡す
- **必須項目はラベル末尾に ` *`** を付ける。任意項目だけのセクションは `legend` に「（任意）」を付ける
- 幅を取る項目だけ `className="sm:col-span-2"` で1行に広げる
- 顧客のように**利用者本人以外の情報**を入力するフォームでは、ブラウザが操作者自身の住所や氏名を埋めないよう全項目に `autoComplete="off"` を明示する
- 登録画面と編集画面で同じ項目を扱うときは、入力群を `src/components/` のコンポーネントに切り出して共有する。`values` / `onChange` / `disabled` を受け取り、状態はページ側で持つ
- 検証エラーは**送信ボタンの直前**に `text-danger` のテキストで1件だけ表示する。長いフォームでカードの外や上部に置くと画面外になり、ボタンが反応していないように見える。削除など別操作のエラーはその操作の近くに別で置く
- 検証とペイロード組み立ては `src/lib/` に置く（例: `buildCustomerPayload`）。サーバー側と共有する判定（日付の妥当性など）も同じモジュールから使う
- 文字数上限と制御文字の判定は `src/lib/text.ts`（`TEXT_MAX_LENGTH` / `isTooLong` / `hasControlChar`）だけに置く。上限をエンティティごとに再定義すると、数え方（コードポイントか UTF-16 か）がずれてサーバーの判定と食い違う

## 共通コンポーネント

`src/components/` にあるレイアウト・フォーム部品を使う。

- **PageContainer**: ページのルート。`main` + 余白 + `max-w-3xl`。`centered` で中央寄せ
- **Card**: `bg-surface` + border + rounded のカード。`as`（`section` / `div`）、`padding`（`md` / `lg`）、`dashed`（空状態用の破線）を指定できる。`href` を渡すと hover 付きの `Link` になる
- **Field**: `TextField` / `Select` が共有する土台。基底クラス（`FIELD_BASE` / `FIELD_SIZE`）、label ラッパー（`FieldWrapper`）、`id` のフォールバック（`useFieldId`）を持つ。新しい入力部品はクラス文字列を書き写さずこれを使う
- **TextField**: テキスト入力。`label` を渡すと label 付きのブロックになり、省略するとインラインフォーム用の input 単体になる。`id` は省略すると自動生成され label と関連付く。`onChange` は文字列を受け取る。`className` は常に最外要素に当たる
- **Select**: セレクト。`TextField` と同じく `label` を渡すと label 付きのブロックになり、省略するとインラインフォーム用の select 単体になる。`size` の既定 `md` は `TextField` と同じ寸法なので横に並べても揃う。`sm` は一覧の行内などに置くコンパクト版。`id` は省略すると自動生成され label と関連付く。`onChange` は文字列を受け取る
- **PrimaryButton**: 塗りのプライマリボタン。`size`（`md` = h-11 / `lg` = h-12）を指定できる
- **PrimaryLink**: `PrimaryButton` と同じ見た目の `Link`（一覧ページから登録ページへ送る CTA などに使う）。クラス文字列は `primaryClassName` で共有している。**ボタンとリンクを1つのコンポーネントに兼用させない**（`href` と `disabled` / `onClick` が同時に受け取れると、渡しても効かない props が型を通ってしまう）
- **SecondaryButton**: アウトラインボタン。`variant="danger"` で削除などの破壊的操作用になる
- **Badge**: 状態やロールを示す枠線付きのピル。`size`（`md` = 既定 / `sm` = 一覧の行内）、`tone`（`muted` = 既定 / `subtle`）を指定できる。ロール表示や「無効」のような状態表示はこれを使い、クラス文字列を書き写さない

ボタンの `type` はデフォルトで `button`。フォーム送信ボタンには `type="submit"` を明示する。

`className` は基底クラスと**競合しない**追加クラス（`flex-1`, `w-full`, `text-center` など）に使う。基底クラスと競合するバリエーション（余白やサイズなど）は `className` で上書きせず、`padding` や `size` などの props で表現する。足りないバリエーションはクラスをコピーせずコンポーネント側に追加する。

新しい画面はまずこれらで組み立てる。
