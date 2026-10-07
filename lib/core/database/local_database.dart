import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

import '../logging/app_logger.dart';
import '../logging/log_enums.dart';

part 'local_database.g.dart';

/// 一次预测运行。全量人设在 [StoredPersonas]。
class StoredRuns extends Table {
  TextColumn get id => text()();

  TextColumn get message => text()();

  DateTimeColumn get createdAt => dateTime()();

  IntColumn get populationSize => integer()();

  IntColumn get liveCallCount => integer()();

  TextColumn get status => text()();

  TextColumn get aggregateJson => text()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

/// 某一次运行里的一个人。未实呼的人也留在本地。
@TableIndex(name: 'stored_personas_run', columns: {#runId})
class StoredPersonas extends Table {
  TextColumn get id => text()();

  TextColumn get runId => text()();

  IntColumn get ordinal => integer()();

  BoolColumn get wasCalled => boolean()();

  TextColumn get profileJson => text()();

  TextColumn get outcomeJson => text().nullable()();

  TextColumn get errorMessage => text().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

@DriftDatabase(tables: [StoredRuns, StoredPersonas])
class LocalDatabase extends _$LocalDatabase {
  LocalDatabase([QueryExecutor? executor])
    : super(executor ?? _openConnection());

  @override
  int get schemaVersion => 1;

  static QueryExecutor _openConnection() {
    return driftDatabase(
      name: 'predictme',
      // 与 pubspec.lock 里的 drift 2.35.1 对应，文件放在 web/。
      web: DriftWebOptions(
        sqlite3Wasm: Uri.parse('sqlite3.wasm'),
        driftWorker: Uri.parse('drift_worker.js'),
        onResult: (result) {
          if (result.missingFeatures.isEmpty) return;
          AppLogger.warning(
            'Web 数据库使用 ${result.chosenImplementation}，'
            '缺少 ${result.missingFeatures}',
            module: AppLogModule.database,
            layer: AppLogLayer.infrastructure,
          );
        },
      ),
    );
  }
}
