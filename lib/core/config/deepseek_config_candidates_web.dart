import 'deepseek_config_source.dart';

/// 浏览器读不到本机的 `config/deepseek.local.json`。没有密钥是正常状态。
List<DeepSeekConfigSource> defaultDeepSeekConfigCandidates() => const [];
