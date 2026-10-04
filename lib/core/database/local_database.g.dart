// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'local_database.dart';

// ignore_for_file: type=lint
class $StoredRunsTable extends StoredRuns
    with TableInfo<$StoredRunsTable, StoredRun> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $StoredRunsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _messageMeta = const VerificationMeta(
    'message',
  );
  @override
  late final GeneratedColumn<String> message = GeneratedColumn<String>(
    'message',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _populationSizeMeta = const VerificationMeta(
    'populationSize',
  );
  @override
  late final GeneratedColumn<int> populationSize = GeneratedColumn<int>(
    'population_size',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _liveCallCountMeta = const VerificationMeta(
    'liveCallCount',
  );
  @override
  late final GeneratedColumn<int> liveCallCount = GeneratedColumn<int>(
    'live_call_count',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
    'status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _aggregateJsonMeta = const VerificationMeta(
    'aggregateJson',
  );
  @override
  late final GeneratedColumn<String> aggregateJson = GeneratedColumn<String>(
    'aggregate_json',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    message,
    createdAt,
    populationSize,
    liveCallCount,
    status,
    aggregateJson,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'stored_runs';
  @override
  VerificationContext validateIntegrity(
    Insertable<StoredRun> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('message')) {
      context.handle(
        _messageMeta,
        message.isAcceptableOrUnknown(data['message']!, _messageMeta),
      );
    } else if (isInserting) {
      context.missing(_messageMeta);
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    if (data.containsKey('population_size')) {
      context.handle(
        _populationSizeMeta,
        populationSize.isAcceptableOrUnknown(
          data['population_size']!,
          _populationSizeMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_populationSizeMeta);
    }
    if (data.containsKey('live_call_count')) {
      context.handle(
        _liveCallCountMeta,
        liveCallCount.isAcceptableOrUnknown(
          data['live_call_count']!,
          _liveCallCountMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_liveCallCountMeta);
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    } else if (isInserting) {
      context.missing(_statusMeta);
    }
    if (data.containsKey('aggregate_json')) {
      context.handle(
        _aggregateJsonMeta,
        aggregateJson.isAcceptableOrUnknown(
          data['aggregate_json']!,
          _aggregateJsonMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_aggregateJsonMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  StoredRun map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return StoredRun(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      message: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}message'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      populationSize: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}population_size'],
      )!,
      liveCallCount: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}live_call_count'],
      )!,
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      aggregateJson: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}aggregate_json'],
      )!,
    );
  }

  @override
  $StoredRunsTable createAlias(String alias) {
    return $StoredRunsTable(attachedDatabase, alias);
  }
}

class StoredRun extends DataClass implements Insertable<StoredRun> {
  final String id;
  final String message;
  final DateTime createdAt;
  final int populationSize;
  final int liveCallCount;
  final String status;
  final String aggregateJson;
  const StoredRun({
    required this.id,
    required this.message,
    required this.createdAt,
    required this.populationSize,
    required this.liveCallCount,
    required this.status,
    required this.aggregateJson,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['message'] = Variable<String>(message);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['population_size'] = Variable<int>(populationSize);
    map['live_call_count'] = Variable<int>(liveCallCount);
    map['status'] = Variable<String>(status);
    map['aggregate_json'] = Variable<String>(aggregateJson);
    return map;
  }

  StoredRunsCompanion toCompanion(bool nullToAbsent) {
    return StoredRunsCompanion(
      id: Value(id),
      message: Value(message),
      createdAt: Value(createdAt),
      populationSize: Value(populationSize),
      liveCallCount: Value(liveCallCount),
      status: Value(status),
      aggregateJson: Value(aggregateJson),
    );
  }

  factory StoredRun.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return StoredRun(
      id: serializer.fromJson<String>(json['id']),
      message: serializer.fromJson<String>(json['message']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      populationSize: serializer.fromJson<int>(json['populationSize']),
      liveCallCount: serializer.fromJson<int>(json['liveCallCount']),
      status: serializer.fromJson<String>(json['status']),
      aggregateJson: serializer.fromJson<String>(json['aggregateJson']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'message': serializer.toJson<String>(message),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'populationSize': serializer.toJson<int>(populationSize),
      'liveCallCount': serializer.toJson<int>(liveCallCount),
      'status': serializer.toJson<String>(status),
      'aggregateJson': serializer.toJson<String>(aggregateJson),
    };
  }

  StoredRun copyWith({
    String? id,
    String? message,
    DateTime? createdAt,
    int? populationSize,
    int? liveCallCount,
    String? status,
    String? aggregateJson,
  }) => StoredRun(
    id: id ?? this.id,
    message: message ?? this.message,
    createdAt: createdAt ?? this.createdAt,
    populationSize: populationSize ?? this.populationSize,
    liveCallCount: liveCallCount ?? this.liveCallCount,
    status: status ?? this.status,
    aggregateJson: aggregateJson ?? this.aggregateJson,
  );
  StoredRun copyWithCompanion(StoredRunsCompanion data) {
    return StoredRun(
      id: data.id.present ? data.id.value : this.id,
      message: data.message.present ? data.message.value : this.message,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      populationSize: data.populationSize.present
          ? data.populationSize.value
          : this.populationSize,
      liveCallCount: data.liveCallCount.present
          ? data.liveCallCount.value
          : this.liveCallCount,
      status: data.status.present ? data.status.value : this.status,
      aggregateJson: data.aggregateJson.present
          ? data.aggregateJson.value
          : this.aggregateJson,
    );
  }

  @override
  String toString() {
    return (StringBuffer('StoredRun(')
          ..write('id: $id, ')
          ..write('message: $message, ')
          ..write('createdAt: $createdAt, ')
          ..write('populationSize: $populationSize, ')
          ..write('liveCallCount: $liveCallCount, ')
          ..write('status: $status, ')
          ..write('aggregateJson: $aggregateJson')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    message,
    createdAt,
    populationSize,
    liveCallCount,
    status,
    aggregateJson,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is StoredRun &&
          other.id == this.id &&
          other.message == this.message &&
          other.createdAt == this.createdAt &&
          other.populationSize == this.populationSize &&
          other.liveCallCount == this.liveCallCount &&
          other.status == this.status &&
          other.aggregateJson == this.aggregateJson);
}

class StoredRunsCompanion extends UpdateCompanion<StoredRun> {
  final Value<String> id;
  final Value<String> message;
  final Value<DateTime> createdAt;
  final Value<int> populationSize;
  final Value<int> liveCallCount;
  final Value<String> status;
  final Value<String> aggregateJson;
  final Value<int> rowid;
  const StoredRunsCompanion({
    this.id = const Value.absent(),
    this.message = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.populationSize = const Value.absent(),
    this.liveCallCount = const Value.absent(),
    this.status = const Value.absent(),
    this.aggregateJson = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  StoredRunsCompanion.insert({
    required String id,
    required String message,
    required DateTime createdAt,
    required int populationSize,
    required int liveCallCount,
    required String status,
    required String aggregateJson,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       message = Value(message),
       createdAt = Value(createdAt),
       populationSize = Value(populationSize),
       liveCallCount = Value(liveCallCount),
       status = Value(status),
       aggregateJson = Value(aggregateJson);
  static Insertable<StoredRun> custom({
    Expression<String>? id,
    Expression<String>? message,
    Expression<DateTime>? createdAt,
    Expression<int>? populationSize,
    Expression<int>? liveCallCount,
    Expression<String>? status,
    Expression<String>? aggregateJson,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (message != null) 'message': message,
      if (createdAt != null) 'created_at': createdAt,
      if (populationSize != null) 'population_size': populationSize,
      if (liveCallCount != null) 'live_call_count': liveCallCount,
      if (status != null) 'status': status,
      if (aggregateJson != null) 'aggregate_json': aggregateJson,
      if (rowid != null) 'rowid': rowid,
    });
  }

  StoredRunsCompanion copyWith({
    Value<String>? id,
    Value<String>? message,
    Value<DateTime>? createdAt,
    Value<int>? populationSize,
    Value<int>? liveCallCount,
    Value<String>? status,
    Value<String>? aggregateJson,
    Value<int>? rowid,
  }) {
    return StoredRunsCompanion(
      id: id ?? this.id,
      message: message ?? this.message,
      createdAt: createdAt ?? this.createdAt,
      populationSize: populationSize ?? this.populationSize,
      liveCallCount: liveCallCount ?? this.liveCallCount,
      status: status ?? this.status,
      aggregateJson: aggregateJson ?? this.aggregateJson,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (message.present) {
      map['message'] = Variable<String>(message.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (populationSize.present) {
      map['population_size'] = Variable<int>(populationSize.value);
    }
    if (liveCallCount.present) {
      map['live_call_count'] = Variable<int>(liveCallCount.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (aggregateJson.present) {
      map['aggregate_json'] = Variable<String>(aggregateJson.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('StoredRunsCompanion(')
          ..write('id: $id, ')
          ..write('message: $message, ')
          ..write('createdAt: $createdAt, ')
          ..write('populationSize: $populationSize, ')
          ..write('liveCallCount: $liveCallCount, ')
          ..write('status: $status, ')
          ..write('aggregateJson: $aggregateJson, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $StoredPersonasTable extends StoredPersonas
    with TableInfo<$StoredPersonasTable, StoredPersona> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $StoredPersonasTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _runIdMeta = const VerificationMeta('runId');
  @override
  late final GeneratedColumn<String> runId = GeneratedColumn<String>(
    'run_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _ordinalMeta = const VerificationMeta(
    'ordinal',
  );
  @override
  late final GeneratedColumn<int> ordinal = GeneratedColumn<int>(
    'ordinal',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _wasCalledMeta = const VerificationMeta(
    'wasCalled',
  );
  @override
  late final GeneratedColumn<bool> wasCalled = GeneratedColumn<bool>(
    'was_called',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("was_called" IN (0, 1))',
    ),
  );
  static const VerificationMeta _profileJsonMeta = const VerificationMeta(
    'profileJson',
  );
  @override
  late final GeneratedColumn<String> profileJson = GeneratedColumn<String>(
    'profile_json',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _outcomeJsonMeta = const VerificationMeta(
    'outcomeJson',
  );
  @override
  late final GeneratedColumn<String> outcomeJson = GeneratedColumn<String>(
    'outcome_json',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _errorMessageMeta = const VerificationMeta(
    'errorMessage',
  );
  @override
  late final GeneratedColumn<String> errorMessage = GeneratedColumn<String>(
    'error_message',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    runId,
    ordinal,
    wasCalled,
    profileJson,
    outcomeJson,
    errorMessage,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'stored_personas';
  @override
  VerificationContext validateIntegrity(
    Insertable<StoredPersona> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('run_id')) {
      context.handle(
        _runIdMeta,
        runId.isAcceptableOrUnknown(data['run_id']!, _runIdMeta),
      );
    } else if (isInserting) {
      context.missing(_runIdMeta);
    }
    if (data.containsKey('ordinal')) {
      context.handle(
        _ordinalMeta,
        ordinal.isAcceptableOrUnknown(data['ordinal']!, _ordinalMeta),
      );
    } else if (isInserting) {
      context.missing(_ordinalMeta);
    }
    if (data.containsKey('was_called')) {
      context.handle(
        _wasCalledMeta,
        wasCalled.isAcceptableOrUnknown(data['was_called']!, _wasCalledMeta),
      );
    } else if (isInserting) {
      context.missing(_wasCalledMeta);
    }
    if (data.containsKey('profile_json')) {
      context.handle(
        _profileJsonMeta,
        profileJson.isAcceptableOrUnknown(
          data['profile_json']!,
          _profileJsonMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_profileJsonMeta);
    }
    if (data.containsKey('outcome_json')) {
      context.handle(
        _outcomeJsonMeta,
        outcomeJson.isAcceptableOrUnknown(
          data['outcome_json']!,
          _outcomeJsonMeta,
        ),
      );
    }
    if (data.containsKey('error_message')) {
      context.handle(
        _errorMessageMeta,
        errorMessage.isAcceptableOrUnknown(
          data['error_message']!,
          _errorMessageMeta,
        ),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  StoredPersona map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return StoredPersona(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      runId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}run_id'],
      )!,
      ordinal: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}ordinal'],
      )!,
      wasCalled: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}was_called'],
      )!,
      profileJson: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}profile_json'],
      )!,
      outcomeJson: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}outcome_json'],
      ),
      errorMessage: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}error_message'],
      ),
    );
  }

  @override
  $StoredPersonasTable createAlias(String alias) {
    return $StoredPersonasTable(attachedDatabase, alias);
  }
}

class StoredPersona extends DataClass implements Insertable<StoredPersona> {
  final String id;
  final String runId;
  final int ordinal;
  final bool wasCalled;
  final String profileJson;
  final String? outcomeJson;
  final String? errorMessage;
  const StoredPersona({
    required this.id,
    required this.runId,
    required this.ordinal,
    required this.wasCalled,
    required this.profileJson,
    this.outcomeJson,
    this.errorMessage,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['run_id'] = Variable<String>(runId);
    map['ordinal'] = Variable<int>(ordinal);
    map['was_called'] = Variable<bool>(wasCalled);
    map['profile_json'] = Variable<String>(profileJson);
    if (!nullToAbsent || outcomeJson != null) {
      map['outcome_json'] = Variable<String>(outcomeJson);
    }
    if (!nullToAbsent || errorMessage != null) {
      map['error_message'] = Variable<String>(errorMessage);
    }
    return map;
  }

  StoredPersonasCompanion toCompanion(bool nullToAbsent) {
    return StoredPersonasCompanion(
      id: Value(id),
      runId: Value(runId),
      ordinal: Value(ordinal),
      wasCalled: Value(wasCalled),
      profileJson: Value(profileJson),
      outcomeJson: outcomeJson == null && nullToAbsent
          ? const Value.absent()
          : Value(outcomeJson),
      errorMessage: errorMessage == null && nullToAbsent
          ? const Value.absent()
          : Value(errorMessage),
    );
  }

  factory StoredPersona.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return StoredPersona(
      id: serializer.fromJson<String>(json['id']),
      runId: serializer.fromJson<String>(json['runId']),
      ordinal: serializer.fromJson<int>(json['ordinal']),
      wasCalled: serializer.fromJson<bool>(json['wasCalled']),
      profileJson: serializer.fromJson<String>(json['profileJson']),
      outcomeJson: serializer.fromJson<String?>(json['outcomeJson']),
      errorMessage: serializer.fromJson<String?>(json['errorMessage']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'runId': serializer.toJson<String>(runId),
      'ordinal': serializer.toJson<int>(ordinal),
      'wasCalled': serializer.toJson<bool>(wasCalled),
      'profileJson': serializer.toJson<String>(profileJson),
      'outcomeJson': serializer.toJson<String?>(outcomeJson),
      'errorMessage': serializer.toJson<String?>(errorMessage),
    };
  }

  StoredPersona copyWith({
    String? id,
    String? runId,
    int? ordinal,
    bool? wasCalled,
    String? profileJson,
    Value<String?> outcomeJson = const Value.absent(),
    Value<String?> errorMessage = const Value.absent(),
  }) => StoredPersona(
    id: id ?? this.id,
    runId: runId ?? this.runId,
    ordinal: ordinal ?? this.ordinal,
    wasCalled: wasCalled ?? this.wasCalled,
    profileJson: profileJson ?? this.profileJson,
    outcomeJson: outcomeJson.present ? outcomeJson.value : this.outcomeJson,
    errorMessage: errorMessage.present ? errorMessage.value : this.errorMessage,
  );
  StoredPersona copyWithCompanion(StoredPersonasCompanion data) {
    return StoredPersona(
      id: data.id.present ? data.id.value : this.id,
      runId: data.runId.present ? data.runId.value : this.runId,
      ordinal: data.ordinal.present ? data.ordinal.value : this.ordinal,
      wasCalled: data.wasCalled.present ? data.wasCalled.value : this.wasCalled,
      profileJson: data.profileJson.present
          ? data.profileJson.value
          : this.profileJson,
      outcomeJson: data.outcomeJson.present
          ? data.outcomeJson.value
          : this.outcomeJson,
      errorMessage: data.errorMessage.present
          ? data.errorMessage.value
          : this.errorMessage,
    );
  }

  @override
  String toString() {
    return (StringBuffer('StoredPersona(')
          ..write('id: $id, ')
          ..write('runId: $runId, ')
          ..write('ordinal: $ordinal, ')
          ..write('wasCalled: $wasCalled, ')
          ..write('profileJson: $profileJson, ')
          ..write('outcomeJson: $outcomeJson, ')
          ..write('errorMessage: $errorMessage')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    runId,
    ordinal,
    wasCalled,
    profileJson,
    outcomeJson,
    errorMessage,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is StoredPersona &&
          other.id == this.id &&
          other.runId == this.runId &&
          other.ordinal == this.ordinal &&
          other.wasCalled == this.wasCalled &&
          other.profileJson == this.profileJson &&
          other.outcomeJson == this.outcomeJson &&
          other.errorMessage == this.errorMessage);
}

class StoredPersonasCompanion extends UpdateCompanion<StoredPersona> {
  final Value<String> id;
  final Value<String> runId;
  final Value<int> ordinal;
  final Value<bool> wasCalled;
  final Value<String> profileJson;
  final Value<String?> outcomeJson;
  final Value<String?> errorMessage;
  final Value<int> rowid;
  const StoredPersonasCompanion({
    this.id = const Value.absent(),
    this.runId = const Value.absent(),
    this.ordinal = const Value.absent(),
    this.wasCalled = const Value.absent(),
    this.profileJson = const Value.absent(),
    this.outcomeJson = const Value.absent(),
    this.errorMessage = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  StoredPersonasCompanion.insert({
    required String id,
    required String runId,
    required int ordinal,
    required bool wasCalled,
    required String profileJson,
    this.outcomeJson = const Value.absent(),
    this.errorMessage = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       runId = Value(runId),
       ordinal = Value(ordinal),
       wasCalled = Value(wasCalled),
       profileJson = Value(profileJson);
  static Insertable<StoredPersona> custom({
    Expression<String>? id,
    Expression<String>? runId,
    Expression<int>? ordinal,
    Expression<bool>? wasCalled,
    Expression<String>? profileJson,
    Expression<String>? outcomeJson,
    Expression<String>? errorMessage,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (runId != null) 'run_id': runId,
      if (ordinal != null) 'ordinal': ordinal,
      if (wasCalled != null) 'was_called': wasCalled,
      if (profileJson != null) 'profile_json': profileJson,
      if (outcomeJson != null) 'outcome_json': outcomeJson,
      if (errorMessage != null) 'error_message': errorMessage,
      if (rowid != null) 'rowid': rowid,
    });
  }

  StoredPersonasCompanion copyWith({
    Value<String>? id,
    Value<String>? runId,
    Value<int>? ordinal,
    Value<bool>? wasCalled,
    Value<String>? profileJson,
    Value<String?>? outcomeJson,
    Value<String?>? errorMessage,
    Value<int>? rowid,
  }) {
    return StoredPersonasCompanion(
      id: id ?? this.id,
      runId: runId ?? this.runId,
      ordinal: ordinal ?? this.ordinal,
      wasCalled: wasCalled ?? this.wasCalled,
      profileJson: profileJson ?? this.profileJson,
      outcomeJson: outcomeJson ?? this.outcomeJson,
      errorMessage: errorMessage ?? this.errorMessage,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (runId.present) {
      map['run_id'] = Variable<String>(runId.value);
    }
    if (ordinal.present) {
      map['ordinal'] = Variable<int>(ordinal.value);
    }
    if (wasCalled.present) {
      map['was_called'] = Variable<bool>(wasCalled.value);
    }
    if (profileJson.present) {
      map['profile_json'] = Variable<String>(profileJson.value);
    }
    if (outcomeJson.present) {
      map['outcome_json'] = Variable<String>(outcomeJson.value);
    }
    if (errorMessage.present) {
      map['error_message'] = Variable<String>(errorMessage.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('StoredPersonasCompanion(')
          ..write('id: $id, ')
          ..write('runId: $runId, ')
          ..write('ordinal: $ordinal, ')
          ..write('wasCalled: $wasCalled, ')
          ..write('profileJson: $profileJson, ')
          ..write('outcomeJson: $outcomeJson, ')
          ..write('errorMessage: $errorMessage, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$LocalDatabase extends GeneratedDatabase {
  _$LocalDatabase(QueryExecutor e) : super(e);
  $LocalDatabaseManager get managers => $LocalDatabaseManager(this);
  late final $StoredRunsTable storedRuns = $StoredRunsTable(this);
  late final $StoredPersonasTable storedPersonas = $StoredPersonasTable(this);
  late final Index storedPersonasRun = Index(
    'stored_personas_run',
    'CREATE INDEX stored_personas_run ON stored_personas (run_id)',
  );
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
    storedRuns,
    storedPersonas,
    storedPersonasRun,
  ];
}

typedef $$StoredRunsTableCreateCompanionBuilder =
    StoredRunsCompanion Function({
      required String id,
      required String message,
      required DateTime createdAt,
      required int populationSize,
      required int liveCallCount,
      required String status,
      required String aggregateJson,
      Value<int> rowid,
    });
typedef $$StoredRunsTableUpdateCompanionBuilder =
    StoredRunsCompanion Function({
      Value<String> id,
      Value<String> message,
      Value<DateTime> createdAt,
      Value<int> populationSize,
      Value<int> liveCallCount,
      Value<String> status,
      Value<String> aggregateJson,
      Value<int> rowid,
    });

class $$StoredRunsTableFilterComposer
    extends Composer<_$LocalDatabase, $StoredRunsTable> {
  $$StoredRunsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get message => $composableBuilder(
    column: $table.message,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get populationSize => $composableBuilder(
    column: $table.populationSize,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get liveCallCount => $composableBuilder(
    column: $table.liveCallCount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get aggregateJson => $composableBuilder(
    column: $table.aggregateJson,
    builder: (column) => ColumnFilters(column),
  );
}

class $$StoredRunsTableOrderingComposer
    extends Composer<_$LocalDatabase, $StoredRunsTable> {
  $$StoredRunsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get message => $composableBuilder(
    column: $table.message,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get populationSize => $composableBuilder(
    column: $table.populationSize,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get liveCallCount => $composableBuilder(
    column: $table.liveCallCount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get aggregateJson => $composableBuilder(
    column: $table.aggregateJson,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$StoredRunsTableAnnotationComposer
    extends Composer<_$LocalDatabase, $StoredRunsTable> {
  $$StoredRunsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get message =>
      $composableBuilder(column: $table.message, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<int> get populationSize => $composableBuilder(
    column: $table.populationSize,
    builder: (column) => column,
  );

  GeneratedColumn<int> get liveCallCount => $composableBuilder(
    column: $table.liveCallCount,
    builder: (column) => column,
  );

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<String> get aggregateJson => $composableBuilder(
    column: $table.aggregateJson,
    builder: (column) => column,
  );
}

class $$StoredRunsTableTableManager
    extends
        RootTableManager<
          _$LocalDatabase,
          $StoredRunsTable,
          StoredRun,
          $$StoredRunsTableFilterComposer,
          $$StoredRunsTableOrderingComposer,
          $$StoredRunsTableAnnotationComposer,
          $$StoredRunsTableCreateCompanionBuilder,
          $$StoredRunsTableUpdateCompanionBuilder,
          (
            StoredRun,
            BaseReferences<_$LocalDatabase, $StoredRunsTable, StoredRun>,
          ),
          StoredRun,
          PrefetchHooks Function()
        > {
  $$StoredRunsTableTableManager(_$LocalDatabase db, $StoredRunsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$StoredRunsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$StoredRunsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$StoredRunsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> message = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<int> populationSize = const Value.absent(),
                Value<int> liveCallCount = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<String> aggregateJson = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => StoredRunsCompanion(
                id: id,
                message: message,
                createdAt: createdAt,
                populationSize: populationSize,
                liveCallCount: liveCallCount,
                status: status,
                aggregateJson: aggregateJson,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String message,
                required DateTime createdAt,
                required int populationSize,
                required int liveCallCount,
                required String status,
                required String aggregateJson,
                Value<int> rowid = const Value.absent(),
              }) => StoredRunsCompanion.insert(
                id: id,
                message: message,
                createdAt: createdAt,
                populationSize: populationSize,
                liveCallCount: liveCallCount,
                status: status,
                aggregateJson: aggregateJson,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$StoredRunsTable, StoredRun>(table),
                  BaseReferences<_$LocalDatabase, $StoredRunsTable, StoredRun>(
                    db,
                    table,
                    e,
                  ),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$StoredRunsTableProcessedTableManager =
    ProcessedTableManager<
      _$LocalDatabase,
      $StoredRunsTable,
      StoredRun,
      $$StoredRunsTableFilterComposer,
      $$StoredRunsTableOrderingComposer,
      $$StoredRunsTableAnnotationComposer,
      $$StoredRunsTableCreateCompanionBuilder,
      $$StoredRunsTableUpdateCompanionBuilder,
      (StoredRun, BaseReferences<_$LocalDatabase, $StoredRunsTable, StoredRun>),
      StoredRun,
      PrefetchHooks Function()
    >;
typedef $$StoredPersonasTableCreateCompanionBuilder =
    StoredPersonasCompanion Function({
      required String id,
      required String runId,
      required int ordinal,
      required bool wasCalled,
      required String profileJson,
      Value<String?> outcomeJson,
      Value<String?> errorMessage,
      Value<int> rowid,
    });
typedef $$StoredPersonasTableUpdateCompanionBuilder =
    StoredPersonasCompanion Function({
      Value<String> id,
      Value<String> runId,
      Value<int> ordinal,
      Value<bool> wasCalled,
      Value<String> profileJson,
      Value<String?> outcomeJson,
      Value<String?> errorMessage,
      Value<int> rowid,
    });

class $$StoredPersonasTableFilterComposer
    extends Composer<_$LocalDatabase, $StoredPersonasTable> {
  $$StoredPersonasTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get runId => $composableBuilder(
    column: $table.runId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get ordinal => $composableBuilder(
    column: $table.ordinal,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get wasCalled => $composableBuilder(
    column: $table.wasCalled,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get profileJson => $composableBuilder(
    column: $table.profileJson,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get outcomeJson => $composableBuilder(
    column: $table.outcomeJson,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get errorMessage => $composableBuilder(
    column: $table.errorMessage,
    builder: (column) => ColumnFilters(column),
  );
}

class $$StoredPersonasTableOrderingComposer
    extends Composer<_$LocalDatabase, $StoredPersonasTable> {
  $$StoredPersonasTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get runId => $composableBuilder(
    column: $table.runId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get ordinal => $composableBuilder(
    column: $table.ordinal,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get wasCalled => $composableBuilder(
    column: $table.wasCalled,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get profileJson => $composableBuilder(
    column: $table.profileJson,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get outcomeJson => $composableBuilder(
    column: $table.outcomeJson,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get errorMessage => $composableBuilder(
    column: $table.errorMessage,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$StoredPersonasTableAnnotationComposer
    extends Composer<_$LocalDatabase, $StoredPersonasTable> {
  $$StoredPersonasTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get runId =>
      $composableBuilder(column: $table.runId, builder: (column) => column);

  GeneratedColumn<int> get ordinal =>
      $composableBuilder(column: $table.ordinal, builder: (column) => column);

  GeneratedColumn<bool> get wasCalled =>
      $composableBuilder(column: $table.wasCalled, builder: (column) => column);

  GeneratedColumn<String> get profileJson => $composableBuilder(
    column: $table.profileJson,
    builder: (column) => column,
  );

  GeneratedColumn<String> get outcomeJson => $composableBuilder(
    column: $table.outcomeJson,
    builder: (column) => column,
  );

  GeneratedColumn<String> get errorMessage => $composableBuilder(
    column: $table.errorMessage,
    builder: (column) => column,
  );
}

class $$StoredPersonasTableTableManager
    extends
        RootTableManager<
          _$LocalDatabase,
          $StoredPersonasTable,
          StoredPersona,
          $$StoredPersonasTableFilterComposer,
          $$StoredPersonasTableOrderingComposer,
          $$StoredPersonasTableAnnotationComposer,
          $$StoredPersonasTableCreateCompanionBuilder,
          $$StoredPersonasTableUpdateCompanionBuilder,
          (
            StoredPersona,
            BaseReferences<
              _$LocalDatabase,
              $StoredPersonasTable,
              StoredPersona
            >,
          ),
          StoredPersona,
          PrefetchHooks Function()
        > {
  $$StoredPersonasTableTableManager(
    _$LocalDatabase db,
    $StoredPersonasTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$StoredPersonasTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$StoredPersonasTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$StoredPersonasTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> runId = const Value.absent(),
                Value<int> ordinal = const Value.absent(),
                Value<bool> wasCalled = const Value.absent(),
                Value<String> profileJson = const Value.absent(),
                Value<String?> outcomeJson = const Value.absent(),
                Value<String?> errorMessage = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => StoredPersonasCompanion(
                id: id,
                runId: runId,
                ordinal: ordinal,
                wasCalled: wasCalled,
                profileJson: profileJson,
                outcomeJson: outcomeJson,
                errorMessage: errorMessage,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String runId,
                required int ordinal,
                required bool wasCalled,
                required String profileJson,
                Value<String?> outcomeJson = const Value.absent(),
                Value<String?> errorMessage = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => StoredPersonasCompanion.insert(
                id: id,
                runId: runId,
                ordinal: ordinal,
                wasCalled: wasCalled,
                profileJson: profileJson,
                outcomeJson: outcomeJson,
                errorMessage: errorMessage,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$StoredPersonasTable, StoredPersona>(table),
                  BaseReferences<
                    _$LocalDatabase,
                    $StoredPersonasTable,
                    StoredPersona
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$StoredPersonasTableProcessedTableManager =
    ProcessedTableManager<
      _$LocalDatabase,
      $StoredPersonasTable,
      StoredPersona,
      $$StoredPersonasTableFilterComposer,
      $$StoredPersonasTableOrderingComposer,
      $$StoredPersonasTableAnnotationComposer,
      $$StoredPersonasTableCreateCompanionBuilder,
      $$StoredPersonasTableUpdateCompanionBuilder,
      (
        StoredPersona,
        BaseReferences<_$LocalDatabase, $StoredPersonasTable, StoredPersona>,
      ),
      StoredPersona,
      PrefetchHooks Function()
    >;

class $LocalDatabaseManager {
  final _$LocalDatabase _db;
  $LocalDatabaseManager(this._db);
  $$StoredRunsTableTableManager get storedRuns =>
      $$StoredRunsTableTableManager(_db, _db.storedRuns);
  $$StoredPersonasTableTableManager get storedPersonas =>
      $$StoredPersonasTableTableManager(_db, _db.storedPersonas);
}
