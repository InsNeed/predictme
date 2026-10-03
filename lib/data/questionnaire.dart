import 'package:predictme/models/question.dart';

/// Short fixed questionnaire every persona answers.
const List<Question> kQuestionnaire = [
  Question(id: QuestionIds.use, prompt: '会不会用', kind: QuestionKind.usage),
  Question(id: QuestionIds.pay, prompt: '会不会付费', kind: QuestionKind.payment),
  Question(id: QuestionIds.reason, prompt: '原因', kind: QuestionKind.reason),
  Question(id: QuestionIds.concern, prompt: '顾虑', kind: QuestionKind.concern),
];
