import 'package:flutter/foundation.dart' show kDebugMode, kIsWeb;
import 'package:loglens/loglens.dart' hide kDebugMode;
import 'package:path_provider/path_provider.dart';

import 'log_enums.dart';

/// 对 LogLens 的应用层封装。未初始化时调用是空操作，避免单测被日志拖垮。
abstract final class AppLogger {
  static bool ready = false;

  static Future<void> init() async {
    await LogLens.init(
      store: await _createStore(),
      defaultModules: AppLogModule.values,
      defaultLayers: AppLogLayer.values,
      debugGuard: kDebugMode,
      skipCallerContains: const [
        'package:predictme/core/logging/app_logger.dart',
        'package:predictme/core/logging/prompt_request_logger.dart',
      ],
    );
    ready = true;
  }

  /// Web 没有文件系统。拿不到本机目录时也退回内存，避免启动失败。
  static Future<LoggerStore> _createStore() async {
    if (kIsWeb) return InMemoryLoggerStore();
    try {
      final dir = await getApplicationSupportDirectory();
      return FileLoggerStore(baseDirectory: dir);
    } catch (_) {
      return InMemoryLoggerStore();
    }
  }

  static void debug(
    Object message, {
    AppLogModule module = AppLogModule.app,
    AppLogLayer layer = AppLogLayer.undefined,
  }) {
    if (!ready) return;
    LogLens.d(message, module, layer);
  }

  static void info(
    Object message, {
    AppLogModule module = AppLogModule.app,
    AppLogLayer layer = AppLogLayer.undefined,
  }) {
    if (!ready) return;
    LogLens.i(message, module, layer);
  }

  static void warning(
    Object message, {
    AppLogModule module = AppLogModule.app,
    AppLogLayer layer = AppLogLayer.undefined,
    Object? error,
    StackTrace? stackTrace,
  }) {
    if (!ready) return;
    if (error != null) {
      LogLens.e(message, module, layer, error, stackTrace);
      return;
    }
    LogLens.w(message, module, layer);
  }

  static void error(
    Object message, {
    AppLogModule module = AppLogModule.app,
    AppLogLayer layer = AppLogLayer.undefined,
    Object? error,
    StackTrace? stackTrace,
  }) {
    if (!ready) return;
    LogLens.e(message, module, layer, error, stackTrace);
  }
}
