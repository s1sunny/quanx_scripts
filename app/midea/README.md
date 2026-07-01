# 美的会员 · 每日签到

微信小程序「美的会员」每日签到脚本

## 项目状态

| 阶段 | 状态 |
|------|------|
| 抓包分析 | ✅ 完成 |
| 签到接口定位 | ✅ 旧系统 `mvip.midea.cn` 已确认 |
| 脚本开发 | ✅ `midea.js` 已测试通过 |
| 部署 | ⏳ 待部署（需先确认 Cookie 长期有效） |

## 核心发现

**旧系统（本脚本所用）**：
- Host: `mvip.midea.cn` — Cookie 认证
- 签到: `GET /my/score/create_daily_score` → `code: 000000` 为成功
- 查积分: `GET /next/mucuserinfo/getmucuserinfo`
- 小程序 AppId: `wx03925a39ca94b161`

**新系统（备用）**：
- Host: `mcsp.midea.com` — Token + headParams.sign
- 签到接口未捕获（用户已签到后抓包）

## 文件结构

```
app/midea/
├── midea.js              ✅ 签到脚本（QuanX / Node.js 双模式）
├── config.json           🔒 本地调试配置（已填充，不提交）
├── config.example.json   📋 配置模板
├── midea_api.txt         📋 API 分析文档
├── midea_sign.py         🚧 Python 版（需改写为 Cookie 模式）
└── README.md             📋 本文件
```

## 使用方式

### Quantumult X
```
[rewrite_remote]
https://raw.githubusercontent.com/s1sunny/quanx_scripts/main/app/midea/midea.js

[MITM]
hostname = mvip.midea.cn

[task_local]
1 9 * * * https://raw.githubusercontent.com/s1sunny/quanx_scripts/main/app/midea/midea.js
```

### Node.js / 青龙
```bash
export midea_data="sukey=xxx; uid=xxx; uin=xxx; ucAccessToken=xxx; ucAccessTokenExpireTime=xxx"
node midea.js
```

Cookie 获取方式：打开微信小程序「美的会员」→ 自动捕获。

## 依赖

零外部依赖。原生 Node.js `https` 模块。