import 'package:flutter/material.dart';
import 'package:predictme/data/questionnaire.dart';
import 'package:predictme/models/prediction.dart';
import 'package:predictme/models/prediction_run.dart';
import 'package:predictme/services/aggregation.dart';
import 'package:predictme/services/prediction_runner.dart';
import 'package:predictme/state/prediction_history.dart';

class ResultScreen extends StatefulWidget {
  const ResultScreen({
    required this.prediction,
    required this.runner,
    this.existing,
    this.recordHistory = false,
    super.key,
  });

  final Prediction prediction;
  final PredictionRunner runner;
  final PredictionRun? existing;
  final bool recordHistory;

  @override
  State<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends State<ResultScreen> {
  PredictionRun? _result;
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final existing = widget.existing;
    if (existing != null) {
      _result = existing;
      return;
    }
    _loading = true;
    Future<void>.microtask(_execute);
  }

  Future<void> _execute() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await widget.runner.run(widget.prediction);
      if (!mounted) {
        return;
      }
      if (widget.recordHistory) {
        PredictionHistoryScope.read(context).add(result);
      }
      setState(() {
        _result = result;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = '这次没有完成，请再试一次。';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('预测结果')),
      body: _body(context),
    );
  }

  Widget _body(BuildContext context) {
    if (_loading) {
      return const _LoadingState();
    }
    final error = _error;
    if (error != null) {
      return _ErrorState(message: error, onRetry: _execute);
    }
    final result = _result;
    if (result == null) {
      return const _EmptyResult();
    }
    return _ResultBody(result: result);
  }
}

class _LoadingState extends StatelessWidget {
  const _LoadingState();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 16),
          Text('人设正在并行作答…'),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.error_outline,
              size: 56,
              color: Theme.of(context).colorScheme.error,
            ),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            FilledButton(onPressed: onRetry, child: const Text('再试一次')),
          ],
        ),
      ),
    );
  }
}

class _EmptyResult extends StatelessWidget {
  const _EmptyResult();

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('还没有结果'));
  }
}

class _ResultBody extends StatelessWidget {
  const _ResultBody({required this.result});

  final PredictionRun result;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final summary = result.summary;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: [
        Text(result.prediction.topic, style: theme.textTheme.headlineSmall),
        const SizedBox(height: 8),
        Text(result.prediction.background, style: theme.textTheme.bodyLarge),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _StatCard(
                label: '使用率',
                value: formatRate(summary.wouldUseCount, summary.personaCount),
                detail: '${summary.wouldUseCount}/${summary.personaCount} 会用',
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _StatCard(
                label: '付费率',
                value: formatRate(summary.wouldPayCount, summary.personaCount),
                detail: '${summary.wouldPayCount}/${summary.personaCount} 会付费',
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        Text('每个人设', style: theme.textTheme.titleMedium),
        const SizedBox(height: 8),
        for (final response in result.responses) ...[
          _PersonaCard(response: response),
          const SizedBox(height: 12),
        ],
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.detail,
  });

  final String label;
  final String value;
  final String detail;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      color: theme.colorScheme.secondaryContainer,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: theme.textTheme.labelLarge),
            const SizedBox(height: 4),
            Text(value, style: theme.textTheme.headlineMedium),
            const SizedBox(height: 4),
            Text(detail, style: theme.textTheme.bodyMedium),
          ],
        ),
      ),
    );
  }
}

class _PersonaCard extends StatelessWidget {
  const _PersonaCard({required this.response});

  final PersonaResponse response;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final persona = response.persona;
    final glyph = persona.name.isEmpty
        ? '?'
        : String.fromCharCode(persona.name.runes.first);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(child: Text(glyph)),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(persona.name, style: theme.textTheme.titleMedium),
                      Text(persona.role, style: theme.textTheme.bodyMedium),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                Chip(
                  label: Text(response.wouldUse ? '会用' : '不会用'),
                  avatar: Icon(
                    response.wouldUse ? Icons.check : Icons.close,
                    size: 18,
                  ),
                ),
                Chip(
                  label: Text(response.wouldPay ? '会付费' : '不会付费'),
                  avatar: Icon(
                    response.wouldPay ? Icons.check : Icons.close,
                    size: 18,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            for (final question in kQuestionnaire) ...[
              Text(question.prompt, style: theme.textTheme.labelLarge),
              const SizedBox(height: 4),
              Text(response.answerFor(question.id).text),
              const SizedBox(height: 10),
            ],
          ],
        ),
      ),
    );
  }
}
