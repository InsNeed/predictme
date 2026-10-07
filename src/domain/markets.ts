// 抽样参数是粗略设定，用来铺开人群，不是任何国家的统计数据。
export interface Country {
  id: string;
  name: string;
  group: string;
  domestic: boolean;
  currency: string;
  fx: number; // 1 单位当地货币约合多少人民币
  lang: string;
  medianIncome: number; // 当地货币，月
  tiers: [string, number, number][]; // 名称、权重、收入倍数
  surnames: string[];
  male: string[];
  female: string[];
  pay: string;
  diaspora: number; // 被抽到的人是华人的概率
  defaultWeight: number;
  nameOrder: 'family-first' | 'given-first';
}

const westTiers: [string, number, number][] = [
  ['大城市', 40, 1.3],
  ['中小城市', 35, 1.0],
  ['郊区小镇', 18, 0.85],
  ['乡村', 7, 0.7],
];

export const COUNTRIES: Country[] = [
  {
    id: 'CN', name: '中国大陆', group: '中国大陆', domestic: true, currency: 'CNY', fx: 1, lang: '简体中文', medianIncome: 4200,
    tiers: [['一线城市', 12, 2.0], ['新一线城市', 18, 1.5], ['二线城市', 18, 1.2], ['三四线城市', 22, 0.9], ['县城', 16, 0.7], ['农村', 14, 0.45]],
    surnames: ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗'],
    male: ['伟', '浩然', '子轩', '建国', '俊杰', '志强', '宇航', '明', '磊', '思远', '海波', '国平', '晨阳', '一鸣', '家豪'],
    female: ['芳', '欣怡', '静', '婷婷', '雨桐', '秀英', '佳琪', '丽娟', '梦瑶', '晓雯', '诗涵', '桂兰', '雪', '可馨', '慧敏'],
    pay: '微信支付、支付宝', diaspora: 0, defaultWeight: 70, nameOrder: 'family-first',
  },
  {
    id: 'HK', name: '中国香港', group: '港澳台', domestic: false, currency: 'HKD', fx: 0.92, lang: '粤语/繁体中文', medianIncome: 20000,
    tiers: [['港岛/九龙', 55, 1.15], ['新界', 45, 0.9]],
    surnames: ['陳', '李', '黃', '張', '梁', '林', '何', '吳'], male: ['家明', '志偉', '俊傑', '浩賢', '子健'], female: ['嘉欣', '詠詩', '美玲', '凱琳', '曉彤'],
    pay: '八达通、信用卡、Apple Pay', diaspora: 1, defaultWeight: 3, nameOrder: 'family-first',
  },
  {
    id: 'TW', name: '中国台湾', group: '港澳台', domestic: false, currency: 'TWD', fx: 0.22, lang: '繁体中文', medianIncome: 42000,
    tiers: [['台北/新北', 40, 1.2], ['其他都会区', 40, 1.0], ['县市乡镇', 20, 0.8]],
    surnames: ['陳', '林', '黃', '張', '李', '王', '吳', '劉'], male: ['冠宇', '承恩', '柏翰', '家豪', '志明'], female: ['怡君', '雅婷', '佳穎', '宜蓁', '欣妤'],
    pay: '信用卡、LINE Pay、街口支付', diaspora: 1, defaultWeight: 3, nameOrder: 'family-first',
  },
  {
    id: 'US', name: '美国', group: '北美', domestic: false, currency: 'USD', fx: 7.1, lang: '英语', medianIncome: 4600, tiers: westTiers,
    surnames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Garcia', 'Miller', 'Davis', 'Martinez', 'Lee', 'Nguyen', 'Patel', 'Wilson'],
    male: ['James', 'Michael', 'David', 'Jose', 'Tyler', 'Brandon', 'Kevin', 'Robert', 'Ethan', 'Jamal'],
    female: ['Emily', 'Jessica', 'Ashley', 'Maria', 'Sarah', 'Linda', 'Hannah', 'Brianna', 'Megan', 'Keisha'],
    pay: '信用卡、Apple Pay、PayPal', diaspora: 0.06, defaultWeight: 6, nameOrder: 'given-first',
  },
  {
    id: 'CA', name: '加拿大', group: '北美', domestic: false, currency: 'CAD', fx: 5.2, lang: '英语/法语', medianIncome: 4600, tiers: westTiers,
    surnames: ['Tremblay', 'Smith', 'Roy', 'Wilson', 'MacDonald', 'Wong', 'Singh', 'Gagnon'], male: ['Liam', 'Noah', 'Mathieu', 'Ryan', 'Arjun'], female: ['Olivia', 'Chloé', 'Emma', 'Priya', 'Sophie'],
    pay: '信用卡、Interac、Apple Pay', diaspora: 0.08, defaultWeight: 1, nameOrder: 'given-first',
  },
  {
    id: 'GB', name: '英国', group: '欧洲', domestic: false, currency: 'GBP', fx: 9.0, lang: '英语', medianIncome: 2500, tiers: westTiers,
    surnames: ['Smith', 'Jones', 'Taylor', 'Brown', 'Evans', 'Khan', 'Wilson', 'Thomas'], male: ['Oliver', 'Harry', 'George', 'Mohammed', 'Jack'], female: ['Amelia', 'Isla', 'Grace', 'Chloe', 'Aisha'],
    pay: '借记卡、Apple Pay、PayPal', diaspora: 0.02, defaultWeight: 2, nameOrder: 'given-first',
  },
  {
    id: 'DE', name: '德国', group: '欧洲', domestic: false, currency: 'EUR', fx: 7.7, lang: '德语', medianIncome: 2900, tiers: westTiers,
    surnames: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Wagner', 'Yilmaz', 'Becker'], male: ['Lukas', 'Jonas', 'Felix', 'Thomas', 'Mehmet'], female: ['Anna', 'Lea', 'Sabine', 'Laura', 'Elif'],
    pay: 'EC 卡、PayPal、银行转账', diaspora: 0.01, defaultWeight: 1, nameOrder: 'given-first',
  },
  {
    id: 'FR', name: '法国', group: '欧洲', domestic: false, currency: 'EUR', fx: 7.7, lang: '法语', medianIncome: 2300, tiers: westTiers,
    surnames: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Petit', 'Benali', 'Moreau'], male: ['Lucas', 'Hugo', 'Louis', 'Karim', 'Nicolas'], female: ['Camille', 'Léa', 'Manon', 'Inès', 'Julie'],
    pay: '银行卡、Apple Pay、PayPal', diaspora: 0.01, defaultWeight: 1, nameOrder: 'given-first',
  },
  {
    id: 'JP', name: '日本', group: '东亚', domestic: false, currency: 'JPY', fx: 0.048, lang: '日语', medianIncome: 280000,
    tiers: [['东京圈', 30, 1.25], ['大阪/名古屋等都市', 30, 1.05], ['地方城市', 30, 0.9], ['乡村', 10, 0.75]],
    surnames: ['佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村'], male: ['翔太', '大輔', '健', '蓮', '拓也'], female: ['陽菜', '美咲', '由美', '結衣', '恵'],
    pay: '信用卡、PayPay、Suica', diaspora: 0.01, defaultWeight: 3, nameOrder: 'family-first',
  },
  {
    id: 'KR', name: '韩国', group: '东亚', domestic: false, currency: 'KRW', fx: 0.0052, lang: '韩语', medianIncome: 3100000,
    tiers: [['首尔都市圈', 50, 1.2], ['广域市', 30, 0.95], ['地方', 20, 0.8]],
    surnames: ['김', '이', '박', '최', '정', '강', '조', '윤'], male: ['민준', '서준', '도윤', '현우', '지훈'], female: ['서연', '지우', '하은', '민지', '수빈'],
    pay: 'KakaoPay、Naver Pay、信用卡', diaspora: 0.01, defaultWeight: 2, nameOrder: 'family-first',
  },
  {
    id: 'SG', name: '新加坡', group: '东南亚', domestic: false, currency: 'SGD', fx: 5.3, lang: '英语/华语', medianIncome: 5200,
    tiers: [['组屋区', 78, 0.95], ['私宅区', 22, 1.6]],
    surnames: ['Tan', 'Lim', 'Lee', 'Ng', 'Wong', 'Kumar', 'Abdullah', 'Goh'], male: ['Wei Jie', 'Jun Hao', 'Ravi', 'Hafiz', 'Marcus'], female: ['Hui Min', 'Xin Yi', 'Priya', 'Nur Aisyah', 'Rachel'],
    pay: 'PayNow、GrabPay、信用卡', diaspora: 0.74, defaultWeight: 1, nameOrder: 'given-first',
  },
  {
    id: 'ID', name: '印度尼西亚', group: '东南亚', domestic: false, currency: 'IDR', fx: 0.00045, lang: '印尼语', medianIncome: 4200000,
    tiers: [['雅加达等大城市', 35, 1.4], ['中等城市', 35, 1.0], ['乡村', 30, 0.6]],
    surnames: ['Santoso', 'Wijaya', 'Saputra', 'Hidayat', 'Pratama', 'Kurniawan'], male: ['Budi', 'Agus', 'Rizky', 'Dimas', 'Andi'], female: ['Siti', 'Dewi', 'Putri', 'Ayu', 'Rina'],
    pay: 'GoPay、OVO、DANA、话费扣款', diaspora: 0.03, defaultWeight: 1, nameOrder: 'given-first',
  },
  {
    id: 'VN', name: '越南', group: '东南亚', domestic: false, currency: 'VND', fx: 0.00028, lang: '越南语', medianIncome: 9000000,
    tiers: [['河内/胡志明市', 40, 1.4], ['其他城市', 30, 1.0], ['乡村', 30, 0.6]],
    surnames: ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ'], male: ['Minh', 'Huy', 'Tuấn', 'Đức', 'Nam'], female: ['Linh', 'Trang', 'Hương', 'Lan', 'Mai'],
    pay: 'MoMo、ZaloPay、银行卡', diaspora: 0.01, defaultWeight: 1, nameOrder: 'family-first',
  },
  {
    id: 'IN', name: '印度', group: '南亚', domestic: false, currency: 'INR', fx: 0.085, lang: '印地语/英语', medianIncome: 25000,
    tiers: [['一线大城市', 30, 1.8], ['二三线城市', 35, 1.0], ['乡村', 35, 0.5]],
    surnames: ['Sharma', 'Patel', 'Singh', 'Kumar', 'Reddy', 'Iyer', 'Das', 'Khan'], male: ['Rahul', 'Arjun', 'Amit', 'Vikram', 'Imran'], female: ['Priya', 'Ananya', 'Pooja', 'Kavya', 'Fatima'],
    pay: 'UPI、Paytm、货到付款', diaspora: 0, defaultWeight: 2, nameOrder: 'given-first',
  },
  {
    id: 'BR', name: '巴西', group: '拉美', domestic: false, currency: 'BRL', fx: 1.3, lang: '葡萄牙语', medianIncome: 3000,
    tiers: [['圣保罗/里约等大城市', 40, 1.35], ['中等城市', 40, 1.0], ['乡村', 20, 0.6]],
    surnames: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa'], male: ['João', 'Gabriel', 'Lucas', 'Rafael', 'Pedro'], female: ['Ana', 'Juliana', 'Beatriz', 'Larissa', 'Camila'],
    pay: 'Pix、信用卡分期、Boleto', diaspora: 0.01, defaultWeight: 1, nameOrder: 'given-first',
  },
  {
    id: 'MX', name: '墨西哥', group: '拉美', domestic: false, currency: 'MXN', fx: 0.39, lang: '西班牙语', medianIncome: 10000,
    tiers: [['墨西哥城等大城市', 40, 1.3], ['中等城市', 40, 1.0], ['乡村', 20, 0.6]],
    surnames: ['Hernández', 'García', 'López', 'Martínez', 'González', 'Pérez'], male: ['José', 'Luis', 'Diego', 'Miguel', 'Carlos'], female: ['María', 'Guadalupe', 'Fernanda', 'Sofía', 'Valeria'],
    pay: '借记卡、OXXO 现金、Mercado Pago', diaspora: 0, defaultWeight: 1, nameOrder: 'given-first',
  },
  {
    id: 'AE', name: '阿联酋', group: '中东', domestic: false, currency: 'AED', fx: 1.93, lang: '阿拉伯语/英语', medianIncome: 11000,
    tiers: [['迪拜', 55, 1.2], ['阿布扎比', 30, 1.1], ['其他酋长国', 15, 0.8]],
    surnames: ['Al Mansouri', 'Khan', 'Al Hashimi', 'Nair', 'Haddad', 'Santos'], male: ['Ahmed', 'Omar', 'Rashid', 'Arun', 'Youssef'], female: ['Fatima', 'Mariam', 'Noor', 'Anjali', 'Layla'],
    pay: '信用卡、Apple Pay', diaspora: 0.02, defaultWeight: 1, nameOrder: 'given-first',
  },
  {
    id: 'AU', name: '澳大利亚', group: '大洋洲', domestic: false, currency: 'AUD', fx: 4.7, lang: '英语', medianIncome: 6200, tiers: westTiers,
    surnames: ['Smith', 'Jones', 'Williams', 'Nguyen', 'Chen', 'Taylor', 'Kelly', 'Singh'], male: ['Jack', 'Liam', 'Cooper', 'Ethan', 'Hamish'], female: ['Charlotte', 'Olivia', 'Mia', 'Zoe', 'Ruby'],
    pay: '借记卡、Apple Pay、Afterpay', diaspora: 0.06, defaultWeight: 1, nameOrder: 'given-first',
  },
];

export const COUNTRY_BY_ID: Record<string, Country> = Object.fromEntries(COUNTRIES.map((c) => [c.id, c]));

export const GROUPS = Array.from(new Set(COUNTRIES.map((c) => c.group)));

export function defaultCountryWeights(): Record<string, number> {
  return Object.fromEntries(COUNTRIES.map((c) => [c.id, c.defaultWeight]));
}

export const AUDIENCE_PRESETS: { id: string; label: string; weights: Record<string, number>; ageMin?: number; ageMax?: number }[] = [
  { id: 'mixed', label: '国内为主 + 海外', weights: defaultCountryWeights() },
  { id: 'cn', label: '只看中国大陆', weights: { CN: 100 } },
  { id: 'global', label: '全球均衡', weights: Object.fromEntries(COUNTRIES.map((c) => [c.id, c.id === 'CN' ? 20 : c.id === 'US' ? 12 : 5])) },
  { id: 'west', label: '欧美', weights: { US: 45, CA: 8, GB: 15, DE: 12, FR: 10, AU: 10 } },
  { id: 'asia', label: '亚洲海外', weights: { HK: 10, TW: 12, JP: 20, KR: 16, SG: 10, ID: 12, VN: 10, IN: 10 } },
  { id: 'chinese', label: '华语圈', weights: { CN: 60, HK: 12, TW: 14, SG: 8, US: 3, CA: 2, AU: 1 } },
];
