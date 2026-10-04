import 'persona.dart';

/// 把教材的层次叠成这个人这一次的设定。不新增效应量，也不下「一定会」。
ComposedDecision composeDecision({
  required TraitLevel conscientiousness,
  required TraitLevel honestyHumility,
  required LearningHistory learningHistory,
  required FrameKind frame,
  required IncidentalEmotion emotion,
  required GroupPayoff groupPayoff,
  required NarrativeId narrative,
  required IfThenSignature signature,
  required BudgetRoom budget,
  required CurrentGoal goal,
  required bool timePressed,
  required bool longTermCostInValuation,
  required bool repeatedFeedback,
}) {
  final identityExits = _identityExits(narrative, frame);
  return ComposedDecision(
    simplifiedProblem: _simplified(frame, budget, goal),
    expectation: _expectation(learningHistory),
    wanting: _wanting(learningHistory, frame),
    liking:
        '用的时候会不会愉快要单独记：点子可以显得顺手，也可以用了并不喜欢。喜欢不推出会打开，也不推出会付钱。',
    habit: learningHistory == LearningHistory.cachedHabit
        ? '这一次可能靠缓存的习惯打开，不必先重新喜欢。'
        : '这一次还没有缓存成习惯，更可能在按后果重算。',
    goalDirected: timePressed
        ? '时间紧，工作记忆被占着。默认反应更可能直接成为选择。这不是情绪和理性两套系统，也没有无意识百分比。'
        : '这一次有余地做假设性的重算，重算会占用工作记忆。',
    emotionModulation: _emotion(emotion),
    selfControl: longTermCostInValuation
        ? '长期成本这一次被写进了同一个价值信号。自控不是一份意志力库存。'
        : '这一次的价值主要还停在眼前的方便或损失上，长期成本没有写进同一个信号。',
    frameStatement: _frame(frame),
    groupPayoffStatement: _group(groupPayoff),
    signatureReading: _signature(signature, frame, timePressed),
    trendNotThisAct: _trend(conscientiousness),
    identityNote: _identity(narrative, frame),
    honestyNote:
        '若这一次涉及占便宜或公不公平，诚实—谦逊是五因素容易漏掉的一轴。相对同龄人：${traitLabel(honestyHumility)}。这不是已经测量过的付费效应。',
    heuristicNote: repeatedFeedback
        ? '这个人在这类工具上有过重复和反馈，快速判断有可能是再认，而且只覆盖练过的那一类。觉得自己知道，仍然不是准确本身。'
        : '这个人在这类决定上没有足够的重复反馈。这里更像低效度环境，信心不是准确的证据。',
    predictionObject:
        '要预测的是这一次会不会用、会不会付钱，或用户原话里的那一次。会不会留下来、会不会一再付钱，是另一串行为，不能写成同一次的性格因果。',
    identityCanExitComparison: identityExits,
  );
}

String _simplified(FrameKind frame, BudgetRoom budget, CurrentGoal goal) {
  final problem = switch (frame) {
    FrameKind.gain => '这能不能换来一点确定能拿到的好处',
    FrameKind.loss => '这是不是又一张不能退的账单',
    FrameKind.isolatedTrial => '试用本身值不值得点。试用之后大家共有的扣款结构先被拿掉了',
    FrameKind.social => '周围的人在不在用',
  };
  final money = switch (budget) {
    BudgetRoom.almostNone => '这个月几乎没有余钱',
    BudgetRoom.smallBuffer => '有一小笔可以试错的钱',
    BudgetRoom.notTheConstraint => '钱不是这次的主约束',
  };
  final aim = switch (goal) {
    CurrentGoal.saveRepetition => '省下重复劳动',
    CurrentGoal.noNewBill => '不要再多一笔固定支出',
    CurrentGoal.keepUpWithPeers => '不在同事面前显得落后',
    CurrentGoal.stickToOneThing => '把一件小事坚持下去',
    CurrentGoal.fewerTools => '少管一个新工具',
  };
  return '实际停下来的小问题是：$problem。同时「$money」，目标是「$aim」。没有假定这个人读完全部定价、再最大化一生的效用。';
}

String _expectation(LearningHistory learning) {
  return switch (learning) {
    LearningHistory.none => '相近的工具和扣款上，没有一次足以改写预期的结果。',
    LearningHistory.betterThanExpected =>
      '类似的东西曾经比预期好。这个预测误差可以改高下一步的预期。它不是快乐，也不是付钱。',
    LearningHistory.worseThanExpected => '被自动续费一类的扣款伤害过，结果比预期差。',
    LearningHistory.cachedHabit => '用过很多次，价值已经被缓存。即使说不清值不值，习惯仍可能把人带回。',
  };
}

String _wanting(LearningHistory learning, FrameKind frame) {
  if (learning == LearningHistory.worseThanExpected) {
    return '「免费试用」这类线索可以变得不想要。想要和喜欢不是同一个量。';
  }
  if (frame == FrameKind.isolatedTrial) {
    return '试用按钮这个线索可以让人想打开。想要可以强于事后的喜欢。';
  }
  if (learning == LearningHistory.cachedHabit) {
    return '想不想再要，和已经缓存的习惯不是一回事。';
  }
  if (learning == LearningHistory.betterThanExpected) {
    return '线索可以让人想去打开。这仍不是喜欢，也不是付钱。';
  }
  return '没有强烈的线索想要，也还没有理由把想要写成喜欢。';
}

String _emotion(IncidentalEmotion emotion) {
  final state = switch (emotion) {
    IncidentalEmotion.calm => '这一次没有明显的偶然情绪。即便如此，也不要假设一个永远只比较功能列表的人。',
    IncidentalEmotion.rushed => '这一次赶时间，不耐烦会进到估值里。',
    IncidentalEmotion.unrelatedCharge => '刚被一笔和这件事无关的扣款惹到。这种偶然情绪可以让费用显得危险。',
    IncidentalEmotion.mildPositive => '这一次带着一点无关的轻松，它也可以渗进估值。',
  };
  return '$state特质上的情绪稳定性代替不了这一次的状态。';
}

String _frame(FrameKind frame) {
  return switch (frame) {
    FrameKind.gain => '这一次被说成能换来的好处。框架会移动偏好，但不是人人都中的开关。',
    FrameKind.loss => '这一次被说成又一张不能退的账单，损失和收益不是对最终财富做比较。这仍然不是开关。',
    FrameKind.isolatedTrial => '试用被单独拿出来看，后面共有的扣款结构被孤立效应丢掉了。',
    FrameKind.social => '句子旁边还有别人在不在用。价格本身没有把情境写全。',
  };
}

String _group(GroupPayoff group) {
  return switch (group) {
    GroupPayoff.subscriptionNormal =>
      '周围的人把订阅当成普通开销。这类交换怎么结算，更跟着日常回报走，而不是跟着年龄或城乡。',
    GroupPayoff.payingMocked => '周围的人会笑话为应用付钱。群体里的回报结构和年龄、城乡不是一回事。',
    GroupPayoff.freeloadingShamed =>
      '周围的人把白用、不试看成占便宜。这仍然不是一个全球默认的公平常数。',
    GroupPayoff.thinMarket =>
      '周围很少有市场式的往来，合作不一定得到回报。不要把公平反应用成物种常数，也不要用年龄代替它。',
  };
}

String _signature(IfThenSignature signature, FrameKind frame, bool timePressed) {
  return switch (signature) {
    IfThenSignature.freeThenCard when frame == FrameKind.isolatedTrial =>
      '签名是：可以先试用就容易开始，要绑卡或不能退就停。这一次被编辑成先看试用，签名的前一半是开始，后一半被单独拿开了。',
    IfThenSignature.freeThenCard =>
      '签名是：可以先试用就容易开始，要绑卡或不能退就停。不要把这两次平均成一个分数。',
    IfThenSignature.peersThenAlone when frame == FrameKind.social =>
      '签名是：同事都在用就可能开始，只剩自己就停。这一次周围的人在场。',
    IfThenSignature.peersThenAlone => '签名是：同事都在用就可能开始，只剩自己就停。这一次没有写成同伴压力。',
    IfThenSignature.recomputeUnlessRushed when timePressed =>
      '签名是：有余地就重算，时间紧就让默认反应接管。这一次时间紧。',
    IfThenSignature.recomputeUnlessRushed => '签名是：有余地就重算，时间紧就让默认反应接管。这一次还有余地。',
    IfThenSignature.identityBlocksLoss when frame == FrameKind.loss =>
      '签名是：一旦会被写成自己拒绝成为的那种人，这个选项在损失说法下更容易退出比较。',
    IfThenSignature.identityBlocksLoss => '签名是：损失说法下可能因身份退出。这一次不是那个说法，签名并不自动排除。',
  };
}

String _trend(TraitLevel conscientiousness) {
  final (where, direction) = switch (conscientiousness) {
    TraitLevel.veryLow || TraitLevel.low => (
        '尽责性低于同龄人',
        '一类需要坚持的事，趋势上更不容易做完',
      ),
    TraitLevel.mid => ('尽责性处于同龄人中间', '趋势信号很弱'),
    TraitLevel.high || TraitLevel.veryHigh => (
        '尽责性高于同龄人',
        '一类需要坚持的事，趋势上更可能做下去',
      ),
  };
  return '相对同龄人，$where。$direction。这是一串行为的弱判断，不是这一次会不会用、会不会付钱。';
}

bool _identityExits(NarrativeId narrative, FrameKind frame) {
  return (narrative == NarrativeId.notWasteful && frame == FrameKind.loss) ||
      (narrative == NarrativeId.notFollowing && frame == FrameKind.social);
}

String _identity(NarrativeId narrative, FrameKind frame) {
  if (narrative == NarrativeId.notWasteful && frame == FrameKind.loss) {
    return '付这笔钱会把这个人写成自己故事里浪费的人，选项可能在进价值比较之前就被身份排除。这不是「因为贵」。';
  }
  if (narrative == NarrativeId.notFollowing && frame == FrameKind.social) {
    return '跟着别人用会把这个人写成自己故事里跟风的人，这个选项可能在比较之前就退出。';
  }
  return '这一次的选项还留在价值比较里，没有被身份事先排除。贵，和「不像我」，是两种不同的拒绝。';
}
