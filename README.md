# SIM卡充值提醒 (SIM Recharge Reminder)

一款跨平台（iOS + Android）电话卡充值提醒APP，帮助全球异地使用电话卡的用户避免因忘记充值而丢失号码。

## 功能特性

- **多卡管理**：支持添加多张不同国家/地区的电话卡
- **智能提醒**：提前7天、3天、1天推送通知，重复提醒直到确认充值
- **紧急排序**：卡片列表按到期紧急程度自动排序
- **颜色标识**：不同紧急程度的卡片用不同颜色区分（红色=过期，橙色=即将到期）
- **国家分组**：支持按国家/地区分组显示卡片
- **快捷充值**：内置常用运营商充值链接，一键跳转充值页面
- **多语言支持**：中文/英文界面切换
- **铃声选择**：自定义提醒铃声
- **版本升级**：APP内检测新版本并一键升级
- **邮箱/手机号登录**：支持邮箱或手机号验证登录

## 技术栈

- **前端**：React Native + Expo SDK 54 + TypeScript
- **样式**：NativeWind (Tailwind CSS for React Native)
- **后端**：Express + tRPC
- **数据库**：MySQL + Drizzle ORM
- **通知**：expo-notifications 本地推送
- **路由**：Expo Router 6

## 项目结构

```
app/
  (tabs)/
    index.tsx        ← 首页卡片列表
    settings.tsx     ← 设置页面（语言、版本升级、退出）
  card/
    add.tsx          ← 添加卡片
    [id].tsx         ← 卡片详情
    edit/[id].tsx    ← 编辑卡片
  login.tsx          ← 登录页面
constants/
  countries.ts       ← 国家/地区数据
  ringtones.ts       ← 铃声列表
  recharge-links.ts  ← 运营商充值链接
  version.ts         ← 版本信息和更新检测
lib/
  i18n.ts            ← 多语言翻译
  language-provider.tsx ← 语言Context
  notifications.ts   ← 通知管理
server/
  routers.ts         ← API路由
  db.ts              ← 数据库操作
drizzle/
  schema.ts          ← 数据库表结构
```

## 安装与运行

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 仅启动Metro（前端）
pnpm dev:metro

# 仅启动API服务器
pnpm dev:server
```

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.2.0 | 2026-06-11 | 新增邮箱/手机号登录界面；新增APP内版本检测和一键升级功能；更新GitHub README版本记录同步 |
| v1.1.0 | 2026-06-10 | 新增多语言支持（中文/英文切换）；新增快捷充值链接功能（内置12国运营商）；新增按国家/地区分组显示卡片；新增卡片紧急程度颜色标识（红/橙/绿）；新增编辑卡片功能；新增卡片列表按到期紧急程度排序 |
| v1.0.0 | 2026-06-08 | 初始版本发布：多卡管理、提前7/3/1天提醒、重复提醒直到确认充值、倒计时显示、铃声选择、一键登录 |

## 部署

- **Android**：通过Manus平台Publish按钮生成APK
- **iOS**：需要Apple Developer账号，通过EAS Build构建

## 许可证

MIT License
