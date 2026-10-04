import 'package:flutter/foundation.dart';

import '../../../core/config/deepseek_config.dart';
import '../../../core/config/live_call_quota.dart';
import '../../../core/logging/app_logger.dart';
import '../../../core/logging/log_enums.dart';
import '../domain/prediction_repository.dart';
import '../domain/prediction_session.dart';

class PredictController extends ChangeNotifier {
  PredictController({
    required this.repository,
    required LoadedDeepSeekConfig loaded,
  }) {
    _apply(loaded);
  }

  final PredictionRepository repository;

  late DeepSeekConfig config;
  String? banner;
  String? callCountNote;
  String? formError;
  PredictionSession? session;
  bool running = false;
  int liveCalls = kDefaultLiveCalls;

  bool _disposed = false;
  var _ticket = 0;

  bool get hasKey => config.hasKey;

  void setLiveCalls(int value) {
    liveCalls = clampLiveCalls(value);
    _notify();
  }

  Future<void> submit(String message) async {
    if (running) return;
    if (message.trim().isEmpty) {
      formError = '请先写下要预测的事';
      session = null;
      _notify();
      return;
    }
    formError = null;
    running = true;
    final ticket = ++_ticket;
    _notify();
    try {
      final next = await repository.run(
        message: message,
        liveCalls: liveCalls,
        config: config,
      );
      if (ticket != _ticket || _disposed) return;
      if (next.status == PredictionStatus.emptyMessage) {
        formError = next.statusMessage;
        session = null;
      } else {
        session = next;
      }
    } catch (error, stackTrace) {
      AppLogger.error(
        '预测没有完成',
        module: AppLogModule.predict,
        layer: AppLogLayer.presentation,
        error: error,
        stackTrace: stackTrace,
      );
      if (ticket != _ticket || _disposed) return;
      formError = '这次没有完成，请再试一次。';
    } finally {
      if (ticket == _ticket && !_disposed) {
        running = false;
        _notify();
      }
    }
  }

  void _apply(LoadedDeepSeekConfig loaded) {
    config = loaded.config;
    liveCalls = loaded.config.maxParallelCalls;
    callCountNote = loaded.callCountNote;
    banner = loaded.problem ??
        (loaded.config.hasKey
            ? '密钥已从本机配置读取，界面上不显示密钥。'
            : '还没有 DeepSeek 密钥。把临时密钥写进 config/deepseek.local.json。可以先生成本地人口，但不会发出请求。');
  }

  void _notify() {
    if (!_disposed) notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    repository.cancelActive();
    super.dispose();
  }
}
