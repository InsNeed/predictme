import 'package:flutter/material.dart';

import '../../../core/config/live_call_quota.dart';
import '../domain/aggregate.dart';
import '../domain/prediction_session.dart';
import 'predict_controller.dart';

class PredictPage extends StatefulWidget {
  const PredictPage({required this.controller, super.key});

  final PredictController controller;

  @override
  State<PredictPage> createState() => _PredictPageState();
}

class _PredictPageState extends State<PredictPage> {
  final _message = TextEditingController();

  @override
  void dispose() {
    _message.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.controller,
      builder: (context, _) {
        final controller = widget.controller;
        final session = controller.session;
        return Scaffold(
          appBar: AppBar(title: const Text('Predict Me')),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
            children: [
              if (controller.banner != null) Text(controller.banner!),
              if (controller.callCountNote != null) ...[
                const SizedBox(height: 8),
                Text(controller.callCountNote!),
              ],
              const SizedBox(height: 16),
              TextField(
                key: const Key('prediction-message'),
                controller: _message,
                minLines: 3,
                maxLines: 6,
                decoration: const InputDecoration(
                  labelText: '要预测的事',
                  alignLabelWithHint: true,
                  hintText: '例如：人们会不会用这个应用，会不会为它付钱',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Text('实呼人数'),
                  const Spacer(),
                  IconButton(
                    onPressed: controller.running || controller.liveCalls <= 1
                        ? null
                        : () => controller.setLiveCalls(controller.liveCalls - 1),
                    icon: const Icon(Icons.remove),
                  ),
                  Text(
                    '${controller.liveCalls}',
                    key: const Key('live-call-count'),
                  ),
                  IconButton(
                    onPressed: controller.running ||
                            controller.liveCalls >= kMaxLiveCalls
                        ? null
                        : () => controller.setLiveCalls(controller.liveCalls + 1),
                    icon: const Icon(Icons.add),
                  ),
                ],
              ),
              Text('模型 ${controller.config.model}。默认 $kDefaultLiveCalls 人，最多 $kMaxLiveCalls 人。'),
              const SizedBox(height: 12),
              FilledButton(
                key: const Key('start-prediction'),
                onPressed: controller.running
                    ? null
                    : () => controller.submit(_message.text),
                child: const Text('开始预测'),
              ),
              if (controller.formError != null) ...[
                const SizedBox(height: 12),
                Text(controller.formError!),
              ],
              if (controller.running) ...[
                const SizedBox(height: 24),
                const Center(child: CircularProgressIndicator()),
                const SizedBox(height: 8),
                Center(
                  child: Text('正在并行询问 ${controller.liveCalls} 个人…'),
                ),
              ],
              if (session != null) ...[
                const SizedBox(height: 24),
                Text(session.statusMessage),
                if (session.storageWarning != null) Text(session.storageWarning!),
                const SizedBox(height: 8),
                Text('本地人口 ${session.populationSize} 人，本次实呼 ${session.liveCalls} 人。'),
                const SizedBox(height: 8),
                Text(
                  '${session.aggregate.primaryLabel} ${formatCount(session.aggregate.primaryYes, session.aggregate.counted)}',
                ),
                Text(
                  '${session.aggregate.secondaryLabel} ${formatCount(session.aggregate.secondaryYes, session.aggregate.counted)}',
                ),
                const SizedBox(height: 8),
                const Text('比例只来自这次实呼成功、且标签一致的人，不是全国比例。'),
                const SizedBox(height: 16),
                for (final result in session.results) ...[
                  _PersonaCard(result: result),
                  const SizedBox(height: 12),
                ],
              ],
            ],
          ),
        );
      },
    );
  }
}

class _PersonaCard extends StatelessWidget {
  const _PersonaCard({required this.result});

  final PersonaCallResult result;

  @override
  Widget build(BuildContext context) {
    final persona = result.persona;
    final judgement = result.judgement;
    final decision = persona.decision;
    return DecoratedBox(
      decoration: BoxDecoration(
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('${persona.name} · ${persona.age}岁 · ${persona.sexLabel} · ${persona.residenceLabel}'),
            const SizedBox(height: 6),
            if (judgement == null && result.errorMessage == null)
              const Text('尚未询问'),
            if (result.errorMessage != null) Text(result.errorMessage!),
            if (judgement != null) ...[
              Text('${judgement.primaryLabel}：${judgement.primaryYes ? '是' : '否'}'),
              Text('${judgement.secondaryLabel}：${judgement.secondaryYes ? '是' : '否'}'),
              Text(judgement.oneAct),
              Text('趋势（不是这一次）：${judgement.trend}'),
              Text('嘴上的理由（自我理论，不是机制）：${judgement.selfTheory}'),
              Text('残余：${judgement.residual}'),
            ],
            const SizedBox(height: 6),
            Text(decision.frameStatement),
            Text(decision.emotionModulation),
            Text(decision.expectation),
            Text(decision.trendNotThisAct),
          ],
        ),
      ),
    );
  }
}
