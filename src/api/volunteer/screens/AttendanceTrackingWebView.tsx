import React, { useRef, useEffect } from 'react';
import { View } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';

const { LocationSenderService } = NativeModules;

const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>출석 실시간 알림</title>
  <style>
    body { font-family: Arial; padding: 10px; background: #f0f0f0; }
    h1 { font-size: 20px; }
    #log { white-space: pre-wrap; background: #fff; border: 1px solid #ccc; padding: 10px; height: 300px; overflow-y: scroll; }
    #status { margin: 10px 0; }
    span { font-weight: bold; }
  </style>
</head>
<body>
  <h1>출석 실시간 알림</h1>
  <div id="status">WebSocket 상태: <span id="wsStatus">연결 전</span></div>
  <pre id="log"></pre>
  <script>
    let token = null;
    let myVolunteerId = null;
    let socket = null;
    const logEl = document.getElementById("log");
    const wsStatusEl = document.getElementById("wsStatus");

    function log(msg) {
      const now = new Date().toLocaleTimeString();
      logEl.textContent += \`[\${now}] \${msg}\n\`;
      logEl.scrollTop = logEl.scrollHeight;
    }

    function connectSocket() {
      if (!token) return;

      socket = new WebSocket(\`ws://10.0.2.2:8080/api/tracking?token=\${token}\`);

      socket.onopen = () => {
        wsStatusEl.textContent = "연결됨";
        log("✅ WebSocket 연결 완료");
      };

      socket.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        log("📩 메시지 수신: " + e.data);

        if (msg.type === "READY") {
          myVolunteerId = msg.data.participantUserId;
          log("🆔 volunteerId: " + myVolunteerId);
          window.ReactNativeWebView?.postMessage(JSON.stringify({ type: "VOLUNTEER_ID", payload: myVolunteerId }));
        } else if (msg.type === "STARTED") {
          log("▶️ 출석 시작됨");
          window.ReactNativeWebView?.postMessage(JSON.stringify({ type: "START_TRACKING" }));
        } else if (msg.type === "ENDED") {
          log("🛑 출석 종료됨");
          window.ReactNativeWebView?.postMessage(JSON.stringify({ type: "STOP_TRACKING" }));
        }
      };

      socket.onerror = () => {
        log("⚠️ WebSocket 오류");
      };

      socket.onclose = () => {
        wsStatusEl.textContent = "연결 종료";
        log("🔌 WebSocket 종료");
      };
    }

    window.addEventListener("message", (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "JWT") {
          token = msg.payload;
          log("🔐 JWT 수신 완료");
          connectSocket();
        }
      } catch {
        log("⚠️ 메시지 파싱 오류");
      }
    });

    window.ReactNativeWebView?.postMessage(JSON.stringify({ type: "REQUEST_JWT" }));
  </script>
</body>
</html>`;

export default function AttendanceTrackingWebView() {
  const webviewRef = useRef<WebView>(null);

  const onMessage = async (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);

      switch (msg.type) {
        case 'REQUEST_JWT': {
          const token = await AsyncStorage.getItem('accessToken');
          if (token) {
            webviewRef.current?.postMessage(JSON.stringify({ type: 'JWT', payload: token }));
          }
          break;
        }

        case 'VOLUNTEER_ID': {
          await AsyncStorage.setItem('volunteerId', msg.payload.toString());
          break;
        }

        case 'START_TRACKING': {
          const token = await AsyncStorage.getItem('accessToken');
          const volunteerId = await AsyncStorage.getItem('volunteerId');
          if (token && volunteerId) {
            LocationSenderService.start(token, volunteerId);
          }
          break;
        }

        case 'STOP_TRACKING': {
          LocationSenderService.stop();
          break;
        }
      }
    } catch (error) {
      console.warn('WebView 메시지 처리 오류:', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}
