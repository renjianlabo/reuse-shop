/* 毎月の大きな出来事（12か月＋1月の別パターン） */
var GAME = (typeof GAME !== 'undefined') ? GAME : {};

(function (G) {
  'use strict';

  G.man = function (n) {
    var sign = n < 0 ? '−' : '';
    var a = Math.abs(n);
    if (a >= 10000) {
      var v = Math.round(a / 1000) / 10;
      var s = v % 1 === 0 ? v.toLocaleString('ja-JP') : v.toLocaleString('ja-JP', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
      return sign + s + '万円';
    }
    return sign + a.toLocaleString('ja-JP') + '円';
  };
  var man = G.man;

  // 11月の借り入れ：お店の信頼で金利が変わる（4か月分の利息の割合）
  G.loanRate = function (s) { return s.shin >= 70 ? 0.03 : (s.shin >= 50 ? 0.08 : 0.15); };
  // ネット販売の毎月のもうけの見込み（売上 − 仕入れ − 発送の手伝い）
  G.onlineEstimate = function (s, lv) {
    var base = lv === 2 ? 200000 + s.sho * 7000 : 60000 + s.sho * 2500, m = 1 - s.costRate, fee = lv === 2 ? 60000 : 0;
    var lo = lv === 2 ? 0.6 : 0.85, hi = lv === 2 ? 1.4 : 1.15;
    var r = function (x) { return Math.round(x / 10000) * 10000; };
    return { lo: r(base * lo * m - fee), hi: r(base * hi * m - fee) };
  };

  // 6月のまとめ仕入れ：商品力とお店の種類で決まる「売れる割合」の目安
  function bulkRate(s) { return -0.1 + s.sho / 90 + (s.flags.concept === 'fashion' || s.flags.concept === 'gadget' ? 0.08 : 0); }

  // 1月に辞めたいと言うのはだれか（ユイしかいなければユイ）
  function quitter(s) { return s.flags.yui && s.staff === 1 ? 'yui' : 'other'; }
  function leave(fx) { if (quitter(fx.s) === 'yui') fx.flag('yui', false); fx.staff(-1); }

  function L(who, face, text) { return { who: who, face: face, text: text }; }
  var N = function (t) { return L(null, null, t); };
  var M = function (face, t) { return L('mio', face, t); };

  G.BIG = [
    /* ---------------- 4月 ---------------- */
    {
      id: 'm4', month: 4, bg: 'shop', title: 'どんな店にする？', memo: 'diff',
      lines: [
        M('smile', 'さあ、開店準備もいよいよ大詰め！'),
        M('normal', '最初に決めたいのは「どんなお店にするか」。ここが全部の土台になるよ。')
      ],
      hint: function () { return '迷ったら「誰に来てほしいか」で考えるといいよ。'; },
      choices: [
        {
          label: '何でも扱うお店', tag: 'attack',
          apply: function (fx) {
            fx.stat('shu', 9); fx.stat('sho', 4); fx.flag('concept', 'general');
            return { face: 'normal', text: 'いろんな人が来てくれそう！ただ「これならあの店」と言われにくいのが弱点かな。' };
          }
        },
        {
          label: '古着にしぼったお店', tag: 'customer',
          apply: function (fx) {
            fx.stat('sho', 7); fx.stat('shu', -3); fx.flag('concept', 'fashion');
            return { face: 'smile', text: '服好きの人にはたまらないお店になりそう！最初は入りにくいと思う人もいるかもね。' };
          }
        },
        {
          label: 'ゲーム・家電にしぼったお店', tag: 'attack',
          apply: function (fx) {
            fx.stat('sho', 6); fx.stat('shu', 3); fx.cost(0.03); fx.flag('concept', 'gadget');
            return { face: 'normal', text: '人気のジャンルだね。ただ、家電は仕入れ値が高めだし、故障には気をつけないと。' };
          }
        }
      ]
    },

    /* ---------------- 5月 ---------------- */
    {
      id: 'm5', month: 5, bg: 'shop', title: '値段をどうつける？', memo: 'arari',
      lines: [
        M('normal', '買い取った品に値段をつけていこう。'),
        M('normal', '高くすれば1つ売れたときのもうけは大きい。安くすればたくさん売れる。どっちを取る？')
      ],
      hint: function (s) {
        return s.sho >= 50 ? '品ぞろえには自信があるし、少し高めでも売れるかも。' : 'まだ品ぞろえが弱いから、高くすると手に取ってもらえないかも…';
      },
      choices: [
        {
          label: '少し高めにする', tag: 'attack',
          apply: function (fx) {
            fx.cost(-0.06); fx.stat('shu', -4);
            if (fx.s.sho >= 50) return { face: 'smile', text: '品ぞろえがいいから、高めでもちゃんと売れてる！1つあたりのもうけが増えたね。' };
            fx.stat('shin', -4);
            return { face: 'trouble', text: '「ちょっと高くない？」って声が聞こえる…。もうけは増えたけど、お客さんの目は厳しいね。' };
          }
        },
        {
          label: '相場どおりにする', tag: 'defend',
          apply: function (fx) {
            fx.stat('shin', 3);
            return { face: 'normal', text: '「ちょうどいい値段」は安心感につながるよ。地味だけど大事！' };
          }
        },
        {
          label: '安めにして数で売る', tag: 'customer',
          apply: function (fx) {
            fx.cost(0.08); fx.stat('shu', 8); fx.stat('shin', 2);
            return { face: 'smile', text: 'お客さんは喜んでる！でも1つ売れたときのもうけは小さくなったから、たくさん売らないとね。' };
          }
        }
      ]
    },

    /* ---------------- 6月 ---------------- */
    {
      id: 'm6', month: 6, bg: 'shop', title: '大量に仕入れられる話', memo: 'zaiko',
      cond: function (s) { return s.flags.concept !== 'gadget'; },
      lines: [
        M('normal', 'さっき仕入れ業者さんから連絡があってね。人気ブランドの服がまとめて手に入ったんだって。'),
        M('normal', '全部で150万円。半分だけでも買えるみたい。うちで売り切れるかどうか、だね…。')
      ],
      hint: function (s) {
        var r = bulkRate(s);
        if (r >= 0.75) return 'うちの品ぞろえなら、けっこう売れそう！勝負してもいいかも。';
        if (r >= 0.55) return '売れなくはないと思う。でも全部だと、外れたときが怖いかな…';
        return '正直、うちのお店だと売れ残りが心配…';
      },
      choices: [
        {
          label: '全部買う（150万円）', tag: 'attack',
          apply: function (fx) {
            var s = fx.s;
            fx.money(-1500000);
            var rate = Math.max(0.05, Math.min(1.0, bulkRate(s) + fx.rand(-0.30, 0.30)));
            fx.extra('まとめ仕入れの服', 1500000 * 1.5 * rate / 3, 3);
            fx.stat('sho', 5);
            if (rate < 0.55) {
              fx.flag('overstock', true);
              return { face: 'trouble', text: 'うーん、思ったより売れ残りそう…。倉庫が服でいっぱいだよ。' };
            }
            return { face: 'joy', text: 'よく売れてる！これから3か月、この服の売上が入ってくるよ。' };
          }
        },
        {
          label: '半分だけ買う（75万円）', tag: 'defend',
          apply: function (fx) {
            var s = fx.s;
            fx.money(-750000);
            var rate = Math.max(0.05, Math.min(0.98, bulkRate(s) + 0.10 + fx.rand(-0.10, 0.10)));
            fx.extra('まとめ仕入れの服', 750000 * 1.5 * rate / 3, 3);
            fx.stat('sho', 3);
            if (rate < 0.5) {
              fx.flag('overstock', true);
              return { face: 'trouble', text: '半分にしておいてよかった…。それでも少し売れ残りそう。' };
            }
            return { face: 'smile', text: 'ちょうどいい量だったみたい。無理しない判断、いいね。' };
          }
        },
        {
          label: '今回は断る', tag: 'defend',
          apply: function () {
            return { face: 'normal', text: '慎重だね。チャンスは見送ったけど、お金はしっかり守れたよ。' };
          }
        }
      ]
    },

    /* ---------------- 6月（ゲーム・家電のお店） ---------------- */
    {
      id: 'm6g', month: 6, bg: 'shop', title: '大量に仕入れられる話', memo: 'zaiko',
      cond: function (s) { return s.flags.concept === 'gadget'; },
      lines: [
        M('normal', 'さっき仕入れ業者さんから連絡があってね。中古のゲーム機と家電が、まとめて手に入ったんだって。'),
        M('normal', '全部で150万円。半分だけでも買えるみたい。うちで売り切れるかどうか、だね…。')
      ],
      hint: function (s) {
        var r = bulkRate(s);
        if (r >= 0.75) return 'うちの品ぞろえなら、けっこう売れそう！勝負してもいいかも。';
        if (r >= 0.55) return '売れなくはないと思う。でも全部だと、外れたときが怖いかな…';
        return '正直、うちのお店だと売れ残りが心配…';
      },
      choices: [
        {
          label: '全部買う（150万円）', tag: 'attack',
          apply: function (fx) {
            var s = fx.s;
            fx.money(-1500000);
            var rate = Math.max(0.05, Math.min(1.0, bulkRate(s) + fx.rand(-0.30, 0.30)));
            fx.extra('まとめ仕入れのゲーム機・家電', 1500000 * 1.5 * rate / 3, 3);
            fx.stat('sho', 5);
            if (rate < 0.55) {
              fx.flag('overstock', true);
              return { face: 'trouble', text: 'うーん、思ったより売れ残りそう…。倉庫が箱でいっぱいだよ。' };
            }
            return { face: 'joy', text: 'よく売れてる！これから3か月、ゲーム機と家電の売上が入ってくるよ。' };
          }
        },
        {
          label: '半分だけ買う（75万円）', tag: 'defend',
          apply: function (fx) {
            var s = fx.s;
            fx.money(-750000);
            var rate = Math.max(0.05, Math.min(0.98, bulkRate(s) + 0.10 + fx.rand(-0.10, 0.10)));
            fx.extra('まとめ仕入れのゲーム機・家電', 750000 * 1.5 * rate / 3, 3);
            fx.stat('sho', 3);
            if (rate < 0.5) {
              fx.flag('overstock', true);
              return { face: 'trouble', text: '半分にしておいてよかった…。それでも少し売れ残りそう。' };
            }
            return { face: 'smile', text: 'ちょうどいい量だったみたい。無理しない判断、いいね。' };
          }
        },
        {
          label: '今回は断る', tag: 'defend',
          apply: function () {
            return { face: 'normal', text: '慎重だね。チャンスは見送ったけど、お金はしっかり守れたよ。' };
          }
        }
      ]
    },

    /* ---------------- 7月 ---------------- */
    {
      id: 'm7', month: 7, bg: 'shop', title: 'アルバイトを雇う？', memo: 'kotei',
      lines: [
        M('normal', 'お店も少し忙しくなってきたね。'),
        M('normal', 'アルバイトを雇えば、対応できるお客さんの数が増える。でも、売れても売れなくても、毎月お給料が出ていくよ。1人あたり月18万円。')
      ],
      hint: function (s) {
        var lost = s.history.reduce(function (a, h) { return a + (h.lost || 0); }, 0);
        if (lost > 0) return 'これまでに' + lost + '人、対応しきれずに帰ったお客さんがいたよ。人手が足りてないのかも。';
        return 'まだ店長ひとりで回せてるね。ひとりで対応できるのは、月' + G.capacity(s) + '人くらいまでかな。';
      },
      choices: [
        {
          label: '2人雇う', tag: 'team',
          apply: function (fx) {
            fx.staff(2); fx.stat('shin', 6); fx.stat('sho', 3);
            return { face: 'joy', text: 'にぎやかになった！接客も値付けも丁寧にできるね。そのぶん、毎月36万円かかるよ。' };
          }
        },
        {
          label: '1人だけ雇う', tag: 'team',
          apply: function (fx) {
            fx.staff(1); fx.stat('shin', 3); fx.stat('sho', 1);
            return { face: 'smile', text: 'ひとりいるだけで、ずいぶん助かるね。' };
          }
        },
        {
          label: '雇わない', tag: 'defend',
          apply: function (fx) {
            fx.stat('shin', -4);
            return { face: 'trouble', text: 'お金はかからないけど…ひとりで回せる？レジ待ちの列が心配だな。' };
          }
        }
      ]
    },

    /* ---------------- 8月 ---------------- */
    {
      id: 'm8', month: 8, bg: 'shop', title: '広告の営業が来た', memo: 'roi',
      lines: function (s) {
        var a = [
          N('広告会社のレナさんがやってきた。'),
          L('rena', null, 'はじめまして、広告会社のレナと申します。駅前の大きな看板、今でしたら80万円でお出しできます。'),
          L('rena', null, 'もう少しお手軽なものでしたら、SNS広告を20万円でご用意しております。')
        ];
        if (s.flags.overstock) a.push(M('trouble', '倉庫の在庫も、早くさばきたいところだけど…。'));
        return a;
      },
      hint: function (s) {
        return s.shin >= 55 ? '今のお店なら、一度来た人がまた来てくれそう。広告が生きるかも。' : 'まだ信頼が低いから、一度来ても次につながるかな…';
      },
      choices: [
        {
          label: '駅前の看板（80万円）', tag: 'attack',
          apply: function (fx) {
            var s = fx.s;
            fx.money(-800000);
            var boost = 0.12 + s.shin / 250;
            fx.mod('visitors', 1 + boost, 2, '看板広告');
            fx.stat('shu', Math.round(s.shin / 12));
            if (s.flags.overstock && boost > 0.3) { fx.flag('overstock', false); fx.money(250000, '在庫が売れる'); }
            if (s.shin >= 55) return { face: 'joy', text: '看板を見た人がどんどん来てる！しかもまた来てくれる人も多いみたい。' };
            return { face: 'normal', text: 'お客さんは増えたけど、一度きりの人が多いみたい。信頼がもっとあれば…。' };
          }
        },
        {
          label: 'SNS広告（20万円）', tag: 'customer',
          apply: function (fx) {
            fx.money(-200000);
            fx.mod('visitors', 1.1, 1, 'SNS広告');
            fx.stat('shu', 2 + Math.round(fx.rand(0, 3)) + (fx.s.sho >= 55 ? 2 : 0));
            return { face: 'smile', text: '手ごろな値段で、ちゃんと見てもらえたみたい。品ぞろえがいいと、写真映えもするね。' };
          }
        },
        {
          label: '広告は出さない', tag: 'defend',
          apply: function () {
            return { face: 'normal', text: 'お金は使わずに済んだね。今いるお客さんを大事にしていこう。' };
          }
        }
      ]
    },

    /* ---------------- 9月 ---------------- */
    {
      id: 'm9', month: 9, bg: 'shop', title: '大型チェーン店がやってきた', memo: 'kakaku',
      lines: [
        N('となり町に、大型リユースチェーンの新しいお店がオープンした。'),
        M('surprise', 'お客さん、あっちに流れちゃってる…！'),
        M('normal', 'このままだとじり貧だよ。どう戦う？')
      ],
      base: function (fx) { fx.stat('shu', -8); },
      baseText: 'チェーン店にお客さんが流れて、集客力が下がった。',
      hint: function (s) {
        return s.flags.concept === 'general' ? '向こうも「何でも屋」。同じ土俵で戦うと苦しいかも…' : 'うちには得意分野がある。そこは負けないはず！';
      },
      choices: [
        {
          label: '値下げで勝負する', tag: 'attack',
          apply: function (fx) {
            fx.cost(0.03); fx.stat('shu', 10); fx.stat('shin', 2);
            if (fx.s.flags.concept === 'general') fx.stat('sho', -3);
            return { face: 'trouble', text: 'お客さんは戻ってきた。でも、安さでは向こうも負けてないし、うちのもうけが減っちゃう…。' };
          }
        },
        {
          label: '得意分野にしぼって勝負', tag: 'customer',
          apply: function (fx) {
            if (fx.s.flags.concept !== 'general') {
              fx.stat('sho', 8); fx.stat('shin', 4);
              return { face: 'smile', text: 'うちにしかない品ぞろえで勝負！ファンのお客さんは離れないね。' };
            }
            fx.stat('sho', 5); fx.stat('shu', -3); fx.flag('concept', 'fashion');
            return { face: 'normal', text: '何でも屋から、古着のお店に方向転換。最初はお客さんが減るけど、ここからが勝負！' };
          }
        },
        {
          label: 'SNSで毎日発信する', tag: 'attack',
          apply: function (fx) {
            var g = Math.round(fx.s.sho / 8 + fx.rand(-2, 3));
            fx.stat('shu', g); fx.stat('shin', 2);
            if (g >= 7) return { face: 'joy', text: '投稿が話題になってる！品ぞろえがいいと、写真だけで人が来てくれるね。' };
            return { face: 'normal', text: '少しずつ見てもらえてる。もっと「載せたくなる品」があれば、広がりそう。' };
          }
        }
      ]
    },

    /* ---------------- 10月 ---------------- */
    {
      id: 'm10', month: 2, bg: 'shop', title: '壊れた品を売ってしまった', memo: 'manzoku',
      lines: function (s) {
        var said = s.flags.concept === 'gadget' ? '先週買ったゲーム機が、もう壊れたんですけど！'
          : (s.flags.concept === 'fashion' ? '先週買ったコート、1回着ただけで縫い目がほつれたんですけど！' : '先週買った電気ポットが、もう壊れたんですけど！');
        return [
          N('お客さんから電話がかかってきた。'),
          N('「' + said + '」'),
          M('trouble', 'うちのチェックが甘かったみたい…。どう対応する？')
        ];
      },
      hint: function (s) {
        return s.shin >= 60 ? 'うちは信頼があるから、少しの対応でも分かってもらえそう。' : '今は信頼が低いから、対応を間違えると口コミが怖いよ。';
      },
      choices: [
        {
          label: '全額返金して、直接あやまる', tag: 'customer',
          apply: function (fx) {
            fx.money(fx.s.flags.concept === 'gadget' ? -100000 : -60000);
            fx.stat('shin', 7);
            return { face: 'smile', text: '「こんなに丁寧に対応してくれるなんて」って、むしろファンになってくれたみたい！' };
          }
        },
        {
          label: '一部だけ返金する', tag: 'defend',
          apply: function (fx) {
            fx.money(fx.s.flags.concept === 'gadget' ? -30000 : -8000);
            if (fx.chance(fx.s.shin / 100 + 0.25)) {
              fx.stat('shin', 1);
              return { face: 'normal', text: '分かってもらえた。日ごろの信頼があってよかったね。' };
            }
            fx.stat('shin', -6);
            return { face: 'trouble', text: '「対応が冷たい」って口コミに書かれちゃった…。' };
          }
        },
        {
          label: '決まりなので返金しない', tag: 'defend',
          apply: function (fx) {
            fx.stat('shin', fx.s.flags.concept === 'gadget' ? -15 : -12);
            fx.mod('visitors', 0.9, 2, '悪い口コミ');
            return { face: 'angry', text: '口コミで広まっちゃった…。お金は守れたけど、失ったものは大きいよ。' };
          }
        }
      ]
    },

    /* ---------------- 11月 ---------------- */
    {
      id: 'm11', month: 11, bg: 'office', title: '黒字なのにお金が足りない', titleMinus: 'お金が足りない！', memo: 'shikin',
      lines: function (s) {
        // 先月のレシートが赤字なら「もうかっているのに」とは言わない
        var last = s.history[s.history.length - 1];
        var plus = !last || last.profit >= 0;
        return [
          M('surprise', '店長、大変！' + ({ fashion: '冬物の仕入れ代', gadget: '年末商戦に向けたゲーム機の仕入れ代' }[s.flags.concept] || '冬物と暖房器具の仕入れ代') + 'と空調の修理代で、来週までに100万円払わないといけないの。'),
          plus ? M('trouble', 'お店はもうかっているのに、売上が入ってくるのは来月。手元のお金がギリギリかも…。')
            : M('trouble', '先月は赤字で、手元のお金も減ってきてる。今月の売上が入るのは来月だし、このままだと払えないかも…。'),
          N('（今の手元のお金：' + man(s.money) + '）')
        ];
      },
      hint: function (s) {
        if (s.money < 1000000) return 'このまま払うと、お金が足りなくてお店がつぶれちゃう！';
        return s.shin >= 60 ? '取引先とも仲がいいし、待ってもらえる可能性はありそう。' : '払えなくはないけど、そのあとの月が苦しくなりそう。';
      },
      choices: [
        {
          label: '銀行でお金を借りる', tag: 'defend',
          apply: function (fx) {
            var r = G.loanRate(fx.s);
            fx.note('100万円を借りて支払う', null);
            var interest = fx.loan('銀行の返済', 1000000, 4, r);
            fx.note('利息 ' + man(interest), false);
            var why = r <= 0.03 ? 'お店の評判もいいので、低い金利でお貸しできます。' : (r <= 0.08 ? '実績はこれからですので、金利はふつうになります。' : 'まだ信頼の実績が少ないので、金利は高めになってしまいます。');
            return { who: 'saeki', text: '銀行の佐伯です。100万円、お貸ししましょう。' + why + '4か月で返していただく形でいかがですか。' };
          }
        },
        {
          label: 'セールをして現金を作る', tag: 'attack',
          apply: function (fx) {
            var cash = (450000 + fx.s.sho * 6000) * fx.rand(0.8, 1.2);
            fx.money(cash, 'セールの売上');
            fx.money(-1000000, '支払い');
            fx.stat('sho', -4);
            return { face: 'normal', text: 'セールで' + man(Math.round(cash / 1000) * 1000) + 'の現金ができた！でも「安売りの店」と思われちゃったかも。' };
          }
        },
        {
          label: '支払いを待ってもらう', tag: 'customer',
          apply: function (fx) {
            if (fx.chance(0.25 + fx.s.shin / 150)) {
              fx.due('待ってもらった支払い', 1000000, 1);
              fx.note('利息なし・値引きなし', true);
              fx.stat('shin', -2);
              return { face: 'smile', text: '1か月だけ待ってもらえた！そのかわり、来月はちゃんと払わないとね。' };
            }
            fx.money(-1000000, '支払い');
            fx.stat('shin', -5);
            return { face: 'trouble', text: '「それはできません」…。結局すぐ払うことに。取引先の信頼も少し下がっちゃった。' };
          }
        }
      ]
    },

    /* ---------------- 12月 ---------------- */
    {
      id: 'm12', month: 12, bg: 'shop', title: '年末セール', memo: 'tanka',
      lines: [
        M('smile', '12月は1年でいちばん売れる時期！'),
        M('normal', '年末セールのやり方を決めよう。')
      ],
      hint: function (s) {
        return s.sho >= 50 ? '品ぞろえがいいから、福袋の中身もいいものにできそう。' : '福袋は中身が大事。今の品ぞろえだとちょっと不安かも。';
      },
      choices: [
        {
          label: '全品20%引きの大セール', tag: 'attack',
          apply: function (fx) {
            fx.mod('visitors', 1.5, 1, '大セール');
            fx.mod('unit', 0.88, 1, '値引きで1人あたりの金額が下がった');
            fx.mod('cost', 0.06, 1, '大きな値引き');
            fx.stat('sho', -2); fx.stat('shu', 6);
            return { face: 'surprise', text: 'お客さんがすごい数！初めて来てくれた人も多いよ。…でも値引きのぶん1人あたりの金額が下がって、思ったほど売上は伸びないかも。' };
          }
        },
        {
          label: 'いつもどおりの値段で', tag: 'defend',
          apply: function (fx) {
            fx.stat('shin', 2);
            return { face: 'normal', text: '年末はもともとお客さんが多いから、無理に値引きしないのもひとつの手だね。' };
          }
        },
        {
          label: '福袋をつくる', tag: 'customer',
          apply: function (fx) {
            fx.flag('overstock', false);
            if (fx.chance(Math.max(0.1, Math.min(0.9, (fx.s.sho - 35) / 35)))) {
              fx.mod('visitors', 1.3, 1, '福袋');
              fx.mod('unit', 1.15, 1, '福袋でまとめ買い');
              fx.stat('shu', 5); fx.stat('shin', 3);
              return { face: 'joy', text: '福袋が大人気！まとめて買ってもらえるから、1人あたりの金額も上がったよ。' };
            }
            fx.mod('visitors', 1.15, 1, '福袋');
            fx.stat('shin', -4);
            return { face: 'trouble', text: '売れたけど、「中身がイマイチ」って口コミが…。在庫は片づいたけどね。' };
          }
        }
      ]
    },

    /* ---------------- 1月（スタッフがいる） ---------------- */
    {
      id: 'm1', month: 1, bg: 'shop', title: 'スタッフが辞めたい', memo: 'hito',
      cond: function (s) { return s.staff > 0; },
      lines: function (s) {
        // ユイだけが働いているなら、辞めたいのはユイ
        var who = quitter(s) === 'yui' ? 'アルバイトのユイちゃん' : 'アルバイトのアオイさん';
        return [
          N(who + 'が、思いつめた顔でやってきた。'),
          M('trouble', '辞めたいんだって…。「仕事がきついのに、お給料が上がらないから」って。')
        ];
      },
      hint: function (s) {
        return s.shin >= 55 ? 'お店の雰囲気はいいから、話せば分かってくれるかも。' : '最近お店もバタバタしてたし、不満がたまってたのかも…';
      },
      choices: [
        {
          label: 'お給料を上げる', tag: 'team',
          apply: function (fx) {
            fx.fixed(30000 * fx.s.staff, 'スタッフの昇給');
            fx.stat('shin', 3); fx.stat('sho', 2);
            return { face: 'smile', text: '「がんばりを見てくれてたんですね」って、うれしそうだった。毎月の支払いは増えたけどね。' };
          }
        },
        {
          label: '話を聞いて、仕事を変える', tag: 'team',
          apply: function (fx) {
            if (fx.chance(0.45 + fx.s.shin / 200)) {
              fx.stat('sho', 6); fx.stat('shin', 3);
              return { face: 'joy', text: '「仕入れの仕事、やってみたいです！」得意なことを任せたら、やる気が戻ったみたい！' };
            }
            leave(fx); fx.stat('shin', -3);
            return { face: 'trouble', text: '話は聞けたけど、気持ちは変わらなかった…。' + (fx.s.staff === 0 ? 'また店長ひとりに戻っちゃった。' : '') };
          }
        },
        {
          label: '引き止めない', tag: 'defend',
          apply: function (fx) {
            leave(fx); fx.stat('shin', -6); fx.stat('sho', -2);
            return { face: 'trouble', text: fx.s.staff === 0 ? 'お給料のぶんは浮いたけど、店長ひとりに戻って、仕事が一気に増えちゃった…。' : 'お給料のぶんは浮いたけど、残ったメンバーの仕事が増えちゃった…。' };
          }
        }
      ]
    },

    /* ---------------- 1月（スタッフがいない） ---------------- */
    {
      id: 'm1b', month: 1, bg: 'shop', title: 'ひとりで限界？', memo: 'hito',
      cond: function (s) { return s.staff === 0; },
      lines: [
        M('trouble', '店長、最近ずっとひとりでお店に立ってるよね。'),
        M('trouble', '顔色が悪いよ…。このままだと倒れちゃう。')
      ],
      hint: function () { return 'お店を回しているのは「人」。店長も、そのひとりだよ。'; },
      choices: [
        {
          label: '今から1人雇う', tag: 'team',
          apply: function (fx) {
            fx.staff(1); fx.stat('shin', 3);
            return { face: 'smile', text: 'やっと休める日ができたね。お店の雰囲気も明るくなったよ。' };
          }
        },
        {
          label: '定休日を増やす', tag: 'defend',
          apply: function (fx) {
            fx.mod('visitors', 0.92, 3, '定休日を増やした');
            fx.stat('shin', 1);
            return { face: 'normal', text: 'お店を開ける日は減るけど、体がいちばん大事だよ。' };
          }
        },
        {
          label: 'このままがんばる', tag: 'attack',
          apply: function (fx) {
            if (fx.chance(0.5)) {
              fx.mod('visitors', 0.6, 1, '店長がダウン');
              fx.stat('shin', -4);
              return { face: 'surprise', text: 'ついに倒れちゃった…！今月はほとんどお店を開けられなかったよ。' };
            }
            fx.stat('shu', 1);
            return { face: 'trouble', text: 'なんとか乗りきった！…でも、無理はしないでね。' };
          }
        }
      ]
    },

    /* ---------------- 2月 ---------------- */
    {
      id: 'm2', month: 10, bg: 'shop', title: 'ネット販売を始める？', memo: 'hanro',
      lines: [
        M('normal', 'お店に来られない遠くの人にも売れたら、もっと広がるよね。'),
        M('normal', 'ネットでの販売、始めてみる？写真をとったり、梱包したり、手間とお金はかかるけど。'),
        M('normal', '本格的にやるなら売上は大きいけど、発送作業でお店の手がとられるし、トラブルも増えるよ。')
      ],
      hint: function (s) {
        return s.sho >= 55 ? 'うちの品ぞろえなら、ネットでも目立てそう！' : 'ネットはライバルがすごく多いから、品ぞろえが弱いと埋もれちゃうかも。';
      },
      choices: [
        {
          label: '本格的に始める（50万円）', tag: 'attack',
          apply: function (fx) {
            var e = G.onlineEstimate(fx.s, 2);
            fx.money(-500000); fx.flag('online', 2); fx.flag('onlineFrom', fx.s.monthIdx + 1); fx.stat('shu', 3);
            fx.note('ネットのもうけ 来月から毎月 約+' + man(e.lo) + '〜+' + man(e.hi), true);
            fx.note('発送の手伝い 来月から毎月6万円', false);
            fx.note('発送作業で対応できるお客 −150人', false);
            fx.note('配送トラブルが起きやすい', false);
            return { face: 'smile', text: '撮影の道具も発送の準備もばっちり！来月からネットの売上が入ってくるよ。そのぶん、お店の手は少し回りにくくなるけどね。' };
          }
        },
        {
          label: '少しだけ試す（10万円）', tag: 'defend',
          apply: function (fx) {
            var e = G.onlineEstimate(fx.s, 1);
            fx.money(-100000); fx.flag('online', 1); fx.flag('onlineFrom', fx.s.monthIdx + 1);
            fx.note('ネットのもうけ 来月から毎月 約+' + man(e.lo) + '〜+' + man(e.hi), true);
            return { face: 'normal', text: 'まずは小さく試して、手ごたえを見てみよう。お店の仕事にもほとんど影響しないよ。' };
          }
        },
        {
          label: '今はお店に集中する', tag: 'defend',
          apply: function (fx) {
            fx.stat('shin', 2);
            return { face: 'normal', text: 'まずはお店をしっかりさせるのも、大事な判断だね。目の前のお客さんにじっくり向き合えるよ。' };
          }
        }
      ]
    },

    /* ---------------- 3月 ---------------- */
    {
      id: 'm3', month: 3, bg: 'office', title: '2号店の話', memo: 'toushi',
      lines: [
        N('銀行の佐伯さんがやってきた。'),
        L('saeki', null, '店長、駅の近くに空き店舗が出ましてね。2号店、出してみませんか？出すには300万円かかります。'),
        M('normal', '大きな勝負だね…。うちのお店の力しだい、かな。')
      ],
      hint: function (s) {
        var avg = (s.shu + s.sho + s.shin) / 3;
        if (avg >= 65) return 'お客さんも品ぞろえも信頼もそろってる。今ならいけるかも！';
        if (avg >= 50) return 'いい線いってるけど、少し不安もあるかな。';
        return '正直、今はまだ早い気がする…。';
      },
      choices: [
        {
          label: '銀行から借りて出す', tag: 'attack',
          apply: function (fx) {
            var s = fx.s;
            var avg = (s.shu + s.sho + s.shin) / 3;
            var p = Math.max(0.05, Math.min(0.9, (avg - 30) / 45));
            if (fx.chance(p)) {
              fx.flag('branch', 'ok'); fx.money(500000, '2号店のもうけ'); fx.note('2号店が成功', true);
              return { face: 'joy', text: '2号店、大成功！初月からお客さんがいっぱいだよ。借金も無理なく返していけそう！' };
            }
            fx.flag('branch', 'ng'); fx.money(-2000000, '撤退の損失'); fx.note('2号店から撤退', false);
            return { face: 'surprise', text: '2号店にお客さんが来ない…。お店を手放して借金の多くは返したけど、200万円の損になっちゃった。' };
          }
        },
        {
          label: '貯めたお金で出す（300万円）', tag: 'attack',
          need: function (s) { return s.money < 3000000 ? '手元のお金が300万円以上必要' : null; },
          apply: function (fx) {
            var s = fx.s;
            var avg = (s.shu + s.sho + s.shin) / 3;
            var p = Math.max(0.05, Math.min(0.95, (avg - 25) / 45));
            fx.money(-3000000);
            if (fx.chance(p)) {
              fx.flag('branch', 'ok'); fx.money(3500000, '2号店のもうけ'); fx.note('2号店が成功', true);
              return { face: 'joy', text: '2号店、大成功！借金なしで出せたから、もうけがそのまま残るね。' };
            }
            fx.flag('branch', 'ng'); fx.money(1200000, '店を手放して戻るお金'); fx.note('2号店から撤退', false);
            return { face: 'trouble', text: 'うまくいかなかった…。お店を手放して、戻ってきたのは120万円だけ。' };
          }
        },
        {
          label: '出さずに今のお店をみがく', tag: 'defend',
          apply: function (fx) {
            fx.stat('shin', 4); fx.stat('sho', 3);
            return { face: 'smile', text: '足もとを固めるのも立派な判断。今のお店をもっといいお店にしよう！' };
          }
        }
      ]
    }
  ];
})(GAME);

if (typeof module !== 'undefined') module.exports = GAME;
