/**
 * 长城汽车 每日签到 + 盲盒抽奖
 * @Updated: 2026-07-01
 */

const $ = new Env("\u957f\u57ce\u6c7d\u8f66");
$.log("[INFO] 2026-07-01.r1");

const KEY = "gwm_data";
const BASE = "https://gapp-api.gwmapp-h.com";
const APPID = "GWM-H5-110001";

/* Load secrets from config (base64 encoded to avoid truncation) */
var _cfg = {"secret_b64": "OGJjNzQyODU5YTc4NDllYzlhOTI0Yzk3OWFmYTVhOWE=", "sign_secret_b64": "R1dNLUg1LTExMDAwMThiYzc0Mjg1OWE3ODQ5ZWM5YTkyNGM5NzlhZmE1YTlh", "appid": "GWM-H5-110001", "authtype": "BMP", "sourceapp": "GWM"};
var SECRET = atob(_cfg.secret_b64);
var SIGN_SECRET = atob(_cfg.sign_secret_b64);
var AUTHTYPE = _cfg.authtype;
var SOURCEAPP = _cfg.sourceapp;
var SOURCETYPE = "H5";
var SOURCEAPPVER = "2.0.9";
var REFERER = "https://hippo-app-hw.gwmapp-h.com/";
var ORIGIN = "https://hippo-app-hw.gwmapp-h.com";
var UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 fromappios sapp cVer=2.0.9";

function sha256(str) {
  if (typeof require !== "undefined") {
    try { return require("crypto").createHash("sha256").update(str, "utf8").digest("hex"); } catch(_) {}
  }
  return _sha256(str);
}
function _sha256(message) {
  var K=[0x428A2F98,0x71374491,0xB5C0FBCF,0xE9B5DBA5,0x3956C25B,0x59F111F1,0x923F82A4,0xAB1C5ED5,0xD807AA98,0x12835B01,0x243185BE,0x550C7DC3,0x72BE5D74,0x80DEB1FE,0x9BDC06A7,0xC19BF174,0xE49B69C1,0xEFBE4786,0xFC19DC6,0x240CA1CC,0x2DE92C6F,0x4A7484AA,0x5CB0A9DC,0x76F988DA,0x983E5152,0xA831C66D,0xB00327C8,0xBF597FC7,0xC6E00BF3,0xD5A79147,0x650A735,0x14292967,0x27B70A85,0x2E1B2138,0x4D2C6DFC,0x53380D13,0x650A7354,0x766A0ABB,0x81C2C92E,0x92722C85,0xA2BFE8A1,0xA81A664B,0xC24B8B70,0xC76C51A3,0xD192E819,0xD6990624,0xF40E3585,0x106AA070,0x19A4C116,0x1E376C08,0x2748774C,0x34B0BCB5,0x391C0CB3,0x4ED8AA4A,0x5B9CCA4F,0x682E6FF3,0x748F82EE,0x78A5636F,0x84C87814,0x8CC70208,0x90BEFFFA,0xA4506CEB,0xBEF9A3F7,0xC67178F2];
  function sA(x,y){var l=(x&0xFFFF)+(y&0xFFFF),m=(x>>16)+(y>>16)+(l>>16);return(m<<16)|(l&0xFFFF)}
  function RR(v,n){return(v>>>n)|(v<<(32-n))}
  function ch(x,y,z){return(x&y)^(~x&z)}
  function maj(x,y,z){return(x&y)^(x&z)^(y&z)}
  function sig0(x){return RR(x,2)^RR(x,13)^RR(x,22)}
  function sig1(x){return RR(x,6)^RR(x,11)^RR(x,25)}
  function gam0(x){return RR(x,7)^RR(x,18)^(x>>>3)}
  function gam1(x){return RR(x,17)^RR(x,19)^(x>>>10)}
  function hex(n){return((1<<8)|n).toString(16).slice(1)}
  var msg=new TextEncoder().encode(message),len=msg.length*8,blk=[0x80];
  while(blk.length%64!==56)blk.push(0);
  for(var i=56;i>=0;i-=8)blk.push((len>>>i)&0xFF);
  var H=[0x6A09E667,0xBB67AE85,0x3C6EF372,0xA54FF53A,0x510E527F,0x9B05688C,0x1F83D9AB,0x5BE0CD19];
  for(var off=0;off<blk.length;off+=64){
    var W=new Array(64);
    for(var i=0;i<64;i++)W[i]=i<16?((blk[off+i]<<24)|(blk[off+i+1]<<16)|(blk[off+i+2]<<8)|blk[off+i+3])>>>0:0;
    for(var i=16;i<64;i++)W[i]=(sA(sA(sA(gam1(W[i-2]),W[i-7]),gam0(W[i-15])),W[i-16]))>>>0;
    var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
    for(var i=0;i<64;i++){
      var T1=sA(sA(sA(sA(h,sig1(e)),ch(e,f,g)),K[i]),W[i]);
      var T2=sA(sig0(a),maj(a,b,c));
      h=g;g=f;f=e;e=(d+T1)>>>0;d=c;c=b;b=a;a=(T1+T2)>>>0;
    }
    H=[(H[0]+a)>>>0,(H[1]+b)>>>0,(H[2]+c)>>>0,(H[3]+d)>>>0,(H[4]+e)>>>0,(H[5]+f)>>>0,(H[6]+g)>>>0,(H[7]+h)>>>0];
  }
  return H.map(function(h){return hex(h>>>24)+hex(h>>>16)+hex(h>>>8)+hex(h)}).join("");
}
function calcSign(ts){return sha256(ts+SIGN_SECRET)}

function buildHeaders(stored){
  var ts=Date.now().toString();
  return{
    "Authorization":stored.token||"","Authtype":AUTHTYPE,"sourceApp":SOURCEAPP,"sourcetype":SOURCETYPE,
    "AppID":APPID,"Secret":SECRET,"TimeStamp":ts,"sign":calcSign(ts),
    "sourceAppVer":stored.sourceAppVer||SOURCEAPPVER,"G-Token":stored.gToken||"",
    "Content-Type":"application/json","Referer":REFERER,"Origin":ORIGIN,"User-Agent":stored.ua||UA,
    "Accept":"application/json, text/plain, */*"
  }
}

$.messages = [];

function captureAuth(){
  try{
    var low={};Object.keys($request.headers||{}).forEach(function(k){low[k.toLowerCase()]=$request.headers[k]});
    var auth=low["authorization"]||"",gToken=low["g-token"]||"";
    if(!auth&&!gToken){$.log("[capture] no token");return}
    var prev=JSON.parse($.getdata(KEY)||"{}");
    var picked={token:auth,gToken:gToken,userId:prev.userId||"",ua:low["user-agent"]||UA,sourceAppVer:low["sourceappver"]||SOURCEAPPVER,_ts:Date.now()};
    try{var body=JSON.parse($request.body||"{}");if(body.userId)picked.userId=body.userId}catch(_){}
    $.setdata(JSON.stringify(picked),KEY);
    if(typeof GWM_DEBUG!=="undefined"&&GWM_DEBUG)$.log("[debug] token="+(auth||"").slice(0,10)+" userId="+picked.userId);
    if(auth!==prev.token||gToken!==prev.gToken)
      $.msg($.name,"Token OK","auth: "+(auth||"").slice(0,10)+" uid: "+(picked.userId||"?"));
  }catch(e){$.logErr("[ERROR] "+e)}
}

function loadUserConfig(){
  try{
    var cfgPath=require("path").join(__dirname,"config.json");
    var cfg=JSON.parse(require("fs").readFileSync(cfgPath,"utf8"));
    return{token:cfg.token||"",userId:cfg.userId||"",gToken:cfg.gToken||""};
  }catch(_){return{}}
}
function apiPost(path,body){
  return new Promise(function(resolve){
    // 优先级: 变量(gwm_data/环境变量) > config.json(仅fallback)
    var stored=JSON.parse($.getdata(KEY)||"{}");
    if(typeof process!=="undefined"&&process.env){
      if(process.env.GWM_TOKEN&&!stored.token)stored.token=process.env.GWM_TOKEN;
      if(process.env.GWM_USERID&&!stored.userId)stored.userId=process.env.GWM_USERID;
    }
    var cfg=loadUserConfig();
    if(!stored.token&&cfg.token)stored.token=cfg.token;
    if(!stored.userId&&cfg.userId)stored.userId=cfg.userId;
    if(!stored.gToken&&cfg.gToken)stored.gToken=cfg.gToken;
    if(!stored.token||!stored.userId){$.log("[ERROR] 无 token/userId");return resolve(null)}
    $.post({url:BASE+path,headers:buildHeaders(stored),body:JSON.stringify(body||{userId:stored.userId})},function(err,resp,body){
      if(err){$.log("[ERROR] "+path+": "+$.toStr(err));return resolve(null)}
      try{resolve(JSON.parse(body))}catch(_){$.log("[ERROR] JSON: "+(body||"").slice(0,200));resolve(null)}
    })
  })
}
function apiGet(path){
  return new Promise(function(resolve){
    var stored=JSON.parse($.getdata(KEY)||"{}");
    if(!stored.token){
      var cfg=loadUserConfig();
      if(cfg.token)stored.token=cfg.token;
      if(cfg.userId)stored.userId=cfg.userId;
      if(cfg.gToken)stored.gToken=cfg.gToken;
    }
    if(!stored.token){$.log("[ERROR] 无 token");return resolve(null)}
    $.get({url:BASE+path,headers:buildHeaders(stored)},function(err,resp,body){
      if(err){$.log("[ERROR] "+path+": "+$.toStr(err));return resolve(null)}
      try{resolve(JSON.parse(body))}catch(_){$.log("[ERROR] JSON: "+(body||"").slice(0,200));resolve(null)}
    })
  })
}

async function dailySign(){
  var DEBUG=typeof GWM_DEBUG!=="undefined"&&GWM_DEBUG;
  var lastSignRes=null;
  var stored=JSON.parse($.getdata(KEY)||"{}");
  var cfg=loadUserConfig();
  if(!stored.userId&&cfg.userId)stored.userId=cfg.userId;
  if(!stored.token&&cfg.token)stored.token=cfg.token;
  if(!stored.gToken&&cfg.gToken)stored.gToken=cfg.gToken;
  if(!stored.userId){$.messages.push("缺少 userId，请重新抓取");return}

  // 1. 查询签到状态
  var info=await apiPost("/community-u/v1/app/uc/sign/info");
  if(!info||info.code!==0){$.messages.push("查询失败: "+((info&&info.message)||"网络错误"));return}
  var d=info.data||{};
  var signed=d.todayIsSuccessSign===1;
  var days=d.continuousCount||0;
  var allDays=d.allContinuousCount||0;
  if(DEBUG){$.log("[debug] sign/info data:");for(var k in d){$.log("  "+k+": "+d[k])}}

  if(signed){
    $.messages.push("✨ 今日已签到｜盲盒进度 "+days+"/7 天｜已连续签到 "+allDays+" 天");
  }else{
    // 2. 执行签到
    var res=await apiPost("/community-u/v1/user/sign/sureNew");lastSignRes=res;
    if(res&&res.code===0){
      if(DEBUG)$.log("[debug] sureNew:",$.toStr(res.data));
    }else{
      $.messages.push("❌ 签到失败: "+((res&&res.message)||"请稍后重试"));
      return;
    }
  }

  // 3. 盲盒（连续7天可抽）
  await new Promise(function(r){setTimeout(r,500)});
  var info2=await apiPost("/community-u/v1/app/uc/sign/info");
  var d2=(info2&&info2.data)||{};
  var c2=d2.continuousCount||0;
  var a2=d2.allContinuousCount||0;

  // 更新日志（签到后）
  if(!signed){
    $.messages.pop(); // 移除之前可能的签到成功消息
    $.messages.push("✅ 签到成功｜盲盒进度 "+c2+"/7 天｜已连续签到 "+a2+" 天");
  }

  if(c2>=7){
    var prize=await apiGet("/community-u/v1/app/user/sign/prize-record/extractPrize/");
    if(prize&&prize.code===0&&prize.data){
      $.messages.push("🎁 "+prize.data.tipTitle+": "+prize.data.prizeName);
    }else if(prize){
      if(DEBUG)$.log("[debug] 盲盒:",prize.message);
    }
  }else{
    var remain=7-c2;
    $.messages.push("📦 连签 "+c2+" 天，再签 "+remain+" 天开盲盒");
  }

  // 4. 积分
  var score=await apiGet("/api-u/v1/user/score/get");
  if(score&&score.code===0&&score.data){
    var sd=score.data;
    var pts=sd.totalPoint||0;
    var exp=sd.pointInvalidingValue||0;
    var expDate=sd.pointInvalidDate||"";
    $.messages.push("💰 积分: "+pts+"（"+exp+" 将于 "+expDate+" 过期）");
    if(DEBUG)$.log("[debug] remindPoint:",sd.remindPoint);
  }
}

if(typeof $request!=="undefined"){captureAuth();$.done()}
else{(async function(){
  if($.getdata("gwm_clear")==="true"){$.setdata("",KEY);$.setdata("false","gwm_clear");$.messages.push("token cleared");return}
  await dailySign();
})().catch(function(e){$.messages.push(e.message||String(e));$.logErr(e)})
     .finally(function(){if($.messages.length)$.msg($.name,"",$.messages.join("\n"));$.done()});
}

function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,a)=>{s.call(this,t,(t,s,r)=>{t?a(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}getEnv(){return"undefined"!=typeof $environment&&$environment["surge-version"]?"Surge":"undefined"!=typeof $environment&&$environment["stash-version"]?"Stash":"undefined"!=typeof module&&module.exports?"Node.js":"undefined"!=typeof $task?"Quantumult X":"undefined"!=typeof $loon?"Loon":"undefined"!=typeof $rocket?"Shadowrocket":void 0}isNode(){return"Node.js"===this.getEnv()}isQuanX(){return"Quantumult X"===this.getEnv()}isSurge(){return"Surge"===this.getEnv()}isLoon(){return"Loon"===this.getEnv()}isShadowrocket(){return"Shadowrocket"===this.getEnv()}isStash(){return"Stash"===this.getEnv()}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const a=this.getdata(t);if(a)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,a)=>e(a))})}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e);if(!s&&!a)return{};{const a=s?t:e;try{return JSON.parse(this.fs.readFileSync(a))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):a?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}getdata(t){if("Node.js"===this.getEnv()&&process.env[t])return process.env[t];return this.getval(t)}setdata(t,e){return this.setval(t,e)}getval(t){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.read(t);case"Quantumult X":return $prefs.valueForKey(t);case"Node.js":return this.data=this.loaddata(),this.data[t];default:return this.data&&this.data[t]||null}}setval(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.write(t,e);case"Quantumult X":return $prefs.setValueForKey(t,e);case"Node.js":return this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0;default:return this.data&&this.data[e]||null}}initGotEnv(t){/* no-op: native https */t&&(t.headers=t.headers||{});}get(t,e=(()=>{})){switch(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"],delete t.headers["content-type"],delete t.headers["content-length"]),t.params&&(t.url+="?"+this.queryStr(t.params)),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":{const p=require("https"),u=new URL(t.url),o={hostname:u.hostname,port:u.port||443,path:u.pathname+u.search,method:"GET",headers:t.headers||{},rejectUnauthorized:!1};const c=p.request(o,r=>{const i=[];r.on("data",d=>i.push(d)),r.on("end",()=>{const a=Buffer.concat(i),s=a.toString("utf-8");e(null,{status:r.statusCode,statusCode:r.statusCode,headers:r.headers,rawBody:a,body:s},s)})});c.on("error",d=>e(d)),c.end();break}}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";switch(t.body&&t.headers&&!t.headers["Content-Type"]&&!t.headers["content-type"]&&(t.headers["content-type"]="application/x-www-form-urlencoded"),t.headers&&(delete t.headers["Content-Length"],delete t.headers["content-length"]),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":{const p=require("https"),u=new URL(t.url),b=t.body||null,o={hostname:u.hostname,port:u.port||443,path:u.pathname+u.search,method:t.method||"POST",headers:t.headers||{},rejectUnauthorized:!1};b&&(o.headers["Content-Length"]=Buffer.byteLength(b));const c=p.request(o,r=>{const i=[];r.on("data",d=>i.push(d)),r.on("end",()=>{const a=Buffer.concat(i),s=a.toString("utf-8");e(null,{status:r.statusCode,statusCode:r.statusCode,headers:r.headers,rawBody:a,body:s},s)})});c.on("error",d=>e(d)),b&&c.write(b),c.end();break}}}time(t,e=null){const s=e?new Date(e):new Date;let a={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in a)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?a[e]:("00"+a[e]).substr((""+a[e]).length)));return t}queryStr(t){let e="";for(const s in t){let a=t[s];null!=a&&""!==a&&("object"==typeof a&&(a=JSON.stringify(a)),e+=`${s}=${a}&`)}return e=e.substring(0,e.length-1),e}msg(e=t,s="",a="",r){if(!this.isMute)switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:$notification.post(e,s,a);break;case"Quantumult X":$notify(e,s,a);break;case"Node.js":console.log(`\n==============📣 通知 📣==============\n${e}\n${s}\n${a}\n`)}if(!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),a&&t.push(a),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:this.log("",`❗️${this.name}, 错误!`,t);break;case"Node.js":this.log("",`❗️${this.name}, 错误!`,t.stack)}}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;switch(this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:$done(t);break;case"Node.js":process.exit(1)}}}(t,e)}
