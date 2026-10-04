import 'package:flutter_test/flutter_test.dart';
import 'package:predictme/features/predict/domain/persona.dart';
import 'package:predictme/features/predict/domain/persona_prompt.dart';
import 'package:predictme/features/predict/domain/population_generator.dart';

void main() {
  test('each persona carries their own setting and the excluded claims', () {
    final people = generatePopulation(size: 48);
    final loss = people.firstWhere((persona) => persona.frame == FrameKind.loss);
    final gain = people.firstWhere((persona) => persona.frame == FrameKind.gain);
    final lossPrompt = buildSystemPrompt(loss);
    final gainPrompt = buildSystemPrompt(gain);

    expect(lossPrompt, contains(loss.name));
    expect(lossPrompt, contains('${loss.age}'));
    expect(lossPrompt, contains('不能退的账单'));
    expect(gainPrompt, isNot(contains('不能退的账单')));
    expect(lossPrompt, isNot(gainPrompt));
    for (final claim in kExcludedClaims) {
      expect(lossPrompt, contains(claim));
    }
    expect(lossPrompt, contains('下层约束上层'));
    expect(
      buildUserPrompt('人们会不会用这个应用，会不会为它付钱'),
      contains('会用'),
    );
  });
}
