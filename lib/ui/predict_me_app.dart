import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:predictme/data/personas.dart';
import 'package:predictme/models/persona.dart';
import 'package:predictme/services/persona_responder.dart';
import 'package:predictme/services/prediction_runner.dart';
import 'package:predictme/services/rule_template_persona_responder.dart';
import 'package:predictme/state/prediction_history.dart';
import 'package:predictme/ui/home_screen.dart';

class PredictMeApp extends StatefulWidget {
  const PredictMeApp({super.key, this.responder, this.personas = kPersonas});

  /// Override in tests. Defaults to the local rule/template responder.
  final PersonaResponder? responder;
  final List<Persona> personas;

  @override
  State<PredictMeApp> createState() => _PredictMeAppState();
}

class _PredictMeAppState extends State<PredictMeApp> {
  final PredictionHistory _history = PredictionHistory();

  @override
  void dispose() {
    _history.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final runner = PredictionRunner(
      responder: widget.responder ?? const RuleTemplatePersonaResponder(),
      personas: widget.personas,
    );
    return PredictionHistoryScope(
      history: _history,
      child: MaterialApp(
        title: 'Predict Me',
        debugShowCheckedModeBanner: false,
        locale: const Locale('zh'),
        supportedLocales: const [Locale('zh')],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF3D5AFE)),
          useMaterial3: true,
        ),
        darkTheme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF3D5AFE),
            brightness: Brightness.dark,
          ),
          useMaterial3: true,
        ),
        home: HomeScreen(runner: runner),
      ),
    );
  }
}
