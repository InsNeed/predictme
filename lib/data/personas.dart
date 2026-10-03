import 'package:predictme/models/persona.dart';

/// Fixed roster. Personas are not generated and do not change per topic.
const List<Persona> kPersonas = [
  Persona(
    id: 'lin_xiaochen',
    name: '林晓晨',
    role: '独立开发者',
    personality: '务实、爱折腾，讨厌空话',
    pastExperience: '连续做过三个没人用的 side project，对听起来很酷已经免疫',
    decisionStyle: '先看一周内能不能自己用起来；付费只在能替代现有工具时考虑',
  ),
  Persona(
    id: 'zhou_qiming',
    name: '周启明',
    role: '产品经理',
    personality: '冷静、数据驱动，习惯拆用户任务',
    pastExperience: '在互联网公司做过增长，见过很多功能上线后没人留存',
    decisionStyle: '会亲自试用并先问使用频率；付费要有清晰的省时或增收',
  ),
  Persona(
    id: 'chen_yuan',
    name: '陈予安',
    role: '大学生',
    personality: '好奇、预算紧，喜欢试新鲜但很少掏钱',
    pastExperience: '手机里装满免费 App，学生优惠用完就卸载',
    decisionStyle: '免费就愿意试用；默认不付费，除非立刻帮到课业',
  ),
  Persona(
    id: 'zhao_wanqing',
    name: '赵婉清',
    role: '小企业主',
    personality: '时间很贵，结果导向，没耐心看教程',
    pastExperience: '被按月订阅的软件坑过，所以对自动续费很警惕',
    decisionStyle: '能马上省时间才试用；只为明确省下的工时付费',
  ),
  Persona(
    id: 'sun_haoran',
    name: '孙浩然',
    role: '早期投资顾问',
    personality: '多疑、看市场，不吃情怀',
    pastExperience: '听过上百个「下一个微信」的 pitch，多数死在获客',
    decisionStyle: '自己会先当目标用户试用；付费意愿用来检验定价是否成立',
  ),
  Persona(
    id: 'he_wanqing',
    name: '何晚晴',
    role: '产品设计师',
    personality: '审美敏感，体验优先，容错低',
    pastExperience: '用过很多设计与效率工具，界面别扭会在第一天卸载',
    decisionStyle: '体验顺就愿意用；付费看它是否进入每天的工作流',
  ),
  Persona(
    id: 'ma_jianguo',
    name: '马建国',
    role: '传统行业主管',
    personality: '谨慎、不爱新东西，怕麻烦别人教',
    pastExperience: '被复杂 App 劝退过，最后还是回到表格和微信',
    decisionStyle: '默认观望，步骤多就不用；默认不付费',
  ),
  Persona(
    id: 'su_nian',
    name: '苏念',
    role: '内容创作者',
    personality: '跟风快、爱分享，愿意为产量付钱',
    pastExperience: '靠模板和工具维持日更，工具一旦省时间就会留下来',
    decisionStyle: '能直接用在创作流程里就试用；能涨粉或省时间就付费',
  ),
];
