/* Atelier Git · éléments partagés par toutes les pages · réalisé par Titan_gp1 */
(()=>{
'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const APP_VERSION='2.0.0';

/* Liste des leçons pour l'accueil (générée depuis atelier.js au moment de la construction). */
const LESSONS_META=[{"id": "premier", "title": "Votre premier dépôt", "short": "init · add · commit", "level": "Débutant", "xp": 50}, {"id": "zones", "title": "Les trois zones", "short": "status · diff · add", "level": "Débutant", "xp": 50}, {"id": "historique", "title": "Voyager dans l'historique", "short": "log · restore · reset", "level": "Débutant", "xp": 50}, {"id": "branches", "title": "Les branches", "short": "branch · switch", "level": "Intermédiaire", "xp": 50}, {"id": "fusion", "title": "Fusionner des branches", "short": "merge", "level": "Intermédiaire", "xp": 50}, {"id": "conflit", "title": "Résoudre un conflit", "short": "merge · conflit", "level": "Intermédiaire", "xp": 60}, {"id": "distant", "title": "Travailler à plusieurs", "short": "remote · push · pull", "level": "Avancé", "xp": 60}, {"id": "stash", "title": "Mettre de côté", "short": "stash", "level": "Avancé", "xp": 50}, {"id": "rebase", "title": "Un historique linéaire", "short": "rebase", "level": "Avancé", "xp": 60}, {"id": "enquete", "title": "Ignorer et enquêter", "short": ".gitignore · blame", "level": "Intermédiaire", "xp": 50}, {"id": "reparer", "title": "Réparer ses erreurs", "short": "amend · reflog · cherry-pick", "level": "Avancé", "xp": 60}, {"id": "bac", "title": "Bac à sable", "short": "libre", "level": "Libre", "xp": 0}];

/* ----- Aide-mémoire : données communes à la fenêtre de l'atelier et à la page dédiée ----- */
const CHEAT=[
 ['Démarrer',[['git init','Crée un dépôt dans le dossier'],['git clone <url>','Copie un dépôt existant']]],
 ['Préparer un commit',[['git add <fichier>','Ajoute un fichier ou ses modifications'],['git add .','Ajoute tout (sauf ce que .gitignore exclut)'],['git add -p','Choisit les morceaux à indexer','ns'],['git mv <ancien> <nouveau>','Renomme un fichier'],['git rm <fichier>','Supprime un fichier'],['git rm --cached <fichier>','Arrête de suivre un fichier sans le supprimer'],['git restore --staged <fichier>','Désindexe un fichier'],['git reset','Désindexe tout'],['git status','Montre ce qui est prêt'],['git status -s','Version courte']]],
 ['Faire un commit',[['git commit','Ouvre l\'éditeur pour le message'],['git commit -m "message"','Commit avec un message'],['git commit -am "message"','Indexe les fichiers suivis et commite']]],
 ['Branches',[['git switch <nom>','Change de branche'],['git switch -c <nom>','Crée une branche et y va'],['git branch','Liste les branches'],['git branch --sort=-committerdate','Les plus récentes d\'abord'],['git branch -d <nom>','Supprime une branche fusionnée'],['git branch -D <nom>','Force la suppression']]],
 ['Voir les changements',[['git diff','Changements pas encore indexés'],['git diff --staged','Changements indexés'],['git diff HEAD','Les deux à la fois'],['git diff --stat','Résumé par fichier']]],
 ['Comparer des commits',[['git show HEAD','Un commit et ses changements'],['git diff HEAD~2 HEAD','Entre deux commits'],['git diff HEAD~1 <fichier>','Un fichier depuis un commit'],['git show HEAD --stat','Résumé d\'un commit']]],
 ['Annuler des changements',[['git restore <fichier>','Jette les modifications non indexées'],['git restore --staged --worktree <fichier>','Jette tout sur ce fichier'],['git reset --hard','Jette toutes les modifications'],['git clean -n','Liste les fichiers non suivis à supprimer'],['git clean -f','Les supprime'],['git stash','Range les modifications'],['git stash pop','Les ressort']]],
 ['Réécrire l\'historique',[['git reset HEAD^','Annule le dernier commit, garde les fichiers'],['git commit --amend','Corrige le dernier commit'],['git reflog','Toutes les positions passées de HEAD'],['git reset --hard HEAD@{1}','Revient à une position du reflog'],['git rebase -i HEAD~3','Réunit ou réordonne des commits','ns']]],
 ['Enquêter',[['git log --oneline','Historique compact'],['git log --graph --all','Toutes les branches'],['git log <fichier>','Commits qui ont touché un fichier'],['git log --follow <fichier>','Même après un renommage'],['git log -G <texte>','Commits qui ont ajouté ou retiré ce texte'],['git blame <fichier>','Qui a écrit chaque ligne']]],
 ['Combiner des branches',[['git merge <nom>','Fusionne dans la branche active'],['git merge --squash <nom>','Fusionne en un seul commit'],['git rebase main','Rejoue la branche sur main'],['git cherry-pick <commit>','Copie un seul commit ici'],['git merge --abort','Annule une fusion en conflit']]],
 ['Restaurer un ancien fichier',[['git restore --source HEAD~2 <fichier>','Version d\'un ancien commit'],['git checkout HEAD~2 <fichier>','Même chose, ancienne syntaxe']]],
 ['Dépôt distant',[['git remote add origin <url>','Déclare un serveur'],['git push -u origin main','Premier envoi d\'une branche'],['git push','Envoie la branche suivie'],['git push --force-with-lease','Force, mais sans écraser le travail des autres'],['git push --tags','Envoie les étiquettes'],['git fetch','Télécharge sans fusionner'],['git pull','Télécharge et fusionne'],['git pull --rebase','Télécharge et rejoue vos commits']]],
 ['Configurer',[['git config user.name "Nom"','Votre nom d\'auteur'],['git config alias.st status','Crée le raccourci git st'],['git config --list','Toute la configuration'],['cat .git/config','Configuration du dépôt']]],
 ['Fichiers importants',[['echo "*.log" > .gitignore','Ignore tous les fichiers .log'],['cat .gitignore','Liste des motifs ignorés']]],
];
const REFS=[['main','une branche'],['v1.0','une étiquette'],['3e887ab','un hash de commit'],['origin/main','une branche distante'],['HEAD','le commit actuel'],['HEAD~3 ou HEAD^^^','trois commits avant'],['HEAD@{2}','une position du reflog']];
function renderCheat(el){if(!el)return;
  el.innerHTML=CHEAT.map(([h,rows])=>`<section data-sec><h4>${esc(h)}</h4>${rows.map(([c,d,ns])=>`<div class="crow" data-text="${esc((c+' '+d).toLowerCase())}"><code>${esc(c)}</code><span>${esc(d)}${ns?'<span class="ns">non simulé</span>':''}</span></div>`).join('')}</section>`).join('')
    +`<section data-sec class="refs"><h4>Désigner un commit</h4><dl>${REFS.map(([c,d])=>`<dt data-text="${esc((c+' '+d).toLowerCase())}">${esc(c)}</dt><dd>${esc(d)}</dd>`).join('')}</dl></section>`}

/* ----- Notifications ----- */
function toast(title,body,kind){const box=$('#toasts');if(!box)return;const t=document.createElement('div');t.className='toast'+(kind?' '+kind:'');t.innerHTML=`<b>${esc(title)}</b><p>${esc(body)}</p>`;
  box.appendChild(t);setTimeout(()=>{t.style.transition='opacity .4s,transform .4s';t.style.opacity='0';t.style.transform='translateY(10px)';setTimeout(()=>t.remove(),450)},4200)}

/* ----- Progression gardée dans le navigateur ----- */
function readProgress(){let P={done:{},xp:0};try{const raw=localStorage.getItem('atelier-git-progress');if(raw)P=Object.assign(P,JSON.parse(raw))}catch(e){}return P}

/* ----- Version, XP, thème ----- */
document.querySelectorAll('.ver').forEach(v=>v.textContent='v'+APP_VERSION);
{const xp=$('#xp');if(xp)xp.textContent=readProgress().xp}
{const bt=$('#btnTheme');if(bt)bt.onclick=()=>{const t=document.documentElement.dataset.theme;const dark=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;const next=dark?'light':'dark';
  document.documentElement.dataset.theme=next;try{localStorage.setItem('atelier-git-theme',next)}catch(e){}}}

/* ----- Réfraction du verre liquide -----
 * Champ de réfraction porté de liquid-glass-js (https://github.com/dashersw/liquid-glass-js),
 * Copyright (c) 2025 Armagan Amcalar, licence MIT, via le skill liquid-glass. Cette mention accompagne toute copie.
 * Ajout de l'atelier : un flou de givre avant le déplacement, pour que le texte reste lisible sur les grands panneaux.
 * Chromium seulement ; ailleurs le flou CSS reste en place. */
const Refract=(()=>{
  const F={edgeIntensity:.015,rimIntensity:.028,edgeDistance:.5,rimDistance:1.7,cornerBoost:.06,rippleEffect:.26,blurRadius:2};
  const SS=2,MAX_EDGE=1400,BLUR_K=.35,NS='http://www.w3.org/2000/svg';
  const filters=new Map(),state=new Map();let defs=null,nextId=0,winT=0;
  const brands=navigator.userAgentData&&navigator.userAgentData.brands;
  const supported=brands?brands.some(b=>/Chromium|Google Chrome|Microsoft Edge/i.test(b.brand)):/Chrome\//.test(navigator.userAgent);
  const reduce=matchMedia('(prefers-reduced-transparency: reduce)').matches;
  function ensureDefs(){if(!defs||!defs.isConnected){defs=document.createElementNS(NS,'svg');defs.setAttribute('width','0');defs.setAttribute('height','0');defs.setAttribute('aria-hidden','true');defs.style.position='fixed';defs.appendChild(document.createElementNS(NS,'defs'));document.body.appendChild(defs)}return defs.firstChild}
  function bake(w,h,radius,pw,ph){const ss=Math.max(.25,Math.min(SS,MAX_EDGE/Math.max(w,h))),bw=Math.max(1,Math.round(w*ss)),bh=Math.max(1,Math.round(h*ss)),r=radius*ss,minDim=Math.min(w,h);
    const dx=new Float32Array(bw*bh),dy=new Float32Array(bw*bh);let maxAbs=0;
    for(let py=0;py<bh;py++)for(let px=0;px<bw;px++){const cx=(px+.5)/bw,cy=(py+.5)/bh;
      const tx=Math.abs(px+.5-bw/2)-(bw/2-r),ty=Math.abs(py+.5-bh/2)-(bh/2-r);
      const dist=Math.max(-(Math.hypot(Math.max(tx,0),Math.max(ty,0))+Math.min(Math.max(tx,ty),0)-r),0)/ss;
      const rimFall=Math.exp(-dist*F.rimDistance),total=Math.exp(-dist*F.edgeDistance)*F.edgeIntensity+rimFall*F.rimIntensity;
      let nx=cx-.5,ny=cy-.5;const len=Math.hypot(nx,ny);if(len>0){nx/=len;ny/=len}
      const corner=Math.exp(-(Math.max(Math.min(cx,1-cx),Math.min(cy,1-cy))*minDim)*.3)*F.cornerBoost;
      const ripple=Math.sin((dist/minDim)*25)*F.rippleEffect*rimFall;
      const fx=(nx*(total+corner)-ny*ripple)*pw,fy=(ny*(total+corner)+nx*ripple)*ph,i=py*bw+px;
      dx[i]=fx;dy[i]=fy;const m=Math.max(Math.abs(fx),Math.abs(fy));if(m>maxAbs)maxAbs=m}
    const scale=Math.max(maxAbs*2,1e-4),bias=scale*(128/255-.5),cv=document.createElement('canvas');cv.width=bw;cv.height=bh;
    const ctx=cv.getContext('2d'),img=ctx.createImageData(bw,bh),d=img.data,cb=v=>Math.max(0,Math.min(255,Math.round(v)));
    for(let i=0;i<bw*bh;i++){d[i*4]=cb(255*(.5+(dx[i]-bias)/scale));d[i*4+1]=cb(255*(.5+(dy[i]-bias)/scale));d[i*4+2]=128;d[i*4+3]=255}
    ctx.putImageData(img,0,0);return {url:cv.toDataURL('image/png'),scale}}
  function acquire(key,w,h,radius,pw,ph,frost){let e=filters.get(key);if(e&&e.node.isConnected){e.refs++;return e}
    const {url,scale}=bake(w,h,radius,pw,ph),id='lg-'+(nextId++),node=(t,a)=>{const n=document.createElementNS(NS,t);for(const k in a)n.setAttribute(k,a[k]);return n};
    const m=scale/2+3*frost+3*F.blurRadius*BLUR_K,mx=m/w*100,my=m/h*100;
    const f=node('filter',{id,x:-mx+'%',y:-my+'%',width:(100+2*mx)+'%',height:(100+2*my)+'%','color-interpolation-filters':'sRGB'});
    f.append(node('feGaussianBlur',{in:'SourceGraphic',stdDeviation:frost,result:'frost'}),
      node('feImage',{href:url,x:0,y:0,width:w,height:h,preserveAspectRatio:'none',result:'map'}),
      node('feDisplacementMap',{in:'frost',in2:'map',scale,xChannelSelector:'R',yChannelSelector:'G',result:'bent'}),
      node('feGaussianBlur',{in:'bent',stdDeviation:F.blurRadius*BLUR_K,result:'soft'}),
      node('feColorMatrix',{in:'soft',type:'saturate',values:1.6}));
    ensureDefs().appendChild(f);e={id,key,node:f,refs:1};filters.set(key,e);return e}
  function release(s){if(!s.key)return;const e=filters.get(s.key);s.key=null;if(e&&--e.refs<=0){filters.delete(e.key);e.node.remove()}}
  let level='balanced';
  /* Réfraction SVG seulement sur la barre du haut : sur les grands panneaux, Chromium produisait des défauts d'affichage. */
  const allowed=h=>level!=='lite'&&h.classList.contains('topbar');
  function clearHost(h){const s=state.get(h);if(s){clearTimeout(s.t);release(s)}h.style.backdropFilter='';h.classList.remove('refracting')}
  function rebuild(host){const s=state.get(host),w=Math.round(host.offsetWidth),h=Math.round(host.offsetHeight);if(!s||w<2||h<2)return;if(!allowed(host)){clearHost(host);return}
    const cs=getComputedStyle(host).borderTopLeftRadius,rv=parseFloat(cs)||0,radius=Math.min(cs.trim().endsWith('%')?rv/100*Math.min(w,h):rv,Math.min(w,h)/2);
    const frost=+host.dataset.refract||12,pw=innerWidth,ph=innerHeight,key=[w,h,radius,pw,ph,frost].join('|');if(key===s.key)return;
    release(s);const e=acquire(key,w,h,radius,pw,ph,frost);s.key=key;host.style.backdropFilter=`url(#${e.id})`;host.classList.add('refracting')}
  /* La carte se recalcule après une pause, pas à chaque changement de taille (le calcul occupe le fil principal). */
  function schedule(host,now){const s=state.get(host);if(!s)return;clearTimeout(s.t);cancelAnimationFrame(s.raf);const go=()=>{s.raf=requestAnimationFrame(()=>rebuild(host))};if(now||!s.key)go();else s.t=setTimeout(go,260)}
  function setLevel(l){level=l;state.forEach((_,h)=>{if(allowed(h))schedule(h,true);else clearHost(h)})}
  function init(){if(!supported||reduce||!window.ResizeObserver)return;const ro=new ResizeObserver(es=>es.forEach(en=>schedule(en.target)));
    document.querySelectorAll('[data-refract]').forEach(h=>{state.set(h,{key:null,raf:0,t:0});ro.observe(h)});
    addEventListener('resize',()=>{clearTimeout(winT);winT=setTimeout(()=>state.forEach((_,h)=>schedule(h)),180)},{passive:true})}
  return {init,setLevel,count:()=>filters.size,active:()=>supported&&!reduce}})();

/* ----- Niveau des effets : légers, équilibrés, maximum ----- */
const FX_LABEL={lite:'légers',balanced:'équilibrés',max:'maximum'},FX_NEXT={balanced:'max',max:'lite',lite:'balanced'};
let fxLevel='balanced',fxAuto=true;
try{const v=localStorage.getItem('atelier-git-fx');if(v&&FX_LABEL[v]){fxLevel=v;fxAuto=false}}catch(e){}
function setFx(l,user){fxLevel=l;const h=document.documentElement;h.classList.toggle('fx-lite',l==='lite');h.classList.toggle('fx-max',l==='max');
  const lab=$('#fxLabel');if(lab)lab.textContent='Effets : '+FX_LABEL[l];Refract.setLevel(l);
  if(user){fxAuto=false;try{localStorage.setItem('atelier-git-fx',l)}catch(e){}}}
{const b=$('#btnFx');if(b)b.onclick=()=>{setFx(FX_NEXT[fxLevel],true);
  toast('Effets '+FX_LABEL[fxLevel],fxLevel==='lite'?'Panneaux opaques, sans flou : le plus rapide.':fxLevel==='max'?'Flou plus fort et reflet qui suit la souris : le plus beau, et le plus gourmand.':'Verre flouté, réfraction sur la barre du haut : bon équilibre.')}}
Refract.init();
setFx(fxLevel,false);
/* Si le défilement saccade (image médiane au-delà de 24 ms), on passe tout seul en effets légers. */
(()=>{let samples=[],last=0,active=false,stopT=0;
  const tick=t=>{if(!active)return;const d=t-last;last=t;if(d>0&&d<250)samples.push(d);
    if(samples.length>=45){const med=[...samples].sort((a,b)=>a-b)[22];samples=[];
      if(med>24&&fxAuto&&fxLevel!=='lite'){setFx('lite',false);fxAuto=false;try{localStorage.setItem('atelier-git-fx','lite')}catch(e){}
        toast('Effets allégés','La page saccadait sur cet appareil : le verre passe en mode léger. Le bouton « Effets » permet de revenir en arrière.');active=false;return}}
    requestAnimationFrame(tick)};
  document.addEventListener('scroll',()=>{if(!fxAuto||fxLevel==='lite')return;if(!active){active=true;samples=[];last=performance.now();requestAnimationFrame(tick)}
    clearTimeout(stopT);stopT=setTimeout(()=>{active=false},200)},{passive:true,capture:true})})();

/* ----- Reflet qui suit la souris (effets maximum) -----
   Le reflet est un calque à part, déplacé par transform : le panneau n'est jamais repeint. */
(()=>{const seen=new WeakSet();
  /* Le calque est créé à la volée : certains panneaux (la leçon) sont redessinés et le perdraient. */
  const glareOf=p=>{let g=p.querySelector(':scope>.glare');if(!g){g=document.createElement('span');g.className='glare';g.setAttribute('aria-hidden','true');g.appendChild(document.createElement('i'));p.prepend(g)}
    if(!seen.has(p)){seen.add(p);p.addEventListener('pointerleave',()=>p.classList.remove('lit'))}return g.firstChild};
  let raf=0,ev=null;
  document.addEventListener('pointermove',e=>{if(fxLevel!=='max'||e.pointerType==='touch')return;ev=e;if(raf)return;
    raf=requestAnimationFrame(()=>{raf=0;const p=ev.target&&ev.target.closest&&ev.target.closest('.glass');if(!p||p.closest('.overlay'))return;const i=glareOf(p);
      const r=p.getBoundingClientRect();i.style.transform=`translate(${ev.clientX-r.left-220}px,${ev.clientY-r.top-220}px)`;p.classList.add('lit')})},{passive:true})})();

/* ----- Pas de copier-coller : les commandes s'apprennent en les tapant ----- */
(()=>{let lastT=-Infinity;const warn=()=>{const n=performance.now();if(n-lastT<2500)return;lastT=n;
    toast('Copier-coller désactivé','Tapez la commande vous-même : c\'est en l\'écrivant qu\'on la retient.')};
  ['copy','cut','paste','drop'].forEach(ev=>document.addEventListener(ev,e=>{e.preventDefault();warn()},true));
  document.addEventListener('dragstart',e=>e.preventDefault(),true);
  document.addEventListener('keydown',e=>{const k=(e.key||'').toLowerCase(),mod=(e.ctrlKey||e.metaKey)&&!e.altKey;
    if(k==='c'&&e.ctrlKey&&e.target&&e.target.id==='cmd')return; /* Ctrl+C du terminal : géré par l'atelier */
    if(mod&&(k==='c'||k==='v'||k==='x'||k==='insert')){e.preventDefault();warn();return}
    if(e.shiftKey&&k==='insert'){e.preventDefault();warn()}},true)})();

/* ----- Écran de chargement : une fois par visite ----- */
(()=>{const sp=$('#splash');if(!sp)return;
  if(document.documentElement.classList.contains('no-splash')){sp.remove();return}
  try{sessionStorage.setItem('atelier-git-splash','1')}catch(e){}
  const bar=$('#splashBar'),st=$('#splashStatus'),t0=performance.now(),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const step=(p,txt)=>{bar.style.width=p+'%';if(txt)st.textContent=txt};
  setTimeout(()=>step(30,'$ git clone atelier-git'),60);
  const fonts=document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve();
  const loaded=document.readyState==='complete'?Promise.resolve():new Promise(r=>addEventListener('load',r,{once:true}));
  fonts.then(()=>setTimeout(()=>step(65,'Chargement des leçons…'),300));
  Promise.race([Promise.all([fonts,loaded]),new Promise(r=>setTimeout(r,3500))]).then(()=>{
    const wait=Math.max(0,(reduce?300:1500)-(performance.now()-t0));
    setTimeout(()=>step(100,'Prêt.'),Math.max(0,wait-450));
    setTimeout(()=>{sp.classList.add('out');setTimeout(()=>{sp.remove();const c=$('#cmd');if(c&&matchMedia('(hover: hover)').matches&&!document.querySelector('.overlay:not([hidden])'))c.focus({preventScroll:true})},650)},wait)})})();

window.Site={APP_VERSION,LESSONS_META,CHEAT,REFS,toast,esc,readProgress,renderCheat,Refract,setFx};
})();
