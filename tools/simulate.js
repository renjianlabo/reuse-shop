/* 自動プレイで難しさを確かめる： node tools/simulate.js [回数] */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = { console, Math, Date };
vm.createContext(ctx);
for (const f of ['engine.js', 'data-big.js', 'data-small.js', 'data-text.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });
}
const G = ctx.GAME;
if (process.env.P) Object.assign(G.PARAMS, JSON.parse(process.env.P));
if (process.env.E) Object.assign(G.ENDING_RULE, JSON.parse(process.env.E));
const N = Number(process.argv[2] || 10000);

function clone(s) { return JSON.parse(JSON.stringify(s)); }

function scoreState(s) {
  return s.money / 100000 + (s.shu + s.sho + s.shin) * 0.6 - (s.bankrupt ? 1000 : 0);
}

// 次の月末までざっくり見て判断する「考える人」
function smartPick(s, opts, applyFn) {
  let best = -1, bestV = -Infinity;
  opts.forEach((ok, i) => {
    if (!ok) return;
    let v = 0;
    for (let k = 0; k < 3; k++) {
      const c = clone(s);
      c.rng = (c.rng + k * 7919) | 0;
      applyFn(c, i);
      G.settle(c);
      v += scoreState(c);
    }
    if (v > bestV) { bestV = v; best = i; }
  });
  return best;
}

function play(seed, policy) {
  const s = G.newGame(seed);
  do {
    const ev = G.bigEvent(s);
    const ok = ev.choices.map(c => G.choiceState(s, c).ok);
    let idx;
    if (policy === 'random') {
      const avail = ok.map((o, i) => o ? i : -1).filter(i => i >= 0);
      idx = avail[Math.floor(Math.random() * avail.length)];
    } else {
      idx = smartPick(s, ok, (c, i) => G.applyChoice(c, ev, i));
    }
    G.applyChoice(s, ev, idx);
    if (s.bankrupt) break;
    const smalls = G.planSmall(s);
    for (const id of smalls) {
      const se = G.smallById(id);
      let si = null;
      if (se.choices) {
        const sok = se.choices.map(() => true);
        si = policy === 'random' ? Math.floor(Math.random() * se.choices.length)
          : smartPick(s, sok, (c, i) => G.applySmall(c, se, i));
      }
      G.applySmall(s, se, si);
      if (s.bankrupt) break;
    }
    if (s.bankrupt) break;
    G.settle(s);
    if (s.bankrupt) break;
  } while (G.nextMonth(s));
  return { ending: G.decideEnding(s), s };
}

function pct(n, d) { return (100 * n / d).toFixed(1) + '%'; }
function q(arr, p) { const a = arr.slice().sort((x, y) => x - y); return a[Math.floor(p * (a.length - 1))]; }

for (const policy of ['random', 'smart']) {
  const n = policy === 'smart' ? Math.min(N, 3000) : N;
  const count = {}, bm = {}, sales = [], money = [], smallCounts = [];
  for (let i = 0; i < n; i++) {
    const r = play((i * 2654435761) | 0, policy);
    count[r.ending] = (count[r.ending] || 0) + 1;
    if (r.ending === 'bankrupt') bm[r.s.bankruptMonth] = (bm[r.s.bankruptMonth] || 0) + 1;
    else { sales.push(G.annualSales(r.s)); money.push(r.s.money); }
    smallCounts.push(r.s.usedSmall.length);
  }
  console.log(`\n=== ${policy} (${n}回) ===`);
  for (const e of G.ENDING_ORDER) console.log(e.padEnd(14), pct(count[e] || 0, n));
  console.log('破産した月:', JSON.stringify(bm));
  if (sales.length) {
    console.log('年間売上 25/50/75/90%:', [0.25, 0.5, 0.75, 0.9].map(p => Math.round(q(sales, p) / 10000) + '万').join(' / '));
    console.log('最後のお金 25/50/75/90%:', [0.25, 0.5, 0.75, 0.9].map(p => Math.round(q(money, p) / 10000) + '万').join(' / '));
  }
  console.log('小さな出来事の数（平均）:', (smallCounts.reduce((a, b) => a + b, 0) / n).toFixed(1));
}
console.log('\n小さな出来事の種類:', G.SMALL.length);
