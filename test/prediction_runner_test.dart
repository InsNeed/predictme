import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:predictme/data/personas.dart';
import 'package:predictme/models/answer.dart';
import 'package:predictme/models/persona.dart';
import 'package:predictme/models/prediction.dart';
import 'package:predictme/models/question.dart';
import 'package:predictme/services/aggregation.dart';
import 'package:predictme/services/persona_responder.dart';
import 'package:predictme/services/prediction_runner.dart';
import 'package:predictme/services/rule_template_persona_responder.dart';

class _GateResponder implements PersonaResponder {
  _GateResponder(this.release);

  final Completer<void> release;
  int inFlight = 0;
  int maxInFlight = 0;

  @override
  Future<List<Answer>> respond({
    required Persona persona,
    required Prediction prediction,
    required List<Question> questions,
  }) async {
    inFlight += 1;
    if (inFlight > maxInFlight) {
      maxInFlight = inFlight;
    }
    await release.future;
    inFlight -= 1;
    return [
      for (final question in questions)
        Answer(
          personaId: persona.id,
          questionId: question.id,
          text: question.prompt,
          affirmative: switch (question.kind) {
            QuestionKind.usage => true,
            QuestionKind.payment => false,
            QuestionKind.reason || QuestionKind.concern => null,
          },
        ),
    ];
  }
}

void main() {
  final prediction = Prediction(
    id: 'p1',
    topic: '记账应用会不会有人用',
    background: '面向自由职业者的极简记账工具，语音记账，每月 12 元，强调比表格更快。',
    createdAt: DateTime.utc(2026, 10, 3),
  );

  test('personas answer concurrently', () async {
    final release = Completer<void>();
    final responder = _GateResponder(release);
    final runner = PredictionRunner(responder: responder, personas: kPersonas);

    final future = runner.run(prediction);
    expect(responder.maxInFlight, kPersonas.length);

    release.complete();
    final run = await future;
    expect(run.responses, hasLength(kPersonas.length));
    expect(run.summary.wouldUseCount, kPersonas.length);
    expect(run.summary.wouldPayCount, 0);
    expect(run.summary.useRate, 1);
    expect(run.summary.payRate, 0);
  });

  test('template runner aggregate matches answer flags', () async {
    const runner = PredictionRunner(responder: RuleTemplatePersonaResponder());
    final run = await runner.run(prediction);
    expect(run.summary.personaCount, kPersonas.length);
    expect(run.summary.wouldUseCount, 7);
    expect(run.summary.wouldPayCount, 4);
    final again = summarize(run.responses);
    expect(run.summary.personaCount, again.personaCount);
    expect(run.summary.wouldUseCount, again.wouldUseCount);
    expect(run.summary.wouldPayCount, again.wouldPayCount);
    expect(run.responses.map((response) => response.persona.id), [
      for (final persona in kPersonas) persona.id,
    ]);
  });
}
