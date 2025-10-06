export type FileMap = Record<string, string>;

class InMemoryWorkspaceStore {
  private sessions: Map<string, FileMap> = new Map();

  init(sessionId: string, files: FileMap) {
    this.sessions.set(sessionId, files);
  }
  get(sessionId: string): FileMap | undefined {
    return this.sessions.get(sessionId);
  }
  update(sessionId: string, path: string, content: string) {
    const files = this.sessions.get(sessionId) ?? {};
    files[path] = content;
    this.sessions.set(sessionId, files);
  }
}

export const workspaceStore = new InMemoryWorkspaceStore();

export function createFlutterScaffold(appName: string, pages: string[]): FileMap {
  const safeAppName = appName || 'flutbuilder_app';
  const dartPages = pages && pages.length > 0 ? pages : ['home'];
  const routeName = (p: string) => `/${p}`;
  const screenImports = dartPages.map(p => `import 'screens/${p}.dart';`).join('\n');
  const navItems = dartPages.map(p => `ListTile(\n              title: Text('${p}'),\n              trailing: const Icon(Icons.chevron_right),\n              onTap: () => Navigator.pushNamed(context, '${routeName(p)}'),\n            )`).join(',\n            ');
  const routes = dartPages.map(p => `'${routeName(p)}': (context) => ${capitalize(p)}Screen(),`).join('\n        ');

  const files: FileMap = {
    'pubspec.yaml': `name: ${safeAppName}\nversion: 0.1.0\nenvironment:\n  sdk: '>=3.0.0 <4.0.0'\ndependencies:\n  flutter:\n    sdk: flutter\n  provider: ^6.1.2\n  cupertino_icons: ^1.0.6\ndev_dependencies:\n  flutter_test:\n    sdk: flutter\nflutter:\n  uses-material-design: true\n` ,
    'lib/main.dart': `import 'package:flutter/material.dart';\nimport 'package:provider/provider.dart';\n${screenImports}\n\nvoid main() => runApp(\n  ChangeNotifierProvider(\n    create: (_) => AppState(),\n    child: const MyApp(),\n  ),\n);\n\nclass AppState extends ChangeNotifier {\n  int counter = 0;\n  void increment() { counter++; notifyListeners(); }\n}\n\nclass MyApp extends StatelessWidget {\n  const MyApp({super.key});\n  @override\n  Widget build(BuildContext context) {\n    return MaterialApp(\n      title: '${safeAppName}',\n      theme: ThemeData.dark(),\n      routes: {\n        '/': (context) => const HomeScreen(),\n        ${routes}\n      },\n      initialRoute: '/',\n    );\n  }\n}\n\nclass HomeScreen extends StatelessWidget {\n  const HomeScreen({super.key});\n  @override\n  Widget build(BuildContext context) {\n    final count = context.watch<AppState>().counter;\n    return Scaffold(\n      appBar: AppBar(title: Text('Home — count: ' + count.toString())),\n      body: ListView(\n        children: [\n            ${navItems}\n        ],\n      ),\n      floatingActionButton: FloatingActionButton(\n        onPressed: () => context.read<AppState>().increment(),\n        child: const Icon(Icons.add),\n      ),\n    );\n  }\n}\n`,
    'test/widget_test.dart': `import 'package:flutter_test/flutter_test.dart';\nimport 'package:flutter/material.dart';\nimport 'package:provider/provider.dart';\nimport 'package:${safeAppName.replace(/[^a-zA-Z0-9_]/g, '_')}/main.dart' as app;\n\nvoid main() {\n  testWidgets('renders Home and increments counter', (tester) async {\n    await tester.pumpWidget(ChangeNotifierProvider(\n      create: (_) => app.AppState(),\n      child: const app.MyApp(),\n    ));\n    expect(find.textContaining('Home'), findsOneWidget);\n  });\n}\n`,
    'android/build.gradle': `buildscript {\n    repositories { google(); mavenCentral() }\n    dependencies { classpath 'com.android.tools.build:gradle:8.1.0' }\n}\nallprojects { repositories { google(); mavenCentral() } }\n`,
    'android/settings.gradle': `rootProject.name = '${safeAppName}'\ninclude ':app'\n`,
    'android/gradle.properties': `org.gradle.jvmargs=-Xmx2g -Dkotlin.daemon.jvm.options\nandroid.useAndroidX=true\nandroid.enableJetifier=true\n`,
    'android/app/build.gradle': `plugins { id 'com.android.application' }\nandroid { namespace '${sanitizePackage(safeAppName)}'; compileSdk 34; defaultConfig { applicationId '${sanitizePackage(safeAppName)}'; minSdk 21; targetSdk 34; versionCode 1; versionName '1.0' } buildTypes { release { minifyEnabled false } } }\ndependencies { }\n`,
    'android/app/src/main/AndroidManifest.xml': `<?xml version="1.0" encoding="utf-8"?>\n<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="${sanitizePackage(safeAppName)}">\n  <application android:label="${safeAppName}" android:icon="@mipmap/ic_launcher">\n    <activity android:name=".MainActivity">\n      <intent-filter>\n        <action android:name="android.intent.action.MAIN" />\n        <category android:name="android.intent.category.LAUNCHER" />\n      </intent-filter>\n    </activity>\n  </application>\n</manifest>\n`,
  };

  for (const page of dartPages) {
    files[`lib/screens/${page}.dart`] = `import 'package:flutter/material.dart';\n\nclass ${capitalize(page)}Screen extends StatelessWidget {\n  ${capitalize(page)}Screen({super.key});\n  @override\n  Widget build(BuildContext context) {\n    return Scaffold(\n      appBar: AppBar(title: const Text('${capitalize(page)}')),\n      body: Center(child: Text('Welcome to ${page}')),\n    );\n  }\n}\n`;
  }
  return files;
}

function capitalize(s: string) {
  const safe = (s || 'page').replace(/[^a-zA-Z0-9]/g, '');
  return safe.charAt(0).toUpperCase() + safe.slice(1);
}

function sanitizePackage(name: string) {
  const base = (name || 'flutbuilder_app').toLowerCase().replace(/[^a-z0-9.]/g, '.');
  const dedup = base.replace(/\.+/g, '.');
  return dedup.startsWith('.') ? `app${dedup}` : dedup;
}


