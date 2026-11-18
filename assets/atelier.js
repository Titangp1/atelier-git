/* Atelier Git · moteur Git simulé, leçons et terminal · réalisé par Titan_gp1 */
(()=>{
'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const SERVER_URL='https://github.com/equipe/site.git';
const APP_VERSION=Site.APP_VERSION;
const toast=(a,b,c)=>Site.toast(a,b,c);

/* =========================================================
   Moteur Git simulé
   ========================================================= */
let S, clock=0, SILENT=false;
function fresh(){return {work:{},repo:null,hist:[],objects:{},servers:{},flags:{},config:{}}}
const C=id=>S.objects[id];
function newRepo(){return {branches:{},head:{type:'branch',name:'main'},index:{},tags:{},remotes:{},tracking:{},upstream:{},stash:[],merging:null,prev:null,reflog:[]}}
function headId(){const r=S.repo;if(!r)return null;return r.head.type==='branch'?(r.branches[r.head.name]??null):r.head.id}
function headLabel(){const r=S.repo;return r.head.type==='branch'?r.head.name:r.head.id}
function headTree(){const h=headId();return h?{...C(h).tree}:{}}
function curBranch(){return S.repo&&S.repo.head.type==='branch'?S.repo.head.name:null}
function ancestors(id){const seen=new Set(),st=id?[id]:[];while(st.length){const x=st.pop();if(seen.has(x)||!C(x))continue;seen.add(x);C(x).parents.forEach(p=>st.push(p))}return seen}
const isAnc=(a,b)=>!!a&&!!b&&ancestors(b).has(a);
function mergeBase(a,b){const A=ancestors(a);let best=null;for(const x of ancestors(b))if(A.has(x)&&(!best||C(x).time>C(best).time))best=x;return best}
function hid(){let s;do{const b=new Uint8Array(4);(window.crypto&&crypto.getRandomValues)?crypto.getRandomValues(b):b.forEach((_,i)=>b[i]=Math.random()*256|0);s=[...b].map(x=>x.toString(16).padStart(2,'0')).join('').slice(0,7)}while(S.objects[s]);return s}
function clean(t){for(const k of Object.keys(t))if(t[k]===undefined)delete t[k];return t}
function mkCommit(msg,parents,tree,author){const id=hid();S.objects[id]={id,msg,parents,tree:clean({...tree}),time:++clock,author:author||S.config['user.name']||'Vous'};return id}
function setHead(id){const r=S.repo;if(r.head.type==='branch')r.branches[r.head.name]=id;else r.head.id=id}
function sameTree(a,b){const ka=Object.keys(a),kb=Object.keys(b);return ka.length===kb.length&&ka.every(k=>has(b,k)&&a[k]===b[k])}
function changes(){const H=headTree(),I=S.repo.index,W=S.work,staged=[],unstaged=[],untracked=[],ignored=[];
  const files=[...new Set([...Object.keys(H),...Object.keys(I),...Object.keys(W)])].sort();
  for(const f of files){
    if(I[f]!==H[f])staged.push([f,H[f]===undefined?'new file':I[f]===undefined?'deleted':'modified']);
    if(I[f]!==undefined){if(W[f]===undefined)unstaged.push([f,'deleted']);else if(W[f]!==I[f])unstaged.push([f,'modified'])}
    else if(W[f]!==undefined){if(isIgnored(f))ignored.push(f);else untracked.push(f)}
  }return {staged,unstaged,untracked,ignored}}
function ignoreRules(){const g=S.work['.gitignore'];if(!g)return [];
  return g.split('\n').map(l=>l.trim()).filter(l=>l&&!l.startsWith('#')).map(l=>{const neg=l.startsWith('!');const pat=(neg?l.slice(1):l).replace(/^\//,'').replace(/\/$/,'');
    const src=pat.replace(/[.+^${}()|[\]\\]/g,'\\$&').replace(/\*\*/g,'\u0000').replace(/\*/g,'[^/]*').replace(/\?/g,'.').replace(/\u0000/g,'.*');
    return {neg,re:new RegExp('^'+src+'$')}})}
function isIgnored(f){let ig=false;for(const rule of ignoreRules())if(rule.re.test(f))ig=!rule.neg;return ig}
function resolve(ref){const r=S.repo;if(!r||!ref)return null;let base=ref,n=0;
  const rl=ref.match(/^(?:HEAD)?@\{(\d+)\}$/);if(rl){const e=r.reflog[+rl[1]];return e?e.id:null}
  const m=ref.match(/^(.+?)((?:~\d*|\^)+)$/);
  if(m){base=m[1];for(const t of m[2].match(/~\d*|\^/g))n+=t==='^'?1:(t.length>1?parseInt(t.slice(1),10):1)}
  let id=null;
  if(base==='HEAD'||base==='@')id=headId();
  else if(has(r.branches,base))id=r.branches[base];
  else if(has(r.tags,base))id=r.tags[base];
  else if(has(r.tracking,base))id=r.tracking[base];
  else if(/^[0-9a-f]{4,7}$/.test(base))id=Object.keys(S.objects).find(k=>k.startsWith(base))||null;
  if(!id)return null;
  for(let i=0;i<n;i++){id=C(id).parents[0];if(!id)return null}
  return id}
function lineDiff(a,b){const A=a?a.split('\n'):[],B=b?b.split('\n'):[],n=A.length,m=B.length;
  const dp=Array.from({length:n+1},()=>new Array(m+1).fill(0));
  for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=A[i]===B[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
  const out=[];let i=0,j=0;
  while(i<n&&j<m){if(A[i]===B[j]){out.push([' ',A[i]]);i++;j++}else if(dp[i+1][j]>=dp[i][j+1])out.push(['-',A[i++]]);else out.push(['+',B[j++]])}
  while(i<n)out.push(['-',A[i++]]);while(j<m)out.push(['+',B[j++]]);return out}
function statLine(A,B){let f=0,ins=0,del=0;const extra=[];
  for(const k of [...new Set([...Object.keys(A),...Object.keys(B)])].sort()){if(A[k]===B[k])continue;f++;
    for(const [t] of lineDiff(A[k],B[k])){if(t==='+')ins++;else if(t==='-')del++}
    if(A[k]===undefined)extra.push(` create mode 100644 ${k}`);if(B[k]===undefined)extra.push(` delete mode 100644 ${k}`)}
  let s=` ${f} file${f>1?'s':''} changed`;if(ins)s+=`, ${ins} insertion${ins>1?'s':''}(+)`;if(del)s+=`, ${del} deletion${del>1?'s':''}(-)`;
  return [s,...extra].join('\n')}
/* Change de commit en gardant les modifications locales quand c'est sans risque. Renvoie la liste des fichiers bloquants. */
function switchTo(targetId){const H=headTree(),T=targetId?{...C(targetId).tree}:{},I=S.repo.index,W=S.work;
  const nW={},nI={},bad=[];
  for(const f of new Set([...Object.keys(H),...Object.keys(I),...Object.keys(W),...Object.keys(T)])){
    const isClean=W[f]===H[f]&&I[f]===H[f];
    if(isClean){nW[f]=T[f];nI[f]=T[f]}else{if(T[f]!==H[f])bad.push(f);nW[f]=W[f];nI[f]=I[f]}}
  if(bad.length)return bad;S.work=clean(nW);S.repo.index=clean(nI);return null}
function overwriteErr(bad,what){err(`error: Your local changes to the following files would be overwritten by ${what}:\n\t${bad.join('\n\t')}\nPlease commit your changes or stash them before you ${what==='checkout'?'switch branches':what}.\nAborting`);
  tip('Git refuse pour ne pas écraser votre travail. Faites un commit, ou mettez vos changements de côté avec git stash.');return false}
function fakeDate(t){const d=new Date(Date.UTC(2026,10,18,9,0)+t*7*60000);const D=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${D[d.getUTCDay()]} ${M[d.getUTCMonth()]} ${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}:00 2026 +0100`}
function decor(id){const r=S.repo,segs=[];const push=(t,c)=>{if(segs.length)segs.push([', ','c-hash']);segs.push([t,c])};
  const cb=curBranch();
  if(r.head.type==='detached'&&r.head.id===id)push('HEAD','c-head');
  if(cb&&r.branches[cb]===id)push('HEAD -> '+cb,'c-head');
  for(const [b,v] of Object.entries(r.branches))if(v===id&&b!==cb)push(b,'c-ok');
  for(const [b,v] of Object.entries(r.tracking))if(v===id)push(b,'c-err');
  for(const [t,v] of Object.entries(r.tags))if(v===id)push('tag: '+t,'c-warn');
  return segs.length?[[' (','c-hash'],...segs,[')','c-hash']]:[]}
function trackInfo(local,remote,name){if(!remote)return `Your branch is based on '${name}', but the upstream is gone.`;
  if(local===remote)return `Your branch is up to date with '${name}'.`;
  const L=ancestors(local),R=ancestors(remote);const ahead=[...L].filter(x=>!R.has(x)).length,behind=[...R].filter(x=>!L.has(x)).length;
  if(ahead&&!behind)return `Your branch is ahead of '${name}' by ${ahead} commit${ahead>1?'s':''}.\n  (use "git push" to publish your local commits)`;
  if(behind&&!ahead)return `Your branch is behind '${name}' by ${behind} commit${behind>1?'s':''}, and can be fast-forwarded.\n  (use "git pull" to update your local branch)`;
  return `Your branch and '${name}' have diverged,\nand have ${ahead} and ${behind} different commits each, respectively.`}
function printDiff(A,B,only){let any=false;
  for(const f of [...new Set([...Object.keys(A),...Object.keys(B)])].sort()){
    if(only&&f!==only)continue;if(A[f]===B[f])continue;any=true;
    o('diff --git a/'+f+' b/'+f,'c-bold');
    if(A[f]===undefined)o('new file mode 100644','c-bold');if(B[f]===undefined)o('deleted file mode 100644','c-bold');
    o(A[f]===undefined?'--- /dev/null':'--- a/'+f,'c-bold');o(B[f]===undefined?'+++ /dev/null':'+++ b/'+f,'c-bold');
    const d=lineDiff(A[f],B[f]);const na=d.filter(x=>x[0]!=='+').length,nb=d.filter(x=>x[0]!=='-').length;
    o(`@@ -${na?1:0},${na} +${nb?1:0},${nb} @@`,'c-hunk');
    for(const [t,l] of d)o(t+l,t==='+'?'c-ok':t==='-'?'c-err':'')}
  return any}
const validName=n=>/^[A-Za-z0-9][\w.\-/]*$/.test(n)&&!n.endsWith('/')&&!n.includes('..');
const validFile=f=>/^[\w.\-]+$/.test(f)&&f!=='.git'&&f!=='.'&&f!=='..'&&!f.startsWith('__');
function globRe(p){return new RegExp('^'+p.replace(/[.+^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*')+'$')}
function lev(a,b){const d=Array.from({length:a.length+1},(_,i)=>[i,...new Array(b.length).fill(0)]);for(let j=1;j<=b.length;j++)d[0][j]=j;
  for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[a.length][b.length]}
function closest(w,list){let best=null,bd=3;for(const x of list){const d=lev(w,x);if(d<bd){bd=d;best=x}}return best}

/* ----- Sortie terminal ----- */
const outEl=$('#out');
let lnBatch=0;
function o(x,cls){if(SILENT)return;const d=document.createElement('div');d.className='ln'+(cls?' '+cls:'');
  if(!lnBatch++)queueMicrotask(()=>{lnBatch=0});if(lnBatch<=40){d.classList.add('in');if(lnBatch>1)d.style.animationDelay=Math.min(lnBatch-1,30)*10+'ms'}
  if(Array.isArray(x)){for(const [t,c] of x){const s=document.createElement('span');if(c)s.className=c;s.textContent=t;d.appendChild(s)}}else d.textContent=x;
  outEl.appendChild(d);if(outEl.childElementCount>700)for(let i=0;i<150&&outEl.firstChild;i++)outEl.firstChild.remove()}
function err(x){o(x,'c-err');return false}
function tip(x){o(x,'c-tip')}

/* ----- Commandes Git ----- */
const G={};
G.help=()=>{o('Commandes Git disponibles dans l\'atelier :');o('  init clone config status add rm mv commit restore reset clean\n  log show diff blame reflog branch switch checkout merge rebase cherry-pick\n  revert stash tag remote push fetch pull','c-ok');tip('Tapez help pour les commandes du terminal (ls, cat, echo, edit…). L\'aide-mémoire liste les options.');return true};
G.config=a=>{if(a.includes('--list')||a.includes('-l')){Object.entries(S.config).forEach(([k,v])=>o(k+'='+v));return true}
  const k=a.filter(x=>!x.startsWith('--'));if(k.length===1){if(S.config[k[0]])o(S.config[k[0]]);return true}if(k.length>=2)S.config[k[0]]=k.slice(1).join(' ');return true};
G.init=()=>{if(S.repo){o('Reinitialized existing Git repository in /home/vous/projet/.git/');return true}
  S.repo=newRepo();o('Initialized empty Git repository in /home/vous/projet/.git/');return true};
G.status=(a=[])=>{const r=S.repo,short=a.includes('-s')||a.includes('--short'),showIg=a.includes('--ignored');
  const ch=changes(),unres=r.merging?r.merging.unresolved:[],H=headTree(),I=r.index;
  const st=ch.staged.filter(x=>!unres.includes(x[0])).map(x=>[...x]),un=ch.unstaged.filter(x=>!unres.includes(x[0]));
  for(const d of st.filter(x=>x[1]==='deleted')){const n=st.find(x=>x[1]==='new file'&&I[x[0]]===H[d[0]]);if(n){d[1]='renamed';d[0]=d[0]+' -> '+n[0];st.splice(st.indexOf(n),1)}}
  if(short){const code={'new file':'A','modified':'M','deleted':'D','renamed':'R'},rows=new Map();
    st.forEach(([f,k])=>rows.set(f,[code[k],' ']));un.forEach(([f,k])=>{const e=rows.get(f)||[' ',' '];e[1]=k==='deleted'?'D':'M';rows.set(f,e)});
    unres.forEach(f=>rows.set(f,['U','U']));
    [...rows.keys()].sort().forEach(f=>{const [x,y]=rows.get(f);o([[x,'c-ok'],[y,'c-err'],[' '+f,'']])});
    ch.untracked.forEach(f=>o('?? '+f,'c-err'));if(showIg)ch.ignored.forEach(f=>o('!! '+f,'c-dim'));return true}
  o(r.head.type==='branch'?`On branch ${r.head.name}`:[[`HEAD detached at ${r.head.id}`,'c-err']]);
  const b=curBranch(),up=b&&r.upstream[b];if(up&&headId())o(trackInfo(headId(),r.tracking[up+'/'+b],up+'/'+b));
  if(!headId())o('\nNo commits yet');
  if(r.merging){if(unres.length)o('You have unmerged paths.\n  (fix conflicts and run "git commit")\n  (use "git merge --abort" to abort the merge)');else o('All conflicts fixed but you are still merging.\n  (use "git commit" to conclude merge)')}
  if(st.length){o('\nChanges to be committed:\n  (use "git restore --staged <file>..." to unstage)');st.forEach(([f,k])=>o(`\t${(k+':').padEnd(12)}${f}`,'c-ok'))}
  if(unres.length){o('\nUnmerged paths:\n  (use "git add <file>..." to mark resolution)');unres.forEach(f=>o(`\tboth modified:   ${f}`,'c-err'))}
  if(un.length){o('\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n  (use "git restore <file>..." to discard changes in working directory)');un.forEach(([f,k])=>o(`\t${(k+':').padEnd(12)}${f}`,'c-err'))}
  if(ch.untracked.length){o('\nUntracked files:\n  (use "git add <file>..." to include in what will be committed)');ch.untracked.forEach(f=>o('\t'+f,'c-err'))}
  if(showIg&&ch.ignored.length){o('\nIgnored files:\n  (use "git add -f <file>..." to include in what will be committed)');ch.ignored.forEach(f=>o('\t'+f,'c-dim'))}
  if(!st.length&&!un.length&&!unres.length){if(ch.untracked.length)o('\nnothing added to commit but untracked files present (use "git add" to track)');else if(!r.merging)o(headId()?'\nnothing to commit, working tree clean':'\nnothing to commit (create/copy files and use "git add" to track)')}
  else if(!st.length&&un.length)o('\nno changes added to commit (use "git add" and/or "git commit -a")');
  return true};
G.add=a=>{const r=S.repo;
  if(a.includes('-p')||a.includes('--patch')){err("error: le mode interactif de git add -p n'existe pas dans l'atelier");tip('Dans le vrai Git, -p découpe vos changements en morceaux et demande pour chacun s\'il faut l\'indexer (y pour oui, n pour non).');return false}
  if(!a.length){o('Nothing specified, nothing added.\nhint: Maybe you wanted to say \'git add .\'?','c-warn');return true}
  const all=new Set([...Object.keys(S.work),...Object.keys(r.index)]),force=a.includes('-f')||a.includes('--force');let files=[];
  const skipIg=f=>force||has(r.index,f)||!isIgnored(f);
  if(a.some(x=>x==='.'||x==='-A'||x==='--all'||x==='*'))files=[...all].filter(skipIg);
  else for(const p of a){if(p.startsWith('-'))continue;
    if(p.includes('*')){const re=globRe(p),m=[...all].filter(f=>re.test(f)&&skipIg(f));if(!m.length)return err(`fatal: pathspec '${p}' did not match any files`);files.push(...m)}
    else if(all.has(p)){if(!skipIg(p)){err(`The following paths are ignored by one of your .gitignore files:\n${p}\nhint: Use -f if you really want to add them.`);return false}files.push(p)}else return err(`fatal: pathspec '${p}' did not match any files`)}
  for(const f of files){if(has(S.work,f))r.index[f]=S.work[f];else delete r.index[f];
    if(r.merging){const i=r.merging.unresolved.indexOf(f);if(i>=0){r.merging.unresolved.splice(i,1);
      if(/^(<<<<<<<|=======|>>>>>>>)/m.test(S.work[f]||''))tip(`${f} contient encore des marqueurs de conflit. Git l'accepte quand même : vérifiez avec cat ${f}.`)}}}
  return true};
G.rm=a=>{const r=S.repo,cached=a.includes('--cached'),files=a.filter(x=>!x.startsWith('-'));if(!files.length)return err('usage: git rm [--cached] <file>...');
  for(const f of files){if(!has(r.index,f))return err(`fatal: pathspec '${f}' did not match any files`);delete r.index[f];if(!cached)delete S.work[f];o(`rm '${f}'`)}return true};
G.mv=a=>{const r=S.repo,args=a.filter(x=>!x.startsWith('-')),[src,dst]=args;if(!src||!dst)return err('usage: git mv <source> <destination>');
  if(!has(r.index,src))return err(`fatal: not under version control, source=${src}, destination=${dst}`);
  if(!has(S.work,src))return err(`fatal: bad source, source=${src}, destination=${dst}`);
  if(has(S.work,dst)&&!a.includes('-f'))return err(`fatal: destination exists, source=${src}, destination=${dst}`);
  if(!validFile(dst))return err(`fatal: nom de fichier refusé dans l'atelier : ${dst}`);
  S.work[dst]=S.work[src];delete S.work[src];r.index[dst]=r.index[src];delete r.index[src];return true};
G.clean=a=>{const fl=a.filter(x=>/^-[a-z]+$/.test(x)).join('');const dry=fl.includes('n')||a.includes('--dry-run'),force=fl.includes('f')||a.includes('--force'),withIg=fl.includes('x');
  if(fl.includes('i')){err("error: le mode interactif (-i) n'existe pas dans l'atelier");return false}
  if(!dry&&!force){err('fatal: clean.requireForce is true and -f not given: refusing to clean');tip('Par sécurité, git clean exige -f. Regardez d\'abord ce qui partirait avec git clean -n.');return false}
  const ch=changes(),list=[...ch.untracked,...(withIg?ch.ignored:[])].sort();
  for(const f of list){if(dry)o('Would remove '+f);else{o('Removing '+f);delete S.work[f]}}return true};
function recordReflog(sub,args,before){const r=S.repo,id=headId();if(!id)return;if(before&&before.id===id&&before.label===headLabel())return;
  const c=C(id),first=c.msg.split('\n')[0],lab=headLabel(),ref=args.find(x=>!x.startsWith('-'));let msg;
  if(sub==='commit')msg=`commit${args.includes('--amend')?' (amend)':!before||!before.id?' (initial)':c.parents.length>1?' (merge)':''}: ${first}`;
  else if(sub==='switch'||sub==='checkout')msg=`checkout: moving from ${before&&before.label||'main'} to ${lab}`;
  else if(sub==='reset')msg=`reset: moving to ${ref||'HEAD'}`;
  else if(sub==='merge'||sub==='pull')msg=`${sub==='merge'?'merge '+ref:'pull'}: ${c.parents.length>1?"Merge made by the 'ort' strategy.":'Fast-forward'}`;
  else if(sub==='rebase')msg=`rebase (finish): returning to refs/heads/${lab}`;
  else if(sub==='clone')msg=`clone: from ${ref}`;
  else msg=`${sub}: ${first}`;
  r.reflog.unshift({id,msg})}
G.reflog=a=>{const r=S.repo,sub=a.find(x=>!x.startsWith('-'));
  if(sub&&sub!=='show'&&sub!=='HEAD'&&!has(r.branches,sub))return err(`fatal: ambiguous argument '${sub}': unknown revision or path not in the working tree.`);
  if(!r.reflog.length)return err(`fatal: your current branch '${curBranch()||'HEAD'}' does not have any commits yet`);
  r.reflog.forEach((e,i)=>o([[e.id,'c-hash'],...decor(e.id),[` HEAD@{${i}}: ${e.msg}`,'']]));
  if(!S.flags.reflogTip){S.flags.reflogTip=true;tip('Chaque ligne est une position passée de HEAD. Revenez à l\'une d\'elles avec git reset --hard HEAD@{n} (ou son hash).')}return true};
G.blame=a=>{const f=a.find(x=>!x.startsWith('-'));if(!f)return err('usage: git blame <file>');const h=headId();if(!h)return err("fatal: no such ref: HEAD");
  const cur=C(h).tree[f];if(cur===undefined)return err(`fatal: no such path '${f}' in HEAD`);
  const chain=[];let id=h;while(id){chain.push(C(id));id=C(id).parents[0]}
  const w=Math.max(...chain.map(c=>c.author.length));
  cur.split('\n').forEach((ln,i)=>{let origin=chain[0];for(const c of chain){const t=c.tree[f];if(t!==undefined&&t.split('\n').includes(ln))origin=c;else break}
    o([[origin.id,'c-hash'],[` (${origin.author.padEnd(w)} ${fakeDate(origin.time).slice(4,16)} ${String(i+1).padStart(2)}) `,'c-dim'],[ln,'']])});
  if(has(S.work,f)&&S.work[f]!==cur)tip('blame montre la version du dernier commit : vos modifications non commitées n\'y sont pas.');return true};
G['cherry-pick']=a=>{const ref=a.find(x=>!x.startsWith('-'));if(!ref)return err('usage: git cherry-pick <commit>');const id=resolve(ref);if(!id)return err(`fatal: bad revision '${ref}'`);
  const c=C(id);if(c.parents.length>1)return err(`error: commit ${id} is a merge but no -m option was given.\nfatal: cherry-pick failed`);
  const h=headId();if(!h)return err('fatal: no commits yet');const ch=changes();
  if(ch.staged.length||ch.unstaged.length)return err('error: your local changes would be overwritten by cherry-pick.\nhint: commit your changes or stash them to proceed.\nfatal: cherry-pick failed');
  const pt=c.parents[0]?C(c.parents[0]).tree:{},T=headTree(),old=headTree();
  for(const f of new Set([...Object.keys(pt),...Object.keys(c.tree)])){if(pt[f]===c.tree[f])continue;
    if(T[f]!==pt[f]&&T[f]!==c.tree[f]){err(`error: could not apply ${id}... ${c.msg.split('\n')[0]}\nCONFLICT (content): Merge conflict in ${f}`);tip('Ce fichier a changé différemment ici. L\'atelier annule le cherry-pick dans ce cas : rien n\'a été modifié.');return false}
    T[f]=c.tree[f]}
  clean(T);if(sameTree(T,old)){o('The previous cherry-pick is now empty, possibly due to conflict resolution.');return true}
  const nid=mkCommit(c.msg,[h],T,c.author),bad=switchTo(nid);if(bad)return overwriteErr(bad,'cherry-pick');setHead(nid);
  o(`[${curBranch()||'detached HEAD'} ${nid}] ${c.msg.split('\n')[0]}`);o(' Date: '+fakeDate(c.time));o(statLine(old,T));return true};
function statLines(A,B){const rows=[];
  for(const f of [...new Set([...Object.keys(A),...Object.keys(B)])].sort()){if(A[f]===B[f])continue;let ins=0,del=0;for(const [t] of lineDiff(A[f],B[f])){if(t==='+')ins++;else if(t==='-')del++}rows.push([f,ins,del])}
  const w=Math.max(0,...rows.map(x=>x[0].length));
  rows.forEach(([f,i,d])=>o([[' '+f.padEnd(w)+' | '+String(i+d).padStart(2)+' ',''],['+'.repeat(Math.min(i,30)),'c-ok'],['-'.repeat(Math.min(d,30)),'c-err']]));
  if(rows.length)o(statLine(A,B).split('\n')[0]);return rows.length>0}
G.commit=a=>{const r=S.repo;const msgs=[];let all=false,amend=false;
  for(let i=0;i<a.length;i++){const x=a[i];
    if(x==='-m'||x==='--message'){if(a[i+1]===undefined)return err("error: switch `m' requires a value");msgs.push(a[++i])}
    else if(x==='-a'||x==='--all')all=true;
    else if(x==='-am'||x==='-ma'){all=true;if(a[i+1]===undefined)return err("error: switch `m' requires a value");msgs.push(a[++i])}
    else if(x==='--amend')amend=true;
    else if(x.startsWith('-m')&&x.length>2)msgs.push(x.slice(2));
    else return err(`error: pathspec '${x}' did not match any file(s) known to git`)}
  if(r.merging&&r.merging.unresolved.length){err("error: Committing is not possible because you have unmerged files.\nhint: Fix them up in the work tree, and then use 'git add <file>'\nhint: as appropriate to mark resolution and make a commit.\nfatal: Exiting because of an unresolved conflict.");return false}
  if(all)for(const f of Object.keys(r.index)){if(has(S.work,f))r.index[f]=S.work[f];else delete r.index[f]}
  const h=headId();if(amend&&!h)return err('fatal: You have nothing to amend.');
  if(sameTree(headTree(),r.index)&&!r.merging&&!amend){const ch=changes();
    if(ch.unstaged.length)o('no changes added to commit (use "git add" and/or "git commit -a")');
    else if(ch.untracked.length)o('nothing added to commit but untracked files present (use "git add" to track)');
    else o('nothing to commit, working tree clean');
    if(ch.unstaged.length||ch.untracked.length)tip('Rien n\'est dans l\'index. Ajoutez d\'abord vos fichiers avec git add.');return true}
  let msg=msgs.join('\n\n');
  if(!msg&&r.merging)msg=mergeMsg(r.merging.name);
  if(!msg&&amend)msg=C(h).msg;
  if(!msg){openEditor('COMMIT_EDITMSG',{text:'\n# Écrivez le message du commit sur la première ligne, puis enregistrez.\n# Les lignes qui commencent par # sont ignorées.\n# Un message vide annule le commit.',
      onSave:txt=>{const m=txt.split('\n').filter(l=>!l.startsWith('#')).join('\n').trim();if(!m){err('Aborting commit due to empty commit message.');return}
        const before={id:headId(),label:headLabel()};finishCommit(m,amend);recordReflog('commit',amend?['--amend']:[],before)}});
    o('hint: Waiting for your editor to close the file...','c-dim');return true}
  return finishCommit(msg,amend)};
function finishCommit(msg,amend){const r=S.repo,h=headId();
  const parents=amend?[...C(h).parents]:r.merging?[h,r.merging.target]:h?[h]:[];
  const prevTree=parents[0]?C(parents[0]).tree:{};
  const id=mkCommit(msg,parents,r.index);setHead(id);r.merging=null;
  o(`[${r.head.type==='branch'?r.head.name:'detached HEAD'}${parents.length===0?' (root-commit)':''} ${id}] ${msg.split('\n')[0]}`);
  o(statLine(prevTree,r.index));return true};
function mergeMsg(name){const cb=curBranch();const kind=has(S.repo.tracking,name)?'remote-tracking branch':'branch';return `Merge ${kind} '${name}'`+(cb&&cb!=='main'&&cb!=='master'?` into ${cb}`:'')}
G.log=a=>{const r=S.repo;let one=false,all=false,n=Infinity,follow=false,grepG=null,stat=false,dd=false;const refs=[],paths=[];
  for(let i=0;i<a.length;i++){const x=a[i];
    if(dd){paths.push(x);continue}
    if(x==='--')dd=true;else if(x==='--oneline')one=true;else if(x==='--all')all=true;else if(x==='--graph'||x==='--decorate'){}
    else if(x==='--follow')follow=true;else if(x==='--stat')stat=true;
    else if(x==='-G'){grepG=a[++i];if(grepG===undefined)return err("error: switch `G' requires a value")}else if(x.startsWith('-G'))grepG=x.slice(2);
    else if(x==='-n'){n=parseInt(a[++i],10);if(!(n>=0))return err("fatal: '-n' requires a numeric value")}else if(/^-\d+$/.test(x))n=+x.slice(1);
    else if(x.startsWith('-'))return err(`fatal: unrecognized argument: ${x}`);
    else if(resolve(x))refs.push(x);else paths.push(x)}
  if(follow&&paths.length!==1)return err('fatal: --follow requires exactly one pathspec');
  const tips=all?allRefs():refs.length?refs.map(resolve):[headId()].filter(Boolean);
  if(!tips.length)return err(`fatal: your current branch '${curBranch()||'HEAD'}' does not have any commits yet`);
  const set=new Set();tips.forEach(t=>ancestors(t).forEach(x=>set.add(x)));
  for(const p of paths)if(!has(S.work,p)&&![...set].some(id=>has(C(id).tree,p)))return err(`fatal: ambiguous argument '${p}': unknown revision or path not in the working tree.`);
  let list=[...set].map(C).sort((x,y)=>y.time-x.time);
  if(paths.length){const names=new Set(paths),keep=[];
    for(const c of list){const pt=c.parents[0]?C(c.parents[0]).tree:{};let touched=false;
      for(const p of [...names]){if(c.tree[p]===pt[p])continue;touched=true;
        if(follow&&c.tree[p]!==undefined&&pt[p]===undefined){const old=Object.keys(pt).find(k=>pt[k]===c.tree[p]&&c.tree[k]===undefined);if(old)names.add(old)}}
      if(touched)keep.push(c)}
    list=keep}
  if(grepG!==null){let re;try{re=new RegExp(grepG)}catch(e){return err(`fatal: invalid regex: ${grepG}`)}
    list=list.filter(c=>{const pt=c.parents[0]?C(c.parents[0]).tree:{};for(const f of new Set([...Object.keys(pt),...Object.keys(c.tree)])){if(pt[f]===c.tree[f])continue;if(lineDiff(pt[f],c.tree[f]).some(([t,l])=>t!==' '&&re.test(l)))return true}return false})}
  list=list.slice(0,n);
  if(!list.length)tip('Aucun commit ne correspond à cette recherche.');
  for(const c of list){
    if(one)o([[c.id,'c-hash'],...decor(c.id),[' '+c.msg.split('\n')[0],'']]);
    else{o([['commit '+c.id,'c-hash'],...decor(c.id)]);if(c.parents.length>1)o('Merge: '+c.parents.join(' '));
      o(`Author: ${c.author} <${c.author.toLowerCase().normalize('NFD').replace(/[^a-z]/g,'')||'vous'}@atelier.git>`);o('Date:   '+fakeDate(c.time));o('\n    '+c.msg.split('\n').join('\n    ')+'\n')}
    if(stat&&c.parents.length<2){statLines(c.parents[0]?C(c.parents[0]).tree:{},c.tree);if(!one)o('')}}
  if(a.includes('--graph'))tip('Le graphe au-dessus du terminal dessine cet historique en direct.');
  return true};
function allRefs(){const r=S.repo;return [...Object.values(r.branches),...Object.values(r.tracking),...Object.values(r.tags),r.head.type==='detached'?r.head.id:null].filter(Boolean)}
G.show=a=>{const ref=a.find(x=>!x.startsWith('-'))||'HEAD';const id=resolve(ref);if(!id)return err(`fatal: ambiguous argument '${ref}': unknown revision or path not in the working tree.`);
  const c=C(id);o([['commit '+id,'c-hash'],...decor(id)]);if(c.parents.length>1)o('Merge: '+c.parents.join(' '));o(`Author: ${c.author}`);o('Date:   '+fakeDate(c.time));o('\n    '+c.msg.split('\n').join('\n    ')+'\n');
  if(c.parents.length<2){const pt=c.parents[0]?C(c.parents[0]).tree:{};if(a.includes('--stat'))statLines(pt,c.tree);else printDiff(pt,c.tree)}return true};
G.diff=a=>{const r=S.repo,staged=a.some(x=>x==='--staged'||x==='--cached'),stat=a.includes('--stat');
  const di=a.indexOf('--'),pos=(di>=0?a.slice(0,di):a).filter(x=>!x.startsWith('-')),paths=di>=0?a.slice(di+1):[],refs=[];
  for(const x of pos){if(!paths.length&&refs.length<2&&resolve(x))refs.push(x);else paths.push(x)}
  const known=new Set([...Object.keys(S.work),...Object.keys(r.index),...Object.keys(headTree()),...refs.flatMap(x=>Object.keys(C(resolve(x)).tree))]);
  for(const p of paths)if(!known.has(p))return err(`fatal: ambiguous argument '${p}': unknown revision or path not in the working tree.`);
  const trackedWork=()=>{const w={};for(const f of Object.keys(r.index))w[f]=S.work[f];return w};
  let A,B;
  if(refs.length>=2){A=C(resolve(refs[0])).tree;B=C(resolve(refs[1])).tree}
  else if(refs.length===1){A=C(resolve(refs[0])).tree;B=staged?r.index:trackedWork()}
  else if(staged){A=headTree();B=r.index}else{A=r.index;B=trackedWork()}
  if(paths.length){const pick=t=>{const out={};paths.forEach(p=>{if(t[p]!==undefined)out[p]=t[p]});return out};A=pick(A);B=pick(B)}
  const any=stat?statLines(A,B):printDiff(A,B);
  if(!any&&!staged&&!refs.length&&!paths.length){const ch=changes();if(ch.staged.length)tip('git diff est vide car vos changements sont déjà dans l\'index. Essayez git diff --staged.');else if(ch.untracked.length)tip('git diff ignore les fichiers non suivis. Ajoutez-les avec git add pour les voir dans git diff --staged.')}
  return true};
function restoreFiles(files,staged,worktree,source){const r=S.repo,dot=files.includes('.');
  if(worktree===undefined)worktree=!staged;
  let T=null;if(source){const sid=resolve(source);if(!sid)return err(`fatal: could not resolve ${source}`);T={...C(sid).tree}}
  const H=headTree(),list=dot?[...new Set([...Object.keys(S.work),...Object.keys(r.index),...Object.keys(H),...Object.keys(T||{})])]:files;
  for(const f of list){
    if(staged){const base=T||H;if(!has(r.index,f)&&!has(base,f)){if(dot)continue;return err(`error: pathspec '${f}' did not match any file(s) known to git`)}if(has(base,f))r.index[f]=base[f];else delete r.index[f]}
    if(worktree){const base=T||(staged?H:r.index);if(!has(base,f)&&!(staged&&has(S.work,f))){if(dot)continue;return err(`error: pathspec '${f}' did not match any file(s) known to git`)}
      if(has(base,f))S.work[f]=base[f];else if(!dot||has(r.index,f)||has(H,f))delete S.work[f]}}
  S.flags.restored=true;return true}
G.restore=a=>{let staged=false,worktree=false,source=null;const files=[];
  for(let i=0;i<a.length;i++){const x=a[i];if(x==='--staged'||x==='-S')staged=true;else if(x==='--worktree'||x==='-W')worktree=true;
    else if(x==='--source'||x==='-s')source=a[++i];else if(x.startsWith('--source='))source=x.slice(9);else if(x==='--')continue;
    else if(x.startsWith('-'))return err(`error: unknown option '${x.replace(/^-+/,'')}'`);else files.push(x)}
  if(!files.length)return err('fatal: you must specify path(s) to restore');
  return restoreFiles(files,staged,staged?worktree:true,source)};
G.reset=a=>{const r=S.repo;let mode='mixed';const rest=[];
  for(const x of a){if(x==='--soft')mode='soft';else if(x==='--hard')mode='hard';else if(x==='--mixed')mode='mixed';else if(x!=='--')rest.push(x)}
  const files=new Set([...Object.keys(S.work),...Object.keys(r.index),...Object.keys(headTree())]);
  if(rest.length&&!resolve(rest[0])&&rest.every(x=>files.has(x)||x==='.'))return restoreFiles(rest,true);
  if(rest.length>=2&&resolve(rest[0])&&rest.slice(1).every(x=>files.has(x)||x==='.'))return restoreFiles(rest.slice(1),true);
  if(!headId()){if(rest.length)return err(`fatal: ambiguous argument '${rest[0]}': unknown revision or path not in the working tree.`);r.index={};return true}
  const ref=rest[0]||'HEAD',t=resolve(ref);if(!t)return err(`fatal: ambiguous argument '${ref}': unknown revision or path not in the working tree.`);
  const untracked=changes().untracked,oldWork={...S.work};
  setHead(t);r.merging=null;
  if(mode!=='soft')r.index={...C(t).tree};
  if(mode==='hard'){const w={...C(t).tree};untracked.forEach(f=>{if(!has(w,f))w[f]=oldWork[f]});S.work=w;o(`HEAD is now at ${t} ${C(t).msg.split('\n')[0]}`)}
  else if(mode==='mixed'){const un=changes().unstaged;if(un.length){o('Unstaged changes after reset:');un.forEach(([f,k])=>o((k==='deleted'?'D':'M')+'\t'+f))}}
  return true};
G.revert=a=>{const ref=a.find(x=>!x.startsWith('-'));if(!ref)return err('usage: git revert <commit>');const id=resolve(ref);if(!id)return err(`fatal: bad revision '${ref}'`);
  const c=C(id);if(c.parents.length>1)return err(`error: commit ${id} is a merge but no -m option was given.\nfatal: revert failed`);
  const ch=changes();if(ch.staged.length||ch.unstaged.length)return err('error: your local changes would be overwritten by revert.\nhint: commit your changes or stash them to proceed.\nfatal: revert failed');
  const pt=c.parents[0]?C(c.parents[0]).tree:{},T=headTree(),old=headTree();
  for(const f of new Set([...Object.keys(pt),...Object.keys(c.tree)])){if(pt[f]===c.tree[f])continue;
    if(T[f]!==c.tree[f]){err(`error: could not revert ${id}... ${c.msg}\nCONFLICT (content): Merge conflict in ${f}`);tip('Ce fichier a encore changé depuis ce commit. L\'atelier annule le revert dans ce cas.');return false}T[f]=pt[f]}
  clean(T);const first=c.msg.split('\n')[0];const nid=mkCommit(`Revert "${first}"\n\nThis reverts commit ${id}.`,[headId()],T);
  const bad=switchTo(nid);if(bad)return overwriteErr(bad,'revert');setHead(nid);
  o(`[${curBranch()||'detached HEAD'} ${nid}] Revert "${first}"`);o(statLine(old,T));return true};
G.branch=a=>{const r=S.repo,flags=a.filter(x=>x.startsWith('-')),args=a.filter(x=>!x.startsWith('-'));
  if(flags.some(f=>f==='-d'||f==='-D'||f==='--delete')){if(!args.length)return err('fatal: branch name required');
    for(const b of args){if(!has(r.branches,b))return err(`error: branch '${b}' not found`);
      if(b===curBranch())return err(`error: cannot delete branch '${b}' used by worktree at '/home/vous/projet'`);
      if(!flags.includes('-D')&&headId()&&!isAnc(r.branches[b],headId())){err(`error: the branch '${b}' is not fully merged.\nhint: If you are sure you want to delete it, run 'git branch -D ${b}'`);return false}
      o(`Deleted branch ${b} (was ${r.branches[b]}).`);delete r.branches[b]}return true}
  if(flags.some(f=>f==='-m'||f==='-M')){const [from,to]=args.length>=2?args:[curBranch(),args[0]];if(!to||!validName(to))return err('fatal: invalid branch name');
    if(has(r.branches,to))return err(`fatal: a branch named '${to}' already exists`);
    if(has(r.branches,from)){r.branches[to]=r.branches[from];delete r.branches[from]}if(curBranch()===from)r.head.name=to;return true}
  if(!args.length){const cb=curBranch(),onlyR=flags.includes('-r')||flags.includes('--remotes');
    if(!onlyR){if(r.head.type==='detached')o(`* (HEAD detached at ${r.head.id})`,'c-ok');
      const srt=flags.find(f=>f.startsWith('--sort='));let names=Object.keys(r.branches).sort();
      if(srt&&/committerdate/.test(srt)){names.sort((x,y)=>C(r.branches[x]).time-C(r.branches[y]).time);if(srt.includes('=-'))names.reverse()}
      for(const b of names)o((b===cb?'* ':'  ')+b,b===cb?'c-ok':'')}
    if(onlyR||flags.includes('-a')||flags.includes('--all'))for(const t of Object.keys(r.tracking).sort())o('  '+(onlyR?'':'remotes/')+t,'c-err');
    if(!Object.keys(r.branches).length&&!headId())tip('Aucune branche visible : la branche main n\'existe vraiment qu\'après le premier commit.');
    return true}
  const [name,start]=args;if(!validName(name))return err(`fatal: '${name}' is not a valid branch name`);
  if(has(r.branches,name))return err(`fatal: a branch named '${name}' already exists`);
  const id=start?resolve(start):headId();if(!id){err(`fatal: not a valid object name: '${start||curBranch()||'HEAD'}'`);if(!start)tip('Faites d\'abord un commit : une branche est une étiquette posée sur un commit.');return false}
  r.branches[name]=id;return true};
function goBranch(name){const r=S.repo;if(r.merging)return err('error: you need to resolve your current index first');
  if(curBranch()===name){o(`Already on '${name}'`);return true}
  const bad=switchTo(r.branches[name]);if(bad)return overwriteErr(bad,'checkout');
  r.prev=curBranch()||r.prev;r.head={type:'branch',name};o(`Switched to branch '${name}'`);
  const up=r.upstream[name];if(up)o(trackInfo(r.branches[name],r.tracking[up+'/'+name],up+'/'+name));return true}
function createAndSwitch(name,start){const r=S.repo;if(!name)return err("error: switch `c' requires a value");if(!validName(name))return err(`fatal: '${name}' is not a valid branch name`);
  if(has(r.branches,name))return err(`fatal: a branch named '${name}' already exists`);
  if(r.merging)return err('error: you need to resolve your current index first');
  const id=start?resolve(start):headId();if(start&&!id)return err(`fatal: invalid reference: ${start}`);
  if(!id){r.prev=curBranch();r.head={type:'branch',name};o(`Switched to a new branch '${name}'`);return true}
  if(id!==headId()){const bad=switchTo(id);if(bad)return overwriteErr(bad,'checkout')}
  r.branches[name]=id;r.prev=curBranch()||r.prev;r.head={type:'branch',name};o(`Switched to a new branch '${name}'`);return true}
function detachTo(id){const r=S.repo;if(r.merging)return err('error: you need to resolve your current index first');
  const bad=switchTo(id);if(bad)return overwriteErr(bad,'checkout');r.prev=curBranch()||r.prev;r.head={type:'detached',id};
  o(`Note: switching to '${id}'.\n\nYou are in 'detached HEAD' state. You can look around, make experimental\nchanges and commit them, and you can discard any commits you make in this\nstate without impacting any branches by switching back to a branch.\n\nHEAD is now at ${id} ${C(id).msg.split('\n')[0]}`);
  tip('HEAD détachée : vous visitez un ancien commit. Revenez avec git switch main.');return true}
function fromTracking(name){const r=S.repo,tr=Object.keys(r.tracking).find(t=>t.split('/').slice(1).join('/')===name);if(!tr)return null;
  const bad=switchTo(r.tracking[tr]);if(bad)return overwriteErr(bad,'checkout');r.branches[name]=r.tracking[tr];r.upstream[name]=tr.split('/')[0];r.prev=curBranch();r.head={type:'branch',name};
  o(`branch '${name}' set up to track '${tr}'.\nSwitched to a new branch '${name}'`);return true}
G.switch=a=>{let create=false,detach=false;const args=[];
  for(const x of a){if(x==='-c'||x==='-C'||x==='--create')create=true;else if(x==='--detach'||x==='-d')detach=true;else if(!x.startsWith('-')||x==='-')args.push(x)}
  let [name,start]=args;if(!name)return err('fatal: missing branch or commit argument');
  if(name==='-'){name=S.repo.prev;if(!name)return err('fatal: no previous branch')}
  if(create)return createAndSwitch(name,start);
  if(has(S.repo.branches,name)&&!detach)return goBranch(name);
  const id=resolve(name);
  if(detach){if(!id)return err(`fatal: invalid reference: ${name}`);return detachTo(id)}
  const t=fromTracking(name);if(t!==null)return t;
  if(id){err(`fatal: a branch is expected, got commit '${name}'`);tip('Pour visiter un ancien commit : git switch --detach <hash> (ou git checkout <hash>).');return false}
  err(`fatal: invalid reference: ${name}`);if(Object.keys(S.repo.branches).length)tip('Branches existantes : '+Object.keys(S.repo.branches).join(', ')+'. Pour en créer une : git switch -c '+name);return false};
G.checkout=a=>{const r=S.repo;if(a[0]==='-b'||a[0]==='-B')return createAndSwitch(a[1],a[2]);
  if(a[0]==='--')return restoreFiles(a.slice(1),false);
  {const ix=a.indexOf('--'),pre=ix>=0?a.slice(0,ix):a.slice(0,1),paths=ix>=0?a.slice(ix+1):a.slice(1);
   if(pre.length===1&&paths.length&&resolve(pre[0]))return restoreFiles(paths,true,true,pre[0])}
  let name=a[0];if(!name)return err('error: you must specify a branch or file');
  if(name==='-'){name=r.prev;if(!name)return err('error: no previous branch')}
  if(has(r.branches,name))return goBranch(name);
  const id=resolve(name);
  if(!id&&(has(r.index,name)||has(S.work,name)))return restoreFiles(a,false);
  if(id)return detachTo(id);
  const t=fromTracking(name);if(t!==null)return t;
  return err(`error: pathspec '${name}' did not match any file(s) known to git`)};
G.merge=a=>{const r=S.repo;
  if(a[0]==='--abort'){if(!r.merging)return err('fatal: There is no merge to abort (MERGE_HEAD missing).');r.index={...r.merging.saveIndex};S.work={...r.merging.saveWork};r.merging=null;return true}
  let noff=false,squash=false,msg=null;const args=[];
  for(let i=0;i<a.length;i++){const x=a[i];if(x==='--no-ff')noff=true;else if(x==='--squash')squash=true;else if(x==='-m')msg=a[++i];else if(!x.startsWith('-'))args.push(x)}
  const name=args[0];if(!name)return err('fatal: No remote for the current branch.');
  if(r.merging)return err('error: Merging is not possible because you have unmerged files.\nhint: Fix them up in the work tree, and then use \'git add <file>\'\nfatal: Exiting because of an unresolved conflict.');
  const t=resolve(name);if(!t)return err(`merge: ${name} - not something we can merge`);
  const h=headId();
  if(!h){const bad=switchTo(t);if(bad)return overwriteErr(bad,'merge');setHead(t);o('Fast-forward');return true}
  const ch=changes();
  if(isAnc(t,h)||t===h){o('Already up to date.');return true}
  if(ch.staged.length||ch.unstaged.length){const files=[...ch.staged,...ch.unstaged].map(x=>x[0]);return overwriteErr([...new Set(files)],'merge')}
  if(squash){const base=mergeBase(h,t),Bt=base?C(base).tree:{},O=C(h).tree,T=C(t).tree,M={},conf=[];
    for(const f of new Set([...Object.keys(Bt),...Object.keys(O),...Object.keys(T)])){const b=Bt[f],x=O[f],y=T[f];if(x===y)M[f]=x;else if(x===b)M[f]=y;else if(y===b)M[f]=x;else conf.push(f)}
    if(conf.length){err('CONFLICT (content): Merge conflict in '+conf.join(', '));tip('L\'atelier annule la fusion --squash en cas de conflit. Pratiquez les conflits avec un git merge classique.');return false}
    clean(M);const untr=ch.untracked.filter(f=>has(M,f)&&!has(O,f));if(untr.length)return err('error: The following untracked working tree files would be overwritten by merge:\n\t'+untr.join('\n\t'));
    const keep={};ch.untracked.forEach(f=>keep[f]=S.work[f]);S.work={...keep,...M};r.index={...M};
    if(isAnc(h,t))o(`Updating ${h}..${t}\nFast-forward`);o(statLine(O,M));o('Squash commit -- not updating HEAD');if(!isAnc(h,t))o('Automatic merge went well; stopped before committing as requested');
    tip('Tous les changements de la branche attendent dans l\'index. Terminez avec git commit -m "..." : ce sera un seul commit, avec un seul parent.');return true}
  if(isAnc(h,t)&&!noff){const before=C(h).tree;const bad=switchTo(t);if(bad)return overwriteErr(bad,'merge');setHead(t);o(`Updating ${h}..${t}\nFast-forward`);o(statLine(before,C(t).tree));return true}
  const base=mergeBase(h,t),B=base?C(base).tree:{},O=C(h).tree,T=C(t).tree,M={},conf=[];
  for(const f of [...new Set([...Object.keys(B),...Object.keys(O),...Object.keys(T)])].sort()){const b=B[f],x=O[f],y=T[f];
    if(x===y)M[f]=x;else if(x===b)M[f]=y;else if(y===b)M[f]=x;else{conf.push(f);M[f]=`<<<<<<< HEAD\n${x??''}\n=======\n${y??''}\n>>>>>>> ${name}`}}
  clean(M);
  const untr=ch.untracked.filter(f=>has(M,f));if(untr.length)return err('error: The following untracked working tree files would be overwritten by merge:\n\t'+untr.join('\n\t')+'\nPlease move or remove them before you merge.\nAborting');
  const keep={};ch.untracked.forEach(f=>keep[f]=S.work[f]);
  if(conf.length){const saveWork={...S.work},saveIndex={...r.index};S.work={...keep,...M};const I={...M};conf.forEach(f=>{if(O[f]!==undefined)I[f]=O[f];else delete I[f]});r.index=I;
    r.merging={target:t,name,unresolved:[...conf],saveWork,saveIndex};S.flags.conflict=true;
    conf.forEach(f=>{o('Auto-merging '+f);o('CONFLICT (content): Merge conflict in '+f,'c-err')});o('Automatic merge failed; fix conflicts and then commit the result.');
    tip('Conflit : les deux branches ont modifié les mêmes lignes. Ouvrez le fichier (cat ou edit), gardez le bon texte, retirez les marqueurs <<<<<<< ======= >>>>>>>, puis git add et git commit.');return true}
  const id=mkCommit(msg||mergeMsg(name),[h,t],M);setHead(id);S.work={...keep,...M};r.index={...M};
  o("Merge made by the 'ort' strategy.");o(statLine(O,M));return true};
G.rebase=a=>{const r=S.repo;if(a.includes('--abort')||a.includes('--continue'))return err('fatal: No rebase in progress?');
  if(a.includes('-i')||a.includes('--interactive')){err("error: le rebase interactif (-i) n'existe pas dans l'atelier");tip('Pour réunir les 3 derniers commits en un seul ici : git reset --soft HEAD~3 puis git commit -m "Nouveau message".');return false}
  const up=a.find(x=>!x.startsWith('-')),cb=curBranch();if(!cb)return err('fatal: l\'atelier ne gère pas le rebase en HEAD détachée.');
  if(!up)return err('fatal: No upstream configured. Specify a branch, e.g. git rebase main');
  const u=resolve(up);if(!u)return err(`fatal: invalid upstream '${up}'`);const h=headId();if(!h)return err('fatal: no commits yet');
  const ch=changes();if(ch.staged.length||ch.unstaged.length)return err('error: cannot rebase: You have unstaged changes.\nerror: Please commit or stash them.');
  if(isAnc(u,h)||u===h){o(`Current branch ${cb} is up to date.`);return true}
  if(isAnc(h,u)){const bad=switchTo(u);if(bad)return overwriteErr(bad,'rebase');setHead(u);o(`Successfully rebased and updated refs/heads/${cb}.`);return true}
  const U=ancestors(u),todo=[...ancestors(h)].filter(x=>!U.has(x)).map(C).filter(c=>c.parents.length<2).sort((x,y)=>x.time-y.time);
  let newTip=u;const tree={...C(u).tree};
  for(const c of todo){const pt=c.parents[0]?C(c.parents[0]).tree:{};
    for(const f of new Set([...Object.keys(pt),...Object.keys(c.tree)])){if(pt[f]===c.tree[f])continue;
      if(tree[f]!==pt[f]&&tree[f]!==c.tree[f]){err(`CONFLICT (content): Merge conflict in ${f}\nerror: could not apply ${c.id}... ${c.msg.split('\n')[0]}`);tip('L\'atelier simplifie le rebase : en cas de conflit, il est annulé et rien n\'a changé. Pratiquez les conflits avec git merge.');return false}
      tree[f]=c.tree[f]}
    clean(tree);newTip=mkCommit(c.msg,[newTip],tree,c.author)}
  const bad=switchTo(newTip);if(bad)return overwriteErr(bad,'rebase');setHead(newTip);
  o(`Successfully rebased and updated refs/heads/${cb}.`);tip(`${todo.length} commit${todo.length>1?'s ont':' a'} été rejoué${todo.length>1?'s':''} au-dessus de ${up}. Regardez le graphe : les hash ont changé.`);return true};
G.stash=a=>{const r=S.repo,sub=a[0]&&!a[0].startsWith('-')?a[0]:'push';
  if(sub==='push'||sub==='save'){const mi=a.indexOf('-m');const msg=mi>=0?a[mi+1]:(sub==='save'?a[1]:null);
    const h=headId();if(!h)return err('You do not have the initial commit yet');
    const ch=changes();if(!ch.staged.length&&!ch.unstaged.length){o('No local changes to save');if(ch.untracked.length)tip('git stash ignore les fichiers non suivis (utilisez git stash -u dans le vrai Git).');return true}
    const H=headTree(),tracked={};for(const f of new Set([...Object.keys(r.index),...Object.keys(H)]))tracked[f]=has(S.work,f)?S.work[f]:undefined;
    const label=msg?`On ${curBranch()||'(no branch)'}: ${msg}`:`WIP on ${curBranch()||'(no branch)'}: ${h} ${C(h).msg.split('\n')[0]}`;
    r.stash.unshift({work:tracked,base:h,label});
    const w={...H};ch.untracked.forEach(f=>w[f]=S.work[f]);S.work=clean(w);r.index={...H};
    o('Saved working directory and index state '+label);return true}
  if(sub==='list'){r.stash.forEach((s,i)=>o(`stash@{${i}}: ${s.label}`));return true}
  if(sub==='drop'){if(!r.stash.length)return err('error: No stash entries found.');r.stash.shift();o('Dropped refs/stash@{0}');return true}
  if(sub==='clear'){r.stash=[];return true}
  if(sub==='pop'||sub==='apply'){if(!r.stash.length)return err('error: No stash entries found.');const s=r.stash[0],base=C(s.base).tree,H=headTree(),conf=[];
    for(const f of new Set([...Object.keys(s.work),...Object.keys(base)])){const want=s.work[f];if(want===base[f])continue;
      if(S.work[f]!==H[f]||(H[f]!==base[f]&&H[f]!==want))conf.push(f)}
    if(conf.length){err('error: Your local changes to the following files would be overwritten by merge:\n\t'+conf.join('\n\t')+'\nPlease commit your changes or stash them before you merge.\nAborting');tip('Le stash touche des fichiers qui ont changé ici. Revenez sur la branche d\'origine, ou faites un commit avant.');return false}
    for(const f of Object.keys(s.work)){const want=s.work[f];if(want===base[f])continue;if(want===undefined)delete S.work[f];else S.work[f]=want}
    const silentBefore=SILENT;G.status();SILENT=silentBefore;
    if(sub==='pop'){r.stash.shift();o(`Dropped refs/stash@{0} (${hid()}${hid().slice(0,5)})`)}return true}
  return err(`error: unknown subcommand: ${sub}`)};
G.tag=a=>{const r=S.repo,args=a.filter(x=>!x.startsWith('-'));
  if(a.includes('-d')){for(const t of args){if(!has(r.tags,t))return err(`error: tag '${t}' not found.`);o(`Deleted tag '${t}' (was ${r.tags[t]})`);delete r.tags[t]}return true}
  if(!args.length){Object.keys(r.tags).sort().forEach(t=>o(t));return true}
  const [name,ref]=args;if(!validName(name))return err(`fatal: '${name}' is not a valid tag name.`);if(has(r.tags,name))return err(`fatal: tag '${name}' already exists`);
  const id=ref?resolve(ref):headId();if(!id)return err(`fatal: Failed to resolve '${ref||'HEAD'}' as a valid ref.`);r.tags[name]=id;return true};
G.remote=a=>{const r=S.repo;if(!a.length){Object.keys(r.remotes).forEach(n=>o(n));return true}
  if(a[0]==='-v'){for(const [n,u] of Object.entries(r.remotes)){o(`${n}\t${u} (fetch)`);o(`${n}\t${u} (push)`)}return true}
  if(a[0]==='add'){const [,n,u]=a;if(!n||!u)return err('usage: git remote add <name> <url>');if(has(r.remotes,n))return err(`error: remote ${n} already exists.`);r.remotes[n]=u;if(!S.servers[u])S.servers[u]={branches:{}};return true}
  if(a[0]==='remove'||a[0]==='rm'){const n=a[1];if(!has(r.remotes,n))return err(`error: No such remote: '${n}'`);delete r.remotes[n];for(const k of Object.keys(r.tracking))if(k.startsWith(n+'/'))delete r.tracking[k];for(const b of Object.keys(r.upstream))if(r.upstream[b]===n)delete r.upstream[b];return true}
  return err(`error: unknown subcommand: ${a[0]}`)};
G.push=a=>{const r=S.repo;let u=false,force=false,lease=false,tags=false;const args=[];
  for(const x of a){if(x==='-u'||x==='--set-upstream')u=true;else if(x==='-f'||x==='--force')force=true;else if(x==='--force-with-lease')lease=true;else if(x==='--tags')tags=true;else if(!x.startsWith('-'))args.push(x)}
  const cb=curBranch();let [rem,br]=args;
  if(tags){const rm=rem||(cb&&r.upstream[cb])||'origin';if(!has(r.remotes,rm))return err(`fatal: '${rm}' does not appear to be a git repository`);
    const srv=S.servers[r.remotes[rm]];srv.tags=srv.tags||{};const fresh=Object.keys(r.tags).filter(t=>srv.tags[t]!==r.tags[t]);
    if(!fresh.length){o('Everything up-to-date');return true}o('To '+r.remotes[rm]);fresh.forEach(t=>{o(` * [new tag]         ${t} -> ${t}`);srv.tags[t]=r.tags[t]});return true}
  if(!rem){const up=cb&&r.upstream[cb];if(!up){if(!Object.keys(r.remotes).length){err('fatal: No configured push destination.');tip('Ajoutez d\'abord un dépôt distant : git remote add origin <url>');return false}
      err(`fatal: The current branch ${cb} has no upstream branch.\nTo push the current branch and set the remote as upstream, use\n\n    git push --set-upstream origin ${cb}\n`);return false}rem=up;br=cb}
  if(!br)br=cb;
  if(!has(r.remotes,rem)){err(`fatal: '${rem}' does not appear to be a git repository\nfatal: Could not read from remote repository.`);return false}
  const local=r.branches[br];if(!local)return err(`error: src refspec ${br} does not match any\nerror: failed to push some refs to '${r.remotes[rem]}'`);
  const srv=S.servers[r.remotes[rem]],remoteId=srv.branches[br];
  if(remoteId===local){o('Everything up-to-date');if(u)r.upstream[br]=rem;return true}
  if(lease&&remoteId!==r.tracking[`${rem}/${br}`]){err(`To ${r.remotes[rem]}\n ! [rejected]        ${br} -> ${br} (stale info)\nerror: failed to push some refs to '${r.remotes[rem]}'`);tip('--force-with-lease refuse : le serveur a changé depuis votre dernier fetch. Récupérez d\'abord ce travail pour ne pas l\'écraser.');return false}
  if(lease)force=true;
  if(remoteId&&!isAnc(remoteId,local)&&!force){err(`To ${r.remotes[rem]}\n ! [rejected]        ${br} -> ${br} (fetch first)\nerror: failed to push some refs to '${r.remotes[rem]}'\nhint: Updates were rejected because the remote contains work that you do not\nhint: have locally. Integrate the remote changes (e.g. 'git pull ...')\nhint: before pushing again.`);tip('Quelqu\'un a poussé avant vous. Faites git pull, puis recommencez le push.');return false}
  srv.branches[br]=local;r.tracking[`${rem}/${br}`]=local;
  o(`To ${r.remotes[rem]}`);o(remoteId?`   ${remoteId}..${local}  ${br} -> ${br}`:` * [new branch]      ${br} -> ${br}`);
  if(u){r.upstream[br]=rem;o(`branch '${br}' set up to track '${rem}/${br}'.`)}return true};
G.fetch=a=>{const r=S.repo,rems=a.length&&!a[0].startsWith('-')?[a[0]]:Object.keys(r.remotes);
  if(!rems.length){err('fatal: No remote repository specified.');tip('Ajoutez d\'abord un dépôt distant : git remote add origin <url>');return false}
  for(const rem of rems){if(!has(r.remotes,rem))return err(`fatal: '${rem}' does not appear to be a git repository`);
    const srv=S.servers[r.remotes[rem]];let printed=false;
    for(const [b,id] of Object.entries(srv.branches)){const k=`${rem}/${b}`,old=r.tracking[k];if(old===id)continue;
      if(!printed){o('From '+r.remotes[rem]);printed=true}o(old?`   ${old}..${id}  ${b.padEnd(10)} -> ${k}`:` * [new branch]      ${b.padEnd(10)} -> ${k}`);r.tracking[k]=id}
    for(const [t,id] of Object.entries(srv.tags||{}))if(!has(r.tags,t)){if(!printed){o('From '+r.remotes[rem]);printed=true}o(` * [new tag]         ${t.padEnd(10)} -> ${t}`);r.tags[t]=id}}
  return true};
G.pull=a=>{const r=S.repo,cb=curBranch();let [rem,br]=a.filter(x=>!x.startsWith('-'));
  if(!rem){rem=cb&&r.upstream[cb];br=cb;if(!rem){err(`There is no tracking information for the current branch.\nPlease specify which branch you want to merge with.\n\n    git pull <remote> <branch>\n\nIf you wish to set tracking information for this branch you can do so with:\n\n    git push -u origin ${cb}`);return false}}
  if(!br)br=cb;if(!G.fetch([rem]))return false;const k=`${rem}/${br}`;if(!r.tracking[k])return err(`fatal: couldn't find remote ref ${br}`);
  return a.includes('--rebase')||a.includes('-r')?G.rebase([k]):G.merge([k])};
G.clone=a=>{const url=a.find(x=>!x.startsWith('-'));if(!url)return err('fatal: You must specify a repository to clone.');
  const name=(url.split('/').pop()||'repo').replace(/\.git$/,'');
  if(S.repo){err(`fatal: destination path '${name}' already exists and is not an empty directory.`);tip('L\'atelier n\'a qu\'un dossier. Le clonage fonctionne dans le bac à sable tant qu\'aucun dépôt n\'existe : cliquez sur Recommencer.');return false}
  const srv=S.servers[url];if(!srv||!Object.keys(srv.branches).length)return err(`Cloning into '${name}'...\nremote: Repository not found.\nfatal: repository '${url}' not found`);
  const r=S.repo=newRepo();r.remotes.origin=url;for(const [b,id] of Object.entries(srv.branches))r.tracking['origin/'+b]=id;
  const main=srv.branches.main?'main':Object.keys(srv.branches)[0];r.branches[main]=srv.branches[main];r.head={type:'branch',name:main};r.upstream[main]='origin';
  const tree=C(srv.branches[main]).tree;r.index={...tree};S.work={...S.work,...tree};
  o(`Cloning into '${name}'...`);o('remote: Enumerating objects: done.\nReceiving objects: 100%, done.');tip('Dans l\'atelier, le dépôt cloné arrive directement dans le dossier courant.');return true};

/* ----- Commandes du terminal ----- */
function gitIni(cfg){const sec={};for(const [k,v] of Object.entries(cfg)){const i=k.lastIndexOf('.');(sec[k.slice(0,i)]=sec[k.slice(0,i)]||[]).push(`\t${k.slice(i+1)} = ${v}`)}
  return Object.entries(sec).map(([n,l])=>`[${n.replace(/^(\w+)\.(.+)$/,'$1 "$2"')}]\n${l.join('\n')}`).join('\n')}
function configText(f){if(f==='~/.gitconfig')return gitIni(S.config);if(!S.repo)return null;const r=S.repo;
  let t='[core]\n\trepositoryformatversion = 0\n\tfilemode = false\n\tbare = false';
  for(const [n,u] of Object.entries(r.remotes))t+=`\n[remote "${n}"]\n\turl = ${u}\n\tfetch = +refs/heads/*:refs/remotes/${n}/*`;
  for(const [b,rem] of Object.entries(r.upstream))t+=`\n[branch "${b}"]\n\tremote = ${rem}\n\tmerge = refs/heads/${b}`;return t}
const SH={
  help(){o('Terminal :','c-bold');o('  ls  cat <f>  echo "texte" > <f>  echo "texte" >> <f>  touch <f>  rm <f>\n  edit <f>   ouvre un petit éditeur\n  clear      efface l\'écran\n  version    version de l\'atelier\n  git help   liste les commandes Git');tip('Flèches ↑ ↓ pour l\'historique, Tab pour compléter, && pour enchaîner deux commandes.');return true},
  clear(){outEl.innerHTML='';return true},
  ls(a){const files=Object.keys(S.work).sort();if(a.some(x=>/^-\w*a/.test(x)))o(['.','..',...(S.repo?['.git']:[]),...files].join('  '));else{const vis=files.filter(f=>!f.startsWith('.'));if(vis.length)o(vis.join('  '))}return true},
  cat(a){if(!a.length)return err('cat: missing operand');for(const f of a){if(f==='.git/config'||f==='~/.gitconfig'){const t=configText(f);if(t===null)return err(`cat: ${f}: No such file or directory`);o(t);continue}if(!has(S.work,f))return err(`cat: ${f}: No such file or directory`);o(S.work[f])}return true},
  touch(a){if(!a.length)return err('touch: missing file operand');for(const f of a){if(!validFile(f))return err(`touch: nom de fichier refusé dans l'atelier : ${f}`);if(!has(S.work,f))S.work[f]=''}return true},
  echo(a){const i=a.findIndex(x=>x==='>'||x==='>>');if(i<0){o(a.join(' '));return true}
    const txt=a.slice(0,i).join(' '),f=a[i+1];if(!f)return err("syntax error near unexpected token `newline'");if(!validFile(f))return err(`echo: nom de fichier refusé dans l'atelier : ${f}`);
    if(a[i]==='>>'&&has(S.work,f)&&S.work[f]!=='')S.work[f]+='\n'+txt;else S.work[f]=txt;return true},
  rm(a){const files=a.filter(x=>!x.startsWith('-'));if(!files.length)return err('rm: missing operand');for(const f of files){if(!has(S.work,f))return err(`rm: cannot remove '${f}': No such file or directory`);delete S.work[f]}return true},
  pwd(){o('/home/vous/projet');return true},
  version(){o(`Atelier Git v${APP_VERSION} · réalisé par Titan_gp1`);return true},
  about(){return SH.version()},
  whoami(){o('vous');return true},
  cd(){tip('Restez dans ~/projet : tout l\'atelier se passe dans ce dossier.');return true},
  mkdir(){tip('L\'atelier garde un dossier à plat : créez directement des fichiers.');return true},
  edit(a){if(!a[0])return err('usage: edit <fichier>');if(!validFile(a[0]))return err('edit: nom de fichier refusé');openEditor(a[0]);return true},
};
SH.nano=SH.vim=SH.vi=SH.code=SH.edit;SH.cls=SH.clear;

function tokenize(line){const out=[];let cur='',q=null,hasTok=false;
  const flush=()=>{if(cur||hasTok){out.push(cur);cur='';hasTok=false}};
  for(let i=0;i<line.length;i++){const c=line[i];
    if(q){if(c===q)q=null;else if(c==='\\'&&q==='"'&&line[i+1]==='n'){cur+='\n';i++}else cur+=c}
    else if(c==='"'||c==="'"){q=c;hasTok=true}
    else if(/\s/.test(c))flush();
    else if(c==='&'&&line[i+1]==='&'){flush();out.push('&&');i++}
    else if(c==='>'){flush();if(line[i+1]==='>'){out.push('>>');i++}else out.push('>')}
    else cur+=c}
  flush();out.open=q;return out}
function exec(t){const [c,...a]=t;
  if(c==='git'){const sub=a[0];
    if(!sub){o('usage: git <command> [<args>]');tip('Tapez git help pour voir les commandes disponibles.');return true}
    if(sub==='--version'||sub==='version'){o('git version 2.47.0 (atelier)');return true}
    if(!S.repo&&!['init','clone','help','config'].includes(sub)){err('fatal: not a git repository (or any of the parent directories): .git');tip('Il n\'y a pas encore de dépôt ici. Commencez par git init.');return false}
    if(!G[sub]&&S.config['alias.'+sub]){const exp=tokenize(S.config['alias.'+sub]);if(exp[0]===sub)return err(`fatal: alias loop detected: expansion of '${sub}' does not terminate`);return exec(['git',...exp,...a.slice(1)])}
    const fn=G[sub];if(!fn){const near=closest(sub,Object.keys(G));err(`git: '${sub}' is not a git command. See 'git --help'.`+(near?`\n\nThe most similar command is\n\t${near}`:''));return false}
    const before=S.repo?{id:headId(),label:headLabel()}:null,ok=fn(a.slice(1))!==false;
    if(ok&&S.repo)recordReflog(sub,a.slice(1),before);return ok}
  if(SH[c])return SH[c](a)!==false;
  err(`${c}: command not found`);const near=closest(c,Object.keys(SH).concat('git'));if(near)tip(`Vouliez-vous dire ${near} ?`);return false}
function run(line,silent){const toks=tokenize(line.trim());if(!toks.length)return;
  if(toks.open){if(!silent){err(`bash: unexpected EOF while looking for matching \`${toks.open}'`);tip('Un guillemet n\'est pas fermé. Exemple correct : echo "Bonjour" > fichier.txt')}return}
  const groups=[[]];for(const t of toks){if(t==='&&')groups.push([]);else groups[groups.length-1].push(t)}
  SILENT=!!silent;
  for(const g of groups){if(!g.length)continue;let ok=false;
    try{ok=exec(g)}catch(e){err('erreur interne de l\'atelier : '+e.message);console.error(e)}
    const text=g.map(x=>/[\s"]/.test(x)?JSON.stringify(x):x).join(' ');
    if(!silent){S.hist.push(text);LESSONS[cur].after&&LESSONS[cur].after(text);evaluate()}
    if(!ok)break}
  SILENT=false}

/* =========================================================
   Leçons
   ========================================================= */
const W=f=>S.work[f],HT=f=>headTree()[f],B=n=>S.repo&&S.repo.branches[n];
const LESSONS=[
{id:'premier',title:'Votre premier dépôt',short:'init · add · commit',level:'Débutant',xp:50,
 summary:'Créez un dépôt, ajoutez un fichier et enregistrez votre premier commit.',
 theory:`<p>Git prend des <b>photos</b> de votre projet aux moments que vous choisissez. Chaque photo s'appelle un <b>commit</b>. Elle contient tous les fichiers, un message, un auteur et un lien vers le commit précédent.</p>
 <p><code>git init</code> crée un dossier caché <code>.git</code>. C'est là que Git range tout l'historique. Vos fichiers restent dans le <b>répertoire de travail</b>, comme d'habitude.</p>
 <p>Enregistrer se fait en deux gestes : <code>git add</code> choisit ce qui ira dans la prochaine photo, puis <code>git commit</code> la prend.</p>`,
 setup:[],intro:'Le dossier ~/projet est vide. Aucun dépôt Git pour l\'instant.',
 tasks:[
  {t:'Initialisez un dépôt Git dans le dossier',cmd:'git init',ok:()=>!!S.repo},
  {t:'Créez un fichier <code>index.html</code>',cmd:'echo "<h1>Bonjour</h1>" > index.html',ok:()=>W('index.html')!==undefined},
  {t:'Demandez à Git ce qu\'il voit avec <code>git status</code>. Le fichier est « untracked » : Git ne le suit pas encore.',cmd:'git status',ok:c=>c.ran(/^git status/)},
  {t:'Placez le fichier dans l\'index, la zone de préparation',cmd:'git add index.html',ok:()=>S.repo.index['index.html']!==undefined||!!headId()},
  {t:'Prenez la photo : votre premier commit',cmd:'git commit -m "Ajoute la page d\'accueil"',ok:()=>!!headId()},
 ]},
{id:'zones',title:'Les trois zones',short:'status · diff · add',level:'Débutant',xp:50,
 summary:'Comprenez le trajet d\'une modification : répertoire de travail, index, puis dépôt.',
 theory:`<p>Chaque fichier vit à trois endroits. Le <b>répertoire de travail</b> est ce que vous éditez. L'<b>index</b> prépare le prochain commit. Le <b>dépôt</b> garde les commits pour toujours.</p>
 <p><code>git diff</code> montre ce qui a changé et n'est pas encore indexé. <code>git diff --staged</code> montre ce qui partira dans le prochain commit.</p>
 <p>L'index permet de faire des commits précis : vous pouvez indexer un fichier et en laisser un autre de côté. <code>git commit -am</code> indexe d'un coup tous les fichiers déjà suivis.</p>`,
 setup:['git init','echo "<h1>Bonjour</h1>" > index.html','git add .','git commit -m "Ajoute la page d\'accueil"'],intro:'Dépôt prêt : un commit sur main avec index.html.',
 tasks:[
  {t:'Modifiez <code>index.html</code> en ajoutant une ligne',cmd:'echo "<p>Bienvenue sur notre site</p>" >> index.html',ok:()=>W('index.html')!==HT('index.html')},
  {t:'Regardez exactement ce qui a changé',cmd:'git diff',ok:c=>c.ran(/^git diff/)},
  {t:'Créez un second fichier <code>style.css</code>',cmd:'echo "body { color: navy; }" > style.css',ok:()=>W('style.css')!==undefined},
  {t:'Indexez <b>seulement</b> <code>style.css</code>. Regardez la colonne Index.',cmd:'git add style.css',ok:()=>S.repo.index['style.css']!==undefined&&S.repo.index['index.html']===HT('index.html')||HT('style.css')!==undefined},
  {t:'Commitez la feuille de style. La modification de index.html reste en attente.',cmd:'git commit -m "Ajoute la feuille de style"',ok:()=>HT('style.css')!==undefined},
  {t:'Commitez le reste en une commande avec <code>-am</code>',cmd:'git commit -am "Ajoute un message de bienvenue"',ok:()=>{const c=changes();return !c.staged.length&&!c.unstaged.length&&ancestors(headId()).size>=3}},
 ]},
{id:'historique',title:'Voyager dans l\'historique',short:'log · restore · reset',level:'Débutant',xp:50,
 summary:'Lisez l\'historique, annulez une modification et revenez en arrière.',
 theory:`<p>Chaque commit a un identifiant unique, son <b>hash</b> (ici 7 caractères comme <code>a3f9c21</code>). <code>HEAD</code> désigne le commit où vous êtes. <code>HEAD~1</code> est son parent, <code>HEAD~2</code> le grand-parent.</p>
 <p><code>git restore fichier</code> jette les modifications non commitées d'un fichier. <code>git reset --hard HEAD~1</code> recule la branche d'un commit et remet les fichiers dans cet état.</p>
 <p class="note">reset --hard efface du travail. Sur un historique partagé avec d'autres, préférez <code>git revert</code>, qui crée un commit inverse au lieu de réécrire le passé.</p>`,
 setup:['git init','echo "<h1>Accueil</h1>" > index.html','git add .','git commit -m "Ajoute l\'accueil"','echo "<p>Ouvert du lundi au vendredi</p>" >> index.html','git commit -am "Ajoute les horaires"','echo "<p>PROMO -90% !!!</p>" >> index.html','git commit -am "Ajoute une promo par erreur"'],
 intro:'Dépôt prêt : 3 commits. Le dernier est une erreur.',
 tasks:[
  {t:'Affichez l\'historique en version compacte',cmd:'git log --oneline',ok:c=>c.ran(/^git log/)},
  {t:'Abîmez <code>index.html</code> par accident',cmd:'echo "oups" > index.html',ok:()=>W('index.html')!==HT('index.html')},
  {t:'Annulez ce dégât avec <code>git restore</code>',cmd:'git restore index.html',ok:c=>c.ran(/^git (restore|checkout)/)&&W('index.html')===HT('index.html')},
  {t:'Supprimez le commit « promo » en reculant d\'un cran',cmd:'git reset --hard HEAD~1',ok:()=>ancestors(headId()).size===2},
  {t:'Vérifiez le résultat : le commit a disparu de main',cmd:'git log --oneline',ok:c=>c.ran(/^git (log|show)/)},
 ]},
{id:'branches',title:'Les branches',short:'branch · switch',level:'Intermédiaire',xp:50,
 summary:'Travaillez sur une nouvelle fonctionnalité sans toucher à la branche principale.',
 theory:`<p>Une branche est une <b>étiquette mobile</b> posée sur un commit. Créer une branche ne copie rien : Git ajoute juste une étiquette.</p>
 <p><code>HEAD</code> indique la branche active. Quand vous commitez, c'est cette étiquette qui avance. <code>git switch</code> change de branche et met à jour les fichiers du dossier.</p>
 <p>Raccourci pour créer et basculer d'un coup : <code>git switch -c nom</code>.</p>`,
 setup:['git init','echo "# Site de l\'équipe" > README.md','git add .','git commit -m "Premier commit"','echo "<h1>Accueil</h1>" > index.html','git add .','git commit -m "Ajoute l\'accueil"'],
 intro:'Dépôt prêt : 2 commits sur main.',
 tasks:[
  {t:'Listez les branches existantes',cmd:'git branch',ok:c=>c.ran(/^git branch$/)},
  {t:'Créez une branche <code>contact</code>',cmd:'git branch contact',ok:()=>B('contact')!==undefined},
  {t:'Basculez dessus. Le libellé HEAD se déplace dans le graphe.',cmd:'git switch contact',ok:()=>curBranch()==='contact'},
  {t:'Créez <code>contact.html</code> et commitez-le sur cette branche',cmd:'echo "<h1>Contact</h1>" > contact.html && git add . && git commit -m "Ajoute la page contact"',ok:()=>B('contact')&&B('contact')!==B('main')&&isAnc(B('main'),B('contact'))},
  {t:'Revenez sur <code>main</code> et listez les fichiers : contact.html n\'y est pas',cmd:'git switch main && ls',ok:()=>curBranch()==='main'},
 ]},
{id:'fusion',title:'Fusionner des branches',short:'merge',level:'Intermédiaire',xp:50,
 summary:'Rapatriez le travail d\'une branche dans main, avec et sans commit de fusion.',
 theory:`<p><code>git merge branche</code> intègre le travail d'une autre branche dans la branche active.</p>
 <p>Si main n'a pas bougé depuis la création de la branche, Git avance simplement l'étiquette : c'est un <b>fast-forward</b>.</p>
 <p>Si les deux branches ont avancé chacune de leur côté, Git crée un <b>commit de fusion</b> avec deux parents. Il apparaît comme un point plus épais dans le graphe.</p>`,
 setup:['git init','echo "# Site de l\'équipe" > README.md','git add .','git commit -m "Premier commit"','git switch -c contact','echo "<h1>Contact</h1>" > contact.html','git add .','git commit -m "Ajoute la page contact"','git switch main'],
 intro:'Dépôt prêt : la branche contact a un commit d\'avance sur main. Vous êtes sur main.',
 tasks:[
  {t:'Fusionnez <code>contact</code> dans main. Main n\'a pas bougé : ce sera un fast-forward.',cmd:'git merge contact',ok:()=>curBranch()==='main'&&B('main')===B('contact')},
  {t:'Créez et rejoignez une branche <code>galerie</code>',cmd:'git switch -c galerie',ok:()=>curBranch()==='galerie'},
  {t:'Ajoutez un commit sur galerie',cmd:'echo "<h1>Galerie</h1>" > galerie.html && git add . && git commit -m "Ajoute la galerie"',ok:()=>B('galerie')!==B('main')&&isAnc(B('main'),B('galerie'))},
  {t:'Revenez sur main et faites-y aussi un commit. Les deux branches divergent.',cmd:'git switch main && echo "Bientôt : une galerie photo" >> README.md && git commit -am "Annonce la galerie"',ok:()=>curBranch()==='main'&&!isAnc(B('main'),B('galerie'))&&!isAnc(B('galerie'),B('main'))},
  {t:'Fusionnez <code>galerie</code> : Git crée un commit à deux parents',cmd:'git merge galerie',ok:()=>headId()&&C(headId()).parents.length===2},
 ]},
{id:'conflit',title:'Résoudre un conflit',short:'merge · conflit',level:'Intermédiaire',xp:60,
 summary:'Deux branches ont modifié la même ligne. C\'est à vous de trancher.',
 theory:`<p>Un conflit arrive quand deux branches changent <b>la même ligne</b> du même fichier. Git ne devine pas : il arrête la fusion et marque le fichier.</p>
 <p>Dans le fichier, la partie entre <code>&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD</code> et <code>=======</code> est votre version. La partie jusqu'à <code>&gt;&gt;&gt;&gt;&gt;&gt;&gt;</code> vient de l'autre branche.</p>
 <p>Pour résoudre : écrivez le contenu final sans les marqueurs, puis <code>git add</code> et <code>git commit</code>. Pour tout annuler : <code>git merge --abort</code>.</p>`,
 setup:['git init','echo "<h1>Bienvenue</h1>" > index.html','git add .','git commit -m "Ajoute le titre"','git switch -c titre','echo "<h1>Bienvenue chez nous</h1>" > index.html','git commit -am "Titre plus chaleureux"','git switch main','echo "<h1>Bonjour à tous</h1>" > index.html','git commit -am "Titre plus direct"'],
 intro:'Dépôt prêt : main et titre ont chacune changé le titre de index.html.',
 tasks:[
  {t:'Lancez la fusion de <code>titre</code> dans main',cmd:'git merge titre',ok:()=>!!S.repo.merging},
  {t:'Ouvrez le fichier en conflit pour lire les marqueurs',cmd:'cat index.html',ok:c=>c.ran(/^(cat|edit|nano|vim?|code) index\.html/)},
  {t:'Écrivez la version finale, sans marqueurs. Vous pouvez aussi cliquer sur le fichier dans la colonne de gauche pour l\'éditer.',cmd:'echo "<h1>Bienvenue à tous</h1>" > index.html',ok:()=>!!S.repo.merging&&W('index.html')!==undefined&&!/^(<<<<<<<|=======|>>>>>>>)/m.test(W('index.html'))},
  {t:'Marquez le conflit comme résolu',cmd:'git add index.html',ok:()=>!!S.repo.merging&&!S.repo.merging.unresolved.length},
  {t:'Terminez la fusion avec un commit',cmd:'git commit -m "Fusionne le nouveau titre"',ok:()=>!S.repo.merging&&headId()&&C(headId()).parents.length===2},
 ]},
{id:'distant',title:'Travailler à plusieurs',short:'remote · push · pull',level:'Avancé',xp:60,
 summary:'Publiez votre travail sur un serveur et récupérez celui d\'une collègue.',
 theory:`<p>Un <b>dépôt distant</b> est une copie du projet sur un serveur, comme GitHub. Par convention, on l'appelle <code>origin</code>.</p>
 <p><code>git push</code> envoie vos commits. <code>git fetch</code> télécharge ceux des autres sans toucher à vos fichiers. <code>git pull</code> fait un fetch puis un merge.</p>
 <p>L'étiquette pointillée <code>origin/main</code> dans le graphe est la mémoire locale de l'état du serveur. Elle ne bouge qu'au push ou au fetch.</p>
 <p class="note">L'adresse utilisée ici est simulée : rien ne sort de votre navigateur.</p>`,
 setup:['git init','echo "# Site de l\'équipe" > README.md','git add .','git commit -m "Premier commit"','echo "<h1>Accueil</h1>" > index.html','git add .','git commit -m "Ajoute l\'accueil"'],
 prep(){S.servers[SERVER_URL]={branches:{}}},
 intro:'Dépôt prêt : 2 commits sur main. Un dépôt vide vous attend sur le serveur de l\'équipe.',
 after(line){if(/^git push/.test(line)&&!S.flags.lea){const srv=S.servers[SERVER_URL];if(srv&&srv.branches.main){S.flags.lea=true;const owner=S;
   setTimeout(()=>{if(S!==owner)return;const p=srv.branches.main,t={...C(p).tree};t['README.md']=(t['README.md']||'')+'\nContact : equipe@exemple.fr';
     srv.branches.main=mkCommit('Ajoute le contact dans le README',[p],t,'Léa');
     o('# Léa vient de pousser un commit sur le serveur.','c-sys');scrollOut();
     toast('Léa a poussé un commit','Le serveur a avancé. Votre copie locale ne le sait pas encore.');renderAll()},1400)}}},
 tasks:[
  {t:'Déclarez le serveur de l\'équipe sous le nom <code>origin</code>',cmd:`git remote add origin ${SERVER_URL}`,ok:()=>!!S.repo.remotes.origin},
  {t:'Poussez main et liez-la au serveur avec <code>-u</code>',cmd:'git push -u origin main',ok:()=>{const s=S.servers[S.repo.remotes.origin];return s&&!!s.branches.main&&S.repo.upstream.main==='origin'}},
  {t:'Attendez le message de Léa, puis récupérez son travail sans fusionner. Regardez <code>origin/main</code> avancer.',cmd:'git fetch',ok:()=>{const s=S.servers[SERVER_URL];return S.flags.lea&&S.repo.tracking['origin/main']===s.branches.main&&C(s.branches.main).author==='Léa'}},
  {t:'Intégrez ses commits dans votre main',cmd:'git pull',ok:()=>{const s=S.servers[SERVER_URL];return S.flags.lea&&B('main')===s.branches.main}},
 ]},
{id:'stash',title:'Mettre de côté',short:'stash',level:'Avancé',xp:50,
 summary:'Une urgence tombe en plein travail. Rangez vos changements, corrigez, puis reprenez.',
 theory:`<p><code>git stash</code> range vos modifications non commitées sur une étagère et rend un dossier propre. Pratique quand Git refuse de changer de branche.</p>
 <p><code>git stash pop</code> remet le dernier changement rangé et le retire de l'étagère. <code>git stash list</code> montre ce qui est rangé.</p>`,
 setup:['git init','echo "<h1>Accueil</h1>" > index.html','git add .','git commit -m "Ajoute l\'accueil"','git switch -c correctif','echo "<h1>Accueil</h1>\\n<p>Horaires corrigés : 9h-18h</p>" > index.html','git commit -am "Corrige les horaires"','git switch main'],
 intro:'Dépôt prêt : vous êtes sur main. La branche correctif modifie aussi index.html.',
 tasks:[
  {t:'Commencez un brouillon dans <code>index.html</code>',cmd:'echo "<p>Brouillon de la newsletter</p>" >> index.html',ok:()=>W('index.html')!==HT('index.html')},
  {t:'Urgence ! Essayez d\'aller sur <code>correctif</code>. Lisez la réponse de Git.',cmd:'git switch correctif',ok:c=>c.ran(/^git (switch|checkout) correctif/)},
  {t:'Rangez votre brouillon sur l\'étagère',cmd:'git stash',ok:()=>S.repo.stash.length>0},
  {t:'Allez maintenant sur <code>correctif</code>',cmd:'git switch correctif',ok:()=>curBranch()==='correctif'},
  {t:'Revenez sur main et ressortez votre brouillon',cmd:'git switch main && git stash pop',ok:()=>curBranch()==='main'&&!S.repo.stash.length&&/Brouillon/.test(W('index.html')||'')},
 ]},
{id:'rebase',title:'Un historique linéaire',short:'rebase',level:'Avancé',xp:60,
 summary:'Rejouez vos commits au-dessus de main pour garder une histoire en ligne droite.',
 theory:`<p><code>git rebase main</code> prend les commits de votre branche et les <b>rejoue</b> au-dessus du dernier commit de main. Le résultat est une ligne droite, sans commit de fusion.</p>
 <p>Les commits rejoués sont de nouveaux commits : leur hash change. Les anciens disparaissent du graphe.</p>
 <p class="note">Règle d'or : ne rebasez pas des commits déjà poussés et utilisés par d'autres.</p>`,
 setup:['git init','echo "# Blog" > README.md','git add .','git commit -m "Premier commit"','git switch -c article','echo "<h1>Mon premier article</h1>" > article.html','git add .','git commit -m "Rédige l\'article"','git switch main','echo "body { font-family: serif; }" > style.css','git add .','git commit -m "Ajoute le style"','git switch article'],
 intro:'Dépôt prêt : main et article ont divergé. Vous êtes sur article.',
 tasks:[
  {t:'Observez les deux branches dans l\'historique complet',cmd:'git log --oneline --all',ok:c=>c.ran(/^git log/)},
  {t:'Rejouez votre article au-dessus de main',cmd:'git rebase main',ok:()=>curBranch()==='article'&&isAnc(B('main'),B('article'))},
  {t:'Intégrez-le dans main : c\'est maintenant un simple fast-forward',cmd:'git switch main && git merge article',ok:()=>B('main')===B('article')&&curBranch()==='main'},
 ]},
{id:'enquete',title:'Ignorer et enquêter',short:'.gitignore · blame',level:'Intermédiaire',xp:50,
 summary:'Cachez les fichiers inutiles et retrouvez qui a écrit quoi, et quand.',
 theory:`<p>Certains fichiers n'ont rien à faire dans l'historique : journaux, fichiers temporaires, mots de passe. Listez-les dans un fichier <code>.gitignore</code> : Git ne les montre plus dans <code>git status</code> et <code>git add .</code> les laisse de côté.</p>
 <p>Le motif <code>*.log</code> ignore tous les fichiers qui finissent par .log. Une ligne qui commence par <code>!</code> crée une exception.</p>
 <p>Pour enquêter : <code>git log fichier</code> liste les commits qui ont touché ce fichier, <code>git blame fichier</code> montre qui a écrit chaque ligne, et <code>git log -G texte</code> retrouve les commits qui ont ajouté ou retiré ce texte.</p>
 <p class="note">.gitignore n'agit que sur les fichiers non suivis. Un fichier déjà commité reste suivi : retirez-le d'abord avec <code>git rm --cached</code>.</p>`,
 setup:['git init','git config user.name "Sam"','echo "<h1>Accueil</h1>" > index.html','git add .','git commit -m "Ajoute l\'accueil"','git config user.name "Léa"','echo "<h1>Accueil</h1>\\n<p>Ouvert le samedi</p>" > index.html','git commit -am "Ajoute les horaires du samedi"','echo "body { color: navy; }" > style.css','git add .','git commit -m "Ajoute le style"','git config user.name "Sam"','echo "<h1>Accueil</h1>\\n<p>Ouvert le samedi</p>\\n<p>Fermé en août</p>" > index.html','git commit -am "Annonce la fermeture d\'août"'],
 prep(){delete S.config['user.name']},
 intro:'Dépôt prêt : 4 commits écrits par Sam et Léa.',
 tasks:[
  {t:'Votre site écrit un journal d\'erreurs. Créez <code>debug.log</code>',cmd:'echo "erreur 42 à 10h04" > debug.log',ok:()=>W('debug.log')!==undefined},
  {t:'Demandez à Git d\'ignorer tous les fichiers <code>.log</code>',cmd:'echo "*.log" > .gitignore',ok:()=>isIgnored('debug.log')},
  {t:'Vérifiez : debug.log a disparu de <code>git status</code>',cmd:'git status',ok:c=>c.ran(/^git status/)},
  {t:'Commitez le fichier <code>.gitignore</code> pour toute l\'équipe',cmd:'git add .gitignore && git commit -m "Ignore les fichiers de log"',ok:()=>HT('.gitignore')!==undefined},
  {t:'Listez les commits qui ont touché <code>index.html</code>',cmd:'git log --oneline index.html',ok:c=>c.ran(/^git log\b.*index\.html/)},
  {t:'Qui a annoncé la fermeture d\'août ? Demandez à <code>git blame</code>',cmd:'git blame index.html',ok:c=>c.ran(/^git blame/)},
  {t:'Retrouvez le commit qui a parlé du samedi',cmd:'git log -G samedi --oneline',ok:c=>c.ran(/^git log\b.*-G/)},
 ]},
{id:'reparer',title:'Réparer ses erreurs',short:'amend · reflog · cherry-pick',level:'Avancé',xp:60,
 summary:'Corrigez un commit, retrouvez un travail perdu et récupérez un seul commit d\'une autre branche.',
 theory:`<p><code>git commit --amend</code> remplace le dernier commit : pratique pour corriger une faute dans le message ou ajouter un fichier oublié.</p>
 <p><code>git reset HEAD^</code> annule le dernier commit mais garde vos fichiers. Si vous allez trop loin, <code>git reflog</code> liste toutes les positions passées de HEAD, et <code>git reset --hard HEAD@{1}</code> y revient.</p>
 <p><code>git cherry-pick</code> copie un seul commit d'une autre branche sur la vôtre. <code>git clean</code> supprime les fichiers non suivis : regardez toujours avec <code>-n</code> avant de lancer <code>-f</code>.</p>
 <p class="note">amend et reset réécrivent l'historique. Ne le faites pas sur des commits déjà poussés et partagés.</p>`,
 setup:['git init','echo "<h1>Accueil</h1>" > index.html','git add .','git commit -m "Ajoute l\'accueil"','git switch -c essais','echo "test" > test.txt','git add .','git commit -m "Test raté"','echo "<footer>© 2026</footer>" > footer.html','git add .','git commit -m "Ajoute le pied de page"','git switch main','echo "<h1>Contact</h1>" > contact.html','git add .','git commit -m "Ajoute la page contcat"'],
 prep(){S.work['brouillon.txt']='idées à jeter'},
 intro:'Dépôt prêt : le dernier commit de main contient une faute, et la branche essais cache un commit utile.',
 tasks:[
  {t:'Le dernier message dit « contcat ». Corrigez-le',cmd:'git commit --amend -m "Ajoute la page contact"',ok:()=>{const m=C(headId()).msg;return curBranch()==='main'&&!/contcat/.test(m)&&/contact/i.test(m)&&HT('contact.html')!==undefined}},
  {t:'Annulez ce commit en gardant le fichier sur le disque',cmd:'git reset HEAD^',ok:()=>HT('contact.html')===undefined&&W('contact.html')!==undefined},
  {t:'Finalement, vous le vouliez. Affichez le journal des positions de HEAD',cmd:'git reflog',ok:c=>c.ran(/^git reflog/)},
  {t:'Revenez à la position d\'avant le reset',cmd:'git reset --hard HEAD@{1}',ok:()=>HT('contact.html')!==undefined&&!/contcat/.test(C(headId()).msg)},
  {t:'Copiez seulement le pied de page de la branche <code>essais</code>, sans le test raté',cmd:'git cherry-pick essais',ok:()=>curBranch()==='main'&&HT('footer.html')!==undefined&&HT('test.txt')===undefined},
  {t:'Regardez quels fichiers non suivis <code>git clean</code> supprimerait',cmd:'git clean -n',ok:c=>c.ran(/^git clean -\w*n/)},
  {t:'Supprimez-les pour de bon',cmd:'git clean -f',ok:()=>W('brouillon.txt')===undefined},
 ]},
{id:'bac',title:'Bac à sable',short:'libre',level:'Libre',xp:0,
 summary:'Un dossier vide et toutes les commandes. Testez ce que vous voulez.',
 theory:`<p>Aucune mission ici. Expérimentez librement : le graphe et les trois zones suivent chacune de vos commandes.</p>
 <p>Un dépôt de démonstration existe sur le serveur simulé. Vous pouvez le cloner tant que le dossier ne contient pas de dépôt.</p>`,
 setup:[],prep(){seedServer()},intro:'Dossier vide. Le dépôt de démonstration est clonable.',
 ideas:[`git clone ${SERVER_URL}`,'git log --oneline --all','git config alias.st status','git reflog','git blame index.html','git switch -c essai','git tag v1.0','git revert HEAD','git switch --detach HEAD~1','git config user.name "Camille"'],
 tasks:[]},
];

/* =========================================================
   Défis : un objectif, un dépôt préparé, aucune commande imposée.
   Chaque objectif vérifie l'état final : plusieurs solutions sont acceptées.
   ========================================================= */
let CH={};
const DIFF=Site.DIFFS;
const isClean=()=>{if(!S.repo||!headId())return false;const c=changes();return !c.staged.length&&!c.unstaged.length&&!c.untracked.length};
const noMarkers=f=>{const t=HT(f);return t!==undefined&&!/^(<<<<<<<|=======|>>>>>>>)/m.test(t)};
const srvMain=()=>{const s=S.servers[SERVER_URL];return s&&s.branches.main};
const CHALLENGES=[
{id:'d-premier-pas',
 brief:'Le dossier est vide. Créez un dépôt, écrivez un fichier README.md et enregistrez-le dans un premier commit. À la fin, le répertoire de travail doit être propre.',
 hint:'Trois gestes : créer le dépôt, préparer le fichier dans l\'index, puis prendre la photo.',
 setup:[],intro:'Dossier vide. À vous de jouer.',
 goals:[
  {t:'Un dépôt Git existe',ok:()=>!!S.repo},
  {t:'<code>README.md</code> est dans le dernier commit',ok:()=>!!headId()&&HT('README.md')!==undefined},
  {t:'Le répertoire de travail est propre',ok:isClean}]},
{id:'d-oups',
 brief:'Vous avez tout indexé d\'un coup, y compris secret.txt qui contient un mot de passe. Retirez-le de l\'index sans le supprimer du disque, puis commitez seulement la modification de index.html.',
 hint:'Une commande désindexe un fichier sans toucher au disque : git status vous la rappelle.',
 setup:['git init','echo "<h1>Accueil</h1>" > index.html','git add .','git commit -m "Ajoute l\'accueil"','echo "mot de passe : 1234" > secret.txt','echo "<p>Nouveautés</p>" >> index.html','git add .'],
 intro:'secret.txt et index.html sont dans l\'index.',
 goals:[
  {t:'<code>secret.txt</code> n\'est dans aucun commit',ok:()=>!!headId()&&[...ancestors(headId())].every(id=>C(id).tree['secret.txt']===undefined)},
  {t:'<code>secret.txt</code> est toujours sur le disque',ok:()=>W('secret.txt')!==undefined},
  {t:'La modification de <code>index.html</code> est commitée',ok:()=>(HT('index.html')||'').includes('Nouveautés')}]},
{id:'d-version',
 brief:'La version stable du site est celle qui a ajouté la page contact, pas la dernière. Posez l\'étiquette v1.0 exactement sur ce commit-là.',
 hint:'Retrouvez le bon commit dans l\'historique compact, puis donnez son hash à git tag.',
 setup:['git init','echo "# Site" > README.md','git add .','git commit -m "Premier commit"','echo "<h1>Contact</h1>" > contact.html','git add .','git commit -m "Ajoute la page contact"','echo "<h1>Galerie</h1>" > galerie.html','git add .','git commit -m "Ajoute la galerie (instable)"'],
 intro:'3 commits sur main. Le dernier n\'est pas stable.',
 goals:[
  {t:'L\'étiquette <code>v1.0</code> existe',ok:()=>!!(S.repo&&S.repo.tags['v1.0'])},
  {t:'Elle désigne le commit « Ajoute la page contact »',ok:()=>{const t=S.repo&&S.repo.tags['v1.0'];return !!t&&C(t).msg==='Ajoute la page contact'}}]},
{id:'d-menage',
 brief:'Le dossier se remplit de journaux (.log) et de fichiers temporaires (.tmp). Faites en sorte que Git les ignore pour toujours, pour toute l\'équipe. Mais notes.txt doit rester visible : il sera commité plus tard.',
 hint:'Un seul fichier, un motif par ligne, et pensez à le commiter pour que l\'équipe en profite.',
 setup:['git init','echo "<h1>Accueil</h1>" > index.html','git add .','git commit -m "Ajoute l\'accueil"','echo "erreur 42" > debug.log','echo "erreur 51" > erreurs.log','echo "cache" > cache.tmp','echo "à faire" > notes.txt'],
 intro:'4 fichiers non suivis traînent dans le dossier.',
 goals:[
  {t:'Les <code>.log</code> et <code>.tmp</code> sont ignorés',ok:()=>!!S.repo&&isIgnored('debug.log')&&isIgnored('erreurs.log')&&isIgnored('cache.tmp')},
  {t:'<code>notes.txt</code> n\'est pas ignoré',ok:()=>!!S.repo&&!isIgnored('notes.txt')},
  {t:'La règle est commitée telle quelle',ok:()=>HT('.gitignore')!==undefined&&HT('.gitignore')===W('.gitignore')},
  {t:'Aucun journal ni fichier temporaire n\'est commité',ok:()=>!!headId()&&Object.keys(headTree()).every(f=>!/\.(log|tmp)$/.test(f))}]},
{id:'d-sauvetage',
 brief:'Quelqu\'un a supprimé la branche experience avec git branch -D, et ses deux commits ont disparu du graphe. Recréez la branche experience exactement là où elle s\'arrêtait.',
 hint:'Git garde la trace de toutes les positions de HEAD. Et une branche peut naître sur n\'importe quel commit : git branch nom hash.',
 setup:['git init','echo "# Labo" > README.md','git add .','git commit -m "Premier commit"','git switch -c experience','echo "<p>Essai</p>" > experience.html','git add .','git commit -m "Commence l\'expérience"','echo "<p>Résultat</p>" >> experience.html','git commit -am "Termine l\'expérience"','git switch main','git branch -D experience'],
 intro:'La branche experience vient d\'être supprimée.',
 goals:[
  {t:'La branche <code>experience</code> existe',ok:()=>B('experience')!==undefined},
  {t:'Elle pointe sur « Termine l\'expérience »',ok:()=>{const b=B('experience');return !!b&&C(b).msg==='Termine l\'expérience'}}]},
{id:'d-squash',
 brief:'La branche galerie contient trois commits brouillons (wip). Intégrez tout son travail dans main en un seul commit propre : pas de commit de fusion, pas de message wip.',
 hint:'git merge a une option qui prépare tout dans l\'index sans créer de commit : il ne reste qu\'à commiter vous-même.',
 setup:['git init','echo "# Site" > README.md','git add .','git commit -m "Premier commit"','git switch -c galerie','echo "<h1>Galerie</h1>" > galerie.html','git add .','git commit -m "wip 1"','echo "<img src=chat.jpg>" >> galerie.html','git commit -am "wip 2"','echo "<img src=chien.jpg>" >> galerie.html','git commit -am "wip 3 enfin"','git switch main'],
 prep(){CH.galerie=C(B('galerie')).tree['galerie.html']},
 intro:'galerie a 3 commits brouillons d\'avance sur main.',
 goals:[
  {t:'<code>main</code> contient la galerie complète',ok:()=>{const m=B('main');return !!m&&C(m).tree['galerie.html']===CH.galerie}},
  {t:'Un seul nouveau commit sur <code>main</code>',ok:()=>{const m=B('main');return !!m&&ancestors(m).size===2}},
  {t:'Ni commit de fusion, ni message wip',ok:()=>{const m=B('main');return !!m&&[...ancestors(m)].every(id=>C(id).parents.length<2&&!/wip/i.test(C(id).msg))}}]},
{id:'d-double-conflit',
 brief:'Fusionnez la branche refonte dans main. Les deux branches ont modifié index.html et style.css : il y aura deux conflits. Gardez le texte que vous voulez, mais plus aucun marqueur.',
 hint:'Un fichier à la fois : éditez-le, git add, puis commitez quand git status ne signale plus de conflit.',
 setup:['git init','echo "<h1>Bienvenue</h1>" > index.html','echo "h1 { color: navy; }" > style.css','git add .','git commit -m "Premier jet"','git switch -c refonte','echo "<h1>Bienvenue chez nous</h1>" > index.html','echo "h1 { color: tomato; }" > style.css','git commit -am "Refonte du titre"','git switch main','echo "<h1>Bonjour à tous</h1>" > index.html','echo "h1 { color: teal; }" > style.css','git commit -am "Nouveau titre"'],
 intro:'main et refonte ont modifié les mêmes lignes de deux fichiers.',
 goals:[
  {t:'La fusion se termine par un commit à deux parents',ok:()=>!!headId()&&!S.repo.merging&&C(headId()).parents.length===2},
  {t:'<code>index.html</code> n\'a plus de marqueurs',ok:()=>noMarkers('index.html')},
  {t:'<code>style.css</code> n\'a plus de marqueurs',ok:()=>noMarkers('style.css')},
  {t:'La branche <code>refonte</code> est intégrée à main',ok:()=>!!B('main')&&isAnc(B('refonte'),B('main'))}]},
{id:'d-bon-commit',
 brief:'La branche essais mélange des tests ratés et une vraie correction : « Corrige la faute du titre ». Ramenez seulement cette correction sur main, sans les fichiers de test et sans fusionner la branche.',
 hint:'Une commande copie un seul commit d\'une branche à l\'autre. Donnez-lui le hash de la correction.',
 setup:['git init','echo "<h1>Bienvenu</h1>" > index.html','git add .','git commit -m "Ajoute l\'accueil"','git switch -c essais','echo "test" > test1.txt','git add .','git commit -m "Test 1"','echo "<h1>Bienvenue</h1>" > index.html','git commit -am "Corrige la faute du titre"','echo "test" > test2.txt','git add .','git commit -m "Test 2"','git switch main'],
 intro:'Le titre de main a une faute ; essais contient la correction, entre deux tests.',
 goals:[
  {t:'Le titre est corrigé sur <code>main</code>',ok:()=>{const m=B('main');return !!m&&C(m).tree['index.html']==='<h1>Bienvenue</h1>'}},
  {t:'Aucun fichier de test sur <code>main</code>',ok:()=>{const m=B('main');return !!m&&!C(m).tree['test1.txt']&&!C(m).tree['test2.txt']}},
  {t:'La branche essais n\'est pas fusionnée',ok:()=>{const m=B('main');return !!m&&!isAnc(B('essais'),m)&&[...ancestors(m)].every(id=>C(id).parents.length<2)}}]},
{id:'d-amend',
 brief:'Le dernier commit s\'appelle « azerty lol » et il lui manque un fichier : oubli.txt. Réparez ce commit : un vrai message et oubli.txt dedans, sans ajouter de commit à l\'historique.',
 hint:'Indexez le fichier oublié, puis remplacez le dernier commit au lieu d\'en créer un nouveau.',
 setup:['git init','echo "# Site" > README.md','git add .','git commit -m "Premier commit"','echo "<h1>Accueil</h1>" > index.html','git add .','git commit -m "azerty lol"','echo "à ne pas oublier" > oubli.txt'],
 intro:'2 commits, le dernier mal nommé. oubli.txt n\'est pas suivi.',
 goals:[
  {t:'Le dernier message ne contient plus « lol »',ok:()=>!!headId()&&!/lol/i.test(C(headId()).msg)},
  {t:'<code>oubli.txt</code> est dans le dernier commit',ok:()=>HT('oubli.txt')!==undefined},
  {t:'L\'historique compte toujours 2 commits',ok:()=>!!headId()&&ancestors(headId()).size===2&&HT('index.html')!==undefined}]},
{id:'d-course',
 brief:'Léa a poussé un commit pendant que vous travailliez sur le pied de page. Publiez votre travail sur origin sans créer de commit de fusion : l\'historique du serveur doit rester une ligne droite, avec son commit et le vôtre.',
 hint:'git pull a une option qui rejoue vos commits au-dessus de ceux du serveur au lieu de fusionner.',
 setup:['git init','echo "# Site" > README.md','git add .','git commit -m "Premier commit"','echo "<h1>Accueil</h1>" > index.html','git add .','git commit -m "Ajoute l\'accueil"',`git remote add origin ${SERVER_URL}`,'git push -u origin main','echo "<footer>© 2026</footer>" > footer.html','git add .','git commit -m "Ajoute le pied de page"'],
 prep(){const srv=S.servers[SERVER_URL],p=srv.branches.main,t={...C(p).tree,'contact.html':'<h1>Contact</h1>'};srv.branches.main=CH.lea=mkCommit('Ajoute la page contact',[p],t,'Léa')},
 intro:'Vous avez 1 commit à publier, Léa en a poussé 1 entre-temps.',
 goals:[
  {t:'Le serveur contient votre pied de page',ok:()=>{const s=srvMain();return !!s&&C(s).tree['footer.html']!==undefined}},
  {t:'Le serveur garde le commit de Léa',ok:()=>{const s=srvMain();return !!s&&isAnc(CH.lea,s)}},
  {t:'L\'historique du serveur est une ligne droite',ok:()=>{const s=srvMain();return !!s&&[...ancestors(s)].every(id=>C(id).parents.length<2)}},
  {t:'Votre <code>main</code> est à jour avec le serveur',ok:()=>!!B('main')&&B('main')===srvMain()}]},
{id:'d-enquete',
 brief:'Le titre du site est cassé : une balise </h11> s\'est glissée dans index.html. Trouvez le commit coupable et annulez-le proprement, sans réécrire l\'historique : les commits suivants doivent rester.',
 hint:'git log -G ou git blame désignent le coupable ; git revert l\'annule en ajoutant un commit.',
 setup:['git init','git config user.name "Sam"','echo "<h1>Accueil</h1>" > index.html','git add .','git commit -m "Ajoute l\'accueil"','git config user.name "Léa"','echo "h1 { color: navy; }" > style.css','git add .','git commit -m "Ajoute le style"','git config user.name "Malo"','echo "<h1>Accueil</h1>\\n<p>Horaires</p>" > index.html','git commit -am "Ajoute les horaires"','git config user.name "Léa"','echo "<h1>Accueil</h11>\\n<p>Horaires</p>" > index.html','git commit -am "Améliore le titre"','git config user.name "Sam"','echo "<h1>Contact</h1>" > contact.html','git add .','git commit -m "Ajoute le contact"','git config user.name "Malo"','echo "# Site de l\'équipe" > README.md','git add .','git commit -m "Ajoute le README"'],
 prep(){delete S.config['user.name'];CH.orig=headId()},
 intro:'6 commits de Sam, Léa et Malo. L\'un d\'eux a cassé le titre.',
 goals:[
  {t:'<code>index.html</code> n\'a plus de <code>&lt;/h11&gt;</code>',ok:()=>HT('index.html')!==undefined&&!HT('index.html').includes('</h11>')},
  {t:'Un commit d\'annulation existe',ok:()=>!!headId()&&[...ancestors(headId())].some(id=>/^Revert/.test(C(id).msg))},
  {t:'Les commits existants sont tous conservés',ok:()=>!!headId()&&headId()!==CH.orig&&isAnc(CH.orig,headId())}]},
];
CHALLENGES.forEach(c=>{const m=Site.CHALLENGES_META.find(x=>x.id===c.id);Object.assign(c,m,{kind:'defi',tasks:[],level:DIFF[m.diff].label,summary:c.brief,theory:''})});
LESSONS.push(...CHALLENGES);
function seedServer(){const t1={'README.md':'# Site de l\'équipe'};const a=mkCommit('Premier commit',[],t1,'Sam');
  const t2={...t1,'index.html':'<h1>Accueil</h1>'};const b=mkCommit('Ajoute l\'accueil',[a],t2,'Léa');
  const t3={...t2,'style.css':'h1 { color: tomato; }'};const c=mkCommit('Ajoute le style',[b],t3,'Sam');
  const d=mkCommit('Brouillon du blog',[b],{...t2,'blog.html':'<h1>Blog</h1>'},'Léa');
  S.servers[SERVER_URL]={branches:{main:c,blog:d}}}

/* =========================================================
   Progression & état de la leçon
   ========================================================= */
let cur=0,taskIdx=0,since=0;const shown=new Set();
let chHint=false,chDone=false,chStart=0,chTimer=0,sideTab='lecons',lastGoals=[];
let P={done:{},xp:0,ch:{}};
try{const raw=localStorage.getItem('atelier-git-progress');if(raw)P=Object.assign(P,JSON.parse(raw))}catch(e){}
P.ch=P.ch||{};
function saveP(){try{localStorage.setItem('atelier-git-progress',JSON.stringify(P))}catch(e){}}
function startLesson(i){cur=i;const L=LESSONS[i];S=fresh();shown.clear();CH={};chHint=false;chDone=false;lastGoals=[];clearInterval(chTimer);sideTab=L.kind==='defi'?'defis':'lecons';try{history.replaceState(null,'','#'+L.id)}catch(e){}
  L.setup.forEach(c=>run(c,true));L.prep&&L.prep();
  S.hist=[];S.flags={};taskIdx=0;since=0;
  outEl.innerHTML='';o(L.kind==='defi'?`# Défi ${L.level} · ${L.title} · +${L.xp} XP`:`# Leçon ${i+1} · ${L.title}`,'c-sys');o('# '+L.intro,'c-sys');o('# Tapez help si vous êtes perdu.','c-sys');
  try{localStorage.setItem('atelier-git-current',String(i))}catch(e){}
  renderSidebar();renderLesson();renderAll();lastGraphIds=new Set(Object.keys(S.objects));
  if(L.kind==='defi'){chStart=performance.now();chTimer=setInterval(tickTimer,1000)}}
function evaluate(){const L=LESSONS[cur];if(L.kind==='defi')return evaluateChallenge(L);let moved=false;
  while(taskIdx<L.tasks.length){const ctx={ran:re=>S.hist.slice(since).some(h=>re.test(h))};let ok=false;try{ok=L.tasks[taskIdx].ok(ctx)}catch(e){ok=false}
    if(!ok)break;taskIdx++;since=S.hist.length;moved=true}
  if(moved){renderTasks(true);
    if(taskIdx===L.tasks.length&&L.tasks.length&&!P.done[L.id]){P.done[L.id]=true;P.xp+=L.xp;saveP();renderSidebar();
      Site.account.sync().then(p=>{if(p)toast('Classement mis à jour',`${p.pseudo} · ${p.xp} XP`,'ok')}).catch(()=>{});
      toast('Leçon terminée',`+${L.xp} XP · ${L.title}`,'ok');Site.celebrate()}}}

/* =========================================================
   Rendu
   ========================================================= */
function renderSidebar(){const lessons=LESSONS.filter(l=>l.kind!=='defi'),chals=LESSONS.filter(l=>l.kind==='defi');
  const ld=lessons.filter(l=>l.tasks.length&&P.done[l.id]).length,cd=chals.filter(c=>P.ch[c.id]).length,defis=sideTab==='defis';
  Site.showXp(P.xp);
  $('#tabLecons').setAttribute('aria-selected',String(!defis));$('#tabDefis').setAttribute('aria-selected',String(defis));
  $('#sideTitle').textContent=defis?'Défis':'Parcours';
  $('#progTxt').textContent=defis?`${cd} / ${chals.length}`:`${ld} / ${NB_LESSONS}`;
  $('#progBar').style.width=(defis?cd/chals.length:ld/NB_LESSONS)*100+'%';
  $('#lessonList').innerHTML=(defis?chals:lessons).map(l=>{const i=LESSONS.indexOf(l),done=defis?P.ch[l.id]:P.done[l.id];
    const num=done?'✓':defis?DIFF[l.diff].n:(l.tasks.length?i+1:'∞');
    return `<li><button type="button" class="lbtn${i===cur?' active':''}${done?' done':''}${defis?' d-'+l.diff:''}" data-i="${i}"${i===cur?' aria-current="step"':''}><span class="num">${num}</span><span><span class="lt">${esc(l.title)}</span><span class="ls">${defis?`${DIFF[l.diff].label} · +${l.xp} XP`:esc(l.short)}</span></span></button></li>`}).join('')}
function renderLesson(){const L=LESSONS[cur];if(L.kind==='defi')return renderChallenge(L);
  $('#lesson').innerHTML=`<div class="lesson-top"><span class="chip${L.level==='Avancé'?' hot':''}">${L.level}</span><span class="muted">${L.tasks.length?`Leçon ${cur+1} sur ${NB_LESSONS}`:'Mode libre'}</span></div>
  <h1>${esc(L.title)}</h1><p class="lede">${esc(L.summary)}</p>
  <details class="theory" open><summary>Comprendre</summary><div class="prose">${L.theory}</div></details>
  <div class="missions">${L.tasks.length?`<div class="mh"><h2>Missions</h2><span class="muted" id="mcount"></span></div><ol id="tasks"></ol><div id="banner"></div>`:
   `<div class="mh"><h2>Idées à essayer</h2></div><ul class="ideas">${L.ideas.map(c=>`<li><span class="hint"><span class="ins">À taper</span>${esc(c)}</span></li>`).join('')}</ul>`}</div>
  <div class="lesson-actions"><button class="gbtn" type="button" id="btnRestart">Recommencer</button>${nextOf(cur)>=0?`<button class="gbtn primary" type="button" id="btnNext">Leçon suivante</button>`:''}</div>`;
  $('#btnRestart').onclick=()=>startLesson(cur);const n=$('#btnNext');if(n)n.onclick=()=>{startLesson(nextOf(cur));window.scrollTo({top:0,behavior:'smooth'})};
  renderTasks(false)}
function renderTasks(animate){const L=LESSONS[cur];const el=$('#tasks');if(!el)return;
  el.innerHTML=L.tasks.map((t,i)=>{const st=i<taskIdx?'done':i===taskIdx?'current':'todo';
    return `<li class="task ${st}${animate&&i===taskIdx-1?' pop':''}"><span class="mk" aria-hidden="true"></span><div class="tt"><div>${t.t}</div>${st==='current'?(shown.has(cur+':'+i)?`<div class="hintrow"><span class="hint"><span class="ins">À taper</span>${esc(t.cmd)}</span></div>`:`<div class="hintrow"><button type="button" class="reveal" data-reveal="${i}">Afficher l'indice</button></div>`):''}</div></li>`}).join('');
  $('#mcount').textContent=`${Math.min(taskIdx,L.tasks.length)} / ${L.tasks.length}`;
  $('#banner').innerHTML=taskIdx>=L.tasks.length?`<div class="done-banner"><span class="seal" aria-hidden="true">✓</span><b>Leçon réussie</b><span class="muted">${L.xp?`+${L.xp} XP. `:''}Explorez encore ou passez à la suite.</span></div>`:'';
  const nb=$('#btnNext');if(nb)nb.classList.toggle('primary',taskIdx>=L.tasks.length)}
const NB_LESSONS=LESSONS.filter(l=>l.kind!=='defi'&&l.tasks.length).length;
const nextOf=i=>{const k=LESSONS[i].kind==='defi';return LESSONS.findIndex((l,j)=>j>i&&(l.kind==='defi')===k)};
/* ----- Défis : affichage, objectifs en direct, chronomètre ----- */
function renderChallenge(L){const d=DIFF[L.diff],nx=nextOf(cur);
  $('#lesson').innerHTML=`<div class="lesson-top"><span class="chip diff d-${L.diff}"><span class="dmeter" aria-hidden="true"><i></i><i></i><i></i><i></i></span>${d.label}</span><span class="xp-reward">+${L.xp} XP</span></div>
  <h1>${esc(L.title)}</h1><p class="lede">${esc(L.brief)}</p>
  <div class="chal-stats"><span><b id="chCmds">0</b> commande<span id="chS">s</span></span><span>Temps <b id="chTime">0:00</b></span>${P.ch[L.id]?'<span class="chip ok-chip">Déjà réussi</span>':''}</div>
  <div class="missions"><div class="mh"><h2>Objectifs</h2><span class="muted" id="mcount"></span></div><ul class="goals" id="goals"></ul><div id="banner"></div></div>
  <div class="hint-box" id="hintBox"></div>
  <div class="lesson-actions"><button class="gbtn" type="button" id="btnRestart">Recommencer</button>${nx>=0?'<button class="gbtn" type="button" id="btnNext">Défi suivant</button>':'<a class="gbtn" href="defis.html">Tous les défis</a>'}</div>`;
  $('#btnRestart').onclick=()=>startLesson(cur);const n=$('#btnNext');if(n)n.onclick=()=>{startLesson(nx);window.scrollTo({top:0,behavior:'smooth'})};
  renderHint(L);renderGoals(goalStates(L))}
function renderHint(L){const box=$('#hintBox');if(!box)return;
  box.innerHTML=chHint?`<p class="hint-text"><b>Indice</b> ${esc(L.hint)}</p>`:'<button class="reveal" type="button" id="btnHint">Afficher l\'indice</button>';
  const b=$('#btnHint');if(b)b.onclick=()=>{chHint=true;renderHint(L);cmd.focus({preventScroll:true})}}
const goalStates=L=>L.goals.map(g=>{try{return !!g.ok()}catch(e){return false}});
function renderGoals(st){const L=LESSONS[cur],el=$('#goals');if(!el)return;
  el.innerHTML=L.goals.map((g,i)=>`<li class="goal${st[i]?' ok':''}${st[i]&&!lastGoals[i]?' pop':''}"><span class="mk" aria-hidden="true"></span><span>${g.t}</span></li>`).join('');
  lastGoals=st;$('#mcount').textContent=`${st.filter(Boolean).length} / ${st.length}`}
const fmtTime=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
function tickTimer(){const el=$('#chTime');if(el&&LESSONS[cur].kind==='defi'&&!chDone)el.textContent=fmtTime(Math.floor((performance.now()-chStart)/1000))}
function evaluateChallenge(L){const st=goalStates(L);renderGoals(st);const n=S.hist.length,c=$('#chCmds');if(c){c.textContent=n;$('#chS').textContent=n>1?'s':''}
  if(chDone||!st.every(Boolean))return;
  tickTimer();chDone=true;clearInterval(chTimer);const secs=Math.round((performance.now()-chStart)/1000),first=!P.ch[L.id];
  if(first){P.ch[L.id]=true;P.xp+=L.xp;saveP();renderSidebar();Site.account.sync().then(p=>{if(p)toast('Classement mis à jour',`${p.pseudo} · ${p.xp} XP`,'ok')}).catch(()=>{})}
  $('#banner').innerHTML=`<div class="done-banner"><span class="seal" aria-hidden="true">✓</span><b>Défi réussi</b><span class="muted">${n} commande${n>1?'s':''} en ${fmtTime(secs)}. ${first?`+${L.xp} XP.`:'Déjà réussi : pas de nouveaux XP, mais bravo.'}</span></div>`;
  const nb=$('#btnNext');if(nb)nb.classList.add('primary');
  Site.celebrate();toast('Défi réussi',first?`+${L.xp} XP · ${L.title}`:`${L.title} · déjà réussi`,'ok')}
function renderPrompt(){let p='vous@atelier ~/projet';if(S.repo){const r=S.repo;let b=r.head.type==='branch'?r.head.name:r.head.id;if(r.merging)b+='|MERGING';p+=` (${b})`}$('#prompt').textContent=p+' $'}
function fileBtn(f,badge,gone,title,edit){const inner=`<span class="badge ${badge}">${badge==='ok'?'✓':badge}</span><span class="fn">${esc(f)}</span>`;
  return edit?`<button type="button" class="file${gone?' gone':''}" data-file="${esc(f)}" title="${esc(title)} · cliquer pour éditer">${inner}</button>`:`<div class="file${gone?' gone':''}" title="${esc(title)}">${inner}</div>`}
const ARROW=`<svg viewBox="0 0 46 14" aria-hidden="true"><path d="M2 7h38M34 2l6 5-6 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
function renderZones(){const r=S.repo;let wd='',ix='',rp='';
  const files=new Set(Object.keys(S.work));
  if(r)Object.keys(r.index).forEach(f=>files.add(f));
  const ch=r?changes():null,unres=r&&r.merging?r.merging.unresolved:[];
  const sorted=[...files].sort();
  for(const f of sorted){let b='ok',gone=false,t='Fichier à jour';
    if(!r){b='U';t='Pas encore de dépôt'}
    else if(unres.includes(f)){b='C';t='Conflit à résoudre'}
    else if(ch.untracked.includes(f)){b='U';t='Non suivi par Git'}
    else if(ch.ignored.includes(f)){b='I';t='Ignoré grâce à .gitignore'}
    else{const u=ch.unstaged.find(x=>x[0]===f);if(u){if(u[1]==='deleted'){b='D';gone=true;t='Supprimé, pas encore indexé'}else{b='M';t='Modifié, pas encore indexé'}}}
    if(!has(S.work,f))gone=true;
    wd+=fileBtn(f,b,gone,t,!gone)}
  if(!sorted.length)wd='<div class="none">Dossier vide</div>';
  if(!r)ix='<div class="none">Pas de dépôt</div>';
  else{const st=ch.staged.filter(x=>!unres.includes(x[0]));
    ix=st.map(([f,k])=>fileBtn(f,k==='new file'?'A':k==='deleted'?'D':'M',k==='deleted',k==='new file'?'Nouveau fichier prêt':k==='deleted'?'Suppression prête':'Modification prête')).join('')||'<div class="none">Rien de prêt pour le prochain commit</div>'}
  const h=headId();
  if(!r)rp='<div class="none">Tapez git init</div>';
  else if(!h)rp='<div class="none">Aucun commit</div>';
  else{const c=C(h);rp=`<div class="headbox"><div><span class="hh">${h}</span> · ${esc(curBranch()||'HEAD détachée')}</div><div class="msg">${esc(c.msg.split('\n')[0])}</div><div class="muted">${ancestors(h).size} commit${ancestors(h).size>1?'s':''} · ${Object.keys(c.tree).length} fichier${Object.keys(c.tree).length>1?'s':''}${r.stash.length?` · ${r.stash.length} en stash`:''}</div></div>`}
  $('#zones').innerHTML=`<div class="zone"><h4>Répertoire de travail</h4><p class="sub">vos fichiers · cliquez pour éditer</p><div class="flist">${wd}</div></div>
  <div class="arrow">${ARROW}<span>git add</span></div>
  <div class="zone"><h4>Index<small>staging</small></h4><p class="sub">le prochain commit</p><div class="flist">${ix}</div></div>
  <div class="arrow">${ARROW}<span>git commit</span></div>
  <div class="zone"><h4>Dépôt<small>.git</small></h4><p class="sub">l'historique</p>${rp}</div>`}
let lastGraphIds=new Set();
function renderGraph(){const el=$('#graph'),meta=$('#graphMeta');const r=S.repo;
  if(!r){el.innerHTML='<div class="empty">Pas encore de dépôt. Tapez <code>git init</code> pour commencer.</div>';meta.textContent='';return}
  const cb=curBranch(),refs=[];
  Object.keys(r.branches).sort((a,b)=>a==='main'?-1:b==='main'?1:0).forEach(b=>refs.push({name:b,id:r.branches[b],kind:'br'}));
  Object.entries(r.tracking).forEach(([n,id])=>refs.push({name:n,id,kind:'rem'}));
  Object.entries(r.tags).forEach(([n,id])=>refs.push({name:n,id,kind:'tag'}));
  if(r.head.type==='detached')refs.push({name:'HEAD',id:r.head.id,kind:'head'});
  const set=new Set();refs.forEach(x=>ancestors(x.id).forEach(y=>set.add(y)));
  if(!set.size){el.innerHTML=`<div class="empty">Dépôt vide sur <code>${esc(cb||'main')}</code>. Votre premier commit apparaîtra ici.</div>`;meta.textContent='0 commit';return}
  const list=[...set].map(C).sort((a,b)=>a.time-b.time),xi={};list.forEach((c,i)=>xi[c.id]=i);
  const lane={};let nl=0;
  for(const ref of refs){let id=ref.id,used=false;while(id&&lane[id]===undefined){lane[id]=nl;used=true;id=C(id).parents[0]}if(used)nl++}
  list.forEach(c=>{if(lane[c.id]===undefined)lane[c.id]=nl++});
  const byId={};refs.forEach(x=>{(byId[x.id]=byId[x.id]||[]).push(x)});
  const maxStack0=Math.max(1,...Object.entries(byId).filter(([id])=>lane[id]===0).map(([,v])=>v.length));
  const DX=70,DY=66,PX=40,PT=26+maxStack0*22,H=PT+(nl-1)*DY+34;let minX=PX-16,maxX=PX+(list.length-1)*DX+16;
  const pos=id=>[PX+xi[id]*DX,PT+lane[id]*DY],col=i=>`var(--lane${i%5})`;
  let edges='',nodes='',labels='';
  for(const c of list){const [x,y]=pos(c.id);
    c.parents.forEach((p,k)=>{if(!set.has(p))return;const [px,py]=pos(p);const color=col(k===0?lane[c.id]:lane[p]);
      const d=py===y?`M${px},${py} L${x},${y}`:`M${px},${py} C${px+DX*.55},${py} ${x-DX*.55},${y} ${x},${y}`;
      edges+=`<path class="edge" d="${d}" stroke="${color}"/>`})}
  const hId=headId();
  for(const c of list){const [x,y]=pos(c.id);const isNew=!lastGraphIds.has(c.id);
    nodes+=`<g class="node" data-id="${c.id}" tabindex="0" role="button" aria-label="Commit ${c.id} : ${esc(c.msg.split('\n')[0])}. Entrée pour les détails" transform="translate(${x},${y})"><title>${c.id} · ${esc(c.msg.split('\n')[0])} · ${esc(c.author)}</title>${c.id===hId?'<circle r="14" class="halo"/>':''}<circle r="${c.parents.length>1?10:8}" fill="${col(lane[c.id])}" class="dot${c.parents.length>1?' merge':''}${isNew?' new':''}"/><text y="25" class="hash">${c.id.slice(0,4)}</text></g>`}
  for(const [id,rs] of Object.entries(byId)){if(!set.has(id))continue;const [x,y]=pos(id);
    const items=rs.map(rf=>{if(rf.kind==='br'&&rf.name===cb)return {t:'HEAD → '+rf.name,k:'head'};if(rf.kind==='tag')return {t:'tag: '+rf.name,k:'tag'};return {t:rf.name,k:rf.kind}});
    items.sort((a,b)=>(a.k==='head'?-1:0)-(b.k==='head'?-1:0));
    items.forEach((it,k)=>{const w=it.t.length*7+16,ly=y-24-k*22;minX=Math.min(minX,x-w/2-4);maxX=Math.max(maxX,x+w/2+4);labels+=`<g class="lbl ${it.k}"><rect x="${x-w/2}" y="${ly-9}" width="${w}" height="18" rx="9"/><text x="${x}" y="${ly}">${esc(it.t)}</text></g>`})}
  const shift=Math.max(0,4-minX),W=Math.ceil(maxX+shift+4);
  el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-label="Graphe des commits"><g transform="translate(${shift},0)">${edges}${nodes}${labels}</g></svg>`;
  el.scrollLeft=el.scrollWidth;lastGraphIds=new Set(list.map(c=>c.id));
  meta.textContent=`${list.length} commit${list.length>1?'s':''} · ${Object.keys(r.branches).length} branche${Object.keys(r.branches).length>1?'s':''}`}
function renderAll(){renderPrompt();renderZones();renderGraph()}
function scrollOut(){outEl.scrollTo({top:outEl.scrollHeight,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}

/* =========================================================
   Interactions
   ========================================================= */
const cmd=$('#cmd'),hist=[];let hpos=0;
/* ----- Frappe fluide : curseur qui glisse et lettres qui apparaissent en douceur ----- */
const TypeFX=(()=>{const wrap=cmd.parentElement,mirror=document.createElement('div'),track=document.createElement('span'),caret=document.createElement('span');
  mirror.className='cmd-mirror';mirror.setAttribute('aria-hidden','true');track.className='track';caret.className='caret';caret.setAttribute('aria-hidden','true');
  mirror.appendChild(track);wrap.insertBefore(mirror,cmd);wrap.appendChild(caret);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,spans=[];let prev=[],idleT=0,raf=0;
  function apply(stagger){const next=Array.from(cmd.value);let a=0;while(a<prev.length&&a<next.length&&prev[a]===next[a])a++;
    let b=0;while(b<prev.length-a&&b<next.length-a&&prev[prev.length-1-b]===next[next.length-1-b])b++;
    spans.splice(a,prev.length-b-a).forEach(x=>x.remove());
    const frag=document.createDocumentFragment(),added=next.slice(a,next.length-b).map((c,i)=>{const x=document.createElement('span');x.className=reduce?'ch':'ch in';x.textContent=c;
      if(stagger&&!reduce)x.style.animationDelay=Math.min(i*14,420)+'ms';frag.appendChild(x);return x});
    track.insertBefore(frag,spans[a]||null);spans.splice(a,0,...added);prev=next}
  function placeNow(){const v=cmd.value,s0=cmd.selectionStart??v.length,s1=cmd.selectionEnd??s0,idx=Array.from(v.slice(0,s0)).length;
    let x=0;if(idx<spans.length)x=spans[idx].offsetLeft;else if(spans.length){const l=spans[spans.length-1];x=l.offsetLeft+l.offsetWidth}
    const sl=cmd.scrollLeft;track.style.transform=`translateX(${-sl}px)`;caret.style.transform=`translateX(${x-sl}px)`;
    caret.classList.toggle('hidden',s0!==s1);caret.classList.remove('idle');clearTimeout(idleT);idleT=setTimeout(()=>caret.classList.add('idle'),520)}
  function place(){cancelAnimationFrame(raf);placeNow();raf=requestAnimationFrame(placeNow)}
  function sync(stagger){apply(stagger);place()}
  cmd.addEventListener('input',()=>sync(false));
  ['keydown','keyup','click','select','scroll'].forEach(ev=>cmd.addEventListener(ev,place));
  document.addEventListener('selectionchange',()=>{if(document.activeElement===cmd)place()});
  cmd.addEventListener('focus',()=>{wrap.classList.add('focused');place()});cmd.addEventListener('blur',()=>wrap.classList.remove('focused'));
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(place);
  /* Les valeurs posées par le code (historique, complétion, astuces) passent aussi par l'animation. */
  const desc=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
  Object.defineProperty(cmd,'value',{configurable:true,get(){return desc.get.call(this)},
    set(v){const old=desc.get.call(this);desc.set.call(this,v);const grow=String(v).length-old.length;queueMicrotask(()=>sync(grow>3))}});
  if(document.activeElement===cmd)wrap.classList.add('focused');
  return {sync}})();
$('#form').addEventListener('submit',e=>{e.preventDefault();const line=cmd.value;if(!line.trim())return;
  o([[$('#prompt').textContent+' ','c-prompt'],[line,'c-cmd']]);hist.push(line);hpos=hist.length;cmd.value='';
  run(line,false);renderAll();scrollOut()});
cmd.addEventListener('keydown',e=>{
  if(e.key==='ArrowUp'){if(hpos>0){hpos--;cmd.value=hist[hpos]}e.preventDefault()}
  else if(e.key==='ArrowDown'){if(hpos<hist.length-1){hpos++;cmd.value=hist[hpos]}else{hpos=hist.length;cmd.value=''}e.preventDefault()}
  else if(e.key==='Tab'&&!e.shiftKey&&cmd.value.trim()){e.preventDefault();complete()}
  else if(e.key==='l'&&e.ctrlKey){e.preventDefault();outEl.innerHTML=''}});
function complete(){const v=cmd.value,pre=(v.match(/(\S*)$/)||['',''])[1],words=v.trim().split(/\s+/).filter(Boolean),fresh=v.endsWith(' ')||!v;
  let cands;
  if(words.length===0||(words.length===1&&!fresh))cands=[...Object.keys(SH),'git'];
  else if(words[0]==='git'&&(words.length===1&&fresh||words.length===2&&!fresh))cands=Object.keys(G);
  else cands=[...Object.keys(S.work),...(S.repo?[...Object.keys(S.repo.branches),...Object.keys(S.repo.tracking),...Object.keys(S.repo.remotes)]:[])];
  const hits=[...new Set(cands)].filter(c=>c.startsWith(pre));
  if(hits.length===1)cmd.value=v.slice(0,v.length-pre.length)+hits[0]+' ';
  else if(hits.length>1){let p=hits[0];for(const h of hits)while(!h.startsWith(p))p=p.slice(0,-1);if(p.length>pre.length)cmd.value=v.slice(0,v.length-pre.length)+p;else{o(hits.join('  '),'c-dim');scrollOut()}}}
$('#term').addEventListener('click',e=>{if(!e.target.closest('button')&&!window.getSelection().toString())cmd.focus()});
$('#btnClear').onclick=()=>{outEl.innerHTML='';cmd.focus()};
document.addEventListener('click',e=>{
  const rv=e.target.closest('[data-reveal]');if(rv){shown.add(cur+':'+rv.dataset.reveal);renderTasks(false);cmd.focus({preventScroll:true});return}
  const tb=e.target.closest('[data-tab]');if(tb){sideTab=tb.dataset.tab;renderSidebar();return}
  const l=e.target.closest('.lbtn');if(l){startLesson(+l.dataset.i);return}
  const nd=e.target.closest('.node[data-id]');if(nd){const c=C(nd.dataset.id);if(c)toast('Commit '+c.id,`${c.msg.split('\n')[0]} · ${c.author}. Pour voir ses changements, tapez git show ${c.id}.`);return}
  const f=e.target.closest('.file');if(f){openEditor(f.dataset.file);return}});

/* ----- Éditeur ----- */
let edFile=null,edOpts=null;
function openEditor(f,opts){edFile=f;edOpts=opts||null;$('#edTitle').textContent=(opts?'':'Modifier ')+f;$('#edText').value=opts?opts.text:(S.work[f]??'');
  if(opts)$('#edSub').textContent='Git attend votre message de commit. Écrivez-le sur la première ligne puis enregistrez.';else $('#edSub').textContent=S.repo&&S.repo.merging&&S.repo.merging.unresolved.includes(f)?'Conflit : gardez le texte voulu et supprimez les lignes <<<<<<<, ======= et >>>>>>>.':'Le fichier change dans le répertoire de travail. Git ne l\'enregistrera qu\'après add et commit.';
  openOv('#editorOv','#edText')}
let lastFocus=null;
function openOv(s,focusSel){lastFocus=document.activeElement;$(s).hidden=false;document.body.classList.add('modal-open');setTimeout(()=>{const f=$(focusSel);if(f)f.focus()},30)}
function closeOv(s){const el=$(s);if(el.hidden)return;el.hidden=true;if(!document.querySelector('.overlay:not([hidden])'))document.body.classList.remove('modal-open');
  const back=lastFocus&&lastFocus.isConnected&&lastFocus!==document.body?lastFocus:cmd;back.focus()}
$('#edCancel').onclick=()=>{if(edOpts){edOpts=null;err('Aborting commit due to empty commit message.');scrollOut()}closeOv('#editorOv')};
$('#edSave').onclick=()=>{if(edOpts){const op=edOpts;edOpts=null;const txt=$('#edText').value.replace(/\r/g,'');closeOv('#editorOv');op.onSave(txt);evaluate();renderAll();scrollOut();return}
  S.work[edFile]=$('#edText').value.replace(/\r/g,'');closeOv('#editorOv');o(`# ${edFile} enregistré depuis l'éditeur`,'c-sys');
  S.hist.push('edit '+edFile);evaluate();renderAll();scrollOut();cmd.focus()};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#editorOv').hidden)$('#edCancel').click();closeOv('#cheatOv')}
  const ov=document.querySelector('.overlay:not([hidden])');
  if(e.key==='Tab'&&ov){const f=[...ov.querySelectorAll('button,textarea,input')].filter(x=>!x.disabled&&x.offsetParent);if(f.length){const i=f.indexOf(document.activeElement);
    if(e.shiftKey&&i<=0){e.preventDefault();f[f.length-1].focus()}else if(!e.shiftKey&&(i===f.length-1||i<0)){e.preventDefault();f[0].focus()}}}
  if(e.key==='/'&&!ov&&!e.ctrlKey&&!e.metaKey&&!/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)){e.preventDefault();cmd.focus()}
  if(e.key==='Enter'&&document.activeElement.classList&&document.activeElement.classList.contains('node')){document.activeElement.dispatchEvent(new MouseEvent('click',{bubbles:true}))}
  if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)&&!$('#editorOv').hidden)$('#edSave').click()});
document.querySelectorAll('.overlay').forEach(ov=>ov.addEventListener('click',e=>{if(e.target!==ov)return;if(ov.id==='editorOv')$('#edCancel').click();else closeOv('#'+ov.id)}));

/* ----- Réinitialiser la progression (confirmation dans la page) ----- */
const rb=$('#btnResetAll');let armT=0;const rbLabel=rb.textContent;
rb.onclick=()=>{if(!rb.classList.contains('armed')){rb.classList.add('armed');rb.textContent='Confirmer : tout effacer ?';armT=setTimeout(()=>{rb.classList.remove('armed');rb.textContent=rbLabel},4000);return}
  clearTimeout(armT);rb.classList.remove('armed');rb.textContent=rbLabel;P={done:{},xp:0,ch:{}};saveP();startLesson(0);toast('Progression effacée',Site.account.state().user?'Sur ce navigateur seulement : votre compte garde vos leçons terminées.':'Vous repartez de la leçon 1.')};


/* ----- Aide-mémoire (fenêtre rapide, sans quitter l'atelier) ----- */
Site.renderCheat($('#cheat'));
$('#btnCheat').onclick=()=>openOv('#cheatOv','#chClose');
$('#chClose').onclick=()=>closeOv('#cheatOv');

/* ----- Ctrl+C dans le terminal : annule la ligne, comme dans un vrai shell ----- */
document.addEventListener('keydown',e=>{if(e.target===cmd&&e.ctrlKey&&!e.metaKey&&(e.key||'').toLowerCase()==='c'&&cmd.selectionStart===cmd.selectionEnd){e.preventDefault();
  o([[$('#prompt').textContent+' ','c-prompt'],[cmd.value,'c-cmd'],['^C','c-dim']]);cmd.value='';scrollOut()}},true);

/* ----- Démarrage : la leçon de l'adresse (atelier.html#branches…) ou la dernière ouverte ----- */
$('#legend').innerHTML=[['U','non suivi'],['M','modifié'],['A','ajouté'],['D','supprimé'],['C','en conflit'],['I','ignoré'],['ok','à jour']].map(([b,t])=>`<span><span class="badge ${b}">${b==='ok'?'✓':b}</span>${t}</span>`).join('');
const byHash=()=>LESSONS.findIndex(l=>'#'+l.id===location.hash);
let start=byHash();
if(start<0){start=0;try{const s=+localStorage.getItem('atelier-git-current');if(s>=0&&s<LESSONS.length)start=s}catch(e){}}
startLesson(start);
/* Quand le compte apporte des leçons terminées ailleurs, on recharge la progression. */
Site.account.onChange(()=>{const np=Site.readProgress();if(JSON.stringify([np.done,np.ch])!==JSON.stringify([P.done,P.ch])){P=np;renderSidebar()}});
addEventListener('hashchange',()=>{const i=byHash();if(i>=0&&i!==cur)startLesson(i)});
window.__atelier={TypeFX};
})();
