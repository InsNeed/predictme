import 'package:dio/dio.dart';

import '../errors/app_exception.dart';
import '../errors/app_failure.dart';
import '../errors/error_mapper.dart';
import '../logging/app_logger.dart';
import '../logging/log_enums.dart';
import 'dio_logging_interceptor.dart';

/// Dio 封装：统一超时、日志和错误转换。
class DioClient {
  DioClient({
    required String baseUrl,
    Duration connectTimeout = const Duration(seconds: 15),
    Duration receiveTimeout = const Duration(seconds: 90),
    List<Interceptor>? interceptors,
  }) : _dio = Dio(
          BaseOptions(
            baseUrl: baseUrl,
            connectTimeout: connectTimeout,
            sendTimeout: const Duration(seconds: 30),
            receiveTimeout: receiveTimeout,
            headers: const {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          ),
        ) {
    _dio.interceptors.addAll([
      DioLoggingInterceptor(),
      ...?interceptors,
    ]);
  }

  /// 测试或已经配好的 Dio。仍会补上日志拦截器。
  DioClient.fromDio(Dio dio) : _dio = dio {
    _dio.interceptors.add(DioLoggingInterceptor());
  }

  final Dio _dio;

  Dio get raw => _dio;

  Future<Response<T>> post<T>(
    String path, {
    Object? data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) {
    return _request(
      () => _dio.post<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      ),
    );
  }

  Future<Response<T>> _request<T>(
    Future<Response<T>> Function() send,
  ) async {
    try {
      return await send();
    } on DioException catch (error, stackTrace) {
      final failure = ErrorMapper.fromDioException(error, stackTrace);
      AppLogger.error(
        failure.message,
        module: AppLogModule.network,
        layer: AppLogLayer.infrastructure,
        error: error,
        stackTrace: stackTrace,
      );
      throw RemoteException(
        failure.message,
        cause: error,
        statusCode: failure is RemoteFailure ? failure.statusCode : null,
      );
    } catch (error, stackTrace) {
      AppLogger.error(
        '网络请求发生未知错误',
        module: AppLogModule.network,
        layer: AppLogLayer.infrastructure,
        error: error,
        stackTrace: stackTrace,
      );
      throw SystemException('网络请求发生未知错误', cause: error);
    }
  }
}
