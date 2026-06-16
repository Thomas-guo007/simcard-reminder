# SIM卡充值提醒 (SIM Recharge Reminder)

一款用于管理全球异地电话卡充值时间的 Android/iOS 应用，目标是提醒用户及时充值，避免号码因为忘记充值而被停机或回收。

## 当前版本

- 最新版本：v1.2.5
- Android 安装包：[下载 APK](https://github.com/Thomas-guo007/simcard-reminder/raw/main/releases/android/simcard-reminder-android-release-v1.2.5.apk)
- 更新清单：[version.json](./version.json)

## 主要功能

- **邮箱验证码登录**：使用邮箱进入应用，当前验证码为本地生成，不再跳转外部网页登录。
- **多卡管理**：支持添加、编辑、删除多张电话卡。
- **到期提醒**：按充值周期计算到期日，并支持提前 7 天、3 天、1 天提醒。
- **紧急排序**：根据到期时间自动排序，过期和即将到期号码优先显示。
- **国家/地区管理**：支持按国家/地区记录和查看电话卡。
- **快捷充值链接**：可为每张卡保存运营商充值网址。
- **中英文界面**：支持中文和英文切换。
- **应用内检查更新**：设置页点击“检查更新”后读取 GitHub 版本清单；发现新版时可直接打开新版 APK 下载入口。

## Android 安装说明

1. 在安卓手机浏览器中打开 APK 下载链接。
2. 下载完成后点击安装包。
3. 如果系统提示“未知来源应用”，允许浏览器安装本 APK。
4. 安装完成后打开“SIM卡充值提醒”。

说明：Android 系统不允许普通 APK 静默自动安装。应用内“检查更新”可以自动打开新版下载入口，但最终安装仍需要用户在系统安装界面确认。

## 技术栈

- React Native + Expo SDK 54
- Expo Router 6
- TypeScript
- NativeWind
- AsyncStorage 本地数据存储
- expo-notifications 本地提醒

## 项目结构

```text
app/
  (tabs)/
    index.tsx        首页卡片列表
    settings.tsx     设置、语言、检查更新、退出登录
  card/
    add.tsx          添加卡片
    [id].tsx         卡片详情
    edit/[id].tsx    编辑卡片
  login.tsx          邮箱验证码登录
constants/
  countries.ts       国家/地区数据
  recharge-links.ts  运营商充值链接
  ringtones.ts       铃声列表
  version.ts         版本信息和更新检测
lib/
  local-sim-cards.ts 本地电话卡数据
  i18n.ts            多语言文本
  notifications.ts   本地通知
version.json         GitHub 更新清单
```

## 本地开发

```bash
pnpm install
pnpm check
pnpm dev:metro
```

Android Release APK 构建需要 Android SDK、JDK 17 和 Gradle 环境。当前项目已保留 GitHub Actions 工作流，可在推送后自动构建 APK 产物。

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.2.5 | 2026-06-16 | 检查更新改为读取 GitHub version.json；发现新版后直接打开 APK 下载入口；同步 README、版本号和安卓安装包信息 |
| v1.2.4 | 2026-06-16 | 移除外部网页登录跳转；改为邮箱验证码登录；SIM 卡数据改为本地存储；修复安卓启动和无效 URL 问题 |
| v1.2.0 | 2026-06-11 | 新增登录界面、设置页版本检测入口和 README 版本记录 |
| v1.1.0 | 2026-06-10 | 新增中英文切换、快捷充值链接、国家/地区分组、紧急程度颜色和编辑卡片 |
| v1.0.0 | 2026-06-08 | 初始版本：多卡管理、充值提醒、倒计时显示、铃声选择 |

## 许可证

MIT License
