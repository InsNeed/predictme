import 'dart:isolate';

import 'package:predictme/models/answer.dart';
import 'package:predictme/models/persona.dart';
import 'package:predictme/models/prediction.dart';
import 'package:predictme/models/question.dart';
import 'package:predictme/services/persona_responder.dart';

/// Local stand-in for a model. Answers are deterministic templates driven by
/// the persona's traits and the topic background. No network calls.
class RuleTemplatePersonaResponder implements PersonaResponder {
  const RuleTemplatePersonaResponder();

  /// Pure generation used by [respond] and by tests.
  static List<Answer> compose({
    required Persona persona,
    required Prediction prediction,
    required List<Question> questions,
  }) {
    final wouldUse = _usageScore(persona, prediction) >= 1;
    final wouldPay = _paymentScore(persona, prediction) >= 1;
    return [
      for (final question in questions)
        _answer(
          persona: persona,
          prediction: prediction,
          question: question,
          wouldUse: wouldUse,
          wouldPay: wouldPay,
        ),
    ];
  }

  @override
  Future<List<Answer>> respond({
    required Persona persona,
    required Prediction prediction,
    required List<Question> questions,
  }) {
    return Isolate.run(
      () => compose(
        persona: persona,
        prediction: prediction,
        questions: questions,
      ),
    );
  }
}

int _usageScore(Persona persona, Prediction prediction) {
  var score = 0;
  final style = persona.decisionStyle;
  final personality = persona.personality;
  final past = persona.pastExperience;

  if (_containsAny(style, ['试用', '自己用', '体验顺', '创作流程', '目标用户'])) {
    score += 2;
  }
  if (_containsAny(style, ['观望', '步骤多就不用'])) {
    score -= 3;
  }
  if (_containsAny(personality, ['爱折腾', '好奇', '爱分享'])) {
    score += 1;
  }
  if (_containsAny(personality, ['不爱新', '怕麻烦'])) {
    score -= 2;
  }
  if (_containsAny(past, ['没人用', '劝退', '没人留存'])) {
    score -= 1;
  }
  if (past.contains('靠模板')) {
    score += 1;
  }
  if (past.contains('省时间就会留下')) {
    score += 1;
  }

  final length = prediction.background.trim().length;
  if (length >= 24) {
    score += 1;
  } else if (length < 8) {
    score -= 2;
  }
  return score;
}

int _paymentScore(Persona persona, Prediction prediction) {
  var score = 0;
  final style = persona.decisionStyle;
  final personality = persona.personality;
  final past = persona.pastExperience;

  if (style.contains('默认不付费')) {
    score -= 3;
  }
  if (style.contains('能涨粉或省时间就付费')) {
    score += 2;
  }
  if (style.contains('只为明确省下的工时付费')) {
    score += 1;
  }
  if (style.contains('付费要有清晰')) {
    score += 1;
  }
  if (style.contains('检验定价')) {
    score += 1;
  }
  if (style.contains('进入每天的工作流')) {
    score += 1;
  }
  if (style.contains('付费只在能替代')) {
    score -= 1;
  }
  if (personality.contains('预算紧')) {
    score -= 2;
  }
  if (personality.contains('很少掏钱')) {
    score -= 1;
  }
  if (past.contains('订阅')) {
    score -= 2;
  }
  if (past.contains('学生优惠')) {
    score -= 1;
  }

  score += _paymentContext(persona, prediction);
  return score;
}

int _paymentContext(Persona persona, Prediction prediction) {
  final text = '${prediction.topic}\n${prediction.background}';
  var score = 0;
  final mentionsValue =
      text.contains('更快') || text.contains('省时') || text.contains('省下');
  final mentionsPrice =
      text.contains('元') ||
      text.contains('定价') ||
      text.contains('付费') ||
      text.contains('订阅');
  if (mentionsValue) {
    score += 1;
  }
  if (text.contains('替代')) {
    score += 1;
  }
  if (text.contains('免费')) {
    score -= 2;
  }
  if (mentionsPrice && persona.personality.contains('预算紧')) {
    score -= 1;
  }
  if (prediction.background.trim().length < 8) {
    score -= 1;
  }
  return score;
}

Answer _answer({
  required Persona persona,
  required Prediction prediction,
  required Question question,
  required bool wouldUse,
  required bool wouldPay,
}) {
  final topic = prediction.topic.trim();
  final background = _snippet(prediction.background);
  final text = switch (question.kind) {
    QuestionKind.usage =>
      wouldUse
          ? '会用。作为${persona.role}，${persona.personality}。这件事（$topic）我愿意放进自己的流程里试一次。'
          : '不会用。我是${persona.role}，${persona.personality}。按「${persona.decisionStyle}」来看，「$topic」还说服不了我。',
    QuestionKind.payment =>
      wouldPay
          ? '会付费。若「$topic」真能兑现背景里的说法，我按自己的标准愿意付钱：${persona.decisionStyle}'
          : '不会付费。${persona.pastExperience}，所以对「$topic」我默认不掏钱。',
    QuestionKind.reason =>
      '原因：围绕「$topic」，我${wouldUse ? '愿意用' : '不太会用'}，也${wouldPay ? '可以付钱' : '不会付钱'}。背景里提到「$background」。我的判断方式是：${persona.decisionStyle}',
    QuestionKind.concern => _concern(
      persona: persona,
      topic: topic,
      wouldUse: wouldUse,
      wouldPay: wouldPay,
    ),
  };
  final affirmative = switch (question.kind) {
    QuestionKind.usage => wouldUse,
    QuestionKind.payment => wouldPay,
    QuestionKind.reason || QuestionKind.concern => null,
  };
  return Answer(
    personaId: persona.id,
    questionId: question.id,
    text: text,
    affirmative: affirmative,
  );
}

String _concern({
  required Persona persona,
  required String topic,
  required bool wouldUse,
  required bool wouldPay,
}) {
  if (!wouldUse && !wouldPay) {
    return '顾虑：以我的经历（${persona.pastExperience}），「$topic」很可能用两次就放下，更不会为它付费。';
  }
  if (wouldUse && !wouldPay) {
    return '顾虑：我会试「$topic」，但不想付费。${persona.personality}，除非它比我现在的办法明显更好。';
  }
  if (!wouldUse && wouldPay) {
    return '顾虑：「$topic」的价钱不是最大问题，而是我可能根本不会打开。${persona.decisionStyle}';
  }
  return '顾虑：即便我会用也会付，「$topic」仍可能做不进日常。${persona.pastExperience}';
}

String _snippet(String background) {
  final trimmed = background.trim().replaceAll(RegExp(r'\s+'), ' ');
  const max = 36;
  if (trimmed.length <= max) {
    return trimmed;
  }
  return '${trimmed.substring(0, max)}…';
}

bool _containsAny(String text, List<String> needles) {
  for (final needle in needles) {
    if (text.contains(needle)) {
      return true;
    }
  }
  return false;
}
