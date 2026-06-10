import json
data=open('/mnt/user-data/outputs/plants.json').read()
K=json.load(open('/home/claude/tkeys.json'))
TPL=r'''<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Plant Picker</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Alegreya+Sans:ital,wght@0,400;0,500;0,700;0,800;1,400;1,500&display=swap" rel="stylesheet">
<style>
:root{
  --paper:#f0efeb;--paper2:#e7e5dd;--ink:#23211b;--ink-soft:#5c574a;
  --green:#3f5a3a;--green-2:#5d7a4e;--olive:#7d7a3c;--ochre:#a8632e;
  --gold:#b8922f;--grey:#8a8472;--accent:var(--green);
  --sans:"Alegreya Sans",sans-serif;
  --bloom-grey:rgba(35,33,27,.20);--tick:#cdc7b6;--tick-q:#a59d88;
  --rule:rgba(35,33,27,.13);
  --lvl-gold:#f0ac1e;--lvl-blue:#3a47c6;--lvl-off:#cfcdc6;
}
/* hyphens:manual — words containing hard hyphens (well-drained) may break at the hyphen */
*{box-sizing:border-box;hyphens:manual;-webkit-hyphens:manual}
html,body{margin:0;background:var(--paper);color:var(--ink);
  font-family:var(--sans);font-size:16px;line-height:1.45}
.wrap{max-width:none;margin:0;padding:0 32px 100px}

header{padding:52px 0 20px}
h1{font-weight:800;font-size:clamp(40px,6vw,80px);line-height:1;margin:0;letter-spacing:-.02em}

/* ── Sticky controls bar ──────────────────────────────────────────────────── */
.controls{position:sticky;top:0;z-index:20;background:var(--paper);
  border-bottom:1px solid var(--rule);padding:10px 0 0}
.controls-bar{display:flex;flex-wrap:wrap;gap:8px 10px;align-items:center;padding-bottom:10px}
.search-wrap{flex:1 1 220px}
.search-wrap input[type=text]{width:100%;font-family:var(--sans);font-size:15px;
  background:var(--paper2);border:1px solid var(--rule);color:var(--ink);
  padding:8px 14px;border-radius:8px;outline:none;word-break:normal}
.search-wrap input[type=text]:focus{border-color:var(--green);background:#fff}
button.qbtn,button.reset{font-family:var(--sans);font-size:14px;font-weight:500;
  background:rgb(35,33,27);color:rgb(240,239,235);border:none;
  padding:8px 18px;border-radius:999px;cursor:pointer;white-space:nowrap;transition:opacity .15s}
button.qbtn{display:flex;align-items:center;gap:5px}
button.qbtn:hover,button.reset:hover{opacity:.78}
button.qbtn.active{background:var(--green)}
button.reset{display:none;background:rgba(35,33,27,.5)}
button.reset.vis{display:inline-block}

/* ── Query pane: fixed overlay anchored below the sticky bar ─────────────── */
.query-pane{position:fixed;top:var(--ctrl-h,52px);right:28px;z-index:100;
  width:min(320px,calc(100vw - 56px));max-height:calc(100vh - var(--ctrl-h,52px) - 20px);overflow-y:auto;
  background:var(--paper);border:1px solid var(--rule);border-radius:0 0 14px 14px;
  padding:16px 20px 20px;box-shadow:0 10px 32px rgba(35,33,27,.18);
  display:none}
.query-pane.open{display:block}
.query-pane h2{font-size:12px;letter-spacing:.1em;text-transform:uppercase;
  color:var(--ink-soft);font-weight:700;margin:0 0 12px}
.qinner{display:flex;flex-direction:column;gap:14px;align-items:stretch}
.field{display:flex;flex-direction:column;gap:4px}
.field label{font-size:11.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--ink-soft)}
select{font-family:var(--sans);font-size:14.5px;background:var(--paper2);
  border:1px solid var(--rule);color:var(--ink);padding:7px 10px;border-radius:6px;outline:none}
select:focus{border-color:var(--green);background:#fff}
.chk{flex-direction:row;align-items:center;gap:7px}
.chk input{accent-color:var(--green);width:15px;height:15px}
.chk label{text-transform:none;letter-spacing:0;font-size:14px;color:var(--ink)}
.crange{display:flex;align-items:center;gap:8px}
.crange input[type=range]{width:110px;accent-color:var(--green)}
.cval{font-size:13px;min-width:14px}

/* ── table ──────────────────────────────────────────────────────────────── */
.tablewrap{overflow-x:clip}
table{width:100%;border-collapse:separate;border-spacing:0;font-size:14.5px}

/* Sticky thead at viewport top (controls bar no longer in flow) */
thead{position:sticky;top:var(--ctrl-h,52px);z-index:10}
thead .cols th{
  font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-soft);
  text-align:left;font-weight:500;
  padding:8px 10px 28px;
  white-space:nowrap;user-select:none;background:var(--paper);
  vertical-align:middle;border-bottom:1px solid var(--rule)}
thead .cols th.s{cursor:pointer}
thead .cols th .ar{color:var(--ink);font-size:9px;margin-left:2px}

thead .cols th.th-season{position:relative;min-width:196px}
.tlhead{position:absolute;bottom:6px;left:10px;width:176px;height:12px}
.tlhead span{position:absolute;font-size:9px;color:var(--ink-soft);top:0}

/* Vertical rules — left of Soil (Character|Soil) and left of Width */
thead th.sep,tbody td.sep{border-left:1px solid var(--rule)}

tbody tr.row{cursor:pointer}
tbody tr.row:hover td{background:var(--paper2)}
tbody td{padding:8px 10px;vertical-align:middle;border-bottom:1px solid var(--rule)}

/* Name column flush with the left edge of the listing */
thead .cols th:first-child,td.name{padding-left:0}
td.name{min-width:185px}
.name .com{font-weight:700;display:block;line-height:1.15;font-size:15px}
.name .lat{font-style:italic;color:var(--ink-soft);font-size:14px;display:block}

.char-cell{min-width:130px;vertical-align:top;padding-top:10px}
.cat-label{display:block;font-size:13.5px;color:var(--ink);line-height:1.3;
  text-transform:capitalize;word-break:normal}
.tier-label{display:block;font-size:13.5px;color:var(--ink-soft);line-height:1.3;
  margin-top:2px;word-break:normal}
.tier-label mark{background:rgba(184,146,47,.30);color:var(--ink);
  padding:0 3px;border-radius:3px}

.req{font-size:13.5px;color:var(--ink-soft);max-width:160px;word-break:normal}
.icon-cell{white-space:nowrap;min-width:34px;vertical-align:middle}
.dim{font-size:13px;white-space:nowrap}
.habit{font-size:13.5px;color:var(--ink-soft);word-break:normal}
.empty-c{color:rgba(35,33,27,.22)}
.tlsvg{display:block}

/* detail */
tr.detailrow,tr.detailrow:hover td{cursor:default;background:#eceae2}
.detail{padding:12px 10px 18px 22px;border-left:3px solid var(--accent);margin:4px 0 6px}
.dgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:4px 26px}
.di{padding:5px 0;border-bottom:1px solid var(--rule)}
.dk{font-size:11px;letter-spacing:.05em;text-transform:uppercase;
  color:var(--ink-soft);display:block;margin-bottom:2px}
.dk.est{color:var(--ochre)}.dk.rec{color:var(--green-2)}.dk.doc{color:var(--olive)}
.dv{font-size:14.5px}
.flagnote{font-size:11.5px;color:var(--ink-soft);margin:0 0 10px;display:flex;gap:16px;flex-wrap:wrap}

#totop{position:fixed;bottom:24px;right:28px;z-index:99;
  background:rgb(35,33,27);color:rgb(240,239,235);border:none;
  font-family:var(--sans);font-size:14px;font-weight:500;
  padding:9px 18px;border-radius:999px;cursor:pointer;
  opacity:0;transition:opacity .18s;pointer-events:none}
#totop.vis{opacity:1;pointer-events:auto}
#totop:hover{opacity:.82}

#sentinel{height:1px}
footer{margin-top:34px;padding-top:18px;border-top:1px solid var(--rule);
  font-size:13px;color:var(--ink-soft);line-height:1.6}
footer b{color:var(--ink);font-weight:700}
</style></head><body><div class="wrap">

<header><h1>Plant Picker</h1></header>

<div class="controls" id="controls">
  <div class="controls-bar">
    <div class="search-wrap"><input type="text" id="q" placeholder="Search common or botanical name&hellip;"></div>
    <button class="qbtn" id="query-toggle">Query <span id="qt-arrow">&#9662;</span></button>
    <button class="reset" id="reset">Reset &times;</button>
  </div>
</div>

<div class="query-pane" id="query-pane">
  <h2>Query</h2>
  <div class="qinner">
    <div class="field"><label>Nativity tier</label><select id="f-tier"><option value="">All tiers</option></select></div>
    <div class="field"><label>Category</label><select id="f-cat"><option value="">All</option></select></div>
    <div class="field"><label>Source</label><select id="f-src"><option value="">All</option></select></div>
    <div class="field"><label>Min C&#8209;value</label><div class="crange"><input type="range" id="f-c" min="0" max="10" value="0" step="1"><span class="cval" id="f-c-v">0</span></div></div>
    <div class="field chk"><input type="checkbox" id="f-haspoll"><label for="f-haspoll">Has pollinator data</label></div>
  </div>
</div>

<div class="tablewrap"><table>
<thead>
<tr class="cols">
  <th data-k="com">Name</th>
  <th class="s" data-k="tier_group">Character <span class="ar"></span></th>
  <th class="sep s" data-k="soil">Soil <span class="ar"></span></th>
  <th class="s" data-k="light">Light <span class="ar"></span></th>
  <th class="s" data-k="water">Water <span class="ar"></span></th>
  <th class="sep s" data-k="width">Width <span class="ar"></span></th>
  <th class="s" data-k="height">Height <span class="ar"></span></th>
  <th class="s" data-k="habit">Habit <span class="ar"></span></th>
  <th class="s th-season" data-k="season">Season
    <div class="tlhead">
      <span style="left:2px">Mar</span><span style="left:46px">Jun</span>
      <span style="left:90px">Sep</span><span style="left:134px">Dec</span>
    </div>
  </th>
</tr>
</thead>
<tbody id="tbody"></tbody>
</table></div>
<div id="sentinel"></div>

<footer><b>Width &amp; Height</b> ft ranges. <b>Season</b> bar marks bloom months on a Mar&ndash;Feb axis, filled with bloom color when known. <b>Character</b> lists plant category and nativity tier; <mark style="background:rgba(184,146,47,.30);padding:0 3px;border-radius:3px">Native</mark> entries are highlighted. <b>Light</b> (gold) and <b>Water</b> (blue) circles fill one per level; hover to see source text. Click any row for full detail.</footer>
</div>

<button id="totop" onclick="window.scrollTo({top:0,behavior:'smooth'})">&#8593; Top</button>

<script id="data" type="application/json">__DATA__</script>
<script>
const PLANTS=JSON.parse(document.getElementById('data').textContent);
const K=__KEYS__;
const POLL_KEY=(()=>{for(const p of PLANTS)for(const k in p)if(k.includes('Pollinators Supported'))return k;return'';})();

/* ── Bloom timeline ──────────────────────────────────────────────────────── */
const COLORMAP=[['silver-green','#9aa890'],['light blue','#8fb0d0'],['blue-green','#6f9b8a'],['white','#dcd6c4'],['cream','#ddd2b4'],['ivory','#ddd2b4'],['yellow','#e0bd34'],['gold','#d2a024'],['orange','#d9772b'],['scarlet','#b23a2e'],['red','#b23a2e'],['burgundy','#6e2f3a'],['pink','#d98aa6'],['rose','#d07a96'],['magenta','#b14a82'],['purple','#7c5a96'],['violet','#7c5a96'],['lavender','#a594c0'],['indigo','#46587f'],['blue','#5b7fb0'],['mauve','#9a7d8c'],['maroon','#6e3140'],['rust','#9a4a2c'],['copper','#b06a3a'],['bronze','#8a6a3a'],['tan','#b9a06a'],['salmon','#e08a6a'],['coral','#e0795a'],['silver','#b9c0b0'],['green','#5d7a4e']];
function pickColor(s){if(!s)return null;s=s.toLowerCase();for(const[w,h]of COLORMAP)if(s.includes(w))return h;return null;}
const MONTHS={jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
function monthIdx(w){w=w.slice(0,3);return w in MONTHS?MONTHS[w]:null;}
const PHASE={'early spring':2,'mid spring':3,'late spring':4,'early summer':5,'mid summer':6,'late summer':7,'early fall':8,'mid fall':9,'late fall':10,'early winter':11,'mid winter':0,'late winter':1};
function bloomMonths(bt){
  if(!bt)return[];bt=bt.toLowerCase();const set=new Set();
  for(const ph in PHASE)if(bt.includes(ph))set.add(PHASE[ph]);
  const mns=Object.keys(MONTHS).join('|');let mr;
  const re1=new RegExp('('+mns+')[a-z]*\\s*(?:to|-|\\u2013)\\s*('+mns+')[a-z]*','g');
  while((mr=re1.exec(bt))){let a=monthIdx(mr[1]),b=monthIdx(mr[2]);if(a!=null&&b!=null){let i=a;for(let n=0;n<12;n++){set.add(i);if(i===b)break;i=(i+1)%12;}}}
  const re2=new RegExp('\\b('+mns+')[a-z]*\\b','g');
  while((mr=re2.exec(bt))){const mi=monthIdx(mr[1]);if(mi!=null)set.add(mi);}
  if(!set.size){if(bt.includes('spring'))[2,3,4].forEach(x=>set.add(x));if(bt.includes('summer'))[5,6,7].forEach(x=>set.add(x));if(/(fall|autumn)/.test(bt))[8,9,10].forEach(x=>set.add(x));if(bt.includes('winter'))[11,0,1].forEach(x=>set.add(x));}
  return[...set];}
const TLW=176,SEG=TLW/12,TLH=26;
function timeline(p){
  const mo=bloomMonths(p[K.bloomtime]);let g='';
  for(let i=0;i<=12;i++){
    const x=(i*SEG).toFixed(1),q=[0,3,6,9,12].includes(i);
    g+=`<line x1="${x}" y1="${q?1:5}" x2="${x}" y2="21" stroke="${q?'var(--tick-q)':'var(--tick)'}" stroke-width="1"/>`;}
  if(mo.length){const col=pickColor(p[K.bloomcolor])||'rgba(35,33,27,.22)';
    mo.forEach(i=>{const vis=(i-2+12)%12;
      g+=`<rect x="${(vis*SEG+1.5).toFixed(1)}" y="6" width="${(SEG-3).toFixed(1)}" height="11" rx="1.5" fill="${col}"/>`;});}
  return`<svg class="tlsvg" viewBox="0 0 ${TLW} ${TLH}" width="${TLW}" height="${TLH}">${g}</svg>`;}

/* ── Level circles — 5 circles in a dice-five layout ─────────────────────
   One circle filled per level. Fill order: top-left, bottom-left, center,
   top-right, bottom-right (matches reference: level 2 = both left circles,
   level 3 = left pair + center). Gold = light, blue = water, grey = unfilled. */
const CIRC=[[6.5,6.5],[6.5,19.5],[13,13],[19.5,6.5],[19.5,19.5]];/* TL,BL,C,TR,BR */
function levelCircles(level,color,title){
  const sz=26,r=4.6;let g='';
  CIRC.forEach((c,i)=>{
    g+=`<circle cx="${c[0]}" cy="${c[1]}" r="${r}" fill="${i<level?color:'var(--lvl-off)'}"/>`;});
  return`<svg width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}" style="display:inline-block;vertical-align:middle"><title>${title}</title>${g}</svg>`;}

/* ── Light / water level parsing (unchanged) ─────────────────────────────── */
function parseSunLevel(s){
  if(!s)return 0;const lo=s.toLowerCase();
  let sc=0;
  if(lo.includes('full sun'))sc+=2;if(lo.includes('part sun'))sc+=1;
  if(lo.includes('part shade'))sc-=1;if(lo.includes('full shade'))sc-=2;
  if(!lo.includes('sun')&&!lo.includes('shade'))return 0;
  return sc>=2?4:sc===1?3:sc===0?3:sc===-1?2:1;}
function parseWaterLevel(s){
  if(!s)return 0;const lo=s.toLowerCase().replace(/\//g,' ');
  if((lo.includes('wet')||lo.includes('aquatic'))&&lo.includes('medium'))return 4;
  if((lo.includes('wet')||lo.includes('aquatic'))&&!lo.includes('dry')&&!lo.includes('medium')&&!lo.includes('average'))return 5;
  if(lo.includes('medium')&&lo.includes('dry'))return 2;
  if(lo.includes('average')&&lo.includes('dry'))return 2;
  if(lo.includes('moist')&&!lo.includes('well')&&!lo.includes('dry'))return 4;
  if(lo.includes('medium')||lo.includes('average')||lo.includes('moist'))return 3;
  if(lo.includes('dry'))return 1;
  return 0;}

/* ── Fuzzy search ────────────────────────────────────────────────────────── */
function editDist1(a,b){
  if(a===b)return true;const la=a.length,lb=b.length;
  if(Math.abs(la-lb)>1)return false;
  let d=0,i=0,j=0;
  while(i<la&&j<lb){if(a[i]!==b[j]){if(++d>1)return false;if(la>lb)i++;else if(la<lb)j++;else{i++;j++;}}else{i++;j++;}}
  return d+(la-i)+(lb-j)<=1;}
function fuzzyMatch(query,target){
  if(!query)return true;if(target.includes(query))return true;
  const qToks=query.split(/[\s\-\/]+/).filter(Boolean);
  const tToks=target.split(/[\s\-\/\,\.\'\"]+/).filter(Boolean);
  return qToks.every(qt=>{
    if(tToks.some(tt=>tt.startsWith(qt)))return true;
    if(qt.length>=3)return tToks.some(tt=>editDist1(qt,tt.slice(0,qt.length))||editDist1(qt,tt.slice(0,qt.length+1)));
    return false;});}

/* ── App ─────────────────────────────────────────────────────────────────── */
const state={q:'',tier:'',cat:'',src:'',minc:0,haspoll:false,sort:'com',dir:1};
const CHUNK=60;let view=[],shown=0;
const $=id=>document.getElementById(id);
function srcOf(p){return p[K.src]||p['Source']||''}
function updateCtrlH(){document.documentElement.style.setProperty('--ctrl-h',$('controls').offsetHeight+'px');}
function syncReset(){$('reset').classList.toggle('vis',!!(state.q||state.tier||state.cat||state.src||state.minc>0||state.haspoll));}
function init(){
  fill('f-tier',[...new Set(PLANTS.map(p=>p.tier_group))].sort());
  fill('f-cat',[...new Set(PLANTS.map(p=>p[K.cat]).filter(Boolean))].sort());
  fill('f-src',[...new Set(PLANTS.map(p=>srcOf(p)).filter(Boolean))].sort());
  $('q').oninput=e=>{state.q=e.target.value.toLowerCase().trim();apply();syncReset();};
  $('f-tier').onchange=e=>{state.tier=e.target.value;apply();syncReset();};
  $('f-cat').onchange=e=>{state.cat=e.target.value;apply();syncReset();};
  $('f-src').onchange=e=>{state.src=e.target.value;apply();syncReset();};
  $('f-c').oninput=e=>{state.minc=+e.target.value;$('f-c-v').textContent=e.target.value;apply();syncReset();};
  $('f-haspoll').onchange=e=>{state.haspoll=e.target.checked;apply();syncReset();};
  $('reset').onclick=()=>{
    Object.assign(state,{q:'',tier:'',cat:'',src:'',minc:0,haspoll:false});
    $('q').value='';$('f-tier').value='';$('f-cat').value='';$('f-src').value='';
    $('f-c').value=0;$('f-c-v').textContent='0';$('f-haspoll').checked=false;
    apply();syncReset();};
  $('query-toggle').onclick=()=>{
    const pane=$('query-pane');const open=pane.classList.toggle('open');
    $('qt-arrow').innerHTML=open?'&#9652;':'&#9662;';
    $('query-toggle').classList.toggle('active',open);
    if(open)$('q').focus();};
  document.querySelectorAll('thead .cols th.s').forEach(th=>th.onclick=()=>{
    const k=th.dataset.k;
    if(k==='season')return;/* Season is not sortable */
    state.sort=k;state.dir=1;apply();});
  new IntersectionObserver(es=>{if(es[0].isIntersecting)more();},{rootMargin:'400px'}).observe($('sentinel'));
  window.addEventListener('scroll',()=>$('totop').classList.toggle('vis',scrollY>500));
  window.addEventListener('resize',updateCtrlH);
  updateCtrlH();apply();}
function fill(id,arr){const s=$(id);arr.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;s.appendChild(o)})}
function match(p){
  if(state.q){const h=((p[K.com]||'')+' '+(p[K.lat]||'')).toLowerCase();if(!fuzzyMatch(state.q,h))return false;}
  if(state.tier&&p.tier_group!==state.tier)return false;
  if(state.cat&&p[K.cat]!==state.cat)return false;
  if(state.src&&srcOf(p)!==state.src)return false;
  if(state.minc>0&&!(p.C!=null&&p.C>=state.minc))return false;
  if(state.haspoll&&!(POLL_KEY&&p[POLL_KEY]))return false;
  return true;}
function sortVal(p){const k=state.sort;
  if(k==='width')return parseFloat(p[K.smin]||p[K.smax]||'NaN');
  if(k==='height')return parseFloat(p[K.hmin]||p[K.hmax]||'NaN');
  if(k==='tier_group')return p.tier_group||'';
  return(p[K[k]]||'').toString().toLowerCase();}
function cmp(a,b){let x=sortVal(a),y=sortVal(b);
  if(typeof x==='number'||typeof y==='number'){x=isNaN(x)?Infinity:x;y=isNaN(y)?Infinity:y;return(x-y)*state.dir;}
  return(x<y?-1:x>y?1:0)*state.dir;}
function esc(s){return(s==null?'':String(s)).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function rng(a,b){a=(a||'').trim();b=(b||'').trim();if(!a&&!b)return'';if(a&&b)return a===b?a:`${a}\u2013${b}`;return a||b;}

function rowEl(p){
  const tr=document.createElement('tr');tr.className='row';
  const cm=esc(p[K.com]),lat=esc(p[K.lat]);
  const name=cm?`<span class="com">${cm}</span><span class="lat">${lat}</span>`
              :`<span class="com lat" style="font-style:italic">${lat}</span>`;
  let tier=esc(p.tier_group)||'', cat=esc(p[K.cat])||'';
  /* Highlight exact 'Native' tier only — not 'Native cultivar' etc. */
  if(p.tier_group==='Native')tier=`<mark>Native</mark>`;
  const charCell=`<td class="char-cell">${cat?`<span class="cat-label">${cat}</span>`:''}<span class="tier-label">${tier}</span></td>`;
  const lightLv=parseSunLevel(p[K.light]);
  const waterLv=parseWaterLevel(p[K.water]);
  tr.innerHTML=
    `<td class="name">${name}</td>`+
    charCell+
    /* Vertical rule left of Soil — separates Character | Soil */
    `<td class="sep req">${esc(p[K.soil])||'<span class="empty-c">&middot;</span>'}</td>`+
    `<td class="icon-cell">${lightLv?levelCircles(lightLv,'var(--lvl-gold)',esc(p[K.light])):'<span class="empty-c">&middot;</span>'}</td>`+
    `<td class="icon-cell">${waterLv?levelCircles(waterLv,'var(--lvl-blue)',esc(p[K.water])):'<span class="empty-c">&middot;</span>'}</td>`+
    /* Vertical rule left of Width — groups Width/Height/Habit/Season */
    `<td class="sep dim">${esc(rng(p[K.smin],p[K.smax]))||'<span class="empty-c">&middot;</span>'}</td>`+
    `<td class="dim">${esc(rng(p[K.hmin],p[K.hmax]))||'<span class="empty-c">&middot;</span>'}</td>`+
    `<td class="habit">${esc(p[K.habit])||'<span class="empty-c">&middot;</span>'}</td>`+
    `<td>${timeline(p)}</td>`;
  tr.onclick=()=>toggle(tr,p);return tr;}

function apply(){
  view=PLANTS.filter(match).sort(cmp);shown=0;$('tbody').innerHTML='';
  document.querySelectorAll('thead .cols th.s').forEach(th=>{
    const a=th.querySelector('.ar');if(!a)return;
    a.textContent=th.dataset.k===state.sort?'\u25B2':'';});
  more();}
function more(){
  const next=view.slice(shown,shown+CHUNK);
  const fr=document.createDocumentFragment();
  next.forEach(p=>fr.appendChild(rowEl(p)));
  $('tbody').appendChild(fr);shown+=next.length;}

function toggle(tr,p){
  if(tr.nextSibling?.classList?.contains('detailrow')){tr.nextSibling.remove();return;}
  const dr=document.createElement('tr');dr.className='detailrow';
  const td=document.createElement('td');td.colSpan=9;
  const hide=new Set([K.com,K.lat,K.cat,K.soil,K.light,K.water,K.hmin,K.hmax,K.smin,K.smax,K.habit,'tier_group','C','W']);
  let items='';
  Object.keys(p).forEach(k=>{
    if(hide.has(k)||k.startsWith('Image -')||k==='Drive Image ID')return;
    const v=p[k];if(v==null||v==='')return;
    let cls='dk';if(k.startsWith('[EST]'))cls+=' est';else if(k.startsWith('[REC]'))cls+=' rec';else if(k.startsWith('[DOC]'))cls+=' doc';
    items+=`<div class="di"><span class="${cls}">${esc(k)}</span><span class="dv">${esc(v)}</span></div>`;});
  const cw=`<div class="di"><span class="dk">C / Wetness W [Chicago FQA]</span><span class="dv">${p.C!=null?p.C:'\u2014'} / ${p.W!=null?p.W:'\u2014'}</span></div>`;
  td.innerHTML=`<div class="detail"><div class="flagnote"><span><b style="color:var(--ochre)">[EST]</b> estimated</span><span><b style="color:var(--green-2)">[REC]</b> recommendation</span><span><b style="color:var(--olive)">[DOC]</b> documented</span></div><div class="dgrid">${cw}${items}</div></div>`;
  dr.appendChild(td);tr.after(dr);}

init();
</script></body></html>'''
TPL=TPL.replace('__DATA__',data).replace('__KEYS__',json.dumps(K))
open('/mnt/user-data/outputs/index.html','w').write(TPL)
import os;print('index.html',round(os.path.getsize('/mnt/user-data/outputs/index.html')/1024),'KB')
