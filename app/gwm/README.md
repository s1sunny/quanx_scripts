# 长城汽车

长城汽车 App 每日签到 + 盲盒抽奖（连续签到满7天自动抽盲盒）。

**仓库**: https://github.com/s1sunny/quanx_scripts/tree/main/app/gwm

## 文件
- `gwm.js` — 单文件脚本（rewrite 抓取 token + cron 自动签到，二合一）
- `gwm_sign.py` — Python 版（零依赖，环境变量 + 配置文件）
- `config.example.json` — 配置模板

## 使用步骤
1. 按下方对应平台配置，开启重写脚本 + cron；需先开启 MITM 并安装信任 CA 证书
2. 打开「长城汽车」App → 进入签到页面（自动抓取 Authorization + G-Token + userId）
3. 收到通知 `Token OK` 即抓取成功
4. cron 会按计划自动签到 + 盲盒抽奖

## Loon
```ini
[MITM]
hostname = gapp-api.gwmapp-h.com
[Script]
http-request ^https:\/\/gapp-api\.gwmapp-h\.com\/community-u\/v1\/app\/uc\/sign\/info script-path=https://raw.githubusercontent.com/s1sunny/quanx_scripts/refs/heads/main/app/gwm/gwm.js, requires-body=true, tag=长城汽车 抓取Token
cron "30 8 * * *" script-path=https://raw.githubusercontent.com/s1sunny/quanx_scripts/refs/heads/main/app/gwm/gwm.js, tag=长城汽车 每日签到, img-url=
```

## Surge
```ini
[MITM]
hostname = gapp-api.gwmapp-h.com
[Script]
长城汽车 = type=http-request,pattern=^https:\/\/gapp-api\.gwmapp-h\.com\/community-u\/v1\/app\/uc\/sign\/info,requires-body=true,max-size=0,script-path=https://raw.githubusercontent.com/s1sunny/quanx_scripts/refs/heads/main/app/gwm/gwm.js
长城汽车签到 = type=cron,cronexp=30 8 * * *,timeout=60,script-path=https://raw.githubusercontent.com/s1sunny/quanx_scripts/refs/heads/main/app/gwm/gwm.js
```

## Quantumult X
```ini
[MITM]
hostname = gapp-api.gwmapp-h.com
[rewrite_local]
^https:\/\/gapp-api\.gwmapp-h\.com\/community-u\/v1\/app\/uc\/sign\/info url script-request-body https://raw.githubusercontent.com/s1sunny/quanx_scripts/refs/heads/main/app/gwm/gwm.js
[task_local]
30 8 * * * https://raw.githubusercontent.com/s1sunny/quanx_scripts/refs/heads/main/app/gwm/gwm.js, tag=长城汽车 每日签到, img-url=
```

## Node.js / Python 手动模式
```bash
# JS 版（需先填入 config.json）
node gwm.js

# Python 版
export GWM_TOKEN=你的Authorization
export GWM_USERID=你的userId
export GWM_GTOKEN=你的G-Token
python3 gwm_sign.py
```
也可编辑 `config.json`（复制 `config.example.json`）填入 token 后直接运行。

## 实现细节
- **鉴权**: `Authorization`（JWT）+ `G-Token`，由 rewrite 模式自动抓取存本地
- **签名**: `SHA256(timestamp + "GWM-H5-1100018bc742859a7849ec9a924c979afa5a9a")`
- **签到**: `POST /community-u/v1/user/sign/sureNew`
- **盲盒**: 连续签到 ≥7 天且 `boxIsOpen=2` 时自动抽奖
- **状态判断**:
  - 签到: `todayIsSuccessSign=1` → 已签过，跳过
  - 盲盒: `boxIsOpen=1` → 已开, `boxIsOpen=2` → 可开
- **密钥存储**: `config.json` 中 base64 编码（.gitignore 已排除）

## 维护记录
| 日期 | 变更 |
|------|------|
| 2026-07-01 | 初版: 每日签到 + 盲盒抽奖（7天1次） |

## 已知限制
- **Authorization 有时效**: 失效时脚本无法签到，重新打开 App 进签到页即自动重抓
- **盲盒仅连续签到满7天可抽**
