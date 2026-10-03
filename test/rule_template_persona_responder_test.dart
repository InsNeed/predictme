import 'package:flutter_test/flutter_test.dart';
import 'package:predictme/data/personas.dart';
import 'package:predictme/data/questionnaire.dart';
import 'package:predictme/models/persona.dart';
import 'package:predictme/models/prediction.dart';
import 'package:predictme/models/question.dart';
import 'package:predictme/services/rule_template_persona_responder.dart';

void main() {
  final responder = const RuleTemplatePersonaResponder();

  Prediction sample({String? topic, String? background}) {
    return Prediction(
      id: 'sample',
      topic: topic ?? '记账应用会不会有人用',
      background: background ?? '面向自由职业者的极简记账工具，语音记账，每月 12 元，强调比表格更快。',
      createdAt: DateTime.utc(2026, 10, 3),
    );
  }

  Persona personaById(String id) {
    return kPersonas.firstWhere((persona) => persona.id == id);
  }

  test('roster has at least six distinct personas', () {
    expect(kPersonas.length, greaterThanOrEqualTo(6));
    expect(
      kPersonas.map((persona) => persona.id).toSet(),
      hasLength(kPersonas.length),
    );
    for (final persona in kPersonas) {
      expect(persona.name, isNotEmpty);
      expect(persona.role, isNotEmpty);
      expect(persona.personality, isNotEmpty);
      expect(persona.pastExperience, isNotEmpty);
      expect(persona.decisionStyle, isNotEmpty);
    }
  });

  test('questionnaire is the four fixed prompts', () {
    expect(kQuestionnaire.map((question) => question.prompt), [
      '会不会用',
      '会不会付费',
      '原因',
      '顾虑',
    ]);
  });

  test('compose returns one answer per question in order', () {
    final prediction = sample();
    for (final persona in kPersonas) {
      final answers = RuleTemplatePersonaResponder.compose(
        persona: persona,
        prediction: prediction,
        questions: kQuestionnaire,
      );
      expect(answers.map((answer) => answer.questionId), [
        QuestionIds.use,
        QuestionIds.pay,
        QuestionIds.reason,
        QuestionIds.concern,
      ]);
      expect(answers.every((answer) => answer.personaId == persona.id), isTrue);
      expect(answers[0].affirmative, isNotNull);
      expect(answers[1].affirmative, isNotNull);
      expect(answers[2].affirmative, isNull);
      expect(answers[3].affirmative, isNull);
      for (final answer in answers) {
        expect(answer.text, contains(prediction.topic));
      }
      expect(answers[2].text, contains('面向自由职业者'));
    }
  });

  test('same input always produces the same answers', () {
    final persona = personaById('su_nian');
    final prediction = sample();
    final first = RuleTemplatePersonaResponder.compose(
      persona: persona,
      prediction: prediction,
      questions: kQuestionnaire,
    );
    final second = RuleTemplatePersonaResponder.compose(
      persona: persona,
      prediction: prediction,
      questions: kQuestionnaire,
    );
    expect(
      first.map((answer) => answer.text).toList(),
      second.map((answer) => answer.text).toList(),
    );
  });

  test('sample topic splits use and pay across the roster', () {
    final prediction = sample();
    final expected = {
      'lin_xiaochen': (use: true, pay: false),
      'zhou_qiming': (use: true, pay: true),
      'chen_yuan': (use: true, pay: false),
      'zhao_wanqing': (use: true, pay: false),
      'sun_haoran': (use: true, pay: true),
      'he_wanqing': (use: true, pay: true),
      'ma_jianguo': (use: false, pay: false),
      'su_nian': (use: true, pay: true),
    };

    for (final entry in expected.entries) {
      final answers = RuleTemplatePersonaResponder.compose(
        persona: personaById(entry.key),
        prediction: prediction,
        questions: kQuestionnaire,
      );
      expect(answers[0].affirmative, entry.value.use, reason: entry.key);
      expect(answers[1].affirmative, entry.value.pay, reason: entry.key);
      expect(
        answers[0].text.startsWith(entry.value.use ? '会用' : '不会用'),
        isTrue,
      );
      expect(
        answers[1].text.startsWith(entry.value.pay ? '会付费' : '不会付费'),
        isTrue,
      );
    }
  });

  test('thin background changes a borderline persona', () {
    final persona = personaById('lin_xiaochen');
    final rich = RuleTemplatePersonaResponder.compose(
      persona: persona,
      prediction: sample(),
      questions: kQuestionnaire,
    );
    final thin = RuleTemplatePersonaResponder.compose(
      persona: persona,
      prediction: sample(background: '还没想好'),
      questions: kQuestionnaire,
    );
    expect(rich[0].affirmative, isTrue);
    expect(thin[0].affirmative, isFalse);
  });

  test('saying the product replaces a tool can flip payment', () {
    final persona = personaById('lin_xiaochen');
    final plain = RuleTemplatePersonaResponder.compose(
      persona: persona,
      prediction: sample(),
      questions: kQuestionnaire,
    );
    final replacing = RuleTemplatePersonaResponder.compose(
      persona: persona,
      prediction: sample(background: '能替代表格，而且更快，面向每天记账的自由职业者，步骤很少。'),
      questions: kQuestionnaire,
    );
    expect(plain[1].affirmative, isFalse);
    expect(replacing[1].affirmative, isTrue);
  });

  test('respond matches compose', () async {
    final persona = personaById('ma_jianguo');
    final prediction = sample();
    final viaInterface = await responder.respond(
      persona: persona,
      prediction: prediction,
      questions: kQuestionnaire,
    );
    final direct = RuleTemplatePersonaResponder.compose(
      persona: persona,
      prediction: prediction,
      questions: kQuestionnaire,
    );
    expect(
      viaInterface.map((answer) => answer.text).toList(),
      direct.map((answer) => answer.text).toList(),
    );
    expect(viaInterface[0].affirmative, isFalse);
    expect(viaInterface[1].affirmative, isFalse);
  });
}
