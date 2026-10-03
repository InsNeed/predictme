import 'package:flutter/material.dart';
import 'package:predictme/models/prediction.dart';
import 'package:predictme/services/prediction_runner.dart';
import 'package:predictme/state/prediction_history.dart';
import 'package:predictme/ui/create_prediction_screen.dart';
import 'package:predictme/ui/result_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({required this.runner, super.key});

  final PredictionRunner runner;

  Future<void> _create(BuildContext context) async {
    final prediction = await Navigator.of(context).push<Prediction>(
      MaterialPageRoute(builder: (_) => CreatePredictionScreen(runner: runner)),
    );
    if (prediction == null || !context.mounted) {
      return;
    }
    await Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (_) => ResultScreen(
          prediction: prediction,
          runner: runner,
          recordHistory: true,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final history = PredictionHistoryScope.of(context);
    final runs = history.runs;
    return Scaffold(
      appBar: AppBar(title: const Text('Predict Me')),
      body: runs.isEmpty
          ? const _EmptyState()
          : ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
              itemCount: runs.length + 1,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                if (index == 0) {
                  return const _Intro();
                }
                final run = runs[index - 1];
                return _HistoryCard(
                  topic: run.prediction.topic,
                  createdAt: run.prediction.createdAt,
                  useLabel:
                      '${run.summary.wouldUseCount}/${run.summary.personaCount}',
                  payLabel:
                      '${run.summary.wouldPayCount}/${run.summary.personaCount}',
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => ResultScreen(
                          prediction: run.prediction,
                          runner: runner,
                          existing: run,
                        ),
                      ),
                    );
                  },
                );
              },
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _create(context),
        icon: const Icon(Icons.add),
        label: const Text('新建预测'),
      ),
    );
  }
}

class _Intro extends StatelessWidget {
  const _Intro();

  @override
  Widget build(BuildContext context) {
    return Text(
      '同一个话题，交给不同的人设同时回答。',
      style: Theme.of(context).textTheme.bodyLarge,
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.forum_outlined,
              size: 72,
              color: theme.colorScheme.primary,
            ),
            const SizedBox(height: 16),
            Text('还没有预测', style: theme.textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text(
              '写下一个你想判断的话题，并补充背景。固定人设会同时回答：会不会用、会不会付费、原因和顾虑。',
              style: theme.textTheme.bodyLarge,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _HistoryCard extends StatelessWidget {
  const _HistoryCard({
    required this.topic,
    required this.createdAt,
    required this.useLabel,
    required this.payLabel,
    required this.onTap,
  });

  final String topic;
  final DateTime createdAt;
  final String useLabel;
  final String payLabel;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: ListTile(
        title: Text(topic),
        subtitle: Text(
          '${_formatTimestamp(createdAt)} · 使用 $useLabel · 付费 $payLabel',
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}

String _formatTimestamp(DateTime time) {
  final local = time.toLocal();
  String two(int value) => value.toString().padLeft(2, '0');
  return '${local.year}-${two(local.month)}-${two(local.day)} ${two(local.hour)}:${two(local.minute)}';
}
