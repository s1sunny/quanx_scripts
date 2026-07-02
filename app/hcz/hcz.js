// 平安好车主 ✦ 每日签到
// 适配: Quantumult X / Loon / Surge / Shadowrocket / Stash
// 仓库: https://github.com/s1sunny/quanx_scripts
// 更新时间: 2026-07-02
//
// [rewrite_local]
// ^https:\/\/hcz-member\.pingan\.com\.cn\/micro-api\/.* url script-request-body https://raw.githubusercontent.com/s1sunny/quanx_scripts/refs/heads/main/app/hcz/hcz.js
//
// [mitm]
// hostname = hcz-member.pingan.com.cn, icore-hczhd.pingan.com.cn
//
// [task_local]
// 0 9 * * * https://raw.githubusercontent.com/s1sunny/quanx_scripts/refs/heads/main/app/hcz/hcz.js, tag=平安好车主签到, enabled=true

const VERSION = "1.0.0";

// 签到API
const SIGN_URL = "https://hcz-member.pingan.com.cn/micro-api/activity-sign/gw/signCall/mainv1";
const SHARE_URL = "https://hcz-member.pingan.com.cn/micro-api/activity-sign/gw/signCall/shareInfo";
const LIANXU_URL = "https://hcz-member.pingan.com.cn/micro-api/activity-points-zone/gw/taskCall/lianxuSignTask";

// 存储键
const KEY_SPARTA = "hcz_spartaId";
const KEY_COOKIE = "hcz_cookie";
const KEY_BO7 = "hcz_bo7friwl";
const KEY_NONCE = "hcz_nonce";
const KEY_EQUIP = "hcz_equipmentNo";
const KEY_DATA = "hcz_signData";

function parseBo7friwl(url) {
  const m = url.match(/bo7friwl=([^&]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function parseSpartaId(body) {
  try {
    const j = JSON.parse(body);
    return j.spartaId || null;
  } catch(e) {
    return null;
  }
}

function parseEquipmentNo(body) {
  try {
    const j = JSON.parse(body);
    return j.equipmentNo || null;
  } catch(e) {
    return null;
  }
}

function genNonce() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  }).toUpperCase();
}

async function signIn(bo7friwl, spartaId, cookie) {
  const nonce = genNonce();
  const body = JSON.stringify({
    city: "北京",
    prayerInteractFlag: "1",
    isMini: 0,
    isHmEnv: 0,
    "X-PA-NONCESTR": nonce,
    spartaId: spartaId
  });

  const opts = {
    url: `${SIGN_URL}?bo7friwl=${encodeURIComponent(bo7friwl)}`,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "hczIos/5.82.1/17.5.1",
      "Cookie": cookie || "",
      "Accept": "*/*"
    },
    body: body
  };

  try {
    const resp = await http(opts);
    const data = JSON.parse(resp.body);
    return data;
  } catch(e) {
    return { error: e.message || e };
  }
}

async function http(opts) {
  return new Promise((resolve, reject) => {
    $task.fetch(opts).then(resp => {
      resolve(resp);
    }, err => {
      reject(err);
    });
  });
}

async function main() {
  // ─── 模式判断 ───
  const isRewrite = typeof $request !== "undefined" && $request !== null;

  if (isRewrite) {
    // ═══ Rewrite 捕获模式 ═══
    const url = $request.url || "";
    const body = $request.body || "";
    const headers = $request.headers || {};
    const cookie = headers["Cookie"] || headers["cookie"] || "";

    const bo7 = parseBo7friwl(url);
    const sparta = parseSpartaId(body);
    const equip = parseEquipmentNo(body);

    if (bo7) $prefs.setValueForKey(bo7, KEY_BO7);
    if (sparta) $prefs.setValueForKey(sparta, KEY_SPARTA);
    if (equip) $prefs.setValueForKey(equip, KEY_EQUIP);
    if (cookie) $prefs.setValueForKey(cookie, KEY_COOKIE);

    console.log(`[HCZ] 捕获: bo7=${bo7 ? '✓' : '✗'} sparta=${sparta ? '✓' : '✗'} equip=${equip ? '✓' : '✗'}`);

    // Rewrite模式结束，不执行签到（签到由Cron或手动触发）
    $done({});
    return;
  }

  // ═══ Cron 定时模式 ═══
  console.log(`[HCZ] Cron模式启动 v${VERSION}`);

  const bo7 = $prefs.valueForKey(KEY_BO7);
  const sparta = $prefs.valueForKey(KEY_SPARTA);
  const cookie = $prefs.valueForKey(KEY_COOKIE);

  if (!bo7 || !sparta) {
    const msg = "⚠️ 未捕获到凭证，请先打开平安好车主APP";
    console.log(`[HCZ] ${msg}`);
    showMessage(msg);
    $done();
    return;
  }

  const result = await signIn(bo7, sparta, cookie);
  if (result && result.code === 0) {
    const d = result.data;
    const status = d.hadSign === 1 ? "✅ 已签到" : "✅ 签到成功";
    const msg = [
      `${status}`,
      `累计 ${d.days} 天`,
      `本月 ${d.monthTotalDays} 天`,
      `积分 ${d.point}`,
      `等级 Lv.${d.userLevel}`
    ];
    $prefs.setValueForKey(JSON.stringify({
      days: d.days,
      monthTotalDays: d.monthTotalDays,
      hadSign: d.hadSign,
      point: d.point,
      userLevel: d.userLevel
    }), KEY_DATA);
    console.log(`[HCZ] 签到结果: ${msg.join(' | ')}`);
    showMessage(msg.join('\n'));
  } else if (result && result.code === 480) {
    const msg = "⚠️ 凭证过期，请打开平安好车主APP刷新";
    console.log(`[HCZ] ${msg}`);
    showMessage(msg);
  } else {
    const errMsg = result?.msg || result?.info || JSON.stringify(result);
    console.log(`[HCZ] 签到失败: ${errMsg}`);
    showMessage(`❌ 签到失败: ${errMsg}`);
  }

  $done();
}

function showMessage(msg) {
  if (typeof $notify !== "undefined") {
    $notify("平安好车主", "", msg);
  } else if (typeof $notification !== "undefined") {
    $notification.post("平安好车主", "", msg);
  }
}

// 平台兼容
if (typeof $task !== "undefined") {
  // Surge / Loon / Stash / Shadowrocket
  (async () => await main())();
} else if (typeof $httpTask !== "undefined") {
  // Quantumult X
  (async () => await main())();
} else if (typeof request !== "undefined") {
  // 简化模式
  (async () => await main())();
} else {
  // Node.js 测试模式
  (async () => {
    // Node.js 测试模式
    global.$prefs = (() => {
      const fs = require('fs');
      const path = '/tmp/hcz_prefs.json';
      try { globalThis._prefs = JSON.parse(fs.readFileSync(path, 'utf8')); } catch(e) { globalThis._prefs = {}; }
      const save = () => { try { fs.writeFileSync(path, JSON.stringify(globalThis._prefs, null, 2)); } catch(e) {} };
      return {
        setValueForKey: (v, k) => { globalThis._prefs[k] = v; save(); },
        valueForKey: (k) => globalThis._prefs[k]
      };
    })();
    global.$task = { fetch: async (o) => {
      const url = new URL(o.url);
      const https = require(url.protocol === 'https:' ? 'https' : 'http');
      return new Promise((resolve, reject) => {
        const body = o.body || '';
        const opts = {
          hostname: url.hostname,
          port: url.port || 443,
          path: url.pathname + url.search,
          method: 'POST',
          headers: { ...o.headers, 'Content-Length': Buffer.byteLength(body) },
          timeout: 15000
        };
        const req = https.request(opts, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => resolve({ body: data, status: res.statusCode, headers: res.headers }));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
      });
    }};
    global.console = console;
    global.$request = null;
    console.log(`[HCZ] 启动测试模式`);
    await main();
  })();
}
