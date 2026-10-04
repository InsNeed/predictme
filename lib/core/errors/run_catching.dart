import 'error_mapper.dart';
import 'result.dart';

/// 把异步操作包成 [Result]。
Future<Result<T>> runCatching<T>(Future<T> Function() action) async {
  try {
    return Success(await action());
  } catch (error, stackTrace) {
    return ErrorMapper.toResultFailure<T>(error, stackTrace);
  }
}
