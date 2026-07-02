/**
 * 美的会员 每日签到（新版 API：mcsp-api.midea.com）
 * 认证方式: ucAccessToken（头部 Token）
 * 签到接口: POST /im/game/page/sign（活动中心打卡签到）
 * @兼容: Quantumult X / Surge / Loon / Node.js
 * @Updated: 2026-07-02
 *
 * 环境变量（Node.js）:
 *   midea_token   = ucAccessToken（必填）
 *   midea_openid  = openId（可选，用于查询签到详情）
 *
 * 配置（QuanX等）:
 *   box.dat 中 midea_uc_token
 *
 * 重写规则捕获 Token（QuanX）:
 *   https:\/\/mcsp\.midea\.com\/api\/cms_bff\/mcsp-uc-mvip-bff\/app\/login\/wx\/mini\/getLoginInfo\.do url script-response-body midea.js
 */

const $ = new Env("美的会员");
if (typeof $done !== "undefined") $.done = $done;

// ===== 固定凭证（小程序内置，非用户敏感信息） =====
const APP_ID = "ee07f27990db48109efcccd322d3a873";
const API_KEY = "b6db9d5cf2d449538d3a0dd5d77b2e35";
const APP_SECRET = "2646746f07bb46199aff49002e6dce81";

// ===== 签到参数（固定） =====
const ACTV_ID = "401670810827462661";
const ROOT_CODE = "DJ";
const APP_CODE = "DJ_WX";
const GAME_ID = "28";
const CHANNEL_ID = "401670810907154451";
const TEMPLATE_ID = "2";

const CK_NAME = "midea_uc_token";
const OI_NAME = "midea_openid";

// ===== 公共 User-Agent =====
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.50(0x1800323c) NetType/WIFI Language/zh_CN";

// ===== 构建请求头 =====
function buildHeaders(host, token) {
    var h = {
        "apikey": API_KEY,
        "appId": APP_ID,
        "appsecret": APP_SECRET,
        "ucAccessToken": token,
        "userKey": token,
        "Content-Type": "application/json",
        "Accept-Encoding": "gzip,compress,br,deflate",
        "miniAppVersion": "3.0.311",
        "User-Agent": UA
    };
    if (host) h.Host = host;
    return h;
}

// ===== HTTP POST 封装 =====
function httpPost(url, body, host) {
    return new Promise(function (resolve, reject) {
        var token = $.isNode() ? process.env.midea_token : $.getdata(CK_NAME);
        if (!token) token = '';
        $.post({
            url: url,
            headers: buildHeaders(host, token),
            body: JSON.stringify(body)
        }, function (err, resp, data) {
            if (err) { reject(err); return; }
            try { resolve(JSON.parse(data)); }
            catch (e) { reject(e); }
        });
    });
}

// ===== 1. 签到打卡 =====
async function doSignIn() {
    var url = "https://mcsp-api.midea.com/api/cms_api/activity-center-im-service/im-svr/im/game/page/sign?apikey=" + API_KEY;
    return await httpPost(url, {
        restParams: { gameId: GAME_ID, actvId: ACTV_ID, rootCode: ROOT_CODE, appCode: APP_CODE }
    });
}

// ===== 2. 查询签到状态 =====
async function getSignStatus() {
    var oid = $.isNode() ? process.env.midea_openid : $.getdata(OI_NAME);
    if (!oid) oid = 'oXZrx5KN0wvJOJvORMaXJmii-GnI';
    var url = "https://mcsp-api.midea.com/api/cms_api/activity-center-im-service/im-svr/cmimp/activity/initData?apikey=" + API_KEY;
    return await httpPost(url, {
        restParams: {
            actvId: ACTV_ID, rootCode: ROOT_CODE, appCode: APP_CODE,
            userType: 1, openId: oid, templateId: TEMPLATE_ID,
            channelId: CHANNEL_ID, wasLogin: true
        }
    });
}

// ===== 3. 查询会员信息（积分/成长值） =====
async function getUserInfo() {
    return await httpPost(
        "https://mcsp.midea.com/api/cms_bff/mcsp-uc-mvip-bff/member/getProMemberInfo.do",
        { restParams: {}, _timeStamp: Date.now() },
        "mcsp.midea.com"
    );
}

// ===== 主流程 =====
async function main() {
    console.log("\n========== 美的会员 签到 ==========\n");

    var token = $.isNode() ? process.env.midea_token : $.getdata(CK_NAME);
    if (!token) {
        var msg = "❌ 未配置 ucAccessToken，请设置环境变量 midea_token";
        console.log(msg);
        $.notifyMsg.push(msg);
        return;
    }
    console.log("🔑 Token: " + token.substring(0, 20) + "...");

    // --- 1. 签到 ---
    console.log("\n▶ 执行签到...");
    var signResult = await doSignIn();
    console.log("   响应:", JSON.stringify(signResult));

    if (signResult && signResult.code === "000000") {
        var d = signResult.data;
        if (d && d.result === true) {
            var rn = (d.dailyRewardInfo && d.dailyRewardInfo.name) || "签到完成";
            var rp = (d.dailyRewardInfo && d.dailyRewardInfo.points) ? "（+" + d.dailyRewardInfo.points + "积分）" : "";
            var m = "✅ 签到成功！连续 " + d.consecutiveDays + " 天，奖励 " + rn + rp;
            console.log("   " + m);
            $.notifyMsg.push(m);
        } else {
            var m = "ℹ️ 今日已签到";
            console.log("   " + m);
            $.notifyMsg.push(m);
        }
    } else {
        var err = signResult ? (signResult.msg || signResult.message || JSON.stringify(signResult)) : "无响应";
        console.log("   ❌ 签到失败：" + err);
        $.notifyMsg.push("❌ 签到失败：" + err);
    }

    // --- 2. 查会员信息 ---
    console.log("\n▶ 查询会员信息...");
    var userInfo = await getUserInfo();
    if (userInfo && userInfo.code === "000000") {
        var u = userInfo.data;
        var m = "👤 " + (u.nickName || "未知") + " | 积分 " + (u.vipPoint || 0) + " | 成长值 " + (u.vipGrow || 0) + " | " + (u.levelName || "");
        console.log("   " + m);
        $.notifyMsg.push(m);
    } else {
        console.log("   ⚠️ 查询会员信息失败");
    }

    // --- 3. 查签到状态 ---
    console.log("\n▶ 查询签到状态...");
    var statusResult = await getSignStatus();
    if (statusResult && statusResult.code === "000000" && statusResult.data && statusResult.data.length > 0) {
        var game = statusResult.data[0];
        var m = "📊 活动积分: " + (game.totalScore || 0);
        console.log("   " + m);
        $.notifyMsg.push(m);
        if (game.rollSignList && game.rollSignList.length > 0) {
            var recent = game.rollSignList.slice(-7);
            var cal = recent.map(function (r) {
                var day = (r.signDate || "").slice(4);
                return (r.isToday ? "[" : "") + day + (r.signStatus === "1" ? "✅" : "⬜") + (r.isToday ? "]" : "");
            }).join(" ");
            console.log("   📅 " + cal);
        }
    }

    console.log("\n========== 完成 ==========");
}

// ===== Token 捕获（重写模式） =====
async function captureToken() {
    if (!$request || $request.method === 'OPTIONS') { $.done({}); return; }
    try {
        var bodyStr = '';
        if (typeof $response.body === 'string') bodyStr = $response.body;
        else if (typeof $response.bodyBytes !== 'undefined') bodyStr = String($response.bodyBytes);
        if (!bodyStr) { $.done({}); return; }
        var resp = JSON.parse(bodyStr);
        if (resp && resp.data && resp.data.ucAccessToken) {
            $.setdata(resp.data.ucAccessToken, CK_NAME);
            if (resp.data.openId) $.setdata(resp.data.openId, OI_NAME);
            var brief = resp.data.ucAccessToken.substring(0, 20) + "...";
            $.msg($.name, "", "✅ 捕获 ucAccessToken 成功\n" + brief);
            console.log("Token 已保存: " + brief);
        }
    } catch (e) {
        console.log("捕获Token异常: " + (e.message || e));
    }
    $.done({});
}

// ===== 入口 =====
!(async function () {
    if (typeof $request !== "undefined") {
        await captureToken();
        return;
    }
    await main();
})().catch(function (e) {
    var m = e.message || e;
    console.log(m);
    $.notifyMsg.push(m);
}).finally(function () {
    if ($.notifyMsg.length > 0) {
        $.msg($.name, '', $.notifyMsg.join('\n'));
    }
    $.done();
});

// ====== Env.js 框架 ======
function Env(t, e) {
    return new (class {
        constructor(t, e) {
            this.name = t; this.data = null; this.dataFile = "box.dat";
            this.logs = []; this.isMute = false; this.isNeedRewrite = false;
            this.logSeparator = "\n"; this.startTime = Date.now();
            this.notifyMsg = [];
            Object.assign(this, e); this.log("", "🔔" + this.name + ", 开始!");
        }
        getEnv() {
            return typeof $environment != "undefined" && $environment["surge-version"] ? "Surge"
                : typeof $environment != "undefined" && $environment["stash-version"] ? "Stash"
                : typeof module != "undefined" && module.exports ? "Node.js"
                : typeof $task != "undefined" ? "Quantumult X"
                : typeof $loon != "undefined" ? "Loon"
                : typeof $rocket != "undefined" ? "Shadowrocket" : void 0;
        }
        isNode() { return "Node.js" === this.getEnv(); }
        isQuanX() { return "Quantumult X" === this.getEnv(); }
        isSurge() { return "Surge" === this.getEnv(); }
        isLoon() { return "Loon" === this.getEnv(); }
        getdata(t) { var e = this.getval(t); if (/^@/.test(t)) { var s = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s[1]) : ""; if (r) try { e = this._get(JSON.parse(r), s[2], ""); } catch (t) { e = "" } } return e; }
        setdata(t, e) { if (/^@/.test(e)) { var s = /^@(.*?)\.(.*?)$/.exec(e), a = this.getval(s[1]), r = a ? ("null" === a ? null : a) : "{}"; try { var i = JSON.parse(r); this._set(i, s[2], t); return this.setval(JSON.stringify(i), s[1]); } catch (e) {} } return this.setval(t, e); }
        getval(t) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.read(t); case "Quantumult X": return $prefs.valueForKey(t); case "Node.js": return (this.data = this._load(), this.data[t]); default: return this.data && this.data[t] || null; } }
        setval(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.write(t, e); case "Quantumult X": return $prefs.setValueForKey(t, e); case "Node.js": return (this.data = this._load(), this.data[e] = t, this._save(), true); default: return this.data && this.data[e] || null } }
        _load() { if (!this.isNode()) return {}; var f = require("fs"), p = require("path"), a = p.resolve(this.dataFile), r = p.resolve(process.cwd(), this.dataFile), s = f.existsSync(a), i = !s && f.existsSync(r), o = s ? a : i ? r : null; if (!o) return {}; try { return JSON.parse(f.readFileSync(o, "utf8")) } catch (t) { return {} } }
        _save() { if (this.isNode()) require("fs").writeFileSync(this.dataFile, JSON.stringify(this.data), "utf8") }
        _get(t, e, s) { var a = e.replace(/\[(\d+)\]/g, ".$1").split("."); for (var r = t, i = 0; i < a.length; i++) { if (void 0 === (r = Object(r)[a[i]])) return s } return r }
        _set(t, e, s) { if (Object(t) !== t) return t; var a = e.toString().match(/[^.[\]]+/g) || []; a.slice(0, -1).reduce(function (t, s, r) { return Object(t[s]) === t[s] ? t[s] : (t[s] = Math.abs(a[r + 1]) >> 0 == +a[r + 1] ? [] : {}) }, t); return t[a[a.length - 1]] = s, s }
        get(t, e) { if (this.isNode()) return this._nativeGet(t, e); if (this.isQuanX()) { $task.fetch(t).then(function (r) { e(null, { status: r.statusCode, headers: r.headers, body: r.body }, r.body) }, function (r) { e(r && r.error || "UndefinedError") }); return } $httpClient.get(t, function (r, s, a) { e(r, s, a) }); }
        post(t, e) { if (this.isNode()) return this._nativePost(t, e); if (this.isQuanX()) { t.method = "POST"; $task.fetch(t).then(function (r) { e(null, { status: r.statusCode, headers: r.headers, body: r.body }, r.body) }, function (r) { e(r && r.error || "UndefinedError") }); return } $httpClient.post(t, function (r, s, a) { e(r, s, a) }); }
        _nativeGet(t, e) { var u = require("url").parse(t.url), p = "https:" === u.protocol ? require("https") : require("http"), h = Object.assign({}, t.headers || {}); p.request({ hostname: u.hostname, port: u.port || 443, path: u.path + (u.search || ""), method: "GET", headers: h, rejectUnauthorized: true }, function (r) { var b = []; r.on("data", function (c) { b.push(c) }); r.on("end", function () { var buf = Buffer.concat(b); if (r.headers["content-encoding"] && r.headers["content-encoding"].indexOf("gzip") >= 0) { try { buf = require("zlib").gunzipSync(buf) } catch (t) {} } e(null, { status: r.statusCode, headers: r.headers, body: buf.toString("utf8") }, buf.toString("utf8")) }) }).on("error", function (r) { e(r, null, null) }).end(); }
        _nativePost(t, e) { var u = require("url").parse(t.url), b = t.body ? Buffer.from("string" == typeof t.body ? t.body : JSON.stringify(t.body)) : null, p = "https:" === u.protocol ? require("https") : require("http"), h = Object.assign({}, t.headers || {}); if (b && !h["Content-Type"] && !h["content-type"]) h["Content-Type"] = "application/json"; if (b) h["Content-Length"] = Buffer.byteLength(b); var r = p.request({ hostname: u.hostname, port: u.port || 443, path: u.path + (u.search || ""), method: "POST", headers: h, rejectUnauthorized: true }, function (r) { var c = []; r.on("data", function (d) { c.push(d) }); r.on("end", function () { var buf = Buffer.concat(c); if (r.headers["content-encoding"] && r.headers["content-encoding"].indexOf("gzip") >= 0) { try { buf = require("zlib").gunzipSync(buf) } catch (t) {} } e(null, { status: r.statusCode, headers: r.headers, body: buf.toString("utf8") }, buf.toString("utf8")) }) }); r.on("error", function (r) { e(r, null, null) }); if (b) r.write(b); r.end(); }
        msg(e, s, a, r) { if (!this.isMute) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": $notification.post(e, s, a, r && "object" == typeof r ? { url: r.url || r.openUrl || r["open-url"] } : r); break; case "Quantumult X": $notify(e, s, a, r && "object" == typeof r ? { "open-url": r["open-url"] || r.url || r.openUrl, "media-url": r["media-url"] || r.mediaUrl } : void 0); break; } } if (!this.isMuteLog) console.log(e + " - " + s + " - " + a); }
        log() { for (var t = arguments.length, e = new Array(t), s = 0; s < t; s++) e[s] = arguments[s]; this.logs.push.apply(this.logs, e), console.log(e.join(this.logSeparator)) }
        logErr(t) { this.log("", "❗️" + this.name + ", 错误!", t.stack || t) }
        wait(t) { return new Promise(function (e) { setTimeout(e, t) }) }
        done() { }
    })(t, e)
}