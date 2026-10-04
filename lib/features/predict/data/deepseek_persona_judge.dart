import 'package:dio/dio.dart';

import '../../../core/config/deepseek_config.dart';
import '../../../core/network/cancellation_token.dart';
import '../../../core/network/dio_client.dart';
import '../domain/persona_judge.dart';

/// OpenAI 兼容的 DeepSeek 对话补全。思考模式关闭，避免小额度被长推理打光。
class DeepSeekPersonaJudge implements PersonaJudge {
  DeepSeekPersonaJudge({
    required this._client,
    required this.config,
  });

  final DioClient _client;
  final DeepSeekConfig config;

  static const maxTokens = 800;

  @override
  Future<String> complete({
    required String system,
    required String user,
    AppCancelToken? cancel,
  }) async {
    final response = await _client.post<dynamic>(
      '/chat/completions',
      data: {
        'model': config.model,
        'messages': [
          {'role': 'system', 'content': system},
          {'role': 'user', 'content': user},
        ],
        'response_format': {'type': 'json_object'},
        'thinking': {'type': 'disabled'},
        'temperature': 0.2,
        'max_tokens': maxTokens,
        'stream': false,
      },
      options: Options(
        headers: {'Authorization': 'Bearer ${config.apiKey}'},
      ),
      cancelToken: cancel?.dioToken,
    );
    return _readContent(response.data);
  }

  String _readContent(Object? data) {
    if (data is! Map) {
      throw const FormatException('响应里没有内容');
    }
    final choices = data['choices'];
    if (choices is! List || choices.isEmpty || choices.first is! Map) {
      throw const FormatException('响应里没有内容');
    }
    final choice = (choices.first as Map).cast<Object?, Object?>();
    if (choice['finish_reason'] == 'length') {
      throw const FormatException('回答被截断');
    }
    final message = choice['message'];
    if (message is! Map) {
      throw const FormatException('响应里没有内容');
    }
    final content = message['content'];
    if (content is! String || content.trim().isEmpty) {
      throw const FormatException('响应里没有内容');
    }
    return content;
  }
}
