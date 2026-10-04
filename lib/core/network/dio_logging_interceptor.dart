import 'dart:convert';

import 'package:dio/dio.dart';

import '../logging/app_logger.dart';
import '../logging/log_enums.dart';

const _logStartKey = '_dio_log_start_ms';

/// Dio 请求与响应日志。Authorization 和带 token 的头会被打码。
class DioLoggingInterceptor extends Interceptor {
  DioLoggingInterceptor({
    this.module = AppLogModule.network,
    this.layer = AppLogLayer.infrastructure,
    this.maxBodyLength,
  });

  final AppLogModule module;
  final AppLogLayer layer;

  /// 为 `null` 时不截断 body。
  final int? maxBodyLength;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    options.extra[_logStartKey] = DateTime.now().millisecondsSinceEpoch;

    final buffer = StringBuffer()
      ..writeln('HTTP 请求')
      ..writeln('${options.method} ${options.uri}')
      ..writeln('responseType: ${options.responseType.name}')
      ..writeln('headers: ${formatHeadersForLog(options.headers)}');

    if (options.queryParameters.isNotEmpty) {
      buffer.writeln('query: ${options.queryParameters}');
    }
    if (options.data != null) {
      buffer.writeln('body: ${_formatBody(options.data)}');
    }

    AppLogger.debug(
      buffer.toString().trimRight(),
      module: module,
      layer: layer,
    );
    handler.next(options);
  }

  @override
  void onResponse(
    Response<dynamic> response,
    ResponseInterceptorHandler handler,
  ) {
    final elapsed = _elapsedMs(response.requestOptions);
    final buffer = StringBuffer()
      ..writeln('HTTP 响应')
      ..writeln(
        '${response.requestOptions.method} ${response.requestOptions.uri}',
      )
      ..writeln('status: ${response.statusCode}')
      ..writeln('elapsed: ${elapsed}ms')
      ..writeln('headers: ${formatHeadersForLog(response.headers.map)}');

    final data = response.data;
    if (data != null) {
      buffer.writeln('body: ${_formatBody(data)}');
    }

    AppLogger.debug(
      buffer.toString().trimRight(),
      module: module,
      layer: layer,
    );
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final elapsed = _elapsedMs(err.requestOptions);
    final options = err.requestOptions;
    final buffer = StringBuffer()
      ..writeln('HTTP 错误')
      ..writeln('${options.method} ${options.uri}')
      ..writeln('type: ${err.type}')
      ..writeln('message: ${err.message}')
      ..writeln('elapsed: ${elapsed}ms')
      ..writeln('headers: ${formatHeadersForLog(options.headers)}');

    if (options.data != null) {
      buffer.writeln('requestBody: ${_formatBody(options.data)}');
    }
    final statusCode = err.response?.statusCode;
    if (statusCode != null) {
      buffer.writeln('status: $statusCode');
    }
    if (err.response?.data != null) {
      buffer.writeln('responseBody: ${_formatBody(err.response!.data)}');
    }

    AppLogger.warning(
      buffer.toString().trimRight(),
      module: module,
      layer: layer,
      error: err,
      stackTrace: err.stackTrace,
    );
    handler.next(err);
  }

  int _elapsedMs(RequestOptions options) {
    final start = options.extra[_logStartKey];
    if (start is! int) return -1;
    return DateTime.now().millisecondsSinceEpoch - start;
  }

  String _formatBody(Object? data) {
    if (data == null) return 'null';
    String raw;
    if (data is String) {
      raw = data;
    } else if (data is List<int>) {
      raw = utf8.decode(data, allowMalformed: true);
    } else {
      try {
        raw = const JsonEncoder.withIndent('  ').convert(data);
      } catch (_) {
        raw = data.toString();
      }
    }
    final limit = maxBodyLength;
    if (limit == null || raw.length <= limit) return raw;
    return '${raw.substring(0, limit)}…(truncated, ${raw.length} chars)';
  }
}

/// 日志用的头。密钥类字段替换成占位符。
String formatHeadersForLog(Map<String, dynamic> headers) {
  if (headers.isEmpty) return '{}';
  final sanitized = <String, dynamic>{};
  headers.forEach((key, value) {
    final lowerKey = key.toLowerCase();
    if (lowerKey == 'authorization' || lowerKey.contains('token')) {
      sanitized[key] = '<redacted>';
    } else {
      sanitized[key] = value;
    }
  });
  return sanitized.toString();
}
