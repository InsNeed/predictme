import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:predictme/core/config/deepseek_config.dart';
import 'package:predictme/core/config/deepseek_config_loader.dart';
import 'package:predictme/core/config/live_call_quota.dart';
import 'package:predictme/core/database/local_database.dart';
import 'package:predictme/core/errors/error_mapper.dart';
import 'package:predictme/core/network/cancellation_token.dart';
import 'package:predictme/core/network/dio_client.dart';
import 'package:predictme/core/network/dio_logging_interceptor.dart';
import 'package:predictme/features/predict/data/deepseek_persona_judge.dart';
import 'package:predictme/features/predict/data/prediction_repository.dart';
import 'package:predictme/features/predict/domain/judgement.dart';
import 'package:predictme/features/predict/domain/persona_judge.dart';
import 'package:predictme/features/predict/domain/prediction_session.dart';

void main() {
  test('live call quota defaults to 3 and caps at 8', () {
    expect(kDefaultLiveCalls, 3);
    expect(kMaxLiveCalls, 8);
    expect(clampLiveCalls(0), 1);
    expect(clampLiveCalls(3), 3);
    expect(clampLiveCalls(100), 8);
    expect(
      liveCallIndexes(population: 960, calls: 3),
      [0, 320, 640],
    );
  });

  test('missing or broken config does not throw', () async {
    final missing = await DeepSeekConfigLoader(candidates: const []).load();
    expect(missing.config.hasKey, isFalse);
    expect(missing.problem, isNull);
    expect(missing.config.maxParallelCalls, 3);

    final dir = Directory.systemTemp.createTempSync('predictme-config');
    addTearDown(() => dir.deleteSync(recursive: true));
    final broken = File('${dir.path}/deepseek.local.json')..writeAsStringSync('{');
    final bad = await DeepSeekConfigLoader(candidates: [broken]).load();
    expect(bad.config.hasKey, isFalse);
    expect(bad.problem, contains('无法读取'));

    final file = File('${dir.path}/ok.json')
      ..writeAsStringSync(
        jsonEncode({
          'apiKey': 'secret-key',
          'maxParallelCalls': 50,
          'model': '',
        }),
      );
    final loaded = await DeepSeekConfigLoader(candidates: [file]).load();
    expect(loaded.config.apiKey, 'secret-key');
    expect(loaded.config.maxParallelCalls, 8);
    expect(loaded.config.model, DeepSeekConfig.defaultModel);
    expect(loaded.callCountNote, contains('8'));
  });

  test('headers redact authorization', () {
    expect(
      formatHeadersForLog({
        'Authorization': 'Bearer secret-key',
        'Accept': 'application/json',
      }),
      isNot(contains('secret-key')),
    );
  });

  test('dio errors become quota and timeout messages', () {
    final quota = ErrorMapper.fromDioException(
      DioException(
        requestOptions: RequestOptions(path: '/chat/completions'),
        response: Response(
          requestOptions: RequestOptions(path: '/chat/completions'),
          statusCode: 402,
        ),
        type: DioExceptionType.badResponse,
      ),
    );
    expect(quota.message, '额度不够');
    final timeout = ErrorMapper.fromDioException(
      DioException(
        requestOptions: RequestOptions(path: '/'),
        type: DioExceptionType.connectionTimeout,
      ),
    );
    expect(timeout.message, '连接超时');
  });

  test('parser accepts fenced json and rejects a missing decision', () {
    final judgement = parseJudgement('''
```json
{"primary_label":"会用","primary_yes":true,"secondary_label":"会付钱","secondary_yes":false,"one_act":"会打开","trend":"不是这一次","self_theory":"因为好用","residual":"仍可能错"}
```
''');
    expect(judgement.primaryYes, isTrue);
    expect(judgement.secondaryYes, isFalse);
    expect(() => parseJudgement('{"primary_label":"会用"}'), throwsFormatException);
  });

  test('deepseek request is per persona and disables thinking', () async {
    RequestOptions? captured;
    final dio = Dio(BaseOptions(baseUrl: 'https://api.deepseek.com'));
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          captured = options;
          handler.resolve(
            Response(
              requestOptions: options,
              statusCode: 200,
              data: {
                'choices': [
                  {
                    'finish_reason': 'stop',
                    'message': {
                      'content':
                          '{"primary_label":"会用","primary_yes":false,"secondary_label":"会付钱","secondary_yes":false,"one_act":"不","trend":"不是这一次","self_theory":"好用","residual":"可能错"}',
                    },
                  },
                ],
              },
            ),
          );
        },
      ),
    );
    final judge = DeepSeekPersonaJudge(
      client: DioClient.fromDio(dio),
      config: const DeepSeekConfig(
        apiKey: 'secret-key',
        baseUrl: DeepSeekConfig.defaultBaseUrl,
        model: DeepSeekConfig.defaultModel,
        maxParallelCalls: 3,
      ),
    );
    final raw = await judge.complete(system: '此人甲', user: '会不会用');
    expect(raw, contains('primary_yes'));
    final body = captured!.data as Map<String, dynamic>;
    expect(captured!.uri.path, '/chat/completions');
    expect(captured!.headers['Authorization'], 'Bearer secret-key');
    expect(body['model'], 'deepseek-flash');
    expect(body['thinking'], {'type': 'disabled'});
    expect(body['response_format'], {'type': 'json_object'});
    expect(body['max_tokens'], 800);
    final messages = body['messages'] as List<dynamic>;
    expect(messages.first['content'], '此人甲');
  });

  test('missing key stores the population and does not call the model', () async {
    final judge = _ScriptJudge((system, user) async {
      throw StateError('should not call');
    });
    final database = LocalDatabase(NativeDatabase.memory());
    addTearDown(database.close);
    final repository = PredictionRepositoryImpl(
      database: database,
      judge: judge,
      populationSize: 24,
      newId: () => 'run-1',
    );
    final session = await repository.run(
      message: '人们会不会用，会不会付钱',
      liveCalls: 3,
      config: DeepSeekConfig.missing,
    );
    expect(session.status, PredictionStatus.missingKey);
    expect(session.populationSize, 24);
    expect(session.liveCalls, 0);
    expect(judge.calls, 0);
    expect(session.results, hasLength(3));
    expect(session.results.every((result) => !result.called), isTrue);

    final runs = await database.select(database.storedRuns).get();
    final personas = await database.select(database.storedPersonas).get();
    expect(runs, hasLength(1));
    expect(personas, hasLength(24));
    expect(personas.where((row) => row.wasCalled), isEmpty);
  });

  test('parallel calls keep going when one response cannot be parsed', () async {
    var seen = 0;
    final judge = _ScriptJudge((system, user) async {
      final mine = seen;
      seen += 1;
      await Future<void>.delayed(Duration.zero);
      if (mine == 0) return '不是 json';
      return jsonEncode({
        'primary_label': '会用',
        'primary_yes': true,
        'secondary_label': '会付钱',
        'secondary_yes': false,
        'one_act': '会打开，不会付钱',
        'trend': '不是这一次',
        'self_theory': '因为好用',
        'residual': '仍可能错',
      });
    });
    final repository = PredictionRepositoryImpl(
      database: null,
      judge: judge,
      populationSize: 12,
    );
    final session = await repository.run(
      message: '会不会用，会不会付钱',
      liveCalls: 3,
      config: const DeepSeekConfig(
        apiKey: 'secret-key',
        baseUrl: DeepSeekConfig.defaultBaseUrl,
        model: 'deepseek-flash',
        maxParallelCalls: 3,
      ),
    );
    expect(judge.maxInFlight, 3);
    expect(session.results.where((result) => result.judgement != null), hasLength(2));
    expect(session.results.where((result) => result.errorMessage != null), hasLength(1));
    expect(session.status, PredictionStatus.partial);
    expect(session.aggregate.primaryYes, 2);
    expect(session.aggregate.counted, 2);
    expect(session.aggregate.secondaryYes, 0);
  });
}

class _ScriptJudge implements PersonaJudge {
  _ScriptJudge(this._handler);

  final Future<String> Function(String system, String user) _handler;
  var calls = 0;
  var inFlight = 0;
  var maxInFlight = 0;

  @override
  Future<String> complete({
    required String system,
    required String user,
    AppCancelToken? cancel,
  }) async {
    calls += 1;
    inFlight += 1;
    if (inFlight > maxInFlight) maxInFlight = inFlight;
    try {
      return await _handler(system, user);
    } finally {
      inFlight -= 1;
    }
  }
}
