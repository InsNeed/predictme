import 'package:dio/dio.dart';
import 'package:drift/drift.dart';

import 'app_exception.dart';
import 'app_failure.dart';
import 'result.dart';

/// 把任意对象映射成 [AppFailure]。
abstract final class ErrorMapper {
  static AppFailure toFailure(
    Object error, [
    StackTrace? stackTrace,
  ]) {
    return switch (error) {
      AppFailure() => error,
      AppException() => fromException(error, stackTrace),
      DioException() => fromDioException(error, stackTrace),
      DriftWrappedException() => LocalFailure(
          message: '本地数据库没有写成功',
          cause: error,
          stackTrace: stackTrace,
        ),
      _ => SystemFailure(
          message: '出现了没有预料到的错误',
          cause: error,
          stackTrace: stackTrace,
        ),
    };
  }

  static AppFailure fromException(
    AppException exception, [
    StackTrace? stackTrace,
  ]) {
    return switch (exception) {
      LocalException() => LocalFailure(
          message: exception.message,
          cause: exception.cause ?? exception,
          stackTrace: stackTrace,
        ),
      RemoteException(:final statusCode) => RemoteFailure(
          message: exception.message,
          cause: exception.cause ?? exception,
          stackTrace: stackTrace,
          statusCode: statusCode,
        ),
      SystemException() => SystemFailure(
          message: exception.message,
          cause: exception.cause ?? exception,
          stackTrace: stackTrace,
        ),
    };
  }

  static AppFailure fromDioException(
    DioException error, [
    StackTrace? stackTrace,
  ]) {
    final statusCode = error.response?.statusCode;
    final message = switch (error.type) {
      DioExceptionType.connectionTimeout ||
      DioExceptionType.sendTimeout ||
      DioExceptionType.receiveTimeout ||
      DioExceptionType.transformTimeout =>
        '连接超时',
      DioExceptionType.connectionError => '网络连不上',
      DioExceptionType.badCertificate => '证书无效',
      DioExceptionType.cancel => '请求已取消',
      DioExceptionType.badResponse =>
        httpStatusMessage(statusCode) ?? '服务器返回了无法处理的响应',
      DioExceptionType.unknown => '未知网络错误',
    };

    return RemoteFailure(
      message: message,
      cause: error,
      stackTrace: stackTrace ?? error.stackTrace,
      statusCode: statusCode,
    );
  }

  static Failure<T> toResultFailure<T>(
    Object error, [
    StackTrace? stackTrace,
  ]) {
    return Failure(toFailure(error, stackTrace));
  }

  static String? httpStatusMessage(int? statusCode) {
    if (statusCode == null) return null;
    return switch (statusCode) {
      400 => '请求无效',
      401 => '密钥无效或未授权',
      402 => '额度不够',
      403 => '没有权限',
      404 => '找不到接口',
      408 => '请求超时',
      429 => '请求太频繁',
      >= 500 && < 600 => '服务暂时不可用',
      _ => null,
    };
  }
}
