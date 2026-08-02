# ドメインガイド

画面が扱う概念と、上流サービスの癖をまとめる。見た目とコンポーネントの規則は `docs/design.md`。

## テナントと組織

**テナント**と**組織**は別の概念で、UI でも語を混ぜない。

- **テナント**: user-service の group。利用者が所属する単位で、`/tenants` で管理する。識別子は `tenantId`（BFF の `/api/group/*` は上流の API 名に合わせて `group` のまま）
- **組織**: fitness-service の Organization。テナント配下にあり顧客の所属先になる。`/organizations` で管理する。識別子は `organizationId`

テナントの実体は user-service にあるが、**テナントの住所・連絡先（テナントプロフィール）は fitness-service が持つ**。BFF も `/api/fitness/tenant/{tenantId}/profile` で user-service 由来の `/api/group/*` とは別系統になる。未登録のテナントでは上流が 404 を返すので、エラーではなく空のフォームとして表示する。非メンバーも同じ 404 なので、カード自体は `memberships` で出し分ける。参照実装: `src/components/TenantProfileCard.tsx`

## テナントスコープ

「いまどのテナントを見ているか」は**トップバーの `TenantSwitcher` が唯一の情報源**。`TenantsContext` の `selectedTenantId` / `selectTenant` を使う。

- **ページ内にテナントセレクタを置かない**。同じ意味の選択肢が複数箇所にあると、どれが効いているのか分からなくなる。テナントで絞り込む画面は `selectedTenantId` を読むだけにし、対象のテナント名は見出しの説明文に**確認表示**として出す
- 選択値は `localStorage` に保存し、`memberships` に無い値は自動で先頭のテナントにフォールバックする（権限を失ったテナントに固定されないようにする）
- テナントスコープを持つ一覧は URL の `?tenantId=` に反映する（共有・ブックマーク・戻る操作のため）。URL の値が非メンバーなら選択中のテナントで URL を書き直す
- `/tenants/{tenantId}` のように特定のテナントのページを開いたときは、そのテナントを選択状態に同期する。逆にそのページでテナントを切り替えたら、そのテナントの同じページへ移動する
- **同期するのは所属しているテナントのときだけ**。下位テナントのように自分が所属していないテナントのページでは選択状態を変えず、トップバーもテナント名を出さない（別テナントを選択中だと主張しない）
- 選択状態を書き換える API は `selectTenant` だけにし、選択が変わった回数（`scopeVersion`）でリンク由来のスコープと利用者の選択を区別する。「リンクの `tenantId` を採用済みか」を ref で覚えると、テナント取得の失敗や effect の実行順で取りこぼす

一覧を絞り込む**フィルタ**（「無効な顧客も表示する」など）はスコープとは別物なので、ページ内に置いてよい。ただし状態は URL のクエリに反映し、共有・再読込・戻る操作で保たれるようにする。参照実装: `src/app/customers/page.tsx` の `includeInactive`

参照実装: `src/context/TenantsContext.tsx`, `src/components/TenantSwitcher.tsx`, `src/lib/navigation.ts`

## 測定

**測定**は fitness-service の Measurement で、顧客に属する。テナントや組織のような独立した管理対象ではないので、**サイドバーには出さず顧客詳細を起点にする**。

- 顧客詳細の「測定履歴」セクションが一覧で、そこから記録ページ（`/customers/{customerId}/measurements/new`）と詳細ページ（`/customers/{customerId}/measurements/{measurementId}`）に入る。参照実装: `src/components/MeasurementHistory.tsx`
- 専用の測定一覧ページは作らない。上流の `ListMeasurements` が1リクエストで全件返すので、顧客詳細のセクションに新しい順で並べる
- 上流の取得・更新・削除は `measurementId` だけで引けるが、**URL は顧客配下にネストする**。パンくずと戻り先が自然になるため。`measurement.customerId` が URL の `customerId` と一致しない場合は「測定が見つかりません」にする（URL の付け替えで別顧客の測定を表示しない）
- **測定項目マスタ（MeasurementItem）はテナント非依存のグローバルマスタ**で、フロントから追加・編集はできない。取得は `src/lib/useMeasurementItems.ts`
- **並び順はサーバーの順序に従う**（カテゴリ順 → コード順）。フロントで並べ替えない。逆に**測定のレスポンスの `entries` は測定項目 ID 順で意味のある順序ではない**ので、表示・入力は必ず項目マスタの順序で組む
- **下書きと確定は `isDraft` で区別し、UI では入力項目ではなくボタンの選択として表す**。フォームに下書きのチェックボックスを置くと「保存」と「どう保存するか」が2箇所に分かれる。下書きの測定は「下書きとして保存」「確定して保存」の2ボタン、確定済みは「変更を保存」1つ（確定を巻き戻す操作は用意しない）
- **保存操作が2つあるフォームでは Enter による暗黙送信で保存しない。** どちらのボタンも `type="button"` にし、`form` の `onSubmit` は `preventDefault` だけにする（送信ボタンが1つのフォームは通常どおり `type="submit"` を明示する）。確定は巻き戻せないので、下書きから確定するときは `window.confirm` で確認する
- 取得系は **401 を「サインインの有効期限が切れました」+ `LoginButton` に分岐する**。汎用エラーに潰すと、再試行しても成功しない行き止まりになる。共通のフェッチは `src/lib/useResource.ts`（`loading` / `ok` / `unauthenticated` / `error` の4状態）に置き、`useMeasurementItems` / `useMeasurements` はその薄いラッパーにする
- **マスタの変更で表示できなくなった値は警告する。** 項目 ID が消えた場合だけでなく、試行回数・左右の設定が変わって入らなくなった値も `measurementDataLoss` で数え、保存すると失われることを伝える
- 測定時の年齢はサーバーが顧客の生年月日から計算するので、読み取り専用の表示にする
- **測定者（`measuredBy`）は BFF が埋め、クライアントからは受け取らない**。作成時は `/v1/verify` の `userId`、**更新時は上流から取り直した既存の `measuredBy` をそのまま送り返す**。`/api/user/get` の `userId` は user-service が発行した別の識別子で、上流が `updatedBy` に入れる値と体系が違う。上流の `UpdateMeasurement` は渡された値で `measured_by` を上書きするので、編集者で埋めると「実際に測定した人」が消える。表示はしない（識別子しか無く名前に解決できないため）

### 項目 × 試行 × 左右の入力

「1項目に複数の値がある」入力は、項目ごとに1ブロックを作り、その中で試行と左右を展開する。参照実装: `src/components/MeasurementFields.tsx`

- **行 = 左右、列 = 試行**の表にする。試行が1回だけなら列見出しを出さず、左右が無ければ行見出しも出さず、入力欄1つだけにする
- 表の入力欄は `label` を持てないので `aria-label` に「項目名（2回目・左）」のような位置つきの名前を渡す。列・行見出しだけでは支援技術に伝わらない
- 横に収まらない場合はグリッドを `overflow-x-auto` でラップする。ページの幅は変えない
- 「測定不可」のような値を無効化するチェックボックスは、**オンにしたときに入力値を消す**。値を残したまま送るとサーバーが弾くので、UI 側で状態を一貫させる
