#!/usr/bin/env python3
"""长城汽车 每日签到 + 盲盒抽奖（零依赖 CLI 版）
用法:
  1. 设置环境变量: export GWM_TOKEN=xxx GWM_USERID=xxx GWM_GTOKEN=xxx
  2. 或编辑 config.json 填入 token/userId/gToken
  3. python3 gwm_sign.py
"""
import hashlib, json, os, sys, time, base64, urllib.request, urllib.error

BASE = "https://gapp-api.gwmapp-h.com"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(SCRIPT_DIR, "config.json")

def load_secrets():
    """从 config.json 加载 base64 编码的密钥"""
    if not os.path.exists(CONFIG_FILE):
        print("ERROR: config.json not found"); sys.exit(1)
    with open(CONFIG_FILE) as f:
        cfg = json.load(f)
    secret = base64.b64decode(cfg["secret_b64"]).decode()
    sign_secret = base64.b64decode(cfg["sign_secret_b64"]).decode()
    return secret, sign_secret

def load_user_config():
    """加载用户 token，优先环境变量，其次 config.json"""
    token = os.environ.get("GWM_TOKEN", "")
    userid = os.environ.get("GWM_USERID", "")
    gtoken = os.environ.get("GWM_GTOKEN", "")
    if not token and os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE) as f:
            cfg = json.load(f)
        token = cfg.get("token", "") or token
        userid = cfg.get("userId", "") or userid
        gtoken = cfg.get("gToken", "") or gtoken
    return token, userid, gtoken

def calc_sign(ts, sign_secret):
    return hashlib.sha256((ts + sign_secret).encode("utf-8")).hexdigest()

def build_headers(token, userid, gtoken, secret):
    ts = str(int(time.time() * 1000))
    return {
        "Authorization": token,
        "Authtype": "BMP",
        "sourceApp": "GWM",
        "sourcetype": "H5",
        "AppID": "GWM-H5-110001",
        "Secret": secret,
        "TimeStamp": ts,
        "sign": calc_sign(ts, sign_secret),
        "sourceAppVer": "2.0.9",
        "G-Token": gtoken,
        "Content-Type": "application/json",
        "Referer": "https://hippo-app-hw.gwmapp-h.com/",
        "Origin": "https://hippo-app-hw.gwmapp-h.com",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 fromappios sapp cVer=2.0.9",
        "Accept": "application/json, text/plain, */*",
    }

def api_post(path, token, userid, gtoken, secret, sign_secret, body=None):
    url = BASE + path
    if body is None:
        body = {"userId": userid}
    data = json.dumps(body).encode("utf-8")
    headers = build_headers(token, userid, gtoken, secret)
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"  [ERROR] {path}: {e}")
        return None

def api_get(path, token, userid, gtoken, secret, sign_secret):
    url = BASE + path
    headers = build_headers(token, userid, gtoken, secret)
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"  [ERROR] {path}: {e}")
        return None

def daily_sign():
    secret, sign_secret = load_secrets()
    token, userid, gtoken = load_user_config()
    if not token or not userid:
        print("ERROR: no token/userid. Set env vars or edit config.json")
        sys.exit(1)

    msgs = []

    # 1. 查询签到状态
    print("--- daily sign ---")
    info = api_post("/community-u/v1/app/uc/sign/info", token, userid, gtoken, secret, sign_secret)
    if not info or info.get("code") != 0:
        print(f"ERROR: query failed: {(info or {}).get(chr(109)+chr(101)+chr(115)+chr(115)+chr(97)+chr(103)+chr(101), '')}")
        sys.exit(1)

    data = info.get("data", {})
    signed = data.get("todayIsSuccessSign") == 1
    continuous = data.get("continuousCount", 0)
    box_is_open = data.get("boxIsOpen")
    print(f"  signed={signed} days={continuous} box={box_is_open}")

    if signed:
        msgs.append(f"already signed ({continuous} days)")
    else:
        res = api_post("/community-u/v1/user/sign/sureNew", token, userid, gtoken, secret, sign_secret)
        if res and res.get("code") == 0:
            nc = (res.get("data") or {}).get("continuousCount") or continuous + 1
            msgs.append(f"signed! {nc} days")
            print(f"  OK, signId={res.get('data', {}).get('signId', 'N/A')}")
        else:
            msgs.append(f"sign failed: {(res or {}).get('message', 'no response')}")
            return msgs

    # 2. 盲盒
    time.sleep(0.5)
    info2 = api_post("/community-u/v1/app/uc/sign/info", token, userid, gtoken, secret, sign_secret)
    d2 = (info2 or {}).get("data") or {}
    c2 = d2.get("continuousCount", 0)
    b2 = d2.get("boxIsOpen")
    print(f"  [box] days={c2} boxOpen={b2}")

    if c2 >= 7 and b2 == 2:
        print("  [box] drawing...")
        prize = api_get("/community-u/v1/app/user/sign/prize-record/extractPrize/", token, userid, gtoken, secret, sign_secret)
        if prize and prize.get("code") == 0 and prize.get("data"):
            pd = prize["data"]
            msgs.append(f"prize: {pd.get('tipTitle')} {pd.get('prizeName')}")
        else:
            msgs.append(f"box failed: {(prize or {}).get('message', 'no response')}")
    elif c2 >= 7 and b2 == 1:
        msgs.append("box already opened")
    else:
        remain = 7 - c2
        if remain > 0:
            msgs.append(f"{c2}/7 days")

    # 3. 积分
    score = api_get("/api-u/v1/user/score/get", token, userid, gtoken, secret, sign_secret)
    if score and score.get("code") == 0 and score.get("data") is not None:
        msgs.append(f"score: {score['data']}")

    return msgs

if __name__ == "__main__":
    msgs = daily_sign()
    if msgs:
        print(chr(10).join([""] + msgs))
