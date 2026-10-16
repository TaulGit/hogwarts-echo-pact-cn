# Stardander Revenant 网页分发：REA 静态逆向报告

调查日期：2026-10-16。目标是提取可借鉴的系统规则，供原创中文游戏设计参考；本报告不收录原作剧情台词、角色美术或游戏源码。

## 结论

- **原作是十月内的四轮课程选择，不是六周。** 固定流程有 32 个事件节点，其中 `classes1`～`classes4` 四次选课；各选两门，10、17、24、31 日结算。六周结构若用于本项目，应视为原创扩展。
- 战斗不是“一人一行动”。玩家行动窗口反复开放，直到主动结束回合或战斗结束；每次施法消耗法力。每名参战者在回合开始按最大法力约三分之一回蓝，最低 7 点，同时清空上一回合的护盾。
- 护盾最多 7 层，**一次命中只消耗一层，伤害不会穿透该层**。护盾元素与攻击元素相同时，被攻击者额外获得 `7 + floor(对应属性)` 法力。
- 结尾的友谊／恋爱选择由单独的 `romance` 状态决定。前面两处特定选择各可加 1；终章亲吻选项的门槛只是 `romance > 0`，拥抱选项始终可选。`happiness` 是另一个影响成长的个人属性，不等同于恋爱值。

以上是**该次下载的公开网页版本**的静态规则。未运行游戏、未证明所有分支在浏览器中实际到达。

## 取证对象与 REA 证据

公开页面：[Stardander Revenant](https://fancyfishgames.itch.io/stardander-revenant)；页面嵌入的网页入口：[index.html](https://html-classic.itch.zone/html/8906377/index.html)。本地原始分发在 `work/stardander-reference/`，其 `inventory.json` 记录每个文件的原始 URL、大小和 SHA-256。下载时间见该清单 `checked_at_utc = 2026-10-16T02:37:22.101092+00:00`。原始文件在制作 ZIP 前逐个重新核对大小和 SHA-256，共 162 个文件、87,695,177 字节。

将这 162 个原始文件按清单路径制成仅供取证的 `work/rea-report-original-distribution.zip`（不在交付目录）。ZIP 为 `ZIP_STORED`，SHA-256 `c03119555377091088aef0f6f79e27167f6eff6e5559753c2603e3ab208872a7`。真实 REA 6.4.0 `open_binary` 将其识别为 `zip/archive`；`inspect_artifact` 生成完整归档图，并对其子文件报告 `hash_status=verified`：

| REA 标识 | 结果 |
| --- | --- |
| 主证据 `ev_fd0859b827043ff6d0dcedfcafec731249db112d462e49a7909f36c071f2536e` | `inspect_artifact`，`authority=shipped-artifact`，`confidence=observed`，`coverage=complete-within-substeps`；无完整性矛盾 |
| 子证据 `ev_057fe9e48a8202a28b47ab1c3b877803f742fc952aa5334bd15b4934ec383642` | `inventory_artifact`，记录根归档和嵌入文件 |
| 清单 `agm_2577484552f8016c74cf7ce231700ecb61e1187c1e15f364737463255e84ba4c` | 163 个节点、163 次出现、162 条边；图 SHA-256 `c57892500e3dc80cfc6d7da5a668a87bda25fcbab136caa0eb8cc0a250e9d11f` |

下表给出本报告所依赖的主要原始文件。`occ_…` 是上述 REA 清单内的文件出现 ID。机制判断则是**在已验证文件上做的人工静态解析**，不是 REA 自动推导的游戏语义。

| 文件与原始 URL | SHA-256 | REA occurrence |
| --- | --- | --- |
| [index.html](https://html-classic.itch.zone/html/8906377/index.html) | `f6cf3f2538606f2a592554f2c96ccb2336ddc51d35ea5ead96772c1de4445d16` | `occ_ce4cbe50444ba9692740341bf0417725986c13ff40de727eff92e4814291da0a` |
| [kha.js](https://html-classic.itch.zone/html/8906377/kha.js) | `b1b4d3447a69f1f4a0ee2b8648cfcabfae3b6e6662965c75acef995a7f16a449` | `occ_7dbb77e0033c371e379e54ed6fdbd981e8f2606cf781857498efe975774b93eb` |
| [campaign.xml](https://html-classic.itch.zone/html/8906377/data/core/campaign.xml) | `12b0f536d3b230e89c9bf858149ee236cc90d48d46863fc760622c849bc69a71` | `occ_8449ce7cdd3d6833ec1c25fd2cc79b8270c6d105b4cde3ba56e99d504f8044a0` |
| [events/events.xml](https://html-classic.itch.zone/html/8906377/data/core/events/events.xml) | `c80692a7b0a24f95049ba483cb9a6b70a4ed99b9cd0253fe9c5b5ca690625df3` | `occ_b455b814f330658705166fff0b872e42b4968ea5ba42ef518994c033024e4d2f` |
| [events/classes.xml](https://html-classic.itch.zone/html/8906377/data/core/events/classes.xml) | `dca9e0d44669d908e951d11791099e74fdd5d168bf13835dc267624f0c1c349d` | `occ_b16fdb9031e1bc5e884a6ba732b640a6563c9d3ad82eb17f5cdcb2fb46878527` |
| [data.xml](https://html-classic.itch.zone/html/8906377/data/core/data.xml) | `a80873705f1335f5de8ad061749a9a95ffb345c4e7dfbbb8fdad2f463a43a376` | `occ_8a054e057e63297c39669439fd71bb2602d24ee5d8fe0d99ce9409487244f4f9` |
| [battle/battle.xml](https://html-classic.itch.zone/html/8906377/data/core/battle/battle.xml) | `589cfbc945d01fb4145ac6f248fe7bf078a2c7b4eaeadf11b1733102917f72f0` | `occ_18274b49434ebcb6e9e8ec73c7cd7cf9c26a759f3875991b1218e8a5e233ab06` |
| [battle/spells.xml](https://html-classic.itch.zone/html/8906377/data/core/battle/spells.xml) | `c3e1f9f999c095f2dbd511a952a8acb4dd5cfdafb6de8033506d3285c9e70c2c` | `occ_0c86864b771fdeea43f364348034860b2f417b660e341156be0e907b88354274` |
| [battle/buffs.xml](https://html-classic.itch.zone/html/8906377/data/core/battle/buffs.xml) | `ec9f407551a6919b9b424cd71e9472f92ef2a02b6b609fd1815d58b077eb697d` | `occ_6b999fa61d054aeccd243f683b04b51477c011310ee031a6cde4a31c6077500b` |
| [events/battles.xml](https://html-classic.itch.zone/html/8906377/data/core/events/battles.xml) | `41d8c432b2c63cc8f4bdd360f6ed783d3e59ff26f3c09c664148d960dab5d11f` | `occ_e053764f090c4fe659d66cf2ec336adbeb4c092348b1d5f6a3dd3e4bc608826f` |
| [character/characters.xml](https://html-classic.itch.zone/html/8906377/data/core/character/characters.xml) | `4a4ecb795d903f45155e711b1a0200b89b4d0bed442b36d7ea5c74f49e518f8a` | `occ_11fbb2e3ecbf9b22186427cf27accaa8eaa3c9295ca7da0a1cf36c82ed8d28bc` |

## 静态观察：课程与成长

| 观察 | 证据位置 |
| --- | --- |
| 固定事件顺序中只有四组 `classes1`～`classes4` 和对应的四个 `class_results`；四次选课日期为 6、13、20、27 日，结算日为 10、17、24、31 日。开头有倒叙，因此不应把事件数等同于游戏天数。 | `events/events.xml:3-6`；`events/classes.xml:35-112` |
| 每次选课窗口 `count=2`；结算时对两门课程分别执行 `completeClass`，随后结算每名角色的 `endWeek`。 | `events/classes.xml:3-17` |
| 有五个学科、十门可选课。四个主要属性为勇气、智慧、善良、创造力，分别对应火、水、土、风。课程完成一次提升课程等级 1，最高 4；到达级别阈值后解锁对应法术。 | `data.xml:5-15,64-86,88-144` |
| 前三次结算时还从四个属性中选一项加 1，最高 7；第四次结算的等级评分固定赋值 1。课程评分另有存储，但在已查的核心逻辑中未见其改变法术解锁。 | `events/classes.xml:24-32,103-110`；`data.xml:73-76` |
| `flying` 课声明 `happiness +3`，`empowerment` 课声明最大法力属性 `mana +10`。`student` 基类的 `endWeek` 声明将当时的 `happiness` 加到 `mana`；因此“快乐”兼具成长资源作用。Dianthus 子类还定义了自己的 `endWeek`，父子事件是否都执行未作动态核验。 | `data.xml:144`；`character/characters.xml:122-125`；`character/dianthus_def.xml:143-149` |

这表示课程选择有明确机会成本：四轮共八个课位，重修同一门推进到高阶法术，分散选课则扩大基础法术池。最后一句是由规则作出的**设计推断**，未以玩家样本验证强弱。

## 静态观察：战斗与法术

| 系统 | 已观察到的规则与证据位置 |
| --- | --- |
| 回合与法力 | `battle/battle.xml:289-295` 依次处理双方活人开回合，再重复接收玩家行动。`battle/battle.xml:108-114,143-155` 中参战者初始战斗法力为 0，最大值取角色 `mana`，每回合获得 `max(round(maxMana×0.33334), 7)`，并限制在最大法力内。`link`／`sever` 状态分别对每层回蓝修正 `+7`／`−7`，但实际回合回复仍有 7 的下限（`battle/buffs.xml:12-13`）。 |
| 护盾与伤害 | `battle/battle.xml:151,188-194`：护盾最多 7；受一次伤害时如果还有护盾，护盾减 1、生命伤害为 0，即使该次攻击伤害很大。相同元素命中护盾时，被攻击者回 `7 + floor(该元素对应属性)` 法力。开回合清掉原有护盾（`:153-155`）。没有护盾时才应用元素抗性、暴击、防御、弱化等生命伤害计算。 |
| 攻击与防护 | `strike` 每发花 10 法力，可连续购买多发；普通攻击有闪避与暴击，掌握高级技巧后可改为追踪、击退或精准。`wave` 每次花 20 法力作用全体存活敌人，脚本没有执行闪避判定。`barrier` 每层花 10 法力；起初只作用于自己，学会 `barrier_mastery` 后可选队友（`battle/spells.xml:116-266`）。 |
| 侦测与目标 | `sense` 花 10 法力，标记敌人资料为已知并清除幻术；精通后可作用全体。侦测首次成功后会根据敌人攻击元素／弱点设置部分默认施法元素（`battle/spells.xml:531-555`；`battle/battle.xml:97-105`）。`attract` 花 6 法力，把已锁定玩家的敌人本回合目标改为指定队友（`battle/spells.xml:760-786`）。 |
| 治疗与契约 | `heal` 花 10 法力／次，目标为存活友方，可一次购买多次；治疗精通可清除负面状态（`battle/spells.xml:402-434`）。`pact` 花 20 法力／次，累积独立契约进度；敌人当前生命比例越低，所需契约阈值越低；元素与敌人攻击元素一致时进度乘 2。只有带 `familiar` 的目标可结契，达阈值后移除敌人并加入使魔收藏（`battle/battle.xml:141-142`；`battle/spells.xml:611-676`）。 |
| 预见性 UI | 战斗界面显示生命、法力、契约进度和 7 点护盾；每名玩家可配置 **2 个**记忆／快捷施法槽。选目标、元素和施法次数时，界面调用法术的 `showPreview` 更新预计生命、法力、护盾或契约变化（`battle/ui.xml:1-14,101-193`；`battle/spell_ui.xml:205-255`；`character/characters.xml:3`）。这些是**静态 UI 定义**，不是浏览器视觉验收。 |

其他可供取舍的战斗模块：`intimidate` 提高目标的敌方仇恨权重；`shadows`／`camouflage` 增加闪避；`light` 施加失明；`farspeak` 对支持此事件的敌人每回合最多尝试一次。其具体使用频率和最佳策略未在静态分析中确定。

## 静态观察：关系与结局

- `romance` 并非连续养成条：第三场战斗后一个拥抱选择令其 `+1`（`events/battles.xml:296-309`），后续练习场景的牵手选择也令其 `+1`（`events/events.xml:674-703`）。终章 `hug` 可选并把该值设为 0；`kiss` 仅在进入终章选项时 `romance > 0` 才出现，两者各有不同成就（`events/events.xml:994-1022`）。
- `happiness` 是角色属性，战斗获胜、受伤、逃跑和特定剧情可增减，周末结算会转化为 `mana` 成长（`battle/battle.xml:352-363`；`character/characters.xml:124`）。**未发现**终章选择直接读取 `happiness`。
- `farspeak` 的某条成功交友路径把敌人 ID 写入角色的 `friend` 字段（`battle/spells.xml:486-492`）；这属于使魔／敌人交友路径，**不是**上述恋爱结局门槛。

## 推断、未知与工具边界

1. **推断：**原作的可迁移核心是“有限课程位→法术能力差异→战斗资源与目标判断→少量叙事关系分岔”。本项目可保留这些交互关系，但四轮课程、角色、剧情文本、场景表达均不应被当作六周原创故事的模板内容。
2. **未知：**实际浏览器中每条支线是否可达、手感与时长、低概率随机结果、所有敌人 AI 与奖励平衡。本次未运行原作，也未作动态调试。
3. **工具限制：**对完整 2,286,052 字节 `kha.js` 的 REA `analyze_javascript_application` 曾在 300 秒超时，保留的部分证据是 `ev_d5951331351c6a9365b338d7f0fadbc841e21fd9796767d66c39177b3b11f5f8`（见 `work/rea-analysis.json`）。其覆盖不完整，**不能**据此声称所有 JavaScript 逻辑都已逆向。该次归档 `inspect_artifact` 只确证文件清单与完整性；本文机制来自原始 XML/HScript 的定点静态阅读。部分 XML 脚本不适合通用 XML 解析器，结论以标注的文件行和条件为准。
4. **会话状态：**归档取证完成后已调用 REA `close_binary`；随后 `binary_session.open=false`。交付目录中只有本报告，没有复制公开游戏分发或原作文本。
