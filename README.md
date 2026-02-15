# 今日老婆 - NapCat 插件

[![Install in NapCat](https://github.com/NapNeko/napcat-plugin-index/raw/pages/button.png)](https://napneko.github.io/napcat-plugin-index?pluginId=napcat-plugin-today-wife)

一个有趣的群聊互动插件，当用户发送包含"今日老婆"关键词的消息时，随机抽取一位群成员作为今日老婆。

## 功能特性

- ✅ **关键词触发**：当群聊消息包含"今日老婆"时触发
- ✅ **公平随机**：使用 Math.random() 确保抽取公平
- ✅ **头像展示**：自动获取并展示被抽取成员的 QQ 头像
- ✅ **@发送者**：回复消息时自动 @ 消息发送者
- ✅ **每日记录**：同一用户每天只能抽取一次，重复触发会显示之前的抽取结果
- ✅ **冷却机制**：防止刷屏，默认 5 秒冷却时间
- ✅ **缓存优化**：群成员列表缓存 1 小时，减少 API 调用
- ✅ **错误处理**：完善的异常处理和友好的错误提示

## 安装方法

### 方法一：通过 NapCat WebUI 安装（推荐）

1. 打开 NapCat WebUI
2. 进入插件市场
3. 搜索"今日老婆"
4. 点击安装

### 方法二：手动安装

1. 下载最新版本的 [Release](https://github.com/L-LYZ/napcat-plugin-today-wife/releases)
2. 解压到 NapCat 的 `plugins/napcat-plugin-today-wife/` 目录
3. 重启 NapCat 或在 WebUI 中刷新插件

## 配置说明

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `enabled` | boolean | `true` | 是否启用插件 |
| `keyword` | string | `"今日老婆"` | 触发关键词 |
| `cooldown` | number | `5000` | 冷却时间（毫秒）|

## 使用示例

在群聊中发送：
```
今日老婆
```

插件会回复：
```
@发送者 今天你的老婆是 @被抽取成员
[被抽取成员的头像图片]
```

如果同一天再次发送：
```
@发送者 你今天已经抽过老婆了！你的老婆依然是 @被抽取成员
[被抽取成员的头像图片]
```

## 技术实现

### 随机算法
使用 Math.random() 从群成员中随机选择：
```javascript
const idx = Math.floor(Math.random() * filtered.length);
const selected = filtered[idx];
```

### 头像获取
使用 QQ 官方头像 API：
```
https://q1.qlogo.cn/g?b=qq&nk={user_id}&s=640
```

### 消息格式
回复消息包含三个消息段：
1. `at` - @消息发送者
2. `text` - 文本内容
3. `image` - 被抽取成员头像

### 缓存机制
- 群成员列表缓存 1 小时，减少 API 调用频率
- 每日记录存储在内存中，跨天自动重置

## 更新日志

### v1.0.0
- 🎉 首次发布
- 实现基本的今日老婆抽取功能
- 支持每日记录和头像展示
- 添加群成员缓存机制

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关链接

- [NapCat 官方文档](https://napneko.github.io/)
- [NapCat 插件商店](https://napneko.github.io/napcat-plugin-index)
- [插件模板](https://github.com/NapNeko/napcat-plugin-template)
