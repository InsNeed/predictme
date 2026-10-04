import 'package:flutter/widgets.dart';

import 'core/injection.dart';
import 'core/logging/app_logger.dart';
import 'core/logging/log_enums.dart';

/// 先日志，再依赖。不初始化 Firebase。
Future<void> bootstrap() async {
  WidgetsFlutterBinding.ensureInitialized();
  await AppLogger.init();
  AppLogger.info(
    '应用启动',
    module: AppLogModule.app,
    layer: AppLogLayer.infrastructure,
  );
  await configureDependencies();
  AppLogger.info(
    '依赖注入配置完成',
    module: AppLogModule.app,
    layer: AppLogLayer.infrastructure,
  );
}
