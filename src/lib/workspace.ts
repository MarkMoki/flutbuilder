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
  const screenImports = pages.map(p => `import 'screens/${p}.dart';`).join('\n');
  const navItems = pages.map(p => `ListTile(title: Text('${p}'))`).join(',\n            ');
  const files: FileMap = {
    'pubspec.yaml': `name: ${appName || 'flutbuilder_app'}\nversion: 0.1.0\nenvironment:\n  sdk: '>=3.0.0 <4.0.0'\ndependencies:\n  flutter:\n    sdk: flutter\n`,
    'lib/main.dart': `import 'package:flutter/material.dart';\n${screenImports}\n\nvoid main() => runApp(const MyApp());\n\nclass MyApp extends StatelessWidget {\n  const MyApp({super.key});\n  @override\n  Widget build(BuildContext context) {\n    return MaterialApp(title: '${appName}', theme: ThemeData.dark(), home: const HomeScreen());\n  }\n}\n\nclass HomeScreen extends StatelessWidget {\n  const HomeScreen({super.key});\n  @override\n  Widget build(BuildContext context) {\n    return Scaffold(appBar: AppBar(title: const Text('Home')), body: ListView(children: [\n            ${navItems}\n          ]));\n  }\n}\n`,
    'android/build.gradle': `buildscript {\n    repositories { google(); mavenCentral() }\n    dependencies { classpath 'com.android.tools.build:gradle:8.1.0' }\n}\nallprojects { repositories { google(); mavenCentral() } }\n`,
    'android/settings.gradle': `rootProject.name = '${appName || 'flutbuilder_app'}'\ninclude ':app'\n`,
    'android/gradle.properties': `org.gradle.jvmargs=-Xmx2g -Dkotlin.daemon.jvm.options\nandroid.useAndroidX=true\nandroid.enableJetifier=true\n`,
    'android/app/build.gradle': `plugins { id 'com.android.application' }\nandroid { namespace '${sanitizePackage(appName)}'; compileSdk 34; defaultConfig { applicationId '${sanitizePackage(appName)}'; minSdk 21; targetSdk 34; versionCode 1; versionName '1.0' } buildTypes { release { minifyEnabled false } } }\ndependencies { }\n`,
    'android/app/src/main/AndroidManifest.xml': `<?xml version="1.0" encoding="utf-8"?>\n<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="${sanitizePackage(appName)}">\n  <application android:label="${appName}" android:icon="@mipmap/ic_launcher">\n    <activity android:name=".MainActivity">\n      <intent-filter>\n        <action android:name="android.intent.action.MAIN" />\n        <category android:name="android.intent.category.LAUNCHER" />\n      </intent-filter>\n    </activity>\n  </application>\n</manifest>\n`,
  };
  for (const page of pages) {
    files[`lib/screens/${page}.dart`] = `import 'package:flutter/material.dart';\n\nclass ${capitalize(page)}Screen extends StatelessWidget {\n  const ${capitalize(page)}Screen({super.key});\n  @override\n  Widget build(BuildContext context) {\n    return Scaffold(appBar: AppBar(title: const Text('${capitalize(page)}')), body: const Center(child: Text('${page}')));\n  }\n}\n`;
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


