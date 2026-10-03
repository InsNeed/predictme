import 'package:predictme/models/answer.dart';
import 'package:predictme/models/persona.dart';
import 'package:predictme/models/prediction.dart';
import 'package:predictme/models/question.dart';

/// Generates one persona's answers locally.
///
/// The current app ships a rule/template implementation. A real model can
/// replace that class later without changing the runner or the screens.
abstract interface class PersonaResponder {
  Future<List<Answer>> respond({
    required Persona persona,
    required Prediction prediction,
    required List<Question> questions,
  });
}
