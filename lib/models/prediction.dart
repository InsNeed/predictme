/// A topic the user wants judged, plus the background every persona reads.
class Prediction {
  const Prediction({
    required this.id,
    required this.topic,
    required this.background,
    required this.createdAt,
  });

  final String id;
  final String topic;
  final String background;
  final DateTime createdAt;
}
