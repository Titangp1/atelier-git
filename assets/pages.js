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

/* ===================== Accueil : ligne du compte ===================== */
if(page==='accueil'){const line=$('#resumeAcct');
  Site.account.onChange(st=>{if(!line)return;line.hidden=!st.enabled||st.loading;
    line.innerHTML=st.user&&st.profile
      ?`Connecté en tant que <b>${esc(st.profile.pseudo)}</b> · <a href="classement.html">voir le classement</a>`
      :`<a href="compte.html">Créez un compte</a> pour garder votre progression partout et entrer dans le classement.`})}

/* ===================== Compte ===================== */
if(page==='compte'){const A=Site.account,show=(sel,on)=>{$(sel).hidden=!on};
  const busy=(el,on)=>{el.querySelectorAll('button,input').forEach(x=>x.disabled=on);el.classList.toggle('busy',on)};
  let lastRankFor=null;
  A.onChange(st=>{const inn=!!(st.user&&st.profile);
    show('#acctLoading',st.enabled&&st.loading);show('#acctOff',!st.enabled);
    show('#acctOut',st.enabled&&!st.loading&&!st.user);show('#acctPseudo',st.needsPseudo);show('#acctIn',inn);
    $('#acctErr').textContent=st.enabled&&!st.loading&&st.error?st.error:'';
    $('#acctIntro').textContent=inn?'Votre progression est enregistrée sur votre compte : vous la retrouvez sur tous vos appareils.'
      :st.needsPseudo?'Vous êtes connecté. Dernière étape : choisissez le pseudo qui apparaîtra dans le classement.'
      :'Créez un compte pour enregistrer votre progression et apparaître dans le classement.';
    if(st.needsPseudo&&!$('#choosePseudo').value&&st.user&&st.user.name)$('#choosePseudo').value=st.user.name.normalize('NFD').replace(/[^A-Za-z0-9_.-]/g,'').slice(0,20);
    if(inn){const p=st.profile;$('#pPseudo').textContent=p.pseudo;$('#pAvatar').textContent=p.pseudo[0].toUpperCase();$('#pEmail').textContent=st.user.email||'';
      $('#pXp').textContent=p.xp+' XP';$('#pLessons').textContent=`${p.lessons_done} / 11`;
      if(lastRankFor!==p.xp){lastRankFor=p.xp;$('#pRank').textContent='…';A.rankOf(p.xp).then(r=>{$('#pRank').textContent='#'+r}).catch(()=>{$('#pRank').textContent='—'})}
      if(document.activeElement!==$('#newPseudo'))$('#newPseudo').value=p.pseudo}});
  /* Onglets */
  const tabs=[['#tabIn','#formIn'],['#tabUp','#formUp']];
  const pick=i=>tabs.forEach(([t,f],k)=>{$(t).setAttribute('aria-selected',String(k===i));$(t).tabIndex=k===i?0:-1;$(f).hidden=k!==i;$('#acctSent').hidden=true});
  tabs.forEach(([t],i)=>$(t).addEventListener('click',()=>pick(i)));
  $('#tabsBox').addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){const i=$('#tabIn').getAttribute('aria-selected')==='true'?1:0;pick(i);$(tabs[i][0]).focus()}});
  if(location.hash==='#inscription')pick(1);
  /* Google */
  $('#btnGoogle').addEventListener('click',async()=>{const b=$('#btnGoogle');b.disabled=true;$('#gErr').textContent='';
    try{const r=await A.signInGoogle();if(r&&r.profile)Site.toast('Connecté',`Bonjour ${r.profile.pseudo}, votre progression est synchronisée.`,'ok')}
    catch(err){$('#gErr').textContent=err.message}finally{b.disabled=false}});
  /* Connexion par email */
  $('#formIn').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget;$('#inErr').textContent='';busy(f,true);
    try{const p=await A.signIn($('#inEmail').value,$('#inPass').value);$('#inPass').value='';if(p)Site.toast('Connecté',`Bonjour ${p.pseudo}, votre progression est synchronisée.`,'ok')}
    catch(err){$('#inErr').textContent=err.message}finally{busy(f,false)}});
  $('#btnReset').addEventListener('click',async()=>{$('#inErr').textContent='';const email=$('#inEmail').value.trim();
    try{await A.resetPassword(email);const box=$('#acctSent');box.hidden=false;
      box.innerHTML=`Si un compte existe pour <b>${esc(email)}</b>, un email pour choisir un nouveau mot de passe vient de partir.`}
    catch(err){$('#inErr').textContent=err.message}});
  /* Inscription par email */
  $('#formUp').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget;$('#upErr').textContent='';busy(f,true);
    try{const p=await A.signUp($('#upEmail').value,$('#upPass').value,$('#upPseudo').value);$('#upPass').value='';
      Site.toast('Compte créé',`Bienvenue ${p?p.pseudo:''} ! Vous êtes dans le classement.`,'ok')}
    catch(err){$('#upErr').textContent=err.message}finally{busy(f,false)}});
  /* Choix du pseudo après une première connexion Google */
  $('#formChoose').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget;$('#chErr').textContent='';busy(f,true);
    try{const p=await A.choosePseudo($('#choosePseudo').value);Site.toast('Bienvenue',`Vous apparaissez dans le classement sous le nom ${p.pseudo}.`,'ok')}
    catch(err){$('#chErr').textContent=err.message}finally{busy(f,false)}});
  $('#btnOut2').addEventListener('click',()=>A.signOut().catch(()=>{}));
  /* Changer de pseudo */
  $('#formPseudo').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget;$('#psErr').textContent='';busy(f,true);
    try{const p=await A.setPseudo($('#newPseudo').value);Site.toast('Pseudo modifié',`Vous apparaissez maintenant sous le nom ${p.pseudo}.`,'ok')}
    catch(err){$('#psErr').textContent=err.message}finally{busy(f,false)}});
  /* Déconnexion */
  $('#btnOut').addEventListener('click',async()=>{try{await A.signOut();Site.toast('Déconnecté','Votre progression reste aussi dans ce navigateur.')}catch(err){Site.toast('Déconnexion impossible',err.message)}});
  /* Suppression du compte : confirmation dans la page */
  const del=$('#btnDelete'),delLabel=del.textContent;let armT=0;
  del.addEventListener('click',async()=>{if(!del.classList.contains('armed')){del.classList.add('armed');del.textContent='Confirmer : supprimer définitivement ?';
      armT=setTimeout(()=>{del.classList.remove('armed');del.textContent=delLabel},5000);return}
    clearTimeout(armT);del.disabled=true;
    try{await A.deleteAccount();Site.toast('Compte supprimé','Votre profil et votre place dans le classement sont effacés.')}
    catch(err){Site.toast('Suppression incomplète',err.message)}finally{del.disabled=false;del.classList.remove('armed');del.textContent=delLabel}});
}

/* ===================== Classement ===================== */
if(page==='classement'){const A=Site.account,body=$('#board'),msg=$('#boardState');let lastKey=null,busy=false,again=false;
  const say=t=>{msg.hidden=!t;msg.textContent=t||''};
  async function load(){const st=A.state();
    if(!st.enabled){say('Le classement s\'affichera dès que les comptes seront activés sur ce site.');return}
    if(st.loading)return;if(busy){again=true;return}busy=true;$('#boardRefresh').disabled=true;
    try{const rows=await A.leaderboard(100),me=A.state().user;let rank=0,prev=null;
      body.innerHTML=rows.map((r,i)=>{if(r.xp!==prev){rank=i+1;prev=r.xp}const mine=me&&r.id===me.id;
        return `<tr class="${mine?'me':''}" style="animation-delay:${Math.min(i*40,800)}ms"><td class="rk"><span class="rank${rank<=3?' r'+rank:''}">${rank}</span></td>
          <td class="who">${esc(r.pseudo)}${mine?' <span class="you">vous</span>':''}</td>
          <td><span class="lessons"><span class="mini"><i style="width:${Math.round(r.lessons_done/11*100)}%"></i></span>${r.lessons_done} / 11</span></td>
          <td class="dc">${r.challenges_done||0}</td>
          <td class="xp">${r.xp}</td></tr>`}).join('');
      say(rows.length?'':'Personne n\'est encore classé. Terminez une leçon pour prendre la première place !');
      A.players().then(n=>{$('#boardCount').textContent=`${n} joueur${n>1?'s':''} inscrit${n>1?'s':''}`}).catch(()=>{})}
    catch(err){say(err.message)}finally{busy=false;$('#boardRefresh').disabled=false;if(again){again=false;load()}}}
  function me(st){const box=$('#myRank');
    if(!st.enabled){box.innerHTML='';return}
    if(st.user&&st.profile){box.innerHTML=`<span class="big" id="meRank">…</span><span><b>${esc(st.profile.pseudo)}</b>, vous avez ${st.profile.xp} XP et ${st.profile.lessons_done} leçon${st.profile.lessons_done>1?'s':''} sur 11.<br><a href="atelier.html">Continuer l'atelier</a> pour monter.</span>`;
      A.rankOf(st.profile.xp).then(r=>{const el=$('#meRank');if(el)el.textContent='#'+r}).catch(()=>{})}
    else if(!st.loading)box.innerHTML=`<span>Vous n'êtes pas encore dans le classement. <a href="compte.html#inscription">Créez un compte</a> ou <a href="compte.html">connectez-vous</a> : vos leçons déjà terminées comptent.</span>`}
  /* On recharge la liste quand le service devient disponible, que l'utilisateur change ou que son score bouge. */
  A.onChange(st=>{me(st);const key=`${st.enabled}|${st.user?st.user.id:''}|${st.profile?st.profile.xp:'-'}`;if(!st.loading&&key!==lastKey){lastKey=key;load()}});
  $('#boardRefresh').addEventListener('click',load);
}

/* ===================== Défis ===================== */
if(page==='defis'){const {CHALLENGES_META,DIFFS}=Site,P=readProgress(),grid=$('#dgrid');
  const done=CHALLENGES_META.filter(c=>P.ch[c.id]),total=CHALLENGES_META.reduce((s,c)=>s+c.xp,0),got=done.reduce((s,c)=>s+c.xp,0);
  $('#chProg').innerHTML=`<b>${done.length} / ${CHALLENGES_META.length}</b> défis réussis · <b>${got}</b> / ${total} XP`;
  requestAnimationFrame(()=>{$('#chBar').style.width=(got/total*100)+'%'});
  grid.innerHTML=CHALLENGES_META.map(c=>{const ok=!!P.ch[c.id],d=DIFFS[c.diff];
    return `<a class="dcard d-${c.diff}${ok?' done':''}" href="atelier.html#${c.id}" data-diff="${c.diff}">
      <span class="dtop"><span class="dlevel"><span class="dmeter" aria-hidden="true"><i></i><i></i><i></i><i></i></span>${d.label}</span><span class="dxp">+${c.xp} XP</span></span>
      <b class="dtitle">${esc(c.title)}</b><span class="dshort">${esc(c.short)}</span>
      <span class="dfoot"><span class="dstate">${ok?'✓ Réussi':'À relever'}</span><span class="dgo">${ok?'Rejouer':'Relever le défi'} <span aria-hidden="true">→</span></span></span></a>`}).join('');
  const chips=[...document.querySelectorAll('.fchip')];
  chips.forEach(b=>b.addEventListener('click',()=>{chips.forEach(x=>x.setAttribute('aria-pressed',String(x===b)));const f=b.dataset.f;
    grid.querySelectorAll('.dcard').forEach((c,i)=>{const show=f==='tous'||c.dataset.diff===f;c.hidden=!show;if(show){c.classList.remove('fade');void c.offsetWidth;c.style.animationDelay=Math.min(i*40,400)+'ms';c.classList.add('fade')}})}));
}

/* ===================== Accueil : chiffres et défis ===================== */
if(page==='accueil'){const P=readProgress(),cd=Site.CHALLENGES_META.filter(c=>P.ch[c.id]).length,dl=$('#homeDefis');
  if(dl)dl.textContent=cd?`Vous en avez réussi ${cd} sur ${Site.CHALLENGES_META.length}.`:'Aucun indice tout prêt, juste un objectif : à vous de trouver les commandes.'}
})();
