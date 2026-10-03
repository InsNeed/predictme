import 'package:predictme/data/personas.dart';
import 'package:predictme/data/questionnaire.dart';
import 'package:predictme/models/persona.dart';
import 'package:predictme/models/prediction.dart';
import 'package:predictme/models/prediction_run.dart';
import 'package:predictme/models/question.dart';
import 'package:predictme/services/aggregation.dart';
import 'package:predictme/services/persona_responder.dart';

/// Asks every persona the same questionnaire at the same time.
class PredictionRunner {
  const PredictionRunner({
    required this.responder,
    this.personas = kPersonas,
    this.questions = kQuestionnaire,
  });

  final PersonaResponder responder;
  final List<Persona> personas;
  final List<Question> questions;

  Future<PredictionRun> run(Prediction prediction) async {
    final responses = await Future.wait(
      personas.map((persona) async {
        final answers = await responder.respond(
          persona: persona,
          prediction: prediction,
          questions: questions,
        );
        return PersonaResponse(persona: persona, answers: answers);
      }),
    );
    return PredictionRun(
      prediction: prediction,
      responses: responses,
      summary: summarize(responses),
    );
  }
}
