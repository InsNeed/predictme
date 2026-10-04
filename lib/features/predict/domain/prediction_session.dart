import 'aggregate.dart';
import 'judgement.dart';
import 'persona.dart';

enum PredictionStatus { missingKey, completed, partial, failed, emptyMessage }

class PersonaCallResult {
  const PersonaCallResult({
    required this.persona,
    this.judgement,
    this.errorMessage,
  });

  final Persona persona;
  final PersonaJudgement? judgement;
  final String? errorMessage;

  bool get called => judgement != null || errorMessage != null;
}

class PredictionSession {
  const PredictionSession({
    required this.message,
    required this.populationSize,
    required this.liveCalls,
    required this.model,
    required this.results,
    required this.aggregate,
    required this.status,
    required this.statusMessage,
    this.storageWarning,
  });

  final String message;
  final int populationSize;
  final int liveCalls;
  final String model;
  final List<PersonaCallResult> results;
  final AggregateSummary aggregate;
  final PredictionStatus status;
  final String statusMessage;
  final String? storageWarning;
}
