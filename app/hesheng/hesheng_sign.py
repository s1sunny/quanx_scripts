#!/usr/bin/env python3
"""
合胜百货 · 每日签到 (合胜集团微会员)
微信小程序: 合胜百货
Python 版 (支持 Qinglong 青龙、Node 环境、手动运行)

用法:
  # 环境变量模式
  export HESHENG_SESSION="d2b47720-ea1f-40a3-a4af-92b517ef6702"
  export HESHENG_USERNO="50337890"
  python3 hesheng_sign.py

  # 配置文件模式
  python3 hesheng_sign.py --config /path/to/config.json

  # 直接传参
  python3 hesheng_sign.py --session "d2b47720-..." --userno "50337890"
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timedelta

# === 常量 ===
BASE_URL = "https://120.78.175.218/EnjoyMobile_Core/Enjoy/Service"
UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.75(0x18004b2f) NetType/WIFI Language/zh_CN"
REFERER = "https://servicewechat.com/wxa664cde255dca09c/34/page-frame.html"
APPID = "wxa664cde255dca09c"
VERSION = "V5.25.05.25"
CHANNEL = "会员(微信小程序)"

# === 默认配置 ===
DEFAULT_CONFIG = {
    "session": "",
    "userNo": ""
}

CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hesheng_config.json")


def load_config():
    """加载配置：环境变量 > 配置文件 > 默认值"""
    config = dict(DEFAULT_CONFIG)

    # 1. 环境变量
    env_session = os.environ.get("HESHENG_SESSION")
    env_userno = os.environ.get("HESHENG_USERNO")
    if env_session:
        config["session"] = env_session
    if env_userno:
        config["userNo"] = env_userno

    # 2. 配置文件
    cfg_path = None
    for arg in sys.argv[1:]:
        if arg.startswith("--config="):
            cfg_path = arg.split("=", 1)[1]
        elif arg.startswith("--session="):
            config["session"] = arg.split("=", 1)[1]
        elif arg.startswith("--userno="):
            config["userNo"] = arg.split("=", 1)[1]

    if not cfg_path:
        cfg_path = os.environ.get("HESHENG_CONFIG", CONFIG_PATH)

    if os.path.exists(cfg_path):
        try:
            with open(cfg_path, "r") as f:
                file_cfg = json.load(f)
            # 文件配置作为后备（环境变量优先）
            if not config["session"]:
                config["session"] = file_cfg.get("session", "")
            if not config["userNo"]:
                config["userNo"] = file_cfg.get("userNo", "")
        except Exception as e:
            print(f"⚠️  读取配置文件失败: {e}")

    return config


def api_post(method_name, unique_key, object_data, session, user_no=""):
    """调用合胜百货统一 API"""
    now = datetime.now()
    client_time = now.strftime("%Y-%m-%dT%H:%M:%S.") + f"{now.microsecond // 1000:03d}Z"

    body = {
        "UniqueKey": unique_key,
        "MethodName": method_name,
        "UserNo": user_no,
        "ClientTime": client_time,
        "ObjectData": object_data,
        "Tag": None,
        "Channel": CHANNEL,
        "SessionId": session,
        "Version": VERSION,
        "AppId": APPID,
        "business": ""
    }

    data = json.dumps(body, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(BASE_URL, data=data, method="POST")
    req.add_header("Content-Type", "application/json;charset=utf-8")
    req.add_header("session", session)
    req.add_header("Referer", REFERER)
    req.add_header("User-Agent", UA)
    req.add_header("Accept", "*/*")
    req.add_header("Accept-Language", "zh-CN,zh-Hans;q=0.9")
    req.add_header("Connection", "keep-alive")

    print(f"  → {method_name}...", end=" ", flush=True)
    try:
        resp = urllib.request.urlopen(req, timeout=30)
        result = json.loads(resp.read().decode("utf-8"))
        print("OK")
        return result
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")[:200]
        print(f"HTTP {e.code}: {body}")
        return None
    except Exception as e:
        print(f"异常: {e}")
        return None


def sign_in(session, user_no):
    """执行签到流程"""
    print("\n=== 合胜百货 每日签到 ===")

    # 1. 获取签到策略
    policy = api_post("GetSignPolicyWithCache", "移动会员签到记录", {}, session, user_no)
    if not policy or not policy.get("ObjectData") or not policy["ObjectData"]:
        print("❌ 获取签到策略失败")
        return False

    policy_id = policy["ObjectData"][0]["c_guid"]
    print(f"  policyId: {policy_id}")

    # 2. 查询签到历史
    now = datetime.now()
    month_start = f"{now.year}-{now.month}-1"
    next_month = now.month + 1
    next_year = now.year
    if next_month > 12:
        next_month = 1
        next_year += 1
    month_end = f"{next_year}-{next_month}-1"

    history = api_post("GetSignHistory", "移动会员签到记录", {
        "IsNotPage": True,
        "Tag": {
            "sCustomerNo": user_no,
            "sPolicyGuid": policy_id,
            "dtSDate": month_start,
            "dtEDate": month_end
        }
    }, session, user_no)

    # 检查今天是否已签到
    if history and history.get("ObjectData"):
        records = history["ObjectData"]
        if isinstance(records, list) and records:
            today = now.strftime("%Y-%m-%d")
            for r in records:
                sign_date = (r.get("dtSignDate") or "")[:10]
                if sign_date == today:
                    print("✨ 今日已签到")
                    return True

    # 3. 执行签到
    sign_result = api_post("SignIn", "移动会员签到记录", {
        "session": session,
        "policyId": policy_id,
        "storeId": "1"
    }, session, user_no)

    if sign_result and sign_result.get("ObjectData") and \
       sign_result["ObjectData"].get("gifts") and \
       len(sign_result["ObjectData"]["gifts"]) > 0:
        points = sign_result["ObjectData"]["gifts"][0].get("c_gift_amount", 0)
        print(f"\n✅ 签到成功,获得 {points} 积分")
        return True
    else:
        print(f"\n❌ 签到失败: {json.dumps(sign_result, ensure_ascii=False)}")
        return False


def main():
    config = load_config()

    if not config["session"]:
        print("❌ 未设置 session")
        print("")
        print("请通过以下方式设置：")
        print("  1. 环境变量: export HESHENG_SESSION='your_session_token'")
        print("  2. 配置文件: 编辑 hesheng_config.json")
        print("  3. 命令行: --session='your_session_token'")
        sys.exit(1)

    session = config["session"]
    user_no = config.get("userNo", "")

    # 简短显示 session
    session_preview = f"{session[:8]}...{session[-4:]}" if len(session) > 12 else session
    print(f"Session: {session_preview}")
    print(f"UserNo:  {user_no}")

    sign_in(session, user_no)


if __name__ == "__main__":
    main()