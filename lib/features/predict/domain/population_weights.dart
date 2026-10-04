/// 2020 年第七次全国人口普查，5 岁组的男女人数。
///
/// 数字来自维基百科「第七次全国人口普查」页上的人口金字塔，不是公报正文里的三档表。
/// 15–59 岁各组相加是 892376568；公报第五号的 15–59 岁是 894376020，差 1999452。
/// 这里只用各组的相对大小做抽样权重。
class AgeBandWeight {
  const AgeBandWeight({
    required this.label,
    required this.startAge,
    required this.male,
    required this.female,
  });

  final String label;
  final int startAge;
  final int male;
  final int female;

  int get total => male + female;
}

const List<AgeBandWeight> kAgeBands = [
  AgeBandWeight(label: '15–19岁', startAge: 15, male: 39053343, female: 33630797),
  AgeBandWeight(label: '20–24岁', startAge: 20, male: 39675995, female: 35265680),
  AgeBandWeight(label: '25–29岁', startAge: 25, male: 48162270, female: 43685062),
  AgeBandWeight(label: '30–34岁', startAge: 30, male: 63871808, female: 60273382),
  AgeBandWeight(label: '35–39岁', startAge: 35, male: 50932037, female: 48080895),
  AgeBandWeight(label: '40–44岁', startAge: 40, male: 47632694, female: 45322636),
  AgeBandWeight(label: '45–49岁', startAge: 45, male: 58191686, female: 56033201),
  AgeBandWeight(label: '50–54岁', startAge: 50, male: 61105470, female: 60058826),
  AgeBandWeight(label: '55–59岁', startAge: 55, male: 50816026, female: 50584760),
  AgeBandWeight(label: '60–64岁', startAge: 60, male: 36871125, female: 36511813),
  AgeBandWeight(label: '65–69岁', startAge: 65, male: 36337923, female: 37667637),
  AgeBandWeight(label: '70–74岁', startAge: 70, male: 24162733, female: 25427303),
];

/// 公报里的城镇 63.89%、乡村 36.11%，按万分比，避免再写一串未核对的人头数。
const int kUrbanPerTenThousand = 6389;
const int kRuralPerTenThousand = 3611;

/// 标准正态在 ±0.5、±1.5 处切开后收成的整数百分比。不是中国常模。
const List<int> kTraitBinWeights = [7, 24, 38, 24, 7];

const int kBulletinAge15to59 = 894376020;

/// 按最大余额法把 [target] 分到各个权重上。和一定等于 [target]。
List<int> largestRemainder(List<int> weights, int target) {
  if (target < 0) {
    throw ArgumentError.value(target, 'target');
  }
  final total = weights.fold<int>(0, (sum, weight) => sum + weight);
  if (total <= 0) {
    throw ArgumentError('weights must be positive');
  }
  final floors = <int>[];
  final remainders = <int>[];
  var assigned = 0;
  for (final weight in weights) {
    final product = weight * target;
    final floor = product ~/ total;
    floors.add(floor);
    remainders.add(product % total);
    assigned += floor;
  }
  final order = List<int>.generate(weights.length, (index) => index)
    ..sort((a, b) {
      final byRemainder = remainders[b].compareTo(remainders[a]);
      if (byRemainder != 0) return byRemainder;
      return a.compareTo(b);
    });
  var left = target - assigned;
  var cursor = 0;
  while (left > 0) {
    floors[order[cursor % order.length]] += 1;
    cursor += 1;
    left -= 1;
  }
  return floors;
}
