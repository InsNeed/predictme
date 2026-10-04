/// 一次运行真正打到模型的人数。本地人口不受这个上限约束。
const int kDefaultLiveCalls = 3;
const int kMaxLiveCalls = 8;

int clampLiveCalls(int value) {
  if (value < 1) return 1;
  if (value > kMaxLiveCalls) return kMaxLiveCalls;
  return value;
}

/// 按固定间隔从全量人口里抽出要实呼的下标，避免抽中的人挤在同一段。
List<int> liveCallIndexes({
  required int population,
  required int calls,
}) {
  if (population <= 0 || calls <= 0) return const [];
  final n = calls > population ? population : calls;
  if (n == population) {
    return List<int>.generate(population, (index) => index);
  }
  final chosen = <int>[];
  for (var i = 0; i < n; i++) {
    final index = (i * population) ~/ n;
    if (chosen.isEmpty || chosen.last != index) {
      chosen.add(index);
    }
  }
  var cursor = 0;
  while (chosen.length < n && cursor < population) {
    if (!chosen.contains(cursor)) chosen.add(cursor);
    cursor += 1;
  }
  return chosen;
}
