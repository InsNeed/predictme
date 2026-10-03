# Predict Me

用户提交一个想判断的话题和背景，几位固定人设在本地同时回答：会不会用、会不会付费、原因、顾虑，并汇总使用率和付费率。界面为中文。

当前回答由 App 内的规则模板生成，不调用真实模型。作答入口是 `PersonaResponder`，以后可以换成真实模型实现。

## 运行

需要 Flutter stable 渠道。

```bash
flutter pub get
flutter run
```

## 检查

```bash
flutter analyze
flutter test
```

## Firebase

故意还没接入 Firebase、Cloud Functions、后端或任何 API Key。预测和作答都在本机完成。
