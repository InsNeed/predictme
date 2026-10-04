import 'app_logger.dart';
import 'log_enums.dart';

/// 记录发给模型的设定。不包含密钥。
abstract final class PromptRequestLogger {
  static void log({
    required String label,
    required String system,
    required String user,
  }) {
    AppLogger.info(
      '$label\nsystem:\n$system\n---\nuser:\n$user',
      module: AppLogModule.predict,
      layer: AppLogLayer.data,
    );
  }
}
