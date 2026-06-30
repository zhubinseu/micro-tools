# SBTI 工作风格测评 · 设计方案

> **目标**: 在 Micro-Tools 中新增一个与 MBTI 并列的趣味测评工具——SBTI 工作风格测评
> **定位**: 仿 MBTI 的四维度二元选择测评，但维度框架与 MBTI 完全错位，侧重「做事的方式」而非「性格本质」
> **集成方式**: 100% 复用现有工具注册表 + 动态加载 + SEO + 命令面板体系，零架构改动

---

## 0. 为什么不是「另一个 MBTI」

Micro-Tools 已有 MBTI（能量来源 / 信息接收 / 决策方式 / 生活方式），它回答的是「你是什么样的人」。SBTI 刻意错位，回答 **「你做事的方式是什么样的」**——面向职场、创业、协作与自我认知场景。两者互补：MBTI 描述性格底色，SBTI 描述工作行为偏好。

| 维度 | MBTI | SBTI |
|------|------|------|
| 测评对象 | 心理性格类型 | 工作与创造风格 |
| 四维度 | EI / SN / TF / JP | SR / BF / TP / IC（见下文） |
| 结果含义 | 你如何感知与决策 | 你如何被驱动、加工信息、处理关系、推进事情 |
| 适用场景 | 自我认知 / 社交分享 | 职场定位 / 团队搭配 / 创业合伙 / 求职方向 |
| 题目语境 | 日常生活情境 | 工作 / 项目 / 协作情境 |

**SBTI 四个字母本身就是一种鲜明类型**——类似 ESTJ 是 MBTI 的一种结果。SBTI = 探索 + 广角 + 任务 + 发起，代表「破局先锋」型；其完全对立面 RFCP = 安定 + 聚焦 + 人群 + 校准，代表「匠心守护」型。

---

## 1. SBTI 四维度模型

每个维度有两个对立极点，受测者在每道题的二选一中为自己的某一极 +1，累计后较高者为主导极。四个主导极拼接成 4 字母结果代码（共 2⁴ = 16 种）。

### 维度 1 — 动机来源 (Source of Drive)

你被什么驱动？是新鲜感还是秩序感？

| 极点 | 字母 | 名称 | 含义 |
|------|------|------|------|
| 探索型 | **S** | Stimulus | 被新鲜、变化、未知、挑战驱动；对重复与例行易厌倦；喜欢「从 0 到 1」 |
| 安定型 | **R** | Routine | 被秩序、可预测、掌控感驱动；偏好深耕熟悉领域；喜欢「从 1 到 100」 |

### 维度 2 — 认知模式 (Breadth of Cognition)

你如何获取与加工信息？是广度优先还是深度优先？

| 极点 | 字母 | 名称 | 含义 |
|------|------|------|------|
| 广角型 | **B** | Broad | 偏好跨领域扫描、连接异质信息；通才倾向；相信「交叉点有创新」 |
| 聚焦型 | **F** | Focused | 偏好单点深钻、追求专业纵深；专才倾向；相信「一寸宽一英里深」 |

### 维度 3 — 关系导向 (Target of Relation)

你处理事情时，重心落在「事」还是「人」？

| 极点 | 字母 | 名称 | 含义 |
|------|------|------|------|
| 任务型 | **T** | Task | 以目标 / 结果 / 效率为中心；关系服务于事情；「对事不对人」 |
| 人群型 | **P** | People | 以情感 / 关系 / 共识为中心；效率服务于人；「人对了事就对了」 |

### 维度 4 — 行动风格 (Iteration Mode)

你如何推进事情？是力求一次成型还是反复打磨？

| 极点 | 字母 | 名称 | 含义 |
|------|------|------|------|
| 发起型 | **I** | Initiate | 一次成型、追求闭环、做完即交付；「先完成再完美」 |
| 校准型 | **C** | Calibrate | 反复迭代、追求完善、做中持续优化；「完成度永远 90%」 |

---

## 2. 16 种类型 + 四大风格群

按「动机来源(S/R)」×「关系导向(T/P)」交叉，得到 4 个风格群，每群 4 种类型。这种分群方式与 MBTI 的 NT/NF/SJ/SP 气质群类似，但维度组合不同。

### 风格群定义

| 风格群 | 代号 | 组合 | 一句话定位 |
|--------|------|------|-----------|
| 开拓者 | Pioneers | S + T | 探索新领域 + 以结果说话——攻城略地的先头部队 |
| 感召者 | Catalysts | S + P | 探索新可能 + 凝聚人心——点燃变革的火种 |
| 建设者 | Builders | R + T | 安定秩序 + 以结果说话——把蓝图落地的工程力量 |
| 守护者 | Guardians | R + P | 安定秩序 + 凝聚人心——让团队长治久安的压舱石 |

### 16 种类型全表

| 代码 | 昵称 | 英文别名 | 风格群 | 标语 |
|------|------|---------|--------|------|
| **SBTI** | 破局先锋 | The Trailblazer | 开拓者 | 永远在寻找下一个突破口，动手比讨论更重要 |
| **SBTC** | 锋芒工匠 | The Edge Crafter | 开拓者 | 用广博视野打磨锋利之作，既敢想也敢磨 |
| **SBPI** | 造势推手 | The Momentum Maker | 感召者 | 把新点子变成众人的方向，边走边喊集结号 |
| **SBPC** | 共鸣策展 | The Resonance Curator | 感召者 | 在跨界中唤起共鸣，让对的人在对的时刻聚拢 |
| **SFTI** | 突击尖兵 | The Strike Force | 开拓者 | 单点突破一击致命，认准了就立刻动手 |
| **SFTC** | 深潜匠人 | The Deep Diver | 开拓者 | 在未知的深处反复打捞，直到捞出真东西 |
| **SFPI** | 燎原火种 | The Wildfire Spark | 感召者 | 用一个深刻的信念点燃一群人，说干就干 |
| **SFPC** | 知心向导 | The Soul Guide | 感召者 | 以专业与温度陪人走过迷茫，边陪边调 |
| **RBTI** | 开疆经理 | The Frontier Manager | 建设者 | 用秩序开荒，把新地盘迅速变成可运营的版图 |
| **RBTC** | 织网总管 | The Network Steward | 建设者 | 用广角视野编织可依赖的体系，越织越稳 |
| **RBPI** | 暖场主持 | The Warm Host | 守护者 | 让秩序有了温度，把人稳稳聚在一件好事上 |
| **RBPC** | 和事总编 | The Harmony Editor | 守护者 | 在多方诉求间反复打磨共识，让结果大家都买账 |
| **RFTI** | 定海基石 | The Anchor Stone | 建设者 | 关键时刻一个稳字，认准方向立刻夯实 |
| **RFTC** | 精密齿轮 | The Precision Gear | 建设者 | 在专精领域追求极致精度，每一次校准都为了更可靠 |
| **RFPI** | 守巢知心 | The Nest Keeper | 守护者 | 用专业守护身边人，把安全感变成行动力 |
| **RFPC** | 匠心守护 | The Devoted Guardian | 守护者 | 以耐心与温度长期打磨一份值得托付的承诺 |

---

## 3. 结果文案示例（3 个完整类型）

完整实现需补全全部 16 种。以下为 3 个代表性类型的完整文案，演示 `PersonalityType` 结构。

### SBTI · 破局先锋（开拓者群代表）

```ts
{
  code: 'SBTI',
  nickname: '破局先锋',
  alias: 'The Trailblazer',
  group: 'pioneers',
  tagline: '永远在寻找下一个突破口，动手比讨论更重要',
  strengths: '极强的从 0 到 1 能力，能在模糊地带迅速判断方向并启动行动；视野开阔、反应敏捷，擅长把不同领域的线索拼成新机会；交付意识强，不纠结于完美主义。',
  weaknesses: '容易三分钟热度、虎头蛇尾，对收尾与维护缺乏耐心；可能因行动过快而忽视他人感受与团队节奏；对重复性、流程性工作感到窒息。',
  careers: '适合早期创业、新产品立项、破局型业务负责人、风险投资、战投、技术布道者等需要快速突破与广角判断的岗位。',
  description: '你是「破局先锋」——团队里那个永远在问「为什么不能换个打法」的人。你不怕混沌，甚至有点享受它，因为混沌里才藏着真正的机会。你不是规划师，你是点火者：看到缺口就扑上去，把第一刀捅出来，剩下的交给别人补。你的价值在于「让事情开始发生」。',
}
```

### RFTC · 精密齿轮（建设者群代表）

```ts
{
  code: 'RFTC',
  nickname: '精密齿轮',
  alias: 'The Precision Gear',
  group: 'builders',
  tagline: '在专精领域追求极致精度，每一次校准都为了更可靠',
  strengths: '在专业领域的纵深无人能及，对细节与可靠性的执着是团队信任的根基；做事有章法、可预期，能在长期重复中持续精进；交付物经得起放大镜检验。',
  weaknesses: '可能因过度打磨而错过时机，对「差不多就行」的事缺乏耐心；跨领域协作时易显得封闭，对变化与冒险偏保守；不擅长从 0 到 1 的破局。',
  careers: '适合核心研发、精密工程、审计与合规、质量体系、外科手术、基础设施运维等需要深度专精与长期可靠性的岗位。',
  description: '你是「精密齿轮」——整台机器里公差最小的那一个。你不追求聚光灯，但所有人都知道：交给你负责的部分，绝不会是出问题的那环。你信奉的不是灵感，而是日复一日的校准。你的可靠，本身就是一种稀缺的创造力。',
}
```

### SFPC · 知心向导（感召者群代表）

```ts
{
  code: 'SFPC',
  nickname: '知心向导',
  alias: 'The Soul Guide',
  group: 'catalysts',
  tagline: '以专业与温度陪人走过迷茫，边陪边调',
  strengths: '兼具专业深度与人际温度，能在探索未知的同时照顾每个人的状态；擅长一对一深度影响，是迷茫者的灯塔；愿意反复调整方式直到对方真正接住。',
  weaknesses: '容易把他人成长当作自己的责任而过度消耗；对效率与结果有时让位于关系，在高压攻坚中显得不够果断；探索欲与陪伴需求之间常内在拉扯。',
  careers: '适合资深教练、心理咨询、导师型技术领袖、用户体验研究、组织发展、高端顾问等需要深度专业 + 深度共情的领域。',
  description: '你是「知心向导」——那种别人愿意把真心话托付给你的人。你不只解决问题，你解决「带着问题的人」。你的探索不是向外征服，而是向内照亮。你相信真正的改变发生在被理解的那一刻，而你愿意为那一刻反复打磨自己的方式。',
}
```

---

## 4. 题库设计

### 设计原则（沿用 MBTI 的成熟做法）

1. **二元选择**：每题 A/B 二选一，每个选项绑定一个极点，选中即该极 +1
2. **维度交错**：题目按 SR → BF → TP → IC 循环排列，避免连续同维度疲劳
3. **极点方向随机化**：A/B 的极点方向打乱，避免「全选 A」得到单一类型的偏差
4. **双模式**：极速版 20 题（每维度 5 题），精准版 60 题（每维度 15 题，前 5 题复用极速版）
5. **语境聚焦工作/协作**：与 MBTI 的生活化语境区分，强化「工作风格」定位

### 示例题目（每维度 2 题，共 8 题）

```ts
// === SR 维度（动机来源）===
{
  id: 'e-sr-1',
  dimension: 'SR',
  text: '面对一个全新领域的机会，你的第一反应更接近？',
  optionA: { text: '兴奋，立刻想搞清楚它能怎么玩', pole: 'S' },
  optionB: { text: '谨慎，先看它和我们现有的事有没有协同', pole: 'R' },
},
{
  id: 'e-sr-2',
  dimension: 'SR',
  text: '一个项目做到第 6 个月，你更可能？',
  optionA: { text: '开始心痒，想找下一个更有想象力的方向', pole: 'S' },
  optionB: { text: '正进入状态，想把这套东西做得更深更稳', pole: 'R' },
},

// === BF 维度（认知模式）===
{
  id: 'e-bf-1',
  dimension: 'BF',
  text: '准备进入一个新行业，你更倾向于？',
  optionA: { text: '先广扫十几个玩家，建立全景地图', pole: 'B' },
  optionB: { text: '先挑一两家标杆深挖，吃透再扩展', pole: 'F' },
},
{
  id: 'e-bf-2',
  dimension: 'BF',
  text: '团队讨论时，你更常扮演？',
  optionA: { text: '把不同人的观点连起来、指出新组合的人', pole: 'B' },
  optionB: { text: '把某个点追问到底、验证可行性的人', pole: 'F' },
},

// === TP 维度（关系导向）===
{
  id: 'e-tp-1',
  dimension: 'TP',
  text: '一个关键决策上团队出现分歧，你更倾向于？',
  optionA: { text: '先把事实和目标摆清楚，对错比面子重要', pole: 'T' },
  optionB: { text: '先让大家把情绪和顾虑说出来，共识比快重要', pole: 'P' },
},
{
  id: 'e-tp-2',
  dimension: 'TP',
  text: '评价一个同事「靠谱」，你更看重？',
  optionA: { text: '他能不能按时交付、结果过硬', pole: 'T' },
  optionB: { text: '他能不能让协作的人感到安心', pole: 'P' },
},

// === IC 维度（行动风格）===
{
  id: 'e-ic-1',
  dimension: 'IC',
  text: '一个方案你觉得「八成可以」时，你会？',
  optionA: { text: '先上线，边跑边修，市场会告诉我答案', pole: 'I' },
  optionB: { text: '再打磨几轮，把剩下两成补上再出手', pole: 'C' },
},
{
  id: 'e-ic-2',
  dimension: 'IC',
  text: '你的工作成果接近完成时，你更常？',
  optionA: { text: '迅速收口交付，进入下一件事', pole: 'I' },
  optionB: { text: '总觉得还能更好，迟迟不愿定稿', pole: 'C' },
},
```

### 题目数量规划

| 模式 | 总题数 | 每维度 | 预计时长 | 说明 |
|------|--------|--------|---------|------|
| 极速版 express | 20 | 5 | ~2 分钟 | 每维度 5 题，循环排列 |
| 精准版 precision | 60 | 15 | ~6 分钟 | 前 5 题复用极速版，后 10 题为深度工作行为题 |

---

## 5. 数据层设计：`lib/sbti-data.ts`

完全对照 `lib/mbti-data.ts` 的结构，保持评分引擎与类型系统一致，便于未来抽取通用测评引擎。

### 5.1 类型定义

```ts
/** SBTI 四维度 */
export type SbtiDimension = 'SR' | 'BF' | 'TP' | 'IC';

/** 八个极点 */
export type SbtiPole = 'S' | 'R' | 'B' | 'F' | 'T' | 'P' | 'I' | 'C';

/** 测试模式（与 MBTI 一致） */
export type SbtiTestMode = 'express' | 'precision';

/** 单道题目 —— 结构与 MBTI Question 完全一致，仅泛型参数不同 */
export interface SbtiQuestion {
  id: string;
  dimension: SbtiDimension;
  text: string;
  optionA: { text: string; pole: SbtiPole };
  optionB: { text: string; pole: SbtiPole };
}

/** 维度得分 —— 与 MBTI DimensionScore 同构 */
export interface SbtiDimensionScore {
  dimension: SbtiDimension;
  poles: [SbtiPole, SbtiPole];
  first: number;
  second: number;
  dominant: SbtiPole;
  dominantPercent: number;
}

/** 四大风格群 */
export type SbtiGroup = 'pioneers' | 'catalysts' | 'builders' | 'guardians';

/** 结果类型文案 —— 字段与 MBTI PersonalityType 同构 */
export interface SbtiType {
  code: string;
  nickname: string;
  alias: string;
  group: SbtiGroup;
  tagline: string;
  strengths: string;
  weaknesses: string;
  careers: string;
  description: string;
}
```

### 5.2 维度元数据

```ts
export const SBTI_DIMENSIONS: Array<{
  key: SbtiDimension;
  label: string;
  poleA: { letter: SbtiPole; name: string; desc: string };
  poleB: { letter: SbtiPole; name: string; desc: string };
}> = [
  {
    key: 'SR',
    label: '动机来源',
    poleA: { letter: 'S', name: '探索', desc: '被新鲜、变化与挑战驱动' },
    poleB: { letter: 'R', name: '安定', desc: '被秩序、可预测与掌控感驱动' },
  },
  {
    key: 'BF',
    label: '认知模式',
    poleA: { letter: 'B', name: '广角', desc: '跨领域扫描，连接异质信息' },
    poleB: { letter: 'F', name: '聚焦', desc: '单点深钻，追求专业纵深' },
  },
  {
    key: 'TP',
    label: '关系导向',
    poleA: { letter: 'T', name: '任务', desc: '以目标与结果为中心' },
    poleB: { letter: 'P', name: '人群', desc: '以情感与关系为中心' },
  },
  {
    key: 'IC',
    label: '行动风格',
    poleA: { letter: 'I', name: '发起', desc: '一次成型，追求闭环交付' },
    poleB: { letter: 'C', name: '校准', desc: '反复迭代，追求持续完善' },
  },
];

/** 风格群中文名 + 主题色（供结果页配色，对照 MBTI 的 GROUP_LABELS / GROUP_COLORS） */
export const SBTI_GROUP_LABELS: Record<SbtiGroup, string> = {
  pioneers: '开拓者',
  catalysts: '感召者',
  builders: '建设者',
  guardians: '守护者',
};

export const SBTI_GROUP_COLORS: Record<SbtiGroup, string> = {
  pioneers: 'amber',    // 琥珀 —— 攻坚突破
  catalysts: 'rose',    // 玫瑰 —— 凝聚感召
  builders: 'sky',      // 天蓝 —— 稳健建设
  guardians: 'emerald', // 翠绿 —— 守护滋养
};
```

### 5.3 评分引擎

**关键洞察**：SBTI 的评分逻辑与 MBTI 完全同构——都是「二元选择 → 极点计数 → 取较高者」。因此 `calculateScores` / `buildCode` 可以直接复用 MBTI 的实现，只需把极点字母换成本模型的。

**两种实现策略**（建议二选一）：

**策略 A（推荐，零风险）**：在 `sbti-data.ts` 内复制一份评分函数，仅替换类型参数。代码重复但隔离清晰，符合现有项目「每工具自包含」的风格。

```ts
export function calculateSbtiScores(
  questions: SbtiQuestion[],
  answers: Array<'A' | 'B' | null>
): SbtiDimensionScore[] {
  const counters: Record<SbtiPole, number> = { S:0, R:0, B:0, F:0, T:0, P:0, I:0, C:0 };
  questions.forEach((q, i) => {
    const ans = answers[i];
    if (!ans) return;
    counters[ans === 'A' ? q.optionA.pole : q.optionB.pole] += 1;
  });
  return SBTI_DIMENSIONS.map((dim) => {
    const first = counters[dim.poleA.letter];
    const second = counters[dim.poleB.letter];
    const total = first + second;
    return {
      dimension: dim.key,
      poles: [dim.poleA.letter, dim.poleB.letter],
      first,
      second,
      dominant: first >= second ? dim.poleA.letter : dim.poleB.letter,
      dominantPercent: total === 0 ? 50 : Math.round((Math.max(first, second) / total) * 100),
    };
  });
}

export function buildSbtiCode(scores: SbtiDimensionScore[]): string {
  return scores.map((s) => s.dominant).join('');
}
```

**策略 B（未来演进）**：当出现第三个测评工具时，把评分引擎泛型化为 `lib/quiz-engine.ts`，MBTI / SBTI / 未来测评共享。详见第 10 节。

---

## 6. 组件层设计：`components/tools/sbti-test.tsx`

### 6.1 复用 MBTI 组件的可行性

MBTI 组件 `mbti-test.tsx` 的状态机与 UI 结构**完全通用**：

- 状态机 `start → quiz → calculating → result`：通用
- StartScreen（模式选择 + 维度展示）：通用，仅替换文案与维度元数据
- 答题向导（进度条 + 题目卡片 + A/B 选项 + 自动前进）：通用
- ResultScreen（代码大字 + 标语 + 维度双向进度条 + 三段分析 + 画像 + 复制）：通用
- AnalysisCard 子组件：通用
- formatReport 工具函数：通用，仅替换文案常量

### 6.2 推荐实现方式：先复制，后抽取

遵循 YAGNI 原则，**第一阶段直接复制 `mbti-test.tsx` 为 `sbti-test.tsx`**，做以下替换：

| 替换项 | MBTI → SBTI |
|--------|-------------|
| 导入数据源 | `@/lib/mbti-data` → `@/lib/sbti-data` |
| 组件函数名 | `MbtiTest` → `SbtiTest` |
| `getToolById` 参数 | `'mbti-test'` → `'sbti-test'` |
| 文案「MBTI 人格测试」 | → 「SBTI 工作风格测评」 |
| 「人格类型」 | → 「工作风格类型」 |
| 「人格画像」 | → 「风格画像」 |
| MODE_CONFIG 文案 | 极速版/精准版描述微调为工作语境 |
| 计算文案「分析 4 个维度的得分分布」 | → 「分析 4 个工作风格维度」 |
| formatReport 标题与脚注 | → SBTI 对应文案 |

复制后约 670 行代码，其中真正差异 < 30 行（文案与导入）。

**何时抽取通用引擎**：当出现第 3 个测评工具时（比如大五人格、DISC），再抽取 `components/quiz/quiz-runner.tsx` 通用壳组件 + `lib/quiz-engine.ts` 泛型评分引擎。届时 MBTI 和 SBTI 都改为「数据 + 配置」驱动，组件壳统一。提前抽取属于过度设计。

### 6.3 视觉差异化（可选）

为避免两个测评工具视觉雷同，SBTI 结果页可做轻量差异化：

- **主色调**：MBTI 结果用 `primary`，SBTI 结果用风格群主题色（amber/rose/sky/emerald）渲染代码大字
- **图标**：MBTI 用 `Sparkles`，SBTI 用 `Compass`（指南针，契合「工作风格定位」）
- **结果页头部**：MBTI 是「你的 MBTI 人格类型是」，SBTI 是「你的工作风格代号是」

---

## 7. 评分算法

与 MBTI 完全一致，此处仅作对照说明：

```
输入：questions[] + answers[]  （answers[i] ∈ {'A','B',null}）
处理：
  1. 初始化 8 个极点计数器为 0
  2. 遍历每题，选中项的 pole 计数 +1
  3. 对每个维度，取两极中较高者为主导极 dominant
  4. dominantPercent = max(first, second) / (first + second) × 100
输出：DimensionScore[] + 4 字母代码（4 个 dominant 拼接）
```

边界情况处理（与 MBTI 一致）：
- 某题未作答（null）：跳过，不计入任何极点
- 维度两极平局：取第一极（poleA）为主导，与 MBTI 行为一致
- 全维度零作答：dominantPercent 回退为 50

---

## 8. 集成步骤（4 步，零架构改动）

严格遵循 `lib/registry.ts` 顶部注释的「新增工具步骤」。

### Step 1 — 数据层

新建 `lib/sbti-data.ts`：
- 类型定义（5.1）
- 维度元数据 `SBTI_DIMENSIONS`（5.2）
- 极速版题库 `SBTI_EXPRESS_QUESTIONS`（20 题，每维度 5 题，循环排列）
- 精准版题库 `SBTI_PRECISION_QUESTIONS`（60 题，前 5 题复用极速版）
- 16 种类型 `SBTI_TYPES`（完整文案，参照第 3 节示例补全）
- 风格群 `SBTI_GROUP_LABELS` / `SBTI_GROUP_COLORS`
- 评分引擎 `calculateSbtiScores` / `buildSbtiCode`（5.3 策略 A）

### Step 2 — 组件层

新建 `components/tools/sbti-test.tsx`：
- 复制 `mbti-test.tsx`，按 6.2 节做文案与导入替换
- 默认导出 `SbtiTest` 组件

### Step 3 — 注册元数据

在 `lib/registry.ts` 的 `TOOL_REGISTRY` 数组中，紧挨 `mbti-test` 条目后新增：

```ts
{
  id: 'sbti-test',
  name: 'SBTI 工作风格测评',
  description: '极速版 20 题 / 精准版 60 题，测你的工作与创造风格，附维度得分与报告',
  category: 'quiz',
  keywords: ['sbti', 'workstyle', 'work style', 'career', 'test', '工作风格', '职场', '测评', '16型工作风格', 'SBTI'],
  icon: 'Compass',
  componentPath: '@/components/tools/sbti-test',
  runtime: 'client',
},
```

> `icon: 'Compass'` 需确认 `components/icon-resolver.tsx` 已映射该 lucide 图标；若未映射，在该文件补一行。`category: 'quiz'` 复用现有分类，自动归入「趣味测评」并参与首页置顶推荐逻辑。

### Step 4 — 注册动态加载

在 `components/tool-loader.tsx` 的 `TOOL_COMPONENTS` 映射中新增：

```ts
'sbti-test': dynamic(() => import('@/components/tools/sbti-test'), {
  loading: ToolLoading,
  ssr: false,
}),
```

### 完成后的自动收益（无需额外代码）

- ✅ 首页工具卡片自动出现 SBTI
- ✅ `/tools` 列表页自动归入「趣味测评」分组
- ✅ `/tools/sbti-test/` 动态路由自动预渲染（`generateStaticParams` 读注册表）
- ✅ 命令面板（Cmd+K）模糊搜索自动覆盖
- ✅ SEO 元数据 + JSON-LD（SoftwareApplication schema）自动注入
- ✅ sitemap.xml 自动包含新工具 URL
- ✅ 工具使用记录 + 收藏（Zustand persist）自动生效

---

## 9. SEO 与运营

### 9.1 SEO（自动驱动，仅需在 registry 填好 keywords）

`app/tools/[slug]/page.tsx` 已实现从 `ToolMeta` 自动生成 TDK + JSON-LD。SBTI 的 `keywords` 数组已覆盖中英文搜索意图。建议补充：

- 在 `lib/seo.ts` 的 `SITE_KEYWORDS` 全局关键词中追加 `'SBTI', '工作风格测评'`（可选）
- SBTI 工具页的 description 自动取自 `ToolMeta.description`，已足够

### 9.2 与 MBTI 的协同运营

两个测评工具可形成「测评矩阵」运营抓手：

- **首页并排推荐**：MBTI（认识自己）+ SBTI（定位工作风格），覆盖性格与职场双场景
- **结果页交叉引导**（可选增强）：MBTI 结果页底部加「想知道这套性格怎么影响你的工作方式？测测 SBTI」，反之亦然。实现方式：在 ResultScreen 加一个 `<CrossTestPromo />` 组件，读取另一个测评的 ToolMeta 渲染卡片
- **社交分享文案**：MBTI 报告强调「我是 XX 型人」，SBTI 报告强调「我的工作风格是 XX 型」，两种话术互补，提升分享率

### 9.3 内容沉淀

建议为 SBTI 单独建一个 SEO 落地页或博客文章（可在未来 `app/blog/` 目录扩展），详解 16 种工作风格，每种类型一个长尾关键词页面，承接搜索引擎流量。

---

## 10. 扩展性与未来演进

### 10.1 通用测评引擎抽取（第三个测评工具出现时）

当项目有 3 个及以上测评工具时，抽取以下公共层：

```
lib/quiz/
  ├── types.ts          # 泛型 QuizQuestion<D>, QuizDimensionScore<D>, QuizType
  ├── engine.ts         # 泛型 calculateScores<D>(), buildCode<D>()
  └── runner-config.ts  # 通用模式配置（express/precision）

components/quiz/
  ├── quiz-runner.tsx   # 通用状态机壳组件，接收 QuizConfig<D> props
  ├── start-screen.tsx
  ├── quiz-stage.tsx
  └── result-screen.tsx
```

届时 MBTI / SBTI / 大五 / DISC 都退化为「一份配置数据 + 一行注册」，组件壳统一。

### 10.2 题库外置（可选）

若未来需要 A/B 测试题目或动态更新题库，可将题库从 TS 常量改为 JSON 文件放 `public/quiz/sbti.json`，运行时 fetch。但当前阶段静态内联更简单、构建时类型检查更严，建议暂不外置。

### 10.3 维度可配置化

若要支持「自定义维度」的测评（用户选 3/4/5 维度），需把 `SBTI_DIMENSIONS` 改为运行时配置。这会显著增加复杂度，仅在有明确产品需求时再做。

### 10.4 与边缘 API 结合（可选增强）

当前测评纯客户端计算。若要做「匿名统计各类型分布」用于运营看板，可在结果页加一个可选的「贡献我的匿名结果」按钮，调用 `functions/api/stats.ts`（已存在）写入 KV。需在 stats 端点扩展一个 `quiz` 维度。

---

## 11. 落地清单

按优先级排序的可执行 checklist：

- [ ] **P0** 新建 `lib/sbti-data.ts`：类型 + 维度元数据 + 评分引擎 + 16 种类型完整文案
- [ ] **P0** 编写极速版题库 20 题（每维度 5 题，循环排列，极点方向随机化）
- [ ] **P0** 编写精准版题库 60 题（前 5 题复用极速版 + 后 10 题深度工作行为题）
- [ ] **P0** 新建 `components/tools/sbti-test.tsx`：复制 mbti-test 并替换文案/导入
- [ ] **P0** 在 `lib/registry.ts` 注册 SBTI 的 ToolMeta
- [ ] **P0** 在 `components/tool-loader.tsx` 注册动态导入
- [ ] **P0** 确认 `components/icon-resolver.tsx` 已映射 `Compass` 图标
- [ ] **P1** `npm run build` 验证静态导出成功，`/tools/sbti-test/` 页面已预渲染
- [ ] **P1** 本地 `npm run dev` 走查：开始屏 → 答题 → 计算 → 结果 → 复制报告全流程
- [ ] **P2** 结果页视觉差异化：用风格群主题色渲染代码大字
- [ ] **P2** MBTI ↔ SBTI 结果页交叉引导组件
- [ ] **P3** 抽取通用 `lib/quiz/` + `components/quiz/`（等第三个测评工具时再做）

---

## 附录：SBTI vs MBTI 维度对照速查

| 序号 | SBTI 维度 | SBTI 极点 | MBTI 对应维度 | MBTI 极点 | 差异要点 |
|------|----------|-----------|--------------|-----------|---------|
| 1 | 动机来源 SR | 探索 S / 安定 R | 能量来源 EI | 外向 E / 内向 I | SBTI 问「被什么驱动」，MBTI 问「从哪恢复能量」 |
| 2 | 认知模式 BF | 广角 B / 聚焦 F | 信息接收 SN | 实感 S / 直觉 N | SBTI 问「广度 vs 深度」，MBTI 问「具体 vs 抽象」 |
| 3 | 关系导向 TP | 任务 T / 人群 P | 决策方式 TF | 思考 T / 情感 F | 高度相似但 SBTI 聚焦工作协作语境 |
| 4 | 行动风格 IC | 发起 I / 校准 C | 生活方式 JP | 判断 J / 感知 P | SBTI 问「一次成型 vs 反复迭代」，MBTI 问「计划 vs 灵活」 |

> 维度 3（TP vs TF）是两者最接近的维度，但 SBTI 的题目语境严格限定在「工作协作」场景，与 MBTI 的生活化决策题区分。

---

*本方案为设计文档，未修改任何现有项目文件。落地时按第 11 节清单执行。*
