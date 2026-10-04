import 'package:get_it/get_it.dart';

import '../features/predict/data/deepseek_persona_judge.dart';
import '../features/predict/data/prediction_repository.dart';
import '../features/predict/domain/persona_judge.dart';
import '../features/predict/domain/prediction_repository.dart';
import 'config/deepseek_config.dart';
import 'config/deepseek_config_loader.dart';
import 'database/local_database.dart';
import 'network/dio_client.dart';

final GetIt sl = GetIt.instance;

/// 注册日志之后才用得到的单例。重复调用直接返回。
Future<void> configureDependencies() async {
  if (sl.isRegistered<PredictionRepository>()) return;

  final loaded = await DeepSeekConfigLoader().load();
  sl.registerSingleton<LoadedDeepSeekConfig>(loaded);
  sl.registerSingleton<DioClient>(DioClient(baseUrl: loaded.config.baseUrl));
  sl.registerSingleton<LocalDatabase>(LocalDatabase());
  sl.registerSingleton<PersonaJudge>(
    DeepSeekPersonaJudge(
      client: sl<DioClient>(),
      config: loaded.config,
    ),
  );
  sl.registerSingleton<PredictionRepository>(
    PredictionRepositoryImpl(
      database: sl<LocalDatabase>(),
      judge: sl<PersonaJudge>(),
    ),
  );
}
