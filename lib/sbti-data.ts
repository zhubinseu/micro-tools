/**
 * SBTI 娱乐人格测试 - 数据层
 *
 * 本测试为网友原创娱乐向测试，无任何心理学学术背书，
 * 仅用于社交玩梗、自我调侃，不可作为心理诊断、择偶、职场评判依据。
 *
 * 评分模型（与 MBTI 完全不同）：
 *   - 三选一：每题 A=3 分，B=2 分，C=1 分
 *   - 15 个维度，每维度 2 道题，总分区间 2~6
 *     · 2~3 分：低倾向
 *     · 4 分：中等倾向
 *     · 5~6 分：高倾向
 *   - 根据各维度的高/中/低倾向组合，匹配 25 种常规人格
 *   - 匹配度 < 60% → 兜底隐藏人格 HHHH 傻乐者
 *   - 附加饮酒题选 A/B → 强制覆盖为隐藏人格 DRUNK 酒鬼
 *
 * 结构对照 lib/mbti-data.ts，但类型与算法独立。
 */

// ---------------------------------------------------------------------------
// 类型定义
// ---------------------------------------------------------------------------

/** 15 个维度 key（5 大模块 × 3 维度） */
export type SbtiDimension =
  | 'S1' | 'S2' | 'S3' // 自我模型
  | 'E1' | 'E2' | 'E3' // 情感依恋
  | 'A1' | 'A2' | 'A3' // 态度观念
  | 'Ac1' | 'Ac2' | 'Ac3' // 行动驱力
  | 'So1' | 'So2' | 'So3'; // 社交人际

/** 五大模块 */
export type SbtiModule = 'S' | 'E' | 'A' | 'Ac' | 'So';

/** 维度倾向等级 */
export type TendencyLevel = 'low' | 'mid' | 'high';

/** 测试状态机阶段 */
export type SbtiStage = 'start' | 'quiz' | 'drink' | 'calculating' | 'result';

/** 单道题目（三选一） */
export interface SbtiQuestion {
  /** 题号 1-30 */
  id: number;
  /** 所属维度 */
  dimension: SbtiDimension;
  /** 所属模块 */
  module: SbtiModule;
  /** 题干文本 */
  text: string;
  /** 选项 A（3 分） */
  optionA: string;
  /** 选项 B（2 分） */
  optionB: string;
  /** 选项 C（1 分） */
  optionC: string;
}

/** 单个维度的得分结果 */
export interface SbtiDimensionScore {
  dimension: SbtiDimension;
  /** 该维度 2 道题的总分（2~6） */
  total: number;
  /** 倾向等级 */
  level: TendencyLevel;
  /** 该维度对应的题号 */
  questionIds: [number, number];
}

/** 人格匹配条件 */
export interface PersonalityCondition {
  dimension: SbtiDimension;
  level: TendencyLevel;
}

/** 27 种人格类型（25 常规 + 2 隐藏） */
export interface SbtiPersonality {
  /** 代号（如 IMSB / DEAD / DRUNK / HHHH） */
  code: string;
  /** 中文昵称 */
  nickname: string;
  /** 英文别名 */
  alias: string;
  /** 所属分组（用于结果页配色与分章） */
  group: SbtiGroup;
  /** 一句话标语 */
  tagline: string;
  /** 核心倾向解读 */
  tendency: string;
  /** 人格描述（娱乐向） */
  description: string;
  /** 匹配条件（隐藏人格可为空，由触发逻辑直接分配） */
  conditions?: PersonalityCondition[];
  /** 是否隐藏人格 */
  hidden?: boolean;
}

/** 人格分组 */
export type SbtiGroup =
  | 'self' // 自我攻击/虚无
  | 'care' // 讨好共情
  | 'rebel' // 自由反叛
  | 'driver' // 目标执行
  | 'thinker' // 低欲思考
  | 'slacker' // 拖延摆烂
  | 'mask' // 社交伪装
  | 'chill' // 松弛人缘
  | 'hidden'; // 隐藏

// ---------------------------------------------------------------------------
// 维度元数据
// ---------------------------------------------------------------------------

export interface SbtiDimensionMeta {
  key: SbtiDimension;
  module: SbtiModule;
  label: string;
  /** 高分特征描述 */
  highDesc: string;
  /** 对应题号 */
  questionIds: [number, number];
}

export const SBTI_DIMENSIONS: SbtiDimensionMeta[] = [
  // === S 自我模型 ===
  { key: 'S1', module: 'S', label: '自我否定', highDesc: '容易自责、重度内耗，总否定自己', questionIds: [1, 2] },
  { key: 'S2', module: 'S', label: '虚无悲观', highDesc: '时常觉得人生无意义，深夜emo自卑', questionIds: [3, 4] },
  { key: 'S3', module: 'S', label: '价值空虚', highDesc: '极度在意他人评价，完成目标后依旧空虚', questionIds: [27, 28] },
  // === E 情感依恋 ===
  { key: 'E1', module: 'E', label: '依恋焦虑', highDesc: '害怕被抛弃，亲密关系猜忌缺安全感', questionIds: [5, 6] },
  { key: 'E2', module: 'E', label: '情绪敏感', highDesc: '被批评难释怀，做决定反复焦虑失眠', questionIds: [7, 8] },
  { key: 'E3', module: 'E', label: '内心脆弱', highDesc: '看不清自我，被指责习惯隐忍退让', questionIds: [26, 29] },
  // === A 态度观念 ===
  { key: 'A1', module: 'A', label: '反规自由', highDesc: '反感条条框框，抗拒线下社交，随心所欲', questionIds: [9, 22] },
  { key: 'A2', module: 'A', label: '讨好共情', highDesc: '习惯性迁就他人，害怕社交尴尬', questionIds: [10, 11] },
  { key: 'A3', module: 'A', label: '情绪共感', highDesc: '共情力极强，难过独自消化不愿麻烦人', questionIds: [12, 24] },
  // === Ac 行动驱力 ===
  { key: 'Ac1', module: 'Ac', label: '重度拖延', highDesc: '无截止日期绝不行动，三分钟热度', questionIds: [13, 14] },
  { key: 'Ac2', module: 'Ac', label: '强目标感', highDesc: '做事有长期规划，心软不懂拒绝', questionIds: [15, 25] },
  { key: 'Ac3', module: 'Ac', label: '秩序控', highDesc: '计划被打乱极易烦躁，无法理解逃避冷战', questionIds: [16, 30] },
  // === So 社交人际 ===
  { key: 'So1', module: 'So', label: '社交疏离', highDesc: '排斥陌生人，热闹社交后极度疲惫', questionIds: [17, 23] },
  { key: 'So2', module: 'So', label: '亲密渴求', highDesc: '渴望深度亲密关系，他人越界强烈不适', questionIds: [18, 19] },
  { key: 'So3', module: 'So', label: '假面伪装', highDesc: '心里话很少外露，不同场合切换人设', questionIds: [20, 21] },
];

/** 模块中文名 */
export const SBTI_MODULE_LABELS: Record<SbtiModule, string> = {
  S: '自我模型',
  E: '情感依恋',
  A: '态度观念',
  Ac: '行动驱力',
  So: '社交人际',
};

// ---------------------------------------------------------------------------
// 30 道核心测试题（按题号 1-30 顺序，三选一）
// ---------------------------------------------------------------------------

export const SBTI_QUESTIONS: SbtiQuestion[] = [
  // === 模块1：S 自我模型（题 1-4, 27, 28）===
  {
    id: 1, dimension: 'S1', module: 'S',
    text: '我总觉得自己不够好，身边所有人都比我优秀',
    optionA: '确实如此', optionB: '偶尔会这么想', optionC: '完全不这么认为',
  },
  {
    id: 2, dimension: 'S1', module: 'S',
    text: '一件小事出错，我会反复在脑子里回放自责好几天',
    optionA: '经常循环内耗', optionB: '偶尔纠结', optionC: '转眼就忘',
  },
  {
    id: 3, dimension: 'S2', module: 'S',
    text: '时常突然觉得万事都很荒诞，努力和人生意义都像骗局',
    optionA: '经常陷入虚无', optionB: '偶尔感慨', optionC: '很少有这种想法',
  },
  {
    id: 4, dimension: 'S2', module: 'S',
    text: '看到自卑自嘲文案：我像阴暗老鼠，不敢爱人，羡慕别人美好生活，深夜偷偷难过',
    optionA: '我完全有这种感受', optionB: '偶尔共情', optionC: '我绝不认同',
  },
  // === 模块2：E 情感依恋（题 5-8）===
  {
    id: 5, dimension: 'E1', module: 'E',
    text: '伴侣超过5小时不回消息，借口身体不舒服，我会下意识怀疑对方撒谎隐瞒',
    optionA: '第一反应猜忌', optionB: '半信半疑', optionC: '完全信任不多想',
  },
  {
    id: 6, dimension: 'E1', module: 'E',
    text: '亲密关系里我总害怕被抛弃，频繁焦虑对方会离开我',
    optionA: '极度不安', optionB: '偶尔担心', optionC: '毫无顾虑',
  },
  {
    id: 7, dimension: 'E2', module: 'E',
    text: '别人批评、否定我之后，我很久走不出来，心里难受很久',
    optionA: '很难释怀', optionB: '缓半天就好', optionC: '完全不在意',
  },
  {
    id: 8, dimension: 'E2', module: 'E',
    text: '做重大决定后，夜里反复失眠怀疑自己选错了',
    optionA: '长期纠结内耗', optionB: '短暂犹豫', optionC: '做完决定不回头',
  },
  // === 模块3：A 态度观念（题 9-12）===
  {
    id: 9, dimension: 'A1', module: 'A',
    text: '我不喜欢被条条框框束缚，偏爱打破常规、随心所欲',
    optionA: '讨厌约束爱自由', optionB: '看情况遵守', optionC: '习惯服从规则',
  },
  {
    id: 10, dimension: 'A2', module: 'A',
    text: '明明察觉到别人不喜欢我，还是下意识讨好、想要获得对方认可',
    optionA: '习惯性讨好', optionB: '偶尔妥协', optionC: '不会刻意迎合',
  },
  {
    id: 11, dimension: 'A2', module: 'A',
    text: '朋友和我观点冲突时，我宁愿退让改变自己，也不想气氛尴尬',
    optionA: '优先迁就他人', optionB: '适度沟通', optionC: '坚持自身想法',
  },
  {
    id: 12, dimension: 'A3', module: 'A',
    text: '看到别人难过委屈，我会跟着共情，情绪被轻易带着走',
    optionA: '共情力极强', optionB: '轻微共情', optionC: '很难共情他人情绪',
  },
  // === 模块4：Ac 行动驱力（题 13-16）===
  {
    id: 13, dimension: 'Ac1', module: 'Ac',
    text: '没有截止日期逼迫，很多事我会一辈子拖着不去做',
    optionA: '重度拖延', optionB: '偶尔拖延', optionC: '主动自律完成',
  },
  {
    id: 14, dimension: 'Ac1', module: 'Ac',
    text: '我很喜欢做全新计划、重新开始的新鲜感，但坚持两三天就彻底摆烂',
    optionA: '典型三分钟热度', optionB: '偶尔半途而废', optionC: '能长期坚持计划',
  },
  {
    id: 15, dimension: 'Ac2', module: 'Ac',
    text: '我做事有清晰目标，不会浑浑噩噩混日子',
    optionA: '目标感极强', optionB: '走一步看一步', optionC: '完全没有规划',
  },
  {
    id: 16, dimension: 'Ac3', module: 'Ac',
    text: '我会提前做好完整计划，极度反感计划被突发事情打乱',
    optionA: '讨厌计划变动', optionB: '能接受小幅调整', optionC: '完全无所谓随性',
  },
  // === 模块5：So 社交人际（题 17-26）===
  {
    id: 17, dimension: 'So1', module: 'So',
    text: '陌生人、朋友的朋友靠近我，我会本能保持距离，不想过度亲近',
    optionA: '天然排斥不熟的人', optionB: '随缘相处', optionC: '主动热情接纳',
  },
  {
    id: 18, dimension: 'So2', module: 'So',
    text: '我渴望和信任的人极度亲密，亲近到像家人一样毫无隔阂',
    optionA: '极度渴求深度亲密', optionB: '适度亲密即可', optionC: '喜欢保持距离',
  },
  {
    id: 19, dimension: 'So2', module: 'So',
    text: '和人相处自带电子围栏，别人靠太近我会本能抗拒、不舒服',
    optionA: '边界感极强', optionB: '分人区分', optionC: '不介意别人靠近',
  },
  {
    id: 20, dimension: 'So3', module: 'So',
    text: '我心里有负面、尖锐想法，大多碍于情面不会直白说出口',
    optionA: '习惯性藏心里话', optionB: '看场合发言', optionC: '有话直说不隐忍',
  },
  {
    id: 21, dimension: 'So3', module: 'So',
    text: '我在不同圈子、不同人面前，会切换完全不一样的性格和处事方式',
    optionA: '擅长伪装切换人设', optionB: '轻微改变', optionC: '始终表里如一',
  },
  {
    id: 22, dimension: 'A1', module: 'A',
    text: '线下网友见面，我会紧张不安、打心底抗拒赴约',
    optionA: '极度害怕线下见面', optionB: '有点紧张', optionC: '期待线下见面',
  },
  {
    id: 23, dimension: 'So1', module: 'So',
    text: '多人聚会、热闹社交后，我会精力耗尽，急需独处回血',
    optionA: '社交严重消耗我', optionB: '好坏对半', optionC: '越热闹越兴奋',
  },
  {
    id: 24, dimension: 'A3', module: 'A',
    text: '心情不好时，我习惯独自消化，不会找人倾诉诉苦',
    optionA: '全部自己扛', optionB: '偶尔找人倾诉', optionC: '第一时间找人吐槽',
  },
  {
    id: 25, dimension: 'Ac2', module: 'Ac',
    text: '面对别人主动求助，我很难开口拒绝，容易默默付出消耗自己',
    optionA: '不懂拒绝老好人', optionB: '酌情帮忙', optionC: '不合适直接拒绝',
  },
  {
    id: 26, dimension: 'E3', module: 'E',
    text: '我很难完全看懂真实的自己，经常搞不清自己想要什么',
    optionA: '自我认知模糊', optionB: '大致了解自己', optionC: '十分清楚自身需求',
  },
  // === 回到 S 模块（题 27, 28）===
  {
    id: 27, dimension: 'S3', module: 'S',
    text: '外人对我的评价、闲言碎语，会严重影响我的心情',
    optionA: '非常在意他人看法', optionB: '少量在意', optionC: '别人评价与我无关',
  },
  {
    id: 28, dimension: 'S3', module: 'S',
    text: '达成目标后，我经常瞬间空虚，觉得"也就这样"没有成就感',
    optionA: '经常空虚失落', optionB: '短暂开心后平淡', optionC: '会持续获得满足感',
  },
  // === 收尾（题 29, 30）===
  {
    id: 29, dimension: 'E3', module: 'E',
    text: '别人当众指出我的错误，我不会当场反驳，选择沉默退让',
    optionA: '习惯隐忍不反驳', optionB: '委婉解释', optionC: '当场据理力争',
  },
  {
    id: 30, dimension: 'Ac3', module: 'Ac',
    text: '我很难理解吵架、矛盾时第一反应逃避、冷战的人',
    optionA: '完全无法理解', optionB: '能懂一点', optionC: '我自己也会逃避冲突',
  },
];

// ---------------------------------------------------------------------------
// 附加饮酒题（不计入 30 题，触发隐藏人格）
// ---------------------------------------------------------------------------

export const DRINK_QUESTION = {
  text: '你平时有喝酒的习惯吗？',
  optionA: '经常喝酒',
  optionB: '偶尔小酌',
  optionC: '几乎不喝',
} as const;

// ---------------------------------------------------------------------------
// 27 种人格（25 常规 + 2 隐藏）
// ---------------------------------------------------------------------------

export const SBTI_PERSONALITIES: SbtiPersonality[] = [
  // === （一）高自我否定/虚无 S 维度高分 ===
  {
    code: 'IMSB', nickname: '自我攻击者', alias: 'The Self-Attacker', group: 'self',
    tagline: '深夜两点的脑内审判庭，永远在给自己定罪',
    tendency: 'S1、S2 双高，情绪敏感，轻度讨好，长期自我攻击内耗',
    description: '你是行走的"自我审判机器"——别人一句无心的话，能在你脑子里循环播放三天三夜。你不是不努力，是努力完了还要质问自己"是不是还不够好"。建议把内耗的电量分一点给发呆，世界不会因此崩塌。',
    conditions: [
      { dimension: 'S1', level: 'high' },
      { dimension: 'S2', level: 'high' },
      { dimension: 'E2', level: 'high' },
    ],
  },
  {
    code: 'DEAD', nickname: '死者', alias: 'The Departed', group: 'self',
    tagline: '全方位精神枯竭，活着但已经不太想动',
    tendency: 'S 全维度高分，重度拖延 + 社交疏离，精神电量长期 1%',
    description: '你不是死了，你只是"在线但隐身"。该吃吃该睡睡，但灵魂已经下线。社交能量条永远红的，计划本永远停在第一页。别勉强自己复活，先躺平充会儿电——记得翻身。',
    conditions: [
      { dimension: 'S1', level: 'high' },
      { dimension: 'S2', level: 'high' },
      { dimension: 'S3', level: 'high' },
      { dimension: 'Ac1', level: 'high' },
      { dimension: 'So1', level: 'high' },
    ],
  },
  {
    code: 'IMFW', nickname: '易碎信徒', alias: 'The Fragile Believer', group: 'self',
    tagline: '渴望拥抱又怕被碰碎，把自己活成玻璃信徒',
    tendency: 'S3 价值空虚 + E3 内心脆弱，渴望亲密但极度害怕受伤',
    description: '你想要有人懂你，又害怕对方靠太近。每段关系开始前你已经在预演失去。你不是冷漠，你是太脆了，所以干脆把自己包成防震快递。建议偶尔拆包装，世界没你想的那么暴力。',
    conditions: [
      { dimension: 'S3', level: 'high' },
      { dimension: 'E3', level: 'high' },
      { dimension: 'So2', level: 'high' },
    ],
  },
  // === （二）高讨好共情 A2、A3 高分 ===
  {
    code: 'ATM-er', nickname: '送钱者', alias: 'The ATM', group: 'care',
    tagline: '行走的提款机，不会拒绝是出厂设置',
    tendency: 'A2 拉满 + Ac2 高分，不懂拒绝，无社交边界，习惯性付出消耗自己',
    description: '你是朋友圈里的"人形ATM"——不是钱，是情绪和精力的ATM。谁开口你都答应，谁麻烦你都接，最后自己透支还得装没事。建议在胸口贴一张"今日额度已满"的告示。',
    conditions: [
      { dimension: 'A2', level: 'high' },
      { dimension: 'Ac2', level: 'high' },
      { dimension: 'A3', level: 'high' },
    ],
  },
  {
    code: 'MUM', nickname: '妈妈型', alias: 'The Mum', group: 'care',
    tagline: '操碎了所有人的心，唯独忘了自己',
    tendency: '共情能力极强，下意识照顾所有人情绪',
    description: '你看到朋友没吃饭比自己饿还难受，听到别人叹气就开始盘算怎么帮。你不是妈，你是妈的加强版。记得偶尔当一回孩子，让别人也照顾照顾你。',
    conditions: [
      { dimension: 'A3', level: 'high' },
      { dimension: 'E2', level: 'high' },
      { dimension: 'A2', level: 'mid' },
    ],
  },
  {
    code: 'LOVE-R', nickname: '多情者', alias: 'The Lover', group: 'care',
    tagline: '心动是常态，深情是常态，扎心也是常态',
    tendency: '极度渴求深度亲密，极易共情他人悲欢',
    description: '你谈的不是恋爱，是"灵魂共振工程"。一句晚安能脑补一整部偶像剧，一个眼神能写三千字小作文。你的多情是天赋也是诅咒，建议给心上装个阀门。',
    conditions: [
      { dimension: 'So2', level: 'high' },
      { dimension: 'A3', level: 'high' },
      { dimension: 'E1', level: 'high' },
    ],
  },
  // === （三）高自由反叛 A1 高分 ===
  {
    code: 'FU?K', nickname: '不羁者', alias: 'The Untamed', group: 'rebel',
    tagline: '规矩是给别人定的，我只服我自己',
    tendency: '厌恶规则束缚，抗拒社交，从不迁就他人',
    description: '你是行走的"我不"——别人约你，你不；别人建议，你不；连你自己定的计划，你也"不"。你的自由是真的，孤独也是真的。建议偶尔让一让，世界不会因为你妥协一次就塌。',
    conditions: [
      { dimension: 'A1', level: 'high' },
      { dimension: 'So1', level: 'high' },
      { dimension: 'A2', level: 'low' },
    ],
  },
  {
    code: 'SHIT', nickname: '愤世者', alias: 'The Cynic', group: 'rebel',
    tagline: '嘴上骂骂咧咧，心里其实很在乎',
    tendency: '内心尖锐直白，看不惯世俗，嘴硬心软',
    description: '你是嘴替界的劳模——朋友圈里那些"说得对但不敢转发"的话都出自你。你看起来刀枪不入，其实看到老人过马路还是会扶。你的愤世是保护色，柔软才是底色。',
    conditions: [
      { dimension: 'S2', level: 'high' },
      { dimension: 'A1', level: 'high' },
      { dimension: 'So3', level: 'mid' },
    ],
  },
  {
    code: 'WOC!', nickname: '握草人', alias: 'The WTF', group: 'rebel',
    tagline: '情绪外放直白，吐槽永动机',
    tendency: '情绪外放直白，反感刻板规矩，容易吐槽暴躁',
    description: '你是行走的弹幕——任何场景都能即时输出"卧槽""离谱""绝了"。你的反应永远比脑子快三秒，事后回想常常想找个地缝。但你真实得可爱，至少没人需要猜你在想什么。',
    conditions: [
      { dimension: 'A1', level: 'high' },
      { dimension: 'E2', level: 'low' },
      { dimension: 'Ac3', level: 'low' },
    ],
  },
  // === （四）强目标执行力 Ac2、Ac3 高分 ===
  {
    code: 'BOSS', nickname: '领导者', alias: 'The Boss', group: 'driver',
    tagline: '目标感拉满，开会都自带BGM',
    tendency: '目标感拉满，喜欢规划、掌控全局',
    description: '你是行走的OKR——连周末早餐都要列三档备选方案。你不是控制狂，你只是相信"不打无准备的仗"。建议偶尔允许计划跑偏，惊喜往往藏在偏差里。',
    conditions: [
      { dimension: 'Ac2', level: 'high' },
      { dimension: 'Ac3', level: 'high' },
      { dimension: 'Ac1', level: 'low' },
    ],
  },
  {
    code: 'CTRL', nickname: '拿捏者', alias: 'The Manipulator', group: 'driver',
    tagline: '看人比看书准，社交场上的隐形导演',
    tendency: '擅长洞察人心，社交游刃有余，擅长把控人际关系',
    description: '你是人形读心术——谁不开心、谁在装、谁想被夸，你一眼就读出来。你能在饭局上同时照顾六个人的情绪，还能不动声色推进自己的目的。技能点满，但记得别把自己也算计进去。',
    conditions: [
      { dimension: 'Ac2', level: 'high' },
      { dimension: 'So3', level: 'high' },
      { dimension: 'A3', level: 'mid' },
    ],
  },
  {
    code: 'GOGO', nickname: '行者', alias: 'The Goer', group: 'driver',
    tagline: '想到就做，做完就撤，绝不拖堂',
    tendency: '自律不拖延，行动力强，想到就做',
    description: '你是行走的"已完成"——别人的To-Do列表还在P0，你已经划掉三行了。你不理解为什么有人能拖到deadline前夜，也不理解"再想想"。建议偶尔停下来想想，路上的风景也不错。',
    conditions: [
      { dimension: 'Ac1', level: 'low' },
      { dimension: 'Ac2', level: 'high' },
      { dimension: 'Ac3', level: 'mid' },
    ],
  },
  // === （五）深度低欲望思考 S2 高、Ac 低分 ===
  {
    code: 'THIN-K', nickname: '思考者', alias: 'The Thinker', group: 'thinker',
    tagline: '脑内小剧场24小时不间断，但身体在罢工',
    tendency: '爱胡思乱想，重度拖延，回避热闹社交',
    description: '你是思想界的劳模、行动界的失踪人口。脑子里已经推演完宇宙起源，身体却还在床上没起来。你的深度是天赋，但深度没有产出就只是内耗。建议把想法写下来，哪怕一行。',
    conditions: [
      { dimension: 'S2', level: 'high' },
      { dimension: 'Ac1', level: 'high' },
      { dimension: 'So1', level: 'high' },
    ],
  },
  {
    code: 'MONK', nickname: '僧人', alias: 'The Monk', group: 'thinker',
    tagline: '低欲望佛系，看淡一切包括自己',
    tendency: '低欲望佛系，虚无感中等，不争不抢',
    description: '你已经提前进入"出家预备役"——升职加薪？随缘。恋爱脱单？随缘。今晚吃啥？都行。你的佛系是真的，但偶尔也要提防是真的看破还是真的摆烂。',
    conditions: [
      { dimension: 'S2', level: 'mid' },
      { dimension: 'Ac1', level: 'high' },
      { dimension: 'Ac2', level: 'low' },
    ],
  },
  // === （六）重度拖延摆烂 Ac1 高分 ===
  {
    code: 'MALO', nickname: '吗喽', alias: 'The Macaque', group: 'slacker',
    tagline: '全维度均衡偏低，摆烂界的端水大师',
    tendency: '全维度均衡偏低，摆烂躺平，无欲无求',
    description: '你是吗喽本喽——什么都不突出，什么都不垫底，主打一个"均匀地摆"。你的快乐是真的，因为你对啥都没期待。继续保持，但记得偶尔抬头看看路。',
    conditions: [
      { dimension: 'S1', level: 'low' },
      { dimension: 'Ac2', level: 'low' },
      { dimension: 'So2', level: 'low' },
      { dimension: 'E2', level: 'low' },
    ],
  },
  {
    code: 'ZZZZ', nickname: '嗜睡摆烂人', alias: 'The Sleeper', group: 'slacker',
    tagline: '床是第一生产力，枕头是最佳搭档',
    tendency: '重度拖延，社交耗能，只想躺平休息',
    description: '你的理想生活是"睡到自然醒，醒着想睡回"。社交是耗电，工作是耗电，连思考都耗电。建议给自己设个最低活动量，不然真的会退化成植物。',
    conditions: [
      { dimension: 'Ac1', level: 'high' },
      { dimension: 'So1', level: 'high' },
      { dimension: 'Ac2', level: 'low' },
    ],
  },
  {
    code: 'GIGILORD', nickname: '摆烂领主', alias: 'The Slacker Lord', group: 'slacker',
    tagline: '摆烂天花板，看淡一切包括摆烂本身',
    tendency: '摆烂天花板，无任何规划，看淡一切',
    description: '你不是在摆烂，你是在"躺平即正义"的修行。其他摆烂人还在找借口，你已经连借口都不找了。你是摆烂界的祖师爷，建议收徒开课，广渡众生。',
    conditions: [
      { dimension: 'Ac1', level: 'high' },
      { dimension: 'Ac2', level: 'low' },
      { dimension: 'Ac3', level: 'low' },
    ],
  },
  // === （七）社交伪装、疏离 So3、So1 高分 ===
  {
    code: 'FAKE', nickname: '伪人', alias: 'The Fake', group: 'mask',
    tagline: '人设切换比换衣服还快，自己都分不清哪个是真的',
    tendency: '多面人设，外在表现与内心反差巨大',
    description: '你是行走的"社交变声器"——同事面前一个样，家人面前一个样，网友面前又一个样。这不是虚伪，这是生存技能。但记得找个地方卸妆，不然真忘了自己长啥样。',
    conditions: [
      { dimension: 'So3', level: 'high' },
      { dimension: 'E2', level: 'low' },
      { dimension: 'So1', level: 'mid' },
    ],
  },
  {
    code: 'SOLO', nickname: '孤儿', alias: 'The Loner', group: 'mask',
    tagline: '社交能量条出厂就低，独处是唯一充电口',
    tendency: '社交疏离，遇事独自扛，很少找人倾诉',
    description: '你不是没朋友，你是"一个人待着更舒服"。朋友约你内心抗拒，朋友不约你又有点落寞。建议培养一两个能"不说话也不尴尬"的关系，比硬凑热闹强。',
    conditions: [
      { dimension: 'So1', level: 'high' },
      { dimension: 'A3', level: 'high' },
      { dimension: 'So2', level: 'low' },
    ],
  },
  {
    code: 'JOKE-R', nickname: '小丑', alias: 'The Joker', group: 'mask',
    tagline: '人前笑料担当，人后 emo 担当',
    tendency: '人前搞笑开朗，独处空虚压抑，隐藏负面情绪',
    description: '你是朋友圈的开心果，也是深夜的朋友圈访客。你的搞笑是真的，emo 也是真的。建议别把所有负面都藏进段子里，偶尔认真说一次"我不太行"，没人会笑你。',
    conditions: [
      { dimension: 'So3', level: 'high' },
      { dimension: 'S3', level: 'high' },
      { dimension: 'S2', level: 'mid' },
    ],
  },
  // === （八）松弛人缘型 E 低分、So2 中等偏高 ===
  {
    code: 'SEXY', nickname: '尤物', alias: 'The Charmer', group: 'chill',
    tagline: '不刻意却自带磁场，亲和力是出厂配置',
    tendency: '共情适度，擅长拉近人际关系，自带亲和力魅力',
    description: '你不是在撩人，你只是"让人舒服"。别人和你聊天像泡温泉，不费力还放松。你的魅力不靠颜值靠频率，建议多出门，世界需要你的温度。',
    conditions: [
      { dimension: 'So2', level: 'mid' },
      { dimension: 'E1', level: 'low' },
      { dimension: 'E2', level: 'low' },
      { dimension: 'A3', level: 'mid' },
    ],
  },
  {
    code: 'OJBK', nickname: '无所谓人', alias: 'The Whatever', group: 'chill',
    tagline: '内耗绝缘体，松弛感天花板',
    tendency: '几乎无内耗，看淡他人评价，心态松弛',
    description: '你是行走的"OK"——别人在纠结，你在"都行"；别人在焦虑，你在"没事"。你的松弛是真的，但偶尔也要警惕是不是麻木。该在意的还是要在意一点。',
    conditions: [
      { dimension: 'S1', level: 'low' },
      { dimension: 'S3', level: 'low' },
      { dimension: 'E2', level: 'low' },
    ],
  },
  {
    code: 'OH-NO!', nickname: '哦不人', alias: 'The Oh-No', group: 'chill',
    tagline: '焦虑发作三秒就过，emo 永远是限定款',
    tendency: '容易为小事焦虑，但不会长期陷在内耗里',
    description: '你是"三秒焦虑选手"——刚"完了完了"完，下一秒"哦没事了"。你的情绪来得快走得也快，是健康的轻度神经质。建议把这个技能传授给内耗星人，造福人类。',
    conditions: [
      { dimension: 'E2', level: 'mid' },
      { dimension: 'S3', level: 'low' },
    ],
  },
  {
    code: 'POOR', nickname: '贫困者', alias: 'The Self-Deprecator', group: 'chill',
    tagline: '自我贬低是社交开场白，讨好是默认模式',
    tendency: '深层自卑，习惯性自我贬低，讨好型人格',
    description: '你开口第一句永远是"我不行""我太菜了"——但下一秒又默默把事做完了。你的自卑是习惯，不是事实。建议把"我不行"改成"我试试"，世界会温柔很多。',
    conditions: [
      { dimension: 'S1', level: 'high' },
      { dimension: 'A2', level: 'high' },
      { dimension: 'S3', level: 'mid' },
    ],
  },
  {
    code: 'THAN-K', nickname: '感恩者', alias: 'The Thankful', group: 'chill',
    tagline: '温柔共情 + 容易知足，内耗界的稀有种',
    tendency: '温柔共情，容易知足，极少陷入自我内耗',
    description: '你是朋友圈的"小太阳"——别人emo找你，你不emo也不嫌烦。你能在小事里找到快乐，一顿好饭、一句关心都能让你满足。建议保护好自己，别被吸血鬼朋友吸干。',
    conditions: [
      { dimension: 'A3', level: 'high' },
      { dimension: 'S1', level: 'low' },
      { dimension: 'S3', level: 'low' },
    ],
  },
  // === 两款特殊隐藏人格 ===
  {
    code: 'DRUNK', nickname: '酒鬼', alias: 'The Drunk', group: 'hidden', hidden: true,
    tagline: '酒精解锁的人格分支，清醒时根本不认识',
    tendency: '饮酒触发，虚无悲观 + 重度摆烂双重倾向',
    description: '恭喜（？）你触发了隐藏人格——DRUNK 酒鬼。清醒时的你是另一个人，酒后才是真正的"你"。建议：少喝点，多喝水。世界不会因为你不喝酒就变差，但你的肝会感谢你。',
  },
  {
    code: 'HHHH', nickname: '傻乐者', alias: 'The Happy Fool', group: 'hidden', hidden: true,
    tagline: '所有维度无突出高分，快乐才是出厂设置',
    tendency: '兜底人格，匹配度过低自动分配',
    description: '恭喜你触发了隐藏人格——HHHH 傻乐者。你既不深度内耗，也不重度摆烂，所有维度都平平无奇，反而成了最稀有的"快乐绝缘体"。建议继续保持，世界需要你这样的正常人。',
  },
];

/** 分组中文名 */
export const SBTI_GROUP_LABELS: Record<SbtiGroup, string> = {
  self: '自我攻击系',
  care: '讨好共情系',
  rebel: '自由反叛系',
  driver: '目标执行系',
  thinker: '低欲思考系',
  slacker: '拖延摆烂系',
  mask: '社交伪装系',
  chill: '松弛人缘系',
  hidden: '隐藏人格',
};

/** 分组主题色（Tailwind 类名片段） */
export const SBTI_GROUP_COLORS: Record<SbtiGroup, string> = {
  self: 'rose',
  care: 'emerald',
  rebel: 'amber',
  driver: 'sky',
  thinker: 'violet',
  slacker: 'slate',
  mask: 'fuchsia',
  chill: 'teal',
  hidden: 'orange',
};

// ---------------------------------------------------------------------------
// 评分引擎
// ---------------------------------------------------------------------------

/** 选项 → 分数映射 */
const OPTION_SCORE: Record<'A' | 'B' | 'C', number> = { A: 3, B: 2, C: 1 };

/** 根据总分判定维度倾向等级 */
function levelFromScore(score: number): TendencyLevel {
  if (score >= 5) return 'high';
  if (score === 4) return 'mid';
  return 'low'; // 2~3
}

/**
 * 计算 15 个维度的得分
 * @param answers 长度 30 的答案数组，'A' | 'B' | 'C' | null
 */
export function calculateSbtiScores(
  answers: Array<'A' | 'B' | 'C' | null>
): SbtiDimensionScore[] {
  const scoreByQuestion: Record<number, number> = {};
  SBTI_QUESTIONS.forEach((q) => {
    const ans = answers[q.id - 1]; // 题号从1开始，数组从0开始
    scoreByQuestion[q.id] = ans ? OPTION_SCORE[ans] : 0;
  });

  return SBTI_DIMENSIONS.map((dim) => {
    const [id1, id2] = dim.questionIds;
    const total = (scoreByQuestion[id1] ?? 0) + (scoreByQuestion[id2] ?? 0);
    return {
      dimension: dim.key,
      total,
      level: levelFromScore(total),
      questionIds: dim.questionIds,
    };
  });
}

/** 单个人格的匹配度（0~1） */
function matchPersonality(
  personality: SbtiPersonality,
  scores: SbtiDimensionScore[]
): number {
  if (!personality.conditions || personality.conditions.length === 0) return 0;
  const scoreMap = new Map(scores.map((s) => [s.dimension, s.level]));
  let matched = 0;
  for (const cond of personality.conditions) {
    if (scoreMap.get(cond.dimension) === cond.level) matched++;
  }
  return matched / personality.conditions.length;
}

/** 匹配结果 */
export interface SbtiMatchResult {
  /** 最终主人格 */
  personality: SbtiPersonality;
  /** 主人格匹配度（0~1） */
  matchRate: number;
  /** 是否隐藏人格（DRUNK/HHHH） */
  isHidden: boolean;
  /** 触发原因 */
  reason: 'matched' | 'drink' | 'fallback';
  /** 前 3 候选人格（仅 reason=matched 时有意义） */
  topCandidates?: Array<{ personality: SbtiPersonality; matchRate: number }>;
}

/**
 * 完整匹配逻辑
 * @param scores 维度得分
 * @param drinkAnswer 饮酒题答案（'A'|'B'|'C'|null）
 */
export function matchSbtiPersonality(
  scores: SbtiDimensionScore[],
  drinkAnswer: 'A' | 'B' | 'C' | null
): SbtiMatchResult {
  // 1. 饮酒题触发 → 强制 DRUNK
  if (drinkAnswer === 'A' || drinkAnswer === 'B') {
    const drunk = SBTI_PERSONALITIES.find((p) => p.code === 'DRUNK')!;
    return {
      personality: drunk,
      matchRate: 1,
      isHidden: true,
      reason: 'drink',
    };
  }

  // 2. 计算 25 种常规人格的匹配度
  const regular = SBTI_PERSONALITIES.filter((p) => !p.hidden);
  const ranked = regular
    .map((p) => ({ personality: p, matchRate: matchPersonality(p, scores) }))
    .sort((a, b) => b.matchRate - a.matchRate);

  const best = ranked[0];

  // 3. 匹配度 < 60% → 兜底 HHHH
  if (!best || best.matchRate < 0.6) {
    const hhhh = SBTI_PERSONALITIES.find((p) => p.code === 'HHHH')!;
    return {
      personality: hhhh,
      matchRate: 0,
      isHidden: true,
      reason: 'fallback',
      topCandidates: ranked.slice(0, 3),
    };
  }

  return {
    personality: best.personality,
    matchRate: best.matchRate,
    isHidden: false,
    reason: 'matched',
    topCandidates: ranked.slice(0, 3),
  };
}
