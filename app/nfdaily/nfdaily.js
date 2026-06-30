/**
 * 南网在线 · 每日签到(积分 + 查看电费账单)
 *
 * 抓取：打开「南网在线」App → 进入「我的 / 任务中心」→ 自动签到 → 抓 x-auth-token
 * 签到：cron 自动签到 + 检查电费账单任务(50积分/月)
 *
 * @Author: User
 * @Updated: 2026-06-30
 *
 * ===== Loon =====
 * [MITM]
 * hostname = 95598.csg.cn
 * [Script]
 * http-request ^https:\/\/95598\.csg\.cn\/mp\/w2\/szfw-points-txhsj\/ tag=南网在线 Cookie, script-path=https://raw.githubusercontent.com/你的用户名/paperclip/refs/heads/main/app/nfdaily/nfdaily.js, requires-body=true, img-url=
 * cron "30 8 * * *" script-path=https://raw.githubusercontent.com/你的用户名/paperclip/refs/heads/main/app/nfdaily/nfdaily.js, tag=南网在线签到, img-url=, enable=true
 * ===== Surge =====
 * [MITM]
 * hostname = 95598.csg.cn
 * [Script]
 * 南网在线 = type=http-request,pattern=^https:\/\/95598\.csg\.cn\/mp\/w2\/szfw-points-txhsj\/,requires-body=true,max-size=0,script-path=https://raw.githubusercontent.com/你的用户名/paperclip/refs/heads/main/app/nfdaily/nfdaily.js,img-url=
 * 南网在线签到 = type=cron,cronexp=30 8 * * *,timeout=60,script-path=https://raw.githubusercontent.com/你的用户名/paperclip/refs/heads/main/app/nfdaily/nfdaily.js,img-url=
 * ===== Quantumult X =====
 * [MITM]
 * hostname = 95598.csg.cn
 * [rewrite_local]
 * ^https:\/\/95598\.csg\.cn\/mp\/w2\/szfw-points-txhsj\/ url script-request-body https://raw.githubusercontent.com/你的用户名/paperclip/refs/heads/main/app/nfdaily/nfdaily.js
 * [task_local]
 * 30 8 * * * https://raw.githubusercontent.com/你的用户名/paperclip/refs/heads/main/app/nfdaily/nfdaily.js, tag=南网在线签到, img-url=, enabled=true
 * ===== Stash =====
 * cron:
 *   script:
 *     - name: 南网在线签到
 *       cron: '30 8 * * *'
 *       timeout: 60
 * http:
 *   mitm: ["95598.csg.cn"]
 *   script:
 *     - match: ^https:\/\/95598\.csg\.cn\/mp\/w2\/szfw-points-txhsj\/
 *       name: 南网在线 Cookie
 *       type: request
 *       require-body: true
 * script-providers:
 *   南网在线签到:
 *     url: https://raw.githubusercontent.com/你的用户名/paperclip/refs/heads/main/app/nfdaily/nfdaily.js
 *     interval: 86400
 */

const $ = new Env("南网在线");
const SCRIPT_VERSION = "2026-06-30.r1";
$.log(`[INFO] 脚本版本 ${SCRIPT_VERSION}`);

const KEY = "nfdaily_data";
const BASE = "https://95598.csg.cn";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21F90 Ariver/1.0.15 NWZX/Portal Nebula WK WK RVKType(0) NebulaX/1.0.0";
const REFERER_TASK = "https://0000000000000141.95598.csg.cn/0000000000000141/1.0.3.1/index.html#/pages/task/index";
const REFERER_BILL = "https://0000000000000123.95598.csg.cn/0000000000000123/1.0.51.0/index.html#pages/list-bills/index";
const SIGN_POINTS = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7 };

$.messages = [];

// ══════════════════════════════════
// rewrite 模式：抓取 x-auth-token
// ══════════════════════════════════

function captureAuth() {
  try {
    const low = {};
    Object.keys($request.headers || {}).forEach(k => { low[k.toLowerCase()] = $request.headers[k]; });
    const token = low["x-auth-token"];
    if (!token) { $.log("[capture] 无 x-auth-token，跳过"); return; }

    const prev = JSON.parse($.getdata(KEY) || "{}");
    const picked = { token, ua: low["user-agent"] || UA, referer: low["referer"] || REFERER_TASK, _ts: Date.now() };
    if (low["x-userid"]) picked.userId = low["x-userid"];
    $.setdata(JSON.stringify(picked), KEY);
    $.log(`[capture] token=${token.slice(0, 6)}…${token.slice(-4)}`);

    if (token !== prev.token)
      $.msg($.name, "✅ 南网在线 Token 获取成功", `token: ${token.slice(0, 6)}…${token.slice(-4)}`);
  } catch (e) { $.logErr(`[ERROR] 抓取异常: ${e}`); }
}

// ══════════════════════════════════
// HTTP 请求
// ══════════════════════════════════

function apiPost(path, body, refOverride) {
  return new Promise(resolve => {
    const stored = $.getdata(KEY);
    const data = JSON.parse(stored || "{}");
    let token = data.token || "";

    // 环境变量备用
    if (!token && typeof process !== "undefined" && process.env && process.env.NFDAILY_TOKEN)
      token = process.env.NFDAILY_TOKEN;

    if (!token) { $.log("[ERROR] 无 token"); return resolve(null); }

    const h = {
      "Content-Type": "application/json",
      "x-auth-token": token,
      Referer: refOverride || REFERER_TASK,
      "User-Agent": data.ua || UA,
      Accept: "*/*", "Accept-Language": "zh-CN,zh-Hans;q=0.9",
      Connection: "keep-alive", isdev: "0", "need-crypto": "0",
    };

    const opts = { url: BASE + path, headers: h, body: JSON.stringify(body || {}) };
    $.log(`[API] POST ${path.split("/").pop()}`);
    $.post(opts, (err, resp, body) => {
      if (err) { $.log(`[ERROR] ${path}: ${$.toStr(err)}`); return resolve(null); }
      try { resolve(JSON.parse(body)); } catch { $.log(`[ERROR] JSON: ${(body||"").slice(0,200)}`); resolve(null); }
    });
  });
}

// ══════════════════════════════════
// 每日签到
// ══════════════════════════════════

async function dailySign() {
  $.log("\n--- 📋 每日签到 ---");
  const data = await apiPost("/mp/w2/szfw-points-txhsj/taskInfo/taskSignList", {});
  if (!data || data.sta !== "00") { $.messages.push("❌ 查询签到状态失败"); return; }

  const sd = data.data || {};
  if (sd.taskFinishStatus === "1") { $.messages.push("✨ 今日已签到"); return; }

  const day = sd.singCount || 0;
  const points = SIGN_POINTS[day > 0 ? day : 1] || 1;
  const res = await apiPost("/mp/w2/szfw-points-txhsj/taskInfo/signOperate", { taskId: sd.taskId, thisGainPoints: points });

  if (res && res.sta === "00") $.messages.push(`✅ 签到成功,获得 ${res.data||points} 积分`);
  else $.messages.push(`❌ 签到失败: ${(res&&res.message)||"无响应"}`);
}

// ══════════════════════════════════
// 电费账单任务（50分/月）
// ══════════════════════════════════

async function billTask() {
  $.log("\n--- 📋 电费账单任务(50分/月) ---");
  const tasks = await apiPost("/mp/w2/szfw-points-txhsj/taskInfo/taskInfoList", {});
  if (!tasks || tasks.sta !== "00") { $.messages.push("❌ 查询任务列表失败"); return; }

  const bill = (tasks.data || []).find(t => /电费账单|houseNumDetail/.test(t.taskName||"") || /houseNumDetail/.test(t.taskLinkUrl||""));
  if (!bill) { $.log("[账单] 未找到任务"); return; }

  const st = bill.taskFinishStatus || "0";
  $.log(`[账单] status=${st}`);
  if (st === "1") { $.messages.push("✨ 本月电费账单已领取"); return; }

  if (st === "0") {
    const users = await apiPost("/mp/w2/wx/portal/eleCustNumber/queryBindEleUsers", {}, REFERER_BILL);
    if (!users || users.sta !== "00" || !users.data || !users.data.length) { $.messages.push("❌ 获取用电户号失败"); return; }
    const elecNo = users.data[0].eleCustNumber;
    $.log(`[账单] 户号=${elecNo}`);
    const vr = await apiPost("/mp/w2/szfw-points-txhsj/taskDock/viewElectricityCheck", { getOrView: "view", elecCustNo: elecNo }, REFERER_BILL);
    if (!vr || vr.sta !== "00") { $.messages.push("❌ 标记查看电费账单失败"); return; }
    $.log("[账单] ✅ 已标记查看");
    await $.wait(1000);
  }

  const cr = await apiPost("/mp/w2/szfw-points-txhsj/taskInfo/receive", { taskId: bill.taskId });
  if (cr && cr.sta === "00") $.messages.push("✅ 电费账单任务完成,获得 50 积分");
  else $.messages.push(`❌ 领取积分失败: ${(cr&&cr.message)||"无响应"}`);
}

// ══════════════════════════════════
// 入口
// ══════════════════════════════════

if (typeof $request !== "undefined") {
  captureAuth();
  $.done();
} else {
  (async () => {
    if ($.getdata("nfdaily_clear") === "true") {
      $.setdata("", KEY); $.setdata("false", "nfdaily_clear");
      $.messages.push("✅ Token 已清除，请重新抓取"); return;
    }
    if (!$.getdata(KEY) && (!process.env || !process.env.NFDAILY_TOKEN)) {
      // 不阻塞，apiPost 会再检查一次
    }
    await dailySign();
    await billTask();
  })()
    .catch(e => { $.messages.push(e.message || String(e)); $.logErr(e); })
    .finally(() => { if ($.messages.length) $.msg($.name, "", $.messages.join("\n")); $.done(); });
}

// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,a)=>{s.call(this,t,(t,s,r)=>{t?a(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}getEnv(){return"undefined"!=typeof $environment&&$environment["surge-version"]?"Surge":"undefined"!=typeof $environment&&$environment["stash-version"]?"Stash":"undefined"!=typeof module&&module.exports?"Node.js":"undefined"!=typeof $task?"Quantumult X":"undefined"!=typeof $loon?"Loon":"undefined"!=typeof $rocket?"Shadowrocket":void 0}isNode(){return"Node.js"===this.getEnv()}isQuanX(){return"Quantumult X"===this.getEnv()}isSurge(){return"Surge"===this.getEnv()}isLoon(){return"Loon"===this.getEnv()}isShadowrocket(){return"Shadowrocket"===this.getEnv()}isStash(){return"Stash"===this.getEnv()}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const a=this.getdata(t);if(a)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,a)=>e(a))})}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e);if(!s&&!a)return{};{const a=s?t:e;try{return JSON.parse(this.fs.readFileSync(a))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):a?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}getdata(t){if("Node.js"===this.getEnv()&&process.env[t])return process.env[t];return this.getval(t)}setdata(t,e){return this.setval(t,e)}getval(t){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.read(t);case"Quantumult X":return $prefs.valueForKey(t);case"Node.js":return this.data=this.loaddata(),this.data[t];default:return this.data&&this.data[t]||null}}setval(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.write(t,e);case"Quantumult X":return $prefs.setValueForKey(t,e);case"Node.js":return this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0;default:return this.data&&this.data[e]||null}}initGotEnv(t){/* no-op: native https */t&&(t.headers=t.headers||{});}get(t,e=(()=>{})){switch(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"],delete t.headers["content-type"],delete t.headers["content-length"]),t.params&&(t.url+="?"+this.queryStr(t.params)),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":{const p=require("https"),u=new URL(t.url),o={hostname:u.hostname,port:u.port||443,path:u.pathname+u.search,method:"GET",headers:t.headers||{},rejectUnauthorized:!1};const c=p.request(o,r=>{const i=[];r.on("data",d=>i.push(d)),r.on("end",()=>{const a=Buffer.concat(i),s=a.toString("utf-8");e(null,{status:r.statusCode,statusCode:r.statusCode,headers:r.headers,rawBody:a,body:s},s)})});c.on("error",d=>e(d)),c.end();break}}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";switch(t.body&&t.headers&&!t.headers["Content-Type"]&&!t.headers["content-type"]&&(t.headers["content-type"]="application/x-www-form-urlencoded"),t.headers&&(delete t.headers["Content-Length"],delete t.headers["content-length"]),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":{const p=require("https"),u=new URL(t.url),b=t.body||null,o={hostname:u.hostname,port:u.port||443,path:u.pathname+u.search,method:t.method||"POST",headers:t.headers||{},rejectUnauthorized:!1};b&&(o.headers["Content-Length"]=Buffer.byteLength(b));const c=p.request(o,r=>{const i=[];r.on("data",d=>i.push(d)),r.on("end",()=>{const a=Buffer.concat(i),s=a.toString("utf-8");e(null,{status:r.statusCode,statusCode:r.statusCode,headers:r.headers,rawBody:a,body:s},s)})});c.on("error",d=>e(d)),b&&c.write(b),c.end();break}}}time(t,e=null){const s=e?new Date(e):new Date;let a={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in a)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?a[e]:("00"+a[e]).substr((""+a[e]).length)));return t}queryStr(t){let e="";for(const s in t){let a=t[s];null!=a&&""!==a&&("object"==typeof a&&(a=JSON.stringify(a)),e+=`${s}=${a}&`)}return e=e.substring(0,e.length-1),e}msg(e=t,s="",a="",r){if(!this.isMute)switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:$notification.post(e,s,a);break;case"Quantumult X":$notify(e,s,a);break;case"Node.js":console.log(`\n==============📣 通知 📣==============\n${e}\n${s}\n${a}\n`)}if(!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),a&&t.push(a),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:this.log("",`❗️${this.name}, 错误!`,t);break;case"Node.js":this.log("",`❗️${this.name}, 错误!`,t.stack)}}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;switch(this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:$done(t);break;case"Node.js":process.exit(1)}}}(t,e)}