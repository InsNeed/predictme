import 'package:flutter_test/flutter_test.dart';
import 'package:predictme/models/answer.dart';
import 'package:predictme/models/persona.dart';
import 'package:predictme/models/prediction_run.dart';
import 'package:predictme/models/question.dart';
import 'package:predictme/services/aggregation.dart';

void main() {
  PersonaResponse response({
    required String id,
    required bool use,
    required bool pay,
  }) {
    return PersonaResponse(
      persona: Persona(
        id: id,
        name: id,
        role: '角色',
        personality: '性格',
        pastExperience: '经历',
        decisionStyle: '风格',
      ),
      answers: [
        Answer(
          personaId: id,
          questionId: QuestionIds.use,
          text: use ? '会用' : '不会用',
          affirmative: use,
        ),
        Answer(
          personaId: id,
          questionId: QuestionIds.pay,
          text: pay ? '会付费' : '不会付费',
          affirmative: pay,
        ),
      ],
    );
  }

  test('empty roster has zero rates', () {
    final summary = summarize(const []);
    expect(summary.personaCount, 0);
    expect(summary.wouldUseCount, 0);
    expect(summary.wouldPayCount, 0);
    expect(summary.useRate, 0);
    expect(summary.payRate, 0);
    expect(formatRate(0, 0), '0%');
  });

  test('counts use and pay independently', () {
    final summary = summarize([
      response(id: 'a', use: true, pay: false),
      response(id: 'b', use: true, pay: true),
      response(id: 'c', use: false, pay: false),
      response(id: 'd', use: true, pay: false),
    ]);
    expect(summary.personaCount, 4);
    expect(summary.wouldUseCount, 3);
    expect(summary.wouldPayCount, 1);
    expect(summary.useRate, 0.75);
    expect(summary.payRate, 0.25);
    expect(formatRate(3, 4), '75%');
    expect(formatRate(1, 4), '25%');
    expect(formatRate(7, 8), '87.5%');
    expect(formatRate(1, 8), '12.5%');
    expect(formatRate(8, 8), '100%');
  });
}
