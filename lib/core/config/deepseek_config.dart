import 'live_call_quota.dart';

/// DeepSeek 的本机配置。密钥可以为空，调用方据此停在「未配置」。
class DeepSeekConfig {
  const DeepSeekConfig({
    required this.apiKey,
    required this.baseUrl,
    required this.model,
    required this.maxParallelCalls,
  });

  static const defaultBaseUrl = 'https://api.deepseek.com';
  static const defaultModel = 'deepseek-flash';

  final String apiKey;
  final String baseUrl;
  final String model;
  final int maxParallelCalls;

  bool get hasKey => apiKey.trim().isNotEmpty;

  static const missing = DeepSeekConfig(
    apiKey: '',
    baseUrl: defaultBaseUrl,
    model: defaultModel,
    maxParallelCalls: kDefaultLiveCalls,
  );
}

/// 读配置的结果。文件不存在是正常状态，[problem] 为空。
class LoadedDeepSeekConfig {
  const LoadedDeepSeekConfig({
    required this.config,
    this.problem,
    this.callCountNote,
  });

  final DeepSeekConfig config;
  final String? problem;
  final String? callCountNote;
}
