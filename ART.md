# 原创美术生成记录

使用内置 `image_gen.imagegen` 工具生成。原作仅用于观察“手绘校园背景＋独立人物立绘＋战斗切图”的呈现方式；本项目的图像全部重新生成，文件未复用原作。

## 统一生成规范

用途为中文霍格沃茨同人视觉小说与回合制魔法游戏。背景使用细致的手绘奇幻插画、哥特校园建筑、旧石墙、秋夜与烛光；人物使用清晰的日系游戏线稿与柔和着色。主色为午夜蓝、古铜金、学院蓝与绿银。保持原创脸型、服装细节和构图，不使用电影演员形象或官方标志。禁止文字、水印、界面与按钮。背景为横版 1536×1024，人物立绘为 1024×1536 RGBA，异象切图为方形 RGBA；透明切图保留真实 alpha。

## 各资产的生成方向

| 文件 | 主体、构图和约束 |
| --- | --- |
| `courtyard.png` | 霍格沃茨万圣夜庭院与远处高塔，悬浮烛火、秋叶、星空；城堡在画面中心及右侧，左侧暗区留给标题。 |
| `corridor.png` | 月光下的霍格沃茨肖像长廊，拱券、会说话的画框、石砖、烛台；无人，给前景人物留空间。 |
| `classroom.png` | 魔咒教室，木桌、课本、魔法器具、旧石墙、高窗与暖色烛火；无人。 |
| `greenhouse.png` | 学院温室，玻璃拱顶、奇幻植物与发光药草、精细的栽培台；无人。 |
| `forest.png` | 月光禁林及废弃天文台，石阶、雾、古树、远处圆顶；留出战斗主体区域。 |
| `player.png` | 洛岚，18 岁七年级拉文克劳原创女学生，短黑发、蓝铜色校袍、手持魔杖；膝上构图、全身姿态自然、透明底。 |
| `companion.png` | 艾琳·维尔，18 岁七年级斯莱特林原创女学生，灰金色低辫、绿银校袍、冷静持书；膝上构图、透明底。 |
| `shade.png` | 从破碎画框中化出的墨影鸟，黑紫羽翼、金色画框碎片、墨雾；完整轮廓、透明底。 |
| `armour.png` | 受到咒语驱动的空心守夜铠甲，古银、黄铜雕纹与幽蓝内部光；完整轮廓、透明底。 |
| `wisp.png` | 蓝金月光精灵，柔和星光、飞蛾形态与流动光带，友善又神秘；完整轮廓、透明底。 |
| `warden.png` | 钟楼守忆人，破碎黄铜钟、指针与蓝金星光组成空心人形，羊皮纸飘带与天体纹样；非血腥恐怖，完整轮廓、透明底。 |

以上是统一生成任务的资产规范。守忆人的最终调用提示词如下：

> Use case: illustration-story. Asset type: transparent 2D game enemy cutout for an original Chinese Hogwarts fan visual novel / turn based spell game. Generate a full body clocktower memory guardian named the Bell Keeper: an elegant hollow figure assembled from ancient weathered brass clock hands, broken bell fragments and floating blue-gold starlight, cloaked in parchment-like ribbons with faint celestial diagrams. Hogwarts gothic school atmosphere, refined hand-painted fantasy illustration with crisp anime game linework, aged gold and midnight teal colors, gentle uncanny melancholy rather than horror. Strong readable silhouette for a small game battle portrait. Entire figure fully inside frame with generous empty margin, three-quarter view facing slightly left, on genuinely transparent background. Square composition 1024x1024. No text, no watermark, no film actor likeness, no franchise logos, no scenery, no ground plane. This must be an original character design, not a copy of Stardander characters.


## 1.2 剧情插画与轻量动效

本轮使用内置 ImageGen 新生成 11 张 1536×1024 横版插画，总素材为 22 张。现有角色与场景作为人物身份、美术方向参考，画面按具体剧情重新构图。所有新插画均逐张查看；《天亮以后》的画中人已修正为剧情里的老妇人。完整提示词及这一处局部修正提示词保存在 `art-prompts.json`，文件尺寸与 SHA-256 见 `asset-manifest.json`。

| 文件 | 剧情事件 |
| --- | --- |
| `story-ink.png` | 画像漏墨、墨钟与旧纸 |
| `story-ledger.png` | 消失的名册空行与守门铁甲 |
| `story-leaves.png` | 银叶中的海边与城堡 |
| `story-letter.png` | 抢修信与破裂铜环草图 |
| `story-mirror.png` | 水镜中的擦痕与重画 |
| `story-ring.png` | 裂开的回返环与最后一拍 |
| `story-finale.png` | 齿轮组成守钟咒，两人联手应对 |
| `ending-together.png` | 修好的钟与画像重新开口 |
| `ending-archive.png` | 星图柜归档旧记忆 |
| `ending-dawn.png` | 释放旧声，老妇人重画海面 |
| `ending-silence.png` | 钟室暂封，保留空白页 |

### 在游戏中的使用

- `story-visuals.js` 按周次、剧情阶段和对白行号触发，不依赖文字关键词，读档拷贝后仍可匹配。前期说明不会透露尚未发现的约定。
- 关键事件切换为完整剧情画面，附一条简短说明；点击“查看画面”放大。手机使用完整3:2图面，避免裁掉关键线索。
- 每周总结、调查手记和已解锁结局收藏均可看图；未解锁结局不显示插画。
- 墨滴、齿轮、银叶、纸页微光、水面涟漪、缺拍钟环和钟波由轻量 CSS 图层表现；慢镜头与粒子只作辅助，不替代线索说明。
- 战斗飞光、扩散光环、伤害与护盾浮字从真实战斗数值差生成。
- 设置中的“场景与战斗动效”可开关。首次沿用系统减少动态偏好，手动选择优先；关闭后保留画面、线索和数值文字。
