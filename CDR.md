# 星匣能力设计评审

日期：2026-10-16；游戏版本：1.3.0。

## 结论

**pass**。本作仅使用 `sdk.storage`，不调用 AI、兑换或运行时 OSS 上传。1.3.0 的音乐随静态目录发布，不增加 SDK 调用或云档字段。结构检查另由 `star-letter check .` 完成。

依据官方 SDK `2.4.9`、文档 `rev29` 的 [storage 发布前设计自检](https://gz-vchar-pub.nosdn.127.net/star-letter/game-sdk-docs/v2.4.9/storage.md)。本轮已重新读取带时间戳的官方 manifest，确认 `v2` 对应上述版本与修订。

| 条目 | 结果 | 代码证据与处理 |
| --- | --- | --- |
| S1 单值容量 | pass | `dist/platform.js` 的 `saveCloud` 在每次写入前测量 JSON 的 UTF-8 字节数，达到 240,000 字节即拒绝上传，低于官方 256KB 上限；可导出本机备份。 |
| S2 key 数量 | pass | 全部云档读写使用固定 key `echo-pact:save:v1`，scope 为 `user`；无动态 key 或 game scope 写入。 |
| S3 频率与请求放大 | pass | 云端写入只由玩家手动触发；有并发锁，成功写入后至少间隔 1 秒；每次保存只调用一次 `storage.set`。本机自动保存不触发平台请求。 |
| S4 scope | pass | 私有进度明确写入 `user`；不保存到所有玩家共享的 `game`。 |
| S5 并发与 CAS | pass | 同步前必须先读取云档版本；写入携带 `ifVersion`。冲突清除已知版本并要求重读，由玩家选择进度；不静默覆盖。账号变化时也清除版本。 |
| S6 错误韧性 | pass | 写操作包含 try/catch，通过 `GameSDK.isPlatformSDKError` 判断错误；登录、容量、冲突、限频及网络失败有文字提示，保留本机进度，支持导出，不阻止继续游玩。 |

`GameSDK.init()` 不写死 gameId；运行时身份由平台注入。开发模拟文件位于 `dist` 外，目录发布不会包含它。游戏使用相对资源路径，无 History 路由或自行拼接跨窗口协议。

## 验证边界

此评审核对代码设计与官方约束。单元测试、本机浏览器通关、平台结构检查、CDN 资源检查以及玩家真实云档读写分别记录，不能相互替代。真实账号下的读取、选择和同步云档，需在星匣平台预览中验收。
