import 'judgement.dart';

class AggregateSummary {
  const AggregateSummary({
    required this.populationSize,
    required this.called,
    required this.succeeded,
    required this.failed,
    required this.primaryLabel,
    required this.primaryYes,
    required this.secondaryLabel,
    required this.secondaryYes,
    required this.counted,
  });

  final int populationSize;
  final int called;
  final int succeeded;
  final int failed;
  final String primaryLabel;
  final int primaryYes;
  final String secondaryLabel;
  final int secondaryYes;

  /// 标签与主标签对一致、且解析成功的人数。比例的分母。
  final int counted;

  Map<String, Object?> toJson() => {
        'populationSize': populationSize,
        'called': called,
        'succeeded': succeeded,
        'failed': failed,
        'primaryLabel': primaryLabel,
        'primaryYes': primaryYes,
        'secondaryLabel': secondaryLabel,
        'secondaryYes': secondaryYes,
        'counted': counted,
      };

  factory AggregateSummary.fromJson(Map<String, Object?> json) {
    return AggregateSummary(
      populationSize: json['populationSize']! as int,
      called: json['called']! as int,
      succeeded: json['succeeded']! as int,
      failed: json['failed']! as int,
      primaryLabel: json['primaryLabel']! as String,
      primaryYes: json['primaryYes']! as int,
      secondaryLabel: json['secondaryLabel']! as String,
      secondaryYes: json['secondaryYes']! as int,
      counted: json['counted']! as int,
    );
  }
}

AggregateSummary summarize({
  required int populationSize,
  required int called,
  required List<PersonaJudgement?> judgements,
}) {
  final succeeded = judgements.whereType<PersonaJudgement>().toList();
  final failed = called - succeeded.length;
  if (succeeded.isEmpty) {
    return AggregateSummary(
      populationSize: populationSize,
      called: called,
      succeeded: 0,
      failed: failed < 0 ? 0 : failed,
      primaryLabel: '会用',
      primaryYes: 0,
      secondaryLabel: '会付钱',
      secondaryYes: 0,
      counted: 0,
    );
  }
  final pairCounts = <String, int>{};
  for (final judgement in succeeded) {
    final key = '${judgement.primaryLabel}\n${judgement.secondaryLabel}';
    pairCounts[key] = (pairCounts[key] ?? 0) + 1;
  }
  final dominant = pairCounts.entries.reduce(
    (best, entry) => entry.value > best.value ? entry : best,
  );
  final parts = dominant.key.split('\n');
  final matched = succeeded.where(
    (judgement) =>
        judgement.primaryLabel == parts[0] &&
        judgement.secondaryLabel == parts[1],
  );
  return AggregateSummary(
    populationSize: populationSize,
    called: called,
    succeeded: succeeded.length,
    failed: failed < 0 ? 0 : failed,
    primaryLabel: parts[0],
    primaryYes: matched.where((judgement) => judgement.primaryYes).length,
    secondaryLabel: parts[1],
    secondaryYes: matched.where((judgement) => judgement.secondaryYes).length,
    counted: matched.length,
  );
}

String formatCount(int count, int total) {
  if (total <= 0) return '0/0';
  return '$count/$total';
}
