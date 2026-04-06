# 半页纸 API 接口文档（当前代码版）

---

## 全局约定

- Base URL：`https://api.halfpaper.top`
- 请求方法：`GET` / `POST`
- 认证方式：Cookie（字段名：`SESSTOKEN`）
- Content-Type：`application/json`
- 返回结构统一为：`code`、`message`、`codename`、`timestamp`、`data`

### 统一响应格式

```json
// 成功
{ "code": 0, "message": "OK", "codename": "Hyacine", "timestamp": 1774433771449, "data": {} }

// 失败
{ "code": -400, "message": "参数错误", "codename": "Hyacine", "timestamp": 1774433771449, "data": {} }
```

### 常见错误码

| code | 含义 |
|------|------|
| 0 | 成功 |
| -400 | 参数错误 |
| -401 | 未登录 / 用户名或密码错误 |
| -403 | 无权限 / token 无效 |
| -404 | 资源不存在 |
| -409 | 冲突 |
| -415 | 人机验证码错误 |
| -416 | 邮箱验证码错误 |
| -429 | 请求过于频繁 |
| -500 | 服务器内部错误 |

---

## 一、认证模块 `/auth`

### 1.1 发送邮箱验证码

- **GET** `/auth/emailvarify`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | ✅ | 邮箱地址 |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "验证码发送成功，请注意查收",
  "codename": "Hyacine",
  "timestamp": 1774433771449,
  "data": {}
}
```

**返回示例 - 失败**

```json
{ "code": -400, "message": "邮箱格式不正确", "data": {} }
{ "code": -409, "message": "该邮箱已被注册", "data": {} }
{ "code": -429, "message": "验证码发送过于频繁，请1分钟后再试", "data": {} }
```

---

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
  "timestamp": 1774433771449,
  "data": {
    "username": "test_user",
    "email": "test@example.com",
    "avatar": null
  }
}
```

---

### 1.3 登录

- **POST** `/auth/login`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | ✅ | 登录邮箱 |
| password | string | ✅ | 密码字符串，长度 32-128 |
| token | string | ✅ | hCaptcha token |

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| username | string | 用户名 |
| email | string | 邮箱 |
| avatar | string\|null | 头像 |
| sex | string | 性别 |
| diary_count | number | 日记数 |
| friend_count | number | 好友数 |
| follow_count | number | 关注数 |
| fans_count | number | 粉丝数 |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "登录成功",
  "codename": "Hyacine",
  "timestamp": 1774433771449,
  "data": {
    "username": "test_user",
    "email": "test@example.com",
    "avatar": null,
    "sex": "未知",
    "diary_count": 0,
    "friend_count": 0,
    "follow_count": 0,
    "fans_count": 0
  }
}
```

---

## 二、用户模块 `/user`

### 2.1 获取当前用户信息

- **GET** `/user/info`
- 需要登录

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
| diary_count | number | 日记数量 |
| friend_count | number | 好友数量 |
| follow_count | number | 关注数量 |
| fans_count | number | 粉丝数量 |
| created_at | string | 注册时间 |

---

## 三、日记模块 `/diary`

以下日记接口在当前代码中均需要登录。

### 3.1 创建日记或草稿

- **POST** `/diary/create`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | ✅ | `draft` 或 `publish` |
| draft_id | string | ❌ | 草稿 UUID，存在时表示草稿转发布 |
| title | string | ❌ | 标题，最长 255 字 |
| content | string | ❌ | 正文，最长 5000 字 |
| visibility | string | ❌ | `private` / `fans` / `friends` / `public` |
| weather | string | ❌ | 天气 |
| mood | string | ❌ | 心情 |
| topic_id | number | ❌ | 话题 ID |
| images | array | ❌ | 图片数组 |

**images 元素结构**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| filename | string | ✅ | 文件名 |
| width | number | ✅ | 图片宽度 |
| height | number | ✅ | 图片高度 |
| size | number | ✅ | 图片大小 |

**说明**

- `type=publish` 时，`title` 和 `content` 至少填写一项。
- `type=draft` 时，当前代码最多允许 20 条草稿。
- 发布成功后会累加 `users.diary_count`。

**成功返回字段**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 日记或草稿 ID |
| title | string\|null | 标题 |
| content | string\|null | 内容 |
| has_img | number | 是否有图 |
| images | array\|null | 图片列表 |
| visibility | string | 可见性 |
| weather | string\|null | 天气 |
| mood | string\|null | 心情 |
| topic_id | number\|null | 话题 ID |
| created_at | string | 创建时间 |
| updated_at | string\|null | 更新时间 |
| comment_count | number | 评论数，仅正式日记返回 |
| like_count | number | 点赞数，仅正式日记返回 |
| published_at | string\|null | 发布时间，仅正式日记返回 |

---

### 3.2 修改日记或草稿

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

**说明**

- 正式日记至少保留标题或内容中的一项。
- 如果正式日记首次改为 `public`，会自动写入 `published_at`。

---

### 3.3 删除日记

- **POST** `/diary/delete`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| diary_id | string | ✅ | 日记 UUID |

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| data | null | 无返回数据 |

---

### 3.4 获取日记详情

- **GET** `/diary/detail`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| uuid | string | 二选一 | 日记 UUID |
| diary_id | string | 二选一 | 日记 UUID |

**说明**

- 当前代码要求 `uuid` 或 `diary_id` 至少传一个。
- 当前实现只允许查询当前登录用户自己的日记详情。
- 时间字段返回为 Unix 时间戳。

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
| comment_count | number | 评论数 |
| created_at | number\|null | 创建时间戳 |
| updated_at | number\|null | 更新时间戳 |
| published_at | number\|null | 发布时间戳 |
| weather | string\|null | 天气 |
| mood | string\|null | 心情 |
| topic_id | number\|null | 话题 ID |
| heat_score | number | 热度 |
| status | string | 状态 |
| is_owner | boolean | 是否本人 |
| author | object | 作者信息 |
| topic | object\|null | 话题信息 |

---

### 3.5 获取日记列表

- **GET** `/diary/list`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pn | number | ❌ | 页码，默认 1 |
| ps | number | ❌ | 每页数量，默认 20，最大 50 |
| visibility | string | ❌ | `private` / `fans` / `friends` / `public` |
| status | string | ❌ | `draft` / `active` / `deleted`，默认 `active` |

**说明**

- 当前代码返回字段名为 `lists`，不是 `list`。
- 当前代码在 SQL 层只截取正文前 100 个字符作为 `summary`。
- 当前代码使用 `LIMIT offset, size` 拼接 SQL。
- `status` 校验值包含 `deleted`，但数据库枚举值是 `delete`，这会导致传入 `deleted` 时查不到数据。

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
| comment_count | number | 评论数 |
| created_at | number\|null | 创建时间戳 |
| updated_at | number\|null | 更新时间戳 |
| published_at | number\|null | 发布时间戳 |

**返回示例 - 成功**

```json
{
  "code": 0,
  "message": "获取日记列表成功",
  "codename": "Hyacine",
  "timestamp": 1774433771449,
  "data": {
    "lists": [
      {
        "id": "6f1d1d78-5e31-4b5d-8fd4-6ebf02222222",
        "title": "今天过得不错",
        "summary": "这里只返回正文前100个字符",
        "has_img": 1,
        "images": [],
        "visibility": "public",
        "like_count": 0,
        "comment_count": 0,
        "created_at": 1774433771,
        "updated_at": null,
        "published_at": 1774433771
      }
    ],
    "total": 1,
    "pn": 1,
    "ps": 20
  }
}
```

---

## 四、评论模块 `/comment`

### 4.1 获取评论列表

- **GET** `/comment/list`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| diary_id | string | ✅ | 日记 UUID |
| page | number | ❌ | 页码，默认 1 |
| page_size | number | ❌ | 每页数量，默认 20，最大 100 |

**说明**

- 该接口当前未在路由层加登录校验。
- 如果目标日记是 `private`，则只有作者自己可查看。
- 返回值仅分页顶级评论，回复挂在 `replies` 字段中。

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| list | array | 顶级评论列表 |
| total | number | 顶级评论总数 |
| page | number | 当前页 |
| page_size | number | 每页数量 |

---

### 4.2 创建评论

- **POST** `/comment/create`
- 需要登录

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| diary_id | string | ✅ | 日记 UUID |
| content | string | ✅ | 评论内容，最长 500 字 |
| parent_id | string | ❌ | 父评论 ID |

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 评论 ID |
| content | string | 评论内容 |
| diary_id | string | 所属日记 ID |
| parent_id | string\|null | 父评论 ID |
| author | object | 作者信息 |
| created_at | string | 创建时间 |

---

### 4.3 修改评论

- **POST** `/comment/update`
- 需要登录

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| comment_id | string | ✅ | 评论 ID |
| content | string | ✅ | 新内容，最长 500 字 |

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 评论 ID |
| content | string | 修改后内容 |
| updated_at | string | 更新时间 |

---

### 4.4 删除评论

- **POST** `/comment/delete`
- 需要登录

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| comment_id | string | ✅ | 评论 ID |

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| data | null | 无返回数据 |

---

## 五、图片模块 `/image`

### 5.1 获取上传预签名

- **POST** `/image/presign`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | ✅ | `diary` 或 `avatar` |
| mime_type | string | ✅ | `image/jpg` / `image/png` / `image/jpeg` / `image/gif` / `image/heic` / `image/heif` |
| size | number | ✅ | 文件字节大小，1 到 10MB |

**说明**

- 当前路由层未强制登录。
- 当前实现中如果 `req.user` 为空，会回退到一个写死的用户 UUID。

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| host | string | 上传域名 |
| policy | string | Base64 编码策略 |
| x_oss_signature_version | string | 签名版本 |
| x_oss_credential | string | 凭证 |
| x_oss_date | string | 时间戳 |
| signature | object | OSS 签名结果 |
| key | string | OSS 对象 key |
| filename | string | 文件名 |
| callback | string | 回调配置 |
| callback_var | string | 回调变量 |

---

### 5.2 图片上传回调

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

**返回参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 图片 UUID |
| filename | string | 文件名 |
| size | number | 文件大小 |
| width | number | 图片宽度 |
| height | number | 图片高度 |

---

## 六、说明

- 本文档按当前代码已挂载路由整理。
- AI 测试接口未纳入正式接口文档。
- 该文档没有覆盖未挂载的旧接口文件。
- 文档中的“说明”部分包含了若干当前代码实现细节，便于联调时避免踩坑。