import 'package:predictme/models/answer.dart';
import 'package:predictme/models/persona.dart';
import 'package:predictme/models/prediction.dart';
import 'package:predictme/models/question.dart';

/// Every answer from one persona for a single prediction.
class PersonaResponse {
  const PersonaResponse({required this.persona, required this.answers});

  final Persona persona;
  final List<Answer> answers;

  Answer answerFor(String questionId) {
    return answers.firstWhere((answer) => answer.questionId == questionId);
  }

  bool get wouldUse => answerFor(QuestionIds.use).affirmative == true;

  bool get wouldPay => answerFor(QuestionIds.pay).affirmative == true;
}

/// Use rate and pay rate across the roster.
class AggregateSummary {
  const AggregateSummary({
    required this.personaCount,
    required this.wouldUseCount,
    required this.wouldPayCount,
  });

  final int personaCount;
  final int wouldUseCount;
  final int wouldPayCount;

  double get useRate => personaCount == 0 ? 0 : wouldUseCount / personaCount;

  double get payRate => personaCount == 0 ? 0 : wouldPayCount / personaCount;
}

/// A finished local run: prediction, per-persona answers, and the aggregate.
class PredictionRun {
  const PredictionRun({
    required this.prediction,
    required this.responses,
    required this.summary,
  });

  final Prediction prediction;
  final List<PersonaResponse> responses;
  final AggregateSummary summary;
}
