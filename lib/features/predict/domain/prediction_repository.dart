import '../../../core/config/deepseek_config.dart';
import 'prediction_session.dart';

/// 生成本地人口，按额度实呼，并把运行写进数据库。
abstract class PredictionRepository {
  Future<PredictionSession> run({
    required String message,
    required int liveCalls,
    required DeepSeekConfig config,
  });

  void cancelActive();
}
