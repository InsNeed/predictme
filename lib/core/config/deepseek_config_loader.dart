import 'dart:convert';

import 'deepseek_config.dart';
import 'deepseek_config_candidates.dart';
import 'deepseek_config_source.dart';
import 'live_call_quota.dart';

/// 从 gitignore 的本地 JSON 读取密钥。读失败时退回「没有密钥」，不抛到界面外面。
///
/// Web 没有文件系统，候选列表为空，结果就是没有密钥。
class DeepSeekConfigLoader {
  DeepSeekConfigLoader({List<DeepSeekConfigSource>? candidates})
    : _candidates = candidates ?? defaultDeepSeekConfigCandidates();

  final List<DeepSeekConfigSource> _candidates;

  Future<LoadedDeepSeekConfig> load() async {
    for (final source in _candidates) {
      if (!source.exists) continue;
      try {
        final raw = jsonDecode(await source.read()) as Object?;
        return _fromJson(raw, source.label);
      } catch (error) {
        return LoadedDeepSeekConfig(
          config: DeepSeekConfig.missing,
          problem: '配置文件无法读取：${source.label}',
        );
      }
    }
    return const LoadedDeepSeekConfig(config: DeepSeekConfig.missing);
  }

  LoadedDeepSeekConfig _fromJson(Object? raw, String label) {
    if (raw is! Map) {
      return LoadedDeepSeekConfig(
        config: DeepSeekConfig.missing,
        problem: '配置文件无法读取：$label',
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
