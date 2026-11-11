// ================= EXTRAS: ajustes, inteligência, recuperação, foco, cartão, simulador =================
const NTFY_TOPIC=window.FDD_CONFIG.ntfyTopic;
const EXTRA={};
const once=(id,html,where,pos)=>{if(!document.getElementById(id)){const el=document.querySelector(where);el.insertAdjacentHTML(pos||"afterbegin",html);return true;}return false;};
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
const lastNDates=n=>{const out=[];for(let i=0;i<n;i++){const d=new Date();d.setDate(d.getDate()-i);out.push(isoD(d));}return out;};

// ---------- modo do coach e memória ----------
const MODES={sistema:"MODO SISTEMA: frio, objetivo e imersivo, como o sistema de Solo Leveling. Frases curtas, tom de anúncio.",coach:"MODO COACH: analítico, motivador e estratégico, como um treinador que conhece o Vitor.",preventivo:"MODO PREVENTIVO: cauteloso, foca em recuperação, dor, sono e sinais de alerta. Nunca diagnostica; orienta procurar médico, fisioterapeuta ou nutricionista quando fizer sentido."};
function coachMode(){return MODES[LSK.get("fdd2-coach-mode")||"coach"];}
function memoryText(){const m=Object.values(S.memoria||{}).sort((a,b)=>a.d<b.d?-1:1).slice(-40);return m.length?"MEMÓRIA DE LONGO PRAZO (fatos que ele contou):\n"+m.map(x=>"- ["+x.tipo+"] "+x.fato).join("\n"):"MEMÓRIA DE LONGO PRAZO: vazia. Use a ferramenta lembrar quando ele contar algo duradouro.";}

// ---------- recuperação, sobrecarga, equilíbrio ----------
function recoveryState(){const last={},vol={};const since=isoD(new Date(Date.now()-7*864e5));
  workouts().forEach(w=>(w.p&&w.p.exercicios||[]).forEach(e=>{const nm=normEx(e.nome);for(const g in GROUPS){if(GROUPS[g].some(k=>nm.includes(k))){if(!last[g]||w.d>last[g])last[g]=w.d;if(w.d>=since)vol[g]=(vol[g]||0)+(+e.series||1);break;}}}));
  const ds=lastNDates(3).map(d=>diaryOf(d));const sono=avg(ds.map(d=>+d.sono).filter(x=>x>0));const fad=+diaryOf(todayISO()).fadiga||0;
  let factor=1;if(sono&&sono<6)factor-=.15;else if(sono>=7.5)factor+=.05;if(fad>=4)factor-=.15;if(fad===5)factor-=.1;
  const out={};Object.keys(GROUPS).forEach(g=>{if(!last[g]){out[g]=null;return;}const h=(new Date()-parseISO(last[g]))/36e5-12;const need=48+Math.min(36,(vol[g]||0)*1.5);out[g]=Math.max(0,Math.min(100,Math.round(h/need*100*factor)));});
  return{rec:out,sono,fad,factor};}
function overloadAlerts(){const al=[];const ds=lastNDates(5).map(d=>diaryOf(d));
  const fad=lastNDates(3).map(d=>+diaryOf(d).fadiga||0);if(fad.filter(x=>x>=4).length>=3)al.push(["Fadiga alta 3 dias seguidos","Considere um dia de recuperação ou o modo recuperação."]);
  const sl=ds.map(d=>+d.sono).filter(x=>x>0);if(sl.filter(x=>x<6).length>=3)al.push(["Sono abaixo de 6 h em "+sl.filter(x=>x<6).length+" das últimas noites","Sono curto derruba recuperação e aumenta a fome por ansiedade."]);
  const ex=exHistory();Object.values(ex).forEach(e=>{const p=e.pts.filter(x=>x.c);if(p.length>=3){const a=p[p.length-3].c,c=p[p.length-1].c;if(c<a*.92)al.push(["Carga caindo em "+e.nome,"De "+a+" para "+c+" kg nas últimas sessões. Pode ser cansaço ou pouca comida."]);}});
  const cs=checkins();if(cs.length>=3){const l=cs[cs.length-1],f=cs.find(x=>(parseISO(l.d)-parseISO(x.d))/864e5<=14);if(f&&f!==l){const wk=(f.w-l.w)/Math.max(1,(parseISO(l.d)-parseISO(f.d))/864e5/7);if(wk>1.1)al.push(["Perdendo "+fmt(wk,1)+" kg por semana","Acima de ~1 kg/semana por duas semanas pode custar músculo. Vale falar com o médico."]);}}
  const v=weekVolume(),tot=Object.values(v).reduce((a,b)=>a+b,0);const prev=(()=>{const a=isoD(new Date(Date.now()-14*864e5)),b=isoD(new Date(Date.now()-7*864e5));let t=0;workouts().filter(w=>w.d>=a&&w.d<b).forEach(w=>(w.p&&w.p.exercicios||[]).forEach(e=>t+=(+e.series||1)));return t;})();
  if(prev>10&&tot>prev*1.35)al.push(["Volume subiu "+Math.round((tot/prev-1)*100)+"% em uma semana","Aumentos grandes de uma vez elevam o risco de lesão."]);
  const dor=lastNDates(4).map(d=>diaryOf(d).dor).filter(Boolean);if(dor.length>=2)al.push(["Dor relatada em "+dor.length+" dos últimos 4 dias","Se persistir, procure um fisioterapeuta. Não treine em cima da dor."]);
  return al;}
function balanceIndex(){const since=isoD(new Date(Date.now()-14*864e5));const ws=workouts().filter(w=>w.d>=since);
  const gym=Math.min(100,ws.filter(w=>w.p&&w.p.tipo==="academia").length/6*100),luta=Math.min(100,ws.filter(w=>w.p&&w.p.tipo==="luta").length/4*100);
  const dd=lastNDates(14).map(d=>diaryOf(d));const sono=Math.min(100,avg(dd.map(d=>+d.sono).filter(x=>x>0))/7.5*100)||0;const agua=Math.min(100,avg(dd.map(d=>+d.agua||0))/WATER*100);
  const ms=meals().filter(m=>m.d>=since&&m.a);const nut=ms.length?avg(ms.map(m=>+m.a.qualidade||3))*20:0;
  const parts=[["Musculação",gym],["Luta",luta],["Recuperação",(sono+agua)/2],["Alimentação",nut]];
  const vals=parts.map(p=>p[1]);const idx=Math.round(avg(vals)-(Math.max(...vals)-Math.min(...vals))*.25);return{parts,idx:Math.max(0,idx)};}

// ---------- predição ----------
function weightTrend(){const cs=checkins().filter(c=>(new Date()-parseISO(c.d))/864e5<=28);if(cs.length<2)return null;
  const xs=cs.map(c=>parseISO(c.d)/864e5),ys=cs.map(c=>+c.w);const mx=avg(xs),my=avg(ys);let num=0,den=0;xs.forEach((x,i)=>{num+=(x-mx)*(ys[i]-my);den+=(x-mx)**2;});
  const slope=den?num/den:0;const perWeek=slope*7;const cur=ys[ys.length-1];const eta=slope<0?new Date(Date.now()+((cur-GOAL)/-slope)*864e5):null;return{perWeek,eta,cur};}
function recommendations(){const r=[];const t=todayISO(),d=diaryOf(t),ms=mealsOn(t),tot=dayTotals(t);
  const p7=lastNDates(7).map(x=>dayTotals(x).p).filter(x=>x>0);if(p7.length>=3&&avg(p7)<110)r.push(["Subir a proteína","Média de "+Math.round(avg(p7))+" g/dia nos dias registrados. Uma porção de proteína a mais no café ou lanche resolve.","Dados: refeições dos últimos 7 dias"]);
  const ag=lastNDates(5).map(x=>+diaryOf(x).agua||0).filter(x=>x>0);if(ag.length>=3&&avg(ag)<1600)r.push(["Mais água","Média de "+fmt(avg(ag)/1000,1)+" L. Deixe uma garrafa na mesa do trabalho.","Dados: água dos últimos 5 dias"]);
  const v=weekVolume();Object.keys(VOLT).forEach(g=>{if(workouts().length>=3&&v[g]<VOLT[g][0]*.6)r.push(["Mais séries de "+g,v[g]+" séries nos últimos 7 dias, alvo "+VOLT[g].join(" a ")+".","Dados: treinos registrados"]);});
  const anx=meals().filter(m=>(new Date()-parseISO(m.d))/864e5<=7&&(m.fome==="ansiedade"||m.fome==="tedio"));if(anx.length>=3){const nt=anx.filter(m=>(m.at||"12")>="19").length;r.push(["Plano para a fome emocional",anx.length+" refeições por ansiedade ou tédio na semana"+(nt>=2?", a maioria à noite":"")+". Tenha um lanche proteico pronto e uma alternativa (banho, caminhada curta, ligar para alguém).","Dados: motivo das refeições"]);}
  if(!checkins().some(c=>(new Date()-parseISO(c.d))/864e5<=14))r.push(["Pesar de manhã","Sem peso registrado nos últimos 14 dias.","Dados: peso"]);
  if(!r.length)r.push(["Manter o plano","Nada fora da curva com os dados atuais. Continue registrando para análises melhores.","Dados: todos os registros"]);return r;}

// ---------- cartão de status ----------
async function statusCard(){const c=document.createElement("canvas");c.width=1080;c.height=1350;const g=c.getContext("2d");
  g.fillStyle="#03060B";g.fillRect(0,0,1080,1350);g.strokeStyle="rgba(127,227,255,.06)";for(let x=0;x<1080;x+=40){g.beginPath();g.moveTo(x,0);g.lineTo(x,1350);g.stroke();}for(let y=0;y<1350;y+=40){g.beginPath();g.moveTo(0,y);g.lineTo(1080,y);g.stroke();}
  g.strokeStyle="#4F9DFF";g.lineWidth=3;g.strokeRect(60,60,960,1230);
  const earned=xpEarned(),lvl=levelOf(earned),t=Math.min(TOTAL,Math.max(1,TODAY()));
  g.fillStyle="#7FE3FF";g.font="600 30px 'Chakra Petch',sans-serif";g.fillText("[ SISTEMA ] STATUS DO JOGADOR",100,140);
  g.fillStyle="#DCE8F2";g.font="700 96px 'Chakra Petch',sans-serif";g.fillText("VITOR",100,270);
  g.font="600 44px 'Chakra Petch',sans-serif";g.fillStyle="#7FE3FF";g.fillText("LVL "+lvl+"  ·  RANK "+rankOf(lvl),100,340);
  g.fillStyle="#8397AA";g.font="32px 'IBM Plex Mono',monospace";g.fillText("FASE "+(phaseOf(t)+1)+" · "+PHASES[phaseOf(t)].toUpperCase()+" · DIA "+t+"/180",100,395);
  const ws=workouts(),gym=ws.filter(w=>w.p&&w.p.tipo==="academia").length,fmin=ws.filter(w=>w.p&&w.p.tipo==="luta").reduce((a,w)=>a+(+w.p.minutos||60),0);let dn=0;for(let n=1;n<=t;n++)if(dayDone(n))dn++;
  const A=[["FORÇA",Math.min(100,15+gym*2.5)],["AGILIDADE",Math.min(100,10+fmin/60*4)],["DISCIPLINA",dn/t*100],["DEFINIÇÃO",Math.max(0,Math.min(100,(W0-curW())/(W0-GOAL)*100))]];
  A.forEach(([k,v],i)=>{const y=500+i*110;g.fillStyle="#DCE8F2";g.font="30px 'IBM Plex Mono',monospace";g.fillText(k,100,y);g.fillStyle="#172334";g.fillRect(380,y-28,520,30);g.fillStyle="#7FE3FF";g.fillRect(380,y-28,520*v/100,30);g.fillStyle="#DCE8F2";g.fillText(String(Math.round(v)),920,y);});
  const kv=[["PESO",fmt(curW())+" kg"],["PERDIDO",fmt(Math.max(0,W0-curW()))+" kg"],["SEQUÊNCIA",streak()+" dias"],["BOSSES",String(bossesBeaten().t)]];
  kv.forEach(([k,v],i)=>{const x=100+(i%2)*460,y=1000+Math.floor(i/2)*130;g.fillStyle="#8397AA";g.font="26px 'IBM Plex Mono',monospace";g.fillText(k,x,y);g.fillStyle="#DCE8F2";g.font="600 56px 'Chakra Petch',sans-serif";g.fillText(v,x,y+60);});
  g.fillStyle="#4A8BA3";g.font="26px 'IBM Plex Mono',monospace";g.fillText("ASCENSÃO · META 75 KG",100,1250);
  const blobImg=await new Promise(r=>c.toBlob(r,"image/png"));await DL.save({filename:"status-vitor-dia-"+t+".png",data:blobImg});}

// ---------- MODO FOCO ----------
const FOCO={i:0,set:1};
function openFocus(){const n=Math.min(TOTAL,Math.max(1,TODAY())),m=missionFor(n);const items=m.tasks.map((t,i)=>({t,ex:m.ex[i],i})).filter(x=>!/^Registrar/.test(x.t));
  if(!items.length)return;FOCO.items=items;FOCO.n=n;const d=dayDoc(n);FOCO.i=Math.max(0,items.findIndex(x=>!(d.t&&d.t[x.i])));if(FOCO.i<0)FOCO.i=0;FOCO.set=1;
  $("#boot").hidden=false;document.body.style.overflow="hidden";drawFocus();}
function drawFocus(){const it=FOCO.items[FOCO.i],tot=FOCO.items.length,sets=it.ex?it.ex.s:1;
  $("#bootPanel").innerHTML=`<span class="eyebrow">Modo foco · ${FOCO.i+1} de ${tot}</span>
   <h2 class="qtitle" style="font-size:clamp(28px,7vw,44px)">${esc(it.ex?it.ex.n:it.t)}</h2>
   ${it.ex?`<div class="kv"><div><small>Série</small><b class="mono">${FOCO.set}/${sets}</b></div><div><small>Reps</small><b class="mono">${it.ex.lo}-${it.ex.hi}${it.ex.tempo?"s":""}</b></div></div><p class="advice" style="border-color:var(--ice);background:rgba(127,227,255,.06)">${esc(suggest(it.ex))}</p>`:`<p class="note">${esc(it.t)}</p>`}
   <div class="timerbig mono" id="fTimer" style="font-size:64px">--:--</div>
   <div class="tiles">
     ${it.ex&&FOCO.set<sets?`<button class="tile main" id="fSet"><b>Série feita · descansar</b><span>Inicia o descanso de ${it.ex.g==="perna"?"2 min":"90 s"}</span></button>`:`<button class="tile main" id="fDone"><b>Concluir ${it.ex?"exercício":"tarefa"}</b><span>Marca na quest e passa para o próximo</span></button>`}
     <button class="tile" id="fPrev"><b>Anterior</b><span>Voltar</span></button><button class="tile" id="fExit"><b>Sair do foco</b><span>Voltar ao app</span></button>
   </div>`;
  const fin=()=>{if(window._ft)clearInterval(window._ft);};
  const s=$("#fSet");if(s)s.onclick=()=>{FOCO.set++;drawFocus();let left=it.ex.g==="perna"?120:90;const el=$("#fTimer");fin();beep(660,150);
    window._ft=setInterval(()=>{left--;el.textContent=pad(Math.floor(left/60))+":"+pad(left%60);if(left<=3&&left>0)beep(660,100);if(left<=0){fin();beep(990,500);el.textContent="VAI!";say("Próxima série.");}},1000);};
  const dn=$("#fDone");if(dn)dn.onclick=()=>{fin();patchDay(FOCO.n,doc=>{doc.t[it.i]=true;});if(FOCO.i<tot-1){FOCO.i++;FOCO.set=1;drawFocus();say(FOCO.items[FOCO.i].ex?FOCO.items[FOCO.i].ex.n:FOCO.items[FOCO.i].t);}else{closeFocus();pop("Treino concluído","Registre as cargas falando com o Sistema","gold");}};
  $("#fPrev").onclick=()=>{fin();FOCO.i=Math.max(0,FOCO.i-1);FOCO.set=1;drawFocus();};$("#fExit").onclick=()=>{fin();closeFocus();};}
function closeFocus(){$("#boot").hidden=true;document.body.style.overflow="";}

// ================= RENDERERS =================
EXTRA.sistema=()=>{
  const n=Math.min(TOTAL,Math.max(1,TODAY()));let done7=0;for(let k=n-1;k>=Math.max(1,n-7);k--)if(dayDone(k))done7++;
  const wd=new Date().getDay(),unlocked=done7>=5,d=dayDoc(n);
  once("consCard",`<div class="card" id="consCard"></div>`,"#v-sistema .col","beforeend");
  $("#consCard").innerHTML=`<div class="head"><h2>Desafio de consistência</h2><span class="mono">${done7}/7</span></div><div class="progress"><i style="width:${done7/5*100}%"></i></div>
   <p class="note">${unlocked?"Liberado! No sábado e no domingo aparece uma missão especial valendo +100 XP.":"Complete 5 dos últimos 7 dias para liberar uma missão especial de fim de semana."}</p>
   ${unlocked&&(wd===0||wd===6)&&!emergencyOn(n)?`<label class="ck" style="border:0"><input type="checkbox" id="espChk" ${d.esp?"checked":""}><span class="t"><span>Missão especial: ${wd===6?"100 flexões + 100 agachamentos no dia":"Shadow boxing 6 rounds de 2 min + prancha acumulada 4 min"}</span><span class="hint">+100 XP · desafio contra o seu próprio histórico</span></span></label>`:""}`;
  const e=$("#espChk");if(e)e.onchange=()=>{patchDay(n,doc=>{doc.esp=e.checked;});if(e.checked)pop("Missão especial","+100 XP","gold");};
};
EXTRA.corpo=()=>{
  once("layerBar",`<div id="layerBar" class="seg"><span class="eyebrow" style="align-self:center">Camadas</span><button class="btn sm" data-ly="pontos" aria-pressed="true">Pontos</button><button class="btn sm" data-ly="gordura" aria-pressed="false">Gordura estimada</button></div><div id="tlBar" class="seg"></div><p class="note" id="layerNote">Pontos e gordura são estimativa visual pelas fotos. O modelo 3D é ilustrativo.</p>`,"#v-corpo .grid2 .card.sys","beforeend");
  $$("[data-ly]").forEach(b=>b.onclick=()=>{b.setAttribute("aria-pressed",String(b.getAttribute("aria-pressed")!=="true"));drawHolo();});
  const marks=[1,30,60,90,120,150,180];
  $("#tlBar").innerHTML=`<span class="eyebrow" style="align-self:center">Linha do tempo</span>`+marks.map(m=>{const key=m===1?"atual":"d"+m;const has=!!S.modelos[key];return `<button class="btn sm" data-tl="${key}" ${has?"":"disabled"} aria-pressed="${(HOLO.src||"atual")===key}">Dia ${m}</button>`;}).join("");
  $$("[data-tl]").forEach(b=>b.onclick=()=>{HOLO.src=b.dataset.tl;HOLO.built=false;buildHolo();EXTRA.corpo();});
};
const _drawHolo=drawHolo;
drawHolo=function(){_drawHolo();const box=$("#holo");if(!box||!HOLO.built)return;
  const ly=k=>{const b=document.querySelector(`[data-ly="${k}"]`);return b?b.getAttribute("aria-pressed")==="true":k==="pontos";};
  $$("#holo .hs").forEach(h=>h.style.visibility=ly("pontos")?"":"hidden");
  let ov=box.querySelector(".ovl");if(!ov){ov=document.createElement("div");ov.className="ovl";ov.style.cssText="position:absolute;inset:0;pointer-events:none;z-index:2";box.appendChild(ov);}
  let html="";const W=box.clientWidth;
  if(ly("gordura"))$$("#holo .hs").forEach(h=>{if(h.classList.contains("off"))return;const r=REG.find(x=>x.id===h.dataset.r);const fat=HOLO.mix>.5?Math.max(5,r.fat-65):r.fat;const sz=Math.max(40,W*.16)*(fat/100+.3);
    html+=`<span style="position:absolute;left:${h.style.left};top:${h.style.top};width:${sz}px;height:${sz}px;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,rgba(255,${Math.round(179-fat)},71,${(fat/100*.55).toFixed(2)}),transparent 70%)"></span>`;});
  if(ly("medidas")){const cs=checkins();const last=k=>{for(let i=cs.length-1;i>=0;i--)if(cs[i][k])return cs[i][k];return null;};
    const M={peito:last("peito"),abdinf:last("waist"),bracos:last("braco"),pernas:last("coxa")},L={peito:"peito",abdinf:"cintura",bracos:"braço",pernas:"coxa"};
    $$("#holo .hs").forEach(h=>{const k=h.dataset.r;if(!(k in M)||!M[k]||h.classList.contains("off"))return;html+=`<span style="position:absolute;left:${h.style.left};top:${h.style.top};transform:translate(-50%,-150%);font-family:var(--f-mono);font-size:11px;color:var(--ok);background:rgba(3,6,11,.85);padding:2px 6px;border:1px solid var(--ok);white-space:nowrap">${L[k]} ${M[k]?fmt(M[k],1).replace(",0","")+" cm":"sem medida"}</span>`;});}
  ov.innerHTML=html;};
const _renderReg=renderReg;
renderReg=function(){_renderReg();const map={peito:["peito"],ombros:["ombro"],bracos:["braco"],abdsup:["core"],abdinf:["core"],flancos:["core"],dorsais:["costas"],pernas:["perna"]};const gs=map[regSel];if(!gs)return;
  const since=isoD(new Date(Date.now()-30*864e5));let sets=0,ses=new Set(),lastD=null;
  workouts().filter(w=>w.d>=since).forEach(w=>(w.p&&w.p.exercicios||[]).forEach(e=>{const nm=normEx(e.nome);const g=Object.keys(GROUPS).find(g=>GROUPS[g].some(k=>nm.includes(k)));if(gs.includes(g)){sets+=(+e.series||1);ses.add(w.d);if(!lastD||w.d>lastD)lastD=w.d;}}));
  const mk=null;const cs=checkins().filter(c=>mk&&c[mk]);
  const rc=recoveryState().rec[gs[0]];
  $("#regPanel").insertAdjacentHTML("beforeend",`<div><div class="sub">Treino desta região · 30 dias</div><div class="kv"><div><small>Sessões</small><b class="mono">${ses.size}</b></div><div><small>Séries</small><b class="mono">${sets}</b></div><div><small>Última vez</small><b class="mono">${lastD?brS(parseISO(lastD)):"·"}</b></div><div><small>Recuperação</small><b class="mono">${rc==null?"·":rc+"%"}</b></div></div>
   ${mk?`<p class="note" style="margin-top:8px">Medida: ${cs.length?fmt(cs[cs.length-1][mk],1).replace(",0","")+" cm em "+brS(parseISO(cs[cs.length-1].d))+(cs.length>1?" (início "+fmt(cs[0][mk],1).replace(",0","")+" cm)":""):"ainda não registrada"}</p>`:""}</div>`);};
EXTRA.treino=()=>{
  once("recCard",`<div class="grid2 even" id="recRow"><div class="card sys" id="recCard"></div><div class="card" id="balCard"></div></div>`,"#v-treino","afterbegin");
  const R=recoveryState();
  $("#recCard").innerHTML=`<div class="sys-title">Recovery Center</div>
   <div style="display:flex;flex-direction:column;gap:9px">${Object.keys(GROUPS).map(g=>{const v=R.rec[g];return `<div class="vol"><span>${g.toUpperCase()}</span><div class="track"><div class="fill" style="width:${v==null?0:v}%;background:${v==null?"var(--line)":v>=90?"var(--ok)":v>=60?"var(--ice)":"var(--heat)"}"></div></div><span class="mono">${v==null?"sem dado":v+"%"}</span></div>`;}).join("")}</div>
   <p class="note">Estimativa pelo tempo desde o último treino, volume, sono (${R.sono?fmt(R.sono,1)+" h de média":"sem registro"}) e fadiga de hoje. Indicador ilustrativo, não é medida clínica.</p>
   <div class="seg"><button class="btn pri" id="focusBtn">Modo foco do treino de hoje</button></div>
   ${(()=>{const al=overloadAlerts();return al.length?`<div><div class="sub">Alertas de sobrecarga</div>${al.map(a=>`<div class="advice" style="margin-top:6px"><b>${esc(a[0])}</b><br><span class="note">${esc(a[1])}</span></div>`).join("")}</div>`:`<p class="note">Nenhum sinal de sobrecarga.</p>`;})()}`;
  $("#focusBtn").onclick=openFocus;
  const B=balanceIndex();
  $("#balCard").innerHTML=`<div class="head"><h2>Balance Index</h2><b class="mono" style="font-family:var(--f-display);font-size:28px">${B.idx}</b></div>
   <div style="display:flex;flex-direction:column;gap:9px">${B.parts.map(([k,v])=>`<div class="attr"><span>${k.toUpperCase()}</span><div class="meter"><i style="width:${v}%"></i></div><span class="mono">${Math.round(v)}</span></div>`).join("")}</div>
   <p class="note">Últimos 14 dias. O índice cai quando uma área fica muito para trás das outras.</p>`;
  if(!$("#tText").nextElementSibling||!$("#tText").nextElementSibling.classList.contains("mic"))$("#tText").insertAdjacentElement("afterend",micButton("#tText",null,"Falar o treino"));
};
EXTRA.nutricao=()=>{
  if(!$("#mFA")){$("#mFree").closest("label").insertAdjacentHTML("beforebegin",`<div class="row"><label class="f">Fome antes (1-10)<select id="mFA"><option value="">·</option>${[1,2,3,4,5,6,7,8,9,10].map(v=>`<option>${v}</option>`).join("")}</select></label><label class="f">Saciedade depois (1-10)<select id="mSD"><option value="">·</option>${[1,2,3,4,5,6,7,8,9,10].map(v=>`<option>${v}</option>`).join("")}</select></label></div>`);
    $("#mText").insertAdjacentElement("afterend",micButton("#mText",null,"Falar o prato"));}
  once("nutExtra",`<div class="grid2 even" id="nutExtra"><div class="card" id="nutRep"></div><div class="card" id="nutCtx"></div></div><div class="grid2 even" id="nutExtra2"><div class="card" id="homeCard"><div class="head"><h2>O que tenho em casa</h2></div><label class="f">Ingredientes<textarea id="homeTxt" rows="2" placeholder="Ex.: ovos, frango, arroz, tomate, aveia"></textarea></label><button class="btn" id="homeBtn" style="align-self:flex-start">Sugerir refeições</button><div id="homeOut"></div></div><div class="card" id="recCard2"><div class="head"><h2>Minhas receitas</h2></div><div class="row"><label class="f">Nome<input type="text" id="rcN" maxlength="50"></label><label class="f">Tempo (min)<input type="number" id="rcT"></label><label class="f">Porções<input type="number" id="rcP" value="1"></label></div><label class="f">Ingredientes e preparo<textarea id="rcI" rows="3"></textarea></label><button class="btn" id="rcAdd" style="align-self:flex-start">Salvar receita (calcula macros)</button><div class="list" id="rcList"></div></div></div>`,"#v-nutricao","beforeend");
  const days=lastNDates(7),tots=days.map(dayTotals).filter(t=>t.k>0),ws=days.map(d=>+diaryOf(d).agua||0).filter(x=>x>0),ms=meals().filter(m=>days.includes(m.d));
  const byType={};ms.forEach(m=>{const p=m.a&&m.a.total?+m.a.total.proteina||0:0;byType[m.tipo]=(byType[m.tipo]||0)+p;});
  $("#nutRep").innerHTML=`<div class="head"><h2>Relatório da semana</h2><span class="eyebrow">últimos 7 dias</span></div>
   <div class="kv"><div><small>≈ kcal/dia</small><b class="mono">${tots.length?Math.round(avg(tots.map(t=>t.k))):"·"}</b></div><div><small>Proteína/dia</small><b class="mono">${tots.length?Math.round(avg(tots.map(t=>t.p)))+" g":"·"}</b></div><div><small>Água/dia</small><b class="mono">${ws.length?fmt(avg(ws)/1000,1)+" L":"·"}</b></div><div><small>Refeições/dia</small><b class="mono">${fmt(ms.length/7,1)}</b></div></div>
   <div class="sub" style="margin-top:6px">Proteína por refeição</div><div class="chips">${Object.entries(byType).map(([k,v])=>`<span class="chip c-ice">${esc(k)} ${Math.round(v)} g</span>`).join("")||'<span class="note">Sem dados ainda.</span>'}</div>
   <p class="note">Média só dos dias com registro. Estimativas, sem meta de calorias.</p>`;
  const anx=meals().filter(m=>m.fome==="ansiedade"||m.fome==="tedio");const bucket={manha:0,tarde:0,noite:0,madrugada:0};anx.forEach(m=>{const h=+(m.at||"12").slice(0,2);bucket[h<5?"madrugada":h<12?"manha":h<18?"tarde":"noite"]++;});
  const sleepLow=[],sleepOk=[];new Set(meals().map(m=>m.d)).forEach(d=>{const s=+diaryOf(d).sono;if(!s)return;const c=mealsOn(d).filter(m=>m.fome==="ansiedade"||m.fome==="tedio").length;(s<6.5?sleepLow:sleepOk).push(c);});
  const fs=meals().filter(m=>m.fa&&m.sd);
  $("#nutCtx").innerHTML=`<div class="head"><h2>Contexto da fome</h2><span class="eyebrow">sem julgamento</span></div>
   <div class="weekbars">${Object.entries(bucket).map(([k,v])=>`<div><span class="mono">${v}</span><i style="height:${v/Math.max(1,...Object.values(bucket))*58}px"></i><span>${k}</span></div>`).join("")}</div>
   <p class="note">${sleepLow.length&&sleepOk.length?`Em noites com menos de 6,5 h de sono, média de ${fmt(avg(sleepLow),1)} refeições por ansiedade no dia, contra ${fmt(avg(sleepOk),1)} nos outros dias.`:"Registre sono e motivo das refeições para ver a relação entre sono e fome."}</p>
   ${fs.length?`<p class="note">Fome antes ${fmt(avg(fs.map(m=>m.fa)),1)} e saciedade depois ${fmt(avg(fs.map(m=>m.sd)),1)} em média (${fs.length} refeições).</p>`:""}`;
  $("#homeBtn").onclick=async()=>{const t=$("#homeTxt").value.trim();if(!t)return;if(!SAMPLE){$("#homeOut").innerHTML='<p class="note">Configure a chave grátis do Sistema em Perfil › Ajustes.</p>';return;}$("#homeOut").innerHTML='<p class="note">Pensando...</p>';
    try{const r=await SAMPLE(`Com estes ingredientes que o Vitor tem em casa: ${t}. Sugira 3 refeições simples, rápidas e com boa proteína (ele treina luta e musculação para perder gordura). Para cada uma: "## Nome", ingredientes com quantidades, preparo em 2 linhas e macros aproximados (P/C/G). Sem metas de calorias, sem sermão, sem travessões.`);$("#homeOut").innerHTML=`<div class="report">${md(r.text)}</div>`;}catch(e){$("#homeOut").innerHTML='<p class="note">Não consegui agora.</p>';}};
  const rcs=Object.entries(S.receitas||{}).map(([id,r])=>({...r,_id:id}));
  $("#rcList").innerHTML=rcs.map(r=>`<div class="item"><div><div class="ttl">${esc(r.nome)}</div><div class="meta">${r.tempo?r.tempo+" min · ":""}${r.porcoes||1} porção(ões)${r.m?` · por porção P ${r.m.p} C ${r.m.c} G ${r.m.g} ≈${r.m.k} kcal`:""}</div><details><summary>Ver</summary><p class="note" style="white-space:pre-wrap">${esc(r.texto)}</p></details></div><div class="act"><button class="btn sm" data-rcuse="${r._id}">Comi hoje</button><button class="linkbtn" data-rcdel="${r._id}">apagar</button></div></div>`).join("")||'<p class="note">Nenhuma receita salva.</p>';
  $$("[data-rcdel]").forEach(b=>b.onclick=()=>del("receitas",b.dataset.rcdel));
  $$("[data-rcuse]").forEach(b=>b.onclick=()=>{const r=S.receitas[b.dataset.rcuse];put("refeicoes",newId(),{d:todayISO(),at:new Date().toTimeString().slice(0,5),tipo:"Refeição",fome:"fome",texto:r.nome,a:r.m?{prato:r.nome,itens:[],total:{proteina:r.m.p,carbo:r.m.c,gordura:r.m.g,kcal:r.m.k},qualidade:4}:null});pop("Refeição registrada",r.nome);});
  $("#rcAdd").onclick=async()=>{const nome=$("#rcN").value.trim(),texto=$("#rcI").value.trim();if(!nome||!texto)return;const rec={nome,texto,tempo:+$("#rcT").value||null,porcoes:+$("#rcP").value||1};
    if(SAMPLE){try{const j=await SAMPLE.json(`Receita "${nome}" com ${rec.porcoes} porção(ões): ${texto}. Estime macros POR PORÇÃO. Responda só JSON {"p":g proteína,"c":g carbo,"g":g gordura,"k":kcal}`);rec.m={p:Math.round(+j.p||0),c:Math.round(+j.c||0),g:Math.round(+j.g||0),k:Math.round(+j.k||0)};}catch(e){}}
    put("receitas",newId(),rec);$("#rcN").value="";$("#rcI").value="";};
};
EXTRA.coach=()=>{
  if(!$("#coachMode")){$("#cq").insertAdjacentElement("afterend",micButton("#cq",()=>$("#cqBtn").click(),"Falar com o Sistema"));
    $("#cq").closest(".card").querySelector(".sys-title").insertAdjacentHTML("afterend",`<div class="seg" id="coachMode">${Object.keys(MODES).map(k=>`<button class="btn sm" data-cm="${k}" aria-pressed="${(LSK.get("fdd2-coach-mode")||"coach")===k}">${k==="sistema"?"Sistema":k==="coach"?"Coach":"Preventivo"}</button>`).join("")}</div>`);
    $$("[data-cm]").forEach(b=>b.onclick=()=>{LSK.set("fdd2-coach-mode",b.dataset.cm);$$("[data-cm]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));});}
  once("intel",`<div class="card sys" id="intel"></div>`,"#v-coach","beforeend");
  const tr=weightTrend(),rec=recommendations(),mem=Object.entries(S.memoria||{}).map(([id,m])=>({...m,_id:id}));
  $("#intel").innerHTML=`<div class="sys-title">Centro de inteligência</div>
   <div class="grid2 even">
    <div><div class="sub">Predição</div>${tr?`<p>Tendência de <b>${fmt(tr.perWeek,2)} kg por semana</b> nos últimos 28 dias.${tr.eta?` Nesse ritmo, 75 kg por volta de <b>${brD(tr.eta)}</b>${tr.eta>dateOf(180)?", depois do fim da campanha":""}.`:" Ainda sem tendência de queda."}</p><p class="note">Projeção simples por regressão linear dos check-ins. Muda conforme você registra.</p>`:`<p class="note">Registre pelo menos 2 pesos para ver a previsão.</p>`}</div>
    <div><div class="sub">Recomendações</div>${rec.map(r=>`<div class="advice" style="margin-bottom:6px;border-color:var(--ice);background:rgba(127,227,255,.05)"><b>${esc(r[0])}</b><br><span class="note">${esc(r[1])}</span><br><span class="note" style="color:var(--ice-dim)">${esc(r[2])}</span></div>`).join("")}</div>
   </div>
   <div><div class="sub">Memória do Sistema</div>${mem.length?`<div class="list">${mem.map(m=>`<div class="item"><div><span class="meta">${esc(m.tipo)} · ${brS(parseISO(m.d))}</span><div>${esc(m.fato)}</div></div><div class="act"><button class="linkbtn" data-mdel="${m._id}">esquecer</button></div></div>`).join("")}</div>`:`<p class="note">Vazia. Conte ao Sistema suas preferências, lesões e rotina que ele guarda.</p>`}</div>`;
  $$("[data-mdel]").forEach(b=>b.onclick=()=>del("memoria",b.dataset.mdel));
};
EXTRA.jornada=()=>{
  once("simCard",`<div class="grid2 even"><div class="card" id="simCard"><div class="head"><h2>Simulador de metas</h2></div><div class="row"><label class="f">Peso alvo (kg)<input type="number" id="simW" value="75" step="0.5"></label><label class="f">Prazo (semanas)<input type="number" id="simS" value="26"></label></div><div id="simOut"></div></div><div class="card" id="finCard"></div></div>`,"#v-jornada","beforeend");
  const sim=()=>{const w=curW(),alvo=+$("#simW").value,sem=Math.max(1,+$("#simS").value);const per=(w-alvo)/sem,pct=per/w*100;
    $("#simOut").innerHTML=`<div class="kv"><div><small>Por semana</small><b class="mono">${fmt(per,2)} kg</b></div><div><small>% do peso</small><b class="mono">${fmt(pct,2)}%</b></div></div><p class="${pct>1?"advice":"note"}">${per<=0?"Meta igual ou acima do peso atual.":pct>1?"Acima de 1% do peso por semana: agressivo, aumenta a perda de músculo. Converse com o médico antes.":pct>.7?"Ritmo puxado mas possível com acompanhamento.":"Ritmo sustentável."}</p>`;};
  $("#simW").oninput=sim;$("#simS").oninput=sim;sim();
  const t=Math.min(TOTAL,Math.max(1,TODAY()));const ws=workouts(),gym=ws.filter(w=>w.p&&w.p.tipo==="academia"),luta=ws.filter(w=>w.p&&w.p.tipo==="luta");let dn=0;for(let n=1;n<=t;n++)if(dayDone(n))dn++;
  const lvl=levelOf(xpEarned());const ach=ACH.filter(a=>a[3]()).length;const end=TODAY()>=TOTAL;
  $("#finCard").innerHTML=`<div class="sys-title">${end?"Campanha concluída":"Relatório final · prévia"}</div>
   <div style="text-align:center;display:flex;flex-direction:column;gap:6px"><span class="eyebrow">Ascensão · 2026–2027</span><b style="font-family:var(--f-display);font-size:40px;color:var(--ice)">RANK ${rankOf(lvl)}</b><span class="eyebrow">${PHASES[phaseOf(t)].toUpperCase()}</span></div>
   <div class="kv"><div><small>Dias</small><b class="mono">${t}/180</b></div><div><small>Quests</small><b class="mono">${dn}</b></div><div><small>Treinos</small><b class="mono">${ws.length}</b></div><div><small>Horas de luta</small><b class="mono">${fmt(luta.reduce((a,w)=>a+(+w.p.minutos||60),0)/60,1)}</b></div><div><small>Peso</small><b class="mono">${fmt(W0)} → ${fmt(curW())}</b></div><div><small>Conquistas</small><b class="mono">${ach}</b></div></div>
   <p class="note" style="text-align:center">${end?"Você não é mais o jogador do dia 1. A próxima temporada começa quando você quiser: peça ao Claude para abrir a Temporada 2.":"No dia 180 esta tela vira a retrospectiva completa da campanha. Depois começa a Temporada 2."}</p>`;
};
EXTRA.perfil=()=>{
  once("setCard",`<div class="card sys" id="setCard"></div>`,"#v-perfil","afterbegin");
  const key=AI.key(),tok=Sync.token();
  $("#setCard").innerHTML=`<div class="sys-title">Ajustes do Sistema</div>
   <div class="grid2 even">
    <div style="display:flex;flex-direction:column;gap:10px">
     <div class="sub">1 · Cérebro do Sistema (grátis)</div>
     <p class="note">Crie uma chave grátis no <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Google AI Studio</a> e cole aqui. Ela fica só neste aparelho. No plano grátis o Google pode usar o que você envia para melhorar os produtos dele.</p>
     <div class="row"><label class="f" style="flex:2 1 200px">Chave Gemini<input type="password" id="setKey" placeholder="${key?"chave salva · cole para trocar":"cole a chave aqui"}" autocomplete="off"></label><button class="btn pri" id="setKeyBtn">Salvar</button><button class="btn" id="setKeyTest">Testar</button></div>
     <label class="f">Modelo<input type="text" id="setModel" value="${esc(AI.model())}"></label>
     <span class="note" id="setKeyMsg">${key?"Chave configurada.":"Sem chave: coach, scanner e relatórios ficam desligados."}</span>
     <div class="sub">2 · Voz do Sistema</div>
     <div class="row"><label class="f">Motor de voz<select id="setVoice"><option value="neural">Voz neural no aparelho (natural, offline)</option><option value="device">Voz do iPhone</option></select></label></div>
     <div class="seg"><button class="btn" id="setVoiceDl">Baixar voz neural (~60 MB)</button><button class="btn" id="setVoiceTest">Testar voz</button><button class="btn" id="setVoiceOn" aria-pressed="${Voice.enabled()}">Voz ligada</button></div>
     <span class="note" id="setVoiceMsg">A voz neural é a "Faber" em português, com efeito de rádio estilo JARVIS. Para a voz do iPhone ficar melhor: Ajustes › Acessibilidade › Conteúdo Falado › Vozes › Português (Brasil) e baixe uma voz Aprimorada ou Premium.</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px">
     <div class="sub">3 · Notificações</div>
     <p class="note">Instale o app grátis <a href="https://apps.apple.com/app/ntfy/id1625396347" target="_blank" rel="noopener">ntfy</a>, toque em + e assine o tópico abaixo. Todo dia às 7h40 chega o bom dia, e tocar abre o app.</p>
     <div class="copybox mono" id="topicBox">${esc(NTFY_TOPIC)}</div>
     <div class="seg"><button class="btn sm" id="copyTopic">Copiar tópico</button><button class="btn sm" id="testNtfy">Enviar notificação de teste</button></div>
     <div class="sub">4 · Sincronizar PC e iPhone (opcional)</div>
     <p class="note">Crie um token só com permissão de Gist em <a href="https://github.com/settings/tokens/new?scopes=gist&description=Fisico%20dos%20Deuses" target="_blank" rel="noopener">GitHub › Tokens</a> e cole aqui nos dois aparelhos. Seus dados ficam num Gist secreto seu.</p>
     <div class="row"><label class="f" style="flex:2 1 200px">Token do GitHub<input type="password" id="setTok" placeholder="${tok?"token salvo":"cole o token"}" autocomplete="off"></label><button class="btn pri" id="setTokBtn">Conectar</button>${tok?'<button class="btn" id="setTokOff">Desconectar</button><button class="btn" id="syncNow">Sincronizar</button>':""}</div>
     <div class="sub">5 · Dados</div>
     <div class="seg"><label class="btn" style="cursor:pointer">Importar backup<input type="file" id="impFile" accept=".json,application/json" hidden></label><button class="btn" id="bkFull">Backup com fotos</button><button class="btn" id="undoBtn">Desfazer última ação</button><button class="btn" id="cardBtn">Cartão de status</button></div>
     <span class="note" id="impMsg"></span>
    </div>
   </div>`;
  $("#setVoice").value=Voice.engine();
  $("#setKeyBtn").onclick=()=>{const v=$("#setKey").value.trim();if(v)LSK.set("fdd2-gemini-key",v);LSK.set("fdd2-gemini-model",$("#setModel").value.trim()||"gemini-flash-latest");$("#setKey").value="";refreshAI();$("#setKeyMsg").textContent=AI.key()?"Chave salva.":"Sem chave.";};
  $("#setKeyTest").onclick=async()=>{const msg=$("#setKeyMsg");if(!AI.key()){msg.textContent="Cole e salve a chave primeiro.";return;}msg.textContent="Procurando o melhor modelo grátis...";
    try{const pick=await AI.pickModel();if(pick){LSK.set("fdd2-gemini-model",pick);$("#setModel").value=pick;}}catch(e){msg.textContent="Falhou ao listar modelos: "+(e.message||e.code);return;}
    refreshAI();msg.textContent="Testando "+AI.model()+" (reservas: "+(AI.fallbacks().join(", ")||"nenhuma")+")...";
    try{const r=await SAMPLE("Responda só: Sistema online.");msg.textContent="Funcionando com "+(AI.used||AI.model())+": "+r.text.slice(0,60);}catch(e){msg.textContent="Falhou ("+AI.model()+"): "+(e.code==="rate_limited"?"limite grátis por minuto, tente já já":(e.message||e.code));}};
  $("#setVoice").onchange=e=>LSK.set("fdd2-voice-engine",e.target.value);
  $("#setVoiceDl").onclick=async()=>{Voice.unlock();const m=$("#setVoiceMsg");m.textContent="Baixando a voz...";try{await Voice.download(p=>m.textContent="Baixando a voz: "+p+"%");m.textContent="Voz neural pronta e salva no aparelho.";LSK.set("fdd2-voice-engine","neural");$("#setVoice").value="neural";}catch(e){m.textContent="Não consegui baixar a voz neural: "+(e&&e.message||e)+". Use a voz do iPhone por enquanto.";}};
  $("#setVoiceTest").onclick=async()=>{Voice.unlock();const m=$("#setVoiceMsg");Voice.lastErr="";
    const eng=Voice.engine();const ready=eng==="neural"?await Voice.neuralReady():false;
    m.textContent=eng==="neural"?(ready?"Gerando a voz neural (a primeira vez demora alguns segundos)...":"A voz neural ainda não está baixada neste aparelho. Tocando a voz do iPhone."):"Tocando a voz do iPhone.";
    const t0=Date.now();await Voice.say("Bom dia, Vitor. Sistema online. Sua quest de hoje está pronta.",true);
    if(Voice.lastErr)m.textContent="A voz neural falhou neste aparelho ("+Voice.lastErr.slice(0,80)+"). Troque o motor para Voz do iPhone.";
    else if(eng==="neural"&&ready)m.textContent="Voz neural ok ("+Math.round((Date.now()-t0)/1000)+" s). Se não ouviu nada, confira se o iPhone está no silencioso e o volume.";};
  $("#setVoiceOn").onclick=()=>{const on=!Voice.enabled();LSK.set("fdd-voice",on);voice=on;voicePref=on;$("#setVoiceOn").setAttribute("aria-pressed",String(on));};
  $("#copyTopic").onclick=()=>{navigator.clipboard&&navigator.clipboard.writeText(NTFY_TOPIC).then(()=>pop("Sistema","Tópico copiado")).catch(()=>{});};
  $("#testNtfy").onclick=async()=>{try{await fetch("https://ntfy.sh/"+NTFY_TOPIC+"?title="+encodeURIComponent("Ascensão")+"&click="+encodeURIComponent(location.href.split("#")[0])+"&tags=crossed_swords",{method:"POST",body:"Teste do Sistema: notificações funcionando."});pop("Sistema","Notificação enviada");}catch(e){pop("Sistema","Não consegui enviar.");}};
  $("#setTokBtn").onclick=async()=>{const v=$("#setTok").value.trim();if(!v)return;LSK.set("fdd2-gh-token",v);$("#setTok").value="";await Sync.run();EXTRA.perfil();};
  const off=$("#setTokOff");if(off)off.onclick=()=>{LSK.set("fdd2-gh-token","");LSK.set("fdd2-gist-id","");setSync("salvo no aparelho");EXTRA.perfil();};
  const sn=$("#syncNow");if(sn)sn.onclick=()=>Sync.run();
  $("#impFile").onchange=async e=>{const f=e.target.files[0];if(!f)return;$("#impMsg").textContent="Importando...";try{const n=await importBackup(f);$("#impMsg").textContent=n+" registros importados.";HOLO.built=false;}catch(err){$("#impMsg").textContent="Não consegui importar: "+(err.message||err);}};
  $("#bkFull").onclick=async()=>{$("#impMsg").textContent="Gerando backup...";try{await DL.save({filename:"fisico-backup-completo-"+todayISO()+".json",data:await fullBackup(true)});$("#impMsg").textContent="";}catch(e){$("#impMsg").textContent="";}};
  $("#undoBtn").onclick=undo;$("#cardBtn").onclick=()=>statusCard().catch(()=>{});
  once("trophy",`<div class="card" id="trophy"></div>`,"#v-perfil","beforeend");
  const ex=exHistory();const prs=Object.values(ex).map(e=>({n:e.nome,b:e.pts.reduce((a,p)=>p.c>a.c?p:a,{c:0})})).filter(x=>x.b.c).sort((a,b)=>b.b.c-a.b.c);
  const bs=[];for(let n=1;n<=Math.min(TOTAL,TODAY());n++){if(isSBoss(n)&&dayDoc(n).b)bs.push("Dia "+n+": "+sboss(n).t);if(isMBoss(n)&&dayDone(n))bs.push("Dia "+n+": chefão da fase "+(phaseOf(n)+1));}
  $("#trophy").innerHTML=`<div class="head"><h2>Sala de troféus</h2></div><div class="grid2 even"><div><div class="sub">Recordes</div>${prs.length?prs.map(p=>`<div class="item"><div class="ttl">${esc(p.n)}</div><div class="mono">${fmt(p.b.c,1).replace(",0","")} kg</div></div>`).join(""):'<p class="note">Seus recordes de carga aparecem aqui.</p>'}</div><div><div class="sub">Bosses derrotados</div>${bs.length?bs.map(b=>`<div class="item"><div>${esc(b)}</div></div>`).join(""):'<p class="note">Nenhum ainda. O primeiro chefão é no dia 30.</p>'}</div></div>`;
};
