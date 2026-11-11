// ================= VOZ (neural no aparelho + voz do sistema) e MICROFONE =================
const VOICE_ID="pt_BR-faber-medium";
const Voice={ctx:null,piper:null,loading:null,gen:0,cur:null,fx:null,
  engine(){return LSK.get("fdd2-voice-engine")||"neural";},
  enabled(){return LSK.get("fdd-voice")===true;},
  lastErr:"",
  unlock(){try{if(navigator.audioSession)navigator.audioSession.type="playback";}catch(e){}
    try{if(window.speechSynthesis&&!this.primed){const u=new SpeechSynthesisUtterance(" ");u.volume=0;speechSynthesis.speak(u);this.primed=true;}}catch(e){}
    try{this.ctx=this.ctx||new (window.AudioContext||window.webkitAudioContext)();if(this.ctx.state==="suspended")this.ctx.resume();
    const b=this.ctx.createBuffer(1,1,22050),s=this.ctx.createBufferSource();s.buffer=b;s.connect(this.ctx.destination);s.start(0);}catch(e){}},
  loadPiper(){if(this.piper)return Promise.resolve(this.piper);if(!this.loading)this.loading=import("https://cdn.jsdelivr.net/npm/@mintplex-labs/piper-tts-web@1.0.4/+esm").then(m=>(this.piper=m)).catch(e=>{this.loading=null;throw e;});return this.loading;},
  async neuralReady(){try{const m=await this.loadPiper();const st=await m.stored();return st.includes(VOICE_ID);}catch(e){return false;}},
  async download(progress){const m=await this.loadPiper();await m.download(VOICE_ID,p=>{if(progress&&p&&p.total)progress(Math.round(p.loaded/p.total*100));});
    const st=await m.stored();if(!st.includes(VOICE_ID))throw new Error("o aparelho não guardou o arquivo da voz");},
  chain(){if(this.fx)return this.fx;const c=this.ctx;
    const inp=c.createGain(),hp=c.createBiquadFilter(),pk=c.createBiquadFilter(),comp=c.createDynamicsCompressor(),dry=c.createGain(),wet=c.createGain(),dl=c.createDelay(),fb=c.createGain(),out=c.createGain();
    hp.type="highpass";hp.frequency.value=110;pk.type="peaking";pk.frequency.value=2600;pk.gain.value=3.5;pk.Q.value=.9;
    comp.threshold.value=-20;comp.ratio.value=3;dl.delayTime.value=.017;fb.gain.value=.22;wet.gain.value=.2;dry.gain.value=.95;out.gain.value=1.15;
    inp.connect(hp);hp.connect(pk);pk.connect(comp);comp.connect(dry);dry.connect(out);comp.connect(dl);dl.connect(fb);fb.connect(dl);dl.connect(wet);wet.connect(out);out.connect(c.destination);
    return(this.fx=inp);},
  async play(blob,g){if(this.ctx&&this.ctx.state!=="running")await this.ctx.resume().catch(()=>{});const buf=await this.ctx.decodeAudioData(await blob.arrayBuffer());if(g!==this.gen)return;
    return new Promise(res=>{const s=this.ctx.createBufferSource();s.buffer=buf;s.connect(this.chain());s.onended=res;this.cur=s;s.start();});},
  split(t){const parts=String(t).replace(/[#*_>`\[\]]/g," ").replace(/\s+/g," ").trim().match(/[^.!?]+[.!?]*/g)||[];const out=[];let cur="";
    parts.forEach(p=>{if((cur+p).length>180&&cur){out.push(cur.trim());cur=p;}else cur+=p;});if(cur.trim())out.push(cur.trim());return out;},
  async say(text,force){if(!force&&!this.enabled())return;this.stop();const g=this.gen;if(!text)return;
    if(this.engine()==="neural"&&await this.neuralReady()){
      try{const ss=this.split(text);let next=this.piper.predict({text:ss[0],voiceId:VOICE_ID});
        for(let i=0;i<ss.length;i++){const wav=await next;if(g!==this.gen)return;next=i+1<ss.length?this.piper.predict({text:ss[i+1],voiceId:VOICE_ID}):null;await this.play(wav,g);if(g!==this.gen)return;}
        return;}catch(e){this.lastErr=String(e&&e.message||e);console.warn("voz neural falhou",e);}}
    this.device(text);},
  bestVoice(){const vs=(window.speechSynthesis&&speechSynthesis.getVoices())||[];let best=null,bs=-1;
    vs.forEach(v=>{let s=0;if(/pt[-_]BR/i.test(v.lang))s+=20;else if(/^pt/i.test(v.lang))s+=8;else return;if(/premium|enhanced|aprimorad|neural|natural/i.test(v.name))s+=10;if(/felipe|daniel|ricardo|antonio|male/i.test(v.name))s+=3;if(s>bs){bs=s;best=v;}});return best;},
  device(t){if(!window.speechSynthesis)return;try{speechSynthesis.cancel();this.split(t).forEach(p=>{const u=new SpeechSynthesisUtterance(p);u.lang="pt-BR";u.rate=1;u.pitch=.92;const v=this.bestVoice();if(v)u.voice=v;speechSynthesis.speak(u);});}catch(e){}},
  stop(){this.gen++;try{window.speechSynthesis&&speechSynthesis.cancel();}catch(e){}try{this.cur&&this.cur.stop();}catch(e){}this.cur=null;}};
if(window.speechSynthesis)speechSynthesis.onvoiceschanged=()=>{};

const Mic={SR:window.SpeechRecognition||window.webkitSpeechRecognition,active:null,
  start(el,btn,onFinal){if(this.active){this.active.stop();return;}
    if(!this.SR){pop("Microfone","Use o microfone do teclado do iPhone para ditar.");el.focus();return;}
    Voice.stop();const r=new this.SR();r.lang="pt-BR";r.interimResults=true;r.continuous=false;const base=el.value.trim();let finalText="";
    r.onresult=e=>{let t="";for(let i=0;i<e.results.length;i++)t+=e.results[i][0].transcript;finalText=t;el.value=(base?base+" ":"")+t;};
    r.onerror=e=>{pop("Microfone",e.error==="not-allowed"||e.error==="service-not-allowed"?"Permita o microfone ou use o do teclado.":"Não entendi. Tente de novo ou use o teclado.");};
    r.onend=()=>{btn.classList.remove("rec");btn.setAttribute("aria-pressed","false");this.active=null;if(onFinal&&finalText.trim())onFinal();};
    try{r.start();this.active=r;btn.classList.add("rec");btn.setAttribute("aria-pressed","true");}catch(e){pop("Microfone","Use o microfone do teclado.");}}};
const MIC_SVG='<svg viewBox="0 0 24 24" aria-hidden="true" style="width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
function micButton(targetSel,onFinal,label){const b=document.createElement("button");b.type="button";b.className="btn mic";b.innerHTML=MIC_SVG+(label?"<span>"+label+"</span>":"");b.setAttribute("aria-label","Falar");
  b.onclick=()=>{Voice.unlock();Mic.start($(targetSel),b,onFinal);};return b;}
