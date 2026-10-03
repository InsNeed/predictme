/// One item in the fixed questionnaire.
enum QuestionKind { usage, payment, reason, concern }

class Question {
  const Question({required this.id, required this.prompt, required this.kind});

  final String id;
  final String prompt;
  final QuestionKind kind;
}

abstract final class QuestionIds {
  static const use = 'use';
  static const pay = 'pay';
  static const reason = 'reason';
  static const concern = 'concern';
}
