import 'package:dio/dio.dart';

/// 请求取消令牌。domain 只碰到这个类型，不自己构造 Dio 的取消对象。
class AppCancelToken {
  AppCancelToken();

  bool get isCancelled => _dioToken.isCancelled;

  void cancel([Object? reason]) => _dioToken.cancel(reason);

  /// 供 data 层映射为 Dio [CancelToken]。
  CancelToken get dioToken => _dioToken;

  final CancelToken _dioToken = CancelToken();

  static bool isCancellation(Object? error) {
    return error is DioException && CancelToken.isCancel(error);
  }
}
