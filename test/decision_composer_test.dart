import 'package:flutter_test/flutter_test.dart';
import 'package:predictme/features/predict/domain/decision_composer.dart';
import 'package:predictme/features/predict/domain/persona.dart';

void main() {
  const banned = [
    '2.25',
    '0.30',
    '催产素',
    '更新世',
    '购买按钮',
    '百分之九十五',
    '多巴胺就是快乐',
    '遗传力',
    '系统1',
    '系统 1',
  ];

  test('layers stay separate across the grid', () {
    for (final trait in TraitLevel.values) {
      for (final learning in LearningHistory.values) {
        for (final frame in FrameKind.values) {
          for (final narrative in NarrativeId.values) {
            for (final pressed in [false, true]) {
              final decision = composeDecision(
                conscientiousness: trait,
                honestyHumility: TraitLevel.mid,
                learningHistory: learning,
                frame: frame,
                emotion: IncidentalEmotion.unrelatedCharge,
                groupPayoff: GroupPayoff.thinMarket,
                narrative: narrative,
                signature: IfThenSignature.freeThenCard,
                budget: BudgetRoom.almostNone,
                goal: CurrentGoal.noNewBill,
                timePressed: pressed,
                longTermCostInValuation: !pressed,
                repeatedFeedback: false,
              );
              expect(decision.wanting, isNot(decision.liking));
              expect(decision.trendNotThisAct, contains('不是这一次'));
              expect(decision.emotionModulation, contains('情绪稳定性代替不了'));
              expect(decision.heuristicNote, contains('信心不是准确的证据'));
              for (final phrase in banned) {
                expect(decision.allText, isNot(contains(phrase)));
              }
              if (pressed) {
                expect(decision.goalDirected, contains('默认反应'));
              }
            }
          }
        }
      }
    }
  });

  test('identity can exit before value, and a loss frame is not a switch by itself', () {
    final exits = composeDecision(
      conscientiousness: TraitLevel.high,
      honestyHumility: TraitLevel.low,
      learningHistory: LearningHistory.none,
      frame: FrameKind.loss,
      emotion: IncidentalEmotion.calm,
      groupPayoff: GroupPayoff.subscriptionNormal,
      narrative: NarrativeId.notWasteful,
      signature: IfThenSignature.identityBlocksLoss,
      budget: BudgetRoom.smallBuffer,
      goal: CurrentGoal.saveRepetition,
      timePressed: false,
      longTermCostInValuation: true,
      repeatedFeedback: true,
    );
    expect(exits.identityCanExitComparison, isTrue);
    expect(exits.identityNote, contains('浪费的人'));
    expect(exits.frameStatement, contains('不是开关'));
    expect(exits.trendNotThisAct, contains('趋势上更可能做下去'));
    expect(exits.heuristicNote, contains('再认'));

    final stays = composeDecision(
      conscientiousness: TraitLevel.high,
      honestyHumility: TraitLevel.low,
      learningHistory: LearningHistory.none,
      frame: FrameKind.gain,
      emotion: IncidentalEmotion.calm,
      groupPayoff: GroupPayoff.subscriptionNormal,
      narrative: NarrativeId.notWasteful,
      signature: IfThenSignature.identityBlocksLoss,
      budget: BudgetRoom.smallBuffer,
      goal: CurrentGoal.saveRepetition,
      timePressed: false,
      longTermCostInValuation: true,
      repeatedFeedback: false,
    );
    expect(stays.identityCanExitComparison, isFalse);
  });
}
