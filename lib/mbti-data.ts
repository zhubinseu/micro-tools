/**
 * MBTI 人格测试 - 数据层
 *
 * 本文件是 MBTI 工具的单一数据源，包含：
 *   1. 类型定义（Dimension / Pole / Question / TestState 等）
 *   2. 四个维度的元数据配置
 *   3. 极速版题库（20 题，每维度 5 题）
 *   4. 精准版题库（60 题，每维度 15 题）
 *   5. 16 种人格类型的完整结果文案
 *
 * 评分模型：二元选择（A vs B），每题被选中的选项为其所属极点 +1。
 * 例如某题 optionA.pole = 'E'，optionB.pole = 'I'，用户选 A 则 E 维度 +1。
 * 最终每个维度的两个极点累计得分，较高者为该维度的主导特质。
 *
 * 设计原则：
 *   - 题目顺序按维度交错排列（E/I, S/N, T/F, J/P 循环），避免连续同维度疲劳
 *   - 选项 A/B 的极点方向随机化，避免"全选 A"得到单一类型的偏差
 *   - 所有文案纯中文，面向中文用户
 */

// ---------------------------------------------------------------------------
// 类型定义
// ---------------------------------------------------------------------------

/** 四个 MBTI 维度 */
export type Dimension = 'EI' | 'SN' | 'TF' | 'JP';

/** 八个极点（每个维度两个对立极点） */
export type Pole = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';

/** 测试模式 */
export type TestMode = 'express' | 'precision';

/** 单道题目 */
export interface Question {
  /** 题目唯一 id，例如 'e-ei-1' */
  id: string;
  /** 所属维度 */
  dimension: Dimension;
  /** 题干文本 */
  text: string;
  /** 选项 A */
  optionA: { text: string; pole: Pole };
  /** 选项 B */
  optionB: { text: string; pole: Pole };
}

/** 测试状态机阶段 */
export type TestStage = 'start' | 'quiz' | 'calculating' | 'result';

/** 运行时测试状态 */
export interface TestState {
  stage: TestStage;
  mode: TestMode | null;
  currentIndex: number;
  /** answers[i] = 用户对第 i 题的选择，'A' | 'B' | null（null 表示未作答） */
  answers: Array<'A' | 'B' | null>;
}

/** 单个维度的得分结果 */
export interface DimensionScore {
  dimension: Dimension;
  /** 维度两极，例如 ['E', 'I'] */
  poles: [Pole, Pole];
  /** 第一极得分 */
  first: number;
  /** 第二极得分 */
  second: number;
  /** 主导极点（得分较高者；平局时取第一极） */
  dominant: Pole;
  /** 主导极点占比百分比 0-100 */
  dominantPercent: number;
}

/** 16 种人格类型的结果文案 */
export interface PersonalityType {
  /** 4 字母代码，例如 'INTJ' */
  code: string;
  /** 中文昵称，例如 '建筑师' */
  nickname: string;
  /** 英文别名/角色 */
  alias: string;
  /** 所属气质群：NT 理性者 / NF 理想主义者 / SJ 护卫者 / SP 艺术创造者 */
  group: 'analysts' | 'diplomats' | 'sentinels' | 'explorers';
  /** 一句话标语 */
  tagline: string;
  /** 核心优势（3 句） */
  strengths: string;
  /** 主要弱点（3 句） */
  weaknesses: string;
  /** 适合的职业方向 */
  careers: string;
  /** 综合描述段落 */
  description: string;
}

// ---------------------------------------------------------------------------
// 维度元数据
// ---------------------------------------------------------------------------

export interface DimensionMeta {
  key: Dimension;
  /** 维度中文名 */
  label: string;
  /** 第一极（字母 / 中文名 / 描述） */
  poleA: { letter: Pole; name: string; desc: string };
  /** 第二极 */
  poleB: { letter: Pole; name: string; desc: string };
}

export const DIMENSIONS: DimensionMeta[] = [
  {
    key: 'EI',
    label: '能量来源',
    poleA: { letter: 'E', name: '外向', desc: '从外部世界、社交互动中获取能量' },
    poleB: { letter: 'I', name: '内向', desc: '从内心世界、独处反思中恢复能量' },
  },
  {
    key: 'SN',
    label: '信息接收',
    poleA: { letter: 'S', name: '实感', desc: '关注具体事实、细节与现实经验' },
    poleB: { letter: 'N', name: '直觉', desc: '关注可能性、整体模式与未来想象' },
  },
  {
    key: 'TF',
    label: '决策方式',
    poleA: { letter: 'T', name: '思考', desc: '以逻辑、客观标准与公平原则决策' },
    poleB: { letter: 'F', name: '情感', desc: '以价值观、同理心与人际和谐决策' },
  },
  {
    key: 'JP',
    label: '生活方式',
    poleA: { letter: 'J', name: '判断', desc: '偏好计划、结构化与及时完成任务' },
    poleB: { letter: 'P', name: '感知', desc: '偏好灵活、开放选项与保留选择权' },
  },
];

/** 极点 → 所属维度 的反查映射 */
export const POLE_TO_DIMENSION: Record<Pole, Dimension> = {
  E: 'EI',
  I: 'EI',
  S: 'SN',
  N: 'SN',
  T: 'TF',
  F: 'TF',
  J: 'JP',
  P: 'JP',
};

// ---------------------------------------------------------------------------
// 题库
// ---------------------------------------------------------------------------

/**
 * 极速版题库：20 题，每维度 5 题，按维度循环排列。
 */
export const EXPRESS_QUESTIONS: Question[] = [
  // === EI 维度 ×5 ===
  {
    id: 'e-ei-1',
    dimension: 'EI',
    text: '在一场热闹的聚会中待了两小时后，你通常的感觉是？',
    optionA: { text: '精力充沛，还想继续聊下去', pole: 'E' },
    optionB: { text: '有点疲惫，想找个安静角落或回家', pole: 'I' },
  },
  {
    id: 'e-ei-2',
    dimension: 'EI',
    text: '遇到一个新问题时，你更倾向于？',
    optionA: { text: '先和别人讨论，边说边理清思路', pole: 'E' },
    optionB: { text: '先独自思考，想清楚再和别人交流', pole: 'I' },
  },
  {
    id: 'e-ei-3',
    dimension: 'EI',
    text: '周末没有安排时，你更可能？',
    optionA: { text: '主动约朋友出去玩或参加活动', pole: 'E' },
    optionB: { text: '宅在家看书、看剧或做自己的事', pole: 'I' },
  },
  {
    id: 'e-ei-4',
    dimension: 'EI',
    text: '在陌生人群中，你通常？',
    optionA: { text: '很快就能和新人聊起来，主动破冰', pole: 'E' },
    optionB: { text: '等别人先开口，观察一段时间再参与', pole: 'I' },
  },
  {
    id: 'e-ei-5',
    dimension: 'EI',
    text: '工作一天后感到疲惫，你更想如何恢复？',
    optionA: { text: '约几个朋友喝一杯、吐槽一下', pole: 'E' },
    optionB: { text: '一个人待着，听听音乐或发呆', pole: 'I' },
  },
  // === SN 维度 ×5 ===
  {
    id: 'e-sn-1',
    dimension: 'SN',
    text: '阅读一本新书时，你更关注？',
    optionA: { text: '书中的具体事实、案例和可操作的方法', pole: 'S' },
    optionB: { text: '作者想表达的整体思想和未来启发', pole: 'N' },
  },
  {
    id: 'e-sn-2',
    dimension: 'SN',
    text: '学习新技能时，你更喜欢？',
    optionA: { text: '按步骤一步步实操，掌握每个细节', pole: 'S' },
    optionB: { text: '先理解整体框架和原理，再填充细节', pole: 'N' },
  },
  {
    id: 'e-sn-3',
    dimension: 'SN',
    text: '描述一件事时，你倾向于？',
    optionA: { text: '按时间顺序，讲清楚发生了什么', pole: 'S' },
    optionB: { text: '讲背后的意义和它可能带来的影响', pole: 'N' },
  },
  {
    id: 'e-sn-4',
    dimension: 'SN',
    text: '你更欣赏哪种人？',
    optionA: { text: '脚踏实地、把眼前事做扎实的人', pole: 'S' },
    optionB: { text: '富有想象力、能看到未来趋势的人', pole: 'N' },
  },
  {
    id: 'e-sn-5',
    dimension: 'SN',
    text: '面对一个新项目，你首先想到的是？',
    optionA: { text: '现有资源、已验证的方法和可行路径', pole: 'S' },
    optionB: { text: '还能做成什么样、有没有全新可能', pole: 'N' },
  },
  // === TF 维度 ×5 ===
  {
    id: 'e-tf-1',
    dimension: 'TF',
    text: '朋友向你倾诉烦恼时，你的第一反应是？',
    optionA: { text: '帮他分析问题、找出解决方案', pole: 'T' },
    optionB: { text: '先共情、安慰，让他感觉被理解', pole: 'F' },
  },
  {
    id: 'e-tf-2',
    dimension: 'TF',
    text: '做一个重要决定时，你更看重？',
    optionA: { text: '客观利弊、数据和逻辑分析', pole: 'T' },
    optionB: { text: '这件事对相关人的影响和价值观', pole: 'F' },
  },
  {
    id: 'e-tf-3',
    dimension: 'TF',
    text: '评价别人时，你更容易注意到？',
    optionA: { text: '他做事是否合理、是否高效', pole: 'T' },
    optionB: { text: '他是否真诚、是否体贴他人', pole: 'F' },
  },
  {
    id: 'e-tf-4',
    dimension: 'TF',
    text: '团队出现分歧时，你认为最重要的是？',
    optionA: { text: '讲清道理，坚持对的方案', pole: 'T' },
    optionB: { text: '照顾每个人感受，维护和谐', pole: 'F' },
  },
  {
    id: 'e-tf-5',
    dimension: 'TF',
    text: '被批评时，你更在意？',
    optionA: { text: '批评是否在事实上正确', pole: 'T' },
    optionB: { text: '对方说话的方式是否伤人', pole: 'F' },
  },
  // === JP 维度 ×5 ===
  {
    id: 'e-jp-1',
    dimension: 'JP',
    text: '出门旅行前，你通常？',
    optionA: { text: '提前规划好每天的行程和住宿', pole: 'J' },
    optionB: { text: '只定大方向，到了再说', pole: 'P' },
  },
  {
    id: 'e-jp-2',
    dimension: 'JP',
    text: '面对一个截止日期，你倾向于？',
    optionA: { text: '尽早开始，按计划稳步推进', pole: 'J' },
    optionB: { text: '拖到临近截止才进入冲刺状态', pole: 'P' },
  },
  {
    id: 'e-jp-3',
    dimension: 'JP',
    text: '你的桌面/工作区通常是？',
    optionA: { text: '整洁有序，物品各归其位', pole: 'J' },
    optionB: { text: '有点乱，但我能找到东西', pole: 'P' },
  },
  {
    id: 'e-jp-4',
    dimension: 'JP',
    text: '做选择时（如点餐、买礼物），你？',
    optionA: { text: '快速决定，不喜欢拖泥带水', pole: 'J' },
    optionB: { text: '想多看几个选项，最后再定', pole: 'P' },
  },
  {
    id: 'e-jp-5',
    dimension: 'JP',
    text: '计划临时被打乱时，你的感受？',
    optionA: { text: '焦虑，想尽快重新建立秩序', pole: 'J' },
    optionB: { text: '还好，灵活应对反而更有意思', pole: 'P' },
  },
];

/**
 * 精准版题库：60 题，每维度 15 题。
 * 其中前 5 题复用极速版（保证两种模式核心覆盖一致），
 * 后 10 题为深度行为题，按维度循环排列。
 */
export const PRECISION_QUESTIONS: Question[] = [
  // === EI 维度 ×15（前 5 题复用极速版）===
  ...EXPRESS_QUESTIONS.filter((q) => q.dimension === 'EI'),
  {
    id: 'p-ei-6',
    dimension: 'EI',
    text: '在团队会议中，你更习惯？',
    optionA: { text: '主动发言，推动讨论向前', pole: 'E' },
    optionB: { text: '更多是倾听，有把握时才发言', pole: 'I' },
  },
  {
    id: 'p-ei-7',
    dimension: 'EI',
    text: '认识新朋友对你来说是？',
    optionA: { text: '令人兴奋的事，扩大社交圈', pole: 'E' },
    optionB: { text: '有点消耗，需要慢慢建立信任', pole: 'I' },
  },
  {
    id: 'p-ei-8',
    dimension: 'EI',
    text: '你的沟通风格更接近？',
    optionA: { text: '想到就说，边说边整理想法', pole: 'E' },
    optionB: { text: '想清楚再说，话不多但到位', pole: 'I' },
  },
  {
    id: 'p-ei-9',
    dimension: 'EI',
    text: '长时间独处后，你会？',
    optionA: { text: '感到憋闷，想找人说话', pole: 'E' },
    optionB: { text: '感到充实，状态很好', pole: 'I' },
  },
  {
    id: 'p-ei-10',
    dimension: 'EI',
    text: '处理多任务时，你倾向于？',
    optionA: { text: '同时推进多个，频繁切换', pole: 'E' },
    optionB: { text: '一次专注一个，做完再换', pole: 'I' },
  },
  {
    id: 'p-ei-11',
    dimension: 'EI',
    text: '在社交媒体上，你？',
    optionA: { text: '经常发动态、评论互动', pole: 'E' },
    optionB: { text: '更多潜水浏览，很少发声', pole: 'I' },
  },
  {
    id: 'p-ei-12',
    dimension: 'EI',
    text: '被问到突发的复杂问题时，你？',
    optionA: { text: '当场就能侃侃而谈', pole: 'E' },
    optionB: { text: '希望给我点时间想想再回答', pole: 'I' },
  },
  {
    id: 'p-ei-13',
    dimension: 'EI',
    text: '你更喜欢的学习环境是？',
    optionA: { text: '小组讨论、工作坊', pole: 'E' },
    optionB: { text: '独自阅读、在线课程', pole: 'I' },
  },
  {
    id: 'p-ei-14',
    dimension: 'EI',
    text: '关于"朋友"的定义，你？',
    optionA: { text: '朋友圈较广，认识的人很多', pole: 'E' },
    optionB: { text: '朋友不多但都很深', pole: 'I' },
  },
  {
    id: 'p-ei-15',
    dimension: 'EI',
    text: '一天中你的能量高峰通常？',
    optionA: { text: '在和多人互动之后', pole: 'E' },
    optionB: { text: '在独处专注一段时间之后', pole: 'I' },
  },
  // === SN 维度 ×15 ===
  ...EXPRESS_QUESTIONS.filter((q) => q.dimension === 'SN'),
  {
    id: 'p-sn-6',
    dimension: 'SN',
    text: '你更相信？',
    optionA: { text: '亲身验证过的事实和数据', pole: 'S' },
    optionB: { text: '直觉判断和第一印象', pole: 'N' },
  },
  {
    id: 'p-sn-7',
    dimension: 'SN',
    text: '看一部电影后，你更可能记住？',
    optionA: { text: '具体的情节、台词和画面', pole: 'S' },
    optionB: { text: '它引发的联想和隐喻', pole: 'N' },
  },
  {
    id: 'p-sn-8',
    dimension: 'SN',
    text: '你对"细节"的态度是？',
    optionA: { text: '细节决定成败，必须抠到位', pole: 'S' },
    optionB: { text: '细节重要，但大局观更要紧', pole: 'N' },
  },
  {
    id: 'p-sn-9',
    dimension: 'SN',
    text: '工作中你更讨厌？',
    optionA: { text: '方案太空泛、没有落地步骤', pole: 'S' },
    optionB: { text: '只盯琐碎细节、看不到方向', pole: 'N' },
  },
  {
    id: 'p-sn-10',
    dimension: 'SN',
    text: '别人形容你更可能是？',
    optionA: { text: '务实、靠谱、脚踏实地', pole: 'S' },
    optionB: { text: '有想法、有远见、天马行空', pole: 'N' },
  },
  {
    id: 'p-sn-11',
    dimension: 'SN',
    text: '面对一个全新领域，你？',
    optionA: { text: '先收集资料、搞清现状再动手', pole: 'S' },
    optionB: { text: '先脑暴各种可能，再筛选可行', pole: 'N' },
  },
  {
    id: 'p-sn-12',
    dimension: 'SN',
    text: '你写东西时更倾向于？',
    optionA: { text: '用具体例子、数据支撑观点', pole: 'S' },
    optionB: { text: '用比喻、类比表达抽象概念', pole: 'N' },
  },
  {
    id: 'p-sn-13',
    dimension: 'SN',
    text: '回忆过去时，你脑海中更常出现？',
    optionA: { text: '清晰的画面、声音和具体场景', pole: 'S' },
    optionB: { text: '当时的感觉和整体的氛围', pole: 'N' },
  },
  {
    id: 'p-sn-14',
    dimension: 'SN',
    text: '你更欣赏的创意是？',
    optionA: { text: '对现有事物的改良和优化', pole: 'S' },
    optionB: { text: '从零开始的颠覆性创新', pole: 'N' },
  },
  {
    id: 'p-sn-15',
    dimension: 'SN',
    text: '做计划时你更关注？',
    optionA: { text: '每一步如何执行、资源够不够', pole: 'S' },
    optionB: { text: '最终要达成的愿景和方向', pole: 'N' },
  },
  // === TF 维度 ×15 ===
  ...EXPRESS_QUESTIONS.filter((q) => q.dimension === 'TF'),
  {
    id: 'p-tf-6',
    dimension: 'TF',
    text: '和朋友发生分歧时，你更可能？',
    optionA: { text: '坚持自己的道理，据理力争', pole: 'T' },
    optionB: { text: '为了关系让步，避免冲突', pole: 'F' },
  },
  {
    id: 'p-tf-7',
    dimension: 'TF',
    text: '看到别人难过时，你？',
    optionA: { text: '想帮他分析问题出在哪', pole: 'T' },
    optionB: { text: '先感受到他的情绪并陪伴', pole: 'F' },
  },
  {
    id: 'p-tf-8',
    dimension: 'TF',
    text: '你认为"公平"意味着？',
    optionA: { text: '同一标准对待所有人', pole: 'T' },
    optionB: { text: '根据每个人的情况区别对待', pole: 'F' },
  },
  {
    id: 'p-tf-9',
    dimension: 'TF',
    text: '做绩效评估时，你更倾向于？',
    optionA: { text: '严格按指标打分', pole: 'T' },
    optionB: { text: '考虑当事人的努力和处境', pole: 'F' },
  },
  {
    id: 'p-tf-10',
    dimension: 'TF',
    text: '别人找你帮忙时，你先想？',
    optionA: { text: '这事该不该帮、合不合理', pole: 'T' },
    optionB: { text: '他开口一定不容易，能帮就帮', pole: 'F' },
  },
  {
    id: 'p-tf-11',
    dimension: 'TF',
    text: '你更受不了哪种领导？',
    optionA: { text: '决策凭感情、不讲逻辑', pole: 'T' },
    optionB: { text: '冷冰冰、只看数字不看人', pole: 'F' },
  },
  {
    id: 'p-tf-12',
    dimension: 'TF',
    text: '争论中你更在意？',
    optionA: { text: '谁的观点在事实上站得住', pole: 'T' },
    optionB: { text: '争论的过程是否伤了和气', pole: 'F' },
  },
  {
    id: 'p-tf-13',
    dimension: 'TF',
    text: '评价一部作品时，你更看重？',
    optionA: { text: '它的结构、技巧是否精良', pole: 'T' },
    optionB: { text: '它是否触动了你的情感', pole: 'F' },
  },
  {
    id: 'p-tf-14',
    dimension: 'TF',
    text: '面对不公平的事，你？',
    optionA: { text: '冷静分析制度哪里出了问题', pole: 'T' },
    optionB: { text: '先感到愤怒或心疼', pole: 'F' },
  },
  {
    id: 'p-tf-15',
    dimension: 'TF',
    text: '你认为自己更接近？',
    optionA: { text: '理性、客观、就事论事', pole: 'T' },
    optionB: { text: '感性、共情、重视关系', pole: 'F' },
  },
  // === JP 维度 ×15 ===
  ...EXPRESS_QUESTIONS.filter((q) => q.dimension === 'JP'),
  {
    id: 'p-jp-6',
    dimension: 'JP',
    text: '你的待办清单通常是？',
    optionA: { text: '详细列出，完成一项划一项', pole: 'J' },
    optionB: { text: '很少列清单，记在脑子里', pole: 'P' },
  },
  {
    id: 'p-jp-7',
    dimension: 'JP',
    text: '面对多个并行任务，你？',
    optionA: { text: '排好优先级，依次完成', pole: 'J' },
    optionB: { text: '哪个有灵感先做哪个', pole: 'P' },
  },
  {
    id: 'p-jp-8',
    dimension: 'JP',
    text: '你对"规则"的态度是？',
    optionA: { text: '规则让事情更高效，应遵守', pole: 'J' },
    optionB: { text: '规则是参考，必要时可以变通', pole: 'P' },
  },
  {
    id: 'p-jp-9',
    dimension: 'JP',
    text: '一个项目接近尾声时，你？',
    optionA: { text: '赶紧收尾，落袋为安', pole: 'J' },
    optionB: { text: '还想再优化、再迭代', pole: 'P' },
  },
  {
    id: 'p-jp-10',
    dimension: 'JP',
    text: '别人眼中你更像？',
    optionA: { text: '靠谱、有计划、说到做到', pole: 'J' },
    optionB: { text: '随性、灵活、点子多', pole: 'P' },
  },
  {
    id: 'p-jp-11',
    dimension: 'JP',
    text: '购物时你倾向于？',
    optionA: { text: '列好清单，买完就走', pole: 'J' },
    optionB: { text: '随便逛逛，看到喜欢的再买', pole: 'P' },
  },
  {
    id: 'p-jp-12',
    dimension: 'JP',
    text: '你对"deadline"的感受？',
    optionA: { text: '是必要的，帮我按时完成', pole: 'J' },
    optionB: { text: '有点束缚，但能逼我行动', pole: 'P' },
  },
  {
    id: 'p-jp-13',
    dimension: 'JP',
    text: '生活中你更享受？',
    optionA: { text: '一切井井有条的掌控感', pole: 'J' },
    optionB: { text: '随时有新可能的开放感', pole: 'P' },
  },
  {
    id: 'p-jp-14',
    dimension: 'JP',
    text: '别人临时邀约你出门，你？',
    optionA: { text: '有点抗拒，已安排的事不想改', pole: 'J' },
    optionB: { text: '挺乐意，说走就走', pole: 'P' },
  },
  {
    id: 'p-jp-15',
    dimension: 'JP',
    text: '完成一项工作后，你接下来？',
    optionA: { text: '立即开始下一项计划', pole: 'J' },
    optionB: { text: '先放松一下，看看有什么想做的', pole: 'P' },
  },
];

/** 按模式获取题库 */
export function getQuestions(mode: TestMode): Question[] {
  return mode === 'express' ? EXPRESS_QUESTIONS : PRECISION_QUESTIONS;
}

// ---------------------------------------------------------------------------
// 16 种人格类型
// ---------------------------------------------------------------------------

export const PERSONALITY_TYPES: Record<string, PersonalityType> = {
  // === 分析家 NT ===
  INTJ: {
    code: 'INTJ',
    nickname: '建筑师',
    alias: 'The Architect',
    group: 'analysts',
    tagline: '富有想象力又有决断力的战略思考者',
    strengths: '擅长抽象思考与长程规划，能在复杂信息中提炼出系统化的战略框架，对自身能力有清醒认知并持续精进。',
    weaknesses: '容易过度自信而忽视他人感受与团队协作，对低效和无意义的事缺乏耐心，情感表达上较为内敛冷漠。',
    careers: '适合战略咨询、系统架构师、科研学者、投资分析师、技术高管等需要深度思考与长期布局的岗位。',
    description: '你是稀有的"建筑师"型人格——只占人口约 2%。你拥有把抽象愿景转化为可执行蓝图的 rare 能力，思维缜密且目标坚定。你不满足于现状，永远在追问"为什么不能更好"。',
  },
  INTP: {
    code: 'INTP',
    nickname: '逻辑学家',
    alias: 'The Logician',
    group: 'analysts',
    tagline: '对知识有着永不满足渴求的创新发明家',
    strengths: '逻辑思维能力极强，善于发现事物背后的原理与规律，对感兴趣领域能投入惊人的专注力。',
    weaknesses: '容易陷入空想而迟迟不行动，对日常琐事和社交应酬缺乏耐心，情感表达与人际维护是短板。',
    careers: '适合科研、软件开发、数据分析、哲学、理论物理、系统设计等需要深度逻辑与原创思考的领域。',
    description: '你是"逻辑学家"——一个把世界当作巨大谜题来拆解的思考者。你享受在概念之间建立联系的那一刻，对真理有近乎纯粹的热爱。',
  },
  ENTJ: {
    code: 'ENTJ',
    nickname: '指挥官',
    alias: 'The Commander',
    group: 'analysts',
    tagline: '大胆、富有想象力且意志强大的天领导者',
    strengths: '天生的领导力与战略眼光，能把愿景转化为组织行动，决策果断、执行力强。',
    weaknesses: '可能过于强势而压制他人意见，对低效无能零容忍，情感细腻度不足易伤人。',
    careers: '适合企业高管、创业者、管理咨询、投行、律师、政治领袖等需要决断与领导力的岗位。',
    description: '你是"指挥官"——人群中天然的中心引力。你看到的不只是眼前的问题，更是整个系统该如何运转。你的意志力和组织能力让你能把不可能变成可能。',
  },
  ENTP: {
    code: 'ENTP',
    nickname: '辩论家',
    alias: 'The Debater',
    group: 'analysts',
    tagline: '聪明好奇的思想者，无法抗拒思维挑战',
    strengths: '思维敏捷、善于从多角度切入问题，富有创造力和辩才，能快速抓住事物本质。',
    weaknesses: '容易好辩而忽视他人感受，对常规与重复工作厌倦，常因兴趣跳跃而难以收尾。',
    careers: '适合创业者、产品经理、律师、记者、投资人、创意总监等需要创新与说服的岗位。',
    description: '你是"辩论家"——把每一次对话都当成思维体操。你享受在观点碰撞中擦出火花，对"理所当然"的事总要问一句"凭什么不能反过来"。',
  },
  // === 外交家 NF ===
  INFJ: {
    code: 'INFJ',
    nickname: '提倡者',
    alias: 'The Advocate',
    group: 'diplomats',
    tagline: '安静而神秘，同时鼓舞人心且不知疲倦的理想主义者',
    strengths: '有深刻的洞察力与使命感，能感知他人情绪与事物走向，为理想可付出持续努力。',
    weaknesses: '容易过度完美主义而内耗，对他人痛苦高度敏感易疲惫，决策时常陷入理想与现实的拉扯。',
    careers: '适合心理咨询、写作、教育、公益、人力资源、神职等需要深度共情与价值观驱动的领域。',
    description: '你是稀有的"提倡者"——仅占人口约 1%。你既能看见他人内心的暗流，又能构想遥远的理想图景。你安静，却有一种改变世界的执念。',
  },
  INFP: {
    code: 'INFP',
    nickname: '调停者',
    alias: 'The Mediator',
    group: 'diplomats',
    tagline: '诗意、善良的利他主义者，总愿为正当理由伸出援手',
    strengths: '富有同理心与创造力，对价值观高度忠诚，能用诗意的方式理解世界与他人。',
    weaknesses: '容易自我怀疑与情绪内耗，对冲突高度回避，理想过高时难以与现实妥协。',
    careers: '适合写作、艺术、心理咨询、教育、公益、内容创作等需要真诚与创造力的领域。',
    description: '你是"调停者"——内心住着一个不愿妥协的理想主义者。你用温柔的目光看待世界，却也有自己绝不退让的底线。',
  },
  ENFJ: {
    code: 'ENFJ',
    nickname: '主人公',
    alias: 'The Protagonist',
    group: 'diplomats',
    tagline: '富有魅力、鼓舞人心的领导者，能让听众入迷',
    strengths: '天生的人际敏感度与感染力，能激发他人潜能，组织力与责任感强。',
    weaknesses: '容易过度投入他人事务而忽略自己，对批评较为敏感，有时把"为你好"强加于人。',
    careers: '适合教师、HR、销售领袖、公益组织者、政治家、媒体人等需要感染与引领他人的岗位。',
    description: '你是"主人公"——人群中的温暖光源。你不只是领导，更能让别人相信"我们可以一起做到"。你的同理心和行动力让你成为天然的凝聚者。',
  },
  ENFP: {
    code: 'ENFP',
    nickname: '竞选者',
    alias: 'The Campaigner',
    group: 'diplomats',
    tagline: '热情、有创造力、爱社交的自由灵魂',
    strengths: '热情洋溢、富有感染力与创造力，能快速连接不同领域的人与想法。',
    weaknesses: '容易三分钟热度、难以坚持，对细节和收尾缺乏耐心，情绪起伏较大。',
    careers: '适合创意、市场、内容创作、心理咨询、创业者、记者等需要热情与人际的领域。',
    description: '你是"竞选者"——一团会微笑的火焰。你能在平凡瞬间发现奇迹，也能把陌生人变成朋友。你的热情是会传染的。',
  },
  // === 护卫者 SJ ===
  ISTJ: {
    code: 'ISTJ',
    nickname: '物流师',
    alias: 'The Logistician',
    group: 'sentinels',
    tagline: '实际而注重事实的人，可靠性不容怀疑',
    strengths: '责任心极强、做事严谨有序，重视事实与规则，是组织里最可靠的压舱石。',
    weaknesses: '可能过于保守、抗拒变化，对创新和情感需求不够敏感，沟通偏直接。',
    careers: '适合会计、审计、工程师、公务员、军警、项目管理等需要严谨与可靠性的岗位。',
    description: '你是"物流师"——团队里那个"交给他就放心"的人。你不爱花哨，但你的靠谱就是最大的力量。',
  },
  ISFJ: {
    code: 'ISFJ',
    nickname: '守护者',
    alias: 'The Defender',
    group: 'sentinels',
    tagline: '非常专注而温暖的守护者，时刻准备保护爱的人',
    strengths: '细致体贴、默默付出，记忆力强、对他人需求高度敏感，是稳定的支持者。',
    weaknesses: '容易过度付出而委屈自己，抗拒冲突与变化，对自身需求表达不足。',
    careers: '适合医护、教师、社工、行政、HR、客户服务等需要细心与奉献的领域。',
    description: '你是"守护者"——那种默默把一切打理妥当、却很少邀功的人。你的温柔藏在日常的细节里，被你守护的人是幸运的。',
  },
  ESTJ: {
    code: 'ESTJ',
    nickname: '总经理',
    alias: 'The Executive',
    group: 'sentinels',
    tagline: '出色的管理者，在管理事务或人员方面无与伦比',
    strengths: '组织力与执行力强，重视秩序与效率，能把混乱迅速理顺。',
    weaknesses: '可能过于强硬、缺乏弹性，对情感与创新不够包容，沟通偏指令式。',
    careers: '适合管理、运营、金融、军警、法官、项目经理等需要秩序与执行力的岗位。',
    description: '你是"总经理"——天生的组织者。你看到的就是"该怎么把它做对"，并且有能力带着一群人一起做对。',
  },
  ESFJ: {
    code: 'ESFJ',
    nickname: '执政官',
    alias: 'The Consul',
    group: 'sentinels',
    tagline: '极有同情心、爱社交、受欢迎的人，总是热心帮助他人',
    strengths: '热心周到、善于营造和谐氛围，人际关系维护能力强，责任感强。',
    weaknesses: '可能过于在意他人评价，对冲突和创新接受度低，容易把他人事务扛在自己肩上。',
    careers: '适合教育、医护、HR、客户成功、活动策划、销售等需要人际与服务的领域。',
    description: '你是"执政官"——人群中的暖流。你记得每个人的生日，操心每件小事，让团队真的像一个"家"。',
  },
  // === 探索者 SP ===
  ISTP: {
    code: 'ISTP',
    nickname: '鉴赏家',
    alias: 'The Virtuoso',
    group: 'explorers',
    tagline: '大胆而实际的实验家，擅长使用各种工具',
    strengths: '动手能力强、冷静沉着，善于在危机中快速判断与行动，对机械/系统有天赋。',
    weaknesses: '容易显得疏离、不擅情感表达，对承诺与长期规划兴趣不高，易冒险。',
    careers: '适合工程师、机械师、飞行员、外科医生、消防员、程序员等需要实操与冷静的岗位。',
    description: '你是"鉴赏家"——天生的工具大师。你话不多，但一动手就能让复杂的机器/系统乖乖听话。危机来临时，你是那个最冷静的人。',
  },
  ISFP: {
    code: 'ISFP',
    nickname: '探险家',
    alias: 'The Adventurer',
    group: 'explorers',
    tagline: '灵活迷人的艺术家，时刻准备探索新的可能',
    strengths: '审美与共情力强，活在当下、忠于自我，能用具象方式表达丰富的内心。',
    weaknesses: '容易回避冲突与长远规划，对批评敏感，行动力受情绪影响较大。',
    careers: '适合艺术、设计、音乐、摄影、兽医、厨师等需要审美与感受力的领域。',
    description: '你是"探险家"——用感官与色彩感知世界的人。你不爱说教，但你的作品和生活本身就是一种态度。',
  },
  ESTP: {
    code: 'ESTP',
    nickname: '企业家',
    alias: 'The Entrepreneur',
    group: 'explorers',
    tagline: '聪明、精力充沛的感知者，真正享受生活在边缘',
    strengths: '反应快、行动力强，善于抓住当下机会，人际直觉敏锐。',
    weaknesses: '容易冲动冒险、缺乏耐心，对理论与长远规划兴趣低，可能忽视后果。',
    careers: '适合销售、创业者、运动员、急救人员、股票交易员、侦探等需要快速反应的岗位。',
    description: '你是"企业家"——永远在第一线行动的人。你不喜欢空谈，相信"做了才知道"。你的魄力和反应速度是你的武器。',
  },
  ESFP: {
    code: 'ESFP',
    nickname: '表演者',
    alias: 'The Entertainer',
    group: 'explorers',
    tagline: '自发、精力充沛、热情的表演者——生活在他们周围永不无聊',
    strengths: '热情洋溢、感染力强，善于享受当下、营造欢乐氛围，人际敏感度高。',
    weaknesses: '容易追求即时满足、回避枯燥，对长远规划与抽象理论兴趣不足。',
    careers: '适合表演、活动主持、销售、旅游、幼儿教育、时尚等需要热情与感染力的领域。',
    description: '你是"表演者"——人群中的太阳。你相信生活就该被好好享受，而你也确实有本事让身边的每个人都笑起来。',
  },
};

/** 气质群中文名 */
export const GROUP_LABELS: Record<PersonalityType['group'], string> = {
  analysts: '分析家',
  diplomats: '外交家',
  sentinels: '护卫者',
  explorers: '探索者',
};

/** 气质群主题色（Tailwind 类名片段，用于结果展示） */
export const GROUP_COLORS: Record<PersonalityType['group'], string> = {
  analysts: 'violet',
  diplomats: 'emerald',
  sentinels: 'sky',
  explorers: 'amber',
};

// ---------------------------------------------------------------------------
// 评分引擎
// ---------------------------------------------------------------------------

/**
 * 计算各维度得分
 * @param questions 本次测试的题目列表
 * @param answers 与 questions 等长的答案数组，'A' | 'B' | null
 */
export function calculateScores(
  questions: Question[],
  answers: Array<'A' | 'B' | null>
): DimensionScore[] {
  // 初始化每个维度的两极计数器
  const counters: Record<Pole, number> = {
    E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0,
  };

  questions.forEach((q, i) => {
    const ans = answers[i];
    if (!ans) return;
    const pole = ans === 'A' ? q.optionA.pole : q.optionB.pole;
    counters[pole] += 1;
  });

  return DIMENSIONS.map((dim) => {
    const first = counters[dim.poleA.letter];
    const second = counters[dim.poleB.letter];
    const total = first + second;
    const dominant = first >= second ? dim.poleA.letter : dim.poleB.letter;
    const dominantPercent =
      total === 0 ? 50 : Math.round((Math.max(first, second) / total) * 100);
    return {
      dimension: dim.key,
      poles: [dim.poleA.letter, dim.poleB.letter],
      first,
      second,
      dominant,
      dominantPercent,
    };
  });
}

/**
 * 根据各维度主导极点，合成 4 字母 MBTI 代码
 */
export function buildMbtiCode(scores: DimensionScore[]): string {
  return scores.map((s) => s.dominant).join('');
}
