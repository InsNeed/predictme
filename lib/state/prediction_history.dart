import 'package:flutter/widgets.dart';
import 'package:predictme/models/prediction_run.dart';

/// In-memory list of finished predictions for this app session.
class PredictionHistory extends ChangeNotifier {
  final List<PredictionRun> _runs = [];

  List<PredictionRun> get runs => List.unmodifiable(_runs);

  void add(PredictionRun run) {
    _runs.insert(0, run);
    notifyListeners();
  }
}

class PredictionHistoryScope extends InheritedNotifier<PredictionHistory> {
  const PredictionHistoryScope({
    required PredictionHistory history,
    required super.child,
    super.key,
  }) : super(notifier: history);

  static PredictionHistory of(BuildContext context) {
    final scope = context
        .dependOnInheritedWidgetOfExactType<PredictionHistoryScope>();
    assert(scope != null, 'PredictionHistoryScope 缺失');
    return scope!.notifier!;
  }

  static PredictionHistory read(BuildContext context) {
    final scope = context
        .getInheritedWidgetOfExactType<PredictionHistoryScope>();
    assert(scope != null, 'PredictionHistoryScope 缺失');
    return scope!.notifier!;
  }
}
