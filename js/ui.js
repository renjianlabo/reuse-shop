/* 画面の動き */
(function (G) {
  'use strict';

  var SAVE_KEY = 'reuseShop.save.v1';
  var SEEN_KEY = 'reuseShop.endings.v1';

  var $ = function (id) { return document.getElementById(id); };
  var screens = ['scrTitle', 'scrGame', 'scrEnding', 'scrType', 'scrRead'];
  function show(id) { screens.forEach(function (k) { $(k).hidden = (k !== id); }); }

  /* ---------- 保存（使えない環境でも動くように） ---------- */
  function store(key, val) { try { if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* 保存できなくても遊べる */ } }
  function load(key) { try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch (e) { return null; } }

  /* ---------- 絵（あれば使い、なければ仮の絵） ---------- */
  var imgOk = {}; // 名前（拡張子なし）→ 読みこめた画像のURL
  var EXTS = ['webp', 'png'];
  function probe(base, i) {
    i = i || 0;
    if (i === 0) {
      if (base in imgOk) return;
      imgOk[base] = false;
      if (window.__ASSETS && window.__ASSETS[base]) { imgOk[base] = window.__ASSETS[base]; setTimeout(function () { onAsset(base); }, 0); return; }
    }
    if (i >= EXTS.length) return;
    var url = base + '.' + EXTS[i];
    var im = new Image();
    im.onload = function () { imgOk[base] = url; onAsset(base); };
    im.onerror = function () { probe(base, i + 1); };
    im.src = url;
  }
  function onAsset(base) {
    if (base === bgPath('shop') || base === bgPath('title')) paintTitleBg();
    if (curChara && charaPath.apply(null, curChara.split(':')) === base) { var k = curChara; curChara = ''; setChara.apply(null, k.split(':')); }
    if ($('scene').getAttribute('data-bg') && bgPath($('scene').getAttribute('data-bg')) === base) setBg($('scene').getAttribute('data-bg'));
  }
  function paintTitleBg() {
    var sc = document.querySelector('.title-screen .scene');
    var src = imgOk[bgPath('title')] || imgOk[bgPath('shop')]; if (!src) return;
    sc.classList.add('has-img'); sc.style.backgroundImage = 'url("' + src + '")';
  }
  function charaPath(who, face) { return 'assets/chara/' + (who === 'mio' ? 'mio_' + (face || 'normal') : who); }
  function bgPath(bg) { return 'assets/bg/' + bg; }
  function endingPath(id) { return 'assets/ending/' + id; }
  function preload() {
    G.CHARS.mio.faces.forEach(function (f) { probe(charaPath('mio', f)); });
    ['yui', 'rena', 'saeki'].forEach(function (w) { probe(charaPath(w)); });
    ['shop', 'office', 'night', 'shop_fashion', 'night_fashion', 'shop_gadget', 'night_gadget'].forEach(function (b) { probe(bgPath(b)); });
    G.ENDING_ORDER.forEach(function (e) { probe(endingPath(e)); });
  }

  function placeholderSVG(who, face) {
    var c = G.CHARS[who] || G.CHARS.mio;
    var eyes, mouth, brows = '';
    switch (face) {
      case 'smile': eyes = '<path d="M118 158q10-10 20 0M162 158q10-10 20 0" stroke="#2B2B2B" stroke-width="4" fill="none" stroke-linecap="round"/>'; mouth = '<path d="M136 186q14 12 28 0" stroke="#2B2B2B" stroke-width="4" fill="none" stroke-linecap="round"/>'; break;
      case 'joy': eyes = '<path d="M116 160q12-14 24 0M160 160q12-14 24 0" stroke="#2B2B2B" stroke-width="4" fill="none" stroke-linecap="round"/>'; mouth = '<path d="M132 182q18 22 36 0z" fill="#C2504A"/>'; break;
      case 'surprise': eyes = '<circle cx="128" cy="156" r="9" fill="#2B2B2B"/><circle cx="172" cy="156" r="9" fill="#2B2B2B"/>'; mouth = '<ellipse cx="150" cy="190" rx="8" ry="11" fill="#C2504A"/>'; break;
      case 'trouble': eyes = '<ellipse cx="128" cy="158" rx="6" ry="8" fill="#2B2B2B"/><ellipse cx="172" cy="158" rx="6" ry="8" fill="#2B2B2B"/>'; brows = '<path d="M114 138l24 6M186 138l-24 6" stroke="#2B2B2B" stroke-width="4" stroke-linecap="round"/>'; mouth = '<path d="M134 192q8-8 16 0t16 0" stroke="#2B2B2B" stroke-width="4" fill="none" stroke-linecap="round"/>'; break;
      case 'angry': eyes = '<ellipse cx="128" cy="160" rx="6" ry="7" fill="#2B2B2B"/><ellipse cx="172" cy="160" rx="6" ry="7" fill="#2B2B2B"/>'; brows = '<path d="M114 140l24 10M186 140l-24 10" stroke="#2B2B2B" stroke-width="5" stroke-linecap="round"/>'; mouth = '<path d="M138 192h24" stroke="#2B2B2B" stroke-width="4" stroke-linecap="round"/>'; break;
      default: eyes = '<ellipse cx="128" cy="158" rx="6" ry="9" fill="#2B2B2B"/><ellipse cx="172" cy="158" rx="6" ry="9" fill="#2B2B2B"/>'; mouth = '<path d="M140 188q10 6 20 0" stroke="#2B2B2B" stroke-width="4" fill="none" stroke-linecap="round"/>';
    }
    return '<svg viewBox="0 0 300 440" role="img" aria-label="' + c.name + '（仮の絵）">' +
      '<path d="M70 150q0-110 80-110t80 110v150h-160z" fill="' + c.color + '" opacity=".75"/>' +
      '<path d="M40 440q0-120 110-130q110 10 110 130z" fill="' + c.color + '"/>' +
      '<rect x="134" y="220" width="32" height="40" fill="#F6E1D3"/>' +
      '<circle cx="150" cy="160" r="72" fill="#F6E1D3"/>' +
      '<path d="M78 150q4-84 72-86q68 2 72 86q-30-40-72-44q-42 4-72 44z" fill="' + c.color + '"/>' +
      brows + eyes + mouth +
      '<circle cx="112" cy="182" r="9" fill="#F2A7A0" opacity=".6"/><circle cx="188" cy="182" r="9" fill="#F2A7A0" opacity=".6"/>' +
      '<rect x="105" y="350" width="90" height="40" rx="6" fill="#fff" stroke="#1F2A27" stroke-width="3"/>' +
      '<text x="150" y="377" text-anchor="middle" font-size="20" font-weight="700" fill="#1F2A27" font-family="sans-serif">' + c.name + '</text>' +
      '</svg>';
  }

  var curChara = '';
  // 小さな出来事の始めの顔：悪い出来事は困り顔、良い出来事は笑顔、それ以外はふつう
  function smallMood(se) {
    if (se.bad) return 'trouble';
    if (se.choices) return 'normal';
    var pv = G.preview(S, se, null, true).groups;
    var sc = pv.reduce(function (a, g) { return a + g.score * g.p; }, 0);
    return sc > 0.5 ? 'smile' : (sc < -0.5 ? 'trouble' : 'normal');
  }
  function setChara(who, face) {
    var el = $('chara');
    if (!who) return;
    if (who === 'mio' && face === 'think' && !imgOk[charaPath('mio', 'think')]) face = 'normal'; // 考える顔の絵がまだないとき
    var key = who + ':' + (face || '');
    if (key === curChara) return;
    curChara = key;
    var p = charaPath(who, face);
    if (!imgOk[p]) { el.innerHTML = placeholderSVG(who, face || 'normal'); return; }
    // 0.2秒かけて重ねて切り替える（表情ごとの小さなずれを目立たせない）
    var olds = Array.prototype.slice.call(el.children);
    var img = new Image();
    img.alt = G.CHARS[who].name;
    img.src = imgOk[p];
    el.appendChild(img);
    if (reduceMotion || !olds.length || olds[0].tagName !== 'IMG') {
      olds.forEach(function (o) { o.remove(); });
      img.classList.add('show');
      return;
    }
    requestAnimationFrame(function () {
      img.classList.add('show');
      olds.forEach(function (o) { o.classList.add('leave'); o.classList.remove('show'); });
    });
    setTimeout(function () { olds.forEach(function (o) { if (o.parentNode) o.remove(); }); }, 360);
  }
  // お店の種類（古着・ゲーム家電）に合わせた背景があればそちらを使う
  function bgFor(bg) {
    var c = S && S.flags && S.flags.concept;
    if ((bg === 'shop' || bg === 'night') && (c === 'fashion' || c === 'gadget') && imgOk[bgPath(bg + '_' + c)]) return bg + '_' + c;
    return bg;
  }
  function setBg(bg) {
    var sc = $('scene');
    sc.setAttribute('data-bg', bg);
    var p = bgPath(bgFor(bg));
    if (imgOk[p]) { sc.classList.add('has-img'); sc.style.backgroundImage = 'url("' + imgOk[p] + '")'; }
    else { sc.classList.remove('has-img'); sc.style.backgroundImage = ''; }
  }


  /* ---------- お金と数字の表示 ---------- */
  function fmt(n) { return Math.round(n).toLocaleString('ja-JP'); }
  var shownMoney = 0;
  function renderHud(s, animate) {
    $('hudMonth').textContent = G.month(s) + '月';
    var mEl = $('hudMoney');
    var target = s.money;
    if (animate && target !== shownMoney) {
      mEl.classList.remove('up', 'down');
      mEl.classList.add(target > shownMoney ? 'up' : 'down');
      var from = shownMoney, t0 = performance.now();
      (function step(t) {
        var k = Math.min(1, (t - t0) / 600);
        mEl.textContent = G.man(from + (target - from) * k);
        if (k < 1) requestAnimationFrame(step);
        else setTimeout(function () { mEl.classList.remove('up', 'down'); }, 600);
      })(t0);
    } else {
      mEl.textContent = G.man(target);
    }
    shownMoney = target;
    ['shu', 'sho', 'shin'].forEach(function (k) {
      var el = document.querySelector('.stat[data-k="' + k + '"]');
      var b = el.querySelector('b');
      var old = Number(b.textContent);
      b.textContent = s[k];
      el.querySelector('em').style.width = s[k] + '%';
      if (animate && old !== s[k]) {
        el.classList.add(s[k] > old ? 'flash-up' : 'flash-down');
        setTimeout(function () { el.classList.remove('flash-up', 'flash-down'); }, 1200);
      }
    });
  }

  function chipsFor(deltas) {
    var out = [];
    deltas.forEach(function (d) {
      var t = '', cls = '';
      switch (d.k) {
        case 'shu': case 'sho': case 'shin':
          t = G.STAT_NAMES[d.k] + (d.n > 0 ? ' +' : ' −') + Math.abs(d.n); cls = d.n > 0 ? 'plus' : 'minus'; break;
        case 'money':
          t = (d.label || 'お金') + ' ' + (d.n > 0 ? '+' : '') + G.man(d.n); cls = d.n > 0 ? 'plus' : 'minus'; break;
        case 'cost':
          t = d.n > 0 ? '1つあたりのもうけ ↓' : '1つあたりのもうけ ↑'; cls = d.n > 0 ? 'minus' : 'plus'; break;
        case 'impact':
          if (d.capped) { t = 'お客 +0人（対応しきれない）'; cls = 'minus'; break; }
          t = (d.months > 1 ? d.months + 'か月で ' : '') + 'お客 約' + approxPeople(d.people * d.months) + '（もうけ 約' + approxYen(Math.round(d.profit * d.months / 10000) * 10000) + '）'; cls = d.profit >= 0 ? 'plus' : 'minus'; break;
        case 'mod': break; // 人数ともうけは 'impact' で出す
        case 'extra': t = '売上 毎月+' + G.man(d.amount) + '（' + d.months + 'か月）'; cls = 'plus'; break;
        case 'fixed': t = '毎月の支払い ' + (d.n > 0 ? '+' : '−') + G.man(Math.abs(d.n)); cls = d.n > 0 ? 'minus' : 'plus'; break;
        case 'staff': t = 'スタッフ ' + (d.n > 0 ? '+' : '−') + Math.abs(d.n) + '人'; cls = ''; break;
        case 'loan': t = '返済 毎月' + G.man(d.monthly) + '×' + d.months + 'か月'; cls = 'minus'; break;
        case 'due': t = '来月 ' + G.man(d.amount) + 'を支払う'; cls = 'minus'; break;
        case 'note': t = d.t; cls = d.good === true ? 'plus' : (d.good === false ? 'minus' : ''); break;
      }
      if (t) out.push('<span class="chip ' + cls + '">' + t + '</span>');
    });
    return out.join('');
  }

  /* ---------- 会話（文字送り） ---------- */
  var tapResolver = null, typing = null;
  function onTap() {
    if (typing) { typing.finish(); return; }
    if (tapResolver) { var r = tapResolver; tapResolver = null; $('dialog').classList.remove('ready'); r(); }
  }
  $('dialog').addEventListener('click', onTap);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if ($('scrGame').hidden || e.target.tagName === 'BUTTON') return;
    e.preventDefault(); onTap();
  });

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function say(line, chipsHtml) {
    var dlg = $('dialog'), np = $('nameplate'), tx = $('dialogText');
    if (line.who) {
      var c = G.CHARS[line.who];
      np.hidden = false;
      np.innerHTML = c.name + '<small>' + c.role + '</small>';
      dlg.classList.remove('narration');
      setChara(line.who, line.face);
    } else {
      np.hidden = true;
      dlg.classList.add('narration');
    }
    $('chips').innerHTML = chipsHtml || '';
    dlg.classList.remove('ready');
    return new Promise(function (resolve) {
      var text = line.text || '', i = 0, timer = null;
      function done() {
        clearInterval(timer); typing = null;
        tx.textContent = text;
        dlg.classList.add('ready');
        tapResolver = resolve;
      }
      if (reduceMotion) { done(); return; }
      tx.textContent = '';
      typing = { finish: done };
      timer = setInterval(function () {
        i += 1;
        tx.textContent = text.slice(0, i);
        if (i >= text.length) done();
      }, 28);
    });
  }

  // お客の増減：「約○人（もうけ 約○万円）」で見せる。2か月以上続くものは合計
  function approxPeople(n) { var a = Math.abs(n); a = a >= 100 ? Math.round(a / 10) * 10 : a; return (n >= 0 ? '+' : '−') + a + '人'; }
  function approxYen(n) { return (n >= 0 ? '+' : '') + G.man(n); }
  function impactHTML(r) {
    if (r.capped) return '<i class="m">お客 +0人（対応しきれない）</i>';
    var m = r.months, pa = (r.pmin + r.pmax) / 2 * m, fa = (r.fmin + r.fmax) / 2 * m;
    var t = (m > 1 ? m + 'か月で ' : '') + 'お客 約' + approxPeople(Math.round(pa)) + '（もうけ 約' + approxYen(Math.round(fa / 10000) * 10000) + '）';
    return '<i class="' + (fa >= 0 ? 'p' : 'm') + '">' + t + '</i>';
  }
  function fxLine(g) {
    var parts = [];
    if (g.moneyMin || g.moneyMax) {
      var m = g.moneyMin === g.moneyMax ? G.man(g.moneyMin).replace(/^(?![−])/, '+')
        : G.man(g.moneyMin).replace(/^(?![−])/, '+') + '〜' + G.man(g.moneyMax).replace(/^(?![−])/, '+');
      parts.push('<i class="' + (g.moneyMax <= 0 ? 'm' : (g.moneyMin >= 0 ? 'p' : '')) + '">お金 ' + m + '</i>');
    }
    Object.keys(g.named || {}).forEach(function (l) {
      var r = g.named[l], sg = function (v) { return G.man(v).replace(/^(?![−])/, '+'); };
      parts.push('<i class="' + (r.max <= 0 ? 'm' : (r.min >= 0 ? 'p' : '')) + '">' + l + ' ' + (r.min === r.max ? sg(r.min) : sg(r.min) + '〜' + sg(r.max)) + '</i>');
    });
    if (g.imp) parts.push(impactHTML(g.imp));
    if (g.extraInfo) {
      var mo = g.extraInfo.months, lo = g.extraMin * mo, hi = g.extraMax * mo;
      var e = lo === hi ? G.man(lo) : G.man(lo) + '〜' + G.man(hi);
      parts.push('<i class="p">売上 ' + mo + 'か月で合計+' + e + '</i>');
    }
    g.items.forEach(function (it) { parts.push('<i class="' + (it.plus === true ? 'p' : (it.plus === false ? 'm' : '')) + '">' + it.t + '</i>'); });
    return parts.length ? parts.join('') : '<i>特に変化なし</i>';
  }
  function previewHTML(pv) {
    var gs = pv.groups;
    if (gs.length === 1) return '<span class="fx">' + fxLine(gs[0]) + '</span>';
    var p = pv.success, word = p >= 0.65 ? '高い' : (p >= 0.35 ? 'ふつう' : '低い');
    return '<span class="fx odds">うまくいく見込み：<b>' + word + '</b></span>' +
      '<span class="fx"><b class="ok">うまくいけば</b>' + fxLine(gs[0]) + '</span>' +
      '<span class="fx"><b class="ng">だめなら</b>' + fxLine(gs[gs.length - 1]) + '</span>';
  }

  function choose(ev, hint, isSmall) {
    var choices = ev.choices;
    var box = $('choices');
    var html = '';
    if (hint) html += '<p class="hint"><b>ミオ</b>' + hint + '</p>';
    choices.forEach(function (c, i) {
      var st = G.choiceState(S, c);
      var fx = st.ok ? previewHTML(G.preview(S, ev, i, isSmall)) : '<small>' + st.reason + '</small>';
      html += '<button class="tagbtn" data-i="' + i + '"' + (st.ok ? '' : ' disabled') + '>' +
        '<span><span class="tag-label">' + c.label + '</span>' + fx + '</span></button>';
    });
    box.innerHTML = html;
    box.hidden = false;
    var first = box.querySelector('.tagbtn:not([disabled])');
    if (first) first.focus({ preventScroll: true });
    return new Promise(function (resolve) {
      box.onclick = function (e) {
        var b = e.target.closest('.tagbtn');
        if (!b || b.disabled) return;
        b.classList.add('picked');
        box.onclick = null;
        setTimeout(function () { box.hidden = true; resolve(Number(b.getAttribute('data-i'))); }, 180);
      };
    });
  }

  function overlay(id, btnId, setup) {
    return new Promise(function (resolve) {
      var ov = $(id);
      if (setup) setup(ov);
      ov.hidden = false;
      var btn = $(btnId);
      btn.focus({ preventScroll: true });
      btn.onclick = function () { btn.onclick = null; ov.hidden = true; resolve(); };
    });
  }

  function monthCard(s, ev) {
    return new Promise(function (resolve) {
      var ov = $('ovMonth');
      $('calYear').textContent = '開店から' + (s.monthIdx + 1) + 'か月目';
      $('calMonth').textContent = G.month(s) + '月';
      $('calTitle').textContent = ev.title;
      ov.classList.remove('leave');
      ov.hidden = false;
      var closed = false;
      function close() {
        if (closed) return; closed = true;
        ov.classList.add('leave');
        setTimeout(function () { ov.hidden = true; resolve(); }, reduceMotion ? 0 : 330);
      }
      ov.onclick = close;
      setTimeout(close, 1700);
    });
  }

  function showMemo(id) {
    var t = G.TERMS[id];
    return overlay('ovMemo', 'btnMemo', function () {
      $('memoWord').textContent = t.word;
      $('memoYomi').textContent = t.yomi;
      $('memoBody').textContent = t.body;
      $('memoJob').textContent = t.job;
    });
  }

  function receiptHTML(r, compact) {
    var row = function (a, b, neg) { return '<div class="row"><span>' + a + '</span><span' + (neg ? ' class="neg"' : '') + '>' + b + '</span></div>'; };
    var h = '';
    if (!compact) h += '<h3>' + r.month + '月のレシート</h3><p class="r-sub">リユースショップ 駅前店</p>';
    else h += '<div class="row"><span><b>' + r.month + '月</b></span><span></span></div>';
    h += row('来てくれたお客', fmt(r.visitors) + '人');
    if (r.lost) h += row('対応しきれずに帰ったお客', fmt(r.lost) + '人', true);
    h += row('1人あたりの金額', fmt(r.unit) + '円');
    h += row('お店の売上', fmt(r.storeSales) + '円');
    if (r.online) h += row('ネットの売上', fmt(r.online) + '円');
    if (r.extra) h += row(r.extraLabels.join('・'), fmt(r.extra) + '円');
    h += '<div class="rule"></div>';
    h += row('売上の合計', fmt(r.sales) + '円');
    h += row('仕入れ', '−' + fmt(r.cost) + '円', true);
    h += row('家賃', '−' + fmt(r.rent) + '円', true);
    h += row('光熱費・その他', '−' + fmt(r.other) + '円', true);
    if (r.staffPay) h += row('スタッフの給料（' + r.staff + '人）', '−' + fmt(r.staffPay) + '円', true);
    if (r.loan) h += row('借りたお金の返済', '−' + fmt(r.loan) + '円', true);
    if (r.due) h += row('待ってもらった支払い', '−' + fmt(r.due) + '円', true);
    h += '<div class="rule"></div>';
    h += '<div class="row total"><span>今月のもうけ</span><span' + (r.profit < 0 ? ' class="neg"' : '') + '>' + (r.profit < 0 ? '−' : '+') + fmt(Math.abs(r.profit)) + '円</span></div>';
    h += row('手元のお金', fmt(r.money) + '円', r.money < 0);
    if (!compact && r.modLabels.length) h += '<p class="note">今月の影響：' + r.modLabels.join('、') + '</p>';
    return h;
  }

  function receiptComment(r) {
    if (r.money < 0) return 'お金が足りない…！';
    if (r.lost >= 100) return '忙しすぎて、' + fmt(r.lost) + '人も対応できずに帰っちゃった…。人手が足りないかも。';
    if (r.due) return '待ってもらった支払いを、ちゃんと払えたね。';
    if (r.profit >= 300000) return '大きな黒字！いい1か月だったね。';
    if (r.profit >= 0) return '黒字だよ。この調子！';
    if (r.money < 800000) return '赤字が続くと危ないよ。お金の残りに気をつけて！';
    if (r.loan) return '返済があるから、しばらくは苦しい月が続くね。';
    return '今月は赤字…。売上を上げるか、出ていくお金を減らさないと。';
  }

  function showReceipt(r) {
    return overlay('ovReceipt', 'btnReceipt', function () {
      var rc = $('receipt');
      rc.style.animation = 'none'; void rc.offsetWidth; rc.style.animation = '';
      rc.innerHTML = receiptHTML(r);
      rc.scrollTop = 0;
      $('receiptComment').innerHTML = '<b>ミオ</b>' + receiptComment(r);
      $('btnReceipt').textContent = (r.money < 0) ? '結果を見る' : (r.month === 3 ? '1年の結果を見る' : '次の月へ');
    });
  }

  /* ---------- ゲームの進行 ---------- */
  var S = null;
  var running = false;

  async function playEvent(lines) {
    for (var i = 0; i < lines.length; i++) await say(lines[i]);
  }

  async function runGame(resume) {
    running = true;
    show('scrGame');
    $('choices').hidden = true;
    curChara = '';
    renderHud(S, false);
    setBg('shop');
    setChara('mio', 'smile');

    if (!resume) await playEvent(G.INTRO);

    while (true) {
      store(SAVE_KEY, { v: 1, s: S });
      if (!running) return;
      var ev = G.bigEvent(S);
      renderHud(S, false);
      setBg(ev.bg || 'shop');
      setChara('mio', 'normal');
      $('chips').innerHTML = '';
      await monthCard(S, ev);
      await playEvent(G.val(ev.lines, S));
      setChara('mio', 'think');
      var idx = await choose(ev, ev.hint ? ev.hint(S) : null, false);
      var res = G.applyChoice(S, ev, idx);
      setBg(ev.bg || 'shop'); // 4月にお店の種類が決まったら、すぐ背景を切り替える
      renderHud(S, true);
      await say({ who: res.who, face: res.face, text: res.text }, chipsFor(res.deltas));
      if (S.bankrupt) return finish();
      await showMemo(ev.memo);

      var smalls = G.planSmall(S);
      for (var k = 0; k < smalls.length; k++) {
        var se = G.smallById(smalls[k]);
        setBg('shop');
        setChara('mio', smallMood(se));
        await playEvent(se.lines);
        var si = null;
        if (se.choices) { setChara('mio', 'think'); si = await choose(se, null, true); }
        var sr = G.applySmall(S, se, si);
        renderHud(S, true);
        await say({ who: sr.who, face: sr.face, text: sr.text }, chipsFor(sr.deltas));
        if (S.bankrupt) return finish();
      }

      setBg('night');
      var rep = G.settle(S);
      setChara('mio', rep.profit >= 0 ? 'smile' : 'trouble');
      renderHud(S, true);
      await showReceipt(rep);
      if (S.bankrupt) return finish();
      if (!G.nextMonth(S)) return finish();
    }
  }

  function finish() {
    running = false;
    store(SAVE_KEY, null);
    var id = G.decideEnding(S);
    S.ending = id;
    var seen = load(SEEN_KEY) || [];
    if (seen.indexOf(id) < 0) { seen.push(id); store(SEEN_KEY, seen); }
    var e = G.ENDINGS[id];
    var p = endingPath(id);
    var mp = charaPath('mio', e.face), bp = bgPath(bgFor(id === 'bankrupt' ? 'night' : 'shop'));
    // 結末の絵があればそれを、なければお店の背景を使う
    var scene = imgOk[p] || imgOk[bp] || '';
    $('endingArt').innerHTML = '<div class="ending-scene" data-bg="' + (id === 'bankrupt' ? 'night' : 'shop') + '"' +
      (scene ? ' style="background-image:url(&quot;' + scene + '&quot;)"' : '') + '>' +
      (imgOk[mp] ? '<img class="mio" src="' + imgOk[mp] + '" alt="ミオ">' : (scene ? '' : '<div class="ph">' + e.title + '</div>')) + '</div>';
    $('endingKicker').textContent = '結末 ' + (G.ENDING_ORDER.indexOf(id) + 1) + ' / ' + G.ENDING_ORDER.length;
    $('endingTitle').textContent = e.title;
    $('endingText').innerHTML = e.text(S).map(function (t) { return '<p>' + t + '</p>'; }).join('');
    $('endingLesson').textContent = e.lesson;
    $('endingStats').innerHTML =
      '<dt>' + (S.bankrupt ? 'それまでの売上' : '1年間の売上') + '</dt><dd>' + G.man(G.annualSales(S)) + '</dd>' +
      '<dt>最後のお金</dt><dd>' + G.man(S.money) + '</dd>' +
      '<dt>集客力 / 商品力 / 信頼</dt><dd>' + S.shu + ' / ' + S.sho + ' / ' + S.shin + '</dd>' +
      '<dt>見つけた結末</dt><dd>' + seen.length + ' / ' + G.ENDING_ORDER.length + '</dd>';
    show('scrEnding');
    $('scrEnding').scrollTop = 0;
    document.querySelector('.ending-body').scrollTop = 0;
    requestAnimationFrame(updateEndBar);
    var mio = $('endingArt').querySelector('.mio');
    var revealMio = function () { if (mio) requestAnimationFrame(function () { mio.classList.add('show'); }); };
    // まず結末の絵を画面いっぱいに見せてから、ミオと文章の画面へ
    if (!imgOk[p]) { revealMio(); return; }
    var ov = $('endIntro');
    ov.style.backgroundImage = 'url("' + imgOk[p] + '")';
    $('endIntroKicker').textContent = '結末 ' + (G.ENDING_ORDER.indexOf(id) + 1) + ' / ' + G.ENDING_ORDER.length;
    $('endIntroTitle').textContent = e.title;
    ov.classList.remove('leave');
    ov.hidden = false;
    var closed = false;
    var close = function () {
      if (closed) return; closed = true;
      ov.classList.add('leave');
      setTimeout(function () { ov.hidden = true; revealMio(); }, reduceMotion ? 0 : 500);
    };
    ov.onclick = close;
    setTimeout(close, 2600);
  }

  // 説明の板のスクロールバー
  function updateEndBar() {
    var body = document.querySelector('.ending-body'), bar = $('endBar');
    if ($('scrEnding').hidden) return;
    var over = body.scrollHeight - body.clientHeight;
    if (over <= 2) { bar.hidden = true; return; }
    bar.hidden = false;
    var top = body.offsetTop + 18, h = body.clientHeight - 36;
    bar.style.top = top + 'px'; bar.style.height = h + 'px';
    var th = Math.max(30, h * body.clientHeight / body.scrollHeight);
    var thumb = bar.firstChild;
    thumb.style.height = th + 'px';
    thumb.style.top = ((h - th) * body.scrollTop / over) + 'px';
  }
  document.querySelector('.ending-body').addEventListener('scroll', updateEndBar);
  window.addEventListener('resize', updateEndBar);

  function showType() {
    var t = G.TYPES[G.diagnose(S)];
    $('typeName').textContent = t.name;
    $('typeCatch').textContent = t.catch;
    $('typeBody').textContent = t.body;
    $('typeStrength').textContent = t.strength;
    show('scrType');
  }

  /* ---------- 読みもの画面 ---------- */
  var readBack = null;
  function openRead(title, html, back) {
    $('readTitle').textContent = title;
    $('readBody').innerHTML = html;
    $('readBody').scrollTop = 0;
    readBack = back;
    show('scrRead');
  }
  function termsHTML(learned) {
    return G.TERM_ORDER.map(function (id) {
      var t = G.TERMS[id];
      if (learned.indexOf(id) < 0) return '<div class="term locked"><h4>？？？</h4><p class="yomi">まだ出会っていない用語</p></div>';
      return '<div class="term"><h4>' + t.word + '</h4><p class="yomi">' + t.yomi + '</p><p>' + t.body + '</p><p class="job"><b>就活ポイント：</b>' + t.job + '</p></div>';
    }).join('');
  }

  /* ---------- ボタン ---------- */
  function startNew() {
    S = G.newGame();
    shownMoney = S.money;
    runGame(false);
  }
  $('btnNew').onclick = startNew;
  $('btnAgain').onclick = startNew;
  $('btnContinue').onclick = function () {
    var sv = load(SAVE_KEY);
    if (!sv || sv.v !== 1) { refreshTitle(); return; }
    S = sv.s;
    shownMoney = S.money;
    runGame(true);
  };
  $('btnToType').onclick = showType;
  $('btnTypeTerms').onclick = function () { openRead('覚えた用語', termsHTML(S.terms), function () { show('scrType'); }); };
  $('btnTypeTitle').onclick = refreshTitle;

  $('btnMenu').onclick = function () { $('ovMenu').hidden = false; $('btnCloseMenu').focus(); };
  $('btnCloseMenu').onclick = function () { $('ovMenu').hidden = true; };
  $('btnTerms').onclick = function () {
    $('ovMenu').hidden = true;
    openRead('覚えた用語', termsHTML(S.terms), function () { show('scrGame'); });
  };
  $('btnHistory').onclick = function () {
    $('ovMenu').hidden = true;
    var h = S.history.length ? S.history.slice().reverse().map(function (r) { return '<div class="mini-receipt">' + receiptHTML(r, true) + '</div>'; }).join('')
      : '<p>まだレシートはありません。1か月が終わると、ここにたまっていきます。</p>';
    openRead('これまでのレシート', h, function () { show('scrGame'); });
  };
  $('btnToTitle').onclick = function () { $('ovMenu').hidden = true; running = false; location.reload(); };
  $('btnReadBack').onclick = function () { if (readBack) readBack(); };

  function refreshTitle() {
    var sv = load(SAVE_KEY);
    $('btnContinue').hidden = !(sv && sv.v === 1);
    if (sv && sv.v === 1) $('btnContinue').textContent = '続きから（' + G.MONTHS[sv.s.monthIdx] + '月）';
    var seen = load(SEEN_KEY) || [];
    $('titleRecord').textContent = seen.length ? '見つけた結末 ' + seen.length + ' / ' + G.ENDING_ORDER.length : '';
    show('scrTitle');
  }

  /* ---------- はじめ ---------- */
  document.title = G.TITLE;
  $('titleText').textContent = G.TITLE;
  $('subtitleText').textContent = G.SUBTITLE;
  $('deskTitle').textContent = G.TITLE;
  preload();
  refreshTitle();

  // 動作確認用（画面には影響しない）
  window.__game = { get state() { return S; } };
})(GAME);
