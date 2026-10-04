/// 可抛出的应用异常，在边界层映射为 [AppFailure]。
sealed class AppException implements Exception {
  const AppException(this.message, {this.cause});

  final String message;
  final Object? cause;

  @override
  String toString() => 'AppException: $message';
}

final class LocalException extends AppException {
  const LocalException(super.message, {super.cause});
}

final class RemoteException extends AppException {
  const RemoteException(
    super.message, {
    super.cause,
    this.statusCode,
  });

  final int? statusCode;
}

final class SystemException extends AppException {
  const SystemException(super.message, {super.cause});
}
