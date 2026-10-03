import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:predictme/data/questionnaire.dart';
import 'package:predictme/models/answer.dart';
import 'package:predictme/models/persona.dart';
import 'package:predictme/models/prediction.dart';
import 'package:predictme/models/question.dart';
import 'package:predictme/services/persona_responder.dart';
import 'package:predictme/services/rule_template_persona_responder.dart';
import 'package:predictme/ui/predict_me_app.dart';

class _SyncResponder implements PersonaResponder {
  @override
  Future<List<Answer>> respond({
    required Persona persona,
    required Prediction prediction,
    required List<Question> questions,
  }) async {
    return RuleTemplatePersonaResponder.compose(
      persona: persona,
      prediction: prediction,
      questions: questions,
    );
  }
}

class _GateResponder implements PersonaResponder {
  _GateResponder(this.release);

  final Completer<void> release;

  @override
  Future<List<Answer>> respond({
    required Persona persona,
    required Prediction prediction,
    required List<Question> questions,
  }) async {
    await release.future;
    return [
      for (final question in kQuestionnaire)
        Answer(
          personaId: persona.id,
          questionId: question.id,
          text: '${persona.name}：${question.prompt}',
          affirmative: switch (question.kind) {
            QuestionKind.usage => true,
            QuestionKind.payment => false,
            QuestionKind.reason || QuestionKind.concern => null,
          },
        ),
    ];
  }
}

class _ThrowingResponder implements PersonaResponder {
  @override
  Future<List<Answer>> respond({
    required Persona persona,
    required Prediction prediction,
    required List<Question> questions,
  }) async {
    throw StateError('boom');
  }
}

Future<void> _openCreate(WidgetTester tester) async {
  await tester.tap(find.widgetWithText(FloatingActionButton, '新建预测'));
  await tester.pumpAndSettle();
}

Future<void> _fillForm(WidgetTester tester) async {
  await tester.enterText(find.byType(TextFormField).at(0), '记账应用会不会有人用');
  await tester.enterText(
    find.byType(TextFormField).at(1),
    '面向自由职业者的极简记账工具，语音记账，每月 12 元，强调比表格更快。',
  );
}

void main() {
  testWidgets('empty home invites a prediction', (tester) async {
    await tester.pumpWidget(const PredictMeApp());
    expect(find.text('还没有预测'), findsOneWidget);
    expect(find.text('新建预测'), findsOneWidget);
  });

  testWidgets('empty form explains what is missing', (tester) async {
    await tester.pumpWidget(const PredictMeApp());
    await _openCreate(tester);
    await tester.tap(find.text('开始预测'));
    await tester.pump();
    expect(find.text('请填写话题'), findsOneWidget);
    expect(find.text('请补充背景'), findsOneWidget);
  });

  testWidgets('loading then result then history', (tester) async {
    final release = Completer<void>();
    await tester.pumpWidget(PredictMeApp(responder: _GateResponder(release)));
    await _openCreate(tester);
    await _fillForm(tester);
    await tester.tap(find.text('开始预测'));
    await tester.pump();
    await tester.pump();

    expect(find.text('人设正在并行作答…'), findsOneWidget);

    release.complete();
    await tester.pumpAndSettle();

    expect(find.text('使用率'), findsOneWidget);
    expect(find.text('付费率'), findsOneWidget);
    expect(find.text('100%'), findsOneWidget);
    expect(find.text('0%'), findsOneWidget);
    expect(find.text('林晓晨'), findsOneWidget);
    await tester.scrollUntilVisible(find.text('马建国'), 300);
    expect(find.text('马建国'), findsOneWidget);

    await tester.tap(find.byTooltip('返回'));
    await tester.pumpAndSettle();

    expect(find.text('还没有预测'), findsNothing);
    expect(find.text('记账应用会不会有人用'), findsOneWidget);
  });

  testWidgets('template answers show use and pay rates', (tester) async {
    await tester.pumpWidget(PredictMeApp(responder: _SyncResponder()));
    await _openCreate(tester);
    await _fillForm(tester);
    await tester.tap(find.text('开始预测'));
    await tester.pumpAndSettle();

    expect(find.text('87.5%'), findsOneWidget);
    expect(find.text('50%'), findsOneWidget);
    expect(find.textContaining('会用。作为独立开发者'), findsOneWidget);
    expect(find.textContaining('不会付费'), findsWidgets);
  });

  testWidgets('failed run can be retried', (tester) async {
    await tester.pumpWidget(PredictMeApp(responder: _ThrowingResponder()));
    await _openCreate(tester);
    await _fillForm(tester);
    await tester.tap(find.text('开始预测'));
    await tester.pumpAndSettle();

    expect(find.text('这次没有完成，请再试一次。'), findsOneWidget);
    expect(find.text('再试一次'), findsOneWidget);
  });
}
