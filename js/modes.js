// ============ FLASHCARD ============
var fIdx=0,fWords=[];
function startFlash(){var u=getUnit(curUnit);if(!u)return;fWords=u.words.slice();fIdx=0;renderF();showPage('pageFlash');}
function renderF(){
  if(fIdx>=fWords.length){showResult(fWords.length,fWords.length,'\u7FFB\u5361\u5B66\u4E60\u5B8C\u6210');return;}
  var w=fWords[fIdx],u=getUnit(curUnit);
  document.getElementById('fWord').textContent=w.en;document.getElementById('fCn').textContent=w.cn||'';
  var ss=(u.sentences||[]).filter(function(s){return s.en.toLowerCase().indexOf(w.en.toLowerCase())>=0;});
  document.getElementById('fSent').textContent=ss.length?ss[0].en:'';
  document.getElementById('fCard').classList.remove('flipped');
  document.getElementById('fCounter').textContent=(fIdx+1)+'/'+fWords.length;
  dots('flashProgress',fWords.length,fIdx,[]);speak(w.en);
}
function flipCard(){document.getElementById('fCard').classList.toggle('flipped');}
function fSpeak(){if(fWords[fIdx])speak(fWords[fIdx].en);}
function fPrev(){if(fIdx>0){fIdx--;renderF();}}
function fNext(){fIdx++;if(fIdx>=fWords.length)showResult(fWords.length,fWords.length,'\u7FFB\u5361\u5B66\u4E60\u5B8C\u6210');else renderF();}
function fMaster(){var w=fWords[fIdx],u=getUnit(curUnit),t=u.words.find(function(x){return x.en===w.en;});if(t)t.mastered=true;saveDB();fNext();}

// ============ VOICE ============
var vIdx=0,vItems=[],vOk=0,vWr=[],recognizing=false,recognition=null;
function startVoice(){var u=getUnit(curUnit);if(!u)return;vItems=[];u.words.forEach(function(w){vItems.push({text:w.en,cn:w.cn});});(u.sentences||[]).forEach(function(s){vItems.push({text:s.en,cn:s.cn});});vItems=shuffle(vItems).slice(0,10);vIdx=0;vOk=0;vWr=[];renderV();showPage('pageVoice');}
function renderV(){
  if(vIdx>=vItems.length){showResult(vOk,vItems.length,'\u8BED\u97F3\u7EC3\u4E60\u5B8C\u6210');recordSession();return;}
  document.getElementById('vTarget').textContent=vItems[vIdx].text;document.getElementById('vCn').textContent=vItems[vIdx].cn||'';
  document.getElementById('vResult').textContent='';document.getElementById('vBtn').classList.remove('recording');
  dots('voiceProgress',vItems.length,vIdx,vWr);
}
function vSpeak(){if(vItems[vIdx])speak(vItems[vIdx].text);}
function toggleVoice(){
  if(!('webkitSpeechRecognition' in window)&&!('SpeechRecognition' in window)){document.getElementById('vResult').innerHTML='<span style="color:var(--err)">\u6B64\u6D4F\u89C8\u5668\u4E0D\u652F\u6301\u8BED\u97F3\u8BC6\u522B</span>';return;}
  if(recognizing){if(recognition)recognition.stop();return;}
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;recognition=new SR();recognition.lang='en-US';recognition.interimResults=false;recognition.maxAlternatives=3;
  recognition.onstart=function(){recognizing=true;document.getElementById('vBtn').classList.add('recording');document.getElementById('vResult').textContent='\u{1F3A4} \u6B63\u5728\u542C...';};
  recognition.onresult=function(e){var rs=[];for(var i=0;i<e.results[0].length;i++)rs.push(e.results[0][i].transcript.toLowerCase().trim());var tgt=vItems[vIdx].text.toLowerCase().replace(/[^a-z0-9\s]/g,'');var ok=rs.some(function(r){return levenshtein(r.replace(/[^a-z0-9\s]/g,''),tgt)<=Math.max(2,Math.floor(tgt.length*.2));});if(ok){vOk++;document.getElementById('vResult').innerHTML='<span style="color:var(--ok)">\u2705 \u53D1\u97F3\u6B63\u786E</span>';}else{vWr.push(vIdx);document.getElementById('vResult').innerHTML='<span style="color:var(--err)">\u274C \u4F60\u8BF4\u7684\uFF1A'+esc(rs[0])+'</span>';}};
  recognition.onerror=function(){recognizing=false;document.getElementById('vBtn').classList.remove('recording');document.getElementById('vResult').innerHTML='<span style="color:var(--warn)">\u8BC6\u522B\u5931\u8D25\uFF0C\u518D\u8BD5</span>';};
  recognition.onend=function(){recognizing=false;document.getElementById('vBtn').classList.remove('recording');};recognition.start();
}
function vNext(){vIdx++;renderV();}

// ============ ERROR BANK ============
function renderErrBank(){
  var list=document.getElementById('errList'),empty=document.getElementById('errEmpty');
  if(!db.errBank.length){list.innerHTML='';empty.style.display='block';document.getElementById('errQuizBtn').style.display='none';document.getElementById('errCount').textContent='0 \u4E2A\u9519\u9898';return;}
  empty.style.display='none';document.getElementById('errQuizBtn').style.display='block';
  document.getElementById('errCount').textContent=db.errBank.length+' \u4E2A\u9519\u9898';
  var sorted=db.errBank.slice().sort(function(a,b){return calcPriority(b)-calcPriority(a);});
  list.innerHTML=sorted.map(function(e){
    var streakBar='';for(var i=0;i<3;i++)streakBar+='<span style="display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:2px;background:'+(i<(e.streak||0)?'var(--ok)':'#e2e8f0')+'"></span>';
    return '<div class="err-item"><div><span class="err-word">'+esc(e.en)+'</span> <span class="err-cn">'+esc(e.cn)+'</span><div style="margin-top:2px">'+streakBar+' <span style="font-size:10px;color:var(--txt2)">'+(e.streak||0)+'/3</span></div></div><div class="err-count">\u9519'+e.count+'\u6B21</div></div>';
  }).join('');
}

// ============ STATS + CALENDAR ============
function renderStats(){
  var tw=0,mw=0;db.units.forEach(function(u){tw+=u.words.length;mw+=u.words.filter(function(w){return w.mastered;}).length;});
  document.getElementById('s_total').textContent=tw;document.getElementById('s_master').textContent=mw;
  document.getElementById('s_sess').textContent=db.stats.sessions||0;document.getElementById('s_streak').textContent=db.stats.streak||0;
  renderCalendar();
}
function renderCalendar(){
  var cal=db.stats.calendar||{};
  var now=new Date(),y=now.getFullYear(),m=now.getMonth();
  var first=new Date(y,m,1),lastDay=new Date(y,m+1,0).getDate();
  var startDow=first.getDay(); // 0=Sun
  var monthName=['1\u6708','2\u6708','3\u6708','4\u6708','5\u6708','6\u6708','7\u6708','8\u6708','9\u6708','10\u6708','11\u6708','12\u6708'];
  var h='<div style="text-align:center;font-weight:700;margin-bottom:8px">'+y+'\u5E74'+monthName[m]+' \u6253\u5361\u65E5\u5386</div>';
  h+='<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center;font-size:11px">';
  ['\u65E5','\u4E00','\u4E8C','\u4E09','\u56DB','\u4E94','\u516D'].forEach(function(d){h+='<div style="color:var(--txt2);padding:4px 0;font-weight:600">'+d+'</div>';});
  for(var i=0;i<startDow;i++)h+='<div></div>';
  for(var d=1;d<=lastDay;d++){
    var ds=y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    var cnt=cal[ds]||0;
    var isToday=ds===todayStr();
    var bg=cnt>0?'var(--pri)':'transparent';
    var clr=cnt>0?'#fff':isToday?'var(--pri)':'var(--txt)';
    var border=isToday?'2px solid var(--pri)':'2px solid transparent';
    h+='<div style="padding:6px 0;border-radius:8px;background:'+bg+';color:'+clr+';border:'+border+';font-weight:'+(cnt>0||isToday?'700':'400')+'">'+d+(cnt>1?'<div style="font-size:8px">\u00D7'+cnt+'</div>':'')+'</div>';
  }
  h+='</div>';
  document.getElementById('calArea').innerHTML=h;
}

// ============ INIT ============
function initApp(){
  var last=localStorage.getItem('wm_last_user');
  if(last){loginUser(last);addDemo();pageStack=['pageHome'];showPage('pageHome',false);}
  else{showUserList();showPage('pageLogin',false);}
}
initApp();
