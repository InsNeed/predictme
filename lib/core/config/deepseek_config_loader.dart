import 'dart:convert';
import 'dart:io';

import 'deepseek_config.dart';
import 'live_call_quota.dart';

/// 从 gitignore 的本地 JSON 读取密钥。读失败时退回「没有密钥」，不抛到界面外面。
class DeepSeekConfigLoader {
  DeepSeekConfigLoader({List<File>? candidates})
      : _candidates = candidates ?? defaultConfigCandidates();

  final List<File> _candidates;

  static List<File> defaultConfigCandidates() {
    const fromEnv = String.fromEnvironment('PREDICTME_CONFIG');
    return [
      if (fromEnv.isNotEmpty) File(fromEnv),
      File('config/deepseek.local.json'),
    ];
  }

  Future<LoadedDeepSeekConfig> load() async {
    for (final file in _candidates) {
      if (!file.existsSync()) continue;
      try {
        final raw = jsonDecode(await file.readAsString()) as Object?;
        return _fromJson(raw);
      } catch (error) {
        return LoadedDeepSeekConfig(
          config: DeepSeekConfig.missing,
          problem: '配置文件无法读取：${file.path}',
        );
      }
    }
    return const LoadedDeepSeekConfig(config: DeepSeekConfig.missing);
  }

  LoadedDeepSeekConfig _fromJson(Object? raw) {
    if (raw is! Map) {
      return const LoadedDeepSeekConfig(
        config: DeepSeekConfig.missing,
        problem: '配置文件无法读取',
      );
    }
    final apiKey = (raw['apiKey'] as String?)?.trim() ?? '';
    final baseUrl = (raw['baseUrl'] as String?)?.trim();
    final model = (raw['model'] as String?)?.trim();
    final parsedCalls = _readCalls(raw['maxParallelCalls']);
    final calls = clampLiveCalls(parsedCalls ?? kDefaultLiveCalls);
    final note = parsedCalls != null && parsedCalls != calls
        ? '配置里的实呼人数超出 1–$kMaxLiveCalls，已改成 $calls。'
        : null;
    return LoadedDeepSeekConfig(
      config: DeepSeekConfig(
        apiKey: apiKey,
        baseUrl: (baseUrl == null || baseUrl.isEmpty)
            ? DeepSeekConfig.defaultBaseUrl
            : baseUrl,
        model: (model == null || model.isEmpty)
            ? DeepSeekConfig.defaultModel
            : model,
        maxParallelCalls: calls,
      ),
      callCountNote: note,
    );
  }

  int? _readCalls(Object? raw) {
    if (raw is int) return raw;
    if (raw is String) return int.tryParse(raw.trim());
    return null;
  }
}
