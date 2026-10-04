enum Sex { male, female }

enum Residence { urban, rural }

enum TraitLevel { veryLow, low, mid, high, veryHigh }

enum LearningHistory { none, betterThanExpected, worseThanExpected, cachedHabit }

enum FrameKind { gain, loss, isolatedTrial, social }

enum IncidentalEmotion { calm, rushed, unrelatedCharge, mildPositive }

enum GroupPayoff {
  subscriptionNormal,
  payingMocked,
  freeloadingShamed,
  thinMarket,
}

enum NarrativeId { notWasteful, paysForTime, keepUp, notFollowing, notSalient }

enum IfThenSignature {
  freeThenCard,
  peersThenAlone,
  recomputeUnlessRushed,
  identityBlocksLoss,
}

enum BudgetRoom { almostNone, smallBuffer, notTheConstraint }

enum CurrentGoal { saveRepetition, noNewBill, keepUpWithPeers, stickToOneThing, fewerTools }

/// 代码叠好的这一次。句子来自教材里的关系，不是新的效应量。
class ComposedDecision {
  const ComposedDecision({
    required this.simplifiedProblem,
    required this.expectation,
    required this.wanting,
    required this.liking,
    required this.habit,
    required this.goalDirected,
    required this.emotionModulation,
    required this.selfControl,
    required this.frameStatement,
    required this.groupPayoffStatement,
    required this.signatureReading,
    required this.trendNotThisAct,
    required this.identityNote,
    required this.honestyNote,
    required this.heuristicNote,
    required this.predictionObject,
    required this.identityCanExitComparison,
  });

  final String simplifiedProblem;
  final String expectation;
  final String wanting;
  final String liking;
  final String habit;
  final String goalDirected;
  final String emotionModulation;
  final String selfControl;
  final String frameStatement;
  final String groupPayoffStatement;
  final String signatureReading;
  final String trendNotThisAct;
  final String identityNote;
  final String honestyNote;
  final String heuristicNote;
  final String predictionObject;
  final bool identityCanExitComparison;

  String get allText => [
        simplifiedProblem,
        expectation,
        wanting,
        liking,
        habit,
        goalDirected,
        emotionModulation,
        selfControl,
        frameStatement,
        groupPayoffStatement,
        signatureReading,
        trendNotThisAct,
        identityNote,
        honestyNote,
        heuristicNote,
        predictionObject,
      ].join('\n');

  Map<String, Object?> toJson() => {
        'simplifiedProblem': simplifiedProblem,
        'expectation': expectation,
        'wanting': wanting,
        'liking': liking,
        'habit': habit,
        'goalDirected': goalDirected,
        'emotionModulation': emotionModulation,
        'selfControl': selfControl,
        'frameStatement': frameStatement,
        'groupPayoffStatement': groupPayoffStatement,
        'signatureReading': signatureReading,
        'trendNotThisAct': trendNotThisAct,
        'identityNote': identityNote,
        'honestyNote': honestyNote,
        'heuristicNote': heuristicNote,
        'predictionObject': predictionObject,
        'identityCanExitComparison': identityCanExitComparison,
      };

  factory ComposedDecision.fromJson(Map<String, Object?> json) {
    return ComposedDecision(
      simplifiedProblem: json['simplifiedProblem']! as String,
      expectation: json['expectation']! as String,
      wanting: json['wanting']! as String,
      liking: json['liking']! as String,
      habit: json['habit']! as String,
      goalDirected: json['goalDirected']! as String,
      emotionModulation: json['emotionModulation']! as String,
      selfControl: json['selfControl']! as String,
      frameStatement: json['frameStatement']! as String,
      groupPayoffStatement: json['groupPayoffStatement']! as String,
      signatureReading: json['signatureReading']! as String,
      trendNotThisAct: json['trendNotThisAct']! as String,
      identityNote: json['identityNote']! as String,
      honestyNote: json['honestyNote']! as String,
      heuristicNote: json['heuristicNote']! as String,
      predictionObject: json['predictionObject']! as String,
      identityCanExitComparison: json['identityCanExitComparison']! as bool,
    );
  }
}

/// 一个本地生成的人。决策句在生成时叠好，和请求里的设定是同一份。
class Persona {
  const Persona({
    required this.id,
    required this.name,
    required this.age,
    required this.ageBand,
    required this.sex,
    required this.residence,
    required this.extraversion,
    required this.agreeableness,
    required this.conscientiousness,
    required this.emotionalStability,
    required this.openness,
    required this.honestyHumility,
    required this.learningHistory,
    required this.frame,
    required this.emotion,
    required this.groupPayoff,
    required this.narrative,
    required this.signature,
    required this.budget,
    required this.goal,
    required this.timePressed,
    required this.longTermCostInValuation,
    required this.repeatedFeedback,
    required this.decision,
  });

  final String id;
  final String name;
  final int age;
  final String ageBand;
  final Sex sex;
  final Residence residence;
  final TraitLevel extraversion;
  final TraitLevel agreeableness;
  final TraitLevel conscientiousness;
  final TraitLevel emotionalStability;
  final TraitLevel openness;
  final TraitLevel honestyHumility;
  final LearningHistory learningHistory;
  final FrameKind frame;
  final IncidentalEmotion emotion;
  final GroupPayoff groupPayoff;
  final NarrativeId narrative;
  final IfThenSignature signature;
  final BudgetRoom budget;
  final CurrentGoal goal;
  final bool timePressed;
  final bool longTermCostInValuation;
  final bool repeatedFeedback;
  final ComposedDecision decision;

  String get sexLabel => sex == Sex.male ? '男' : '女';
  String get residenceLabel => residence == Residence.urban ? '城镇' : '乡村';

  Map<String, Object?> toJson() => {
        'id': id,
        'name': name,
        'age': age,
        'ageBand': ageBand,
        'sex': sex.name,
        'residence': residence.name,
        'extraversion': extraversion.name,
        'agreeableness': agreeableness.name,
        'conscientiousness': conscientiousness.name,
        'emotionalStability': emotionalStability.name,
        'openness': openness.name,
        'honestyHumility': honestyHumility.name,
        'learningHistory': learningHistory.name,
        'frame': frame.name,
        'emotion': emotion.name,
        'groupPayoff': groupPayoff.name,
        'narrative': narrative.name,
        'signature': signature.name,
        'budget': budget.name,
        'goal': goal.name,
        'timePressed': timePressed,
        'longTermCostInValuation': longTermCostInValuation,
        'repeatedFeedback': repeatedFeedback,
        'decision': decision.toJson(),
      };

  factory Persona.fromJson(Map<String, Object?> json) {
    return Persona(
      id: json['id']! as String,
      name: json['name']! as String,
      age: json['age']! as int,
      ageBand: json['ageBand']! as String,
      sex: _byName(Sex.values, json['sex']! as String),
      residence: _byName(Residence.values, json['residence']! as String),
      extraversion: _byName(TraitLevel.values, json['extraversion']! as String),
      agreeableness: _byName(TraitLevel.values, json['agreeableness']! as String),
      conscientiousness:
          _byName(TraitLevel.values, json['conscientiousness']! as String),
      emotionalStability:
          _byName(TraitLevel.values, json['emotionalStability']! as String),
      openness: _byName(TraitLevel.values, json['openness']! as String),
      honestyHumility:
          _byName(TraitLevel.values, json['honestyHumility']! as String),
      learningHistory:
          _byName(LearningHistory.values, json['learningHistory']! as String),
      frame: _byName(FrameKind.values, json['frame']! as String),
      emotion: _byName(IncidentalEmotion.values, json['emotion']! as String),
      groupPayoff: _byName(GroupPayoff.values, json['groupPayoff']! as String),
      narrative: _byName(NarrativeId.values, json['narrative']! as String),
      signature: _byName(IfThenSignature.values, json['signature']! as String),
      budget: _byName(BudgetRoom.values, json['budget']! as String),
      goal: _byName(CurrentGoal.values, json['goal']! as String),
      timePressed: json['timePressed']! as bool,
      longTermCostInValuation: json['longTermCostInValuation']! as bool,
      repeatedFeedback: json['repeatedFeedback']! as bool,
      decision: ComposedDecision.fromJson(
        (json['decision']! as Map).cast<String, Object?>(),
      ),
    );
  }
}

T _byName<T extends Enum>(List<T> values, String name) {
  return values.firstWhere((value) => value.name == name);
}

String traitLabel(TraitLevel level) {
  return switch (level) {
    TraitLevel.veryLow => '明显低于同龄人',
    TraitLevel.low => '低于同龄人',
    TraitLevel.mid => '处于同龄人中间',
    TraitLevel.high => '高于同龄人',
    TraitLevel.veryHigh => '明显高于同龄人',
  };
}
