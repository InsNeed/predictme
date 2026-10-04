# Predict Me

用户写一条要预测的事。应用在本地生成 960 个按人口权重铺开的人设，再按决策科学教材把每个人这一次的条件叠好。真正打到 DeepSeek 的人数默认 **3**，最多 **8**。页面给出每个人的判断，以及这次实呼的汇总。

没有 Firebase。密钥不进仓库。

## 密钥

复制 `config/deepseek.example.json` 为 `config/deepseek.local.json`，把临时密钥填进 `apiKey`。这个文件已被 gitignore。

```json
{
  "apiKey": "",
  "baseUrl": "https://api.deepseek.com",
  "model": "deepseek-flash",
  "maxParallelCalls": 3
}
```

没有密钥时仍会生成本地人口，并在页面说明这次没有发出请求。

## 运行

```bash
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter run
```

## 检查

```bash
flutter analyze
flutter test
```
