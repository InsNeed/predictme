import 'package:predictme/models/prediction_run.dart';

/// Counts how many personas would use or pay.
AggregateSummary summarize(List<PersonaResponse> responses) {
  var wouldUse = 0;
  var wouldPay = 0;
  for (final response in responses) {
    if (response.wouldUse) {
      wouldUse += 1;
    }
    if (response.wouldPay) {
      wouldPay += 1;
    }
  }
  return AggregateSummary(
    personaCount: responses.length,
    wouldUseCount: wouldUse,
    wouldPayCount: wouldPay,
  );
}

/// Renders a rate as a percent, keeping a single decimal when needed.
String formatRate(int count, int total) {
  if (total <= 0) {
    return '0%';
  }
  final tenths = (count * 1000) ~/ total;
  final whole = tenths ~/ 10;
  final fraction = tenths % 10;
  if (fraction == 0) {
    return '$whole%';
  }
  return '$whole.$fraction%';
}
