
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt=(n,d=1)=>Number(n).toFixed(d).replace(".",",");
const pad=n=>String(n).padStart(2,"0");
const START=new Date(2026,10,9), TOTAL=180, GOAL=75, W0=90, WATER=2000;
const isoD=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const parseISO=s=>{const[y,m,d]=String(s).split("-").map(Number);return new Date(y,m-1,d);};
const dateOf=n=>{const d=new Date(START);d.setDate(d.getDate()+n-1);return d;};
const nOf=d=>Math.round((new Date(d.getFullYear(),d.getMonth(),d.getDate())-START)/864e5)+1;
const TODAY=()=>nOf(new Date());
const todayISO=()=>isoD(new Date());
const DOW=["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
const MES=["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const brD=d=>pad(d.getDate())+"/"+pad(d.getMonth()+1)+"/"+String(d.getFullYear()).slice(2);
const brS=d=>pad(d.getDate())+"/"+pad(d.getMonth()+1);
const blob=id=>BLOBURL[id]||"";
const newId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const normEx=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s+/g," ").trim();

// pop-up do Sistema
let popT;
function pop(eyebrow,title,kind){$$(".pop").forEach(p=>p.remove());clearTimeout(popT);
  const p=document.createElement("div");p.className="pop"+(kind?" "+kind:"");p.setAttribute("role","status");
  p.innerHTML=`<span class="eyebrow">${esc(eyebrow)}</span><b>${esc(title)}</b>`;document.body.appendChild(p);popT=setTimeout(()=>p.remove(),3200);}

// ================= GAME DESIGN =================
const PHASES=["O Despertar","O Recruta","O Guerreiro","O Caçador","O Monarca","O Deus"];
const STORY=[
 ["O Despertar","Todo jogador começa fraco. O Sistema escolheu você mesmo assim. Nesta fase o objetivo não é ser forte, é aparecer todos os dias e criar o hábito."],
 ["O Recruta","O corpo já entendeu que isso não é passageiro. Agora as cargas sobem, a disciplina vira rotina e a cintura começa a responder."],
 ["O Guerreiro","Metade do caminho. A balança vai parecer travada em alguns dias. Guerreiros não negociam com a balança, negociam com a consistência."],
 ["O Caçador","Você já não reage aos desafios, você vai atrás deles. Os bosses ficam mais duros e a definição começa a aparecer de verdade."],
 ["O Monarca","Os resultados são visíveis. Agora a missão é proteger o que você construiu e lapidar os últimos detalhes."],
 ["O Deus","A prova final. Trinta dias para fechar a campanha do jeito que você imaginou no dia 1."]];
const SIDE={sem:["Caminhar 15 minutos no dia","Preparar a marmita de amanhã","Alongar 10 minutos antes de dormir","Escrever uma vitória no diário","Treinar uma técnica nova por 5 minutos","Subir de escada em vez de elevador","Comer uma fruta no lanche","Treinar 10 minutos de um movimento novo","Ler um capítulo de um livro","Aprender um conhecimento novo e anotar no diário"],
 fds:["Mobilidade 10 minutos","Escrever uma vitória no diário","Preparar as marmitas da semana","Alongamento de 15 minutos","Organizar a mochila de treino da semana","Treinar 10 minutos de um movimento novo","Ler um capítulo de um livro","Aprender um conhecimento novo e anotar no diário"]};
function sideFor(n){const wd=dateOf(n).getDay(),p=(wd===0||wd===6)?SIDE.fds:SIDE.sem;return p[hash(n*13+5)%p.length];}
function emPeriods(){return (S.perfil.emergencia&&S.perfil.emergencia.periodos)||[];}
function emergencyOn(n){const d=isoD(dateOf(n));return emPeriods().find(p=>p.inicio<=d&&(!p.fim||d<=p.fim))||null;}
function returning(n){const d=dateOf(n);return emPeriods().some(p=>{if(!p.fim)return false;const f=parseISO(p.fim),diff=(d-f)/864e5;return diff>=1&&diff<=3;});}
const phaseOf=n=>Math.min(5,Math.max(0,Math.floor((n-1)/30)));
const PLAN={
 2:{t:"Superior A",ex:[
  {n:"Supino inclinado com halter",k:["supino inclinado"],s:3,lo:8,hi:10,inc:2,g:"peito"},
  {n:"Puxada frontal",k:["puxada","pulldown"],s:3,lo:8,hi:12,inc:2.5,g:"costas"},
  {n:"Desenvolvimento com halter",k:["desenvolvimento"],s:3,lo:8,hi:10,inc:2,g:"ombro"},
  {n:"Remada baixa",k:["remada baixa","remada sentad"],s:3,lo:10,hi:12,inc:2.5,g:"costas"},
  {n:"Elevação lateral",k:["elevacao lateral"],s:3,lo:12,hi:15,inc:1,g:"ombro"},
  {n:"Rosca direta",k:["rosca"],s:2,lo:10,hi:12,inc:1,g:"braco"},
  {n:"Tríceps na polia",k:["triceps"],s:2,lo:10,hi:12,inc:2.5,g:"braco"}]},
 4:{t:"Inferior + core",ex:[
  {n:"Leg press",k:["leg press","leg"],s:3,lo:10,hi:12,inc:10,g:"perna"},
  {n:"Stiff com halteres",k:["stiff","terra romeno"],s:3,lo:8,hi:10,inc:2,g:"perna"},
  {n:"Cadeira extensora",k:["extensora"],s:3,lo:10,hi:12,inc:2.5,g:"perna"},
  {n:"Mesa flexora",k:["flexora"],s:3,lo:10,hi:12,inc:2.5,g:"perna"},
  {n:"Cadeira abdutora",k:["abdutora","abducao"],s:3,lo:12,hi:15,inc:2.5,g:"perna"},
  {n:"Panturrilha",k:["panturrilha","gemeos"],s:3,lo:12,hi:15,inc:5,g:"perna"},
  {n:"Elevação de pernas",k:["elevacao de pernas","elevacao de perna"],s:3,lo:10,hi:15,inc:0,g:"core"},
  {n:"Prancha",k:["prancha"],s:3,lo:40,hi:60,inc:0,g:"core",tempo:true}]},
 5:{t:"Superior B",ex:[
  {n:"Supino reto ou máquina",k:["supino reto","supino maquina","supino na maquina","chest press"],s:3,lo:8,hi:10,inc:2.5,g:"peito"},
  {n:"Barra fixa",k:["barra fixa","barra"],s:3,lo:5,hi:10,inc:0,g:"costas"},
  {n:"Remada serrote",k:["serrote","remada unilateral"],s:3,lo:8,hi:10,inc:2,g:"costas"},
  {n:"Elevação lateral",k:["elevacao lateral"],s:4,lo:12,hi:15,inc:1,g:"ombro"},
  {n:"Face pull",k:["face pull"],s:3,lo:12,hi:15,inc:2.5,g:"ombro"},
  {n:"Crucifixo inclinado",k:["crucifixo","voador","peck"],s:2,lo:10,hi:12,inc:1,g:"peito"}]}
};
const SAT=[[4,8,3,15,30,40],[4,10,3,20,40,50],[5,10,4,20,50,60],[5,12,4,25,60,70],[5,15,5,25,75,80],[5,20,5,30,90,100]];
function hash(n){let x=Math.imul(n^0x9e3779b9,2654435761)>>>0;x^=x>>>15;x=Math.imul(x,2246822519)>>>0;x^=x>>>13;x=Math.imul(x,3266489917)>>>0;x^=x>>>16;return x>>>0;}
const POOL={
 gym:[L=>["Esteira: "+[4,5,5,6,6,7][L]+" km caminhando com inclinação","Depois do treino. Pode dividir em dois blocos."],
      L=>["Escada da academia: "+(10+L*3)+" minutos","Ritmo constante, sem se apoiar."],
      L=>["Bike: "+(6+L)+" tiros de 30 s forte","Com 90 s leve entre os tiros."],
      L=>["Farmer walk: "+(4+L)+" voltas de 30 m","Halteres pesados, postura reta."],
      L=>["Remo: "+fmt(1.5+L*.25,2).replace(",00","")+" km","No ergômetro, depois do treino."]],
 luta:[L=>["Depois da aula: "+(3+Math.ceil(L/2))+" rounds extras de saco","2 min cada, 1 min de pausa."],
       L=>[(60+L*20)+" chutes no saco","Metade de cada perna, técnica antes de força."],
       L=>["Pular corda: "+(5+L*2)+" x 1 minuto","30 s de pausa entre os blocos."]],
 casa:[L=>[(60+L*20)+" flexões no dia","Divida como quiser, do acordar até dormir."],
       L=>[(30+L*10)+" burpees no dia","Em séries de 10."],
       L=>["Prancha acumulada: "+(3+L)+" minutos","Some as séries até bater o tempo."],
       L=>[(100+L*25)+" agachamentos livres no dia","Em séries de 25."],
       L=>["Shadow boxing em casa: "+(4+L)+" rounds de 2 min","Use o cronômetro da aba Treino."],
       L=>["Dia 100% cozinhado em casa","Zero delivery e zero fast food."],
       L=>["Dia sem açúcar e sem refrigerante","Café sem açúcar também conta."],
       L=>["Mobilidade: "+(15+L*3)+" minutos","Quadril, ombros e coluna, no chão da sala."]]
};
const isMBoss=n=>n%30===0;
// sábado de kickboxing: no máximo 1 por mês, nunca nas datas bloqueadas, nunca em semanas seguidas
const KICK_EXCL=new Set(["2026-11-14","2026-11-21","2026-11-28","2026-12-05","2026-12-26","2027-01-02"]);
const KICK_DAYS=(()=>{const byM={},out=[];for(let n=6;n<=179;n++){const d=dateOf(n);if(d.getDay()!==6||isMBoss(n)||KICK_EXCL.has(isoD(d)))continue;const k=d.getFullYear()*12+d.getMonth();(byM[k]=byM[k]||[]).push(n);}
  Object.keys(byM).map(Number).sort((a,b)=>a-b).forEach(k=>{const c=byM[k].filter(n=>!out.length||n-out[out.length-1]>=14);if(c.length)out.push(c[hash(k*7+5)%c.length]);});return new Set(out);})();
const isKickSat=n=>KICK_DAYS.has(n);
const isSBoss=n=>n>=5&&n<=179&&!isMBoss(n)&&(hash(n)%8===0||isKickSat(n));
const kickRevealed=n=>isKickSat(n)&&(n<=TODAY()||(n-1<=TODAY()&&dayDone(n-1)));
function sboss(n){if(isKickSat(n))return{t:"Aula de kickboxing de sábado, 10h30 às 12h (1h30)",d:"Sábado fora de casa: vale como o desafio do dia."};const wd=dateOf(n).getDay(),L=phaseOf(n);const p=(wd===0||wd===6)?POOL.casa:(wd===1||wd===3)?POOL.luta:POOL.gym;const[t,d]=p[hash(n*7+3)%p.length](L);return{t,d};}
const HABITS=["Proteína em todas as refeições","Registrar 2 refeições ou mais","Beber 2 litros de água","Dormir 7 horas ou mais"];

function adaptSat(n,base){let f=1;const prev=[n-7,n-14].filter(x=>x>=1&&x<n&&x<=TODAY());
  if(prev.length===2&&prev.every(x=>dayDone(x)&&!dayDoc(x).rest))f=1.15;else if(prev.length&&prev.every(x=>!dayDone(x)))f=.85;
  return base.map((v,i)=>i===0||i===2?v:Math.max(1,Math.round(v*f)));}
function missionFor(n){
  const d=dateOf(n), wd=d.getDay(), L=phaseOf(n);
  const em=emergencyOn(n);
  if(em)return{tipo:"recup",titulo:"Modo recuperação",tasks:["Descansar de verdade, sem treino forçado","Beber 2 litros de água","Dormir 7 horas ou mais"],ex:[null,null,null],nota:"Motivo: "+em.motivo+". Penalidades e bosses suspensos. A sequência fica protegida.",recup:true,livre:false};
  let m={tipo:"",titulo:"",tasks:[],ex:[],nota:""};
  if(wd===1||wd===3){m={tipo:"luta",titulo:"Kickboxing",tasks:["Ir na aula de kickboxing","Registrar as técnicas na aba Treino"],ex:[null,null],nota:"Coquilha nas lutas de trocação. Hidrate antes."};}
  else if(PLAN[wd]){const P=PLAN[wd];m={tipo:"academia",titulo:P.t,tasks:P.ex.map(e=>e.n+" "+e.s+"x"+e.lo+"-"+e.hi+(e.tempo?"s":"")).concat(["Registrar as cargas na aba Treino"]),ex:P.ex.concat([null]),nota:"Termine cada série sentindo que aguentaria mais 1 ou 2."};}
  else if(wd===6){const s=adaptSat(n,SAT[L]);m={tipo:"casa",titulo:"Desafio em casa",tasks:["Flexões "+s[0]+"x"+s[1]+(L===0?" (joelho apoiado vale)":""),"Abdominal "+s[2]+"x"+s[3],"Prancha 3x"+s[4]+"s","Agachamento livre 3x"+Math.round(s[5]/3)],ex:[null,null,null,null],nota:"Nível "+(L+1)+" de 6. As metas sobem a cada fase."};}
  else {m={tipo:"casa",titulo:"Domingo em casa",tasks:["Mobilidade 10 minutos","Shadow boxing "+(3+Math.floor(L/2))+" rounds de 2 min","Abdominal bicicleta 3x"+(20+L*4),"Prancha lateral 2x"+(20+L*8)+"s de cada lado"],ex:[null,null,null,null],nota:"Sem sair de casa. Use o cronômetro da aba Treino."};
    if(n%14===0){m.tasks.push("Check-in: peso de manhã");m.ex.push(null);}}
  if(n===1){m={tipo:"luta",titulo:"Aula experimental: kickboxing",tasks:["Ir na aula experimental de kickboxing","Fotos de base tiradas","Contar ao Coach como foi"],ex:[null,null,null],nota:"Primeiro dia da campanha. Só aparecer já vale."};}
  const gym=(w,nota)=>{const P=PLAN[w];return{tipo:"academia",titulo:P.t,tasks:P.ex.map(e=>e.n+" "+e.s+"x"+e.lo+"-"+e.hi+(e.tempo?"s":"")).concat(["Registrar as cargas na aba Treino"]),ex:P.ex.concat([null]),nota};};
  if(n===2)m=gym(2,"Semana 1: Superior A.");
  if(n===3)m=gym(4,"Semana 1: hoje inferior + core, amanhã kickboxing.");
  if(n===4){m={tipo:"luta",titulo:"Kickboxing",tasks:["Ir na aula de kickboxing","Registrar as técnicas na aba Treino"],ex:[null,null],nota:"Semana 1: o kickboxing vem na quinta. Coquilha e hidratação."};}
  if(n===5)m=gym(5,"Semana 1: fecha a semana com Superior B.");
  if(returning(n)&&m.tipo==="academia")m.nota="Retomada depois da recuperação: faça 1 série a menos em cada exercício. "+m.nota;
  if(isMBoss(n)){m.boss=true;m.titulo="Chefão da fase "+(L+1)+": "+m.titulo;["Teste: máximo de flexões seguidas","Teste: prancha máxima","Pesar de manhã","Fotos frente, perfil e costas para o novo scan"].forEach(t=>{m.tasks.push(t);m.ex.push(null);});}
  m.livre=wd===6;
  return m;
}
const XP={side:15,task:25,full:50,mboss:500,sboss:300,habit:10,pen:-100,meal:5,treino:40,diario:15,checkin:20};

// ================= STORE (aparelho + sincronização opcional) =================
const COLL=["dias","diario","checkins","refeicoes","treinos","fotos","loja","modelos","projetos","saude","relatorios","favoritos","perfil","receitas","memoria"];
const S={};COLL.forEach(c=>S[c]={});
let ASSETS=null,SAMPLE=null,DL=null,MODE="carregando",loaded=false;
const LSK={get(k){try{return JSON.parse(localStorage.getItem(k)||"null");}catch(e){return null;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){pop("Sistema","Armazenamento do aparelho cheio.");}}};
let TOMB=LSK.get("fdd2-tomb")||{};
const UNDO=[];
function persist(c){LSK.set("fdd2-"+c,S[c]);}
function put(c,id,data,opt){
  const prev=S[c][id];if(!(opt&&opt.noUndo))UNDO.push({c,id,prev});if(UNDO.length>30)UNDO.shift();
  const doc={...data,_u:Date.now()};S[c]={...S[c],[id]:doc};delete TOMB[c+"/"+id];persist(c);LSK.set("fdd2-tomb",TOMB);renderAll();Sync.schedule();
}
function del(c,id,opt){
  const prev=S[c][id];if(!(opt&&opt.noUndo))UNDO.push({c,id,prev});
  const m={...S[c]};delete m[id];S[c]=m;TOMB[c+"/"+id]=Date.now();persist(c);LSK.set("fdd2-tomb",TOMB);renderAll();Sync.schedule();
}
function askDel(c,id){if(!id||!S[c]||!S[c][id]){pop("Sistema","Não achei esse registro. Feche e abra o app.");return;}
  $$(".delbar").forEach(x=>x.remove());const bar=document.createElement("div");bar.className="delbar";
  bar.style.cssText="position:fixed;left:0;right:0;bottom:0;z-index:999;display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;padding:14px max(16px,env(safe-area-inset-left,0px)) calc(14px + env(safe-area-inset-bottom,0px));background:#0b1220;border-top:1px solid #3b82f6;color:#e6eefc;font-size:15px";
  bar.innerHTML='<span>Apagar este registro?</span><button class="btn pri" data-y>Apagar</button><button class="btn" data-n>Cancelar</button>';
  bar.querySelector("[data-y]").onclick=()=>{bar.remove();del(c,id);pop("Sistema","Apagado. Dá para desfazer em Perfil.");};
  bar.querySelector("[data-n]").onclick=()=>bar.remove();document.body.appendChild(bar);}
function undo(){const u=UNDO.pop();if(!u){pop("Sistema","Nada para desfazer.");return;}
  if(u.prev)put(u.c,u.id,u.prev,{noUndo:true});else del(u.c,u.id,{noUndo:true});pop("Sistema","Última ação desfeita.");}
const setSync=t=>{const el=$("#sync");if(el)el.textContent=t;};
// ---- blobs (fotos, frames do scan) em IndexedDB ----
const BLOBURL={};
const IDB={db:null,open(){return this.db||(this.db=new Promise((res,rej)=>{const r=indexedDB.open("fdd-blobs",1);r.onupgradeneeded=()=>r.result.createObjectStore("b");r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);}));},
  async put(id,blob){const db=await this.open();return new Promise((res,rej)=>{const t=db.transaction("b","readwrite");t.objectStore("b").put(blob,id);t.oncomplete=res;t.onerror=()=>rej(t.error);});},
  async all(){const db=await this.open();return new Promise((res,rej)=>{const out={},t=db.transaction("b","readonly"),st=t.objectStore("b"),rq=st.openCursor();rq.onsuccess=()=>{const c=rq.result;if(c){out[c.key]=c.value;c.continue();}else res(out);};rq.onerror=()=>rej(rq.error);});},
  async del(id){const db=await this.open();return new Promise(res=>{const t=db.transaction("b","readwrite");t.objectStore("b").delete(id);t.oncomplete=res;});}};
async function compressImage(file,max=1400,q=.86){
  if(!file.type.startsWith("image/"))return file;
  try{const bmp=await createImageBitmap(file);const s=Math.min(1,max/Math.max(bmp.width,bmp.height));const c=document.createElement("canvas");c.width=Math.round(bmp.width*s);c.height=Math.round(bmp.height*s);
    c.getContext("2d").drawImage(bmp,0,0,c.width,c.height);return await new Promise(r=>c.toBlob(b=>r(b||file),file.type==="image/png"?"image/png":"image/jpeg",q));}catch(e){return file;}}
async function saveBlob(file,id){const b=await compressImage(file);id=id||newId()+newId();await IDB.put(id,b);BLOBURL[id]=URL.createObjectURL(b);return{id};}
ASSETS={upload:f=>saveBlob(f)};
// ---- download / exportação ----
DL={save:async({filename,data})=>{const b=data instanceof Blob?data:new Blob([data],{type:filename.endsWith(".json")?"application/json":filename.endsWith(".csv")?"text/csv":filename.endsWith(".png")?"image/png":"text/plain"});
  const f=new File([b],filename,{type:b.type});
  if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:filename});return{status:"saved"};}catch(e){if(e.name==="AbortError")throw{code:"declined"};}}
  const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=filename;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},2000);return{status:"saved"};}};
// ---- sincronização opcional via GitHub Gist privado ----
const Sync={timer:null,busy:false,
  token(){return LSK.get("fdd2-gh-token")||"";},gist(){return LSK.get("fdd2-gist-id")||"";},
  enabled(){return !!this.token();},
  schedule(){if(!this.enabled())return;clearTimeout(this.timer);this.timer=setTimeout(()=>this.run(),2500);},
  snapshot(){const data={};COLL.forEach(c=>data[c]=S[c]);return{v:2,saved:Date.now(),data,tomb:TOMB};},
  async api(path,opt){const r=await fetch("https://api.github.com"+path,{...opt,headers:{"Authorization":"Bearer "+this.token(),"Accept":"application/vnd.github+json",...(opt&&opt.headers||{})}});if(!r.ok)throw new Error("GitHub "+r.status);return r.json();},
  async findOrCreate(){if(this.gist())return this.gist();
    const list=await this.api("/gists?per_page=100");const g=list.find(x=>x.description==="fdd-sync: Físico dos Deuses");
    if(g){LSK.set("fdd2-gist-id",g.id);return g.id;}
    const n=await this.api("/gists",{method:"POST",body:JSON.stringify({description:"fdd-sync: Físico dos Deuses",public:false,files:{"fdd-data.json":{content:JSON.stringify(this.snapshot())}}})});
    LSK.set("fdd2-gist-id",n.id);return n.id;},
  merge(remote){if(!remote||!remote.data)return false;let changed=false;const rt=remote.tomb||{};
    COLL.forEach(c=>{const rm=remote.data[c]||{};const m={...S[c]};
      Object.entries(rm).forEach(([id,doc])=>{const t=TOMB[c+"/"+id];const lo=m[id];if(t&&t>=(doc._u||0))return;if(!lo||(doc._u||0)>(lo._u||0)){m[id]=doc;changed=true;}});
      Object.entries(rt).forEach(([k,ts])=>{const[cc,...rest]=k.split("/");const id=rest.join("/");if(cc!==c)return;if(m[id]&&(m[id]._u||0)<ts){delete m[id];changed=true;}if(!TOMB[k]||TOMB[k]<ts)TOMB[k]=ts;});
      S[c]=m;persist(c);});LSK.set("fdd2-tomb",TOMB);return changed;},
  async run(){if(!this.enabled()||this.busy)return;this.busy=true;setSync("sincronizando");
    try{const id=await this.findOrCreate();const g=await this.api("/gists/"+id);const f=g.files&&g.files["fdd-data.json"];
      let remote=null;if(f){const txt=f.truncated?await (await fetch(f.raw_url)).text():f.content;try{remote=JSON.parse(txt);}catch(e){}}
      const changed=this.merge(remote);
      await this.api("/gists/"+id,{method:"PATCH",body:JSON.stringify({files:{"fdd-data.json":{content:JSON.stringify(this.snapshot())}}})});
      LSK.set("fdd2-last-sync",Date.now());setSync("sincronizado "+new Date().toTimeString().slice(0,5));if(changed)renderAll();}
    catch(e){setSync("sem sincronizar ("+String(e.message||e).slice(0,30)+")");}
    finally{this.busy=false;}}};
// ---- Gemini (cérebro do Sistema, chave grátis do Google AI Studio) ----
const AI={key(){return LSK.get("fdd2-gemini-key")||"";},model(){return LSK.get("fdd2-gemini-model")||"gemini-flash-latest";},
  toSchema(s){if(!s||typeof s!=="object")return s;const o={};for(const[k,v]of Object.entries(s)){if(k==="type")o.type=String(v).toUpperCase();else if(k==="properties"){o.properties={};for(const[pk,pv]of Object.entries(v))o.properties[pk]=this.toSchema(pv);}else if(k==="items")o.items=this.toSchema(v);else if(["description","enum","required"].includes(k))o[k]=v;}return o;},
  async b64(blob){const buf=new Uint8Array(await blob.arrayBuffer());let s="";for(let i=0;i<buf.length;i+=0x8000)s+=String.fromCharCode.apply(null,buf.subarray(i,i+0x8000));return btoa(s);},
  async pickModel(){const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200",{headers:{"x-goog-api-key":this.key()}});
    if(!r.ok){let m="";try{m=(await r.json()).error.message;}catch(e){}throw{code:"key",message:m||("HTTP "+r.status)};}
    const j=await r.json();const ok=(j.models||[]).filter(m=>(m.supportedGenerationMethods||[]).includes("generateContent")).map(m=>m.name.replace(/^models\//,""))
      .filter(n=>/flash/.test(n)&&!/image|tts|live|audio|embed|exp/.test(n));
    const ver=n=>parseFloat((n.match(/gemini-(\d+(\.\d+)?)/)||[])[1]||0);
    const score=n=>ver(n)*10+(/latest/.test(n)?5:0)-(/lite/.test(n)?3:0)-(/preview/.test(n)?6:0);
    ok.sort((a,b)=>score(b)-score(a));
    const lite=ok.filter(n=>/lite/.test(n));const list=[...new Set([ok[0],...lite.slice(0,1),...ok.slice(1,4)].filter(Boolean))];
    LSK.set("fdd2-gemini-models",list);return list[0]||null;},
  fallbacks(){return (LSK.get("fdd2-gemini-models")||[]).filter(m=>m!==this.model()).slice(0,3);},
  async callOne(model,body,signal){const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),45000);
    if(signal){if(signal.aborted)ctl.abort();else signal.addEventListener("abort",()=>ctl.abort(),{once:true});}
    try{const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(model)+":generateContent",{method:"POST",signal:ctl.signal,headers:{"Content-Type":"application/json","x-goog-api-key":this.key()},body:JSON.stringify(body)});
      if(!r.ok){let msg="";try{msg=(await r.json()).error.message;}catch(e){}const code=r.status===429?"rate_limited":(r.status===400&&/API key/i.test(msg))||r.status===401||r.status===403?"not_granted":r.status===404?"model":"upstream_error";throw{code,message:(msg||("HTTP "+r.status)).slice(0,200),status:r.status};}
      return await r.json();}
    catch(e){if(e&&e.name==="AbortError")throw signal&&signal.aborted?{code:"cancelled"}:{code:"timeout",message:"o modelo demorou demais para responder"};throw e;}
    finally{clearTimeout(t);}},
  async call(body,signal){if(!LSK.get("fdd2-gemini-models")){try{await this.pickModel();}catch(e){}}const models=[this.model(),...this.fallbacks()];let last;
    for(const m of models){try{const res=await this.callOne(m,body,signal);if(m!==this.model())this.used=m;return res;}
      catch(e){last=e;if(e.code==="cancelled"||e.code==="not_granted")throw e;if(!["rate_limited","model","timeout","upstream_error"].includes(e.code))throw e;}}
    throw last;}};
function makeSample(){
  const toContents=async(input,images)=>{const turns=typeof input==="string"?[{role:"user",content:input}]:input;
    const contents=turns.map(t=>({role:t.role==="assistant"?"model":"user",parts:[{text:t.content}]}));
    const merged=[];contents.forEach(c=>{const l=merged[merged.length-1];if(l&&l.role===c.role)l.parts.push(...c.parts);else merged.push(c);});
    if(merged.length&&merged[0].role!=="user")merged.unshift({role:"user",parts:[{text:"(início)"}]});
    if(images){const arr=images instanceof Blob?[images]:[...images];const last=merged[merged.length-1];for(const im of arr){const b=await compressImage(im,1024,.8);last.parts.push({inlineData:{mimeType:b.type||"image/jpeg",data:await AI.b64(b)}});}}
    return merged;};
  const textOf=res=>{const c=res.candidates&&res.candidates[0];if(!c){throw{code:"refused",message:"sem resposta"};}return (c.content&&c.content.parts||[]).filter(p=>p.text&&!p.thought).map(p=>p.text).join("");};
  const fn=async(input,opts={})=>{if(!AI.key())throw{code:"not_granted"};
    const contents=await toContents(input,opts.images);const body={contents,generationConfig:{temperature:.7}};
    if(opts.tools&&opts.tools.length)body.tools=[{functionDeclarations:opts.tools.map(t=>({name:t.name,description:t.description,...(t.inputSchema?{parameters:AI.toSchema(t.inputSchema)}:{})}))}];
    let out="";for(let round=0;round<6;round++){
      const res=await AI.call(body,opts.signal);const cand=res.candidates&&res.candidates[0];if(!cand)throw{code:"refused"};
      const parts=(cand.content&&cand.content.parts)||[];const calls=parts.filter(p=>p.functionCall);
      const txt=parts.filter(p=>p.text&&!p.thought).map(p=>p.text).join("");if(txt){out+=(out?"\n\n":"")+txt;opts.onText&&opts.onText({text:out,delta:txt});}
      if(!calls.length||!opts.tools)break;
      body.contents.push({role:"model",parts});
      const resp=[];for(const p of calls){const t=opts.tools.find(x=>x.name===p.functionCall.name);let result;try{result=t?await t.execute(p.functionCall.args||{},{signal:opts.signal}):"ferramenta desconhecida";}catch(e){result="Erro: "+(e.message||e);}
        resp.push({functionResponse:{name:p.functionCall.name,response:{result:typeof result==="string"?result:JSON.stringify(result)}}});}
      body.contents.push({role:"user",parts:resp});}
    if(!out)throw{code:"empty_completion"};return{text:out,truncated:false};};
  fn.json=async(input,opts={})=>{if(!AI.key())throw{code:"not_granted"};const contents=await toContents(input,opts.images);
    const res=await AI.call({contents,generationConfig:{temperature:.3,responseMimeType:"application/json"}},opts.signal);const t=textOf(res);
    try{return JSON.parse(t);}catch(e){const m=t.match(/[\[{][\s\S]*[\]}]/);if(m)return JSON.parse(m[0]);throw{code:"invalid_json",text:t};}};
  fn.limits=async()=>({tools:{maxCount:20},images:{maxCount:4}});
  return fn;}
function refreshAI(){SAMPLE=AI.key()?makeSample():null;}
async function initStore(){
  COLL.forEach(c=>{S[c]=LSK.get("fdd2-"+c)||{};});
  try{const all=await IDB.all();Object.entries(all).forEach(([id,b])=>{BLOBURL[id]=URL.createObjectURL(b);});}catch(e){}
  if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});
  if(!Object.keys(S.checkins).length&&!LSK.get("fdd2-imported"))S.checkins={"2026-11-09":{d:"2026-11-09",w:90,_u:1}};
  refreshAI();MODE=Sync.enabled()?"sync":"local";setSync(Sync.enabled()?"sincronizando":"salvo no aparelho");
  loaded=true;renderAll();checkEvents(true);
  if(Sync.enabled())Sync.run();
  if(LSK.get("fdd-boot")!==todayISO())openBoot();
}
async function importBackup(file){const txt=await file.text();let j;try{j=JSON.parse(txt);}catch(e){throw new Error("Arquivo inválido");}
  const data=j.data||j;let n=0;
  for(const c of COLL){if(data[c]&&typeof data[c]==="object"){S[c]={...S[c],...data[c]};persist(c);n+=Object.keys(data[c]).length;}}
  if(j.blobs){for(const[id,b64]of Object.entries(j.blobs)){const m=b64.match(/^data:([^;]+);base64,(.*)$/);if(!m)continue;const bin=atob(m[2]);const arr=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);const b=new Blob([arr],{type:m[1]});await IDB.put(id,b);BLOBURL[id]=URL.createObjectURL(b);}}
  LSK.set("fdd2-imported",true);renderAll();Sync.schedule();return n;}
async function fullBackup(withBlobs){const out={v:2,exported:new Date().toISOString(),data:{}};COLL.forEach(c=>out.data[c]=S[c]);
  if(withBlobs){out.blobs={};const all=await IDB.all();for(const[id,b]of Object.entries(all)){out.blobs[id]="data:"+(b.type||"image/webp")+";base64,"+await AI.b64(b);}}return JSON.stringify(out);}

// ================= DERIVED =================
const dayDoc=n=>S.dias[String(n)]||{t:[],h:[],b:false,p:false,rest:false};
const diaryOf=date=>S.diario[date]||{};
const meals=()=>Object.entries(S.refeicoes).map(([id,m])=>({...m,_id:id})).filter(m=>m&&m.d).sort((a,b)=>(a.d+(a.at||""))<(b.d+(b.at||""))?1:-1);
const mealsOn=date=>meals().filter(m=>m.d===date);
const workouts=()=>Object.entries(S.treinos).map(([id,w])=>({...w,_id:id})).filter(w=>w&&w.d).sort((a,b)=>a.d<b.d?1:a.d>b.d?-1:0);
const checkins=()=>Object.values(S.checkins).filter(c=>c&&c.d&&c.w).sort((a,b)=>a.d<b.d?-1:1);
const curW=()=>{const c=checkins();return c.length?+c[c.length-1].w:W0;};
function habitsState(n){const date=isoD(dateOf(n)),d=dayDoc(n),di=diaryOf(date);return[!!(d.h&&d.h[0]),mealsOn(date).length>=2,(+di.agua||0)>=WATER,(+di.sono||0)>=7];}
const dayDone=n=>{const d=dayDoc(n);if(d.rest)return true;const m=missionFor(n);return m.tasks.every((_,i)=>d.t&&d.t[i]);};
const dayPart=n=>{const d=dayDoc(n);return (d.t||[]).some(Boolean)||habitsState(n).some(Boolean);};
const penaltyFor=n=>n>=2&&n<=Math.min(TOTAL,TODAY())&&!dayDone(n-1)&&!emergencyOn(n)&&!emergencyOn(n-1);
function dayXP(n){const m=missionFor(n),d=dayDoc(n);let x=0;
  if(d.rest)x+=XP.full;else{const td=m.tasks.filter((_,i)=>d.t&&d.t[i]).length;x+=td*XP.task;if(td===m.tasks.length)x+=XP.full+(m.boss?XP.mboss:0);}
  x+=habitsState(n).filter(Boolean).length*XP.habit;
  if(isSBoss(n)&&d.b&&!emergencyOn(n))x+=XP.sboss;
  if(d.s)x+=XP.side;
  if(d.esp)x+=100;
  if(penaltyFor(n)&&!d.p&&n<TODAY())x+=XP.pen;
  return x;}
function xpEarned(){let x=0;const t=Math.min(TOTAL,TODAY());for(let n=1;n<=t;n++)x+=dayXP(n);
  const perDay={};meals().forEach(m=>{perDay[m.d]=(perDay[m.d]||0)+1;});Object.values(perDay).forEach(c=>x+=Math.min(6,c)*XP.meal);
  x+=workouts().length*XP.treino;
  x+=Object.values(S.diario).filter(d=>d&&(d.vitorias||d.humor)).length*XP.diario;
  x+=checkins().length*XP.checkin;return Math.max(0,x);}
const xpSpent=()=>Object.values(S.loja).filter(r=>r.tipo==="compra").reduce((a,r)=>a+(+r.custo||0),0);
const levelOf=xp=>Math.floor(Math.sqrt(xp/40))+1;
const xpForLevel=l=>40*(l-1)*(l-1);
const rankOf=l=>l>=50?"S":l>=40?"A":l>=30?"B":l>=20?"C":l>=10?"D":"E";
function streak(){const t=Math.min(TOTAL,TODAY());let n=dayDone(t)?t:t-1,s=0;while(n>=1&&dayDone(n)){s++;n--;}return s;}
function bestStreak(){let b=0,c=0;for(let n=1;n<=Math.min(TOTAL,TODAY());n++){if(dayDone(n)){c++;b=Math.max(b,c);}else c=0;}return b;}
function bossesBeaten(){let s=0,m=0;for(let n=1;n<=TOTAL;n++){if(isMBoss(n)&&dayDone(n)&&!dayDoc(n).rest)m++;if(isSBoss(n)&&dayDoc(n).b)s++;}return{s,m,t:s+m};}
const plannedW=n=>GOAL+(W0-GOAL)*Math.pow(1-Math.min(1,Math.max(0,(n-1)/(TOTAL-1))),1.2);
function exHistory(){const ex={};workouts().slice().reverse().forEach(w=>(w.p&&w.p.exercicios||[]).forEach(e=>{const k=normEx(e.nome);if(!k)return;(ex[k]=ex[k]||{nome:e.nome,pts:[]}).pts.push({d:w.d,c:+e.carga_kg||0,r:+e.reps||0,s:+e.series||0});}));return ex;}
function lastFor(def){for(const w of workouts()){for(const e of (w.p&&w.p.exercicios||[])){const nm=normEx(e.nome);if(def.k.some(k=>nm.includes(k)))return{c:+e.carga_kg||0,r:+e.reps||0,s:+e.series||0,d:w.d};}}return null;}
function suggest(def){const l=lastFor(def);
  if(l&&l.c&&def.inc&&(new Date()-parseISO(l.d))>14*864e5)return `Voltando de pausa: ${fmt(Math.round(l.c*0.9*2)/2,1).replace(",0","")} kg (90% da última)`;
  if(!l)return def.inc?"Primeira vez: escolha uma carga que deixe 2 repetições sobrando":"Faça o máximo com boa forma";
  if(!def.inc)return l.r?`Última: ${l.r}${def.tempo?"s":" reps"}. Hoje tente ${l.r+(def.tempo?5:1)}${def.tempo?"s":""}`:"Bata o último registro";
  if(!l.c)return "Registre a carga para eu ajustar";
  if(l.r>=def.hi)return `Subir: ${fmt(l.c+def.inc,1).replace(",0","")} kg (última ${fmt(l.c,1).replace(",0","")} kg x ${l.r})`;
  return `Manter ${fmt(l.c,1).replace(",0","")} kg e buscar ${Math.min(def.hi,(l.r||def.lo)+1)} reps`;}
const GROUPS={peito:["supino","crucifixo","voador","peck","flexao","chest"],costas:["puxada","remada","barra","serrote","pulldown","pull"],ombro:["desenvolvimento","elevacao lateral","face pull","lateral","militar"],braco:["rosca","triceps","biceps"],perna:["agachamento","leg","stiff","bulgaro","flexora","extensora","panturrilha","gemeos","abdutora","adutora","abducao","afundo","terra"],core:["prancha","abdominal","elevacao de perna","crunch"]};
const VOLT={peito:[10,16],costas:[10,18],ombro:[10,16],braco:[6,12],perna:[10,16],core:[6,12]};
function weekVolume(){const now=new Date();const st=new Date(now);st.setDate(st.getDate()-6);const s=isoD(st);const v={};Object.keys(GROUPS).forEach(g=>v[g]=0);
  workouts().filter(w=>w.d>=s).forEach(w=>(w.p&&w.p.exercicios||[]).forEach(e=>{const nm=normEx(e.nome);for(const g in GROUPS){if(GROUPS[g].some(k=>nm.includes(k))){v[g]+=(+e.series||1);break;}}}));return v;}

// ================= HEADER =================
let lastLevel=null;
function renderHeader(){
  const t=TODAY(),n=Math.min(TOTAL,Math.max(1,t)),earned=xpEarned(),lvl=levelOf(earned);
  $("#sDay").textContent=n+"/180";$("#sLvl").textContent="LVL "+lvl;$("#sRank").textContent=rankOf(lvl);
  const a=xpForLevel(lvl),b=xpForLevel(lvl+1);$("#sXpBar").style.width=((earned-a)/(b-a)*100)+"%";
  $("#sXp").textContent=(earned-xpSpent()).toLocaleString("pt-BR");
  const s=streak();$("#sStreak").textContent=s+(s===1?" dia":" dias");$("#sW").textContent=fmt(curW())+" → 75";
  if(loaded){if(lastLevel!==null&&lvl>lastLevel)pop("Sistema","Level up! LVL "+lvl,"gold");lastLevel=lvl;}
}

// ================= SISTEMA =================
const QUOTES=["Dia ruim também conta. Só não pode contar zero.","O corpo que você quer é construído nos dias que ninguém vê.","Você já saiu dos 110. Aquilo não foi sorte, foi rotina.","Motivação abre a porta. Disciplina é quem entra todo dia.","A balança oscila. A cintura e a carga não mentem.","A ansiedade pede comida. Você pode responder com outra coisa.","Ninguém lembra do treino que você pulou. Você lembra.","Cada série bem feita é um tijolo. São 180 dias de obra.","Cansado é normal. Desistir é escolha.","Na luta você aprende: apanhar faz parte, voltar pro centro é o que importa.","O tanquinho já existe. Só está escondido.","Hoje é só a quest de hoje.","Quem te viu parado vai te ver voltando.","Recomeçar não é voltar pro zero. É voltar com experiência.","Feito é melhor que perfeito. Registra e segue.","O espelho demora. O caderno de treino não.","Você não precisa de vontade. Precisa de horário.","Pequeno todo dia vence grande de vez em quando.","A cirurgia te parou dois meses. Não vai te parar seis.","Respira, trava o abdômen, mais uma.","O plano não é sofrer. É não parar.","O seu eu de maio está contando com você hoje.","Forte é quem volta.","Disciplina é lembrar o que você quer.","Ombro largo você já tem. Agora é tirar a cortina.","Fez, marca. Não fez, amanhã faz. Sem drama.","Cada gota de suor é XP.","A luta é contra quem você era ontem.","Todo mundo tem sua luta. Essa é a sua.","Boss não avisa. Esteja pronto.","O nível sobe um dia de cada vez."];
const SONGS=[
 ["Rap do Quebrando Regras (Motivacional)","Mano Perna","https://www.youtube.com/watch?v=XyvBLmQCcG0"],
 ["Eye of the Tiger","Survivor"],["Quebrando as Regras 2","Mano Perna","https://www.youtube.com/watch?v=ijR_cv5AU_A"],["Lose Yourself","Eminem"],
 ["Rap do Muhammad Ali","Mano Perna","https://www.youtube.com/watch?v=WTNN11UwvM8"],["Till I Collapse","Eminem"],["Dark Aria","SawanoHiroyuki[nZk]:XAI (Solo Leveling)"],
 ["Rap do Toguro (Motivacional)","Mano Perna","https://www.youtube.com/watch?v=r6K1_Ba0_rU"],["Remember the Name","Fort Minor"],["A Vida É Desafio","Racionais MC's"],
 ["O Lutador Mais Temido","Mano Perna","https://www.youtube.com/watch?v=YWNgbtnF6ok"],["Can't Be Touched","Roy Jones Jr."],["Gonna Fly Now (Rocky)","Bill Conti"],
 ["O Lutador Mais Completo do Mundo","Mano Perna","https://www.youtube.com/watch?v=ZwX7yLKVGJE"],["Stronger","Kanye West"],["LEveL","SawanoHiroyuki[nZk]:TOMORROW X TOGETHER (Solo Leveling)"],
 ["Rap dos Espartanos (300)","Mano Perna"],["X Gon' Give It to Ya","DMX"],["Hall of Fame","The Script feat. will.i.am"],["Vida Loka Parte II","Racionais MC's"],
 ["Believer","Imagine Dragons"],["Survival","Eminem"],["Warriors","Imagine Dragons"],["Centuries","Fall Out Boy"],["Can't Hold Us","Macklemore & Ryan Lewis"],
 ["Numb / Encore","Jay-Z & Linkin Park"],["Legends Never Die","Against the Current"],["Born for This","The Score"],["Thunderstruck","AC/DC"],["Unstoppable","Sia"]];
const songURL=s=>s[2]||"https://www.youtube.com/results?search_query="+encodeURIComponent(s[0]+" "+s[1]);
let viewDay=Math.min(TOTAL,Math.max(1,TODAY()));const revealed=new Set();
function patchDay(n,fn){const d=dayDoc(n);const doc={...d,t:[...(d.t||[])],h:[...(d.h||[])],b:!!d.b,p:!!d.p,rest:!!d.rest,s:!!d.s};delete doc._u;fn(doc);put("dias",String(n),doc);}
function unusedPass(){return Object.entries(S.loja).find(([_,r])=>r.tipo==="compra"&&r.item==="descanso"&&!r.usado);}
function renderSistema(){
  const n=viewDay,t=TODAY(),m=missionFor(n),d=dayDoc(n),L=phaseOf(n),date=dateOf(n),future=n>t,isToday=n===t,hs=habitsState(n);
  const done=m.tasks.filter((_,i)=>d.t&&d.t[i]).length;
  let extra="";
  if(penaltyFor(n)&&!d.rest){extra+=`<div class="bossbox pen"><span class="chip c-heat">Quest de penalidade · evita −100 XP</span><h3>${15+L*5} burpees + prancha ${fmt(1+L*.5,1).replace(",0","")} min</h3><p class="note">A quest de ontem ficou incompleta. Cumpra hoje para não perder XP.</p><label class="ck" style="border:0;padding:2px 0"><input type="checkbox" id="penChk" ${d.p?"checked":""} ${future?"disabled":""}><span class="t">Penalidade cumprida</span></label></div>`;}
  if(isSBoss(n)&&!m.recup){
    if(future&&!kickRevealed(n))extra+=`<div class="bossbox locked"><span class="eyebrow">Sinal desconhecido</span><p>Algo pode estar esperando neste dia. Você só vai saber quando chegar.</p></div>`;
    else{const b=sboss(n),anim=isToday&&!revealed.has(n);revealed.add(n);
      extra+=`<div class="bossbox${anim?" reveal":""}"><span class="chip c-boss">Boss surpresa · +${XP.sboss} XP</span><h3>${esc(b.t)}</h3><p class="note">${esc(b.d)} Fora da rotina, além da quest do dia.</p><label class="ck" style="border:0;padding:2px 0"><input type="checkbox" id="sbChk" ${d.b?"checked":""}><span class="t">Boss derrotado</span></label></div>`;
      if(anim)setTimeout(()=>pop("Alerta do Sistema","Um boss surpresa apareceu","boss"),400);}
  }
  const pass=unusedPass();
  const restBox=d.rest?`<div class="rest"><span>Passe de descanso usado. Dia contado como cumprido.</span></div>`:(!future&&!dayDone(n)&&pass?`<div class="rest"><span>Você tem um passe de descanso. Usar hoje conta a quest como cumprida.</span><button class="btn sm" id="useRest">Usar passe</button></div>`:"");
  $("#questCard").innerHTML=`
   <div class="sys-title">${m.boss?"Chefão":"Quest diária"}</div>
   <div class="head"><span class="eyebrow">Dia ${n}/180 · ${DOW[date.getDay()]} ${brD(date)} · Fase ${L+1} ${PHASES[L]}</span>
     <div class="seg"><button class="btn sm" id="dPrev" ${n<=1?"disabled":""} aria-label="Dia anterior">‹</button><button class="btn sm" id="dToday">Hoje</button><button class="btn sm" id="dNext" ${n>=TOTAL?"disabled":""} aria-label="Próximo dia">›</button></div></div>
   <div class="seg">${m.boss?`<span class="chip c-boss">+${XP.mboss} XP</span>`:""}<span class="chip ${m.tipo==="luta"?"c-heat":m.tipo==="academia"?"c-ice":"c-ok"}">${m.tipo==="luta"?"Luta":m.tipo==="academia"?"Academia":"Em casa"}</span>${future?'<span class="chip c-mute">Bloqueada até o dia</span>':""}${isToday?'<span class="timer" id="qTimer"></span>':""}</div>
   <h2 class="qtitle">${esc(m.titulo)}</h2>
   ${m.nota?`<p class="note">${esc(m.nota)}</p>`:""}
   <div class="progress"><i style="width:${d.rest?100:m.tasks.length?done/m.tasks.length*100:0}%"></i></div>
   <div class="checks">${m.tasks.map((x,i)=>`<label class="ck${d.t&&d.t[i]?" done":""}"><input type="checkbox" data-t="${i}" ${d.t&&d.t[i]?"checked":""} ${future||d.rest?"disabled":""}><span class="t"><span>${esc(x)}</span>${m.ex[i]?`<span class="hint">${esc(suggest(m.ex[i]))}</span>`:""}</span><span class="xp">+${XP.task}</span></label>`).join("")}</div>
   ${restBox}${extra}
   ${!m.recup?`<div class="side"><span class="eyebrow">Quest secundária · opcional · +${XP.side} XP</span><label class="ck" style="border:0;padding:0"><input type="checkbox" id="sideChk" ${d.s?"checked":""} ${future?"disabled":""}><span class="t">${esc(sideFor(n))}</span></label></div>`:""}
   ${isKickSat(n+1)&&n<=t?(dayDone(n)?`<div class="bossbox reveal"><span class="chip c-boss">Boss de amanhã revelado · +${XP.sboss} XP</span><h3>Aula de kickboxing de sábado, 10h30 às 12h</h3><p class="note">Como é de manhã, o Sistema avisa hoje. Separe a roupa e a luva.</p></div>`:`<div class="bossbox locked"><span class="eyebrow">Sinal detectado para amanhã cedo</span><p>Conclua a quest de hoje para revelar o boss de sábado.</p></div>`):""}
   ${m.livre?`<div class="livre">Sábado tem refeição livre: uma refeição, sem culpa, e a próxima volta ao normal. Registre em Nutrição marcando como livre.</div>`:""}
   <div><div class="sub">Hábitos · +${XP.habit} cada</div><div class="checks">${HABITS.map((x,i)=>i===0?`<label class="ck${hs[0]?" done":""}"><input type="checkbox" id="h0" ${hs[0]?"checked":""} ${future?"disabled":""}><span class="t">${x}</span></label>`:`<div class="ck auto${hs[i]?" done":""}"><input type="checkbox" disabled ${hs[i]?"checked":""} aria-label="${x}"><span class="t"><span>${x}</span><span class="hint">${["","Conta sozinho pelas refeições registradas","Conta sozinho pela água do dia","Conta sozinho pelo sono registrado"][i]}</span></span></div>`).join("")}</div></div>
   <div class="eyebrow">XP do dia: <span class="mono">${dayXP(n)}</span></div>`;
  $("#dPrev").onclick=()=>{viewDay=Math.max(1,n-1);renderSistema();};
  $("#dNext").onclick=()=>{viewDay=Math.min(TOTAL,n+1);renderSistema();};
  $("#dToday").onclick=()=>{viewDay=Math.min(TOTAL,Math.max(1,TODAY()));renderSistema();};
  $$("#questCard [data-t]").forEach(el=>el.onchange=()=>{const was=dayDone(n);patchDay(n,doc=>{doc.t[+el.dataset.t]=el.checked;});
    if(!was&&dayDone(n)){if(isKickSat(n+1))setTimeout(()=>pop("Boss de amanhã revelado","Kickboxing sábado 10h30","boss"),1600);pop(m.boss?"Chefão derrotado":"Quest completa",m.boss?"+"+(XP.mboss+XP.full)+" XP":"+"+XP.full+" XP bônus",m.boss?"boss":"");}});
  const h0=$("#h0");if(h0)h0.onchange=()=>patchDay(n,doc=>{doc.h[0]=h0.checked;});
  const sb=$("#sbChk");if(sb)sb.onchange=()=>{patchDay(n,doc=>{doc.b=sb.checked;});if(sb.checked)pop("Boss derrotado","+"+XP.sboss+" XP","boss");};
  const sc=$("#sideChk");if(sc)sc.onchange=()=>{patchDay(n,doc=>{doc.s=sc.checked;});if(sc.checked)pop("Quest secundária","+"+XP.side+" XP");};
  const pc=$("#penChk");if(pc)pc.onchange=()=>patchDay(n,doc=>{doc.p=pc.checked;});
  const ur=$("#useRest");if(ur)ur.onclick=()=>{const [pid,pr]=unusedPass();put("loja",pid,{...pr,usado:true,dia:n});patchDay(n,doc=>{doc.rest=true;});pop("Sistema","Dia de descanso ativado","gold");};
  // status
  const today=todayISO(),di=diaryOf(today);$("#stDate").textContent=brD(new Date());
  const emNow=emergencyOn(Math.min(TOTAL,Math.max(1,t)));
  $("#recupBox").innerHTML=emNow?`<div class="recup"><b class="c-ok">Modo recuperação ativo desde ${brS(parseISO(emNow.inicio))}</b><span class="note">Motivo: ${esc(emNow.motivo)}. Quests leves, sem penalidade e sem boss. Quando encerrar, os 3 primeiros dias de academia vêm com 1 série a menos.</span><button class="btn sm" id="recupEnd" style="align-self:flex-start">Encerrar e voltar à campanha</button></div>`:"";
  $("#recupBtn").hidden=!!emNow;
  const re=$("#recupEnd");if(re)re.onclick=()=>endRecovery();
  const ag=+di.agua||0;$("#wVal").textContent=fmt(ag/1000,1)+" L";$("#wBar").style.width=Math.min(100,ag/WATER*100)+"%";
  if(document.activeElement!==$("#sleepIn"))$("#sleepIn").value=di.sono??"";
  $$(".scale5").forEach(sc=>{const k=sc.dataset.k;sc.innerHTML=[1,2,3,4,5].map(v=>`<button aria-pressed="${di[k]===v}" data-v="${v}">${v}</button>`).join("");
    sc.querySelectorAll("button").forEach(b=>b.onclick=()=>saveDiary({[k]:+b.dataset.v}));});
  if(!$("#diaryDet").open){$("#dVit").value=di.vitorias||"";$("#dDif").value=di.dificuldades||"";$("#dMel").value=di.melhorar||"";$("#dDor").value=di.dor||"";}
  const tt=Math.max(1,Math.min(TOTAL,t)),song=SONGS[(tt-1)%SONGS.length];
  $("#songT").textContent=song[0];$("#songA").textContent=song[1];$("#songL").href=songURL(song);
  $("#quote").textContent=QUOTES[(tt-1)%QUOTES.length];
  // week
  const base=new Date();const wdx=(base.getDay()+6)%7;const mon=new Date(base);mon.setDate(base.getDate()-wdx);
  $("#weekStrip").innerHTML=[0,1,2,3,4,5,6].map(i=>{const dd=new Date(mon);dd.setDate(mon.getDate()+i);const nn=nOf(dd);if(nn<1||nn>TOTAL)return`<div class="wd" aria-disabled="true"><span>${DOW[dd.getDay()].slice(0,3)}</span><b>·</b></div>`;
    const cls="wd"+(dayDone(nn)?" done":nn<t?" miss":"")+(nn===t?" today":"");const mm=missionFor(nn);
    return `<button class="${cls}" data-n="${nn}"><span>${DOW[dd.getDay()].slice(0,3)}</span><b>${isSBoss(nn)&&nn<=t?"!":mm.boss?"B":nn}</b></button>`;}).join("");
  $$("#weekStrip [data-n]").forEach(b=>b.onclick=()=>{viewDay=+b.dataset.n;renderSistema();});
  $("#campBar").style.width=(tt/TOTAL*100)+"%";const bb=bossesBeaten();$("#campTxt").textContent=bb.t+" bosses vencidos";
}
function saveDiary(patch){const date=todayISO();put("diario",date,{...diaryOf(date),...patch,d:date});}
$$("[data-w]").forEach(b=>b.onclick=()=>{const di=diaryOf(todayISO());const v=Math.max(0,(+di.agua||0)+ +b.dataset.w);const was=(+di.agua||0)>=WATER;saveDiary({agua:v});if(!was&&v>=WATER)pop("Hábito cumprido","2 litros de água");});
$("#sleepBtn").onclick=()=>{const v=parseFloat($("#sleepIn").value);if(!(v>=0&&v<=16))return;saveDiary({sono:v});pop("Sistema","Sono registrado: "+fmt(v,1).replace(",0","")+" h");};
$("#dSave").onclick=()=>{saveDiary({vitorias:$("#dVit").value.trim(),dificuldades:$("#dDif").value.trim(),melhorar:$("#dMel").value.trim(),dor:$("#dDor").value.trim()});$("#diaryDet").open=false;pop("Sistema","Diário salvo");};
setInterval(()=>{const el=$("#qTimer");if(!el)return;const now=new Date(),end=new Date(now);end.setHours(24,0,0,0);const s=Math.floor((end-now)/1000);el.textContent="Tempo restante "+pad(Math.floor(s/3600))+":"+pad(Math.floor(s%3600/60))+":"+pad(s%60);},1000);

// ================= CORPO =================
const REG=[
 {id:"rosto",nome:"Rosto",p:[0,48,110],fat:55,tag:"Vem de brinde",visto:"Retém gordura nas bochechas e no queixo, deixando o rosto mais cheio do que o corpo sugere.",plano:["Nada específico, afina com a perda geral","Sono e menos sódio deixam menos inchado"],quando:"Primeiros sinais em 4 a 6 semanas.",meta:"Maxilar marcado e rosto mais fino."},
 {id:"ombros",nome:"Ombros",p:[92,0,212],fat:30,tag:"Ponto forte",visto:"Seu melhor ativo. A largura de ombro passa da linha do quadril e o deltoide tem volume.",plano:["Elevação lateral (ter e sex)","Desenvolvimento com halter","Face pull para postura"],quando:"Fica evidente entre o 2º e o 4º mês, quando a cintura fecha.",meta:"Deltoide redondo e separado do braço, base do formato em V."},
 {id:"peito",nome:"Peito",p:[-55,70,295],fat:75,tag:"Foco",visto:"Acúmulo de gordura na região, visível de frente e de lado. Tem músculo por baixo.",plano:["Supino inclinado com halter","Crucifixo inclinado","Peito de cima dá formato quando a gordura sai"],quando:"Afina bem até o 4º mês. Se depois, já magro, sobrar volume firme sob o mamilo, mostre a um médico.",meta:"Peitoral firme, com a linha de baixo marcada."},
 {id:"bracos",nome:"Braços",p:[-134,0,330],fat:45,tag:"Atenção",visto:"O pico de bíceps aparece no flexionado. O músculo existe, a gordura esconde a separação.",plano:["Rosca direta e tríceps na polia","Puxadas e remadas também trabalham bíceps"],quando:"Separação começa a aparecer perto do 3º ou 4º mês.",meta:"Separação entre bíceps, tríceps e ombro."},
 {id:"abdsup",nome:"Abdômen superior",p:[0,80,352],fat:70,tag:"Foco",visto:"Coberto, mas com menos gordura que a parte de baixo. É onde os primeiros gomos aparecem.",plano:["Elevação de pernas e prancha","Quem revela é a perda de gordura"],quando:"Começa a marcar com boa luz por volta do 4º mês.",meta:"Os quatro gomos de cima visíveis."},
 {id:"abdinf",nome:"Abdômen inferior",p:[0,90,425],fat:92,tag:"Maior depósito",visto:"O maior depósito do seu corpo, com a dobra sobre o elástico da cueca. Padrão comum em homem.",plano:["Sem atalho local: treino + comida + constância","Pesar a cada 2 semanas e comparar as fotos"],quando:"O último a sair. Vai parecer travado no meio da campanha e sai de verdade no fim.",meta:"Sem dobra, com a linha do abdômen chegando no elástico."},
 {id:"flancos",nome:"Flancos",p:[102,8,408],fat:85,tag:"Foco",visto:"Bem visíveis no perfil, é o que alarga a cintura de frente.",plano:["Prancha lateral","Pallof press 3x12 cada lado"],quando:"Saem junto com o abdômen inferior, no fim da campanha.",meta:"Cintura reta de frente, linha de oblíquo aparecendo."},
 {id:"dorsais",nome:"Dorsais",p:[60,-72,300],fat:50,tag:"Construir",visto:"Pouco desenvolvidas em relação ao ombro. São elas que abrem o V.",plano:["Puxada frontal","Barra fixa, assistida se precisar","Remadas"],quando:"Diferença visível nas fotos de costas em 3 a 5 meses.",meta:"Costas largas em cima, cintura fina embaixo."},
 {id:"pernas",nome:"Pernas",p:[-56,30,660],fat:45,tag:"Manter",visto:"Proporcionais ao corpo. A luta vai trabalhar bastante, por isso um dia de perna.",plano:["Agachamento ou leg press","Stiff e búlgaro"],quando:"Definição de coxa aparece junto com o abdômen.",meta:"Coxa com a divisão do quadríceps aparecendo."}
];
const HOLO={i:0,mix:0,key:"",layers:[],built:false};let regSel="abdinf";
function buildHolo(){
  const A=S.modelos[HOLO.src||"atual"]||S.modelos.atual,M=S.modelos.meta,box=$("#holo");
  const key=(HOLO.src||"")+(A&&A.frames||[]).join()+"|"+(M&&M.frames||[]).join();
  if(key===HOLO.key&&HOLO.built)return;HOLO.key=key;
  if(!A||!A.frames||!A.frames.length){box.innerHTML=`<div class="empty" style="position:absolute;inset:0;display:grid;place-items:center;border:0">Importe seu backup em Perfil › Ajustes para ver o scan 3D.</div>`;HOLO.built=false;return;}
  const lay=(m,cls)=>`<div class="lay ${cls}">${m.frames.map(id=>`<img src="${blob(id)}" alt="" draggable="false">`).join("")}</div>`;
  box.innerHTML=`<div class="hgrid"></div><span class="ring r2"></span><span class="ring"></span><span class="corner k1"></span><span class="corner k2"></span><span class="corner k3"></span><span class="corner k4"></span>${lay(A,"atual")}${M?lay(M,"meta"):""}<div class="hl l" id="holoLbl"></div><div class="hl r"><span id="holoDeg">000</span>°<br><span id="holoPh"></span></div>`+
    REG.map(r=>`<button class="hs" data-r="${r.id}" aria-label="${r.nome}"><span class="lab">${r.nome}</span></button>`).join("");
  HOLO.layers=$$("#holo .lay").map(l=>({meta:l.classList.contains("meta"),imgs:[...l.querySelectorAll("img")]}));
  $("#rotIn").max=A.frames.length-1;HOLO.built=true;
  $$("#holo .hs").forEach(b=>b.onclick=()=>{regSel=b.dataset.r;drawHolo();renderReg();});
  let x0=0,i0=0,drag=false;const st=box;
  st.onpointerdown=e=>{if(e.target.closest(".hs"))return;drag=true;x0=e.clientX;i0=HOLO.i;};
  st.onpointermove=e=>{if(!drag)return;const dx=e.clientX-x0;if(Math.abs(dx)>8)st.setPointerCapture&&st.setPointerCapture(e.pointerId);setFrame(i0-Math.round(dx/(st.clientWidth/8)));};
  st.onpointerup=st.onpointercancel=()=>{drag=false;};
  drawHolo();
}
function setFrame(i){const n=(S.modelos.atual&&S.modelos.atual.frames.length)||12;HOLO.i=((i%n)+n)%n;$("#rotIn").value=HOLO.i;drawHolo();}
function drawHolo(){
  if(!HOLO.built)return;const box=$("#holo");
  HOLO.layers.forEach(L=>{const w=L.meta?HOLO.mix:1-HOLO.mix;L.imgs.forEach((im,j)=>{const on=j===HOLO.i;im.classList.toggle("on",on&&w>0.001);im.style.opacity=on?w:0;});});
  const n=HOLO.layers[0].imgs.length,th=HOLO.i/n*2*Math.PI;
  $("#holoDeg").textContent=String(Math.round(HOLO.i*360/n)).padStart(3,"0");
  $("#holoPh").textContent=HOLO.mix<.5?"ATUAL":"META";
  const w=90-15*HOLO.mix,bf=27-14.5*HOLO.mix;$("#holoLbl").innerHTML=(HOLO.mix<.5?"CORPO ATUAL":"CORPO META")+"<br>"+fmt(w,1).replace(",0","")+" KG · ~"+Math.round(bf)+"% GORDURA";
  // mapear coordenadas da imagem (520x940) para o palco
  const W=box.clientWidth,H=box.clientHeight,top=H*.04,lh=H*.89,sc=Math.min(W/520,lh/940),ox=(W-520*sc)/2,oy=top+(lh-940*sc)/2;
  REG.forEach(r=>{const b=box.querySelector(`.hs[data-r="${r.id}"]`);if(!b)return;
    let[px,pz,y]=r.p;if(r.id==="abdinf"||r.id==="abdsup")pz=pz-HOLO.mix*18;if(r.id==="flancos")px=px-HOLO.mix*14;
    const x=260+px*Math.cos(th)+pz*Math.sin(th),depth=pz*Math.cos(th)-px*Math.sin(th);
    b.style.left=(ox+x*sc)+"px";b.style.top=(oy+y*sc)+"px";b.classList.toggle("off",depth<-12);b.classList.toggle("on",r.id===regSel);
    const fat=HOLO.mix>.5?Math.max(10,r.fat-60):r.fat;b.style.setProperty("--c",fat>60?"var(--heat)":fat>40?"#E8D08A":"var(--ice)");});
}
function renderReg(){const r=REG.find(x=>x.id===regSel);const meta=HOLO.mix>=.5;
  $("#regPanel").innerHTML=`<span class="eyebrow">Região · ${meta?"corpo meta":"leitura do dia 1"}</span><h2>${r.nome}</h2><div><span class="chip ${r.fat>60?"c-heat":r.fat>40?"c-ice":"c-ok"}">${r.tag}</span></div>
   <div><div class="head" style="margin-bottom:5px"><span class="note">Acúmulo de gordura (estimativa visual)</span><span class="mono note">${r.fat}/100</span></div><div class="meter"><i style="width:${r.fat}%"></i></div></div>
   ${meta?`<div><div class="sub">Na meta</div><p>${r.meta}</p></div>`:""}
   <div><div class="sub">O que eu vi</div><p>${r.visto}</p></div><div><div class="sub">Plano</div><ul>${r.plano.map(x=>`<li>${x}</li>`).join("")}</ul></div><div><div class="sub">Quando muda</div><p>${r.quando}</p></div>
   <div class="regbtns seg">${REG.map(x=>`<button class="btn sm" data-rs="${x.id}" aria-pressed="${x.id===regSel}">${x.nome}</button>`).join("")}</div>`;
  $$("#regPanel [data-rs]").forEach(b=>b.onclick=()=>{regSel=b.dataset.rs;renderReg();drawHolo();});}
$("#rotIn").oninput=e=>setFrame(+e.target.value);$("#rotL").onclick=()=>setFrame(HOLO.i-1);$("#rotR").onclick=()=>setFrame(HOLO.i+1);
$("#mixIn").oninput=e=>{HOLO.mix=+e.target.value/100;drawHolo();renderReg();};
$$("[data-mix]").forEach(b=>b.onclick=()=>{HOLO.mix=+b.dataset.mix/100;$("#mixIn").value=b.dataset.mix;drawHolo();renderReg();});
new ResizeObserver(()=>drawHolo()).observe($("#holo"));
document.addEventListener("keydown",e=>{if(route!=="corpo"||/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))return;if(e.key==="ArrowLeft")setFrame(HOLO.i-1);if(e.key==="ArrowRight")setFrame(HOLO.i+1);});

const photos=()=>Object.entries(S.fotos).map(([id,p])=>({...p,_id:id})).filter(p=>p&&p.asset).sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:0);
function renderCorpo(){
  buildHolo();renderReg();
  const cs=checkins().slice().reverse(),f=v=>v?fmt(v,1).replace(",0",""):"·";
  $("#cBody").innerHTML=cs.map(k=>`<tr><td>${brD(parseISO(k.d))}</td><td>${f(k.w)}</td><td><button class="linkbtn" data-del="${esc(k.d)}">apagar</button></td></tr>`).join("");
  $$("#cBody [data-del]").forEach(b=>b.onclick=()=>askDel("checkins",b.dataset.del));
  drawW();
  const ang=$("#cmpAngle").value,ps=photos().filter(p=>p.angle===ang),box=$("#cmpBox");
  if(ps.length<2){box.innerHTML=ps.length?`<div class="photo"><img src="${blob(ps[0].asset)}" alt="Foto ${esc(ang)}"><div class="ro">DIA ${nOf(parseISO(ps[0].d))} · ${fmt(weightOn(ps[0].d))} KG</div></div><p class="note">Quando tiver a próxima foto deste ângulo, aparece um divisor para comparar.</p>`:`<div class="empty">Nenhuma foto deste ângulo ainda.</div>`;box.dataset.k="";}
  else{const a=ps[0],b=ps[ps.length-1];if(box.dataset.k!==a._id+b._id){box.dataset.k=a._id+b._id;
    box.innerHTML=`<div class="cmp" id="cmpEl"><img src="${blob(a.asset)}" alt="Antes"><img class="after" src="${blob(b.asset)}" alt="Depois"><div class="div"></div><span class="tagL">Dia ${nOf(parseISO(a.d))}</span><span class="tagR">Dia ${nOf(parseISO(b.d))}</span></div><input type="range" id="cmpX" min="0" max="100" value="50" aria-label="Divisor antes e depois">`;
    $("#cmpX").oninput=e=>$("#cmpEl").style.setProperty("--x",e.target.value+"%");}}
  $("#thumbs").innerHTML=photos().slice().reverse().filter(p=>p.angle!=="360").map(x=>`<a class="thumb" href="${blob(x.asset)}" target="_blank" rel="noopener" style="background-image:url('${blob(x.asset)}')" aria-label="Foto ${esc(x.angle)} ${brD(parseISO(x.d))}"></a>`).join("");
  const hs=Object.entries(S.saude).map(([id,h])=>({...h,_id:id})).sort((a,b)=>a.d<b.d?1:-1);
  $("#hList").innerHTML=hs.length?hs.map(h=>`<div class="item"><div><div class="meta">${brD(parseISO(h.d))} · ${esc({consulta:"Consulta",exame:"Exame",bioimpedancia:"Bioimpedância / DEXA"}[h.tipo]||h.tipo)}</div><div class="ttl">${esc(h.txt)}</div></div><div class="act"><button class="linkbtn" data-hd="${h._id}">apagar</button></div></div>`).join(""):`<div class="empty">Registre consultas, exames e bioimpedâncias para ter tudo num lugar só.</div>`;
  $$("#hList [data-hd]").forEach(b=>b.onclick=()=>askDel("saude",b.dataset.hd));
}
const weightOn=ds=>{const c=checkins().filter(x=>x.d<=ds);return c.length?+c[c.length-1].w:W0;};
$("#cmpAngle").onchange=()=>{$("#cmpBox").dataset.k="";renderCorpo();};
$("#cBtn").onclick=()=>{const d=$("#cDate").value,w=parseFloat($("#cW").value);$("#cErr").textContent="";
  if(!d){$("#cErr").textContent="Escolha a data.";return;}if(!(w>=40&&w<=200)){$("#cErr").textContent="Digite o peso em kg, entre 40 e 200.";return;}
  const num=id=>{const v=parseFloat($(id).value);return v>0?v:null;};
  put("checkins",d,{...(S.checkins[d]||{}),d,w});
  ["#cW"].forEach(s=>$(s).value="");pop("Check-in registrado","+"+XP.checkin+" XP");};
$("#hBtn").onclick=()=>{const t=$("#hTxt").value.trim();$("#hErr").textContent="";if(!t){$("#hErr").textContent="Descreva a consulta ou o exame.";return;}
  put("saude",newId(),{d:$("#hDate").value||todayISO(),tipo:$("#hType").value,txt:t.slice(0,160)});$("#hTxt").value="";};
$("#upBtn").onclick=async()=>{const f=$("#upFile").files[0],ang=$("#upAngle").value,d=$("#upDate").value||todayISO();$("#upErr").textContent="";
  if(!f){$("#upErr").textContent="Escolha um arquivo primeiro.";return;}
  if(!ASSETS){$("#upErr").textContent="Não consegui salvar no aparelho.";return;}
  if(f.size>20*1024*1024){$("#upErr").textContent="Arquivo maior que 20 MB.";return;}
  $("#upBtn").disabled=true;$("#upBtn").textContent="Enviando";
  try{const r=await ASSETS.upload(f);put("fotos",newId(),{d,angle:ang,asset:r.id,kind:f.type.startsWith("video")?"video":"foto"});pop("Sistema","Foto registrada");$("#upFile").value="";}
  catch(e){$("#upErr").textContent=e&&e.code==="unsupported_type"?"Formato não aceito.":"Não consegui enviar agora.";}
  $("#upBtn").disabled=false;$("#upBtn").textContent="Enviar";};

// ================= TREINO =================
let curEx=null;
function nextGymDay(){for(let k=0;k<8;k++){const d=new Date();d.setDate(d.getDate()+k);const n=nOf(d);if(PLAN[d.getDay()]&&n>=1&&n<=TOTAL&&!(k===0&&dayDone(n)))return{d,n,P:PLAN[d.getDay()]};}return null;}
// leitura local do treino (funciona sem o Gemini)
function parseTreinoLocal(texto){
  const segs=String(texto).split(/\n|;|(?<=kg)\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])|(?<=\d)\s*\.\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/).map(x=>x.trim()).filter(Boolean);
  const ex=[];
  segs.forEach(sg=>{const n=normEx(sg);if(!Object.values(GROUPS).some(ks=>ks.some(k=>n.includes(k))))return;
    let nome=sg.split(/\s(?=\d)|\s(?:com|na|no|fiz|de|em)\s/i)[0].replace(/[,:.\-]+$/,"").trim().toLowerCase();if(!nome)return;
    const sr=sg.match(/(\d+)\s*[xX×]\s*(\d+)/);const kgPart=sg.match(/((?:\d+(?:[.,]\d+)?\s*(?:,|e)?\s*)+)kg/i);
    let carga=null;if(kgPart){const nums=(kgPart[1].match(/\d+(?:[.,]\d+)?/g)||[]).map(v=>+v.replace(",",".")).filter(v=>v>0&&v<500);if(nums.length)carga=Math.max(...nums);}
    ex.push({nome:nome.slice(0,60),series:sr?+sr[1]:3,reps:sr?+sr[2]:null,carga_kg:carga});});
  const luta=/luta|kick|jiu|muay|boxe|sparr|kimono|tatame|chute|soco|raspagem|guarda|finaliza/i.test(texto);
  const tipo=ex.length>=2||(!luta&&ex.length)?"academia":luta?"luta":"outro";
  const mod=tipo==="academia"?"musculação":/jiu/i.test(texto)?"jiu-jitsu":/kick/i.test(texto)?"kickboxing":/muay/i.test(texto)?"muay thai":tipo==="luta"?"luta":"";
  return{tipo,modalidade:mod,minutos:null,intensidade:3,exercicios:ex.slice(0,20),tecnicas:[],resumo:ex.length?ex.length+" exercícios registrados":"",local:true};}
let _fixT=false;function fixTreinos(){if(_fixT)return;_fixT=true;Object.entries(S.treinos).forEach(([id,w])=>{if(w&&w.texto&&(!w.p||(w.p.local&&!w.p.exercicios.length))){const p=parseTreinoLocal(w.texto);if(p.exercicios.length||p.tipo!=="outro")put("treinos",id,{...w,p},{noUndo:true});}});}
function renderTreino(){if(loaded)setTimeout(fixTreinos,0);
  const ng=nextGymDay();
  $("#nextCard").innerHTML=ng?`<div class="sys-title">Próximo treino</div><div class="head"><h2>${esc(ng.P.t)}</h2><span class="eyebrow">${DOW[ng.d.getDay()]} ${brS(ng.d)}</span></div>
    <div class="list">${ng.P.ex.map(e=>`<div class="item"><div><div class="ttl">${esc(e.n)} <span class="mono note">${e.s}x${e.lo}-${e.hi}${e.tempo?"s":""}</span></div><div class="meta" style="color:var(--ice)">${esc(suggest(e))}</div></div></div>`).join("")}</div>
    <p class="note">As cargas se ajustam sozinhas pelo que você registra: bateu o topo das repetições em todas as séries, o Sistema sobe a carga na próxima.</p>`:`<div class="sys-title">Próximo treino</div><p class="note">Sem treino de academia nos próximos dias.</p>`;
  const v=weekVolume(),flags=[];
  $("#volBox").innerHTML=Object.keys(VOLT).map(g=>{const [lo,hi]=VOLT[g],max=22,val=v[g];if(val<lo)flags.push(g);
    return `<div class="vol"><span>${g.toUpperCase()}</span><div class="track"><div class="band" style="left:${lo/max*100}%;width:${(hi-lo)/max*100}%"></div><div class="fill" style="width:${Math.min(100,val/max*100)}%;background:${val<lo?"var(--heat)":"var(--ice)"}"></div></div><span class="mono">${val} séries</span></div>`;}).join("");
  {const last={};workouts().forEach(w=>(w.p&&w.p.exercicios||[]).forEach(e=>{const nm=normEx(e.nome);for(const g in GROUPS){if(GROUPS[g].some(k=>nm.includes(k))){if(!last[g]||w.d>last[g])last[g]=w.d;break;}}}));
    $("#recBox").innerHTML=Object.keys(GROUPS).map(g=>{if(!last[g])return `<span class="chip c-mute">${g} · sem registro</span>`;const h=(new Date()-parseISO(last[g]))/36e5-12;const pct=Math.max(0,Math.min(100,Math.round(h/60*100)));
      return `<span class="chip ${pct>=100?"c-ok":pct>=60?"c-ice":"c-heat"}">${g} · ${pct}%</span>`;}).join("");}
  $("#volNote").textContent=workouts().length?(flags.length?"Abaixo do alvo nos últimos 7 dias: "+flags.join(", ")+".":"Volume dentro do alvo em todos os grupos."):"Registre os treinos para ver o volume por grupo muscular.";
  const ex=exHistory(),keys=Object.keys(ex).sort(),sel=$("#exSel"),cur=sel.value;
  sel.innerHTML=keys.length?keys.map(k=>`<option value="${esc(k)}">${esc(ex[k].nome)}</option>`).join(""):`<option>Sem exercícios ainda</option>`;
  if(keys.includes(cur))sel.value=cur;curEx=keys.length?ex[sel.value]:null;drawEx(curEx);
  const prs=keys.map(k=>{const best=ex[k].pts.reduce((a,p)=>p.c>a.c?p:a,{c:0});return{n:ex[k].nome,best,first:ex[k].pts[0]};}).filter(x=>x.best.c>0).sort((a,b)=>b.best.c-a.best.c).slice(0,8);
  $("#prList").innerHTML=prs.map(p=>`<div class="item"><div><div class="ttl">${esc(p.n)}</div><div class="meta">recorde ${fmt(p.best.c,1)} kg${p.best.r?" x"+p.best.r+" · 1RM estimado "+fmt(p.best.c*(1+p.best.r/30),0)+" kg":""} em ${brD(parseISO(p.best.d))}${p.first.c&&p.best.c>p.first.c?" · +"+fmt(p.best.c-p.first.c,1)+" kg desde o início":""}</div></div></div>`).join("");
  const ws=workouts(),fight=ws.filter(w=>w.p&&w.p.tipo==="luta"),fmin=fight.reduce((a,w)=>a+(+w.p.minutos||60),0),tech={};
  fight.forEach(w=>(w.p.tecnicas||[]).forEach(t=>{const k=normEx(t);if(k)tech[k]=t;}));
  $("#tFightKv").textContent=fight.length+" aulas · "+fmt(fmin/60,1)+" h";
  const tl=Object.values(tech);$("#tTech").innerHTML=tl.length?tl.map(t=>`<span class="chip c-heat">${esc(t)}</span>`).join(""):`<span class="note">As técnicas que você contar depois das aulas aparecem aqui.</span>`;
  const pf=S.perfil.luta||{};if(document.activeElement!==$("#gradIn"))$("#gradIn").value=pf.graduacao||"";
  $("#tList").innerHTML=ws.length?ws.slice(0,30).map(w=>`<div class="item"><div><div class="meta">${brD(parseISO(w.d))} · ${esc(w.p?(w.p.modalidade||w.p.tipo):"treino")}${w.p&&w.p.minutos?" · "+w.p.minutos+" min":""}${w.p&&w.p.intensidade?" · intensidade "+w.p.intensidade+"/5":""}</div>
    <div class="ttl">${esc(w.p&&w.p.resumo||w.texto)}</div>${w.p&&w.p.exercicios&&w.p.exercicios.length?`<div class="note">${w.p.exercicios.map(e=>esc(e.nome)+(e.series?" "+e.series+"x"+(e.reps||"?"):"")+(e.carga_kg?" · "+fmt(e.carga_kg,1).replace(",0","")+" kg":"")).join(" | ")}</div>`:""}</div>
    <div class="act"><button class="linkbtn" data-del="${w._id}">apagar</button></div></div>`).join(""):`<div class="empty">Nenhum treino registrado ainda.</div>`;
  $$("#tList [data-del]").forEach(b=>b.onclick=()=>askDel("treinos",b.dataset.del));
}
$("#exSel").onchange=renderTreino;
$("#gradBtn").onclick=()=>{put("perfil","luta",{...(S.perfil.luta||{}),graduacao:$("#gradIn").value.trim().slice(0,40)});pop("Sistema","Graduação salva");};
$("#tBtn").onclick=async()=>{const texto=$("#tText").value.trim();$("#tErr").textContent="";if(!texto){$("#tErr").textContent="Conte o que você treinou.";return;}
  const rec={d:$("#tDate").value||todayISO(),texto};$("#tBtn").disabled=true;$("#tStatus").textContent=SAMPLE?"Organizando...":"";
  try{if(SAMPLE){try{const p=await SAMPLE.json(`Organize o treino descrito abaixo. Responda só com JSON: {"tipo":"academia" ou "luta" ou "cardio" ou "outro","modalidade":"ex.: musculação, muay thai, kickboxing, jiu-jitsu","minutos":número ou null,"intensidade":inteiro de 1 a 5,"exercicios":[{"nome":"nome padronizado em português, minúsculo, sem carga","series":número ou null,"reps":número (repetições, ou segundos se for isometria) ou null,"carga_kg":número ou null}],"tecnicas":["técnicas de luta treinadas, curtas, em português"],"resumo":"uma frase curta e específica sobre o treino, tom de treinador"}. Se for luta, exercicios pode ficar vazio. Use a maior carga citada por exercício.\n\nTreino: ${texto}`,{modelTier:"quick"});
      if(p&&typeof p==="object")rec.p={tipo:["academia","luta","cardio","outro"].includes(p.tipo)?p.tipo:"outro",modalidade:String(p.modalidade||"").slice(0,40),minutos:+p.minutos||null,intensidade:Math.max(1,Math.min(5,Math.round(+p.intensidade||3))),
        exercicios:Array.isArray(p.exercicios)?p.exercicios.slice(0,20).map(e=>({nome:String(e.nome||"").slice(0,60),series:+e.series||null,reps:+e.reps||null,carga_kg:+e.carga_kg||null})):[],tecnicas:Array.isArray(p.tecnicas)?p.tecnicas.slice(0,15).map(t=>String(t).slice(0,50)):[],resumo:String(p.resumo||"").slice(0,160)};}catch(e){if(e&&e.code==="not_granted")SAMPLE=null;}}
    if(!rec.p||(rec.p.tipo==="academia"&&!(rec.p.exercicios||[]).length)){const lp=parseTreinoLocal(texto);if(!rec.p||lp.exercicios.length)rec.p={...(rec.p||{}),...lp};}
    put("treinos",newId(),rec);$("#tText").value="";$("#tStatus").textContent="";pop("Treino registrado","+"+XP.treino+" XP");}finally{$("#tBtn").disabled=false;}};
// cronômetro
let tm=null,audioCtx=null;
function beep(f,ms){try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=f;o.connect(g);g.connect(audioCtx.destination);g.gain.value=.2;o.start();o.stop(audioCtx.currentTime+ms/1000);}catch(e){}}
$("#tmGo").onclick=()=>{if(tm)clearInterval(tm);const R=Math.max(1,+$("#tmR").value||3),W=Math.max(5,+$("#tmW").value||180),D=Math.max(0,+$("#tmD").value||0);
  let r=1,phase="work",left=W;beep(880,300);navigator.wakeLock&&navigator.wakeLock.request("screen").catch(()=>{});
  const show=()=>{$("#tmBig").textContent=pad(Math.floor(left/60))+":"+pad(left%60);$("#tmBig").className="timerbig mono "+(phase==="work"?"work":"rest");$("#tmInfo").textContent=(phase==="work"?"Round ":"Descanso · round ")+r+" de "+R;};show();
  tm=setInterval(()=>{left--;if(left<=3&&left>0)beep(660,120);if(left<=0){if(phase==="work"&&r<R&&D>0){phase="rest";left=D;beep(440,500);}else if(r<R){r++;phase="work";left=W;beep(880,300);}else{clearInterval(tm);tm=null;beep(990,800);$("#tmInfo").textContent="Fim. Boa!";return;}}show();},1000);};
$("#tmStop").onclick=()=>{if(tm)clearInterval(tm);tm=null;$("#tmInfo").textContent="Parado";};
$$("[data-rest]").forEach(b=>b.onclick=()=>{if(tm)clearInterval(tm);let left=+b.dataset.rest;beep(660,150);const show=()=>{$("#tmBig").textContent=pad(Math.floor(left/60))+":"+pad(left%60);$("#tmBig").className="timerbig mono rest";$("#tmInfo").textContent="Descanso entre séries";};show();
  tm=setInterval(()=>{left--;if(left<=3&&left>0)beep(660,120);if(left<=0){clearInterval(tm);tm=null;beep(990,600);$("#tmInfo").textContent="Próxima série!";$("#tmBig").textContent="00:00";return;}show();},1000);});

// ================= NUTRIÇÃO =================
const HUNGER={fome:"Fome de verdade",ansiedade:"Ansiedade",tedio:"Tédio",social:"Social",horario:"Era a hora"};
function dayTotals(date){return mealsOn(date).reduce((a,m)=>{const t=m.a&&m.a.total||{};a.p+=+t.proteina||0;a.c+=+t.carbo||0;a.g+=+t.gordura||0;a.k+=+t.kcal||0;return a;},{p:0,c:0,g:0,k:0});}
function mealCard(a){if(!a)return"";const t=a.total||{};return `<div class="macros"><div><small>Proteína</small><b class="mono">${Math.round(t.proteina||0)} g</b></div><div><small>Carbo</small><b class="mono">${Math.round(t.carbo||0)} g</b></div><div><small>Gordura</small><b class="mono">${Math.round(t.gordura||0)} g</b></div><div><small>≈ kcal</small><b class="mono">${Math.round(t.kcal||0)}</b></div></div>
  ${a.itens&&a.itens.length?`<div class="tbl"><table><thead><tr><th>Alimento</th><th>Qtd.</th><th>P</th><th>C</th><th>G</th></tr></thead><tbody>${a.itens.map(i=>`<tr><td>${esc(i.alimento)}</td><td>${esc(i.quantidade)}</td><td>${Math.round(i.proteina||0)}</td><td>${Math.round(i.carbo||0)}</td><td>${Math.round(i.gordura||0)}</td></tr>`).join("")}</tbody></table></div>`:""}
  ${a.ponto_forte?`<p class="note">+ ${esc(a.ponto_forte)}</p>`:""}${a.ajuste?`<p class="note">→ ${esc(a.ajuste)}</p>`:""}`;}
// ===== estimativa local de macros (tabela TACO aproximada, por 100 g; u = gramas de 1 unidade) =====
const FOODS=[
 ["arroz integral",124,2.6,25.8,1,120],["arroz",128,2.5,28.1,.2,120],["feijao",76,4.8,13.6,.5,90],["batata doce",77,.6,18.4,.1,150],["batata frita",267,5,35,13,100],["pure",88,1.6,14,3,120],["batata",52,1.2,11.9,0,120],
 ["mandioca",125,.6,30.1,.3,120],["macarrao",102,3.4,19.9,1.2,150],["lasanha",160,9,15,7,250],["cuscuz",113,2.2,25.3,.7,120],["tapioca",240,0,60,0,50],["aveia",394,13.9,66.6,8.5,30],["granola",420,9,65,14,40],
 ["pao de forma",253,12,44,2.7,25],["pao integral",253,12,44,2.7,25],["pao de queijo",363,5.1,34.2,24.6,20],["pao",300,8,58.6,3.1,50],["torrada",390,11,75,5,10],["bolacha",440,9,68,15,8],["biscoito",440,9,68,15,8],
 ["frango frito",250,28,6,13,120],["frango",163,31.5,0,3.2,120],["peito de peru",110,18,3,3,15],["patinho",219,35.9,0,7.3,120],["carne moida",212,26.7,0,10.9,100],["picanha",289,26,0,20,150],["carne",219,32,0,9.5,120],["bife",219,32,0,9.5,120],
 ["file mignon",220,32.8,0,8.8,120],["linguica",296,16,0,25,60],["salsicha",257,13,3,22,50],["hamburguer",250,17,6,18,120],["tilapia",128,26,0,2.7,120],["salmao",208,20,0,13,120],["peixe",128,26,0,2.7,120],["atum",166,26,0,6,120],["sardinha",220,25,0,13,80],
 ["omelete",154,11,1,12,120],["ovo",146,13.3,.6,9.5,50],["clara",50,11,.7,.2,33],["whey",400,80,8,6,30],["barrinha",380,33,33,13,45],["barra de proteina",380,33,33,13,45],
 ["leite",61,3,4.5,3.3,200],["iogurte grego",120,8,8,6,100],["iogurte",51,4.1,1.9,3,170],["requeijao",257,9.6,2.4,23.4,30],["cottage",98,11,3.4,4.3,30],["mussarela",330,22.6,3,25.2,20],["queijo",330,22.6,3,25.2,20],["presunto",94,14.3,2.1,2.7,15],
 ["manteiga",726,.4,0,82.4,10],["margarina",596,0,0,67,10],["azeite",884,0,0,100,13],["pasta de amendoim",590,25,20,50,15],["amendoim",544,27,20,44,30],["castanha",643,14.5,15,63,20],
 ["banana",98,1.3,26,.1,90],["maca",56,.3,15.2,0,130],["mamao",40,.5,10.4,.1,150],["morango",30,.9,6.8,.3,100],["laranja",37,1,8.9,.1,150],["uva",53,.7,13.6,.2,100],["abacate",96,1.2,6,8.4,100],["manga",64,.4,16.7,.3,150],["melancia",33,.9,8.1,0,200],
 ["salada",15,1.3,2.5,.2,80],["alface",11,1.3,1.7,.2,40],["tomate",15,1.1,3.1,.2,80],["brocolis",25,2.1,4.4,.5,80],["cenoura",34,.8,7.7,.2,60],["legumes",35,1.5,7,.3,100],
 ["pizza",270,11,33,10,110],["coxinha",283,9,33,13,110],["pastel",310,8,32,17,100],["esfiha",280,10,38,10,80],["acai",250,2,30,13,300],["sorvete",200,3.5,24,10,100],["chocolate",540,7,59,30,25],["bolo",320,5,50,12,70],
 ["acucar",387,0,99.5,0,5],["mel",309,0,84,0,15],["refrigerante",40,0,10.5,0,350],["suco",45,.4,11,0,250],["cafe com leite",35,1.7,2.6,1.8,200],["cafe",2,.1,0,0,100],["cerveja",41,.3,3.6,0,350]];
const WORDN={um:1,uma:1,dois:2,duas:2,tres:3,quatro:4,cinco:5,seis:6,meio:.5,meia:.5};
const UNITG={colher:15,colheres:15,fatia:null,fatias:null,concha:100,conchas:100,copo:200,copos:200,xicara:160,scoop:30,scoops:30,prato:300,pote:170,lata:null,unidade:null,unidades:null};
function estimateMealLocal(texto){
  const n=normEx(texto);if(!n||n==="(foto)")return null;
  const parts=n.split(/,|;|\+|\s+e\s+|\s+com\s+|\n/).map(x=>x.trim()).filter(Boolean);const itens=[];
  parts.forEach(pt=>{const f=FOODS.find(x=>pt.includes(x[0]));if(!f)return;
    let g=null;const m=pt.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|gr|gramas|ml|l)\b/);
    if(m){g=+m[1].replace(",",".");if(m[2]==="kg"||m[2]==="l")g*=1000;}
    else{const c=pt.match(/(\d+(?:[.,]\d+)?)|\b(um|uma|dois|duas|tres|quatro|cinco|seis|meio|meia)\b/);const cnt=c?(c[1]?+c[1].replace(",","."):WORDN[c[2]]):1;
      const u=Object.keys(UNITG).find(k=>new RegExp("\\b"+k+"\\b").test(pt));g=cnt*((u&&UNITG[u])||f[5]);}
    const k=g/100;itens.push({alimento:f[0],quantidade:Math.round(g)+" g",proteina:Math.round(f[2]*k),carbo:Math.round(f[3]*k),gordura:Math.round(f[4]*k),kcal:Math.round(f[1]*k)});});
  if(!itens.length)return null;const tot=k=>itens.reduce((a,i)=>a+i[k],0);
  return{prato:texto.slice(0,80),itens,total:{proteina:tot("proteina"),carbo:tot("carbo"),gordura:tot("gordura"),kcal:tot("kcal")},qualidade:3,ponto_forte:"",ajuste:"",local:true};}
const zeroMacros=a=>!a||!a.total||!((a.total.proteina||0)+(a.total.carbo||0)+(a.total.gordura||0)+(a.total.kcal||0));
function fixTotals(a){if(a&&zeroMacros(a)&&a.itens&&a.itens.length){const t=k=>a.itens.reduce((s,i)=>s+(+i[k]||0),0);a.total={proteina:t("proteina"),carbo:t("carbo"),gordura:t("gordura"),kcal:t("kcal")};}return a;}
const MEAL_PROMPT=(rec,texto,hasFile)=>`Você é um nutricionista esportivo analisando a refeição de um homem de 21 anos, 1,76 m, cerca de 90 kg, que treina luta e musculação para perder gordura com acompanhamento médico.${hasFile?" Identifique os alimentos da foto anexada e estime as quantidades visíveis.":""} Use a descrição do usuário quando houver, ela tem prioridade sobre a foto. Estime macros com base em tabelas como a TACO. Não faça sermão nem dê meta de calorias. Responda só com JSON: {"prato":"nome curto","itens":[{"alimento":"nome","quantidade":"ex.: 120 g ou 1 concha","proteina":g,"carbo":g,"gordura":g,"kcal":número}],"total":{"proteina":g,"carbo":g,"gordura":g,"kcal":número},"qualidade":inteiro 1 a 5 considerando proteína, comida de verdade e vegetais,"ponto_forte":"frase curta","ajuste":"uma sugestão curta e prática para a próxima, ou string vazia"}${rec.livre?". É a refeição livre planejada da semana: não penalize nem critique.":""}\n\nRefeição (${rec.tipo}): ${texto||"ver foto"}`;
function cleanMeal(a){if(!a||typeof a!=="object")return null;if(Array.isArray(a))a=a[0]||{};const num=v=>Math.max(0,Math.round(+v||0));
  const r={prato:String(a.prato||"").slice(0,80),itens:Array.isArray(a.itens)?a.itens.slice(0,15).map(i=>({alimento:String(i.alimento||"").slice(0,50),quantidade:String(i.quantidade||"").slice(0,30),proteina:num(i.proteina),carbo:num(i.carbo),gordura:num(i.gordura),kcal:num(i.kcal)})):[],
    total:{proteina:num(a.total&&a.total.proteina),carbo:num(a.total&&a.total.carbo),gordura:num(a.total&&a.total.gordura),kcal:num(a.total&&a.total.kcal)},qualidade:Math.max(1,Math.min(5,Math.round(+a.qualidade||3))),ponto_forte:String(a.ponto_forte||"").slice(0,140),ajuste:String(a.ajuste||"").slice(0,160)};
  fixTotals(r);return zeroMacros(r)?null:r;}
async function analyzeMeal(rec,texto,file){let err="";
  if(SAMPLE){try{const a=cleanMeal(await SAMPLE.json(MEAL_PROMPT(rec,texto,!!file),{modelTier:"default",images:file?[file]:undefined}));if(a)return{a};err="resposta sem macros";}
    catch(e){if(e&&e.code==="not_granted")SAMPLE=null;err=e&&(e.code==="rate_limited"?"limite grátis do Gemini por minuto":e.message||e.code)||"erro";}}
  const loc=estimateMealLocal(texto);return{a:loc,err};}
async function reanalyzeMeal(id){const m=S.refeicoes[id];if(!m)return;pop("Sistema","Recalculando os macros...");
  let file=null;if(m.foto&&BLOBURL[m.foto]){try{file=await (await fetch(BLOBURL[m.foto])).blob();}catch(e){}}
  const r=await analyzeMeal(m,m.texto==="(foto)"?"":m.texto,file);
  if(r.a){put("refeicoes",id,{...m,a:r.a},{noUndo:true});pop("Macros calculados",r.a.local?"Estimativa pela tabela (sem o Gemini)":r.a.prato);}
  else pop("Sistema","Não consegui calcular"+(r.err?": "+r.err:"")+". Descreva os alimentos com quantidades e tente de novo.");}
let _fixM=false;function fixMeals(){if(_fixM)return;_fixM=true;Object.entries(S.refeicoes).forEach(([id,m])=>{if(m&&zeroMacros(m.a)){const a=fixTotals(m.a&&m.a.itens&&m.a.itens.length?{...m.a}:null)||estimateMealLocal(m.texto);if(a&&!zeroMacros(a))put("refeicoes",id,{...m,a:{...(m.a||{}),...a,prato:(m.a&&m.a.prato)||a.prato}},{noUndo:true});}});}
function renderNutricao(){if(loaded)setTimeout(fixMeals,0);
  const vd=$("#mView").value||todayISO(),t=dayTotals(vd),ms=mealsOn(vd),anx=ms.filter(m=>m.fome==="ansiedade"||m.fome==="tedio").length;
  $("#mDay").innerHTML=`<div><small>Proteína</small><b class="mono">${Math.round(t.p)} g</b></div><div><small>Carbo</small><b class="mono">${Math.round(t.c)} g</b></div><div><small>Gordura</small><b class="mono">${Math.round(t.g)} g</b></div><div><small>≈ kcal</small><b class="mono">${Math.round(t.k)}</b></div><div><small>Refeições</small><b class="mono">${ms.length}</b></div><div><small>Ansiedade</small><b class="mono" style="color:${anx?"var(--heat)":"inherit"}">${anx}</b></div>`;
  const all=meals(),weeks=[];for(let w=3;w>=0;w--){const end=new Date();end.setDate(end.getDate()-w*7);const st=new Date(end);st.setDate(st.getDate()-6);const a=isoD(st),b=isoD(end);
    const wm=all.filter(m=>m.d>=a&&m.d<=b),days=new Set(wm.map(m=>m.d)).size||1;weeks.push({lab:brS(st),p:wm.reduce((s,m)=>s+(+(m.a&&m.a.total&&m.a.total.proteina)||0),0)/days,x:wm.filter(m=>m.fome==="ansiedade"||m.fome==="tedio").length});}
  const mp=Math.max(1,...weeks.map(w=>w.p)),mx=Math.max(1,...weeks.map(w=>w.x));
  $("#protBars").innerHTML=weeks.map(w=>`<div><span class="mono">${Math.round(w.p)}</span><i style="height:${w.p/mp*58}px;background:var(--ice)"></i><span>${w.lab}</span></div>`).join("");
  $("#anxBars").innerHTML=weeks.map(w=>`<div><span class="mono">${w.x}</span><i style="height:${w.x/mx*58}px"></i><span>${w.lab}</span></div>`).join("");
  const favs=Object.entries(S.favoritos).map(([id,f])=>({...f,_id:id}));
  $("#favList").innerHTML=favs.length?favs.map(f=>`<div class="item"><div><div class="ttl">${esc(f.nome)}</div><div class="meta">${f.a&&f.a.total?Math.round(f.a.total.proteina||0)+" g proteína":""}</div></div><div class="act"><button class="btn sm" data-rep="${f._id}">Repetir hoje</button><button class="linkbtn" data-fd="${f._id}">tirar</button></div></div>`).join(""):`<p class="note">Marque refeições com a estrela no diário para repetir com um toque.</p>`;
  $$("#favList [data-rep]").forEach(b=>b.onclick=()=>{const f=S.favoritos[b.dataset.rep];put("refeicoes",newId(),{d:todayISO(),at:new Date().toTimeString().slice(0,5),tipo:f.tipo||"Refeição",fome:"fome",texto:f.texto||f.nome,a:f.a||null});pop("Refeição registrada",f.nome);});
  $$("#favList [data-fd]").forEach(b=>b.onclick=()=>del("favoritos",b.dataset.fd));
  $("#mCount").textContent=all.length+" registros";
  $("#mList").innerHTML=all.length?all.slice(0,50).map(m=>`<div class="item"><div><div class="meta">${brD(parseISO(m.d))} ${esc(m.at||"")} · ${esc(m.tipo||"")} · ${esc(HUNGER[m.fome]||"")}${m.livre?" · LIVRE":""}</div><div class="ttl">${esc(m.a&&m.a.prato||m.texto)}</div>
    ${m.a&&!zeroMacros(m.a)?`<div class="note mono">${m.a.local?"estimativa pela tabela · ":""}P ${Math.round(m.a.total.proteina||0)} · C ${Math.round(m.a.total.carbo||0)} · G ${Math.round(m.a.total.gordura||0)} · ≈${Math.round(m.a.total.kcal||0)} kcal${m.a.qualidade?` · <span class="stars">${"★".repeat(m.a.qualidade)}${"☆".repeat(5-m.a.qualidade)}</span>`:""}</div>`:`<div class="note">${esc(m.texto)}</div>`}
    ${m.foto?`<img src="${blob(m.foto)}" alt="Foto da refeição">`:""}</div><div class="act"><button class="linkbtn" data-fav="${m._id}" aria-label="Favoritar">☆ favorito</button>${zeroMacros(m.a)?`<button class="linkbtn" data-re="${m._id}">calcular macros</button>`:""}<button class="linkbtn" data-del="${m._id}">apagar</button></div></div>`).join(""):`<div class="empty">Nenhuma refeição registrada. Fotografe o próximo prato.</div>`;
  $$("#mList [data-del]").forEach(b=>b.onclick=()=>askDel("refeicoes",b.dataset.del));
  $$("#mList [data-re]").forEach(b=>b.onclick=()=>reanalyzeMeal(b.dataset.re));
  $$("#mList [data-fav]").forEach(b=>b.onclick=()=>{const m=S.refeicoes[b.dataset.fav];put("favoritos",newId(),{nome:(m.a&&m.a.prato||m.texto||"Refeição").slice(0,60),texto:m.texto,tipo:m.tipo,a:m.a||null});pop("Sistema","Adicionado aos favoritos");});
}
$("#mView").onchange=renderNutricao;
$("#mBtn").onclick=async()=>{const texto=$("#mText").value.trim(),file=$("#mPhoto").files[0];$("#mErr").textContent="";$("#mResult").innerHTML="";
  if(!texto&&!file){$("#mErr").textContent="Tire uma foto do prato ou descreva o que comeu.";return;}
  const rec={d:$("#mDate").value||todayISO(),at:new Date().toTimeString().slice(0,5),tipo:$("#mKind").value,fome:$("#mHunger").value,livre:$("#mFree").checked,texto:texto||"(foto)",fa:+(($("#mFA")||{}).value)||null,sd:+(($("#mSD")||{}).value)||null};
  $("#mBtn").disabled=true;$("#mStatus").textContent=SAMPLE?"Escaneando o prato...":"Registrando...";
  try{if(file&&ASSETS){try{const r=await ASSETS.upload(file);rec.foto=r.id;}catch(e){}}
    {const r=await analyzeMeal(rec,texto,file);if(r.a)rec.a=r.a;if(r.err)$("#mStatus").textContent="Gemini falhou ("+r.err+")"+(r.a?", usei a tabela.":".");}
    put("refeicoes",newId(),rec);$("#mResult").innerHTML=rec.a?`<div class="sub">${esc(rec.a.prato)}</div>`+mealCard(rec.a):"";
    $("#mText").value="";$("#mPhoto").value="";$("#mFree").checked=false;if(!$("#mStatus").textContent.startsWith("Gemini"))$("#mStatus").textContent=rec.a?"":"Registrado.";pop("Refeição registrada","+"+XP.meal+" XP");}
  finally{$("#mBtn").disabled=false;}};
$("#shopBtn").onclick=async()=>{const out=$("#shopOut");if(!SAMPLE){out.innerHTML=`<p class="note">Configure a chave grátis do Sistema em Perfil › Ajustes.</p>`;return;}
  const favs=Object.values(S.favoritos).map(f=>f.nome+(f.texto?" ("+f.texto+")":"")).slice(0,15),recent=meals().slice(0,25).map(m=>m.a&&m.a.prato||m.texto);
  out.innerHTML=`<p class="note">Montando a lista...</p>`;
  try{const r=await SAMPLE(`Monte uma lista de compras para 1 semana para uma pessoa que treina e quer proteína em toda refeição, baseada nos pratos favoritos e recentes abaixo. Agrupe por seção do mercado (Proteínas, Hortifruti, Grãos e carboidratos, Laticínios, Outros), com quantidades aproximadas. Formato: linhas "## Seção" e itens "- item: quantidade". Sem introdução.\n\nFavoritos: ${favs.join("; ")||"nenhum"}\nRecentes: ${recent.join("; ")||"nenhum"}`,{modelTier:"quick"});
    out.innerHTML=`<div class="report">${md(r.text)}</div>`;}catch(e){out.innerHTML=`<p class="note">Não consegui montar agora.</p>`;}};

// ================= COACH =================
function md(t){const lines=esc(t).split("\n");let h="",inList=false;
  lines.forEach(l=>{const s=l.trim();if(/^#{1,3}\s/.test(s)){if(inList){h+="</ul>";inList=false;}h+=`<h3>${s.replace(/^#{1,3}\s/,"")}</h3>`;}
    else if(/^[-*•]\s/.test(s)){if(!inList){h+="<ul>";inList=true;}h+=`<li>${s.replace(/^[-*•]\s/,"").replace(/\*\*(.+?)\*\*/g,"<b>$1</b>")}</li>`;}
    else if(s){if(inList){h+="</ul>";inList=false;}h+=`<p>${s.replace(/\*\*(.+?)\*\*/g,"<b>$1</b>")}</p>`;}});
  if(inList)h+="</ul>";return h;}
function dataSummary(days){
  const t=Math.min(TOTAL,TODAY()),lines=[];
  lines.push(`SEMANA 1: seg 09/11 aula experimental de kickboxing, ter 10/11 Superior A, qua 11/11 Inferior + core, qui 12/11 kickboxing, sex 13/11 Superior B. Ele decidiu: a luta é KICKBOXING (treina com um amigo), não vai fazer jiu-jitsu. Rotina fixa: seg e qua kickboxing, ter Superior A, qui Inferior + core, sex Superior B, fim de semana em casa. Cerca de 1 sábado por mês tem boss surpresa: aula de kickboxing das 10h30 às 12h, revelado só quando ele conclui a quest de sexta; nunca revele antes.`);
  lines.push(`PERFIL: Vitor, 21 anos, 1,76 m. Começou em 09/11/2026 com 90 kg (tinha 110 no início do ano, chegou a 86, ficou 2 meses parado após cirurgia de fimose). Meta: 75 kg até 07/05/2027 (180 dias). Usa Mounjaro com acompanhamento médico e relata comer por ansiedade. Rotina: seg e qua luta, ter/qui/sex academia, fim de semana treinos em casa. Trabalha 9h-16h e faz faculdade.`);
  lines.push(`HOJE: dia ${t} de 180 (${brD(new Date())}). Peso atual registrado ${fmt(curW())} kg. Rota planejada hoje ${fmt(plannedW(t))} kg. Sequência ${streak()} dias. Bosses vencidos ${bossesBeaten().t}.`);
  lines.push("O Vitor não gosta de se medir com fita: acompanhe só peso, fotos e treino, e nunca peça medidas.");lines.push("CHECK-INS: "+(checkins().map(c=>`${brS(parseISO(c.d))} ${fmt(c.w)}kg${c.waist?" cintura "+c.waist:""}`).join("; ")||"nenhum"));
  lines.push("DIAS (missão feita/total, água L, sono h, humor/disposição/motivação/fadiga 1-5, refeições, P g, ansiedade):");
  for(let n=Math.max(1,t-days+1);n<=t;n++){const date=isoD(dateOf(n)),m=missionFor(n),d=dayDoc(n),di=diaryOf(date),tot=dayTotals(date),ms=mealsOn(date);
    lines.push(`${brS(dateOf(n))} ${DOW[dateOf(n).getDay()].slice(0,3)}: ${d.rest?"descanso":(m.tasks.filter((_,i)=>d.t&&d.t[i]).length+"/"+m.tasks.length+" "+m.titulo)}${isSBoss(n)?(d.b?" boss surpresa vencido":" boss surpresa não feito"):""}, água ${di.agua?fmt(di.agua/1000,1):"?"}, sono ${di.sono??"?"}, humor ${di.humor??"?"}/${di.disposicao??"?"}/${di.motivacao??"?"}/${di.fadiga??"?"}, ref ${ms.length}, P ${Math.round(tot.p)}, ans ${ms.filter(x=>x.fome==="ansiedade"||x.fome==="tedio").length}${di.dor?", dor: "+di.dor:""}${di.nota?", check-in: "+di.nota.slice(0,100):""}${emergencyOn(n)?", MODO RECUPERAÇÃO ("+emergencyOn(n).motivo+")":""}${di.vitorias?", vitória: "+di.vitorias.slice(0,80):""}${di.dificuldades?", dificuldade: "+di.dificuldades.slice(0,80):""}`);}
  const ws=workouts().filter(w=>w.d>=isoD(dateOf(Math.max(1,t-days+1))));
  lines.push("TREINOS: "+(ws.map(w=>`${brS(parseISO(w.d))} ${w.p?(w.p.modalidade||w.p.tipo)+" "+(w.p.exercicios||[]).map(e=>e.nome+" "+(e.series||"?")+"x"+(e.reps||"?")+(e.carga_kg?" "+e.carga_kg+"kg":"")).join(", ")+((w.p.tecnicas||[]).length?" técnicas: "+w.p.tecnicas.join(", "):""):w.texto.slice(0,100)}`).join(" | ")||"nenhum"));
  const v=weekVolume();lines.push("VOLUME 7 DIAS (séries): "+Object.keys(v).map(g=>g+" "+v[g]+" (alvo "+VOLT[g].join("-")+")").join(", "));
  const ex=exHistory();lines.push("PROGRESSÃO DE CARGA: "+(Object.values(ex).filter(e=>e.pts.some(p=>p.c)).map(e=>e.nome+": "+e.pts.filter(p=>p.c).map(p=>brS(parseISO(p.d))+" "+p.c+"kg x"+(p.r||"?")).join(" → ")).join("; ")||"sem dados"));
  return lines.join("\n");}
const COACH_RULES=`Você é o SISTEMA, coach do jogo "Ascensão" do Vitor, com tom de treinador direto e parceiro, inspirado no sistema de Solo Leveling sem exagero. Regras: responda em português do Brasil, frases curtas, sem travessões. Use APENAS os dados fornecidos e diga claramente quando faltam dados; nunca invente números. Não recomende cortes agressivos de calorias, jejuns, nem mudanças bruscas de treino; dieta, calorias e remédio são decididos com o médico e a nutricionista. Sinalize com calma se a perda passar de ~1 kg por semana por 2 semanas seguidas, se a força cair, se houver dor recorrente, sono ruim frequente ou muitas refeições por ansiedade, e sugira conversar com o profissional certo quando fizer sentido. Seja específico com os números dele.`;
let chat=[],chatCtl=null,voice=LSK.get("fdd-voice")===true,chatLoaded=false,toolsOK=null;
function saveChat(){put("perfil","chat",{msgs:chat.filter(m=>!m.pending).slice(-40).map(m=>({role:m.role,content:String(m.content).slice(0,4000),acts:m.acts||[]}))});}
function speak(t){if(!voice)return;Voice.say(t,true);}
function renderChat(){const el=$("#chat");
  el.innerHTML=chat.length?chat.map(m=>`<div class="msg ${m.role==="user"?"u":"a"}">${esc(m.content)}${m.acts&&m.acts.length?`<div class="chips" style="margin-top:8px">${m.acts.map(a=>`<span class="chip c-ok">${esc(a)}</span>`).join("")}</div>`:""}</div>`).join("")
   :`<div class="msg a">Bom te ver por aqui. Pode falar comigo do seu jeito: "bom dia, o que faço hoje?", "fiz peito e tríceps, supino 3x10 com 24 kg", "almocei arroz, feijão e frango", "bebi 1 litro", "dormi 6 horas". Eu respondo e já registro e marco tudo no app.</div>`;
  el.scrollTop=el.scrollHeight;}
function curDay(){return Math.min(TOTAL,Math.max(1,TODAY()));}
function todayContext(){const n=curDay(),m=missionFor(n),d=dayDoc(n),date=todayISO(),di=diaryOf(date),tot=dayTotals(date),hs=habitsState(n),now=new Date();
  const L=[`AGORA: ${DOW[now.getDay()]} ${brD(now)} ${pad(now.getHours())}:${pad(now.getMinutes())}. Dia ${n} de 180, fase ${phaseOf(n)+1} (${PHASES[phaseOf(n)]}).`,
   `QUEST DE HOJE: "${m.titulo}"${d.rest?" (passe de descanso usado, dia já cumprido)":""}. Tarefas (índice: tarefa [feita?] dica de carga):`];
  m.tasks.forEach((t,i)=>L.push(`${i}: ${t} [${d.t&&d.t[i]?"FEITA":"pendente"}]${m.ex[i]?" dica: "+suggest(m.ex[i]):""}`));
  if(m.nota)L.push("Nota da quest: "+m.nota);
  if(isSBoss(n))L.push(`BOSS SURPRESA HOJE: ${sboss(n).t} (${sboss(n).d}) [${d.b?"vencido":"pendente"}] vale ${XP.sboss} XP.`);
  if(m.boss)L.push("Hoje é dia de CHEFÃO da fase.");
  if(penaltyFor(n)&&!d.rest)L.push(`PENALIDADE PENDENTE: ${15+phaseOf(n)*5} burpees + prancha ${fmt(1+phaseOf(n)*.5,1)} min [${d.p?"cumprida":"pendente"}], evita −100 XP.`);
  if(m.livre)L.push("Hoje (sábado) tem refeição livre planejada: uma refeição, sem culpa.");
  L.push(`HÁBITOS: proteína em todas as refeições [${hs[0]?"ok":"pendente"}], 2+ refeições registradas [${mealsOn(date).length}], água ${fmt((+di.agua||0)/1000,1)} L de 2 L, sono ${di.sono??"não registrado"} h (meta 7).`);
  L.push(`COMIDA HOJE: ${mealsOn(date).length} refeições, P ${Math.round(tot.p)} g, C ${Math.round(tot.c)} g, G ${Math.round(tot.g)} g.`);
  const pass=unusedPass();if(pass&&!d.rest)L.push("Ele tem um passe de descanso guardado.");
  return L.join("\n");}
const CHAT_RULES=COACH_RULES+`
Você está conversando como o SISTEMA do app. Fale de forma natural, como um treinador que conhece ele, em 1 a 5 frases curtas. Se ele cumprimentar ou perguntar o que fazer, diga a quest de hoje de forma prática (o que treinar, com as cargas sugeridas), mais boss/penalidade se houver, e um lembrete de hábito pendente.
Quando ele contar algo que fez, comeu, bebeu, dormiu, pesou ou sentiu, use as ferramentas para registrar ANTES de responder: registre o treino com os exercícios e cargas, marque as tarefas da quest de hoje que ele cumpriu (inclusive "Registrar as cargas"), registre refeições estimando macros, água, sono, peso e humor. Registre só o que ele disse; se faltar a carga, registre sem ela. Depois confirme em uma frase o que ficou registrado e o que falta na quest. Nunca diga que registrou algo sem ter chamado a ferramenta.`;
function pushAct(a){const m=chat[chat.length-1];if(m&&m.role==="assistant"){(m.acts=m.acts||[]).push(a);renderChat();}}
const TOOLS=[
 {name:"lembrar",description:"Guarda na memória de longo prazo um fato útil que o Vitor contou: preferência de exercício ou comida, lesão ou desconforto, horário habitual, meta, decisão tomada. Use frases curtas.",
  inputSchema:{type:"object",properties:{fato:{type:"string"},tipo:{type:"string",enum:["preferencia","lesao","rotina","meta","decisao","alimento"]}},required:["fato"]},
  execute:i=>{const f=String(i.fato||"").slice(0,200);if(!f)throw new Error("vazio");put("memoria",newId(),{fato:f,tipo:i.tipo||"preferencia",d:todayISO()});pushAct("Memória: "+f.slice(0,40));return "guardado";}},
 {name:"consultar_periodo",description:"Retorna o resumo dos dados (treinos, refeições, sono, água, humor, peso) de um período em dias atrás, para responder perguntas sobre o passado.",
  inputSchema:{type:"object",properties:{dias:{type:"integer"}},required:["dias"]},execute:i=>dataSummary(Math.max(1,Math.min(180,+i.dias||30)))},
 {name:"marcar_tarefas",description:"Marca (ou desmarca) tarefas da QUEST DE HOJE pelos índices listados no contexto. Retorna quantas estão feitas.",
  inputSchema:{type:"object",properties:{indices:{type:"array",items:{type:"integer"}},feito:{type:"boolean"}},required:["indices"]},
  execute:i=>{const n=curDay(),m=missionFor(n),idx=(Array.isArray(i.indices)?i.indices:[]).map(Number).filter(x=>x>=0&&x<m.tasks.length);if(!idx.length)throw new Error("índices inválidos");
    const feito=i.feito!==false,was=dayDone(n);patchDay(n,doc=>{idx.forEach(x=>doc.t[x]=feito);});
    pushAct((feito?"Marcado: ":"Desmarcado: ")+idx.map(x=>m.tasks[x].split(" ").slice(0,3).join(" ")).join(", "));
    if(!was&&dayDone(n))pop("Quest completa","+"+XP.full+" XP bônus");
    const d=dayDoc(n);return {feitas:m.tasks.filter((_,k)=>d.t&&d.t[k]).length,total:m.tasks.length};}},
 {name:"registrar_treino",description:"Registra um treino feito (academia, luta, cardio ou em casa) com exercícios estruturados. Use carga_kg da maior carga citada.",
  inputSchema:{type:"object",properties:{tipo:{type:"string",enum:["academia","luta","cardio","outro"]},modalidade:{type:"string"},minutos:{type:"number"},intensidade:{type:"integer"},exercicios:{type:"array",items:{type:"object",properties:{nome:{type:"string"},series:{type:"number"},reps:{type:"number"},carga_kg:{type:"number"}}}},tecnicas:{type:"array",items:{type:"string"}},resumo:{type:"string"},data:{type:"string",description:"AAAA-MM-DD, padrão hoje"}},required:["tipo"]},
  execute:i=>{const p={tipo:["academia","luta","cardio","outro"].includes(i.tipo)?i.tipo:"outro",modalidade:String(i.modalidade||"").slice(0,40),minutos:+i.minutos||null,intensidade:Math.max(1,Math.min(5,Math.round(+i.intensidade||3))),
    exercicios:Array.isArray(i.exercicios)?i.exercicios.slice(0,20).map(e=>({nome:String(e.nome||"").toLowerCase().slice(0,60),series:+e.series||null,reps:+e.reps||null,carga_kg:+e.carga_kg||null})):[],tecnicas:Array.isArray(i.tecnicas)?i.tecnicas.slice(0,15).map(t=>String(t).slice(0,50)):[],resumo:String(i.resumo||"").slice(0,160)};
    const d=/^\d{4}-\d{2}-\d{2}$/.test(i.data||"")?i.data:todayISO();put("treinos",newId(),{d,texto:(p.resumo||p.modalidade||p.tipo),p});pushAct("Treino registrado +"+XP.treino+" XP");return "ok, "+p.exercicios.length+" exercícios";}},
 {name:"registrar_refeicao",description:"Registra uma refeição. SEMPRE preencha proteina, carbo, gordura e kcal estimados por você (tabela TACO), nunca deixe zerado. fome: fome, ansiedade, tedio, social ou horario.",
  inputSchema:{type:"object",properties:{prato:{type:"string"},texto:{type:"string"},tipo:{type:"string"},fome:{type:"string"},livre:{type:"boolean"},proteina:{type:"number"},carbo:{type:"number"},gordura:{type:"number"},kcal:{type:"number"},qualidade:{type:"integer"}},required:["prato"]},
  execute:i=>{const r=v=>Math.max(0,Math.round(+v||0));const rec={d:todayISO(),at:new Date().toTimeString().slice(0,5),tipo:String(i.tipo||"Refeição").slice(0,20),fome:["fome","ansiedade","tedio","social","horario"].includes(i.fome)?i.fome:"fome",livre:!!i.livre,texto:String(i.texto||i.prato).slice(0,200),
    a:{prato:String(i.prato).slice(0,80),itens:[],total:{proteina:r(i.proteina),carbo:r(i.carbo),gordura:r(i.gordura),kcal:r(i.kcal)},qualidade:Math.max(1,Math.min(5,Math.round(+i.qualidade||3))),ponto_forte:"",ajuste:""}};
    if(zeroMacros(rec.a)){const loc=estimateMealLocal(rec.texto+", "+i.prato);if(loc)rec.a={...loc,prato:rec.a.prato};}
    put("refeicoes",newId(),rec);pushAct("Refeição: "+rec.a.prato);return "ok";}},
 {name:"registrar_agua",description:"Soma água bebida hoje, em ml.",inputSchema:{type:"object",properties:{ml:{type:"number"}},required:["ml"]},
  execute:i=>{const ml=Math.max(-3000,Math.min(5000,+i.ml||0));const di=diaryOf(todayISO());const v=Math.max(0,(+di.agua||0)+ml);saveDiary({agua:v});pushAct("Água: "+fmt(v/1000,1)+" L");return "total "+v+" ml";}},
 {name:"registrar_sono",description:"Registra as horas dormidas na última noite.",inputSchema:{type:"object",properties:{horas:{type:"number"}},required:["horas"]},
  execute:i=>{const h=+i.horas;if(!(h>=0&&h<=16))throw new Error("horas inválidas");saveDiary({sono:h});pushAct("Sono: "+fmt(h,1).replace(",0","")+" h");return "ok";}},
 {name:"registrar_peso",description:"Registra o peso (kg) de hoje. O Vitor não quer registrar medidas com fita.",inputSchema:{type:"object",properties:{kg:{type:"number"}},required:["kg"]},
  execute:i=>{const w=+i.kg;if(!(w>=40&&w<=200))throw new Error("peso inválido");const d=todayISO();put("checkins",d,{...(S.checkins[d]||{}),d,w});pushAct("Peso: "+fmt(w)+" kg");return "ok";}},
 {name:"registrar_estado",description:"Registra humor, disposição, motivação e fadiga de 1 a 5, e dor (texto) de hoje. Envie só o que ele disse.",inputSchema:{type:"object",properties:{humor:{type:"integer"},disposicao:{type:"integer"},motivacao:{type:"integer"},fadiga:{type:"integer"},dor:{type:"string"}}},
  execute:i=>{const p={};["humor","disposicao","motivacao","fadiga"].forEach(k=>{const v=Math.round(+i[k]);if(v>=1&&v<=5)p[k]=v;});if(i.dor)p.dor=String(i.dor).slice(0,120);saveDiary(p);pushAct("Estado do dia salvo");return "ok";}},
 {name:"salvar_diario",description:"Salva no diário de hoje vitórias, dificuldades e o que faria melhor.",inputSchema:{type:"object",properties:{vitorias:{type:"string"},dificuldades:{type:"string"},melhorar:{type:"string"}}},
  execute:i=>{const p={};["vitorias","dificuldades","melhorar"].forEach(k=>{if(i[k])p[k]=String(i[k]).slice(0,300);});saveDiary(p);pushAct("Diário salvo");return "ok";}},
 {name:"marcar_extra",description:"Marca o boss surpresa de hoje, a penalidade de hoje ou o hábito de proteína em todas as refeições.",inputSchema:{type:"object",properties:{qual:{type:"string",enum:["boss","penalidade","proteina"]},feito:{type:"boolean"}},required:["qual"]},
  execute:i=>{const n=curDay(),f=i.feito!==false;patchDay(n,doc=>{if(i.qual==="boss")doc.b=f;else if(i.qual==="penalidade")doc.p=f;else doc.h[0]=f;});
    pushAct({boss:"Boss",penalidade:"Penalidade",proteina:"Hábito proteína"}[i.qual]+(f?" cumprido":" desmarcado"));if(i.qual==="boss"&&f)pop("Boss derrotado","+"+XP.sboss+" XP","boss");return "ok";}}
];
async function ask(text){if(!text)return;$("#cqErr").textContent="";
  if(!SAMPLE){$("#cqErr").textContent="Configure a chave grátis do Sistema em Perfil › Ajustes.";return;}
  if(toolsOK===null){try{const lim=await SAMPLE.limits();toolsOK=!!(lim&&lim.tools);}catch(e){toolsOK=false;}}
  chat.push({role:"user",content:text});chat.push({role:"assistant",content:"...",acts:[],pending:true});renderChat();
  const hist=chat.slice(0,-1).filter(m=>!m.pending).slice(-12).map(m=>({role:m.role,content:m.role==="assistant"&&m.acts&&m.acts.length?m.content+"\n[ações feitas: "+m.acts.join("; ")+"]":m.content}));
  while(hist.length&&hist[0].role!=="user")hist.shift();
  const turns=[{role:"user",content:CHAT_RULES+"\n\n"+coachMode()+"\n\n"+memoryText()+"\n\n"+todayContext()+"\n\nHISTÓRICO DOS ÚLTIMOS 14 DIAS:\n"+dataSummary(14)+"\n\n(Fim do contexto. A conversa começa abaixo.)"}].concat(hist);
  chatCtl=new AbortController();$("#cqStop").hidden=false;$("#cqBtn").disabled=true;
  const cur=chat[chat.length-1];
  try{const opts={signal:chatCtl.signal,modelTier:"quick",onText:({text})=>{cur.content=text;renderChat();}};if(toolsOK)opts.tools=TOOLS;else opts.cache=false;
    const r=await SAMPLE(turns,opts);cur.content=r.text.trim();speak(cur.content);}
  catch(e){cur.content=e&&e.text?e.text:(e&&e.code==="cancelled"?"(parado)":e&&e.code==="rate_limited"?"Muitas mensagens seguidas. Espere um pouco e tente de novo.":"Não consegui responder agora: "+(e&&(e.message||e.code)||"erro desconhecido")+". Tente de novo em instantes.");if(e&&e.code==="not_granted")cur.content="A chave foi recusada pelo Google. Confira em Perfil › Ajustes.";}
  finally{delete cur.pending;renderChat();saveChat();$("#cqStop").hidden=true;$("#cqBtn").disabled=false;}}
const QCH=["Bom dia! O que faço hoje?","Como foi minha semana?","Estou perdendo peso rápido demais?","Minha força está aumentando?","Qual grupo estou negligenciando?","Como está minha alimentação?","Estou recuperando bem?"];
$("#qChips").innerHTML=QCH.map(q=>`<button class="btn sm" data-q="${esc(q)}">${esc(q)}</button>`).join("");
$$("#qChips [data-q]").forEach(b=>b.onclick=()=>ask(b.dataset.q));
$("#cqBtn").onclick=()=>{const t=$("#cq").value.trim();$("#cq").value="";ask(t);};
$("#cq").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("#cqBtn").click();}});
$("#cqStop").onclick=()=>chatCtl&&chatCtl.abort();
$("#voiceBtn").onclick=()=>{voice=!voice;LSK.set("fdd-voice",voice);voicePref=voice;Voice.unlock();$("#voiceBtn").setAttribute("aria-pressed",String(voice));if(!voice)Voice.stop();else Voice.say("Voz ativada.",true);};
$("#voiceBtn").setAttribute("aria-pressed",String(voice));
$("#clearChat").onclick=()=>{if(!$("#clearChat").dataset.c){$("#clearChat").dataset.c=1;$("#clearChat").textContent="Confirmar";return;}delete $("#clearChat").dataset.c;$("#clearChat").textContent="Limpar";chat=[];renderChat();saveChat();};
function lastWeekRange(){const now=new Date(),wd=(now.getDay()+6)%7,mon=new Date(now);mon.setDate(now.getDate()-wd-7);const sun=new Date(mon);sun.setDate(mon.getDate()+6);return{id:isoD(mon),mon,sun};}
let repTried=false;
function latestReport(){const rs=Object.entries(S.relatorios).filter(([k,r])=>r&&r.texto&&r.tipo!=="compras").sort((a,b)=>a[0]<b[0]?1:-1);return rs[0];}
function renderCoach(){if(!chatLoaded&&loaded){chat=((S.perfil.chat&&S.perfil.chat.msgs)||[]).map(m=>({...m,acts:[...(m.acts||[])]}));chatLoaded=true;}renderChat();
  const lw=lastWeekRange(),lr=latestReport();$("#repWeek").textContent=lr?"Semana de "+brS(parseISO(lr[0])):(lw.sun<START?"Primeira semana: 09 a 15/11":"Semana de "+brS(lw.mon)+" a "+brS(lw.sun));
  $("#repBox").innerHTML=lr?md(lr[1].texto):`<p class="note">O primeiro relatório sai na segunda, 16/11, com a semana de 09 a 15/11. Você também pode gerar um parcial agora.</p>`;
  if(loaded&&!repTried&&new Date().getDay()===1&&SAMPLE&&!S.relatorios[lw.id]&&lw.sun>=START){repTried=true;genReport();}}
async function genReport(){if(!SAMPLE){$("#repBox").innerHTML=`<p class="note">Configure a chave grátis do Sistema em Perfil › Ajustes.</p>`;return;}
  const lw=lastWeekRange(),partial=lw.sun<START,id=partial?isoD(new Date()):lw.id;
  $("#repBox").innerHTML=`<p class="note">Gerando relatório...</p>`;
  try{const r=await SAMPLE(COACH_RULES+"\n\nDADOS:\n"+dataSummary(14)+`\n\nEscreva o relatório ${partial?"parcial desta semana até hoje":"da semana de "+brS(lw.mon)+" a "+brS(lw.sun)} com as seções "## Resumo" (2 frases com números), "## Acertos" (lista), "## Pontos de atenção" (lista), "## Prioridades desta semana" (3 itens práticos). Máximo 230 palavras.`,{modelTier:"default",cache:false,onText:({text})=>{$("#repBox").innerHTML=md(text);}});
    put("relatorios",id,{texto:r.text,criado:new Date().toISOString(),parcial:partial});}
  catch(e){$("#repBox").innerHTML=`<p class="note">Não consegui gerar agora.</p>`;if(e&&e.code==="not_granted")SAMPLE=null;}}
$("#repBtn").onclick=genReport;
$("#repSpeak").onclick=()=>{const lr=latestReport();if(!lr)return;const v=voice;voice=true;speak(lr[1].texto);voice=v;};
$("#patBtn").onclick=async()=>{if(!SAMPLE){$("#patBox").innerHTML=`<p class="note">Configure a chave grátis do Sistema em Perfil › Ajustes.</p>`;return;}
  $("#patBox").innerHTML=`<p class="note">Procurando padrões...</p>`;
  try{const r=await SAMPLE(COACH_RULES+"\n\nDADOS:\n"+dataSummary(30)+`\n\nProcure relações entre sono, água, humor, disposição, refeições por ansiedade, cumprimento das quests, treinos e peso. Liste até 4 padrões em "- " com o número que sustenta cada um. Se ainda houver poucos dados, diga quantos dias faltam para uma análise confiável e o que registrar. Máximo 150 palavras.`,{modelTier:"default",cache:false,onText:({text})=>{$("#patBox").innerHTML=md(text);}});}
  catch(e){$("#patBox").innerHTML=`<p class="note">Não consegui analisar agora.</p>`;}};

// ================= JORNADA =================
function renderJornada(){const t=TODAY();
  $("#levels").innerHTML=PHASES.map((name,L)=>{let cells="",dl=0;for(let n=L*30+1;n<=L*30+30;n++){const d=dayDoc(n),done=dayDone(n),fut=n>t;if(done)dl++;
      const cls="cell"+(d.rest?" rest":done?" done":dayPart(n)?" part":n<t?" miss":"")+(n===t?" today":"")+(isMBoss(n)?" mboss":"")+(isSBoss(n)&&(!fut||kickRevealed(n))?" sboss":"");
      cells+=`<button class="${cls}" data-n="${n}" title="Dia ${n} · ${brD(dateOf(n))}">${isMBoss(n)?"B":isSBoss(n)&&(!fut||kickRevealed(n))?"!":n}</button>`;}
    return `<div class="lvl"><div class="lvl-h"><b>Fase ${L+1} · ${name}</b><span class="eyebrow">${brS(dateOf(L*30+1))} a ${brS(dateOf(L*30+30))} · ${dl}/30</span></div><div class="cells">${cells}</div></div>`;}).join("");
  $$("#levels .cell").forEach(c=>c.onclick=()=>{viewDay=+c.dataset.n;location.hash="sistema";});
  const ps=Object.entries(S.projetos).map(([id,p])=>({...p,_id:id}));
  $("#pList").innerHTML=ps.length?ps.map(p=>{const cur=projCur(p),prog=p.ind==="manual"?(+p.manual||0)/100:Math.max(0,Math.min(1,(cur-p.de)/((p.ate-p.de)||1)));
    const daysLeft=Math.ceil((parseISO(p.fim)-new Date())/864e5);
    return `<div class="proj"><div class="head"><b>${esc(p.nome)}</b><span class="eyebrow">${daysLeft>=0?daysLeft+" dias restantes":"prazo encerrado"}</span></div><div class="progress"><i style="width:${prog*100}%"></i></div>
      <div class="meta mono note">${p.ind==="manual"?Math.round(prog*100)+"%":fmt(cur,1).replace(",0","")+" de "+fmt(p.de,1).replace(",0","")+" → "+fmt(p.ate,1).replace(",0","")} · início ${brS(parseISO(p.inicio))} · prazo ${brD(parseISO(p.fim))}</div>
      <div class="seg">${p.ind==="manual"?`<button class="btn sm" data-pm="${p._id}">+10%</button>`:""}<button class="linkbtn" data-pd="${p._id}">apagar</button></div></div>`;}).join(""):`<div class="empty">Nenhuma jornada.</div>`;
  $$("#pList [data-pd]").forEach(b=>b.onclick=()=>askDel("projetos",b.dataset.pd));
  $$("#pList [data-pm]").forEach(b=>b.onclick=()=>{const p=S.projetos[b.dataset.pm];put("projetos",b.dataset.pm,{...p,manual:Math.min(100,(+p.manual||0)+10)});});
}
function projCur(p){if(p.ind==="peso")return curW();if(p.ind==="cintura"){const c=checkins().filter(x=>x.waist);return c.length?+c[c.length-1].waist:p.de;}
  if(p.ind==="carga"){const ex=exHistory();const k=Object.keys(ex).find(k=>k.includes(normEx(p.ex)));return k?Math.max(...ex[k].pts.map(x=>x.c)):p.de;}
  if(p.ind==="luta")return workouts().filter(w=>w.p&&w.p.tipo==="luta"&&w.d>=p.inicio).length;return 0;}
$("#pAdd").onclick=()=>{const nome=$("#pName").value.trim(),ind=$("#pInd").value,de=parseFloat($("#pFrom").value),ate=parseFloat($("#pTo").value),fim=$("#pEnd").value;$("#pErr").textContent="";
  if(!nome){$("#pErr").textContent="Dê um nome à jornada.";return;}if(!fim){$("#pErr").textContent="Escolha o prazo.";return;}
  if(ind!=="manual"&&(isNaN(de)||isNaN(ate))){$("#pErr").textContent="Preencha valor inicial e alvo.";return;}
  if(ind==="carga"&&!$("#pEx").value.trim()){$("#pErr").textContent="Diga qual exercício.";return;}
  put("projetos",newId(),{nome:nome.slice(0,60),ind,de:isNaN(de)?0:de,ate:isNaN(ate)?100:ate,ex:$("#pEx").value.trim(),inicio:todayISO(),fim,manual:0});$("#pName").value="";$("#pFrom").value="";$("#pTo").value="";};

// ================= PERFIL =================
const ACH=[
 ["primeira","Primeiro passo","Completar a primeira quest",()=>{for(let n=1;n<=TOTAL;n++)if(dayDone(n))return true;return false;}],
 ["seq7","Semana de ferro","7 dias seguidos",()=>bestStreak()>=7],["seq30","Imparável","30 dias seguidos",()=>bestStreak()>=30],
 ["sboss","Caçador","Vencer um boss surpresa",()=>bossesBeaten().s>=1],["mboss","Chefão abatido","Vencer o primeiro chefão",()=>bossesBeaten().m>=1],["boss10","Lenda","10 bosses vencidos",()=>bossesBeaten().t>=10],
 ["luta10","Casca grossa","10 treinos de luta",()=>workouts().filter(w=>w.p&&w.p.tipo==="luta").length>=10],
 ["pr","Mais forte","Superar a primeira carga",()=>Object.values(exHistory()).some(e=>{const c=e.pts.filter(p=>p.c);return c.length>1&&Math.max(...c.map(p=>p.c))>c[0].c;})],
 ["kg5","Menos 5","Perder 5 kg",()=>curW()<=85],["kg10","Menos 10","Perder 10 kg",()=>curW()<=80],["meta","Ascensão","Chegar aos 75 kg",()=>curW()<=75],
 ["ref50","Diário de bordo","50 refeições registradas",()=>meals().length>=50],
 ["agua7","Hidratado","7 dias com 2 L de água",()=>Object.values(S.diario).filter(d=>(+d.agua||0)>=WATER).length>=7],
 ["sono7","Recuperado","7 noites com 7 h ou mais",()=>Object.values(S.diario).filter(d=>(+d.sono||0)>=7).length>=7],
 ["diario7","Autoconhecimento","7 diários escritos",()=>Object.values(S.diario).filter(d=>d.vitorias||d.dificuldades).length>=7],
 ["nivel10","Rank D","Chegar ao LVL 10",()=>levelOf(xpEarned())>=10]];
const DEF_R=[["descanso","Passe de descanso (conta a quest do dia como cumprida)",800],["luva","Bermuda ou luva nova de luta",3000],["camiseta","Camiseta de treino nova",1500],["role","Rolê especial com a namorada",2000],["jogo","Um jogo novo",2500],["massagem","Massagem",3000]];
let achSeen=null;
function renderPerfil(){
  const earned=xpEarned(),lvl=levelOf(earned),bal=earned-xpSpent();
  $("#pfKv").innerHTML=`<div><small>Nível</small><b class="mono">${lvl}</b></div><div><small>Rank</small><b>${rankOf(lvl)}</b></div><div><small>XP total</small><b class="mono">${earned.toLocaleString("pt-BR")}</b></div><div><small>Próximo nível</small><b class="mono">${(xpForLevel(lvl+1)-earned).toLocaleString("pt-BR")}</b></div><div><small>Melhor sequência</small><b class="mono">${bestStreak()}</b></div>`;
  const ws=workouts(),gym=ws.filter(w=>w.p&&w.p.tipo==="academia").length,fmin=ws.filter(w=>w.p&&w.p.tipo==="luta").reduce((a,w)=>a+(+w.p.minutos||60),0);
  const t=Math.max(1,Math.min(TOTAL,TODAY()));let dn=0;for(let n=1;n<=t;n++)if(dayDone(n))dn++;
  const dv=Object.values(S.diario),vit=dv.length?dv.reduce((a,d)=>a+Math.min(1,(+d.agua||0)/WATER)*50+Math.min(1,(+d.sono||0)/7.5)*50,0)/dv.length:0;
  const intel=Math.min(100,meals().length*1.2+ws.length*2+dv.filter(d=>d.vitorias||d.humor).length*3);
  const A=[["Força",Math.min(100,15+gym*2.5)],["Agilidade",Math.min(100,10+fmin/60*4)],["Vitalidade",vit],["Inteligência",intel],["Disciplina",dn/t*100]];
  $("#attrs").innerHTML=A.map(([k,v])=>`<div class="attr"><span>${k.toUpperCase()}</span><div class="meter"><i style="width:${v}%"></i></div><span class="mono">${Math.round(v)}</span></div>`).join("");
  $("#rBal").textContent=bal.toLocaleString("pt-BR");
  const custom=Object.entries(S.loja).filter(([_,r])=>r.tipo==="recompensa").map(([id,r])=>[id,r.nome,+r.custo,true]);
  const rs=DEF_R.map(r=>[r[0],r[1],r[2],false]).concat(custom);const passes=Object.values(S.loja).filter(r=>r.item==="descanso"&&!r.usado).length;
  $("#rList").innerHTML=rs.map(([id,nome,custo,cu])=>`<div class="reward"><div><div class="ttl">${esc(nome)}</div><div class="meta mono note">${custo.toLocaleString("pt-BR")} XP${id==="descanso"&&passes?" · você tem "+passes:""}${bal<custo?" · faltam "+(custo-bal).toLocaleString("pt-BR"):""}</div></div>
    <div class="act">${cu?`<button class="linkbtn" data-rm="${id}">remover</button>`:""}<button class="btn sm${bal>=custo?" pri":""}" data-buy="${id}" data-n="${esc(nome)}" data-c="${custo}" ${bal<custo?"disabled":""}>Resgatar</button></div></div>`).join("");
  $$("#rList [data-buy]").forEach(b=>b.onclick=()=>{if(!b.dataset.ok){b.dataset.ok=1;b.textContent="Confirmar";return;}
    put("loja",newId(),{tipo:"compra",item:b.dataset.buy,nome:b.dataset.n,custo:+b.dataset.c,d:todayISO(),usado:false});pop("Recompensa liberada",b.dataset.n,"gold");});
  $$("#rList [data-rm]").forEach(b=>b.onclick=()=>{if(b.dataset.c2)del("loja",b.dataset.rm);else{b.dataset.c2=1;b.textContent="confirmar?";}});
  const got=ACH.filter(a=>a[3]());$("#achCount").textContent=got.length+" de "+ACH.length;
  $("#achBox").innerHTML=ACH.map(a=>`<div class="${a[3]()?"on":""}"><b>${a[1]}</b><span>${a[2]}</span></div>`).join("");
}
$("#rAdd").onclick=()=>{const n=$("#rName").value.trim(),c=parseInt($("#rCost").value,10);$("#rErr").textContent="";
  if(!n){$("#rErr").textContent="Dê um nome à recompensa.";return;}if(!(c>=100)){$("#rErr").textContent="Custo mínimo de 100 XP.";return;}
  put("loja",newId(),{tipo:"recompensa",nome:n.slice(0,60),custo:c});$("#rName").value="";$("#rCost").value="";};
function csv(rows){return rows.map(r=>r.map(v=>{const s=String(v??"");return /[",\n;]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}).join(",")).join("\n");}
$$("[data-exp]").forEach(b=>b.onclick=async()=>{$("#expErr").textContent="";if(!DL){$("#expErr").textContent="Não consegui exportar.";return;}
  const k=b.dataset.exp;let filename,data;
  if(k==="json"){filename="ascensao-backup-"+todayISO()+".json";data=JSON.stringify(S,null,1);}
  else if(k==="medidas"){filename="medidas.csv";data=csv([["data","peso","cintura","peito","braco","coxa","quadril"]].concat(checkins().map(c=>[c.d,c.w,c.waist,c.peito,c.braco,c.coxa,c.quadril])));}
  else if(k==="refeicoes"){filename="refeicoes.csv";data=csv([["data","hora","refeicao","motivo","livre","prato","proteina","carbo","gordura","kcal"]].concat(meals().map(m=>[m.d,m.at,m.tipo,m.fome,m.livre?"sim":"",m.a&&m.a.prato||m.texto,m.a&&m.a.total&&m.a.total.proteina,m.a&&m.a.total&&m.a.total.carbo,m.a&&m.a.total&&m.a.total.gordura,m.a&&m.a.total&&m.a.total.kcal])));}
  else{filename="treinos.csv";const rows=[["data","tipo","modalidade","minutos","exercicio","series","reps","carga_kg"]];workouts().forEach(w=>{const p=w.p||{};if(p.exercicios&&p.exercicios.length)p.exercicios.forEach(e=>rows.push([w.d,p.tipo,p.modalidade,p.minutos,e.nome,e.series,e.reps,e.carga_kg]));else rows.push([w.d,p.tipo,p.modalidade,p.minutos,w.texto,"","",""]);});data=csv(rows);}
  try{await DL.save({filename,data});}catch(e){if(e&&e.code!=="declined")$("#expErr").textContent="Não consegui exportar agora.";}});

// ================= CHARTS =================
const cssv=k=>getComputedStyle(document.documentElement).getPropertyValue(k).trim();
function setupCanvas(c){const dpr=Math.min(devicePixelRatio||1,2),W=c.parentElement.clientWidth,H=c.parentElement.clientHeight;c.width=W*dpr;c.height=H*dpr;const g=c.getContext("2d");g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,W,H);g.font="11px "+cssv("--f-mono");return{g,W,H};}
function drawW(){const c=$("#wChart");if(!c.parentElement.clientWidth)return;const{g,W,H}=setupCanvas(c);
  const L=40,R=14,T=14,B=26,yMin=72,yMax=92,X=n=>L+(n-1)/(TOTAL-1)*(W-L-R),Y=v=>T+(yMax-v)/(yMax-yMin)*(H-T-B);
  g.textBaseline="middle";g.textAlign="right";for(let v=72;v<=92;v+=4){g.strokeStyle=cssv("--line");g.beginPath();g.moveTo(L,Y(v));g.lineTo(W-R,Y(v));g.stroke();g.fillStyle=cssv("--mute");g.fillText(v,L-8,Y(v));}
  g.textAlign="center";g.textBaseline="top";[1,60,120,180].forEach(n=>{const d=dateOf(n);g.fillStyle=cssv("--mute");g.textAlign=n===1?"left":n===180?"right":"center";g.fillText(MES[d.getMonth()]+"/"+String(d.getFullYear()).slice(2),X(n),H-B+8);});
  g.fillStyle="rgba(111,227,166,.12)";g.fillRect(L,Y(75.5),W-L-R,Y(74.5)-Y(75.5));g.fillStyle=cssv("--ok");g.textAlign="right";g.textBaseline="bottom";g.fillText("meta 75",W-R-4,Y(75.5)-3);
  g.setLineDash([4,4]);g.strokeStyle=cssv("--ice-dim");g.lineWidth=1.5;g.beginPath();for(let n=1;n<=TOTAL;n+=2){n===1?g.moveTo(X(n),Y(plannedW(n))):g.lineTo(X(n),Y(plannedW(n)));}g.stroke();g.setLineDash([]);
  const pts=checkins().map(k=>[X(Math.max(1,Math.min(TOTAL,nOf(parseISO(k.d))))),Y(Math.max(yMin,Math.min(yMax,+k.w)))]);
  g.strokeStyle=cssv("--heat");g.lineWidth=2;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.stroke();
  pts.forEach((p,i)=>{g.fillStyle=cssv("--deck-2");g.beginPath();g.arc(p[0],p[1],i===pts.length-1?5:3.5,0,7);g.fill();g.strokeStyle=cssv("--heat");g.lineWidth=2;g.stroke();});}
function drawEx(e){const c=$("#exChart");if(!c.parentElement.clientWidth)return;const{g,W,H}=setupCanvas(c);
  const pts=e?e.pts.filter(p=>p.c):[];if(!pts.length){g.fillStyle=cssv("--mute");g.textAlign="center";g.textBaseline="middle";g.fillText("Registre treinos com carga para ver a evolução",W/2,H/2);return;}
  let lo=Math.min(...pts.map(p=>p.c)),hi=Math.max(...pts.map(p=>p.c));if(hi-lo<4){lo-=2;hi+=2;}
  const L=40,R=14,T=14,B=26,ns=pts.map(p=>nOf(parseISO(p.d))),n0=Math.min(...ns),n1=Math.max(n0+7,...ns),X=n=>L+(n-n0)/(n1-n0)*(W-L-R),Y=v=>T+(hi-v)/(hi-lo)*(H-T-B);
  g.textBaseline="middle";g.textAlign="right";for(let i=0;i<=4;i++){const v=lo+(hi-lo)*i/4;g.strokeStyle=cssv("--line");g.beginPath();g.moveTo(L,Y(v));g.lineTo(W-R,Y(v));g.stroke();g.fillStyle=cssv("--mute");g.fillText(fmt(v,0),L-8,Y(v));}
  g.textAlign="center";g.textBaseline="top";g.fillText(brS(dateOf(n0)),L+20,H-B+8);g.fillText(brS(dateOf(n1)),W-R-24,H-B+8);
  g.strokeStyle=cssv("--ice");g.lineWidth=2;g.beginPath();pts.forEach((p,i)=>{const x=X(nOf(parseISO(p.d))),y=Y(p.c);i?g.lineTo(x,y):g.moveTo(x,y);});g.stroke();
  pts.forEach(p=>{g.fillStyle=cssv("--ice");g.beginPath();g.arc(X(nOf(parseISO(p.d))),Y(p.c),3.5,0,7);g.fill();});}

// ================= MODO RECUPERAÇÃO =================
function startRecovery(motivo){const ps=emPeriods().slice();ps.push({inicio:todayISO(),fim:null,motivo});put("perfil","emergencia",{periodos:ps});pop("Sistema","Modo recuperação ativado. Cuide de você.","gold");}
function endRecovery(){const today=todayISO(),y=new Date();y.setDate(y.getDate()-1);
  let ps=emPeriods().map(p=>({...p}));const cur=ps.find(p=>!p.fim);if(!cur)return;
  if(cur.inicio>=today)ps=ps.filter(p=>p!==cur);else cur.fim=isoD(y);
  put("perfil","emergencia",{periodos:ps});pop("Sistema","Bem-vindo de volta. A campanha continua.","gold");}
$("#recupBtn").onclick=()=>{const box=$("#recupBox");box.innerHTML=`<div class="recup"><b>Por que você precisa pausar?</b><div class="seg">${["Doente","Lesão ou dor","Compromisso importante","Exausto, preciso descansar"].map(m=>`<button class="btn sm" data-em="${m}">${m}</button>`).join("")}</div><span class="note">Pausar não zera nada. Penalidades e bosses ficam suspensos e a sequência é protegida.</span></div>`;
  $$("[data-em]").forEach(b=>b.onclick=()=>startRecovery(b.dataset.em));};

// ================= BOOT / CHECK-IN =================
let voicePref=!!LSK.get("fdd-voice");
function say(t){if(voicePref)Voice.say(t,true);}
function greetWord(){const h=new Date().getHours();return h<12?"Bom dia":h<18?"Boa tarde":"Boa noite";}
const BOOT={st:{}};
const RATES=[["humor","Humor","péssimo","ótimo"],["disposicao","Disposição","zerado","a mil"],["motivacao","Motivação","nenhuma","no máximo"],["fadiga","Fadiga ou dor","nenhuma","muita"]];
function openBoot(){const di=diaryOf(todayISO());BOOT.st={humor:di.humor,disposicao:di.disposicao,motivacao:di.motivacao,fadiga:di.fadiga,sono:di.sono,nota:di.nota||""};$("#boot").hidden=false;document.body.style.overflow="hidden";bootIntro();}
function closeBoot(r){LSK.set("fdd-boot",todayISO());$("#boot").hidden=true;document.body.style.overflow="";Voice.stop();if(r)location.hash=r;}
function bootIntro(){const t=Math.min(TOTAL,Math.max(1,TODAY())),L=phaseOf(t),newPhase=(t-1)%30===0;
  const log=["[ SISTEMA ] conexão estabelecida","jogador identificado: VITOR · LVL "+levelOf(xpEarned())+" · RANK "+rankOf(levelOf(xpEarned())),"dia "+t+" de 180 · fase "+(L+1)+": "+PHASES[L].toUpperCase(),streak()?"sequência ativa: "+streak()+" dias":"nova sequência pronta para começar"];
  $("#bootPanel").innerHTML=`<div class="log">${log.map((l,i)=>`<span style="animation-delay:${i*.35}s">${esc(l)}</span>`).join("")}</div>
   <div class="greet" style="animation-delay:1.5s">${greetWord()},<br><em>Vitor.</em></div>
   <p class="lead" style="animation-delay:1.9s">Como você está hoje?</p>
   ${newPhase?`<div class="story fade" style="animation-delay:2.2s"><span class="eyebrow">Nova fase desbloqueada</span><b>Fase ${L+1} · ${STORY[L][0]}</b><p class="note" style="color:var(--fg);margin-top:6px">${STORY[L][1]}</p></div>`:""}
   <div class="seg fade" style="animation-delay:2.3s"><button class="btn pri" id="bStart">Fazer check-in</button><button class="btn" id="bSkip">Pular</button><button class="btn sm" id="bVoice" aria-pressed="${voicePref}">Voz do Sistema</button></div>`;
  $("#bStart").onclick=()=>{Voice.unlock();say(greetWord()+", Vitor. Como você está hoje?");bootRate();};
  $("#bSkip").onclick=()=>bootQuest();
  $("#bVoice").onclick=()=>{Voice.unlock();voicePref=!voicePref;voice=voicePref;LSK.set("fdd-voice",voicePref);$("#bVoice").setAttribute("aria-pressed",String(voicePref));if(voicePref)say("Voz ativada.");};}
function bootRate(){const st=BOOT.st;
  $("#bootPanel").innerHTML=`<span class="eyebrow">Check-in do Sistema · 1 de 2</span><h2 class="qtitle" style="font-size:28px">Como você está?</h2>
   ${RATES.map(([k,lab,lo,hi])=>`<div class="rate"><div class="rl"><span>${lab}</span><span>1 ${lo} · 5 ${hi}</span></div><div class="rb" data-k="${k}">${[1,2,3,4,5].map(v=>`<button aria-pressed="${st[k]===v}" data-v="${v}">${v}</button>`).join("")}</div></div>`).join("")}
   <div class="rate"><div class="rl"><span>Sono na última noite</span><span class="mono" id="bSonoV">${st.sono!=null?fmt(st.sono,1).replace(",0","")+" h":""}</span></div><div class="rb" data-k="sono">${[5,6,7,8,9].map(v=>`<button aria-pressed="${st.sono===v}" data-v="${v}">${v}h</button>`).join("")}</div></div>
   <label class="f">Quer contar algo? (toque no microfone do teclado para falar)<textarea id="bNota" rows="2" placeholder="Ex.: dormi mal, estou com dor no ombro, hoje estou animado">${esc(st.nota)}</textarea></label>
   <div class="seg"><button class="btn pri" id="bNext">Ver minha quest</button><button class="btn" id="bBack">Voltar</button></div>`;
  $$("#bootPanel .rb").forEach(rb=>rb.querySelectorAll("button").forEach(b=>b.onclick=()=>{st[rb.dataset.k]=+b.dataset.v;rb.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));}));
  const nt=$("#bNota");nt.insertAdjacentElement("afterend",micButton("#bNota",null,"Falar"));
  $("#bBack").onclick=bootIntro;
  $("#bNext").onclick=()=>{st.nota=$("#bNota").value.trim();const patch={};["humor","disposicao","motivacao","fadiga","sono"].forEach(k=>{if(st[k]!=null)patch[k]=st[k];});if(st.nota)patch.nota=st.nota.slice(0,300);
    if(Object.keys(patch).length)saveDiary(patch);bootQuest();};}
function bootQuest(){const t=Math.min(TOTAL,Math.max(1,TODAY())),m=missionFor(t),d=dayDoc(t),st=BOOT.st;
  const low=(st.fadiga>=4)||(st.sono!=null&&st.sono<6)||(st.disposicao!=null&&st.disposicao<=2);
  const veryLow=(st.fadiga===5)||(st.humor===1&&st.disposicao===1);
  let adv="";
  if(m.recup)adv="Você está em modo recuperação. Hoje a missão é descansar e se cuidar.";
  else if(veryLow)adv="Seu check-in está bem baixo. Se for doença ou dor, ative o modo recuperação: a sequência fica protegida.";
  else if(low&&m.tipo==="academia")adv="Recuperação baixa hoje: faça a quest com 1 série a menos e sem buscar carga nova. Também conta.";
  else if(low)adv="Recuperação baixa hoje: vá no seu ritmo. Aparecer já vale.";
  else if(st.motivacao!=null&&st.motivacao<=2)adv="Motivação baixa é normal. Comece só pela primeira tarefa, o resto vem.";
  const sb=isSBoss(t)&&!m.recup?sboss(t):null,pen=penaltyFor(t)&&!d.rest;
  $("#bootPanel").innerHTML=`<span class="eyebrow">Check-in do Sistema · 2 de 2</span>
   <div class="sys-title fade">${m.boss?"Chefão":"Quest diária"} recebida</div>
   <h2 class="qtitle fade" style="animation-delay:.15s">${esc(m.titulo)}</h2>
   <div class="checks fade" style="animation-delay:.3s">${m.tasks.slice(0,5).map((x,i)=>`<div class="ck auto${d.t&&d.t[i]?" done":""}" style="padding:7px 0"><span class="t"><span>${esc(x)}</span>${m.ex[i]?`<span class="hint">${esc(suggest(m.ex[i]))}</span>`:""}</span></div>`).join("")}${m.tasks.length>5?`<span class="note">+${m.tasks.length-5} tarefas</span>`:""}</div>
   ${sb?`<div class="bossbox reveal"><span class="chip c-boss">Boss surpresa · +${XP.sboss} XP</span><h3>${esc(sb.t)}</h3></div>`:""}
   ${pen?`<div class="bossbox pen"><span class="chip c-heat">Quest de penalidade</span><h3>Recupere o dia de ontem hoje</h3></div>`:""}
   ${adv?`<div class="advice fade" style="animation-delay:.45s">${esc(adv)}</div>`:""}
   <div class="tiles fade" style="animation-delay:.55s">
     <button class="tile main" data-go="sistema"><b>Começar a quest</b><span>Abrir a missão completa e marcar o que fizer</span></button>
     <button class="tile" data-go="coach"><b>Falar com o Sistema</b><span>Conte o que fez, comeu ou sente</span></button>
     <button class="tile" data-go="nutricao"><b>Registrar refeição</b><span>Foto ou texto do prato</span></button>
     <button class="tile" data-go="treino"><b>Treino</b><span>Cargas e cronômetro</span></button>
     <button class="tile" data-go="corpo"><b>Meu corpo</b><span>Scan 3D e peso</span></button>
     ${veryLow&&!m.recup?`<button class="tile" data-em="Exausto, preciso descansar"><b>Modo recuperação</b><span>Pausar sem perder a sequência</span></button>`:""}
   </div>`;
  if(sb)setTimeout(()=>pop("Alerta do Sistema","Um boss surpresa apareceu","boss"),500);
  say("Sua quest de hoje: "+m.titulo+"."+(sb?" Atenção: um boss surpresa apareceu.":"")+(adv?" "+adv:""));
  $$("#bootPanel [data-go]").forEach(b=>b.onclick=()=>closeBoot(b.dataset.go));
  const eb=$("#bootPanel [data-em]");if(eb)eb.onclick=()=>{startRecovery(eb.dataset.em);closeBoot("sistema");};}
$("#reCheck").onclick=openBoot;
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#boot").hidden)closeBoot();});

// ================= EVENTS / ROUTING =================
function checkEvents(first){const got=ACH.filter(a=>a[3]()).map(a=>a[0]);
  if(achSeen===null){achSeen=new Set(LSK.get("fdd-ach-seen")||got);}
  got.forEach(id=>{if(!achSeen.has(id)){achSeen.add(id);const a=ACH.find(x=>x[0]===id);pop("Conquista desbloqueada",a[1],"gold");}});LSK.set("fdd-ach-seen",[...achSeen]);}
const ROUTES=["sistema","corpo","treino","nutricao","coach","jornada","perfil"];let route="sistema";
function go(){route=ROUTES.includes(location.hash.slice(1))?location.hash.slice(1):"sistema";ROUTES.forEach(r=>{$("#v-"+r).hidden=r!==route;});
  $$(".tab,.bnav button").forEach(t=>t.setAttribute("aria-current",t.dataset.r===route?"page":"false"));renderAll();window.scrollTo(0,0);}
$$(".tab,.bnav button").forEach(t=>t.onclick=()=>{location.hash=t.dataset.r;});
window.addEventListener("hashchange",go);
function renderAll(){renderHeader();
  ({sistema:renderSistema,corpo:renderCorpo,treino:renderTreino,nutricao:renderNutricao,coach:renderCoach,jornada:renderJornada,perfil:renderPerfil})[route]();
  if(typeof EXTRA!=="undefined"&&EXTRA[route])try{EXTRA[route]();}catch(e){console.error(e);}
  if(loaded&&achSeen!==null)checkEvents(false);}
let rsT;new ResizeObserver(()=>{clearTimeout(rsT);rsT=setTimeout(()=>{if(route==="corpo")drawW();if(route==="treino")drawEx(curEx);},120);}).observe(document.querySelector("main"));
["#upDate","#mDate","#mView","#tDate","#cDate","#hDate"].forEach(s=>$(s).value=todayISO());
const pe=new Date(2027,4,7);$("#pEnd").value=isoD(pe);

