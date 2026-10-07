/// 一处 DeepSeek 配置。桌面读本地文件，浏览器没有文件系统。
abstract interface class DeepSeekConfigSource {
  String get label;

  bool get exists;

  Future<String> read();
}
