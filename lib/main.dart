import 'package:flutter/widgets.dart';

import 'bootstrap.dart';
import 'predict_me_app.dart';

Future<void> main() async {
  await bootstrap();
  runApp(const PredictMeApp());
}
