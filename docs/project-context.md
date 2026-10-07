# Predict Me

用 Flutter 做的决策预测 App。用户给出想预测的主题，多个固定人设的 AI 并行、以当事人身份回答问题或问卷。

## 例子

有人想知道自己的 App 能不能成：描述这个 App 后发起预测，每个人设了解背景，再回答会不会用、会不会付费。

## 核心

决策准确率是这个 App 的核心：要预测的是一个具体的人会如何做决定。

学习材料从 [决策科学教材](decision-science/textbook/README.md) 读。总图源码仍在 Agent Store 画布（`canvases/.../source.canvas.tsx`，不在本仓库）；这个窗口点开是代码，看不了画好的页面。原始笔记仍在 [决策科学讲义](decision-science/README.md)。

## 初版

- 只读搬 luminth 的基础设施（日志、数据库、dio、规则、架构，主要在 core），不改 luminth
- 先写 PRD，再做基本流程：用户发一条消息，程序生成一批符合实际比例的人设，并行问 DeepSeek，按决策教材作答，再汇总统计
- 模型用 DeepSeek。Key 写在 `config/deepseek.local.json`，不进仓库。实呼默认 3 人，最多 8 人
- 网页预览：https://rawcdn.githack.com/InsNeed/predictme/0ab9aa14c14716bc0aa934d144b041e1f8a8b69b/index.html 。浏览器不能直接打 DeepSeek
- 人设在本地尽量生成全；真正发出的并行请求可配置，默认少打，避免打光临时额度

## 当前范围

- 最新稳定版 Flutter，预测逻辑全部放在 App 里
- 先不做 Firebase 和 Cloud Functions
- 回答生成先用 App 内的本地实现，接口留好，以后再换成真实模型
