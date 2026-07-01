/**
 * 合胜百货 · 每日签到 (合胜集团微会员)
 *
 * 抓取：打开微信 → 合胜百货小程序 → 登录 → 自动抓 session
 * 签到：cron 自动签到，每天 10 积分，连续 30 天额外 300 积分
 *
 * @Author: User
 * @Updated: 2026-07-01
 *
 * ===== Loon =====
 * [MITM]
 * hostname = 120.78.175.218
 * [Script]
 * http-response ^https:\\/\\/120\\.78\\.175\\.218\\/EnjoyMobile_Core\\/Enjoy\\/Service requires-body=true, script-path=https://raw.githubusercontent.com/s1sunny/quanx_scripts/refs/heads/main/app/hesheng/hesheng.js, tag=合胜百货 Cookie, img-url=
 * cron "30 8 * * *" script-path=https://raw.githubusercontent.com/s1sunny/quanx_scripts/refs/heads/main/app/hesheng/hesheng.js, tag=合胜百货签到, img-url=, enable=true
 * ===== Surge =====
 * [MITM]
 * hostname = 120.78.175.218
 * [Script]
 * 合胜百货 = type=http-response,pattern=^https:\\/\\/120\\.78\\.175\\.218\\/EnjoyMobile_Core\\/Enjoy\\/Service,requires-body=true,script-path=https://raw.githubusercontent.com/s1sunny/quanx_scripts/refs/heads/main/app/hesheng/hesheng.js,img-url=
 * 合胜百货签到 = type=cron,cronexp=30 8 * * *,timeout=60,script-path=https://raw.githubusercontent.com/s1sunny/quanx_scripts/refs/heads/main/app/hesheng/hesheng.js,img-url=
 * ===== Quantumult X =====
 * [MITM]
 * hostname = 120.78.175.218
 * [rewrite_local]
 * ^https:\\/\\/120\\.78\\.175\\.218\\/EnjoyMobile_Core\\/Enjoy\\/Service url script-response-body https://raw.githubusercontent.com/s1sunny/quanx_scripts/refs/heads/main/app/hesheng/hesheng.js
 * [task_local]
 * 30 8 * * * https://raw.githubusercontent.com/s1sunny/quanx_scripts/refs/heads/main/app/hesheng/hesheng.js, tag=合胜百货签到, img-url=, enabled=true
 * ===== Stash =====
 * cron:
 *   script:
 *     - name: 合胜百货签到
 *       cron: '30 8 * * *'
 *       timeout: 60
 * http:
 *   mitm: ["120.78.175.218"]
 *   script:
 *     - match: ^https:\\/\\/120\\.78\\.175\\.218\\/EnjoyMobile_Core\\/Enjoy\\/Service
 *       name: 合胜百货 Cookie
 *       type: response
 *       require-body: true
 * script-providers:
 *   合胜百货签到:
 *     url: https://raw.githubusercontent.com/s1sunny/quanx_scripts/refs/heads/main/app/hesheng/hesheng.js
 *     interval: 86400
 */

const $ = new Env("合胜百货");
const SCRIPT_VERSION = "2026-07-01.r1";
$.log(`[INFO] 脚本版本 ${SCRIPT_VERSION}`);

const KEY = "hesheng_data";
const BASE = "https://120.78.175.218/EnjoyMobile_Core/Enjoy/Service";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.75(0x18004b2f) NetType/WIFI Language/zh_CN";
const REFERER = "https://servicewechat.com/wxa664cde255dca09c/34/page-frame.html";
const APPID = "wxa664cde255dca09c";
const VERSION = "V5.25.05.25";
const CHANNEL = "会员(微信小程序)";

$.messages = [];

// ══════════════════════════════════
// rewrite 响应模式：抓取 session
// ══════════════════════════════════

function captureSession() {
  try {
    const body = $response.body;
    if (!body) { $.log("[capture] 无响应体"); return; }
    const obj = JSON.parse(body);
    if (!obj.ObjectData || !obj.ObjectData.session) {
      // 非登录响应，跳过
      return;
    }
    const session = obj.ObjectData.session;
    const userNo = obj.ObjectData.userNo || "";
    $.log(`[capture] session=${session.slice(0, 8)}…${session.slice(-4)}, userNo=${userNo}`);

    const prev = JSON.parse($.getdata(KEY) || "{}");
    const picked = { session, userNo, _ts: Date.now() };
    $.setdata(JSON.stringify(picked), KEY);

    if (session !== prev.session)
      $.msg($.name, "✅ 合胜百货 Session 获取成功", `session: ${session.slice(0, 8)}…${session.slice(-4)}`);
  } catch (e) { $.logErr(`[ERROR] 抓取异常: ${e}`); }
}

// ══════════════════════════════════
// HTTP 请求
// ══════════════════════════════════

function apiPost(methodName, uniqueKey, objectData) {
  return new Promise(resolve => {
    const stored = $.getdata(KEY);
    const data = JSON.parse(stored || "{}");
    let session = data.session || "";

    // 环境变量备用
    if (!session && typeof process !== "undefined" && process.env && process.env.HESHENG_SESSION)
      session = process.env.HESHENG_SESSION;

    if (!session) { $.log("[ERROR] 无 session"); return resolve(null); }

    const now = new Date();
    const clientTime = now.toISOString().replace(/\.\d+Z$/, "Z");
    // 统一格式: "2026-07-01T03:38:29.080Z"
    const clientTimeLocal = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}T${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}.${String(now.getMilliseconds()).padStart(3,"0")}Z`;

    const body = {
      UniqueKey: uniqueKey,
      MethodName: methodName,
      UserNo: data.userNo || "",
      ClientTime: clientTimeLocal,
      ObjectData: objectData || {},
      Tag: null,
      Channel: CHANNEL,
      SessionId: session,
      Version: VERSION,
      AppId: APPID,
      business: ""
    };

    const h = {
      "Content-Type": "application/json;charset=utf-8",
      "session": session,
      Referer: REFERER,
      "User-Agent": UA,
      Accept: "*/*",
      "Accept-Language": "zh-CN,zh-Hans;q=0.9",
      Connection: "keep-alive",
    };

    const opts = { url: BASE, headers: h, body: JSON.stringify(body) };
    $.log(`[API] ${methodName}`);
    $.post(opts, (err, resp, body) => {
      if (err) { $.log(`[ERROR] ${methodName}: ${$.toStr(err)}`); return resolve(null); }
      try { resolve(JSON.parse(body)); }
      catch { $.log(`[ERROR] JSON: ${(body||"").slice(0,200)}`); resolve(null); }
    });
  });
}

// ══════════════════════════════════
// 每日签到
// ══════════════════════════════════

async function dailySign() {
  $.log("\n--- 📋 每日签到 ---");

  // 1. 获取签到策略（含 policyId）
  const policy = await apiPost("GetSignPolicyWithCache", "移动会员签到记录", {});
  if (!policy || !policy.ObjectData || !policy.ObjectData.length) {
    $.messages.push("❌ 获取签到策略失败");
    return;
  }
  const policyId = policy.ObjectData[0].c_guid;
  $.log(`[签到] policyId=${policyId}`);

  // 2. 查询签到历史 - 判断今天是否已签
  const stored = JSON.parse($.getdata(KEY) || "{}");
  const userNo = stored.userNo || "";
  if (!userNo) { $.messages.push("❌ 无 userNo，请重新抓取"); return; }

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${now.getMonth()+1}-1`;
  const monthEnd = `${now.getFullYear()}-${now.getMonth()+2}-1`;
  const history = await apiPost("GetSignHistory", "移动会员签到记录", {
    IsNotPage: true,
    Tag: {
      sCustomerNo: userNo,
      sPolicyGuid: policyId,
      dtSDate: monthStart,
      dtEDate: monthEnd
    }
  });

  // 检查是否已签到
  if (history && history.ObjectData && Array.isArray(history.ObjectData) && history.ObjectData.length > 0) {
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
    const signedToday = history.ObjectData.some(r => {
      const dt = (r.dtSignDate || "").substring(0, 10);
      return dt === today;
    });
    if (signedToday) {
      $.messages.push("✨ 今日已签到");
      return;
    }
  }

  // 3. 执行签到
  const signResult = await apiPost("SignIn", "移动会员签到记录", {
    session: (JSON.parse($.getdata(KEY) || "{}")).session || "",
    policyId: policyId,
    storeId: "1"
  });

  if (signResult && signResult.ObjectData && signResult.ObjectData.gifts && signResult.ObjectData.gifts.length) {
    const points = signResult.ObjectData.gifts[0].c_gift_amount || 0;
    $.messages.push(`✅ 签到成功,获得 ${points} 积分`);
  } else {
    $.messages.push(`❌ 签到失败: ${JSON.stringify(signResult)}`);
  }
}

// ══════════════════════════════════
// 入口
// ══════════════════════════════════

if (typeof $response !== "undefined") {
  // 响应捕获模式
  captureSession();
  $done({});
} else if (typeof $request !== "undefined") {
  $done();
} else {
  (async () => {
    if ($.getdata("hesheng_clear") === "true") {
      $.setdata("", KEY); $.setdata("false", "hesheng_clear");
      $.messages.push("✅ Session 已清除，请重新抓取"); return;
    }
    await dailySign();
  })()
    .catch(e => { $.messages.push(e.message || String(e)); $.logErr(e); })
    .finally(() => { if ($.messages.length) $.msg($.name, "", $.messages.join("\n")); $.done(); });
}

// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,a)=>{s.call(this,t,(t,s,r)=>{t?a(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}getEnv(){return"undefined"!=typeof $environment&&$environment["surge-version"]?"Surge":"undefined"!=typeof $environment&&$environment["stash-version"]?"Stash":"undefined"!=typeof module&&module.exports?"Node.js":"undefined"!=typeof $task?"Quantumult X":"undefined"!=typeof $loon?"Loon":"undefined"!=typeof $rocket?"Shadowrocket":void 0}isNode(){return"Node.js"===this.getEnv()}isQuanX(){return"Quantumult X"===this.getEnv()}isSurge(){return"Surge"===this.getEnv()}isLoon(){return"Loon"===this.getEnv()}isShadowrocket(){return"Shadowrocket"===this.getEnv()}isStash(){return"Stash"===this.getEnv()}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const a=this.getdata(t);if(a)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,a)=>e(a))})}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e);if(!s&&!a)return{};{const a=s?t:e;try{return JSON.parse(this.fs.readFileSync(a))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t)?t:e;this.fs.writeFileSync(s,JSON.stringify(this.data));}}lodash_get(t,e,s){const a=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of a)if(r=Object(r)[t],void 0===r)return s;return r}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(...t)}logErr(t,e=!1){const s=String(t);e?this.log(`\n! ${s}`):this.log(`\n! ${s}`)}wait(t){return new Promise(e=>setTimeout(e,t))}msg(t=e="",e="",s="",a=""){const r=t?t:this.name;let n=s;const o=this.getdata("message")||"";if(o&&(n=o+this.logSeparator+n),this.setdata(n,"message"),this.isMute)return;const i=this.getEnv();if("Surge"===i||"Loon"===i||"Stash"===i)$notification.post(r,e,n,{"url":a});if("Quantumult X"===i)$notify(r,e,n,{"open-url":a});if("Node.js"===i)this.log(`\n${r}\n${e}${n?`\n${n}`:""}`)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const s=t.replace(/^@/,""),a=this.getval(s);if(a)try{const s=JSON.parse(a);t=s[t];}catch(t){}e?e=this.getval(e):e=this.getval(t)}return e}setdata(t,e){return this.setval(t,e)}getval(t){return this.isNode()?(this.data=this.loaddata(),this.data[t]):this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isStash()?$persistentStore.read(t):void 0}setval(t,e){return this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isStash()?$persistentStore.write(t,e):void 0}get(t,e){return!t&&console.log("http get 未传入参数"),this.http.get(t,e)}post(t,e){return!t&&console.log("http post 未传入参数"),this.http.post(t,e)}done(t={}){$done(t)}}}