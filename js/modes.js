// ============ STANDALONE: CHOICE (中英互选) ============
var cIdx=0,cWords=[],cOk=0,cWr=[],cType='cn2en';
function startChoice(){
  var u=getUnit(curUnit);if(!u||u.words.length<2){alert('\u81F3\u5C11\u9700\u89812\u4E2A\u5355\u8BCD');return;}
  cWords=shuffle(u.words.slice());cIdx=0;cOk=0;cWr=[];cType='cn2en';
  showPage('pageChoice');renderC();
}
function setChoiceType(t,el){cType=t;document.querySelectorAll('#pageChoice .tab-item').forEach(function(e){e.classList.remove('active');});if(el)el.classList.add('active');renderC();}
function renderC(){
  if(cIdx>=cWords.length){showResult(cOk,cWords.length,'\u4E2D\u82F1\u4E92\u9009\u5B8C\u6210');recordSession();return;}
  dots('choiceProgress',cWords.length,cIdx,cWr);
  var w=cWords[cIdx],u=getUnit(curUnit),gW=u.words,a=document.getElementById('choiceArea');
  var stem,answer,opts;
  if(cType==='cn2en'){stem=w.cn||'('+w.en+')';answer=w.en;opts=getDist(gW,w,'en');}
  else{stem=w.en;answer=w.cn;opts=getDist(gW,w,'cn');speak(w.en);}
  opts.push(answer);opts=shuffle(opts);
  var spk=cType==='en2cn'?'<div style="text-align:center;margin-bottom:6px"><button class="speaker-btn" onclick="speak(\''+esc(w.en).replace(/'/g,"\\'")+'\')" style="font-size:26px">&#x1F50A;</button></div>':'';
  a.innerHTML=spk+'<div class="q-stem">'+esc(stem)+'</div><div class="q-opts">'+opts.map(function(o){return '<div class="q-opt" onclick="pickC(this,\''+btoa(unescape(encodeURIComponent(o)))+'\',\''+btoa(unescape(encodeURIComponent(answer)))+'\')">'+esc(o)+'</div>';}).join('')+'</div><div class="answer-box" id="cAnsBox"></div>';
}
function pickC(el,selB,ansB){
  var sel=decodeURIComponent(escape(atob(selB))),ans=decodeURIComponent(escape(atob(ansB)));
  document.querySelectorAll('#choiceArea .q-opt').forEach(function(o){o.classList.add('disabled');});
  if(sel===ans){el.classList.add('correct');cOk++;if(cWords[cIdx]._errKey)markErrCorrect(cWords[cIdx]._errKey);}
  else{el.classList.add('wrong');cWr.push(cIdx);document.querySelectorAll('#choiceArea .q-opt').forEach(function(o){if(o.textContent===ans)o.classList.add('correct');});addToErrBank(cWords[cIdx],null);}
  setTimeout(function(){cIdx++;renderC();},900);
}

// ============ STANDALONE: SPELL (拼写默写) ============
var spIdx=0,spWords=[],spOk=0,spWr=[];
function startSpell(){
  var u=getUnit(curUnit);if(!u)return;
  spWords=shuffle(u.words.slice());spIdx=0;spOk=0;spWr=[];
  showPage('pageSpell');renderSp();
}
function renderSp(){
  if(spIdx>=spWords.length){showResult(spOk,spWords.length,'\u62FC\u5199\u9ED8\u5199\u5B8C\u6210');recordSession();return;}
  dots('spellProgress',spWords.length,spIdx,spWr);
  var w=spWords[spIdx],boxes='';
  for(var i=0;i<w.en.length;i++){if(w.en[i]===' ')boxes+='<span class="spell-space"></span>';else boxes+='<input class="spell-char" maxlength="1" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">';}
  document.getElementById('spellArea').innerHTML='<div style="text-align:center"><button class="speaker-btn" onclick="speak(\''+esc(w.en).replace(/'/g,"\\'")+'\')" style="font-size:30px">&#x1F50A;</button></div><div class="q-stem" style="color:var(--pri)">'+esc(w.cn)+'</div><div class="spell-wrap" id="spWrap">'+boxes+'</div><div style="text-align:center;margin-top:8px"><button class="btn btn-pri btn-sm" onclick="checkSp()" style="width:auto;padding:8px 24px">\u786E\u8BA4</button> <button class="btn btn-out btn-sm" onclick="showSpAns()" style="width:auto;padding:8px 16px">\u67E5\u770B\u7B54\u6848</button></div><div class="answer-box" id="spAnsBox"></div>';
  speak(w.en);setTimeout(function(){bindSpellIn('spWrap','checkSp');},50);
}
function bindSpellIn(wrapId,checkFn){
  var inputs=document.querySelectorAll('#'+wrapId+' .spell-char');
  inputs.forEach(function(inp,idx){
    inp.addEventListener('input',function(){if(this.value.length>1)this.value=this.value.charAt(this.value.length-1);if(this.value&&inputs[idx+1])inputs[idx+1].focus();});
    inp.addEventListener('keydown',function(e){if(e.key==='Backspace'&&!this.value&&inputs[idx-1]){inputs[idx-1].focus();inputs[idx-1].value='';}if(e.key==='Enter')window[checkFn]();});
  });if(inputs[0])inputs[0].focus();
}
function checkSp(){
  var w=spWords[spIdx],inputs=document.querySelectorAll('#spWrap .spell-char'),ok=true,ci=0;
  for(var i=0;i<w.en.length;i++){if(w.en[i]===' ')continue;var inp=inputs[ci];if(inp){if((inp.value||'').toLowerCase()===w.en[i].toLowerCase())inp.classList.add('correct');else{inp.classList.add('wrong');ok=false;}}ci++;}
  var box=document.getElementById('spAnsBox');
  if(ok){spOk++;box.innerHTML='\u2705 \u62FC\u5199\u6B63\u786E\uFF01';box.className='answer-box show';box.style.borderLeftColor='var(--ok)';box.style.background='#f0fdf4';box.style.color='#166534';setTimeout(function(){spIdx++;renderSp();},900);}
  else{spWr.push(spIdx);box.innerHTML='\u274C \u6B63\u786E\u62FC\u5199\uFF1A<strong>'+esc(w.en)+'</strong>';box.className='answer-box show';addToErrBank(w,null);setTimeout(function(){spIdx++;renderSp();},2000);}
}
function showSpAns(){var box=document.getElementById('spAnsBox');box.innerHTML='\u{1F4A1} \u7B54\u6848\uFF1A<strong>'+esc(spWords[spIdx].en)+'</strong>';box.className='answer-box show';}

// ============ STANDALONE: SENTENCE FILL (句子填空) ============
var sfIdx=0,sfSents=[],sfOk=0,sfWr=[];
function startSentFill(){
  var u=getUnit(curUnit);if(!u||!(u.sentences||[]).length){alert('\u6B64\u8BCD\u5E93\u6CA1\u6709\u53E5\u5B50');return;}
  sfSents=shuffle(u.sentences.slice());sfIdx=0;sfOk=0;sfWr=[];
  showPage('pageSentFill');renderSF2();
}
function renderSF2(){
  if(sfIdx>=sfSents.length){showResult(sfOk,sfSents.length,'\u53E5\u5B50\u586B\u7A7A\u5B8C\u6210');recordSession();return;}
  dots('sfProgress',sfSents.length,sfIdx,sfWr);
  var s=sfSents[sfIdx],ws=s.en.split(/\s+/),bl=[];
  if(ws.length<=3)bl=[0|Math.random()*ws.length];
  else{var p1=0|Math.random()*ws.length;bl=[p1];if(ws.length>5){var p2;do{p2=0|Math.random()*ws.length}while(p2===p1);bl.push(p2);}}
  var h='';ws.forEach(function(w,i){if(bl.indexOf(i)>=0){var c=w.replace(/[.,!?;:'"]/g,'');h+='<input class="blank-input" data-answer="'+esc(c)+'" data-orig="'+esc(w)+'" style="width:'+Math.max(50,c.length*13)+'px" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"> ';}else h+=esc(w)+' ';});
  document.getElementById('sfArea').innerHTML='<div class="q-stem" style="font-size:13px;color:var(--pri)">'+esc(s.cn||'')+'</div><div style="text-align:center;margin-bottom:6px"><button class="speaker-btn" onclick="speak(\''+esc(s.en).replace(/'/g,"\\'")+'\')" style="font-size:24px">&#x1F50A;</button></div><div class="sent-fill">'+h+'</div><div style="text-align:center;margin-top:8px"><button class="btn btn-pri btn-sm" onclick="checkSF2()" style="width:auto;padding:8px 24px">\u786E\u8BA4</button> <button class="btn btn-out btn-sm" onclick="showSF2Ans()" style="width:auto;padding:8px 16px">\u67E5\u770B\u7B54\u6848</button></div><div class="answer-box" id="sfAnsBox"></div>';
}
function checkSF2(){
  var inputs=document.querySelectorAll('#sfArea .blank-input'),ok=true;
  inputs.forEach(function(inp){var ans=inp.dataset.answer.toLowerCase().replace(/[.,!?;:'"]/g,''),val=(inp.value||'').trim().toLowerCase().replace(/[.,!?;:'"]/g,'');if(val===ans){inp.style.color='var(--ok)';inp.style.fontWeight='700';}else{inp.style.color='var(--err)';inp.style.fontWeight='700';ok=false;}});
  var box=document.getElementById('sfAnsBox');
  if(ok){sfOk++;box.innerHTML='\u2705 \u6B63\u786E\uFF01';box.className='answer-box show';box.style.borderLeftColor='var(--ok)';box.style.background='#f0fdf4';box.style.color='#166534';setTimeout(function(){sfIdx++;renderSF2();},900);}
  else{sfWr.push(sfIdx);box.innerHTML='\u274C \u5B8C\u6574\u53E5\u5B50\uFF1A<strong>'+esc(sfSents[sfIdx].en)+'</strong>';box.className='answer-box show';addToErrBank(null,sfSents[sfIdx]);setTimeout(function(){sfIdx++;renderSF2();},2500);}
}
function showSF2Ans(){var box=document.getElementById('sfAnsBox');box.innerHTML='\u{1F4A1} '+esc(sfSents[sfIdx].en);box.className='answer-box show';}

// ============ STANDALONE: SENTENCE WRITE (整句默写) ============
var swIdx2=0,swSents2=[],swOk2=0,swWr2=[];
function startSentWrite(){
  var u=getUnit(curUnit);if(!u||!(u.sentences||[]).length){alert('\u6B64\u8BCD\u5E93\u6CA1\u6709\u53E5\u5B50');return;}
  swSents2=shuffle(u.sentences.slice());swIdx2=0;swOk2=0;swWr2=[];
  showPage('pageSentWrite');renderSW2();
}
function renderSW2(){
  if(swIdx2>=swSents2.length){showResult(swOk2,swSents2.length,'\u6574\u53E5\u9ED8\u5199\u5B8C\u6210');recordSession();return;}
  dots('swProgress2',swSents2.length,swIdx2,swWr2);
  var s=swSents2[swIdx2];
  document.getElementById('swArea').innerHTML='<div class="q-stem" style="font-size:14px;color:var(--pri)">'+esc(s.cn||'\u8BF7\u9ED8\u5199')+'</div><textarea id="swInput2" placeholder="\u8BF7\u8F93\u5165\u82F1\u6587\u53E5\u5B50..." style="width:100%;height:80px;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px;font-size:15px;outline:none;resize:none;font-family:inherit;margin-top:6px"></textarea><div style="text-align:center;margin-top:8px"><button class="btn btn-pri btn-sm" onclick="checkSW2()" style="width:auto;padding:8px 24px">\u786E\u8BA4</button> <button class="btn btn-out btn-sm" onclick="showSW2Ans()" style="width:auto;padding:8px 16px">\u67E5\u770B\u7B54\u6848</button></div><div class="answer-box" id="swAnsBox2"></div>';
}
function checkSW2(){
  var s=swSents2[swIdx2],input=(document.getElementById('swInput2').value||'').trim().toLowerCase().replace(/[^a-z0-9\s]/g,''),target=s.en.toLowerCase().replace(/[^a-z0-9\s]/g,'');
  var box=document.getElementById('swAnsBox2');
  if(levenshtein(input,target)<=Math.max(3,Math.floor(target.length*.15))){swOk2++;box.innerHTML='\u2705 \u6B63\u786E\uFF01';box.className='answer-box show';box.style.borderLeftColor='var(--ok)';box.style.background='#f0fdf4';box.style.color='#166534';setTimeout(function(){swIdx2++;renderSW2();},1000);}
  else{swWr2.push(swIdx2);box.innerHTML='\u274C \u7B54\u6848\uFF1A<strong>'+esc(s.en)+'</strong>';box.className='answer-box show';addToErrBank(null,s);setTimeout(function(){swIdx2++;renderSW2();},3000);}
}
function showSW2Ans(){var box=document.getElementById('swAnsBox2');box.innerHTML='\u{1F4A1} '+esc(swSents2[swIdx2].en);box.className='answer-box show';}

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

// ============ VOICE (with star rating + correction) ============
var vIdx=0,vItems=[],vOk=0,vWr=[],recognizing=false,recognition=null,vStars=[];
function startVoice(){var u=getUnit(curUnit);if(!u)return;vItems=[];u.words.forEach(function(w){vItems.push({text:w.en,cn:w.cn,type:'word'});});(u.sentences||[]).forEach(function(s){vItems.push({text:s.en,cn:s.cn,type:'sentence'});});vItems=shuffle(vItems).slice(0,10);vIdx=0;vOk=0;vWr=[];vStars=[];renderV();showPage('pageVoice');}
function renderV(){
  if(vIdx>=vItems.length){
    var avg=vStars.length?vStars.reduce(function(a,b){return a+b;},0)/vStars.length:0;
    showResult(vOk,vItems.length,'\u8BED\u97F3\u7EC3\u4E60\u5B8C\u6210');recordSession();return;
  }
  var it=vItems[vIdx];
  document.getElementById('vTarget').textContent=it.text;
  document.getElementById('vCn').textContent=it.cn||'';
  document.getElementById('vResult').innerHTML='';
  document.getElementById('vBtn').classList.remove('recording');
  document.getElementById('vNextBtn').style.display='none';
  dots('voiceProgress',vItems.length,vIdx,vWr);
}
function vSpeak(){if(vItems[vIdx])speak(vItems[vIdx].text);}

function checkSpeechSupport(){
  return ('webkitSpeechRecognition' in window)||('SpeechRecognition' in window);
}

function toggleVoice(){
  if(!checkSpeechSupport()){
    // Check if in WeChat
    var isWx=/MicroMessenger/i.test(navigator.userAgent);
    var msg=isWx?'\u{26A0}\uFE0F \u5FAE\u4FE1\u6D4F\u89C8\u5668\u4E0D\u652F\u6301\u8BED\u97F3\u8BC6\u522B<br><span style="font-size:12px;color:var(--txt2)">\u8BF7\u70B9\u53F3\u4E0A\u89D2\u201C...\u201D\u9009\u62E9\u201C\u5728\u6D4F\u89C8\u5668\u4E2D\u6253\u5F00\u201D<br>\u63A8\u8350\u4F7F\u7528 Chrome \u6216 Safari</span>':'\u{26A0}\uFE0F \u6B64\u6D4F\u89C8\u5668\u4E0D\u652F\u6301\u8BED\u97F3\u8BC6\u522B<br><span style="font-size:12px;color:var(--txt2)">\u8BF7\u4F7F\u7528 Chrome \u6216 Safari \u6253\u5F00</span>';
    document.getElementById('vResult').innerHTML='<div style="color:var(--err);font-size:14px">'+msg+'</div>';
    return;
  }
  if(recognizing){if(recognition)recognition.stop();return;}
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  recognition=new SR();
  recognition.lang='en-US';
  recognition.interimResults=false;
  recognition.maxAlternatives=5;
  recognition.onstart=function(){
    recognizing=true;
    document.getElementById('vBtn').classList.add('recording');
    document.getElementById('vResult').innerHTML='<div style="font-size:28px;margin-bottom:4px">\u{1F3A4}</div><div style="color:var(--pri);font-weight:600">\u6B63\u5728\u542C\u4F60\u8BF4...</div>';
  };
  recognition.onresult=function(e){
    var results=[];
    for(var i=0;i<e.results[0].length;i++){
      results.push({text:e.results[0][i].transcript,conf:e.results[0][i].confidence});
    }
    scoreVoice(results);
  };
  recognition.onerror=function(e){
    recognizing=false;
    document.getElementById('vBtn').classList.remove('recording');
    var msg=e.error==='no-speech'?'\u6CA1\u6709\u68C0\u6D4B\u5230\u58F0\u97F3\uFF0C\u8BF7\u5927\u58F0\u8BF4':e.error==='not-allowed'?'\u8BF7\u5141\u8BB8\u9EA6\u514B\u98CE\u6743\u9650':'\u8BC6\u522B\u5931\u8D25\uFF0C\u518D\u8BD5\u4E00\u6B21';
    document.getElementById('vResult').innerHTML='<div style="color:var(--warn);font-size:14px">'+msg+'</div>';
  };
  recognition.onend=function(){recognizing=false;document.getElementById('vBtn').classList.remove('recording');};
  recognition.start();
}

function scoreVoice(results){
  var target=vItems[vIdx].text.toLowerCase().replace(/[^a-z0-9\s']/g,'').trim();
  var targetWords=target.split(/\s+/);
  var bestScore=0,bestText='',bestDiff=[];

  results.forEach(function(r){
    var spoken=r.text.toLowerCase().replace(/[^a-z0-9\s']/g,'').trim();
    var spokenWords=spoken.split(/\s+/);
    var dist=levenshtein(spoken,target);
    var maxLen=Math.max(spoken.length,target.length);
    var sim=maxLen>0?1-dist/maxLen:0;
    // Word-level comparison
    var wordScore=0,diff=[];
    targetWords.forEach(function(tw,i){
      var sw=spokenWords[i]||'';
      if(sw===tw){wordScore++;diff.push({target:tw,spoken:sw,ok:true});}
      else{diff.push({target:tw,spoken:sw,ok:false});}
    });
    var wRate=targetWords.length>0?wordScore/targetWords.length:0;
    var score=sim*0.4+wRate*0.6; // weighted
    if(score>bestScore){bestScore=score;bestText=r.text;bestDiff=diff;}
  });

  // Calculate stars: 0-0.4 = 1star, 0.4-0.75 = 2star, 0.75+ = 3star
  var stars=bestScore>=0.75?3:bestScore>=0.4?2:1;
  vStars.push(stars);

  if(stars>=2)vOk++;
  else vWr.push(vIdx);

  // Build result HTML
  var starHtml='';
  for(var i=0;i<3;i++)starHtml+='<span style="font-size:28px;'+(i<stars?'':'opacity:0.2')+'">\u2B50</span>';

  var html='<div style="margin-bottom:8px">'+starHtml+'</div>';

  // Score message
  var msgs=['\u{1F4AA} \u518D\u52A0\u6CB9\uFF0C\u591A\u7EC3\u51E0\u6B21\uFF01','\u{1F44D} \u4E0D\u9519\uFF0C\u8FD8\u80FD\u66F4\u597D\uFF01','\u{1F389} \u592A\u68D2\u4E86\uFF0C\u53D1\u97F3\u5F88\u6807\u51C6\uFF01'];
  html+='<div style="font-size:15px;font-weight:700;color:'+(stars>=3?'var(--ok)':stars>=2?'var(--pri)':'var(--err)')+'">'+msgs[stars-1]+'</div>';

  // Show what you said
  html+='<div style="margin-top:10px;font-size:13px;color:var(--txt2)">\u4F60\u8BF4\u7684\uFF1A</div>';
  html+='<div style="font-size:15px;margin-top:2px">'+esc(bestText)+'</div>';

  // Word-by-word comparison (show corrections)
  if(stars<3&&bestDiff.length){
    html+='<div style="margin-top:10px;padding:10px;background:#f8fafc;border-radius:8px;font-size:13px">';
    html+='<div style="font-weight:600;margin-bottom:4px">\u{1F50D} \u9010\u8BCD\u5BF9\u6BD4\uFF1A</div>';
    bestDiff.forEach(function(d){
      if(d.ok){
        html+='<span style="color:var(--ok);font-weight:600">'+esc(d.target)+' </span>';
      } else {
        html+='<span style="text-decoration:line-through;color:var(--err)">'+esc(d.spoken||'\u2014')+'</span>';
        html+='<span style="color:var(--ok);font-weight:600">\u2192'+esc(d.target)+' </span>';
      }
    });
    html+='</div>';
  }

  document.getElementById('vResult').innerHTML=html;
  document.getElementById('vNextBtn').style.display='inline-block';
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
