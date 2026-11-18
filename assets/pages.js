/* Atelier Git · pages Accueil et Aide-mémoire · réalisé par Titan_gp1 */
(()=>{
'use strict';
const $=s=>document.querySelector(s);
const {esc,LESSONS_META,readProgress,renderCheat}=window.Site;
const page=document.body.dataset.page;

/* ===================== Accueil ===================== */
if(page==='accueil'){
  const P=readProgress(),lessons=LESSONS_META.filter(l=>l.id!=='bac'),done=lessons.filter(l=>P.done[l.id]).length;
  let cur=-1;try{const s=localStorage.getItem('atelier-git-current');if(s!==null)cur=+s}catch(e){}

  /* Reprendre là où on s'est arrêté */
  const next=lessons.find(l=>!P.done[l.id]),resumeL=cur>=0&&LESSONS_META[cur]&&!P.done[LESSONS_META[cur].id]?LESSONS_META[cur]:next;
  $('#resumeText').innerHTML=done===0&&cur<0
    ?'Vous n\'avez pas encore commencé. La première leçon prend environ 3 minutes.'
    :done===lessons.length?`Bravo, les ${lessons.length} leçons sont terminées. Le bac à sable vous attend.`
    :`<b>${done} leçon${done>1?'s':''} sur ${lessons.length}</b> terminée${done>1?'s':''} · ${P.xp} XP`;
  $('#resumeBar').style.width=(done/lessons.length*100)+'%';
  const go=$('#resumeGo'),target=done===lessons.length?LESSONS_META.find(l=>l.id==='bac'):resumeL||lessons[0];
  go.href='atelier.html#'+target.id;go.textContent=done===0&&cur<0?'Commencer la leçon 1':done===lessons.length?'Ouvrir le bac à sable':'Reprendre : '+target.title;

  /* Le parcours */
  $('#lgrid').innerHTML=LESSONS_META.map((l,i)=>`<li><a href="atelier.html#${l.id}">
    <span class="num${P.done[l.id]?' done':''}">${P.done[l.id]?'✓':l.id==='bac'?'∞':i+1}</span>
    <span><span class="lt">${esc(l.title)}</span><span class="ls">${esc(l.short)}</span></span>
    <span class="chip${l.level==='Avancé'?' hot':''}">${esc(l.level)}</span></a></li>`).join('');

  /* Démo : un terminal qui se tape tout seul, avec la frappe fluide de l'atelier */
  const demo=$('#demoOut'),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* Chaque commande : le texte tapé, puis ses lignes de sortie (une ligne = une liste de morceaux colorés). */
  const SCRIPT=[
    ['git init',[[['Initialized empty Git repository in ~/projet/.git/','']]]],
    ['echo "# Mon site" > README.md',[]],
    ['git add README.md',[]],
    ['git commit -m "Premier commit"',[[['[main (root-commit) 3f2a1c9] Premier commit','']],[[' 1 file changed, 1 insertion(+)','']]]],
    ['git switch -c idee',[[["Switched to a new branch 'idee'",'']]]],
    ['git log --oneline',[[['3f2a1c9 ','c-hash'],['(HEAD -> idee, main) ','c-head'],['Premier commit','']]]],
  ];
  const line=(parts)=>{const d=document.createElement('div');d.className='ln in';parts.forEach(([t,c])=>{const s=document.createElement('span');if(c)s.className=c;s.textContent=t;d.appendChild(s)});demo.appendChild(d);return d};
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  async function play(){
    for(;;){demo.innerHTML='';
      for(const [cmdText,out] of SCRIPT){
        const d=line([['vous@atelier ~/projet $ ','c-prompt']]),typed=document.createElement('span');typed.className='c-cmd';d.appendChild(typed);
        const caret=document.createElement('span');caret.className='demo-caret';d.appendChild(caret);
        for(const ch of cmdText){const s=document.createElement('span');s.className=reduce?'ch':'ch in';s.textContent=ch;typed.appendChild(s);await wait(reduce?0:48+Math.random()*40)}
        await wait(reduce?0:260);caret.remove();
        out.forEach(parts=>line(parts));
        await wait(reduce?0:650)}
      if(reduce)return;await wait(2600)}}
  if(demo)play();
}

/* ===================== Aide-mémoire ===================== */
if(page==='aide-memoire'){
  const box=$('#cheatAll');renderCheat(box);
  const norm=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  const input=$('#cheatSearch'),count=$('#cheatCount'),none=$('#cheatNone');
  const total=box.querySelectorAll('.crow').length;
  const filter=()=>{const q=norm(input.value.trim());let shown=0;
    box.querySelectorAll('section[data-sec]').forEach(sec=>{let any=false;
      sec.querySelectorAll('.crow,dt').forEach(row=>{const hit=!q||norm(row.dataset.text).includes(q)||norm(sec.querySelector('h4').textContent).includes(q);
        row.hidden=!hit;if(row.tagName==='DT'&&row.nextElementSibling)row.nextElementSibling.hidden=!hit;if(hit){any=true;if(row.classList.contains('crow'))shown++}});
      sec.hidden=!any});
    count.textContent=q?`${shown} commande${shown>1?'s':''} sur ${total}`:`${total} commandes`;none.hidden=shown>0||!q};
  input.addEventListener('input',filter);filter();
  document.addEventListener('keydown',e=>{if(e.key==='/'&&document.activeElement!==input){e.preventDefault();input.focus()}});
}
})();
