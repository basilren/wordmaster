var http=require('http'),fs=require('fs'),path=require('path');
var mime={'.html':'text/html;charset=utf-8','.css':'text/css;charset=utf-8','.js':'application/javascript;charset=utf-8'};
http.createServer(function(q,r){
  var u=q.url==='/'?'/index.html':q.url.split('?')[0];
  var f=path.join(__dirname,u);
  fs.readFile(f,function(e,d){
    if(e){r.writeHead(404);r.end('Not found');}
    else{r.writeHead(200,{'Content-Type':mime[path.extname(f)]||'text/plain'});r.end(d);}
  });
}).listen(8765,function(){console.log('http://localhost:8765');});
