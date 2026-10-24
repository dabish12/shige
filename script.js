/* DRVU Secure Online Exam - Firebase Authentication + Realtime Database (REST). Prepared by Daba Atm */
window.onerror=function(m,s,l){var d=document.createElement('div');d.style.cssText='position:fixed;bottom:0;left:0;right:0;background:#b3261e;color:#fff;padding:10px;text-align:center;z-index:99;font:14px sans-serif';d.textContent='Error: '+m+' (line '+l+')';document.body.appendChild(d)};
const $=s=>document.querySelector(s),A=$('#app');
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const C=window.DRVU_CONFIG||{},KEY=(C.apiKey||'').trim(),DB=(C.databaseURL||'').trim().replace(/\/+$/,'').replace(/\.json$/,''),MAIL='@drvu.exam',ADMIN='admin'+MAIL;
let S=null,G={},St={},tab='st',detU=null,tick=null,skew=0,poll=null;

/* ---------- Firebase REST helpers ---------- */
async function auth(ep,b){const r=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:'+ep+'?key='+KEY,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error((j.error&&j.error.message)||'NETWORK');return j}
const mkS=j=>({uid:j.localId,email:j.email,tok:j.idToken,ref:j.refreshToken,exp:Date.now()+(+j.expiresIn-120)*1000});
async function tok(s){if(Date.now()<s.exp)return s.tok;const r=await fetch('https://securetoken.googleapis.com/v1/token?key='+KEY,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=refresh_token&refresh_token='+encodeURIComponent(s.ref)});const j=await r.json();if(!r.ok)throw new Error('SESSION');s.tok=j.id_token;s.ref=j.refresh_token;s.exp=Date.now()+(+j.expires_in-120)*1000;return s.tok}
async function db(p,m,b){const t=await tok(S),r=await fetch(DB+'/'+p+'.json?auth='+t,{method:m||'GET',headers:b!==undefined?{'Content-Type':'application/json'}:{},body:b!==undefined?JSON.stringify(b):undefined});if(!r.ok)throw new Error('DB '+r.status);return r.json()}
const parseJ=s=>{try{return JSON.parse(s||'{}')}catch(e){return{}}};
function dl(n,t,s){const u=URL.createObjectURL(new Blob([s],{type:t})),a=document.createElement('a');a.href=u;a.download=n;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000)}

/* ---------- layout ---------- */
const LOGO=`<svg viewBox="0 0 64 64"><path d="M32 3 8 12v18c0 15 10 26 24 31 14-5 24-16 24-31V12z" fill="#d4a82a"/><path d="M32 8 12 15v15c0 12 8 22 20 27 12-5 20-15 20-27V15z" fill="#0a2150"/><path d="M32 22c-5-3-11-3-15-1v16c4-2 10-2 15 1 5-3 11-3 15-1V21c-4-2-10-2-15 1z" fill="#fff"/><path d="M32 22v16" stroke="#d4a82a" stroke-width="2"/></svg>`;
const IC={st:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',ex:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',rs:'<path d="M18 20V10M12 20V4M6 20v-6"/>',ac:'<circle cx="8" cy="15" r="4"/><path d="M10.8 12.2 21 2M16 7l3 3"/>',out:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'};
const ic=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[k]}</svg>`;
const NAV=[['st','Students'],['ex','Exam setup'],['rs','Results'],['ac','Account']];
function shell(k,c){const nm=k==='admin'?'Administrator':esc(St.name||S.user);
 const side=k==='admin'?`<aside><div class="lg">${LOGO}<div><b>DRVU</b><small>Online Exam</small></div></div><nav>${NAV.map(([t,n])=>`<a class="${tab===t?'on':''}" onclick="tab='${t}';detU=null;adminView()">${ic(t)}<span>${n}</span></a>`).join('')}</nav><a class="out" onclick="logout()">${ic('out')}<span>Logout</span></a></aside>`:'';
 const title=k==='admin'?(NAV.find(x=>x[0]===tab)||[])[1]:esc((St.meta&&St.meta.title)||'Online Exam');
 return `<div class="shell ${k}">${side}<section><div class="top"><div><h1>${title}</h1><small>Dembi Dollo Rift Valley University</small></div><div class="usr"><i>${nm[0]}</i>${nm}${k==='admin'?'':'<button class="s" onclick="logout()">Logout</button>'}</div></div><div class="body">${c}</div><footer>© Dembi Dollo Rift Valley University · Prepared by <b>Daba Atm</b></footer></section></div>`}
function busy(m){A.innerHTML=`<div class="shell"><section><div class="body"><div class="card c">${m||'Loading…'}</div></div></section></div>`}

/* ---------- login ---------- */
function loginView(m,uv){const bad=!KEY||!DB;
 A.innerHTML=`<div class="split"><div class="hero"><div class="hc">${LOGO}<h1>Dembi Dollo Rift Valley University</h1><p>Online Mid Exam Portal</p><span class="tag">Computer and Mobile Application</span></div></div><div class="fm"><div class="fb"><h2>Welcome back</h2><p class="mu">Sign in to continue to your exam portal.</p>
<label>Username</label><input id="u" value="${esc(uv||'')}" autocomplete="username" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Enter username"><label>Password</label><input id="p" type="password" autocomplete="current-password" placeholder="Enter password">
<p class="no">${m||''}${bad?'The system is not configured. Open config.js and add the Firebase apiKey and databaseURL.':!/^AIza[\w-]{30,}$/.test(KEY)?'The apiKey in config.js does not look like a Firebase Web API Key (it should start with AIza).':''}</p><button class="wide" onclick="login()">Sign in</button>
<p class="mu" style="margin-top:14px">Students: use the account given by your exam administrator.</p><footer>Prepared by <b>Daba Atm</b></footer></div></div></div>`;
 $('#p').onkeydown=e=>{if(e.key==='Enter')login()}}
const errMsg=e=>/API key not valid|API_KEY_INVALID|API_KEY_SERVICE_BLOCKED/i.test(e.message)?'The apiKey in config.js is not valid. Copy the “Web API Key” from Firebase → Project settings → General (it starts with AIza), with no spaces.':/referer|REFERRER|HTTP_REFERRER/i.test(e.message)?'This API key is restricted and blocks this website. In Google Cloud → Credentials → your key, add your GitHub site to the allowed websites, or remove the restriction.':/has not been used|is disabled|SERVICE_DISABLED/i.test(e.message)?'The Identity Toolkit API is disabled for this project. Enable “Identity Toolkit API” in Google Cloud → APIs & Services.':/CONFIGURATION_NOT_FOUND|OPERATION_NOT_ALLOWED/.test(e.message)?'Email/Password sign-in is not turned on. In Firebase → Authentication → Sign-in method, enable Email/Password.':/INVALID_LOGIN|INVALID_PASSWORD|EMAIL_NOT_FOUND|INVALID_EMAIL/.test(e.message)?'Wrong username or password.':/TOO_MANY/.test(e.message)?'Too many attempts. Wait a few minutes and try again.':/USER_DISABLED/.test(e.message)?'This account is disabled.':/NETWORK|Failed to fetch/.test(e.message)?'Cannot connect. Check your internet connection.':/API_KEY/.test(e.message)?'The apiKey in config.js is wrong.':'Error: '+esc(e.message);
async function login(){if(!KEY||!DB)return loginView();const raw=$('#u').value.trim(),u=raw.toLowerCase(),p=$('#p').value;if(!u||!p)return loginView('Enter username and password.',raw);
 $('button.wide').textContent='Signing in…';
 try{const j=await auth('signInWithPassword',{email:u+MAIL,password:p,returnSecureToken:true});S=mkS(j);S.user=u;S.admin=S.email===ADMIN;
  if(S.admin){busy();await loadAdmin();adminView();clearInterval(poll);poll=setInterval(autoRefresh,20000)}else{busy();await loadStudent()}}
 catch(e){S=null;loginView(errMsg(e),raw)}}
function logout(){clearInterval(tick);clearInterval(poll);S=null;St={};G={};loginView()}

/* ---------- ADMIN ---------- */
async function loadAdmin(){const g=p=>db(p).catch(()=>null);
 const[st,pv,meta,qs,key,res,pr]=await Promise.all([g('students'),g('private'),g('exam/meta'),g('exam/questions'),g('key'),g('results'),g('progress')]);
 G={students:st||{},priv:pv||{},meta:meta||{title:'Mid Exam: Computer and Mobile Application',duration:30,open:false,showAns:false},Q:(qs||[]).map((q,i)=>({q:q.q,opts:q.opts||[],ans:key&&key[i]!=null?key[i]:-1})),results:res||{},prog:pr||{},dq:0}}
async function refreshRes(){try{const[res,pr]=await Promise.all([db('results'),db('progress')]);G.results=res||{};G.prog=pr||{};await gradeAll()}catch(e){}}
async function autoRefresh(){if(!S||!S.admin||document.hidden)return;if(tab==='rs'||tab==='st'){if([...document.querySelectorAll('.body input,.body textarea')].some(e=>e.value&&e.type!=='file'))return;await refreshRes();adminView()}}
async function gradeAll(){let n=0;for(const[uid,r]of Object.entries(G.results)){if(r.score!=null||!r.ans||!G.Q.length)continue;const a=parseJ(r.ans);let sc=0;G.Q.forEach((q,i)=>{if(a[i]===q.ans)sc++});try{await db('results/'+uid,'PATCH',{score:sc,total:G.Q.length});r.score=sc;r.total=G.Q.length;n++}catch(e){}}return n}
const sta=uid=>{const r=G.results[uid],p=G.prog[uid];return r?(r.score!=null?'<span class="bd g">Graded</span>':'<span class="bd y">Submitted</span>'):p&&p.start?'<span class="bd y">In progress</span>':'<span class="bd n">Not started</span>'};
function adminView(){const sub=Object.keys(G.results).length,gr=Object.values(G.results).filter(r=>r.score!=null),avg=gr.length?Math.round(gr.reduce((a,r)=>a+r.score/r.total*100,0)/gr.length):0;
 let h=(G.dq?`<div class="card" style="border-left:5px solid var(--gold)"><b>You have unsaved exam changes.</b> Open Exam setup and press “Save exam to server”.</div>`:'')+`<div class="stats"><div class="stat"><b>${Object.keys(G.students).length}</b><span>Students</span></div><div class="stat"><b>${sub}</b><span>Submitted</span></div><div class="stat"><b>${G.Q.length}</b><span>Questions</span></div><div class="stat"><b>${G.meta.duration}m</b><span>Exam time</span></div><div class="stat"><b>${avg}%</b><span>Average score</span></div></div>`;
 if(tab==='st')h+=stTab();if(tab==='ex')h+=exTab();if(tab==='rs')h+=detU?detCard():rsTab();if(tab==='ac')h+=acTab();
 A.innerHTML=shell('admin',h);hl()}
function stTab(){const L=Object.entries(G.students);
 return `<div class="card"><h2>Register student</h2><div class="row"><div><label>Full name</label><input id="n"></div><div><label>Username (letters, numbers . _ -)</label><input id="un" autocapitalize="off"></div><div><label>Password (min. 6 characters)</label><input id="pw"></div></div><button onclick="addSt()">Register</button></div>
 <div class="card"><h2>Students (${L.length})</h2><input placeholder="Search student…" oninput="flt(this.value)" style="margin-bottom:12px"><div class="tw"><table id="stt"><tr><th>Name</th><th>Username</th><th>Password</th><th>Status</th><th></th></tr>${L.map(([id,s])=>`<tr><td>${esc(s.name)}</td><td>${esc(s.user)}</td><td>${esc((G.priv[id]||{}).pass)}</td><td>${sta(id)}</td><td><button class="s" onclick="es('${id}')">Edit</button><button class="s" onclick="rp('${id}')">Reset password</button><button class="d" onclick="ds('${id}')">Delete</button></td></tr>`).join('')||'<tr><td>No students yet.</td></tr>'}</table></div></div>`}
function flt(v){document.querySelectorAll('#stt tr:not(:first-child)').forEach(r=>r.style.display=r.textContent.toLowerCase().includes(v.toLowerCase())?'':'none')}
async function addSt(){const n=$('#n').value.trim(),u=$('#un').value.trim().toLowerCase(),p=$('#pw').value.trim();
 if(!n||!u||!p)return alert('Fill all fields.');if(!/^[a-z0-9._-]{3,30}$/.test(u))return alert('Username: 3–30 characters, only letters, numbers . _ -');if(p.length<6)return alert('Password must have at least 6 characters.');
 try{const j=await auth('signUp',{email:u+MAIL,password:p,returnSecureToken:false});await db('students/'+j.localId,'PUT',{name:n,user:u});await db('private/'+j.localId,'PUT',{pass:p});G.students[j.localId]={name:n,user:u};G.priv[j.localId]={pass:p};adminView()}
 catch(e){alert(/EMAIL_EXISTS/.test(e.message)?'This username already exists.':'Could not register: '+e.message)}}
async function es(id){const n=prompt('Student full name:',G.students[id].name);if(n&&n.trim()){try{await db('students/'+id+'/name','PUT',n.trim());G.students[id].name=n.trim();adminView()}catch(e){alert('Error: '+e.message)}}}
async function rp(id){const np=prompt('New password for '+G.students[id].name+' (min. 6 characters):');if(!np||np.trim().length<6)return;
 try{const j=await auth('signInWithPassword',{email:G.students[id].user+MAIL,password:(G.priv[id]||{}).pass,returnSecureToken:true});await auth('update',{idToken:j.idToken,password:np.trim(),returnSecureToken:false});await db('private/'+id,'PUT',{pass:np.trim()});G.priv[id]={pass:np.trim()};adminView()}
 catch(e){alert('Could not reset the password: '+e.message)}}
async function ds(id){if(!confirm('Delete this student and their result?'))return;
 try{const j=await auth('signInWithPassword',{email:G.students[id].user+MAIL,password:(G.priv[id]||{}).pass,returnSecureToken:true});await auth('delete',{idToken:j.idToken})}catch(e){}
 try{for(const p of['students','private','progress','results'])await db(p+'/'+id,'DELETE');delete G.students[id];delete G.priv[id];delete G.prog[id];delete G.results[id];adminView()}catch(e){alert('Error: '+e.message)}}
function exTab(){const M=G.meta;
 return `<div class="card"><h2>Exam settings</h2><label>Title</label><input id="et" value="${esc(M.title)}"><div class="row"><div><label>Time (minutes)</label><input id="ed" type="number" min="1" value="${M.duration}"></div><div><label>Exam status</label><select id="eo"><option value="1" ${M.open?'selected':''}>Open</option><option value="0" ${M.open?'':'selected'}>Closed</option></select></div><div><label>Students see answers after grading</label><select id="es"><option value="0" ${M.showAns?'':'selected'}>No</option><option value="1" ${M.showAns?'selected':''}>Yes</option></select></div></div></div>
 <div class="card"><h2>Upload questions from PDF</h2><p class="mu">Format: “1. Question”, options “A. … B. … C. … D. …”, then “Answer: B”.</p><input type="file" id="pf" accept="application/pdf" onchange="readPdf(this.files[0])"><label>…or paste exam text here</label><textarea id="pt" rows="5"></textarea><button class="s" onclick="loadTxt($('#pt').value)">Parse text</button><p id="pm" class="mu"></p></div>
 <div class="card"><h2>Questions (${G.Q.length})</h2>${G.Q.map(qEdit).join('')||'<p class="mu">No questions yet.</p>'}<button class="s" onclick="G.Q.push({q:'New question',opts:['','','',''],ans:0});G.dq=1;adminView()">+ Add question</button><button class="d" onclick="if(confirm('Delete all questions?')){G.Q=[];G.dq=1;adminView()}">Clear all</button><hr style="border:0;border-top:1px solid var(--bd);margin:16px 0"><button onclick="saveExam()">Save exam to server</button></div>`}
const qEdit=(q,i)=>`<div class="q"><label>Q${i+1}</label><textarea rows="2" onchange="G.Q[${i}].q=this.value;G.dq=1">${esc(q.q)}</textarea>${q.opts.map((o,j)=>`<div class="o"><b style="margin:0">${'ABCDE'[j]}.</b><input value="${esc(o)}" onchange="G.Q[${i}].opts[${j}]=this.value;G.dq=1"></div>`).join('')}<label>Correct answer</label><select onchange="G.Q[${i}].ans=+this.value;G.dq=1">${q.opts.map((o,j)=>`<option value="${j}" ${q.ans===j?'selected':''}>${'ABCDE'[j]}</option>`).join('')}<option value="-1" ${q.ans<0?'selected':''}>Not set</option></select><button class="d" onclick="G.Q.splice(${i},1);G.dq=1;adminView()">Delete</button></div>`;
async function saveExam(){if(G.Q.some(q=>q.ans<0||!q.q.trim()||q.opts.filter(o=>o.trim()).length<2))return alert('Every question needs text, at least two options and a correct answer.');
 const M={title:$('#et').value.trim()||'Exam',duration:Math.max(1,+$('#ed').value||30),open:$('#eo').value==='1',showAns:$('#es').value==='1',count:G.Q.length};
 try{await db('exam/meta','PUT',M);await db('exam/questions','PUT',G.Q.map(q=>({q:q.q,opts:q.opts})));await db('key','PUT',G.Q.map(q=>q.ans));G.meta=M;G.dq=0;adminView();alert('Exam saved to the server.')}catch(e){alert('Could not save the exam: '+e.message)}}
async function readPdf(f){if(!f)return;const m=$('#pm');m.textContent='Reading PDF…';
 try{pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
 const pdf=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise;let txt='';
 for(let p=1;p<=pdf.numPages;p++){const c=await(await pdf.getPage(p)).getTextContent(),rows={};c.items.forEach(it=>{const y=Math.round(it.transform[5]/3);(rows[y]=rows[y]||[]).push(it)});
  Object.keys(rows).sort((a,b)=>b-a).forEach(y=>{txt+=rows[y].sort((a,b)=>a.transform[4]-b.transform[4]).map(i=>i.str).join(' ').trim()+'\n'})}
 loadTxt(txt)}catch(e){m.textContent='Could not read the PDF here. Paste the text into the box instead, or add questions manually.'}}
function parse(t){const qs=[];let cur=null,last=null;
 t.split(/\r?\n/).forEach(l=>{l=l.trim();if(!l)return;let m;
  if(m=l.match(/^(?:answer|ans)\s*[:\-]?\s*\(?([A-Ea-e])/i)){if(cur)cur.ans='ABCDE'.indexOf(m[1].toUpperCase());last=null}
  else if(cur&&(m=l.match(/^\(?([A-Ea-e])[.)]\s*(.*)/))){cur.opts.push(m[2]);last='o'}
  else if(m=l.match(/^(\d+)\s*[.)]\s*(.+)/)){cur={q:m[2],opts:[],ans:-1};qs.push(cur);last='q'}
  else if(cur){if(last==='o')cur.opts[cur.opts.length-1]+=' '+l;else if(last==='q')cur.q+=' '+l}});
 return qs.filter(q=>q.opts.length>=2)}
function loadTxt(t){const qs=parse(t);if(!qs.length)return $('#pm').textContent='No questions detected. Check the format.';
 if(G.Q.length&&!confirm(qs.length+' questions found. Replace existing questions? (Cancel = append)'))G.Q.push(...qs);else G.Q=qs;G.dq=1;adminView()}
function rsTab(){const L=Object.entries(G.students);
 return `<div class="card"><h2>Student results</h2><div class="tw"><table><tr><th>Name</th><th>Username</th><th>Status</th><th>Score</th><th>%</th><th></th></tr>${L.map(([id,s])=>{const r=G.results[id],g=r&&r.score!=null;return `<tr><td>${esc(s.name)}</td><td>${esc(s.user)}</td><td>${sta(id)}</td>${g?`<td>${r.score}/${r.total}</td><td>${Math.round(r.score/r.total*100)}%</td>`:'<td>–</td><td>–</td>'}<td>${r?`<button class="s" onclick="detU='${id}';adminView()">Details</button><button class="s" onclick="allow('${id}')">Allow retake</button>`:''}</td></tr>`}).join('')||'<tr><td>No students.</td></tr>'}</table></div><button onclick="refreshNow()">Refresh and grade</button><button onclick="csv()">Download CSV</button><button class="s" onclick="window.print()">Print</button></div>`}
async function refreshNow(){await refreshRes();adminView()}
async function allow(id){if(!confirm('Delete this result and let the student take the exam again?'))return;try{await db('results/'+id,'DELETE');await db('progress/'+id,'DELETE');delete G.results[id];delete G.prog[id];adminView()}catch(e){alert('Error: '+e.message)}}
function review(a,Q,K){return Q.map((q,i)=>{const x=a[i],k=K[i],ok=x===k;return `<div class="q"><b>${i+1}. ${esc(q.q)}</b><p class="${ok?'ok':'no'}">Answer: ${x==null?'No answer':'ABCDE'[x]+'. '+esc(q.opts[x])} ${ok?'✓':'✗'}</p>${ok?'':`<p class="mu">Correct: ${k>=0?'ABCDE'[k]+'. '+esc(q.opts[k]):'not set'}</p>`}</div>`}).join('')}
function detCard(){const s=G.students[detU]||{name:detU},r=G.results[detU];if(!r){detU=null;return rsTab()}
 return `<div class="card"><h2>${esc(s.name)}${r.score!=null?` — ${r.score}/${r.total}`:''}</h2><button class="s" onclick="detU=null;adminView()">← Back to results</button><button class="s" onclick="window.print()">Print</button><div style="margin-top:14px">${review(parseJ(r.ans),G.Q,G.Q.map(q=>q.ans))}</div></div>`}
function csv(){let c='Name,Username,Score,Total,Percent\n';Object.entries(G.students).forEach(([id,s])=>{const r=G.results[id];c+=`"${s.name}",${s.user},${r&&r.score!=null?r.score:''},${r&&r.total?r.total:''},${r&&r.score!=null?Math.round(r.score/r.total*100):''}\n`});dl('exam-results.csv','text/csv;charset=utf-8','\ufeff'+c)}
function acTab(){return `<div class="card"><h2>Change admin password</h2><div class="row"><div><label>Current password</label><input id="ac" type="password" autocomplete="off"></div><div><label>New password (min. 6 characters)</label><input id="ap" type="password" autocomplete="new-password"></div></div><button onclick="chgAdmin()">Save</button><p class="mu">The administrator account (admin@drvu.exam) is created in the Firebase console.</p></div>`}
async function chgAdmin(){const cp=$('#ac').value,np=$('#ap').value.trim();if(np.length<6)return alert('New password must have at least 6 characters.');
 try{const j=await auth('signInWithPassword',{email:ADMIN,password:cp,returnSecureToken:true});await auth('update',{idToken:j.idToken,password:np,returnSecureToken:true}).then(x=>{S=Object.assign(S,mkS(x))});$('#ac').value='';$('#ap').value='';alert('Admin password changed.')}catch(e){alert('Could not change the password: '+errMsg(e))}}

/* ---------- STUDENT ---------- */
async function loadStudent(){try{
 const[me,meta,res,pr]=await Promise.all([db('students/'+S.uid),db('exam/meta'),db('results/'+S.uid),db('progress/'+S.uid)]);
 if(!me){S=null;return loginView('This account is not registered for the exam.')}
 St={name:me.name,meta:meta||{},res,pr:pr||{},ans:{}};
 await db('progress/'+S.uid+'/ping','PUT',{'.sv':'timestamp'});const t=await db('progress/'+S.uid+'/ping');skew=t-Date.now();
 studentView()}catch(e){S=null;loginView('Could not load your exam data ('+esc(e.message)+'). Check your connection and try again.')}}
async function studentView(){clearInterval(tick);clearInterval(poll);const M=St.meta,r=St.res;let h='';
 if(r){if(r.score!=null){const p=Math.round(r.score/r.total*100);
   h=`<div class="card"><h2>Your result</h2><div class="ring" style="--p:${p}"><div><b>${p}%</b><span>${r.score} / ${r.total}</span></div></div><p class="c"><span class="bd ${p>=50?'g':'y'}">${p>=50?'PASSED':'BELOW PASS MARK'}</span></p><p class="c">Correct: ${r.score} · Wrong/unanswered: ${r.total-r.score}</p><p class="mu c">The exam has been graded and cannot be taken again.</p></div>`;
   if(M.showAns){try{const[Q,K]=await Promise.all([db('exam/questions'),db('key')]);h+=`<div class="card"><h2>Answer review</h2>${review(parseJ(r.ans),Q||[],K||[])}</div>`}catch(e){}}}
  else{h=`<div class="card c"><h2>Exam submitted</h2><p>Your answers were received. Your result will appear here after the administrator grades the exam.</p><button onclick="recheck()">Check result</button></div>`;poll=setInterval(recheck,15000)}}
 else if(St.pr.start)return runExam();
 else h=`<div class="card"><h2>${esc(M.title||'Exam')}</h2><div class="stats"><div class="stat"><b>${M.count||'–'}</b><span>Questions</span></div><div class="stat"><b>${M.duration||'–'} min</b><span>Time allowed</span></div><div class="stat"><b>1</b><span>Attempt only</span></div></div><p class="mu">All questions are multiple choice. The timer starts when you press Start and the exam is submitted automatically when time ends. You can take the exam only once.</p>${M.open&&M.count?'<button onclick="begin()">Start exam</button>':'<p class="no">The exam is not available right now.</p>'}</div>`;
 A.innerHTML=shell('student',h)}
async function recheck(){try{const[res,meta]=await Promise.all([db('results/'+S.uid),db('exam/meta')]);St.meta=meta||St.meta;if(res&&res.score!=null&&St.res.score==null){St.res=res;studentView()}}catch(e){}}
async function begin(){if(!confirm('Start now? The timer cannot be paused.'))return;
 try{await db('progress/'+S.uid+'/start','PUT',{'.sv':'timestamp'});const st=await db('progress/'+S.uid+'/start');St.pr={start:st};skew=st-Date.now();runExam()}catch(e){alert('Could not start the exam. It may be closed. ('+e.message+')')}}
async function runExam(){try{St.Q=await db('exam/questions');St.ans=parseJ(St.pr.ans)}catch(e){return alert('Could not load the questions: '+e.message)}
 const Q=St.Q||[];
 A.innerHTML=shell('exam',`<div class="tm"><div id="pc"></div><div>Time left <span id="tl"></span></div></div>`+Q.map((q,i)=>`<div class="q"><b>${i+1}. ${esc(q.q)}</b>${(q.opts||[]).map((o,j)=>`<label class="o"><input type="radio" name="q${i}" value="${j}" ${St.ans[i]===j?'checked':''} onchange="pick(${i},${j})"> ${'ABCDE'[j]}. ${esc(o)}</label>`).join('')}</div>`).join('')+`<button onclick="if(confirm('Submit your exam now?'))submitEx()">Submit exam</button>`);pg();timer()}
let sv=Promise.resolve();
function pick(i,j){St.ans[i]=j;pg();sv=sv.then(()=>db('progress/'+S.uid+'/ans','PUT',JSON.stringify(St.ans))).catch(()=>{const e=$('#pc');if(e)e.textContent='⚠ Answer not saved – check connection'})}
function hl(){document.querySelectorAll('label.o').forEach(l=>{const i=l.querySelector('input');l.classList.toggle('sel',!!(i&&i.checked))})}
function pg(){hl();const e=$('#pc');if(e)e.textContent='Answered '+Object.keys(St.ans).length+' / '+(St.Q||[]).length}
function timer(){clearInterval(tick);const end=St.pr.start+St.meta.duration*60000;
 const t=()=>{const l=end-(Date.now()+skew);if(l<=0){clearInterval(tick);alert('Time is up. Your exam is being submitted.');return submitEx()}const s=Math.ceil(l/1000);const e=$('#tl');if(e)e.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};t();tick=setInterval(t,500)}
async function submitEx(){clearInterval(tick);try{await sv.catch(()=>{});await db('results/'+S.uid,'PUT',{ans:JSON.stringify(St.ans),submitted:{'.sv':'timestamp'}});St.res=await db('results/'+S.uid);studentView()}
 catch(e){alert('Submission failed ('+e.message+'). Check your internet. If the time is over, tell your exam administrator.');timer()}}
loginView();
