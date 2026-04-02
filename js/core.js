// ============ MULTI-USER ============
var CUR_USER=null;
function getAllUsers(){try{return JSON.parse(localStorage.getItem('wm_users'))||[];}catch(e){return[];}}
function saveAllUsers(u){localStorage.setItem('wm_users',JSON.stringify(u));}
function getUserDB(name){try{return JSON.parse(localStorage.getItem('wm_u_'+name))||newDB();}catch(e){return newDB();}}
function saveUserDB(name,d){localStorage.setItem('wm_u_'+name,JSON.stringify(d));}
function newDB(){return{units:[],errBank:[],stats:{sessions:0,streak:0,lastDate:'',calendar:{}}};}
var db=newDB();

function loginUser(name){
  name=name.trim();if(!name)return false;
  CUR_USER=name;
  var users=getAllUsers();
  if(users.indexOf(name)<0){users.push(name);saveAllUsers(users);}
  db=getUserDB(name);
  localStorage.setItem('wm_last_user',name);
  return true;
}
function saveDB(){if(CUR_USER)saveUserDB(CUR_USER,db);}
function logoutUser(){CUR_USER=null;db=newDB();localStorage.removeItem('wm_last_user');showPage('pageLogin',false);pageStack=['pageLogin'];}

// ============ NAV ============
var pageStack=['pageLogin'];
var curUnit=null;
// Bottom nav pages: home, wordbank, errors, stats
var navPages=['pageHome','pageWordbank','pageErr','pageStats'];

function showPage(id,push){
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');});
  var el=document.getElementById(id);if(el)el.classList.add('active');
  if(push!==false)pageStack.push(id);
  var bb=document.getElementById('backBtn'),bn=document.getElementById('bottomNav');
  var isNav=navPages.indexOf(id)>=0;
  var isLogin=id==='pageLogin';
  bb.style.display=(!isNav&&!isLogin)?'block':'none';
  bn.style.display=isLogin?'none':'flex';
  if(isNav)document.querySelectorAll('.nav-item').forEach(function(n,i){n.classList.toggle('active',navPages[i]===id);});
  updHeader(id);window.scrollTo(0,0);
  if(id==='pageHome')renderHome();
  if(id==='pageWordbank')renderWordbank();
  if(id==='pageErr')renderErrBank();
  if(id==='pageStats')renderStats();
}
function goBack(){pageStack.pop();showPage(pageStack.length?pageStack[pageStack.length-1]:'pageHome',false);}
function navTo(id){pageStack=[id];showPage(id);}
function updHeader(id){
  var h=document.getElementById('headerTitle'),s=document.getElementById('headerSub');
  var m={pageLogin:['WordMaster','\u82F1\u8BED\u80CC\u8BF5\u5C0F\u52A9\u624B'],pageHome:['WordMaster',CUR_USER?'Hi, '+CUR_USER+' \uD83D\uDC4B':''],pageWordbank:['\u{1F4DA} \u8BCD\u5E93\u7BA1\u7406',''],pageEdit:['\u270F\uFE0F \u7F16\u8F91\u8BCD\u5E93',''],pageDetail:['\u{1F4D6} \u8BCD\u5E93\u8BE6\u60C5',''],pageStudyWords:['\u{1F4D6} \u80CC\u5355\u8BCD','\u9009\u62E9\u5355\u5143\u548C\u7EC3\u4E60\u65B9\u5F0F'],pageStudySents:['\u{1F4DD} \u80CC\u53E5\u5B50','\u9009\u62E9\u5355\u5143\u548C\u7EC3\u4E60\u65B9\u5F0F'],pageTestMenu:['\u{1F3AF} \u7EFC\u5408\u6D4B\u8BD5','\u9009\u62E9\u5355\u5143\u548C\u6D4B\u8BD5\u7C7B\u578B'],pageSentFlash:['\u{1F0CF} \u53E5\u5B50\u7FFB\u5361',''],pageUnitSel:['\u{1F4DD} \u7EFC\u5408\u68C0\u6D4B',''],pageQuiz:['\u{1F4DD} \u68C0\u6D4B\u4E2D',''],pageChoice:['\u{1F524} \u4E2D\u82F1\u4E92\u9009',''],pageSpell:['\u270F\uFE0F \u62FC\u5199\u9ED8\u5199',''],pageSentFill:['\u{1F4DD} \u53E5\u5B50\u586B\u7A7A',''],pageSentWrite:['\u{1F4D6} \u6574\u53E5\u9ED8\u5199',''],pageFlash:['\u{1F0CF} \u7FFB\u5361\u5B66\u4E60',''],pageVoice:['\u{1F3A4} \u8BED\u97F3\u6717\u8BFB',''],pageErr:['\u{1F4D5} \u9519\u9898\u5E93',''],pageStats:['\u{1F4CA} \u5B66\u4E60\u8BB0\u5F55','']};
  if(m[id]){h.textContent=m[id][0];s.textContent=m[id][1];}
}

// ============ UTILS ============
function esc(s){var d=document.createElement('div');d.textContent=s||'';return d.innerHTML;}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=0|Math.random()*(i+1),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function speak(text,lang){if(!window.speechSynthesis)return;speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(text);u.lang=lang||'en-US';u.rate=.85;speechSynthesis.speak(u);}
function levenshtein(a,b){var m=a.length,n=b.length,d=[];for(var i=0;i<=m;i++)d[i]=[i];for(var j=0;j<=n;j++)d[0][j]=j;for(i=1;i<=m;i++)for(j=1;j<=n;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[m][n];}
function dots(cid,total,cur,wrongs){var h='';for(var i=0;i<total;i++){var c='quiz-dot';if(i<cur)c+=wrongs.indexOf(i)>=0?' wrong-dot':' done';else if(i===cur)c+=' cur';h+='<div class="'+c+'"></div>';}document.getElementById(cid).innerHTML=h;}
function getUnit(id){return db.units.find(function(u){return u.id===id;});}
function todayStr(){return new Date().toISOString().slice(0,10);}

// ============ MEMORY CURVE ============
var INTERVALS=[1,2,4,7,15];
function calcPriority(e){
  var now=Date.now(),last=new Date(e.lastErr||e.addedDate).getTime();
  var days=Math.max(1,Math.floor((now-last)/864e5));
  var rv=e.reviewCount||0,interval=INTERVALS[Math.min(rv,INTERVALS.length-1)];
  return (days>=interval?2:1)*(e.count||1)/(rv+1);
}

// ============ ERROR BANK (auto-remove after 3 consecutive correct) ============
function addToErrBank(word,sent){
  var key=(word?word.en:(sent?sent.en:'')).toLowerCase();if(!key)return;
  var ex=db.errBank.find(function(e){return e.key===key;});
  if(ex){ex.count++;ex.lastErr=todayStr();ex.streak=0;}
  else db.errBank.push({key:key,en:word?word.en:(sent?sent.en:''),cn:word?word.cn:(sent?sent.cn:''),type:word?'word':'sentence',count:1,reviewCount:0,streak:0,addedDate:todayStr(),lastErr:todayStr()});
  saveDB();
}
function markErrCorrect(key){
  var e=db.errBank.find(function(x){return x.key===key;});
  if(!e)return;
  e.streak=(e.streak||0)+1;
  e.reviewCount=(e.reviewCount||0)+1;
  if(e.streak>=3){db.errBank=db.errBank.filter(function(x){return x.key!==key;});}
  saveDB();
}
function markErrWrong(key){
  var e=db.errBank.find(function(x){return x.key===key;});
  if(e){e.streak=0;e.count++;e.lastErr=todayStr();}
  saveDB();
}

// ============ RESULT OVERLAY ============
function showResult(correct,total,title){
  var rate=total>0?Math.round(correct/total*100):0;
  var em=rate>=90?'\u{1F3C6}':rate>=70?'\u{1F389}':rate>=50?'\u{1F4AA}':'\u{1F4DA}';
  var msg=rate>=90?'\u592A\u68D2\u4E86\uFF01':rate>=70?'\u505A\u5F97\u4E0D\u9519\uFF01':rate>=50?'\u518D\u7EC3\u7EC3\uFF01':'\u591A\u7EC3\u51E0\u6B21\u5C31\u597D\u4E86\uFF01';
  document.getElementById('resultEmoji').textContent=em;
  document.getElementById('resultTitle').textContent=title;
  document.getElementById('resultScoreNum').textContent=correct+'/'+total;
  document.getElementById('resultDesc').textContent=msg+' \u6B63\u786E\u7387 '+rate+'%';
  document.getElementById('resultOverlay').style.display='flex';
}
function closeResult(){document.getElementById('resultOverlay').style.display='none';if(curUnit)openUnit(curUnit);else navTo('pageHome');}
function recordSession(){
  db.stats.sessions=(db.stats.sessions||0)+1;
  var today=todayStr();
  if(!db.stats.calendar)db.stats.calendar={};
  db.stats.calendar[today]=(db.stats.calendar[today]||0)+1;
  if(db.stats.lastDate!==today){
    var yd=new Date(Date.now()-864e5).toISOString().slice(0,10);
    db.stats.streak=db.stats.lastDate===yd?(db.stats.streak||0)+1:1;
    db.stats.lastDate=today;
  }
  saveDB();
}
