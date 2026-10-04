import '../../../core/network/cancellation_token.dart';

/// 向模型发送这个人自己的设定。实现在 data 层。
abstract class PersonaJudge {
  Future<String> complete({
    required String system,
    required String user,
    AppCancelToken? cancel,
  });
}
