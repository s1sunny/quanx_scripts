# 南网在线
南方电网「南网在线」(95598.csg.cn)App 积分每日签到 + 查看电费账单任务(50积分/月)。

## 文件
- `nfdaily.js` — 单文件脚本（rewrite 抓取 token + cron 自动签到，二合一）

## 使用步骤
1. 按下方对应平台配置，开启重写脚本 + cron；需先开启 MITM 并安装信任 CA 证书
2. 打开「南网在线」App → 进入「我的 / 任务中心」页（进入后自动触发签到请求，同时抓取 token）
3. 收到通知 `✅ 南网在线 Token 获取成功` 即抓取成功
4. cron 会按计划自动签到：每日签到 + 检查电费账单任务(仅广东户号，每月一次)

## Loon
```ini
[MITM]
hostname = 95598.csg.cn
[Script]
http-request ^https:\/\/95598\.csg\.cn\/mp\/w2\/szfw-points-txhsj\/ tag=南网在线 Cookie, script-path=https://raw.githubusercontent.com/你的用户名/paperclip/refs/heads/main/app/nfdaily/nfdaily.js, requires-body=true, img-url=
cron "30 8 * * *" script-path=https://raw.githubusercontent.com/你的用户名/paperclip/refs/heads/main/app/nfdaily/nfdaily.js, tag=南网在线签到, img-url=, enable=true
```

## Surge
```ini
[MITM]
hostname = 95598.csg.cn
[Script]
南网在线 = type=http-request,pattern=^https:\/\/95598\.csg\.cn\/mp\/w2\/szfw-points-txhsj\/,requires-body=true,max-size=0,script-path=https://raw.githubusercontent.com/你的用户名/paperclip/refs/heads/main/app/nfdaily/nfdaily.js,img-url=
南网在线签到 = type=cron,cronexp=30 8 * * *,timeout=60,script-path=https://raw.githubusercontent.com/你的用户名/paperclip/refs/heads/main/app/nfdaily/nfdaily.js,img-url=
```

## Quantumult X
```ini
[MITM]
hostname = 95598.csg.cn
[rewrite_local]
^https:\/\/95598\.csg\.cn\/mp\/w2\/szfw-points-txhsj\/ url script-request-body https://raw.githubusercontent.com/你的用户名/paperclip/refs/heads/main/app/nfdaily/nfdaily.js
[task_local]
30 8 * * * https://raw.githubusercontent.com/你的用户名/paperclip/refs/heads/main/app/nfdaily/nfdaily.js, tag=南网在线签到, img-url=, enabled=true
```

## Stash
```yaml
cron:
  script:
    - name: 南网在线签到
      cron: '30 8 * * *'
      timeout: 60
http:
  mitm:
    - "95598.csg.cn"
  script:
    - match: ^https:\/\/95598\.csg\.cn\/mp\/w2\/szfw-points-txhsj\/
      name: 南网在线 Cookie
      type: request
      require-body: true
script-providers:
  南网在线签到:
    url: https://raw.githubusercontent.com/你的用户名/paperclip/refs/heads/main/app/nfdaily/nfdaily.js
    interval: 86400
```

## 青龙面板 / Node.js 手动模式
如使用青龙面板或 Node.js 环境（无 MITM 抓取），直接设置环境变量运行：
```bash
export NFDAILY_TOKEN=你的x-auth-token"
node nfdaily.js
```

## 实现细节
- **鉴权** = `x-auth-token`，由 rewrite 模式自动抓取存本地
- **签到** = 每日调用 `signOperate`，根据连续天数自动算积分
- **电费账单任务** = 查到当月未完成时，自动 `viewElectricityCheck` 标记查看 → `receive` 领取 50 积分
- **状态判断**:
  - 签到: `taskFinishStatus=1` → 已签过，跳过
  - 电费账单: `status=0` → 未完成, `status=2` → 已查看待领取, `status=1` → 本月已领

## 维护记录
| 日期 | 变更 |
|------|------|
| 2026-06-30 | 初版: 每日签到 + 电费账单任务(50分/月) |

## 已知限制
- **x-auth-token 有时效**：失效时脚本无法签到，重新打开 App 进任务中心即自动重抓
- **电费账单任务仅限广东户号**
