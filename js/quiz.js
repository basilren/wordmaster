// ============ QUIZ ENGINE ============
var quizQs=[],quizIdx=0,quizCorrect=0,quizWrongs=[];

function generateQuiz(unitIds,fromErr){
  var allW=[],allS=[],gW=[];
  if(fromErr){
    db.errBank.slice().sort(function(a,b){return calcPriority(b)-calcPriority(a);}).forEach(function(e){
      if(e.type==='word')allW.push({en:e.en,cn:e.cn,_errKey:e.key});
      else allS.push({en:e.en,cn:e.cn,_errKey:e.key});
    });
  }else{
    unitIds.forEach(function(id){var u=getUnit(id);if(!u)return;u.words.forEach(function(w){allW.push({en:w.en,cn:w.cn,_uid:id});});(u.sentences||[]).forEach(function(s){allS.push({en:s.en,cn:s.cn,_uid:id});});});
  }
  db.units.forEach(function(u){u.words.forEach(function(w){gW.push(w);});});
  allW=shuffle(allW);allS=shuffle(allS);
  var qs=[],target=Math.max(10,Math.min(15,allW.length*2+(allS.length||0)));
  // cn2en 25%
  var n1=Math.ceil(target*.25);
  for(var i=0;i<Math.min(n1,allW.length);i++){var w=allW[i];var opts=getDist(gW,w,'en');opts.push(w.en);qs.push({type:'cn2en',stem:w.cn||'('+w.en+')',answer:w.en,opts:shuffle(opts),word:w});}
  // en2cn 25%
  var n2=Math.ceil(target*.25);
  for(var i=0;i<Math.min(n2,allW.length);i++){var w=allW[(i+n1)%allW.length];var opts=getDist(gW,w,'cn');opts.push(w.cn);qs.push({type:'en2cn',stem:w.en,answer:w.cn,opts:shuffle(opts),word:w});}
  // spell 20%
  var n3=Math.ceil(target*.2);
  for(var i=0;i<Math.min(n3,allW.length);i++){qs.push({type:'spell',word:allW[(i+n1+n2)%allW.length]});}
  // sentfill 15%
  if(allS.length){var n4=Math.max(1,Math.ceil(target*.15));for(var i=0;i<Math.min(n4,allS.length);i++)qs.push({type:'sentfill',sent:allS[i]});}
  // sentwrite 15%
  if(allS.length>1){var n5=Math.max(1,Math.ceil(target*.15));for(var i=0;i<Math.min(n5,allS.length);i++)qs.push({type:'sentwrite',sent:allS[(i+1)%allS.length]});}
  return shuffle(qs).slice(0,Math.min(15,Math.max(10,qs.length)));
}
function getDist(pool,cur,f){var a=pool.filter(function(w){return w.en!==cur.en&&w[f];}).map(function(w){return w[f];});return shuffle(Array.from(new Set(a))).slice(0,3);}

function startQuiz(){if(!selectedUnits.length)return;quizQs=generateQuiz(selectedUnits,false);quizIdx=0;quizCorrect=0;quizWrongs=[];showPage('pageQuiz');renderQ();}
function startErrQuiz(){if(!db.errBank.length){alert('\u9519\u9898\u5E93\u662F\u7A7A\u7684');return;}quizQs=generateQuiz([],true);quizIdx=0;quizCorrect=0;quizWrongs=[];showPage('pageQuiz');renderQ();}

function renderQ(){
  if(quizIdx>=quizQs.length){showResult(quizCorrect,quizQs.length,'\u68C0\u6D4B\u5B8C\u6210\uFF01');recordSession();return;}
  var q=quizQs[quizIdx];dots('quizProgress',quizQs.length,quizIdx,quizWrongs);
  document.getElementById('quizNum').textContent=(quizIdx+1)+'/'+quizQs.length;
  var a=document.getElementById('quizArea');

  if(q.type==='cn2en'||q.type==='en2cn'){
    var spk=q.type==='en2cn'?'<div style="text-align:center;margin-bottom:6px"><button class="speaker-btn" onclick="speak(\''+esc(q.stem).replace(/'/g,"\\'")+'\')">&#x1F50A;</button></div>':'';
    a.innerHTML=spk+'<div class="q-stem">'+esc(q.stem)+'</div><div class="q-opts" id="qOpts">'+q.opts.map(function(o){return '<div class="q-opt" onclick="pickOpt(this,\''+btoa(unescape(encodeURIComponent(o)))+'\')">'+esc(o)+'</div>';}).join('')+'</div><div class="answer-box" id="ansBox"></div>';
    if(q.type==='en2cn')speak(q.stem);
  }
  else if(q.type==='spell'){
    var w=q.word,boxes='';
    for(var i=0;i<w.en.length;i++){if(w.en[i]===' ')boxes+='<span class="spell-space"></span>';else boxes+='<input class="spell-char" maxlength="1" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">';}
    a.innerHTML='<div style="text-align:center"><button class="speaker-btn" onclick="speak(\''+esc(w.en).replace(/'/g,"\\'")+'\')" style="font-size:30px">&#x1F50A;</button></div><div class="q-stem" style="color:var(--pri)">'+esc(w.cn)+'</div><div class="spell-wrap" id="spellWrap">'+boxes+'</div><div style="text-align:center;margin-top:8px"><button class="btn btn-pri btn-sm" onclick="checkSpell()" style="width:auto;padding:8px 24px">\u786E\u8BA4</button> <button class="btn btn-out btn-sm" onclick="showSpellAns()" style="width:auto;padding:8px 16px">\u67E5\u770B\u7B54\u6848</button></div><div class="answer-box" id="ansBox"></div>';
    speak(w.en);setTimeout(bindSpell,50);
  }
  else if(q.type==='sentfill'){
    var s=q.sent,ws=s.en.split(/\s+/),bl=pickBlanks(ws);
    var h='';ws.forEach(function(w,i){if(bl.indexOf(i)>=0){var c=w.replace(/[.,!?;:'"]/g,'');h+='<input class="blank-input" data-answer="'+esc(c)+'" data-orig="'+esc(w)+'" style="width:'+Math.max(50,c.length*13)+'px" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"> ';}else h+=esc(w)+' ';});
    a.innerHTML='<div class="q-stem" style="font-size:13px;color:var(--pri)">'+esc(s.cn||'')+'</div><div style="text-align:center;margin-bottom:6px"><button class="speaker-btn" onclick="speak(\''+esc(s.en).replace(/'/g,"\\'")+'\')" style="font-size:24px">&#x1F50A;</button></div><div class="sent-fill">'+h+'</div><div style="text-align:center;margin-top:8px"><button class="btn btn-pri btn-sm" onclick="checkSF()" style="width:auto;padding:8px 24px">\u786E\u8BA4</button> <button class="btn btn-out btn-sm" onclick="showSFAns()" style="width:auto;padding:8px 16px">\u67E5\u770B\u7B54\u6848</button></div><div class="answer-box" id="ansBox"></div>';
  }
  else if(q.type==='sentwrite'){
    var s=q.sent;
    a.innerHTML='<div class="q-stem" style="font-size:14px;color:var(--pri)">'+esc(s.cn||'\u8BF7\u9ED8\u5199')+'</div><textarea id="swInput" placeholder="\u8BF7\u8F93\u5165\u82F1\u6587\u53E5\u5B50..." style="width:100%;height:80px;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px;font-size:15px;outline:none;resize:none;font-family:inherit;margin-top:6px"></textarea><div style="text-align:center;margin-top:8px"><button class="btn btn-pri btn-sm" onclick="checkSW()" style="width:auto;padding:8px 24px">\u786E\u8BA4</button> <button class="btn btn-out btn-sm" onclick="showSWAns()" style="width:auto;padding:8px 16px">\u67E5\u770B\u7B54\u6848</button></div><div class="answer-box" id="ansBox"></div>';
  }
}

// Spell input binding (fix double-input on mobile)
function bindSpell(){
  var inputs=document.querySelectorAll('#spellWrap .spell-char');
  var composing=false;
  inputs.forEach(function(inp,idx){
    inp.addEventListener('compositionstart',function(){composing=true;});
    inp.addEventListener('compositionend',function(){composing=false;this.value=this.value.slice(-1);if(this.value&&inputs[idx+1])inputs[idx+1].focus();});
    inp.addEventListener('input',function(){
      if(composing)return;
      if(this.value.length>1)this.value=this.value.slice(-1);
      if(this.value&&inputs[idx+1])inputs[idx+1].focus();
    });
    inp.addEventListener('keydown',function(e){if(e.key==='Backspace'&&!this.value&&inputs[idx-1]){inputs[idx-1].focus();inputs[idx-1].value='';}if(e.key==='Enter')checkSpell();});
  });if(inputs[0])inputs[0].focus();
}

// Choice
function pickOpt(el,b64){
  var q=quizQs[quizIdx],picked=decodeURIComponent(escape(atob(b64)));
  document.querySelectorAll('.q-opt').forEach(function(o){o.classList.add('disabled');});
  if(picked===q.answer){el.classList.add('correct');quizCorrect++;if(q.word&&q.word._errKey)markErrCorrect(q.word._errKey);}
  else{el.classList.add('wrong');quizWrongs.push(quizIdx);document.querySelectorAll('.q-opt').forEach(function(o){if(o.textContent===q.answer)o.classList.add('correct');});addToErrBank(q.word,null);if(q.word&&q.word._errKey)markErrWrong(q.word._errKey);}
  setTimeout(function(){quizIdx++;renderQ();},900);
}

// Spell check
function checkSpell(){
  var q=quizQs[quizIdx],w=q.word,inputs=document.querySelectorAll('#spellWrap .spell-char'),ok=true,ci=0;
  for(var i=0;i<w.en.length;i++){if(w.en[i]===' ')continue;var inp=inputs[ci];if(inp){if((inp.value||'').toLowerCase()===w.en[i].toLowerCase())inp.classList.add('correct');else{inp.classList.add('wrong');ok=false;}}ci++;}
  var box=document.getElementById('ansBox');
  if(ok){quizCorrect++;box.innerHTML='\u2705 \u62FC\u5199\u6B63\u786E\uFF01';box.className='answer-box show';box.style.borderLeftColor='var(--ok)';box.style.background='#f0fdf4';box.style.color='#166534';if(w._errKey)markErrCorrect(w._errKey);setTimeout(function(){quizIdx++;renderQ();},900);}
  else{quizWrongs.push(quizIdx);box.innerHTML='\u274C \u6B63\u786E\u62FC\u5199\uFF1A<strong>'+esc(w.en)+'</strong>';box.className='answer-box show';addToErrBank(w,null);if(w._errKey)markErrWrong(w._errKey);setTimeout(function(){quizIdx++;renderQ();},2000);}
}
function showSpellAns(){var q=quizQs[quizIdx],box=document.getElementById('ansBox');box.innerHTML='\u{1F4A1} \u7B54\u6848\uFF1A<strong>'+esc(q.word.en)+'</strong>';box.className='answer-box show';}

// Sentence fill
function checkSF(){
  var inputs=document.querySelectorAll('.sent-fill .blank-input'),ok=true;
  inputs.forEach(function(inp){var ans=inp.dataset.answer.toLowerCase().replace(/[.,!?;:'"]/g,''),val=(inp.value||'').trim().toLowerCase().replace(/[.,!?;:'"]/g,'');if(val===ans){inp.style.color='var(--ok)';inp.style.fontWeight='700';}else{inp.style.color='var(--err)';inp.style.fontWeight='700';ok=false;}});
  var box=document.getElementById('ansBox'),q=quizQs[quizIdx];
  var nextBtn='<div style="text-align:center;margin-top:10px"><button class="btn btn-pri btn-sm" onclick="quizIdx++;renderQ();" style="width:auto;padding:8px 24px">\u4E0B\u4E00\u9898 \u25B6</button></div>';
  if(ok){quizCorrect++;box.innerHTML='\u2705 \u6B63\u786E\uFF01'+nextBtn;box.className='answer-box show';box.style.borderLeftColor='var(--ok)';box.style.background='#f0fdf4';box.style.color='#166534';if(q.sent._errKey)markErrCorrect(q.sent._errKey);}
  else{quizWrongs.push(quizIdx);box.innerHTML='\u274C \u5B8C\u6574\u53E5\u5B50\uFF1A<strong>'+esc(q.sent.en)+'</strong>'+nextBtn;box.className='answer-box show';addToErrBank(null,q.sent);if(q.sent._errKey)markErrWrong(q.sent._errKey);}
}
function showSFAns(){var q=quizQs[quizIdx],box=document.getElementById('ansBox');box.innerHTML='\u{1F4A1} '+esc(q.sent.en);box.className='answer-box show';}

// Sentence write
function checkSW(){
  var q=quizQs[quizIdx],s=q.sent,input=(document.getElementById('swInput').value||'').trim().toLowerCase().replace(/[^a-z0-9\s]/g,''),target=s.en.toLowerCase().replace(/[^a-z0-9\s]/g,'');
  var box=document.getElementById('ansBox');
  var nextBtn='<div style="text-align:center;margin-top:10px"><button class="btn btn-pri btn-sm" onclick="quizIdx++;renderQ();" style="width:auto;padding:8px 24px">\u4E0B\u4E00\u9898 \u25B6</button></div>';
  if(levenshtein(input,target)<=Math.max(3,Math.floor(target.length*.15))){quizCorrect++;box.innerHTML='\u2705 \u6B63\u786E\uFF01'+nextBtn;box.className='answer-box show';box.style.borderLeftColor='var(--ok)';box.style.background='#f0fdf4';box.style.color='#166534';if(s._errKey)markErrCorrect(s._errKey);}
  else{quizWrongs.push(quizIdx);box.innerHTML='\u274C \u7B54\u6848\uFF1A<strong>'+esc(s.en)+'</strong>'+nextBtn;box.className='answer-box show';addToErrBank(null,s);if(s._errKey)markErrWrong(s._errKey);}
}
function showSWAns(){var q=quizQs[quizIdx],box=document.getElementById('ansBox');box.innerHTML='\u{1F4A1} '+esc(q.sent.en);box.className='answer-box show';}
