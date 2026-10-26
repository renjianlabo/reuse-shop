/* 小さな出来事（毎月2〜3個をランダムに選ぶ。同じプレイでは重複しない） */
var GAME = (typeof GAME !== 'undefined') ? GAME : {};

(function (G) {
  'use strict';

  function L(who, face, text) { return { who: who, face: face, text: text }; }
  var N = function (t) { return L(null, null, t); };
  var M = function (face, t) { return L('mio', face, t); };
  function R(face, text, who) { return { face: face, text: text, who: who === undefined ? 'mio' : who }; }

  G.SMALL = [
    /* ---------- 天気・季節 ---------- */
    { id: 's_sunny', lines: [N('よく晴れた週末。商店街の人通りがいつもより多い。')],
      apply: function (fx) { fx.mod('visitors', 1.08, 1, '晴れの週末'); return R('smile', '天気がいいと、ふらっと寄ってくれる人が増えるね！'); } },
    { id: 's_rain', bad: true, lines: [N('雨の日が続いている。')],
      apply: function (fx) { fx.mod('visitors', 0.92, 1, '長雨'); return R('trouble', '雨だと、どうしてもお客さんが減っちゃうね…。'); } },
    { id: 's_typhoon', bad: true, months: [8, 9, 10], lines: [N('大きな台風が近づいている。')],
      choices: [
        { label: '1日お店を休む', tag: 'team', apply: function (fx) { fx.mod('visitors', 0.95, 1, '台風で1日休業'); fx.stat('shin', 2); return R('normal', 'スタッフの安全が第一。お客さんも分かってくれたよ。'); } },
        { label: 'いつもどおり開ける', tag: 'attack', apply: function (fx) { if (fx.chance(0.5)) { fx.money(-60000); return R('trouble', '看板が飛ばされて、修理に6万円…。'); } return R('normal', 'お客さんはほとんど来なかったけど、何もなくてよかった。'); } }
      ] },
    { id: 's_snow', bad: true, months: [1, 2], lines: [N('めずらしく大雪が降った。')],
      apply: function (fx) { fx.mod('visitors', 0.88, 1, '大雪'); return R('surprise', '道が真っ白！今日はお客さん、ほとんど来ないね…。'); } },
    { id: 's_heat', bad: true, months: [7, 8], lines: [N('お店のエアコンが、急に動かなくなった。')],
      choices: [
        { label: 'すぐ修理する（12万円）', tag: 'customer', apply: function (fx) { fx.money(-120000); return R('normal', '快適なお店に戻ったよ。'); } },
        { label: '扇風機でしのぐ', tag: 'defend', apply: function (fx) { fx.mod('visitors', 0.88, 1, '暑い店内'); fx.stat('shin', -2); return R('trouble', '暑すぎて、お客さんがすぐ帰っちゃう…。'); } }
      ] },
    { id: 's_festival', months: [7, 8], lines: [N('近くの神社でお祭りがある。')],
      apply: function (fx) { fx.mod('visitors', 1.1, 1, 'お祭り'); return R('smile', 'お祭り帰りの人がたくさん寄ってくれたよ！'); } },
    { id: 's_summer_students', months: [8], lines: [N('夏休みで、学生のお客さんが増えている。')],
      apply: function (fx) { fx.stat('shu', 3); return R('smile', '学生さんは口コミで広げてくれるから、ありがたいね。'); } },
    { id: 's_halloween', months: [10], cond: function (s) { return s.flags.concept !== 'gadget'; }, lines: [M('smile', 'もうすぐハロウィン！仮装に使える服のコーナー、作ってみる？')],
      choices: [
        { label: 'コーナーを作る（5万円）', tag: 'attack', apply: function (fx) { fx.money(-50000); fx.cost(0.005); fx.stat('shu', fx.s.flags.concept === 'fashion' ? 3 : 2); return R('joy', '思った以上に盛り上がってる！仮装用の安い服が多いぶん、もうけの割合は少し下がるけど。'); } },
        { label: 'ふだんの棚を整える', tag: 'defend', apply: function (fx) { fx.stat('sho', 1); return R('normal', 'うん、無理しないのも大事。そのぶん、いつもの棚を見やすくしたよ。'); } }
      ] },
    { id: 's_xmas', months: [12], lines: [N('街はクリスマスの飾りでいっぱい。')],
      apply: function (fx) { fx.mod('visitors', 1.08, 1, 'クリスマス'); return R('smile', 'プレゼント探しのお客さんがいっぱい！'); } },
    { id: 's_cleaning', months: [12], lines: [N('年末の大掃除で、いらなくなった物を売りに来る人が増えた。')],
      apply: function (fx) { fx.stat('sho', 3); return R('smile', 'いい品がたくさん集まった！品ぞろえが充実したよ。'); } },
    { id: 's_graduation', months: [3], lines: [N('卒業シーズン。家具や家電を手放す学生が多い。')],
      apply: function (fx) { fx.stat('sho', 4); return R('smile', 'まだ使える家電がたくさん！品ぞろえが一気に増えたね。'); } },
    { id: 's_newlife', months: [3, 4], lines: [N('新生活の準備で、安く物をそろえたい人が来ている。')],
      apply: function (fx) { fx.mod('visitors', 1.1, 1, '新生活の買い物'); return R('smile', '新しい生活を始める人の役に立てるの、うれしいね。'); } },
    { id: 's_moving', months: [4, 5], lines: [N('引っ越しシーズン。買い取りの依頼がたくさん来た。')],
      apply: function (fx) { fx.stat('sho', 3); return R('normal', '品ぞろえが増えたよ。値付けがんばらなきゃ！'); } },
    { id: 's_koromogae', months: [6, 10], lines: [N('衣替えの季節。服の買い取りがどっと増えた。')],
      apply: function (fx) { var f = fx.s.flags.concept === 'fashion'; fx.stat('sho', f ? 5 : 2); return R(f ? 'joy' : 'normal', f ? '古着のお店としては、最高の季節だね！' : '服がたくさん集まったよ。'); } },
    { id: 's_school_fes', months: [9, 10, 11], lines: [N('近くの高校の文化祭で、出店しないかと誘われた。')],
      choices: [
        { label: '出店する（5万円）', tag: 'customer', apply: function (fx) { fx.money(-50000); fx.mod('visitors', 0.95, 1, '文化祭でお店を1日閉めた'); fx.stat('shu', fx.s.flags.concept === 'general' ? 2 : 4); return R('joy', '若いお客さんに知ってもらえたね！準備でお店を1日閉めたぶん、今月は少しお客さんが減るけど。'); } },
        { label: '今回は断る', tag: 'defend', apply: function (fx) { fx.stat('shin', 2); return R('normal', '「いつ来ても開いてる」のは、お客さんの安心につながるよ。またの機会にしよう。'); } }
      ] },

    /* ---------- お客さん・口コミ ---------- */
    { id: 's_tv', weight: 0.6, lines: [N('地元テレビ局から、取材したいと連絡があった！')],
      apply: function (fx) { fx.stat('shu', 5); fx.mod('visitors', 1.12, 1, 'テレビで紹介'); return R('joy', 'テレビを見た人がたくさん来てくれた！'); } },
    { id: 's_review_good', cond: function (s) { return s.shin >= 50 && s.monthIdx >= 1; }, lines: [N('口コミサイトに、うれしい感想が書きこまれた。')],
      apply: function (fx) { fx.stat('shu', 4); return R('joy', '「店員さんが親切」だって！信頼が集客につながってるね。'); } },
    { id: 's_review_bad', cond: function (s) { return s.shin < 45 && s.monthIdx >= 1; }, lines: [N('口コミサイトに「値段の説明が分かりにくい」と書かれた。')],
      choices: [
        { label: 'ていねいに返信する', tag: 'customer', apply: function (fx) { fx.stat('shin', 4); fx.stat('sho', -1); return R('normal', '誠実な返信は、ほかの人も見てるよ。返信に時間をとられて、値付けは少し後回しになったけど。'); } },
        { label: '気にせず品ぞろえに集中する', tag: 'attack', apply: function (fx) { fx.stat('sho', 3); fx.stat('shu', -2); return R('normal', '品ぞろえはよくなったけど、口コミを読んだ人は少し離れちゃったかも。'); } }
      ] },
    { id: 's_yui_friends', cond: function (s) { return s.monthIdx >= 2; }, lines: [L('yui', null, 'こんにちは〜！今日は友だちも連れてきました！')],
      apply: function (fx) { fx.stat('shu', 2); fx.stat('shin', 2); return R('smile', '常連のユイちゃんが友だちを連れてきてくれた！うれしいね。'); } },
    { id: 's_yui_request', cond: function (s) { return s.monthIdx >= 2; }, lines: [L('yui', null, 'このお店に、古いカメラがあったらうれしいんだけどなぁ。')],
      choices: [
        { label: '探して仕入れてみる（5万円）', tag: 'customer', apply: function (fx) { fx.money(-50000); fx.stat('shin', 1); if (fx.chance(fx.s.flags.concept === 'gadget' ? 0.75 : 0.4)) { fx.stat('sho', 4); fx.money(80000, 'カメラが売れた'); return R('smile', 'ユイちゃん大喜び！カメラ好きのお客さんも来るようになったよ。'); } return R('trouble', 'ユイちゃんは喜んでくれたけど、ほかのカメラは売れ残っちゃった…。うちのお客さんには合わなかったみたい。'); } },
        { label: '似た品を紹介する', tag: 'defend', apply: function (fx) { fx.stat('shin', 1); return R('normal', '「こっちも素敵！」って、気に入ってもらえたよ。'); } }
      ] },
    { id: 's_yui_job', cond: function (s) { return s.staff < 2 && s.monthIdx >= 4; }, lines: [L('yui', null, 'あの…ここでアルバイトさせてもらえませんか？このお店が好きなんです！')],
      choices: [
        { label: '雇う（毎月12万円）', tag: 'team', apply: function (fx) { fx.staff(1); fx.fixed(-60000, '学生アルバイトなので給料が安い'); fx.stat('shin', 4); fx.stat('sho', 2); return R('joy', 'お店が好きな人が働いてくれるのは最強だよ！'); } },
        { label: '今は断る', tag: 'defend', apply: function () { return R('normal', '「また声をかけてください」だって。'); } }
      ] },
    { id: 's_influencer', cond: function (s) { return s.sho >= 45; }, weight: 0.7, lines: [N('有名なインフルエンサーが、お店に来ているみたい！')],
      choices: [
        { label: '声をかけて紹介をお願いする', tag: 'attack', apply: function (fx) { if (fx.chance(0.5)) { fx.stat('shu', 8); return R('joy', '紹介してもらえた！フォロワーさんがどんどん来てる！'); } fx.stat('shin', -2); return R('trouble', '「プライベートなので…」と断られちゃった。'); } },
        { label: 'そっとしておく', tag: 'customer', apply: function (fx) { if (fx.chance(0.5)) { fx.stat('shu', 4); return R('smile', '自分から投稿してくれたみたい！居心地がよかったのかな。'); } return R('normal', '楽しそうに買い物して帰っていったよ。'); } }
      ] },
    { id: 's_point_card', lines: [M('normal', 'ポイントカードを作って、また来てもらう仕組みを作ってみる？')],
      choices: [
        { label: '作る（6万円）', tag: 'customer', apply: function (fx) { fx.money(-60000); fx.stat('shin', 4); return R('smile', 'ポイントがたまるの、楽しみにしてくれてる人が多いよ。'); } },
        { label: '作らない', tag: 'defend', apply: function () { return R('normal', 'そのぶん、ほかのことにお金を使おう。'); } }
      ] },
    { id: 's_regular_big', cond: function (s) { return s.shin >= 60 && s.monthIdx >= 2; }, lines: [N('常連さんの紹介で、大口の買い取り依頼が入った。')],
      apply: function (fx) { fx.stat('sho', 5); return R('joy', '信頼があると、いい品が自然と集まってくるね！'); } },
    { id: 's_price_up_req', cond: function (s) { return s.monthIdx >= 2; }, lines: [N('「もう少し高く買い取ってくれない？」と常連さんに言われた。')],
      choices: [
        { label: '買い取り額を少し上げる', tag: 'customer', apply: function (fx) { fx.cost(0.015); fx.stat('shin', 3); fx.stat('sho', 1); return R('normal', '売りに来てくれる人が増えそう。そのぶん、もうけは少し減るけどね。'); } },
        { label: '今のままにする', tag: 'defend', apply: function () { return R('normal', '理由をちゃんと説明して、分かってもらえたよ。もうけの割合は守れたね。'); } }
      ] },
    { id: 's_long_line', bad: true, cond: function (s) { return s.staff === 0 && s.monthIdx >= 3; }, lines: [N('レジに長い列ができている。店長ひとりでは手が回らない。')],
      apply: function (fx) { fx.stat('shin', -3); return R('trouble', '待たされたお客さんが、何人か帰っちゃった…。'); } },
    { id: 's_kids', cond: function (s) { return s.flags.concept !== 'fashion'; }, lines: [N('親子連れのお客さんが、おもちゃコーナーで楽しそうに遊んでいる。')],
      apply: function (fx) { fx.stat('shin', 2); return R('smile', 'こういう光景を見ると、お店をやっててよかったって思うね。'); } },
    { id: 's_magazine', weight: 0.6, lines: [N('地域の情報誌に、お店が小さく載った。')],
      apply: function (fx) { fx.stat('shu', 3); return R('smile', '「雑誌で見ました」って人が来てくれたよ！'); } },
    { id: 's_sns_buzz', cond: function (s) { return s.sho >= 50; }, weight: 0.7, lines: [N('お客さんが投稿したお店の写真が、SNSで話題になっている！')],
      apply: function (fx) { fx.stat('shu', 7); return R('joy', '品ぞろえがいいと、お客さんが勝手に宣伝してくれるんだね！'); } },
    { id: 's_messy', cond: function (s) { return s.shin < 50 && s.monthIdx >= 1; }, lines: [N('「お店が散らかっている」とSNSに書かれてしまった。')],
      choices: [
        { label: '1日かけて大掃除する', tag: 'team', apply: function (fx) { fx.mod('visitors', 0.95, 1, '大掃除で1日休み'); fx.stat('shin', 3); return R('smile', 'ぴかぴか！見つけやすくなったって好評だよ。'); } },
        { label: '営業しながら少しずつ片づける', tag: 'defend', apply: function (fx) { fx.stat('shu', -1); fx.stat('shin', 1); return R('normal', 'お店は開けたまま。きれいになるまで、入りにくいと思う人もいるかも…。'); } }
      ] },

    /* ---------- 仕入れ・取引 ---------- */
    { id: 's_kaede_find', cond: function (s) { return s.monthIdx >= 3; }, lines: [M('normal', '仕入れ業者さんから、掘り出し物のブランドバッグを20万円でどうかって。買ってみる？')],
      choices: [
        { label: '買う（20万円）', tag: 'attack', apply: function (fx) { fx.money(-200000); var v = fx.rand(0, 1); if (v > 0.35) { fx.money(200000 + 250000 * v, '売れたお金'); fx.stat('sho', 2); return R('joy', '高く売れた！目利きが当たったね。'); } fx.money(80000, '安く手放したお金'); return R('trouble', 'なかなか売れなくて、結局8万円で手放すことに…。'); } },
        { label: '見送る', tag: 'defend', apply: function () { return R('normal', '分からないものには手を出さない。それもひとつの判断だよ。'); } }
      ] },
    { id: 's_kaede_price', bad: true, cond: function (s) { return s.monthIdx >= 3; }, lines: [M('trouble', '仕入れ業者さんから、来月から仕入れ値を少し上げさせてほしいって相談が来たよ…。')],
      choices: [
        { label: 'そのまま受け入れる', tag: 'customer', apply: function (fx) { fx.cost(0.02); fx.stat('sho', 1); return R('normal', '業者さん、ほっとしてたよ。いい品を優先して回してくれるって。'); } },
        { label: '交渉する', tag: 'attack', apply: function (fx) { if (fx.chance(0.45 + fx.s.shin / 200)) return R('smile', '「店長にはお世話になってるので」って、今のままにしてくれた！', 'mio'); fx.cost(0.03); fx.stat('sho', -2); return R('trouble', '交渉はうまくいかず、値上げされたうえに関係もぎくしゃく…。'); } }
      ] },
    { id: 's_fake', lines: [N('有名ブランドの財布を売りたい、というお客さんが来た。'), M('normal', 'ちょっと気になるな…。本物かどうか、確かめる？')],
      choices: [
        { label: 'お金を払って鑑定する（1万円）', tag: 'customer', apply: function (fx) { fx.money(-10000); fx.stat('shin', 3); return R('normal', 'やっぱり偽物だった！買い取らずに済んだよ。お客さんにも安心してもらえるね。'); } },
        { label: '見た目で判断して買い取る', tag: 'attack', apply: function (fx) { if (fx.chance(0.4)) { fx.money(-100000); fx.stat('shin', -8); return R('angry', '偽物だった！しかも売ったあとに分かって、返金と信用の両方を失っちゃった…。'); } fx.money(60000); return R('smile', '本物だった。今回は運がよかったね。'); } }
      ] },
    { id: 's_overstock', cond: function (s) { return !!s.flags.overstock; }, lines: [M('trouble', '倉庫が売れ残りの品でいっぱい…。どうしよう？')],
      choices: [
        { label: '半額セールで売り切る', tag: 'attack', apply: function (fx) { fx.flag('overstock', false); fx.money(150000 + fx.rand(0, 200000)); fx.stat('sho', -2); return R('normal', 'すっきりした！もうけは少ないけど、お金に戻せたのが大事。'); } },
        { label: '倉庫を借りて保管する', tag: 'defend', apply: function (fx) { fx.fixed(30000, '倉庫代'); return R('trouble', '毎月3万円の倉庫代がかかるけど、いつか売れるはず…。'); } }
      ] },
    { id: 's_flea', lines: [N('公園のフリーマーケットに出店しないかと誘われた。')],
      choices: [
        { label: '出店する（2万円）', tag: 'attack', apply: function (fx) { fx.money(-20000); fx.money(fx.rand(50000, 120000), 'フリマの売上'); fx.mod('visitors', fx.s.staff > 0 ? 0.98 : 0.95, 1, fx.s.staff > 0 ? 'フリマの日は人手が少なかった' : 'フリマの日はお店を閉めた'); fx.stat('shu', 3); return R('smile', '売上も出たし、お店の宣伝にもなったね！' + (fx.s.staff > 0 ? 'お店はスタッフに任せられたよ。' : 'その日はお店を閉めたけどね。')); } },
        { label: '出ない', tag: 'defend', apply: function (fx) { fx.stat('shin', 2); return R('normal', 'いつものお客さんのために、お店を開けておこう。「いつ来ても開いてる」のは安心につながるよ。'); } }
      ] },
    { id: 's_wrong_tag', bad: true, cond: function (s) { return s.staff > 0; }, lines: [N('スタッフが、高い品に安い値札を付けたまま売ってしまった。')],
      apply: function (fx) { fx.money(-50000); return R('trouble', '5万円の損…。値付けのチェック、二重にしようね。'); } },
    { id: 's_donate', lines: [N('地域の子ども食堂から、子どもたちが使える物を分けてほしいとお願いされた。')],
      choices: [
        { label: '品物を寄付する', tag: 'customer', apply: function (fx) { fx.stat('sho', -1); fx.stat('shin', 4); return R('smile', 'すごく喜ばれたよ。地域の人たちも見てくれてるね。'); } },
        { label: '今回は見送る', tag: 'defend', apply: function () { return R('normal', 'できる範囲で、いつか協力しよう。'); } }
      ] },
    { id: 's_shoutengai', lines: [N('商店街の会長から、イベントに協力してほしいと頼まれた。')],
      choices: [
        { label: '協力する（5万円）', tag: 'team', apply: function (fx) { fx.money(-50000); fx.mod('visitors', 0.95, 1, 'イベントの手伝いで1日お店を閉めた'); fx.stat('shin', 4); fx.stat('shu', 1); return R('smile', 'まわりのお店とも仲良くなれたよ！手伝いでお店を空けた日は、お客さんが少なかったけど。'); } },
        { label: '断る', tag: 'defend', apply: function (fx) { fx.stat('shin', -1); return R('normal', '少し気まずいけど、お店のことを優先しよう。'); } }
      ] },

    /* ---------- トラブル・お金 ---------- */
    { id: 's_register', bad: true, cond: function (s) { return s.monthIdx >= 3; }, lines: [N('レジが壊れてしまった！')],
      choices: [
        { label: '新しいレジを買う（15万円）', tag: 'attack', apply: function (fx) { fx.money(-150000); fx.stat('shin', 1); return R('normal', '会計がスムーズになったよ。'); } },
        { label: '修理する（5万円）', tag: 'defend', apply: function (fx) { fx.money(-50000); if (fx.chance(0.3)) { fx.stat('shu', -2); return R('trouble', 'また止まっちゃった…。お客さんを待たせちゃったよ。'); } return R('normal', '直ってよかった！'); } }
      ] },
    { id: 's_shoplift', bad: true, lines: [N('万引きの被害にあってしまった。')],
      choices: [
        { label: '防犯カメラをつける（10万円）', tag: 'defend', apply: function (fx) { fx.money(-40000, '万引きの被害'); fx.money(-100000); fx.stat('shin', 2); return R('normal', 'これで安心してお店に立てるね。'); } },
        { label: '声かけを増やす', tag: 'team', apply: function (fx) { fx.money(-40000, '万引きの被害'); if (fx.s.staff > 0) { fx.stat('shin', 2); return R('smile', 'みんなで声をかけ合ったら、お店の雰囲気もよくなったよ。'); } return R('trouble', 'ひとりだと、なかなか目が届かないね…。'); } }
      ] },
    { id: 's_electric', bad: true, lines: [N('電気代が値上がりした。')],
      apply: function (fx) { fx.fixed(20000, '電気代の値上がり'); return R('trouble', '毎月2万円、出ていくお金が増えちゃった。'); } },
    { id: 's_rent', bad: true, cond: function (s) { return s.monthIdx >= 5; }, lines: [N('大家さんから、家賃を上げたいと連絡があった。')],
      choices: [
        { label: '受け入れる', tag: 'defend', apply: function (fx) { fx.fixed(50000, '家賃の値上げ'); fx.stat('shu', 2); return R('normal', '大家さん、喜んでくれたよ。お礼に、店の前に看板を置いていいって！'); } },
        { label: '交渉する', tag: 'attack', apply: function (fx) { if (fx.chance(0.5)) { fx.fixed(20000, '家賃の値上げ'); return R('smile', '2万円の値上げにおさえてもらえた！'); } fx.fixed(50000, '家賃の値上げ'); fx.stat('shin', -3); return R('trouble', 'だめだった…。毎月5万円増えるうえに、交渉に時間をとられて、お店がおろそかになっちゃった。'); } }
      ] },
    { id: 's_roadwork', bad: true, lines: [N('お店の前で道路工事が始まった。')],
      apply: function (fx) { fx.mod('visitors', 0.9, 1, '道路工事'); return R('trouble', '入り口が分かりにくくなっちゃった…。'); } },
    { id: 's_price_rise', lines: [N('ニュース「物の値段が上がり続けています」')],
      apply: function (fx) { fx.cost(0.02); fx.stat('shu', 2); return R('normal', '仕入れ値は上がるけど、新品より安い中古を探す人は増えるね。'); } },
    { id: 's_economy_good', lines: [N('ニュース「景気がよくなっています」')],
      apply: function (fx) { fx.mod('visitors', 1.05, 1, '景気がいい'); return R('smile', 'みんなの財布のひもが少しゆるんでるみたい。'); } },
    { id: 's_economy_bad', lines: [N('ニュース「景気の先行きに不安が広がっています」')],
      apply: function (fx) { fx.stat('shu', 3); fx.stat('sho', -1); return R('normal', '節約したい人が中古を探しに来てる。リユースは景気が悪いときに強いこともあるんだ。'); } },
    { id: 's_subsidy', lines: [L('saeki', null, '店長、お店の設備に使える補助金がありましてね。申請してみませんか？')],
      choices: [
        { label: '申請する', tag: 'attack', apply: function (fx) { if (fx.chance(0.6)) { fx.money(200000); return R('joy', '補助金20万円、通ったよ！'); } fx.stat('shin', -1); return R('trouble', '書類づくりに時間をとられたのに、通らなかった…。'); } },
        { label: '今回はやめておく', tag: 'defend', apply: function () { return R('normal', 'お店のことに集中しよう。'); } }
      ] },
    { id: 's_seminar', lines: [L('saeki', null, '今度、銀行で無料の経営セミナーをやるんです。よかったらいらっしゃいませんか？')],
      choices: [
        { label: '参加する', tag: 'team', apply: function (fx) { fx.mod('visitors', 0.975, 1, 'セミナーで半日お店を空けた'); fx.stat('sho', 1); return R('smile', '値付けのコツを教わったよ。さっそく試してみよう！'); } },
        { label: 'お店に立つ', tag: 'defend', apply: function (fx) { fx.stat('shin', 2); return R('normal', 'お店を空けずに済んだね。常連さんともゆっくり話せたよ。'); } }
      ] },

    /* ---------- スタッフ ---------- */
    { id: 's_staff_award', cond: function (s) { return s.staff > 0; }, lines: [N('スタッフが、地域の「接客ロールプレイングコンテスト」で入賞した！')],
      apply: function (fx) { fx.stat('shin', 4); return R('joy', '自慢のスタッフだね！'); } },
    { id: 's_staff_sick', cond: function (s) { return s.staff > 0; }, lines: [N('スタッフが「熱っぽい」と言っている。')],
      choices: [
        { label: '休ませる', tag: 'team', apply: function (fx) { fx.mod('visitors', 0.93, 1, 'スタッフの休み'); fx.stat('shin', 2); return R('smile', '体が第一。元気になって戻ってきてくれたよ。'); } },
        { label: 'なんとか来てもらう', tag: 'attack', apply: function (fx) { fx.stat('shin', -3); return R('angry', '無理させちゃだめだよ…。お客さんにも心配されてた。'); } }
      ] },
    { id: 's_staff_pop', cond: function (s) { return s.staff > 0; }, lines: [N('スタッフが、手書きのおすすめPOPを作ってくれた。')],
      apply: function (fx) { fx.stat('sho', 3); return R('smile', 'POPを見て買っていく人が多いよ！'); } },
    { id: 's_staff_idea', cond: function (s) { return s.staff > 0; }, lines: [N('スタッフから「買い取りの受付をもっと早くしたい」と提案があった。')],
      choices: [
        { label: '任せてみる', tag: 'team', apply: function (fx) { if (fx.chance(0.25 + fx.s.shin / 200)) { fx.stat('shin', 3); fx.stat('sho', 1); return R('joy', '受付がすごく早くなった！任せてよかったね。'); } fx.stat('shin', -2); return R('trouble', '新しいやり方に慣れるまで、受付が混乱しちゃった…。'); } },
        { label: '今のやり方でいく', tag: 'defend', apply: function () { return R('normal', '慣れたやり方なら、ミスも出にくいね。'); } }
      ] },
    { id: 's_tired', cond: function (s) { return s.staff === 0 && s.monthIdx >= 5; }, lines: [M('trouble', '店長、今日もひとりで閉店まで…。たまには休もう？')],
      choices: [
        { label: '半日だけ休む', tag: 'team', apply: function (fx) { fx.mod('visitors', 0.975, 1, '店長が半日休んだ'); return R('smile', 'ちゃんと休めた？顔色がよくなったね。'); } },
        { label: '休まない', tag: 'attack', apply: function (fx) { fx.stat('shin', -2); return R('trouble', '疲れが接客に出ちゃってるよ…。'); } }
      ] },

    /* ---------- ネット・ジャンル別 ---------- */
    { id: 's_online_rush', cond: function (s) { return !!s.flags.online; }, lines: [N('ネット販売の注文が急に増えた！')],
      apply: function (fx) { fx.money(fx.rand(100000, 250000)); return R('joy', '遠くの人にも届いてる！'); } },
    { id: 's_online_trouble', bad: true, cond: function (s) { return !!s.flags.online; }, lines: [N('ネットで売った品が、配送中に傷ついてしまった。')],
      choices: [
        { label: '送料を返して、あやまる', tag: 'customer', apply: function (fx) { fx.money(-20000); fx.stat('shin', 2); return R('normal', 'ていねいな対応が、いい評価につながったよ。'); } },
        { label: '配送会社に補償を頼む', tag: 'defend', apply: function (fx) { fx.money(15000, '配送会社の補償'); fx.stat('shin', -3); return R('trouble', '「お店の対応が悪い」って評価がついちゃった…。'); } }
      ] },
    { id: 's_game_release', months: [11, 12], lines: [N('新しいゲーム機が発売された。古いゲーム機を売りに来る人が増えている。')],
      apply: function (fx) { var g = fx.s.flags.concept === 'gadget'; fx.stat('sho', g ? 5 : 1); fx.stat('shu', g ? 3 : 0); return R(g ? 'joy' : 'normal', g ? 'ゲームのお店としては、大チャンスだね！' : '少しだけ品ぞろえが増えたよ。'); } },
    { id: 's_vintage', cond: function (s) { return s.flags.concept === 'fashion' && s.monthIdx >= 1; }, lines: [N('古着好きの間で、昔のジャージがブームになっている。')],
      apply: function (fx) { fx.stat('shu', 4); return R('joy', 'うちの得意分野！ブームに乗れたね。'); } },
    { id: 's_repair', cond: function (s) { return s.flags.concept === 'gadget'; }, lines: [M('normal', '家電の動作チェックを、もっとしっかりやる？専用の道具が必要だけど。')],
      choices: [
        { label: '道具をそろえる（8万円）', tag: 'customer', apply: function (fx) { fx.money(-80000); fx.stat('shin', 5); return R('smile', '「ちゃんと動く中古」は、それだけで選ばれる理由になるよ。'); } },
        { label: '今のままでいく', tag: 'defend', apply: function () { return R('normal', '気をつけてチェックしよう。'); } }
      ] },
    { id: 's_general_onestop', cond: function (s) { return s.flags.concept === 'general' && s.monthIdx >= 1; }, lines: [N('引っ越してきた家族が、家具も服も家電も、まとめて買っていった。')],
      apply: function (fx) { fx.stat('shu', 3); fx.money(80000); return R('joy', '「ここに来れば全部そろう」って喜んでくれたよ。何でも屋の強みだね！'); } },
    { id: 's_gadget_retro', cond: function (s) { return s.flags.concept === 'gadget' && s.monthIdx >= 2; }, lines: [N('昔のゲームソフトが、SNSで再び人気になっている。')],
      apply: function (fx) { fx.stat('shu', 4); fx.stat('sho', 2); return R('joy', 'うちの棚にいっぱいあるやつだ！ゲームのお店で正解だったね。'); } },
    { id: 's_general_lost', bad: true, cond: function (s) { return s.flags.concept === 'general'; }, lines: [N('「結局、何のお店なの？」とお客さんに聞かれた。')],
      apply: function (fx) { fx.stat('sho', -2); return R('trouble', '何でもあるのは便利だけど、印象に残りにくいんだね…。'); } },

    /* ---------- ほっこり ---------- */
    { id: 's_mio_snack', lines: [M('smile', '店長、おつかれさま！差し入れのたい焼き、どうぞ。')],
      apply: function (fx) { fx.stat('shin', 1); return R('smile', 'たまには一息つこうね。', 'mio'); } },
    { id: 's_thanks_letter', cond: function (s) { return s.shin >= 55; }, lines: [N('お客さんから、手書きのお礼の手紙が届いた。')],
      apply: function (fx) { fx.stat('shin', 2); return R('joy', '「おばあちゃんが大事にしていた物を、次の人に渡せてうれしかった」だって。'); } },
    { id: 's_old_customer', lines: [N('おじいさんが、昔集めていたレコードを持ってきた。')],
      choices: [
        { label: 'じっくり話を聞いて買い取る', tag: 'customer', apply: function (fx) { fx.mod('visitors', 0.97, 1, '長い査定でレジ待ち'); fx.stat('shin', 3); fx.stat('sho', 2); return R('smile', '思い出話をたくさん聞かせてくれたよ。そのあいだ、レジは少し待たせちゃったけど。'); } },
        { label: '手早く査定する', tag: 'attack', apply: function (fx) { fx.stat('sho', 2); return R('normal', 'スムーズに買い取れたよ。'); } }
      ] }
  ];
})(GAME);

if (typeof module !== 'undefined') module.exports = GAME;
