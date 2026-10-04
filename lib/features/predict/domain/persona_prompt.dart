import 'persona.dart';

/// 教材明确不采用的说法。请求里以禁令出现，不把它们当成依据。
const List<String> kExcludedClaims = [
  '百分之九十五的决定是无意识做的',
  '多巴胺就是快乐',
  '损失厌恶系数 2.25',
  '人格与行为的相关大约是 0.30',
  '棉花糖实验能预测一个人的一生',
  '催产素是信任激素',
  '某一个脑区是购买按钮',
  '用进化模块解释谁会为一个应用付钱',
  '人格特质的遗传力百分比',
  '数字足迹比朋友更了解你',
  '政治预测比赛里的具体准确率',
];

String buildSystemPrompt(Persona persona) {
  final decision = persona.decision;
  final excluded = kExcludedClaims.map((claim) => '- $claim').join('\n');
  return '''
你在做一次预测，不是在写一个讨喜的人物，也不是在给产品背书。

这个人：
- 称呼：${persona.name}
- 年龄：${persona.age}（${persona.ageBand}）。特质位置是相对同龄人的，不能挪到另一个生命阶段还当同一个人。
- 性别：${persona.sexLabel}
- 居住：${persona.residenceLabel}
- 外向性：${traitLabel(persona.extraversion)}
- 宜人性：${traitLabel(persona.agreeableness)}
- 尽责性：${traitLabel(persona.conscientiousness)}
- 情绪稳定性：${traitLabel(persona.emotionalStability)}
- 开放性：${traitLabel(persona.openness)}
- 诚实—谦逊：${traitLabel(persona.honestyHumility)}

这一次已经叠好的条件：
- 预测对象：${decision.predictionObject}
- 被简化的问题：${decision.simplifiedProblem}
- 预期：${decision.expectation}
- 想要：${decision.wanting}
- 喜欢：${decision.liking}
- 习惯：${decision.habit}
- 按后果重算：${decision.goalDirected}
- 情绪：${decision.emotionModulation}
- 自控：${decision.selfControl}
- 框架：${decision.frameStatement}
- 周围的人：${decision.groupPayoffStatement}
- 若—则：${decision.signatureReading}
- 趋势（不是这一次）：${decision.trendNotThisAct}
- 身份：${decision.identityNote}
- 诚实—谦逊：${decision.honestyNote}
- 再认或信心：${decision.heuristicNote}

怎么用这些条件：
下层约束上层。生物层的预期、想要、喜欢、习惯、重算必须分开，不能收成一句「会用」。特质只进入 trend，不能决定这一次的是或否。框架、当下情绪、学习史、群体回报和用户的原话可以改变这一次。框架是强条件，不是开关。签名不是测量误差，也不要把它平均掉。嘴上的理由写进 self_theory，标明那是自我理论，不是机制。保留残余不确定，不要写「一定会」。不要做性格百分之多少、情境百分之多少的分解。

不要使用下面任何一句，也不要换成数字复述：
$excluded
'''.trim();
}

String buildUserPrompt(String message) {
  return '''
用户要预测的原话：
${message.trim()}

只回答这一次。若原话就是会不会用、会不会付钱，primary_label 必须正好是「会用」，secondary_label 必须正好是「会付钱」。若原话是别的一次判断，两个标签跟原话走，并且短。

用 JSON 回答，不要加别的文字：
{
  "primary_label": "会用",
  "primary_yes": false,
  "secondary_label": "会付钱",
  "secondary_yes": false,
  "one_act": "这一次的判断，一两句",
  "trend": "只写趋势，并写明不是这一次",
  "self_theory": "这个人嘴上可能说的理由",
  "residual": "仍然可能错在哪里"
}
'''.trim();
}
