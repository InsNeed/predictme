import 'package:flutter/material.dart';
import 'package:predictme/models/prediction.dart';
import 'package:predictme/services/prediction_runner.dart';

class CreatePredictionScreen extends StatefulWidget {
  const CreatePredictionScreen({required this.runner, super.key});

  final PredictionRunner runner;

  @override
  State<CreatePredictionScreen> createState() => _CreatePredictionScreenState();
}

class _CreatePredictionScreenState extends State<CreatePredictionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _topicController = TextEditingController();
  final _backgroundController = TextEditingController();

  @override
  void dispose() {
    _topicController.dispose();
    _backgroundController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    final prediction = Prediction(
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      topic: _topicController.text.trim(),
      background: _backgroundController.text.trim(),
      createdAt: DateTime.now(),
    );
    Navigator.of(context).pop(prediction);
  }

  @override
  Widget build(BuildContext context) {
    final count = widget.runner.personas.length;
    return Scaffold(
      appBar: AppBar(title: const Text('新建预测')),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Text(
                '将由 $count 个人设并行回答同一份问卷。',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 20),
              TextFormField(
                controller: _topicController,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                  labelText: '话题',
                  hintText: '例如：我的记账应用会不会有人用',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return '请填写话题';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _backgroundController,
                minLines: 5,
                maxLines: 8,
                decoration: const InputDecoration(
                  labelText: '背景',
                  alignLabelWithHint: true,
                  hintText: '说明对象、场景和你已经知道的事实。例如应用做什么、给谁用、打算怎么收费。',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return '请补充背景';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 24),
              FilledButton(onPressed: _submit, child: const Text('开始预测')),
            ],
          ),
        ),
      ),
    );
  }
}
