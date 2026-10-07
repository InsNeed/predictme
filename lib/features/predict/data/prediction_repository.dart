import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:flutter/foundation.dart';

import '../../../core/config/deepseek_config.dart';
import '../../../core/config/live_call_quota.dart';
import '../../../core/database/local_database.dart';
import '../../../core/errors/error_mapper.dart';
import '../../../core/logging/app_logger.dart';
import '../../../core/logging/log_enums.dart';
import '../../../core/logging/prompt_request_logger.dart';
import '../../../core/network/cancellation_token.dart';
import '../domain/aggregate.dart';
import '../domain/judgement.dart';
import '../domain/persona.dart';
import '../domain/persona_judge.dart';
import '../domain/persona_prompt.dart';
import '../domain/population_generator.dart';
import '../domain/prediction_repository.dart';
import '../domain/prediction_session.dart';

class PredictionRepositoryImpl implements PredictionRepository {
  PredictionRepositoryImpl({
    required this.database,
    required this.judge,
    this.populationSize = kDefaultPopulationSize,
    this.newId,
    this.now,
    bool? browserBlocksLiveCalls,
  }) : browserBlocksLiveCalls = browserBlocksLiveCalls ?? kIsWeb;

  final LocalDatabase? database;
  final PersonaJudge judge;
  final int populationSize;
  final String Function()? newId;
  final DateTime Function()? now;

  /// Web 上不向 DeepSeek 发请求。测试可显式打开。
  final bool browserBlocksLiveCalls;

  AppCancelToken? _active;

  @override
  void cancelActive() {
    _active?.cancel('cancelled');
  }

  @override
  Future<PredictionSession> run({
    required String message,
    required int liveCalls,
    required DeepSeekConfig config,
  }) async {
    final trimmed = message.trim();
    if (trimmed.isEmpty) {
      return PredictionSession(
        message: trimmed,
        populationSize: 0,
        liveCalls: 0,
        model: config.model,
        results: const [],
        aggregate: summarize(
          populationSize: 0,
          called: 0,
          judgements: const [],
        ),
        status: PredictionStatus.emptyMessage,
        statusMessage: '请先写下要预测的事',
      );
    }

    final requested = clampLiveCalls(liveCalls);
    final population = generatePopulation(size: populationSize);
    final indexes = liveCallIndexes(
      population: population.length,
      calls: requested,
    );
    final preview = [for (final index in indexes) population[index]];
    if (!config.hasKey) {
      final session = _session(
        message: trimmed,
        populationSize: population.length,
        liveCalls: 0,
        model: config.model,
        results: [
          for (final persona in preview) PersonaCallResult(persona: persona),
        ],
        status: PredictionStatus.missingKey,
        statusMessage: '还没有 DeepSeek 密钥，这次没有发出请求。',
      );
      return _persist(
        session: session,
        population: population,
        calledIds: const {},
      );
    }

    if (browserBlocksLiveCalls) {
      final session = _session(
        message: trimmed,
        populationSize: population.length,
        liveCalls: 0,
        model: config.model,
        results: [
          for (final persona in preview) PersonaCallResult(persona: persona),
        ],
        status: PredictionStatus.browserBlocked,
        statusMessage: browserLiveCallBlockedMessage,
      );
      return _persist(
        session: session,
        population: population,
        calledIds: const {},
      );
    }

    _active?.cancel('replaced');
    final token = AppCancelToken();
    _active = token;
    final results = await Future.wait(
      preview.map((persona) => _one(persona, trimmed, token)),
    );
    if (identical(_active, token)) {
      _active = null;
    }
    final failed = results.where((result) => result.errorMessage != null).length;
    final status = failed == 0
        ? PredictionStatus.completed
        : failed == results.length
            ? PredictionStatus.failed
            : PredictionStatus.partial;
    final statusMessage = switch (status) {
      PredictionStatus.completed => '这一次问完了。比例只来自下面实呼成功的人，不是全国比例。',
      PredictionStatus.partial => '有的人没有返回。下面的比例只算成功的人。',
      PredictionStatus.failed => '这次没有人返回可用的判断。',
      PredictionStatus.missingKey ||
      PredictionStatus.emptyMessage ||
      PredictionStatus.browserBlocked =>
        '',
    };
    final session = _session(
      message: trimmed,
      populationSize: population.length,
      liveCalls: results.length,
      model: config.model,
      results: results,
      status: status,
      statusMessage: statusMessage,
    );
    return _persist(
      session: session,
      population: population,
      calledIds: {for (final result in results) result.persona.id},
    );
  }

  Future<PersonaCallResult> _one(
    Persona persona,
    String message,
    AppCancelToken token,
  ) async {
    final system = buildSystemPrompt(persona);
    final user = buildUserPrompt(message);
    PromptRequestLogger.log(
      label: persona.id,
      system: system,
      user: user,
    );
    try {
      final raw = await judge.complete(
        system: system,
        user: user,
        cancel: token,
      );
      return PersonaCallResult(
        persona: persona,
        judgement: parseJudgement(raw),
      );
    } catch (error, stackTrace) {
      final failure = error is FormatException
          ? '这个人的回答无法解析'
          : ErrorMapper.toFailure(error, stackTrace).message;
      AppLogger.warning(
        '${persona.id} $failure',
        module: AppLogModule.predict,
        layer: AppLogLayer.data,
        error: error,
        stackTrace: stackTrace,
      );
      return PersonaCallResult(persona: persona, errorMessage: failure);
    }
  }

  PredictionSession _session({
    required String message,
    required int populationSize,
    required int liveCalls,
    required String model,
    required List<PersonaCallResult> results,
    required PredictionStatus status,
    required String statusMessage,
  }) {
    return PredictionSession(
      message: message,
      populationSize: populationSize,
      liveCalls: liveCalls,
      model: model,
      results: results,
      aggregate: summarize(
        populationSize: populationSize,
        called: liveCalls,
        judgements: [for (final result in results) result.judgement],
      ),
      status: status,
      statusMessage: statusMessage,
    );
  }

  Future<PredictionSession> _persist({
    required PredictionSession session,
    required List<Persona> population,
    required Set<String> calledIds,
  }) async {
    final database = this.database;
    if (database == null) return session;
    final outcomes = {
      for (final result in session.results) result.persona.id: result,
    };
    try {
      final runId = newId?.call() ?? 'run-${DateTime.now().microsecondsSinceEpoch}';
      await database.transaction(() async {
        await database.into(database.storedRuns).insert(
              StoredRunsCompanion.insert(
                id: runId,
                message: session.message,
                createdAt: now?.call() ?? DateTime.now(),
                populationSize: session.populationSize,
                liveCallCount: session.liveCalls,
                status: session.status.name,
                aggregateJson: jsonEncode(session.aggregate.toJson()),
              ),
            );
        await database.batch((batch) {
          batch.insertAll(
            database.storedPersonas,
            [
              for (final persona in population)
                StoredPersonasCompanion.insert(
                  id: '$runId-${persona.id}',
                  runId: runId,
                  ordinal: int.parse(persona.id.substring(1)),
                  wasCalled: calledIds.contains(persona.id),
                  profileJson: jsonEncode(persona.toJson()),
                  outcomeJson: Value(
                    outcomes[persona.id]?.judgement == null
                        ? null
                        : jsonEncode(outcomes[persona.id]!.judgement!.toJson()),
                  ),
                  errorMessage: Value(outcomes[persona.id]?.errorMessage),
                ),
            ],
          );
        });
      });
      return session;
    } catch (error, stackTrace) {
      AppLogger.error(
        '预测结果没有写入本地数据库',
        module: AppLogModule.database,
        layer: AppLogLayer.data,
        error: error,
        stackTrace: stackTrace,
      );
      return PredictionSession(
        message: session.message,
        populationSize: session.populationSize,
        liveCalls: session.liveCalls,
        model: session.model,
        results: session.results,
        aggregate: session.aggregate,
        status: session.status,
        statusMessage: session.statusMessage,
        storageWarning: '这次结果没有写入本地数据库',
      );
    }
  }
}
