export type GuideEntry = { name: string; description: string };

const DESCRIPTIONS_BY_CODE: Record<string, string> = {
  blood_pressure:
    "心臓から送り出された血液が血管の壁を押す力です。日本高血圧学会の基準では、診察室で測った値が 140/90 mmHg 以上で高血圧とされます。",
  pulse_rate:
    "心臓が血液を送り出すたびに動脈に生じる拍動の回数です。安静時の成人でおおむね 1 分間に 60〜100 回が目安です。",
  height:
    "BMI と適正体重の算出に使います。加齢や姿勢の崩れで縮むことがあります。",
  weight:
    "BMI と適正体重の算出に使います。短い期間での大きな増減は、体調の変化のサインになることがあります。",
  body_fat_percentage:
    "体重のうち脂肪が占める割合です。体重が同じでも、脂肪と筋肉の比率で体の状態は変わります。",
  muscle_mass:
    "姿勢を保ち体を動かす筋組織の重さです。加齢とともに減りやすく、基礎代謝に関わります。",
  grip_strength:
    "物を握るときの手の力で、全身の筋力をよく反映する指標です。左右 2 回ずつ測ります。",
  stand_up_test:
    "決まった高さの台から片脚または両脚で立ち上がれるかを見ます。低い台から片脚で立てるほど脚の筋力があります。",
  cs30: "30 秒間にイスから立ち座りを何回できるかを測ります。脚の筋持久力の目安です。",
  sit_and_reach:
    "脚を伸ばして座り、上体を前に倒せる距離を測ります。背中から脚の裏側の柔軟性の目安です。",
  stick_reaction:
    "落下する棒をつかむまでの距離から反応の速さを測ります。距離が短いほど速い反応です。",
  side_step:
    "一定の時間に左右へ跳んで線をまたいだ回数を測ります。素早く動きを切り替える力の目安です。",
  eyes_closed_one_leg_stand:
    "目を閉じた片足立ちを保てる時間を測ります。視覚に頼らずに姿勢を保つ力を見ます。",
  eyes_open_one_leg_stand:
    "目を開けた片足立ちを保てる時間を測ります。日常の姿勢の安定に近い指標です。",
  functional_reach:
    "立った姿勢のまま腕をできるだけ前へ伸ばした距離を測ります。姿勢を崩さず動ける範囲の目安です。",
  two_step:
    "できるだけ大きく 2 歩進んだ距離を測ります。歩幅は歩く速さや脚の筋力と関係します。",
  timed_up_and_go:
    "イスから立ち、3m 先の目印を回って戻り、再び座るまでの時間を測ります。時間が短いほど良い値です。",
  walk_5m:
    "5m を歩くのにかかる時間から歩く速さを求めます。時間が短いほど速い値です。",
};

export const DERIVED_GUIDE: GuideEntry[] = [
  {
    name: "BMI",
    description:
      "体重(kg) ÷ 身長(m) ÷ 身長(m) で求める指数です。日本肥満学会の基準では 18.5 未満が低体重、18.5 以上 25 未満が普通体重、25 以上が肥満とされます。",
  },
  {
    name: "適正体重",
    description:
      "身長(m) × 身長(m) × 22 で求める、統計的に病気になりにくいとされる体重です。",
  },
];

export function itemDescription(code: string | undefined): string {
  if (!code) return "";
  return DESCRIPTIONS_BY_CODE[code] ?? "";
}
