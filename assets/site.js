/* Atelier Git · éléments partagés par toutes les pages · réalisé par Titan_gp1 */
(()=>{
'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const APP_VERSION='2.2.0';

/* Liste des leçons pour l'accueil (générée depuis atelier.js au moment de la construction). */
const LESSONS_META=[{"id": "premier", "title": "Votre premier dépôt", "short": "init · add · commit", "level": "Débutant", "xp": 50}, {"id": "zones", "title": "Les trois zones", "short": "status · diff · add", "level": "Débutant", "xp": 50}, {"id": "historique", "title": "Voyager dans l'historique", "short": "log · restore · reset", "level": "Débutant", "xp": 50}, {"id": "branches", "title": "Les branches", "short": "branch · switch", "level": "Intermédiaire", "xp": 50}, {"id": "fusion", "title": "Fusionner des branches", "short": "merge", "level": "Intermédiaire", "xp": 50}, {"id": "conflit", "title": "Résoudre un conflit", "short": "merge · conflit", "level": "Intermédiaire", "xp": 60}, {"id": "distant", "title": "Travailler à plusieurs", "short": "remote · push · pull", "level": "Avancé", "xp": 60}, {"id": "stash", "title": "Mettre de côté", "short": "stash", "level": "Avancé", "xp": 50}, {"id": "rebase", "title": "Un historique linéaire", "short": "rebase", "level": "Avancé", "xp": 60}, {"id": "enquete", "title": "Ignorer et enquêter", "short": ".gitignore · blame", "level": "Intermédiaire", "xp": 50}, {"id": "reparer", "title": "Réparer ses erreurs", "short": "amend · reflog · cherry-pick", "level": "Avancé", "xp": 60}, {"id": "bac", "title": "Bac à sable", "short": "libre", "level": "Libre", "xp": 0}];

/* Défis : identifiants, titres, difficulté et XP. Doit rester aligné sur firebase/firestore.rules. */
const CHALLENGES_META=[
 {id:'d-premier-pas',title:'Premier pas',short:'Créer un dépôt propre en partant de rien',diff:'facile',xp:30},
 {id:'d-oups',title:'Oups, pas ce fichier',short:'Retirer un fichier secret de l\'index',diff:'facile',xp:30},
 {id:'d-version',title:'Version 1.0',short:'Étiqueter le bon commit',diff:'facile',xp:30},
 {id:'d-menage',title:'Grand ménage',short:'Faire ignorer les fichiers inutiles',diff:'moyen',xp:60},
 {id:'d-sauvetage',title:'Sauvetage de branche',short:'Ressusciter une branche supprimée',diff:'moyen',xp:60},
 {id:'d-squash',title:'Une seule histoire',short:'Trois brouillons, un seul commit',diff:'moyen',xp:60},
 {id:'d-double-conflit',title:'Double conflit',short:'Deux fichiers en conflit à résoudre',diff:'difficile',xp:100},
 {id:'d-bon-commit',title:'Le bon commit',short:'Récupérer une seule correction',diff:'difficile',xp:100},
 {id:'d-amend',title:'Message honteux',short:'Réparer le dernier commit sans en ajouter',diff:'difficile',xp:100},
 {id:'d-course',title:'Course contre Léa',short:'Publier sans commit de fusion',diff:'expert',xp:150},
 {id:'d-enquete',title:'Qui a cassé le site ?',short:'Trouver et annuler le commit coupable',diff:'expert',xp:150},
];
const DIFFS={facile:{label:'Facile',n:1},moyen:{label:'Moyen',n:2},difficile:{label:'Difficile',n:3},expert:{label:'Expert',n:4}};

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
/* Sans compte connecté, rien n'est gardé : la progression d'une visite précédente est effacée au chargement. */
try{localStorage.removeItem('atelier-git-progress');if(!sessionStorage.getItem('atelier-git-owner'))sessionStorage.removeItem('atelier-git-progress')}catch(e){}
const forget=()=>{try{sessionStorage.removeItem('atelier-git-progress');sessionStorage.removeItem('atelier-git-owner')}catch(e){}};
function readProgress(){let P={done:{},xp:0,ch:{}};try{const raw=sessionStorage.getItem('atelier-git-progress');if(raw)P=Object.assign(P,JSON.parse(raw))}catch(e){}P.ch=P.ch||{};return P}

/* ----- Animations partagées ----- */
const reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
/* Fait défiler un nombre jusqu'à sa valeur. */
function countUp(el,to,dur=1100,from=0){if(!el)return;el.textContent=to; /* la valeur finale d'abord : visible même si l'animation ne tourne pas */
  if(reduceMotion()||document.hidden||from===to)return;
  const t0=performance.now(),ease=k=>1-Math.pow(1-k,3);
  const step=t=>{const k=Math.min(1,(t-t0)/dur);el.textContent=Math.round(from+(to-from)*ease(k));if(k<1)requestAnimationFrame(step)};requestAnimationFrame(step)}
/* Compteur d'XP de la barre du haut : défile et affiche « +N » quand il monte. */
let shownXp=null;
function showXp(n){const el=$('#xp');if(!el)return;if(shownXp===null||n<=shownXp){el.textContent=n;shownXp=n;return}
  const from=shownXp;shownXp=n;countUp(el,n,900,from);if(reduceMotion())return;
  const box=el.closest('.xp');if(box){const p=document.createElement('span');p.className='xp-pop';p.textContent='+'+(n-from);box.appendChild(p);setTimeout(()=>p.remove(),1300)}}
/* Pluie de confettis aux couleurs du graphe, pour une leçon ou un défi réussi. */
function celebrate(){if(reduceMotion()||document.hidden)return;
  const cv=document.createElement('canvas'),dpr=Math.min(2,devicePixelRatio||1),W=innerWidth,H=innerHeight;cv.className='confetti';cv.width=W*dpr;cv.height=H*dpr;cv.setAttribute('aria-hidden','true');document.body.appendChild(cv);
  const ctx=cv.getContext('2d');ctx.scale(dpr,dpr);const cs=getComputedStyle(document.documentElement);
  const cols=['--lane0','--lane1','--lane2','--lane3','--lane4'].map(v=>cs.getPropertyValue(v).trim()||'#e8492b');
  const parts=Array.from({length:150},()=>({x:W/2+(Math.random()-.5)*160,y:H*.32,vx:(Math.random()-.5)*15,vy:-Math.random()*14-5,w:6+Math.random()*7,h:3+Math.random()*4,r:Math.random()*6.3,vr:(Math.random()-.5)*.45,c:cols[Math.random()*cols.length|0]}));
  const t0=performance.now();const step=t=>{const k=(t-t0)/1700;ctx.clearRect(0,0,W,H);
    for(const p of parts){p.vy+=.4;p.vx*=.985;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;ctx.save();ctx.globalAlpha=Math.max(0,1-k*k);ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.fillStyle=p.c;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore()}
    if(k<1)requestAnimationFrame(step);else cv.remove()};requestAnimationFrame(step);setTimeout(()=>cv.remove(),2500)}
/* Apparition des blocs au défilement (pages de contenu). Sans JavaScript, tout reste visible. */
function reveal(){if(document.body.dataset.page==='atelier'||!('IntersectionObserver' in window)||reduceMotion())return;
  /* Ce qui est déjà à l'écran au chargement reste visible ; seuls les blocs plus bas apparaissent au défilement. */
  const all=[...document.querySelectorAll('.page-main>section,.lgrid li,.steps li,.stat,.dcard,.changelog>div,.facts>div')].filter(e=>!e.classList.contains('rv'));
  const fold=innerHeight*.92,els=all.filter(e=>e.getBoundingClientRect().top>fold);
  all.filter(e=>!els.includes(e)).forEach(e=>e.querySelectorAll('[data-count]').forEach(c=>{const to=+c.dataset.count;if(to)countUp(c,to)}));
  if(!els.length)return;
  let fired=false;const io=new IntersectionObserver(es=>{fired=true;let k=0;for(const e of es){if(!e.isIntersecting)continue;const el=e.target;
      el.style.transitionDelay=Math.min(k++*70,490)+'ms';el.classList.add('rv-in');io.unobserve(el);setTimeout(()=>{el.style.transitionDelay=''},1300);
      el.querySelectorAll('[data-count]').forEach(c=>{const to=+c.dataset.count;if(to)countUp(c,to)})}},{rootMargin:'0px 0px -5% 0px',threshold:.06});
  els.forEach(el=>{el.classList.add('rv');io.observe(el)});
  setTimeout(()=>{if(!fired)els.forEach(el=>el.classList.add('rv-in'))},2500)}

/* ----- Version, XP, thème ----- */
document.querySelectorAll('.ver').forEach(v=>v.textContent='v'+APP_VERSION);
showXp(readProgress().xp);
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
  const lab=$('#fxLabel');if(lab)lab.innerHTML='Effets<span class="fxlvl"> : '+FX_LABEL[l]+'</span>';Refract.setLevel(l);
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
(()=>{let lastT=-Infinity;const allowed=t=>t&&t.closest&&t.closest('[data-allow-paste]'); /* les formulaires de compte acceptent le collage (gestionnaires de mots de passe) */
  const warn=()=>{const n=performance.now();if(n-lastT<2500)return;lastT=n;
    toast('Copier-coller désactivé','Tapez la commande vous-même : c\'est en l\'écrivant qu\'on la retient.')};
  ['copy','cut','paste','drop'].forEach(ev=>document.addEventListener(ev,e=>{if(allowed(e.target))return;e.preventDefault();warn()},true));
  document.addEventListener('dragstart',e=>e.preventDefault(),true);
  document.addEventListener('keydown',e=>{const k=(e.key||'').toLowerCase(),mod=(e.ctrlKey||e.metaKey)&&!e.altKey;
    if(allowed(e.target))return;
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

/* ----- Comptes et classement (Firebase) -----
   Le site reste statique : Firebase Authentication gère les comptes (email ou Google),
   Firestore garde les profils publics du classement.
   Tant que assets/config.js est vide, le site fonctionne normalement, sans compte.
   Les règles de firebase/firestore.rules vérifient chaque écriture : XP exacts, leçons réelles, pseudo unique. */
const Account=(()=>{
  const CFG=window.ATELIER_CONFIG||{},FB=CFG.firebase||null,SDK='https://www.gstatic.com/firebasejs/10.12.2/';
  let enabled=!!(FB&&FB.apiKey&&FB.projectId),api=null,user=null,profile=null,loading=enabled,lastError=null;
  const subs=new Set(),PSEUDO=/^[A-Za-z0-9_.-]{3,20}$/,KNOWN=new Set(LESSONS_META.filter(l=>l.id!=='bac').map(l=>l.id)),KNOWN_CH=new Set(CHALLENGES_META.map(c=>c.id));
  const PSEUDO_MSG='Le pseudo doit faire 3 à 20 caractères : lettres sans accent, chiffres, point, tiret ou tiret bas.';
  const state=()=>({enabled,loading,user,profile,needsPseudo:!!(user&&!profile&&!loading&&!lastError),error:lastError});
  const emit=()=>{renderChip();subs.forEach(f=>{try{f(state())}catch(e){console.error(e)}})};
  const xpOf=ids=>ids.reduce((s,id)=>{const l=LESSONS_META.find(x=>x.id===id);return s+(l?l.xp:0)},0);
  const localDone=()=>{const P=readProgress();return Object.keys(P.done).filter(k=>P.done[k]&&KNOWN.has(k)).sort()};
  const chXp=ids=>ids.reduce((s,id)=>{const c=CHALLENGES_META.find(x=>x.id===id);return s+(c?c.xp:0)},0),xpTotal=(d,c)=>xpOf(d)+chXp(c);
  const localCh=()=>{const P=readProgress();return Object.keys(P.ch).filter(k=>P.ch[k]&&KNOWN_CH.has(k)).sort()};
  const FR={'auth/invalid-credential':'Email ou mot de passe incorrect.','auth/invalid-login-credentials':'Email ou mot de passe incorrect.',
    'auth/wrong-password':'Email ou mot de passe incorrect.','auth/user-not-found':'Email ou mot de passe incorrect.',
    'auth/email-already-in-use':'Un compte existe déjà avec cet email.','auth/weak-password':'Le mot de passe doit faire au moins 6 caractères.',
    'auth/invalid-email':'Cette adresse email n\'est pas valide.','auth/missing-email':'Indiquez votre adresse email.',
    'auth/too-many-requests':'Trop de tentatives. Patientez quelques minutes puis réessayez.',
    'auth/network-request-failed':'Impossible de joindre le serveur. Vérifiez votre connexion.',
    'auth/popup-closed-by-user':'Connexion Google annulée.','auth/cancelled-popup-request':'Connexion Google annulée.',
    'auth/unauthorized-domain':'Ce site n\'est pas encore autorisé pour la connexion Google (Firebase : Authentication, domaines autorisés).',
    'auth/operation-not-allowed':'Ce mode de connexion n\'est pas activé dans Firebase.',
    'auth/requires-recent-login':'Par sécurité, reconnectez-vous puis recommencez.',
    'auth/account-exists-with-different-credential':'Cet email est déjà utilisé avec un mot de passe : connectez-vous avec lui.',
    'permission-denied':'Le serveur a refusé cette action.','unavailable':'Le serveur est momentanément indisponible. Réessayez.'};
  const fr=e=>{const c=(e&&e.code)||'';
    /* Erreurs de configuration du site : elles concernent l'administrateur, pas le visiteur. */
    if(/^auth\/(api-key-not-valid|invalid-api-key)/.test(c))return new Error('La configuration Firebase du site est incorrecte : Google refuse sa clé API. Il faut recopier la configuration depuis la console Firebase.');
    if(c==='auth/configuration-not-found')return new Error('La connexion n’est pas encore activée dans Firebase (Authentication, bouton « Commencer »).');
    return new Error(FR[c]||(e&&e.message)||String(e))};

  /* Adaptateur Firebase : tout ce qui touche au SDK est ici. Les tests locaux le remplacent par un faux. */
  async function firebaseApi(){
    const [A,U,F]=await Promise.all(['firebase-app.js','firebase-auth.js','firebase-firestore.js'].map(f=>import(SDK+f)));
    const app=A.initializeApp(FB),auth=U.getAuth(app),db=F.getFirestore(app);auth.languageCode='fr';
    const prof=uid=>F.doc(db,'profiles',uid),ps=p=>F.doc(db,'pseudos',p.toLowerCase()),col=F.collection(db,'profiles');
    const asUser=u=>u?{id:u.uid,email:u.email||'',name:u.displayName||''}:null;
    return {
      onAuth:cb=>U.onAuthStateChanged(auth,u=>cb(asUser(u))),
      signUpEmail:async(e,p)=>asUser((await U.createUserWithEmailAndPassword(auth,e,p)).user),
      signInEmail:async(e,p)=>asUser((await U.signInWithEmailAndPassword(auth,e,p)).user),
      signInGoogle:async()=>{const pr=new U.GoogleAuthProvider();pr.setCustomParameters({prompt:'select_account'});
        try{return asUser((await U.signInWithPopup(auth,pr)).user)}catch(e){if(e.code==='auth/popup-blocked'){await U.signInWithRedirect(auth,pr);return null}throw e}},
      resetPassword:e=>U.sendPasswordResetEmail(auth,e),
      signOut:()=>U.signOut(auth),
      deleteUser:()=>U.deleteUser(auth.currentUser),
      /* Firebase exige une connexion récente (environ 5 minutes) pour supprimer un compte. */
      recentLogin:()=>{const t=auth.currentUser&&auth.currentUser.metadata.lastSignInTime;return !!t&&Date.now()-Date.parse(t)<4.5*60e3},
      getProfile:async uid=>{const s=await F.getDoc(prof(uid));return s.exists()?s.data():null},
      pseudoTaken:async p=>(await F.getDoc(ps(p))).exists(),
      /* Le champ challenges n'est envoyé que s'il y a des défis : les anciennes règles restent compatibles. */
      createProfile:async(uid,pseudo,done,ch=[])=>{const b=F.writeBatch(db),now=F.serverTimestamp();
        b.set(prof(uid),{pseudo,pseudoLower:pseudo.toLowerCase(),done,...(ch.length?{challenges:ch}:{}),xp:xpTotal(done,ch),lessonsDone:done.length,createdAt:now,updatedAt:now});
        b.set(ps(pseudo),{uid});await b.commit()},
      updateDone:async(uid,done,ch=[])=>{await F.updateDoc(prof(uid),{done,...(ch.length?{challenges:ch}:{}),xp:xpTotal(done,ch),lessonsDone:done.length,updatedAt:F.serverTimestamp()})},
      changePseudo:async(uid,old,pseudo)=>{const b=F.writeBatch(db);
        b.update(prof(uid),{pseudo,pseudoLower:pseudo.toLowerCase(),updatedAt:F.serverTimestamp()});
        if(old.toLowerCase()!==pseudo.toLowerCase()){b.set(ps(pseudo),{uid});b.delete(ps(old))}await b.commit()},
      deleteProfile:async(uid,pseudo)=>{const b=F.writeBatch(db);b.delete(prof(uid));if(pseudo)b.delete(ps(pseudo));await b.commit()},
      top:async n=>(await F.getDocs(F.query(col,F.orderBy('xp','desc'),F.limit(n)))).docs.map(d=>({id:d.id,...d.data()})),
      countAbove:async xp=>(await F.getCountFromServer(F.query(col,F.where('xp','>',xp)))).data().count,
      countAll:async()=>(await F.getCountFromServer(col)).data().count};
  }
  const norm=r=>r?{pseudo:r.pseudo,xp:r.xp||0,lessons_done:r.lessonsDone||0,done:r.done||[],challenges:r.challenges||[],challenges_done:(r.challenges||[]).length}:null;
  const millis=t=>t&&typeof t.toMillis==='function'?t.toMillis():(t instanceof Date?t.getTime():+t||0);

  async function refresh(){if(!user){profile=null;return}try{profile=norm(await api.getProfile(user.id));lastError=null}catch(e){lastError=fr(e).message;profile=null}}
  function connect(a){api=a;enabled=true;loading=true;emit();let first=true;
    api.onAuth(async u=>{user=u;if(!u)forget();else try{sessionStorage.setItem('atelier-git-owner',u.id)}catch(e){}await refresh();if(first){first=false;loading=false}emit();if(user&&profile)sync().catch(()=>{})})}
  async function init(){renderChip();if(!enabled)return;
    try{connect(await firebaseApi())}catch(e){console.error(e);lastError='Le service de comptes ne répond pas. Réessayez plus tard.';loading=false;emit()}}
  const need=()=>{if(!api)throw new Error(enabled?'Le service de comptes se charge encore, réessayez dans un instant.':'Les comptes ne sont pas encore activés sur ce site.')};
  const checkPseudo=p=>{p=String(p||'').trim();if(!PSEUDO.test(p))throw new Error(PSEUDO_MSG);return p};
  async function createFor(u,pseudo){
    if(await api.pseudoTaken(pseudo))throw new Error('Ce pseudo est déjà pris.');
    try{await api.createProfile(u.id,pseudo,localDone(),localCh())}catch(e){throw e.code==='permission-denied'?new Error('Ce pseudo vient d\'être pris. Choisissez-en un autre.'):fr(e)}
    user=u;await refresh();emit();return profile}

  async function signUp(email,password,pseudo){need();pseudo=checkPseudo(pseudo);email=String(email).trim();
    if(!/^\S+@\S+\.\S+$/.test(email))throw new Error('Cette adresse email n\'est pas valide.');
    if(String(password).length<6)throw new Error('Le mot de passe doit faire au moins 6 caractères.');
    if(await api.pseudoTaken(pseudo).catch(e=>{throw fr(e)}))throw new Error('Ce pseudo est déjà pris.');
    let u;try{u=await api.signUpEmail(email,password)}catch(e){throw fr(e)}
    user=u;try{return await createFor(u,pseudo)}catch(e){await refresh();emit();throw new Error(e.message+' Votre compte est créé : choisissez un autre pseudo ci-dessous.')}}
  async function signIn(email,password){need();let u;try{u=await api.signInEmail(String(email).trim(),password)}catch(e){throw fr(e)}
    user=u;await refresh();emit();if(profile)await sync().catch(()=>{});return profile}
  async function signInGoogle(){need();let u;try{u=await api.signInGoogle()}catch(e){throw fr(e)}if(!u)return null;
    user=u;await refresh();emit();if(profile)await sync().catch(()=>{});return {profile,needsPseudo:!profile}}
  async function choosePseudo(p){need();if(!user)throw new Error('Connectez-vous d\'abord.');p=checkPseudo(p);return createFor(user,p)}
  async function resetPassword(email){need();email=String(email||'').trim();if(!/^\S+@\S+\.\S+$/.test(email))throw new Error('Indiquez d\'abord votre adresse email.');
    try{await api.resetPassword(email)}catch(e){if(e.code!=='auth/user-not-found')throw fr(e)}}
  async function signOut(){need();await api.signOut();user=null;profile=null;forget();emit()}

  /* Fusionne la progression du navigateur et celle du compte : une leçon terminée d'un côté l'est des deux. */
  async function sync(){if(!api||!user)return null;if(!profile)await refresh();if(!profile)return null;
    const P=readProgress(),remote=profile.done.filter(id=>KNOWN.has(id)),remoteCh=profile.challenges.filter(id=>KNOWN_CH.has(id));let changed=false;
    remote.forEach(id=>{if(!P.done[id]){P.done[id]=true;changed=true}});
    remoteCh.forEach(id=>{if(!P.ch[id]){P.ch[id]=true;changed=true}});
    if(changed){P.xp=xpTotal(Object.keys(P.done).filter(k=>P.done[k]),Object.keys(P.ch).filter(k=>P.ch[k]));try{sessionStorage.setItem('atelier-git-progress',JSON.stringify(P))}catch(e){}}
    const all=[...new Set([...remote,...localDone()])].sort(),allCh=[...new Set([...remoteCh,...localCh()])].sort();
    if(all.length!==remote.length||allCh.length!==remoteCh.length){try{await api.updateDone(user.id,all,allCh)}catch(e){throw fr(e)}await refresh()}
    emit();return profile}
  async function setPseudo(p){need();p=checkPseudo(p);if(!profile)throw new Error('Profil introuvable.');if(p===profile.pseudo)return profile;
    if(p.toLowerCase()!==profile.pseudo.toLowerCase()&&await api.pseudoTaken(p))throw new Error('Ce pseudo est déjà pris.');
    try{await api.changePseudo(user.id,profile.pseudo,p)}catch(e){throw e.code==='permission-denied'?new Error('Ce pseudo vient d\'être pris. Choisissez-en un autre.'):fr(e)}
    await refresh();emit();return profile}
  async function deleteAccount(){need();if(!user)return;
    if(api.recentLogin&&!api.recentLogin())throw new Error('Par sécurité, la suppression demande une connexion récente. Déconnectez-vous, reconnectez-vous, puis recommencez : rien n’a été effacé.');
    try{await api.deleteProfile(user.id,profile&&profile.pseudo)}catch(e){throw fr(e)}
    try{await api.deleteUser()}catch(e){await refresh();emit();
      if(e.code==='auth/requires-recent-login')throw new Error('Votre profil est retiré du classement. Pour effacer aussi votre compte de connexion, déconnectez-vous, reconnectez-vous puis recommencez.');throw fr(e)}
    user=null;profile=null;emit()}
  async function leaderboard(limit=100){need();let rows;try{rows=await api.top(limit)}catch(e){throw fr(e)}
    return rows.map(r=>({id:r.id,pseudo:r.pseudo,xp:r.xp||0,lessons_done:r.lessonsDone||0,challenges_done:(r.challenges||[]).length,updated:millis(r.updatedAt)}))
      .sort((a,b)=>b.xp-a.xp||a.updated-b.updated)}
  async function rankOf(xp){need();try{return (await api.countAbove(xp))+1}catch(e){throw fr(e)}}
  async function players(){need();try{return await api.countAll()}catch(e){throw fr(e)}}

  /* Bouton du compte dans la barre du haut */
  function renderChip(){const a=$('#acctBtn');if(a){const name=a.querySelector('.acct-name'),av=a.querySelector('.acct-av'),st=state();
      if(user&&profile){name.textContent=profile.pseudo;av.textContent=profile.pseudo[0].toUpperCase();a.classList.add('in');a.title='Votre compte'}
      else if(st.needsPseudo){name.textContent='Choisir un pseudo';av.textContent='';a.classList.add('in');a.title='Dernière étape : votre pseudo'}
      else{name.textContent='Se connecter';av.textContent='';a.classList.remove('in');a.title=enabled?'Créer un compte ou se connecter':'Les comptes arrivent bientôt'}}
    showXp(readProgress().xp)}

  return {init,state,onChange:f=>{subs.add(f);f(state());return()=>subs.delete(f)},signUp,signIn,signInGoogle,choosePseudo,resetPassword,signOut,
    sync,setPseudo,deleteAccount,leaderboard,rankOf,players,PSEUDO,_connect:connect /* utilisé par les tests locaux avec un faux service */}})();
Account.init();

/* ----- Nombre de joueurs inscrits, dans le pied de page de toutes les pages ----- */
(()=>{let asked=false;Account.onChange(st=>{if(asked||!st.enabled||st.loading)return;asked=true;
  Account.players().then(n=>{document.querySelectorAll('[data-players]').forEach(el=>{el.hidden=false;el.innerHTML=`<b>${n}</b> joueur${n>1?'s':''} inscrit${n>1?'s':''}`;countUp(el.querySelector('b'),n,900)});
    document.querySelectorAll('[data-players-sep]').forEach(el=>el.hidden=false);
    document.querySelectorAll('[data-players-count]').forEach(el=>{el.dataset.count=n;countUp(el,n,1200);const l=el.nextElementSibling;if(l)l.textContent=n>1?'joueurs inscrits':'joueur inscrit'})}).catch(()=>{})})})();
setTimeout(reveal,0);

window.Site={APP_VERSION,LESSONS_META,CHALLENGES_META,DIFFS,CHEAT,REFS,toast,esc,readProgress,renderCheat,Refract,setFx,account:Account,celebrate,countUp,showXp,reveal};
})();
