/**
 * 同花顺 每日签到（双模式）
 * 
 * 模式1: QX Rewrite — 捕获Cookie后立即签到（用户打开同花顺APP时自动触发）
 * 模式2: 定时任务 — 使用上次存储的Cookie签到（可能失效，需打开APP刷新）
 * 
 * 认证方式: Cookie（v + hxmPid），v为客户端动态生成，每次不同
 * 签到接口: POST yyzt.10jqka.com.cn/gbct/external/checkin/v1/sign
 * @兼容: Quantumult X / Surge / Loon / Node.js
 */

// ===== 固定常量 =====
const APP_NAME = '同花顺';
const ENV_NAME = 'ths_checkin';
const API_HOST = 'yyzt.10jqka.com.cn';

// ===== Cookie 存储键名 =====
const KEY_COOKIE = 'ths_cookie';
const KEY_USERID = 'ths_userid';

// ===== Env 兼容层 =====
if (typeof $done !== "undefined") $.done = $done;

const $ = new Env(ENV_NAME);

// ===== 签到主逻辑 =====
!(async () => {
  console.log(`🔔 ${APP_NAME}, 开始!`);

  // 模式检测: 如果是 rewrite 触发，从请求中捕获Cookie
  const isRewrite = typeof $request !== 'undefined' && $request;
  if (isRewrite) {
    const reqCookie = $request.headers['Cookie'] || $request.headers['cookie'] || '';
    const userId = extractUserId(reqCookie);
    if (reqCookie) {
      console.log(`📥 捕获到Cookie (${isRewrite ? 'rewrite' : 'request'})`);
      $.setdata(reqCookie, KEY_COOKIE);
      if (userId) {
        $.setdata(userId, KEY_USERID);
        console.log(`👤 用户ID: ${userId}`);
      }
    }
  }

  // 1. 获取 Cookie（优先从请求，其次存储）
  let cookie = '';
  if (isRewrite) {
    cookie = $request.headers['Cookie'] || $request.headers['cookie'] || '';
  }
  if (!cookie) {
    cookie = $.getdata(KEY_COOKIE);
  }

  if (!cookie) {
    console.log(`❌ 未找到 Cookie`);
    $.msg(APP_NAME, '', '❌ 请在打开同花顺APP后触发Cookie捕获');
    return;
  }

  // 2. 获取 userId
  let userId = $.getdata(KEY_USERID) || extractUserId(cookie) || '';
  
  // 3. 查询签到状态
  try {
    const summary = await apiGet('/gbct/external/checkin/v1/summary', cookie);
    if (summary.status_code === 0 && summary.data) {
      const today = summary.data.today || '';
      const todayStatus = summary.data.recent_days && summary.data.recent_days.length > 0 
        ? summary.data.recent_days.find(d => d.date === today) 
        : null;
      
      if (todayStatus && todayStatus.status === 1) {
        console.log(`ℹ️ 今日已签到｜连续 ${summary.data.continuous_days || 0} 天`);
        $.msg(APP_NAME, '', `✨ 今日已签到｜已连续 ${summary.data.continuous_days || 0} 天`);
        return;
      }
    }
  } catch (e) {
    console.log(`⚠️ 查询签到状态失败: ${e.message}`);
  }

  // 4. 执行签到
  console.log(`▶ 执行签到...`);
  try {
    const result = await apiPost('/gbct/external/checkin/v1/sign', {}, cookie);
    if (result.status_code === 0 && result.data) {
      const days = result.data.continuous_days || 0;
      const reward = result.data.continuous_rewards || [];
      const beans = reward.length > 0 ? reward[0].reward_count || 0 : 0;
      console.log(`✅ 签到成功｜连续 ${days} 天｜+${beans} 金豆`);
      $.msg(APP_NAME, '', `✅ 签到成功｜连续 ${days} 天｜+${beans} 金豆`);
    } else {
      console.log(`❌ 签到失败: ${JSON.stringify(result)}`);
      if (result.status_code === 401) {
        $.msg(APP_NAME, '', '❌ Cookie已过期，请打开同花顺APP刷新');
      } else {
        $.msg(APP_NAME, '', `❌ 签到失败: ${result.status_msg || '未知错误'}`);
      }
    }
  } catch (e) {
    console.log(`❌ 签到异常: ${e.message}`);
    $.msg(APP_NAME, '', `❌ 签到异常: ${e.message}`);
  }
})()
.catch((e) => {
  console.log(`❌ ${APP_NAME} 脚本异常:`, e);
  $.msg(APP_NAME, '', `❌ 脚本异常: ${e.message}`);
})
.finally(() => $.done());

// ===== 辅助函数 =====
function extractUserId(cookie) {
  if (!cookie) return '';
  const m = cookie.match(/hxmPid=sns_lungu_t_stock_(\d+)/i);
  return m ? m[1] : '';
}

// ===== HTTP 请求封装 =====
function apiGet(path, cookie) {
  return new Promise((resolve, reject) => {
    const url = `https://${API_HOST}${path}`;
    const headers = {
      'User-Agent': 'IHexin/12.07.01 (iPhone; iOS 17.5.1; Scale/3.00)',
      'Cookie': cookie || '',
    };
    $.get({ url, headers }, (err, resp, body) => {
      if (err) return reject(err);
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error(`解析响应失败: ${body?.slice(0, 100)}`));
      }
    });
  });
}

function apiPost(path, data, cookie) {
  return new Promise((resolve, reject) => {
    const url = `https://${API_HOST}${path}`;
    const headers = {
      'User-Agent': 'IHexin/12.07.01 (iPhone; iOS 17.5.1; Scale/3.00)',
      'Content-Type': 'application/json',
      'Cookie': cookie || '',
    };
    $.post({ url, headers, body: JSON.stringify(data) }, (err, resp, body) => {
      if (err) return reject(err);
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error(`解析响应失败: ${body?.slice(0, 100)}`));
      }
    });
  });
}

// ===== Env 类（精简版） =====
function Env(name) {
  const isNode = typeof module !== 'undefined' && module.exports;
  const isQX = typeof $task !== 'undefined';
  const isSurge = typeof $httpClient !== 'undefined' && !isQX;
  const isLoon = typeof $loon !== 'undefined';
  
  this.name = name;
  this.isNode = isNode;
  
  this.getdata = (key) => {
    if (isNode) {
      try { return JSON.parse(process.env[key] || null); } catch { return process.env[key]; }
    }
    if (isQX) return $persistentStore.read(key);
    if (isSurge || isLoon) return $prefs.valueForKey(key);
    return null;
  };
  
  this.setdata = (val, key) => {
    if (isNode) return;
    if (isQX) $persistentStore.write(val, key);
    if (isSurge || isLoon) $prefs.setValueForKey(val, key);
  };
  
  this.get = (options, callback) => {
    if (isNode) {
      const http = require('http');
      const https = require('https');
      const urlObj = new URL(options.url || options);
      const mod = urlObj.protocol === 'https:' ? https : http;
      const opts = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: options.headers || {},
      };
      const req = mod.request(opts, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => callback(null, res, body));
      });
      req.on('error', callback);
      req.end();
    } else {
      if (isQX) $task.fetch({ url: options.url || options, method: 'GET', headers: options.headers }).then(r => callback(null, null, r.body), callback);
      if (isSurge || isLoon) $httpClient.get(options, callback);
    }
  };
  
  this.post = (options, callback) => {
    if (isNode) {
      const http = require('http');
      const https = require('https');
      const urlObj = new URL(options.url || options);
      const mod = urlObj.protocol === 'https:' ? https : http;
      const opts = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: options.headers || {},
      };
      const req = mod.request(opts, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => callback(null, res, body));
      });
      req.on('error', callback);
      if (options.body) req.write(options.body);
      req.end();
    } else {
      if (isQX) $task.fetch({ url: options.url || options, method: 'POST', headers: options.headers, body: options.body }).then(r => callback(null, null, r.body), callback);
      if (isSurge || isLoon) $httpClient.post(options, callback);
    }
  };
  
  this.msg = (title, subtitle, body) => {
    if (isNode) console.log(`📢 ${title}${subtitle ? ' - ' + subtitle : ''}${body ? ': ' + body : ''}`);
    if (isQX) $notify(title, subtitle, body);
    if (isSurge || isLoon) $notification.post(title, subtitle, body);
  };
  
  this.done = () => {
    if (isQX && typeof $done === 'function') $done();
    if (isSurge && typeof $done === 'function') $done();
  };
}
