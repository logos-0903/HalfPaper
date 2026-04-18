# 半页纸 API 接口文档（当前代码版）

---

## 全局约定

- Base URL：`https://api.halfpaper.top`
- 服务监听端口：`9000`
- 认证方式：Cookie（字段名：`SESSTOKEN`）
- 默认 Content-Type：`application/json`
- AI 流式接口返回类型：`text/event-stream`
- 本文档仅描述当前实际挂载在路由中的接口

### 统一响应格式

```json
// 成功
{
  "code": 0,
  "message": "OK",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {}
}

// 失败
{
  "code": -400,
  "message": "参数错误",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {}
}
```

### 时间字段说明

- 顶层 `timestamp` 为毫秒级 Unix 时间戳
- `/user/*`、`/session/*`、`/diary/detail`、`/diary/list`、`/diary/search`、`/comment/*`、`/ai/diary/history` 中的业务时间字段主要为秒级 Unix 时间戳
- `/diary/create`、`/diary/update` 中直接从 MySQL 读取的时间字段为时间字符串
- 评论模块中的 `root_id`、`parent_id` 使用 `null` 表示不存在对应引用

### 常见错误码

| code | 含义 |
|------|------|
| 0 | 成功 |
| -400 | 参数错误 |
| -401 | 未登录 / 用户名或密码错误 |
| -403 | 无权限 |
| -404 | 资源不存在 |
| -409 | 业务冲突 |
| -415 | 人机验证码错误 |
| -416 | 邮箱验证码错误 |
| -429 | 请求过于频繁 |
| -500 | 服务器内部错误 |

### 已挂载接口总览

| 模块 | 方法 | 路径 | 需要登录 | 说明 |
|------|------|------|----------|------|
| Auth | GET | `/auth/emailverify` | 否 | 邮箱验证码 |
| Auth | POST | `/auth/register` | 否 | 注册 |
| Auth | POST | `/auth/login` | 否 | 登录 |
| Auth | POST | `/auth/logout` | 是 | 退出登录 |
| Auth | POST | `/auth/password/forget` | 否 | 忘记密码 |
| Session | GET | `/session/list` | 是 | 登录会话列表 |
| Session | POST | `/session/revoke` | 是 | 单个会话下线 |
| Session | POST | `/session/revoke-all` | 是 | 全部退登 |
| Message | GET | `/message/list` | 是 | 获取消息盒子列表 |
| Message | GET | `/message/unread` | 是 | 获取未读消息统计 |
| Message | POST | `/message/read` | 是 | 单条消息标记已读 |
| Message | POST | `/message/read-all` | 是 | 批量标记消息已读 |
| User | GET | `/user/school/list` | 否 | 学校字典列表 |
| User | GET | `/user/info` | 是 | 当前用户资料 |
| User | GET | `/user/detail` | 是 | 指定用户详情 |
| User | POST | `/user/profile` | 是 | 修改个人资料 |
| User | POST | `/user/email` | 是 | 修改邮箱 |
| User | POST | `/user/password` | 是 | 修改密码 |
| User | POST | `/user/delete` | 是 | 注销账号 |
| Diary | POST | `/diary/create` | 是 | 创建草稿或发布日记 |
| Diary | POST | `/diary/update` | 是 | 修改草稿或日记 |
| Diary | POST | `/diary/delete` | 是 | 删除日记 |
| Diary | POST | `/diary/like` | 是 | 点赞日记 |
| Diary | POST | `/diary/unlike` | 是 | 取消点赞日记 |
| Diary | POST | `/diary/favorite` | 是 | 收藏日记 |
| Diary | POST | `/diary/unfavorite` | 是 | 取消收藏日记 |
| Diary | GET | `/diary/detail` | 是 | 日记详情（支持查看他人公开日记） |
| Diary | GET | `/diary/list` | 是 | 当前用户日记列表 |
| Diary | GET | `/diary/search` | 是 | 搜索当前用户自己的日记 |
| Diary | GET | `/diary/favorite/list` | 是 | 当前用户收藏列表 |
| Fireflies | GET | `/fireflies/list` | 否 | 萤火集公开内容流 |
| Fireflies | GET | `/fireflies/search` | 否 | 搜索萤火集公开日记 |
| Fireflies | GET | `/fireflies/topic/list` | 否 | 获取萤火集话题列表 |
| Fireflies | GET | `/fireflies/topic/hot` | 否 | 获取热点话题列表 |
| Fireflies | POST | `/fireflies/report` | 是 | 举报萤火集日记 |
| Comment | GET | `/comment/list` | 否 | 获取一级评论及回复预览 |
| Comment | GET | `/comment/reply` | 否 | 获取某一级评论下的回复列表 |
| Comment | POST | `/comment/create` | 是 | 创建评论或回复 |
| Comment | POST | `/comment/delete` | 是 | 删除评论 |
| Comment | POST | `/comment/like` | 是 | 点赞评论 |
| Comment | POST | `/comment/unlike` | 是 | 取消点赞评论 |
| Image | POST | `/image/presign` | 否 | 获取图片上传预签名 |
| Image | POST | `/image/callback` | 否 | OSS 上传回调 |
| AI | ALL | `/ai` | 否 | AI 联通性测试 |
| AI | ALL | `/ai/test` | 否 | AI 联通性测试 |
| AI | GET | `/ai/diary/history` | 是 | 获取日记 AI 历史记录 |
| AI | POST | `/ai/diary/stream` | 是 | 日记 AI 流式对话 |
| Admin | POST | `/admin/message/system` | 是 | 发送系统通知（管理员） |
| Admin | POST | `/admin/diary/hide` | 是 | 隐藏公开帖子（管理员） |
| Admin | POST | `/admin/comment/hide` | 是 | 隐藏评论/评论树（管理员） |
| Admin | GET | `/admin/report/list` | 是 | 举报列表（管理员） |
| Admin | POST | `/admin/report/review` | 是 | 审批/驳回举报（管理员） |

---

## 一、认证模块 `/auth`

### 1.1 发送邮箱验证码

- **GET** `/auth/emailverify`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | ✅ | 邮箱地址 |
| purpose | string | ❌ | `register` / `forgot_password` / `change_password` / `delete_account` / `change_email_old` / `change_email_new`，默认 `register` |

**说明**

- 当前代码仅挂载 `/auth/emailverify`，未挂载 `/auth/emailvarify`
- `register`：目标邮箱必须未注册
- `forgot_password`：目标邮箱必须已注册
- `change_password`、`delete_account`、`change_email_old`：需要登录，且 `email` 必须等于当前账号邮箱
- `change_email_new`：需要登录，且 `email` 必须是未注册的新邮箱
- 同一邮箱同一用途 60 秒内不可重复发送
- 验证码有效期 10 分钟

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| purpose | string | 本次验证码用途 |
| purpose_name | string | 用途中文名 |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "验证码发送成功，请注意查收",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "purpose": "register",
    "purpose_name": "注册"
  }
}
```

**返回示例 - 失败**

```json
{
  "code": -409,
  "message": "该邮箱已被注册",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {}
}
```

```json
{
  "code": -429,
  "message": "验证码发送过于频繁，请60秒后再试",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {}
}
```

### 1.2 注册

- **POST** `/auth/register`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | ✅ | 用户名，5-16 位 |
| password | string | ✅ | 密码字符串，长度 32-128 |
| email | string | ✅ | 邮箱 |
| token | string | ✅ | hCaptcha token |
| mail_code | string | ✅ | 邮箱验证码，6 位 |

**说明**

- 会校验 hCaptcha
- 用户名和邮箱都必须唯一
- 验证成功后会直接写入登录态 Cookie

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| username | string | 用户名 |
| email | string | 邮箱 |
| avatar | string\|null | 头像 |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "注册成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "username": "test_user",
    "email": "test@example.com",
    "avatar": null
  }
}
```

**返回示例 - 失败**

```json
{
  "code": -416,
  "message": "邮箱验证码不正确",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {}
}
```

### 1.3 登录

- **POST** `/auth/login`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | ✅ | 登录邮箱 |
| password | string | ✅ | 密码字符串，长度 32-128 |
| token | string | ✅ | hCaptcha token |

**说明**

- 会校验 hCaptcha
- 登录成功后会创建 `user_sessions` 记录并设置 Cookie
- `application`、登录 IP 和属地会在会话安全中心中使用
- 返回中新增 `role` 与 `is_admin`，用于前端控制管理入口显示

---

## 二、消息模块 `/message`

消息盒子当前只包含两类消息：

- `interaction`：互动消息，只覆盖点赞与评论/回复。
- `system`：系统通知，包括管理员主动发送的通知和内容被隐藏通知。

### 2.1 获取消息列表

- **GET** `/message/list`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | string | ❌ | `all` / `interaction` / `system`，默认 `all` |
| page | number | ❌ | 页码，默认 `1` |
| page_size | number | ❌ | 每页条数，默认 `20`，最大 `50` |

**返回参数说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| list[].id | string | 消息 ID |
| list[].category | string | 消息分类 |
| list[].type | string | 业务类型 |
| list[].title | string | 标题 |
| list[].content | string\|null | 内容摘要 |
| list[].sender | object\|null | 发送人信息，系统广播可能为空 |
| list[].extra | object\|null | 扩展信息 |
| pagination | object | 分页信息 |

### 2.2 获取未读统计

- **GET** `/message/unread`

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| all | number | 全部未读数 |
| interaction | number | 互动消息未读数 |
| system | number | 系统消息未读数 |

### 2.3 单条消息已读

- **POST** `/message/read`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| message_id | string | ✅ | 消息 UUID |

### 2.4 批量已读

- **POST** `/message/read-all`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | string | ❌ | `interaction` / `system`，不传表示全部已读 |

---

## 三、管理模块 `/admin`

所有 `/admin/*` 接口都要求：

- 已登录
- 当前用户 `role = admin`

### 3.1 发送系统通知

- **POST** `/admin/message/system`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| target_type | string | ✅ | `all` / `user` |
| user_id | string | 条件必填 | 当 `target_type=user` 时必填 |
| title | string | ✅ | 标题，最多 120 字 |
| content | string | ✅ | 内容，最多 1000 字 |

### 3.2 隐藏公开帖子

- **POST** `/admin/diary/hide`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| diary_id | string | ✅ | 帖子 UUID |
| reason | string | ✅ | 隐藏原因，最多 255 字 |

**说明**

- 只允许隐藏公开帖子。
- 隐藏后帖子不会被物理删除，原始内容仍保留在数据库中。
- 会写入 `content_moderation_logs`，并向作者投递系统消息。

### 3.3 隐藏评论

- **POST** `/admin/comment/hide`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| comment_id | string | ✅ | 评论 UUID |
| reason | string | ✅ | 隐藏原因，最多 255 字 |

**说明**

- 只允许隐藏公开帖子下的评论。
- 如果隐藏的是一级评论，会连同整棵回复树一起隐藏。
- 隐藏后评论仍保留在数据库中，且会记录审核日志与通知作者。

### 3.4 获取举报列表

- **GET** `/admin/report/list`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pn | number | ❌ | 页码，默认 1 |
| ps | number | ❌ | 每页数量，默认 20，最大 50 |
| status | string | ❌ | 按状态筛选：`pending` / `approved` / `rejected`，不传则查全部 |

**说明**

- 返回所有用户提交的日记举报记录
- 默认按「待处理优先 + 时间倒序」排列

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| lists | array | 举报列表 |
| total | number | 总数 |
| pn | number | 当前页 |
| ps | number | 每页数量 |

**lists 元素结构**

| 字段 | 类型 | 说明 |
|------|------|------|
| report_id | string | 举报 ID |
| diary_id | string | 被举报日记 ID |
| reason_type | string | 举报类型：`spam` / `inappropriate` / `harassment` / `plagiarism` / `other` |
| reason_detail | string\|null | 举报详细说明 |
| status | string | 处理状态：`pending` / `approved` / `rejected` |
| review_note | string\|null | 审核备注 |
| reviewed_at | number\|null | 审核时间戳（秒） |
| created_at | number | 举报时间戳（秒） |
| reporter | object | 举报人信息 |
| reviewer | object\|null | 审核管理员信息 |
| diary | object | 被举报日记摘要 |
| author | object | 日记作者信息 |

**reporter 对象**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 举报人 ID |
| username | string | 用户名 |
| avatar | string\|null | 头像 |

**reviewer 对象（已审核时存在）**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 管理员 ID |
| username | string | 管理员用户名 |

**diary 对象**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 日记 ID |
| title | string\|null | 标题 |
| summary | string | 正文摘要 |
| status | string | 日记状态 |
| moderation_status | string | 审核状态 |

**author 对象**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 作者 ID |
| username | string | 作者用户名 |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "获取举报列表成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "lists": [
      {
        "report_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "diary_id": "c980a93f-e44a-4406-b9a7-f5ea1e62b09b",
        "reason_type": "inappropriate",
        "reason_detail": "内容涉及不当言论",
        "status": "pending",
        "review_note": null,
        "reviewed_at": null,
        "created_at": 1775550720,
        "reporter": {
          "id": "4da4890b-97e2-42da-bc2d-bf4d972c9b8f",
          "username": "paper_guest",
          "avatar": null
        },
        "reviewer": null,
        "diary": {
          "id": "c980a93f-e44a-4406-b9a7-f5ea1e62b09b",
          "title": "某篇日记",
          "summary": "日记正文摘要...",
          "status": "active",
          "moderation_status": "normal"
        },
        "author": {
          "id": "b5c6d7e8-f9a0-1234-5678-abcdef012345",
          "username": "diary_author"
        }
      }
    ],
    "total": 1,
    "pn": 1,
    "ps": 20
  }
}
```

### 3.5 审批/驳回举报

- **POST** `/admin/report/review`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| report_id | string | ✅ | 举报 ID（UUID） |
| action | string | ✅ | `approve`（通过）/ `reject`（驳回） |
| review_note | string | ❌ | 审核备注，最多 255 字 |

**说明**

- 仅允许处理 `status=pending` 的举报
- `approve`（通过举报）时会同时：
  - 隐藏被举报日记（更新 `moderation_status='hidden'`）
  - 写入内容审核日志 `content_moderation_logs`
  - 向日记作者发送「帖子被隐藏」系统消息
  - 自动将同一篇日记下的其他待处理举报也标记为 `approved`
- `reject`（驳回举报）不影响日记本身
- 无论通过或驳回，都会向举报人发送处理结果通知（消息类型 `report_result`）

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| report_id | string | 举报 ID |
| status | string | 更新后的状态 |
| review_note | string\|null | 审核备注 |

**返回示例 - 通过**

```json
{
  "code": 0,
  "message": "举报已通过，日记已隐藏",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "report_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "approved",
    "review_note": "确认违规"
  }
}
```

**返回示例 - 驳回**

```json
{
  "code": 0,
  "message": "举报已驳回",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "report_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "rejected",
    "review_note": "内容未违规"
  }
}
```

---

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| username | string | 用户名 |
| email | string | 邮箱 |
| avatar | string\|null | 头像 |
| sex | string | 性别 |
| diary_count | number | 日记数 |
| liked_count | number | 获赞数 |
| exp | number | 当前经验值 |
| level | object | 当前等级信息 |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "登录成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "username": "test_user",
    "email": "test@example.com",
    "avatar": null,
    "sex": "未知",
    "diary_count": 3,
    "liked_count": 0,
    "exp": 0,
    "level": {
      "exp": 0,
      "level": 1,
      "level_name": "萤火新芽",
      "level_min_exp": 0,
      "next_level_exp": 100,
      "is_max_level": false,
      "progress": 0
    }
  }
}
```

**返回示例 - 失败**

```json
{
  "code": -401,
  "message": "用户名或密码错误",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {}
}
```

### 1.4 退出登录

- **POST** `/auth/logout`
- 需要登录

**请求参数**：无

**说明**

- 会撤销当前会话
- 会清除浏览器中的 `SESSTOKEN` Cookie

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "已退出登录",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": null
}
```

### 1.5 忘记密码

- **POST** `/auth/password/forget`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | ✅ | 注册邮箱 |
| new_password | string | ✅ | 新密码，长度 32-128 |
| mail_code | string | ✅ | 找回密码验证码 |

**说明**

- 当前实现不校验 hCaptcha
- 邮箱验证码用途必须为 `forgot_password`
- 修改成功后会让该用户全部登录会话失效，并清除当前 Cookie

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "密码重置成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": null
}
```

**返回示例 - 失败**

```json
{
  "code": -404,
  "message": "该邮箱未注册",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {}
}
```

---

## 二、会话模块 `/session`

以下接口全部需要登录。

### 2.1 获取登录会话列表

- **GET** `/session/list`

**请求参数**：无

**说明**

- 仅返回当前用户 `status='active'` 的会话
- `ip` 字段为脱敏结果，IPv4 形式如 `192.168.*.*`
- `location` 来自登录时的 IP 属地解析结果

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| list | array | 会话列表 |

**list 元素结构**

| 字段 | 类型 | 说明 |
|------|------|------|
| session_id | string | 会话 UUID |
| location | string | 登录地区 |
| ip | string | 脱敏后的 IP |
| application | string | 应用描述 |
| created_at | number | 登录时间戳（秒） |
| last_seen_at | number\|null | 最后活跃时间戳（秒） |
| is_current | boolean | 是否当前设备 |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "获取登录会话成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "list": [
      {
        "session_id": "e9ef9874-17af-4f0c-8de7-6f0d9704f88b",
        "location": "中国 吉林 长春",
        "ip": "117.136.*.*",
        "application": "Web / Google Chrome / Windows",
        "created_at": 1775555200,
        "last_seen_at": 1775555488,
        "is_current": true
      }
    ]
  }
}
```

### 2.2 单点下线

- **POST** `/session/revoke`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| session_id | string | ✅ | 需要下线的会话 UUID |

**说明**

- 如果下线的是当前会话，服务端会同时清除当前 Cookie

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "会话已下线",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": null
}
```

**返回示例 - 失败**

```json
{
  "code": -404,
  "message": "登录会话不存在",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {}
}
```

### 2.3 全部退登

- **POST** `/session/revoke-all`

**请求参数**：无

**说明**

- 会让当前用户所有激活会话失效
- 包含当前设备
- 会清除当前 Cookie

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| revoked_count | number | 本次失效的会话数量 |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "已全部退登",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "revoked_count": 3
  }
}
```

---

## 三、用户模块 `/user`

除学校字典接口外，以下接口全部需要登录。

### 3.0 获取学校字典列表

- **GET** `/user/school/list`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pn | number | ❌ | 页码，默认 1 |
| ps | number | ❌ | 每页数量，默认 20，最大 100 |
| q | string | ❌ | 关键词，支持学校名称、城市、主管部门、办学层次、标识码模糊搜索 |
| city | string | ❌ | 城市筛选 |
| code | string | ❌ | 学校标识码前缀 |

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| total | number | 总数 |
| pn | number | 当前页 |
| ps | number | 每页数量 |
| lists | array | 学校列表 |

**lists 元素结构**

| 字段 | 类型 | 说明 |
|------|------|------|
| code | string | 学校标识码 |
| name | string | 学校名称 |
| city | string | 所在城市 |
| department | string | 主管部门 |
| level | string | 办学层次 |
| remark | string | 备注 |

### 3.1 获取当前用户信息

- **GET** `/user/info`

**请求参数**：无

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| uuid | string | 用户 UUID |
| username | string | 用户名 |
| sex | string | 性别 |
| email | string | 邮箱 |
| avatar | string\|null | 头像 |
| sign | string\|null | 签名 |
| school | string\|null | 学校 |
| school_code | string\|null | 学校标识码 |
| school_city | string\|null | 学校所在城市 |
| school_detail | object\|null | 学校详情对象 |
| birthday | string\|null | 生日，格式 `YYYY-MM-DD` |
| diary_count | number | 日记数量 |
| liked_count | number | 获赞数量 |
| exp | number | 当前经验值 |
| level | object | 当前等级信息 |
| enabled | boolean | 账号是否启用 |
| created_at | number | 注册时间戳（秒） |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "获取当前用户信息成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "uuid": "e4dfc11b-2cfd-4c47-9b46-5b1a2eb1f3ce",
    "username": "test_user",
    "sex": "未知",
    "email": "test@example.com",
    "avatar": null,
    "sign": "今天也写一点",
    "school": "北京大学",
    "school_code": "4111010001",
    "school_city": "北京市",
    "school_detail": {
      "code": "4111010001",
      "name": "北京大学",
      "city": "北京市"
    },
    "birthday": "2004-05-12",
    "diary_count": 3,
    "liked_count": 2,
    "exp": 120,
    "level": {
      "exp": 120,
      "level": 2,
      "level_name": "微光旅人",
      "level_min_exp": 100,
      "next_level_exp": 300,
      "is_max_level": false,
      "progress": 0.1
    },
    "enabled": true,
    "created_at": 1775000000
  }
}
```

### 3.2 获取指定用户详情

- **GET** `/user/detail`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_uuid | string | ✅ | 目标用户 UUID |

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| uuid | string | 用户 UUID |
| username | string | 用户名 |
| sex | string | 性别 |
| avatar | string\|null | 头像 |
| sign | string\|null | 签名 |
| school | string\|null | 学校 |
| school_code | string\|null | 学校标识码 |
| school_city | string\|null | 学校所在城市 |
| school_detail | object\|null | 学校详情对象 |
| diary_count | number | 日记数量 |
| liked_count | number | 获赞数量 |
| exp | number | 当前经验值 |
| level | object | 当前等级信息 |
| created_at | number | 注册时间戳（秒） |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "获取用户详情成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "uuid": "4da4890b-97e2-42da-bc2d-bf4d972c9b8f",
    "username": "paper_guest",
    "sex": "保密",
    "avatar": "https://img.halfpaper.top/avatar/demo.png",
    "sign": "慢一点也没关系",
    "school": "某某大学",
    "school_code": "4111010001",
    "school_city": "北京市",
    "school_detail": {
      "code": "4111010001",
      "name": "某某大学",
      "city": "北京市"
    },
    "diary_count": 12,
    "liked_count": 35,
    "exp": 860,
    "level": {
      "exp": 860,
      "level": 4,
      "level_name": "夜航作家",
      "level_min_exp": 700,
      "next_level_exp": 1500,
      "is_max_level": false,
      "progress": 0.2
    },
    "created_at": 1774100000
  }
}
```

### 3.3 修改个人资料

- **POST** `/user/profile`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | ❌ | 用户名，长度 5-16 |
| sex | string | ❌ | `男` / `女` / `保密` / `未知` |
| sign | string\|null | ❌ | 个性签名，传空字符串可清空 |
| birthday | string\|null | ❌ | 生日，格式 `YYYY-MM-DD`，传空字符串可清空 |
| school_code | string\|null | ❌ | 学校标识码，传空字符串可清空 |

**说明**

- 至少需要提交一个字段
- 修改用户名时会校验唯一性
- 修改学校时，服务端会自动根据学校字典回填 `users.school` 为学校名称

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| uuid | string | 用户 UUID |
| username | string | 用户名 |
| sex | string | 性别 |
| avatar | string\|null | 头像 |
| sign | string\|null | 签名 |
| school | string\|null | 学校 |
| school_code | string\|null | 学校标识码 |
| school_city | string\|null | 学校所在城市 |
| school_detail | object\|null | 学校详情对象 |
| birthday | string\|null | 生日 |
| diary_count | number | 日记数量 |
| liked_count | number | 获赞数量 |
| exp | number | 当前经验值 |
| level | object | 当前等级信息 |
| enabled | boolean | 账号是否启用 |
| created_at | number | 注册时间戳（秒） |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "个人信息修改成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "uuid": "e4dfc11b-2cfd-4c47-9b46-5b1a2eb1f3ce",
    "username": "paper_new",
    "sex": "保密",
    "avatar": null,
    "sign": "慢慢写，也没关系",
    "school": "北京大学",
    "school_code": "4111010001",
    "school_city": "北京市",
    "school_detail": {
      "code": "4111010001",
      "name": "北京大学",
      "city": "北京市"
    },
    "birthday": "2004-05-12",
    "diary_count": 3,
    "liked_count": 2,
    "exp": 120,
    "level": {
      "exp": 120,
      "level": 2,
      "level_name": "微光旅人",
      "level_min_exp": 100,
      "next_level_exp": 300,
      "is_max_level": false,
      "progress": 0.1
    },
    "enabled": true,
    "created_at": 1775000000
  }
}
```

### 3.4 修改邮箱

- **POST** `/user/email`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| new_email | string | ✅ | 新邮箱 |
| old_mail_code | string | ✅ | 旧邮箱验证码 |
| new_mail_code | string | ✅ | 新邮箱验证码 |

**说明**

- 新邮箱不能与当前邮箱相同
- 新邮箱必须未注册
- 旧邮箱验证码用途必须为 `change_email_old`
- 新邮箱验证码用途必须为 `change_email_new`
- 修改成功后会先撤销全部旧会话，再重新签发当前登录态

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| email | string | 修改后的邮箱 |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "邮箱修改成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "email": "new_test@example.com"
  }
}
```

### 3.5 修改密码

- **POST** `/user/password`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| new_password | string | ✅ | 新密码，长度 32-128 |
| mail_code | string | ✅ | 当前邮箱验证码 |
| token | string | ✅ | hCaptcha token |

**说明**

- 会校验 hCaptcha
- 邮箱验证码用途必须为 `change_password`
- 修改成功后会撤销全部旧会话，再为当前请求重新签发登录态

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "密码修改成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": null
}
```

### 3.6 注销账号

- **POST** `/user/delete`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| mail_code | string | ✅ | 当前邮箱收到的注销验证码 |

**说明**

- 邮箱验证码用途必须为 `delete_account`
- 会删除当前用户自身、其日记、相关 AI 对话、评论、点赞、收藏、图片和会话不支持的语言
- 完成后会清除当前 Cookie

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "账号已注销",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": null
}
```

---

## 四、日记模块 `/diary`

以下接口全部需要登录。

### 4.1 创建日记或草稿

- **POST** `/diary/create`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | ✅ | `draft` 或 `publish` |
| draft_id | string | ❌ | 草稿 UUID，存在时表示草稿转发布 |
| title | string | ❌ | 标题，最长 255 字 |
| content | string | ❌ | 正文，最长 5000 字 |
| visibility | string | ❌ | `private` / `fans` / `friends` / `public`，默认 `private` |
| weather | string | ❌ | 天气，最长 255 字 |
| mood | string | ❌ | 心情，最长 255 字 |
| topic_id | number | ❌ | 话题 ID |
| images | array | ❌ | 图片数组 |

**images 元素结构**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| filename | string | ✅ | 32 位文件名 |
| width | number | ✅ | 宽度 |
| height | number | ✅ | 高度 |
| size | number | ✅ | 文件大小 |

**说明**

- `type=publish` 时，`title` 和 `content` 至少填写一项
- `type=draft` 时最多允许 20 条草稿
- 图片必须已通过 `/image/callback` 激活，且属于当前用户
- 当前实现对创建行为做了 5 秒节流
- 发布成功后会为当前用户发放经验值
- `topic_id` 会校验话题是否存在，不存在时返回 `-400`

**返回参数 - 草稿**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 草稿 UUID |
| title | string\|null | 标题 |
| content | string\|null | 正文 |
| has_img | number | 是否有图 |
| images | array\|string\|null | 图片列表 |
| visibility | string | 可见性 |
| weather | string\|null | 天气 |
| mood | string\|null | 心情 |
| topic_id | number\|null | 话题 ID |
| favorite_count | number | 收藏数 |
| created_at | string | 创建时间 |
| updated_at | string\|null | 更新时间 |

**返回参数 - 发布**

在草稿返回字段基础上，额外返回：

| 字段 | 类型 | 说明 |
|------|------|------|
| comment_count | number | 评论数 |
| like_count | number | 点赞数 |
| favorite_count | number | 收藏数 |
| published_at | string\|null | 发布时间 |

**返回示例 - 创建草稿成功**

```json
{
  "code": 0,
  "message": "草稿创建成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "id": "0d7b8b2c-7f91-4417-85c6-f1b6f3846d27",
    "title": "还没写完",
    "content": "先记一点零碎感受。",
    "has_img": 0,
    "images": null,
    "visibility": "private",
    "weather": "阴",
    "mood": "平静",
    "topic_id": null,
    "created_at": "2026-04-07T08:30:00.000Z",
    "updated_at": null
  }
}
```

**返回示例 - 发布成功**

```json
{
  "code": 0,
  "message": "日记发布成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "id": "c980a93f-e44a-4406-b9a7-f5ea1e62b09b",
    "title": "今天过得不错",
    "content": "天气很好，晚风也舒服。",
    "has_img": 1,
    "images": [
      {
        "filename": "4d7c4ba1c4ce1f9c0b176be8f30a0c4d",
        "url": "https://img.halfpaper.top/diary/4d7c4ba1c4ce1f9c0b176be8f30a0c4d.jpg",
        "width": 1080,
        "height": 1440,
        "size": 356781
      }
    ],
    "visibility": "public",
    "weather": "晴",
    "mood": "开心",
    "topic_id": 3,
    "comment_count": 0,
    "like_count": 0,
    "favorite_count": 0,
    "created_at": "2026-04-07T08:32:00.000Z",
    "updated_at": null,
    "published_at": "2026-04-07T08:32:00.000Z"
  }
}
```

### 4.2 修改日记或草稿

- **POST** `/diary/update`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| diary_id | string | ✅ | 日记 UUID |
| title | string | ❌ | 标题 |
| content | string | ❌ | 内容 |
| visibility | string | ❌ | 可见性 |
| weather | string | ❌ | 天气 |
| mood | string | ❌ | 心情 |
| topic_id | number | ❌ | 话题 ID |
| images | array | ❌ | 图片数组，传空数组表示清空 |
| force_ai_reset | boolean | ❌ | 已有用户主动追聊时必须传 `true` |

**说明**

- 正式日记修改后，标题和内容至少保留一项
- 如果当前日记已有 AI 会话且存在用户主动追聊，未传 `force_ai_reset=true` 时返回 `-409`
- 如果当前日记存在 AI 会话，则更新成功后会清空该日记的 AI 会话和消息
- 正式日记首次改为 `public` 且此前未公开过时，会自动写入 `published_at`
- `images` 为全量替换，传空数组表示清空图片
- `topic_id` 会校验话题是否存在，不存在时返回 `-400`

**返回参数 - 草稿更新成功**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 草稿 UUID |
| title | string\|null | 标题 |
| content | string\|null | 内容 |
| has_img | number | 是否有图 |
| images | array\|string\|null | 图片列表 |
| visibility | string | 可见性 |
| weather | string\|null | 天气 |
| mood | string\|null | 心情 |
| topic_id | number\|null | 话题 ID |
| created_at | string | 创建时间 |
| updated_at | string\|null | 更新时间 |
| ai_chat_cleared | boolean | 是否清理了 AI 会话 |

**返回参数 - 正式日记更新成功**

在上述字段基础上，额外返回：

| 字段 | 类型 | 说明 |
|------|------|------|
| comment_count | number | 评论数 |
| like_count | number | 点赞数 |
| favorite_count | number | 收藏数 |
| published_at | string\|null | 发布时间 |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "日记修改成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "id": "c980a93f-e44a-4406-b9a7-f5ea1e62b09b",
    "title": "今天比昨天轻松一点",
    "content": "终于把一些事想通了。",
    "has_img": 0,
    "images": null,
    "visibility": "public",
    "weather": "多云",
    "mood": "轻松",
    "topic_id": 3,
    "comment_count": 2,
    "like_count": 5,
    "favorite_count": 1,
    "created_at": "2026-04-07T08:32:00.000Z",
    "updated_at": "2026-04-07T09:10:00.000Z",
    "published_at": "2026-04-07T08:32:00.000Z",
    "ai_chat_cleared": true
  }
}
```

**返回示例 - 需要强制清空 AI 历史**

```json
{
  "code": -409,
  "message": "当前日记已经与AI产生追聊记录，如需修改请传 force_ai_reset=true，修改后会清空AI聊天记录",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "has_ai_chat": true,
    "ai_chat_requires_force_update": true
  }
}
```

### 4.3 删除日记

- **POST** `/diary/delete`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| diary_id | string | ✅ | 日记 UUID |

**说明**

- 仅作者本人可删除
- 会同步删除该日记下的评论、评论点赞、日记点赞、日记收藏和 AI 对话

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "删除成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": null
}
```

### 4.4 获取日记详情

- **GET** `/diary/detail`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| diary_id | string | ✅ | 日记 UUID |

**说明**

- 支持查看自己的所有日记，以及他人 `status='active'`、`visibility='public'`、`moderation_status='normal'` 的公开日记
- 时间字段为秒级 Unix 时间戳

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 日记 ID |
| user_id | string | 作者 ID |
| title | string\|null | 标题 |
| content | string\|null | 内容 |
| has_img | number | 是否有图 |
| images | array\|string\|null | 图片列表 |
| visibility | string | 可见性 |
| like_count | number | 点赞数 |
| favorite_count | number | 收藏数 |
| comment_count | number | 评论数 |
| created_at | number | 创建时间戳 |
| updated_at | number\|null | 更新时间戳 |
| published_at | number\|null | 发布时间戳 |
| weather | string\|null | 天气 |
| mood | string\|null | 心情 |
| topic_id | number\|null | 话题 ID |
| status | string | 状态 |
| has_ai_chat | boolean | 是否存在 AI 会话 |
| ai_chat_requires_force_update | boolean | 是否存在用户主动追聊 |
| is_owner | boolean | 是否本人 |
| is_liked | boolean | 当前用户是否已点赞 |
| is_favorited | boolean | 当前用户是否已收藏 |
| author | object | 作者信息 |
| topic | object\|null | 话题信息 |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "获取日记详情成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "id": "c980a93f-e44a-4406-b9a7-f5ea1e62b09b",
    "user_id": "e4dfc11b-2cfd-4c47-9b46-5b1a2eb1f3ce",
    "title": "今天过得不错",
    "content": "天气很好，晚风也舒服。",
    "has_img": 1,
    "images": [
      {
        "filename": "4d7c4ba1c4ce1f9c0b176be8f30a0c4d",
        "url": "https://img.halfpaper.top/diary/4d7c4ba1c4ce1f9c0b176be8f30a0c4d.jpg",
        "width": 1080,
        "height": 1440,
        "size": 356781
      }
    ],
    "visibility": "public",
    "like_count": 5,
    "favorite_count": 1,
    "comment_count": 2,
    "created_at": 1775550720,
    "updated_at": 1775553000,
    "published_at": 1775550720,
    "weather": "晴",
    "mood": "开心",
    "topic_id": 3,
    "status": "active",
    "has_ai_chat": true,
    "ai_chat_requires_force_update": false,
    "is_owner": true,
    "is_liked": true,
    "is_favorited": true,
    "author": {
      "id": "e4dfc11b-2cfd-4c47-9b46-5b1a2eb1f3ce",
      "username": "test_user",
      "sex": "未知",
      "avatar": null,
      "sign": "今天也写一点",
      "school": null,
      "diary_count": 3,
      "liked_count": 2,
      "exp": 120,
      "level": {
        "exp": 120,
        "level": 2,
        "level_name": "微光旅人",
        "level_min_exp": 100,
        "next_level_exp": 300,
        "is_max_level": false,
        "progress": 0.1
      },
      "created_at": 1775000000
    },
    "topic": {
      "id": 3,
      "name": "校园日常",
      "desc": "记录普通却值得写下来的校园片段"
    }
  }
}
```

### 4.5 获取日记列表

- **GET** `/diary/list`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pn | number | ❌ | 页码，默认 1 |
| ps | number | ❌ | 每页数量，默认 20，最大 50 |
| visibility | string | ❌ | `private` / `fans` / `friends` / `public` |
| status | string | ❌ | `draft` / `active` / `deleted`，默认 `active` |

**说明**

- 当前代码返回字段名为 `lists`
- `summary` 为正文前 100 个字符
- 时间字段为秒级 Unix 时间戳

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| lists | array | 日记列表 |
| total | number | 总数 |
| pn | number | 当前页 |
| ps | number | 每页数量 |

**lists 元素结构**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 日记 ID |
| title | string\|null | 标题 |
| summary | string | 正文前 100 字 |
| has_img | number | 是否有图 |
| images | array\|string\|null | 图片列表 |
| visibility | string | 可见性 |
| like_count | number | 点赞数 |
| favorite_count | number | 收藏数 |
| comment_count | number | 评论数 |
| created_at | number | 创建时间戳 |
| updated_at | number\|null | 更新时间戳 |
| published_at | number\|null | 发布时间戳 |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "获取日记列表成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "lists": [
      {
        "id": "c980a93f-e44a-4406-b9a7-f5ea1e62b09b",
        "title": "今天过得不错",
        "summary": "天气很好，晚风也舒服。",
        "has_img": 1,
        "images": [
          {
            "filename": "4d7c4ba1c4ce1f9c0b176be8f30a0c4d",
            "url": "https://img.halfpaper.top/diary/4d7c4ba1c4ce1f9c0b176be8f30a0c4d.jpg",
            "width": 1080,
            "height": 1440,
            "size": 356781
          }
        ],
        "visibility": "public",
        "like_count": 5,
        "favorite_count": 1,
        "comment_count": 2,
        "created_at": 1775550720,
        "updated_at": 1775553000,
        "published_at": 1775550720
      }
    ],
    "total": 1,
    "pn": 1,
    "ps": 20
  }
}
```

### 4.6 点赞日记

- **POST** `/diary/like`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| diary_id | string | ✅ | 日记 UUID |

**说明**

- 已经点过赞时返回 `-400`，提示“已经点过赞了”
- 本人可点赞自己的非删除日记
- 非本人仅可点赞 `status='active'` 且 `visibility!='private'` 的日记

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| diary_id | string | 日记 ID |
| like_count | number | 当前点赞数 |
| is_liked | boolean | 固定为 `true` |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "点赞成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "diary_id": "c980a93f-e44a-4406-b9a7-f5ea1e62b09b",
    "like_count": 6,
    "is_liked": true
  }
}
```

### 4.7 取消点赞日记

- **POST** `/diary/unlike`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| diary_id | string | ✅ | 日记 UUID |

**说明**

- 当前未点赞时返回 `-400`，提示“还没有点过赞”
- 权限规则与点赞接口一致

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| diary_id | string | 日记 ID |
| like_count | number | 当前点赞数 |
| is_liked | boolean | 固定为 `false` |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "取消点赞成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "diary_id": "c980a93f-e44a-4406-b9a7-f5ea1e62b09b",
    "like_count": 5,
    "is_liked": false
  }
}
```

### 4.8 收藏日记

- **POST** `/diary/favorite`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| diary_id | string | ✅ | 日记 UUID |

**说明**

- 重复收藏会直接返回成功，不会重复插入记录
- 当前权限规则与点赞接口保持一致：本人非删除日记可收藏；非本人仅可收藏 `status='active'` 且 `visibility!='private'` 的日记

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| diary_id | string | 日记 ID |
| favorite_count | number | 当前收藏数 |
| is_favorited | boolean | 固定为 `true` |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "收藏成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "diary_id": "c980a93f-e44a-4406-b9a7-f5ea1e62b09b",
    "favorite_count": 2,
    "is_favorited": true
  }
}
```

### 4.9 取消收藏日记

- **POST** `/diary/unfavorite`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| diary_id | string | ✅ | 日记 UUID |

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| diary_id | string | 日记 ID |
| favorite_count | number | 当前收藏数 |
| is_favorited | boolean | 固定为 `false` |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "取消收藏成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "diary_id": "c980a93f-e44a-4406-b9a7-f5ea1e62b09b",
    "favorite_count": 1,
    "is_favorited": false
  }
}
```

### 4.10 获取收藏列表

- **GET** `/diary/favorite/list`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pn | number | ❌ | 页码，默认 1 |
| ps | number | ❌ | 每页数量，默认 20，最大 50 |

**说明**

- 仅返回当前用户仍然有权限访问的收藏内容
- 返回字段 `favorite_created_at` 表示收藏时间，时间戳为秒级

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| lists | array | 收藏列表 |
| total | number | 总数 |
| pn | number | 当前页 |
| ps | number | 每页数量 |

**lists 元素结构**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 日记 ID |
| user_id | string | 作者 ID |
| title | string\|null | 标题 |
| summary | string | 正文摘要 |
| has_img | number | 是否有图 |
| images | array\|string\|null | 图片列表 |
| visibility | string | 可见性 |
| status | string | 日记状态 |
| like_count | number | 点赞数 |
| favorite_count | number | 收藏数 |
| comment_count | number | 评论数 |
| created_at | number | 创建时间戳 |
| updated_at | number\|null | 更新时间戳 |
| published_at | number\|null | 发布时间戳 |
| favorite_created_at | number | 收藏时间戳 |
| weather | string\|null | 天气 |
| mood | string\|null | 心情 |
| topic | object\|null | 话题信息 |
| author | object | 作者信息 |
| is_owner | boolean | 是否当前用户本人 |
| is_favorited | boolean | 固定为 `true` |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "获取收藏列表成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "lists": [
      {
        "id": "c980a93f-e44a-4406-b9a7-f5ea1e62b09b",
        "user_id": "4da4890b-97e2-42da-bc2d-bf4d972c9b8f",
        "title": "今天过得不错",
        "summary": "天气很好，晚风也舒服。",
        "has_img": 1,
        "images": null,
        "visibility": "public",
        "status": "active",
        "like_count": 5,
        "favorite_count": 2,
        "comment_count": 2,
        "created_at": 1775550720,
        "updated_at": 1775553000,
        "published_at": 1775550720,
        "favorite_created_at": 1775553600,
        "weather": "晴",
        "mood": "开心",
        "topic": {
          "id": 3,
          "name": "校园日常",
          "desc": "记录普通却值得写下来的校园片段"
        },
        "author": {
          "id": "4da4890b-97e2-42da-bc2d-bf4d972c9b8f",
          "username": "paper_guest",
          "sex": "保密",
          "avatar": null,
          "sign": "慢一点也没关系",
          "school": null,
          "exp": 860,
          "level": {
            "exp": 860,
            "level": 4,
            "level_name": "夜航作家",
            "level_min_exp": 700,
            "next_level_exp": 1500,
            "is_max_level": false,
            "progress": 0.2
          }
        },
        "is_owner": false,
        "is_favorited": true
      }
    ],
    "total": 1,
    "pn": 1,
    "ps": 20
  }
}
```

### 4.11 搜索自己的日记

- **GET** `/diary/search`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| q | string | ✅ | 搜索关键词，长度 1-100 |
| pn | number | ❌ | 页码，默认 1 |
| ps | number | ❌ | 每页数量，默认 20，最大 50 |
| visibility | string | ❌ | `private` / `fans` / `friends` / `public` |
| status | string | ❌ | `draft` / `active` / `deleted`，默认 `active` |

**说明**

- 仅搜索当前登录用户自己的日记
- 搜索条件使用 `MATCH(title, content)` 与 `LIKE` 组合
- 返回字段与日记列表接近，并额外包含 `status`、`topic_id`、`relevance`

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "搜索日记成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "keyword": "考试周",
    "status": "active",
    "visibility": "public",
    "lists": [
      {
        "id": "c980a93f-e44a-4406-b9a7-f5ea1e62b09b",
        "title": "考试周终于结束了",
        "summary": "今天终于把最后一门也交了。",
        "has_img": 0,
        "images": null,
        "visibility": "public",
        "status": "active",
        "topic_id": 3,
        "like_count": 5,
        "favorite_count": 1,
        "comment_count": 2,
        "created_at": 1775550720,
        "updated_at": 1775553000,
        "published_at": 1775550720,
        "relevance": 1.2876821
      }
    ],
    "total": 1,
    "pn": 1,
    "ps": 20
  }
}
```

---

## 五、评论模块 `/comment`

### 5.1 获取评论列表

- **GET** `/comment/list`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| diary_id | string | ✅ | 日记 UUID |
| page | number | ❌ | 顶级评论页码，默认 1 |
| page_size | number | ❌ | 顶级评论每页数量，默认 20，最大 50 |

**说明**

- 该接口无需登录，但登录后会返回更准确的 `is_liked` 和 `can_delete`
- 对于非作者，当前代码仅允许查看 `status='active'` 且 `visibility!='private'` 的日记评论
- 当前代码没有额外校验 `fans` / `friends` 关系
- 一级评论列表字段名为 `replies`
- 每条一级评论固定附带最早 5 条回复预览，查看更多回复请调用 `/comment/reply`

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| diary_id | string | 日记 ID |
| replies | array | 一级评论列表 |
| pagination | object | 顶级评论分页信息（包含 total 一级评论数、total_all 全部评论数） |

**replies 元素结构**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 评论 ID |
| diary_id | string | 日记 ID |
| root_id | string\|null | 根评论 ID，一级评论为 `null` |
| parent_id | string\|null | 父评论 ID，一级评论为 `null` |
| content | string | 评论内容 |
| created_at | number | 创建时间戳 |
| member | object | 评论作者 |
| like_count | number | 点赞数 |
| is_liked | boolean | 当前用户是否已点赞 |
| can_delete | boolean | 当前用户是否可删除 |
| rcount | number | 该一级评论下回复总数 |
| reply_control | object | 前端展示辅助信息 |
| replies | array | 回复预览列表 |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "获取评论成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "diary_id": "c980a93f-e44a-4406-b9a7-f5ea1e62b09b",
    "replies": [
      {
        "id": "4bd10aef-7f9b-43c4-9265-d0bcead98f08",
        "diary_id": "c980a93f-e44a-4406-b9a7-f5ea1e62b09b",
        "root_id": null,
        "parent_id": null,
        "content": "看起来是很舒服的一天。",
        "created_at": 1775553300,
        "member": {
          "id": "4da4890b-97e2-42da-bc2d-bf4d972c9b8f",
          "username": "paper_guest",
          "sex": "保密",
          "avatar": null,
          "sign": "慢一点也没关系",
          "school": null
        },
        "like_count": 2,
        "is_liked": false,
        "can_delete": false,
        "rcount": 1,
        "reply_control": {
          "sub_reply_title_text": "共1条回复",
          "time_desc": "3分钟前发布",
          "location": "IP属地：中国 吉林"
        },
        "replies": [
          {
            "id": "2aa986b3-5e8c-4911-9881-57d6b5e9dc5a",
            "diary_id": "c980a93f-e44a-4406-b9a7-f5ea1e62b09b",
            "root_id": "4bd10aef-7f9b-43c4-9265-d0bcead98f08",
            "parent_id": null,
            "content": "是的，终于缓了一口气。",
            "created_at": 1775553420,
            "member": {
              "id": "e4dfc11b-2cfd-4c47-9b46-5b1a2eb1f3ce",
              "username": "test_user",
              "sex": "未知",
              "avatar": null,
              "sign": "今天也写一点",
              "school": null
            },
            "like_count": 0,
            "is_liked": false,
            "can_delete": true,
            "reply_control": {
              "sub_reply_title_text": "",
              "time_desc": "1分钟前发布",
              "location": "IP属地：中国 吉林"
            }
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 1,
      "total_all": 2,
      "total_pages": 1
    }
  }
}
```

### 5.2 获取某一级评论下的回复列表

- **GET** `/comment/reply`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| diary_id | string | ✅ | 日记 UUID |
| root_id | string | ✅ | 一级评论 UUID |
| page | number | ❌ | 页码，默认 1 |
| page_size | number | ❌ | 每页数量，默认 20，最大 50 |

**说明**

- 该接口无需登录，权限规则与 `/comment/list` 相同
- `root_comment` 返回一级评论本身
- `replies` 返回其下所有二级及更深回复

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "获取回复成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "diary_id": "c980a93f-e44a-4406-b9a7-f5ea1e62b09b",
    "root_comment": {
      "id": "4bd10aef-7f9b-43c4-9265-d0bcead98f08",
      "diary_id": "c980a93f-e44a-4406-b9a7-f5ea1e62b09b",
      "root_id": null,
      "parent_id": null,
      "content": "看起来是很舒服的一天。",
      "created_at": 1775553300,
      "member": {
        "id": "4da4890b-97e2-42da-bc2d-bf4d972c9b8f",
        "username": "paper_guest",
        "sex": "保密",
        "avatar": null,
        "sign": "慢一点也没关系",
        "school": null
      },
      "like_count": 2,
      "is_liked": false,
      "rcount": 2,
      "reply_control": {
        "sub_reply_title_text": "共2条回复",
        "time_desc": "3分钟前发布",
        "location": "IP属地：中国 吉林"
      }
    },
    "replies": [
      {
        "id": "2aa986b3-5e8c-4911-9881-57d6b5e9dc5a",
        "diary_id": "c980a93f-e44a-4406-b9a7-f5ea1e62b09b",
        "root_id": "4bd10aef-7f9b-43c4-9265-d0bcead98f08",
        "parent_id": null,
        "content": "是的，终于缓了一口气。",
        "created_at": 1775553420,
        "member": {
          "id": "e4dfc11b-2cfd-4c47-9b46-5b1a2eb1f3ce",
          "username": "test_user",
          "sex": "未知",
          "avatar": null,
          "sign": "今天也写一点",
          "school": null
        },
        "reply_to": {
          "comment_id": "4bd10aef-7f9b-43c4-9265-d0bcead98f08",
          "member": {
            "id": "4da4890b-97e2-42da-bc2d-bf4d972c9b8f",
            "username": "paper_guest"
          }
        },
        "like_count": 0,
        "is_liked": false,
        "can_delete": true,
        "reply_control": {
          "sub_reply_title_text": "",
          "time_desc": "1分钟前发布",
          "location": "IP属地：中国 吉林"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 2,
      "total_pages": 1
    }
  }
}
```

### 5.3 创建评论

- **POST** `/comment/create`
- 需要登录

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| diary_id | string | ✅ | 日记 UUID |
| content | string | ✅ | 评论内容，最长 500 字 |
| root_id | string | ❌ | 一级评论 ID，不传表示顶级评论 |
| parent_id | string | ❌ | 父评论 ID，不传表示直接挂在一级评论下 |

**说明**

- 顶级评论：`root_id=null` 且 `parent_id=null`
- 回复一级评论时：可只传 `parent_id`，服务端会自动补全 `root_id`
- 回复二级评论时：服务端会校验 `parent_id` 与 `root_id` 是否匹配
- 当前代码对非作者只校验日记是否公开可评论，不额外校验 `fans` / `friends` 关系
- 当公开日记的 `is_can_reply=0` 时，非作者不可评论
- 评论时会记录客户端 IP，并保存地区文本到 `comment_region`
- 返回的 `data` 结构与 `/comment/list` 的 `data.replies` 单项保持一致

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "评论成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "id": "2aa986b3-5e8c-4911-9881-57d6b5e9dc5a",
    "diary_id": "c980a93f-e44a-4406-b9a7-f5ea1e62b09b",
    "root_id": "4bd10aef-7f9b-43c4-9265-d0bcead98f08",
    "parent_id": null,
    "content": "是的，终于缓了一口气。",
    "created_at": 1775553420,
    "member": {
      "id": "e4dfc11b-2cfd-4c47-9b46-5b1a2eb1f3ce",
      "username": "test_user",
      "sex": "未知",
      "avatar": null,
      "sign": "今天也写一点",
      "school": null
    },
    "like_count": 0,
    "is_liked": false,
    "can_delete": true,
    "rcount": 0,
    "reply_control": {
      "sub_reply_title_text": "",
      "time_desc": "刚刚发布",
      "location": "IP属地：中国 吉林"
    },
    "replies": []
  }
}
```

### 5.4 删除评论

- **POST** `/comment/delete`
- 需要登录

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| comment_id | string | ✅ | 评论 UUID |

**说明**

- 评论作者可删除自己的评论
- 日记作者可删除该日记下任意评论
- 删除一级评论时会带走整条评论线程
- 删除子评论时会递归删除其子树
- 当日记作者删除他人评论时，会向评论作者发送站内通知，通知内容包含评论摘要（最多 160 字）

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| deleted_count | number | 实际删除的评论数量 |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "删除成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "deleted_count": 2
  }
}
```

### 5.5 点赞评论

- **POST** `/comment/like`
- 需要登录

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| comment_id | string | ✅ | 评论 UUID |

**说明**

- 已经点过赞时返回 `-400`，提示“已经点过赞了”

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| comment_id | string | 评论 ID |
| like_count | number | 当前点赞数 |
| is_liked | boolean | 固定为 `true` |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "点赞成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "comment_id": "4bd10aef-7f9b-43c4-9265-d0bcead98f08",
    "like_count": 3,
    "is_liked": true
  }
}
```

### 5.6 取消点赞评论

- **POST** `/comment/unlike`
- 需要登录

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| comment_id | string | ✅ | 评论 UUID |

**说明**

- 当前未点赞时返回 `-400`，提示“还没有点过赞”

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| comment_id | string | 评论 ID |
| like_count | number | 当前点赞数 |
| is_liked | boolean | 固定为 `false` |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "取消点赞成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "comment_id": "4bd10aef-7f9b-43c4-9265-d0bcead98f08",
    "like_count": 2,
    "is_liked": false
  }
}
```

---

## 六、图片模块 `/image`

### 6.1 获取上传预签名

- **POST** `/image/presign`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | ✅ | `diary` 或 `avatar` |
| mime_type | string | ✅ | `image/jpg` / `image/png` / `image/jpeg` / `image/gif` / `image/heic` / `image/heif` |
| size | number | ✅ | 文件字节大小，1 到 10MB |

**说明**

- 当前路由未强制登录
- 当前实现中如果 `req.user` 为空，会回退到一个写死的用户 UUID
- 调用成功后会先在 `images` 表写入一条 `status='temp'` 记录
- `key` 的实际格式为 `${type}/${filename}${ext}`，其中 `filename` 只有 32 位随机 hex，不带扩展名
- `signature` 字段是 `ali-oss` 的 `signPostObjectPolicyV4` 返回值，本质是一个签名字符串，不是对象
- 客户端直传 OSS 时，通常需要把 `data.signature` 作为表单字段 `x-oss-signature` 提交
- 前端参照这个格式构建：
```html
const formData = new FormData();
formData.append("success_action_status", "200");
formData.append("policy", data.policy);
formData.append("x-oss-signature", data.signature);
formData.append("x-oss-signature-version", "OSS4-HMAC-SHA256");
formData.append("x-oss-credential", data.x_oss_credential);
formData.append("x-oss-date", data.x_oss_date);
formData.append("key", data.key); // 文件名
formData.append("callback", data.callback);
for (const [k, v] of Object.entries(JSON.parse(atob(data.callback_var)))) {
    formData.append(k, v);
}
formData.append("file", file); // file 必须为最后一个表单域
```

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| host | string | 上传域名 |
| policy | string | Base64 编码策略 |
| x_oss_signature_version | string | 签名版本 |
| x_oss_credential | string | 凭证 |
| x_oss_date | string | 时间字符串 |
| signature | string | OSS V4 签名字符串 |
| key | string | OSS 对象 key，包含业务目录和扩展名 |
| filename | string | 32 位随机文件名，不带扩展名 |
| callback | string | Base64 编码后的回调配置 |
| callback_var | string | Base64 编码后的回调变量，注意不能直接提交此字段，必须参照说明中拆开，当前包含 `x:user_id` 和 `x:filename` |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "预签名生成成功",
  "codename": "Hyacine",
  "timestamp": 1775568445524,
  "data": {
    "host": "https://img.halfpaper.top",
    "policy": "eyJleHBpcmF0aW9uIjoiMjAyNi0wNC0wN1QxMzozNzoyMi44NDhaIiwiY29uZGl0aW9ucyI6W3siYnVja2V0IjoiaGFsZnBhcGVyLWltZyJ9LFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLDEsMTA0ODU3NjBdLHsia2V5IjoiZGlhcnkvZTE2OWRmNWYxMTg1NDEyOTIxNDE1OTQ1NWUxN2ZjZjUucG5nIn0sWyJpbiIsIiRjb250ZW50LXR5cGUiLFsiaW1hZ2UvanBnIiwiaW1hZ2UvcG5nIiwiaW1hZ2UvanBlZyIsImltYWdlL2dpZiIsImltYWdlL2hlaWMiLCJpbWFnZS9oZWlmIl1dLHsieC1vc3MtY3JlZGVudGlhbCI6IkxUQUk1dDg1ZmM2RXk3NjJncnV2MXBnMy8yMDI2MDQwNy9hcC1zb3V0aGVhc3QtMS9vc3MvYWxpeXVuX3Y0X3JlcXVlc3QifSx7Ingtb3NzLXNpZ25hdHVyZS12ZXJzaW9uIjoiT1NTNC1ITUFDLVNIQTI1NiJ9LHsieC1vc3MtZGF0ZSI6IjIwMjYwNDA3VDEzMzcyMloifSx7ImNhbGxiYWNrIjoiZXlKallXeHNZbUZqYTFWeWJDSTZJbWgwZEhCek9pOHZZWEJwTG1oaGJHWndZWEJsY2k1MGIzQXZhVzFoWjJVdlkyRnNiR0poWTJzaUxDSmpZV3hzWW1GamEwSnZaSGtpT2lKN1hDSm1hV3hsYm1GdFpWd2lPaVI3ZURwbWFXeGxibUZ0Wlgwc1hDSjFjMlZ5WDJsa1hDSTZKSHQ0T25WelpYSmZhV1I5TEZ3aWMybDZaVndpT2lSN2MybDZaWDBzWENKdGFXMWxWSGx3WlZ3aU9pUjdiV2x0WlZSNWNHVjlMRndpYUdWcFoyaDBYQ0k2Skh0cGJXRm5aVWx1Wm04dWFHVnBaMmgwZlN4Y0luZHBaSFJvWENJNkpIdHBiV0ZuWlVsdVptOHVkMmxrZEdoOWZTSXNJbU5oYkd4aVlXTnJRbTlrZVZSNWNHVWlPaUpoY0hCc2FXTmhkR2x2Ymk5cWMyOXVJaXdpWTJGc2JHSmhZMnRUVGtraU9uUnlkV1Y5In0seyJ4OnVzZXJfaWQiOiIyOTM0NmUzYS0xODVkLTQ3YjUtOGRkYy04MGNjYWQ3NGM2ZjcifSx7Ing6ZmlsZW5hbWUiOiJlMTY5ZGY1ZjExODU0MTI5MjE0MTU5NDU1ZTE3ZmNmNSJ9XX0=",
    "x_oss_signature_version": "OSS4-HMAC-SHA256",
    "x_oss_credential": "LTAI5t85fc6Ey762gruv1pg3/20260407/ap-southeast-1/oss/aliyun_v4_request",
    "x_oss_date": "20260407T133722Z",
    "signature": "fc85c741e72d626ddc1d0dbfa39e278881955082f9ac70e69813608e37f24d9a",
    "key": "diary/e169df5f11854129214159455e17fcf5.png",
    "filename": "e169df5f11854129214159455e17fcf5",
    "callback": "eyJjYWxsYmFja1VybCI6Imh0dHBzOi8vYXBpLmhhbGZwYXBlci50b3AvaW1hZ2UvY2FsbGJhY2siLCJjYWxsYmFja0JvZHkiOiJ7XCJmaWxlbmFtZVwiOiR7eDpmaWxlbmFtZX0sXCJ1c2VyX2lkXCI6JHt4OnVzZXJfaWR9LFwic2l6ZVwiOiR7c2l6ZX0sXCJtaW1lVHlwZVwiOiR7bWltZVR5cGV9LFwiaGVpZ2h0XCI6JHtpbWFnZUluZm8uaGVpZ2h0fSxcIndpZHRoXCI6JHtpbWFnZUluZm8ud2lkdGh9fSIsImNhbGxiYWNrQm9keVR5cGUiOiJhcHBsaWNhdGlvbi9qc29uIiwiY2FsbGJhY2tTTkkiOnRydWV9",
    "callback_var": "eyJ4OnVzZXJfaWQiOiIyOTM0NmUzYS0xODVkLTQ3YjUtOGRkYy04MGNjYWQ3NGM2ZjciLCJ4OmZpbGVuYW1lIjoiZTE2OWRmNWYxMTg1NDEyOTIxNDE1OTQ1NWUxN2ZjZjUifQ=="
  }
}
```

### 6.2 图片上传回调

- **POST** `/image/callback`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| filename | string | ✅ | 文件名 |
| user_id | string | ✅ | 用户 UUID |
| size | number | ❌ | 文件大小 |
| mimeType | string | ❌ | MIME 类型 |
| height | number | ❌ | 图片高度 |
| width | number | ❌ | 图片宽度 |

**说明**

- 该接口供 OSS 回调使用
- 会把对应图片从 `temp` 改为 `active`

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| url | string | 图片 URL |
| filename | string | 文件名 |
| size | number | 文件大小 |
| width | number | 图片宽度 |
| height | number | 图片高度 |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "图片上传成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "url": "https://img.halfpaper.top/diary/4d7c4ba1c4ce1f9c0b176be8f30a0c4d.jpg",
    "filename": "4d7c4ba1c4ce1f9c0b176be8f30a0c4d",
    "size": 356781,
    "width": 1080,
    "height": 1440
  }
}
```

---

## 七、AI 模块 `/ai`

### 7.1 AI 联通性测试

- **ALL** `/ai`
- **ALL** `/ai/test`

**说明**

- 调试用途
- 请求体无固定要求
- 服务端会向模型发送固定测试消息并返回回复内容

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| content | string | AI 回复内容 |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "ok",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "content": "我是拾光，会陪你一起读这页心事。"
  }
}
```

### 7.2 获取日记 AI 历史记录

- **GET** `/ai/diary/history`
- 需要登录

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| diary_id | string | ✅ | 日记 UUID |

**说明**

- 仅允许读取当前登录用户自己的日记 AI 历史
- 当日记还没有 AI 会话时，`messages` 返回空数组，且不会返回 `conversation_id`

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| diary_id | string | 日记 ID |
| diary_status | string | 日记状态 |
| conversation_id | string | 会话 ID，无会话时不返回 |
| has_ai_chat | boolean | 是否存在 AI 会话 |
| has_user_reply | boolean | 是否存在用户主动追聊 |
| messages | array | 历史消息 |

**messages 元素结构**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 消息 UUID |
| role | string | `user` 或 `assistant` |
| content | string | 消息内容 |
| message_type | string | `initial` 或 `chat` |
| created_at | number | 创建时间戳（秒） |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "获取AI对话历史成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "diary_id": "c980a93f-e44a-4406-b9a7-f5ea1e62b09b",
    "diary_status": "active",
    "conversation_id": "d996ab88-f4c8-4f25-8bd6-4da4f83cb2ce",
    "has_ai_chat": true,
    "has_user_reply": true,
    "messages": [
      {
        "id": "77fe22e5-b0b5-4868-9e7e-50b1456b63c0",
        "role": "assistant",
        "content": "先抱抱你，今天已经很辛苦了。",
        "message_type": "initial",
        "created_at": 1775551200
      },
      {
        "id": "77af7343-f30d-4df2-bf43-d1bf622e0f47",
        "role": "user",
        "content": "我其实还是有点难受。",
        "message_type": "chat",
        "created_at": 1775551800
      }
    ]
  }
}
```

### 7.3 日记 AI 流式对话

- **POST** `/ai/diary/stream`
- 需要登录
- 返回类型：`text/event-stream`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| diary_id | string | ✅ | 已发布日记 UUID |
| message | string | ❌ | 用户追聊内容，长度 1-2000 |

**说明**

- 仅允许对当前登录用户自己的、`status='active'` 的日记发起 AI 对话
- 首次仅传 `diary_id` 时，会生成 AI 首条回复，消息类型记为 `initial`
- 已存在 AI 会话时，再次调用必须传 `message`，否则返回 `-409`
- 用户追聊消息会落库为 `role='user'`、`message_type='chat'`
- AI 回复会落库为 `role='assistant'`，首次为 `initial`，后续为 `chat`

**SSE 返回示例**

```text
data: {"type":"start","conversation_id":"d996ab88-f4c8-4f25-8bd6-4da4f83cb2ce","has_user_reply":false}

data: {"type":"delta","content":"先抱抱你。"}

data: {"type":"delta","content":"今天已经很辛苦了。"}

data: {"type":"done","conversation_id":"d996ab88-f4c8-4f25-8bd6-4da4f83cb2ce","message_id":"77fe22e5-b0b5-4868-9e7e-50b1456b63c0","content":"先抱抱你。今天已经很辛苦了。"}
```

**普通 JSON 返回示例 - 已有会话但未传 message**

```json
{
  "code": -409,
  "message": "当前日记已有AI对话，请读取历史记录或继续发送消息",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {}
}
```

---

## 八、萤火集模块 `/fireflies`

### 8.1 获取萤火集公开内容流

- **GET** `/fireflies/list`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pn | number | ❌ | 页码，默认 1 |
| ps | number | ❌ | 每页数量，默认 20，最大 50 |
| sort | string | ❌ | `hot` 或 `latest`，默认 `hot` |
| topic_id | number | ❌ | 话题 ID，按话题筛选 |

**说明**

- 仅返回 `status='active'`、`visibility='public'` 且 `published_at IS NOT NULL` 的公开日记
- 未登录时 `is_favorited` 固定返回 `false`
- 当前实现仍会顺带返回完整话题列表，便于旧前端兼容
- **学校优先推送**：已登录且设置了学校的用户，同校作者的内容会在同等条件下优先排序（排序字段增加 `is_same_school DESC` 前缀）；未登录或未设学校时排序不受影响
- `is_same_school` 字段：当前用户与作者是否为同一所学校。未登录或未设学校时固定为 `false`

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| platform | object | 平台信息，固定为萤火集 |
| sort | string | 当前排序方式 |
| topic_id | number\|null | 当前筛选的话题 ID |
| tabs | array | 可用排序标签 |
| topics | array | 话题列表 |
| lists | array | 内容列表 |
| total | number | 总数 |
| pn | number | 当前页 |
| ps | number | 每页数量 |

**lists 元素结构**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 日记 ID |
| user_id | string | 作者 ID |
| title | string\|null | 标题 |
| summary | string | 正文摘要 |
| has_img | number | 是否有图 |
| images | array\|string\|null | 图片列表 |
| like_count | number | 点赞数 |
| favorite_count | number | 收藏数 |
| comment_count | number | 评论数 |
| created_at | number | 创建时间戳 |
| updated_at | number\|null | 更新时间戳 |
| published_at | number\|null | 发布时间戳 |
| weather | string\|null | 天气 |
| mood | string\|null | 心情 |
| topic | object\|null | 话题信息 |
| author | object | 作者信息 |
| is_owner | boolean | 当前登录用户是否本人 |
| is_favorited | boolean | 当前用户是否已收藏 |
| is_same_school | boolean | 当前用户与作者是否同校 |

**author 对象结构**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 作者 ID |
| username | string | 用户名 |
| sex | string | 性别 |
| avatar | string\|null | 头像 |
| sign | string\|null | 签名 |
| school | string\|null | 学校名称 |
| school_code | string\|null | 学校标识码 |
| exp | number | 经验值 |
| level | object | 等级信息 |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "获取萤火集列表成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "platform": {
      "code": "fireflies",
      "name": "萤火集"
    },
    "sort": "hot",
    "topic_id": 3,
    "tabs": [
      {
        "code": "hot",
        "name": "热门"
      },
      {
        "code": "latest",
        "name": "最新"
      }
    ],
    "topics": [
      {
        "id": 3,
        "name": "校园日常",
        "desc": "记录普通却值得写下来的校园片段"
      }
    ],
    "lists": [
      {
        "id": "c980a93f-e44a-4406-b9a7-f5ea1e62b09b",
        "user_id": "4da4890b-97e2-42da-bc2d-bf4d972c9b8f",
        "title": "今天过得不错",
        "summary": "天气很好，晚风也舒服。",
        "has_img": 1,
        "images": null,
        "like_count": 5,
        "favorite_count": 3,
        "comment_count": 2,
        "created_at": 1775550720,
        "updated_at": 1775553000,
        "published_at": 1775550720,
        "weather": "晴",
        "mood": "开心",
        "topic": {
          "id": 3,
          "name": "校园日常",
          "desc": "记录普通却值得写下来的校园片段"
        },
        "author": {
          "id": "4da4890b-97e2-42da-bc2d-bf4d972c9b8f",
          "username": "paper_guest",
          "sex": "保密",
          "avatar": null,
          "sign": "慢一点也没关系",
          "school": "某某大学",
          "school_code": "10001",
          "exp": 860,
          "level": {
            "exp": 860,
            "level": 4,
            "level_name": "夜航作家",
            "level_min_exp": 700,
            "next_level_exp": 1500,
            "is_max_level": false,
            "progress": 0.2
          }
        },
        "is_owner": false,
        "is_favorited": true,
        "is_same_school": true
      }
    ],
    "total": 1,
    "pn": 1,
    "ps": 20
  }
}
```

### 8.2 搜索萤火集

- **GET** `/fireflies/search`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| q | string | ✅ | 搜索关键词，长度 1-100 |
| pn | number | ❌ | 页码，默认 1 |
| ps | number | ❌ | 每页数量，默认 20，最大 50 |
| topic_id | number | ❌ | 话题 ID，按话题过滤搜索结果 |

**说明**

- 仅搜索萤火集公开已发布日记
- 当前实现使用 `MATCH(title, content)` 与 `LIKE` 组合，兼顾全文索引与模糊匹配
- 返回结果包含 `relevance` 字段，表示当前搜索相关度分值

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| keyword | string | 实际搜索关键词 |
| topic_id | number\|null | 当前筛选的话题 ID |
| lists | array | 搜索结果列表 |
| total | number | 总数 |
| pn | number | 当前页 |
| ps | number | 每页数量 |

**lists 元素结构**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 日记 ID |
| user_id | string | 作者 ID |
| title | string\|null | 标题 |
| summary | string | 正文摘要 |
| has_img | number | 是否有图 |
| images | array\|string\|null | 图片列表 |
| like_count | number | 点赞数 |
| favorite_count | number | 收藏数 |
| comment_count | number | 评论数 |
| created_at | number | 创建时间戳 |
| updated_at | number\|null | 更新时间戳 |
| published_at | number\|null | 发布时间戳 |
| weather | string\|null | 天气 |
| mood | string\|null | 心情 |
| relevance | number | 搜索相关度 |
| topic | object\|null | 话题信息 |
| author | object | 作者信息 |
| is_owner | boolean | 当前登录用户是否本人 |
| is_favorited | boolean | 当前用户是否已收藏 |

**author 对象结构**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 作者 ID |
| username | string | 用户名 |
| sex | string | 性别 |
| avatar | string\|null | 头像 |
| sign | string\|null | 签名 |
| school | string\|null | 学校名称 |
| school_code | string\|null | 学校标识码 |
| exp | number | 经验值 |
| level | object | 等级信息 |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "搜索萤火集成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "keyword": "考试周",
    "topic_id": 3,
    "lists": [
      {
        "id": "c980a93f-e44a-4406-b9a7-f5ea1e62b09b",
        "user_id": "4da4890b-97e2-42da-bc2d-bf4d972c9b8f",
        "title": "考试周终于结束了",
        "summary": "今天终于把最后一门也交了。",
        "has_img": 0,
        "images": null,
        "like_count": 5,
        "favorite_count": 3,
        "comment_count": 2,
        "created_at": 1775550720,
        "updated_at": 1775553000,
        "published_at": 1775550720,
        "weather": "晴",
        "mood": "轻松",
        "relevance": 1.2876821,
        "topic": {
          "id": 3,
          "name": "考试周",
          "desc": "期中期末和日常小测的情绪收纳箱"
        },
        "author": {
          "id": "4da4890b-97e2-42da-bc2d-bf4d972c9b8f",
          "username": "paper_guest",
          "sex": "保密",
          "avatar": null,
          "sign": "慢一点也没关系",
          "school": "某某大学",
          "school_code": "10001",
          "exp": 860,
          "level": {
            "exp": 860,
            "level": 4,
            "level_name": "夜航作家",
            "level_min_exp": 700,
            "next_level_exp": 1500,
            "is_max_level": false,
            "progress": 0.2
          }
        },
        "is_owner": false,
        "is_favorited": true
      }
    ],
    "total": 1,
    "pn": 1,
    "ps": 20
  }
}
```

### 8.3 获取萤火集话题列表

- **GET** `/fireflies/topic/list`

**请求参数**：无

**说明**

- 用于发布页、编辑页拿到 `topic_id -> name/desc` 映射

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "获取萤火集话题列表成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "list": [
      {
        "id": 1,
        "name": "校园日常",
        "desc": "记录普通却值得写下来的校园片段"
      }
    ]
  }
}
```

### 8.4 获取热点话题列表

- **GET** `/fireflies/topic/hot`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | number | ❌ | 返回数量，默认 10，最大 20 |
| days | number | ❌ | 统计窗口天数，默认 30，最大 365 |

**说明**

- 仅统计最近一段时间内公开已发布日记的聚合数据
- 排序优先级为 `heat_score`、评论数、收藏数、点赞数、日记数、最近发布时间

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "获取热点话题成功",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "window_days": 30,
    "list": [
      {
        "rank": 1,
        "id": 3,
        "name": "考试周",
        "desc": "期中期末和日常小测的情绪收纳箱",
        "diary_count": 18,
        "view_count": 320,
        "like_count": 64,
        "favorite_count": 22,
        "comment_count": 15,
        "heat_score": 49.8217,
        "last_published_at": 1775554800
      }
    ]
  }
}
```

### 8.5 举报萤火集日记

- **POST** `/fireflies/report`
- 需要登录

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| diary_id | string | ✅ | 被举报日记的 UUID |
| reason_type | string | ✅ | 举报类型：`spam`（垃圾内容）/ `inappropriate`（不当内容）/ `harassment`（骚扰）/ `plagiarism`（抄袭）/ `other`（其他） |
| reason_detail | string | ❌ | 举报详细说明，最多 500 字 |

**说明**

- 仅支持举报公开（`visibility='public'` 且 `status='active'`）的日记
- 不能举报自己的日记
- 对同一篇日记，同一用户不能重复提交待处理的举报（`status='pending'`），需等上次举报处理完成后才可再次举报
- 举报提交后进入待处理队列，由管理员通过 `/admin/report/review` 审批或驳回

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| report_id | string | 生成的举报 ID |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "举报提交成功，我们将尽快处理",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {
    "report_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

**返回示例 - 失败（重复举报）**

```json
{
  "code": -409,
  "message": "你已经举报过该日记，请等待处理",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {}
}
```

**返回示例 - 失败（举报自己的日记）**

```json
{
  "code": -400,
  "message": "不能举报自己的日记",
  "codename": "Hyacine",
  "timestamp": 1775555555000,
  "data": {}
}
```

