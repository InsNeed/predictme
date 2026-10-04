/// 应用层失败，按来源分成本地、远程和系统。
sealed class AppFailure {
  const AppFailure({
    required this.message,
    this.cause,
    this.stackTrace,
  });

  final String message;
  final Object? cause;
  final StackTrace? stackTrace;
}

/// 本地错误：数据库、配置文件等。
final class LocalFailure extends AppFailure {
  const LocalFailure({
    required super.message,
    super.cause,
    super.stackTrace,
  });
}

/// 远程错误：网络和模型接口。
final class RemoteFailure extends AppFailure {
  const RemoteFailure({
    required super.message,
    super.cause,
    super.stackTrace,
    this.statusCode,
  });

  final int? statusCode;
}

/// 系统错误：未预期的异常、回答无法解析等。
final class SystemFailure extends AppFailure {
  const SystemFailure({
    required super.message,
    super.cause,
    super.stackTrace,
  });
}
