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
