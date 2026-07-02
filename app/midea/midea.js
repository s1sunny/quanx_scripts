/**
 * 美的会员 每日签到（原版 @Sliverkiss 脚本 + 通用 Env.js）
 * @兼容: Surge / Quantumult X / Loon / Shadowrocket / Node.js
 * @Updated: 2026-07-01
 */

const $ = new Env("美的会员");
if (typeof $done !== "undefined") $.done = $done;
const ckName = "midea_data";
let notify = '';
if ($.isNode()) { try { notify = require('./sendNotify'); } catch(e) { notify = null; } }
let envSplitor = ["@"];
let userCookie = ($.isNode() ? process.env[ckName] : $.getdata(ckName)) || '';
let userList = [];
let userIdx = 0;
let userCount = 0;
$.is_debug = ($.isNode() ? process.env.IS_DEDUG : $.getdata('is_debug')) || 'false';
$.notifyMsg = [];
$.barkKey = ($.isNode() ? process.env["bark_key"] : $.getdata("bark_key")) || '';

async function main() {
    console.log('\n================== 任务 ==================\n');
    for (let user of userList) {
        DoubleLog(`----------账号${user.index}----------`)
        await user.signin();
        if (user.ckStatus) {
            await user.point();
            await $.wait(user.getRandomTime());
        } else {
            $.notifyMsg.push(`❌账号${user.index} >> Check ck error!`)
        }
    }
}

class UserInfo {
    constructor(str) {
        this.index = ++userIdx;
        this.token = str;
        this.ckStatus = true
        this.headers = {
            "Host": "mvip.midea.cn",
            "Connection": "keep-alive",
            "charset": "utf-8",
            "cookie": this.token,
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; MI 8 Lite Build/QKQ1.190910.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/111.0.5563.116 Mobile Safari/537.36 XWEB/1110005 MMWEBSDK/20230405 MMWEBID/2585 MicroMessenger/8.0.35.2360(0x2800235D) WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64 MiniProgramEnv/android",
            "Content-Type": "application/json",
            "Accept-Encoding": "gzip,compress,br,deflate",
            "Referer": "https://servicewechat.com/wx03925a39ca94b161/409/page-frame.html"
        }
    }
    getRandomTime() {
        return randomInt(1000, 3000)
    }
    async signin() {
        try {
            const options = {
                url: `https://mvip.midea.cn/my/score/create_daily_score`,
                headers: this.headers,
            };
            return new Promise(resolve => {
                $.get(options, async (error, response, data) => {
                    try {
                        let result = data.replace(/\t|\n|\v|\r|\f/g, '');
                        result = JSON.parse(result);
                        debug(result, '签到信息')
                        if (result?.errcode == 0 || result?.code == "000000") {
                            $.signMsg = `签到成功!`;
                            console.log($.signMsg);
                        } else if (result?.errcode == 314) {
                            $.signMsg = `今日已签到!`;
                            console.log($.signMsg);
                        } else {
                            console.log(result);
                            console.log(`❌[${this.index}]签到失败！${result?.errMsg}`);
                            this.ckStatus = false;
                        }
                    } catch (error) {
                        $.log(error);
                    } finally {
                        resolve();
                    }
                });
            });
        } catch (e) {
            console.log(e);
        }
    }
    async point() {
        let options = {
            url: `https://mvip.midea.cn/next/mucuserinfo/getmucuserinfo`,
            headers: this.headers,
        };
        return new Promise(resolve => {
            $.get(options, async (error, response, data) => {
                try {
                    let result = JSON.parse(data);
                    debug(result, '用户信息');
                    if (result?.errcode == 0) {
                        DoubleLog(`☁️签到状态:${$.signMsg}\n🧩成长值:${result?.data?.userinfo.VipGrow}\n🎁积分:${result?.data?.userinfo?.VipScore}`)
                    } else {
                        DoubleLog(`❌${result?.errmsg}`);
                    }
                } catch (error) {
                    $.log(error);
                } finally {
                    resolve();
                }
            });
        });
    }
}

async function getCookie() {
    if ($request && $request.method != 'OPTIONS') {
        const tokenValue = $request.headers['cookie'] || $request.headers['Cookie'];
        if (tokenValue) {
            // 过滤 WAF 脏 cookie
            var parts = tokenValue.split(";").map(s => s.trim()).filter(s => {
                var kv = s.split("=")[0].trim();
                return kv.indexOf("RouTe_WAF") === -1 && kv !== "";
            });
            var clean = parts.join("; ");
            $.setdata(clean, ckName);
            $.msg($.name, "", "✅ 获取Cookie成功🎉");
        } else {
            $.msg($.name, "", "❌ 获取Cookie失败");
        }
    }
}

!(async () => {
    if (typeof $request != "undefined") {
        await getCookie();
        return;
    }
    if (!(await checkEnv())) { throw new Error(`未检测到ck，请添加环境变量`) };
    if (userList.length > 0) {
        await main();
    }
})()
    .catch((e) => { console.log(e.message || e); $.notifyMsg.push(e.message || e); })
    .finally(async () => {
        if ($.barkKey) {
            await BarkNotify($, $.barkKey, $.name, $.notifyMsg.join('\n'));
        };
        await SendMsg($.notifyMsg.join('\n'))
        $.done();
    });

/* ===== 辅助函数 ===== */
function DoubleLog(data) {
    console.log(data);
    $.notifyMsg.push(data);
}

function debug(text) {
    if ($.is_debug === 'true') {
        console.log(typeof text == "object" ? $.toStr(text) : text);
    }
}

async function checkEnv() {
    if (userCookie) {
        let e = envSplitor[0];
        for (let o of envSplitor)
            if (userCookie.indexOf(o) > -1) { e = o; break; }
        for (let n of userCookie.split(e)) n && userList.push(new UserInfo(n));
        userCount = userList.length;
    } else {
        console.log("未找到CK");
        return false;
    }
    return console.log(`共找到${userCount}个账号`), true;
}

function randomInt(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

async function SendMsg(message) {
    if (!message) return;
    if ($.isNode() && notify) {
        await notify.sendNotify($.name, message);
    } else {
        $.msg($.name, '', message);
    }
}

async function BarkNotify(c, k, t, b) {
    for (let i = 0; i < 3; i++) {
        console.log(`🔷Bark notify >> Start push (${i + 1})`);
        const s = await new Promise((n) => {
            c.post({
                url: 'https://api.day.app/push',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: t, body: b, device_key: k, ext_params: { group: t } })
            }, (e, r, d) => r && r.status == 200 ? n(1) : n(d || e))
        });
        if (s === 1) { console.log('✅Push success!'); break }
        else { console.log(`❌Push failed! >> ${s.message || s}`) }
    }
};

/* ===== Env.js（通用多平台框架，含原生 https Node.js 支持）===== */
function Env(t, e) {
    return new (class {
        constructor(t, e) {
            this.name = t; this.data = null; this.dataFile = "box.dat";
            this.logs = []; this.isMute = false; this.isNeedRewrite = false;
            this.logSeparator = "\n"; this.startTime = Date.now();
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
        getdata(t) {
            var e = this.getval(t);
            if (/^@/.test(t)) { var s = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s[1]) : ""; if (r) try { e = this._get(JSON.parse(r), s[2], ""); } catch (t) { e = "" } }
            return e;
        }
        setdata(t, e) {
            if (/^@/.test(e)) { var s = /^@(.*?)\.(.*?)$/.exec(e), a = this.getval(s[1]), r = a ? ("null" === a ? null : a) : "{}"; try { var i = JSON.parse(r); this._set(i, s[2], t); return this.setval(JSON.stringify(i), s[1]); } catch (e) {} }
            return this.setval(t, e);
        }
        getval(t) {
            switch (this.getEnv()) {
                case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.read(t);
                case "Quantumult X": return $prefs.valueForKey(t);
                case "Node.js": return (this.data = this._load(), this.data[t]);
                default: return this.data && this.data[t] || null;
            }
        }
        setval(t, e) {
            switch (this.getEnv()) {
                case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.write(t, e);
                case "Quantumult X": return $prefs.setValueForKey(t, e);
                case "Node.js": return (this.data = this._load(), this.data[e] = t, this._save(), true);
                default: return this.data && this.data[e] || null
            }
        }
        _load() { if (!this.isNode()) return {}; var f = require("fs"), p = require("path"), a = p.resolve(this.dataFile), r = p.resolve(process.cwd(), this.dataFile), s = f.existsSync(a), i = !s && f.existsSync(r), o = s ? a : i ? r : null; if (!o) return {}; try { return JSON.parse(f.readFileSync(o, "utf8")) } catch (t) { return {} } }
        _save() { if (this.isNode()) require("fs").writeFileSync(this.dataFile, JSON.stringify(this.data), "utf8") }
        _get(t, e, s) { var a = e.replace(/\[(\d+)\]/g, ".$1").split("."); for (var r = t, i = 0; i < a.length; i++) { if (void 0 === (r = Object(r)[a[i]])) return s } return r }
        _set(t, e, s) { if (Object(t) !== t) return t; var a = e.toString().match(/[^.[\]]+/g) || []; a.slice(0, -1).reduce(function (t, s, r) { return Object(t[s]) === t[s] ? t[s] : (t[s] = Math.abs(a[r + 1]) >> 0 == +a[r + 1] ? [] : {}) }, t); return t[a[a.length - 1]] = s, s }
        get(t, e) {
            if (this.isNode()) return this._nativeGet(t, e);
            if (this.isQuanX()) { $task.fetch(t).then(function (r) { e(null, { status: r.statusCode, headers: r.headers, body: r.body }, r.body) }, function (r) { e(r && r.error || "UndefinedError") }); return }
            $httpClient.get(t, function (r, s, a) { e(r, s, a) });
        }
        post(t, e) {
            if (this.isNode()) return this._nativePost(t, e);
            if (this.isQuanX()) { t.method = "POST"; $task.fetch(t).then(function (r) { e(null, { status: r.statusCode, headers: r.headers, body: r.body }, r.body) }, function (r) { e(r && r.error || "UndefinedError") }); return }
            $httpClient.post(t, function (r, s, a) { e(r, s, a) });
        }
        _nativeGet(t, e) { var u = require("url").parse(t.url), p = "https:" === u.protocol ? require("https") : require("http"), h = Object.assign({}, t.headers || {}); p.request({ hostname: u.hostname, port: u.port || 443, path: u.path + (u.search || ""), method: "GET", headers: h, rejectUnauthorized: true }, function (r) { var b = []; r.on("data", function (c) { b.push(c) }); r.on("end", function () { var buf = Buffer.concat(b); if (r.headers["content-encoding"] && r.headers["content-encoding"].indexOf("gzip") >= 0) { try { buf = require("zlib").gunzipSync(buf) } catch (t) {} } e(null, { status: r.statusCode, headers: r.headers, body: buf.toString("utf8") }, buf.toString("utf8")) }) }).on("error", function (r) { e(r, null, null) }).end(); }
        _nativePost(t, e) { var u = require("url").parse(t.url), b = t.body ? Buffer.from("string" == typeof t.body ? t.body : JSON.stringify(t.body)) : null, p = "https:" === u.protocol ? require("https") : require("http"), h = Object.assign({}, t.headers || {}); if (b && !h["Content-Type"] && !h["content-type"]) h["Content-Type"] = "application/json"; if (b) h["Content-Length"] = Buffer.byteLength(b); var r = p.request({ hostname: u.hostname, port: u.port || 443, path: u.path + (u.search || ""), method: "POST", headers: h, rejectUnauthorized: true }, function (r) { var c = []; r.on("data", function (d) { c.push(d) }); r.on("end", function () { var buf = Buffer.concat(c); if (r.headers["content-encoding"] && r.headers["content-encoding"].indexOf("gzip") >= 0) { try { buf = require("zlib").gunzipSync(buf) } catch (t) {} } e(null, { status: r.statusCode, headers: r.headers, body: buf.toString("utf8") }, buf.toString("utf8")) }) }); r.on("error", function (r) { e(r, null, null) }); if (b) r.write(b); r.end(); }
        msg(e, s, a, r) {
            if (!this.isMute) {
                switch (this.getEnv()) {
                    case "Surge": case "Loon": case "Stash": case "Shadowrocket": $notification.post(e, s, a, r && "object" == typeof r ? { url: r.url || r.openUrl || r["open-url"] } : r); break;
                    case "Quantumult X": $notify(e, s, a, r && "object" == typeof r ? { "open-url": r["open-url"] || r.url || r.openUrl, "media-url": r["media-url"] || r.mediaUrl } : void 0); break;
                }
            }
            if (!this.isMuteLog) console.log(e + " - " + s + " - " + a);
        }
        log() { for (var t = arguments.length, e = new Array(t), s = 0; s < t; s++) e[s] = arguments[s]; this.logs.push.apply(this.logs, e), console.log(e.join(this.logSeparator)) }
        logErr(t) { this.log("", "❗️" + this.name + ", 错误!", t.stack || t) }
        wait(t) { return new Promise(function (e) { setTimeout(e, t) }) }
        done() { }
    })(t, e)
}