/// LogLens 模块。只保留这条预测流程用得到的域。
enum AppLogModule {
  app,
  predict,
  database,
  network,
}

/// LogLens 层级，按架构层划分。
enum AppLogLayer {
  presentation,
  domain,
  data,
  undefined,
  infrastructure,
}
