import 'decision_composer.dart';
import 'persona.dart';
import 'population_weights.dart';

/// 本地人口规模。实呼人数另计，默认远小于这个数。
const int kDefaultPopulationSize = 960;

/// 按人口权重生成完整人设。同一输入得到同一批人。
List<Persona> generatePopulation({int size = kDefaultPopulationSize}) {
  if (size < 1) {
    throw ArgumentError.value(size, 'size');
  }
  final shells = _demography(size);
  final n = shells.length;
  final extraversion = _traitPlan(n, 3);
  final agreeableness = _traitPlan(n, 5);
  final conscientiousness = _traitPlan(n, 7);
  final emotionalStability = _traitPlan(n, 11);
  final openness = _traitPlan(n, 13);
  final honesty = _traitPlan(n, 17);
  final learning = _balanced(LearningHistory.values, n, 19);
  final frames = _balanced(FrameKind.values, n, 23);
  final emotions = _balanced(IncidentalEmotion.values, n, 29);
  final groups = _balanced(GroupPayoff.values, n, 31);
  final narratives = _balanced(NarrativeId.values, n, 37);
  final signatures = _balanced(IfThenSignature.values, n, 41);
  final budgets = _balanced(BudgetRoom.values, n, 43);
  final goals = _balanced(CurrentGoal.values, n, 47);
  final timePressed = _balanced(const [false, true], n, 53);
  final longTerm = _balanced(const [false, true], n, 59);
  final feedback = _balanced(const [false, true], n, 61);

  return [
    for (var i = 0; i < n; i++)
      _persona(
        shell: shells[i],
        extraversion: extraversion[i],
        agreeableness: agreeableness[i],
        conscientiousness: conscientiousness[i],
        emotionalStability: emotionalStability[i],
        openness: openness[i],
        honestyHumility: honesty[i],
        learningHistory: learning[i],
        frame: frames[i],
        emotion: emotions[i],
        groupPayoff: groups[i],
        narrative: narratives[i],
        signature: signatures[i],
        budget: budgets[i],
        goal: goals[i],
        timePressed: timePressed[i],
        longTermCostInValuation: longTerm[i],
        repeatedFeedback: feedback[i],
      ),
  ];
}

class _Shell {
  const _Shell({
    required this.ordinal,
    required this.band,
    required this.indexInBand,
    required this.sex,
    required this.residence,
  });

  final int ordinal;
  final AgeBandWeight band;
  final int indexInBand;
  final Sex sex;
  final Residence residence;
}

List<_Shell> _demography(int size) {
  final bandQuotas = largestRemainder(
    [for (final band in kAgeBands) band.total],
    size,
  );
  final shells = <_Shell>[];
  var ordinal = 0;
  for (var bandIndex = 0; bandIndex < kAgeBands.length; bandIndex++) {
    final band = kAgeBands[bandIndex];
    final quota = bandQuotas[bandIndex];
    if (quota == 0) continue;
    final sexQuotas = largestRemainder([band.male, band.female], quota);
    var inBand = 0;
    for (var sexIndex = 0; sexIndex < 2; sexIndex++) {
      final sexQuota = sexQuotas[sexIndex];
      if (sexQuota == 0) continue;
      final residenceQuotas = largestRemainder(
        const [kUrbanPerTenThousand, kRuralPerTenThousand],
        sexQuota,
      );
      for (var residenceIndex = 0; residenceIndex < 2; residenceIndex++) {
        final count = residenceQuotas[residenceIndex];
        for (var copy = 0; copy < count; copy++) {
          shells.add(
            _Shell(
              ordinal: ordinal,
              band: band,
              indexInBand: inBand,
              sex: sexIndex == 0 ? Sex.male : Sex.female,
              residence:
                  residenceIndex == 0 ? Residence.urban : Residence.rural,
            ),
          );
          ordinal += 1;
          inBand += 1;
        }
      }
    }
  }
  return shells;
}

Persona _persona({
  required _Shell shell,
  required TraitLevel extraversion,
  required TraitLevel agreeableness,
  required TraitLevel conscientiousness,
  required TraitLevel emotionalStability,
  required TraitLevel openness,
  required TraitLevel honestyHumility,
  required LearningHistory learningHistory,
  required FrameKind frame,
  required IncidentalEmotion emotion,
  required GroupPayoff groupPayoff,
  required NarrativeId narrative,
  required IfThenSignature signature,
  required BudgetRoom budget,
  required CurrentGoal goal,
  required bool timePressed,
  required bool longTermCostInValuation,
  required bool repeatedFeedback,
}) {
  final decision = composeDecision(
    conscientiousness: conscientiousness,
    honestyHumility: honestyHumility,
    learningHistory: learningHistory,
    frame: frame,
    emotion: emotion,
    groupPayoff: groupPayoff,
    narrative: narrative,
    signature: signature,
    budget: budget,
    goal: goal,
    timePressed: timePressed,
    longTermCostInValuation: longTermCostInValuation,
    repeatedFeedback: repeatedFeedback,
  );
  return Persona(
    id: 'p${shell.ordinal}',
    name: _name(shell.ordinal),
    age: shell.band.startAge + (shell.indexInBand % 5),
    ageBand: shell.band.label,
    sex: shell.sex,
    residence: shell.residence,
    extraversion: extraversion,
    agreeableness: agreeableness,
    conscientiousness: conscientiousness,
    emotionalStability: emotionalStability,
    openness: openness,
    honestyHumility: honestyHumility,
    learningHistory: learningHistory,
    frame: frame,
    emotion: emotion,
    groupPayoff: groupPayoff,
    narrative: narrative,
    signature: signature,
    budget: budget,
    goal: goal,
    timePressed: timePressed,
    longTermCostInValuation: longTermCostInValuation,
    repeatedFeedback: repeatedFeedback,
    decision: decision,
  );
}

String _name(int ordinal) {
  const surnames = [
    '王', '李', '张', '刘', '陈', '杨', '黄', '赵', '吴', '周',
    '徐', '孙', '马', '朱', '胡', '郭', '何', '高', '林', '罗',
  ];
  const first = ['晓', '予', '婉', '浩', '晚', '建', '念', '清', '一', '可', '宁', '安', '远', '川', '禾'];
  const second = ['晨', '安', '清', '然', '晴', '国', '宁', '和', '舟', '宜', '之', '年', '白', '南', '生'];
  return '${surnames[ordinal % surnames.length]}'
      '${first[(ordinal ~/ 20) % first.length]}'
      '${second[(ordinal ~/ 300) % second.length]}';
}

List<TraitLevel> _traitPlan(int n, int salt) {
  final quotas = largestRemainder(kTraitBinWeights, n);
  final bag = <TraitLevel>[
    for (var i = 0; i < TraitLevel.values.length; i++)
      for (var j = 0; j < quotas[i]; j++) TraitLevel.values[i],
  ];
  return _mix(bag, salt);
}

List<T> _balanced<T>(List<T> values, int n, int salt) {
  final quotas = largestRemainder(List<int>.filled(values.length, 1), n);
  final bag = <T>[
    for (var i = 0; i < values.length; i++)
      for (var j = 0; j < quotas[i]; j++) values[i],
  ];
  return _mix(bag, salt);
}

List<T> _mix<T>(List<T> items, int salt) {
  final n = items.length;
  final order = List<int>.generate(n, (index) => index);
  var state = (salt + 1) * 0x6D2B79F5;
  for (var i = n - 1; i > 0; i--) {
    state = (state * 1664525 + 1013904223) & 0x7fffffff;
    final j = state % (i + 1);
    final tmp = order[i];
    order[i] = order[j];
    order[j] = tmp;
  }
  return [for (final index in order) items[index]];
}
