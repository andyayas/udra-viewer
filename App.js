// UDRA Viewer: runs the UDRA prototype full screen, edge to edge. Everything ships inside the app; no website needed.
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import { Directory, File, Paths } from 'expo-file-system';
import Constants from 'expo-constants';
import { WEB_FILES, WEB_VERSION } from './webfiles';

const C = { stage: '#0D0E1A', sheet: '#191B28', ink: '#04050B', fg: '#FFFFFF', muted: 'rgba(239,236,230,0.7)', line: 'rgba(255,255,255,0.16)', track: 'rgba(255,255,255,0.12)', blue: '#005EFF' };

const ROOT = new Directory(Paths.document, 'udra-web');

// While `npm start` runs on the computer, load the screen from its live-reload server (port 8090),
// so edits in screen/ show up on the phone instantly. Otherwise use the copy bundled in the app.
async function findDevServer() {
  if (!__DEV__) return null;
  const hostUri = (Constants.expoConfig && Constants.expoConfig.hostUri) || '';
  const host = hostUri.split(':')[0];
  if (!host) return null;
  const base = `http://${host}:8090`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 1500);
  try {
    const res = await fetch(base + '/__ping', { signal: ctrl.signal });
    return res.ok && (await res.text()) === 'udra' ? base + '/index.html' : null;
  } catch (e) {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// Copies the bundled prototype into the app's documents folder (only when it's new or changed).
async function install(onProgress) {
  const marker = new File(ROOT, 'version.txt');
  try {
    if (marker.exists && marker.textSync() === WEB_VERSION) return;
  } catch (e) { /* reinstall */ }
  if (ROOT.exists) ROOT.delete();
  ROOT.create({ idempotent: true, intermediates: true });
  let done = 0;
  for (const [rel, mod] of WEB_FILES) {
    const asset = Asset.fromModule(mod);
    await asset.downloadAsync();
    const parts = rel.split('/');
    let dir = ROOT;
    for (const p of parts.slice(0, -1)) {
      dir = new Directory(dir, p);
      dir.create({ idempotent: true, intermediates: true });
    }
    await new File(asset.localUri).copy(new File(dir, parts[parts.length - 1]), { overwrite: true });
    onProgress(Math.round((++done / WEB_FILES.length) * 100));
  }
  marker.write(WEB_VERSION);
}

export default function App() {
  const [pct, setPct] = useState(0);
  const [ready, setReady] = useState(false);
  const [devUrl, setDevUrl] = useState(null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const start = useCallback(() => {
    setError(null);
    setReady(false);
    findDevServer().then((url) => {
      if (url) { setDevUrl(url); setReady(true); return; }
      return install(setPct).then(() => setReady(true));
    }).catch((e) => setError(String((e && e.message) || e)));
  }, []);
  useEffect(start, [start]);

  if (error) {
    return (
      <View style={[styles.root, styles.center]}>
        <StatusBar style="light" />
        <View style={styles.card}>
          <Text style={styles.title}>Couldn’t set up the prototype</Text>
          <Text style={styles.body} numberOfLines={4}>{error}</Text>
          <Pressable onPress={start} style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}>
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={[styles.root, styles.center]}>
        <StatusBar style="light" />
        <Text style={styles.body}>Setting up UDRA · {pct}%</Text>
        <View style={styles.track}><View style={[styles.fill, { width: `${pct}%` }]} /></View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <WebView
        key={reloadKey}
        source={{ uri: devUrl || new File(ROOT, 'index.html').uri }}
        allowingReadAccessToURL={ROOT.uri}
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        originWhitelist={['*']}
        style={styles.web}
        containerStyle={styles.web}
        // Edge to edge: no automatic insets, so the page's own safe-area handling applies.
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        bounces={false}
        scrollEnabled={false}
        overScrollMode="never"
        allowsBackForwardNavigationGestures={false}
        allowsLinkPreview={false}
        setSupportMultipleWindows={false}
        javaScriptEnabled
        domStorageEnabled
        // Development: lets Safari's Web Inspector on the Mac profile the screen (Develop menu → the iPhone).
        webviewDebuggingEnabled={__DEV__}
        onContentProcessDidTerminate={() => setReloadKey((k) => k + 1)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.stage },
  web: { flex: 1, backgroundColor: C.stage },
  center: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  track: { width: 180, height: 4, borderRadius: 2, backgroundColor: C.track, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2, backgroundColor: C.blue },
  card: { width: '86%', maxWidth: 380, padding: 20, borderRadius: 24, backgroundColor: C.sheet, borderWidth: 1, borderColor: C.line, gap: 12 },
  title: { color: C.fg, fontSize: 20, fontWeight: '600' },
  body: { color: C.muted, fontSize: 14, lineHeight: 20 },
  button: { height: 48, borderRadius: 24, backgroundColor: C.fg, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: C.ink, fontSize: 15, fontWeight: '600' },
});
