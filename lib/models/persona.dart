/// A fixed person the app answers as.
class Persona {
  const Persona({
    required this.id,
    required this.name,
    required this.role,
    required this.personality,
    required this.pastExperience,
    required this.decisionStyle,
  });

  final String id;
  final String name;
  final String role;

  /// How this person tends to think and talk.
  final String personality;

  /// Relevant history that should color the answer.
  final String pastExperience;

  /// How they decide to try or pay for something.
  final String decisionStyle;
}
