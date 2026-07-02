# 平安好车主 API 文档

## 基本信息

| 项目 | 内容 |
|------|------|
| APP | 平安好车主（iOS） |
| 版本 | 5.82.1 (Build 582105) |
| 平台 | iOS 17.5.1 |
| 设备 | iPhone (equipmentNo: 5315B8C4-E498-45DE-A4B7-B9D7EFB0942B) |

## 核心域名

| 域名 | 用途 |
|------|------|
| `hcz-member.pingan.com.cn` | **会员/签到/积分 API** ✅ 核心 |
| `icore-hczhd.pingan.com.cn` | 活动/秒杀/任务 API |
| `hcz-static.pingan.com.cn` | 静态资源/CDN |
| `hcz-vass-img.pingan.com.cn` | 图片服务 |
| `padn-access.pingan.com.cn` | 广告SDK |
| `ant.pingan.com.cn` | 统计上报 |
| `appmonjs.pingan.com.cn` | 性能监控 |
| `cdn.pama-pp.pingan.com.cn` | 鉴权/认证 |
| `icore-aops-base.iobs.pingan.com.cn` | 文件下载 |

## 签到相关 API

### 1. 签到主接口 ✅ (已验证)
```
POST hcz-member.pingan.com.cn/micro-api/activity-sign/gw/signCall/mainv1
Authorization: bo7friwl={token} (URL参数)
```

**请求头:**
```
Content-Type: application/json
User-Agent: hczIos/5.82.1/17.5.1
Cookie: moWh9rldYaAHO=...
```

**请求体:**
```json
{
  "city": "北京",
  "prayerInteractFlag": "1",
  "isMini": 0,
  "isHmEnv": 0,
  "X-PA-NONCESTR": "UUID格式随机数",
  "spartaId": "加密身份标识"
}
```

**成功响应:**
```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "days": 701,
    "monthTotalDays": 2,
    "hadSign": 1,
    "point": 39386,
    "userLevel": 7,
    "showSignData": [...]
  }
}
```

**失败响应 (480):**
```json
{
  "description": "",
  "info": "账号登录过期，请重新登录",
  "status": 7,
  "traceId": ""
}
```

### 2. 分享签到信息
```
GET  hcz-member.pingan.com.cn/micro-api/activity-sign/gw/signCall/shareInfo/{shareId}/
POST hcz-member.pingan.com.cn/micro-api/activity-sign/gw/signCall/shareInfo?bo7friwl=...
```
请求体: `{"shareId":"1000002", "X-PA-NONCESTR":"...", "spartaId":"..."}`

### 3. 连续签到任务
```
GET  hcz-member.pingan.com.cn/micro-api/activity-points-zone/gw/taskCall/lianxuSignTask/{token}/
POST hcz-member.pingan.com.cn/micro-api/activity-points-zone/gw/taskCall/lianxuSignTask?bo7friwl=...
```

### 4. 签到弹窗
```
POST hcz-member.pingan.com.cn/micro-api/activity-sign/gw/signCall/getTopPopBox?bo7friwl=...
```
请求体: `{"moduleId":52, "udid":"220259158", "city":"北京", "X-PA-NONCESTR":"...", "spartaId":"..."}`

## 活动相关 API (icore-hczhd)

| API | 说明 |
|-----|------|
| `api/activity/v1/permit/info` | 活动权限信息 |
| `api/container/v1/show/tree` | 页面组件树 |
| `api/appoint/v1/info` | 预约信息 |
| `api/answer/v1/info` | 答题信息 |
| `api/grab/v1/info` | **秒杀/抢购信息** |
| `api/share/v1/mini/path` | 分享路径 |

## 认证体系

| 凭证 | 位置 | 稳定性 | 说明 |
|------|------|--------|------|
| `spartaId` | 请求体 | ✅ **稳定**（会话级） | 加密身份标识，单次登录不变 |
| `moWh9rldYaAHO` | Cookie | ❌ 频繁变化 | 每次响应Set-Cookie都不一样 |
| `bo7friwl` | URL参数 | ❌ 每次请求不同 | 动态Token，短时效 |
| `X-PA-NONCESTR` | 请求体 | ❌ 每次不同 | UUID随机数 |
| `X-PA-NEEDEXECUTIONID` | 请求体 | ✅ 固定为1 | 执行ID标识 |
| `equipmentNo` | 请求体 | ✅ 设备级别稳定 | 设备UUID |
| `spartaId` - Sparta安全框架 | 请求体 | ✅ **主认证** | 最长有效，签名验证 |

## 风控特征
- Sparta安全框架（spartaId加密签名）
- 每次请求bo7friwl动态生成
- Cookie频繁轮换
- 480状态码表示认证过期，需用户重新打开APP刷新
- 服务器有风控系统，注意执行速度

## 抓包日期
- 2026-07-02 11:03 ~ 11:07
- 已签到（hadSign: 1），累计701天
- 活动ID: 2006884288729968946
