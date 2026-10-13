import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
// Local QA of Vercel's legacy simulator rewrite after build:vercel.
const root=path.resolve('dist');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2','.pack':'application/octet-stream'};
http.createServer((req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  let file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);res.end();return;}
  if(file===root)file=path.join(root,'index.html');
  if(!fs.existsSync(file)||!fs.statSync(file).isFile())file=path.join(root,'legacy.html');
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
  fs.createReadStream(file).on('error',()=>{res.destroy();}).pipe(res);
 }catch{res.writeHead(400);res.end();}
}).listen(4180,'127.0.0.1',()=>console.log('Production simulator rewrite preview on 4180'));
