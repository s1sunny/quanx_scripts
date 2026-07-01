# 合胜百货 · 每日签到

**合胜集团微会员** 微信小程序每日签到脚本。

## 签到规则

- 每天签到送 **10 积分**
- 连续签到 **30 天** 额外赠送 **300 积分**

## 文件说明

| 文件 | 说明 |
|------|------|
| `hesheng.js` | JS 脚本（QuanX / Surge / Loon / Stash / Node.js） |
| `hesheng.plugin` | Loon 插件（一键导入） |
| `hesheng_sign.py` | Python 脚本（Qinglong 青龙 / 手动运行） |
| `hesheng_config.example.json` | Python 配置示例 |

## 使用方式

### 方式一：JS 脚本（QuanX / Surge / Loon / Stash）

#### 1. 抓取 Session

打开微信 → 进入「合胜百货」小程序 → 登录，脚本会自动从请求头抓取 session。

**注意：** 脚本使用 `script-request-body`（请求拦截）模式而非 `script-response-body`（响应拦截），因为 session 在请求头中。

**Quantumult X：**
```
[rewrite_local]
^https:\\/\\/120\\.78\\.175\\.218\\/EnjoyMobile_Core\\/Enjoy\\/Service url script-request-body https://raw.githubusercontent.com/s1sunny/quanx_scripts/refs/heads/main/app/hesheng/hesheng.js

[task_local]
30 8 * * * https://raw.githubusercontent.com/s1sunny/quanx_scripts/refs/heads/main/app/hesheng/hesheng.js, tag=合胜百货签到, img-url=, enabled=true

[MITM]
hostname = 120.78.175.218
```

**Loon：**
```
[MITM]
hostname = 120.78.175.218

[Script]
http-request ^https:\\/\\/120\\.78\\.175\\.218\\/EnjoyMobile_Core\\/Enjoy\\/Service script-path=https://raw.githubusercontent.com/s1sunny/quanx_scripts/refs/heads/main/app/hesheng/hesheng.js, tag=合胜百货 Cookie, requires-body=true, img-url=
cron "30 8 * * *" script-path=https://raw.githubusercontent.com/s1sunny/quanx_scripts/refs/heads/main/app/hesheng/hesheng.js, tag=合胜百货签到, img-url=, enable=true
```

**Surge：**
```
[MITM]
hostname = 120.78.175.218

[Script]
合胜百货 = type=http-request,pattern=^https:\\/\\/120\\.78\\.175\\.218\\/EnjoyMobile_Core\\/Enjoy\\/Service,requires-body=true,script-path=https://raw.githubusercontent.com/s1sunny/quanx_scripts/refs/heads/main/app/hesheng/hesheng.js,img-url=
合胜百货签到 = type=cron,cronexp=30 8 * * *,timeout=60,script-path=https://raw.githubusercontent.com/s1sunny/quanx_scripts/refs/heads/main/app/hesheng/hesheng.js,img-url=
```

#### 2. 清除 Session

在通知中点击 **清除** 按钮，或手动在脚本中设置：
```
hesheng_clear = true
```

### 方式二：Python 脚本（Qinglong / 手动）

```bash
# 环境变量模式
export HESHENG_SESSION="your_session_token"
export HESHENG_USERNO="50337890"
python3 hesheng_sign.py

# 配置文件模式
cp hesheng_config.example.json hesheng_config.json
# 编辑 hesheng_config.json 填入 session 和 userNo
python3 hesheng_sign.py

# 命令行参数
python3 hesheng_sign.py --session="d2b47720-..." --userno="50337890"
```

### 获取 Session

用抓包工具（如 mitmproxy、Stream、HttpCatcher）抓取到小程序**登录后**的任意请求，在请求头中提取 `session` 值。

抓包关键信息：
- **域名：** `www.sthsbh.com`（请求头 Host 必须为此值）
- **路径：** `/EnjoyMobile_Core/Enjoy/Service`
- **验证方式：** 每个请求都需要 `sign` 头（基于固定 SIGN_KEY 对请求体进行 MD5 签名）

## 技术细节

### MD5 签名

从小程序解包获得：
- **SIGN_KEY:** `66DC5DF67634474DBCEA76202F778977`
- **签名算法:** `MD5(JSON.stringify(body) + "&sk=" + MD5(SIGN_KEY))`
- **签名位置:** 请求头 `sign` 字段

所有 API 请求都需要这个签名，否则返回错误。

### Session 有效期

约 **3 小时**（由 `sessionExpires` 字段决定），测试发现 session 过期后无法刷新（因为无法获取 wx.code），需要重新打开小程序。

### 请求示例

```
POST https://www.sthsbh.com/EnjoyMobile_Core/Enjoy/Service
Host: www.sthsbh.com
Content-Type: application/json;charset=utf-8
session: d2b47720-ea1f-40a3-a4af-92b517ef6702
appId: wxa664cde255dca09c
storeId: 11101
sign: FD343E096976408D64FC42567084440B
appType: %E4%BC%9A%E5%91%98(%E5%BE%AE%E4%BF%A1%E5%B0%8F%E7%A8%8B%E5%BA%8F)
business:
```

## 积分用途

获得的积分可在「合胜百货」小程序内兑换优惠券，如：
- **20000 积分** → 200 元百货券（长江店）

## 项目地址

https://github.com/s1sunny/quanx_scripts
