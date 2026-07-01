/**
 * 合胜百货 · 每日签到 (合胜集团微会员)
 *
 * 抓取：打开微信 → 合胜百货小程序 → 登录 → 自动抓 session
 * 签到：cron 自动签到，每天 10 积分，连续 30 天额外 300 积分
 * 签名：MD5(JSON(body) + "&sk=" + MD5(SIGN_KEY)) 从小程序解包获得
 *
 * @Author: User
 * @Updated: 2026-07-01
 *
 * ===== Loon =====
 * [MITM]
 * hostname = 120.78.175.218
 * [Script]
 * http-request ^https:\\/\\/120\\.78\\.175\\.218\\/EnjoyMobile_Core\\/Enjoy\\/Service script-path=https://raw.githubusercontent.com/s1sunny/quanx_scripts/refs/heads/main/app/hesheng/hesheng.js, tag=合胜百货 Cookie, requires-body=true, img-url=
 * cron "30 8 * * *" script-path=https://raw.githubusercontent.com/s1sunny/quanx_scripts/refs/heads/main/app/hesheng/hesheng.js, tag=合胜百货签到, img-url=, enable=true
 * ===== Surge =====
 * [MITM]
 * hostname = 120.78.175.218
 * [Script]
 * 合胜百货 = type=http-request,pattern=^https:\\/\\/120\\.78\\.175\\.218\\/EnjoyMobile_Core\\/Enjoy\\/Service,requires-body=true,script-path=https://raw.githubusercontent.com/s1sunny/quanx_scripts/refs/heads/main/app/hesheng/hesheng.js,img-url=
 * 合胜百货签到 = type=cron,cronexp=30 8 * * *,timeout=60,script-path=https://raw.githubusercontent.com/s1sunny/quanx_scripts/refs/heads/main/app/hesheng/hesheng.js,img-url=
 * ===== Quantumult X =====
 * [MITM]
 * hostname = 120.78.175.218
 * [rewrite_local]
 * ^https:\\/\\/120\\.78\\.175\\.218\\/EnjoyMobile_Core\\/Enjoy\\/Service url script-request-body https://raw.githubusercontent.com/s1sunny/quanx_scripts/refs/heads/main/app/hesheng/hesheng.js
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
 *       type: request
 *       require-body: true
 * script-providers:
 *   合胜百货签到:
 *     url: https://raw.githubusercontent.com/s1sunny/quanx_scripts/refs/heads/main/app/hesheng/hesheng.js
 *     interval: 86400
 */

const $ = new Env("合胜百货");
const SCRIPT_VERSION = "2026-07-01.r2";
$.log(`[INFO] 脚本版本 ${SCRIPT_VERSION}`);

const KEY = "hesheng_data";
const BASE = "https://www.sthsbh.com/EnjoyMobile_Core/Enjoy/Service";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.75(0x18004b2f) NetType/WIFI Language/zh_CN";
const REFERER = "https://servicewechat.com/wxa664cde255dca09c/34/page-frame.html";
const APPID = "wxa664cde255dca09c";
const VERSION = "V5.25.05.25";
const CHANNEL = "会员(微信小程序)";
const SIGN_KEY = "66DC5DF67634474DBCEA76202F778977";
const SESSION_VALID_HOURS = 3;

$.messages = [];

// ══════════════════════════════════
// MD5 (纯 JS 实现，兼容 QuanX/Surge/Loon)
// ══════════════════════════════════

function md5(s) {
  var hex_chr = "0123456789abcdef".split("");
  function rhex(n) {
    var j, out = "";
    for (j = 0; j < 4; j++) out += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
    return out;
  }
  function str2blks_MD5(s) {
    var nblk = ((s.length + 8) >> 6) + 1, blks = new Array(nblk * 16), i;
    for (i = 0; i < nblk * 16; i++) blks[i] = 0;
    for (i = 0; i < s.length; i++) blks[i >> 2] |= (s.charCodeAt(i) & 0xFF) << ((i % 4) * 8);
    blks[i >> 2] |= 0x80 << ((i % 4) * 8);
    blks[nblk * 16 - 2] = s.length * 8;
    return blks;
  }
  function add(x, y) { var lsw = (x & 0xFFFF) + (y & 0xFFFF); return (((x >> 16) + (y >> 16) + (lsw >> 16)) << 16) | (lsw & 0xFFFF); }
  function rol(n, c) { return (n << c) | (n >>> (32 - c)); }
  function cmn(q, a, b, x, s, t) { return add(rol(add(add(a, q), add(x, t)), s), b); }
  function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
  function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
  function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
  function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }
  var x = str2blks_MD5(s);
  var a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;
  for (var i = 0; i < x.length; i += 16) {
    var olda = a, oldb = b, oldc = c, oldd = d;
    a = ff(a, b, c, d, x[i+0], 7, 0xD76AA478); d = ff(d, a, b, c, x[i+1], 12, 0xE8C7B756); c = ff(c, d, a, b, x[i+2], 17, 0x242070DB); b = ff(b, c, d, a, x[i+3], 22, 0xC1BDCEEE);
    a = ff(a, b, c, d, x[i+4], 7, 0xF57C0FAF); d = ff(d, a, b, c, x[i+5], 12, 0x4787C62A); c = ff(c, d, a, b, x[i+6], 17, 0xA8304613); b = ff(b, c, d, a, x[i+7], 22, 0xFD469501);
    a = ff(a, b, c, d, x[i+8], 7, 0x698098D8); d = ff(d, a, b, c, x[i+9], 12, 0x8B44F7AF); c = ff(c, d, a, b, x[i+10], 17, 0xFFFF5BB1); b = ff(b, c, d, a, x[i+11], 22, 0x895CD7BE);
    a = ff(a, b, c, d, x[i+12], 7, 0x6B901122); d = ff(d, a, b, c, x[i+13], 12, 0xFD987193); c = ff(c, d, a, b, x[i+14], 17, 0xA679438E); b = ff(b, c, d, a, x[i+15], 22, 0x49B40821);
    a = gg(a, b, c, d, x[i+1], 5, 0xF61E2562); d = gg(d, a, b, c, x[i+6], 9, 0xC040B340); c = gg(c, d, a, b, x[i+11], 14, 0x265E5A51); b = gg(b, c, d, a, x[i+0], 20, 0xE9B6C7AA);
    a = gg(a, b, c, d, x[i+5], 5, 0xD62F105D); d = gg(d, a, b, c, x[i+10], 9, 0x02441453); c = gg(c, d, a, b, x[i+15], 14, 0xD8A1E681); b = gg(b, c, d, a, x[i+4], 20, 0xE7D3FBC8);
    a = gg(a, b, c, d, x[i+9], 5, 0x21E1CDE6); d = gg(d, a, b, c, x[i+14], 9, 0xC33707D6); c = gg(c, d, a, b, x[i+3], 14, 0xF4D50D87); b = gg(b, c, d, a, x[i+8], 20, 0x455A14ED);
    a = gg(a, b, c, d, x[i+13], 5, 0xA9E3E905); d = gg(d, a, b, c, x[i+2], 9, 0xFCEFA3F8); c = gg(c, d, a, b, x[i+7], 14, 0x676F02D9); b = gg(b, c, d, a, x[i+12], 20, 0x8D2A4C8A);
    a = hh(a, b, c, d, x[i+5], 4, 0xFFFA3942); d = hh(d, a, b, c, x[i+8], 11, 0x8771F681); c = hh(c, d, a, b, x[i+11], 16, 0x6D9D6122); b = hh(b, c, d, a, x[i+14], 23, 0xFDE5380C);
    a = hh(a, b, c, d, x[i+1], 4, 0xA4BEEA44); d = hh(d, a, b, c, x[i+4], 11, 0x4BDECFA9); c = hh(c, d, a, b, x[i+7], 16, 0xF6BB4B60); b = hh(b, c, d, a, x[i+10], 23, 0xBEBFBC70);
    a = hh(a, b, c, d, x[i+13], 4, 0x289B7EC6); d = hh(d, a, b, c, x[i+0], 11, 0xEAA127FA); c = hh(c, d, a, b, x[i+3], 16, 0xD4EF3085); b = hh(b, c, d, a, x[i+6], 23, 0x04881D05);
    a = hh(a, b, c, d, x[i+9], 4, 0xD9D4D039); d = hh(d, a, b, c, x[i+12], 11, 0xE6DB99E5); c = hh(c, d, a, b, x[i+15], 16, 0x1FA27CF8); b = hh(b, c, d, a, x[i+2], 23, 0xC4AC5665);
    a = ii(a, b, c, d, x[i+0], 6, 0xF4292244); d = ii(d, a, b, c, x[i+7], 10, 0x432AFF97); c = ii(c, d, a, b, x[i+14], 15, 0xAB9423A7); b = ii(b, c, d, a, x[i+5], 21, 0xFC93A039);
    a = ii(a, b, c, d, x[i+12], 6, 0x655B59C3); d = ii(d, a, b, c, x[i+3], 10, 0x8F0CCC92); c = ii(c, d, a, b, x[i+10], 15, 0xFFEFF47D); b = ii(b, c, d, a, x[i+1], 21, 0x85845DD1);
    a = ii(a, b, c, d, x[i+8], 6, 0x6FA87E4F); d = ii(d, a, b, c, x[i+15], 10, 0xFE2CE6E0); c = ii(c, d, a, b, x[i+6], 15, 0xA3014314); b = ii(b, c, d, a, x[i+13], 21, 0x4E0811A1);
    a = ii(a, b, c, d, x[i+4], 6, 0xF7537E82); d = ii(d, a, b, c, x[i+11], 10, 0xBD3AF235); c = ii(c, d, a, b, x[i+2], 15, 0x2AD7D2BB); b = ii(b, c, d, a, x[i+9], 21, 0xEB86D391);
    a = add(a, olda); b = add(b, oldb); c = add(c, oldc); d = add(d, oldd);
  }
  return (rhex(a) + rhex(b) + rhex(c) + rhex(d)).toUpperCase();
}

function calculateSign(body) {
  var bodyStr = JSON.stringify(body);
  var sk = md5(SIGN_KEY);
  // 编码为 UTF-8 字节数组，与服务器端一致
  var input = bodyStr + "&sk=" + sk;
  var bytes = [];
  for (var i = 0; i < input.length; i++) {
    var c = input.charCodeAt(i);
    if (c < 0x80) { bytes.push(c); }
    else if (c < 0x800) { bytes.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F)); }
    else if (c < 0xD800 || c >= 0xE000) { bytes.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F)); }
    else { i++; c = 0x10000 + (((c & 0x3FF) << 10) | (input.charCodeAt(i) & 0x3FF)); bytes.push(0xF0 | (c >> 18), 0x80 | ((c >> 12) & 0x3F), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F)); }
  }
  return md5Bytes(bytes);
}

function md5Bytes(bytes) {
  // MD5 over a byte array (not a string)
  var hex_chr = "0123456789abcdef".split("");
  function rhex(n) { var j, out = ""; for (j = 0; j < 4; j++) out += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F]; return out; }
  function add(x, y) { var lsw = (x & 0xFFFF) + (y & 0xFFFF); return (((x >> 16) + (y >> 16) + (lsw >> 16)) << 16) | (lsw & 0xFFFF); }
  function rol(n, c) { return (n << c) | (n >>> (32 - c)); }
  function cmn(q, a, b, x, s, t) { return add(rol(add(add(a, q), add(x, t)), s), b); }
  function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
  function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
  function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
  function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }
  var nblk = ((bytes.length + 8) >> 6) + 1, blks = new Array(nblk * 16), i, j;
  for (i = 0; i < nblk * 16; i++) blks[i] = 0;
  for (i = 0; i < bytes.length; i++) blks[i >> 2] |= bytes[i] << ((i % 4) * 8);
  blks[i >> 2] |= 0x80 << ((i % 4) * 8);
  blks[nblk * 16 - 2] = bytes.length * 8;
  var a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;
  for (var i = 0; i < blks.length; i += 16) {
    var olda = a, oldb = b, oldc = c, oldd = d;
    a = ff(a, b, c, d, blks[i+0], 7, 0xD76AA478); d = ff(d, a, b, c, blks[i+1], 12, 0xE8C7B756); c = ff(c, d, a, b, blks[i+2], 17, 0x242070DB); b = ff(b, c, d, a, blks[i+3], 22, 0xC1BDCEEE);
    a = ff(a, b, c, d, blks[i+4], 7, 0xF57C0FAF); d = ff(d, a, b, c, blks[i+5], 12, 0x4787C62A); c = ff(c, d, a, b, blks[i+6], 17, 0xA8304613); b = ff(b, c, d, a, blks[i+7], 22, 0xFD469501);
    a = ff(a, b, c, d, blks[i+8], 7, 0x698098D8); d = ff(d, a, b, c, blks[i+9], 12, 0x8B44F7AF); c = ff(c, d, a, b, blks[i+10], 17, 0xFFFF5BB1); b = ff(b, c, d, a, blks[i+11], 22, 0x895CD7BE);
    a = ff(a, b, c, d, blks[i+12], 7, 0x6B901122); d = ff(d, a, b, c, blks[i+13], 12, 0xFD987193); c = ff(c, d, a, b, blks[i+14], 17, 0xA679438E); b = ff(b, c, d, a, blks[i+15], 22, 0x49B40821);
    a = gg(a, b, c, d, blks[i+1], 5, 0xF61E2562); d = gg(d, a, b, c, blks[i+6], 9, 0xC040B340); c = gg(c, d, a, b, blks[i+11], 14, 0x265E5A51); b = gg(b, c, d, a, blks[i+0], 20, 0xE9B6C7AA);
    a = gg(a, b, c, d, blks[i+5], 5, 0xD62F105D); d = gg(d, a, b, c, blks[i+10], 9, 0x02441453); c = gg(c, d, a, b, blks[i+15], 14, 0xD8A1E681); b = gg(b, c, d, a, blks[i+4], 20, 0xE7D3FBC8);
    a = gg(a, b, c, d, blks[i+9], 5, 0x21E1CDE6); d = gg(d, a, b, c, blks[i+14], 9, 0xC33707D6); c = gg(c, d, a, b, blks[i+3], 14, 0xF4D50D87); b = gg(b, c, d, a, blks[i+8], 20, 0x455A14ED);
    a = gg(a, b, c, d, blks[i+13], 5, 0xA9E3E905); d = gg(d, a, b, c, blks[i+2], 9, 0xFCEFA3F8); c = gg(c, d, a, b, blks[i+7], 14, 0x676F02D9); b = gg(b, c, d, a, blks[i+12], 20, 0x8D2A4C8A);
    a = hh(a, b, c, d, blks[i+5], 4, 0xFFFA3942); d = hh(d, a, b, c, blks[i+8], 11, 0x8771F681); c = hh(c, d, a, b, blks[i+11], 16, 0x6D9D6122); b = hh(b, c, d, a, blks[i+14], 23, 0xFDE5380C);
    a = hh(a, b, c, d, blks[i+1], 4, 0xA4BEEA44); d = hh(d, a, b, c, blks[i+4], 11, 0x4BDECFA9); c = hh(c, d, a, b, blks[i+7], 16, 0xF6BB4B60); b = hh(b, c, d, a, blks[i+10], 23, 0xBEBFBC70);
    a = hh(a, b, c, d, blks[i+13], 4, 0x289B7EC6); d = hh(d, a, b, c, blks[i+0], 11, 0xEAA127FA); c = hh(c, d, a, b, blks[i+3], 16, 0xD4EF3085); b = hh(b, c, d, a, blks[i+6], 23, 0x04881D05);
    a = hh(a, b, c, d, blks[i+9], 4, 0xD9D4D039); d = hh(d, a, b, c, blks[i+12], 11, 0xE6DB99E5); c = hh(c, d, a, b, blks[i+15], 16, 0x1FA27CF8); b = hh(b, c, d, a, blks[i+2], 23, 0xC4AC5665);
    a = ii(a, b, c, d, blks[i+0], 6, 0xF4292244); d = ii(d, a, b, c, blks[i+7], 10, 0x432AFF97); c = ii(c, d, a, b, blks[i+14], 15, 0xAB9423A7); b = ii(b, c, d, a, blks[i+5], 21, 0xFC93A039);
    a = ii(a, b, c, d, blks[i+12], 6, 0x655B59C3); d = ii(d, a, b, c, blks[i+3], 10, 0x8F0CCC92); c = ii(c, d, a, b, blks[i+10], 15, 0xFFEFF47D); b = ii(b, c, d, a, blks[i+1], 21, 0x85845DD1);
    a = ii(a, b, c, d, blks[i+8], 6, 0x6FA87E4F); d = ii(d, a, b, c, blks[i+15], 10, 0xFE2CE6E0); c = ii(c, d, a, b, blks[i+6], 15, 0xA3014314); b = ii(b, c, d, a, blks[i+13], 21, 0x4E0811A1);
    a = ii(a, b, c, d, blks[i+4], 6, 0xF7537E82); d = ii(d, a, b, c, blks[i+11], 10, 0xBD3AF235); c = ii(c, d, a, b, blks[i+2], 15, 0x2AD7D2BB); b = ii(b, c, d, a, blks[i+9], 21, 0xEB86D391);
    a = add(a, olda); b = add(b, oldb); c = add(c, oldc); d = add(d, oldd);
  }
  return (rhex(a) + rhex(b) + rhex(c) + rhex(d)).toUpperCase();
}

// ══════════════════════════════════
// rewrite 请求模式：抓取 session 头
// ══════════════════════════════════

function captureSession() {
  try {
    var low = {};
    Object.keys($request.headers || {}).forEach(function(k) { low[k.toLowerCase()] = $request.headers[k]; });
    var session = low["session"] || "";
    if (!session) { $.log("[capture] 无 session 头"); return; }

    var prev = JSON.parse($.getdata(KEY) || "{}");
    var picked = { session: session, userNo: low["userno"] || "", _ts: Date.now() };
    $.setdata(JSON.stringify(picked), KEY);
    $.log("[capture] session=" + session.slice(0, 8) + "…" + session.slice(-4));

    if (session !== prev.session)
      $.msg($.name, "✅ 合胜百货 Session 获取成功", "session: " + session.slice(0, 8) + "…" + session.slice(-4));
  } catch (e) { $.logErr("[ERROR] 抓取异常: " + e); }
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

    // 计算签名
    var sign = calculateSign(body);

    const h = {
      "Content-Type": "application/json;charset=utf-8",
      "Host": "www.sthsbh.com",
      "session": session,
      "appId": APPID,
      "storeId": "11101",
      "sign": sign,
      "appType": encodeURIComponent(CHANNEL),
      "business": "",
      Referer: REFERER,
      "User-Agent": UA,
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

if (typeof $request !== "undefined") {
  // 请求捕获模式（script-request-body / http-request）
  captureSession();
  $done({});
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