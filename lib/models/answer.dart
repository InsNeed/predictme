/// One persona's reply to one question.
class Answer {
  const Answer({
    required this.personaId,
    required this.questionId,
    required this.text,
    required this.affirmative,
  });

  final String personaId;
  final String questionId;
  final String text;

  /// `true` / `false` for yes-no questions. `null` for open questions.
  final bool? affirmative;
}
