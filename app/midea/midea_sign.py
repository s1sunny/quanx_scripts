#!/usr/bin/env python3
"""美的会员 每日签到（Cookie 版）

用法:
  export midea_data="sukey=xxx; uid=xxx; uin=xxx; ucAccessToken=xxx; ucAccessTokenExpireTime=xxx"
  python3 midea_sign.py

或:
  python3 midea_sign.py     # 从 config.json 读 cookie
"""

import json
import os
import sys
import urllib.request
import gzip

SIGN_URL = "https://mvip.midea.cn/my/score/create_daily_score"
INFO_URL = "https://mvip.midea.cn/next/mucuserinfo/getmucuserinfo"
UA = ("Mozilla/5.0 (Linux; Android 10; MI 8 Lite Build/QKQ1.190910.002; wv) "
      "AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/111.0.5563.116 "
      "Mobile Safari/537.36")
REFERER = "https://servicewechat.com/wx03925a39ca94b161/409/page-frame.html"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(SCRIPT_DIR, "config.json")


def load_cookie():
    """加载 Cookie：环境变量 midea_data > config.json"""
    ck = os.environ.get("midea_data", "")
    if not ck and os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE) as f:
            ck = json.load(f).get("cookie", "")
    return ck


def build_headers(cookie):
    return {
        "Host": "mvip.midea.cn",
        "Cookie": cookie,
        "User-Agent": UA,
        "Referer": REFERER,
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip",
        "Connection": "keep-alive",
    }


def http_get(url, headers):
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = resp.read()
            ct = resp.headers.get("Content-Encoding", "")
            if "gzip" in ct:
                data = gzip.decompress(data)
            return json.loads(data.decode("utf-8"))
    except Exception as e:
        print(f"  [ERROR] {e}")
        return None


def sign_in(cookie):
    """每日签到"""
    result = http_get(SIGN_URL, build_headers(cookie))
    if result:
        if result.get("errcode") == 0 or result.get("code") == "000000":
            if result.get("errcode") == 314:
                return "今日已签到 ✅"
            return "签到成功 🎉"
        return f"签到失败 ❌ {result}"
    return "签到失败 ❌ (无响应)"


def query_user(cookie):
    """查询用户信息"""
    result = http_get(INFO_URL, build_headers(cookie))
    if result and result.get("errcode") == 0:
        u = result.get("data", {}).get("userinfo", {})
        return {
            "nickname": u.get("NickName", "?"),
            "level": u.get("LevelName", "?"),
            "score": u.get("VipScore", 0),
            "grow": u.get("VipGrow", 0),
        }
    return None


def main():
    cookie = load_cookie()
    if not cookie:
        print("❌ 未设置 midea_data 环境变量，且 config.json 不存在或为空")
        sys.exit(1)

    # 签到
    sign_msg = sign_in(cookie)
    print(sign_msg)

    # 查积分
    info = query_user(cookie)
    if info:
        print(f"💎 {info['nickname']} | {info['level']} | 积分 {info['score']} | 成长值 {info['grow']}")
    else:
        print("⚠️ Cookie 可能已过期，查询用户信息失败")


if __name__ == "__main__":
    main()