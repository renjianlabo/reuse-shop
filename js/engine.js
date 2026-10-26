/* ゲームの計算の仕組み（画面とは切り離してあるので、自動プレイでも同じものを使う） */
var GAME = (typeof GAME !== 'undefined') ? GAME : {};

(function (G) {
  'use strict';

  var START_MONEY = 3000000;
  var MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
  var SEASON = { 4: 1.0, 5: 1.0, 6: 0.95, 7: 1.0, 8: 1.05, 9: 0.95, 10: 1.0, 11: 1.0, 12: 1.15, 1: 0.9, 2: 0.9, 3: 1.1 };

  var P = G.PARAMS = {
    startMoney: START_MONEY,
    startStat: 40,
    rent: 450000,
    other: 350000,
    staffPay: 180000,
    baseVisitors: 0,
    visitorsPerShu: 16,
    baseUnit: 0,
    unitPerSho: 38,
    baseCostRate: 0.45,
    noise: 0.10,
    capBase: 1000,
    capPerStaff: 350,
    disasterChance: 0.2
  };

  /* ---------- 乱数（保存して続きから同じ流れにできるよう、自前で持つ） ---------- */
  function rnd(s) {
    var t = (s.rng = (s.rng + 0x6D2B79F5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function round1000(n) { return Math.round(n / 1000) * 1000; }

  /* ---------- 新しいゲーム ---------- */
  G.newGame = function (seed) {
    if (seed == null) seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) | 0;
    return {
      v: 1,
      rng: seed | 0,
      monthIdx: 0,
      money: P.startMoney,
      shu: P.startStat, sho: P.startStat, shin: P.startStat,
      costRate: P.baseCostRate,
      staff: 0,
      fixedExtra: 0,
      loans: [],   // {label, monthly, left}
      dues: [],    // {label, amount, inMonths}
      mods: [],    // {kind:'visitors'|'cost', value, months, label}
      extras: [],  // {label, amount, months}
      flags: {},
      tags: { attack: 0, defend: 0, customer: 0, team: 0 },
      usedSmall: [],
      terms: [],
      history: [], // 毎月の収支
      bankrupt: false,
      bankruptMonth: null,
      ending: null
    };
  };

  G.month = function (s) { return MONTHS[s.monthIdx]; };
  G.MONTHS = MONTHS;

  /* ---------- 効果を記録しながら数字を動かす道具 ---------- */
  function makeFx(s) {
    var deltas = [];
    var fx = {
      s: s,
      deltas: deltas,
      rand: function (a, b) { if (a === undefined) return rnd(s); return a + (b - a) * rnd(s); },
      chance: function (p) { return rnd(s) < p; },
      pick: function (arr) { return arr[Math.floor(rnd(s) * arr.length)]; },
      stat: function (k, n) {
        var before = s[k];
        // 高い数字ほど上がりにくくする（100に張りつかないように）
        if (n > 0 && before > 50) n = Math.max(1, n * (1 - (before - 50) / 110));
        n = Math.round(n);
        if (!n) return;
        s[k] = clamp(before + n, 0, 100);
        var d = s[k] - before;
        if (d) deltas.push({ k: k, n: d });
      },
      money: function (n, label) { // label を付けると「何のお金か」を分けて表示する
        n = round1000(n);
        if (!n) return;
        s.money += n;
        deltas.push({ k: 'money', n: n, label: label });
      },
      cost: function (d) { // 仕入れ値の割合（＝原価率）を動かす
        s.costRate = clamp(s.costRate + d, 0.25, 0.75);
        deltas.push({ k: 'cost', n: d });
      },
      mod: function (kind, value, months, label) {
        s.mods.push({ kind: kind, value: value, months: months, label: label });
        deltas.push({ k: 'mod', kind: kind, value: value, months: months, label: label });
      },
      extra: function (label, amount, months) {
        s.extras.push({ label: label, amount: round1000(amount), months: months });
        deltas.push({ k: 'extra', label: label, amount: round1000(amount), months: months });
      },
      fixed: function (n, label) {
        s.fixedExtra += n;
        deltas.push({ k: 'fixed', n: n, label: label });
      },
      staff: function (n) {
        var before = s.staff;
        s.staff = clamp(s.staff + n, 0, 3);
        if (s.staff !== before) deltas.push({ k: 'staff', n: s.staff - before });
      },
      loan: function (label, principal, months, rate) {
        var monthly = round1000(principal * (1 + rate) / months);
        s.loans.push({ label: label, monthly: monthly, left: months });
        deltas.push({ k: 'loan', label: label, monthly: monthly, months: months });
        return monthly * months - principal; // 実際に払う利息
      },
      due: function (label, amount, inMonths) {
        s.dues.push({ label: label, amount: amount, inMonths: inMonths });
        deltas.push({ k: 'due', label: label, amount: amount });
      },
      flag: function (k, v) { s.flags[k] = v; },
      note: function (text, good) { deltas.push({ k: 'note', t: text, good: good }); },
      tag: function (t) { if (t && s.tags[t] != null) s.tags[t]++; }
    };
    return fx;
  }
  G.makeFx = makeFx;

  function checkBankrupt(s) {
    if (s.money < 0 && !s.bankrupt) {
      s.bankrupt = true;
      s.bankruptMonth = G.month(s);
    }
    return s.bankrupt;
  }
  G.checkBankrupt = checkBankrupt;

  /* ---------- 文章の取り出し（関数でも配列でもOK） ---------- */
  function val(x, s) { return typeof x === 'function' ? x(s) : x; }
  G.val = val;

  /* ---------- 大きな出来事 ---------- */
  G.bigEvent = function (s) {
    var m = G.month(s);
    var list = G.BIG.filter(function (e) { return e.month === m && (!e.cond || e.cond(s)); });
    return list[0];
  };

  G.choiceState = function (s, choice) {
    if (choice.need) {
      var r = choice.need(s);
      if (r) return { ok: false, reason: r };
    }
    return { ok: true };
  };

  // お客の増減の効果を「人数」と「もうけ」に直す（効果あり・なしで今月の収支を試算して差をとる）
  G.modImpact = function (s, nBefore) {
    if (G.noImpact || s.mods.length <= nBefore) return null;
    var added = s.mods.slice(nBefore), months = 1;
    added.forEach(function (m) { months = Math.max(months, m.months); });
    var a = JSON.parse(JSON.stringify(s)), b = JSON.parse(JSON.stringify(s));
    b.mods = b.mods.slice(0, nBefore);
    G.noImpact = true;
    var ra = G.settle(a), rb = G.settle(b);
    G.noImpact = false;
    var gross = function (r) { return r.storeSales + r.online - r.cost; };
    return { k: 'impact', people: ra.visitors - rb.visitors, profit: Math.round((gross(ra) - gross(rb)) / 1000) * 1000,
      months: months, capped: ra.lost > 0 && ra.visitors <= rb.visitors && added.some(function (m) { return m.kind === 'visitors' && m.value > 1; }) };
  };

  // 選ぶ前に起きる効果（例：チェーン店ができてお客が流れる）を先に済ませる
  G.applyBase = function (s, ev) {
    if (!ev.base) return null;
    var fx = makeFx(s);
    ev.base(fx);
    s.baseDone = true;
    return fx.deltas;
  };

  G.applyChoice = function (s, ev, idx) {
    var nMods = s.mods.length;
    var fx = makeFx(s);
    var c = ev.choices[idx];
    if (ev.base && !s.baseDone) ev.base(fx); // 画面では選ぶ前に済ませている
    s.baseDone = false;
    fx.tag(c.tag);
    var res = c.apply(fx) || {};
    if (ev.memo && s.terms.indexOf(ev.memo) < 0) s.terms.push(ev.memo);
    var imp = G.modImpact(s, nMods); if (imp) fx.deltas.push(imp);
    checkBankrupt(s);
    return { text: res.text, who: res.who || 'mio', face: res.face || 'normal', deltas: fx.deltas, memo: ev.memo };
  };

  /* ---------- 小さな出来事 ---------- */
  G.planSmall = function (s) {
    var m = G.month(s);
    var n = rnd(s) < 0.5 ? 2 : 3;
    var picked = [];
    for (var i = 0; i < n; i++) {
      var pool = G.SMALL.filter(function (e) {
        if (s.usedSmall.indexOf(e.id) >= 0 || picked.indexOf(e.id) >= 0) return false;
        if (!G.smallOk(s, e)) return false;
        if (e.disaster || e.id === 's_insurance') return false;
        // 悪い出来事は1か月に1回まで（運だけで追いつめられないように）
        if (e.bad && picked.some(function (id) { return G.smallById(id).bad; })) return false;
        return true;
      });
      if (!pool.length) break;
      var total = pool.reduce(function (a, e) { return a + (e.weight || 1); }, 0);
      var r = rnd(s) * total, chosen = pool[0];
      for (var j = 0; j < pool.length; j++) {
        r -= (pool[j].weight || 1);
        if (r <= 0) { chosen = pool[j]; break; }
      }
      picked.push(chosen.id);
    }
    // 5月：保険の案内（必ず出す）
    if (m === 5 && s.usedSmall.indexOf('s_insurance') < 0 && G.smallById('s_insurance')) picked.unshift('s_insurance');
    // 7月以降：理不尽な大きなトラブル
    if (s.monthIdx >= 3 && (s.flags.dis || 0) < 2 && rnd(s) < P.disasterChance) {
      var ds = G.SMALL.filter(function (e) { return e.disaster && s.usedSmall.indexOf(e.id) < 0 && G.smallOk(s, e); });
      if (ds.length) picked.push(ds[Math.floor(rnd(s) * ds.length)].id);
    }
    return picked;
  };

  // 小さな出来事が今起きてよいか（月と条件）。予定した出来事も、出す直前にもう一度確かめる
  G.smallOk = function (s, e) {
    if (!e) return false;
    if (e.months && e.months.indexOf(G.month(s)) < 0) return false;
    return !e.cond || !!e.cond(s);
  };

  G.smallById = function (id) {
    for (var i = 0; i < G.SMALL.length; i++) if (G.SMALL[i].id === id) return G.SMALL[i];
    return null;
  };

  // 小さな出来事を実行（choicesがない場合は idx = null）
  G.applySmall = function (s, ev, idx) {
    if (s.usedSmall.indexOf(ev.id) < 0) s.usedSmall.push(ev.id);
    var nMods = s.mods.length;
    var fx = makeFx(s);
    var res;
    if (ev.choices && idx != null) {
      var c = ev.choices[idx];
      fx.tag(c.tag);
      res = c.apply(fx) || {};
    } else {
      res = ev.apply ? (ev.apply(fx) || {}) : {};
    }
    var imp = G.modImpact(s, nMods); if (imp) fx.deltas.push(imp);
    checkBankrupt(s);
    return { text: res.text, who: res.who === undefined ? 'mio' : res.who, face: res.face || 'normal', deltas: fx.deltas };
  };


  /* ---------- 選ぶ前の見通し（同じ状態で何十回か試して、結果をまとめる） ---------- */
  function level(n) { var a = Math.abs(n); return a <= 3 ? 1 : (a <= 7 ? 2 : 3); }
  function arrows(n) { var c = n > 0 ? '↑' : '↓'; var s = ''; for (var i = 0; i < level(n); i++) s += c; return s; }

  function summarize(deltas) {
    var impact = null, money = 0, named = {}, st = { shu: 0, sho: 0, shin: 0 }, items = [], extra = null, cost = 0, score = 0;
    deltas.forEach(function (d) {
      switch (d.k) {
        case 'money': if (d.label) named[d.label] = (named[d.label] || 0) + d.n; else money += d.n; break;
        case 'shu': case 'sho': case 'shin': st[d.k] += d.n; break;
        case 'cost': cost += d.n; break;
        case 'note': items.push({ t: d.t, plus: d.good }); score += d.good === true ? 8 : (d.good === false ? -8 : 0); break;
        case 'mod': break; // お客の増減は 'impact'（人数ともうけ）で表す
        case 'impact': impact = d; score += d.profit * d.months / 100000; break;
        case 'extra': extra = { label: d.label, amount: d.amount, months: d.months }; break;
        case 'fixed': items.push({ t: '毎月の支払い ' + (d.n > 0 ? '+' : '−') + G.man(Math.abs(d.n)), plus: d.n < 0 }); score -= d.n * 6 / 100000; break;
        case 'staff': items.push({ t: 'スタッフ ' + (d.n > 0 ? '+' : '−') + Math.abs(d.n) + '人', plus: null }); break;
        case 'loan': items.push({ t: '返済 毎月' + G.man(d.monthly) + '×' + d.months + 'か月', plus: false }); break;
        case 'due': items.push({ t: '来月 ' + G.man(d.amount) + 'を支払う', plus: false }); score -= d.amount / 150000; break;
      }
    });
    if (cost) items.unshift({ t: '1つあたりのもうけ ' + (cost < 0 ? '↑' : '↓'), plus: cost < 0 });
    var keys = items.map(function (x) { return x.t; });
    if (extra) keys.push('extra:' + extra.label + extra.months);
    keys.push(money > 0 ? 'm+' : (money < 0 ? 'm-' : 'm0'));
    if (impact) keys.push('imp' + (impact.people >= 0 && !impact.capped ? '+' : (impact.capped ? '+' : '-')) + impact.months);
    Object.keys(named).forEach(function (l) { keys.push('n:' + l + (named[l] > 0 ? '+' : '-')); score += named[l] / 100000; });
    score += money / 100000 + (st.shu + st.sho + st.shin) * 0.6 + (extra ? extra.amount * extra.months / 100000 : 0) - cost * 40;
    return { key: keys.join('|'), items: items, money: money, named: named, impact: impact, st: st, extra: extra, score: score };
  }

  function sign(n) { return n > 0 ? 1 : (n < 0 ? -1 : 0); }
  function compatible(g, st) { // 力の向きが逆でなければ、同じ結果の「幅」とみなす
    return ['shu', 'sho', 'shin'].every(function (k) {
      var a = sign(g.stMin[k]) || sign(g.stMax[k]), b = sign(st[k]);
      return !a || !b || a === b;
    });
  }
  function statText(k, lo, hi) {
    if (!lo && !hi) return null;
    var lv = function (n) { return n ? level(n) : 0; };
    var dir = (lo || hi) > 0 ? '↑' : '↓';
    var rep = function (n) { var s = ''; for (var i = 0; i < n; i++) s += dir; return s || '0'; };
    var a = Math.min(lv(lo), lv(hi)), b = Math.max(lv(lo), lv(hi));
    return { t: G.STAT_NAMES[k] + ' ' + (a === b ? rep(a) : rep(a) + '〜' + rep(b)), plus: dir === '↑' };
  }

  G.preview = function (s, ev, idx, isSmall) {
    var N = 80, list = [];
    for (var k = 0; k < N; k++) {
      var c = JSON.parse(JSON.stringify(s));
      c.rng = (s.rng + 1 + k * 7919) | 0;
      var res = isSmall ? G.applySmall(c, ev, idx) : G.applyChoice(c, ev, idx);
      var sm = summarize(res.deltas);
      var g = null;
      for (var j = 0; j < list.length; j++) if (list[j].key === sm.key && compatible(list[j], sm.st)) { g = list[j]; break; }
      if (!g) {
        g = { key: sm.key, n: 0, baseItems: sm.items, money: [], extra: [], extraInfo: sm.extra, score: 0,
          stMin: { shu: sm.st.shu, sho: sm.st.sho, shin: sm.st.shin }, stMax: { shu: sm.st.shu, sho: sm.st.sho, shin: sm.st.shin }, named: {} };
        list.push(g);
      }
      g.n++; g.money.push(sm.money); g.score += sm.score;
      Object.keys(sm.named).forEach(function (l) { var v = sm.named[l], r = g.named[l]; g.named[l] = r ? { min: Math.min(r.min, v), max: Math.max(r.max, v) } : { min: v, max: v }; });
      ['shu', 'sho', 'shin'].forEach(function (k2) { g.stMin[k2] = Math.min(g.stMin[k2], sm.st[k2]); g.stMax[k2] = Math.max(g.stMax[k2], sm.st[k2]); });
      if (sm.extra) g.extra.push(sm.extra.amount);
      if (sm.impact) { var I = sm.impact; g.imp = g.imp ? { pmin: Math.min(g.imp.pmin, I.people), pmax: Math.max(g.imp.pmax, I.people), fmin: Math.min(g.imp.fmin, I.profit), fmax: Math.max(g.imp.fmax, I.profit), months: I.months, capped: g.imp.capped && I.capped } : { pmin: I.people, pmax: I.people, fmin: I.profit, fmax: I.profit, months: I.months, capped: I.capped }; }
    }
    list.forEach(function (g) {
      g.p = g.n / N; g.score /= g.n;
      g.moneyMin = Math.min.apply(null, g.money); g.moneyMax = Math.max.apply(null, g.money);
      if (g.extra.length) { g.extraMin = Math.min.apply(null, g.extra); g.extraMax = Math.max.apply(null, g.extra); }
      var stats = [];
      ['shu', 'sho', 'shin'].forEach(function (k2) {
        var lo = Math.abs(g.stMin[k2]) < Math.abs(g.stMax[k2]) ? g.stMin[k2] : g.stMax[k2];
        var hi = lo === g.stMin[k2] ? g.stMax[k2] : g.stMin[k2];
        var x = statText(k2, lo, hi); if (x) stats.push(x);
      });
      g.items = stats.concat(g.baseItems);
    });
    list.sort(function (a, b) { return b.score - a.score; });
    var out = { groups: list };
    if (list.length > 1) {
      var mid = (list[0].score + list[list.length - 1].score) / 2;
      out.success = list.reduce(function (a, g) { return a + (g.score >= mid ? g.p : 0); }, 0);
    }
    return out;
  };

  /* ---------- 月末の収支 ---------- */
  G.settle = function (s) {
    var m = G.month(s);
    var vMult = 1, capMult = 1, uMult = 1, costAdd = 0, modLabels = [];
    s.mods.forEach(function (md) {
      if (md.kind === 'visitors') { vMult *= md.value; if (md.value < 1) capMult *= md.value; } // 休みや天気は、対応できる人数も減らす
      if (md.kind === 'cost') costAdd += md.value;
      if (md.kind === 'unit') uMult *= md.value; // 値引きやまとめ買いで、1人あたりの金額が変わる
      modLabels.push(md.label);
    });
    var noise = 1 + (rnd(s) * 2 - 1) * P.noise;
    var repeat = 0.75 + s.shin / 200;
    var visitors = Math.round((P.baseVisitors + P.visitorsPerShu * s.shu) * repeat * SEASON[m] * vMult * noise);
    var cap = Math.round(G.capacity(s) * capMult), lost = 0;
    if (visitors > cap) { lost = visitors - cap; visitors = cap; }
    var unit = Math.round((P.baseUnit + P.unitPerSho * s.sho) * uMult / 10) * 10;
    var storeSales = round1000(visitors * unit);

    var online = 0, olv = G.onlineLevel(s);
    if (olv === 2) online = round1000((200000 + s.sho * 7000) * (0.6 + rnd(s) * 0.8)); // 本格的：大きいがぶれも大きい
    if (olv === 1) online = round1000((60000 + s.sho * 2500) * (0.85 + rnd(s) * 0.3));

    var extra = 0, extraLabels = [];
    s.extras.forEach(function (e) { extra += e.amount; extraLabels.push(e.label); });

    var costRate = clamp(s.costRate + costAdd, 0.25, 0.8);
    var cost = round1000((storeSales + online) * costRate);
    // ユイは学生アルバイトなので、給料は月12万円
    var staffPay = s.staff * P.staffPay - (s.flags.yui && s.staff > 0 ? 60000 : 0);
    var ship = olv === 2 ? 60000 : 0; // 本格的なネット販売：発送の手伝い
    var fixed = P.rent + P.other + staffPay + s.fixedExtra + ship;

    var loan = 0;
    s.loans.forEach(function (l) { if (l.left > 0) { loan += l.monthly; l.left--; } });
    s.loans = s.loans.filter(function (l) { return l.left > 0; });

    var due = 0;
    // 「1か月待ってもらう」なら、その月ではなく翌月の月末に払う
    s.dues.forEach(function (d) { d.inMonths--; if (d.inMonths < 0) due += d.amount; });
    s.dues = s.dues.filter(function (d) { return d.inMonths >= 0; });

    var sales = storeSales + online + extra;
    var profit = sales - cost - fixed - loan - due;
    s.money += profit;

    // 期限つきの効果を1か月進める
    s.mods.forEach(function (md) { md.months--; });
    s.mods = s.mods.filter(function (md) { return md.months > 0; });
    s.extras.forEach(function (e) { e.months--; });
    s.extras = s.extras.filter(function (e) { return e.months > 0; });

    var rep = {
      month: m, visitors: visitors, lost: lost, unit: unit, storeSales: storeSales, online: online,
      extra: extra, extraLabels: extraLabels, sales: sales, cost: cost, costRate: costRate,
      rent: P.rent, other: P.other + s.fixedExtra + ship, staffPay: staffPay, staff: s.staff,
      loan: loan, due: due, profit: profit, money: s.money, modLabels: modLabels
    };
    s.history.push(rep);
    checkBankrupt(s);
    return rep;
  };

  // スタッフの人数で、1か月に対応できるお客の数が決まる
  G.capacity = function (s) { return P.capBase + P.capPerStaff * s.staff - (G.onlineLevel(s) === 2 ? 150 : 0); };

  // ネット販売は、始めた翌月から動き出す
  G.onlineLevel = function (s) {
    if (!s.flags.online) return 0;
    return s.monthIdx >= (s.flags.onlineFrom || 0) ? s.flags.online : 0;
  };

  G.nextMonth = function (s) {
    s.monthIdx++;
    return s.monthIdx < MONTHS.length;
  };

  /* ---------- 結末と診断 ---------- */
  G.annualSales = function (s) {
    return s.history.reduce(function (a, h) { return a + h.sales; }, 0);
  };

  G.decideEnding = function (s) {
    if (s.bankrupt) return 'bankrupt';
    var T = G.ENDING_RULE;
    var sales = G.annualSales(s);
    var minPow = Math.min(s.shu, s.sho, s.shin);
    if (s.flags.branch === 'ok' && minPow >= T.presidentMin && s.money >= T.presidentMoney) return 'president';
    if (sales >= T.no1Sales && s.shin >= T.no1Shin && s.money >= T.no1Money) return 'local_no1';
    if (sales >= T.poorSales && s.money < T.poorMoney) return 'popular_poor';
    return 'survive';
  };

  G.ENDING_RULE = {
    presidentMin: 60, presidentMoney: 2000000,
    no1Sales: 27000000, no1Shin: 60, no1Money: 2000000,
    poorSales: 24000000, poorMoney: 1000000
  };

  G.diagnose = function (s) {
    var order = ['attack', 'customer', 'team', 'defend'];
    var w = { attack: 1, customer: 1, team: 1.6, defend: 0.9 }; // チームは機会が少ないので重みを上げる
    var best = order[0], bestV = -1;
    order.forEach(function (k) {
      var v = s.tags[k] * w[k];
      if (v > bestV) { bestV = v; best = k; }
    });
    return best;
  };
})(GAME);

if (typeof module !== 'undefined') module.exports = GAME;
