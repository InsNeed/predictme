import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:predictme/core/config/deepseek_config.dart';
import 'package:predictme/features/predict/domain/aggregate.dart';
import 'package:predictme/features/predict/domain/judgement.dart';
import 'package:predictme/features/predict/domain/population_generator.dart';
import 'package:predictme/features/predict/domain/prediction_repository.dart';
import 'package:predictme/features/predict/domain/prediction_session.dart';
import 'package:predictme/features/predict/presentation/predict_controller.dart';
import 'package:predictme/predict_me_app.dart';

void main() {
  testWidgets('empty message explains what is missing', (tester) async {
    await tester.pumpWidget(
      PredictMeApp(controller: _controller(_missingSession())),
    );
    await tester.tap(find.text('开始预测'));
    await tester.pump();
    expect(find.text('请先写下要预测的事'), findsOneWidget);
  });

  testWidgets('missing key shows the population and does not crash', (tester) async {
    final persona = generatePopulation(size: 16).first;
    final session = PredictionSession(
      message: '人们会不会用',
      populationSize: 960,
      liveCalls: 0,
      model: 'deepseek-flash',
      results: [PersonaCallResult(persona: persona)],
      aggregate: summarize(
        populationSize: 960,
        called: 0,
        judgements: const [null],
      ),
      status: PredictionStatus.missingKey,
      statusMessage: '还没有 DeepSeek 密钥，这次没有发出请求。',
    );
    await tester.pumpWidget(
      PredictMeApp(controller: _controller(session)),
    );
    expect(find.textContaining('还没有 DeepSeek 密钥'), findsOneWidget);
    await tester.enterText(
      find.byKey(const Key('prediction-message')),
      '人们会不会用这个应用，会不会为它付钱',
    );
    await tester.tap(find.text('开始预测'));
    await tester.pumpAndSettle();
    expect(find.text('还没有 DeepSeek 密钥，这次没有发出请求。'), findsOneWidget);
    expect(find.textContaining('本地人口 960 人'), findsOneWidget);
    expect(find.text('尚未询问'), findsOneWidget);
    expect(find.textContaining(persona.name), findsOneWidget);
  });

  testWidgets('a configured key is never shown, and results aggregate', (tester) async {
    const secret = 'sk-test-secret-value';
    final persona = generatePopulation(size: 16)[1];
    final session = PredictionSession(
      message: '人们会不会用',
      populationSize: 960,
      liveCalls: 1,
      model: 'deepseek-flash',
      results: [
        PersonaCallResult(
          persona: persona,
          judgement: const PersonaJudgement(
            primaryLabel: '会用',
            primaryYes: false,
            secondaryLabel: '会付钱',
            secondaryYes: false,
            oneAct: '这一次不会打开',
            trend: '趋势不是这一次',
            selfTheory: '因为好用',
            residual: '仍可能错',
          ),
        ),
      ],
      aggregate: summarize(
        populationSize: 960,
        called: 1,
        judgements: const [
          PersonaJudgement(
            primaryLabel: '会用',
            primaryYes: false,
            secondaryLabel: '会付钱',
            secondaryYes: false,
            oneAct: '这一次不会打开',
            trend: '趋势不是这一次',
            selfTheory: '因为好用',
            residual: '仍可能错',
          ),
        ],
      ),
      status: PredictionStatus.completed,
      statusMessage: '这一次问完了。比例只来自下面实呼成功的人，不是全国比例。',
    );
    await tester.pumpWidget(
      PredictMeApp(
        controller: PredictController(
          repository: _Repo(session),
          loaded: const LoadedDeepSeekConfig(
            config: DeepSeekConfig(
              apiKey: secret,
              baseUrl: DeepSeekConfig.defaultBaseUrl,
              model: DeepSeekConfig.defaultModel,
              maxParallelCalls: 3,
            ),
          ),
        ),
      ),
    );
    expect(find.textContaining(secret), findsNothing);
    expect(find.textContaining('密钥已从本机配置读取'), findsOneWidget);
    await tester.enterText(
      find.byKey(const Key('prediction-message')),
      '人们会不会用',
    );
    await tester.tap(find.text('开始预测'));
    await tester.pumpAndSettle();
    expect(find.text('会用：否'), findsOneWidget);
    expect(find.text('会付钱：否'), findsOneWidget);
    expect(find.text('会用 0/1'), findsOneWidget);
    expect(find.textContaining(secret), findsNothing);
  });

  testWidgets('live calls stop at 8 and a run can show progress', (tester) async {
    final release = Completer<void>();
    final repo = _Repo(_missingSession(), release);
    await tester.pumpWidget(PredictMeApp(controller: _controllerFrom(repo)));
    for (var i = 0; i < 10; i++) {
      await tester.tap(find.byIcon(Icons.add));
      await tester.pump();
    }
    expect(
      tester.widget<Text>(find.byKey(const Key('live-call-count'))).data,
      '8',
    );
    await tester.enterText(find.byKey(const Key('prediction-message')), '会不会用');
    await tester.tap(find.text('开始预测'));
    await tester.pump();
    expect(find.text('正在并行询问 8 个人…'), findsOneWidget);
    release.complete();
    await tester.pumpAndSettle();
    expect(find.textContaining('这次没有发出请求'), findsOneWidget);
  });

  testWidgets('a thrown run stays on the page', (tester) async {
    await tester.pumpWidget(
      PredictMeApp(controller: _controllerFrom(_ThrowingRepo())),
    );
    await tester.enterText(find.byKey(const Key('prediction-message')), '会不会用');
    await tester.tap(find.text('开始预测'));
    await tester.pumpAndSettle();
    expect(find.text('这次没有完成，请再试一次。'), findsOneWidget);
  });
}

PredictController _controller(PredictionSession session) {
  return PredictController(
    repository: _Repo(session),
    loaded: const LoadedDeepSeekConfig(config: DeepSeekConfig.missing),
  );
}

PredictController _controllerFrom(PredictionRepository repository) {
  return PredictController(
    repository: repository,
    loaded: const LoadedDeepSeekConfig(config: DeepSeekConfig.missing),
  );
}

PredictionSession _missingSession() {
  return PredictionSession(
    message: '会不会用',
    populationSize: 960,
    liveCalls: 0,
    model: 'deepseek-flash',
    results: const [],
    aggregate: summarize(
      populationSize: 960,
      called: 0,
      judgements: const [],
    ),
    status: PredictionStatus.missingKey,
    statusMessage: '还没有 DeepSeek 密钥，这次没有发出请求。',
  );
}

class _Repo implements PredictionRepository {
  _Repo(this.session, [this.release]);

  final PredictionSession session;
  final Completer<void>? release;

  @override
  void cancelActive() {}

  @override
  Future<PredictionSession> run({
    required String message,
    required int liveCalls,
    required DeepSeekConfig config,
  }) async {
    final gate = release;
    if (gate != null) await gate.future;
    return session;
  }
}

class _ThrowingRepo implements PredictionRepository {
  @override
  void cancelActive() {}

  @override
  Future<PredictionSession> run({
    required String message,
    required int liveCalls,
    required DeepSeekConfig config,
  }) {
    throw StateError('boom');
  }
}
