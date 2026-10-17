// @ts-nocheck
// Transitional runtime extracted from legacy-app/index.html. Feature views still
// render imperatively; migrate them individually instead of disguising this as TS.
import { createLifecycle } from '../lib/lifecycle'
import { iso, parse, addD, mon, fp, ft } from '../lib/format'
import { mountMap } from '../lib/map'
import { adjust } from '../features/today/adjustment'
import { supabaseConfig } from '../config/supabase'

export function initializeLegacyApp({ onTabChange, onCoachChange, onTodayChange }) {
const lifecycle = createLifecycle();
const { setTimeout, clearTimeout, setInterval } = lifecycle;
try {
const D=864e5,A=[[49,15],[48,35],[47,50],[40,70],[37,66],[29,78],[22,90],[21,86],[20,70],[16,90],[5,120],[3,96],[2,72],[1,50],[0,45]];
const $=s=>document.querySelector(s),pad=n=>String(n).padStart(2,'0');
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const r1=x=>Math.round(x*10)/10;
const LS={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
let USERS=[];try{USERS=JSON.parse(LS.get('moach_users')||'[]')||[]}catch(e){}
let UID=LS.get('moach_cur')||'';
if(!USERS.length){let lk=null;try{lk=JSON.parse(LS.get('mplan_icu')||'null')}catch(e){}
 if(lk&&lk.key){const id='u1';let nm='Läufer';const old=LS.get('mplan2');try{nm=(JSON.parse(old||'{}').prof||{}).name||nm}catch(e){}
  if(old)LS.set('mplan2_'+id,old);LS.set('mplan_icu_'+id,JSON.stringify(lk));USERS=[{id,name:nm}];LS.set('moach_users',JSON.stringify(USERS));UID=id;LS.set('moach_cur',id)}}
if(!USERS.some(u=>u.id===UID))UID='';
const DEF=()=>({start:null,runs:[],rd:42.195,goalT:null,noPlan:false,hist:[],race:'2027-09-26',goal:9900,base:11400,res:[],log:{},chk:{},well:{},prof:{}});let S=DEF();
try{const x=UID&&LS.get('mplan2_'+UID);if(x)S=Object.assign(S,JSON.parse(x))}catch(e){}
let ICU={id:'',key:''};
try{const x=LS.get('mplan_icu_'+UID);if(x)ICU=JSON.parse(x)}catch(e){}
let START=parse(S.start||'2026-10-12');
const setSync=t=>{const e=$('#sy');if(e)e.textContent=t;const f=$('#icust');if(f)f.textContent=t};
/* ===== Cloud (Supabase): Grundlagen ===== */
const SB_DEFAULT=supabaseConfig;
const sbNorm=v=>{v=String(v||'').trim();if(v&&!/^[a-z]+:\/\//i.test(v))v='https://'+v;try{const x=new URL(v);return x.protocol=='https:'?x.origin:''}catch(e){return''}};
const SBC=()=>{let o=null;try{o=JSON.parse(LS.get('moach_sb')||'null')}catch(e){}const c=o&&o.url&&o.key?o:SB_DEFAULT;return{url:sbNorm(c.url)||String(c.url||'').trim().replace(/\/+$/,''),key:String(c.key||'').trim()}};
const sbOn=()=>{const c=SBC();return /^https:\/\/[^\s\/]+$/.test(c.url)&&c.key.length>20};
const CL={ses:null,adm:null,reqs:null,names:{},shared:{},err:'',busy:0,pulled:false,pushing:0,sig:'',shSig:'',rsig:'',bak:0,bakAt:0,choice:null,t:0};
try{CL.ses=JSON.parse(LS.get('moach_sbs_'+UID)||'null')}catch(e){}
const store=nostamp=>{if(UID){if(!nostamp)S._m=Date.now();LS.set('mplan2_'+UID,JSON.stringify(S));cloudSoon()}};
const save=()=>store();
const now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
const wtr=d=>Math.round((mon(parse(S.race))-mon(d))/(7*D));
const LEG={tw:49,T:[48,38,30,21,17],S:13,A:[[49,15],[48,35],[47,50],[40,70],[37,66],[29,78],[22,90],[21,86],[20,70],[16,90],[5,120],[3,96],[2,72],[1,50],[0,45]],cap:34,ls:.285,tl:[14,18,24],roles:['rest','q1','easy','q2','str','easy','long'],W:[0,.21,.24,.22,.16,.17,0],strD:[2,4],test:21,recov:20,first:49,fw:[2,4],mul:false};
const CF=()=>S.cfg||LEG;
const TPW=()=>{const C=CF();return C.tp==null?4:C.tv>=2?C.tp:C.tp+1};
const RD=()=>S.rd||42.195,GT=()=>S.goalT||S.goal,rpace=()=>GT()/RD();
const RN=()=>{const k=RD();return k>=40?'MARATHON':k>=20?'HALBMARATHON':Math.round(k)+' KM'};
const ph=w=>{const C=CF(),T=C.T;if(C.mode=='maintain')return'Erhaltung';return w>=T[0]?'Regeneration':w>=T[1]?'Grundlagen':w>=T[2]?'Tempoentwicklung':w>=T[3]?'Schwelle & Test':w>=T[4]?'Entlastung + Basis':w>=TPW()?(RD()<30?'Wettkampfspezifisch':'Marathonspezifisch'):'Tapering'};
function vol(w){const A=CF().A;if(w>=A[0][0])return A[0][1];if(w<=0)return A[A.length-1][1];for(let i=0;i<A.length-1;i++){const[a,x]=A[i],[b,y]=A[i+1];if(w<=a&&w>=b)return a==b?x:y+(x-y)*(w-b)/(a-b)}return A[A.length-1][1]}
const gp=()=>S.goal/42.195;
const WF=d=>{const a=S.wkadj;return a&&a[iso(mon(d))]||1};
function expP(d){const b=S.base/42.195,e=addD(mon(parse(S.race)),-35),f=Math.max(0,Math.min(1,(d-START)/(e-START)));return b+(gp()-b)*f}
function fitP(){let b=null;for(const r of S.res){const p=r.sec*Math.pow(42.195/r.km,1.06)/42.195;if(!b||r.d>=b.d)b={d:r.d,p,r}}return b}
function Z(d){const f=fitP();let P=f?f.p:expP(d);P=Math.max(P,gp());return{mp:P,e1:P*1.16,e2:P*1.3,t:P*.945,i:P*.91,r:P*.87}}
let AD={f:1,msg:'Noch zu wenig Daten – trage deine Läufe ein, dann passt sich der Plan an.'};
function calcAd(){let pl=0,ac=0,rs=[],n=0;AD={f:1,msg:AD.msg};
 for(let i=1;i<=14;i++){const d=addD(today,-i);if(d<START)break;const p=plan(d,1),l=S.log[iso(d)];if(p&&p.km)pl+=p.km;if(l&&l.done){n++;ac+=+l.km||0;if(l.rpe&&i<=7)rs.push(+l.rpe)}}
 if(n<3||pl<20){AD={f:1,msg:'Noch zu wenig Daten – trage mindestens 3 Läufe ein, dann passt sich der Plan an.'};return}
 const c=ac/pl,rp=rs.length?rs.reduce((a,b)=>a+b)/rs.length:0;
 if(rp>=8)AD={f:.85,msg:`Hohe Belastung (RPE Ø ${rp.toFixed(1)}) → Umfang der nächsten 14 Tage −15 %.`};
 else if(c<.8)AD={f:.9,msg:`Nur ${Math.round(c*100)} % des Plan-Umfangs der letzten 14 Tage geschafft → nächste 14 Tage −10 %.`};
 else AD={f:1,msg:`Plan wird gut umgesetzt (${Math.round(c*100)} % Umfang) – keine Anpassung nötig.`}}
function histSeg(d){const k=iso(d),H=S.hist||[];for(let i=H.length-1;i>=0;i--)if(H[i].start<=k&&k<=H[i].until)return H[i];return null}
function plan(d,na){
 if(S.noPlan||d<START){const g=histSeg(d);return g?withPlan(g,()=>planCur(d,1)):null}
 const sr=S.mv&&S.mv[iso(d)];
 if(sr&&sr!==iso(d)){const q=planCur(parse(sr),na);if(q)return Object.assign({},q,{mv:sr})}
 return planCur(d,na)}
function planM(d,na,C){
 const dw=(d.getDay()+6)%7,ro=C.roles[dw],z=Z(d),r=fp,wk=Math.round((mon(d)-mon(START))/(7*D)),dl=wk%4==3;
 let V=C.A[0][1];if(dl)V*=.8;V*=WF(d);if(!na&&d>=today&&d<=addD(today,13))V*=AD.f;
 const str=C.strD.includes(dw)?'Kraft zu Hause 20–25 min: einbeinige Kniebeuge, Hip Thrust, Wadenheben, Plank':'';
 const easy=(k,x)=>({t:'easy',lab:'Locker',km:k,str,d:`${k} km locker @ ${r(z.e1)}–${r(z.e2)} /km${x||''}`});
 if(ro=='rest')return{t:'rest',lab:'Recovery',km:0,d:'Ruhetag. Optional 15 min Mobility.'};
 const L=Math.min(C.cap,Math.round(V*C.ls)),km=ro=='long'?L:Math.round(Math.max(0,V-L)*C.W[dw]);
 if(ro=='easy')return easy(km);
 if(ro=='str')return easy(km,' + 6 × 20 s Steigerungsläufe');
 if(ro=='q1'||ro=='q2'){
  if(dl)return easy(km);
  const Q=(l,k,t)=>({t:'q',lab:l,km:k,str,d:`${k} km gesamt: ${t}`}),v=wk%3;
  if(ro=='q1')return v==0?Q('Fahrtspiel',km,`6 × 2 min zügig (${r(z.t)}), je 2 min locker`):v==1?Q('Tempo',km,`20 min @ ${r(z.t)} (Schwelle) im Lauf`):Q('Hügel',km,'locker, davon 6 × 60 s bergauf kräftig (Trabpause)');
  return v==0?Q('Intervalle',km,`Einlaufen + 5 × 800 m @ ${r(z.i)} (90 s Pause)`):v==1?Q('Schwelle',km,`3 × 8 min @ ${r(z.t)} (2 min Pause)`):Q('Tempo',km,`15 min @ ${r(z.t)} im Lauf`)}
 return{t:'long',lab:'Longrun',km:L,d:`${L} km @ ${r(z.e1)}–${r(z.e2)}`}}
function planCore(d,na){
 if(d<START)return null;const rd=parse(S.race);if(d>rd)return null;
 const C=CF(),T=C.T;
 if(C.mode=='maintain')return planM(d,na,C);
 const role=C.roles,w=wtr(d),dw=(d.getDay()+6)%7,z=Z(d),r=fp,ro=role[dw],K=RD(),short=K<30,N=TPW()-1;
 if(iso(d)==S.race)return{t:'race',lab:RN(),km:K>=40?42.2:r1(K),d:K>=40?`Renntag! Ziel ${ft(S.goal)} (${r(gp())}/km). Erste 10 km kontrolliert bei ca. ${r(gp()*1.02)}/km.`:`Renntag! Ziel ${ft(GT())} (${r(rpace())}/km). ${K>=20?'Erste 3 km kontrolliert bei ca. '+r(rpace()*1.02)+'/km.':'Erste 1–2 km nicht schneller als Zielpace, ab Km 3 dranbleiben.'}`};
 let V=vol(w);if(C.mul){if(w==C.test)V*=.95;else if(w==C.recov)V*=.78}
 if(deload(w))V*=.78;
 V*=WF(d);
 if(!na&&d>=today&&d<=addD(today,13))V*=AD.f;
 const rest={t:'rest',lab:'Recovery',km:0,d:'Ruhetag. Optional 15 min Mobility.'};
 const str=C.strD.includes(dw)&&w<T[0]?'Kraft zu Hause 20–25 min: einbeinige Kniebeuge, Hip Thrust, Wadenheben, Plank':'';
 const easy=(k,x)=>({t:'easy',lab:'Locker',km:k,str,d:`${k} km locker @ ${r(z.e1)}–${r(z.e2)} /km${x||''}${V>=100&&k>=14?' · Doppeleinheit möglich (AM/PM)':''}`});
 if(ro=='rest')return rest;
 if(w>=C.first){if(C.fw.includes(dw))return easy(6);if(ro=='long')return{t:'long',lab:'Locker',km:8,d:'8 km ganz locker, Regenerationswoche.'};return rest}
 let L=V<30?Math.round(V*.25):Math.min(C.cap,Math.round(V*C.ls));
 if(w>=1&&w<=N&&C.tl[w-1]!=null)L=C.tl[w-1];
 const km=ro=='long'?L:Math.round(Math.max(0,V-L)*C.W[dw]);
 if(w==0&&ro=='long')return easy(Math.min(8,Math.max(4,Math.round(V*.15))),' + Steigerungsläufe');
 const Q=(l,k,t)=>({t:'q',lab:l,km:k,str,d:`${k} km gesamt: ${t}`});
 if(ro=='easy')return easy(km);
 if(ro=='str')return easy(km,' + 6 × 20 s Steigerungsläufe');
 if(ro=='q1'||ro=='q2'){const a=ro=='q1';
  if(w>=T[0]||w==C.recov)return easy(km);
  if(w>=T[1])return a?Q('Hügel',km,'locker, davon 8 × 60 s bergauf kräftig (Trabpause)'):Q('Fahrtspiel',km,`6 × 2 min zügig (${r(z.t)}), je 2 min locker`);
  if(w>=T[2]){const n=6+(T[1]-1-w)%3;return a?Q('Intervalle',km,`Einlaufen + ${n} × 1000 m @ ${r(z.i)} (90 s Pause)`):Q('Tempo',km,`20 min @ ${r(z.t)} (Schwelle) im Lauf`)}
  if(w>=T[3])return a?Q('Schwelle',km,`4 × 2 km @ ${r(z.t)} (2 min Pause)`):Q('Tempo-DL',km,`${Math.min(km-4,8+(T[2]-1)-w,14)} km @ ${r(z.t)}`);
  if(w>=T[4])return a?Q('Intervalle',km,`5 × 1000 m @ ${r(z.i)} (90 s Pause)`):Q('Tempo-DL',km,`${Math.min(10,km-4)} km @ ${r(z.t)}`);
  if(w>N){
   if(short&&a){const seg=K>=20?2000:K>=8?1000:600,top=N+C.S,n0=K>=20?3+Math.floor((top-w)/3):K>=8?5+Math.floor((top-w)/2):6+Math.floor((top-w)/2),nmax=K>=20?6:K>=8?8:10;
    const n=Math.max(2,Math.min(Math.min(nmax,n0),Math.floor((km-4)*1000/seg)));
    return Q('Racepace',km,`Einlaufen + ${n} × ${seg} m @ ${r(rpace())} (${seg>=2000?'2 min':'90 s'} Pause)`)}
   const m=Math.max(10,Math.min(20,Math.round(8+(N+C.S-w)*1.1)));return a?Q('MRT-Block',km,`${Math.min(m,km-4)} km @ ${r(z.mp)} in 2–3 Blöcken (1 km locker dazwischen)`):Q('Schwelle',km,`3 × 3 km @ ${r(z.t)} (2 min Pause)`)}
  if(w>=1){if(short&&a)return Q('Racepace',km,`${w>=3?4:3} × 1000 m @ ${r(rpace())} (2 min Pause)`);return a?Q('MRT',km,`${w>=3?10:8} km @ ${r(z.mp)}`):Q('Schärfe',km,`5 × 1000 m @ ${r(z.i)}`)}
  return a?Q('Aktivierung',km,`3 × 2 min @ ${r(short?rpace():z.mp)}`):easy(km,' + Steigerungsläufe')}
 if(w==C.test){const td=K>=15?10:5;return{t:'race',lab:'Testlauf',km:td+5,d:`Testwettkampf ${td} km (Ziel ca. ${ft(S.goal*Math.pow(td/42.195,1.06))}) plus Ein-/Auslaufen. Ergebnis unter „Leistung“ eintragen – danach passen sich alle Paces an.`}}
 if(w>=T[0]||w==C.recov)return{t:'long',lab:'Longrun',km:L,d:`${L} km locker @ ${r(z.e1)}–${r(z.e2)}`};
 if(!short&&w>N&&w<=N+C.S&&w%2==0){const m=Math.max(8,Math.min(22,Math.round(L*.55)));return{t:'long',lab:'Longrun MRT',km:L,d:`${L} km: locker, die letzten ${m} km @ ${r(z.mp)}`}}
 return{t:'long',lab:'Longrun',km:L,d:`${L} km @ ${r(z.e1)}–${r(z.e2)}${L>=28?' · Verpflegung üben':''}`}}
/* ===== Vorbereitungswettkämpfe ===== */
const TKL=km=>Math.abs(km-42.195)<.3?'Marathon':Math.abs(km-21.0975)<.3?'Halbmarathon':r1(km)+' km';
const TKS=km=>Math.abs(km-42.195)<.3?'Marathon':Math.abs(km-21.0975)<.3?'HM':r1(km)+' km';
function tuneTarget(km){let m=null;
 try{const P=progn(),x=P[km];if(x)return x.sec;m=P[42.195]}catch(e){}
 const f=fitP(),mar=m?m.sec:(f?f.p*42.195:S.base);return mar*Math.pow(km/42.195,1.06)}
function tuneDay(t,d,p){
 const km=+t.km,full=t.m!='t',lab=TKL(km),tg=tuneTarget(km),add=km>=40?0:km>=15?3:5,nm=(t.n||'').trim();
 const head=(nm?esc(nm)+': ':'')+lab+'-Wettkampf als Vorbereitung. ';
 const body=full
  ?'Voller Einsatz, Ziel ca. '+(tg>=3600?ft(tg):fp(tg))+' ('+fp(tg/km)+' /km, geschätzt aus deinem aktuellen Stand). Einlaufen, 3–4 Steigerungen, die ersten 2 km kontrolliert. Trage das Ergebnis danach unter „Leistung“ ein, dann passen sich deine Paces an.'
  :'Als Trainingsreiz: kontrolliert bis zügig laufen, etwa '+fp(tg/km*1.04)+' /km. Kein Taper davor, danach geht es normal weiter.';
 return{t:'race',lab:'WK '+TKS(km),ttl:(nm||'Vorbereitungswettkampf')+' · '+lab,km:r1(km+add),d:head+body}}
function tuneSoft(d,km,txt){const z=Z(d);return{t:'easy',lab:'Locker',km,str:'',d:km+' km sehr locker @ '+fp(z.e1)+'–'+fp(z.e2)+' /km. '+txt}}
function tuneOv(d,p){
 const T=S.tune,k=iso(d);
 for(const t of T)if(t.d==k)return tuneDay(t,d,p);
 for(const t of T){const td=parse(t.d),df=Math.round((d-td)/D),km=+t.km,full=t.m!='t',lab=TKL(km);
  const pre=full?(km>=10?2:1):1,post=full?(km>=30?3:km>=19?2:1):(km>=15?1:0);
  if(p.lab=='Testlauf'&&Math.abs(df)<=6&&km>=5)return tuneSoft(d,10,'Der Wettkampf in dieser Woche ersetzt den Testlauf.');
  if(df<0&&df>=-pre){
   if(p.t=='rest')return p;
   if(df==-1)return tuneSoft(d,Math.max(4,Math.min(6,Math.round(p.km)||6)),'Morgen ist Wettkampf ('+lab+'). Dazu 4 × 20 s Steigerungen, früh ins Bett.');
   if(p.t=='q'||p.t=='long'||p.t=='race')return tuneSoft(d,Math.max(4,Math.min(10,Math.round(p.km*.7))),'Statt Qualität: In 2 Tagen ist Wettkampf ('+lab+'), die Beine sollen frisch sein.');
   return p}
  if(df>0&&df<=post){
   if(p.t=='rest')return p;
   if(df==1&&km>=19)return{t:'rest',lab:'Recovery',km:0,d:'Ruhetag nach dem '+lab+'-Wettkampf. Optional 15 min Mobility oder lockeres Gehen.'};
   if(df==1&&full)return tuneSoft(d,Math.min(6,Math.max(3,Math.round(p.km*.6)||5)),'Erholung nach dem Wettkampf, ganz ohne Tempo.');
   if(p.t=='q'||p.t=='long'||p.t=='race')return tuneSoft(d,Math.max(4,Math.min(10,Math.round(p.km*.65))),'Statt Qualität: Erholung nach dem Wettkampf ('+lab+').');
   return p}}
 return p}
function planCur(d,na){const p=planCore(d,na),T=S.tune;let q=p;if(p&&T&&T.length&&iso(d)!=S.race&&p.lab!=RN())q=tuneOv(d,p);const q2=repOv(d,q);if(q2&&q2.str&&wtr(d)<1)return Object.assign({},q2,{str:''});if(q2&&q2.str){const m=krMeta(d);return Object.assign({},q2,{kr:m.s,krs:m.n,str:'Krafttraining nach dem Lauf, Einheit '+m.s+' ('+KSD[m.s]+'), 20–25 min'})}return q2}
const TP={0:{f:[],tl:[]},1:{f:[.6],tl:[.55]},2:{f:[.5,.7],tl:[.45,.65]},3:{f:[.42,.6,.8],tl:[.41,.53,.71]},4:{f:[.42,.57,.72,.85],tl:[.41,.53,.71,.8]}};
const defTaper=rd=>rd>40?3:rd>20?2:1;
const tuneLimit=(race)=>iso(addD(parse(race),-14));
const tuneSort=L=>L.sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:0);
function tuneEditor(list,race,start,onChange,root){
 const minD=iso(parse(start)>today?parse(start):today),maxD=tuneLimit(race);
 const rows=tuneSort(list).map((t,i)=>'<div class="tn2"><div><b>'+dfull(parse(t.d))+'</b><small>'+(t.n?esc(t.n)+' · ':'')+TKL(+t.km)+' · '+(t.m=='t'?'Trainingswettkampf':'Voller Einsatz')+'</small></div><button type="button" data-tdel="'+t.id+'" aria-label="Entfernen">✕</button></div>').join('');
 const sel=[[5,'5 km'],[10,'10 km'],[15,'15 km'],[21.0975,'Halbmarathon'],[30,'30 km'],[42.195,'Marathon']];
 const st=root._st||(root._st={m:'a',k:10,d:'',n:''});
 root.innerHTML=(rows||'<div class="mu" style="font-size:.88rem;margin:4px 0">Noch keine Vorbereitungswettkämpfe.</div>')
  +'<div class="f" style="margin-top:8px"><label>Datum<input type="date" id="ted" min="'+minD+'" max="'+maxD+'" value="'+esc(st.d)+'"></label><label>Distanz<select id="tek">'+sel.map(x=>'<option value="'+x[0]+'"'+(Math.abs(x[0]-st.k)<.01?' selected':'')+'>'+x[1]+'</option>').join('')+'</select></label></div>'
  +'<div class="f"><label>Name (optional)<input id="ten" maxlength="40" placeholder="z. B. Stadtlauf" value="'+esc(st.n)+'"></label></div>'
  +'<div class="cr" style="margin-top:6px"><button type="button" class="chip '+(st.m=='a'?'on':'')+'" data-tm="a">Voller Einsatz</button><button type="button" class="chip '+(st.m=='t'?'on':'')+'" data-tm="t">Trainingswettkampf</button></div>'
  +'<small>'+(st.m=='a'?'Davor wird kurz entlastet, danach erholst du dich. Ein Testlauf in derselben Woche entfällt, das Ergebnis zählt für deine Paces.':'Locker bis zügig als Trainingsreiz: nur am Vortag kürzer, danach normal weiter.')+' Mindestens 2 Wochen vor dem Hauptrennen.</small>'
  +'<div id="tee" class="aerr" hidden></div><div class="b"><button type="button" id="tea">+ Wettkampf hinzufügen</button></div>';
 const rd=()=>{st.d=root.querySelector('#ted').value;st.k=+root.querySelector('#tek').value;st.n=root.querySelector('#ten').value};
 root.querySelectorAll('[data-tm]').forEach(b=>b.onclick=()=>{rd();st.m=b.dataset.tm;tuneEditor(list,race,start,onChange,root)});
 root.querySelectorAll('[data-tdel]').forEach(b=>b.onclick=()=>{const i=list.findIndex(x=>x.id==b.dataset.tdel);if(i>=0)list.splice(i,1);tuneEditor(list,race,start,onChange,root);onChange()});
 root.querySelector('#tea').onclick=()=>{rd();const e=root.querySelector('#tee');let m='';
  if(!st.d)m='Bitte wähle ein Datum.';else if(st.d<minD)m='Der Wettkampf muss nach dem Planstart liegen ('+dfull(parse(minD))+' oder später).';else if(st.d>maxD)m='Der Wettkampf muss mindestens 2 Wochen vor dem Hauptrennen liegen (spätestens '+dfull(parse(maxD))+').';else if(list.some(x=>x.d==st.d))m='An diesem Tag ist schon ein Wettkampf eingetragen.';
  if(m){e.textContent=m;e.hidden=false;return}
  list.push({id:'t'+Date.now().toString(36)+Math.random().toString(36).slice(2,4),d:st.d,km:st.k,m:st.m,n:st.n.trim()});st.d='';st.n='';
  tuneEditor(list,race,start,onChange,root);onChange()}}
function openTune(){
 const m=$('#md');m.hidden=false;
 const list=(S.tune||[]).map(x=>Object.assign({},x)),st=S.start||iso(START);
 const done=()=>{S.tune=list.length?tuneSort(list.slice()):null;save()};
 m.innerHTML='<div class="box"><h3>Vorbereitungswettkämpfe'+inf('tune')+'</h3><div class="sub">Weitere Wettkämpfe vor dem Hauptrennen. Der Plan entlastet davor und plant danach Erholung ein.</div><div id="tebox"></div><div class="b"><button class="pri" id="tecl">Fertig</button></div></div>';
 tuneEditor(list,S.race,st,done,$('#tebox'));
 $('#tecl').onclick=()=>{m.hidden=true;render()}}
/* ===== Kalender: Ansichten, Einheit im Detail, Verschieben ===== */
const fdur=s=>{const mn=Math.round(s/60);return mn>=60?Math.floor(mn/60)+':'+pad(mn%60)+' h':mn+' min'};
const km1=x=>String(r1(x)).replace('.',',');
function wkSegs(p,d){
 if(!p||!(p.km>0)||p.t=='rest')return null;
 const z=Z(p.mv?parse(p.mv):d),eM=(z.e1+z.e2)/2,jg=z.e2*1.1,T=p.d||'',body=T.replace(/^[\d.,]+ km gesamt: /,''),num=s=>+String(s).replace(',','.');
 const PS=s=>{const m=/(\d+):(\d\d)/.exec(s||'');return m?+m[1]*60+ +m[2]:null};
 const er=fp(z.e1)+'–'+fp(z.e2)+' /km',core=[],steps=[],notes=[],tips=[];
 const seg=(k,lab,km,sec,pace)=>({k,lab,km:km!=null?km:sec/pace,sec:sec!=null?sec:km*pace,pace});
 const pz=(v,u,def)=>v?(u=='min'?+v*60:+v):def,pt=s=>s>=120&&s%60==0?(s/60)+' min':Math.round(s)+' s';
 const kd=pc=>Math.abs(pc-z.mp)<5?'m':'w';
 let m,fill=true,single=false;
 const reps=(n,dist,secw,pc,ps,what,pl)=>{
  for(let i=0;i<n;i++){core.push(seg(kd(pc),what,dist,secw,pc));if(i<n-1&&ps>0)core.push(seg('j','Trabpause',null,ps,jg))}
  const one=dist!=null?dist*pc:secw;
  steps.push({k:kd(pc),t:n+' × '+what,x:'@ '+fp(pc)+' /km · je ≈ '+fp(one)});
  if(n>1&&ps>0)steps.push({k:'j',t:'Trabpause',x:pt(ps)+' '+(pl||'locker traben')+', '+(n-1)+' ×'});
  tips.push('Trabpause heißt: locker weitertraben, nicht stehen bleiben. Die letzte Wiederholung soll so schnell sein wie die erste.')};
 if(p.t=='race'&&p.lab!='Testlauf'){
  const mm=/\((\d+:\d\d) \/km/.exec(T)||/etwa (\d+:\d\d)/.exec(T),pc=/Renntag/.test(T)?(RD()>=40?gp():rpace()):(mm?PS(mm[1]):z.t);
  const tn=(S.tune||[]).find(x=>x.d==iso(d)),rk=tn?+tn.km:p.km,rem=p.km-rk;
  if(rem>=0.4){core.push(seg('e','Einlaufen',rem/2,null,eM))}
  core.push(seg('r',p.lab,rk,null,pc));
  if(rem>=0.4)core.push(seg('e','Auslaufen',rem/2,null,eM));
  if(rem>=0.4)steps.push({k:'e',t:'Einlaufen',x:km1(rem/2)+' km · '+er});
  steps.push({k:'r',t:/Renntag/.test(T)?'Rennen':'Wettkampf',x:km1(rk)+' km @ '+fp(pc)+' /km · ≈ '+fdur(rk*pc)});
  if(rem>=0.4)steps.push({k:'e',t:'Auslaufen',x:km1(rem/2)+' km · '+er});
  fill=false}
 else if(p.lab=='Testlauf'&&(m=/Testwettkampf (\d+) km \(Ziel ca\. ([\d:]+)/.exec(T))){
  const td=+m[1],ts=m[2].split(':').map(Number).reduce((a,x)=>a*60+x,0);
  core.push(seg('r','Test '+td+' km',td,null,ts/td));steps.push({k:'r',t:'Testwettkampf '+td+' km',x:'Ziel ≈ '+(ts>=3600?ft(ts):fp(ts))+' · '+fp(ts/td)+' /km'})}
 else if(m=/(\d+) × (\d+) m @ (\d+:\d\d)(?: \((\d+) (s|min) Pause\))?/.exec(body)){const n=+m[1],dm=+m[2];reps(n,dm/1000,null,PS(m[3]),pz(m[4],m[5],90),dm+' m')}
 else if(m=/(\d+) × (\d+(?:,\d+)?) km @ (\d+:\d\d)(?: \((\d+) (s|min) Pause\))?/.exec(body)){const n=+m[1],dk=num(m[2]);reps(n,dk,null,PS(m[3]),pz(m[4],m[5],120),m[2]+' km')}
 else if(m=/(\d+) × (\d+) min zügig \((\d+:\d\d)\), je (\d+) min locker/.exec(body)){reps(+m[1],null,m[2]*60,PS(m[3]),m[4]*60,m[2]+' min zügig','locker traben')}
 else if(m=/(\d+) × (\d+) min @ (\d+:\d\d)(?: \((\d+) (s|min) Pause\))?/.exec(body)){reps(+m[1],null,m[2]*60,PS(m[3]),pz(m[4],m[5],+m[2]>=6?120:90),m[2]+' min')}
 else if(m=/(\d+) × (\d+) s bergauf kräftig/.exec(body)){
  const n=+m[1],sc=+m[2];for(let i=0;i<n;i++){core.push(seg('w','Berg '+sc+' s',null,sc,z.t));if(i<n-1)core.push(seg('j','Trabpause',null,90,jg))}
  steps.push({k:'w',t:n+' × '+sc+' s bergauf',x:'kräftig, Anstrengung wie Schwelle (≈ '+fp(z.t)+' /km)'});steps.push({k:'j',t:'Trabpause',x:'ca. 90 s locker bergab traben, '+(n-1)+' ×'});
  tips.push('Bergauf kräftig, aber nicht sprinten. Bergab locker traben, bis der Puls wieder runter ist.')}
 else if(m=/(\d+) min @ (\d+:\d\d)/.exec(body)){const mi=+m[1],pc=PS(m[2]);core.push(seg(kd(pc),mi+' min',null,mi*60,pc));steps.push({k:kd(pc),t:mi+' min Tempo',x:'@ '+fp(pc)+' /km am Stück (≈ '+km1(mi*60/pc)+' km)'});tips.push('Gleichmäßig durchlaufen, die ersten Minuten eher zurückhaltend.')}
 else if(m=/(\d+) km @ (\d+:\d\d) in 2–3 Blöcken/.exec(body)){
  const mk=+m[1],pc=PS(m[2]),nb=mk>=14?3:2,per=mk/nb;
  for(let i=0;i<nb;i++){core.push(seg('m','Block '+(i+1),per,null,pc));if(i<nb-1)core.push(seg('e','1 km locker',1,null,eM))}
  steps.push({k:'m',t:nb+' × '+km1(per)+' km Marathontempo',x:'@ '+fp(pc)+' /km'});steps.push({k:'e',t:'Dazwischen',x:'1 km locker, '+(nb-1)+' ×'});
  tips.push('Marathontempo gleichmäßig, im ersten Block bewusst zurückhaltend starten.')}
 else if(m=/die letzten (\d+) km @ (\d+:\d\d)/.exec(body)){
  const mk=+m[1],pc=PS(m[2]);core.push(seg('e','Locker',p.km-mk,null,eM));core.push(seg('m','Marathontempo',mk,null,pc));
  steps.push({k:'e',t:'Locker',x:km1(p.km-mk)+' km · '+er});steps.push({k:'m',t:'Marathontempo',x:'letzte '+mk+' km @ '+fp(pc)+' /km'});fill=false;
  tips.push('Erst nach der Hälfte auf Marathontempo wechseln, dann gleichmäßig bleiben.')}
 else if(m=/^(\d+) km @ (\d+:\d\d)(?![–\d:])/.exec(body)){
  const mk=+m[1],pc=PS(m[2]);core.push(seg(kd(pc),'Tempo',mk,null,pc));steps.push({k:kd(pc),t:kd(pc)=='m'?'Marathontempo':'Tempodauerlauf',x:mk+' km @ '+fp(pc)+' /km am Stück · ≈ '+fdur(mk*pc)});
  tips.push('Gleichmäßig durchlaufen, die ersten Kilometer eher zurückhaltend.')}
 else{single=true;fill=false;
  const sm=/(\d+) × (\d+) s Steigerung/.exec(T);
  if(sm&&p.t!='race'&&z.i>0){
   const n=+sm[1],sc=+sm[2],jp=40,ps=z.i,blk=n*sc/ps+(n-1)*jp/jg,ek=Math.max(p.km*.5,p.km-blk);
   core.push(seg('e','Locker',ek,null,eM));
   for(let i=0;i<n;i++){core.push(seg('s','Steigerung '+(i+1),null,sc,ps));if(i<n-1)core.push(seg('j','Trabpause',null,jp,jg))}
   steps.push({k:'e',t:'Locker',x:km1(ek)+' km · '+er+' · ≈ '+fdur(ek*eM)});
   steps.push({k:'s',t:n+' × '+sc+' s Steigerung',x:'flüssig, ca. 90 %, ≈ '+fp(ps)+' /km · am Ende des Laufs'});
   steps.push({k:'j',t:'Trabpause',x:jp+' s locker gehen oder traben, '+(n-1)+' ×'})}
  else{core.push(seg('e',p.lab,p.km,null,eM));steps.push({k:'e',t:p.lab,x:km1(p.km)+' km · '+er+' · ≈ '+fdur(p.km*eM)})}
  tips.push('Locker heißt: Du kannst in ganzen Sätzen sprechen.')}
 if(fill){const used=core.reduce((a,s)=>a+s.km,0),rem=p.km-used;
  if(rem>=0.4){const w=rem>=2?Math.round(rem*.55*2)/2:rem/2,c=rem-w;
   core.unshift(seg('e','Einlaufen',w,null,eM));core.push(seg('e','Auslaufen',c,null,eM));
   steps.unshift({k:'e',t:'Einlaufen',x:km1(w)+' km · '+er+' · ≈ '+fdur(w*eM)});steps.push({k:'e',t:'Auslaufen',x:km1(c)+' km · '+er+' · ≈ '+fdur(c*eM)})}}
 if(m=/(\d+) × (\d+) s Steigerung/.exec(T))notes.push(m[1]+' × '+m[2]+' s Steigerungen am Ende: zügig, aber nicht sprinten, dazwischen locker gehen oder traben.');
 if(/Doppeleinheit/.test(T))notes.push('Doppeleinheit möglich: den Umfang morgens und abends aufteilen.');
 if(/Verpflegung/.test(T))notes.push('Verpflegung wie im Rennen testen (Gel und Getränk).');
 const abc=abcOn(p,d)&&p.t!='race';
 if(abc){const ix=steps.findIndex(x=>x.t=='Einlaufen'),st={k:'e',t:'Lauf-ABC',x:'5 Übungen à 2 × 20 m · ca. 8 min, zusätzlich zur Laufzeit'};
  if(p.t=='q')steps.splice(ix>=0?ix+1:0,0,st);else{st.x='vor den Steigerungen · 5 Übungen à 2 × 20 m · ca. 8 min, zusätzlich zur Laufzeit';const si=steps.findIndex(x=>x.k=='s');if(si>=0)steps.splice(si,0,st);else steps.push(st)}}
 const km=core.reduce((a,s)=>a+s.km,0),sec=core.reduce((a,s)=>a+s.sec,0);
 return{segs:core,steps,notes,tips:[...new Set(tips)],km,sec,range:single?er:null,abc}}
function profSvg(R,mini){
 const G=R.segs,K=R.km,W=mini?60:340,H=mini?22:146,x0=mini?0:8,x1=W-x0,yb=mini?H:108,yt=mini?3:20;
 const ps=G.map(g=>g.pace),fast=Math.min(...ps),slow=Math.max(...ps);
 const hh=pc=>fast==slow?(yb-yt)*.6:(yb-yt)*(.28+(slow-pc)/(slow-fast)*.72);
 let x=x0,s='<svg class="'+(mini?'pfm':'pfb')+'" viewBox="0 0 '+W+' '+H+'" '+(mini?'width="60" height="22" aria-hidden="true"':'role="img" aria-label="Pace-Profil der Einheit: '+km1(K)+' km in etwa '+fdur(R.sec)+'"')+'>';
 const gap=mini?0:.8;
 G.forEach(g=>{const w=g.km/K*(x1-x0),h=hh(g.pace);
  s+='<rect class="pk pk-'+g.k+'" x="'+x.toFixed(1)+'" y="'+(yb-h).toFixed(1)+'" width="'+Math.max(.8,w-gap).toFixed(1)+'" height="'+h.toFixed(1)+'" rx="'+(mini?.8:2)+'"><title>'+esc(g.lab)+' · '+km1(g.km)+' km · '+fp(g.pace)+' /km</title></rect>';
  if(!mini&&w>=26&&g.k!='j'&&g.k!='e')s+='<text x="'+(x+w/2).toFixed(1)+'" y="'+(yb-h-3).toFixed(1)+'" text-anchor="middle" class="pkt">'+fp(g.pace)+'</text>';
  x+=w});
 if(!mini){
  const step=K<=5?1:K<=14?2:K<=30?5:10,tAt=km=>{let a=0,t=0;for(const g of G){if(a+g.km>=km-1e-9){return t+(km-a)/g.km*g.sec}a+=g.km;t+=g.sec}return t};
  s+='<line x1="'+x0+'" x2="'+x1+'" y1="'+yb+'" y2="'+yb+'" class="pka"/>';
  const tk=[];for(let t=0;t<=K+1e-9;t+=step)tk.push(t);{const gp=K-tk[tk.length-1];if(gp>step*.02){if(gp<step*.7&&tk.length>1)tk.pop();tk.push(K)}}
  tk.forEach((t,i)=>{const px=x0+t/K*(x1-x0),an=i==0?'start':i==tk.length-1&&t==K?'end':'middle';
   s+='<line x1="'+px.toFixed(1)+'" x2="'+px.toFixed(1)+'" y1="'+yb+'" y2="'+(yb+3)+'" class="pka"/><text x="'+px.toFixed(1)+'" y="'+(yb+14)+'" text-anchor="'+an+'" class="pkx">'+(i==tk.length-1&&t==K?km1(K):Math.round(t*10)/10)+(i==0?' km':'')+'</text><text x="'+px.toFixed(1)+'" y="'+(yb+26)+'" text-anchor="'+an+'" class="pkx pkz">'+(i==0?'0:00':fdur(tAt(t)))+'</text>'});
  s+='<text x="'+x0+'" y="11" class="pkx">↑ schneller</text>'}
 return s+'</svg>'}
const SKIND={e:'Locker',s:'Steigerung',w:'Tempo / Intervall',m:'Marathontempo',j:'Trabpause',r:'Wettkampf'};
function detailHtml(R){
 const avg=R.sec/R.km,pace=R.range||fp(avg)+' /km';
 const kinds=[...new Set(R.segs.map(g=>g.k))];
 return'<div class="dd"><div class="tiles ddt"><div class="tl"><b>'+km1(R.km)+' km</b><span>Distanz</span></div><div class="tl"><b>'+pace.replace(' /km','')+'</b><span>'+(R.range?'Pace /km':'Ø Pace /km')+'</span></div><div class="tl"><b>'+fdur(R.sec)+'</b><span>Dauer ≈</span></div></div>'
  +'<div class="ddc">'+profSvg(R)+'</div><div class="ddl">'+kinds.map(k=>'<span><i class="pk-'+k+'"></i>'+SKIND[k]+'</span>').join('')+'</div>'
  +'<h4 class="ddh">Ablauf</h4><ol class="dds">'+R.steps.map(s=>'<li><i class="pk-'+s.k+'"></i><div><b>'+esc(s.t)+'</b><span>'+esc(s.x)+'</span></div></li>').join('')+'</ol>'
  +(R.abc?'<div class="ddn">Lauf-ABC gehört in das Aufwärmen dieser Einheit: kurze Technikübungen, keine Zusatzbelastung.<br>'+ABCB+'</div>':'')
  +(R.notes.length?R.notes.map(n=>'<div class="ddn">'+esc(n)+'</div>').join(''):'')
  +(R.tips.length?R.tips.map(n=>'<div class="ddn">'+esc(n)+'</div>').join(''):'')
  +'<div class="ddn">Nach dem Lauf: 10 min Mobility (Hüftbeuger, Waden, Gesäß).<br>'+MOBB('post')+'</div>'
  +'<small class="mu">Distanz, Pace und Zeit sind Schätzungen aus deinen aktuellen Plan-Paces. Die Trabpausen laufen etwas langsamer als dein lockeres Tempo.</small></div>'}

/* ---- Verschieben ---- */
const isTune=k=>(S.tune||[]).some(t=>t.d==k);
const ranOn=k=>{const l=S.log[k];return!!(l&&l.done)||(S.runs||[]).some(r=>r.d==k)};
function mvInfo(d){
 const k=iso(d),p=plan(d),ok=!S.noPlan&&k>=iso(today)&&k<S.race&&!!p&&(p.t!='race'||p.lab=='Testlauf')&&!isTune(k)&&!ranOn(k);
 return{drag:ok&&p.t!='rest',drop:ok}}
function mvSwap(a,b){
 const M=S.mv||(S.mv={}),sa=M[a]||a,sb=M[b]||b;M[a]=sb;M[b]=sa;
 if(M[a]==a)delete M[a];if(M[b]==b)delete M[b];if(!Object.keys(M).length)S.mv=null;save()}
function mvHint(a,b){
 const hard=d=>{const p=plan(d);return!!p&&(p.t=='q'||p.t=='long')};
 for(const k of [a,b]){const d=parse(k);if(hard(d)&&(hard(addD(d,-1))||hard(addD(d,1))))return'Hinweis: Qualität und Longrun liegen jetzt direkt hintereinander. Plane dazwischen möglichst einen lockeren Tag ein.'}
 return''}
function toast(msg,undo){
 let t=document.getElementById('mvt');if(!t){t=document.createElement('div');t.id='mvt';t.className='mvt';t.setAttribute('role','status');document.body.appendChild(t)}
 t.innerHTML='<span>'+esc(msg)+'</span>'+(undo?'<button type="button">Rückgängig</button>':'');t.hidden=false;
 const b=t.querySelector('button');if(b)b.onclick=()=>{t.hidden=true;undo()};
 clearTimeout(toast.h);toast.h=setTimeout(()=>{t.hidden=true},undo?8000:4000)}
function doMove(a,b){
 if(a==b)return;const ia=mvInfo(parse(a)),ib=mvInfo(parse(b));if(!ia.drag||!ib.drop)return;
 const snap=JSON.stringify(S.mv||null),pa=plan(parse(a)),pb=plan(parse(b));
 mvSwap(a,b);const h=mvHint(a,b);render();
 const nm=p=>p&&p.t!='rest'?p.lab:'Ruhetag';
 toast((pb&&pb.t!='rest'?nm(pa)+' und '+nm(pb)+' getauscht':nm(pa)+' auf '+DOW[(parse(b).getDay()+6)%7]+' '+dshort(b)+' verschoben')+(h?'. '+h:'.'),()=>{S.mv=JSON.parse(snap);save();render()})}
let DND=null,DNDX=false;
function dndInit(){
 const root=()=>document.getElementById('cal');
 const hit=(x,y)=>{const e=document.elementFromPoint(x,y);return e&&e.closest&&e.closest('#cal [data-dp]')};
 const clear=()=>document.querySelectorAll('#cal .dro,#cal .dno').forEach(e=>e.classList.remove('dro','dno'));
 const start=()=>{const s=DND;if(!s||s.on)return;s.on=true;const r=s.el.getBoundingClientRect();s.dx=s.x-r.left;s.dy=s.y-r.top;
  const g=s.el.cloneNode(true);g.classList.add('dgg');g.style.width=r.width+'px';g.style.left=r.left+'px';g.style.top=r.top+'px';g.removeAttribute("data-d");g.removeAttribute("data-mv");g.removeAttribute("data-dp");
  document.body.appendChild(g);s.g=g;s.el.classList.add('dgs');document.body.classList.add('dragging');try{navigator.vibrate&&navigator.vibrate(12)}catch(e){}};
 const end=()=>{if(!DND)return;clearTimeout(DND.t);if(DND.g)DND.g.remove();DND.el.classList.remove('dgs');document.body.classList.remove('dragging');clear();DND=null};
 lifecycle.listen(document,'pointerdown',e=>{
  const el=e.target.closest&&e.target.closest('#cal [data-mv]');if(!el||(e.pointerType=='mouse'&&e.button!==0)||e.target.closest('button,a,.inf,input,select'))return;
  DND={el,x:e.clientX,y:e.clientY,id:e.pointerId,on:false,touch:e.pointerType!='mouse'};
  if(DND.touch)DND.t=setTimeout(start,300)});
 lifecycle.listen(document,'pointermove',e=>{const s=DND;if(!s||e.pointerId!==s.id)return;
  const mv=Math.hypot(e.clientX-s.x,e.clientY-s.y);
  if(!s.on){if(s.touch){if(mv>9){clearTimeout(s.t);DND=null}}else if(mv>6)start();if(!DND||!s.on)return}
  s.g.style.left=(e.clientX-s.dx)+'px';s.g.style.top=(e.clientY-s.dy)+'px';
  clear();const t=hit(e.clientX,e.clientY);if(t&&t!==s.el)t.classList.add(isOk(t)?'dro':'dno');
  const h=innerHeight;if(e.clientY<90)scrollBy(0,-14);else if(e.clientY>h-130)scrollBy(0,14)});
 const isOk=t=>{const s=DND;if(!s)return false;return mvInfo(parse(t.dataset.d)).drop};
 const up=e=>{const s=DND;if(!s||e.pointerId!==s.id)return;
  if(s.on){const t=hit(e.clientX,e.clientY);DNDX=true;setTimeout(()=>{DNDX=false},80);const a=s.el.dataset.d,b=t&&t.dataset.d;end();if(b)doMove(a,b)}else end()};
 lifecycle.listen(document,'pointerup',up);lifecycle.listen(document,'pointercancel',e=>{if(DND&&e.pointerId===DND.id)end()});
 lifecycle.listen(document,'touchmove',e=>{if(DND&&DND.on)e.preventDefault()},{passive:false});
 lifecycle.listen(document,'contextmenu',e=>{if(e.target.closest&&e.target.closest('#cal [data-mv]'))e.preventDefault()});
 lifecycle.listen(document,'click',e=>{if(DNDX&&e.target.closest&&e.target.closest('#cal')){e.stopPropagation();e.preventDefault()}},true)}
dndInit();

/* ---- Ansichten ---- */
let M=new Date(today.getFullYear(),today.getMonth(),1),WS=mon(today),CV=LS.get('moach_cv')=='m'?'m':'w';
const CVT=()=>'<div class="cvt" role="tablist"><button type="button" role="tab" data-calv="w" class="'+(CV=='w'?'on':'')+'" aria-selected="'+(CV=='w')+'">Woche</button><button type="button" role="tab" data-calv="m" class="'+(CV=='m'?'on':'')+'" aria-selected="'+(CV=='m')+'">Monat</button></div>';
function mvAttr(d){const i=mvInfo(d);return(i.drag?' data-mv="1"':'')+(i.drop?' data-dp="1"':'')}
function monthHtml(){
 const end=new Date(M.getFullYear(),M.getMonth()+1,0);
 let h=`<div class="g">`+['Mo','Di','Mi','Do','Fr','Sa','So'].map(x=>`<div class="dh">${x}</div>`).concat(['<div class="dh sw">Woche'+inf('c_sum')+'</div>']).join('');
 for(let ws=mon(M);ws<=end;ws=addD(ws,7)){let pl=0,ac=0,c='';
  for(let i=0;i<7;i++){const d=addD(ws,i),p=plan(d),l=S.log[iso(d)],dn=l&&l.done;if(p)pl+=p.km;if(dn)ac+=+l.km||0;
   c+=`<div class="c ${p?'t-'+p.t:''} ${dn?'dn':''} ${d.getMonth()!=M.getMonth()?'out':''} ${+d==+today?'tod':''}" data-d="${iso(d)}"${mvAttr(d)}><span class="n">${d.getDate()}</span>${p?`<span class="l">${p.mv?'↔ ':''}${p.lab}</span><span class="k">${p.km?r1(p.km)+' km':''}</span>`:''}${dn?`<span class="ck">✓ ${esc(l.km)}</span>`:''}</div>`}
  h+=c+(pl>0||ac>0?`<div class="sm" data-w="${iso(ws)}"><b>${Math.round(pl)}</b><span class="u">km</span>${pl>0?`<span class="pb"><i style="width:${Math.min(100,ac/pl*100)}%"></i></span>`:''}<small>${ac?Math.round(ac)+' ✓':''}</small></div>`:`<div class="sm" data-w="${iso(ws)}"><b>–</b></div>`)}
 return h+`</div><div class="leg"><span><i style="background:var(--easy)"></i>Locker</span><span><i style="background:var(--q)"></i>Qualität</span><span><i style="background:var(--long)"></i>Longrun</span><span><i style="background:var(--race)"></i>Wettkampf</span><span>Tippe auf einen Tag für Details (gelaufene Tage öffnen den Lauf im Reiter Läufe), auf die Wochensumme zum Anpassen. Zum Verschieben eine Einheit gedrückt halten und auf einen anderen Tag ziehen.</span></div>`}
const krWeekRow=(p,k)=>p&&p.kr&&p.t!='rest'?'<button type="button" class="wkk'+(k<iso(today)?' pst':'')+'" data-kr="'+p.kr+'" data-ks="'+(p.krs||3)+'"><span class="kb"><b>Krafttraining · Einheit '+p.kr+'</b><small>'+KSD[p.kr]+' · 20–25 min nach dem Lauf</small></span><span class="kc" aria-hidden="true">›</span></button>':'';
function weekHtml(){
 const ws=WS,we=addD(ws,6);let pl=0,ac=0,rows='';
 for(let i=0;i<7;i++){const d=addD(ws,i),k=iso(d),p=plan(d),runs=allRuns().filter(r=>r.d==k),ran=runs.reduce((a,r)=>a+(+r.km||0),0),l=S.log[k],dn=ran>0||(l&&l.done);
  if(p)pl+=p.km;ac+=ran;
  const R=p&&p.t!='rest'?wkSegs(p,d):null,rest=!p||p.t=='rest',pst=k<iso(today);
  const t=p?p.t:'rest',title=!p?'–':rest?'Ruhetag':(p.ttl||p.lab)+(p.km?' · '+r1(p.km)+' km':'');
  const sub=!p?'':rest?'Erholung, optional 15 min Mobility':strip(p).replace(/\s*Gekürzt.*$/,'');
  const meta=R?'<div class="wm">≈ '+fdur(R.sec)+' · '+(R.range?R.range:'Ø '+fp(R.sec/R.km)+' /km')+(R.abc?' · mit Lauf-ABC':'')+(dn?' · <span class="ck">✓ '+km1(ran||+(l&&l.km)||0)+' km gelaufen</span>':'')+'</div>':(dn?'<div class="wm"><span class="ck">✓ '+km1(ran||+(l&&l.km)||0)+' km gelaufen</span></div>':'');
  rows+='<div class="wi k-'+t+(rest?' rest':'')+(+d==+today?' tod':'')+(dn?' dn':'')+(pst?' pst':'')+'" data-d="'+k+'"'+mvAttr(d)+'><div class="wd"><b>'+DOW[i]+'</b><span>'+d.getDate()+'.</span></div><div class="wb"><div class="wl">'+(p&&p.mv?'<span class="mvb" title="verschoben">↔</span>':'')+esc(title)+'</div>'+(sub?'<div class="ws">'+esc(sub)+'</div>':'')+meta+'</div>'+(R?profSvg(R,1):'')+(mvInfo(d).drag?'<span class="wg" aria-hidden="true">⋮⋮</span>':'')+'</div>'+krWeekRow(p,k)}
 const w=wtr(ws),cur=iso(mon(today))==iso(ws);
 return'<div class="wvs"><div><b>'+Math.round(pl)+' km</b><span>geplant'+(ac?' · '+Math.round(ac)+' km gelaufen':'')+'</span></div><div class="wvp">'+(S.noPlan?'Ohne Plan':esc(ph(w)))+'</div><button type="button" class="rngb" data-w="'+iso(ws)+'" id="wad">Woche anpassen ›</button></div>'
  +'<div class="wv">'+rows+'</div><div class="leg"><span>Tippe auf eine Einheit für Details und Diagramm (gelaufene Tage öffnen den Lauf im Reiter Läufe). Zum Verschieben gedrückt halten und auf einen anderen Tag ziehen (am Computer einfach ziehen).</span></div>'}
function rCal(){
 const we=addD(WS,6),mvN=Object.keys(S.mv||{}).filter(k=>k>=iso(today)).length;
 const title=CV=='m'?M.toLocaleDateString('de-DE',{month:'long',year:'numeric'}):(WS.getMonth()==we.getMonth()?WS.getDate()+'.–'+we.getDate()+'. '+WS.toLocaleDateString('de-DE',{month:'long',year:'numeric'}):WS.getDate()+'. '+MON3[WS.getMonth()]+' – '+we.getDate()+'. '+MON3[we.getMonth()]+' '+we.getFullYear());
 const h=CVT()+`<div class="mh"><button id="pv" aria-label="Zurück">‹</button><b>${title}</b><button id="nx" aria-label="Weiter">›</button><button id="td">Heute</button></div>`+(CV=='m'?monthHtml():weekHtml())+(mvN?'<div class="b"><button type="button" id="mvr">Verschiebungen zurücksetzen</button></div>':'');
 $('#cal').innerHTML=planCard()+overviewHtml()+h;wirePlanCard();
 const sh=n=>{if(CV=='m')M=new Date(M.getFullYear(),M.getMonth()+n,1);else WS=addD(WS,7*n);rCal()};
 $('#pv').onclick=()=>sh(-1);$('#nx').onclick=()=>sh(1);
 $('#td').onclick=()=>{M=new Date(today.getFullYear(),today.getMonth(),1);WS=mon(today);rCal()};
 $('#cal').querySelectorAll('[data-calv]').forEach(b=>b.onclick=()=>{const v=b.dataset.calv;if(v==CV)return;
  if(v=='m')M=new Date(addD(WS,3).getFullYear(),addD(WS,3).getMonth(),1);else{const t=new Date(today.getFullYear(),today.getMonth(),1);WS=+M==+t?mon(today):mon(M)}
  CV=v;LS.set('moach_cv',v);rCal()});
 $('#cal').querySelectorAll('.c[data-d],.wi[data-d]').forEach(e=>e.onclick=()=>openDay(e.dataset.d));
 $('#cal').querySelectorAll('.sm[data-w],#wad').forEach(e=>e.onclick=()=>openWeek(parse(e.dataset.w)));
 const mr=$('#mvr');if(mr)mr.onclick=()=>{const snap=JSON.stringify(S.mv||null);Object.keys(S.mv||{}).forEach(k=>{if(k>=iso(today))delete S.mv[k]});if(S.mv&&!Object.keys(S.mv).length)S.mv=null;save();render();toast('Verschiebungen zurückgesetzt.',()=>{S.mv=JSON.parse(snap);save();render()})};
 const ovz=(ph,w,sc)=>{OZ={ph:ph||null,w:w||null,fresh:true,open:OZ.open};rCal();if(sc!==false){const c=document.querySelector('#cal .ovc');if(c&&c.scrollIntoView)try{c.scrollIntoView({block:'start',behavior:'smooth'})}catch(e){}}};
 const oc=$('#cal .ovc');
 if(oc){
  const pd=oc.querySelector('#phd');if(pd)pd.ontoggle=()=>{OZ.open=pd.open};
  oc.querySelectorAll('[data-oz]').forEach(b=>b.onclick=()=>{const l=+b.dataset.oz;if(l==0)ovz(null,null);else ovz(oc.dataset.ph,null)});
  oc.querySelectorAll('[data-op]').forEach(e=>{if(e.dataset.op==='')return;e.onclick=()=>ovz(e.dataset.op,null);e.onkeydown=ev=>{if(ev.key=='Enter'||ev.key==' '){ev.preventDefault();ovz(e.dataset.op,null)}}});
  oc.querySelectorAll('.wkr[data-w],.hit[data-w]').forEach(e=>{const go=()=>{if(e.classList.contains('hit')&&oc.dataset.lv=='0'){const m=JSON.parse(oc.dataset.pm||'{}');ovz(m[e.dataset.w]||'',null)}else ovz(oc.dataset.ph,e.dataset.w)};e.onclick=go;e.onkeydown=ev=>{if(ev.key=='Enter'||ev.key==' '){ev.preventDefault();go()}}});
  oc.querySelectorAll('[data-ow]').forEach(b=>{if(b.dataset.ow)b.onclick=()=>ovz(oc.dataset.ph,b.dataset.ow,false)});
  oc.querySelectorAll('[data-wadz]').forEach(b=>b.onclick=()=>openWeek(parse(b.dataset.w)))}
 const ov=$('#ovr');if(ov)ov.onclick=openRange;
 const aw=$('#allw');if(aw)aw.ontoggle=()=>{if(aw.open){const c=aw.querySelector('tr.cur'),bx=aw.querySelector('.ovw');if(c&&bx)bx.scrollTop=Math.max(0,c.offsetTop-bx.offsetTop-60)}}}
function openDay(k){
 const rs=k<=iso(today)?allRuns().filter(r=>r.d==k):[];
 if(rs.length){const r=rs.slice().sort((a,b)=>(+b.km||0)-(+a.km||0))[0],m=$('#md');if(m)m.hidden=true;showTab('runs');openRun(r.id)}else openM(k)}
function openM(k){
 const d=parse(k),p=plan(d),l=S.log[k]||{},m=$('#md'),R=wkSegs(p,d),info=mvInfo(d);m.hidden=false;
 const runs=allRuns().filter(r=>r.d==k&&!r.manual);
 const ranH=runs.map(r=>{const diff=p&&p.km?r.km-p.km:null;return'<div class="ddr"><b>Gelaufen</b> '+km1(r.km)+' km'+(r.sec>0&&r.km>0?' · '+fp(r.sec/r.km)+' /km · '+dur(r.sec):'')+(r.hr>0?' · Ø '+Math.round(r.hr)+' bpm':'')+(diff!=null&&Math.abs(diff)>=.3?'<small>'+(diff>0?'+':'−')+km1(Math.abs(diff))+' km gegenüber dem Plan</small>':'')+'</div>'}).join('');
 m.innerHTML=`<div class="box"><div class="mxw"><button type="button" class="mxb" id="cl" aria-label="Schließen">✕</button></div><h3 class="mxh">${d.toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'})}</h3><div class="mu">${ph(wtr(d))} · ${Math.max(0,wtr(d))} Wochen bis zur Rennwoche</div>${p?`<div class="pl t-${p.t}"><b>${esc(p.ttl||p.lab)}${p.km?' · '+r1(p.km)+' km':''}</b><br>${p.d}${p.t=='rest'?'<br>'+MOBB('rest'):''}${p.str?'<br><b>Kraft:</b> '+esc(p.str)+(p.kr?'<br><button type="button" class="krb" data-kr="'+p.kr+'" data-ks="'+p.krs+'">Übungen &amp; Anleitung ›</button>':''):''}</div>`:'<p>Kein Plan für diesen Tag.</p>'}
 ${p&&p.mv?'<div class="mvi">↔ Verschoben von '+DOW[(parse(p.mv).getDay()+6)%7]+' '+dshort(p.mv)+'</div>':''}${R?detailHtml(R):''}${ranH}
 <div class="f"><label>Distanz (km)<input id="fk" type="number" step="0.1" placeholder="${p&&p.km?r1(p.km):''}" value="${l.km!=null?esc(l.km):''}"></label><label>Dauer (min)<input id="fm" type="number" value="${esc(l.min)}"></label><label>Anstrengung 1–10<input id="fr" type="number" min="1" max="10" value="${esc(l.rpe)}"></label></div>
 <label>Notiz<input id="fn" value="${esc(l.note)}"></label>
 <div class="b"><button class="pri" id="sv">Speichern</button><button id="dl">Löschen</button></div></div>`;
 $('#sv').onclick=()=>{const km=$('#fk').value,mi=$('#fm').value;S.log[k]={done:!!(+km>0||+mi>0||l.done),km,min:mi,rpe:$('#fr').value,note:$('#fn').value};save();m.hidden=true;render()};
 $('#dl').onclick=()=>{delete S.log[k];save();m.hidden=true;render()};
 $('#cl').onclick=()=>m.hidden=true}
function rPerf(){
 const z=Z(today),f=fitP();
 const dist=[[5,'5 km'],[10,'10 km'],[21.0975,'Halbmarathon'],[42.195,'Marathon']];
 let wk='';for(let i=9;i>=0;i--){const ws=addD(mon(today),-7*i);let pl=0,ac=0;for(let j=0;j<7;j++){const d=addD(ws,j),p=plan(d,1),l=S.log[iso(d)];if(p)pl+=p.km;if(l&&l.done)ac+=+l.km||0}
  if(!pl&&!ac)continue;wk+=`<div style="font-size:.78rem">${ws.toLocaleDateString('de-DE',{day:'numeric',month:'short'})}: ${Math.round(ac)}${pl?' / '+Math.round(pl):''} km<div class="bar"><i style="width:${Math.min(100,pl/1.2)}%;background:var(--bd);filter:brightness(.8)"></i></div><div class="bar"><i style="width:${Math.min(100,ac/1.2)}%;background:var(--ok)"></i></div></div>`}
 $('#perf').innerHTML=`${insightHtml()}<div class="card"><h3>Zustand im Detail</h3><div class="sub">Tippe auf eine Zeile für Diagramm und Trend${ICU.key?' · Daten aus Intervals.icu':''}</div>${zdetail(readiness())||'<div class="mu" style="margin:6px 0">Noch keine Trenddaten. Verbinde Intervals.icu im Profil.</div>'}</div><div class="card"><h3>Neues Ergebnis (Wettkampf oder Test)${inf('perf_res')}</h3><div class="sub">Verändert nur deine Trainingspaces. Die Prognose auf der Startseite rechnet allein aus deinen Läufen.</div><div class="f"><label>Datum<input id="rd" type="date" value="${iso(today)}"></label><label>Distanz<select id="rk">${dist.map(x=>`<option value="${x[0]}">${x[1]}</option>`).join('')}</select></label><label>Std<input id="rh" type="number" min="0" value="0"></label><label>Min<input id="rm" type="number" min="0" value="0"></label><label>Sek<input id="rs" type="number" min="0" value="0"></label></div><button class="pri" id="ra">Hinzufügen</button>
 <table style="margin-top:10px">${S.res.map((x,i)=>`<tr><td>${x.d}</td><td>${r1(x.km)} km</td><td>${ft(x.sec)}</td><td>→ Marathon ${ft(x.sec*Math.pow(42.195/x.km,1.06))}</td><td><button data-x="${i}">✕</button></td></tr>`).join('')||'<tr><td class="mu">Noch keine Ergebnisse – Paces basieren auf dem Plan-Verlauf von 3:10 h Richtung Ziel.</td></tr>'}</table></div>
 <div class="card"><h3>Deine aktuellen Trainingspaces${inf('perf_pace')}</h3><table><tr><td>Marathontempo</td><td><b>${fp(z.mp)}</b> /km</td></tr><tr><td>Locker</td><td>${fp(z.e1)}–${fp(z.e2)} /km</td></tr><tr><td>Schwelle</td><td>${fp(z.t)} /km</td></tr><tr><td>Intervall 3–5 min</td><td>${fp(z.i)} /km</td></tr><tr><td>Kurz 200–400 m</td><td>${fp(z.r)} /km</td></tr></table><small>${f?'Berechnet aus deinem letzten Ergebnis ('+f.d+').':'Noch ohne Testergebnis; gedeckelt auf Zielpace.'}</small></div>
 <div class="card"><h3>Umfang pro Woche (grün = gelaufen)</h3>${wk||'<span class="mu">Noch keine Wochen.</span>'}</div>`;
 $('#ra').onclick=()=>{const sec=(+$('#rh').value)*3600+(+$('#rm').value)*60+(+$('#rs').value);if(!sec||!$('#rd').value)return;S.res.push({d:$('#rd').value,km:+$('#rk').value,sec});S.res.sort((a,b)=>a.d<b.d?-1:1);save();render()};
 document.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>{S.res.splice(+b.dataset.x,1);save();render()});
 $('#perf').querySelectorAll('[data-ch]').forEach(b=>b.onclick=()=>openChart(b.dataset.ch));wireNew($('#perf'))}
function rSet(){
 const g=S.goal,b=S.base,P=S.prof||{};
 $('#set').innerHTML=`<div class="card"><h3>Persönliche Daten</h3><div class="sub">Der Name erscheint in der Begrüßung. Gewicht und Aufstehzeit sind optional.</div><div class="f"><label>Name<input id="pn" autocomplete="given-name" value="${esc(P.name)}"></label><label>Gewicht (kg)<input id="pw" type="number" step="0.5" min="30" max="200" value="${esc(P.weight)}"></label><label>Aufstehen um<input id="pu" type="time" value="${esc(P.wake||'06:30')}"></label></div></div>
 ${(S.cfg||S.noPlan||RD()<40)?`<div class="card"><h3>Plan &amp; Ziel</h3><div class="mu" style="font-size:.9rem">${planSummary()}</div><div class="b"><button class="pri" id="gocal">Im Kalender anpassen</button><button id="ss">Speichern</button></div></div>`:`<div class="card"><h3>Marathon-Ziel</h3><div class="f"><label>Renndatum<input id="sr" type="date" value="${S.race}"></label><label>Ziel Std<input id="gh" type="number" value="${Math.floor(g/3600)}"></label><label>Ziel Min<input id="gm" type="number" value="${Math.floor(g%3600/60)}"></label><label>Bisher Std<input id="bh" type="number" value="${Math.floor(b/3600)}"></label><label>Bisher Min<input id="bm" type="number" value="${Math.floor(b%3600/60)}"></label></div><small>„Bisher“ ist deine letzte Marathonzeit, Ausgangspunkt für Prognose und Trainingstempo. Ändere das Renndatum, falls du in Berlin keinen Startplatz bekommst – der Plan verschiebt sich mit.</small><div class="b"><button class="pri" id="ss">Speichern</button></div></div>`}
 <div class="card"><h3>Intervals.icu</h3><div class="sub">${ICU.key?'Verbunden':'Nicht verbunden'}</div><div class="f"><label>API-Schlüssel<input id="ik" type="password" autocomplete="off" value="${esc(ICU.key)}"></label><label>Athlete-ID (optional)<input id="ia" placeholder="leer = eigenes Konto" value="${esc(ICU.id)}"></label></div><div class="b"><button class="pri" id="isv">Verbinden &amp; synchronisieren</button></div><div id="icust" class="mu" style="margin-top:8px"></div><div id="icc" class="mu" style="margin-top:6px"></div><p class="mu">M.oach lädt deine Läufe der letzten 12 Wochen sowie Ruhepuls, HRV, Schlaf und Fitness aus Intervals.icu und aktualisiert sich alle 10 Minuten, solange die App offen ist. Den API-Schlüssel findest du in Intervals.icu unter Einstellungen → „Developer Settings“. Die Athlete-ID (z. B. i12345) steht in der Adresszeile und kann leer bleiben. Schlüssel und ID liegen in diesem Browser. Mit einem Cloud-Konto werden sie zusätzlich verschlüsselt gesichert (Schlüssel aus deinem Passwort, der Betreiber kann sie nicht lesen). Sie stehen nie im Repository. Behandle den Schlüssel wie ein Passwort.</p></div>
 ${cloudCard()}${pushCard()}${coachCard()}<div class="card"><h3>Coach-Zugang</h3>${isAdm()?'<div class="sub">Freigeschaltet: Du siehst den Reiter „Coaching“.</div><div class="b"><button id="admo">Coach-Zugang sperren</button></div>':'<div class="sub">Nur für Coaches mit Admin-Code.</div><div class="f"><label>Admin-Code<input id="admc" type="password" autocomplete="off"></label></div><div id="admr" class="aerr" hidden></div><div class="b"><button id="admg">Freischalten</button></div>'}</div>
 <div class="card"><h3>Konto</h3><div class="sub">Angemeldet als <b>${esc(P.name||'Läufer')}</b>. Die Anmeldung läuft über dein Cloud-Konto.</div><small class="mu">${CL.ses&&sbOn()?'„Konto löschen“ entfernt dich komplett: dein Cloud-Konto, alle Cloud-Daten und die Daten auf diesem Gerät.':'Du bist gerade nicht in der Cloud angemeldet. „Konto löschen“ entfernt nur die Daten auf diesem Gerät; ein bestehendes Cloud-Konto bleibt erhalten.'}</small><div class="b"><button class="pri" id="lo">Abmelden</button></div><div id="delerr" class="aerr" hidden></div><div class="b"><button id="rs2">Trainingsdaten zurücksetzen</button><button id="del">Konto löschen</button></div></div>`;
 {const st0=$('#sy'),ic=$('#icust');if(st0&&ic)ic.textContent=st0.textContent}

 wireCoachCard();wireCloud();wirePush();const ag=$('#admg');if(ag)ag.onclick=()=>{const c=($('#admc').value||'').trim().toLowerCase();if(sha256('moach|'+c)===ADM_HASH){LS.set('moach_adm_'+UID,'1');navCoach();render();showTab('coach')}else{const r=$('#admr');r.textContent='Code nicht korrekt.';r.hidden=false}};
 const ao=$('#admo');if(ao)ao.onclick=()=>{LS.del('moach_adm_'+UID);navCoach();render();showTab('set')};
 $('#isv').onclick=()=>{ICU={id:$('#ia').value.trim(),key:$('#ik').value.trim()};LS.set('mplan_icu_'+UID,JSON.stringify(ICU));icuSync();icuPush().catch(()=>{})};
 icuStatusHtml().then(h=>{const c=$('#icc');if(c){c.innerHTML=h;const b=$('#icb');if(b)b.onclick=()=>icuPush().catch(()=>{})}}).catch(()=>{});
 const gc=$('#gocal');if(gc)gc.onclick=()=>showTab('cal');
 $('#ss').onclick=()=>{if($('#sr')){S.race=$('#sr').value||S.race;S.goal=(+$('#gh').value*60+ +$('#gm').value)*60;S.base=(+$('#bh').value*60+ +$('#bm').value)*60}S.prof={name:$('#pn').value.trim(),weight:$('#pw').value,wake:$('#pu').value||'06:30'};{const u=USERS.find(x=>x.id===UID);if(u&&S.prof.name){u.name=S.prof.name;LS.set('moach_users',JSON.stringify(USERS))}}save();if(CL.ses&&CL.pulled)cloudProfile().catch(()=>{});render();showTab('set');const t=$('#ss');if(t){t.textContent='✓ Gespeichert';setTimeout(()=>{const u=$('#ss');if(u)u.textContent='Speichern'},1500)}};
 $('#lo').onclick=()=>{if(!(CL.ses&&sbOn())&&!confirm('Dieses Konto ist nicht mit der Cloud verbunden. Die Anmeldung geht nur noch über ein Cloud-Konto, deine Daten auf diesem Gerät wären danach nicht mehr erreichbar. Bitte verbinde zuerst die Cloud unter Profil. Trotzdem abmelden?'))return;LS.del('moach_cur');location.reload()};
 let armed=0;$('#rs2').onclick=e=>{if(!armed){armed=1;e.target.textContent='Wirklich löschen? Nochmal tippen'}else{const k={start:S.start,prof:S.prof,coach:S.coach};S=Object.assign(DEF(),k);save();render()}};
 let ad=0;$('#del').onclick=async e=>{const bt=e.currentTarget,er=$('#delerr');
  if(!ad){ad=1;bt.textContent=(CL.ses&&sbOn())?'Wirklich? Löscht auch dein Cloud-Konto. Nochmal tippen':'Wirklich löschen? Nochmal tippen';return}
  er.hidden=true;
  if(CL.ses&&sbOn()){bt.disabled=true;
   try{await sbRest('rpc/delete_my_account',{m:'POST',b:{}})}
   catch(x){ad=0;bt.disabled=false;bt.textContent='Konto löschen';er.textContent='Das Cloud-Konto konnte nicht gelöscht werden ('+(x&&x.message||'Fehler')+'). Prüfe die Verbindung und versuche es erneut. Auf diesem Gerät wurde nichts gelöscht.';er.hidden=false;return}}
  LS.del('mplan2_'+UID);LS.del('mplan_icu_'+UID);LS.del('moach_sbs_'+UID);LS.del('moach_ck_'+UID);LS.del('moach_adm_'+UID);LS.del('moach_rs_'+UID);LS.del('moach_rd_'+UID);LS.del('moach_hm_'+UID);USERS=USERS.filter(u=>u.id!==UID);LS.set('moach_users',JSON.stringify(USERS));LS.del('moach_cur');location.reload()}}
/* ===== M.oach: Startseite / Tagesbriefing ===== */
const DOW=['Mo','Di','Mi','Do','Fr','Sa','So'];
const LV=[{t:'Bereit',c:'s-g'},{t:'Anpassen',c:'s-y'},{t:'Erholen',c:'s-r'}];
const deload=w=>{const C=CF();if(C.mode=='maintain')return(C.tw-w)%4==3;return w>TPW()+1&&w<C.T[0]&&w!=C.test&&w!=C.recov&&(C.tw-w)%4==3};
const FOCUS={'Erhaltung':'Fitness halten: gleichbleibender Umfang, ein bis zwei Tempoeinheiten, alle 4 Wochen eine leichtere Woche.','Wettkampfspezifisch':'Renntempo automatisieren: Intervalle und Abschnitte im Zieltempo, dazu lange Läufe für die Grundlage.','Regeneration':'Körper erholen lassen: kein Tempo, nur locker. Ziel ist, gesund und frisch in den Aufbau zu starten.','Grundlagen':'Aerobe Basis: viel locker laufen, Umfang um 5–8 % pro Woche steigern, 2× Kraft zu Hause.','Tempoentwicklung':'Schnelligkeit und Laufökonomie: kurze Intervalle, Hügelsprints, saubere Technik.','Schwelle & Test':'Schwellentempo stabil halten. Der Testlauf zeigt, ob 2:45 realistisch ist.','Entlastung + Basis':'Nach dem Test kurz erholen, dann den Umfang wieder aufbauen.','Marathonspezifisch':'Marathontempo automatisieren: lange Läufe mit Tempoanteil, Verpflegung üben.','Tapering':'Umfang runter, Frische hoch. Nichts Neues mehr ausprobieren.'};
const strip=p=>p.d.replace(/^[\d.,]+ km( gesamt)?:? ?/,'');
const XG='<line class="xg" x1="4" x2="116" y1="84" y2="84"/>';
const XR=(x,y,w,h)=>'<rect class="xp" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="3"/>';
const EX={
 bss:{n:'Bulgarian Split Squat',m:'Oberschenkel, Gesäß, Gleichgewicht',r:'8–10 je Bein',cap:['Oben','Unten'],
  pr:XG+XR(4,64,24,20),
  p:[{P:[55,47],T:3,ln:[78,81],lf:[19,61],fb:180,an:[63,45],af:[63,45],kn:'f',kf:'d',en:'b',ef:'b'},{P:[52,59],T:3,ln:[78,81],lf:[19,61],fb:180,an:[60,57],af:[60,57],kn:'f',kf:'d',en:'b',ef:'b'}],
  st:['Stell dich mit dem Rücken zu einem Stuhl oder Sofa, etwa einen großen Schritt davor. Lege den Fuß des hinteren Beins mit dem Spann auf die Sitzfläche.','Oberkörper aufrecht, Blick geradeaus, Hände an den Hüften.','Senke das hintere Knie langsam Richtung Boden, bis der vordere Oberschenkel ungefähr waagerecht ist (etwa 2–3 s nach unten).','Das vordere Knie bleibt über dem Fuß. Drücke dich über die ganze Fußsohle des vorderen Fußes wieder hoch.'],
  fe:['Vorderer Fuß zu nah am Stuhl: Das Knie schiebt weit über die Zehen.','Knie fällt nach innen.','Oberkörper kippt weit nach vorn.'],
  ez:'rlu',hd:'Rucksack mit Büchern oder Flaschen in beiden Händen halten.',
  wh:'Du läufst ständig auf einem Bein. Die Übung stärkt Oberschenkel, Gesäß und die Stabilität in Hüfte und Knie.'},
 hip:{n:'Hip Thrust, einbeinig',m:'Gesäß, hintere Oberschenkel',r:'10–12 je Bein',cap:['Unten','Oben'],
  pr:XG+XR(0,56,28,28),
  p:[{P:[50,76],T:-52,ln:[78,81],lf:[88,62],an:[46,78],af:[46,78],kn:'u',kf:'u',en:'d',ef:'d'},{P:[50,57],T:-82,ln:[78,81],lf:[86,42],an:[46,78],af:[46,78],kn:'u',kf:'u',en:'d',ef:'d'}],
  st:['Setz dich vor ein Sofa oder einen Stuhl auf den Boden und lehne den oberen Rücken (unter den Schulterblättern) an die Kante.','Stelle die Füße hüftbreit auf, Knie gebeugt. Für die einbeinige Version streckst du ein Bein gerade nach vorn.','Drücke die Ferse des Standbeins in den Boden und hebe die Hüfte, bis Schultern, Hüfte und Knie eine Linie bilden. Oben 1–2 s das Gesäß fest anspannen.','Senke die Hüfte kontrolliert wieder ab, ohne unten abzulegen.'],
  fe:['Hohlkreuz: Die Rippen bleiben unten, der Bauch angespannt.','Die Hüfte kippt zur Seite.','Zu hoch gedrückt: Die Knie sollen nur etwa 90° gebeugt sein.'],
  ez:'gb',hd:'Rucksack oder ein schweres Buch auf die Hüfte legen.',
  wh:'Das Gesäß liefert beim Laufen den Vortrieb. Ein starkes Gesäß entlastet Knie und Waden.'},
 calf:{n:'Wadenheben, einbeinig',m:'Waden, Achillessehne',r:'12–15 je Bein',cap:['Unten','Oben'],
  pr:XG+'<line class="xw" x1="78" x2="78" y1="4" y2="84"/>',
  p:[{P:[54,40],T:0,ln:[54,81],lf:[40,62],an:[76,26],af:[76,26],kn:'f',kf:'d',en:'d',ef:'d'},{P:[54,34],T:0,ln:[54,75],lna:62,lf:[40,58],an:[76,22],af:[76,22],kn:'f',kf:'d',en:'d',ef:'d'}],
  st:['Stelle dich neben eine Wand und stütze dich mit einer Hand leicht ab. Hebe einen Fuß vom Boden.','Drücke dich langsam auf die Zehenspitze des Standbeins (etwa 2 s nach oben) und halte oben 1 s.','Senke die Ferse in etwa 3 s kontrolliert ab. Auf einer Treppenstufe geht es unten bis leicht unter die Stufenkante.'],
  fe:['Schwung statt Kontrolle.','Das Fußgelenk knickt nach außen.','Das Knie beugt sich beim Hochdrücken.'],
  ez:'',hd:'Auf einer Stufe trainieren und die Ferse tief absenken, oder einen Rucksack tragen.',
  wh:'Waden und Achillessehne tragen bei jedem Schritt ein Mehrfaches deines Körpergewichts.'},
 side:{n:'Seitstütz',m:'Seitliche Rumpfmuskeln, Hüfte',r:'30–45 s je Seite',cap:['Leichter: Knie am Boden','Hüfte hoch, eine Linie'],
  pr:XG,
  p:[{P:[60,68],T:-84,ln:[92,81],lf:[94,81],an:[48,81],af:[34,42],kn:'d',kf:'d',en:'d',ef:'u'},{P:[58,67],T:-84,ln:[97,80],lf:[99,80],an:[48,81],af:[34,42],kn:'d',kf:'d',en:'d',ef:'u'}],
  st:['Lege dich auf die Seite, der Unterarm liegt unter der Schulter, der Ellbogen bildet einen rechten Winkel.','Hebe die Hüfte, bis der Körper von Kopf bis Fuß eine Linie bildet. Die Füße liegen übereinander oder leicht versetzt.','Halte die Spannung und atme ruhig weiter. Die obere Hand zeigt zur Decke oder liegt auf der Hüfte.'],
  fe:['Die Hüfte sackt durch.','Das Becken dreht nach vorn oder hinten.','Die Schulter zieht zum Ohr.'],
  ez:'',hd:'Oberes Bein während des Haltens anheben.',
  wh:'Der Rumpf hält dein Becken stabil, damit die Beine ökonomisch arbeiten, auch wenn du müde wirst.'},
 plank:{n:'Unterarmstütz (Plank)',m:'Bauch, Rücken, Schultern',r:'30–45 s',cap:['Leichter: Knie am Boden','Körper eine Linie'],
  pr:XG,
  p:[{P:[62,69],T:84,ln:[27,81],lf:[27,81],an:[100,81],af:[100,81],kn:'d',kf:'d',en:'d',ef:'d'},{P:[62,67],T:84,ln:[22,77],lna:70,lf:[22,77],lfa:70,an:[100,81],af:[100,81],kn:'d',kf:'d',en:'d',ef:'d'}],
  st:['Lege die Unterarme unter den Schultern ab und stelle die Füße hüftbreit auf die Zehen.','Spanne Gesäß und Bauch an, bis der Körper eine gerade Linie bildet.','Blick zum Boden, Nacken lang, ruhig weiteratmen.'],
  fe:['Hohlkreuz oder Po nach oben.','Der Kopf hängt durch.','Die Atmung wird angehalten.'],
  ez:'dead',hd:'Abwechselnd ein Bein anheben.',
  wh:'Eine stabile Körpermitte hilft dir, die Laufform auch auf den letzten Kilometern zu halten.'},
 gb:{n:'Glute Bridge',m:'Gesäß, hintere Oberschenkel',r:'12–15',cap:['Unten','Oben'],
  pr:XG,
  p:[{P:[50,78],T:-90,ln:[72,81],lf:[72,81],an:[50,81],af:[50,81],kn:'u',kf:'u',en:'d',ef:'d'},{P:[50,63],T:-115,ln:[72,81],lf:[72,81],an:[50,81],af:[50,81],kn:'u',kf:'u',en:'d',ef:'d'}],
  st:['Lege dich auf den Rücken, die Füße stehen hüftbreit nah am Gesäß, die Arme liegen neben dem Körper.','Drücke die Fersen in den Boden und hebe die Hüfte, bis Schultern, Hüfte und Knie eine Linie bilden.','Halte oben 1–2 s und spanne das Gesäß an. Dann senke die Hüfte kontrolliert ab.'],
  fe:['Hohlkreuz statt Hüftstreckung.','Füße zu weit weg: Die Oberschenkelrückseite krampft.','Die Knie fallen nach innen.'],
  ez:'',hd:'Einbeinig ausführen (Hip Thrust).',
  wh:'Die einfache Vorstufe zum einbeinigen Hip Thrust, ideal zum Lernen der Bewegung.'},
 rlu:{n:'Ausfallschritt rückwärts',m:'Oberschenkel, Gesäß',r:'10 je Bein',cap:['Stand','Unten'],
  pr:XG,
  p:[{P:[60,40],T:0,ln:[60,81],lf:[52,81],an:[67,37],af:[67,37],kn:'f',kf:'f',en:'b',ef:'b'},{P:[62,60],T:6,ln:[76,81],lf:[36,72],lfa:70,an:[69,57],af:[69,57],kn:'f',kf:'d',en:'b',ef:'b'}],
  st:['Stehe aufrecht, die Füße hüftbreit, die Hände an den Hüften.','Mache mit einem Bein einen großen Schritt zurück und senke das hintere Knie kontrolliert Richtung Boden.','Das vordere Knie bleibt über dem Fuß, der Oberkörper aufrecht.','Drücke dich mit dem vorderen Bein zurück in den Stand.'],
  fe:['Der Schritt ist zu klein, das Knie schiebt nach vorn.','Das vordere Knie fällt nach innen.','Der Oberkörper beugt sich vor.'],
  ez:'',hd:'Kurzhanteln oder Wasserflaschen in den Händen halten.',
  wh:'Trainiert Kraft und Kontrolle in der Bewegung, die dem Laufschritt am nächsten kommt.'},
 rdl:{n:'Einbeiniges Kreuzheben',m:'Hintere Oberschenkel, Gesäß, Balance',r:'8–10 je Bein',cap:['Stand','Unten'],
  pr:XG,
  p:[{P:[58,40],T:0,ln:[58,81],lf:[46,76],an:[62,55],af:[62,55],kn:'f',kf:'d',en:'f',ef:'f'},{P:[56,43],T:88,ln:[56,81],lf:[17,42],lfa:90,an:[83,70],af:[83,70],kn:'f',kf:'b',en:'f',ef:'f'}],
  st:['Stehe auf einem Bein, das Knie leicht gebeugt, die Arme hängen vor den Oberschenkeln.','Kippe den Oberkörper mit geradem Rücken nach vorn, während das freie Bein gestreckt nach hinten geht. Das Becken bleibt gerade und zeigt zum Boden.','Gehe so tief, wie du den Rücken gerade halten kannst (der Oberkörper ist ungefähr waagerecht). Dann spanne das Gesäß an und richte dich auf.'],
  fe:['Der Rücken wird rund.','Das Becken dreht auf.','Das Standknie kippt nach innen.'],
  ez:'',hd:'Eine Hantel oder Wasserflasche in der Hand halten.',
  wh:'Stärkt die hintere Kette (Gesäß, Oberschenkelrückseite) und trainiert Balance auf einem Bein.'},
 bird:{n:'Vierfüßler (Bird Dog)',m:'Rumpf, Gesäß, Rücken',r:'8 je Seite, langsam',cap:['Vierfüßlerstand','Arm und Bein strecken'],
  pr:XG,
  p:[{P:[50,58],T:88,ln:[30,81],lf:[30,81],an:[76,81],af:[76,81],kn:'d',kf:'d',en:'b',ef:'b'},{P:[50,58],T:88,ln:[10,57],lf:[30,81],an:[76,81],af:[102,56],kn:'d',kf:'d',en:'b',ef:'b'}],
  st:['Gehe in den Vierfüßlerstand: Hände unter den Schultern, Knie unter der Hüfte, der Rücken ist gerade.','Strecke den rechten Arm nach vorn und das linke Bein nach hinten, bis beide in Verlängerung des Rückens liegen.','Halte 2 s, ohne dass sich das Becken dreht. Komm zurück und wechsle die Seite.'],
  fe:['Hohlkreuz.','Das Becken kippt zur Seite.','Zu schnelle Bewegung.'],
  ez:'dead',hd:'Ellbogen und Knie unter dem Körper zusammenführen, bevor du streckst.',
  wh:'Schult die Kontrolle über Becken und Rumpf, die du bei jedem Schritt brauchst.'},
 dead:{n:'Dead Bug',m:'Tiefe Bauchmuskeln',r:'8 je Seite, langsam',cap:['Start','Gegenarm und -bein strecken'],
  pr:XG,
  p:[{P:[52,78],T:-90,ln:[72,56],lf:[72,56],an:[28,53],af:[31,53],kn:'u',kf:'u',en:'u',ef:'u'},{P:[52,78],T:-90,ln:[92,72],lf:[72,56],an:[28,53],af:[3,74],kn:'u',kf:'u',en:'u',ef:'d'}],
  st:['Lege dich auf den Rücken, die Arme zeigen zur Decke, Hüfte und Knie sind im 90°-Winkel angehoben.','Drücke den unteren Rücken sanft in den Boden und strecke langsam den rechten Arm nach hinten und das linke Bein nach vorn.','Komm in die Mitte zurück und wechsle die Seite. Der Rücken bleibt die ganze Zeit am Boden.'],
  fe:['Der untere Rücken hebt vom Boden ab.','Zu schnell und mit Schwung.','Die Luft wird angehalten.'],
  ez:'',hd:'Gewicht in den Händen halten.',
  wh:'Leichte Rumpfübung, bei der du lernst, den Rücken stabil zu halten, während sich Arme und Beine bewegen.'}
};
const KSES={A:{n:'Beine & Hüfte',e:['bss','hip','calf','side']},B:{n:'Stabilität & Rumpf',e:['rlu','rdl','bird','plank']}};
const XL={t:24,a:21,b:20,u:14,f:13},XHN={f:[1,0],b:[-1,0],u:[0,-1],d:[0,1]};
function xIk(h,t,l1,l2,hint){
 let dx=t[0]-h[0],dy=t[1]-h[1],d=Math.hypot(dx,dy);d=Math.min(Math.max(d,Math.abs(l1-l2)+.5),l1+l2-.01);
 const a=Math.acos(Math.max(-1,Math.min(1,(l1*l1+d*d-l2*l2)/(2*l1*d)))),b0=Math.atan2(dy,dx),hv=XHN[hint]||XHN.f;let best=null,bs=-1e9;
 [-1,1].forEach(s=>{const k=[h[0]+l1*Math.cos(b0+s*a),h[1]+l1*Math.sin(b0+s*a)],sc=(k[0]-h[0])*hv[0]+(k[1]-h[1])*hv[1];if(sc>bs){bs=sc;best=k}});
 const e=[h[0]+d*Math.cos(b0),h[1]+d*Math.sin(b0)];return{k:best,e}}
function xFig(q,pr,x0){
 const T=q.T*Math.PI/180,u=[Math.sin(T),-Math.cos(T)],v=[Math.cos(T),Math.sin(T)],P=q.P,N=[P[0]+XL.t*u[0],P[1]+XL.t*u[1]],H=[N[0]+8.5*u[0],N[1]+8.5*u[1]];
 const R=a=>a.map(n=>Math.round(n*10)/10).join(' '),
  leg=(A,h,fa)=>{const r=xIk(P,A,XL.a,XL.b,h),a=(fa||0)*Math.PI/180;return{k:r.k,a:r.e,f:[r.e[0]+7*Math.cos(a),r.e[1]+7*Math.sin(a)]}},
  arm=(W,h)=>{const r=xIk(N,W,XL.u,XL.f,h);return{e:r.k,w:r.e}},
  ln=leg(q.ln,q.kn,q.lna!=null?q.lna:q.fb),lf=leg(q.lf,q.kf,q.lfa!=null?q.lfa:q.fb),an=arm(q.an,q.en),af=arm(q.af,q.ef);
 const sg=(a,b,c,w)=>'<path class="'+c+'" stroke-width="'+w+'" d="M'+R(a)+' L'+R(b)+'"/>',
  mid=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],
  Leg=(l,f)=>{const s=f?'xs2':'xs',k=f?'xk2':'xk',o=f?'xo2':'xo';return sg(P,l.k,s,6.6)+sg(P,mid(P,l.k,.62),k,8.4)+sg(l.k,l.a,s,5.4)+sg(l.a,l.f,o,5)},
  Arm=(a,f)=>{const s=f?'xs2':'xs',c=f?'xc2':'xc';return sg(N,a.e,c,5.8)+sg(a.e,a.w,s,4.4)+'<circle class="'+s+'f" cx="'+a.w[0].toFixed(1)+'" cy="'+a.w[1].toFixed(1)+'" r="2.5"/>'},
  fc=[H[0]+v[0]*1.2,H[1]+v[1]*1.2],hc=[H[0]-v[0]*1.1,H[1]-v[1]*1.1];
 return'<g transform="translate('+(x0||0)+' 0)">'+pr
  +Arm(af,1)+Leg(lf,1)
  +sg(P,N,'xc',11.5)+'<circle class="xk" cx="'+P[0].toFixed(1)+'" cy="'+P[1].toFixed(1)+'" r="5.6"/>'
  +Leg(ln,0)+sg(N,[N[0]+4.5*u[0],N[1]+4.5*u[1]],'xs',4)
  +Arm(an,0)
  +'<circle class="xr" cx="'+hc[0].toFixed(1)+'" cy="'+hc[1].toFixed(1)+'" r="6.4"/><circle class="xs" cx="'+fc[0].toFixed(1)+'" cy="'+fc[1].toFixed(1)+'" r="5.6"/></g>'}
function exSvg(id,big){
 const e=EX[id]||MX[id];
 return'<svg class="'+(big?'exb':'exs')+'" viewBox="0 -6 244 96" role="img" aria-label="'+esc(e.n)+': '+esc(e.cap[0])+', dann '+esc(e.cap[1])+'">'
  +xFig(e.p[0],e.pr,0)+xFig(e.p[1],e.pr,124)+'</svg>'}
const KSET={side:[2,2],plank:[2,2],bird:[2,2]},KSD={A:'Beine & Hüfte',B:'Stabilität & Rumpf'};
const krSets=(id,n)=>(KSET[id]||[3,2])[n>=3?0:1];
function krMeta(d){
 const C=CF(),sd=(C&&C.strD)||[],dw=(d.getDay()+6)%7,ix=Math.max(0,sd.indexOf(dw)),wk=Math.round((mon(d)-mon(START))/(7*D));
 const ss=sd.length>=2?(ix==0?'A':'B'):(wk%2==0?'A':'B');return{s:ss,n:wtr(d)<=3?2:3}}
function krTxt(k,n){return KSES[k].e.map(id=>EX[id].n).join(', ')}
let KRX={s:'A',n:3};
function krModal(h){const m=$('#im');m.hidden=false;m.innerHTML='<div class="box krbox">'+h+'</div>';m.onclick=e=>{if(e.target===m)m.hidden=true};const x=$('#krx');if(x)x.onclick=()=>{m.hidden=true}}
function openKr(k,n){
 KRX={s:k,n:+n||3};const S0=KSES[k];
 krModal('<h3>Krafttraining · Einheit '+k+'</h3><div class="mu">'+KSD[k]+' · ca. 20–25 min · ohne Geräte, ein Stuhl und ein Rucksack genügen</div>'
  +'<div class="krl">'+S0.e.map(id=>{const e=EX[id],sn=krSets(id,KRX.n);return'<button type="button" class="kri" data-ex="'+id+'"><span class="krt"><b>'+esc(e.n)+'</b><small>'+sn+' × '+esc(e.r)+'</small><small>'+esc(e.m)+'</small></span><span class="krp">'+exSvg(id,0)+'</span></button>'}).join('')+'</div>'
  +'<div class="krn"><b>So gehst du vor</b><ul><li>Kraft kommt nach dem lockeren Lauf. Davor genügen 2–3 min Marschieren oder Kniebeugen ohne Gewicht zum Warmwerden.</li><li>Pause zwischen den Sätzen: 45–60 s. Zwischen den Übungen darfst du kurz durchatmen.</li><li>Sauber ausführen schlägt mehr Wiederholungen. Bei Schmerz (nicht Muskelbrennen) die Übung abbrechen oder die leichtere Variante nehmen.</li>'+(KRX.n<3?'<li>Rennen naht: Der Umfang ist auf '+KRX.n+' Sätze reduziert, damit du frisch bleibst.</li>':'')+'</ul></div>'
  +'<div class="b"><button class="pri" id="krx">Schließen</button></div>')}
function openEx(id){
 const e=EX[id];if(!e)return;const sn=krSets(id,KRX.n),z=EX[e.ez];
 krModal('<h3>'+esc(e.n)+'</h3><div class="mu">'+esc(e.m)+' · '+sn+' × '+esc(e.r)+'</div>'
  +'<div class="exw">'+exSvg(id,1)+'<div class="exc"><span>'+esc(e.cap[0])+'</span><span>'+esc(e.cap[1])+'</span></div></div>'
  +'<h4>Ausführung</h4><ol class="exo">'+e.st.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ol>'
  +'<h4>Häufige Fehler</h4><ul class="exo">'+e.fe.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>'
  +'<h4>Warum für Läufer</h4><p class="exo">'+esc(e.wh)+'</p>'
  +'<div class="exv"><div><b>Zu schwer?</b>'+(z?'<br><button type="button" class="chip" data-ex="'+e.ez+'">'+esc(z.n)+' ›</button>':'<br><span>Weniger Dauer oder Bereich verkleinern, die Haltung bleibt sauber.</span>')+'</div><div><b>Zu leicht?</b><br><span>'+esc(e.hd)+'</span></div></div>'
  +'<div class="b"><button id="krb2" type="button">‹ Zur Einheit</button><button class="pri" id="krx">Schließen</button></div>');
 $('#krb2').onclick=()=>openKr(KRX.s,KRX.n)}
/* ===== Mobility (Dehn- und Mobilisationsübungen) ===== */
const MXW='<line class="xw" x1="96" x2="96" y1="4" y2="84"/>';
const MX={
 hfl:{n:'Hüftbeuger-Dehnung (kniend)',m:'Hüftbeuger, vorderer Oberschenkel',r:'2 × 45 s je Seite',cap:['Einstieg','Dehnposition'],pr:XG,
  p:[{P:[54,60],T:0,ln:[78,81],lf:[30,80],fb:0,an:[56,56],af:[56,56],kn:'f',kf:'d',en:'b',ef:'b'},{P:[62,61],T:0,ln:[78,81],lf:[30,80],fb:0,an:[64,56],af:[64,56],kn:'f',kf:'d',en:'b',ef:'b'}],
  st:['Knie auf eine weiche Unterlage (Handtuch oder Matte) legen, den anderen Fuß flach vor dir aufstellen. Das vordere Knie steht über dem Knöchel.','Oberkörper aufrecht, Hände an den Hüften. Spanne das Gesäß des hinteren Beins an und kippe das Becken leicht nach hinten (Bauchnabel Richtung Brust).','Schiebe das Becken langsam nach vorn, bis du vorne an der Hüfte des hinteren Beins eine deutliche, aber angenehme Dehnung spürst.','Halte 45 Sekunden, atme ruhig weiter und wechsle dann die Seite.'],
  fe:['Hohlkreuz: Die Rippen bleiben unten, sonst dehnt der Rücken statt der Hüfte.','Das vordere Knie schiebt weit über die Zehen.','Der Oberkörper kippt nach vorn.'],
  wh:'Beim Laufen streckt sich die Hüfte hinter dem Körper. Verkürzte Hüftbeuger ziehen ins Hohlkreuz und verkürzen die Schrittlänge.'},
 calfs:{n:'Wadendehnung an der Wand',m:'Waden, Achillessehne',r:'2 × 45 s je Seite',cap:['Einstieg','Dehnposition'],pr:XG+MXW,
  p:[{P:[60,46],T:14,ln:[72,81],lf:[40,81],fb:0,an:[94,28],af:[94,28],kn:'f',kf:'b',en:'d',ef:'d'},{P:[64,48],T:22,ln:[76,81],lf:[42,81],fb:0,an:[95,32],af:[95,32],kn:'f',kf:'b',en:'d',ef:'d'}],
  st:['Stelle dich etwa eine Armlänge vor eine Wand und stütze die Hände auf Brusthöhe ab.','Ein Bein geht einen großen Schritt zurück. Die Ferse bleibt am Boden, das Bein ist gestreckt, die Zehen zeigen nach vorn.','Beuge das vordere Knie und schiebe die Hüfte Richtung Wand, bis du die Dehnung in der Wade des hinteren Beins spürst.','Halte 45 Sekunden. Beuge dann das hintere Knie leicht, das dehnt den tiefen Wadenmuskel und die Achillessehne. Wechsle die Seite.'],
  fe:['Die Ferse hebt ab.','Der Fuß dreht nach außen.','Hohlkreuz, statt den ganzen Körper in einer Linie zu halten.'],
  wh:'Waden und Achillessehne tragen bei jedem Schritt ein Mehrfaches deines Körpergewichts. Beweglichkeit hier schützt vor Waden- und Achillessehnenbeschwerden.'},
 glu:{n:'Gesäßdehnung (Rückenlage)',m:'Gesäß, tiefe Hüftmuskeln',r:'2 × 45 s je Seite',cap:['Einstieg','Dehnposition'],pr:XG,
  p:[{P:[52,78],T:-90,ln:[72,81],lf:[72,81],an:[50,81],af:[50,81],kn:'u',kf:'u',en:'d',ef:'d'},{P:[52,78],T:-90,ln:[44,56],lf:[72,81],an:[40,62],af:[40,62],kn:'u',kf:'u',en:'u',ef:'u'}],
  st:['Lege dich auf den Rücken und stelle beide Füße auf.','Hebe ein Bein an, umfasse das Knie mit beiden Händen und ziehe es langsam zur gegenüberliegenden Schulter, bis du die Dehnung im Gesäß spürst. Das andere Bein bleibt aufgestellt.','Halte 45 Sekunden. Kopf und Schultern bleiben entspannt am Boden.','Wechsle die Seite. Für mehr Dehnung legst du den Knöchel des gehobenen Beins auf das Knie des aufgestellten Beins und ziehst dieses zur Brust.'],
  fe:['Das Becken hebt auf einer Seite vom Boden ab.','Zu schnell und mit Kraft ziehen, statt langsam zu steigern.','Nacken und Schultern verspannen.'],
  wh:'Gesäß und tiefe Hüftmuskeln stabilisieren Becken und Knie bei jedem Schritt. Verspannungen hier hängen oft mit Knie- und Rückenbeschwerden zusammen.'},
 quad:{n:'Vordere Oberschenkel (stehend)',m:'Oberschenkelvorderseite',r:'2 × 45 s je Seite',cap:['Einstieg','Dehnposition'],pr:XG,
  p:[{P:[56,42],T:0,ln:[56,81],lf:[50,68],lfa:90,an:[60,36],af:[60,36],kn:'f',kf:'d',en:'f',ef:'f'},{P:[56,44],T:0,ln:[56,81],lf:[44,48],lfa:100,an:[58,46],af:[46,44],kn:'f',kf:'d',en:'f',ef:'b'}],
  st:['Stelle dich aufrecht hin. Bei Bedarf hältst du dich mit einer Hand an einer Wand oder Stuhllehne fest.','Beuge ein Knie und greife den Fuß oder Knöchel hinter dir.','Ziehe die Ferse zum Gesäß. Die Knie bleiben dicht beieinander, das Becken kippt leicht nach vorn (Gesäß anspannen).','Halte 45 Sekunden und wechsle dann die Seite.'],
  fe:['Hohlkreuz: Das Gesäß bleibt angespannt, die Rippen unten.','Das Knie driftet nach vorn oder zur Seite.','Das Standbein ist durchgedrückt, es bleibt locker.'],
  wh:'Der vordere Oberschenkel bremst bei jeder Landung. Besonders bei langen Läufen und Bergab wird er stark beansprucht.'},
 ham:{n:'Hintere Oberschenkel (Rückenlage)',m:'Hintere Oberschenkel',r:'2 × 45 s je Seite',cap:['Einstieg','Dehnposition'],pr:XG,
  p:[{P:[52,78],T:-90,ln:[58,39],lf:[93,81],an:[58,60],af:[58,60],kn:'u',kf:'u',en:'u',ef:'u'},{P:[52,78],T:-90,ln:[44,43],lf:[93,81],an:[46,58],af:[46,58],kn:'u',kf:'u',en:'u',ef:'u'}],
  st:['Lege dich auf den Rücken. Ein Bein liegt gestreckt oder aufgestellt am Boden.','Strecke das andere Bein nach oben und greife mit beiden Händen (oder einem Handtuch um den Fuß) hinter den Oberschenkel.','Ziehe das Bein sanft zu dir, bis du hinten am Oberschenkel eine Dehnung spürst. Das Knie darf leicht gebeugt bleiben.','Halte 45 Sekunden, das Becken bleibt am Boden. Wechsle die Seite.'],
  fe:['Das Becken kippt mit und hebt vom Boden ab.','Ruckartig ziehen, statt langsam zu steigern.','Die Schultern ziehen zu den Ohren.'],
  wh:'Die hinteren Oberschenkel bremsen das Bein beim Vorschwung und sind bei Tempoeinheiten besonders beansprucht.'},
 gbm:Object.assign({},EX.gb,{n:'Glute Bridge',r:'2 × 12',m:'Gesäß, hintere Oberschenkel',
  st:['Lege dich auf den Rücken, die Füße stehen hüftbreit nah am Gesäß, die Arme liegen neben dem Körper.','Spanne das Gesäß an und hebe die Hüfte, bis Schultern, Hüfte und Knie eine Linie bilden.','Halte oben 1–2 s und senke die Hüfte langsam wieder ab.'],
  fe:['Hohlkreuz: Die Rippen bleiben unten.','Die Hüfte kippt zur Seite.','Du drückst über die Zehen statt über die Fersen.'],
  wh:'Die Übung aktiviert das Gesäß. Es streckt beim Laufen die Hüfte und hält das Becken stabil.'})
};
const MOBS={post:['hfl','calfs','glu'],rest:['hfl','calfs','quad','ham','gbm']};
const MOBB=k=>'<button type="button" class="krb" data-mob="'+k+'">Übungen ansehen ›</button>';
function openMob(k){
 const L=MOBS[k]||MOBS.post,rest=k=='rest';
 krModal('<h3>'+(rest?'Mobility am Ruhetag':'Mobility nach dem Lauf')+'</h3><div class="mu">'+L.length+' Übungen · ca. '+(rest?'15':'10')+' min · ohne Geräte, eine Wand und eine Matte genügen</div>'
  +'<div class="krl">'+L.map(id=>{const e=MX[id];return'<button type="button" class="kri" data-mx="'+id+'" data-mk="'+k+'"><span class="krt"><b>'+esc(e.n)+'</b><small>'+esc(e.r)+'</small><small>'+esc(e.m)+'</small></span><span class="krp">'+exSvg(id,0)+'</span></button>'}).join('')+'</div>'
  +'<div class="krn"><b>So gehst du vor</b><ul><li>Dehne nach dem Lauf, wenn die Muskeln warm sind. Vor Tempoabschnitten ist Dehnen nicht nötig, dafür gibt es das Lauf-ABC.</li><li>Steigere die Dehnung langsam, bis ein deutliches, aber angenehmes Ziehen entsteht. Schmerz ist das Signal zum Nachlassen.</li><li>Atme ruhig weiter und halte die Position, ohne zu wippen.</li><li>Faszienrolle optional: je Muskelgruppe 1–2 min, langsam rollen, auf Schmerzpunkten kurz verweilen.</li></ul></div>'
  +'<div class="b"><button class="pri" id="krx">Schließen</button></div>')}
function openMobEx(id,k){
 const e=MX[id];if(!e)return;
 krModal('<h3>'+esc(e.n)+'</h3><div class="mu">'+esc(e.m)+' · '+esc(e.r)+'</div>'
  +'<div class="exw">'+exSvg(id,1)+'<div class="exc"><span>'+esc(e.cap[0])+'</span><span>'+esc(e.cap[1])+'</span></div></div>'
  +'<h4>Ausführung</h4><ol class="exo">'+e.st.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ol>'
  +'<h4>Häufige Fehler</h4><ul class="exo">'+e.fe.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>'
  +'<h4>Warum für Läufer</h4><p class="exo">'+esc(e.wh)+'</p>'
  +'<div class="b"><button id="mxb" type="button">‹ Zur Übersicht</button><button class="pri" id="krx">Schließen</button></div>');
 $('#mxb').onclick=()=>openMob(k||'post')}
lifecycle.listen(document,'click',e=>{const t=e.target.closest&&e.target.closest('[data-mob],[data-mx]');if(!t)return;e.preventDefault();e.stopPropagation();if(t.dataset.mx)openMobEx(t.dataset.mx,t.dataset.mk);else openMob(t.dataset.mob)},true);
/* ===== Lauf-ABC (Technikübungen im Aufwärmen) ===== */
const ABC=[
 {n:'Fußgelenksarbeit',r:'2 × 20 m',s:'Kleine, schnelle Schritte allein aus dem Fußgelenk. Die Fußspitze zieht nach oben, die Ferse bleibt knapp über dem Boden, die Knie sind fast gestreckt.',f:'Kurzer, elastischer Bodenkontakt'},
 {n:'Kniehebelauf',r:'2 × 20 m',s:'Das Knie bis etwa auf Hüfthöhe heben, das Standbein streckt sich. Der Fuß landet unter der Hüfte. Aufrecht bleiben, die Arme schwingen im Gegentakt.',f:'Hohe Hüfte, aufrechte Haltung'},
 {n:'Anfersen',r:'2 × 20 m',s:'Die Ferse zieht zum Gesäß, das Knie zeigt dabei nach unten und bleibt unter der Hüfte. Kein Hohlkreuz, der Oberkörper bleibt leicht nach vorn geneigt.',f:'Ferse zum Gesäß, Knie unter der Hüfte'},
 {n:'Hopserlauf (Skipping)',r:'2 × 20 m',s:'Mit jedem Schritt ein kleiner Hüpfer: Knie hoch, der Gegenarm schwingt mit, die Landung erfolgt auf dem Vorfuß unter dem Körper. Rhythmisch und locker bleiben.',f:'Rhythmus und Armtakt'},
 {n:'Armeinsatz',r:'2 × 20 s',s:'Aufrecht stehen oder locker traben. Die Ellbogen sind etwa im rechten Winkel, die Arme schwingen aus der Schulter vor und zurück, die Hände bleiben locker, die Schultern entspannt.',f:'Lockere Schultern, kein Kreuzen vor der Brust'}];
function abcDays(ws){
 const q=[],e=[];
 for(let i=0;i<7;i++){const d=addD(ws,i),p=plan(d);if(!p||!(p.km>0))continue;
  if(p.t=='q')q.push(iso(d));else if(p.t=='easy'&&/Steigerung/.test(p.d||''))e.push(iso(d))}
 return new Set(q.concat(e).slice(0,2))}
function abcOn(p,d){return!S.noPlan&&!!p&&(p.t=='q'||p.t=='easy')&&p.km>0&&abcDays(mon(d)).has(iso(d))}
const ABCB='<button type="button" class="krb" data-abc="1">Übungen ansehen ›</button>';
function openAbc(){
 krModal('<h3>Lauf-ABC</h3><div class="mu">5 Technikübungen · ca. 6–8 min · gehört ins Aufwärmen, keine eigene Einheit</div>'
  +'<div class="krn"><b>So gehst du vor</b><ul><li>Erst 10–15 min locker einlaufen, dann die Übungen, danach Steigerungen oder der Hauptteil.</li><li>Jede Übung über etwa 20 m, zurück gehst du locker. Das ist die Pause.</li><li>Konzentriert und locker ausführen, nicht ermüden. Die Übungen schulen Technik und Elastizität und sind kein Krafttraining.</li><li>Auf ebenem, festem Untergrund. Bei müden oder schmerzenden Beinen auslassen.</li></ul></div>'
  +'<div class="krl">'+ABC.map((e,i)=>'<div class="abi"><span class="abn">'+(i+1)+'</span><div><b>'+esc(e.n)+'</b><small>'+esc(e.r)+' · Fokus: '+esc(e.f)+'</small><p>'+esc(e.s)+'</p></div></div>').join('')+'</div>'
  +'<div class="krn"><b>Wann im Plan</b><ul><li>Vor Qualitätseinheiten. Gibt es in einer Woche nur eine, kommt ein lockerer Tag mit Steigerungen dazu. Höchstens zweimal pro Woche.</li><li>Vor dem Longrun und nach harten Einheiten nicht nötig.</li></ul></div>'
  +'<div class="b"><button class="pri" id="krx">Schließen</button></div>')}
lifecycle.listen(document,'click',e=>{const t=e.target.closest&&e.target.closest('[data-abc]');if(!t)return;e.preventDefault();e.stopPropagation();openAbc()},true);
lifecycle.listen(document,'click',e=>{const t=e.target.closest&&e.target.closest('[data-ex],[data-kr]');if(!t)return;e.preventDefault();e.stopPropagation();if(t.dataset.ex)openEx(t.dataset.ex);else openKr(t.dataset.kr,t.dataset.ks)},true);

function readiness(){
 const R={pts:0,why:[],good:[],pain:0,m:{},f:{}};
 const fx=(k,n)=>{R.pts+=n;R.f[k]=(R.f[k]||0)+n};
 const H=[];for(let i=1;i<=28;i++){const d=addD(today,-i);const l=S.log[iso(d)];H.push({i,l:(l&&l.done)?l:null})}
 const W=S.well||{},wl=W[iso(today)]||{};
 {const v=+wl.rd;if(wl.rd!=null&&v>0){R.m.rdRaw=v;R.m.rd=Math.max(1,Math.min(100,Math.round(v<=10?v*10:v)))}}
 const sl=wl.sleep!=null?wl.sleep:null;R.m.sleep=sl;R.m.sleepSrc=wl.sleep!=null?'Intervals.icu':'';
 if(sl!=null){if(sl<5.5){fx('sleep',2);R.why.push('Nur ca. '+r1(sl)+' h Schlaf.')}else if(sl<6.5){fx('sleep',1);R.why.push('Eher kurze Nacht (ca. '+r1(sl)+' h).')}else if(sl>=7.5)R.good.push('Gut geschlafen (ca. '+r1(sl)+' h).')}
 const others=Object.keys(W).filter(k=>k!==iso(today)&&k>=iso(addD(today,-28))).map(k=>W[k]);
 const avg=f=>{const v=others.map(o=>o[f]).filter(x=>x>0);return v.length>=4?v.reduce((a,b)=>a+b)/v.length:null};
 const rb=avg('rhr'),hb=avg('hrv');
 if(wl.rhr>0){R.m.rhr=wl.rhr;R.m.rhrB=rb;if(rb&&wl.rhr-rb>=8){fx('rhr',2);R.why.push('Ruhepuls '+Math.round(wl.rhr)+' (sonst Ø '+Math.round(rb)+').')}else if(rb&&wl.rhr-rb>=5){fx('rhr',1);R.why.push('Ruhepuls erhöht: '+Math.round(wl.rhr)+' (sonst Ø '+Math.round(rb)+').')}}
 if(wl.hrv>0){R.m.hrv=wl.hrv;R.m.hrvB=hb;if(hb&&wl.hrv<hb*.75){fx('hrv',2);R.why.push('HRV deutlich unter deinem Schnitt.')}else if(hb&&wl.hrv<hb*.85){fx('hrv',1);R.why.push('HRV unter deinem Schnitt.')}}
 const wf=W[iso(today)]||W[iso(addD(today,-1))]||{};
 if(wf.ctl!=null&&wf.atl!=null){R.m.form=wf.ctl-wf.atl;if(R.m.form<-30){fx('form',1);R.why.push('Form stark negativ ('+Math.round(R.m.form)+'): viel aufgestaute Ermüdung.')}}
 const lr=H.filter(h=>h.l&&h.i<=5&&+h.l.rpe>0).slice(0,3);
 if(lr.length){const a=lr.reduce((s,h)=>s+(+h.l.rpe),0)/lr.length;R.m.rpe=a;if(a>=8){fx('rpe',2);R.why.push('Die letzten Läufe waren sehr hart (RPE Ø '+a.toFixed(1)+').')}else if(a>=7){fx('rpe',1);R.why.push('Die letzten Läufe waren hart (RPE Ø '+a.toFixed(1)+').')}}
 const y=H.find(h=>h.i==1&&h.l);if(y&&+y.l.rpe>=8){fx('rpe',1);R.why.push('Gestern war sehr anstrengend.')}
 let st=0;for(const h of H){if(h.l)st++;else break}R.m.streak=st;
 if(st>=7){fx('streak',2);R.why.push(st+' Lauftage in Folge: ein freier Tag ist überfällig.')}else if(st>=6){fx('streak',1);R.why.push(st+' Lauftage in Folge.')}
 const ac=H.filter(h=>h.i<=7&&h.l).reduce((s,h)=>s+(+h.l.km||0),0);R.m.acute=ac;
 const sp=Math.max(0,...H.filter(h=>h.l).map(h=>h.i));if(sp>=21){const ch=H.filter(h=>h.i>7&&h.l).reduce((s,h)=>s+(+h.l.km||0),0)/Math.min(3,(sp-7)/7);R.m.chronic=ch;if(ch>=10){const q=ac/ch;R.m.ratio=q;if(q>1.5){fx('ratio',2);R.why.push('Der Umfang der letzten 7 Tage ist '+q.toFixed(1)+'× so hoch wie dein 4-Wochen-Schnitt.')}else if(q>1.3){fx('ratio',1);R.why.push('Der Umfang steigt schnell ('+q.toFixed(1)+'× dein Schnitt).')}}}
 R.w=R.m.rd!=null?5:13;R.adj=-R.pts*R.w;
 R.score=R.m.rd!=null?Math.max(1,Math.min(100,R.m.rd+R.adj)):Math.max(15,100-R.pts*13);
 R.lvl=R.score>=75?0:R.score>=50?1:2;
 if(!R.why.length&&!R.good.length)R.good.push('Keine Warnsignale in deinen Daten.');
 return R}

/* ===== Heute: Woche, Kennzahlen, Zustand, 3 Schritte ===== */
const IC={
 run:'<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6M12 2v3"/></svg>',
 food:'<svg viewBox="0 0 24 24"><path d="M6 3v7a2 2 0 0 0 4 0V3M8 3v18M17 21V3c-2.5 1.5-4 4.5-4 8h4"/></svg>',
 moon:'<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>'};
const PF=()=>S.prof||{};
const dshort=k=>{const d=typeof k=='string'?parse(k):k;return pad(d.getDate())+'.'+pad(d.getMonth()+1)+'.'};
const dfull=d=>dshort(d)+d.getFullYear();
const distName=km=>Math.abs(km-42.195)<.5?'Marathon':Math.abs(km-21.0975)<.4?'Halbmarathon':(Math.round(km*10)/10)+' km';
const fres=r=>distName(r.km)+' '+(r.sec>=3600?ft(r.sec):fp(r.sec));
const dec=(x,n)=>(Math.round(x*Math.pow(10,n))/Math.pow(10,n)).toString().replace('.',',');
const tile=(l,v,s)=>'<div class="st"><span>'+l+'</span><b>'+v+'</b><span>'+s+'</span></div>';
const mean=a=>{a=a.filter(x=>x!=null);return a.length?a.reduce((s,x)=>s+x,0)/a.length:null};
const cnt=s=>s.filter(x=>x!=null).length;
function wser(f,n,z){const W=S.well||{},o=[];for(let i=n-1;i>=0;i--){const v=(W[iso(addD(today,-i))]||{})[f];o.push(v!=null&&(z||v>0)?+v:null)}return o}
function spark(vals){
 const pts=[];vals.forEach((v,i)=>{if(v!=null)pts.push([i,v])});
 if(pts.length<2)return'';
 const Wd=84,H=28,mn=Math.min(...pts.map(p=>p[1])),mx=Math.max(...pts.map(p=>p[1])),rg=(mx-mn)||1,n=Math.max(1,vals.length-1);
 const xy=p=>[(3+p[0]/n*(Wd-6)).toFixed(1),(mx==mn?H/2:H-4-(p[1]-mn)/rg*(H-8)).toFixed(1)];
 const l=xy(pts[pts.length-1]);
 return '<svg class="sp" viewBox="0 0 '+Wd+' '+H+'" width="'+Wd+'" height="'+H+'" aria-hidden="true"><polyline points="'+pts.map(p=>xy(p).join(',')).join(' ')+'" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="'+l[0]+'" cy="'+l[1]+'" r="2.6" fill="currentColor"/></svg>'}
const arrow=(d,u,dp)=>{if(d==null)return'';const a=Math.abs(d)<(dp?0.05:0.5)?'●':d>0?'▲':'▼';return a+' '+(d>0?'+':d<0?'−':'')+Math.abs(d).toFixed(dp||0).replace('.',',')+(u?' '+u:'')};
const trow=(key,name,val,unit,ar,cls,sub,vals)=>'<button type="button" class="tr '+cls+'" data-ch="'+key+'"><div class="tx"><div class="tn">'+name+inf('t_'+key)+'</div><div class="tv"><b>'+val+'</b> '+unit+(ar?'<span class="ar">'+ar+'</span>':'')+'</div>'+(sub?'<small>'+sub+'</small>':'')+'</div>'+spark(vals)+'<span class="chev">›</span></button>';
const lastv=s=>{for(let i=s.length-1;i>=Math.max(0,s.length-3);i--)if(s[i]!=null)return s[i];return null};

function trends(R){
 const o=[];const trow=(...a)=>a;
 let s=wser('rhr',28),c=lastv(s),b=mean(s.slice(0,-3));
 if(c!=null&&cnt(s)>=2){const d=b!=null?c-b:null;o.push(trow('rhr','Ruhepuls',Math.round(c),'bpm',arrow(d!=null?Math.round(d):null,'',0),d==null?'neu':d>=5?'bad':d<=-3?'good':'neu','Ø '+(b!=null?Math.round(b):'–')+' bpm der letzten 4 Wochen',s.slice(-14)))}
 s=wser('hrv',28);c=lastv(s);b=mean(s.slice(0,-3));
 if(c!=null&&cnt(s)>=2){const d=b!=null?c-b:null;o.push(trow('hrv','HRV',Math.round(c),'ms',arrow(d!=null?Math.round(d):null,'',0),b==null?'neu':c<b*.85?'bad':c>b*1.1?'good':'neu','Ø '+(b!=null?Math.round(b):'–')+' ms der letzten 4 Wochen',s.slice(-14)))}
 s=wser('sleep',14);c=lastv(s);b=mean(s.slice(0,-3));
 if(c!=null&&cnt(s)>=2){const d=b!=null?c-b:null;o.push(trow('sleep','Schlaf',dec(c,1),'h',arrow(d,'',1),c<6.5?'bad':c>=7.5?'good':'neu','Ø '+(b!=null?dec(b,1):'–')+' h der letzten 2 Wochen',s.slice(-14)))}
 s=wser('ctl',42,true);c=lastv(s);b=mean(s.slice(0,7));
 if(c!=null&&cnt(s)>=3){const d=b!=null?c-b:null,fm=R.m.form,fl=fm==null?'':fm>5?'frisch':fm>=-10?'neutral':fm>=-30?'produktiv':'hohe Ermüdung';
  o.push(trow('ctl','Fitness (CTL)',Math.round(c),'',arrow(d!=null?Math.round(d):null,'',0),d==null?'neu':d>=2?'good':'neu',fm!=null?'Form '+Math.round(fm)+' · '+fl:'Entwicklung der letzten 6 Wochen',s.slice(-28)))}
 {const cs=wser('ctl',42,true),as=wser('atl',42,true),fs=cs.map((v,i)=>v!=null&&as[i]!=null?v-as[i]:null),c2=lastv(fs);if(c2!=null&&cnt(fs)>=3)o.push(trow('form','Form (CTL−ATL)',Math.round(c2),'','',c2<-30?'bad':'neu',c2>5?'frisch':c2>=-10?'neutral':c2>=-30?'produktiv ermüdet':'hohe Ermüdung',fs.slice(-28)))}
 const wk=[];for(let i=5;i>=0;i--){let t=0;for(let j=0;j<7;j++){const l=S.log[iso(addD(today,-7*i-j))];if(l&&l.done)t+=+l.km||0}wk.push(t)}
 if(wk[5]+wk[4]+wk[3]>0){const b2=mean(wk.slice(0,5).filter(x=>x>0)),d=b2!=null?wk[5]-b2:null;
  o.push(trow('km','Wochenumfang',Math.round(wk[5]),'km (7 Tage)',arrow(d!=null?Math.round(d):null,'km',0),b2!=null&&b2>=10&&wk[5]/b2>1.3?'bad':'neu',(R.m.streak||0)+' Lauftage am Stück'+(b2!=null?' · Ø '+Math.round(b2)+' km/Woche':''),wk))}
 const rp=[];for(let i=1;i<=28;i++){const l=S.log[iso(addD(today,-i))];if(l&&l.done&&+l.rpe>0)rp.unshift(+l.rpe)}
 if(rp.length>=2){const last=rp.slice(-3),a=mean(last);o.push(trow('rpe','Anstrengung',dec(a,1),'RPE Ø','',a>=8?'bad':a<=5?'good':'neu','letzte '+last.length+' Läufe',rp.slice(-8)))}
  return o}
const trendsHtml=R=>trends(R).map(a=>trow(...a)).join('');
/* ===== Zustand im Detail (Leistung) ===== */
function spark2(vals){
 const pts=[];vals.forEach((v,i)=>{if(v!=null)pts.push([i,v])});
 if(pts.length<2)return'';
 const Wd=104,H=46,mn=Math.min(...pts.map(p=>p[1])),mx=Math.max(...pts.map(p=>p[1])),rg=(mx-mn)||1,n=Math.max(1,vals.length-1);
 const X=i=>3+i/n*(Wd-8),Y=v=>mx==mn?H/2:H-6-(v-mn)/rg*(H-12);
 const xy=pts.map(q=>[+X(q[0]).toFixed(1),+Y(q[1]).toFixed(1)]),l=xy[xy.length-1],f=xy[0];
 const av=mean(pts.map(q=>q[1])),ay=Y(av).toFixed(1);
 const line=xy.map(q=>q.join(',')).join(' '),area='M'+f[0]+','+H+' L'+xy.map(q=>q.join(',')).join(' L')+' L'+l[0]+','+H+' Z';
 return '<svg class="sp2" viewBox="0 0 '+Wd+' '+H+'" width="'+Wd+'" height="'+H+'" aria-hidden="true"><path d="'+area+'" fill="currentColor" opacity=".13"/><line x1="3" x2="'+(Wd-5)+'" y1="'+ay+'" y2="'+ay+'" stroke="currentColor" stroke-width="1" stroke-dasharray="3 3" opacity=".45"/><polyline points="'+line+'" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="'+l[0]+'" cy="'+l[1]+'" r="3.2" fill="currentColor"/><circle cx="'+l[0]+'" cy="'+l[1]+'" r="5.6" fill="currentColor" opacity=".18"/></svg>'}
const ZIC={rhr:'<path d="M12 20.5s-7.2-4.5-9.4-9A5.2 5.2 0 0 1 12 6.4a5.2 5.2 0 0 1 9.4 5.1c-2.2 4.5-9.4 9-9.4 9z"/>',hrv:'<path d="M3 12h4l2.2-6 4.2 12 2.4-6H21"/>',sleep:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',ctl:'<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',form:'<rect x="3" y="8" width="16" height="9" rx="2"/><path d="M21.5 11v3"/><path d="M7 11.5v2.5M11 11.5v2.5"/>',km:'<path d="M12 21s6-5.2 6-10a6 6 0 0 0-12 0c0 4.8 6 10 6 10z"/><circle cx="12" cy="11" r="2.2"/>',rpe:'<path d="M4 17a8 8 0 1 1 16 0"/><path d="M12 17l4-5"/>'};
const ZST={good:'Gut',bad:'Beachten',neu:'Normal'};
function zrow(a){const[key,name,val,unit,ar,cls,sub,vals]=a;
 return'<button type="button" class="zr '+cls+'" data-ch="'+key+'"><span class="zic"><svg viewBox="0 0 24 24">'+(ZIC[key]||'')+'</svg></span>'
  +'<span class="zb"><span class="zn">'+name+inf('t_'+key)+'</span><span class="zvv"><b>'+val+'</b>'+(unit?'<u>'+unit.replace(' (7 Tage)','')+'</u>':'')+(ar?'<em>'+ar+'</em>':'')+'</span><small>'+sub+'</small></span>'
  +'<span class="zr2">'+spark2(vals)+'<span class="zbd">'+ZST[cls]+'</span></span></button>'}
function zdetail(R){
 const T=trends(R);if(!T.length)return'';
 const G=[['Erholung','Wie gut dein Körper sich erholt','rec',['rhr','hrv','sleep']],['Fitness & Belastung','Was du aufgebaut hast und wie viel du trägst','fit',['ctl','form','km','rpe']]];
 const bad=T.filter(a=>a[5]=='bad').length,good=T.filter(a=>a[5]=='good').length;
 const sum=bad?bad+(bad>1?' Werte':' Wert')+' beachten':good?'Alles im grünen Bereich':'Alle Werte normal',sc=bad?'bad':good?'good':'neu';
 const gs=G.map(g=>{const rows=g[3].map(k=>T.find(a=>a[0]==k)).filter(Boolean);if(!rows.length)return'';
  const gb=rows.filter(a=>a[5]=='bad').length;
  return'<div class="zg"><div class="zgt '+g[2]+'"><b>'+g[0]+'</b><span>'+g[1]+'</span>'+(gb?'<i class="zs bad">'+gb+'×</i>':'')+'</div>'+rows.map(zrow).join('')+'</div>'}).join('');
 return'<div class="zdh"><span class="zs '+sc+'">'+sum+'</span></div>'+gs+'<small class="zleg">Gestrichelte Linie: dein Durchschnitt im gezeigten Zeitraum</small>'}


/* ===== Info-Icons ===== */
const inf=k=>'<span class="inf" role="button" tabindex="0" aria-label="Info" data-i="'+k+'">i</span>';
const fmtPct=x=>(x>0?'+':x<0?'−':'')+Math.abs(x).toFixed(1).replace('.',',')+' %';
const INFO={
 prog:()=>{const m=progn()[42.195];return{t:'Prognose',b:'<p><b>Woher:</b> ausschließlich aus deinen Läufen der letzten 26 Wochen (Intervals.icu und manuelle Einträge). Du kannst sie nicht selbst eintragen.</p><p><b>Berechnung:</b> Jeder Lauf ab 3 km wird mit der Riegel-Formel auf die Zieldistanz hochgerechnet: Zeit × (Zieldistanz ÷ Laufdistanz)<sup>1,06</sup>. Ältere Läufe zählen weniger (pro Woche 0,4 % Abzug). Der beste Wert zählt. Für 10 km, 15 km, Halbmarathon und Marathon muss ein Lauf mindestens 30 % der Zieldistanz lang sein.</p><p><b>Grenzen:</b> Locker gelaufene Läufe ergeben vorsichtige Werte. Wettkämpfe und harte Tests machen die Prognose genauer.</p>'+(m?'<p><b>Basis für den Marathon:</b> '+esc(m.r.n)+' am '+dfull(parse(m.r.d))+' ('+dec(m.r.km,1)+' km in '+dur(m.r.sec)+').</p>':'')}},
 week:{t:'Diese Woche',b:'<p><b>Plan:</b> geplante Kilometer von Montag bis Sonntag, inklusive deiner Wochenanpassung im Kalender.</p><p><b>Gelaufen:</b> Summe der erledigten Läufe aus Intervals.icu und deinen manuellen Einträgen. Der Balken zeigt den erfüllten Anteil.</p>'},
 wkm:{t:'Geplante Wochen-km',b:'<p>Summe der geplanten Kilometer dieser Woche. Sie ergibt sich aus der Umfangskurve deines Plans (Wochen bis zum Rennen), minus 22 % in Entlastungswochen und deiner Anpassung im Kalender.</p><p>Darunter: bisher gelaufen (Intervals.icu und manuelle Einträge) und die geplanten Kilometer der nächsten Woche.</p>'},
 wk0:{t:'Wochen-km',b:'<p>Summe deiner erledigten Läufe von Montag bis Sonntag dieser Woche (Intervals.icu und manuelle Einträge).</p>'},
 rpace:{t:'Renntempo',b:'<p>Zielzeit geteilt durch die Renndistanz. Beispiel: 50:00 min über 10 km ergibt 5:00 /km. Das ist die Basis für Racepace-Einheiten im Plan.</p>'},
 phase:()=>{const w=wtr(today);return{t:'Trainingsphase',b:'<p>Die Phase ergibt sich aus den Wochen bis zum Rennen und der Struktur deines Plans.</p>'+(!S.noPlan?'<p><b>Aktuell – '+esc(ph(w))+':</b> '+(FOCUS[ph(w)]||'')+'</p>':'')}},
 lvl:{t:'Ampel',b:'<p>Sie entsteht aus einem Punktesystem über deine Daten: Ruhepuls und HRV gegen deinen 4-Wochen-Schnitt, Form (Fitness minus Ermüdung), RPE der letzten Läufe, Lauftage in Folge und Umfangssprung.</p><p><b>Bereit:</b> 0–1 Punkte. <b>Anpassen:</b> 2–3 Punkte, die Einheit wird gekürzt oder entschärft. <b>Erholen:</b> ab 4 Punkten oder bei deutlichem Schmerz.</p>'},
 adapt:{t:'Plan-Anpassung',b:'<p>M.oach vergleicht die letzten 14 Tage Plan und Ist. Weniger als 80 % des geplanten Umfangs: die nächsten 14 Tage −10 %. Mittlere RPE ab 8 in den letzten 7 Tagen: −15 %. Sonst keine Änderung.</p>'},
 t_rhr:{t:'Ruhepuls',b:'<p>Morgendlicher Wert aus Intervals.icu (Wellness). Der Pfeil zeigt die Abweichung des aktuellen Werts (jüngster der letzten 3 Tage) vom Schnitt der 28 Tage davor.</p><p>Grün: mindestens 3 Schläge darunter. Rot: mindestens 5 darüber, oft ein Zeichen für Ermüdung, Stress oder Infekt.</p>'},
 t_hrv:{t:'HRV',b:'<p>Herzratenvariabilität aus Intervals.icu (Wellness), gemessen von Uhr oder Tracker. Verglichen wird der aktuelle Wert mit dem Schnitt der 28 Tage davor.</p><p>Grün: mehr als 10 % darüber. Rot: mehr als 15 % darunter. Der Wert ist individuell, nur der Verlauf zählt.</p>'},
 t_sleep:{t:'Schlaf',b:'<p>Schlafdauer pro Nacht aus Intervals.icu (Wellness), Stunden. Der Pfeil vergleicht die letzte Nacht mit dem Schnitt der 2 Wochen davor.</p><p>Grün ab 7,5 h, rot unter 6,5 h.</p>'},
 t_ctl:{t:'Fitness (CTL)',b:'<p>Von Intervals.icu berechnet: gleitender Durchschnitt deiner Trainingslast über etwa 42 Tage. Höher bedeutet mehr aufgebaute Fitness.</p><p>Der Pfeil zeigt die Veränderung gegenüber dem Schnitt der ersten 7 Tage der letzten 6 Wochen.</p>'},
 t_vo2:{t:'VO₂max',b:'<p>Geschätzte maximale Sauerstoffaufnahme (ml/kg/min) aus Intervals.icu (Wellness), meist von deiner Uhr berechnet. Sie ändert sich langsam; wichtig ist der Trend über Wochen, nicht der einzelne Tag.</p><p>Ein steigender Wert spricht für wachsende Ausdauerleistung. Er ist eine Schätzung und weicht je nach Gerät um einige Punkte ab.</p>'},
 t_form:{t:'Form (CTL − ATL)',b:'<p>Fitness (CTL, ~42 Tage) minus Ermüdung (ATL, ~7 Tage), beides aus Intervals.icu.</p><p>Über 5: frisch. −10 bis 5: neutral. −30 bis −10: produktiv ermüdet. Unter −30: hohe Ermüdung.</p>'},
 t_km:{t:'Wochenumfang',b:'<p>Summe deiner erledigten Läufe der letzten 7 Tage (Intervals.icu und manuelle Einträge). Der Pfeil vergleicht mit dem Schnitt der 5 Wochen davor (nur Wochen mit Läufen).</p><p>Rot, wenn der Umfang mehr als 30 % über diesem Schnitt liegt.</p>'},
 t_rpe:{t:'Anstrengung (RPE)',b:'<p>Dein subjektives Empfinden von 1 bis 10, aus Intervals.icu oder deinem Eintrag. Gezeigt wird der Schnitt der letzten bis zu 3 Läufe der letzten 28 Tage.</p><p>Grün bis 5, rot ab 8.</p>'},
 t_pace:{t:'Lauftempo',b:'<p>Durchschnittliche Pace pro Lauf: Dauer ÷ Distanz, nur Läufe ab 3 km. Quelle: Intervals.icu (Bewegungszeit) oder manuelle Einträge.</p>'},
 t_hr:{t:'Ø Puls im Lauf',b:'<p>Durchschnittlicher Puls je Lauf aus Intervals.icu. Läufe ohne Pulsdaten fehlen im Diagramm.</p>'},
 bf_back:{t:'Rückblick',b:'<p>Zählt Läufe und Kilometer der letzten 7 Tage (inklusive heute) aus Intervals.icu und manuellen Einträgen. Verglichen wird mit dem Wochenschnitt der 3 Wochen davor.</p>'},
 bf_perf:{t:'Leistung',b:'<p>Vergleicht deine Marathon-Prognose mit dem Wert von vor 4 Wochen (berechnet nur aus den Läufen bis dahin). Dazu kommen die Fitness (CTL) aus Intervals.icu und das Lauftempo der letzten 14 Tage gegenüber den 4 Wochen davor (Läufe ab 5 km).</p>'},
 bf_rec:{t:'Erholung',b:'<p>Fasst Ruhepuls, HRV, Schlaf und Form aus Intervals.icu sowie deinen Check-in zusammen. Die Einordnung entspricht der Ampel oben.</p>'},
 r_pace:{t:'Pace',b:'<p>Dauer ÷ Distanz des Laufs.</p>'},
 r_hr:{t:'Ø Puls',b:'<p>Durchschnittlicher Puls des Laufs aus Intervals.icu.</p>'},
 r_mx:{t:'Max. Puls',b:'<p>Höchster gemessener Puls. Der höchste Wert aller Läufe dient in der Analyse als Näherung für deine maximale Herzfrequenz.</p>'},
 r_el:{t:'Höhenmeter',b:'<p>Gesamter Anstieg des Laufs laut Intervals.icu.</p>'},
 r_ld:{t:'Trainingslast',b:'<p>Von Intervals.icu berechneter Wert („Training Load“) aus Dauer und Intensität. Er fließt in Fitness (CTL) und Ermüdung (ATL) ein.</p>'},
 r_rpe:{t:'Anstrengung',b:'<p>Dein RPE (1 bis 10) aus Intervals.icu oder deinem Eintrag.</p>'},
 an:{t:'So entsteht die Analyse',b:'<p>Jeder Lauf wird mit Plan und deinen eigenen Daten verglichen: Tempo gegen die Zielbereiche aus deinem Plan, Umfang gegen den Plan, Puls im Verhältnis zur höchsten gemessenen Frequenz, RPE, Trainingslast gegen deinen 4-Wochen-Schnitt, Effizienz (Tempo pro Herzschlag) gegen deine letzten 6 Wochen und Lauftage in Folge.</p><p>Ohne Plan für den Tag schätzt M.oach die Art des Laufs aus Tempo und Länge. Das ist eine Orientierung, kein Urteil.</p>'},
 s_runs:{t:'Läufe',b:'<p>Anzahl der Läufe im gewählten Zeitraum (Intervals.icu und manuelle Einträge).</p>'},
 s_km:{t:'Umfang',b:'<p>Summe der Kilometer im gewählten Zeitraum.</p>'},
 s_pace:{t:'Ø Pace',b:'<p>Gesamtdauer ÷ Gesamtkilometer im gewählten Zeitraum (nur Läufe mit Zeitangabe).</p>'},
 s_hr:{t:'Ø Puls',b:'<p>Mittelwert der Ø-Puls-Werte der Läufe im gewählten Zeitraum, die Pulsdaten haben.</p>'},
 s_long:{t:'Längster Lauf',b:'<p>Längster Einzellauf im gewählten Zeitraum.</p>'},
 s_mix:{t:'Intensitätsmix',b:'<p>Verteilung der Kilometer im gewählten Zeitraum auf locker, Qualität und Longrun. Die Art eines Laufs kommt aus dem Plan des Tages. Ohne Plan wird sie aus Tempo und Länge geschätzt.</p><p>Faustregel: etwa 80 % locker, 20 % Qualität.</p>'},
 wkline:{t:'Wochenumfang (Linie)',b:'<p>Kilometer pro Woche (Montag bis Sonntag) aus Intervals.icu und manuellen Einträgen, die letzten 26 Wochen. Die gestrichelte Linie ist der Durchschnitt der Wochen mit Läufen. Tippe auf das Diagramm für Zoom und Details.</p>'},
 c_sum:{t:'Wochensumme',b:'<p>Große Zahl: geplante Kilometer der Woche (Montag bis Sonntag) inklusive deiner Wochenanpassung. Darunter: bisher gelaufen. Tippe darauf, um die Woche anzusehen oder anzupassen.</p>'},
 ov_weeks:{t:'Wochen',b:'<p>Anzahl der Wochen im gewählten Zeitraum.</p>'},
 ov_ac:{t:'Gelaufen gesamt',b:'<p>Summe aller erledigten Läufe im gewählten Zeitraum (Intervals.icu und manuelle Einträge).</p>'},
 ov_avg:{t:'Ø pro Woche',b:'<p>Gelaufene Kilometer geteilt durch die Zahl der bereits begonnenen Wochen im Zeitraum.</p>'},
 ov_days:{t:'Lauftage',b:'<p>Tage mit mindestens einem erledigten Lauf im gewählten Zeitraum.</p>'},
 rfp:{t:'Fahrplan zum Ziel',b:'<p>Dein Ziel auf kürzere Distanzen umgerechnet (Riegel-Formel, Exponent 1,06). Läufst du diese Zeiten, bist du auf Kurs. „Prognose“ ist die Zeit, die M.oach aus deinen Läufen der letzten 26 Wochen berechnet. Grün bedeutet: Du bist schon schneller als nötig.</p>'},
 ins:{t:'Insight des Tages',b:'<p>M.oach durchsucht deine Läufe der letzten Wochen nach Auffälligkeiten: zu schnelle lockere Läufe, Tempo bei gleichem Puls, zu schneller Anstieg des Umfangs, fehlende lange Läufe, Chance auf dein Ziel.</p><p>Gezeigt wird, was gerade am wichtigsten ist. Unter „Details &amp; Rechenweg“ siehst du Diagramm und Berechnung. Alles rechnet nur auf deinem Gerät.</p>'},
 rep:{t:'Woche anpassen',b:'<p>Wenn mehrere Belastungszeichen zusammenkommen (steiler Umfangsanstieg, negative Form, viele Lauftage in Folge, harte Läufe, Ruhepuls oder HRV, Schmerz), schlägt M.oach vor, die nächste Qualitätseinheit der kommenden 6 Tage locker zu laufen. Bei sehr hoher Belastung wird zusätzlich der Longrun um ein Viertel gekürzt.</p><p>Erst mit „Übernehmen“ ändert sich der Plan. „Rückgängig“ stellt ihn wieder her.</p>'},
 race:{t:'Race-Day-Chance',b:'<p>Die Wahrscheinlichkeit, dass du deine Wunschzeit am Renntag schaffst. Grundlage ist die Prognose aus deinen Läufen, dazu kommen Training bis zum Rennen, Strecke, Wetter und die übliche Schwankung am Renntag.</p><p>Es ist ein Modell mit klaren Annahmen (siehe Rechenweg), keine Garantie.</p>'},
 nr:{t:'Dein neuer Lauf',b:'<p>Erscheint, sobald ein Lauf von heute oder gestern in Intervals.icu (oder manuell) erfasst ist. Die Bewertung vergleicht ihn mit deinem Plan, deinen Zonen und deinen Läufen der letzten 6 Wochen. Alle Details stehen im Reiter Läufe.</p>'},
 year:{t:'Dein Jahr',b:'<p>Kilometer, Läufe, Laufzeit und Höhenmeter der letzten 12 Monate, aus Intervals.icu. Die Belastung ist die Trainingslast aus Intervals.icu.</p><p>Fitness, Ermüdung und Form stammen aus den Intervals-Wellnessdaten (CTL, ATL und die Differenz).</p>'},
 ov_plan:{t:'Plan bisher',b:'<p>Summe der geplanten Kilometer aller abgeschlossenen Wochen im gewählten Zeitraum.</p>'},
 ov_ful:{t:'Erfüllung',b:'<p>Gelaufene Kilometer geteilt durch geplante Kilometer, nur abgeschlossene Wochen mit Plan.</p>'},
 ov_chart:{t:'Fortschritt',b:'<p>Heller Balken: geplante Kilometer. Farbiger Balken: gelaufene Kilometer. Die Farbe zeigt die Trainingsphase. Tippe auf eine Woche, um sie anzusehen oder (bei laufenden und kommenden Wochen) anzupassen.</p>'},
 cloud:{t:'Cloud',b:'<p>Optional und kostenlos über Supabase. Mit einem Cloud-Konto (E-Mail und Passwort) kannst du M.oach auf mehreren Geräten nutzen. Dein Stand wird gesichert.</p><p><b>Gespeichert:</b> Name, E-Mail und dein App-Stand (Plan, Läufe, Wellness-Werte). <b>Nur verschlüsselt:</b> dein Intervals.icu-Zugang. Der Schlüssel dazu entsteht aus deinem Cloud-Passwort und verlässt dein Gerät nie. Nach einem Passwort-Reset trägst du den Intervals-Schlüssel einmal neu ein.</p><p><b>Coaching:</b> Ein Coach sieht erst etwas, wenn du seine Anfrage bestätigst. Die Freigabe kannst du jederzeit beenden, dann werden die geteilten Daten gelöscht. „Cloud-Konto löschen“ entfernt alles.</p>'},
 taper:{t:'Taper',b:'<p>Der Taper senkt den Wochenumfang vor dem Rennen, damit du frisch am Start stehst. Die Intensität bleibt kurz erhalten, nur das Volumen sinkt.</p><p>Faustwerte: Marathon 3 Wochen, Halbmarathon 2, 10 km und 5 km 1 bis 2 Wochen. Die Rennwoche zählt mit. Eine längere Phase kostet Fitness, eine kürzere lässt Ermüdung im Körper.</p>'},
 tune:{t:'Vorbereitungswettkampf',b:'<p>Ein Wettkampf vor dem Hauptziel, etwa ein 10-km-Lauf oder Halbmarathon als Test. Er muss mindestens 2 Wochen vor dem Hauptrennen liegen.</p><p><b>Voller Einsatz:</b> Davor wird 1 bis 2 Tage entlastet, danach gibt es Erholung (bei Halbmarathon 2, bei Marathon 3 Tage). Ein Testlauf derselben Woche entfällt. <b>Trainingswettkampf:</b> nur der Vortag wird kürzer, danach geht es normal weiter.</p><p>Die Zielzeit stammt aus deiner aktuellen Prognose.</p>'},
 wkadj:{t:'Wochenumfang anpassen',b:'<p>Der Regler skaliert alle Läufe dieser Woche gemeinsam (30 bis 110 %, in den letzten Wochen vor dem Rennen höchstens 100 %). Qualitätseinheiten und Longrun werden anteilig gekürzt. Die Anpassung gilt nur für diese Woche; die Wochen danach bleiben unverändert.</p>'},
 r_dur:{t:'Dauer',b:'<p>Bewegungszeit des Laufs ohne Pausen, aus Intervals.icu.</p>'},
 co:{t:'Coaching',b:'<p>Zeigt Daten eines Athleten, den du mit seiner Athlete-ID hinzufügst. Zugriff geht über Intervals.icu: Der Athlet erteilt dir Coach-Zugriff (dann reicht dein eigener API-Schlüssel) oder nennt dir seinen Schlüssel.</p><p>Alle Werte werden wie bei dir selbst berechnet (Läufe der letzten 26 Wochen, Wellness der letzten 84 Tage). Die Daten bleiben nur in diesem Browser. Hol dir vorher das Einverständnis des Athleten.</p>'},
 zones:{t:'Intensitätsverteilung',b:'<p>Anteile deiner Trainingszeit im gewählten Zeitraum, nach Herzfrequenz.</p><p>Jeder Lauf kommt mit seinem Ø-Puls im Verhältnis zur höchsten gemessenen Frequenz in eine von 5 Zonen: Z1 Regeneration unter 70 %, Z2 Locker 70–80 %, Z3 Tempo 80–88 %, Z4 Schwelle 88–94 %, Z5 Intervall ab 94 %. Die Zeit des Laufs zählt für diese Zone.</p><p>Das ist eine Näherung: Bei Intervallen verwässert der Durchschnittspuls, weil Pausen und Einlaufen mitzählen. Läufe ohne Pulsdaten werden nicht gezählt.</p>'},
 bf_score:{t:'Training Readiness',b:'<p>Grundwert (0 bis 100) ist der Readiness-Wert von heute aus Intervals.icu. Werte bis 10 behandelt M.oach als Skala von 1 bis 10 und rechnet sie hoch.</p><p>Dazu kommen deine Faktoren: Schlaf, Ruhepuls und HRV (gegen deinen Ø der letzten 4 Wochen), Form, harte Läufe (RPE), Umfangssprung und Lauftage am Stück. Jeder Warnpunkt kostet 5 Punkte, im Faktorenfeld steht der Einfluss je Faktor. Fitness (CTL) zeigt nur die Entwicklung und verändert den Wert nicht.</p><p>Steht in Intervals.icu noch kein Wert, schätzt M.oach ihn allein aus den Faktoren: 100 minus 13 Punkte je Warnpunkt, mindestens 15.</p><p>Ab 75 ist der Ring grün, von 50 bis 74 gelb, darunter rot. Das bestimmt auch, ob das Training heute normal bleibt oder gekürzt wird.</p>'},
 f_kh:{t:'Mengenangaben',b:'<p>Kohlenhydrate vor dem Lauf: 1–2 g pro kg Körpergewicht (vor Wettkampf 2 g/kg). Nach dem Lauf: etwa 1 g/kg plus 20–30 g Eiweiß. Unterwegs: ab Minute 40 alle 20–30 min rund 25 g. Ohne Gewicht im Profil siehst du die Angaben pro kg.</p>'},
 f_drink:{t:'Trinkmenge',b:'<p>Richtwert 35 ml pro kg Körpergewicht pro Tag (aus deinem Profil), sonst 2–3 l. Beim Laufen kommen etwa 400–800 ml pro Stunde dazu, nach dem Lauf 500 ml je 0,5 kg Gewichtsverlust.</p>'},
 f_bed:{t:'Schlafzeit',b:'<p>Aufstehzeit aus deinem Profil minus 8 Stunden Schlaf minus 15 Minuten zum Einschlafen.</p>'},
 train:{t:'Trainingsablauf',b:'<p>Der Plan des Tages, angepasst an deinen Zustand (Ampel): bei „Anpassen“ wird gekürzt, bei „Erholen“ ersetzt. Paces stammen aus deinem Plan-Verlauf beziehungsweise deinem letzten Testergebnis.</p>'},
 perf_pace:{t:'Trainingspaces',b:'<p>Abgeleitet aus dem Marathontempo deines Plans (oder deinem letzten Testergebnis unter Leistung). Locker = 116–130 %, Schwelle = 94,5 %, Intervall = 91 %, Kurz = 87 % der Marathonpace.</p>'},
 perf_res:{t:'Testergebnisse',b:'<p>Ein Ergebnis hier verändert nur deine Trainingspaces. Die Prognose auf der Startseite bleibt unabhängig und rechnet nur aus deinen Läufen.</p>'}
};
function openInfo(k){
 let o=INFO[k];if(typeof o=='function')o=o();if(!o)return;
 const m=$('#im');m.hidden=false;
 m.innerHTML='<div class="box"><h3>'+o.t+'</h3><div class="ibody">'+o.b+'</div><div class="b"><button class="pri" id="imx">Verstanden</button></div></div>';
 $('#imx').onclick=()=>{m.hidden=true};m.onclick=e=>{if(e.target===m)m.hidden=true}}
lifecycle.listen(document,'click',e=>{const t=e.target.closest&&e.target.closest('[data-i]');if(t){e.preventDefault();e.stopPropagation();openInfo(t.dataset.i)}},true);
lifecycle.listen(document,'keydown',e=>{const t=e.target&&e.target.dataset&&e.target.dataset.i;if(t&&(e.key=='Enter'||e.key==' ')){e.preventDefault();openInfo(t)}});

/* ===== Prognose aus Läufen ===== */
const PD=[[5,'5 km'],[10,'10 km'],[15,'15 km'],[21.0975,'Halbmarathon'],[42.195,'Marathon']];
function prognAt(runs,asOf){
 const asd=asOf?parse(asOf):today,hi=iso(asd),lo=iso(addD(asd,-7*26)),o={};
 for(const[dk]of PD){let best=null;
  for(const r of runs){
   if(!(r.km>=3&&r.sec>0)||r.d>hi||r.d<lo)continue;
   const pc=r.sec/r.km;if(pc<150||pc>540||r.km>70)continue;
   if(dk>=10&&r.km<dk*.3)continue;
   const wk=Math.max(0,(asd-parse(r.d))/(7*D)),raw=r.sec*Math.pow(dk/r.km,1.06),adj=raw*(1+.004*wk);
   if(!best||adj<best.adj)best={adj,sec:adj,raw,r}}
  if(best)o[dk]=best}
 return o}
const progn=()=>prognAt(allRuns());
function progCard(){
 const P=progn(),K=RD(),M=P[42.195],n=allRuns().length;
 const row=([dk,nm])=>{const x=P[dk];if(!x)return'<div class="pr"><span>'+nm+'</span><b>–</b><small></small></div>';
  const isR=Math.abs(dk-K)<.3&&!S.noPlan&&K<40,gt=GT(),df=x.sec-gt;
  return'<div class="pr'+(isR?' rc':'')+'"><span>'+nm+'</span><b>'+(x.sec>=3600?ft(x.sec):fp(x.sec))+'</b><small>'+fp(x.sec/dk)+' /km'+(isR?' · Ziel '+(gt>=3600?ft(gt):fp(gt))+' ('+(df>0?'+':'−')+fp(Math.abs(df))+')':'')+'</small></div>'};
 let head;
 if(M){const gap=M.sec-S.goal,mt=CF().mode=='maintain';
  head='<div class="pm"><div><span class="pl1">Marathon</span><b>'+ft(M.sec)+'</b><small>'+fp(M.sec/42.195)+' /km</small></div>'
   +(!S.noPlan&&!mt&&K>=40?'<div class="pg '+(gap<=0?'ok':'')+'"><span>Ziel '+ft(S.goal)+'</span><b>'+(gap<=0?'erreicht':fp(Math.abs(gap))+' min fehlen')+'</b></div>':'')+'</div>'}
 else head='<div class="pm"><div><span class="pl1">Marathon</span><b>–</b><small>'+(n?'Dafür braucht es einen Lauf ab 13 km.':'Noch keine Läufe vorhanden.')+'</small></div></div>';
 const base=M?'<small class="pb2">Basis: '+esc(M.r.n)+', '+dshort(M.r.d)+' ('+dec(M.r.km,1)+' km in '+dur(M.r.sec)+')</small>':'';
 return'<div class="card prog"><h3>Prognose'+inf('prog')+'</h3><div class="sub">Berechnet aus deinen Läufen der letzten 26 Wochen</div>'+head+'<div class="pgrid">'+PD.slice().reverse().filter(x=>x[0]<42).map(row).join('')+'</div>'+base+'</div>'}

/* ===== Insights, Repair-Guide, Race-Day-Chance, Jahresübersicht ===== */
const medi=a=>{a=a.filter(x=>x!=null&&!isNaN(x)).slice().sort((x,y)=>x-y);if(!a.length)return null;const m=a.length>>1;return a.length%2?a[m]:(a[m-1]+a[m])/2};
const MON3=['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
const dsgn=(s,f)=>(s<0?'−':'+')+(f||fp)(Math.abs(s));
const tlab=s=>s>=3600?Math.floor(s/3600)+':'+pad(Math.floor(s%3600/60)):fp(s);const pcs=m=>{const p=Math.round(m.pct*100);return p<1?'<1':p>99?'>99':String(p)};
function chartSvg(o){
 const W=320,H=o.h||150,L=40,R=8,T=12,B=22,iw=W-L-R,ih=H-T-B;
 const ys=(o.pts||[]).map(p=>p.y).concat((o.lines||[]).map(l=>l.y),(o.bars||[]).map(b=>b.y));
 if(!ys.length)return'';
 let lo=Math.min(...ys),hi=Math.max(...ys);
 if(o.bars)lo=Math.min(0,lo);
 if(hi===lo){hi+=1;lo-=1}
 const pd=(hi-lo)*.12;if(!o.bars)lo-=pd;hi+=pd;
 const Y=v=>T+ih*(1-(v-lo)/(hi-lo)),fm=o.fmt||(v=>String(Math.round(v)));
 let s='<svg class="chs" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(o.aria||'Diagramm')+'">';
 for(let i=0;i<=3;i++){const v=lo+(hi-lo)*i/3,y=Y(v);s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y.toFixed(1)+'" y2="'+y.toFixed(1)+'" stroke="var(--bd)" stroke-width="1"/><text x="'+(L-4)+'" y="'+(y+3).toFixed(1)+'" text-anchor="end" font-size="9" fill="var(--mu)">'+fm(v)+'</text>'}
 if(o.bars){const n=o.bars.length,bw=iw/n;
  o.bars.forEach((b,i)=>{const x=L+i*bw+bw*.15,w=bw*.7,y=Y(b.y),h=Math.max(0,T+ih*(1-(0-lo)/(hi-lo))-y);
   s+='<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+w.toFixed(1)+'" height="'+h.toFixed(1)+'" rx="3" fill="'+(b.c||'#2563eb')+'"'+(b.op?' opacity=".5"':'')+'/>';
   if(b.y>0&&n<=13)s+='<text x="'+(x+w/2).toFixed(1)+'" y="'+(y-3).toFixed(1)+'" text-anchor="middle" font-size="8.5" fill="var(--tx)">'+(o.vf||fm)(b.y)+'</text>';
   s+='<text x="'+(x+w/2).toFixed(1)+'" y="'+(H-8)+'" text-anchor="middle" font-size="9" fill="var(--mu)">'+esc(b.l||'')+'</text>'})}
 if(o.pts&&o.pts.length){const x0=Math.min(...o.pts.map(p=>p.x)),x1=Math.max(...o.pts.map(p=>p.x)),X=v=>L+6+(iw-12)*(x1===x0?.5:(v-x0)/(x1-x0));
  (o.lines||[]).forEach(l=>{if(l.x0!=null){s+='<line x1="'+X(l.x0).toFixed(1)+'" x2="'+X(l.x1).toFixed(1)+'" y1="'+Y(l.y).toFixed(1)+'" y2="'+Y(l.y).toFixed(1)+'" stroke="'+(l.c||'var(--tx)')+'" stroke-width="2.2"/>'}});
  o.pts.forEach(p=>{s+='<circle cx="'+X(p.x).toFixed(1)+'" cy="'+Y(p.y).toFixed(1)+'" r="3.7" fill="'+(p.c||'#2563eb')+'" fill-opacity=".85"/>'});
  if(o.xl)s+='<text x="'+L+'" y="'+(H-7)+'" font-size="9" fill="var(--mu)">'+esc(o.xl[0])+'</text><text x="'+(W-R)+'" y="'+(H-7)+'" text-anchor="end" font-size="9" fill="var(--mu)">'+esc(o.xl[1])+'</text>'}
 (o.lines||[]).forEach(l=>{if(l.x0!=null)return;const y=Y(l.y);s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y.toFixed(1)+'" y2="'+y.toFixed(1)+'" stroke="'+(l.c||'#ef4444')+'" stroke-width="1.6" stroke-dasharray="5 4"/><text x="'+(W-R)+'" y="'+(y-4).toFixed(1)+'" text-anchor="end" font-size="9" font-weight="700" fill="'+(l.c||'#ef4444')+'">'+esc(l.t||'')+'</text>'});
 return s+'</svg>'}

/* ---- Insights ---- */
const fday=d=>DOW[(d.getDay()+6)%7]+' '+dshort(d).slice(0,5);
function nextS(types,n,span){const o=[];for(let i=0;i<=span&&o.length<n;i++){const d=addD(today,i),p=plan(d,1);if(!p||!types.includes(p.t)||!(p.km>0))continue;if(i==0){const l=S.log[iso(d)];if(l&&l.done)continue}o.push({d,p})}return o}
function weekPlanKm(){let s=0;for(let i=0;i<7;i++){const q=plan(addD(mon(today),i),1);if(q)s+=q.km}return s}
function insEasy(runs,cx){
 if(!cx.hrmax)return null;
 const lo=iso(addD(today,-84)),E=runs.filter(r=>r.d>=lo&&r.hr>0&&r.km>=4&&r.sec>0&&runKind(r,cx,null)=='easy');
 if(E.length<6)return null;
 const T=Math.round(cx.hrmax*.80),hi=E.filter(r=>r.hr>T),sh=hi.length/E.length,pc=Math.round(sh*100),mp=medi(E.map(r=>r.sec/r.km)),z=Z(today);
 if(sh>.15&&sh<.4)return null;
 const bad=sh>=.4,days=r=>Math.round((today-parse(r.d))/D);
 const xs=E.map(r=>r.hr),ys=E.map(r=>r.sec/r.km),mx=mean(xs),my=mean(ys);let sxx=0,sxy=0;xs.forEach((x,i)=>{sxx+=(x-mx)*(x-mx);sxy+=(x-mx)*(ys[i]-my)});
 let pT=sxx>0&&sxy<0?my+sxy/sxx*(T-mx):my*1.06;pT=Math.max(my,Math.min(my*1.18,pT));
 const pts=E.map(r=>({x:-days(r),y:r.hr,c:r.hr>T?'#ef4444':'#22c55e'}));
 let st=[];
 if(bad){
  const ne=nextS(['easy'],2,8);if(ne.length)st.push([ne.map(x=>fday(x.d)).join('<br>'),ne.map(x=>r1(x.p.km)).join(' und ')+' km locker, Puls höchstens '+T+' (aktuell etwa '+fp(pT)+' /km). Pulsalarm auf der Uhr auf '+T+' stellen.']);
  if(!st.length)st.push(['Nächster Lauf','Locker mit Puls höchstens '+T+' (aktuell etwa '+fp(pT)+' /km). Pulsalarm auf der Uhr stellen.']);
  st.push(['Im Lauf','Die ersten 10 Minuten bewusst langsamer starten, an Anstiegen gehen statt den Puls über '+T+' zu treiben.'+(pT-mp>=8?' Dass du dadurch etwa '+Math.round(pT-mp)+' s/km langsamer wirst, ist gewollt.':'')]);
  st.push(['Kontrolle','In 2 Wochen sollte der Anteil über '+T+' unter 15 % liegen. Das siehst du hier wieder.'])}
 else{
  nextS(['q'],1,8).forEach(x=>st.push([fday(x.d),x.p.lab+', '+r1(x.p.km)+' km: '+strip(x.p)]));
  st.push(['Tipp','Weil dein Locker wirklich locker ist, darfst du die Tempoeinheiten genau im vorgegebenen Tempo laufen. Nicht schneller, dann bleibt die Erholung gut.'])}
 return{id:'easy',pr:bad?3:1,tone:bad?'warn':'good',
  title:bad?'Deine lockeren Läufe sind zu schnell':'Deine lockeren Läufe sind wirklich locker',
  body:bad?hi.length+' von '+E.length+' lockeren Läufen der letzten 12 Wochen lagen über '+T+' Puls. Dein Ø-Tempo war '+fp(mp)+' /km.':'Nur '+hi.length+' von '+E.length+' lockeren Läufen lagen über '+T+' Puls. So entsteht die Grundlage für die Tempoeinheiten.',
  steps:st,
  stats:[['Lockere Läufe',E.length],['Über Puls '+T,hi.length+' ('+pc+' %)'],['Ø-Tempo',fp(mp)+' /km'],['Locker-Bereich',fp(z.e1)+'–'+fp(z.e2)]],
  chart:chartSvg({pts,h:125,lines:[{y:T,t:'Grenze '+T,c:'#ef4444'}],xl:['vor 12 Wochen','heute'],aria:'Durchschnittspuls der lockeren Läufe'}),cap:'Jeder Punkt ist ein lockerer Lauf, rot liegt über der Grenze.',
  how:'<p>Betrachtet werden Läufe der letzten 12 Wochen mit Pulsdaten und mindestens 4 km, die als „locker“ gelten (kein Longrun, nicht deutlich schneller als dein Median-Tempo).</p><p>Grenze = 80 % deines höchsten gemessenen Pulses ('+cx.hrmax+') = '+T+'. Verglichen wird der Durchschnittspuls je Lauf. Ab 40 % darüber gibt es die Warnung, bis 15 % das Lob; dazwischen zeigt M.oach nichts an.</p><p>Das Tempo bei Puls '+T+' ('+fp(pT)+' /km) stammt aus der Beziehung von Puls und Tempo deiner lockeren Läufe. Es ist eine Schätzung, kein Muss.</p>'}}
function insEff(runs,cx){
 const lo=iso(addD(today,-84)),mid=iso(addD(today,-42));
 const E=runs.filter(r=>r.d>=lo&&r.hr>0&&r.km>=5&&r.sec>0&&runKind(r,cx,null)=='easy');
 if(E.length<8)return null;
 const mh=medi(E.map(r=>r.hr)),S1=E.filter(r=>Math.abs(r.hr-mh)<=5),A=S1.filter(r=>r.d<mid),B=S1.filter(r=>r.d>=mid);
 if(A.length<3||B.length<3)return null;
 const pa=medi(A.map(r=>r.sec/r.km)),pb=medi(B.map(r=>r.sec/r.km)),dl=pb-pa;
 if(Math.abs(dl)<8)return null;
 const up=dl<0,days=r=>-Math.round((today-parse(r.d))/D),pl=weekPlanKm();
 const l28=runs.filter(r=>r.d>=iso(addD(today,-28))).reduce((s,r)=>s+r.km,0)/4;
 const pts=S1.map(r=>({x:days(r),y:r.sec/r.km,c:r.d<mid?'#94a3b8':'#2563eb'}));
 const st=up?[['Test','Mach in den nächsten 2 Wochen einen 5-km-Test (Kalender, Tag antippen) und trage das Ergebnis unter Leistung ein. Deine Trainingspaces passen sich dann an.'],['Umfang','Bleib bei etwa '+Math.round(l28)+' km pro Woche (dein Schnitt der letzten 4 Wochen), dann bleibt der Effekt erhalten.']]
  :[['Diese Woche',pl>0?'Umfang um 15 % kürzen: etwa '+Math.round(pl*.85)+' statt '+Math.round(pl)+' km. Die Tempoeinheit behalten, dafür locker wirklich locker.':'Umfang um 15 % kürzen und locker wirklich locker laufen.'],['Schlaf','Diese Woche täglich 8 Stunden einplanen (Details im Reiter Erholung).'],['Kontrolle','In 2 Wochen wieder hierher schauen. Ist das Tempo bei gleichem Puls zurück, war es Ermüdung.']];
 return{id:'eff',pr:2,tone:up?'good':'hint',
  title:up?'Bei gleichem Puls läufst du '+Math.round(-dl)+' s/km schneller':'Bei gleichem Puls bist du '+Math.round(dl)+' s/km langsamer',
  body:up?'Bei Puls um '+Math.round(mh)+' liefen deine lockeren Läufe früher '+fp(pa)+' /km, zuletzt '+fp(pb)+' /km. Deine Grundlagenausdauer wächst.':'Bei Puls um '+Math.round(mh)+' lagst du früher bei '+fp(pa)+' /km, zuletzt bei '+fp(pb)+' /km. Mögliche Gründe: Ermüdung, Hitze, wenig Schlaf oder viel Tempo in letzter Zeit.',
  steps:st,
  stats:[['Läufe früher',A.length],['Läufe zuletzt',B.length],['Tempo früher',fp(pa)+' /km'],['Tempo zuletzt',fp(pb)+' /km']],
  chart:chartSvg({pts,h:125,lines:[{y:pa,x0:-84,x1:-42,c:'#64748b'},{y:pb,x0:-42,x1:0,c:'#1d4ed8'}],fmt:fp,xl:['vor 12 Wochen','heute'],aria:'Tempo bei gleichem Puls'}),cap:'Grau: ältere Hälfte, blau: letzte 6 Wochen, Linie = Median. Tiefer bedeutet schneller.',
  how:'<p>Lockere Läufe ab 5 km mit Pulsdaten der letzten 12 Wochen. Es zählen nur Läufe, deren Durchschnittspuls höchstens 5 Schläge vom mittleren Puls ('+Math.round(mh)+') abweicht, damit das Tempo bei vergleichbarer Anstrengung verglichen wird.</p><p>Verglichen werden die Median-Tempi der älteren und der jüngeren 6 Wochen (je mindestens 3 Läufe). Angezeigt wird erst ab 8 s/km Unterschied.</p>'}}
function insRamp(runs){
 const ws=mon(today),wk=i=>{const a=iso(addD(ws,-7*i)),b=iso(addD(ws,-7*i+6));return runs.filter(r=>r.d>=a&&r.d<=b).reduce((s,r)=>s+r.km,0)};
 const last=wk(1),prev=[2,3,4,5].map(wk),ch=prev.reduce((a,b)=>a+b,0)/4;
 if(ch<15||!prev.filter(x=>x>0).length)return null;
 const q=last/ch;if(q<1.2)return null;
 const warn=q>=1.3,cap=warn?Math.round(last*.95):Math.round(last),pl=weekPlanKm(),nl=nextS(['long'],1,7)[0];
 const bars=[5,4,3,2,1,0].map(i=>({l:dshort(addD(ws,-7*i)).slice(0,5),y:Math.round(wk(i)*10)/10,c:i==1?(warn?'#ef4444':'#f59e0b'):'#2563eb',op:i==0}));
 const st=[['Diese Woche',pl>cap+2?'Höchstens '+cap+' km (Vorwoche '+dec(last,0)+'). Der Plan sieht '+Math.round(pl)+' km vor, kürze also um etwa '+Math.round(pl-cap)+' km.':'Bleib bei höchstens '+cap+' km. Der Plan liegt mit '+Math.round(pl)+' km darunter, das passt.']];
 if(nl&&pl>cap+2){const k=Math.min(nl.p.km,Math.max(10,Math.round(nl.p.km-(pl-cap))));if(k<nl.p.km)st.push([fday(nl.d),'Longrun statt '+r1(nl.p.km)+' nur '+k+' km. Hier lässt sich der Umfang am leichtesten sparen.'])}
 st.push(['Kontrolle','Ruhepuls und Beine im Blick behalten. Bei Ziehen oder Schmerz lieber einen Tag Pause.']);
 return{id:'ramp',pr:warn?3:2,tone:warn?'warn':'hint',
  title:'Dein Umfang ist um '+Math.round((q-1)*100)+' % gestiegen',
  body:'Letzte Woche '+dec(last,0)+' km gegenüber Ø '+dec(ch,0)+' km in den 4 Wochen davor. '+(warn?'Mehr als 30 % Steigerung ist eine typische Ursache für Überlastung.':'Das ist am oberen Rand dessen, was der Körper gut verträgt.'),
  steps:st,
  stats:[['Letzte Woche',dec(last,0)+' km'],['Ø 4 Wochen davor',dec(ch,0)+' km'],['Steigerung','+'+Math.round((q-1)*100)+' %']],
  chart:chartSvg({bars,h:125,vf:v=>dec(v,0),aria:'Wochenkilometer'}),cap:'Kilometer pro Woche, die laufende Woche ist blass (noch nicht abgeschlossen).',
  how:'<p>Verglichen wird die letzte volle Kalenderwoche (Mo–So) mit dem Durchschnitt der 4 Wochen davor. Ab +20 % gibt es einen Hinweis, ab +30 % eine Warnung. Voraussetzung: mindestens 15 km im Schnitt.</p><p>Die Obergrenze für diese Woche ist die Vorwoche (bei Warnung 5 % darunter). Die 10-%-Regel ist nur eine grobe Faustregel; individuell verträgt der Körper mal mehr, mal weniger.</p>'}}
function insLong(runs){
 if(S.noPlan||RD()<40||CF().mode=='maintain')return null;
 const w=wtr(today);if(w>16||w<3)return null;
 const a=iso(addD(today,-42)),L=runs.filter(r=>r.d>=a),mx=L.length?Math.max(...L.map(r=>r.km)):0;
 if(mx>=28)return null;
 const ws=mon(today),bars=[5,4,3,2,1,0].map(i=>{const x=iso(addD(ws,-7*i)),y=iso(addD(ws,-7*i+6)),v=runs.filter(r=>r.d>=x&&r.d<=y).reduce((m,r)=>Math.max(m,r.km),0);return{l:dshort(addD(ws,-7*i)).slice(0,5),y:Math.round(v*10)/10,c:v>=28?'#22c55e':'#8b5cf6',op:i==0}});
 const st=nextS(['long'],3,28).map((x,i)=>{const t=Math.min(32,Math.round(mx+3*(i+1)));return[fday(x.d),'Longrun '+t+' km locker, die letzten 5 km gern mit Marathontempo. '+(x.p.km>=t?'Der Plan sieht '+r1(x.p.km)+' km vor, das passt.':'Der Plan sieht nur '+r1(x.p.km)+' km vor, hier lohnt sich mehr.')]});
 if(!st.length)st.push(['Nächste Wochen','Plane einen Longrun von '+Math.min(32,Math.round(mx+3))+' km und steigere dich danach um etwa 3 km pro Woche bis 30–32 km.']);
 st.push(['Verpflegung','Ab 28 km alle 5 km ein Gel, am besten das gleiche wie am Renntag.']);
 return{id:'long',pr:2,tone:'hint',
  title:'Dein längster Lauf ist erst '+dec(mx,0)+' km',
  body:'In '+w+' Wochen ist Rennwoche, und in den letzten 6 Wochen war dein längster Lauf '+dec(mx,0)+' km. Für einen Marathon braucht es ein- bis zweimal 28–32 km.',
  steps:st,
  stats:[['Längster Lauf (6 Wo.)',dec(mx,1)+' km'],['Wochen bis Rennen',w],['Ziel für Longruns','28–32 km']],
  chart:chartSvg({bars,h:125,lines:[{y:28,t:'28 km',c:'#22c55e'}],vf:v=>dec(v,0),aria:'Längster Lauf pro Woche'}),cap:'Längster Lauf je Woche.',
  how:'<p>Der Hinweis erscheint nur bei Marathonplänen, 3 bis 16 Wochen vor der Rennwoche, wenn der längste Lauf der letzten 6 Wochen unter 28 km liegt.</p><p>Die Vorschläge steigern den längsten Lauf pro Longrun um etwa 3 km bis maximal 32 km.</p>'}}
function insGoal(){
 if(!raceOk())return null;
 const m=raceModel(GT(),RD());if(!m)return null;
 const p=Math.round(m.pct*100),ps=pcs(m);
 if(p>=35&&p<60)return null;
 const hi=p>=60,gp=GT(),K=RD(),P=progn(),eq=k=>gp*Math.pow(k/K,1.06);
 const st=[];
 [[10,'10-km-Test'],[21.0975,'Halbmarathon-Test']].filter(x=>x[0]<K-.3).forEach(x=>st.push([x[1],'Für '+dur(gp)+' passt etwa '+dur(eq(x[0]))+(P[x[0]]?' (aktuell prognostiziert: '+dur(P[x[0]].sec)+').':'.')]));
 if(!hi)st.push(['Ehrliche Spanne','Mit gutem Tag (25 %) sind '+dur(m.mu-.67*m.sg)+' drin, mit 75 % Sicherheit '+dur(m.mu+.67*m.sg)+'. Ein Zwischenziel dazwischen hält die Motivation hoch.']);
 st.push(['Training','Marathontempo-Abschnitte im Longrun genau auf '+fp(rpace())+' /km laufen. So gewöhnst du dich an dein Renntempo.']);
 return{id:'goal',pr:hi?1:2,tone:hi?'good':'hint',go:'race',
  title:hi?'Dein Ziel ist in Reichweite ('+ps+' %)':'Dein Ziel ist ein Stretch ('+ps+' %)',
  body:hi?'Mit der aktuellen Form liegt dein Ziel '+dur(gp)+' im erwarteten Bereich. Erwartung am Renntag '+dur(m.mu)+' ± '+fp(m.sg)+'.':'Die Erwartung am Renntag liegt bei '+dur(m.mu)+' (± '+fp(m.sg)+') gegenüber Ziel '+dur(gp)+'. Das ist machbar, braucht aber konsequentes Training und gute Bedingungen.',
  steps:st,
  stats:[['Chance',ps+' %'],['Erwartung',dur(m.mu)],['Ziel',dur(gp)]],
  chart:raceCurve(m,gp),cap:'Fläche links der Zielmarke = Chance, die Zielzeit zu schaffen.',
  how:'<p>Siehe Reiter Race: Prognose aus deinen Läufen, Trainingsfortschritt bis zum Rennen, Strecke, Wetter und Unsicherheit ergeben eine Verteilung der möglichen Renntagszeiten.</p><p>Die Test-Zeiten rechnen dein Ziel mit der Riegel-Formel (Exponent 1,06) auf kürzere Distanzen um.</p>'}}
function insightList(){
 const runs=allRuns(),cx=rctx(runs,null,false),L=[];
 for(const f of [()=>insEasy(runs,cx),()=>insEff(runs,cx),()=>insRamp(runs),()=>insLong(runs),()=>insGoal()]){try{const x=f();if(x)L.push(x)}catch(e){}}
 return L.sort((a,b)=>b.pr-a.pr)}
function stepsHtml(x){return x.steps&&x.steps.length?'<div class="isteps"><h4>Dein Vorschlag</h4>'+x.steps.map(s=>'<div class="ist"><b>'+s[0]+'</b><span>'+s[1]+'</span></div>').join('')+'</div>':''}
function insightHtml(){
 const L=insightList();if(!L.length)return'';
 const mx=L[0].pr,top=L.filter(x=>x.pr==mx),doy=Math.floor((today-new Date(today.getFullYear(),0,0))/D),h=top[doy%top.length],rest=L.filter(x=>x!==h).slice(0,3);
 const dot=t=>'<span class="tdot '+t+'"></span>';
 return'<div class="card ins '+h.tone+'"><div class="inh">'+dot(h.tone)+'Insight des Tages'+inf('ins')+'</div><h3>'+h.title+'</h3><p class="inb">'+h.body+'</p><div class="inc">'+h.chart+'<small>'+h.cap+'</small></div>'+stepsHtml(h)
  +'<div class="b"><button class="pri" data-ins="'+h.id+'">Rechenweg ansehen</button>'+(h.go?'<button data-go="'+h.go+'">Zum Reiter Race</button>':'')+'</div>'
  +(rest.length?'<div class="insl">'+rest.map(x=>'<button class="tr" data-ins="'+x.id+'">'+dot(x.tone)+'<span class="tt">'+x.title+'</span><span class="chev">›</span></button>').join('')+'</div>':'')+'</div>'}
function openInsight(id){
 const x=insightList().find(i=>i.id==id);if(!x)return;
 const m=$('#md');m.hidden=false;
 m.innerHTML='<div class="box ins '+x.tone+'"><div class="inh">'+'<span class="tdot '+x.tone+'"></span>Insight</div><h3>'+x.title+'</h3><p class="inb">'+x.body+'</p>'+stepsHtml(x)
  +'<div class="tiles">'+x.stats.map(s=>'<div class="tl"><b>'+s[1]+'</b><span>'+s[0]+'</span></div>').join('')+'</div>'
  +'<div class="inc">'+x.chart+'<small>'+x.cap+'</small></div><details style="margin-top:10px"><summary><b>Rechenweg</b></summary><div class="how">'+x.how+'</div></details><div class="b"><button class="pri" id="cl">Schließen</button></div></div>';
 $('#cl').onclick=()=>m.hidden=true}

/* ---- Lauf-Diagramm (Distanz, Pace, Herzfrequenz) ---- */
const RSK='moach_rs_';let NRUN=null;const RSM={},RSF={};
const rsLoad=()=>{try{return JSON.parse(LS.get(RSK+UID)||'{}')||{}}catch(e){return{}}};
function rsSave(id,v){try{const o=rsLoad();delete o[id];o[id]=v;const ks=Object.keys(o);while(ks.length>6)delete o[ks.shift()];LS.set(RSK+UID,JSON.stringify(o))}catch(e){}}
function rsProcess(raw){
 const g={};
 if(Array.isArray(raw))raw.forEach(x=>{if(x&&x.type&&Array.isArray(x.data))g[x.type]=x.data});
 else if(raw&&typeof raw=='object')for(const k in raw)if(Array.isArray(raw[k]))g[k]=raw[k];
 const D=g.distance,T=g.time,V=g.velocity_smooth,H=g.heartrate;
 if(!D||D.length<20||!(T||V))return null;
 const n=D.length,tot=(+D[n-1]||0)/1000;if(!(tot>=.5))return null;
 const N=Math.min(140,Math.max(20,Math.round(tot*10))),w=Math.max(.12,tot/N*1.5);
 const bs=(a,x)=>{let lo=0,hi=a.length-1;while(lo<hi){const m=(lo+hi)>>1;if(a[m]<x)lo=m+1;else hi=m}return lo};
 const ph=[0],pc=[0],pv=[0],pn=[0];
 for(let i=0;i<n;i++){const h=H&&H[i]>40?+H[i]:0,v=V&&V[i]>.3?+V[i]:0;ph.push(ph[i]+h);pc.push(pc[i]+(h?1:0));pv.push(pv[i]+v);pn.push(pn[i]+(v?1:0))}
 const pts=[];
 for(let i=0;i<=N;i++){
  const x=tot*i/N,ia=bs(D,Math.max(0,x-w)*1000),ib=bs(D,Math.min(tot,x+w)*1000);
  let p=null;
  if(T){const dt=T[ib]-T[ia],dd=(D[ib]-D[ia])/1000;if(dd>.02&&dt>0)p=dt/dd}
  else if(pn[ib+1]-pn[ia]>0){p=1000/((pv[ib+1]-pv[ia])/(pn[ib+1]-pn[ia]))}
  if(p!=null&&(p<150||p>900))p=null;
  const c=pc[ib+1]-pc[ia],h=c>0?(ph[ib+1]-ph[ia])/c:null;
  pts.push([Math.round(x*100)/100,p==null?null:Math.round(p),h==null?null:Math.round(h)])}
 const tt=T?(T[n-1]-T[0]):null,hv=H?H.filter(x=>x>40):[];
 return{tot:Math.round(tot*100)/100,pts,ap:tt>0?Math.round(tt/tot):null,ah:hv.length?Math.round(hv.reduce((a,b)=>a+b,0)/hv.length):null}}
function rsSvg(d,sel){
 const W=340,H=206,L=36,Rr=34,Tp=12,B=24,iw=W-L-Rr,ih=H-Tp-B,tot=d.tot,f=v=>v.toFixed(1);
 const ps=d.pts.map(p=>p[1]).filter(v=>v!=null).sort((a,b)=>a-b),hs=d.pts.map(p=>p[2]).filter(v=>v!=null);
 const X=v=>L+iw*v/tot;
 let s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Verlauf von Pace und Herzfrequenz über die Distanz">';
 let pl=0,ph_=1;
 if(ps.length){const a=ps[Math.floor(ps.length*.03)],b=ps[Math.min(ps.length-1,Math.floor(ps.length*.97))],pad=Math.max(6,(b-a)*.12);pl=a-pad;ph_=b+pad}
 const YP=v=>Tp+ih*(v-pl)/(ph_-pl);
 let hl=0,hh=1;if(hs.length){const a=Math.min(...hs),b=Math.max(...hs),pad=Math.max(4,(b-a)*.12);hl=a-pad;hh=b+pad}
 const YH=v=>Tp+ih*(1-(v-hl)/(hh-hl));
 for(let i=0;i<=3;i++){const y=Tp+ih*i/3;s+='<line x1="'+L+'" x2="'+(W-Rr)+'" y1="'+f(y)+'" y2="'+f(y)+'" stroke="var(--bd)" stroke-width="1"/>';
  if(ps.length)s+='<text x="'+(L-5)+'" y="'+f(y+3)+'" text-anchor="end" font-size="9.5" fill="#2563eb">'+fp(pl+(ph_-pl)*i/3)+'</text>';
  if(hs.length)s+='<text x="'+(W-Rr+5)+'" y="'+f(y+3)+'" font-size="9.5" fill="#ef4444">'+Math.round(hh-(hh-hl)*i/3)+'</text>'}
 const st=tot<=6?1:tot<=14?2:tot<=30?5:10;
 for(let k=0;k<=tot+.001;k+=st)s+='<text x="'+f(X(k))+'" y="'+(H-8)+'" text-anchor="middle" font-size="9.5" fill="var(--mu)">'+k+'</text>';
 s+='<text x="'+(W-Rr)+'" y="'+(H-8)+'" text-anchor="end" font-size="9" fill="var(--mu)" opacity="0">km</text>';
 const path=(ix,Y)=>{let o='',up=false;for(const p of d.pts){const v=p[ix];if(v==null){up=false;continue}o+=(up?'L':'M')+f(X(p[0]))+' '+f(Y(v));up=true}return o};
 const pp=path(1,YP),hp=path(2,YH);
 if(hp)s+='<path d="'+hp+'" fill="none" stroke="#ef4444" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
 if(pp){const first=d.pts.find(p=>p[1]!=null),last=d.pts.slice().reverse().find(p=>p[1]!=null);
  s+='<path d="'+pp+'L'+f(X(last[0]))+' '+(Tp+ih)+'L'+f(X(first[0]))+' '+(Tp+ih)+'Z" fill="#2563eb" opacity=".1"/><path d="'+pp+'" fill="none" stroke="#2563eb" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>'}
 if(sel>=0){const p=d.pts[sel],x=X(p[0]);s+='<line x1="'+f(x)+'" x2="'+f(x)+'" y1="'+Tp+'" y2="'+(Tp+ih)+'" stroke="var(--tx)" stroke-width="1" stroke-dasharray="3 3"/>';
  if(p[1]!=null)s+='<circle cx="'+f(x)+'" cy="'+f(YP(p[1]))+'" r="4" fill="#2563eb" stroke="var(--card)" stroke-width="2"/>';
  if(p[2]!=null)s+='<circle cx="'+f(x)+'" cy="'+f(YH(p[2]))+'" r="4" fill="#ef4444" stroke="var(--card)" stroke-width="2"/>'}
 return s+'</svg>'}
function rsDraw(box,d){
 let sel=-1;
 const ro=()=>{if(sel<0)return'Ø '+(d.ap?fp(d.ap)+' /km':'–')+(d.ah?' · Ø '+d.ah+' bpm':'')+' · '+dec(d.tot,1)+' km';const p=d.pts[sel];return dec(p[0],1)+' km · '+(p[1]!=null?fp(p[1])+' /km':'–')+(p[2]!=null?' · '+p[2]+' bpm':'')};
 box.innerHTML='<div class="rsh"><span><i style="background:#2563eb"></i>Pace /km (oben = schneller)</span>'+(d.pts.some(p=>p[2]!=null)?'<span><i style="background:#ef4444"></i>Herzfrequenz</span>':'')+'<span>Distanz in km</span><b id="rsro"></b></div><div class="rsc"></div>';
 const c=box.querySelector('.rsc'),r=box.querySelector('#rsro');
 const paint=()=>{c.innerHTML=rsSvg(d,sel);r.textContent=ro()};
 const pick=e=>{const b=c.getBoundingClientRect(),x=(e.clientX-b.left)/b.width*340,v=(x-36)/(340-36-34)*d.tot;let bi=0,bd=1e9;d.pts.forEach((p,i)=>{const q=Math.abs(p[0]-v);if(q<bd){bd=q;bi=i}});return bi};
 let dn=false;const set=i=>{if(i!==sel){sel=i;paint()}};
 c.addEventListener('pointerdown',e=>{dn=true;set(pick(e))});
 c.addEventListener('pointermove',e=>{if(dn||e.pointerType==='mouse')set(pick(e))});
 c.addEventListener('pointerup',()=>{dn=false});c.addEventListener('pointercancel',()=>{dn=false});
 c.addEventListener('pointerleave',()=>{dn=false;if(sel>=0){sel=-1;paint()}});
 paint()}
async function nrunChart(){
 const box=document.querySelector('#nrc');if(!box||!NRUN)return;
 const id=String(NRUN.id);let d=RSM[id]||rsLoad()[id];
 if(d){RSM[id]=d;rsDraw(box,d);return}
 if(RSF[id]&&Date.now()-RSF[id]<3e5){box.innerHTML='<div class="mu rsl">Für diesen Lauf liefert Intervals.icu keinen Verlauf.</div>';return}
 box.innerHTML='<div class="mu rsl">Verlauf wird geladen…</div>';
 try{
  const r=await lifecycle.fetch('https://intervals.icu/api/v1/activity/'+encodeURIComponent(id)+'/streams.json?types=time,distance,velocity_smooth,heartrate',{headers:{Authorization:'Basic '+btoa('API_KEY:'+ICU.key)}});
  if(!r.ok)throw new Error('http');
  d=rsProcess(await r.json());if(!d)throw new Error('leer');
  RSM[id]=d;rsSave(id,d)}
 catch(e){RSF[id]=Date.now()}
 const b2=document.querySelector('#nrc');if(!b2||!NRUN||String(NRUN.id)!==id)return;
 if(d)rsDraw(b2,d);else b2.innerHTML='<div class="mu rsl">Für diesen Lauf liefert Intervals.icu keinen Verlauf.</div>'}

/* ---- Neuer Lauf auf Heute ---- */
function runCardH(r,k,when){
 const pc=r.sec>0&&r.km>0?r.sec/r.km:null,t=(v,l)=>v==null||v===''?'':'<div class="tl"><b>'+v+'</b><span>'+l+'</span></div>';
 return'<div class="card nrun nrc2" data-orun="'+esc(r.id)+'" role="button" tabindex="0" aria-label="Lauf öffnen: '+esc(r.n||'Lauf')+'" style="--kc:'+KCOL[k]+'"><div class="nrk"><span class="kt" style="background:'+KCOL[k]+'">'+KIND[k]+'</span> '+when+'</div><div class="nrh"><div class="nrn">'+esc(r.n||'Lauf')+'</div><span class="nrgo" aria-hidden="true">›</span></div>'
  +'<div class="nrb">'+dec(r.km,2)+'<small>km</small></div><div class="tiles">'+t(r.sec?dur(r.sec):null,'Dauer')+t(pc?fp(pc)+' /km':null,'Pace')+'</div></div>'}
/* ===== Lauf-Detail ===== */
const RDK='moach_rd_',RDF={};let RVM=null,RVD=null,RVR=null;
const rdLoad=()=>{try{return JSON.parse(LS.get(RDK+UID)||'{}')||{}}catch(e){return{}}};
function rdSave(id,v){try{const o=rdLoad();delete o[id];o[id]=v;const ks=Object.keys(o);while(ks.length>8)delete o[ks.shift()];LS.set(RDK+UID,JSON.stringify(o))}catch(e){}}
const rdN=v=>v!=null&&v!==''&&isFinite(+v)&&+v>0?+v:null;
function rdElev(alt){
 const a=(alt||[]).map(Number).filter(v=>isFinite(v));if(a.length<10)return null;
 const sm=a.map((_,i)=>{let s=0,c=0;for(let j=Math.max(0,i-2);j<=Math.min(a.length-1,i+2);j++){s+=a[j];c++}return s/c});
 let g=0,l=0,ref=sm[0];for(const v of sm){if(v-ref>=2){g+=v-ref;ref=v}else if(ref-v>=2){l+=ref-v;ref=v}}
 return{g:Math.round(g),l:Math.round(l)}}
function rdProcess(raw){
 const g={};
 if(Array.isArray(raw))raw.forEach(x=>{if(x&&x.type&&Array.isArray(x.data)){g[x.type]=x.data;if(Array.isArray(x.data2))g[x.type+'2']=x.data2}});
 else if(raw&&typeof raw=='object')for(const k in raw)if(Array.isArray(raw[k]))g[k]=raw[k];
 const D=g.distance,T=g.time,V=g.velocity_smooth,H=g.heartrate,C=g.cadence,A=g.altitude;
 if(!D||D.length<20||!(T||V))return null;
 const n=D.length,tot=(+D[n-1]||0)/1000;if(!(tot>=.3))return null;
 const N=Math.min(260,Math.max(20,Math.round(tot*14))),w=Math.max(.1,tot/N*1.5);
 const bs=(a,x)=>{let lo=0,hi=a.length-1;while(lo<hi){const m=(lo+hi)>>1;if(a[m]<x)lo=m+1;else hi=m}return lo};
 let cf=1;if(C){const pc=C.filter(v=>v>20).sort((a,b)=>a-b);if(pc.length&&pc[pc.length>>1]<120)cf=2}
 const pre=(S,ok)=>{const s=[0],c=[0];for(let i=0;i<n;i++){const v=S?+S[i]:NaN,k=S&&ok(v);s.push(s[i]+(k?v:0));c.push(c[i]+(k?1:0))}return{s,c}};
 const pH=pre(H,v=>v>40),pC=pre(C,v=>v>20),pA=pre(A,v=>isFinite(v)),pV=pre(V,v=>v>.3);
 const avg=(p,ia,ib)=>{const c=p.c[ib+1]-p.c[ia];return c>0?(p.s[ib+1]-p.s[ia])/c:null};
 const LL=i=>{const a=g.latlng;if(!a)return null;const v=a[i];let p=null;if(Array.isArray(v))p=[+v[0],+v[1]];else if(g.latlng2)p=[+a[i],+g.latlng2[i]];return p&&isFinite(p[0])&&isFinite(p[1])&&Math.abs(p[0])<=90&&(p[0]||p[1])?p:null};
 const pts=[],mk=[];
 for(let i=0;i<=N;i++){
  const x=tot*i/N,ia=bs(D,Math.max(0,x-w)*1000),ib=bs(D,Math.min(tot,x+w)*1000),im=bs(D,x*1000);
  let p=null;if(T){const dt=T[ib]-T[ia],dd=(D[ib]-D[ia])/1000;if(dd>.02&&dt>0)p=dt/dd}else{const v=avg(pV,ia,ib);if(v)p=1000/v}
  if(p!=null&&(p<150||p>900))p=null;
  const h=avg(pH,ia,ib),c=avg(pC,ia,ib),al=avg(pA,ia,ib);
  pts.push([Math.round(x*100)/100,p==null?null:Math.round(p),h==null?null:Math.round(h),c==null?null:Math.round(c*cf),al==null?null:Math.round(al*10)/10]);
  const q=LL(im);mk.push(q?[Math.round(q[0]*1e5)/1e5,Math.round(q[1]*1e5)/1e5]:null)}
 const rt=[];if(g.latlng){const st=Math.max(1,Math.floor(n/520));for(let i=0;i<n;i+=st){const q=LL(i);if(q)rt.push([Math.round(q[0]*1e5)/1e5,Math.round(q[1]*1e5)/1e5])}const q=LL(n-1);if(q)rt.push([Math.round(q[0]*1e5)/1e5,Math.round(q[1]*1e5)/1e5])}
 const hv=H?H.filter(v=>v>40):[],cv=C?C.filter(v=>v>20):[],el=A?rdElev(A):null;
 return{tot:Math.round(tot*100)/100,pts,mk,rt,ah:hv.length?Math.round(hv.reduce((a,b)=>a+b,0)/hv.length):null,ac:cv.length?Math.round(cv.reduce((a,b)=>a+b,0)/cv.length*cf):null,eg:el?el.g:null,el:el?el.l:null}}
async function rdFetch(r){
 const id=encodeURIComponent(String(r.id)),hd={Authorization:'Basic '+btoa('API_KEY:'+ICU.key)},b='https://intervals.icu/api/v1/activity/'+id;
 const get=async u=>{const x=await lifecycle.fetch(u,{headers:hd});if(!x.ok)throw new Error('http '+x.status);return x.json()};
 const[a,s]=await Promise.allSettled([get(b),get(b+'/streams.json?types=time,distance,velocity_smooth,heartrate,cadence,altitude,latlng')]);
 if(a.status!='fulfilled'&&s.status!='fulfilled')throw new Error('Keine Verbindung zu Intervals.icu');
 const A=a.status=='fulfilled'?a.value||{}:null;
 const x=A?{mx:A.max_heartrate,ld:A.icu_training_load,tr:A.trimp,cal:A.calories,cad:A.average_cadence,sl:A.average_step_length,st:A.average_stride,gct:A.average_stance_time,vo:A.average_vertical_oscillation,vr:A.average_vertical_ratio,gap:A.gap,eg:A.total_elevation_gain,el:A.total_elevation_loss}:null;
 let sp=null;if(s.status=='fulfilled'){try{sp=rdProcess(s.value)}catch(e){sp=null}}
 return{at:Date.now(),x,s:sp}}
/* Werte aus Intervals normalisieren (Einheiten je nach Gerät unterschiedlich) */
function rdFacts(r,d){
 const x=(d&&d.x)||{},s=(d&&d.s)||{},o={};
 o.mx=rdN(x.mx)||r.mx||null;o.ld=rdN(x.ld)||r.ld||null;o.tr=rdN(x.tr);o.cal=rdN(x.cal);
 let cad=rdN(x.cad);if(cad&&cad<120)cad*=2;if(!cad)cad=rdN(s.ac);o.cad=cad?Math.round(cad):null;
 const spd=r.sec>0&&r.km>0?r.km*1000/r.sec:null;let sl=rdN(x.sl);
 if(sl){if(sl>10)sl/=1000;else if(sl>3.5)sl/=100}
 let st=rdN(x.st);if(st&&st>1.7)st/=2;
 if(!(sl>.5&&sl<2))sl=null;if(!(st>.5&&st<2))st=null;
 if(!sl&&!st&&o.cad&&spd)sl=spd*60/o.cad;
 const step=sl||st;o.sl=step&&step>.5&&step<2?step:null;
 let g=rdN(x.gct);if(g&&g<1)g*=1000;o.gct=g&&g>80&&g<600?Math.round(g):null;
 let vo=rdN(x.vo);if(vo&&vo>30)vo/=10;o.vo=vo&&vo>2&&vo<20?vo:null;
 let vr=rdN(x.vr);if(vr&&vr<.5)vr*=100;o.vr=vr&&vr>2&&vr<20?vr:null;
 const gp=rdN(x.gap);o.gap=gp&&1000/gp>150&&1000/gp<900?1000/gp:null;
 let eg=rdN(x.eg),el=rdN(x.el);
 if(el==null&&s.el!=null){eg=s.eg!=null?s.eg:eg;el=s.el}
 if(eg==null&&s.eg!=null)eg=s.eg;
 o.eg=eg!=null?Math.round(eg):null;o.el=el!=null?Math.round(el):null;
 return o}
function rdTile(l,v,u){return'<div class="tl'+(v==null?' na':'')+'"><b>'+(v==null?'–':v+(u?'<small> '+u+'</small>':''))+'</b><span>'+l+'</span></div>'}
const RDC=[
 {k:'pace',t:'Pace',ix:1,col:'#2563eb',u:'/km',inv:1,fmt:v=>fp(v)},
 {k:'hr',t:'HR',ix:2,col:'#ef4444',u:'bpm',fmt:v=>String(Math.round(v))},
 {k:'cad',t:'Cadence',ix:3,col:'#8b5cf6',u:'spm',fmt:v=>String(Math.round(v))},
 {k:'alt',t:'Elevation',ix:4,col:'#16a34a',u:'m',fmt:v=>String(Math.round(v))}];
function rdRange(c,s,av){
 const ok=s.pts.map(p=>p[c.ix]).filter(v=>v!=null).sort((a,b)=>a-b);let lo=ok[0],hi=ok[ok.length-1];
 if(c.k=='pace'){lo=ok[Math.floor(ok.length*.03)];hi=ok[Math.min(ok.length-1,Math.floor(ok.length*.97))]}
 if(av!=null){lo=Math.min(lo,av);hi=Math.max(hi,av)}
 const pad=Math.max(c.k=='alt'?2:c.k=='pace'?6:3,(hi-lo)*.12);return[lo-pad,hi+pad]}
function rdChart(c,s,avgTxt,av){
 const vals=s.pts.map(p=>p[c.ix]),ok=vals.filter(v=>v!=null);
 const head='<div class="rdch"><b>'+c.t+'</b><span class="rdcv" data-avg="'+esc(avgTxt||'')+'">'+esc(avgTxt||'')+'</span></div>';
 if(ok.length<3)return'<div class="card rvcc" data-k="'+c.k+'">'+head+'<div class="mu rdna">Keine Daten für diesen Lauf.</div></div>';
 const W=340,H=120,Lx=36,Rx=8,Tp=8,B=20,iw=W-Lx-Rx,ih=H-Tp-B,tot=s.tot,f=v=>v.toFixed(1);
 const[lo,hi]=rdRange(c,s,av);
 const X=v=>Lx+iw*v/tot,Y=v=>c.inv?Tp+ih*(v-lo)/(hi-lo):Tp+ih*(1-(v-lo)/(hi-lo)),yc=v=>Math.max(Tp,Math.min(Tp+ih,Y(v)));
 let sv='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+c.t+' über die Distanz">';
 for(let i=0;i<=2;i++){const y=Tp+ih*i/2,v=c.inv?lo+(hi-lo)*i/2:hi-(hi-lo)*i/2;sv+='<line x1="'+Lx+'" x2="'+(W-Rx)+'" y1="'+f(y)+'" y2="'+f(y)+'" class="rdg"/><text x="'+(Lx-5)+'" y="'+f(y+3)+'" text-anchor="end" class="rdt">'+c.fmt(v)+'</text>'}
 const st=tot<=6?1:tot<=14?2:tot<=30?5:10;for(let k=0;k<=tot+.001;k+=st)sv+='<text x="'+f(X(k))+'" y="'+(H-6)+'" text-anchor="middle" class="rdt">'+k+'</text>';
 let ln='',ar='',seg=[];const flush=()=>{if(seg.length>1){ar+='M'+f(X(seg[0][0]))+' '+(Tp+ih)+seg.map(p=>'L'+f(X(p[0]))+' '+f(yc(p[1]))).join('')+'L'+f(X(seg[seg.length-1][0]))+' '+(Tp+ih)+'Z'}seg=[]};
 s.pts.forEach(p=>{const v=p[c.ix];if(v==null){flush();return}seg.push([p[0],v]);ln+=(seg.length==1?'M':'L')+f(X(p[0]))+' '+f(yc(v))});flush();
 sv+='<path d="'+ar+'" fill="'+c.col+'" opacity=".14"/><path d="'+ln+'" fill="none" stroke="'+c.col+'" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
 if(av!=null){const ya=yc(av),ty=ya-4<Tp+8?ya+11:ya-4;sv+='<line class="rdav" x1="'+Lx+'" x2="'+(W-Rx)+'" y1="'+f(ya)+'" y2="'+f(ya)+'" stroke="'+c.col+'"/><text x="'+(W-Rx-2)+'" y="'+f(ty)+'" text-anchor="end" class="rdavt" fill="'+c.col+'">Ø '+c.fmt(av)+'</text>'}
 sv+='<line class="rdl" x1="0" x2="0" y1="'+Tp+'" y2="'+(Tp+ih)+'" hidden/><circle class="rdd" r="4" fill="'+c.col+'" stroke="var(--card)" stroke-width="2" hidden/></svg>';
 return'<div class="card rvcc" data-k="'+c.k+'" data-av="'+(av!=null?av:'')+'" data-lx="'+Lx+'" data-iw="'+iw+'" data-w="'+W+'">'+head+'<div class="rdcs">'+sv+'</div></div>'}
function rdSel(i){
 const s=RVD&&RVD.s;if(!s)return;i=Math.max(0,Math.min(s.pts.length-1,i));const p=s.pts[i];
 document.querySelectorAll('#rv .rvcc').forEach(el=>{
  const c=RDC.find(z=>z.k==el.dataset.k),sv=el.querySelector('svg'),ln=el.querySelector('.rdl'),dt=el.querySelector('.rdd'),rd=el.querySelector('.rdcv');if(!c||!sv||!ln)return;
  const Lx=+el.dataset.lx,iw=+el.dataset.iw,x=Lx+iw*p[0]/s.tot,v=p[c.ix];
  ln.setAttribute('x1',x);ln.setAttribute('x2',x);ln.removeAttribute('hidden');
  if(v!=null){const m=sv.__y;dt.setAttribute('cx',x);dt.setAttribute('cy',m?m(v):0);dt.removeAttribute('hidden')}else dt.setAttribute('hidden','');
  rd.textContent=km1(p[0])+' km · '+(v==null?'–':c.fmt(v)+' '+c.u);rd.classList.add('sel')});
 if(RVM&&s.mk&&s.mk[i])RVM.marker(s.mk[i])}
function rdBind(){
 const s=RVD&&RVD.s;if(!s)return;
 document.querySelectorAll('#rv .rvcc').forEach(el=>{
  const box=el.querySelector('.rdcs'),sv=box&&box.querySelector('svg');if(!box)return;
  const c=RDC.find(z=>z.k==el.dataset.k),Lx=+el.dataset.lx,iw=+el.dataset.iw,W=+el.dataset.w;
  const[lo,hi]=rdRange(c,s,el.dataset.av!==''&&el.dataset.av!=null?+el.dataset.av:null),Tp=8,ih=120-Tp-20;
  sv.__y=v=>Math.max(Tp,Math.min(Tp+ih,c.inv?Tp+ih*(v-lo)/(hi-lo):Tp+ih*(1-(v-lo)/(hi-lo))));
  let dn=false;const pick=e=>{const r=sv.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*W;rdSel(Math.round(Math.max(0,Math.min(1,(px-Lx)/iw))*(s.pts.length-1)))};
  box.addEventListener('pointerdown',e=>{dn=true;pick(e)});box.addEventListener('pointermove',e=>{if(dn||e.pointerType==='mouse')pick(e)});
  box.addEventListener('pointerup',()=>{dn=false});box.addEventListener('pointercancel',()=>{dn=false})})}
function rvHtml(r,d,state){
 const dt=parse(r.d),a=(()=>{try{return analyzeRun(r,rctx(allRuns(),x=>plan(x,1),true))}catch(e){return{kind:'easy'}}})();
 const f=rdFacts(r,d),pc=r.sec>0&&r.km>0?r.sec/r.km:null,s=d&&d.s;
 let h='<div class="rvh"><button type="button" class="rvb" id="rvx">‹ Zurück</button><span>Lauf</span></div><div class="rvc">'
  +'<div class="rvt"><span class="kt" style="background:'+KCOL[a.kind||'easy']+'">'+KIND[a.kind||'easy']+'</span> '+esc(DOW[(dt.getDay()+6)%7])+', '+dt.getDate()+'. '+MON3[dt.getMonth()]+' '+dt.getFullYear()+(r.t?' · '+esc(String(r.t).slice(0,5))+' Uhr':'')+'</div>'
  +'<h2 class="rvn">'+esc(r.n||'Lauf')+'</h2>'
  +'<div class="tiles rvk">'+rdTile('Distanz',dec(r.km,2),'km')+rdTile('Dauer',r.sec?dur(r.sec):null)+rdTile('Pace',pc?fp(pc):null,'/km')+'</div>';
 const note=state=='load'?'Details werden geladen …':state=='nokey'?'Verbinde Intervals.icu im Profil, um Karte und Details zu sehen.':state=='manual'?'Manuell eingetragen: Es gibt keine Streckendaten.':state=='err'?'Details konnten nicht geladen werden.':'';
 const hasMap=s&&s.rt&&s.rt.length>5;
 h+='<div class="card rvmc">'+(hasMap?'<div id="rvm" class="rvm"></div>':'<div class="rvm rvm0"><span>'+esc(note||(state=='ok'?'Für diesen Lauf gibt es keine GPS-Daten.':''))+'</span>'+(state=='err'?'<button type="button" class="rngb" id="rvr">Erneut versuchen</button>':'')+'</div>')+'</div>';
 h+='<div class="card"><h3 class="rvs">Effort</h3><div class="tiles">'+rdTile('Max. HR',f.mx,'bpm')+rdTile('Training Load',f.ld)+rdTile('TRIMP',f.tr!=null?Math.round(f.tr):null)+rdTile('Calories',f.cal,'kcal')+'</div></div>';
 h+='<div class="card"><h3 class="rvs">Running Form</h3><div class="tiles">'+rdTile('Cadence',f.cad,'spm')+rdTile('Stride length',f.sl?dec(f.sl,2):null,'m')+rdTile('Ground contact',f.gct,'ms')+rdTile('Vertical oscillation',f.vo?dec(f.vo,1):null,'cm')+rdTile('Vertical ratio',f.vr?dec(f.vr,1):null,'%')+'</div>'
  +(state=='ok'&&f.gct==null&&f.vo==null&&f.vr==null?'<small class="mu rvn2">Laufdynamik (Bodenkontakt, Oszillation, Ratio) liefert nur eine kompatible Uhr mit passendem Sensor.</small>':'')+'</div>';
 h+='<div class="card"><h3 class="rvs">Terrain</h3><div class="tiles">'+rdTile('Elevation gain',f.eg,'m')+rdTile('Elevation loss',f.el,'m')+rdTile('Grade-adj. pace',f.gap?fp(f.gap):null,'/km')+'</div></div>';
 if(s&&s.pts){
  const am=s.pts.map(p=>p[4]).filter(v=>v!=null),aa=am.length?am.reduce((x,y)=>x+y,0)/am.length:null,hv=s.ah||r.hr||null;
  const avn={pace:pc||null,hr:hv,cad:f.cad||null,alt:aa},
   av={pace:pc?'Ø '+fp(pc)+' /km':'',hr:hv?'Ø '+hv+' bpm':'',cad:f.cad?'Ø '+f.cad+' spm':'',alt:aa!=null?'Ø '+Math.round(aa)+' m'+(f.eg!=null?' · +'+f.eg+' m':''):''};
  h+=RDC.map(c=>rdChart(c,s,av[c.k],avn[c.k])).join('')}
 else if(state=='ok')h+='<div class="card"><div class="mu">Für diesen Lauf liefert Intervals.icu keinen Verlauf.</div></div>';
 h+='<div class="card"><h3 class="rvs">Analyse</h3><div class="an a-g"><b>Das lief gut</b><ul>'+(a.good||[]).map(x=>'<li>'+x+'</li>').join('')+'</ul></div>'
  +((a.bad||[]).length?'<div class="an a-y"><b>Weniger gut</b><ul>'+a.bad.map(x=>'<li>'+x.t+'</li>').join('')+'</ul></div>':'<div class="an a-n"><b>Weniger gut</b>Nichts Auffälliges in den Daten.</div>')
  +((a.nxt||[]).length?'<div class="an nx"><b>Nächstes Mal</b><ul>'+a.nxt.map(x=>'<li>'+x+'</li>').join('')+'</ul></div>':'')+''+(r.manual||String(r.id).startsWith('m')?'<div class="b"><button type="button" id="rve" data-d="'+r.d+'">Eintrag bearbeiten</button></div>':'')+'</div>';
 return h+'<div class="rvf">Quelle: Intervals.icu. Werte, die dein Gerät nicht aufzeichnet, erscheinen als –.</div></div>'}
function rvPaint(state){
 const v=$('#rv'),keep=v.scrollTop;v.innerHTML=rvHtml(RVR,RVD,state);v.scrollTop=keep;
 $('#rvx').onclick=rvClose;const re_=$('#rve');if(re_)re_.onclick=()=>{const k=re_.dataset.d;rvClose();openM(k)};const rr=$('#rvr');if(rr)rr.onclick=()=>openRun(RVR.id,1);
 const s=RVD&&RVD.s;
 if(RVM){RVM.dispose();RVM=null}
 const el=$('#rvm');if(el&&s&&s.rt)RVM=mountMap(el,s.rt,{styleSwitch:true,host:lifecycle});
 if(s)rdBind()}
async function openRun(id,force){
 const r=allRuns().find(x=>String(x.id)==String(id));if(!r)return;
 RVR=r;RVD=null;const v=$('#rv');v.hidden=false;v.scrollTop=0;document.body.classList.add('rvo');
 const man=r.manual||!r.id||String(r.id).startsWith('m');
 if(man){rvPaint('manual');return}
 if(!ICU.key){rvPaint('nokey');return}
 const c=!force&&rdLoad()[String(r.id)];
 if(c){RVD=c;rvPaint('ok');return}
 rvPaint('load');
 try{const d=await rdFetch(r);if(!RVR||String(RVR.id)!=String(r.id))return;RVD=d;rdSave(String(r.id),d);rvPaint('ok')}
 catch(e){if(RVR&&String(RVR.id)==String(r.id))rvPaint('err')}}
function rvClose(){if(RVM)RVM.dispose();RVM=null;RVD=null;RVR=null;const v=$('#rv');v.hidden=true;v.innerHTML='';document.body.classList.remove('rvo')}
lifecycle.listen(document,'click',e=>{const t=e.target.closest&&e.target.closest('[data-orun]');if(!t||e.target.closest('button[data-go]'))return;e.preventDefault();openRun(t.dataset.orun)});
lifecycle.listen(document,'keydown',e=>{if(e.key=='Escape'&&!$('#rv').hidden)rvClose();else if((e.key=='Enter'||e.key==' ')&&e.target.matches&&e.target.matches('[data-orun]')){e.preventDefault();openRun(e.target.dataset.orun)}});

/* ===== Heatmap aller Läufe (Startseite) ===== */
const HMK='moach_hm_',HM={busy:false,done:0,total:0,fail:false};let HMM=null,HMV=null;
const hmLoadC=()=>{try{return JSON.parse(LS.get(HMK+UID)||'{}')||{}}catch(e){return{}}};
const hmSaveC=o=>{try{LS.set(HMK+UID,JSON.stringify(o))}catch(e){}};
function hmEnc(p){const o=[];let a=0,b=0;p.forEach((q,i)=>{const x=Math.round(q[0]*1e5),y=Math.round(q[1]*1e5);o.push(i?x-a:x,i?y-b:y);a=x;b=y});return o.join(',')}
function hmDec(s){if(!s)return[];const n=s.split(',').map(Number),o=[];let a=0,b=0;for(let i=0;i+1<n.length;i+=2){a+=n[i];b+=n[i+1];o.push([a/1e5,b/1e5])}return o}
function hmLL(raw){
 let la=null,ln=null;
 if(Array.isArray(raw)){const x=raw.find(z=>z&&z.type=='latlng');if(x){la=x.data;ln=x.data2}}
 else if(raw&&Array.isArray(raw.latlng))la=raw.latlng;
 if(!la)return[];const o=[];
 for(let i=0;i<la.length;i++){const v=la[i];let p=null;if(Array.isArray(v))p=[+v[0],+v[1]];else if(ln)p=[+la[i],+ln[i]];
  if(p&&isFinite(p[0])&&isFinite(p[1])&&Math.abs(p[0])<=90&&Math.abs(p[1])<=180&&(p[0]||p[1]))o.push(p)}
 return o}
function hmSimplify(p){
 const o=[];let l=null;for(const q of p){if(!l){o.push(q);l=q;continue}
  const dy=(q[0]-l[0])*111320,dx=(q[1]-l[1])*111320*Math.cos(q[0]*Math.PI/180);
  if(dx*dx+dy*dy>=625){o.push(q);l=q}}
 if(p.length&&o[o.length-1]!==p[p.length-1])o.push(p[p.length-1]);return o}
const HMB=[1,2,4,8,15];
function hmBuild(routes){
 const L=[[],[],[],[],[]];if(!routes.length)return L;
 const lat0=routes[0][0][0],cs=.00018,kx=cs/Math.max(.2,Math.cos(lat0*Math.PI/180)),cells=new Map(),ck=(cy,cx)=>(cy+600000)*4000000+(cx+2100000);
 const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
 routes.forEach((r,ri)=>{for(let j=0;j+1<r.length;j++){const m=mid(r[j],r[j+1]),k=ck(Math.round(m[0]/cs),Math.round(m[1]/kx)),a=cells.get(k);if(!a)cells.set(k,[ri]);else if(a[a.length-1]!==ri)a.push(ri)}});
 const n3=new Map(),cnt=(cy,cx)=>{const k=ck(cy,cx);let v=n3.get(k);if(v!=null)return v;const s=new Set();for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const a=cells.get(ck(cy+dy,cx+dx));if(a)for(const x of a)s.add(x)}v=s.size;n3.set(k,v);return v};
 const bk=n=>n>=15?4:n>=8?3:n>=4?2:n>=2?1:0,P=q=>{const s=Math.sin(q[0]*Math.PI/180);return[(q[1]+180)/360,.5-Math.log((1+s)/(1-s))/(4*Math.PI)]};
 routes.forEach(r=>{let cur=null;
  for(let j=0;j+1<r.length;j++){const m=mid(r[j],r[j+1]),b=bk(cnt(Math.round(m[0]/cs),Math.round(m[1]/kx)));
   if(!cur||cur.b!==b){if(cur)cur.p.push(...P(r[j]));cur={b,p:[]};L[b].push(cur)}
   cur.p.push(...P(r[j]))}
  if(cur&&r.length)cur.p.push(...P(r[r.length-1]))});
 L.forEach(a=>a.forEach(pl=>{let x0=9,x1=-9,y0=9,y1=-9;for(let i=0;i<pl.p.length;i+=2){x0=Math.min(x0,pl.p[i]);x1=Math.max(x1,pl.p[i]);y0=Math.min(y0,pl.p[i+1]);y1=Math.max(y1,pl.p[i+1])}pl.bb=[x0,x1,y0,y1]}));
 return L}
function hmRuns(){return allRuns().filter(r=>r.id&&!r.manual&&!String(r.id).startsWith('m')&&r.km>0)}
function hmDraw(){
 const el=$('#hmm');if(!el)return;
 const C=hmLoadC(),runs=hmRuns(),rs=[];let km=0;
 runs.forEach(r=>{const p=hmDec(C[String(r.id)]);if(p.length>1){rs.push({p,r});km+=r.km}});
 const info=$('#hmi'),prog=HM.busy&&HM.total?' · lade Routen '+HM.done+'/'+HM.total:'';
 if(info)info.textContent=rs.length?rs.length+' Läufe · '+Math.round(km)+' km'+prog:(HM.busy?'Routen werden geladen … '+HM.done+'/'+HM.total:HM.fail?'Routen konnten nicht geladen werden. Es wird beim nächsten Öffnen erneut versucht.':'Keine GPS-Daten gefunden.');
 const L=hmBuild(rs.map(x=>x.p));
 // Ausschnitt: um den neuesten Lauf herum (Reisen in andere Städte blenden den Rest nicht aus, bleiben aber erreichbar)
 let fit=null;
 if(rs.length){const o=rs[0].p[0],near=rs.filter(x=>{const q=x.p[0],dy=(q[0]-o[0])*111,dx=(q[1]-o[1])*111*Math.cos(o[0]*Math.PI/180);return dx*dx+dy*dy<2500});
  fit=[];near.forEach(x=>x.p.forEach(q=>fit.push(q)))}
 if(HMM){HMM.layers(L,fit,!rs.length);return}
 HMM=mountMap(el,null,{layers:L,fit:fit||[],coop:true,view:HMV,styleSwitch:true,host:lifecycle})}
async function hmFetch(){
 if(HM.busy||!ICU.key||navigator.onLine===false||(HM.retry&&Date.now()<HM.retry))return;
 const cache=hmLoadC(),todo=hmRuns().filter(r=>!(String(r.id) in cache));
 if(!todo.length)return;
 HM.busy=true;HM.fail=false;HM.total=todo.length;HM.done=0;
 const hd={Authorization:'Basic '+btoa('API_KEY:'+ICU.key)};let i=0,bad=0;
 const w=async()=>{while(i<todo.length&&bad<4){const r=todo[i++],id=String(r.id);
   try{const x=await lifecycle.fetch('https://intervals.icu/api/v1/activity/'+encodeURIComponent(id)+'/streams.json?types=latlng',{headers:hd});
    if(x.status==404||x.status==422)cache[id]='';
    else if(!x.ok){bad++;continue}
    else cache[id]=hmEnc(hmSimplify(hmLL(await x.json())))}
   catch(e){bad++;continue}
   HM.done++;if(HM.done%10==0){hmSaveC(cache);hmDraw()}}};
 await Promise.all([w(),w(),w()]);
 hmSaveC(cache);HM.busy=false;HM.fail=bad>=4;if(HM.fail)HM.retry=Date.now()+3e5;hmDraw()}
function hmInit(){
 if(HMM){try{HMV=HMM.view()}catch(e){}HMM.dispose()}HMM=null;
 if(!$('#hmm'))return;hmDraw();hmFetch()}

/* ---- Race-Day-Chance ---- */
const Phi=x=>{const t=1/(1+.2316419*Math.abs(x)),d=.3989423*Math.exp(-x*x/2),p=d*t*(.3193815+t*(-.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));return x>0?1-p:p};
const RCF=()=>Object.assign({el:0,tp:12},S.rcf||{});
function raceModel(goal,K,o){
 K=K||RD();o=o||{};
 const P=progn(),keys=Object.keys(P).map(Number);if(!keys.length)return null;
 const bk=keys.reduce((a,b)=>Math.abs(Math.log(b/K))<Math.abs(Math.log(a/K))?b:a),b=P[bk],ex=Math.abs(bk-K)<.3;
 const fit=ex?b.sec:b.sec*Math.pow(K/bk,1.06),c=RCF(),el=o.el!=null?o.el:c.el,tp=o.tp!=null?o.tp:c.tp;
 const wks=Math.max(0,(parse(S.race)-today)/(7*D)),mo=wks/4.345,gainP=wks>8?Math.min(.06,.004*(mo-1.84)):0;
 const tr=fit*(1-gainP),course=Math.max(0,+el||0),wf=Math.min(1,K/21.0975),weather=tr*(tp>10?.003*(tp-10):tp<3?.0015*(3-tp):0)*wf;
 const mu=tr+course+weather,aw=Math.max(0,(today-parse(b.r.d))/(7*D));
 const pc={base:K<=10?1.8:2.5,ext:ex?0:Math.min(2,Math.abs(Math.log(K/bk))*2.2),age:aw>8?Math.min(1.5,(aw-8)*.1):0,hor:Math.min(3,.25*mo)};
 const sgp=Math.sqrt(pc.base*pc.base+pc.ext*pc.ext+pc.age*pc.age+pc.hor*pc.hor),sg=mu*sgp/100;
 return{K,bk,b,ex,fit,gainP,gain:fit-tr,tr,course,weather,mu,sg,sgp,pc,wks,mo,el,tp,aw,pct:Phi((goal-mu)/sg),goal}}
function raceCurve(m,goal,h){
 const W=320,H=h||120,L=10,R=10,T=8,B=22,iw=W-L-R,ih=H-T-B,mu=m.mu,sg=m.sg;
 let x0=Math.min(mu-3.4*sg,goal-.8*sg),x1=Math.max(mu+3.4*sg,goal+.8*sg);
 const X=v=>L+iw*(v-x0)/(x1-x0),pdf=v=>Math.exp(-.5*Math.pow((v-mu)/sg,2)),Y=v=>T+ih*(1-pdf(v));
 let ln='',ar='';const N=70;
 for(let i=0;i<=N;i++){const v=x0+(x1-x0)*i/N;ln+=(i?'L':'M')+X(v).toFixed(1)+' '+Y(v).toFixed(1)}
 const ga=Math.max(x0,Math.min(x1,goal));
 for(let i=0;i<=N;i++){const v=x0+(ga-x0)*i/N;ar+=(i?'L':'M')+X(v).toFixed(1)+' '+Y(v).toFixed(1)}
 ar+='L'+X(ga).toFixed(1)+' '+(T+ih)+'L'+X(x0).toFixed(1)+' '+(T+ih)+'Z';
 const tick=[];for(let i=0;i<=4;i++)tick.push(x0+(x1-x0)*i/4);
 let s='<svg class="chs" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Verteilung der erwarteten Renntagszeit"><path d="'+ar+'" fill="#22c55e" fill-opacity=".35"/><path d="'+ln+'" fill="none" stroke="var(--tx)" stroke-width="2"/>'
  +'<line x1="'+X(goal).toFixed(1)+'" x2="'+X(goal).toFixed(1)+'" y1="'+T+'" y2="'+(T+ih)+'" stroke="#ef4444" stroke-width="2"/><text x="'+X(goal).toFixed(1)+'" y="'+(T+9)+'" font-size="9" font-weight="700" fill="#ef4444" text-anchor="'+(X(goal)>W-60?'end':'start')+'" dx="'+(X(goal)>W-60?-4:4)+'">Ziel</text>'
  +'<line x1="'+X(mu).toFixed(1)+'" x2="'+X(mu).toFixed(1)+'" y1="'+(T+ih*.55)+'" y2="'+(T+ih)+'" stroke="var(--tx)" stroke-width="1.4" stroke-dasharray="3 3"/>';
 tick.forEach(v=>{s+='<text x="'+X(v).toFixed(1)+'" y="'+(H-7)+'" text-anchor="middle" font-size="9" fill="var(--mu)">'+tlab(v)+'</text>'});
 return s+'</svg>'}
function raceOk(){return!S.noPlan&&CF().mode!='maintain'&&Math.round((parse(S.race)-today)/D)>=0}
const RCS={K:null,goal:null};
function raceMount(host,onDraw){
 const c=RCF(),st={K:RCS.K||RD(),goal:RCS.goal,el:+c.el||0,tp:+c.tp};
 const dist=[[5,'5 km'],[10,'10 km'],[21.0975,'Halbmarathon'],[42.195,'Marathon']];
 if(!dist.some(x=>Math.abs(x[0]-RD())<.3))dist.push([RD(),RN()]);
 const stepOf=K=>K>=40?30:K>=20?15:5;
 const initGoal=()=>{const K=st.K;if(Math.abs(K-RD())<.3&&!S.noPlan)return GT();const m0=raceModel(1,K,{el:st.el,tp:st.tp});return m0?Math.round(m0.mu*.99/stepOf(K))*stepOf(K):0};
 if(!st.goal)st.goal=initGoal();
 host.innerHTML='<h3>Race-Day-Chance'+inf('race')+'</h3><div class="sub">Wie wahrscheinlich ist deine Wunschzeit? Gerechnet aus deinen Läufen.</div><div class="b" id="rcK">'+dist.map(x=>'<button class="chip" data-k="'+x[0]+'">'+x[1]+'</button>').join('')+'</div><div id="rcTop"></div>'
  +'<div class="rcc"><label>Wunschzeit <b id="rcGv"></b><input id="rcG" type="range"></label><label>Höhenmeter der Strecke (bergauf) <b id="rcEv"></b><input id="rcE" type="range" min="0" max="800" step="10"></label><label>Temperatur am Start <b id="rcTv"></b><input id="rcT" type="range" min="-5" max="32" step="1"></label></div><div id="rcOut"></div>';
 const q=s=>host.querySelector(s),g=q('#rcG'),e=q('#rcE'),t=q('#rcT');
 const setRange=()=>{const m0=raceModel(1,st.K,{el:st.el,tp:st.tp});if(!m0)return;const sp=stepOf(st.K);g.min=Math.round(m0.mu*.8/sp)*sp;g.max=Math.round(m0.mu*1.2/sp)*sp;g.step=sp;g.value=Math.min(+g.max,Math.max(+g.min,st.goal));st.goal=+g.value;RCS.goal=st.goal};
 const draw=()=>{
  const mm=raceModel(st.goal,st.K,{el:st.el,tp:st.tp});
  host.querySelectorAll('#rcK .chip').forEach(b=>b.classList.toggle('on',Math.abs(+b.dataset.k-st.K)<.01));
  q('#rcGv').textContent=dur(st.goal)+(st.K>=40?' h':'');q('#rcEv').textContent=st.el+' m';q('#rcTv').textContent=st.tp+' °C';
  const o=q('#rcOut'),tp=q('#rcTop');if(!mm){if(onDraw)onDraw(st,null);tp.innerHTML='';o.innerHTML='<p class="mu">Noch zu wenig Laufdaten für eine Prognose. Für den Marathon braucht es mindestens einen Lauf ab 13 km.</p>';return}
  const p=Math.round(mm.pct*100),ps=pcs(mm),tone=p>=60?'#16a34a':p>=35?'#d97706':'#dc2626';
  const row=(a,b,c2)=>'<tr><td>'+a+'</td><td style="text-align:right"><b>'+b+'</b></td></tr>'+(c2?'<tr><td colspan="2"><small>'+c2+'</small></td></tr>':'');
  tp.innerHTML='<div class="rcbig" style="color:'+tone+'">'+ps+'<small> %</small></div><div class="mu" style="text-align:center">Chance auf '+dur(st.goal)+(st.K>=40?' h':'')+'</div>'+raceCurve(mm,st.goal,130);
  if(onDraw)onDraw(st,mm);
  o.innerHTML='<table class="rct">'+row('Fitness heute',dur(mm.fit),'Prognose aus: '+esc(mm.b.r.n)+', '+dshort(mm.b.r.d)+(mm.ex?'':' (umgerechnet von '+dec(mm.bk,1)+' km)'))
   +row('Training bis Rennen',mm.gain>0?'−'+fp(mm.gain):'±0:00',mm.gainP>0?'Annahme +0,4 % Fitness pro Monat ab 8 Wochen vor dem Rennen (max. 6 %).':'Weniger als 8 Wochen: keine weitere Verbesserung angenommen.')
   +row('Strecke ('+st.el+' m bergauf)',mm.course?'+'+fp(mm.course):'±0:00')+row('Wetter ('+st.tp+' °C)',mm.weather>=1?'+'+fp(mm.weather):'±0:00')
   +row('Erwartung am Renntag',dur(mm.mu))+row('Unsicherheit (±1σ)','± '+fp(mm.sg),'Schwankung am Renntag, Alter der Datenbasis'+(mm.ex?'':', Umrechnung zwischen Distanzen')+' und Abstand zum Rennen.')+'</table>'
   +'<details><summary><b>Rechenweg</b></summary><div class="how"><p>Die Basis ist die Prognose aus deinem besten Lauf der letzten 26 Wochen (Riegel-Formel, Exponent 1,06; ältere Läufe werden um 0,4 % pro Woche abgewertet).</p><p>Dazu kommen: Trainingsfortschritt (+0,4 % pro Monat ab 8 Wochen vor dem Rennen, maximal 6 %), Höhenmeter (rund 1 s pro Meter bergauf) und Temperatur (+0,3 % pro °C über 10 °C, bei Kälte unter 3 °C +0,15 % pro °C).</p><p>Die Unsicherheit setzt sich aus Tagesform ('+mm.pc.base.toFixed(1).replace('.',',')+' %), Umrechnung zwischen Distanzen ('+mm.pc.ext.toFixed(1).replace('.',',')+' %), Alter der Datenbasis ('+mm.pc.age.toFixed(1).replace('.',',')+' %) und Abstand zum Rennen ('+mm.pc.hor.toFixed(1).replace('.',',')+' %) zusammen (quadratisch addiert = '+mm.sgp.toFixed(1).replace('.',',')+' %). Die Chance ist die Fläche der Glockenkurve links deiner Wunschzeit.</p><p>Das ist ein Modell, keine Garantie. Verletzung, Magen und Tagesform kennt es nicht.</p></div></details>'};
 host.querySelectorAll('#rcK .chip').forEach(b=>b.onclick=()=>{st.K=+b.dataset.k;RCS.K=st.K;st.goal=initGoal();setRange();draw()});
 g.oninput=()=>{st.goal=+g.value;RCS.goal=st.goal;draw()};
 e.value=st.el;t.value=st.tp;
 e.oninput=()=>{st.el=+e.value;setRange();draw()};t.oninput=()=>{st.tp=+t.value;setRange();draw()};
 const keep=()=>{S.rcf={el:st.el,tp:st.tp};save()};
 e.onchange=keep;t.onchange=keep;
 setRange();draw()}
function raceBanner(){const r=raceSoon();if(!r)return'';const when=r.i==0?'Heute':r.i==1?'Morgen':'In '+r.i+' Tagen';return'<div class="card ralert"><h3>'+when+': '+esc(r.p.ttl||r.p.lab)+'</h3><div class="sub">'+fday(r.d)+(r.p.km?' · '+r1(r.p.km)+' km':'')+'</div><p class="inb">'+r.p.d+'</p><small>Vorher: leicht essen, früh schlafen, nichts Neues ausprobieren. Details im Reiter Erholung.</small></div>'}
function rRace(){
 const el=$('#race');if(!el)return;
 if(!raceOk()){el.innerHTML='<div class="card"><h3>Race</h3><div class="sub">Countdown, Zielchance und Fahrplan erscheinen, sobald im Kalender ein Rennen geplant ist.</div><div class="b"><button class="pri" id="rcgo">Im Kalender planen</button></div></div>';el.insertAdjacentHTML('afterbegin',raceBanner());$('#rcgo').onclick=()=>showTab('cal');return}
 const K=RD(),goal=GT(),days=Math.round((parse(S.race)-today)/D),rd=parse(S.race);
 const tw=Math.max(1,Math.round((mon(rd)-mon(START))/(7*D))+1),cw=Math.max(1,Math.min(tw,tw-Math.max(0,wtr(today)))),pct=Math.max(0,Math.min(100,(today-START)/(rd-START)*100));
 const hero='<section class="hero"><div class="hr1"><div><div class="gr">'+RN()+'</div><div class="dt">'+rd.toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long',year:'numeric'})+'</div></div></div><div class="ht">'+(days==0?'Heute ist Renntag':days==1?'Morgen ist Renntag':'Noch '+days+' Tage')+'</div><div class="hs">Ziel '+dur(goal)+' · '+fp(rpace())+' /km</div><div class="rprog"><i style="width:'+pct.toFixed(1)+'%"></i></div><div class="ho">Trainingswoche '+cw+' von '+tw+'</div></section>';
 const below=(st,mm)=>{
  const K2=st.K,goal2=st.goal,pace=goal2/K2,P=progn(),sc=Math.abs(K2-K)>.3||Math.abs(goal2-goal)>1;
  const rows=[5,10,21.0975,42.195].filter(d=>d<=K2+.3).map(d=>{const need=Math.abs(d-K2)<.3?goal2:goal2*Math.pow(d/K2,1.06),cur=P[d]&&P[d].sec,df=cur?cur-need:null,nm=PD.find(x=>x[0]==d)[1];
   return'<tr><td>'+nm+'</td><td>'+dur(need)+'</td><td>'+(cur?dur(cur):'–')+'</td><td class="'+(df==null?'':df<=0?'okc':'badc')+'">'+(df==null?'–':(df<=0?'−':'+')+dur(Math.abs(df)))+'</td></tr>'}).join('');
  const sub=sc?'Für dein Szenario oben: <b>'+(Math.abs(K2-K)>.3?(PD.find(x=>Math.abs(x[0]-K2)<.3)||[0,dec(K2,1)+' km'])[1]+' in ':'')+dur(goal2)+(K2>=40?' h':'')+'</b>. Zeiten auf kürzeren Distanzen:':'Diese Zeiten entsprechen deinem Ziel auf kürzeren Distanzen.';
  const exp=mm?'<div class="rexp">Mit deinen Einstellungen (Strecke '+st.el+' m, Wetter '+st.tp+' °C) erwartet M.oach <b>'+dur(mm.mu)+'</b> am Renntag, das sind '+(mm.mu<=goal2?'<span class="okc">'+fp(goal2-mm.mu)+' schneller</span>':'<span class="badc">'+fp(mm.mu-goal2)+' langsamer</span>')+' als deine Wunschzeit.</div>':'';
  const fahr='<div class="card"><h3>Fahrplan zum Ziel'+inf('rfp')+'</h3><div class="sub">'+sub+'</div><table class="rct rfp"><tr><th>Distanz</th><th>Du brauchst</th><th>Prognose</th><th>Abstand</th></tr>'+rows+'</table>'+exp+'</div>';
  const step=K2>=15?5:K2>=8?2:1,pts=[];for(let d=step;d<K2-.01;d+=step)pts.push(d);if(K2>=40)pts.push(21.0975);pts.sort((a,b)=>a-b);pts.push(K2);
  const spl='<div class="card"><h3>Splits für '+dur(goal2)+(K2>=40?' h':'')+'</h3><div class="sub">Passend zur Wunschzeit im Regler oben: gleichmäßiges Tempo von '+fp(pace)+' /km. Die ersten 10 km sind 3–5 s/km langsamer völlig in Ordnung.</div><table class="rct">'+pts.map(d=>'<tr><td>'+(Math.abs(d-21.0975)<.01?'Halbmarathon':Math.abs(d-K2)<.01?'Ziel ('+dec(K2,1)+' km)':dec(d,0)+' km')+'</td><td style="text-align:right"><b>'+dur(pace*d)+'</b></td></tr>').join('')+'</table></div>';
  bl.innerHTML=fahr+spl};
 el.innerHTML=hero+raceBanner()+'<div class="card racec" id="rcHost"></div><div id="rcBelow"></div>';
 const bl=$('#rcBelow');
 raceMount($('#rcHost'),below);wireNew(el)}

/* ---- Repair-Guide ---- */
function repApply(d,p,mode){
 if(mode=='l'){const k=Math.min(p.km,Math.max(6,Math.round(p.km*.75)));return Object.assign({},p,{km:k,d:p.d.replace(/^[\d.,]+ km/,k+' km')+' Gekürzt um etwa ein Viertel wegen hoher Belastung.',rep:{lab:p.lab,km:p.km}})}
 const z=Z(d),k=Math.max(5,Math.min(14,Math.round(p.km*.85)));
 return{t:'easy',lab:'Locker',km:k,str:p.str||'',d:k+' km locker @ '+fp(z.e1)+'–'+fp(z.e2)+' /km. Statt '+p.lab+' (angepasst wegen hoher Belastung).',rep:{lab:p.lab,km:p.km}}}
function repOv(d,p){
 const r=S.rep&&p&&S.rep[iso(d)];
 if(!r||p.rep||p.t=='rest'||p.t=='race')return p;
 if(r.m=='e'&&(p.t=='q'||p.t=='long'))return repApply(d,p,'e');
 if(r.m=='l'&&p.t=='long')return repApply(d,p,'l');
 return p}
function repScore(){
 const R=readiness(),m=R.m,w=[];let s=0;
 const add=(n,t)=>{s+=n;w.push(t)};
 if(m.ratio>1.5)add(2,'Die letzten 7 Tage waren '+m.ratio.toFixed(1).replace('.',',')+'× so umfangreich wie dein 4-Wochen-Schnitt.');else if(m.ratio>1.3)add(1,'Der Umfang steigt schnell ('+m.ratio.toFixed(1).replace('.',',')+'× dein Schnitt).');
 if(m.form!=null&&m.form<-30)add(2,'Form '+Math.round(m.form)+': viel aufgestaute Ermüdung.');else if(m.form!=null&&m.form<-20)add(1,'Form '+Math.round(m.form)+': deutlich ermüdet.');
 if(m.streak>=7)add(2,m.streak+' Lauftage in Folge.');else if(m.streak>=6)add(1,m.streak+' Lauftage in Folge.');
 if(m.rpe>=8)add(2,'Die letzten Läufe waren sehr hart (RPE Ø '+m.rpe.toFixed(1).replace('.',',')+').');else if(m.rpe>=7)add(1,'Die letzten Läufe waren hart (RPE Ø '+m.rpe.toFixed(1).replace('.',',')+').');
 if(m.rhr&&m.rhrB&&m.rhr-m.rhrB>=8)add(2,'Ruhepuls '+Math.round(m.rhr)+' (sonst Ø '+Math.round(m.rhrB)+').');else if(m.rhr&&m.rhrB&&m.rhr-m.rhrB>=5)add(1,'Ruhepuls erhöht: '+Math.round(m.rhr)+' (sonst Ø '+Math.round(m.rhrB)+').');
 if(m.hrv&&m.hrvB&&m.hrv<m.hrvB*.75)add(2,'HRV deutlich unter deinem Schnitt.');else if(m.hrv&&m.hrvB&&m.hrv<m.hrvB*.85)add(1,'HRV unter deinem Schnitt.');
 if(R.pain==2)add(3,'Du meldest deutliche Schmerzen.');else if(R.pain==1)add(1,'Du meldest leichtes Ziehen.');
 return{s,w}}
function repairSuggest(){
 if(S.noPlan||Math.round((parse(S.race)-today)/D)<=7)return null;
 const sc=repScore();if(sc.s<3)return null;
 const items=[];let q=null,l=null;
 for(let i=1;i<=6;i++){const d=addD(today,i),k=iso(d);if(k>=S.race)break;const p=plan(d,1);if(!p||S.rep&&S.rep[k])continue;
  if(p.t=='q'&&!q)q={k,d,m:'e',p};if(p.t=='long'&&!l)l={k,d,m:'l',p}}
 if(q)items.push(q);
 if(l&&(sc.s>=5||!q&&sc.s>=4))items.push(l);
 if(!items.length)return null;
 items.forEach(x=>{x.to=repApply(x.d,x.p,x.m)});
 return{s:sc.s,why:sc.w,items}}
function repliedList(){return Object.keys(S.rep||{}).filter(k=>k>=iso(today)).sort()}
function todayRepair(action){
 if(action==='apply'){
  const g=repairSuggest();if(!g)return;S.rep=S.rep||{};
  Object.keys(S.rep).forEach(k=>{if(k<iso(addD(today,-14)))delete S.rep[k]});
  g.items.forEach(x=>{S.rep[x.k]={m:x.m,why:g.why.slice(0,3)}});
 }else if(action==='dismiss')S.repIgn=iso(today);
 else if(action==='undo'){Object.keys(S.rep||{}).forEach(k=>{if(k>=iso(today))delete S.rep[k]});S.repIgn=iso(today)}
 save();render();
}
function wireRepair(el){
 [['#rpA','apply'],['#rpI','dismiss'],['#rpU','undo']].forEach(([selector,action])=>{
  const button=el.querySelector(selector);if(button)button.onclick=()=>todayRepair(action);
 });
}

/* ---- Jahresübersicht ---- */
function monthData(){
 const Y=S.yr,to=Y&&Y.to||'',M={};
 const add=(k,r)=>{const o=M[k]||(M[k]={km:0,n:0,sec:0,el:0,ld:0,longest:0});o.km+=r.km;o.n++;o.sec+=r.sec||0;o.el+=r.el||0;o.ld+=r.ld||0;if(r.km>o.longest)o.longest=r.km};
 if(Y&&Y.m)for(const k in Y.m)M[k]=Object.assign({},Y.m[k]);
 for(const r of allRuns()){if(r.d<=to||!(r.km>0))continue;add(r.d.slice(0,7),r)}
 return M}
const nf=n=>Math.round(n).toLocaleString('de-DE').replace(/\./g,' ');
function weekData(){
 const Y=S.yr,to=Y&&Y.to||'',W={};
 const add=(k,r)=>{const o=W[k]||(W[k]={km:0,n:0,sec:0,el:0,ld:0,longest:0});o.km+=r.km;o.n++;o.sec+=r.sec||0;o.el+=r.el||0;o.ld+=r.ld||0;if(r.km>o.longest)o.longest=r.km};
 if(Y&&Y.w)for(const k in Y.w)W[k]=Object.assign({},Y.w[k]);
 for(const r of allRuns()){if(r.d<=to||!(r.km>0))continue;add(iso(mon(parse(r.d))),r)}
 const out=[];
 for(let i=51;i>=0;i--){const ws=addD(mon(today),-7*i),k=iso(ws);out.push(Object.assign({k,ws},W[k]||{km:0,n:0,sec:0,el:0,ld:0,longest:0}))}
 return out}
let YRM='km',Y3={w:[],mode:'km',sel:-1};
function y3html(){
 const{w,mode,sel}=Y3,n=w.length,W=340,H=236,x0=14,p=(W-2*x0-10)/n,bw=Math.max(2.8,p*.66),dx=4.2,dy=-3.2,yb0=212,rise=30,HM=100;
 const val=x=>mode=='ld'?x.ld:x.km,mx=Math.max(1,...w.map(val)),imax=w.reduce((a,x,i)=>val(x)>val(w[a])?i:a,0),hi=sel>=0?sel:imax;
 const yb=i=>yb0-rise*i/(n-1),X=i=>x0+i*p,f=v=>v.toFixed(1);
 let s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Wochenumfang der letzten 52 Wochen als 3D-Balkendiagramm"><polygon points="'+f(x0-4)+','+f(yb(0)+3)+' '+f(X(n-1)+bw+4)+','+f(yb(n-1)+3)+' '+f(X(n-1)+bw+dx+6)+','+f(yb(n-1)+dy-1)+' '+f(x0-4+dx+2)+','+f(yb(0)+dy-1)+'" fill="rgba(255,255,255,.08)"/>';
 for(let i=0;i<n;i++){
  const v=val(w[i]),h=v>0?Math.max(1.6,v/mx*HM):0,x=X(i),yBase=yb(i),yT=yBase-h,on=i==hi,c=on?['#c6f135','#e6ff86','#8da814']:['#8fb2ee','#d3e2fa','#2f66c6'];
  if(h<=0){s+='<rect x="'+f(x)+'" y="'+f(yBase-1)+'" width="'+f(bw)+'" height="1.4" rx=".7" fill="rgba(255,255,255,.28)"/>';continue}
  s+='<polygon points="'+f(x+bw)+','+f(yT)+' '+f(x+bw+dx)+','+f(yT+dy)+' '+f(x+bw+dx)+','+f(yBase+dy)+' '+f(x+bw)+','+f(yBase)+'" fill="'+c[2]+'"/>'
   +'<rect x="'+f(x)+'" y="'+f(yT)+'" width="'+f(bw)+'" height="'+f(h)+'" fill="'+c[0]+'"/>'
   +'<polygon points="'+f(x)+','+f(yT)+' '+f(x+dx)+','+f(yT+dy)+' '+f(x+bw+dx)+','+f(yT+dy)+' '+f(x+bw)+','+f(yT)+'" fill="'+c[1]+'"/>'}
 let pm=-1;
 for(let i=0;i<n;i++){const d=addD(w[i].ws,3),m=d.getMonth();if(m!==pm){if(pm!==-1||i>1)s+='<text x="'+f(X(i)+bw/2)+'" y="'+f(yb(i)+14)+'" text-anchor="middle" font-size="8.6" fill="rgba(255,255,255,.78)">'+MON3[m]+'</text>';pm=m}}
 s+='</svg>';
 const hv=w[hi],h=Math.max(1.6,val(hv)/mx*HM),ax=X(hi)+bw/2,ay=yb(hi)-h+dy;
 const ws=hv.ws.toLocaleDateString('de-DE',{day:'numeric',month:'short'});
 const tip=sel>=0?'<b>Woche ab '+ws+'</b><br><b>'+dec(hv.km,1)+' km</b> gelaufen'+(hv.ld>0?'<br><b>'+nf(hv.ld)+'</b> Belastungspunkte':'')+'<br>'+hv.n+(hv.n==1?' Lauf':' Läufe')+(hv.longest>0?' · längster '+dec(hv.longest,1)+' km':''):'<b>'+(mode=='ld'?nf(hv.ld)+' Punkte':dec(hv.km,1)+' km')+'</b><br>Woche ab '+ws;
 const lp=Math.max(17,Math.min(83,ax/W*100));
 return s+'<div class="y3t'+(sel>=0?'':' pk')+'" style="left:'+lp.toFixed(1)+'%;top:'+(ay/H*100).toFixed(1)+'%">'+tip+'</div>'}
function yearCard(){
 const w=weekData(),tot=w.reduce((a,x)=>({km:a.km+x.km,n:a.n+x.n,sec:a.sec+x.sec,el:a.el+x.el,ld:a.ld+x.ld}),{km:0,n:0,sec:0,el:0,ld:0});
 if(!tot.n)return'';
 const hasLd=tot.ld>0,mode=hasLd?YRM:'km';
 Y3={w,mode,sel:-1};
 const big=mode=='ld'?nf(tot.ld):nf(tot.km),unit=mode=='ld'?'Punkte':'km';
 const tg=hasLd?'<div class="y3tg"><button type="button" class="'+(mode=='km'?'on':'')+'" data-ym="km">Kilometer</button><button type="button" class="'+(mode=='ld'?'on':'')+'" data-ym="ld">Belastung</button></div>':'';
 const mo=monthData(),ms=[];
 for(let i=11;i>=0;i--){const d=new Date(today.getFullYear(),today.getMonth()-i,1),k=d.getFullYear()+'-'+pad(d.getMonth()+1);ms.push({k,l:MON3[d.getMonth()],o:mo[k]||{km:0,n:0,sec:0,el:0,ld:0,longest:0}})}
 const best=ms.reduce((a,x)=>x.o.km>a.o.km?x:a,ms[0]),lg=ms.reduce((a,x)=>x.o.longest>a.o.longest?x:a,ms[0]);
 const Wl=S.well||{},ks=Object.keys(Wl).filter(k=>Wl[k].ctl!=null).sort(),lw=ks.length?Wl[ks[ks.length-1]]:null;
 const tl=(v,l)=>'<div class="tl"><b>'+v+'</b><span>'+l+'</span></div>';
 const full=!S.yr&&ICU.key;
 return'<div class="card y3c"><div class="y3h"><div class="y3k">Dein Jahr · 52 Wochen'+inf('year')+'</div>'+tg+'</div><div class="y3big">'+big+'<small>'+unit+'</small></div><div class="y3sub">'+tot.n+' Läufe · '+Math.round(tot.sec/3600)+' Stunden'+(tot.el?' · '+nf(tot.el)+' Höhenmeter':'')+'</div><div class="y3" id="y3">'+y3html()+'</div></div>'
  +'<div class="card yr"><div class="tiles">'+tl(best.l+' · '+Math.round(best.o.km)+' km','stärkster Monat')+tl(lg.o.longest?dec(lg.o.longest,1)+' km':'–','längster Lauf'+(lg.o.longest?' ('+lg.l+')':''))+tl(nf(tot.km/52)+' km','Ø pro Woche')+'</div>'
  +(lw?'<div class="tiles">'+tl(Math.round(lw.ctl),'Fitness (CTL)')+tl(Math.round(lw.atl),'Ermüdung (ATL)')+tl(dsgn(Math.round(lw.ctl-lw.atl),String),'Form')+'</div>':'')
  +(full?'<small>Die Vormonate werden beim nächsten Abgleich mit Intervals.icu geladen.</small>':'')+'</div>'}
function wireYear(el){
 el.querySelectorAll('[data-ym]').forEach(b=>b.onclick=()=>{YRM=b.dataset.ym;render()});
 const box=el.querySelector('#y3');if(!box||!Y3.w.length)return;
 const n=Y3.w.length,pick=e=>{const r=box.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*340,p=(340-28-10)/n;return Math.max(0,Math.min(n-1,Math.round((x-14-2)/p)))};
 let down=false;
 const set=i=>{if(Y3.sel===i)return;Y3.sel=i;box.innerHTML=y3html()};
 box.addEventListener('pointerdown',e=>{down=true;set(pick(e))});
 box.addEventListener('pointermove',e=>{if(down||e.pointerType==='mouse')set(pick(e))});
 box.addEventListener('pointerup',()=>{down=false});
 box.addEventListener('pointerleave',()=>{down=false});
 box.addEventListener('pointercancel',()=>{down=false})}
function wireNew(el){
 el.querySelectorAll('[data-ins]').forEach(b=>b.onclick=()=>openInsight(b.dataset.ins));
 el.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>showTab(b.dataset.go));
 wireRepair(el)}
async function icuYear(base,hd,from){
 const toY=iso(addD(parse(from),-1)),m0=iso(new Date(today.getFullYear(),today.getMonth()-11,1)),w0=iso(addD(mon(today),-7*51)),fromY=m0<w0?m0:w0;
 if(fromY>=toY)return;
 if(S.yr&&S.yr.v===2&&S.yr.at===iso(today)&&S.yr.to===toY&&S.yr.from===fromY)return;
 const r=await lifecycle.fetch(base+'/activities?oldest='+fromY+'&newest='+toY,{headers:hd});
 if(!r.ok)return;
 const acts=await r.json();if(!Array.isArray(acts))return;
 const m={},w={};
 for(const a of acts){
  if(!/Run/.test(a.type||''))continue;
  const k=String(a.start_date_local||'').slice(0,7),dd=String(a.start_date_local||'').slice(0,10);if(!/^\d{4}-\d{2}$/.test(k)||dd<fromY||dd>toY)continue;
  const km=(+(a.icu_distance!=null?a.icu_distance:a.distance)||0)/1000;if(!(km>0))continue;
  const o=m[k]||(m[k]={km:0,n:0,sec:0,el:0,ld:0,longest:0});
  o.km=Math.round((o.km+km)*100)/100;o.n++;o.sec+=+(a.moving_time!=null?a.moving_time:a.elapsed_time)||0;o.el+=Math.round(+a.total_elevation_gain)||0;o.ld+=Math.round(+a.icu_training_load)||0;if(km>o.longest)o.longest=Math.round(km*100)/100;
  const wk=iso(mon(parse(dd))),q=w[wk]||(w[wk]={km:0,n:0,sec:0,el:0,ld:0,longest:0});
  q.km=Math.round((q.km+km)*100)/100;q.n++;q.sec+=+(a.moving_time!=null?a.moving_time:a.elapsed_time)||0;q.el+=Math.round(+a.total_elevation_gain)||0;q.ld+=Math.round(+a.icu_training_load)||0;if(km>q.longest)q.longest=Math.round(km*100)/100}
 S.yr={v:2,at:iso(today),from:fromY,to:toY,m,w}}

/* ===== Kennzahlen ===== */
/* ===== Dein Zustand (kompakt) ===== */
const ZT_HOME=['rhr','hrv','sleep','ctl'];
function ztile(a){const[key,name,val,unit,ar,cls,sub,vals]=a;
 return'<button type="button" class="zt '+cls+'" data-ch="'+key+'"><div class="zl">'+name+inf('t_'+key)+'</div><div class="zm"><div class="zv"><b>'+val+'</b>'+(unit?'<span>'+unit.replace(' (7 Tage)','')+'</span>':'')+'</div>'+spark(vals)+'</div>'+(ar?'<div class="za">'+ar+'</div>':'')+'<small>'+sub+'</small></button>'}
function zustandCard(R,p,course,chips,ck){
 const T=trends(R),sel=ZT_HOME.map(k=>T.find(a=>a[0]==k)).filter(Boolean);
 const bad=sel.filter(a=>a[5]=='bad').length,good=sel.filter(a=>a[5]=='good').length;
 const sum=!sel.length?'Noch keine Trenddaten':bad?bad+(bad>1?' Werte':' Wert')+' beachten':good?'Alles im grünen Bereich':'Alle Werte im normalen Bereich';
 const sc=!sel.length?'neu':bad?'bad':good?'good':'neu';
 const conn=ICU.key?'':'<div class="tips">Mit Intervals.icu siehst du hier Ruhepuls, HRV, Schlaf und Fitness, und deine Läufe kommen automatisch.<div class="b"><button class="pri goicu">Intervals.icu verbinden</button></div></div>';
 const warn=R.why.slice(0,3).map(x=>'<span class="fc bad">'+x+'</span>').join('')+R.good.slice(0,1).map(x=>'<span class="fc good">'+x+'</span>').join('');
 return'<div class="card zcard"><div class="oh"><h3>Dein Zustand</h3><span class="zs '+sc+'">'+sum+'</span></div>'
  +(sel.length?'<div class="zgrid">'+sel.map(ztile).join('')+'</div>':'<div class="mu" style="margin:6px 0">Noch keine Trenddaten.</div>')+conn
  +(warn?'<div class="fcs">'+warn+'</div>':'')
  +(p?'<div class="ln" style="color:var(--mu);margin-top:8px">'+AD.msg+course+inf('adapt')+'</div>':'')
  +'<div class="b"><button class="rngb" id="zall">Alle Trends im Detail ›</button></div></div>'}


/* Today publishes data to React. Shared training and cloud logic stays here during migration. */
function todayMetric(R,key){
 let val='–',lab='',cls='neu',vals=[],sub='',nm=key=='vo2'?'VO₂max':'Form';
 if(key=='vo2'){const vs=wser('vo2',120);let vi=-1;for(let i=vs.length-1;i>=0;i--)if(vs[i]!=null){vi=i;break}
  if(vi>=0){const c=vs[vi];let ref=null;for(let i=Math.min(vi,vs.length-29);i>=0;i--)if(vs[i]!=null){ref=vs[i];break}
   const d=ref!=null?Math.round((c-ref)*10)/10:null;val=dec(c,1);lab='ml/kg/min';cls=d==null?'neu':d>=.5?'good':d<=-1?'bad':'neu';
   sub=d==null?'Verlauf der letzten Monate':(d>0?'▲ +':d<0?'▼ −':'● ')+dec(Math.abs(d),1)+' in 4 Wo.';vals=vs.slice(-90)}
  else sub=ICU.key?'Noch keine Daten':'Mit Intervals.icu'}
 else{const f=trends(R).find(a=>a[0]=='form');
  if(f){val=f[2];lab=f[6];cls=f[5];vals=f[7];sub='Fitness − Ermüdung'}else sub=ICU.key?'Noch keine Daten':'Mit Intervals.icu'}
 return {key,name:nm,value:val,label:lab,tone:cls,description:sub,values:vals};
}

function todayStats(p){
 const w=wtr(today),ws=mon(today),days=Math.round((parse(S.race)-today)/D),K=RD();
 let pl=0,ac=0,nx=0;
 for(let i=0;i<7;i++){const q=plan(addD(ws,i)),l=S.log[iso(addD(ws,i))],n=plan(addD(ws,7+i),1);if(q)pl+=q.km;if(l&&l.done)ac+=+l.km||0;if(n)nx+=n.km}
 const tw=Math.round((mon(parse(S.race))-mon(START))/(7*D))+1,cw=Math.max(1,Math.min(tw,Math.round((ws-mon(START))/(7*D))+1));
 const phase=S.noPlan?'Kein Plan':days<0?'Abgeschlossen':today<START?'Startet bald':ph(w);
 const detail=S.noPlan||days<0||today<START?(S.noPlan?'Im Kalender erstellen':days<0?'Neuen Plan erstellen':'Start '+dshort(iso(START))):'Woche '+cw+' von '+tw;
 const stats=[p||pl>0?{label:'Geplante Wochen-km',value:Math.round(pl)+' km',detail:Math.round(ac)+' gelaufen · nächste Woche '+Math.round(nx),info:'wkm'}:{label:'Wochen-km',value:Math.round(ac)+' km',detail:nx>0?'gelaufen · nächste Woche '+Math.round(nx)+' geplant':'gelaufen · kein Plan',info:'wk0'},
 {label:'Trainingsphase',value:phase,detail,info:'phase'}];
 if(CF().mode!='maintain'&&!S.noPlan&&K<40&&p)stats.push({label:'Renntempo',value:fp(rpace())+' /km',detail:'Ziel '+ft(GT()),info:'rpace'});
 return stats;
}
function todayRepairData(){
 const done=repliedList(),date=k=>DOW[(parse(k).getDay()+6)%7]+' '+dshort(k).slice(0,5);
 if(done.length){
  const rows=done.flatMap(k=>{const p=plan(parse(k),1);return p&&p.rep?[{date:date(k),before:p.rep.lab+' · '+r1(p.rep.km)+' km',after:(p.t=='easy'?'Locker':p.lab)+' · '+r1(p.km)+' km'}]:[]});
  return rows.length?{applied:true,reasons:[],rows}:null;
 }
 if(S.repIgn===iso(today))return null;
 const g=repairSuggest();return g?{applied:false,reasons:g.why.slice(0,4),rows:g.items.map(x=>({date:date(x.k),before:x.p.lab+' · '+r1(x.p.km)+' km',after:x.m=='l'?'gekürzt auf '+x.to.km+' km':'locker, '+x.to.km+' km'}))}:null;
}
function todayLatestRun(){
 const runs=allRuns(),r=runs[0];
 if(!r||!(r.km>0)||r.d!==iso(today))return null;
 let kind='easy';try{kind=analyzeRun(r,rctx(runs,d=>plan(d,1),true)).kind||'easy'}catch(e){}
 return {id:String(r.id),name:r.n||'Lauf',kind:KIND[kind],color:KCOL[kind],time:'Heute'+(r.t?', '+String(r.t).slice(0,5)+' Uhr':''),km:dec(r.km,2),duration:r.sec?dur(r.sec):null,pace:r.sec>0&&r.km>0?fp(r.sec/r.km)+' /km':null};
}
function publishToday(){
 const p=plan(today),R=readiness(),adj=p?adjust(p,R):{mode:'plan',km:0,title:null,note:''};
 let course='';const m=progn()[42.195];
 if(m&&p&&CF().mode!='maintain'&&RD()>=40){const diff=m.sec-expP(today)*42.195;course=diff<=0?' Prognose liegt '+fp(-diff)+' min vor dem Plan-Verlauf.':' Prognose liegt '+fp(diff)+' min hinter dem Plan-Verlauf'+(diff>600?' – ein Zwischenziel (z. B. 2:50) wäre realistischer':'')+'.'}
 const trendData=trends(R),selected=ZT_HOME.map(key=>trendData.find(a=>a[0]===key)).filter(Boolean);
 const strength=p&&p.kr?{session:p.kr,sets:p.krs||3,name:KSD[p.kr],exercises:KSES[p.kr].e.map(id=>({name:EX[id].n,repetitions:krSets(id,p.krs||3)+' × '+EX[id].r}))}:null;
 const requests=pendingForMe().map(r=>({id:r.from,cloud:false,name:uname(r.from),description:'möchte dein Coach sein und deine Trainingsdaten sehen: Läufe, Ruhepuls, HRV, Schlaf und Fitness. Zugangsdaten und Notizen bleiben privat. Du kannst den Zugriff jederzeit im Profil beenden.'}))
  .concat(cloudPending().map(r=>({id:String(r.id),cloud:true,name:cname(r.coach_id),description:'möchte dein Coach sein. Dann dürfte er sehen: '+SHARE_TXT+' Die Daten liegen auf dem Server des Betreibers (Supabase). Du kannst die Freigabe jederzeit im Profil beenden, dann werden die geteilten Daten gelöscht.'})));
 onTodayChange({date:iso(today),hour:now.getHours(),name:PF().name||'',start:iso(START),noPlan:!!S.noPlan,maintain:CF().mode==='maintain',plan:p||null,adjustment:adj,readiness:R,zones:Z(today),abc:!!(p&&abcOn(p,today)),strength,log:S.log[iso(today)]||null,
 stats:todayStats(p),trends:selected.map(([key,name,value,unit,arrow,tone,description,values])=>({key,name,value,unit,arrow,tone,description,values})),metrics:[todayMetric(R,'form'),todayMetric(R,'vo2')],adaptation:AD.msg,course,connected:!!ICU.key,factorsOpen:LS.get('moach_fx')==='1',repair:todayRepairData(),requests,latestRun:todayLatestRun(),heatmap:!!(ICU.key&&hmRuns().length)});
}

/* ===== Diagramme & Trends ===== */
const DAYMS=864e5,ts=s=>Date.parse(s+'T00:00:00Z'),tsl=t=>{const d=new Date(t);return pad(d.getUTCDate())+'.'+pad(d.getUTCMonth()+1)+'.'};
const CH={
 rhr:{t:'Ruhepuls',u:'bpm',f:v=>Math.round(v),sub:'Pro Tag · Intervals.icu'},
 hrv:{t:'HRV',u:'ms',f:v=>Math.round(v),sub:'Pro Tag · Intervals.icu'},
 sleep:{t:'Schlaf',u:'h',f:v=>dec(v,1),sub:'Pro Nacht · Intervals.icu'},
 ctl:{t:'Fitness (CTL)',u:'',f:v=>Math.round(v),sub:'Pro Tag · Intervals.icu'},
 form:{t:'Form (CTL − ATL)',u:'',f:v=>Math.round(v),sub:'Pro Tag · Intervals.icu'},
 vo2:{t:'VO₂max',u:'',f:v=>dec(v,1),sub:'Pro Tag · Intervals.icu'},
 km:{t:'Wochenumfang',u:'km',f:v=>Math.round(v),sub:'Kilometer pro Woche (Mo–So)'},
 pace:{t:'Lauftempo',u:'/km',f:v=>fp(v),inv:true,sub:'Ø Pace pro Lauf (ab 3 km)'},
 hr:{t:'Ø Puls im Lauf',u:'bpm',f:v=>Math.round(v),sub:'Pro Lauf · Intervals.icu'},
 rpe:{t:'Anstrengung (RPE)',u:'',f:v=>dec(v,1),sub:'Pro Lauf · 1–10'}};
function series(key){
 const W=S.well||{},m=CH[key],o=[];
 const wl=g=>Object.keys(W).sort().forEach(k=>{const v=g(W[k]);if(v!=null&&isFinite(v))o.push({d:k,t:ts(k),v})});
 if(key=='rhr')wl(x=>x.rhr>0?x.rhr:null);
 else if(key=='hrv')wl(x=>x.hrv>0?x.hrv:null);
 else if(key=='sleep')wl(x=>x.sleep>0?x.sleep:null);
 else if(key=='ctl')wl(x=>x.ctl!=null?x.ctl:null);
 else if(key=='form')wl(x=>x.ctl!=null&&x.atl!=null?x.ctl-x.atl:null);
 else if(key=='vo2')wl(x=>x.vo2>0?x.vo2:null);
 else if(key=='km'){let started=false;for(let i=25;i>=0;i--){const ws=addD(mon(today),-7*i);let t=0;for(let j=0;j<7;j++){const l=S.log[iso(addD(ws,j))];if(l&&l.done)t+=+l.km||0}
   if(t>0)started=true;if(started)o.push({d:iso(ws),t:ts(iso(ws))+3.5*DAYMS,v:t})}}
 else{const R=allRuns().slice().reverse();
  for(const r of R){let v=null;
   if(key=='pace'){if(r.km>=3&&r.sec>0)v=r.sec/r.km}
   else if(key=='hr'){if(r.hr>0)v=r.hr}
   else if(key=='rpe'){if(r.rpe>0)v=r.rpe}
   if(v!=null)o.push({d:r.d,t:ts(r.d)+(o.length&&o[o.length-1].d==r.d?DAYMS*.3:0),v})}}
 return o}
function trendText(key,pts){
 const m=CH[key],mn=a=>a.length?a.reduce((s,p)=>s+p.v,0)/a.length:null;
 let last,prev,win;
 if(key=='km'){const f=pts.filter(p=>p.d<iso(mon(today)));last=f.slice(-2);prev=f.slice(-6,-2);win='letzten 2 Wochen';if(last.length<2||prev.length<2)return{t:'Noch zu wenig volle Wochen für einen Trend.',c:'neu'}}
 else if(key=='pace'||key=='hr'||key=='rpe'){last=pts.slice(-3);prev=pts.slice(-8,-3);win='letzten '+last.length+' Läufen';if(last.length<3||prev.length<2)return{t:'Noch zu wenige Läufe für einen Trend.',c:'neu'}}
 else{const a=iso(addD(today,-6)),b=iso(addD(today,-27));last=pts.filter(p=>p.d>=a);prev=pts.filter(p=>p.d<a&&p.d>=b);win='letzten 7 Tagen';if(last.length<2||prev.length<3)return{t:'Noch zu wenige Tage mit Daten für einen Trend.',c:'neu'}}
 const A=mn(last),B=mn(prev),d=A-B,pc=B?d/Math.abs(B)*100:0;
 const thr={rhr:1.5,hrv:null,sleep:.2,ctl:1.5,form:4,vo2:.5,km:null,pace:4,hr:2,rpe:.4}[key];
 const flat=key=='hrv'?Math.abs(pc)<5:key=='km'?Math.abs(pc)<10:Math.abs(d)<thr,up=!flat&&d>0,dn=!flat&&d<0;
 const ab=Math.abs(d),amt=key=='pace'?Math.round(ab)+' s/km':key=='km'?Math.round(ab)+' km':key=='sleep'?dec(ab,1)+' h':key=='rpe'?dec(ab,1):Math.round(ab)+(m.u?' '+m.u:'');
 const cmp=key=='pace'?(dn?'schneller':'langsamer'):(dn?'niedriger':'höher');
 let s='Ø '+m.f(A)+(m.u?' '+m.u:'')+' in den '+win+', '+(flat?'praktisch unverändert gegenüber davor (Ø '+m.f(B)+').':amt+' '+cmp+' als davor (Ø '+m.f(B)+').'),c='neu';
 const T={
  rhr:()=>up?(c='bad','Ein steigender Ruhepuls deutet oft auf Ermüdung, Stress oder eine beginnende Erkältung hin. Plane die nächsten Tage lockerer.'):dn?(c='good','Ein fallender Ruhepuls spricht für gute Anpassung und Erholung.'):'Stabil, das ist kein Warnsignal.',
  hrv:()=>up?(c='good','Eine höhere HRV spricht für gute Erholung. Du verträgst die Belastung derzeit gut.'):dn?(c='bad','Eine sinkende HRV zeigt hohe Gesamtbelastung. Achte auf Schlaf und halte lockere Läufe wirklich locker.'):'Stabil, deine Erholung ist gleichbleibend.',
  sleep:()=>(A<7?(c='bad','Das liegt unter 7 h. Für 100+ km pro Woche sind 8 h das Ziel.'):up?(c='good','Mehr Schlaf unterstützt die Erholung.'):dn?'Etwas weniger Schlaf als zuvor, halte 8 h im Blick.':'Gleichbleibender Schlaf.'),
  ctl:()=>up?(c='good','Deine Fitness wächst: Das Training zahlt sich aus.'):dn?'Deine Fitness sinkt, weil du weniger trainierst als zuvor. In Entlastungswochen ist das normal.':'Deine Fitness bleibt stabil.',
  vo2:()=>up?(c='good','Deine geschätzte Ausdauerleistung steigt, das Training zahlt sich aus.'):dn?'Der Schätzwert ist etwas gesunken. Das schwankt mit Wetter, Pace und Gerät; wichtig ist der Trend über Wochen.':'Dein VO₂max ist stabil.',
  form:()=>{const x=pts[pts.length-1].v;return x>5?'Aktuell bist du frisch (Form '+Math.round(x)+'), gut für Tests und Wettkämpfe.':x>=-10?'Aktuell neutral (Form '+Math.round(x)+').':x>=-30?'Aktuell produktiv ermüdet (Form '+Math.round(x)+'), das ist im Aufbau normal.':(c='bad','Aktuell hohe Ermüdung (Form '+Math.round(x)+'). Plane eine Entlastung ein.')},
  km:()=>pc>30?(c='bad','Das ist eine schnelle Steigerung. Vorsicht, das Verletzungsrisiko steigt. Bleibe bei etwa +10 % pro Woche.'):pc<-30?'Deutlich weniger als zuvor, passt zu einer Entlastungswoche.':'Gleichmäßiger Umfang.',
  pace:()=>dn?(c='good','Du läufst im Schnitt schneller. Beachte, dass sich lockere und harte Läufe mischen.'):up?'Du läufst im Schnitt langsamer. Bei lockeren Läufen ist das gewollt, sonst kann es Ermüdung zeigen.':'Dein Tempo ist stabil.',
  hr:()=>up?'Dein Puls pro Lauf steigt. Prüfe, ob du schneller läufst, oder ob Ermüdung oder Hitze eine Rolle spielen.':dn?'Dein Puls pro Lauf sinkt. Das passt zu besserer Ausdauer, wenn das Tempo gleich bleibt.':'Dein Puls ist stabil.',
  rpe:()=>up?(c='bad','Deine Läufe fühlen sich härter an. Prüfe Schlaf und Erholung.'):dn?(c='good','Deine Läufe fühlen sich leichter an.'):'Das Anstrengungsgefühl ist stabil.'};
 const extra=key=='km'?(()=>{const cur=pts.find(p=>p.d==iso(mon(today)));return cur?' Diese Woche bisher: '+Math.round(cur.v)+' km.':''})():'';
 const e=T[key]();
 return{t:s+' '+e+extra,c}}
function openChart(key){
 const m=CH[key],pts=series(key),cm=$('#cm');
 cm.hidden=false;document.body.classList.add('noscroll');
 const tr=pts.length?trendText(key,pts):{t:'Noch keine Daten vorhanden. Synchronisiere Intervals.icu.',c:'neu'};
 cm.innerHTML='<div class="cbox"><div class="ch"><div><h3>'+m.t+inf('t_'+key)+'</h3><small>'+m.sub+'</small></div><button id="cx" aria-label="Schließen">✕</button></div>'
  +'<div class="ctext '+tr.c+'">'+tr.t+'</div>'
  +'<div class="cwrap"><svg id="csvg" role="img" aria-label="Diagramm '+m.t+'"></svg></div>'
  +'<div class="crng"><button data-r="7">7 T</button><button data-r="28">4 W</button><button data-r="84">12 W</button><button data-r="0">Alles</button><button data-z="in" aria-label="Hineinzoomen">＋</button><button data-z="out" aria-label="Herauszoomen">－</button></div>'
  +'<div class="cst" id="cst"></div><small class="chint">Mit zwei Fingern oder Mausrad zoomen, ziehen zum Verschieben, tippen für den Wert, Doppeltippen setzt zurück.</small></div>';
 const close=()=>{cm.hidden=true;cm.innerHTML='';document.body.classList.remove('noscroll')};
 $('#cx').onclick=close;cm.onclick=e=>{if(e.target===cm)close()};
 const svg=$('#csvg');
 if(!pts.length){svg.outerHTML='<div class="mu" style="padding:30px 0;text-align:center">Keine Daten</div>';$('#cst').innerHTML='';return}
 const H=300,L=46,R=14,T=14,B=28,pad0=(m.bar?3.5:.6)*DAYMS;
 const f0=pts[0].t-pad0,f1=Math.max(pts[pts.length-1].t+pad0,f0+14*DAYMS),FS=f1-f0,MINS=Math.min(FS,(m.bar?14:3)*DAYMS);
 let v0,v1,sel=-1;
 const setView=(a,b)=>{const sp=Math.max(MINS,Math.min(FS,b-a));if(a<f0)a=f0;if(a+sp>f1)a=f1-sp;v0=a;v1=a+sp};
 const preset=n=>{if(!n)return setView(f0,f1);const e=Math.max(pts[pts.length-1].t+pad0,ts(iso(today))+pad0);setView(e-n*DAYMS,e)};
 const isDaily=!(m.bar||key=='km'||key=='pace'||key=='hr'||key=='rpe');
 preset(isDaily?28:84);
 const geo=()=>{const W=svg.clientWidth||340;return{W,pw:W-L-R,ph:H-T-B}};
 function draw(){
  const{W,pw,ph}=geo();svg.setAttribute('viewBox','0 0 '+W+' '+H);svg.setAttribute('height',H);
  const vp=pts.filter(p=>p.t>=v0&&p.t<=v1),base=vp.length?vp:pts;
  let lo=Math.min(...base.map(p=>p.v)),hi=Math.max(...base.map(p=>p.v));
  if(m.bar)lo=0;if(hi-lo<1e-6){hi+=1;lo-=m.bar?0:1}
  const pd=(hi-lo)*.12;if(!m.bar)lo-=pd;hi+=pd;
  const X=t=>L+(t-v0)/(v1-v0)*pw,Y=v=>m.inv?T+(v-lo)/(hi-lo)*ph:T+ph-(v-lo)/(hi-lo)*ph;
  const fy=v=>(!m.bar&&hi-lo<6&&String(m.f(1.5)).indexOf(',')<0&&m.f(1.5)!=='1,5'&&!/:/.test(m.f(70))?dec(v,1):m.f(v));
  let g='<defs><clipPath id="cp"><rect x="'+L+'" y="'+T+'" width="'+pw+'" height="'+ph+'"/></clipPath></defs>';
  for(let i=0;i<=4;i++){const v=lo+(hi-lo)*i/4,y=Y(v);g+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y.toFixed(1)+'" y2="'+y.toFixed(1)+'" class="gl"/><text x="'+(L-6)+'" y="'+(y+4).toFixed(1)+'" text-anchor="end" class="ax">'+fy(v)+'</text>'}
  const long=(v1-v0)>200*DAYMS;
  for(let i=0;i<=4;i++){const t=v0+(v1-v0)*i/4,x=X(t);g+='<text x="'+x.toFixed(1)+'" y="'+(H-8)+'" text-anchor="'+(i==0?'start':i==4?'end':'middle')+'" class="ax">'+(long?new Date(t).toLocaleDateString('de-DE',{month:'short',year:'2-digit',timeZone:'UTC'}):tsl(t))+'</text>'}
  g+='<g clip-path="url(#cp)">';
  if(m.bar){const bw=Math.max(3,Math.min(40,7*DAYMS/(v1-v0)*pw*.7)),y0=Y(0);pts.forEach((p,i)=>{const x=X(p.t),y=Y(p.v);g+='<rect x="'+(x-bw/2).toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+Math.max(1,y0-y).toFixed(1)+'" rx="3" class="bar'+(i==sel?' sel':'')+'"/>'})}
  else{g+='<polyline points="'+pts.map(p=>X(p.t).toFixed(1)+','+Y(p.v).toFixed(1)).join(' ')+'" fill="none" class="ln2"/>';
   if(vp.length<=45)pts.forEach((p,i)=>{g+='<circle cx="'+X(p.t).toFixed(1)+'" cy="'+Y(p.v).toFixed(1)+'" r="'+(i==sel?5.5:3)+'" class="pt'+(i==sel?' sel':'')+'"/>'})}
  g+='</g>';
  if(sel>=0&&pts[sel]){const p=pts[sel],x=X(p.t),y=Y(p.v);
   if(x>=L&&x<=W-R){const lab=(m.bar?'Woche ab ':'')+dshort(p.d)+' · '+m.f(p.v)+(m.u?' '+m.u:''),w2=lab.length*6.4+14,bx=Math.min(Math.max(L,x-w2/2),W-R-w2);
    g+='<line x1="'+x.toFixed(1)+'" x2="'+x.toFixed(1)+'" y1="'+T+'" y2="'+(T+ph)+'" class="gd"/><g><rect x="'+bx.toFixed(1)+'" y="'+(T+2)+'" width="'+w2.toFixed(1)+'" height="22" rx="7" class="tipb"/><text x="'+(bx+w2/2).toFixed(1)+'" y="'+(T+17)+'" text-anchor="middle" class="tipt">'+lab+'</text></g>'}}
  svg.innerHTML=g;
  const vv=vp.map(p=>p.v),cur=pts[pts.length-1],avg=vv.length?vv.reduce((a,b)=>a+b,0)/vv.length:null;
  const tl=(l,v)=>'<div class="tl"><b>'+v+'</b><span>'+l+'</span></div>',fm=v=>v==null?'–':m.f(v)+(m.u&&m.u!='/km'?' '+m.u:'')+(m.u=='/km'?' /km':'');
  $('#cst').innerHTML=tl('Aktuell ('+dshort(cur.d)+')',fm(cur.v))+tl('Ø sichtbar',fm(avg))+tl(m.inv?'Schnellster':'Niedrigster',vv.length?fm(Math.min(...vv)):'–')+tl(m.inv?'Langsamster':'Höchster',vv.length?fm(Math.max(...vv)):'–')+'<div class="tl"><b>'+vp.length+'</b><span>Werte sichtbar</span></div><div class="tl"><b>'+tsl(v0)+'–'+tsl(v1)+'</b><span>Zeitraum</span></div>'}
 const zoom=(f,cf)=>{const sp=v1-v0,c=v0+sp*cf,ns=Math.max(MINS,Math.min(FS,sp*f));setView(c-ns*cf,c-ns*cf+ns);draw()};
 const P=new Map();let pan=null,pin=null,moved=0;
 const frac=cx=>{const rc=svg.getBoundingClientRect();return Math.min(1,Math.max(0,(cx-rc.left-L)/(rc.width-L-R)))};
 svg.onpointerdown=e=>{try{svg.setPointerCapture(e.pointerId)}catch(x){}P.set(e.pointerId,{x:e.clientX});moved=0;
  if(P.size==1)pan={x:e.clientX,a:v0,b:v1};
  else if(P.size==2){const q=[...P.values()];pin={d:Math.abs(q[0].x-q[1].x)||1,a:v0,b:v1,c:(q[0].x+q[1].x)/2};pan=null}};
 svg.onpointermove=e=>{const q=P.get(e.pointerId);if(!q)return;q.x=e.clientX;const rc=svg.getBoundingClientRect(),pw=rc.width-L-R;
  if(P.size==2&&pin){const a=[...P.values()],d=Math.abs(a[0].x-a[1].x)||1,sp=(pin.b-pin.a),ns=Math.max(MINS,Math.min(FS,sp*pin.d/d)),cf=Math.min(1,Math.max(0,(pin.c-rc.left-L)/pw)),c=pin.a+sp*cf;moved=99;setView(c-ns*cf,c-ns*cf+ns);draw()}
  else if(pan){const dx=pan.x-e.clientX;moved+=Math.abs(dx-(pan.last||0));pan.last=dx;const dt=dx/pw*(pan.b-pan.a);setView(pan.a+dt,pan.b+dt);draw()}};
 const up=e=>{if(!P.has(e.pointerId))return;
  if(P.size==1&&moved<8){const t=v0+frac(e.clientX)*(v1-v0);let bi=-1,bd=1e18;pts.forEach((p,i)=>{const d=Math.abs(p.t-t);if(d<bd){bd=d;bi=i}});sel=bi==sel?-1:bi;}
  P.delete(e.pointerId);pin=null;
  if(P.size==1){const r=[...P.values()][0];pan={x:r.x,a:v0,b:v1};moved=99}else pan=null;draw()};
 svg.onpointerup=up;svg.onpointercancel=up;
 svg.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY>0?1.25:.8,frac(e.clientX))},{passive:false});
 svg.ondblclick=()=>{preset(isDaily?28:84);sel=-1;draw()};
 cm.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{preset(+b.dataset.r);draw()});
 cm.querySelectorAll('[data-z]').forEach(b=>b.onclick=()=>zoom(b.dataset.z=='in'?.6:1.6,.5));
 draw();
 window.onresize=()=>{if(!cm.hidden&&$('#csvg'))draw()}}
lifecycle.listen(document,'keydown',e=>{if(e.key=='Escape'){const im=$('#im');if(im&&!im.hidden){im.hidden=true;return}const c=$('#cx');if(c)c.click()}});

/* ===== Läufe ===== */
let RUNMAX=30;
function allRuns(){
 const R=(S.runs||[]).map(x=>Object.assign({},x)),have=new Set(R.map(r=>r.d));
 for(const k in S.log){const l=S.log[k];if(l&&l.done&&!have.has(k)&&+l.km>0)R.push({id:'m'+k,d:k,t:'',n:'Manueller Eintrag',km:+l.km,sec:(+l.min||0)*60,rpe:+l.rpe||0,manual:true})}
 R.sort((a,b)=>(b.d+(b.t||''))<(a.d+(a.t||''))?-1:1);return R}
const dur=s=>s>=3600?ft(s):fp(s);
/* ===== Anmeldung ===== */
const idHeaders=k=>({Authorization:'Basic '+btoa('API_KEY:'+k)});
let AUM='in';
const AUTH_TXT='Ich stimme zu, dass M.oach meinen Namen, meine E-Mail-Adresse und mein Backup (Plan, Läufe, Wellness-Daten) auf dem Supabase-Server des Betreibers speichert. Ein Coach sieht nur etwas, wenn ich es ausdrücklich bestätige. Mein Intervals.icu-Zugang wird nur verschlüsselt gespeichert; der Schlüssel dafür entsteht aus meinem Passwort, der Betreiber kann ihn nicht lesen.';
async function authNewKey(pw){if(!HASC)return null;const s0=B64(crypto.getRandomValues(new Uint8Array(16)));return{s:s0,k:await icuDerive(pw,s0)}}
function showAuth(info){
 const a=$('#auth');a.hidden=false;document.body.classList.add('noscroll');
 const lg=document.querySelector('.logo').outerHTML.replace('class="logo"','class="logo big"');
 const up=AUM=='up';
 const tabs='<div class="atabs"><button type="button" class="'+(up?'':'on')+'" data-am="in">Anmelden</button><button type="button" class="'+(up?'on':'')+'" data-am="up">Registrieren</button></div>';
 let body;
 if(!sbOn())body='<div class="card"><h3>Cloud nicht eingerichtet</h3><div class="sub">Die Anmeldung läuft über das M.oach-Cloud-Konto. Trage dafür einmalig die Projekt-URL und den Publishable-Schlüssel des Betreibers ein (siehe supabase/ANLEITUNG.md).</div><div class="f"><label>Projekt-URL<input id="sbu" placeholder="https://abcd.supabase.co" autocomplete="off"></label><label>Anon-Schlüssel<input id="sbk" type="password" autocomplete="off" placeholder="sb_publishable_…"></label></div><div id="aerr" class="aerr" hidden></div><div class="b"><button class="pri" id="sbs">Speichern</button></div></div>';
 else if(!up)body='<div class="card"><h3>Willkommen zurück</h3><div class="sub">Melde dich mit deinem M.oach-Cloud-Konto an. Dein Stand und dein Intervals.icu-Zugang werden auf dieses Gerät geladen.</div>'+(info?'<div class="an a-g">'+info+'</div>':'')
  +'<div class="f"><label>E-Mail<input id="aue" type="email" autocomplete="email" inputmode="email"></label><label>Passwort<input id="aup" type="password" autocomplete="current-password"></label></div><div id="aerr" class="aerr" hidden></div><div class="b"><button class="pri" id="aug" style="width:100%;padding:12px">Anmelden</button></div><div class="b"><button id="auf">Passwort vergessen?</button></div></div>';
 else body='<div class="card"><h3>Neues Konto</h3><div class="sub">Dein Konto liegt in der Cloud, so bist du auf jedem Gerät sofort angemeldet. Rennen und Ziel legst du später bei der Planerstellung fest.</div>'
  +'<div class="f" style="grid-template-columns:1fr"><label>Name<input id="an" autocomplete="given-name" placeholder="z. B. Lukas"></label><label>E-Mail<input id="aue" type="email" autocomplete="email" inputmode="email"></label><label>Passwort<input id="aup" type="password" autocomplete="new-password" placeholder="mind. 8 Zeichen"></label></div>'
  +'<div class="sub" style="margin-top:8px">Intervals.icu</div><div class="f"><label>Athlete-ID (optional)<input id="ai" placeholder="leer = eigenes Konto"></label><label>API-Schlüssel<input id="ak" type="password" autocomplete="off"></label></div>'
  +'<label class="ck"><input type="checkbox" id="aco"><span>'+AUTH_TXT+'</span></label>'
  +'<div id="aerr" class="aerr" hidden></div><div class="b"><button class="pri" id="ago" style="width:100%;padding:12px">Konto erstellen &amp; loslegen</button></div>'
  +'<p class="mu" style="font-size:.8rem">Den API-Schlüssel findest du in Intervals.icu unter Einstellungen → „Developer Settings“.</p></div>';
 a.innerHTML='<div class="abox"><div class="ahd">'+lg+'<div>Dein Marathon-Coach</div></div>'+(sbOn()?tabs:'')+body+'</div>';
 a.querySelectorAll('[data-am]').forEach(b=>b.onclick=()=>{AUM=b.dataset.am;showAuth()});
 const err=m=>{const e=$('#aerr');if(!e)return;e.textContent=m;e.hidden=!m};
 const sbs=$('#sbs');
 if(sbs)sbs.onclick=()=>{const u=sbNorm($('#sbu').value),k=($('#sbk').value||'').trim();
  if(!u||k.length<=20)return err('Bitte gib eine Adresse wie https://abcd.supabase.co und den Publishable-Schlüssel ein.');
  if(/^sb_secret_/.test(k))return err('Das ist ein geheimer Schlüssel (secret). Bitte nimm den Publishable Key (sb_publishable_…).');
  LS.set('moach_sb',JSON.stringify({url:u,key:k}));location.reload()};
 const af=$('#auf');
 if(af)af.onclick=async()=>{const ok=await cloudRun(af,()=>cloudRecover($('#aue').value),$('#aerr'));if(ok){const e=$('#aerr');e.textContent='Wenn die Adresse registriert ist, haben wir dir einen Link zum Zurücksetzen geschickt.';e.hidden=false}};
 const ag=$('#aug');
 if(ag)ag.onclick=async()=>{err('');const em=($('#aue').value||'').trim(),pw=$('#aup').value||'';
  if(!em||!pw)return err('Bitte E-Mail und Passwort eingeben.');
  ag.disabled=true;
  try{
   const j=await sbCall('/auth/v1/token?grant_type=password',{m:'POST',b:{email:em,password:pw}}),ses=sbFromAuth(j);
   const ex=USERS.find(u=>{try{const x=JSON.parse(LS.get('moach_sbs_'+u.id)||'null');return x&&x.uid===ses.uid}catch(_){return false}});
   if(ex){LS.set('moach_sbs_'+ex.id,JSON.stringify(ses));LS.set('moach_cur',ex.id);location.reload();return}
   let row=null,prof=null;
   try{const rr=await sbCall('/rest/v1/user_data?select=state,modified&user_id=eq.'+ses.uid,{tok:ses.at});row=rr&&rr[0]||null}catch(_){}
   try{const pr=await sbCall('/rest/v1/profiles?select=name&id=eq.'+ses.uid,{tok:ses.at});prof=pr&&pr[0]||null}catch(_){}
   const uid='u'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
   let icu0={id:'',key:''},ck0=null;
   try{const bl=row&&row.state&&row.state.icuc;if(bl&&bl.c&&HASC){const c=await icuLogin0(pw,bl);if(c){icu0=c.o;ck0=c.ck}}}catch(_){}
   let pend=null;try{pend=JSON.parse(LS.get('moach_pend')||'null')}catch(_){}
   if(!icu0.key&&pend&&pend.email===em.toLowerCase()&&pend.key){icu0={id:pend.id||'',key:pend.key};ck0=await authNewKey(pw)}
   if(pend&&pend.email===em.toLowerCase())LS.del('moach_pend');
   const nm=(row&&row.state&&row.state.prof&&row.state.prof.name)||(prof&&prof.name)||(pend&&pend.email===em.toLowerCase()&&pend.name)||em.split('@')[0];
   const st=Object.assign(DEF(),row?row.state:{start:iso(mon(today)),prof:{name:nm},noPlan:true});if(!st.prof)st.prof={};if(!st.prof.name)st.prof.name=nm;delete st.coach;if(row)st._m=+row.modified||0;
   LS.set('mplan2_'+uid,JSON.stringify(st));LS.set('mplan_icu_'+uid,JSON.stringify(icu0));if(ck0)LS.set('moach_ck_'+uid,JSON.stringify(ck0));LS.set('moach_sbs_'+uid,JSON.stringify(ses));
   USERS.push({id:uid,name:nm});LS.set('moach_users',JSON.stringify(USERS));LS.set('moach_cur',uid);location.reload()
  }catch(x){err(x.message);ag.disabled=false}};
 const go=$('#ago');
 if(go)go.onclick=async()=>{
  err('');const nm=$('#an').value.trim(),em=($('#aue').value||'').trim(),pw=$('#aup').value||'',key=$('#ak').value.trim(),id=$('#ai').value.trim();
  if(!nm)return err('Bitte gib einen Namen ein.');
  if(!em)return err('Bitte gib deine E-Mail-Adresse ein.');
  if(pw.length<8)return err('Das Passwort braucht mindestens 8 Zeichen.');
  if(!key)return err('Bitte gib deinen Intervals.icu API-Schlüssel ein.');
  if(!$('#aco').checked)return err('Bitte stimme der Speicherung in der Cloud zu.');
  const btn=go;btn.disabled=true;btn.textContent='Prüfe Zugang…';
  try{
   let r;try{r=await lifecycle.fetch('https://intervals.icu/api/v1/athlete/'+encodeURIComponent(id||'0'),{headers:idHeaders(key)})}catch(e){throw new Error(navigator.onLine===false?'Du bist offline. Bitte verbinde dich mit dem Internet.':'Keine Verbindung zu Intervals.icu. Bitte später erneut versuchen.')}
   if(r.status==401||r.status==403)throw new Error('Zugang abgelehnt: Bitte API-Schlüssel (und ggf. Athlete-ID) prüfen.');
   if(!r.ok)throw new Error('Intervals.icu meldet Fehler '+r.status+'.');
   btn.textContent='Erstelle Konto…';
   const j=await sbCall('/auth/v1/signup',{m:'POST',b:{email:em,password:pw,data:{name:nm}}});
   if(!j||!j.access_token){LS.set('moach_pend',JSON.stringify({email:em.toLowerCase(),name:nm,id,key}));AUM='in';showAuth('Fast geschafft: Wir haben dir eine E-Mail geschickt. Bestätige die Adresse und melde dich dann hier an. Deinen Intervals.icu-Zugang habe ich vorgemerkt.');const e=$('#aue');if(e)e.value=em;return}
   const ses=sbFromAuth(j),uid='u'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),ck=await authNewKey(pw);
   const S0=Object.assign(DEF(),{start:iso(mon(today)),noPlan:true,prof:{name:nm}});
   LS.set('mplan2_'+uid,JSON.stringify(S0));LS.set('mplan_icu_'+uid,JSON.stringify({id,key}));if(ck)LS.set('moach_ck_'+uid,JSON.stringify(ck));LS.set('moach_sbs_'+uid,JSON.stringify(ses));
   USERS.push({id:uid,name:nm});LS.set('moach_users',JSON.stringify(USERS));LS.set('moach_cur',uid);location.reload();
  }catch(e){err(e.message);btn.disabled=false;btn.textContent='Konto erstellen & loslegen'}}}

/* ===== Plan-Assistent ===== */
const WDL=['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];
const DISTS=[[42.195,'Marathon'],[21.0975,'Halbmarathon'],[10,'10 km'],[5,'5 km']];
const clampN=(x,l,h)=>Math.max(l,Math.min(h,x));
function buildCfg(a){
 const N=clampN(Math.round(+a.tp)||3,1,4),mt=a.type=='maintain',sd=parse(a.start),ed=mt?addD(mon(sd),a.weeks*7-1):parse(a.race);
 const tw=Math.round((mon(ed)-mon(sd))/(7*D));
 const rest=a.rest,lg=a.lg,roles=Array(7).fill('rest');
 for(let i=0;i<7;i++)if(!rest.includes(i))roles[i]='easy';
 roles[lg]='long';
 const seq=[];for(let k=1;k<7;k++){const d=(lg+k)%7;if(roles[d]!='rest')seq.push({d,k})}
 let sdy=null;
 if(seq.length>=3){sdy=seq.find(x=>x.k==5)||seq[seq.length-1];roles[sdy.d]='str'}
 const cand=seq.filter(x=>x.k!=1&&(!sdy||x.d!=sdy.d));
 const q1=cand[0];if(q1){roles[q1.d]='q1';const q2=cand.find(x=>x.k>=q1.k+2);if(q2)roles[q2.d]='q2'}
 if(mt){const i2=roles.indexOf('q2');if(a.q<2&&i2>=0)roles[i2]='easy';const i1=roles.indexOf('q1');if(a.q<1&&i1>=0)roles[i1]='easy'}
 const raw={easy:.19,str:.16,q1:.22,q2:.22},W=roles.map(r=>raw[r]||0),sm=W.reduce((x,y)=>x+y,0)||1;
 const strD=seq.filter(x=>x.k!=1&&(roles[x.d]=='easy'||roles[x.d]=='str')).slice(0,a.str).map(x=>x.d);
 const cap=a.cap,tl=TP[N-1].tl.map(f=>Math.round(cap*f)),Wn=W.map(x=>x/sm);
 if(mt)return{tw,T:[tw+1,0,0,0,0],S:0,A:[[tw,a.cur]],cap,ls:clampN(cap/a.cur,.25,.4),tl,roles,W:Wn,strD,test:-1,recov:-1,first:999,fw:[],mul:false,mode:'maintain'};
 let S0=clampN(Math.round(tw*.265),6,13),T4=N+S0,T3=T4+4,n=tw-T3+1;
 const test=tw>=24&&n>=8;let T,Sx;
 if(test){const m=n-1,g=Math.round(m*.36),t=Math.round(m*.30),T1=tw-g+1,T2=T1-t;T=[tw+1,T1,T2,T3,T4];Sx=S0}
 else{Sx=clampN(Math.round(tw*.5),4,13);const e=N+Sx;T=[tw+1,e,e,e,e]}
 const p=a.peak,A=[[Math.max(tw,N+1),a.cur],[N,p]].concat(Array.from({length:N-1},(_,i)=>[N-1-i,Math.round(p*TP[N-1].f[N-2-i])]),[[0,Math.round(p*.375)]]);
 return{tw,T,S:Sx,A,cap,ls:clampN(cap/p,.25,.4),tl,roles,W:Wn,strD,test:test?T3:-1,recov:test?T3-1:-1,first:999,fw:[],mul:true,tp:N,tv:2}}
function withPlan(tmp,fn){
 const K=['race','goal','goalT','rd','base','start','cfg','noPlan','tune'],o={};K.forEach(k=>o[k]=S[k]);o.st=START;
 S.race=tmp.race;S.goal=tmp.goal;S.goalT=tmp.goalT||null;S.rd=tmp.rd||42.195;S.base=tmp.base;S.start=tmp.start;S.cfg=tmp.cfg||null;S.tune=tmp.tune||null;S.noPlan=false;START=parse(tmp.start||'2026-10-12');
 try{return fn()}finally{K.forEach(k=>S[k]=o[k]);START=o.st}}
function wzState(a){
 const mt=a.type=='maintain',cfg=buildCfg(a),base=Math.round(((+a.rh)*3600+(+a.rm)*60+(+a.rs))*Math.pow(42.195/a.rk,1.06));
 const tn=r=>{const L=(a.tune||[]).filter(t=>t.d>=a.start&&t.d<=tuneLimit(r)).map(t=>Object.assign({},t));return L.length?tuneSort(L):null};
 if(mt){const race=iso(addD(mon(parse(a.start)),a.weeks*7-1));return{race,goal:base,goalT:null,rd:42.195,base,start:a.start,cfg,tune:tn(race)}}
 const rd=+a.rd,gT=(+a.gh)*3600+(+a.gm)*60+(+a.gs||0);
 return{race:a.race,goal:Math.round(gT*Math.pow(42.195/rd,1.06)),goalT:rd<40?gT:null,rd,base,start:a.start,cfg,tune:tn(a.race)}}
function archivePlan(newStart){
 if(S.noPlan)return;
 const old=S.start||'2026-10-12',until=iso(addD(newStart?parse(newStart):today,-1));
 if(old>until)return;
 (S.hist=S.hist||[]).push({start:old,until,race:S.race,goal:S.goal,goalT:S.goalT||null,rd:S.rd||42.195,base:S.base,cfg:S.cfg||null,tune:S.tune||null})}
const snapPlan=()=>({tune:S.tune||null,cfg:S.cfg||null,race:S.race,goal:S.goal,goalT:S.goalT||null,rd:S.rd||42.195,base:S.base,start:S.start||null,hist:JSON.parse(JSON.stringify(S.hist||[])),noPlan:!!S.noPlan});
function wzPreview(a){
 const st=wzState(a);
 return withPlan(st,()=>{
  const wk=[],ws0=mon(parse(a.start));let longest={km:0},peak={km:0},tot=0;const phs=[];
  for(let ws=ws0;ws<=parse(st.race);ws=addD(ws,7)){
   let km=0;for(let j=0;j<7;j++){const d=addD(ws,j),p=planCur(d,1);if(p){km+=p.km;if(p.t=='long'&&p.km>longest.km)longest={km:p.km,d:iso(d)}}}
   const w=wtr(ws),name=ph(w);wk.push({ws:iso(ws),km,w,ph:name,dl:deload(w)});tot+=km;if(km>peak.km)peak={km,d:iso(ws)};
   const l=phs[phs.length-1];if(l&&l.n==name)l.c++;else phs.push({n:name,c:1})}
  const first=[],ws1=addD(ws0,parse(a.start)>ws0?7:0);
  for(let j=0;j<7;j++){const d=addD(ws1,j);first.push({d:iso(d),p:planCur(d,1)})}
  return{st,wk,peak,longest,tot,phs,first,cfg:st.cfg}})}
const PCOL={Regeneration:'#94a3b8',Grundlagen:'#3b82f6',Tempoentwicklung:'#f97316','Schwelle & Test':'#ef4444','Entlastung + Basis':'#94a3b8',Marathonspezifisch:'#8b5cf6',Wettkampfspezifisch:'#8b5cf6',Tapering:'#16a34a',Erhaltung:'#0ea5e9','Ohne Plan':'#64748b'};
function wzPrevHtml(a){
 const v=wzPreview(a),mt=a.type=='maintain',tw=v.cfg.tw;
 const legend=v.phs.map(p=>'<span><i style="background:'+(PCOL[p.n]||'#999')+'"></i>'+p.n+' ('+p.c+' W)</span>').join('');
 const days=v.first.map((x,i)=>'<div class="wr" style="cursor:default"><div class="wd"><b>'+DOW[i]+'</b></div><span class="dot t-'+(x.p?x.p.t:'rest')+'"></span><div class="wt">'+(!x.p?'–':x.p.t=='rest'?'Recovery / frei':x.p.lab+(x.p.km?' · '+r1(x.p.km)+' km':''))+'</div></div>').join('');
 const warn=[];
 const gr=!mt&&a.peak>a.cur?Math.pow(a.peak/a.cur,1/Math.max(1,tw-5))-1:0;
 if(gr>.10)warn.push('Der Aufbau liegt bei etwa '+Math.round(gr*100)+' % pro Woche (Richtwert: höchstens 8–10 %). Das ist ambitioniert. Mehr Vorlauf oder ein niedrigerer Höchstumfang senken das Verletzungsrisiko.');
 if(!mt&&v.st.base>0&&(v.st.base-v.st.goal)/v.st.base>.12)warn.push('Dein Ziel ist '+Math.round((v.st.base-v.st.goal)/v.st.base*100)+' % schneller als dein aktueller Stand. Das ist sehr ambitioniert. Ein Zwischenziel macht den Plan realistischer.');
 if(!mt&&tw<8)warn.push('Bis zum Rennen bleiben nur '+tw+' Wochen. Mindestens 8 Wochen sind sinnvoll, der Plan ist entsprechend kompakt.');else if(!mt&&tw<12)warn.push('Bis zum Rennen bleiben nur '+tw+' Wochen. Der Plan ist entsprechend kompakt.');
 if(!v.cfg.roles.includes('q1'))warn.push('Mit dieser Wochenstruktur gibt es keine Tempoeinheit. Wähle weniger Ruhetage, wenn du Qualität trainieren willst.');
 const tl=(b,l)=>'<div class="tl"><b>'+b+'</b><span>'+l+'</span></div>',rpw=v.cfg.roles.filter(r=>r!='rest').length;
 return '<div class="tiles">'+tl((mt?a.weeks:tw)+' Wochen',mt?'Plandauer':'bis zum Rennen')+tl(rpw+' Läufe','pro Woche')+tl(Math.round(v.peak.km)+' km',mt?'Spitzenwoche':'Spitzenwoche ('+dshort(v.peak.d)+')')+tl(v.longest.km+' km','längster Lauf')+tl(Math.round(v.tot)+' km','Gesamtumfang')+tl(mt?fp(v.st.base/42.195)+' /km':fp((v.st.goalT||v.st.goal)/v.st.rd)+' /km',mt?'Marathon-Niveau':'Zieltempo')+'</div>'
  +'<div class="sh" style="margin-top:10px">Kilometer pro Woche</div>'+barsSvg(v.wk,340,110)+'<div class="leg">'+legend+'</div><small>Hellere Balken sind Entlastungswochen.</small>'
  +'<div class="sh" style="margin-top:12px">So sieht deine erste Woche aus</div>'+days
  +(warn.length?'<div class="aerr" style="margin-top:12px">'+warn.map(x=>'<div><b>Achtung:</b> '+x+'</div>').join('')+'</div>':'')}
function recentAvg(){let t=0;for(let i=1;i<=28;i++){const l=S.log[iso(addD(today,-i))];if(l&&l.done)t+=+l.km||0}return t>=20?Math.round(t/4/5)*5:null}
const defPeak=(rd,cur)=>Math.max(cur,Math.round(Math.min(cur*(rd>40?2:rd>20?1.7:rd>8?1.5:1.4),rd>40?120:rd>20?90:rd>8?80:70)/5)*5);
const defCap=rd=>rd>40?32:rd>20?24:rd>8?20:16;
function wzDefaults(mode){
 const nm=iso(today.getDay()==1?today:addD(mon(today),7)),ra=recentAvg(),C=CF(),maint=C.mode=='maintain';
 let a;
 if(mode=='adjust'&&S.wz){a=Object.assign({},S.wz);if(!a.gs&&a.gs!==0)a.gs=0;a.start=(a.start&&a.start>=iso(today))?a.start:nm;if(ra)a.cur=ra}
 else if(mode=='adjust'&&S.cfg){const roles=C.roles,rs=[];roles.forEach((r,i)=>{if(r=='rest')rs.push(i)});
  const g=GT();a={type:maint?'maintain':'race',rd:RD(),race:S.race,gh:Math.floor(g/3600),gm:Math.floor(g%3600/60),gs:Math.round(g%60),weeks:12,rk:42.195,rh:Math.floor(S.base/3600),rm:Math.floor(S.base%3600/60),rs:S.base%60,cur:ra||50,peak:Math.max(ra||50,Math.max(...C.A.map(x=>x[1]))),cap:C.cap,rest:rs,lg:roles.indexOf('long'),str:C.strD.length,q:roles.filter(r=>r=='q1'||r=='q2').length,start:nm}}
 else if(mode=='adjust'){a={type:'race',rd:42.195,race:S.race,gh:Math.floor(S.goal/3600),gm:Math.floor(S.goal%3600/60),gs:0,weeks:12,rk:42.195,rh:Math.floor(S.base/3600),rm:Math.floor(S.base%3600/60),rs:S.base%60,cur:ra||50,peak:120,cap:34,rest:[0],lg:6,str:2,q:2,start:nm}}
 else{const cur=ra||50,rc=parse(S.race)>today?S.race:iso(addD(mon(today),7*30+6));
  a={type:'race',rd:42.195,race:rc,gh:3,gm:15,gs:0,weeks:12,rk:10,rh:0,rm:46,rs:0,cur,peak:defPeak(42.195,cur),cap:32,rest:[0],lg:6,str:2,q:1,start:nm}}
 a.type=a.type||'race';a.rd=a.rd||42.195;a.gs=a.gs||0;a.weeks=a.weeks||12;if(a.q==null)a.q=1;a.rest=(a.rest||[0]).slice();
 if(mode=='adjust'){a.tune=(S.tune||[]).map(x=>Object.assign({},x));a.tp=clampN(TPW(),1,4)}else{a.tune=[];a.tp=defTaper(a.rd)}
 return a}
function raceHint(r){if(!r)return'';const w=Math.floor((parse(r)-today)/(7*D));if(w>=8||w<0)return'';return'<div class="whw">Bis zum Rennen sind es '+(w<=0?'weniger als eine Woche':w==1?'nur 1 Woche':'nur '+w+' Wochen')+'. Mindestens 8 Wochen Vorlauf sind sinnvoll. Du bekommst trotzdem einen Plan, er fällt entsprechend kompakt aus.</div>'}
function openWizard(mode){
 const wz=$('#wz');wz.hidden=false;document.body.classList.add('noscroll');
 const a=wzDefaults(mode||'new');let step=0;const NS=5;
 const close=()=>{wz.hidden=true;wz.innerHTML='';document.body.classList.remove('noscroll')};
 const num=(id,l,v,ex)=>'<label>'+l+'<input id="'+id+'" type="number" inputmode="decimal" value="'+esc(v)+'" '+(ex||'')+'></label>';
 const mt=()=>a.type=='maintain';
 const read=()=>{const g=id=>{const e=$('#'+id);return e?e.value:null};
  if(step==0){if(mt()){}else{a.race=g('wr')||a.race;a.gh=g('wgh');a.gm=g('wgm');a.gs=g('wgs')}}
  if(step==1){a.rk=+g('wrk');a.rh=g('wrh');a.rm=g('wrm');a.rs=g('wrs')}
  if(step==2){a.cur=+g('wc');a.peak=mt()?a.cur:+g('wp');a.cap=+g('wl')}
  if(step==3){a.lg=+g('wlg')}
  if(step==4){a.start=g('ws')||a.start}};
 const bad=()=>{
  if(step==0&&!mt()){if(!a.race||parse(a.race)<=today)return'Das Rennen muss in der Zukunft liegen.';const g=(+a.gh)*3600+(+a.gm)*60+(+a.gs),pc=g/a.rd;if(!g||pc<150||pc>540)return'Bitte gib eine realistische Zielzeit ein (Pace zwischen 2:30 und 9:00 min/km).'}
  if(step==0&&!mt()&&(a.tune||[]).some(t=>t.d>tuneLimit(a.race)))return'Ein Vorbereitungswettkampf liegt zu nah am Hauptrennen (mindestens 2 Wochen Abstand) oder danach.';
  if(step==1){const sec=(+a.rh)*3600+(+a.rm)*60+(+a.rs),pc=sec/a.rk;if(!sec||pc<150||pc>540)return'Bitte gib eine realistische Zeit für die gewählte Distanz ein (Pace zwischen 2:30 und 9:00 min/km).'}
  if(step==2){if(!(a.cur>=10&&a.cur<=200))return'Der aktuelle Wochenumfang sollte zwischen 10 und 200 km liegen.';if(!mt()&&!(a.peak>=a.cur&&a.peak<=220))return'Der Höchstumfang muss mindestens so hoch wie dein aktueller Umfang sein (max. 220 km).';if(!(a.cap>=8&&a.cap<=45))return'Der längste Lauf sollte zwischen 8 und 45 km liegen.';if(a.cap>a.peak*.5)return'Der längste Lauf darf höchstens die Hälfte deines Wochenumfangs sein (bei '+a.peak+' km also '+Math.floor(a.peak*.5)+' km).'}
  if(step==3){if(a.rest.length<1||a.rest.length>3)return'Wähle 1 bis 3 Ruhetage (so kommst du auf 4 bis 6 Läufe pro Woche).';if(a.rest.includes(a.lg))return'Der Longrun-Tag darf kein Ruhetag sein.'}
  if(step==4){if(parse(a.start)<today)return'Das Startdatum darf nicht in der Vergangenheit liegen.';if(!mt()&&parse(a.start)>parse(a.race))return'Der Start liegt nach dem Rennen. Bitte wähle ein früheres Startdatum.'}
  return''};
 const hint2=()=>{const sec=(+a.rh)*3600+(+a.rm)*60+(+a.rs);return sec>0&&a.rk>0?'≈ Marathon in <b>'+ft(sec*Math.pow(42.195/a.rk,1.06))+'</b> (Hochrechnung)':''};
 const chipRow=(items,cur,attr)=>'<div class="cr">'+items.map(x=>'<button class="chip '+(cur(x[0])?'on':'')+'" '+attr+'="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>';
 function draw(){
  const T=['Dein Ziel','Dein aktueller Stand','Dein Umfang','Deine Woche','Start & Vorschau'][step];
  let b='';
  if(step==0){
   b='<div class="sub">Wofür trainierst du?</div><div class="cr" id="wty">'+DISTS.map(x=>'<button class="chip '+(!mt()&&Math.abs(a.rd-x[0])<.01?'on':'')+'" data-ty="'+x[0]+'">'+x[1]+'</button>').join('')+'<button class="chip '+(mt()?'on':'')+'" data-ty="m">Ausdauer erhalten</button></div>';
   if(mt())b+='<div class="sub" style="margin-top:10px">Wie lange soll der Plan laufen?</div>'+chipRow([[8,'8 Wochen'],[12,'12 Wochen'],[26,'26 Wochen'],[52,'52 Wochen']],v=>a.weeks==v,'data-wk')+'<small>Du hältst deine Fitness mit gleichbleibendem Umfang, Tempoeinheiten und einer Entlastungswoche alle 4 Wochen. Ohne Rennen, ohne Druck.</small>';
   else b+='<div class="f"><label>Renndatum<input id="wr" type="date" value="'+esc(a.race)+'"></label></div><div id="wrw" class="whint">'+raceHint(a.race)+'</div><div class="sub">Zielzeit</div><div class="f">'+num('wgh','Std',a.gh,'min="0"')+num('wgm','Min',a.gm,'min="0"')+num('wgs','Sek',a.gs||0,'min="0" max="59"')+'</div><small>Aus der Zielzeit berechnet M.oach Zieltempo, Schwelle und Intervalle.</small>'
    +'<div class="sub" style="margin-top:14px">Taper: Umfang vor dem Rennen reduzieren'+inf('taper')+'</div>'+chipRow([[1,'1 Woche'],[2,'2 Wochen'],[3,'3 Wochen'],[4,'4 Wochen']],v=>a.tp==v,'data-tp')+'<small>Empfohlen: Marathon 3 Wochen, Halbmarathon 2, 10 km und 5 km 1 bis 2. Die Rennwoche zählt mit: Bei 3 Wochen sind es die zwei Wochen davor plus die Rennwoche.</small>'
    +'<div class="sub" style="margin-top:14px">Vorbereitungswettkämpfe (optional)'+inf('tune')+'</div><div id="wte"></div>'}
  if(step==1)b='<div class="sub">Gib ein aktuelles Ergebnis an (Wettkampf oder harter Test, nicht älter als 3 Monate). Daraus berechnet M.oach dein Startniveau.</div><div class="f"><label>Distanz<select id="wrk">'+[[5,'5 km'],[10,'10 km'],[21.0975,'Halbmarathon'],[42.195,'Marathon']].map(x=>'<option value="'+x[0]+'"'+(Math.abs(x[0]-a.rk)<.01?' selected':'')+'>'+x[1]+'</option>').join('')+'</select></label></div><div class="f">'+num('wrh','Std',a.rh,'min="0"')+num('wrm','Min',a.rm,'min="0"')+num('wrs','Sek',a.rs,'min="0"')+'</div><div id="wh2" class="sub" style="margin-top:6px">'+hint2()+'</div>';
  if(step==2)b='<div class="sub">'+(mt()?'Wie viel läufst du pro Woche, und wie weit ist dein längster Lauf?':'Wie viel läufst du jetzt, und wie weit soll der Plan dich bringen?')+'</div><div class="f">'+num('wc',mt()?'Umfang halten (km/Woche)':'Aktuell km pro Woche',a.cur,'min="10" max="200"')+(mt()?'':num('wp','Höchstumfang km',a.peak,'min="10" max="220"'))+num('wl','Längster Lauf km',a.cap,'min="8" max="45"')+'</div><small>'+(mt()?'Der Umfang bleibt gleich, jede 4. Woche etwas leichter.':'Der Aufbau sollte bei etwa 8–10 % pro Woche liegen. Der längste Lauf liegt beim Marathon meist bei 28–35 km.')+'</small>';
  if(step==3)b='<div class="sub">An welchen Tagen willst du nicht laufen?</div><div class="cr" id="wrd">'+DOW.map((x,i)=>'<button class="chip '+(a.rest.includes(i)?'on':'')+'" data-rd="'+i+'" aria-pressed="'+a.rest.includes(i)+'">'+x+'</button>').join('')+'</div><div class="sub">'+(7-a.rest.length)+' Läufe pro Woche</div><div class="f"><label>Longrun-Tag<select id="wlg">'+WDL.map((x,i)=>'<option value="'+i+'"'+(a.lg==i?' selected':'')+'>'+x+'</option>').join('')+'</select></label></div>'+(mt()?'<div class="sub" style="margin-top:10px">Tempoeinheiten pro Woche</div>'+chipRow([[0,'Keine'],[1,'1×'],[2,'2×']],v=>a.q==v,'data-q'):'')+'<div class="sub" style="margin-top:10px">Krafttraining zu Hause pro Woche</div>'+chipRow([[0,'Keins'],[1,'1×'],[2,'2×']],v=>a.str==v,'data-sn')+'<small>Kraft (20–25 min) wird nach lockeren Läufen eingeplant, mit Übungen und Anleitung.</small>';
  if(step==4)b='<div class="sub">Ab wann soll der Plan starten?'+(mode=='adjust'?' Bisherige Läufe und die frühere Planung bleiben im Kalender erhalten.':'')+'</div><div class="f"><label>Startdatum<input id="ws" type="date" min="'+iso(today)+'" value="'+esc(a.start)+'"></label></div><div id="wpv"></div>';
  wz.innerHTML='<div class="cbox"><div class="ch"><div><h3>'+(mode=='adjust'?'Plan anpassen':'Plan-Assistent')+'</h3><small>Schritt '+(step+1)+' von '+NS+' · '+T+'</small></div><button id="wx" aria-label="Schließen">✕</button></div><div class="bar" style="margin:10px 0 14px"><i style="width:'+((step+1)/NS*100)+'%;background:var(--pri)"></i></div>'+b+'<div id="wze" class="aerr" hidden></div><div class="b" style="margin-top:14px">'+(step>0?'<button id="wb" style="padding:12px 18px">Zurück</button>':'')+'<button class="pri" id="wn" style="flex:1;padding:12px">'+(step==NS-1?'Plan übernehmen':'Weiter')+'</button></div></div>';
  $('#wx').onclick=close;
  const bk=$('#wb');if(bk)bk.onclick=()=>{read();step--;draw()};
  const upd=()=>{read();const h=$('#wh2');if(h)h.innerHTML=hint2();const rw=$('#wrw');if(rw)rw.innerHTML=raceHint(a.race)};
  const pv=()=>{read();const e=bad(),box=$('#wpv');if(!box)return;if(e){box.innerHTML='<div class="aerr">'+esc(e)+'</div>';return}
   try{box.innerHTML=wzPrevHtml(a)}catch(x){box.innerHTML='<div class="aerr">Vorschau nicht möglich: '+esc(x.message)+'</div>'}};
  wz.querySelectorAll('input,select').forEach(e=>e.oninput=()=>{upd();if(step==4)pv()});
  wz.querySelectorAll('[data-ty]').forEach(c=>c.onclick=()=>{read();const t=c.dataset.ty;
   if(t=='m'){a.type='maintain';a.peak=a.cur;a.cap=Math.min(a.cap,Math.round(a.cur*.45));if(a.q==null||a.q>2)a.q=1}
   else{a.type='race';a.rd=+t;a.tp=defTaper(a.rd);a.peak=defPeak(a.rd,a.cur);a.cap=defCap(a.rd);if(!a.gh&&a.gh!==0)a.gh=0;
    const g=Math.round(((+a.rh)*3600+(+a.rm)*60+(+a.rs))*Math.pow(42.195/a.rk,1.06)*Math.pow(a.rd/42.195,1.06)*.97);a.gh=Math.floor(g/3600);a.gm=Math.floor(g%3600/60);a.gs=g%60}
   draw()});
  wz.querySelectorAll('[data-wk]').forEach(c=>c.onclick=()=>{a.weeks=+c.dataset.wk;draw()});
  wz.querySelectorAll('[data-tp]').forEach(c=>c.onclick=()=>{read();a.tp=+c.dataset.tp;draw()});
  {const tb=$('#wte');if(tb){const ri=a.race||S.race;tuneEditor(a.tune,ri,a.start,()=>{},tb)}}
  wz.querySelectorAll('[data-q]').forEach(c=>c.onclick=()=>{read();a.q=+c.dataset.q;draw()});
  wz.querySelectorAll('[data-rd]').forEach(c=>c.onclick=()=>{const i=+c.dataset.rd,k=a.rest.indexOf(i);read();if(k>=0)a.rest.splice(k,1);else a.rest.push(i);a.rest.sort();draw()});
  wz.querySelectorAll('[data-sn]').forEach(c=>c.onclick=()=>{read();a.str=+c.dataset.sn;draw()});
  if(step==4)pv();
  $('#wn').onclick=()=>{read();const e=bad(),eb=$('#wze');if(e){eb.textContent=e;eb.hidden=false;eb.scrollIntoView({block:'nearest'});return}
   if(step<NS-1){step++;draw();wz.scrollTop=0;return}
   const st=wzState(a);
   S.prevPlan=snapPlan();archivePlan(st.start);
   {const ns=iso(mon(parse(st.start))),W=S.wkadj||{};Object.keys(W).forEach(k=>{if(k>=ns)delete W[k]});S.wkadj=W}S.mv=null;S.cfg=st.cfg;S.tune=st.tune||null;S.race=st.race;S.goal=st.goal;S.goalT=st.goalT;S.rd=st.rd;S.base=st.base;S.start=st.start;S.noPlan=false;S.wz=Object.assign({},a);save();location.reload()}}
 draw()}
function planSummary(){
 const c=CF(),n=c.roles.filter(r=>r!='rest').length,pk=Math.max(...c.A.map(x=>x[1])),cap=c.cap;
 if(S.noPlan)return'Kein Trainingsplan aktiv. Deine Läufe werden trotzdem verfolgt.';
 if(c.mode=='maintain')return'Erhaltungsplan bis '+dfull(parse(S.race))+': '+n+' Läufe pro Woche, ca. '+pk+' km, längster Lauf '+cap+' km.';
 const k=RD(),nm=k>40?'Marathon':k>20?'Halbmarathon':r1(k)+' km';
 return(S.cfg?'Eigener Plan':'Standardplan')+': '+nm+' am '+dfull(parse(S.race))+', Ziel '+ft(GT())+', '+n+' Läufe pro Woche, Spitze '+pk+' km, längster Lauf '+cap+' km, Taper '+TPW()+' Wochen'+((S.tune||[]).length?', '+S.tune.length+' Vorbereitungswettkampf'+(S.tune.length>1?'e':''):'')+'.'}
function planFacts(){
 const c=CF(),n=c.roles.filter(r=>r!='rest').length,pk=Math.max(...c.A.map(x=>x[1])),cap=c.cap;
 if(S.noPlan)return null;
 const k=RD(),nm=k>40?'Marathon':k>20?'Halbmarathon':r1(k)+' km';
 if(c.mode=='maintain')return{tag:'Erhaltungsplan',t:[['Bis',dshort(parse(S.race))+' '+parse(S.race).getFullYear()],['Läufe pro Woche',n],['Spitze',pk+' km'],['Längster Lauf',cap+' km']]};
 const tn=(S.tune||[]).length;
 return{tag:S.cfg?'Eigener Plan':'Standardplan',t:[['Rennen',nm],['Datum',dshort(parse(S.race))+' '+parse(S.race).getFullYear()],['Ziel',ft(GT())],['Läufe pro Woche',n],['Spitze',pk+' km'],['Längster Lauf',cap+' km'],['Taper',TPW()+' Wochen'],['Wettkämpfe',tn?tn+' geplant':'keine']]}}
function planCard(){
 const act=!S.noPlan&&iso(today)<=S.race,F=act?planFacts():null,ic=d=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+d+'</svg>';
 const IA=ic('<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>'),IN=ic('<path d="M12 5v14M5 12h14"/>'),IW=ic('<path d="M5 21V4"/><path d="M5 4h12l-2.5 4L17 12H5"/>'),IE=ic('<rect x="6" y="6" width="12" height="12" rx="2"/>'),IR=ic('<path d="M4 12a8 8 0 1 0 3-6.2"/><path d="M4 4v5h5"/>');
 const head='<div class="pnh"><h3>Trainingsplan</h3>'+(F?'<span class="pnt">'+F.tag+'</span>':'')+'</div>';
 const facts=F?'<div class="pnf">'+F.t.map(x=>'<div><b>'+x[1]+'</b><span>'+x[0]+'</span></div>').join('')+'</div>':'<div class="mu pnm">'+planSummary()+'</div>';
 const acts=act?'<button class="pnb pri" id="wzad">'+IA+'Plan anpassen</button><div class="pn2"><button class="pnb" id="wzgo">'+IN+'Neuer Plan</button><button class="pnb" id="tuneb">'+IW+'Wettkämpfe</button></div>'
  :'<button class="pnb pri" id="wzgo">'+IN+'Plan erstellen</button>';
 const more=(act||S.prevPlan)?'<div class="pnx">'+(act?'<button id="wzend">'+IE+'Plan beenden</button>':'')+(S.prevPlan?'<button id="wzrs">'+IR+'Vorherigen Plan wiederherstellen</button>':'')+'</div>':'';
 return '<div class="card pnc">'+head+facts+'<div class="pna">'+acts+'</div><small class="pnn">Neuer Plan: für ein Rennen (Marathon, Halbmarathon, 10 km, 5 km) oder zum Erhalten deiner Ausdauer.</small>'+more+'</div>'}
function wirePlanCard(){
 const g=$('#wzgo'),ad=$('#wzad'),en=$('#wzend'),rs=$('#wzrs');
 if(g)g.onclick=()=>openWizard('new');if(ad)ad.onclick=()=>openWizard('adjust');const tb=$('#tuneb');if(tb)tb.onclick=openTune;
 if(en){let c=0;en.onclick=()=>{if(!c){c=1;en.textContent='Wirklich beenden? Nochmal tippen';return}S.prevPlan=snapPlan();archivePlan(null);const yd=iso(addD(today,-1));S.hist=(S.hist||[]).map(g=>Object.assign({},g,{until:g.until>yd?yd:g.until})).filter(g=>g.start<=g.until);S.noPlan=true;save();location.reload()}}
 if(rs)rs.onclick=()=>{const p=S.prevPlan;S.tune=p.tune||null;S.cfg=p.cfg;S.race=p.race;S.goal=p.goal;S.goalT=p.goalT;S.rd=p.rd;S.base=p.base;S.start=p.start;S.hist=p.hist||[];S.noPlan=!!p.noPlan;S.prevPlan=null;S.wz=null;save();location.reload()}}
function phAt(ws){
 for(let j=0;j<7;j++){const d=addD(ws,j),g=histSeg(d);
  if(g)return withPlan(g,()=>planCur(d,1)?ph(wtr(d)):null)||'Ohne Plan';
  if(!S.noPlan&&d>=START&&d<=parse(S.race))return ph(wtr(d))}
 return'Ohne Plan'}
/* ===== Woche ansehen / anpassen ===== */
const wkRows=(ws,na)=>{let pl=0,ac=0,rn=0;const rows=[];
 for(let i=0;i<7;i++){const d=addD(ws,i),q=plan(d,na),l=S.log[iso(d)],dn=l&&l.done;if(q)pl+=q.km;if(dn){ac+=+l.km||0;rn++}
  rows.push({d,q,l,dn})}
 return{pl,ac,rn,rows}};
function openWeek(ws){
 const k=iso(ws),m=$('#md'),cw=mon(today),past=ws<cw,w=wtr(ws);
 const hasPlan=wkRows(ws,1).rows.some(r=>r.q);
 const sv0=(S.wkadj||{})[k];
 const base=(()=>{const sv=S.wkadj;S.wkadj=null;try{return wkRows(ws,1).pl}finally{S.wkadj=sv}})();
 const taper=hasPlan&&!past&&CF().mode!='maintain'&&w<TPW(),racew=hasPlan&&iso(addD(ws,6))>=S.race&&iso(ws)<=S.race;
 const fixed=hasPlan&&!past&&Math.abs((()=>{const sv=(S.wkadj||{})[k];S.wkadj=S.wkadj||{};S.wkadj[k]=.5;try{return wkRows(ws,1).pl}finally{if(sv==null)delete S.wkadj[k];else S.wkadj[k]=sv}})()-base)<.5;
 const fmax=taper||racew?1:1.1,fmin=.3;
 let f=sv0||1;
 const dayHtml=r=>'<div class="wr" data-dd="'+iso(r.d)+'"><div class="wd"><b>'+DOW[(r.d.getDay()+6)%7]+'</b><span>'+r.d.getDate()+'.</span></div><span class="dot t-'+(r.q?r.q.t:'rest')+'"></span><div class="wt"><div>'+(!r.q?(r.dn?'Lauf':'–'):r.q.t=='rest'?'Recovery / frei':r.q.lab+(r.q.km?' · '+r1(r.q.km)+' km':''))+'</div></div><div class="wk2">'+(r.dn?'<span class="ck">✓ '+r1(+r.l.km||0)+' km</span>':'')+'</div></div>';
 const withF=(ff,fn)=>{const sv=(S.wkadj||{})[k];S.wkadj=S.wkadj||{};if(ff==1)delete S.wkadj[k];else S.wkadj[k]=ff;try{return fn()}finally{if(sv==null)delete S.wkadj[k];else S.wkadj[k]=sv}};
 const body=()=>{
  const cur=withF(f,()=>wkRows(ws,1));
  const diff=cur.pl-base;
  return{cur,html:cur.rows.map(dayHtml).join(''),tiles:'<div class="tiles"><div class="tl"><b>'+Math.round(cur.pl)+' km</b><span>Plan'+(f!=1?' (angepasst)':'')+'</span></div><div class="tl"><b>'+Math.round(cur.ac)+' km</b><span>gelaufen</span></div><div class="tl"><b>'+(base>0&&f!=1?(diff>0?'+':'−')+Math.abs(Math.round(diff))+' km':cur.rn+' Tage')+'</b><span>'+(base>0&&f!=1?'zum Standardplan':'Lauftage')+'</span></div></div>'}};
 const draw=()=>{
  const b=body();
  m.hidden=false;
  m.innerHTML='<div class="box"><h3>Woche '+dshort(ws)+' – '+dshort(addD(ws,6))+'</h3><div class="mu">'+(hasPlan?esc(phAt(ws)):'Ohne Plan')+(hasPlan&&deload(w)?' · Entlastungswoche':'')+'</div>'+b.tiles+'<div id="wkd">'+b.html+'</div>'
   +(hasPlan&&!past&&fixed?'<div class="ci"><h4>Umfang dieser Woche'+inf('wkadj')+'</h4><div class="sub">Das ist eine feste, leichte Regenerationswoche mit kurzen Läufen. Hier gibt es nichts zu kürzen.</div></div><div class="b"><button id="wsc">Schließen</button></div>':hasPlan&&!past?'<div class="ci"><h4>Umfang dieser Woche'+inf('wkadj')+'</h4><div class="sub">Wenn in dieser Woche weniger geht (Reise, Arbeit, Infekt) oder du bewusst entlastest.</div>'
    +'<div class="crng" style="margin:6px 0"><button data-f="0.6">−40 %</button><button data-f="0.8">−20 %</button><button data-f="1">Plan</button>'+(fmax>1?'<button data-f="1.1">+10 %</button>':'')+'</div>'
    +'<div class="rl">Anpassung: <b id="fv">'+Math.round(f*100)+' %</b> = <b id="fk">'+Math.round(b.cur.pl)+' km</b></div><input type="range" id="fr2" min="'+Math.round(fmin*100)+'" max="'+Math.round(fmax*100)+'" step="5" value="'+Math.round(f*100)+'" aria-label="Wochenumfang in Prozent">'
    +'<small id="fw">'+(taper?'In den letzten Wochen vor dem Rennen ist nur Kürzen sinnvoll.':racew?'Rennwoche: Mehr ist nicht sinnvoll.':'Longrun und Qualitätseinheiten werden anteilig mitgekürzt.')+'</small></div>'
    +'<div class="b"><button class="pri" id="wsv">Übernehmen</button><button id="wsr">Zurücksetzen</button><button id="wsc">Schließen</button></div>'
    :'<small class="chint">'+(past?'Vergangene Wochen lassen sich nicht mehr ändern.':'Für diese Woche gibt es keinen Plan.')+'</small><div class="b"><button id="wsc">Schließen</button></div>')+'</div>';
  m.querySelectorAll('.wr').forEach(e=>e.onclick=()=>openDay(e.dataset.dd));
  $('#wsc').onclick=()=>{m.hidden=true};
  const rg=$('#fr2');
  if(rg){
   const upd=()=>{f=+rg.value/100;const b2=body();$('#fv').textContent=Math.round(f*100)+' %';$('#fk').textContent=Math.round(b2.cur.pl)+' km';$('#wkd').innerHTML=b2.html;m.querySelector('.tiles').outerHTML=b2.tiles;
    $('#wkd').querySelectorAll('.wr').forEach(e=>e.onclick=()=>openDay(e.dataset.dd));
    const w2=$('#fw');if(f<=.5)w2.textContent='Stark gekürzt: Das Training bleibt trotzdem sinnvoll. In der nächsten Woche wieder in den Plan einsteigen, nicht nachholen.'};
   rg.oninput=upd;
   m.querySelectorAll('[data-f]').forEach(bt=>bt.onclick=()=>{rg.value=Math.min(fmax,+bt.dataset.f)*100;upd()});
   $('#wsv').onclick=()=>{const W=S.wkadj||(S.wkadj={});if(Math.abs(f-1)<.005)delete W[k];else W[k]=Math.round(f*100)/100;save();m.hidden=true;render()};
   $('#wsr').onclick=()=>{if(S.wkadj)delete S.wkadj[k];save();m.hidden=true;render()}}};
 draw()}

/* ===== Zeitraum-Auswahl ===== */
let OVR={k:'all'},OZ={ph:null,w:null,fresh:false,open:false};
const OVRN={plan:'Plan-Zeitraum','4':'Letzte 4 Wochen','12':'Letzte 12 Wochen','26':'Letzte 6 Monate',all:'Alle Wochen',cust:'Eigener Zeitraum'};
function ovrLabel(){return OVR.k=='cust'&&OVR.a&&OVR.b?dshort(OVR.a)+'–'+dfull(parse(OVR.b)):OVRN[OVR.k]||'Alle Wochen'}
function openRange(){
 const m=$('#md');m.hidden=false;
 const opts=[['plan'],['4'],['12'],['26'],['all']];
 m.innerHTML='<div class="box"><h3>Zeitraum wählen</h3><div class="sub">Die Werte und das Diagramm der Gesamtübersicht passen sich an.</div><div class="crng" style="flex-direction:column;align-items:stretch">'+opts.map(o=>'<button class="chip '+(OVR.k==o[0]?'on':'')+'" data-k="'+o[0]+'">'+OVRN[o[0]]+'</button>').join('')+'</div>'
  +'<div class="f"><label>Von<input type="date" id="ra" value="'+(OVR.a||iso(addD(today,-84)))+'"></label><label>Bis<input type="date" id="rb" value="'+(OVR.b||iso(today))+'"></label></div><div class="b"><button class="pri" id="rc">Eigenen Zeitraum anwenden</button><button id="rx">Schließen</button></div></div>';
 m.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{OVR={k:b.dataset.k};m.hidden=true;rCal()});
 $('#rc').onclick=()=>{const a=$('#ra').value,b=$('#rb').value;if(!a||!b||a>b)return;OVR={k:'cust',a,b};m.hidden=true;rCal()};
 $('#rx').onclick=()=>{m.hidden=true}}

function barsSvg(wk,Wd,H,mark,hit,sel){
 const n=wk.length,mx=Math.max(...wk.map(x=>Math.max(x.km,x.ac||0)),1),bw=Math.max(1.5,(Wd-8)/n-1.2);
 const b=wk.map((x,i)=>{const xx=4+i*(Wd-8)/n,c=PCOL[x.ph]||'#999',h=Math.max(x.km>0?2:0,x.km/mx*(H-8));
  let o=h>0?'<rect x="'+xx.toFixed(1)+'" y="'+(H-h).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+h.toFixed(1)+'" rx="1.5" fill="'+(x.ac!=null?'var(--bd)':c)+'"'+(x.dl&&x.ac==null?' opacity=".45"':'')+'/>':'';
  if(x.ac>0){const h2=Math.max(2,x.ac/mx*(H-8)),w2=bw*.62;o+='<rect x="'+(xx+(bw-w2)/2).toFixed(1)+'" y="'+(H-h2).toFixed(1)+'" width="'+w2.toFixed(1)+'" height="'+h2.toFixed(1)+'" rx="1.2" fill="'+c+'"/>'}
  if(hit)o+='<rect class="hit" data-w="'+iso(x.ws)+'" x="'+(4+i*(Wd-8)/n).toFixed(1)+'" y="0" width="'+((Wd-8)/n).toFixed(1)+'" height="'+H+'" fill="transparent" style="cursor:pointer"/>';
  return sel!=null&&sel>=0&&i!=sel?'<g opacity=".42">'+o+'</g>':o}).join('');
 const mk=mark!=null&&mark>=0?'<line x1="'+(4+(mark+.5)*(Wd-8)/n).toFixed(1)+'" x2="'+(4+(mark+.5)*(Wd-8)/n).toFixed(1)+'" y1="0" y2="'+H+'" stroke="var(--tx)" stroke-dasharray="3 3" opacity=".6"/>':'';
 const sl=sel!=null&&sel>=0?'<rect class="bsel" x="'+(4+sel*(Wd-8)/n-1).toFixed(1)+'" y="0" width="'+((Wd-8)/n+1).toFixed(1)+'" height="'+H+'" rx="6"/><path class="bcar" d="M'+(4+(sel+.5)*(Wd-8)/n-4.5).toFixed(1)+' 1.5h9l-4.5 5.5z"/>':'';
 return '<svg viewBox="0 0 '+Wd+' '+H+'" width="100%" height="'+H+'" role="img" aria-label="Kilometer pro Woche">'+sl+b+mk+'</svg>'}

function weekRowHtml(x,mxv,cw){
 const f=+x.ws>+cw,cur=+x.ws==+cw,col=PCOL[x.ph]||'#999',pw=x.pl/mxv*100,aw=Math.min(100,x.acr/mxv*100);
 const st=f?'':x.pl>0?(x.acr>=x.pl*.9?'✓':x.acr>0?'◐':'–'):(x.acr>0?'✓':'–');
 return'<div class="wkr'+(cur?' cur':'')+'" data-w="'+iso(x.ws)+'" role="button" tabindex="0"><div class="wkd"><b>'+dshort(x.ws)+'–'+dshort(addD(x.ws,6))+'</b><small><i style="background:'+col+'"></i>'+x.ph+(cur?' · diese Woche':'')+'</small></div><div class="wkb"><div class="trk">'+(x.pl>0?'<i class="pl" style="width:'+pw.toFixed(1)+'%'+(f?';background:'+col+';opacity:.55;filter:none':'')+'"></i>':'')+(f?'':'<i class="ac" style="width:'+aw.toFixed(1)+'%;background:'+col+'"></i>')+'</div></div><div class="wkn"><b>'+(f?'':Math.round(x.acr))+'</b>'+(x.pl>0?'<span>/'+Math.round(x.pl)+'</span>':'')+' km<em>'+st+'</em></div></div>'}
function allWeeksHtml(wk,cw){
 const mxv=Math.max(10,...wk.map(x=>Math.max(x.pl,x.acr||0)));
 const up=wk.filter(x=>+x.ws>=+cw),past=wk.filter(x=>+x.ws<+cw);
 const groups={};past.forEach(x=>{const k=iso(x.ws).slice(0,7);(groups[k]=groups[k]||[]).push(x)});
 const pastHtml=Object.keys(groups).sort().map(k=>{const[y,mo]=k.split('-'),g=groups[k],km=g.reduce((s,x)=>s+x.acr,0);
  return'<div class="wmh"><b>'+new Date(+y,+mo-1,1).toLocaleDateString('de-DE',{month:'long',year:'numeric'})+'</b><span>'+Math.round(km)+' km gelaufen</span></div>'+g.map(x=>weekRowHtml(x,mxv,cw)).join('')}).join('');
 return'<details id="allw" class="card" style="margin:10px 0 0;box-shadow:none"><summary><h3>Alle Wochen anzeigen</h3></summary>'
  +'<div class="wsec">Aktuelle &amp; kommende Wochen ('+up.length+')</div>'+(up.map(x=>weekRowHtml(x,mxv,cw)).join('')||'<div class="mu" style="padding:6px 0">Keine kommenden Wochen im Zeitraum.</div>')
  +(past.length?'<details id="pastw" class="pastw"><summary><span>Vergangene Wochen ('+past.length+')</span></summary>'+pastHtml+'</details>':'')+'</details>'}

function overviewHtml(){
 const R=allRuns(),H=S.hist||[],c=[];
 if(H.length)c.push(H[0].start);if(!S.noPlan)c.push(iso(START));if(R.length)c.push(R[R.length-1].d);
 if(!c.length)return'';
 c.sort();let from=mon(parse(c[0]));
 let end=S.noPlan?(H.length?H[H.length-1].until:iso(today)):S.race;if(end<iso(today))end=iso(today);
 const last=mon(parse(end));if((last-from)/(7*D)>120)from=addD(last,-7*120);
 const cw=mon(today);let all=[];
 for(let ws=from;ws<=last;ws=addD(ws,7)){
  let pl=0,ac=0,rn=0;for(let j=0;j<7;j++){const d=addD(ws,j),p=plan(d,1),l=S.log[iso(d)];if(p)pl+=p.km;if(l&&l.done){ac+=+l.km||0;rn++}}
  all.push({ws,km:pl,ac:ws<=cw?ac:null,ph:phAt(ws),dl:false,pl,acr:ac,rn})}
 let wk=all;
 if(OVR.k=='plan'&&!S.noPlan)wk=all.filter(x=>x.ws>=mon(START)&&x.ws<=mon(parse(S.race)));
 else if(['4','12','26'].includes(OVR.k)){const nw=+OVR.k;wk=all.filter(x=>x.ws<=cw&&x.ws>=addD(cw,-7*(nw-1)))}
 else if(OVR.k=='cust'&&OVR.a&&OVR.b)wk=all.filter(x=>iso(addD(x.ws,6))>=OVR.a&&iso(x.ws)<=OVR.b);
 if(!wk.length)wk=all;
 const first=wk[0].ws,lastw=wk[wk.length-1].ws;
 const cur=wk.findIndex(x=>+x.ws==+cw);
 const done=wk.filter(x=>+x.ws<+cw),plD=done.reduce((s,x)=>s+x.pl,0),acD=done.filter(x=>x.pl>0).reduce((s,x)=>s+x.acr,0),acT=wk.filter(x=>x.ws<=cw).reduce((s,x)=>s+x.acr,0),runs=wk.reduce((s,x)=>s+x.rn,0);
 const nb=wk.filter(x=>x.ws<=cw).length;
 const tl=(b,l,k)=>'<div class="tl"><b>'+b+'</b><span>'+l+inf(k)+'</span></div>';
 const phs=[];wk.forEach(x=>{if(!phs.includes(x.ph))phs.push(x.ph)});
 const legend=phs.map(p=>'<span><i style="background:'+(PCOL[p]||'#999')+'"></i>'+p+'</span>').join('')+'<span><i style="background:var(--bd)"></i>geplant</span>';
 const rows=wk.map(x=>{const f=+x.ws>+cw,cl=f?'':x.pl>0?(x.acr>=x.pl*.9?'✓':x.acr>0?'◐':'–'):(x.acr>0?'✓':'–');
  return '<tr data-w="'+iso(x.ws)+'"'+(+x.ws==+cw?' class="cur"':'')+'><td>'+dshort(x.ws)+'–'+dshort(addD(x.ws,6))+'</td><td>'+x.ph+'</td><td>'+(x.pl?Math.round(x.pl):'–')+'</td><td>'+(f?'':Math.round(x.acr))+'</td><td>'+cl+'</td></tr>'}).join('');
 /* Zoom: Gesamtplan -> Phase -> Woche */
 const segs=[];wk.forEach(x=>{const l=segs[segs.length-1];if(l&&l.ph==x.ph)l.w.push(x);else segs.push({ph:x.ph,w:[x]})});
 segs.forEach(g=>{g.a=iso(g.w[0].ws);g.pl=g.w.reduce((q,x)=>q+x.pl,0);g.ac=g.w.filter(x=>x.ws<=cw).reduce((q,x)=>q+x.acr,0);g.pd=g.w.filter(x=>x.ws<=cw).reduce((q,x)=>q+x.pl,0)});
 const pm={};segs.forEach(g=>g.w.forEach(x=>{pm[iso(x.ws)]=g.a}));
 const segOf=w=>segs.find(g=>g.w.some(x=>iso(x.ws)==w));
 let sg=OZ.ph?segs.find(g=>g.a==OZ.ph):null,wz=OZ.w?wk.find(x=>iso(x.ws)==OZ.w):null;
 if(wz){const g2=segOf(OZ.w);if(g2)sg=g2}
 if(!sg)sg=null;if(!sg)wz=null;
 if(sg&&wz&&!sg.w.includes(wz))wz=null;
 const lvl=wz?2:sg?1:0,fresh=OZ.fresh;OZ.fresh=false;
 const crumb=()=>'<div class="ovz"><button type="button" data-oz="0">Gesamtplan</button>'+(sg?'<span>›</span>'+(wz?'<button type="button" data-oz="1">':'<b>')+'<i style="background:'+(PCOL[sg.ph]||'#999')+'"></i>'+esc(sg.ph)+(wz?'</button>':'</b>'):'')+(wz?'<span>›</span><b>'+dshort(wz.ws)+'–'+dshort(addD(wz.ws,6))+'</b>':'')+'</div>';
 const head='<div class="oh"><h3>Gesamtübersicht</h3><button id="ovr" class="rngb">'+ovrLabel()+' ▾</button></div>';
 const wrap=(h)=>'<div class="card ovc'+(fresh?' ovzin':'')+'" data-lv="'+lvl+'" data-ph="'+(sg?sg.a:'')+'" data-pm="'+JSON.stringify(pm).replace(/"/g,'&quot;')+'">'+h+'</div>';
 const phaseTiles=g=>{const n=g.w.length,f=g.pd>0?Math.round(g.ac/g.pd*100)+' %':'–';return'<div class="tiles"><div class="tl"><b>'+n+'</b><span>'+(n==1?'Woche':'Wochen')+'</span></div><div class="tl"><b>'+Math.round(g.pl)+' km</b><span>geplant</span></div><div class="tl"><b>'+Math.round(g.ac)+' km</b><span>gelaufen</span></div><div class="tl"><b>'+Math.round(g.pl/n)+' km</b><span>Ø geplant/Woche</span></div><div class="tl"><b>'+Math.round(Math.max.apply(null,g.w.map(x=>x.pl)))+' km</b><span>Spitzenwoche</span></div><div class="tl"><b>'+f+'</b><span>Erfüllung</span></div></div>'};
 if(lvl==2){
  const i=wk.indexOf(wz),pv=wk[i-1],nx=wk[i+1],sv=WS;let wh;WS=wz.ws;try{wh=weekHtml()}finally{WS=sv}
  wh=wh.replace(' id="wad"',' data-wadz="1"');
  const fc=FOCUS[sg.ph]||'';
  return wrap(head+crumb()+'<div class="ovn"><button type="button" class="rngb" data-ow="'+(pv?iso(pv.ws):'')+'"'+(pv?'':' disabled')+'>‹ Vorherige</button><span>Woche '+(sg.w.indexOf(wz)+1)+' von '+sg.w.length+' · '+esc(sg.ph)+(+wz.ws==+cw?' · diese Woche':'')+'</span><button type="button" class="rngb" data-ow="'+(nx?iso(nx.ws):'')+'"'+(nx?'':' disabled')+'>Nächste ›</button></div>'
   +'<div class="ovch">'+barsSvg(sg.w,340,100,sg.w.findIndex(x=>+x.ws==+cw),true,sg.w.indexOf(wz))+'</div><div class="leg" style="margin:2px 0 8px"><span><i style="background:'+(PCOL[sg.ph]||'#999')+'"></i>'+esc(sg.ph)+' · Woche '+(sg.w.indexOf(wz)+1)+' markiert</span></div>'
   +(fc?'<div class="sub" style="margin:2px 0 10px">'+esc(fc)+'</div>':'')+wh)}
 if(lvl==1){
  const g=sg,mxv=Math.max(10,...g.w.map(x=>Math.max(x.pl,x.acr||0))),cur2=g.w.findIndex(x=>+x.ws==+cw),si=segs.indexOf(g),fc=FOCUS[g.ph]||'';
  return wrap(head+crumb()+'<div class="sub">'+dshort(g.w[0].ws)+' bis '+dfull(addD(g.w[g.w.length-1].ws,6))+(fc?'. '+esc(fc):'')+' Tippe auf eine Woche für die geplanten Einheiten.</div>'
   +phaseTiles(g)+barsSvg(g.w,340,110,cur2,true)
   +'<div class="wsec">Wochen der Phase</div>'+g.w.map(x=>weekRowHtml(x,mxv,cw)).join('')
   +'<div class="ovn"><button type="button" class="rngb" data-op="'+(segs[si-1]?segs[si-1].a:'')+'"'+(segs[si-1]?'':' disabled')+'>‹ '+(segs[si-1]?esc(segs[si-1].ph):'')+'</button><span></span><button type="button" class="rngb" data-op="'+(segs[si+1]?segs[si+1].a:'')+'"'+(segs[si+1]?'':' disabled')+'>'+(segs[si+1]?esc(segs[si+1].ph):'')+' ›</button></div>')}
 const tw=wk.length,strip='<div class="phs" role="group" aria-label="Phasen des Plans">'+segs.map(g=>'<button type="button" data-op="'+g.a+'" style="flex:'+g.w.length+' 1 0;background:'+(PCOL[g.ph]||'#999')+'" aria-label="'+esc(g.ph)+', '+g.w.length+' Wochen" title="'+esc(g.ph)+'"></button>').join('')+'</div>';
 const prow=segs.map(g=>{const has=g.w.some(x=>+x.ws==+cw);return'<div class="phr'+(has?' cur':'')+'" data-op="'+g.a+'" role="button" tabindex="0"><i style="background:'+(PCOL[g.ph]||'#999')+'"></i><div class="pht"><b>'+esc(g.ph)+(has?' · jetzt':'')+'</b><small>'+dshort(g.w[0].ws)+'–'+dshort(addD(g.w[g.w.length-1].ws,6))+' · '+g.w.length+' '+(g.w.length==1?'Woche':'Wochen')+'</small></div><div class="phk"><b>'+Math.round(g.pl)+'</b><small>km geplant</small></div><span class="phc">›</span></div>'}).join('');
 return wrap(head+'<div class="sub">'+dshort(first)+(first.getFullYear()!=today.getFullYear()?first.getFullYear():'')+' bis '+dfull(addD(lastw,6))+' · '+wk.length+' Wochen. Heller Balken: geplant, farbig: gelaufen.'+inf('ov_chart')+' Tippe auf eine Phase oder Woche, um hineinzuzoomen.</div>'
  +'<div class="tiles">'+tl(wk.length,'Wochen','ov_weeks')+tl(Math.round(acT)+' km','gelaufen gesamt','ov_ac')+tl(nb?Math.round(acT/nb)+' km':'–','Ø pro Woche','ov_avg')+tl(runs,'Lauftage','ov_days')+tl(Math.round(plD)+' km','Plan bisher','ov_plan')+tl(plD>0?Math.round(acD/plD*100)+' %':'–','Erfüllung','ov_ful')+'</div>'
  +'<div class="wsec">Kilometer pro Woche</div>'+barsSvg(wk,340,120,cur,true)+'<div class="leg">'+legend+'</div><div class="ovh">Tippe auf einen Balken, um in die zugehörige Phase hineinzuzoomen.</div>'
  +'<details id="phd" class="pastw"'+(OZ.open?' open':'')+'><summary><span>Phasen anzeigen ('+segs.length+')<small class="ovs"> · antippen zum Hineinzoomen</small></span></summary>'+strip+prow+'</details>'
  +allWeeksHtml(wk,cw))}


/* ===== Läufe: Analyse ===== */
const KIND={easy:'Locker',q:'Qualität',long:'Longrun',race:'Wettkampf'},KCOL={easy:'#3b82f6',q:'#f97316',long:'#8b5cf6',race:'#ef4444'};
function rctx(runs,pf,useZ){
 const mx=runs.filter(r=>r.mx>0).map(r=>r.mx),hrmax=mx.length?Math.max(...mx):null;
 const pcs=runs.filter(r=>r.km>=3&&r.sec>0).map(r=>r.sec/r.km).sort((a,b)=>a-b),kms=runs.filter(r=>r.km>=3).map(r=>r.km).sort((a,b)=>a-b);
 return{runs,hrmax,pf,useZ,med:pcs.length?pcs[Math.floor(pcs.length/2)]:null,mkm:kms.length?kms[Math.floor(kms.length/2)]:null,k80:kms.length?kms[Math.floor(kms.length*.85)]:null}}
function runKind(r,cx,p){
 if(p&&p.km&&p.t!='rest'&&KIND[p.t])return p.t;
 const pc=r.km>0&&r.sec>0?r.sec/r.km:null;
 if(cx.k80&&r.km>=Math.max(14,cx.k80*.95))return'long';
 if(pc&&cx.med&&r.km>=4&&pc<cx.med*.93)return'q';
 return'easy'}
function analyzeRun(r,cx){
 const pc=r.km>0&&r.sec>0?r.sec/r.km:null,d=parse(r.d),p=cx.pf?cx.pf(d):null,kind=runKind(r,cx,p),z=cx.useZ?Z(d):null;
 const good=[],bad=[],nxt=[],note=[];
 const B=(k,t,n)=>{bad.push({k,t});if(n)nxt.push(n)};
 if(pc&&kind=='easy'){
  if(z){if(pc>=z.e1*.97)good.push('Tempo im lockeren Bereich ('+fp(pc)+' /km)');else B('fast','Zu schnell für einen lockeren Lauf: '+fp(pc)+' statt '+fp(z.e1)+'–'+fp(z.e2)+' /km','Die ersten 3 km bewusst langsamer, im Gesprächstempo bleiben.')}
  else if(cx.med&&pc<cx.med*.95)B('fast','Schneller als dein üblicher Schnitt ('+fp(pc)+' statt '+fp(cx.med)+' /km)','Lockere Läufe bewusst langsam beginnen.')}
 if(p&&p.km&&p.t!='rest'&&cx.pf){const q=r.km/p.km;
  if(q>=.9&&q<=1.1)good.push('Umfang wie geplant ('+dec(r.km,1)+' von '+r1(p.km)+' km)');
  else if(q>1.15)B('long','Länger als geplant: '+dec(r.km,1)+' statt '+r1(p.km)+' km','Den geplanten Umfang einhalten. Mehr bringt nicht automatisch mehr.');
  else if(q<.8)B('short','Gekürzt: nur '+dec(r.km,1)+' von '+r1(p.km)+' km','Wenn du kürzen musst, lieber einen lockeren Lauf auslassen als die Qualität.')}
 if(p&&p.t=='rest'&&cx.pf)B('rest','Lauf an einem geplanten Ruhetag','Ruhetage einhalten: Dort passiert die Anpassung.');
 if(r.hr&&cx.hrmax){const pct=r.hr/cx.hrmax*100;
  if(kind=='easy'){if(pct<=76)good.push('Puls entspannt ('+Math.round(pct)+' % der höchsten gemessenen Frequenz)');else if(pct>=83)B('hr','Puls hoch für einen lockeren Lauf ('+Math.round(pct)+' % der höchsten Frequenz)','Langsamer starten. Hitze, Müdigkeit, Koffein und Stress treiben den Puls.')}
  else if(kind=='q'&&pct>=82)good.push('Intensität passend: Ø Puls '+Math.round(pct)+' % der höchsten Frequenz')}
 if(r.rpe>0){
  if(kind=='easy'&&r.rpe>=7)B('rpe','Anstrengung '+r.rpe+'/10 ist für einen lockeren Lauf zu hoch','Gefühl über Tempo stellen: lockere Läufe dürfen sich leicht anfühlen.');
  else if(kind=='easy'&&r.rpe<=4)good.push('Locker gelaufen (Anstrengung '+r.rpe+'/10)');
  else if(r.rpe>=9)B('rpe','Sehr hart (Anstrengung '+r.rpe+'/10)','Danach ein lockerer oder freier Tag.')}
 const before=cx.runs.filter(x=>x.d<r.d&&x.d>=iso(addD(d,-42)));
 if(r.hr&&pc&&r.km>=4){const ef=x=>(1000/(x.sec/x.km))/x.hr,bs=before.filter(x=>x.hr&&x.km>=4&&x.sec>0).map(ef);
  if(bs.length>=4){const e0=mean(bs),e1=ef(r),dl=(e1/e0-1)*100;
   if(dl>=2.5)good.push('Effizienter als dein Schnitt: '+fmtPct(dl)+' Tempo pro Herzschlag');
   else if(dl<=-5)B('eff','Weniger effizient als sonst ('+fmtPct(dl)+' Tempo pro Herzschlag)','Schlaf, Hitze und Flüssigkeit prüfen. Hängt es an, die Woche entschärfen.')}}
 if(r.ld){const ls=before.filter(x=>x.ld).map(x=>x.ld);if(ls.length>=4){const b=mean(ls);if(r.ld>b*1.5)B('load','Hohe Trainingslast ('+r.ld+', Ø '+Math.round(b)+')','Danach einen lockeren oder freien Tag einplanen.')}}
 let st=0;for(let i=1;i<=7;i++){if(cx.runs.some(x=>x.d==iso(addD(d,-i))))st++;else break}
 if(st>=5)B('streak',(st+1)+'. Lauftag in Folge','Einen freien Tag einplanen.');
 if(r.el&&r.km>0&&r.el/r.km>=15)note.push('Hügelig ('+Math.round(r.el/r.km)+' m pro km): Das Tempo ist nicht direkt mit flachen Läufen vergleichbar.');
 if(kind=='long'&&r.km>=18)nxt.push('Verpflegung wie im Wettkampf üben: ab Minute 40 alle 20–30 min rund 25 g Kohlenhydrate.');
 if(!good.length)good.push(r.manual?'Lauf eingetragen. Konstanz zählt.':'Lauf absolviert. Konstanz zählt.');
 if(!nxt.length)nxt.push(kind=='q'?'Morgen locker laufen oder frei. Die Qualität wirkt erst mit Erholung.':kind=='long'?'Heute Kohlenhydrate, Eiweiß und Schlaf priorisieren.':kind=='race'?'Ein paar lockere Tage, bevor du wieder Tempo läufst.':'Weiter so. Die nächste Einheit wie geplant.');
 const v=bad.length==0?{t:'Stark',c:'g'}:bad.length==1?{t:'Gut',c:'y'}:{t:'Achtung',c:'r'};
 return{kind,good:good.slice(0,3),bad:bad.slice(0,3),nxt:nxt.slice(0,3),note,v,pc}}
const BADL={fast:'zu schnell für lockere Läufe',long:'länger als geplant',short:'Einheiten gekürzt',rest:'Läufe an Ruhetagen',hr:'Puls zu hoch bei lockeren Läufen',rpe:'zu hohe Anstrengung',eff:'geringere Effizienz',load:'sehr hohe Trainingslast',streak:'viele Lauftage in Folge'};
function weeklyKmRuns(runs,n){const o=[];for(let i=n-1;i>=0;i--){const ws=addD(mon(today),-7*i),a=iso(ws),b=iso(addD(ws,6));o.push({ws,v:runs.filter(r=>r.d>=a&&r.d<=b).reduce((s,r)=>s+r.km,0)})}return o}
function lineSvg(pts,col,Wd,H,lbl){
 const n=pts.length,mx=Math.max(...pts.map(p=>p.v),10),L=26,Rr=8,T=10,B=18,pw=Wd-L-Rr,ph=H-T-B;
 const X=i=>L+(n>1?i/(n-1):0)*pw,Y=v=>T+ph-v/mx*ph;
 const act=pts.filter(p=>p.v>0),avg=act.length?act.reduce((s,p)=>s+p.v,0)/act.length:0;
 const line=pts.map((p,i)=>X(i).toFixed(1)+','+Y(p.v).toFixed(1)).join(' ');
 const area='M'+X(0).toFixed(1)+','+(T+ph)+' L'+line.split(' ').join(' L')+' L'+X(n-1).toFixed(1)+','+(T+ph)+'Z';
 let g='<defs><linearGradient id="lg'+lbl+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+col+'" stop-opacity=".35"/><stop offset="1" stop-color="'+col+'" stop-opacity="0"/></linearGradient></defs>';
 for(let i=0;i<=2;i++){const v=mx*i/2,y=Y(v);g+='<line x1="'+L+'" x2="'+(Wd-Rr)+'" y1="'+y.toFixed(1)+'" y2="'+y.toFixed(1)+'" stroke="var(--bd)"/><text x="'+(L-4)+'" y="'+(y+3.5).toFixed(1)+'" text-anchor="end" font-size="9.5" fill="var(--mu)">'+Math.round(v)+'</text>'}
 if(avg>0)g+='<line x1="'+L+'" x2="'+(Wd-Rr)+'" y1="'+Y(avg).toFixed(1)+'" y2="'+Y(avg).toFixed(1)+'" stroke="'+col+'" stroke-dasharray="4 4" opacity=".7"/>';
 g+='<path d="'+area+'" fill="url(#lg'+lbl+')"/><polyline points="'+line+'" fill="none" stroke="'+col+'" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>';
 pts.forEach((p,i)=>{if(i==n-1||p.v>=mx)g+='<circle cx="'+X(i).toFixed(1)+'" cy="'+Y(p.v).toFixed(1)+'" r="3.6" fill="'+col+'"/><text x="'+X(i).toFixed(1)+'" y="'+(Y(p.v)-7).toFixed(1)+'" text-anchor="'+(i>n-3?'end':'middle')+'" font-size="10" font-weight="700" fill="var(--tx)">'+Math.round(p.v)+'</text>'});
 const li=[0,Math.floor((n-1)/2),n-1];li.forEach((i,j)=>{g+='<text x="'+X(i).toFixed(1)+'" y="'+(H-4)+'" text-anchor="'+(j==0?'start':j==2?'end':'middle')+'" font-size="9.5" fill="var(--mu)">'+dshort(pts[i].ws)+'</text>'});
 return{svg:'<svg viewBox="0 0 '+Wd+' '+H+'" width="100%" height="'+H+'" role="img" aria-label="Wochenumfang als Linie">'+g+'</svg>',avg}}
function runsView(R,cx,opt){
 /* gemeinsame Bausteine für Läufe-Tab und Coaching */
 const c28=iso(addD(today,-27)),rc=(opt&&opt.all)?R:R.filter(r=>r.d>=c28),km=rc.reduce((s,r)=>s+r.km,0),sec=rc.reduce((s,r)=>s+(r.km>0?r.sec:0),0),kmP=rc.reduce((s,r)=>s+(r.sec>0?r.km:0),0);
 const hrs=rc.filter(r=>r.hr>0),ahr=hrs.length?hrs.reduce((s,r)=>s+r.hr,0)/hrs.length:null,lg=rc.reduce((a,r)=>r.km>a?r.km:a,0);
 const mix={easy:0,q:0,long:0,race:0};rc.forEach(r=>{const p=cx.pf?cx.pf(parse(r.d)):null;mix[runKind(r,cx,p)]+=r.km});
 const mt=mix.easy+mix.q+mix.long+mix.race;
 const tl=(c,v,l,k)=>'<div class="tl ac" style="--ac:'+c+'"><b>'+v+'</b><span>'+l+inf(k)+'</span></div>';
 const tiles='<div class="tiles">'+tl('#3b82f6',rc.length,'Läufe','s_runs')+tl('#16a34a',Math.round(km)+' km','Umfang','s_km')+tl('#8b5cf6',kmP>0?fp(sec/kmP)+' /km':'–','Ø Pace','s_pace')+tl('#ef4444',ahr?Math.round(ahr)+' bpm':'–','Ø Puls','s_hr')+tl('#f97316',lg?dec(lg,1)+' km':'–','Längster Lauf','s_long')+tl('#0ea5e9',mt?Math.round(mix.easy/mt*100)+' % locker':'–','Intensität','s_mix')+'</div>';
 const mixBar=mt>0?'<div class="mix">'+['easy','q','long','race'].filter(k=>mix[k]>0).map(k=>'<i style="flex:'+mix[k].toFixed(1)+';background:'+KCOL[k]+'" title="'+KIND[k]+'"></i>').join('')+'</div><div class="leg">'+['easy','q','long','race'].filter(k=>mix[k]>0).map(k=>'<span><i style="background:'+KCOL[k]+'"></i>'+KIND[k]+' '+Math.round(mix[k])+' km</span>').join('')+'</div>':'';
 return{tiles,mixBar,rc}}
/* ===== Läufe: Zeitraum & Zonen ===== */
let RR={k:'4'};
const RRN={'4':'Letzte 4 Wochen','8':'Letzte 8 Wochen','12':'Letzte 12 Wochen','26':'Letzte 6 Monate',all:'Alle Läufe',cust:'Eigener Zeitraum'};
function rrBounds(){
 if(RR.k=='all')return{a:'0000-00-00',b:'9999-99-99'};
 if(RR.k=='cust'&&RR.a&&RR.b)return{a:RR.a,b:RR.b};
 const n=+RR.k||4;return{a:iso(addD(today,-(n*7-1))),b:iso(today)}}
const rrLabel=()=>RR.k=='cust'&&RR.a&&RR.b?dshort(RR.a)+'–'+dfull(parse(RR.b)):RRN[RR.k]||RRN['4'];
function rangeSheet(opts,cur,names,apply,title,sub){
 const m=$('#md');m.hidden=false;
 m.innerHTML='<div class="box"><h3>'+title+'</h3><div class="sub">'+sub+'</div><div class="crng" style="flex-direction:column;align-items:stretch">'+opts.map(o=>'<button class="chip '+(cur.k==o?'on':'')+'" data-k="'+o+'">'+names[o]+'</button>').join('')+'</div>'
  +'<div class="f"><label>Von<input type="date" id="ra" value="'+(cur.a||iso(addD(today,-84)))+'"></label><label>Bis<input type="date" id="rb" value="'+(cur.b||iso(today))+'"></label></div><div class="b"><button class="pri" id="rc">Eigenen Zeitraum anwenden</button><button id="rx">Schließen</button></div></div>';
 m.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{m.hidden=true;apply({k:b.dataset.k})});
 $('#rc').onclick=()=>{const a=$('#ra').value,b=$('#rb').value;if(!a||!b||a>b)return;m.hidden=true;apply({k:'cust',a,b})};
 $('#rx').onclick=()=>{m.hidden=true}}
const openRRange=()=>rangeSheet(['4','8','12','26','all'],RR,RRN,s=>{RR=s;rRuns()},'Zeitraum der Läufe','Intensität und die Laufliste passen sich an.');
function zoneStats(R,cx){
 let zt=0;const z=[0,0,0,0,0];
 R.forEach(r=>{if(!(r.sec>0)||!r.hr||!cx.hrmax)return;const pc=r.hr/cx.hrmax*100;zt+=r.sec;z[pc<70?0:pc<80?1:pc<88?2:pc<94?3:4]+=r.sec});
 return{z,zt,hrmax:cx.hrmax||0}}
function zoneCard(Z,label){
 const P=x=>Math.round(x);
 let h='<div class="card"><h3>Intensitätsverteilung'+inf('zones')+'</h3><div class="sub">Nach Herzfrequenz · '+label+'</div>';
 if(!(Z.zt>0))return h+'<div class="mu">Zu wenige Pulsdaten im Zeitraum.</div></div>';
 const z=Z.z.map(x=>x/Z.zt*100),mxp=Math.max(...z,1),hm=Z.hrmax,B=[0,.7,.8,.88,.94,1],NM=['Regeneration','Locker','Tempo','Schwelle','Intervall'];
 const rg=i=>!hm?'':i==0?'bis '+Math.round(hm*.7):i==4?'ab '+Math.round(hm*.94):Math.round(hm*B[i])+'–'+Math.round(hm*B[i+1]);
 h+='<div class="zrw"><div class="zb5" role="img" aria-label="Trainingszeit je Herzfrequenzzone">'
  +z.map((v,i)=>'<div class="zc"><b>'+P(v)+' %</b><div class="zcb"><i class="z'+(i+1)+'" style="height:'+Math.max(v>0?3:0,v/mxp*100).toFixed(1)+'%"></i></div><span class="zcn">Z'+(i+1)+'</span><small>'+NM[i]+'</small>'+(rg(i)?'<small>'+rg(i)+' bpm</small>':'')+'<small>'+(Z.z[i]>0?dur(Z.z[i]):'–')+'</small></div>').join('')
  +'</div><div class="zlg"><span class="tgl">Z1 und Z2 zusammen: '+P(z[0]+z[1])+' % locker</span></div><small class="mu">Zonen nach Ø-Puls je Lauf, in % der höchsten gemessenen Frequenz'+(hm?' ('+Math.round(hm)+' bpm)':'')+'.</small></div>';
 return h+'</div>'}
function rRuns(){
 const Rall=allRuns(),el=$('#runs');
 if(!Rall.length){el.innerHTML='<div class="card"><h3>Analyse</h3><div class="mu" style="margin-top:6px">Noch keine Läufe gefunden. M.oach lädt deine Läufe der letzten 6 Monate aus Intervals.icu. Tippe oben rechts auf den Sync-Status, um erneut abzurufen.</div></div>';return}
 const bd=rrBounds(),R=Rall.filter(r=>r.d>=bd.a&&r.d<=bd.b),cx=rctx(Rall,d=>plan(d,1),true),label=rrLabel();
 const bar='<div class="rtb"><div><b>Zeitraum</b><small>'+R.length+' '+(R.length==1?'Lauf':'Läufe')+'</small></div><button class="rngb" id="rrb">'+label+' ▾</button></div>';
 const zone=zoneCard(zoneStats(R,cx),label);
  const mt={};R.forEach(r=>{const k=r.d.slice(0,7);mt[k]=(mt[k]||0)+r.km});
 let h='',cur='';
 R.slice(0,RUNMAX).forEach((r,i)=>{
  const mk=r.d.slice(0,7);
  if(mk!=cur){cur=mk;const[y,mo]=mk.split('-');h+='<div class="mh2"><b>'+new Date(+y,+mo-1,1).toLocaleDateString('de-DE',{month:'long',year:'numeric'})+'</b><span>'+Math.round(mt[mk])+' km</span></div>'}
  const d=parse(r.d),a=analyzeRun(r,cx);
  h+=runCardH(r,a.kind,DOW[(d.getDay()+6)%7]+', '+d.getDate()+'.'+(d.getMonth()+1)+'.'+(r.t?', '+esc(String(r.t).slice(0,5))+' Uhr':''))});
 el.innerHTML=yearCard()+bar+zone+'<div class="rlh"><h3>Läufe im Zeitraum</h3><div class="sub">Tippe auf einen Lauf für alle Details</div></div>'+(h||'<div class="card mu">Keine Läufe im gewählten Zeitraum.</div>')+(R.length>RUNMAX?'<div class="b"><button id="rmore">Mehr anzeigen ('+(R.length-RUNMAX)+')</button></div>':'');
 wireYear(el);
 const rb=$('#rrb');if(rb)rb.onclick=openRRange;
 const mo=$('#rmore');if(mo)mo.onclick=()=>{RUNMAX+=30;rRuns()}}

/* ===== Coaching (Admin) ===== */
const ADM_HASH='fb5b5a14e224ba0389febb33cc597abab71f30016efd8b75b7ea4d6da412cd85';
function sha256(str){
 const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
 const b=Array.from(new TextEncoder().encode(str)),l=b.length*8;b.push(0x80);while(b.length%64!==56)b.push(0);
 for(let i=7;i>=0;i--)b.push(i>3?0:(l>>>(i*8))&255);
 let h=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
 const R=(x,n)=>(x>>>n)|(x<<(32-n));
 for(let o=0;o<b.length;o+=64){const w=new Array(64);for(let i=0;i<16;i++)w[i]=(b[o+4*i]<<24)|(b[o+4*i+1]<<16)|(b[o+4*i+2]<<8)|b[o+4*i+3];
  for(let i=16;i<64;i++){const s0=R(w[i-15],7)^R(w[i-15],18)^(w[i-15]>>>3),s1=R(w[i-2],17)^R(w[i-2],19)^(w[i-2]>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)|0}
  let[a,b2,c,d,e,f,g,hh]=h;
  for(let i=0;i<64;i++){const S1=R(e,6)^R(e,11)^R(e,25),ch=(e&f)^(~e&g),t1=(hh+S1+ch+K[i]+w[i])|0,S0=R(a,2)^R(a,13)^R(a,22),mj=(a&b2)^(a&c)^(b2&c),t2=(S0+mj)|0;hh=g;g=f;f=e;e=(d+t1)|0;d=c;c=b2;b2=a;a=(t1+t2)|0}
  h=[(h[0]+a)|0,(h[1]+b2)|0,(h[2]+c)|0,(h[3]+d)|0,(h[4]+e)|0,(h[5]+f)|0,(h[6]+g)|0,(h[7]+hh)|0]}
 return h.map(x=>(x>>>0).toString(16).padStart(8,'0')).join('')}
const isAdm=()=>LS.get('moach_adm_'+UID)==='1';
const canCoach=()=>isAdm()||CL.adm===true;
let CBUSY=false;
const CO=()=>S.coach||(S.coach={a:[]});
function mapActs(acts){
 const R=[];for(const a of acts){if(!/Run/.test(a.type||''))continue;
  const k=String(a.start_date_local||'').slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(k))continue;
  R.push({id:a.id,d:k,t:String(a.start_date_local).slice(11,16),n:a.name||'Lauf',km:Math.round((+(a.icu_distance!=null?a.icu_distance:a.distance)||0)/10)/100,sec:+(a.moving_time!=null?a.moving_time:a.elapsed_time)||0,hr:Math.round(+a.average_heartrate)||null,mx:Math.round(+a.max_heartrate)||null,el:Math.round(+a.total_elevation_gain)||null,ld:Math.round(+a.icu_training_load)||null,rpe:+(a.icu_rpe||a.perceived_exertion)||0})}
 return R.sort((x,y)=>(y.d+y.t)<(x.d+x.t)?-1:1)}
async function coachSync(a){
 const key=(a.key||ICU.key||'').trim();
 if(!key)throw new Error('Kein API-Schlüssel: Trage deinen eigenen im Profil ein oder gib einen für den Athleten an.');
 const base='https://intervals.icu/api/v1/athlete/'+encodeURIComponent(a.aid),hd={Authorization:'Basic '+btoa('API_KEY:'+key)};
 let r;try{r=await lifecycle.fetch(base+'/activities?oldest='+iso(addD(today,-7*ICU_WEEKS))+'&newest='+iso(addD(today,1)),{headers:hd})}
 catch(e){throw new Error(navigator.onLine===false?'Offline':'Keine Verbindung zu Intervals.icu')}
 if(r.status==401||r.status==403)throw new Error('Zugang abgelehnt: Der Athlet muss dir Coach-Zugriff geben oder seinen API-Schlüssel nennen.');
 if(!r.ok)throw new Error('Intervals.icu meldet Fehler '+r.status);
 const acts=await r.json();if(!Array.isArray(acts))throw new Error('Unerwartete Antwort von Intervals.icu');
 a.runs=mapActs(acts);
 try{const wr=await lifecycle.fetch(base+'/wellness?oldest='+iso(addD(today,-84))+'&newest='+iso(today),{headers:hd});
  if(wr.ok){const arr=await wr.json(),W={};for(const x of arr){const id=String(x.id||'').slice(0,10);if(!id)continue;W[id]={rhr:x.restingHR||null,hrv:x.hrv||null,sleep:x.sleepSecs?x.sleepSecs/3600:null,ctl:x.ctl!=null?x.ctl:null,atl:x.atl!=null?x.atl:null,rd:x.readiness>0?x.readiness:null,vo2:x.vo2max>0?x.vo2max:null}}a.well=W}}catch(e){}
 a.at=Date.now();store(true)}
const wsr=(W,f,n,z)=>{const o=[];for(let i=n-1;i>=0;i--){const v=(W[iso(addD(today,-i))]||{})[f];o.push(v!=null&&(z||v>0)?+v:null)}return o};
function coachInsights(a){
 const runs=a.runs||[],W=a.well||{},cx=rctx(runs,null,false),dd=n=>iso(addD(today,-n));
 const wk=weeklyKmRuns(runs,26),v=wk.map(x=>x.v),sumR=(a,b)=>runs.filter(r=>r.d>=dd(a)&&r.d<=dd(b)).reduce((t,r)=>t+r.km,0),w0=sumR(6,0),prev=[sumR(13,7),sumR(20,14),sumR(27,21)].filter(x=>x>0),pb=prev.length?mean(prev):null;
 const l28=runs.filter(r=>r.d>=dd(27)),n28=l28.length,last=runs[0];
 const flags=[],talk=[];
 const F=(c,t,q)=>{flags.push({c,t});if(q)talk.push(q)};
 if(!runs.length)F('y','Keine Läufe in den letzten 26 Wochen gefunden.','Gibt es einen Grund für die Pause (Verletzung, Beruf, Motivation)?');
 else{
  const gap=Math.round((today-parse(last.d))/D);
  if(gap>=8)F('r','Seit '+gap+' Tagen kein Lauf.','Was war in den letzten '+gap+' Tagen los? Brauchen wir einen Wiedereinstieg?');
  if(pb&&pb>=15&&w0/pb>1.3)F('r','Umfangssprung: '+Math.round(w0)+' km in den letzten 7 Tagen, '+fmtPct((w0/pb-1)*100)+' zum Schnitt der 3 Wochen davor.','Wie hat sich der Umfangssprung angefühlt? Gab es Beschwerden?');
  else if(pb&&pb>=15&&w0/pb<.6)F('y','Umfang eingebrochen: '+Math.round(w0)+' km, sonst Ø '+Math.round(pb)+' km.','Warum war die letzte Woche so leicht (Plan oder Verhinderung)?');
  else if(pb&&pb>=15&&w0/pb<.8)F('y','Umfang gesunken: '+Math.round(w0)+' km, Schnitt der 3 Wochen davor '+Math.round(pb)+' km.','War die leichtere Woche geplant (Entlastung) oder gab es einen Grund?');
  else if(pb&&pb>=15&&w0/pb>1.15)F('y','Umfang gestiegen: '+Math.round(w0)+' km, Schnitt der 3 Wochen davor '+Math.round(pb)+' km.');
  else if(pb&&w0>0)F('g','Umfang stabil: '+Math.round(w0)+' km, Schnitt der 3 Wochen davor '+Math.round(pb)+' km.');
  let st=0;for(let i=0;i<14;i++){if(runs.some(r=>r.d==dd(i)))st++;else break}
  if(st>=6)F('r',st+' Lauftage in Folge.','Wo sind die freien Tage in der Woche?');
  const vc=v.slice(0,-1),wr=Math.max(0,...vc.slice(1).map((x,i)=>vc[i]>=15?(x/vc[i]-1)*100:0));
  if(wr>30)F('y','Größter Wochensprung der letzten 26 Wochen: '+fmtPct(wr)+'.','Wie plant der Athlet Steigerungen (Richtwert etwa 10 % pro Woche)?');
  const rn=wk.slice(-9,-1).filter(x=>x.v>0).length;
  F(rn>=7?'g':rn>=5?'y':'r','Konstanz: '+rn+' von 8 Wochen mit Läufen.',rn<5?'Was verhindert regelmäßiges Training?':'');
  const mix={easy:0,q:0,long:0,race:0};l28.forEach(r=>{mix[runKind(r,cx,null)]+=r.km});const mt=mix.easy+mix.q+mix.long+mix.race;
  if(mt>20&&mix.q/mt>.3)F('y','Hoher Intensitätsanteil: '+Math.round(mix.q/mt*100)+' % der Kilometer sind schnell, Richtwert etwa 20 %.','Sind die lockeren Läufe wirklich locker?');
 }
 const rh=wsr(W,'rhr',28),hv=wsr(W,'hrv',28),sl=wsr(W,'sleep',14);
 const rc=lastv(rh),rb=mean(rh.slice(0,-3));if(rc!=null&&rb!=null&&rc-rb>=5)F('r','Ruhepuls '+Math.round(rc)+' bpm, Schnitt '+Math.round(rb)+' bpm.','Infekt, Stress oder Übertraining? Der Ruhepuls ist zuletzt erhöht.');
 const hc=lastv(hv),hb=mean(hv.slice(0,-3));if(hc!=null&&hb!=null&&hc<hb*.85)F('r','HRV '+Math.round(hc)+' ms, Schnitt '+Math.round(hb)+' ms.','Die HRV liegt unter dem Schnitt: Wie sind Schlaf und Stress?');
 const sa=mean(sl.slice(-7));if(sa!=null&&sa<6.5)F('y','Schlaf nur Ø '+dec(sa,1)+' h in den letzten 7 Tagen.','Was lässt sich am Schlaf verbessern?');
 const cs=wsr(W,'ctl',42,true),as=wsr(W,'atl',42,true),cl=lastv(cs),al=lastv(as);
 if(cl!=null&&al!=null){const fm=cl-al;if(fm<-30)F('r','Form '+Math.round(fm)+': sehr viel Ermüdung.','Braucht der Athlet eine Entlastungswoche?');else if(fm>10)F('y','Form +'+Math.round(fm)+': sehr frisch, evtl. zu wenig Reiz.','Passt der Wettkampfkalender zum Formverlauf?')}
 const pr=prognAt(runs),pr0=prognAt(runs,dd(28));
 return{runs,W,cx,wk,w0,pb,n28,last,flags,talk,pr,pr0,cs,as,rh,hv,sl,cl,al,rc,rb,hc,hb,sa}}
function coachText(a,I){
 const L=['Coaching-Überblick: '+a.name+' (Stand '+new Date().toLocaleDateString('de-DE')+')',''];
 L.push('Letzte 7 Tage: '+Math.round(I.w0)+' km; Ø 4 Wochen: '+Math.round(mean(I.wk.slice(-5,-1).map(x=>x.v))||0)+' km/Woche; Läufe (28 Tage): '+I.n28);
 if(I.pr[42.195])L.push('Prognosen: '+PD.slice().reverse().filter(x=>I.pr[x[0]]).map(x=>x[1]+' '+(I.pr[x[0]].sec>=3600?ft(I.pr[x[0]].sec):fp(I.pr[x[0]].sec))).join(', '));
 L.push('','Auffälligkeiten:');I.flags.forEach(f=>L.push('- ['+({g:'ok',y:'beachten',r:'Achtung'})[f.c]+'] '+f.t));
 L.push('','Gesprächsthemen:');I.talk.filter(Boolean).forEach(t=>L.push('- '+t));
 return L.join('\n')}
/* ===== Coaching: Anfragen auf diesem Gerät ===== */
const REQ_K='moach_coach_req';
const getReq=()=>{try{return JSON.parse(LS.get(REQ_K)||'[]')||[]}catch(e){return[]}};
const setReq=a=>LS.set(REQ_K,JSON.stringify(a));
const reqOf=(from,to)=>getReq().find(r=>r.from===from&&r.to===to);
const uname=id=>{const u=USERS.find(x=>x.id===id);return u?(u.name||'Läufer'):'Unbekannt'};
const pendingForMe=()=>getReq().filter(r=>r.to===UID&&r.st==='p'&&USERS.some(u=>u.id===r.from));
const coachesOfMe=()=>getReq().filter(r=>r.to===UID&&r.st==='a'&&USERS.some(u=>u.id===r.from));
function reqSend(to){const a=getReq().filter(r=>!(r.from===UID&&r.to===to));a.push({id:'r'+Date.now().toString(36),from:UID,to,st:'p',at:Date.now()});setReq(a)}
function reqSet(from,to,st){const a=getReq(),r=a.find(x=>x.from===from&&x.to===to);if(r){r.st=st;r.at=Date.now()}setReq(a)}
function reqDel(from,to){setReq(getReq().filter(r=>!(r.from===from&&r.to===to)))}
function localAthlete(uid){
 let st=null;try{st=JSON.parse(LS.get('mplan2_'+uid)||'null')}catch(e){}
 if(!st)return null;
 const a=athleteFromState(st,uname(uid));a.local=true;return a}
function wireInbox(el){
 el.querySelectorAll('[data-ra]').forEach(b=>b.onclick=()=>{reqSet(b.dataset.ra,UID,'a');render()});
 el.querySelectorAll('[data-rd]').forEach(b=>b.onclick=()=>{reqSet(b.dataset.rd,UID,'d');render()});
 wireInboxCloud(el)}
function coachCard(){
 const P=pendingForMe(),A=coachesOfMe(),CP=cloudPending(),CA=cloudCoaches();if(!P.length&&!A.length&&!CP.length&&!CA.length)return'';
 const av=n=>'<div class="av">'+esc(n.slice(0,1).toUpperCase())+'</div>';
 return'<div class="card"><h3>Coaching</h3><div class="sub">Wer deine Trainingsdaten sehen darf</div>'
  +P.map(r=>'<div class="ur">'+av(uname(r.from))+'<div class="um"><b>'+esc(uname(r.from))+'</b><small>Anfrage wartet auf deine Antwort</small></div><div class="ua"><button class="pri" data-ra="'+esc(r.from)+'">Bestätigen</button><button data-rd="'+esc(r.from)+'">Ablehnen</button></div></div>').join('')
  +A.map(r=>'<div class="ur">'+av(uname(r.from))+'<div class="um"><b>'+esc(uname(r.from))+'</b><small>Coach · sieht deine Läufe und Wellness-Daten</small></div><div class="ua"><button data-rx="'+esc(r.from)+'">Zugriff beenden</button></div></div>').join('')
  +CP.map(r=>'<div class="ur">'+av(cname(r.coach_id))+'<div class="um"><b>'+esc(cname(r.coach_id))+'</b><small>Cloud · Anfrage wartet auf deine Antwort</small></div><div class="ua"><button class="pri" data-cra="'+esc(r.id)+'">Bestätigen</button><button data-crd="'+esc(r.id)+'">Ablehnen</button></div></div>').join('')
  +CA.map(r=>'<div class="ur">'+av(cname(r.coach_id))+'<div class="um"><b>'+esc(cname(r.coach_id))+'</b><small>Cloud-Coach · sieht deine Läufe und Wellness-Daten</small></div><div class="ua"><button data-crx="'+esc(r.id)+'">Zugriff beenden</button></div></div>').join('')+'</div>'}
function wireCoachCard(){
 const e=$('#set');wireInbox(e);
 e.querySelectorAll('[data-rx]').forEach(b=>b.onclick=()=>{reqDel(b.dataset.rx,UID);render();showTab('set')});
 e.querySelectorAll('[data-crx]').forEach(b=>b.onclick=()=>{cloudRun(b,()=>cloudDelReq(b.dataset.crx)).then(()=>{render();showTab('set')})})}
let CSEL={t:'',id:'',i:0};
function rCoach(){
 const el=$('#coach');if(!el||!canCoach())return;
 const C=CO(),A=C.a,others=USERS.filter(u=>u.id!==UID);
 const stTxt={p:'Angefragt · wartet auf Bestätigung',a:'Bestätigt · Daten verfügbar',d:'Hat abgelehnt'};
 const urow=u=>{const rq=reqOf(UID,u.id),st=rq?rq.st:null,sel=CSEL.t=='u'&&CSEL.id==u.id;
  const act=!st?'<button class="pri" data-rq="'+esc(u.id)+'">Anfragen</button>':st=='p'?'<button data-rw="'+esc(u.id)+'">Zurückziehen</button>':st=='a'?'<button class="'+(sel?'pri':'')+'" data-rv="'+esc(u.id)+'">'+(sel?'Angezeigt':'Ansehen')+'</button>':'<button data-rq="'+esc(u.id)+'">Erneut anfragen</button>';
  return'<div class="ur'+(sel?' sel':'')+'"><div class="av">'+esc((u.name||'L').slice(0,1).toUpperCase())+'</div><div class="um"><b>'+esc(u.name||'Läufer')+'</b><small class="st-'+(st||'n')+'">'+(stTxt[st]||'Noch nicht angefragt')+'</small></div><div class="ua">'+act+'</div></div>'};
 const users='<div class="card"><h3>Athleten auf diesem Gerät</h3><div class="sub">Wähle, wen du coachen möchtest. Der Athlet bekommt die Anfrage in seiner App und muss sie bestätigen. Erst danach siehst du seine Daten.</div>'+(others.length?others.map(urow).join(''):'<div class="mu" style="padding:8px 0">Auf diesem Gerät gibt es noch keine weiteren Konten. Lege über Profil → Abmelden ein neues Konto an.</div>')+'</div>';
 const chips=A.map((x,i)=>'<button class="chip '+(CSEL.t=='x'&&CSEL.i==i?'on':'')+'" data-cx="'+i+'">'+esc(x.name)+'</button>').join('')+'<button class="chip" id="cadd">＋ Extern hinzufügen</button>';
 const ext='<div class="card"><h3>Andere Geräte (über Intervals.icu)</h3><div class="sub">Athleten auf anderen Geräten gibst du in Intervals.icu frei (Coach-Zugriff). Hier trägst du ihre Athlete-ID ein.</div><div class="cr">'+chips+'</div></div>';
 const form='<div class="card" id="cform" hidden><h3>Athlet hinzufügen</h3><div class="sub">Der Athlet gibt dir in Intervals.icu Coach-Zugriff. Dann genügt seine Athlete-ID und dein eigener API-Schlüssel. Alternativ trägst du seinen API-Schlüssel ein.</div><div class="f"><label>Name<input id="can" placeholder="z. B. Anna"></label><label>Athlete-ID<input id="cai" placeholder="z. B. i123456"></label><label>API-Schlüssel (optional)<input id="cak" type="password" autocomplete="off" placeholder="leer = dein Schlüssel"></label></div><div id="caerr" class="aerr" hidden></div><div class="b"><button class="pri" id="cago">Hinzufügen &amp; laden</button></div><small>Die Daten bleiben nur in diesem Browser. Hol dir vorher das Einverständnis des Athleten.</small></div>';
 const head='<div class="card"><h3>Coaching'+inf('co')+'</h3><div class="sub">Insights deiner Athleten als Gesprächsgrundlage. Nur für dich sichtbar.</div></div>';
 let a=null,ex=false;
 if(CSEL.t=='u'){const rq=reqOf(UID,CSEL.id);if(rq&&rq.st=='a')a=localAthlete(CSEL.id);if(!a)CSEL={t:'',id:'',i:0}}
 else if(CSEL.t=='x'){a=A[CSEL.i]||null;ex=true;if(!a)CSEL={t:'',id:'',i:0}}
 else if(CSEL.t=='c'){const rq=cloudReqOf(CSEL.id);if(rq&&rq.status=='accepted')a=cloudAthlete(CSEL.id);if(!a)CSEL={t:'',id:'',i:0}}
 if(!a){el.innerHTML=head+cusers()+users+ext+form+'<div class="card"><div class="mu">Wähle oben einen bestätigten Athleten, um seine Daten zu sehen.</div></div>';wireCoach();return}
 if(a.empty){el.innerHTML=head+cusers()+users+ext+form+'<div class="card"><h3>'+esc(a.name)+'</h3><div class="sub">Der Athlet hat bestätigt. Seine App lädt die Daten beim nächsten Öffnen hoch.</div><div class="b"><button class="rngb" id="cref">Neu laden</button></div></div>';wireCoach(a,null,false);return}
 const I=coachInsights(a),tl=(c,v,l,k)=>'<div class="tl ac" style="--ac:'+c+'"><b>'+v+'</b><span>'+l+(k?inf(k):'')+'</span></div>';
 const m=I.pr[42.195],m0=I.pr0[42.195];
 const ln=lineSvg(I.wk,'#7c5cd6',340,150,'c'),V=runsView(I.runs,I.cx);
 const spk=(lab,vals,unit,f)=>{const c=lastv(vals);return c==null?'':'<div class="tr neu" style="cursor:default"><div class="tx"><div class="tn">'+lab+'</div><div class="tv"><b>'+f(c)+'</b> '+unit+'</div></div>'+spark(vals.slice(-14))+'</div>'};
 const stand=a.at?new Date(a.at).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):(a.local?'noch nie synchronisiert':'noch nicht geladen');
 const sum='<div class="card" id="csum"><div class="oh"><h3>'+esc(a.name)+'</h3>'+(ex||a.cloud?'<button class="rngb" id="cref">'+(CBUSY?'lädt …':'Aktualisieren')+'</button>':'<button class="rngb" id="cref">Neu laden</button>')+'</div><div class="sub">'+(a.local?'Letzte Synchronisation des Athleten: ':'Stand: ')+stand+' · '+I.runs.length+' Läufe aus 26 Wochen</div><div id="cer" class="aerr" hidden></div>'
  +'<div class="tiles">'+tl('#16a34a',Math.round(I.w0)+' km','Letzte 7 Tage')+tl('#3b82f6',Math.round(mean(I.wk.slice(-5,-1).map(x=>x.v))||0)+' km','Ø 4 Wochen')+tl('#f97316',I.n28,'Läufe (28 T)')+tl('#8b5cf6',m?ft(m.sec):'–','Marathon-Prognose','prog')+tl('#0ea5e9',I.cl!=null?Math.round(I.cl):'–','Fitness (CTL)','t_ctl')+tl('#ef4444',I.cl!=null&&I.al!=null?Math.round(I.cl-I.al):'–','Form','t_form')+'</div>'
  +(m&&m0?'<small>Prognose '+(m.sec<m0.sec-20?fp(m0.sec-m.sec)+' min schneller':m.sec>m0.sec+20?fp(m.sec-m0.sec)+' min langsamer':'unverändert')+' gegenüber vor 4 Wochen.</small>':'')+'</div>';
 const fl='<div class="card"><h3>Auffälligkeiten</h3><div class="sub">Ampel aus den Daten des Athleten</div>'+I.flags.map(f=>'<div class="an a-'+f.c+'">'+f.t+'</div>').join('')+'</div>';
 const tk=I.talk.filter(Boolean);
 const talk='<div class="card"><h3>Gesprächsthemen</h3><div class="sub">Vorschläge für das Coaching-Gespräch</div>'+(tk.length?'<div class="an nx"><ul>'+tk.map(t=>'<li>'+t+'</li>').join('')+'</ul></div>':'<div class="an a-g">Keine Auffälligkeiten. Frag nach Zielen, Terminen und dem Gefühl im Training.</div>')+'<div class="b"><button id="ccp">Zusammenfassung kopieren</button></div></div>';
 const chart='<div class="card"><h3>Wochenumfang</h3><div class="sub">Letzte 26 Wochen · Ø '+Math.round(ln.avg)+' km (gestrichelt)</div>'+ln.svg+V.mixBar+'</div>';
 const well=(spk('Ruhepuls',I.rh,'bpm',Math.round)+spk('HRV',I.hv,'ms',Math.round)+spk('Schlaf',I.sl,'h',v=>dec(v,1)))||'<div class="mu">Keine Wellness-Daten (Ruhepuls, HRV, Schlaf) gefunden.</div>';
 const wl='<div class="card"><h3>Erholung</h3><div class="sub">Trend der letzten 14 Tage aus Intervals.icu</div>'+well+'</div>';
 const rl=I.runs.slice(0,5).map(r=>{const an=analyzeRun(r,I.cx),d=parse(r.d);return'<div class="run" style="--kc:'+KCOL[an.kind]+'"><div class="cl"><div class="rd"><b>'+DOW[(d.getDay()+6)%7]+'</b><span>'+d.getDate()+'.</span></div><div class="rm"><div class="rn">'+esc(r.n)+'</div><small><span class="kt" style="background:'+KCOL[an.kind]+'">'+KIND[an.kind]+'</span> '+(r.sec?dur(r.sec):'–')+(an.pc?' · '+fp(an.pc)+' /km':'')+(r.hr?' · '+r.hr+' bpm':'')+'</small></div><span class="vd v-'+an.v.c+'">'+an.v.t+'</span><div class="rk"><b>'+dec(r.km,1)+'</b><span>km</span></div></div><small>'+(an.bad.length?an.bad[0].t:an.good[0])+'</small></div>'}).join('');
 const runsC='<div class="card"><h3>Letzte Läufe</h3>'+(rl||'<div class="mu">Keine Läufe.</div>')+'<div class="b"><button id="crm" class="chip">'+(ex?'Athlet entfernen':'Zugriff beenden')+'</button></div></div>';
 el.innerHTML=head+cusers()+users+ext+form+sum+fl+talk+chart+wl+runsC;wireCoach(a,I,ex)}
function wireCoach(a,I,ex){
 const el=$('#coach');
 el.querySelectorAll('[data-rq]').forEach(b=>b.onclick=()=>{reqSend(b.dataset.rq);rCoach()});
 el.querySelectorAll('[data-rw]').forEach(b=>b.onclick=()=>{reqDel(UID,b.dataset.rw);if(CSEL.id==b.dataset.rw)CSEL={t:'',id:'',i:0};rCoach()});
 el.querySelectorAll('[data-rv]').forEach(b=>b.onclick=()=>{CSEL={t:'u',id:b.dataset.rv,i:0};rCoach();const c=document.getElementById('csum');if(c)c.scrollIntoView({behavior:'smooth'})});
 el.querySelectorAll('[data-cx]').forEach(b=>b.onclick=()=>{CSEL={t:'x',id:'',i:+b.dataset.cx};rCoach()});
 el.querySelectorAll('[data-cq]').forEach(b=>b.onclick=async()=>{await cloudRun(b,()=>cloudAsk(b.dataset.cq));rCoach()});
 el.querySelectorAll('[data-cw]').forEach(b=>b.onclick=async()=>{const rq=cloudReqOf(b.dataset.cw);if(rq)await cloudRun(b,()=>cloudDelReq(rq.id));if(CSEL.id==b.dataset.cw)CSEL={t:'',id:'',i:0};rCoach()});
 el.querySelectorAll('[data-cv]').forEach(b=>b.onclick=async()=>{CSEL={t:'c',id:b.dataset.cv,i:0};rCoach();await cloudRun(null,()=>cloudFetchShared(CSEL.id));rCoach();const c=document.getElementById('csum');if(c)c.scrollIntoView({behavior:'smooth'})});
 const ad=$('#cadd');if(ad)ad.onclick=()=>{const f=$('#cform');f.hidden=!f.hidden;if(!f.hidden)f.scrollIntoView({behavior:'smooth'})};
 const go=$('#cago');
 if(go)go.onclick=async()=>{
  const err=m=>{const e=$('#caerr');e.textContent=m;e.hidden=!m},nm=$('#can').value.trim(),aid=$('#cai').value.trim(),key=$('#cak').value.trim();
  err('');if(!nm||!aid)return err('Bitte Name und Athlete-ID eingeben.');
  const x={aid,name:nm,key,runs:[],well:{}};go.disabled=true;go.textContent='Lade …';
  try{await coachSync(x);const C=CO();C.a.push(x);CSEL={t:'x',id:'',i:C.a.length-1};save();rCoach()}catch(e){err(e.message);go.disabled=false;go.textContent='Hinzufügen & laden'}};
 const rf=$('#cref');
 if(rf)rf.onclick=async()=>{if(a&&a.cloud){await cloudRun(rf,()=>cloudFetchShared(CSEL.id));rCoach();return}if(!ex){rCoach();return}if(CBUSY)return;CBUSY=true;rf.textContent='lädt …';
  try{await coachSync(a);CBUSY=false;rCoach()}catch(e){CBUSY=false;rCoach();const er=$('#cer');if(er){er.textContent=e.message;er.hidden=false}}};
 const rm=$('#crm');if(rm){let c=0;rm.onclick=()=>{if(!c){c=1;rm.textContent='Wirklich? Nochmal tippen';return}if(a&&a.cloud){const rq=cloudReqOf(CSEL.id);CSEL={t:'',id:'',i:0};(rq?cloudRun(null,()=>cloudDelReq(rq.id)):Promise.resolve()).then(rCoach);rCoach();return}if(ex)CO().a.splice(CSEL.i,1);else reqDel(UID,CSEL.id);CSEL={t:'',id:'',i:0};save();rCoach()}}
 const cp=$('#ccp');if(cp)cp.onclick=()=>{const t=coachText(a,I);const done=()=>{cp.textContent='✓ Kopiert'};
  try{navigator.clipboard.writeText(t).then(done,()=>{prompt('Text kopieren:',t)})}catch(e){prompt('Text kopieren:',t)}}}

/* ===== Cloud (Supabase): Funktionen ===== */
const sbMsg=t=>{t=String(t||'');
 if(/invalid login/i.test(t))return'E-Mail oder Passwort stimmt nicht.';
 if(/already registered|already been registered/i.test(t))return'Diese E-Mail ist schon registriert. Bitte melde dich an.';
 if(/at least \d+ char|weak|password should/i.test(t))return'Das Passwort ist zu kurz oder zu schwach (mindestens 8 Zeichen).';
 if(/not confirmed/i.test(t))return'Bitte bestätige zuerst deine E-Mail-Adresse (Link in der Mail) und melde dich dann an.';
 if(/rate limit|too many/i.test(t))return'Zu viele Versuche. Bitte warte kurz und versuche es erneut.';
 if(/valid email|invalid.*email|unable to validate email/i.test(t))return'Bitte gib eine gültige E-Mail-Adresse ein.';
 if(/row-level security|permission denied/i.test(t))return'Keine Berechtigung. Ist dein Konto in der Datenbank als Coach freigeschaltet?';
 if(/jwt/i.test(t))return'Anmeldung abgelaufen. Bitte melde dich neu an.';
 if(/signups? (not allowed|.*disabled)/i.test(t))return'Die Registrierung ist auf dem Server ausgeschaltet.';
 return t};
async function sbCall(path,o){o=o||{};const c=SBC(),h={apikey:c.key,'Content-Type':'application/json'};
 if(o.tok)h.Authorization='Bearer '+o.tok;if(o.h)Object.assign(h,o.h);
 let r;try{r=await lifecycle.fetch(c.url+path,{method:o.m||'GET',headers:h,body:o.b!==undefined?JSON.stringify(o.b):undefined})}
 catch(e){throw new Error(navigator.onLine===false?'Offline':'Server nicht erreichbar')}
 let j=null;const tx=await r.text();if(tx){try{j=JSON.parse(tx)}catch(e){j=tx}}
 if(!r.ok){const m=j&&typeof j=='object'?(j.error_description||j.msg||j.message||j.error):j;const er=new Error(sbMsg(m||('Fehler '+r.status)));er.status=r.status;throw er}
 return j}
const sbFromAuth=(j,old)=>({at:j.access_token,rt:j.refresh_token,exp:Date.now()+((+j.expires_in||3600)*1000),uid:(j.user&&j.user.id)||(old&&old.uid),email:(j.user&&j.user.email)||(old&&old.email)});
function sbSesSet(s){CL.ses=s;if(s)LS.set('moach_sbs_'+UID,JSON.stringify(s));else LS.del('moach_sbs_'+UID)}
async function sbTok(){
 let s=CL.ses;if(!s)throw new Error('Nicht in der Cloud angemeldet');
 if(s.exp-Date.now()<60000){
  try{const j=await sbCall('/auth/v1/token?grant_type=refresh_token',{m:'POST',b:{refresh_token:s.rt}});s=sbFromAuth(j,s);sbSesSet(s)}
  catch(e){if(e.status>=400&&e.status<500){sbSesSet(null);CL.pulled=false;throw new Error('Anmeldung abgelaufen. Bitte melde dich im Profil neu an.')}throw e}}
 return s.at}
async function sbRest(path,o){o=o||{};const p='/rest/v1/'+path;
 try{return await sbCall(p,Object.assign({},o,{tok:await sbTok()}))}
 catch(e){if(e.status==401&&CL.ses){CL.ses.exp=0;return sbCall(p,Object.assign({},o,{tok:await sbTok()}))}throw e}}
const PREF=v=>({Prefer:v});
async function cloudAuth(mode,email,pw,name){
 let j;
 if(mode=='up'){j=await sbCall('/auth/v1/signup',{m:'POST',b:{email,password:pw,data:{name}}});if(!j||!j.access_token)return{pending:true}}
 else j=await sbCall('/auth/v1/token?grant_type=password',{m:'POST',b:{email,password:pw}});
 sbSesSet(sbFromAuth(j));return{ok:true}}
async function cloudProfile(){
 const u=CL.ses.uid,pn=((S.prof&&S.prof.name)||'').trim(),nm=(pn||'Läufer').slice(0,60);
 const rows=await sbRest('profiles?select=id,name&id=eq.'+u);
 if(!rows.length)await sbRest('profiles?on_conflict=id',{m:'POST',h:PREF('resolution=ignore-duplicates,return=minimal'),b:{id:u,name:nm}});
 else if(pn&&rows[0].name!==nm)await sbRest('profiles?id=eq.'+u,{m:'PATCH',h:PREF('return=minimal'),b:{name:nm}});
 try{CL.adm=(await sbRest('rpc/is_admin',{m:'POST',b:{}}))===true}catch(e){CL.adm=false}}
async function cloudRow(){const r=await sbRest('user_data?select=state,modified,updated_at&user_id=eq.'+CL.ses.uid);return r&&r[0]||null}
const cloudState=()=>{const st=Object.assign({},S);delete st.coach;return st};
const stSig=st=>JSON.stringify(st,(k,v)=>k==='_m'?undefined:v);
function cloudAdopt(st,m){const keep=S.coach;S=Object.assign(DEF(),st);if(keep)S.coach=keep;S._m=m;START=parse(S.start||'2026-10-12');
 const u=USERS.find(x=>x.id===UID);if(u&&S.prof&&S.prof.name&&u.name!==S.prof.name){u.name=S.prof.name;LS.set('moach_users',JSON.stringify(USERS))}
 store(true);CL.sig=stSig(cloudState());icuSyncState(true).catch(()=>{})}
async function cloudCatchUp(){const row=await cloudRow();if(row&&+row.modified>(+S._m||0)){cloudAdopt(row.state,+row.modified);CL.bak=+row.modified;CL.bakAt=Date.parse(row.updated_at)||Date.now();render()}}
async function cloudPush(force){
 if(!sbOn()||!CL.ses||!CL.pulled||CL.pushing)return;
 const st=cloudState(),sig=stSig(st);
 if(force||sig!==CL.sig){
  CL.pushing=1;
  try{const m=S._m||(S._m=Date.now()),u=CL.ses.uid;
   /* nur überschreiben, wenn die Cloud nicht neuer ist */
   const up=await sbRest('user_data?user_id=eq.'+u+'&modified=lte.'+m+'&select=modified',{m:'PATCH',h:PREF('return=representation'),b:{state:st,modified:m}});
   if(!(up&&up.length)){
    try{await sbRest('user_data',{m:'POST',h:PREF('return=minimal'),b:{user_id:u,state:st,modified:m}})}
    catch(e){if(e.status==409){CL.pushing=0;await cloudCatchUp();return}throw e}}
   CL.sig=sig;CL.bak=m;CL.bakAt=Date.now();CL.err=''}
  catch(e){CL.err=e.message;CL.pushing=0;return}
  CL.pushing=0}
 await cloudShare(false).catch(e=>{CL.err=e.message})}
function cloudSoon(){if(!sbOn()||!CL.ses)return;clearTimeout(CL.t);CL.t=setTimeout(()=>{cloudPush().catch(()=>{})},6000)}
/* geteilte Daten (nur nach Bestätigung durch den Athleten) */
function athleteFromState(st,name){
 const R=(st.runs||[]).map(x=>Object.assign({},x)),have=new Set(R.map(r=>r.d));
 for(const k in (st.log||{})){const l=st.log[k];if(l&&l.done&&!have.has(k)&&+l.km>0)R.push({id:'m'+k,d:k,t:'',n:'Manueller Eintrag',km:+l.km,sec:(+l.min||0)*60,rpe:+l.rpe||0,manual:true})}
 R.sort((a,b)=>(b.d+(b.t||''))<(a.d+(a.t||''))?-1:1);
 return{name,runs:R,well:st.well||{},at:st.syncAt||null}}
function sharePayload(){
 const a=athleteFromState(S,(S.prof&&S.prof.name)||'Läufer'),lo=iso(addD(today,-7*26)),lw=iso(addD(today,-84));
 const runs=a.runs.filter(r=>r.d>=lo).map(r=>({id:r.id,d:r.d,t:r.t||'',n:r.n,km:r.km,sec:r.sec,hr:r.hr||null,mx:r.mx||null,el:r.el||null,ld:r.ld||null,rpe:r.rpe||0,manual:!!r.manual}));
 const W={};for(const k in a.well){if(k>=lw){const w=a.well[k]||{};W[k]={rhr:w.rhr,hrv:w.hrv,sleep:w.sleep,ctl:w.ctl,atl:w.atl}}}
 return{v:1,name:a.name,runs,well:W,race:S.race,rd:S.rd||42.195,goal:S.goal,hasPlan:!S.noPlan,sync:S.syncAt||null}}
async function cloudShare(force){
 if(!CL.ses||!CL.reqs||!cloudCoaches().length)return;
 const pl=sharePayload(),sig=JSON.stringify(pl,(k,v)=>k==='sync'?undefined:v);
 if(!force&&sig===CL.shSig)return;
 await sbRest('shared_data?on_conflict=athlete_id',{m:'POST',h:PREF('resolution=merge-duplicates,return=minimal'),b:{athlete_id:CL.ses.uid,payload:pl}});
 CL.shSig=sig}
/* Anfragen */
const cloudMe=()=>CL.ses?CL.ses.uid:null;
const cloudPending=()=>cloudMe()?(CL.reqs||[]).filter(r=>r.athlete_id===cloudMe()&&r.status==='pending'):[];
const cloudCoaches=()=>cloudMe()?(CL.reqs||[]).filter(r=>r.athlete_id===cloudMe()&&r.status==='accepted'):[];
const cloudReqOf=aid=>cloudMe()?(CL.reqs||[]).find(r=>r.coach_id===cloudMe()&&r.athlete_id===aid):null;
const cname=id=>CL.names[id]||'Unbekannt';
async function cloudReqs(){
 const rows=await sbRest('coach_requests?select=id,coach_id,athlete_id,status,created_at,updated_at&order=created_at.desc');
 let pr=[];try{pr=await sbRest('profiles?select=id,name&order=name')}catch(e){}
 CL.names={};pr.forEach(p=>CL.names[p.id]=p.name);
 const sig=JSON.stringify([rows,CL.names]),ch=sig!==CL.rsig;CL.rsig=sig;CL.reqs=rows;return ch}
async function cloudAsk(aid){
 const ex=cloudReqOf(aid);
 if(ex)await sbRest('coach_requests?id=eq.'+ex.id,{m:'PATCH',h:PREF('return=minimal'),b:{status:'pending'}});
 else await sbRest('coach_requests',{m:'POST',h:PREF('return=minimal'),b:{coach_id:CL.ses.uid,athlete_id:aid}});
 await cloudReqs()}
async function cloudAnswer(id,st){
 await sbRest('coach_requests?id=eq.'+id,{m:'PATCH',h:PREF('return=minimal'),b:{status:st}});
 await cloudReqs();if(st=='accepted')await cloudShare(true)}
async function cloudDelReq(id){await sbRest('coach_requests?id=eq.'+id,{m:'DELETE',h:PREF('return=minimal')});await cloudReqs()}
async function cloudFetchShared(aid){
 const rows=await sbRest('shared_data?select=athlete_id,payload,updated_at&athlete_id=eq.'+aid),r=rows&&rows[0];
 return CL.shared[aid]=r?{p:r.payload,at:r.updated_at}:{p:null,at:null}}
function cloudAthlete(aid){
 const x=CL.shared[aid],nm=cname(aid);
 if(!x||!x.p)return{name:nm,runs:[],well:{},at:null,cloud:true,empty:true};
 const p=x.p;return{name:p.name||nm,runs:p.runs||[],well:p.well||{},at:p.sync||(x.at?Date.parse(x.at):null),cloud:true}}
async function cloudRun(btn,fn,errEl){
 const t=btn&&btn.textContent;if(btn)btn.disabled=true;
 try{await fn();if(errEl)errEl.hidden=true;return true}
 catch(e){if(errEl){errEl.textContent=e.message;errEl.hidden=false}else CL.err=e.message;return false}
 finally{if(btn){btn.disabled=false;if(t)btn.textContent=t}}}
/* Start, Abgleich, Abmelden */
async function cloudInit(){
 if(!sbOn()||!CL.ses)return;
 try{
  await cloudProfile();
  const row=await cloudRow();
  if(!row){CL.pulled=true;await icuSyncState(false).catch(()=>{});await cloudPush(true)}
  else{const cm=+row.modified||0,lm=+S._m||0;CL.bak=cm;CL.bakAt=Date.parse(row.updated_at)||0;if(cm>lm)cloudAdopt(row.state,cm);CL.pulled=true;if(cm<=lm)await icuSyncState(false).catch(()=>{});if(cm<lm)await cloudPush(true)}
  await cloudReqs();await cloudShare(false);CL.err=''}
 catch(e){CL.err=e.message}
 navCoach();render()}
async function cloudAfterLogin(pw){
 CL.pulled=false;CL.choice=null;CL.reqs=null;CL.sig='';CL.shSig='';CL.rsig='';CL.icuRe=0;
 await cloudProfile();
 const row=await cloudRow();
 if(pw)await icuLogin(pw,row&&row.state&&row.state.icuc).catch(()=>{});
 if(!row){CL.pulled=true;if(!S._m)S._m=Date.now();store(true);await icuSyncState(false).catch(()=>{});await cloudPush(true)}
 else if(+row.modified===+S._m){CL.pulled=true;CL.bak=+row.modified}
 else CL.choice={row};
 if(CL.pulled){await icuSyncState(false).catch(()=>{});await cloudReqs().catch(()=>{});await cloudShare(false).catch(()=>{})}
 navCoach();render()}
function cloudReset(){clearTimeout(CL.t);CL.adm=null;CL.reqs=null;CL.names={};CL.shared={};CL.pulled=false;CL.choice=null;CL.sig='';CL.shSig='';CL.rsig='';CL.err='';CSEL={t:'',id:'',i:0}}
async function cloudOut(){if(pushSupported()&&Notification.permission==='granted')try{await pushOff()}catch(e){}try{if(CL.ses)await sbCall('/auth/v1/logout',{m:'POST',tok:CL.ses.at})}catch(e){}LS.del(ckKey());sbSesSet(null);cloudReset();navCoach();render();showTab('set')}
async function cloudDelete(){await sbRest('rpc/delete_my_account',{m:'POST',b:{}});LS.del(ckKey());sbSesSet(null);cloudReset();navCoach();render();showTab('set')}
async function cloudTick(){
 if(!sbOn()||!CL.ses||document.hidden||CL.busy||!CL.pulled)return;
 CL.busy=1;
 try{
  if(!PUSH.rs){PUSH.rs=1;pushResync().catch(()=>{})}
  const rows=await sbRest('user_data?select=modified&user_id=eq.'+CL.ses.uid),cm=rows&&rows[0]?+rows[0].modified:0;
  if(cm>(+S._m||0)){const row=await cloudRow();if(row){cloudAdopt(row.state,+row.modified);render()}}
  const ch=await cloudReqs();let sh=false;
  if(CSEL.t=='c'){const o=CL.shared[CSEL.id],n=await cloudFetchShared(CSEL.id);sh=!o||o.at!==n.at}
  if(ch||sh){badges();publishToday();const as=document.activeElement;if(!(as&&$('#set').contains(as)))rSet();rCoach()}
  await cloudShare(false);CL.err=''}
 catch(e){CL.err=e.message}
 finally{CL.busy=0}}
/* Passwort vergessen / zurücksetzen */
async function cloudRecover(email){
 email=(email||'').trim();if(!email)throw new Error('Bitte gib oben deine E-Mail-Adresse ein.');
 const back=encodeURIComponent(location.origin+location.pathname);
 await sbCall('/auth/v1/recover?redirect_to='+back,{m:'POST',b:{email}})}
function cloudRecoveryDialog(){
 const h=location.hash||'';if(!/(^#|&)(type=recovery|error_description=)/.test(h)||!sbOn())return;
 const p=new URLSearchParams(h.replace(/^#/,''));try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}
 const m=$('#md');m.hidden=false;
 if(!p.get('access_token')){m.innerHTML='<div class="box"><h3>Link nicht mehr gültig</h3><div class="sub">Der Link zum Zurücksetzen ist abgelaufen oder wurde schon benutzt. Fordere unter „Passwort vergessen?“ einen neuen an.</div><div class="b"><button class="pri" id="rcx">Schließen</button></div></div>';$('#rcx').onclick=()=>{m.hidden=true};return}
 const tok=p.get('access_token');
 m.innerHTML='<div class="box"><h3>Neues Passwort festlegen</h3><div class="sub">Wähle ein Passwort mit mindestens 8 Zeichen für dein Cloud-Konto.</div><div class="f"><label>Neues Passwort<input id="rcp" type="password" autocomplete="new-password"></label><label>Wiederholen<input id="rcq" type="password" autocomplete="new-password"></label></div><div id="rce" class="aerr" hidden></div><div class="b"><button class="pri" id="rcs">Passwort speichern</button><button id="rcx">Abbrechen</button></div></div>';
 $('#rcx').onclick=()=>{m.hidden=true};
 $('#rcs').onclick=()=>{const e=$('#rce');cloudRun($('#rcs'),async()=>{const a=$('#rcp').value||'',b=$('#rcq').value||'';
   if(a.length<8)throw new Error('Das Passwort braucht mindestens 8 Zeichen.');if(a!==b)throw new Error('Die beiden Passwörter sind nicht gleich.');
   await sbCall('/auth/v1/user',{m:'PUT',tok,b:{password:a}});
   m.innerHTML='<div class="box"><h3>Passwort geändert</h3><div class="sub">Du kannst dich jetzt mit dem neuen Passwort anmelden.</div><div class="b"><button class="pri" id="rcx">Weiter</button></div></div>';$('#rcx').onclick=()=>{m.hidden=true}},e)}}
/* ===== Intervals.icu-Zugang verschlüsselt mit dem Cloud-Konto sichern ===== */
/* AES-GCM; der Schlüssel entsteht per PBKDF2 aus dem Cloud-Passwort (Salt liegt beim Chiffrat). Der Server sieht nur Chiffrat. */
const HASC=!!(window.crypto&&crypto.subtle&&crypto.getRandomValues);
const B64=b=>btoa(String.fromCharCode.apply(null,new Uint8Array(b))),UB64=t=>Uint8Array.from(atob(t),c=>c.charCodeAt(0));
const ckKey=()=>'moach_ck_'+UID;
function ckGet(){try{const x=JSON.parse(LS.get(ckKey())||'null');return x&&x.s&&x.k?x:null}catch(e){return null}}
async function icuDerive(pw,salt){const km=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveBits']);
 return B64(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:UB64(salt),iterations:200000},km,256))}
const icuAes=k=>crypto.subtle.importKey('raw',UB64(k),'AES-GCM',false,['encrypt','decrypt']);
async function icuEnc(ck){const iv=crypto.getRandomValues(new Uint8Array(12));
 const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},await icuAes(ck.k),new TextEncoder().encode(JSON.stringify({id:ICU.id||'',key:ICU.key})));
 return{v:1,s:ck.s,i:B64(iv),c:B64(ct)}}
async function icuDec(bl,ck){try{const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:UB64(bl.i)},await icuAes(ck.k),UB64(bl.c));
 const o=JSON.parse(new TextDecoder().decode(pt));return o&&o.key?o:null}catch(e){return null}}
/* Nach der Anmeldung: Schlüssel für dieses Konto bereitstellen (mit vorhandenem Salt, sonst neu) */
async function icuLogin0(pw,bl){const ck={s:bl.s,k:await icuDerive(pw,bl.s)},o=await icuDec(bl,ck);return o?{o:{id:o.id||'',key:o.key},ck}:null}
async function icuLogin(pw,bl){
 if(!HASC)return null;
 if(bl&&bl.s&&bl.c){const ck={s:bl.s,k:await icuDerive(pw,bl.s)};if(await icuDec(bl,ck)){LS.set(ckKey(),JSON.stringify(ck));return ck}CL.icuRe=1}
 const s0=B64(crypto.getRandomValues(new Uint8Array(16))),ck={s:s0,k:await icuDerive(pw,s0)};LS.set(ckKey(),JSON.stringify(ck));return ck}
/* Abgleich zwischen lokalem Zugang und Chiffrat im Backup. cw=true: Cloud hat Vorrang (nach Übernahme aus der Cloud) */
async function icuSyncState(cw){
 if(!HASC||!CL.ses)return;
 const ck=ckGet();if(!ck)return;
 const bl=S.icuc,stamp=async()=>{S.icuc=await icuEnc(ck);store()};
 if(bl&&bl.s===ck.s){
  const o=await icuDec(bl,ck);
  if(!o){CL.icuRe=0;return}
  if(!ICU.key||(cw&&(o.key!==ICU.key||(o.id||'')!==(ICU.id||'')))){
   ICU={id:o.id||'',key:o.key};LS.set('mplan_icu_'+UID,JSON.stringify(ICU));icuSync();{const as=document.activeElement;if(typeof rSet=='function'&&!(as&&$('#set').contains(as)))rSet()}return}
  if(o.key!==ICU.key||(o.id||'')!==(ICU.id||''))await stamp()}
 else if(!bl){if(ICU.key)await stamp()}
 else if(CL.icuRe&&ICU.key){await stamp()}
 CL.icuRe=0}
/* Nach dem Ändern im Profil: explizit sichern oder entfernen */
async function icuPush(){
 if(!HASC||!CL.ses||!sbOn())return;
 if(!ICU.key){if(S.icuc){delete S.icuc;store();await cloudPush(true).catch(()=>{})}return}
 let ck=ckGet();
 if(!ck){ck=await icuAskPw();if(!ck)return}
 S.icuc=await icuEnc(ck);store();await cloudPush(true).catch(()=>{});if(typeof rSet=='function')rSet()}
/* Passwort-Abfrage (Schlüssel ist auf diesem Gerät noch nicht vorhanden) */
function icuAskPw(){return new Promise(res=>{
 const m=$('#md');m.hidden=false;
 m.innerHTML='<div class="box"><h3>Cloud-Passwort bestätigen</h3><div class="sub">Damit dein Intervals.icu-Zugang verschlüsselt gesichert werden kann, brauche ich einmal dein Cloud-Passwort. Es wird nicht gespeichert.</div><div class="f"><label>Cloud-Passwort<input id="ipw" type="password" autocomplete="current-password"></label></div><div id="ipe" class="aerr" hidden></div><div class="b"><button class="pri" id="ipo">Sichern</button><button id="ipx">Abbrechen</button></div></div>';
 const done=v=>{m.hidden=true;m.innerHTML='';res(v)};
 $('#ipx').onclick=()=>done(null);
 $('#ipo').onclick=async()=>{const e=$('#ipe'),b=$('#ipo'),pw=$('#ipw').value||'';e.hidden=true;if(!pw){e.textContent='Bitte Passwort eingeben.';e.hidden=false;return}
  b.disabled=true;
  try{const j=await sbCall('/auth/v1/token?grant_type=password',{m:'POST',b:{email:CL.ses.email,password:pw}});sbSesSet(sbFromAuth(j,CL.ses));
   const ck=await icuLogin(pw,S.icuc);done(ck)}
  catch(x){e.textContent=x.message;e.hidden=false;b.disabled=false}}})}
async function icuStatusHtml(){
 if(!HASC||!sbOn()||!CL.ses)return'';
 const ck=ckGet(),bl=S.icuc;
 if(ICU.key&&bl&&ck&&ck.s===bl.s){const o=await icuDec(bl,ck);if(o&&o.key===ICU.key&&(o.id||'')===(ICU.id||''))return'<span style="color:var(--ok)">✓ Mit deinem Cloud-Konto verschlüsselt gesichert. Auf einem neuen Gerät bist du nach der Anmeldung sofort verbunden.</span>'}
 if(ICU.key)return'Noch nicht in der Cloud gesichert. <button id="icb">Jetzt sichern</button>';
 if(bl)return'In deiner Cloud liegt ein Zugang, der mit einem früheren Passwort gesichert wurde. Trage den Schlüssel einmal neu ein, dann wird er neu gesichert.';
 return'Mit Cloud-Konto wird dein Zugang verschlüsselt gesichert und ist auf jedem Gerät sofort da.'}
/* ===== Cloud: Profil-Karte ===== */
const SHARE_TXT='Läufe der letzten 26 Wochen (Datum, Name, Distanz, Zeit, Puls, Höhenmeter, Trainingslast, RPE), Ruhepuls, HRV, Schlaf und Fitness der letzten 12 Wochen sowie Renndatum und Ziel. Nicht geteilt werden Zugangsdaten, Gewicht, Notizen und Check-ins.';
/* ===== Push-Nachrichten ===== */
const PUSH={o:null,key:null,rs:0};
const pushSupported=()=>('serviceWorker' in navigator)&&('PushManager' in window)&&('Notification' in window);
const isIos=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform=='MacIntel'&&navigator.maxTouchPoints>1);
const isStandalone=()=>(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
const pushU8=s=>{const b=(s+'='.repeat((4-s.length%4)%4)).replace(/-/g,'+').replace(/_/g,'/'),r=atob(b),o=new Uint8Array(r.length);for(let i=0;i<r.length;i++)o[i]=r.charCodeAt(i);return o};
function swReady(){return Promise.race([navigator.serviceWorker.ready,new Promise((_,j)=>setTimeout(()=>j(new Error('Der Offline-Dienst von M.oach ist hier nicht aktiv. Öffne die App über die https-Adresse.')),3000))])}
async function pushKey(){
 if(PUSH.key)return PUSH.key;
 try{const c=SBC(),r=await lifecycle.fetch(c.url+'/functions/v1/moach-push',{headers:{apikey:c.key}}),j=r.ok?await r.json():null;PUSH.key=(j&&j.key)||''}
 catch(e){return''}
 return PUSH.key}
async function pushRefresh(){
 const o={sup:pushSupported(),perm:'Notification' in window?Notification.permission:'denied',key:'',sub:false};
 if(o.sup){o.key=await pushKey();
  try{const reg=await swReady(),s=await reg.pushManager.getSubscription();o.sub=!!s&&o.perm=='granted'}catch(e){o.nosw=true}}
 PUSH.o=o;return o}
async function pushSave(s){
 const j=s.toJSON();if(!CL.ses||!j.keys)return;
 await sbRest('push_subs?on_conflict=user_id,endpoint',{m:'POST',h:PREF('resolution=merge-duplicates,return=minimal'),b:{user_id:CL.ses.uid,endpoint:j.endpoint,p256dh:j.keys.p256dh,auth:j.keys.auth,ua:navigator.userAgent.slice(0,120)}})}
async function pushOn(){
 const key=await pushKey();if(!key)throw new Error('Der Push-Dienst ist auf dem Server noch nicht eingerichtet.');
 const perm=await Notification.requestPermission();
 if(perm!=='granted')throw new Error(perm=='denied'?'Benachrichtigungen sind blockiert. Erlaube sie in den Browser- oder Systemeinstellungen.':'Die Erlaubnis wurde nicht erteilt.');
 const reg=await swReady();let s=await reg.pushManager.getSubscription();
 if(s){try{await s.unsubscribe()}catch(e){}}
 s=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:pushU8(key)});
 await pushSave(s)}
async function pushOff(){
 const reg=await swReady(),s=await reg.pushManager.getSubscription();
 if(s){try{if(CL.ses)await sbRest('push_subs?user_id=eq.'+CL.ses.uid+'&endpoint=eq.'+encodeURIComponent(s.endpoint),{m:'DELETE'})}catch(e){}
  await s.unsubscribe()}}
async function pushResync(){
 if(!pushSupported()||Notification.permission!=='granted'||!CL.ses)return;
 const reg=await swReady(),s=await reg.pushManager.getSubscription();if(s)await pushSave(s)}
function pushInner(){
 const o=PUSH.o,h3='<h3>Benachrichtigungen</h3>';
 if(!o)return h3+'<div class="sub">Wird geprüft …</div>';
 if(!o.sup)return h3+'<div class="sub">'+(isIos()&&!isStandalone()?'Auf dem iPhone und iPad gehen Push-Nachrichten nur, wenn M.oach als App installiert ist: Teilen-Symbol → „Zum Home-Bildschirm“, dann von dort öffnen (iOS 16.4 oder neuer).':'Dieser Browser unterstützt keine Push-Nachrichten.')+'</div>';
 if(o.nosw)return h3+'<div class="sub">Push braucht den Offline-Dienst von M.oach. Der läuft nur, wenn die App über ihre https-Adresse geöffnet ist.</div>';
 if(!o.key)return h3+'<div class="sub">Der Push-Dienst ist auf dem Server noch nicht eingerichtet (Anleitung: supabase/ANLEITUNG.md, Schritt 8). Bis dahin siehst du Anfragen, sobald du die App öffnest.</div>';
 if(o.perm=='denied')return h3+'<div class="sub">Benachrichtigungen sind für M.oach blockiert. Erlaube sie in den Einstellungen deines Browsers oder Geräts und öffne diese Seite danach neu.</div>';
 return h3+'<div class="sub">'+(o.sub?'<b>✓ Aktiv auf diesem Gerät.</b> Du bekommst eine Nachricht bei neuen Coaching-Anfragen'+(CL.adm?' und wenn ein Athlet antwortet':'')+'.':'Lass dich auf diesem Gerät benachrichtigen, wenn eine Coaching-Anfrage kommt'+(CL.adm?' oder ein Athlet antwortet':'')+'.')+'</div>'
  +'<div id="pushe" class="aerr" hidden></div><div class="b">'+(o.sub?'<button id="pushx">Ausschalten</button>':'<button class="pri" id="pushy">Push-Nachrichten einschalten</button>')+'</div>'}
const pushShown=()=>!!(PUSH.o&&PUSH.o.sup&&PUSH.o.key&&!PUSH.o.nosw);
function pushCard(){return(sbOn()&&CL.ses&&!CL.choice&&pushShown())?'<div class="card" id="pushc">'+pushInner()+'</div>':''}
function wirePush(){
 const c=$('#pushc');
 if(!c){if(PUSH.o===null&&sbOn()&&CL.ses&&!CL.choice){PUSH.o=false;pushRefresh().then(()=>{if(pushShown()&&!$('#pushc'))rSet()}).catch(()=>{})}return}
 const draw=()=>{c.innerHTML=pushInner();bind()};
 const run=(b,fn)=>async()=>{const e=$('#pushe');b.disabled=true;try{await fn();await pushRefresh()}catch(x){if(e){e.textContent=x.message||'Fehler';e.hidden=false}}finally{b.disabled=false}const err=e&&!e.hidden?e.textContent:'';draw();if(err){const e2=$('#pushe');if(e2){e2.textContent=err;e2.hidden=false}}};
 const bind=()=>{const y=$('#pushy'),x=$('#pushx');if(y)y.onclick=run(y,pushOn);if(x)x.onclick=run(x,pushOff)};
 bind();
 pushRefresh().then(draw).catch(()=>{})}
if(navigator.serviceWorker&&navigator.serviceWorker.addEventListener)lifecycle.listen(navigator.serviceWorker,'message',e=>{
 const d=e.data;if(!d||d.t!=='push')return;
 const t=d.tab==='coach'&&canCoach()?'coach':'today';
 try{showTab(t);cloudTick()}catch(x){}});
function cloudCard(){
 const h3='<h3>Cloud'+inf('cloud')+'</h3>';
 if(!sbOn()&&!isAdm())return'';
 if(!sbOn())return'<div class="card">'+h3+'<div class="sub">Anmeldung auf mehreren Geräten, Backup und Coaching zwischen Geräten sind noch nicht eingerichtet.</div>'
  +(isAdm()?'<div class="f"><label>Projekt-URL<input id="sbu" placeholder="https://abcd.supabase.co" autocomplete="off"></label><label>Anon-Schlüssel<input id="sbk" type="password" autocomplete="off" placeholder="eyJ… oder sb_publishable_…"></label></div><div id="sbe" class="aerr" hidden></div><div class="b"><button id="sbs">Speichern</button></div><small>Nur für den Betreiber (Anleitung: supabase/ANLEITUNG.md). Der Schlüssel ist öffentlich gedacht, geschützt werden die Daten durch die Zugriffsregeln in der Datenbank.</small>':'')+'</div>';
 const s=CL.ses;
 if(!s)return'<div class="card">'+h3+'<div class="sub">Optional: Mit einem Cloud-Konto nutzt du M.oach auf mehreren Geräten und deine Daten sind gesichert. Auch das Coaching zwischen verschiedenen Geräten läuft darüber.</div>'
  +'<div class="f"><label>E-Mail<input id="cle" type="email" autocomplete="email" inputmode="email"></label><label>Passwort<input id="clp" type="password" autocomplete="current-password" placeholder="mind. 8 Zeichen"></label></div>'
  +'<label class="ck"><input type="checkbox" id="cla"><span>Ich stimme zu, dass M.oach meinen Namen, meine E-Mail-Adresse und mein Backup (Plan, Läufe, Wellness-Daten) auf dem Supabase-Server des Betreibers speichert. Ein Coach sieht nur etwas, wenn ich es ausdrücklich bestätige. Mein Intervals.icu-Zugang wird nur verschlüsselt gespeichert; der Schlüssel dafür entsteht aus meinem Passwort, der Betreiber kann ihn nicht lesen.</span></label>'
  +'<div id="clr" class="aerr" hidden></div><div class="b"><button class="pri" id="cli">Anmelden</button><button id="clu">Konto erstellen</button><button id="clf">Passwort vergessen?</button></div></div>';
 if(CL.choice){const r=CL.choice.row,n=(r.state&&r.state.runs||[]).length;
  return'<div class="card">'+h3+'<div class="sub">Verbunden als <b>'+esc(s.email||'')+'</b></div><div class="an a-y">In der Cloud liegt ein Stand vom '+new Date(r.updated_at||Date.now()).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})+' ('+n+' Läufe). Welchen möchtest du behalten?</div><div id="clr" class="aerr" hidden></div><div class="b"><button class="pri" id="clld">Cloud-Stand laden</button><button id="clup">Diesen Stand hochladen</button></div></div>'}
 const bk=CL.bakAt?'zuletzt '+new Date(CL.bakAt).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'noch nicht';
 return'<div class="card">'+h3+'<div class="sub">Verbunden als <b>'+esc(s.email||'')+'</b>'+(CL.adm?' <span class="tag">Coach</span>':'')+'</div>'
  +'<div class="ln">Backup: '+bk+'</div>'+(CL.err?'<div class="aerr" style="margin-top:6px">'+esc(CL.err)+'</div>':'')+'<div id="clr" class="aerr" hidden></div>'
  +'<div class="b"><button class="pri" id="clnow">Jetzt sichern</button><button id="clout">Von der Cloud abmelden</button><button id="cldel">Cloud-Konto löschen</button></div>'
  +'<small>Gespeichert sind Name, E-Mail und dein App-Stand. Mit „Cloud-Konto löschen“ verschwinden alle Cloud-Daten, auch geteilte. Die Daten auf diesem Gerät bleiben.</small></div>'}
function wireCloud(){
 const er=()=>$('#clr'),sbs=$('#sbs');
 if(sbs)sbs.onclick=()=>{const u=sbNorm($('#sbu').value),k=($('#sbk').value||'').trim(),e=$('#sbe');
  if(!u||k.length<=20){e.textContent='Bitte gib eine Adresse wie https://abcd.supabase.co und den Publishable-/anon-Schlüssel ein.';e.hidden=false;return}
  if(/^sb_secret_/.test(k)){e.textContent='Das ist ein geheimer Schlüssel (secret). Bitte nimm den Publishable Key (sb_publishable_…) oder den anon-Schlüssel.';e.hidden=false;return}
  LS.set('moach_sb',JSON.stringify({url:u,key:k}));render();showTab('set')};
 const go=mode=>async()=>{const b=mode=='up'?$('#clu'):$('#cli'),e=er();
  await cloudRun(b,async()=>{const em=($('#cle').value||'').trim(),pw=$('#clp').value||'';
   if(!em||!pw)throw new Error('Bitte E-Mail und Passwort eingeben.');
   if(mode=='up'){if(!$('#cla').checked)throw new Error('Bitte stimme der Speicherung zu.');if(pw.length<8)throw new Error('Das Passwort braucht mindestens 8 Zeichen.')}
   const r=await cloudAuth(mode,em,pw,(S.prof&&S.prof.name)||'Läufer');
   if(r.pending)throw new Error('Fast geschafft: Wir haben dir eine Bestätigungs-Mail geschickt. Bestätige sie und melde dich danach an.');
   await cloudAfterLogin(pw);showTab('set')},e)};
 const fg=$('#clf');if(fg)fg.onclick=async()=>{const e=er();const ok=await cloudRun(fg,()=>cloudRecover($('#cle').value),e);if(ok){e.textContent='Wenn die Adresse registriert ist, haben wir dir einen Link zum Zurücksetzen geschickt.';e.hidden=false}};
 const li=$('#cli');if(li)li.onclick=go('in');const lu=$('#clu');if(lu)lu.onclick=go('up');
 const ld=$('#clld');if(ld)ld.onclick=async()=>{const e=er();await cloudRun(ld,async()=>{const r=CL.choice.row;cloudAdopt(r.state,+r.modified);CL.pulled=true;CL.choice=null;CL.bak=+r.modified;CL.bakAt=Date.parse(r.updated_at)||Date.now();await cloudReqs().catch(()=>{});navCoach();render();showTab('set')},e)};
 const lp=$('#clup');if(lp)lp.onclick=async()=>{const e=er();await cloudRun(lp,async()=>{CL.pulled=true;CL.choice=null;await icuSyncState(false).catch(()=>{});S._m=Date.now();store(true);await cloudPush(true);await cloudReqs().catch(()=>{});render();showTab('set')},e)};
 const nw=$('#clnow');if(nw)nw.onclick=async()=>{const e=er();await cloudRun(nw,async()=>{if(!CL.pulled)throw new Error('Cloud-Abgleich läuft noch. Bitte gleich nochmal versuchen.');await cloudPush(true);if(CL.err)throw new Error(CL.err);render();showTab('set')},e)};
 const lo=$('#clout');if(lo)lo.onclick=()=>cloudOut();
 const dl=$('#cldel');if(dl){let c=0;dl.onclick=async()=>{if(!c){c=1;dl.textContent='Wirklich löschen? Nochmal tippen';return}await cloudRun(dl,()=>cloudDelete(),er())}}}
/* ===== Cloud: Coaching-Ansicht & Postfach ===== */
function cusers(){
 const head='<div class="card"><h3>Athleten in der Cloud'+inf('cloud')+'</h3>';
 if(!sbOn())return'';
 if(!CL.ses)return head+'<div class="sub">Melde dich im Profil mit deinem Cloud-Konto an. Dann siehst du hier alle Nutzer und kannst sie anfragen.</div></div>';
 if(CL.adm===false)return head+'<div class="sub">Dein Cloud-Konto ist noch nicht als Coach freigeschaltet. Das geht einmalig in der Datenbank (Anleitung, Schritt 6).</div></div>';
 if(CL.reqs==null)return head+'<div class="sub">'+(CL.err?esc(CL.err):'Lade Nutzer …')+'</div></div>';
 const me=CL.ses.uid,others=Object.keys(CL.names).filter(id=>id!==me);
 const stTxt={pending:'Angefragt · wartet auf Bestätigung',accepted:'Bestätigt · Daten verfügbar',declined:'Hat abgelehnt'};
 const row=id=>{const rq=cloudReqOf(id),st=rq?rq.status:null,sel=CSEL.t=='c'&&CSEL.id==id,nm=CL.names[id]||'Läufer';
  const act=!st?'<button class="pri" data-cq="'+esc(id)+'">Anfragen</button>':st=='pending'?'<button data-cw="'+esc(id)+'">Zurückziehen</button>':st=='accepted'?'<button class="'+(sel?'pri':'')+'" data-cv="'+esc(id)+'">'+(sel?'Angezeigt':'Ansehen')+'</button>':'<button data-cq="'+esc(id)+'">Erneut anfragen</button>';
  return'<div class="ur'+(sel?' sel':'')+'"><div class="av">'+esc(nm.slice(0,1).toUpperCase())+'</div><div class="um"><b>'+esc(nm)+'</b><small class="st-'+({pending:'p',accepted:'a',declined:'d'}[st]||'n')+'">'+(stTxt[st]||'Noch nicht angefragt')+'</small></div><div class="ua">'+act+'</div></div>'};
 return head+'<div class="sub">Alle registrierten Nutzer. Der Athlet bekommt die Anfrage in seiner App und muss sie bestätigen. Erst danach siehst du seine Daten.</div>'
  +(others.length?others.map(row).join(''):'<div class="mu" style="padding:8px 0">Noch keine weiteren Nutzer registriert.</div>')
  +(CL.err?'<div class="aerr" style="margin-top:8px">'+esc(CL.err)+'</div>':'')+'</div>'}
function inboxCloud(){
 return cloudPending().map(r=>'<div class="card inbox"><div class="inb"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg></div><div class="inm"><h3>Coaching-Anfrage</h3><div><b>'+esc(cname(r.coach_id))+'</b> möchte dein Coach sein.</div><small>Dann dürfte er sehen: '+SHARE_TXT+' Die Daten liegen auf dem Server des Betreibers (Supabase). Du kannst die Freigabe jederzeit im Profil beenden, dann werden die geteilten Daten gelöscht.</small><div class="b"><button class="pri" data-cra="'+esc(r.id)+'">Bestätigen und freigeben</button><button data-crd="'+esc(r.id)+'">Ablehnen</button></div></div></div>').join('')}
function wireInboxCloud(el){
 const ans=(st)=>b=>{const e=document.createElement('div');e.className='aerr';e.hidden=true;b.parentNode.appendChild(e);
  cloudRun(b,()=>cloudAnswer(b.dataset.cra||b.dataset.crd,st),e).then(ok=>{if(ok){badges();render()}})};
 el.querySelectorAll('[data-cra]').forEach(b=>b.onclick=()=>ans('accepted')(b));
 el.querySelectorAll('[data-crd]').forEach(b=>b.onclick=()=>ans('declined')(b))}
function raceSoon(){for(let i=0;i<=3;i++){const d=addD(today,i),p=plan(d,1);if(p&&p.t=='race')return{i,d,p}}return null}
function raceAlert(){const rb=document.querySelector('nav.dock [data-t="race"]');if(!rb)return;const r=raceSoon();rb.classList.toggle('alert',!!r);if(r)rb.setAttribute('aria-label','Race, Wettkampf '+(r.i==0?'heute':r.i==1?'morgen':'in '+r.i+' Tagen'));else rb.removeAttribute('aria-label')}
function badges(){raceAlert();const n=pendingForMe().length+cloudPending().length,p=$('#pf');if(p)p.classList.toggle('badge',n>0)}
function render(){
 const y=window.scrollY;
 calcAd();
 const days=Math.round((parse(S.race)-today)/D);
 $('#cd').innerHTML=S.noPlan?'Kein Plan aktiv':CF().mode=='maintain'?(days>=0?'Plan noch <b>'+days+'</b> Tage':'Plan beendet'):(days>=0?'Rennen in <b>'+days+'</b> Tagen':'Rennen vorbei');
 publishToday();rCal();rRuns();rPerf();rRace();rSet();rCoach();badges();
 window.scrollTo(0,y)}
function showTab(t){
 if(!['today','cal','runs','perf','race','set','coach'].includes(t))return;
 if(t==='coach'&&!canCoach())t='today';
 onTabChange(t);window.scrollTo(0,0);LS.set('moach_tab',t);
}
function navCoach(){onCoachChange(canCoach())}
navCoach();
render();
{const t0=LS.get('moach_tab');if(t0&&t0!='today'&&['cal','runs','perf','race','set'].concat(canCoach()?['coach']:[]).includes(t0))showTab(t0)}

const ICU_WEEKS=26;
let icuBusy=false,icuLast=0;
const fromIcu=o=>!!o&&(o.src==='icu'||o.note==='Intervals.icu');
async function icuSync(){
 if(!ICU.key){setSync('Intervals.icu verbinden →');return}
 if(icuBusy)return;icuBusy=true;
 setSync('Lädt Läufe …');
 try{
  const base='https://intervals.icu/api/v1/athlete/'+encodeURIComponent((ICU.id||'').trim()||'0'),hd={Authorization:'Basic '+btoa('API_KEY:'+ICU.key)};
  const from=iso(addD(today,-7*ICU_WEEKS)),to=iso(addD(today,1));
  let r;
  try{r=await lifecycle.fetch(base+'/activities?oldest='+from+'&newest='+to,{headers:hd})}
  catch(e){throw new Error(navigator.onLine===false?'Offline – Abruf folgt, sobald du online bist':'Keine Verbindung zu Intervals.icu')}
  if(r.status==401||r.status==403)throw new Error('Zugang abgelehnt: API-Schlüssel (und ggf. Athlete-ID) prüfen');
  if(!r.ok)throw new Error('Intervals.icu meldet Fehler '+r.status);
  const acts=await r.json();
  if(!Array.isArray(acts))throw new Error('Unerwartete Antwort von Intervals.icu');
  const by={},RUNS=[];
  for(const a of acts){
   if(!/Run/.test(a.type||''))continue;
   const k=String(a.start_date_local||'').slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(k))continue;
   const b=by[k]||(by[k]={km:0,sec:0,rpe:0});
   b.km+=(+(a.icu_distance!=null?a.icu_distance:a.distance)||0)/1000;
   b.sec+=+(a.moving_time!=null?a.moving_time:a.elapsed_time)||0;
   b.rpe=Math.max(b.rpe,+(a.icu_rpe||a.perceived_exertion)||0);
   RUNS.push({id:a.id,d:k,t:String(a.start_date_local).slice(11,16),n:a.name||'Lauf',km:Math.round((+(a.icu_distance!=null?a.icu_distance:a.distance)||0)/10)/100,sec:+(a.moving_time!=null?a.moving_time:a.elapsed_time)||0,hr:Math.round(+a.average_heartrate)||null,mx:Math.round(+a.max_heartrate)||null,el:Math.round(+a.total_elevation_gain)||null,ld:Math.round(+a.icu_training_load)||null,rpe:+(a.icu_rpe||a.perceived_exertion)||0})}
  if(acts.length)S.runs=RUNS.sort((x,y)=>(y.d+y.t)<(x.d+x.t)?-1:1);
  let fresh=0;
  for(const k in by){const o=S.log[k]||{},b=by[k];if(!o.done)fresh++;
   S.log[k]={done:true,km:r1(b.km),min:Math.round(b.sec/60),rpe:o.rpe||(b.rpe?String(b.rpe):''),note:o.note||'Intervals.icu',src:'icu'}}
  if(acts.length)for(const k of Object.keys(S.log)){if(k>=from&&k<=to&&!(k in by)&&fromIcu(S.log[k]))delete S.log[k]}
  try{const wr=await lifecycle.fetch(base+'/wellness?oldest='+iso(addD(today,-84))+'&newest='+iso(today),{headers:hd});
   if(wr.ok){const arr=await wr.json(),W={};for(const x of arr){const id=String(x.id||'').slice(0,10);if(!id)continue;W[id]={rhr:x.restingHR||null,hrv:x.hrv||null,sleep:x.sleepSecs?x.sleepSecs/3600:null,ctl:x.ctl!=null?x.ctl:null,atl:x.atl!=null?x.atl:null,rd:x.readiness>0?x.readiness:null,vo2:x.vo2max>0?x.vo2max:null}}S.well=W}}catch(e){}
  try{await icuYear(base,hd,from)}catch(e){}
  icuLast=Date.now();S.syncAt=icuLast;store(true);render();
  setSync((fresh==0?'aktuell':fresh==1?'1 neuer Lauftag':fresh+' neue Lauftage')+' · '+new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}));
 }catch(e){setSync('Fehler: '+(e.message||'Sync fehlgeschlagen'))}
 finally{icuBusy=false}}


const DAY0=iso(new Date());
lifecycle.listen(document,'visibilitychange',()=>{if(!document.hidden){if(iso(new Date())!==DAY0){location.reload();return}icuSync()}});
lifecycle.listen(window,'online',()=>icuSync());
setInterval(()=>{if(!document.hidden&&Date.now()-icuLast>10*60*1000)icuSync()},60000);
setInterval(()=>cloudTick(),60000);
lifecycle.listen(document,'visibilitychange',()=>{if(!document.hidden)cloudTick()});
lifecycle.listen(window,'online',()=>{cloudTick();cloudSoon()});
cloudRecoveryDialog();lifecycle.listen(window,'hashchange',cloudRecoveryDialog);
(CL.ses&&sbOn()?cloudInit():Promise.resolve()).then(()=>icuSync(),()=>icuSync());
if(!UID)showAuth();

{const qt=new URLSearchParams(location.search).get('tab');if(qt==='today'||qt==='coach')setTimeout(()=>{try{showTab(qt==='coach'&&canCoach()?'coach':'today');cloudTick()}catch(e){}},900)}
return {
 today: {
  info:openInfo,chart:openChart,navigate:showTab,run:openRun,
  exercise:action=>action==='abc'?openAbc():openMob(action),strength:openKr,
  factors:open=>LS.set('moach_fx',open?'1':'0'),repair:todayRepair,
  answer:async(request,accept)=>{if(request.cloud)await cloudAnswer(request.id,accept?'accepted':'declined');else reqSet(request.id,UID,accept?'a':'d');render()},
  mountHeatmap:()=>{hmInit();return()=>{if(HMM){HMV=HMM.view();HMM.dispose();HMM=null}}},
  refreshHeatmap:()=>{hmDraw();hmFetch()},
 },
 navigate: showTab,
 sync: () => { if (!ICU.key) showTab('set'); else icuSync(); },
 dispose: () => lifecycle.dispose(),
};
} catch (error) { lifecycle.dispose(); throw error; }
}
