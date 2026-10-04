import 'package:flutter_test/flutter_test.dart';
import 'package:predictme/features/predict/domain/persona.dart';
import 'package:predictme/features/predict/domain/population_generator.dart';
import 'package:predictme/features/predict/domain/population_weights.dart';

void main() {
  test('population matches the census shape and is deterministic', () {
    final people = generatePopulation();
    final again = generatePopulation();

    expect(people, hasLength(kDefaultPopulationSize));
    expect(people.map((persona) => persona.id), again.map((persona) => persona.id));
    expect(people.map((persona) => persona.name).toSet(), hasLength(people.length));

    final bandCounts = <String, int>{};
    for (final persona in people) {
      bandCounts[persona.ageBand] = (bandCounts[persona.ageBand] ?? 0) + 1;
      expect(persona.age, inInclusiveRange(15, 74));
    }
    final largest = bandCounts.entries.reduce(
      (best, entry) => entry.value > best.value ? entry : best,
    );
    expect(largest.key, '30–34岁');

    final young = people.where((persona) => persona.ageBand == '15–19岁');
    expect(
      young.where((persona) => persona.sex == Sex.male).length,
      greaterThan(young.where((persona) => persona.sex == Sex.female).length),
    );
    final older = people.where((persona) => persona.ageBand == '70–74岁');
    expect(
      older.where((persona) => persona.sex == Sex.female).length,
      greaterThan(older.where((persona) => persona.sex == Sex.male).length),
    );

    final urban = people.where((persona) => persona.residence == Residence.urban).length;
    expect(urban / people.length, closeTo(0.6389, 0.02));

    final pyramid15to59 = kAgeBands
        .where((band) => band.startAge < 60)
        .fold<int>(0, (sum, band) => sum + band.total);
    expect((kBulletinAge15to59 - pyramid15to59).abs(), 1999452);

    final conscientiousness = <TraitLevel, int>{};
    for (final persona in people) {
      conscientiousness[persona.conscientiousness] =
          (conscientiousness[persona.conscientiousness] ?? 0) + 1;
    }
    expect(
      conscientiousness[TraitLevel.mid],
      greaterThan(conscientiousness[TraitLevel.high]!),
    );

    final learningCounts = <LearningHistory, int>{};
    for (final persona in people) {
      learningCounts[persona.learningHistory] =
          (learningCounts[persona.learningHistory] ?? 0) + 1;
    }
    expect(learningCounts.values.toSet(), {kDefaultPopulationSize ~/ 4});

    final sameTraits = people.where(
      (persona) =>
          persona.extraversion == persona.conscientiousness &&
          persona.conscientiousness == persona.honestyHumility &&
          persona.honestyHumility == persona.openness,
    );
    expect(sameTraits.length, lessThan(people.length ~/ 2));

    final hurt = people.where(
      (persona) => persona.learningHistory == LearningHistory.worseThanExpected,
    );
    final hurtAndLoss = hurt.where((persona) => persona.frame == FrameKind.loss);
    expect(hurtAndLoss.length, lessThan(hurt.length));
  });

  test('largest remainder keeps the total', () {
    expect(largestRemainder(const [3, 1], 4), [3, 1]);
    expect(largestRemainder(const [1, 1], 3), [2, 1]);
    final quotas = largestRemainder(
      [for (final band in kAgeBands) band.total],
      960,
    );
    expect(quotas.reduce((a, b) => a + b), 960);
  });
}
