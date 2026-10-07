import 'dart:io';

import 'deepseek_config_source.dart';

class FileDeepSeekConfigSource implements DeepSeekConfigSource {
  FileDeepSeekConfigSource(this.file);

  final File file;

  @override
  String get label => file.path;

  @override
  bool get exists => file.existsSync();

  @override
  Future<String> read() => file.readAsString();
}

List<DeepSeekConfigSource> defaultDeepSeekConfigCandidates() {
  const fromEnv = String.fromEnvironment('PREDICTME_CONFIG');
  return [
    if (fromEnv.isNotEmpty) FileDeepSeekConfigSource(File(fromEnv)),
    FileDeepSeekConfigSource(File('config/deepseek.local.json')),
  ];
}
