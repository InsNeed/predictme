import 'dart:convert';

/// 模型对这一次的判断。嘴上的理由和趋势分开存放。
class PersonaJudgement {
  const PersonaJudgement({
    required this.primaryLabel,
    required this.primaryYes,
    required this.secondaryLabel,
    required this.secondaryYes,
    required this.oneAct,
    required this.trend,
    required this.selfTheory,
    required this.residual,
  });

  final String primaryLabel;
  final bool primaryYes;
  final String secondaryLabel;
  final bool secondaryYes;
  final String oneAct;
  final String trend;
  final String selfTheory;
  final String residual;

  Map<String, Object?> toJson() => {
        'primaryLabel': primaryLabel,
        'primaryYes': primaryYes,
        'secondaryLabel': secondaryLabel,
        'secondaryYes': secondaryYes,
        'oneAct': oneAct,
        'trend': trend,
        'selfTheory': selfTheory,
        'residual': residual,
      };

  factory PersonaJudgement.fromJson(Map<String, Object?> json) {
    return PersonaJudgement(
      primaryLabel: json['primaryLabel']! as String,
      primaryYes: json['primaryYes']! as bool,
      secondaryLabel: json['secondaryLabel']! as String,
      secondaryYes: json['secondaryYes']! as bool,
      oneAct: json['oneAct']! as String,
      trend: json['trend']! as String,
      selfTheory: json['selfTheory']! as String,
      residual: json['residual']! as String,
    );
  }
}

/// 从模型文本里取出 JSON。失败时抛 [FormatException]，由调用方收成这个人的错误。
PersonaJudgement parseJudgement(String raw) {
  final decoded = jsonDecode(_extractJson(raw));
  if (decoded is! Map) {
    throw const FormatException('不是 JSON 对象');
  }
  final json = decoded.map((key, value) => MapEntry(key.toString(), value));
  final primaryYes = _readBool(json['primary_yes']);
  final secondaryYes = _readBool(json['secondary_yes']);
  final primaryLabel = _readText(json['primary_label']);
  final secondaryLabel = _readText(json['secondary_label']);
  if (primaryYes == null ||
      secondaryYes == null ||
      primaryLabel == null ||
      secondaryLabel == null) {
    throw const FormatException('缺少是否判断');
  }
  return PersonaJudgement(
    primaryLabel: primaryLabel,
    primaryYes: primaryYes,
    secondaryLabel: secondaryLabel,
    secondaryYes: secondaryYes,
    oneAct: _readText(json['one_act']) ?? '',
    trend: _readText(json['trend']) ?? '',
    selfTheory: _readText(json['self_theory']) ?? '',
    residual: _readText(json['residual']) ?? '',
  );
}

String _extractJson(String raw) {
  var text = raw.trim();
  if (text.startsWith('```')) {
    final firstLine = text.indexOf('\n');
    if (firstLine != -1) {
      text = text.substring(firstLine + 1);
    }
    final fence = text.lastIndexOf('```');
    if (fence != -1) {
      text = text.substring(0, fence);
    }
  }
  final start = text.indexOf('{');
  final end = text.lastIndexOf('}');
  if (start == -1 || end <= start) {
    throw const FormatException('没有 JSON');
  }
  return text.substring(start, end + 1);
}

bool? _readBool(Object? value) {
  if (value is bool) return value;
  if (value is String) {
    final text = value.trim();
    if (text == 'true' || text == '是') return true;
    if (text == 'false' || text == '否') return false;
  }
  return null;
}

String? _readText(Object? value) {
  if (value is! String) return null;
  final text = value.trim();
  if (text.isEmpty) return null;
  return text;
}
