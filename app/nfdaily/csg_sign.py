#!/usr/bin/env python3
"""
南方电网（95598.csg.cn）自动签到 + 任务积分脚本

功能:
  1. 每日签到（7天一循环，最高7分/天）
  2. 查看电费账单（50分/月，仅广东户号）

API 接口:
  - taskInfoList:     获取所有任务列表及状态
  - taskSignList:     获取签到规则 & 今日状态
  - signOperate:      执行签到
  - viewElectricityCheck: 标记/查询电费账单查看状态
  - receive:          领取任务积分奖励
  - queryBindEleUsers: 查询绑定的用电户号

使用方法:
  1. 方式 A：csg_config.json 配置文件
  2. 方式 B：环境变量 NFDAILY_TOKEN（Qinglong/青龙面板）
  3. python3 csg_sign.py
"""

import gzip
import json
import os
import sys
import time
from datetime import datetime
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "csg_config.json")
BASE_URL = "https://95598.csg.cn"

# 7天签到积分映射
SIGN_POINTS = {1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7}


def load_config():
    """加载配置（优先配置文件，fallback 环境变量）"""
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            cfg = json.load(f)
        # 允许环境变量覆盖 token
        env_token = os.environ.get("NFDAILY_TOKEN")
        if env_token:
            cfg["token"] = env_token
            print(f"  📌 使用环境变量 NFDAILY_TOKEN")
        return cfg

    # 无配置文件时，从环境变量构建
    env_token = os.environ.get("NFDAILY_TOKEN")
    if env_token:
        print(f"  📌 使用环境变量 NFDAILY_TOKEN（无配置文件）")
        return {
            "token": env_token,
            "task_id_sign": "654165b1z56x1bq",
            "task_id_bill": "a654g56s5151b51a16b",
            "referer": "https://0000000000000141.95598.csg.cn/0000000000000141/1.0.3.1/index.html#/pages/task/index",
            "referer_bill": "https://0000000000000123.95598.csg.cn/0000000000000123/1.0.51.0/index.html#pages/list-bills/index",
            "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21F90 Ariver/1.0.15 NWZX/Portal Nebula WK WK RVKType(0) NebulaX/1.0.0",
        }

    print(f"❌ 未找到配置文件 ({CONFIG_PATH}) 且未设置环境变量 NFDAILY_TOKEN")
    print("请创建配置文件或设置环境变量")
    sys.exit(1)


def make_request(method, path, body=None, config=None, referer_override=None, timeout=15):
    url = f"{BASE_URL}{path}"
    referer = referer_override if referer_override else config.get("referer", "")
    headers = {
        "Content-Type": "application/json",
        "x-auth-token": config["token"],
        "Referer": referer,
        "User-Agent": config.get("user_agent",
            "NanWangOnline/5.0.4 (iPhone; iOS 17.5.1; Scale/3.00)"),
        "Accept": "*/*",
        "Accept-Language": "zh-CN,zh-Hans;q=0.9",
        "Connection": "keep-alive",
        "isdev": "0",
        "need-crypto": "0",
    }

    data = json.dumps(body).encode("utf-8") if body else None
    req = Request(url, data=data, headers=headers, method=method)

    try:
        with urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            if resp.headers.get("Content-Encoding") == "gzip":
                raw = gzip.decompress(raw)
            return resp.getcode(), json.loads(raw.decode("utf-8"))
    except HTTPError as e:
        raw = e.read()
        if e.headers.get("Content-Encoding") == "gzip":
            raw = gzip.decompress(raw)
        try:
            return e.code, json.loads(raw.decode("utf-8", errors="replace"))
        except json.JSONDecodeError:
            return e.code, {"raw": raw.decode("utf-8", errors="replace")}
    except URLError as e:
        return 0, {"sta": "99", "message": f"网络错误: {e.reason}"}
    except Exception as e:
        return 0, {"sta": "99", "message": str(e)}


# ── 每日签到 ──────────────────────────────────────────────

def do_daily_sign(config):
    """每日签到流程"""
    print("\n" + "─" * 42)
    print("📋 【每日签到】")
    code, data = make_request("POST",
        "/mp/w2/szfw-points-txhsj/taskInfo/taskSignList",
        body={}, config=config)

    if code != 200 or data.get("sta") != "00":
        print(f"  ❌ 查询签到状态失败: {data.get('message', f'HTTP {code}')}")
        return False

    sd = data.get("data", {})
    finished = sd.get("taskFinishStatus") == "1"
    day = sd.get("singCount", 0)
    task_id = sd.get("taskId", "")
    rule_desc = sd.get("ruleDescr", "")

    print(f"  任务: {rule_desc}")
    print(f"  连续签到: 第 {day} 天")

    if finished:
        print(f"  ✅ 今日已签到，跳过")
        return True

    # 执行签到
    points = SIGN_POINTS.get(day if day > 0 else 1, 1)
    body = {"taskId": task_id, "thisGainPoints": points}
    print(f"  ✍️  签到中（第 {day} 天 -> {points} 积分）...")

    code, data = make_request("POST",
        "/mp/w2/szfw-points-txhsj/taskInfo/signOperate",
        body=body, config=config)

    if data.get("sta") == "00":
        gained = data.get("data", points)
        print(f"  ✅ 签到成功！获得 {gained} 积分")
        return True
    else:
        print(f"  ❌ 签到失败: {data.get('message', '未知错误')}")
        return False


# ── 电费账单任务（50分/月） ──────────────────────────────

def get_task_list(config):
    """获取所有任务列表"""
    code, data = make_request("POST",
        "/mp/w2/szfw-points-txhsj/taskInfo/taskInfoList",
        body={}, config=config)
    if code != 200 or data.get("sta") != "00":
        print(f"  ❌ 查询任务列表失败: {data.get('message', f'HTTP {code}')}")
        return None
    return data.get("data", [])


def get_elec_cust_no(config):
    """查询绑定的用电户号"""
    code, data = make_request("POST",
        "/mp/w2/wx/portal/eleCustNumber/queryBindEleUsers",
        body={}, config=config,
        referer_override=config.get("referer_bill"))
    if code != 200 or data.get("sta") != "00":
        print(f"  ❌ 查询用电户号失败: {data.get('message', f'HTTP {code}')}")
        return None
    users = data.get("data", [])
    if not users:
        print("  ❌ 未绑定任何用电户号")
        return None
    # 取第一个户号
    elec_no = users[0].get("eleCustNumber", "")
    if elec_no:
        print(f"  📍 用电户号: {elec_no} ({users[0].get('userName', '?')})")
    return elec_no


def view_electricity_bill(config, elec_cust_no):
    """查看电费账单（标记为已查看）"""
    # 先查当前状态
    code, data = make_request("POST",
        "/mp/w2/szfw-points-txhsj/taskDock/viewElectricityCheck",
        body={"getOrView": "get"}, config=config,
        referer_override=config.get("referer_bill"))
    # null 表示未查看，response 没有详细数据也无妨

    # 执行查看标记
    print(f"  📄 标记查看电费账单...")
    code, data = make_request("POST",
        "/mp/w2/szfw-points-txhsj/taskDock/viewElectricityCheck",
        body={"getOrView": "view", "elecCustNo": elec_cust_no},
        config=config,
        referer_override=config.get("referer_bill"),
        timeout=20)

    if data.get("sta") != "00":
        print(f"  ❌ 标记查看失败: {data.get('message', '未知错误')}")
        return False

    result = data.get("data", {})
    if result.get("result") == 1:
        print(f"  ✅ 已标记查看成功")
        return True
    else:
        print(f"  ⚠️  标记查看返回异常: {result}")
        return False


def claim_reward(config, task_id):
    """领取任务积分"""
    print(f"  🎁 领取任务奖励...")
    code, data = make_request("POST",
        "/mp/w2/szfw-points-txhsj/taskInfo/receive",
        body={"taskId": task_id}, config=config)

    if data.get("sta") == "00":
        print(f"  ✅ 领取成功！获得 50 积分")
        return True
    else:
        print(f"  ❌ 领取失败: {data.get('message', '未知错误')}")
        return False


def do_bill_task(config):
    """电费账单任务（50分/月）"""
    print("\n" + "─" * 42)
    print("📋 【查看电费账单 · 50积分/月】")

    tasks = get_task_list(config)
    if tasks is None:
        return False

    # 找到电费账单任务
    bill_task = None
    for t in tasks:
        if "电费账单" in t.get("taskName", "") or "houseNumDetail" in t.get("taskLinkUrl", ""):
            bill_task = t
            break

    if not bill_task:
        print("  ❌ 未找到「查看电费账单」任务")
        return False

    task_id = bill_task.get("taskId", "")
    status = bill_task.get("taskFinishStatus", "0")
    task_name = bill_task.get("taskName", "")

    print(f"  任务: {task_name}")
    print(f"  状态: {'已完成' if status == '1' else '已查看待领取' if status == '2' else '未完成'}")

    if status == "1":
        print(f"  ✅ 本月已领取，无需重复操作")
        return True

    if status == "0":
        # 需要先查看电费账单
        elec_no = get_elec_cust_no(config)
        if not elec_no:
            return False

        if not view_electricity_bill(config, elec_no):
            return False

        # 查看后稍等再领奖
        time.sleep(1)

    # status == "2" 或刚标记查看成功 → 领取奖励
    return claim_reward(config, task_id)


# ── 主流程 ────────────────────────────────────────────────

def main():
    print("=" * 42)
    print("  南方电网 · 自动任务")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 42)

    config = load_config()

    # 1. 每日签到
    do_daily_sign(config)

    # 2. 电费账单任务（50分/月）
    do_bill_task(config)

    print("\n" + "=" * 42)
    print("  ✅ 全部任务完成")
    print("=" * 42)


if __name__ == "__main__":
    main()
