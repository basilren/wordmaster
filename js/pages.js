// ============ LOGIN / REGISTER ============
var _authTab='login'; // 'login' or 'register'

function switchAuthTab(tab){
  _authTab=tab;
  document.getElementById('authLoginTab').classList.toggle('active',tab==='login');
  document.getElementById('authRegTab').classList.toggle('active',tab==='register');
  document.getElementById('authLoginForm').style.display=tab==='login'?'block':'none';
  document.getElementById('authRegForm').style.display=tab==='register'?'block':'none';
  document.getElementById('authMsg').textContent='';
}

function doLogin(){
  var name=document.getElementById('loginName').value.trim();
  var pwd=document.getElementById('loginPwd').value;
  var msgEl=document.getElementById('authMsg');
  msgEl.textContent='';msgEl.className='auth-msg';
  if(!name){msgEl.textContent='\u8BF7\u8F93\u5165\u7528\u6237\u540D';msgEl.className='auth-msg err';return;}
  loginUser(name,pwd).then(function(r){
    if(r.ok){pageStack=['pageHome'];showPage('pageHome');addDemo();}
    else{msgEl.textContent=r.msg;msgEl.className='auth-msg err';}
  });
}

function doRegister(){
  var name=document.getElementById('regName').value.trim();
  var pwd=document.getElementById('regPwd').value;
  var pwd2=document.getElementById('regPwd2').value;
  var msgEl=document.getElementById('authMsg');
  msgEl.textContent='';msgEl.className='auth-msg';
  if(!name){msgEl.textContent='\u8BF7\u8F93\u5165\u7528\u6237\u540D';msgEl.className='auth-msg err';return;}
  if(!pwd||pwd.length<4){msgEl.textContent='\u5BC6\u7801\u81F3\u5C114\u4F4D';msgEl.className='auth-msg err';return;}
  if(pwd!==pwd2){msgEl.textContent='\u4E24\u6B21\u5BC6\u7801\u4E0D\u4E00\u81F4';msgEl.className='auth-msg err';return;}
  registerUser(name,pwd).then(function(r){
    if(r.ok){
      msgEl.textContent=r.msg;msgEl.className='auth-msg ok';
      // auto-switch to login tab
      setTimeout(function(){
        switchAuthTab('login');
        document.getElementById('loginName').value=name;
        document.getElementById('loginPwd').value='';
        document.getElementById('loginPwd').focus();
      },800);
    }else{
      msgEl.textContent=r.msg;msgEl.className='auth-msg err';
    }
  });
}

function showUserList(){
  var users=getAllUsers();
  var area=document.getElementById('userListArea');
  if(!users.length){area.innerHTML='<p style="color:var(--txt2);font-size:12px">\u8FD8\u6CA1\u6709\u7528\u6237</p>';return;}
  area.innerHTML=users.map(function(u){
    var dn=u.displayName||u.key;
    var hasPwd=!!u.pwHash;
    return '<div class="wb-item" onclick="prefillLogin(\''+esc(dn)+'\')"><div class="wb-icon" style="background:#667eea20;color:#667eea">\u{1F464}</div><div class="wb-info"><h3>'+esc(dn)+'</h3>'+(hasPwd?'<p>\u{1F512} \u5DF2\u8BBE\u5BC6\u7801</p>':'<p>\u65E0\u5BC6\u7801</p>')+'</div><div class="wb-arrow">\u203A</div></div>';
  }).join('');
}

function prefillLogin(name){
  switchAuthTab('login');
  document.getElementById('loginName').value=name;
  document.getElementById('loginPwd').value='';
  document.getElementById('loginPwd').focus();
}

// ============ HOME ============
function renderHome(){
  // Stats
  var tw=0,mw=0;db.units.forEach(function(u){tw+=u.words.length;mw+=u.words.filter(function(w){return w.mastered;}).length;});
  document.getElementById('hStatWords').textContent=tw;
  document.getElementById('hStatMaster').textContent=mw;
  document.getElementById('hStatStreak').textContent=db.stats.streak||0;
  document.getElementById('hStatErr').textContent=db.errBank.length;
  document.getElementById('hUser').textContent=CUR_USER||'';
}

// ============ WORDBANK ============
function renderWordbank(){
  var list=document.getElementById('wbList2'),empty=document.getElementById('wbEmpty2');
  if(!db.units.length){list.innerHTML='';empty.style.display='block';return;}
  empty.style.display='none';
  var colors=['#667eea','#22c55e','#f59e0b','#ef4444','#8b5cf6','#ec4899'];
  list.innerHTML=db.units.map(function(u,i){
    var wc=u.words.length,sc=(u.sentences||[]).length,mc=u.words.filter(function(w){return w.mastered;}).length;
    return '<div class="wb-item" onclick="openUnit(\''+u.id+'\')"><div class="wb-icon" style="background:'+colors[i%6]+'20;color:'+colors[i%6]+'">\u{1F4D6}</div><div class="wb-info"><h3>'+esc(u.name)+'</h3><p>'+wc+'\u4E2A\u5355\u8BCD'+(sc?' \u00B7 '+sc+'\u4E2A\u53E5\u5B50':'')+' \u00B7 \u5DF2\u638C\u63E1'+mc+'/'+wc+'</p></div><div class="wb-arrow">\u203A</div></div>';
  }).join('');
}
function openUnit(id){
  curUnit=id;var u=getUnit(id);if(!u)return;
  document.getElementById('detailTitle').textContent=u.name;
  var wc=u.words.length,sc=(u.sentences||[]).length,mc=u.words.filter(function(w){return w.mastered;}).length;
  document.getElementById('detailDesc').textContent=wc+'\u4E2A\u5355\u8BCD'+(sc?' \u00B7 '+sc+'\u4E2A\u53E5\u5B50':'')+' \u00B7 \u5DF2\u638C\u63E1'+mc+'/'+wc;
  showPage('pageDetail');
}

// ============ UPLOAD / GEMINI OCR ============
var _GK=['AIza','SyCu','ghby','oGMg','9fOA','PoH0','2J39','gG77','q6n9','q_k'];
function _gk(){return _GK.join('');}

function handleImageUpload(e){
  var file=e.target.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=function(ev){
    document.getElementById('previewImg').src=ev.target.result;
    document.getElementById('ocrPreview').style.display='block';
    document.getElementById('ocrStatus').innerHTML='<div class="spinner"></div><p>\u{1F4E1} AI \u6B63\u5728\u8BC6\u522B\u56FE\u7247...</p>';
    callGemini(ev.target.result);
  };reader.readAsDataURL(file);
}

function callGemini(dataUrl){
  var base64=dataUrl.split(',')[1];
  var mime=dataUrl.split(';')[0].split(':')[1]||'image/jpeg';
  var prompt='Please analyze this image of an English vocabulary/sentence study sheet. Extract ALL words and sentences from it.\n\nReturn ONLY a JSON object in this exact format, no other text:\n{"words":[{"en":"english word","cn":"chinese meaning"}],"sentences":[{"en":"English sentence.","cn":"Chinese translation."}]}\n\nRules:\n1. Extract every English word/phrase with its Chinese meaning\n2. Extract every English sentence with its Chinese translation\n3. Keep the original Chinese characters exactly as shown\n4. For phrases like "act...out" or "over there", keep them as-is\n5. Return valid JSON only, no markdown, no code blocks';

  var body={
    contents:[{parts:[
      {text:prompt},
      {inline_data:{mime_type:mime,data:base64}}
    ]}]
  };

  fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key='+_gk(),{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(body)
  })
  .then(function(r){
    if(!r.ok)throw new Error('API error: '+r.status);
    return r.json();
  })
  .then(function(data){
    try{
      var text=data.candidates[0].content.parts[0].text;
      // Clean up: remove markdown code blocks if present
      text=text.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim();
      var result=JSON.parse(text);
      var words=result.words||[];
      var sents=result.sentences||[];
      if(words.length||sents.length){
        _pendW=words;_pendS=sents;
        document.getElementById('ocrStatus').innerHTML='<p style="color:var(--ok)">\u2705 AI \u8BC6\u522B\u5230 '+words.length+' \u4E2A\u5355\u8BCD\u3001'+sents.length+' \u4E2A\u53E5\u5B50</p><p style="font-size:11px;color:var(--txt2);margin-top:2px">\u8BF7\u68C0\u67E5\u540E\u4FDD\u5B58\uFF0C\u53EF\u624B\u52A8\u4FEE\u6539</p><button class="btn btn-pri btn-sm" onclick="goEditOCR()" style="margin-top:6px">\u7F16\u8F91\u5E76\u4FDD\u5B58</button>';
      } else {
        document.getElementById('ocrStatus').innerHTML='<p style="color:var(--warn)">\u672A\u8BC6\u522B\u5230\u5185\u5BB9</p><button class="btn btn-pri btn-sm" onclick="showManual()" style="margin-top:6px">\u624B\u52A8\u8F93\u5165</button>';
      }
    }catch(parseErr){
      console.error('Parse error:',parseErr,data);
      document.getElementById('ocrStatus').innerHTML='<p style="color:var(--warn)">\u89E3\u6790\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u8F93\u5165</p><button class="btn btn-pri btn-sm" onclick="showManual()" style="margin-top:6px">\u624B\u52A8\u8F93\u5165</button>';
    }
  })
  .catch(function(err){
    console.error('Gemini API error:',err);
    // Fallback to Tesseract
    document.getElementById('ocrStatus').innerHTML='<p style="color:var(--warn)">\u{26A0}\uFE0F AI \u8BC6\u522B\u5931\u8D25\uFF0C\u5C1D\u8BD5\u672C\u5730\u8BC6\u522B...</p>';
    doOCRFallback(dataUrl);
  });
}

// Tesseract fallback
function doOCRFallback(img){
  if(typeof Tesseract==='undefined'){
    var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    s.onload=function(){runOCRFallback(img);};s.onerror=function(){document.getElementById('ocrStatus').innerHTML='<p style="color:var(--err)">\u8BC6\u522B\u5931\u8D25</p><button class="btn btn-out btn-sm" onclick="showManual()" style="margin-top:6px">\u624B\u52A8\u8F93\u5165</button>';};
    document.head.appendChild(s);
  }else runOCRFallback(img);
}
function runOCRFallback(img){
  Tesseract.recognize(img,'eng+chi_sim',{logger:function(m){if(m.status==='recognizing text')document.getElementById('ocrStatus').innerHTML='<div class="spinner"></div><p>\u672C\u5730\u8BC6\u522B\u4E2D '+Math.round((m.progress||0)*100)+'%</p>';}}).then(function(r){parseOCRFallback(r.data.text);}).catch(function(){document.getElementById('ocrStatus').innerHTML='<p style="color:var(--err)">\u8BC6\u522B\u5931\u8D25</p><button class="btn btn-out btn-sm" onclick="showManual()" style="margin-top:6px">\u624B\u52A8\u8F93\u5165</button>';});
}
function parseOCRFallback(text){
  var lines=text.split('\n').map(function(l){return l.trim();}).filter(Boolean),words=[],sents=[];
  lines.forEach(function(line){
    var m=line.match(/^([A-Za-z][\w\s.'-]{0,40}?)\s{2,}(.{1,20})$/);
    if(m){words.push({en:m[1].trim(),cn:m[2].trim()});return;}
    var m2=line.match(/^\d+\s+([A-Za-z][\w\s.'-]{0,40}?)\s{2,}(.{1,20})$/);
    if(m2){words.push({en:m2[1].trim(),cn:m2[2].trim()});return;}
    var p=line.split(/[\uFF1A:\t]+/);
    if(p.length>=2&&/[A-Za-z]/.test(p[0])&&p[1].trim().length<=20){words.push({en:p[0].trim(),cn:p[1].trim()});return;}
    if(/^[A-Z]/.test(line)&&line.length>15&&/[.?!]$/.test(line))sents.push({en:line,cn:''});
  });
  if(!words.length&&!sents.length){document.getElementById('ocrStatus').innerHTML='<p style="color:var(--warn)">\u672A\u8BC6\u522B\u5230</p><button class="btn btn-pri btn-sm" onclick="showManual()" style="margin-top:6px">\u624B\u52A8\u8F93\u5165</button>';return;}
  _pendW=words;_pendS=sents;
  document.getElementById('ocrStatus').innerHTML='<p style="color:var(--ok)">\u2705 '+words.length+'\u5355\u8BCD '+sents.length+'\u53E5\u5B50</p><p style="font-size:11px;color:var(--txt2)">\u672C\u5730\u8BC6\u522B\u7ED3\u679C\uFF0C\u8BF7\u68C0\u67E5</p><button class="btn btn-pri btn-sm" onclick="goEditOCR()" style="margin-top:6px">\u7F16\u8F91\u4FDD\u5B58</button>';
}
var _pendW=[],_pendS=[],_editId=null;
function goEditOCR(){_editId=null;showEdit(_pendW,_pendS);}
function showManual(){_editId=null;showEdit([{en:'',cn:''}],[]);}

// ============ EDIT ============
function showEdit(words,sents){
  document.getElementById('unitName').value=_editId?getUnit(_editId).name:'';
  renderEditW(words||[{en:'',cn:''}]);renderEditS(sents||[]);showPage('pageEdit');
}
function editUnit(id){_editId=id;var u=getUnit(id);if(!u)return;document.getElementById('unitName').value=u.name;renderEditW(u.words.map(function(w){return{en:w.en,cn:w.cn};}));renderEditS((u.sentences||[]).map(function(s){return{en:s.en,cn:s.cn};}));showPage('pageEdit');}
function renderEditW(ws){document.getElementById('editWordList').innerHTML=ws.map(function(w){return '<div class="word-edit-item"><input placeholder="\u82F1\u6587" value="'+esc(w.en)+'"><input placeholder="\u4E2D\u6587" value="'+esc(w.cn)+'"><button class="del-btn" onclick="this.parentElement.remove()">\u00D7</button></div>';}).join('');}
function renderEditS(ss){document.getElementById('editSentList').innerHTML=ss.map(function(s){return '<div class="sent-edit-item"><textarea rows="2" placeholder="\u82F1\u6587\u53E5\u5B50" class="sent-en">'+esc(s.en)+'</textarea><textarea rows="2" placeholder="\u4E2D\u6587\u7FFB\u8BD1" class="sent-cn" style="margin-top:4px">'+esc(s.cn)+'</textarea><button class="del-btn" onclick="this.parentElement.remove()">\u00D7</button></div>';}).join('');}
function addEditWord(){var d=document.createElement('div');d.className='word-edit-item';d.innerHTML='<input placeholder="\u82F1\u6587"><input placeholder="\u4E2D\u6587"><button class="del-btn" onclick="this.parentElement.remove()">\u00D7</button>';document.getElementById('editWordList').appendChild(d);d.querySelector('input').focus();}
function addEditSent(){var d=document.createElement('div');d.className='sent-edit-item';d.innerHTML='<textarea rows="2" placeholder="\u82F1\u6587\u53E5\u5B50" class="sent-en"></textarea><textarea rows="2" placeholder="\u4E2D\u6587\u7FFB\u8BD1" class="sent-cn" style="margin-top:4px"></textarea><button class="del-btn" onclick="this.parentElement.remove()">\u00D7</button>';document.getElementById('editSentList').appendChild(d);d.querySelector('textarea').focus();}
function saveUnit(){
  var name=document.getElementById('unitName').value.trim();if(!name){alert('\u8BF7\u8F93\u5165\u540D\u79F0');return;}
  var words=[],wI=document.getElementById('editWordList').querySelectorAll('.word-edit-item');
  wI.forEach(function(item){var ip=item.querySelectorAll('input'),en=(ip[0].value||'').trim(),cn=(ip[1].value||'').trim();if(en)words.push({en:en,cn:cn});});
  if(!words.length){alert('\u8BF7\u6DFB\u52A0\u5355\u8BCD');return;}
  var sents=[],sI=document.getElementById('editSentList').querySelectorAll('.sent-edit-item');
  sI.forEach(function(item){var ta=item.querySelectorAll('textarea'),en=(ta[0].value||'').trim(),cn=(ta[1].value||'').trim();if(en)sents.push({en:en,cn:cn});});
  if(_editId){var u=getUnit(_editId);if(u){var om={};u.words.forEach(function(w){om[w.en.toLowerCase()]=w;});u.name=name;u.words=words.map(function(w){var o=om[w.en.toLowerCase()];return{en:w.en,cn:w.cn,mastered:o?o.mastered:false,errCnt:o?o.errCnt:0};});u.sentences=sents;}}
  else db.units.push({id:'u_'+Date.now(),name:name,created:todayStr(),words:words.map(function(w){return{en:w.en,cn:w.cn,mastered:false,errCnt:0};}),sentences:sents});
  saveDB();navTo('pageWordbank');
}
function deleteUnit(id){if(!confirm('\u786E\u5B9A\u5220\u9664\uFF1F'))return;db.units=db.units.filter(function(u){return u.id!==id;});saveDB();navTo('pageWordbank');}

// ============ MULTI-SELECT ============
var selectedUnits=[];
function toggleSel(id,el){
  var idx=selectedUnits.indexOf(id);
  if(idx>=0){selectedUnits.splice(idx,1);el.classList.remove('checked');el.textContent='';}
  else{selectedUnits.push(id);el.classList.add('checked');el.textContent='\u2713';}
  document.getElementById('selCount').textContent=selectedUnits.length?'\u5DF2\u9009 '+selectedUnits.length+' \u4E2A':'';
  document.getElementById('startQuizBtn').style.display=selectedUnits.length?'block':'none';
}
function showUnitSelect(){
  selectedUnits=[];
  document.getElementById('unitSelList').innerHTML=db.units.map(function(u){
    return '<div class="wb-item" style="cursor:default"><div class="wb-check" onclick="toggleSel(\''+u.id+'\',this)"></div><div class="wb-info" onclick="toggleSel(\''+u.id+'\',this.previousElementSibling)"><h3>'+esc(u.name)+'</h3><p>'+u.words.length+'\u5355\u8BCD</p></div></div>';
  }).join('');
  document.getElementById('selCount').textContent='';
  document.getElementById('startQuizBtn').style.display='none';
  showPage('pageUnitSel');
}

// ============ STUDY WORDS / SENTS / TEST MENU ============
var studySelUnit=null;

function renderUnitRadioList(containerId,filterSents){
  var html='';
  var colors=['#667eea','#22c55e','#f59e0b','#ef4444','#8b5cf6','#ec4899'];
  db.units.forEach(function(u,i){
    if(filterSents&&(!u.sentences||!u.sentences.length))return;
    var wc=u.words.length,sc=(u.sentences||[]).length;
    var checked=studySelUnit===u.id;
    html+='<div class="wb-item" onclick="studySelUnit=\''+u.id+'\';renderUnitRadioList(\''+containerId+'\','+(filterSents?'true':'false')+')" style="border:2px solid '+(checked?'var(--pri)':'transparent')+'"><div class="wb-icon" style="background:'+colors[i%6]+'20;color:'+colors[i%6]+'">\u{1F4D6}</div><div class="wb-info"><h3>'+esc(u.name)+'</h3><p>'+wc+'\u5355\u8BCD'+(sc?' \u00B7 '+sc+'\u53E5\u5B50':'')+'</p></div>'+(checked?'<div style="color:var(--pri);font-size:18px">\u2713</div>':'')+'</div>';
  });
  if(!html)html='<div class="empty-state"><p>\u8BF7\u5148\u6DFB\u52A0\u8BCD\u5E93</p></div>';
  document.getElementById(containerId).innerHTML=html;
}

function goStudyWords(){
  if(!db.units.length){alert('\u8BF7\u5148\u6DFB\u52A0\u8BCD\u5E93');return;}
  studySelUnit=db.units[0].id;
  showPage('pageStudyWords');
  renderUnitRadioList('swUnitList',false);
}
function goStudySents(){
  if(!db.units.length){alert('\u8BF7\u5148\u6DFB\u52A0\u8BCD\u5E93');return;}
  studySelUnit=db.units[0].id;
  showPage('pageStudySents');
  renderUnitRadioList('ssUnitList',true);
}
function goTestMenu(){
  if(!db.units.length){alert('\u8BF7\u5148\u6DFB\u52A0\u8BCD\u5E93');return;}
  studySelUnit=db.units[0].id;
  showPage('pageTestMenu');
  renderUnitRadioList('tmUnitList',false);
}

function launchWordMode(mode){
  if(!studySelUnit){alert('\u8BF7\u5148\u9009\u62E9\u5355\u5143');return;}
  curUnit=studySelUnit;
  if(mode==='flash')startFlash();
  else if(mode==='choice')startChoice();
  else if(mode==='spell')startSpell();
}
function launchSentMode(mode){
  if(!studySelUnit){alert('\u8BF7\u5148\u9009\u62E9\u5355\u5143');return;}
  curUnit=studySelUnit;
  if(mode==='flash')startSentFlash();
  else if(mode==='fill')startSentFill();
  else if(mode==='write')startSentWrite();
}
function launchTest(type){
  if(!studySelUnit){alert('\u8BF7\u5148\u9009\u62E9\u5355\u5143');return;}
  selectedUnits=[studySelUnit];
  if(type==='word')startWordTest();
  else startSentTest();
}

// ============ PRESET WORDBANKS ============
var PRESETS=[
{id:'u_5bu1',name:'5BU1 - Tidy Up',words:[
  {en:'tidy',cn:'\u6574\u7406\uFF1B\u6574\u6D01\u7684'},{en:'mess',cn:'\u810F\u4E71'},
  {en:'let',cn:'\u8BA9'},{en:'sock',cn:'\u889C\u5B50'},
  {en:'yours',cn:'\u4F60\u7684\uFF1B\u4F60\u4EEC\u7684'},{en:'cap',cn:'\u5E3D\u5B50'},
  {en:'crayon',cn:'\u8721\u7B14'},{en:'mine',cn:'\u6211\u7684'},
  {en:'umbrella',cn:'\u96E8\u4F1E'},{en:'nail',cn:'\u9489\u5B50'},
  {en:'drop',cn:'\u4F7F\u843D\u4E0B\uFF1B\u6389\u843D'},{en:'second',cn:'\u79D2\uFF08\u65F6\u95F4\u5355\u4F4D\uFF09'},
  {en:'stick',cn:'\u7C98\u4F4F'},{en:'theirs',cn:'\u4ED6\u4EEC\u7684\uFF1B\u5979\u4EEC\u7684\uFF1B\u5B83\u4EEC\u7684'},
  {en:'hers',cn:'\u5979\u7684'},{en:'tidy up',cn:'\u6574\u7406\u597D'},
  {en:'(be) full of',cn:'\u88C5\u6EE1...'},{en:'a few',cn:'\u51E0\u4E2A\uFF1B\u4E00\u4E9B'},
  {en:'stick to',cn:'\u575A\u6301\uFF1B\u7C98\u4F4F'},{en:'put...on...',cn:'\u628A...\u653E\u5728...\u4E0A\u9762'},
  {en:'put...in...',cn:'\u628A...\u653E\u5728...\u91CC\u9762'}
],sentences:[
  {en:'Whose socks are those?',cn:'\u90A3\u4E9B\u889C\u5B50\u662F\u8C01\u7684\uFF1F'},
  {en:'Are they yours? No, they aren\'t.',cn:'\u8FD9\u4E9B\u662F\u4F60\u7684\u5417\uFF1F\u4E0D\uFF0C\u5B83\u4EEC\u4E0D\u662F\u3002'},
  {en:'Can you put Paul\'s T-shirt on his bed?',cn:'\u4F60\u80FD\u628A\u4FDD\u7F57\u7684T\u6064\u886B\u653E\u5728\u4ED6\u7684\u5E8A\u4E0A\u5417\uFF1F'},
  {en:'Whose cap is this?',cn:'\u8FD9\u4E2A\u662F\u8C01\u7684\u5E3D\u5B50\uFF1F'},
  {en:'The room is now clean and tidy.',cn:'\u8FD9\u95F4\u623F\u95F4\u73B0\u5728\u5E72\u51C0\u53C8\u6574\u6D01\u3002'},
  {en:'It is full of nails.',cn:'\u8FD9\u4E2A\u88C5\u6EE1\u4E86\u9489\u5B50\u3002'},
  {en:'All the nails fall on the floor.',cn:'\u6240\u6709\u7684\u9489\u5B50\u6389\u5728\u4E86\u5730\u4E0A\u3002'},
  {en:'In a few seconds, the floor is clean again.',cn:'\u5728\u51E0\u79D2\u949F\u5185\uFF0C\u8FD9\u4E2A\u5730\u677F\u53C8\u5E72\u51C0\u4E86\u3002'},
  {en:'Are these crayons yours, Peter?',cn:'\u8FD9\u4E9B\u662F\u4F60\u7684\u8721\u7B14\u5417\uFF0C\u5F7C\u5F97\uFF1F'}
]},
{id:'u_5bu2',name:'5BU2 - Moving Around',words:[
  {en:'why',cn:'\u4E3A\u4EC0\u4E48'},{en:'because',cn:'\u56E0\u4E3A'},
  {en:'study',cn:'\u4E66\u623F'},{en:'dining room',cn:'\u9910\u5385'},
  {en:'goose',cn:'\u5927\u96C1'},{en:'change',cn:'\u6539\u53D8'},
  {en:'place',cn:'\u5730\u65B9'},{en:'twice',cn:'\u4E24\u6B21'},
  {en:'every',cn:'\u6BCF\uFF1B\u6BCF\u4E2A'},{en:'north',cn:'\u5317\u65B9'},
  {en:'south',cn:'\u5357\u65B9'},{en:'enough',cn:'\u8DB3\u591F\u7684'},
  {en:'then',cn:'\u7136\u540E'},{en:'all day',cn:'\u4E00\u5929\u5230\u665A'},
  {en:'quiet',cn:'\u5B89\u9759\u7684'},{en:'purse',cn:'\u94B1\u5305'},
  {en:'from...to...',cn:'\u4ECE...\u5230...'},{en:'move around',cn:'\u7ED5\u7740...\u6765\u56DE\u8F6C'},
  {en:'fly south',cn:'\u5F80\u5357\u98DE'},{en:'fly north',cn:'\u5F80\u5317\u98DE'}
],sentences:[
  {en:'Why do you like it?',cn:'\u4F60\u4E3A\u4EC0\u4E48\u559C\u6B22\u5B83\uFF1F'},
  {en:'Because it\'s so big!',cn:'\u56E0\u4E3A\u5B83\u5F88\u5927\uFF01'},
  {en:'Because it\'s quiet. I can read and write there.',cn:'\u56E0\u4E3A\u5B83\u5F88\u5B89\u9759\u3002\u6211\u53EF\u4EE5\u5728\u8FD9\u91CC\u8BFB\u4E66\u548C\u5199\u5B57\u3002'},
  {en:'Do you know why?',cn:'\u4F60\u77E5\u9053\u4E3A\u4EC0\u4E48\u5417\uFF1F'},
  {en:'What about you?',cn:'\u4F60\u5462\uFF1F'},
  {en:'Because they can play in the garden all day.',cn:'\u56E0\u4E3A\u4ED6\u4EEC\u53EF\u4EE5\u5728\u82B1\u56ED\u73A9\u4E00\u6574\u5929\u3002'},
  {en:'Wild geese have busy lives.',cn:'\u5927\u96C1\u7684\u751F\u6D3B\u5F88\u5FD9\u788C\u3002'},
  {en:'They fly from one place to another.',cn:'\u4ED6\u4EEC\u4ECE\u4E00\u4E2A\u5730\u65B9\u98DE\u5230\u53E6\u4E00\u4E2A\u5730\u65B9\u3002'},
  {en:'They change homes twice every year.',cn:'\u6BCF\u5E74\u4ED6\u4EEC\u642C\u5BB6\u4E24\u6B21\u3002'},
  {en:'In spring, they fly north. In autumn, they fly south.',cn:'\u5728\u6625\u5929\uFF0C\u4ED6\u4EEC\u98DE\u5230\u5317\u65B9\u3002\u5728\u79CB\u5929\uFF0C\u4ED6\u4EEC\u98DE\u5230\u5357\u65B9\u3002'},
  {en:'Why do wild geese move around so much?',cn:'\u4E3A\u4EC0\u4E48\u5927\u96C1\u6765\u56DE\u79FB\u52A8\u5982\u6B64\u9891\u7E41\u5462\uFF1F'}
]},
{id:'u_5bu3',name:'5BU3 - In the Future',words:[
  {en:'future',cn:'\u5C06\u6765\uFF1B\u672A\u6765'},{en:'stand',cn:'\u7AD9\uFF0C\u7AD9\u4F4F'},
  {en:'machine',cn:'\u673A\u5668'},{en:'will',cn:'\u5C06\uFF1B\u5C06\u4F1A'},
  {en:'do exercise',cn:'\u8FD0\u52A8\uFF1B\u953B\u70BC\uFF1B\u6D3B\u52A8'},{en:'get up early',cn:'\u65E9\u8D77\u5E8A'},
  {en:'easily',cn:'\u5BB9\u6613\u5730'},{en:'study hard',cn:'\u52AA\u529B\u5B66\u4E60'},
  {en:'more',cn:'\u66F4\u591A\u7684'},{en:'in the future',cn:'\u5728\u5C06\u6765'},
  {en:'in front of',cn:'\u5728......\u524D\u9762'},{en:'take a photo',cn:'\u62CD\u7167'},
  {en:'a pair of glasses',cn:'\u4E00\u526F\u773C\u955C'},{en:'take a photo of sb',cn:'\u7ED9\u67D0\u4EBA\u62CD\u7167'},
  {en:'wear glasses',cn:'\u6234\u773C\u955C'},{en:'do exercise',cn:'\u505A\u8FD0\u52A8'},
  {en:'(be) weak in',cn:'\u4E0D\u64C5\u957F'},{en:'not...any more',cn:'\u4E0D\u518D'},
  {en:'know about',cn:'\u77E5\u9053'},{en:'(be) good at',cn:'\u64C5\u957F\u4E8E'},
  {en:'be late for school',cn:'\u4E0A\u5B66\u8FDF\u5230'},{en:'won\'t = will not',cn:'\u5C06\u4E0D\u4F1A'}
],sentences:[
  {en:'I\'ll be a teacher.',cn:'\u6211\u5C06\u4F1A\u6210\u4E3A\u4E00\u540D\u8001\u5E08\u3002'},
  {en:'I won\'t wear glasses.',cn:'\u6211\u5C06\u6765\u4E0D\u6234\u773C\u955C\u3002'},
  {en:'Will she wear glasses?',cn:'\u5979\u5C06\u6765\u6234\u773C\u955C\u5417\uFF1F'},
  {en:'Kitty wants to know about her future.',cn:'\u51EF\u8482\u60F3\u8981\u77E5\u9053\u5979\u7684\u5C06\u6765\u3002'},
  {en:'She stands in front of a magic machine and takes a photo.',cn:'\u5979\u7AD9\u5728\u673A\u5668\u524D\u9762\u5E76\u4E14\u62CD\u7167\u76F8\u3002'},
  {en:'There are some words on the back.',cn:'\u90A3\u513F\u80CC\u9762\u6709\u4E00\u4E9B\u5355\u8BCD\u3002'},
  {en:'I am good at Maths, but I am weak in English.',cn:'\u6211\u64C5\u957F\u6570\u5B66\uFF0C\u4F46\u662F\u6211\u5728\u82F1\u8BED\u4E0A\u5F88\u5F31\u3002'},
  {en:'I am often late for school.',cn:'\u6211\u7ECF\u5E38\u4E0A\u5B66\u8FDF\u5230\u3002'},
  {en:'I do not like sport and I get tired easily.',cn:'\u6211\u4E0D\u559C\u6B22\u505A\u8FD0\u52A8\u5E76\u4E14\u5BB9\u6613\u7D2F\u3002'},
  {en:'I will not be late for school any more.',cn:'\u6211\u4E0A\u5B66\u4E0D\u518D\u8FDF\u5230\u3002'}
]},
{id:'u_5bu4',name:'5BU4 - Book Week',words:[
  {en:'storybook',cn:'\u6545\u4E8B\u4E66'},{en:'buy',cn:'\u4E70'},{en:'story',cn:'\u6545\u4E8B'},{en:'dictionary',cn:'\u5B57\u5178\uFF1B\u8BCD\u5178'},
  {en:'magazine',cn:'\u6742\u5FD7'},{en:'newspaper',cn:'\u62A5\u7EB8'},{en:'week',cn:'\u5468\uFF1B\u661F\u671F'},{en:'student',cn:'\u5B66\u751F'},
  {en:'poster',cn:'\u6D77\u62A5'},{en:'best',cn:'\u6700\u597D\u7684'},{en:'writer',cn:'\u4F5C\u5BB6'},{en:'over there',cn:'\u5728\u90A3\u8FB9'},
  {en:'do a survey',cn:'\u505A\u8C03\u67E5'},{en:'act...out',cn:'\u8868\u6F14'},{en:'bookshop',cn:'\u4E66\u5E97'},{en:'make posters',cn:'\u505A\u6D77\u62A5'},
  {en:'play',cn:'\u5267\u672C\uFF0C\u620F\u5267'},{en:'line',cn:'\u7EBF\uFF0C\u884C\uFF0C\u5217'}
],sentences:[
  {en:'I\'m going to look at the picture books over there.',cn:'\u6211\u6253\u7B97\u770B\u4E00\u4E0B\u90A3\u8FB9\u7684\u56FE\u753B\u4E66\uFF08\u7ED8\u672C\uFF09\u3002'},
  {en:'What are the pictures about?',cn:'\u56FE\u7247\u662F\u5173\u4E8E\u4EC0\u4E48\u7684\uFF1F'},
  {en:'They\'re pictures of different places in China.',cn:'\u4ED6\u4EEC\u662F\u4E2D\u56FD\u4E0D\u540C\u5730\u65B9\u7684\u56FE\u7247\u3002'},
  {en:'I\'m going to visit these places in the future.',cn:'\u6211\u5C06\u6765\u8981\u53BB\u53C2\u89C2\u8FD9\u4E9B\u5730\u65B9\u3002'},
  {en:'I\'m going to read a story every day.',cn:'\u6211\u8981\u6BCF\u5929\u8BFB\u4E00\u4E2A\u6545\u4E8B\u3002'},
  {en:'Book Week is coming!',cn:'\u56FE\u4E66\u5468\u5C06\u8981\u5230\u4E86\uFF01'},
  {en:'The students in Class 5A are going to make posters about the best stories for children.',cn:'5A\u73ED\u7684\u5B66\u751F\u6253\u7B97\u5236\u4F5C\u5173\u4E8E\u6700\u9002\u5408\u5B69\u5B50\u4EEC\u7684\u6545\u4E8B\u7684\u6D77\u62A5\u3002'},
  {en:'They are going to take some photos of the books too.',cn:'\u4ED6\u4EEC\u4E5F\u8981\u62CD\u4E00\u4E0B\u4E66\u7C4D\u7684\u7167\u7247\u3002'},
  {en:'The boys are going to do a survey about children\'s favourite books.',cn:'\u7537\u751F\u5C06\u8981\u505A\u5173\u4E8E\u5B69\u5B50\u4EEC\u559C\u7231\u4E66\u7C4D\u7684\u8C03\u67E5\u3002'},
  {en:'The girls are going to read a play and then act it out.',cn:'\u5973\u751F\u5C06\u8981\u8BFB\u4E00\u4E2A\u5267\u672C\u5E76\u8868\u6F14\u51FA\u6765\u3002'}
]},
{id:'u_5bu5',name:'5BU5 - At the Weekend',words:[
  {en:'weekend',cn:'\u5468\u672B'},{en:'stay',cn:'\u5F85\uFF1B\u6682\u4F4F\uFF1B\u901E\u7559'},
  {en:'film',cn:'\u7535\u5F71'},{en:'boat',cn:'\u5C0F\u8239\uFF1B\u821F'},
  {en:'plan',cn:'\u5B89\u6392\uFF1B\u8BA1\u5212'},{en:'tomorrow',cn:'\u660E\u5929'},
  {en:'build',cn:'\u5EFA\u7B51\uFF1B\u5EFA\u9020'},{en:'next',cn:'\u7D27\u63A5\u7740\uFF1B\u968F\u540E\uFF1B\u7D27\u63A5\u7740\u7684'},
  {en:'swing',cn:'\u79CB\u5343'},{en:'cry',cn:'\u54ED\uFF1B\u558A\u53EB'},
  {en:'until',cn:'\u76F4\u5230'},{en:'see a film',cn:'\u770B\u7535\u5F71'},
  {en:'row a boat',cn:'\u5212\u8239'},{en:'at the weekend',cn:'\u5728\u5468\u672B'},
  {en:'stay at home',cn:'\u5F85\u5728\u5BB6\u91CC'},{en:'goat',cn:'\u5C71\u7F8A'}
],sentences:[
  {en:'Children, what are you going to do this weekend?',cn:'\u5B69\u5B50\u4EEC\uFF0C\u4F60\u4EEC\u8FD9\u5468\u672B\u6253\u7B97\u505A\u4EC0\u4E48\uFF1F'},
  {en:'I\'m going to stay at home and watch TV with my grandparents.',cn:'\u6211\u6253\u7B97\u5F85\u5728\u5BB6\u91CC\u548C\u6211\u7684\u7237\u7237\u5976\u5976/\u5916\u516C\u5916\u5A46\u770B\u7535\u89C6\u3002'},
  {en:'I\'m going to see a film with my parents on Saturday afternoon.',cn:'\u6211\u6253\u7B97\u5468\u516D\u4E0B\u5348\u548C\u7236\u6BCD\u53BB\u770B\u7535\u5F71\u3002'},
  {en:'I\'m going to row a boat and fly a kite in the park on Sunday.',cn:'\u6211\u6253\u7B97\u5468\u65E5\u53BB\u516C\u56ED\u5212\u8239\u548C\u653E\u98CE\u7B5D\u3002'},
  {en:'I don\'t have any plans for the weekend.',cn:'\u6211\u6CA1\u6709\u5468\u672B\u8BA1\u5212\u3002'},
  {en:'Do you want to come with me, Alice?',cn:'\u4F60\u8981\u548C\u6211\u4E00\u8D77\u5417\uFF0C\u7231\u4E3D\u4E1D\uFF1F'},
  {en:'Sure. Thank you, Kitty.',cn:'\u597D\u5440\uFF0C\u8C22\u8C22\u4F60\uFF0C\u57FA\u8482\u3002'},
  {en:'I\'m going to build my house tomorrow.',cn:'\u6211\u660E\u5929\u518D\u5EFA\u623F\u5B50\u3002'},
  {en:'You should build your house now.',cn:'\u4F60\u5E94\u8BE5\u73B0\u5728\u5C31\u5EFA\u623F\u5B50\u3002'},
  {en:'Don\'t wait until tomorrow.',cn:'\u4ECA\u65E5\u4E8B\uFF0C\u4ECA\u65E5\u6BD5\u3002'}
]},
{id:'u_5bu6',name:'5BU6 - Holidays',words:[
  {en:'holiday',cn:'\u5047\u65E5\uFF1B\u5047\u671F'},{en:'clear',cn:'\u6E05\u6F88\u7684'},
  {en:'seafood',cn:'\u6D77\u9C9C'},{en:'hotel',cn:'\u65C5\u9986'},
  {en:'island',cn:'\u5C9B'},{en:'butterfly',cn:'\u8774\u8776'},
  {en:'how long',cn:'\u591A\u4E45'},{en:'go swimming',cn:'\u53BB\u6E38\u6CF3'},
  {en:'in the south of',cn:'\u5728...\u7684\u5357\u90E8'},{en:'all year round',cn:'\u4E00\u5E74\u5230\u5934'},
  {en:'wonderful',cn:'\u6781\u597D\u7684'},{en:'in a hotel by the sea',cn:'\u5728\u4E34\u6D77\u7684\u9152\u5E97'},
  {en:'Sea World',cn:'\u6D77\u6D0B\u4E16\u754C'},{en:'take notes',cn:'\u8BB0\u7B14\u8BB0'},
  {en:'warm enough',cn:'\u8DB3\u591F\u6E29\u6696'},{en:'tortoise',cn:'\u4E4C\u9F9F'},
  {en:'We\'ll = We will',cn:'\u6211\u4EEC\u5C06...'},{en:'beaches with clear water',cn:'\u6709\u5E72\u51C0\u6D77\u6C34\u7684\u6C99\u6EE9'},
  {en:'loud voice',cn:'\u5927\u58F0'},{en:'in the south of China',cn:'\u5728\u4E2D\u56FD\u5357\u90E8'},
  {en:'make no noise',cn:'\u4E0D\u53D1\u51FA\u566A\u58F0'}
],sentences:[
  {en:'How do we get there?',cn:'\u6211\u4EEC\u5C06\u600E\u4E48\u53BB\u90A3\uFF1F'},
  {en:'We get there by plane.',cn:'\u6211\u4EEC\u5C06\u4E58\u98DE\u673A\u53BB\u90A3\u3002'},
  {en:'How long will we stay in Sanya?',cn:'\u6211\u4EEC\u5C06\u5728\u4E09\u4E9A\u5F85\u591A\u4E45\uFF1F'},
  {en:'We\'ll stay there for five days.',cn:'\u6211\u4EEC\u5C06\u5F85 5 \u5929\u3002'},
  {en:'What will we do?',cn:'\u6211\u4EEC\u5C06\u505A\u4EC0\u4E48\uFF1F'},
  {en:'There are many wonderful beaches on the island and the weather is nice all year round.',cn:'\u5C9B\u4E0A\u6709\u8BB8\u591A\u6781\u597D\u7684\u6C99\u6EE9\uFF0C\u5E76\u4E14\u90A3\u513F\u7684\u5929\u6C14\u5168\u5E74\u90FD\u5F88\u597D\u3002'}
]}
];

function addDemo(){
  var changed=false;
  PRESETS.forEach(function(p){
    if(!db.units.some(function(u){return u.id===p.id;})){
      db.units.push({id:p.id,name:p.name,created:todayStr(),
        words:p.words.map(function(w){return{en:w.en,cn:w.cn,mastered:false,errCnt:0};}),
        sentences:p.sentences.slice()});
      changed=true;
    }
  });
  if(changed)saveDB();
}
