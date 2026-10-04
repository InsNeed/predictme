import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'core/config/deepseek_config.dart';
import 'core/injection.dart';
import 'features/predict/domain/prediction_repository.dart';
import 'features/predict/presentation/predict_controller.dart';
import 'features/predict/presentation/predict_page.dart';

class PredictMeApp extends StatelessWidget {
  const PredictMeApp({super.key, this.controller});

  /// 测试传入。正式启动时从依赖注入里取。
  final PredictController? controller;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Predict Me',
      debugShowCheckedModeBanner: false,
      locale: const Locale('zh', 'CN'),
      supportedLocales: const [Locale('zh', 'CN')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF3D5AFE)),
        useMaterial3: true,
      ),
      home: controller == null
          ? const _BootstrappedHome()
          : PredictPage(controller: controller!),
    );
  }
}

class _BootstrappedHome extends StatefulWidget {
  const _BootstrappedHome();

  @override
  State<_BootstrappedHome> createState() => _BootstrappedHomeState();
}

class _BootstrappedHomeState extends State<_BootstrappedHome> {
  late final PredictController _controller = PredictController(
    repository: sl<PredictionRepository>(),
    loaded: sl<LoadedDeepSeekConfig>(),
  );

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PredictPage(controller: _controller);
  }
}
