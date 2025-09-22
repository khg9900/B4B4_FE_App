import React, { useRef, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import type { ShelterDto, DisasterDto } from '../types/Map';
import { KAKAO_JS_API_KEY } from '@env';

type Props = {
  latitude: number;
  longitude: number;
  shelters: ShelterDto[];
  disasters: DisasterDto[];
};

const KakaoMapView: React.FC<Props> = ({
  latitude,
  longitude,
  shelters,
  disasters,
}) => {
  const webViewRef = useRef(null);

  const htmlContent = useMemo(() => {
    const sheltersJS = JSON.stringify(
      (shelters ?? []).map(s => ({
        lat: s.latitude,
        lng: s.longitude,
        name: s.name,
      }))
    );

    const disastersJS = JSON.stringify(
      (disasters ?? []).map(d => ({
        lat: d.latitude,
        lng: d.longitude,
        type: String((d as any).disasterType ?? '').toUpperCase(),
        status: (d as any).status ?? '',
        count: Number((d as any).count ?? 1),
      }))
    );

    return `
      <!DOCTYPE html>
      <html style="width:100%; height:100%;">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0" />
          <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_API_KEY}&autoload=false"></script>
          <style>
            html,body,#map{width:100%;height:100%;margin:0;padding:0}
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            const shelters = ${sheltersJS};
            const disasters = ${disastersJS};

            // 유형별 색상
            const disasterColors = {
              EARTHQUAKE:'#FF3B30',
              FLOOD:'#007AFF',
              TYPHOON:'#FF9500',
              WILDFIRE:'#C21807',
              LANDSLIDE:'#8B4513',
              POWER_OUTAGE:'#8E8E93',
              TERROR_ATTACK:'#000000',
              BUILDING_COLLAPSE:'#6A5ACD',
            };

            const hexToRgba = (hex, a) => {
              const h = (hex||'#808080').replace('#','');
              const v = h.length===3 ? h.split('').map(c=>c+c).join('') : h;
              const n = parseInt(v,16);
              const r=(n>>16)&255, g=(n>>8)&255, b=n&255;
              return 'rgba('+r+','+g+','+b+','+(a ?? 0.35)+')';
            };

            window.onerror = function(message, source, lineno, colno) {
              window.ReactNativeWebView?.postMessage("JS ERROR: " + message + " at " + lineno + ":" + colno);
            };

            document.addEventListener("DOMContentLoaded", function() {
              kakao.maps.load(function() {
                const map = new kakao.maps.Map(document.getElementById('map'), {
                  center: new kakao.maps.LatLng(${latitude}, ${longitude}),
                  level: 6
                });

                // 현재 위치
                new kakao.maps.Marker({
                  position: new kakao.maps.LatLng(${latitude}, ${longitude}),
                  map: map,
                  title: "현재 위치"
                });

                // 대피소 마커(아이콘 유지)
                shelters.forEach(s => {
                  new kakao.maps.Marker({
                    map,
                    position: new kakao.maps.LatLng(s.lat, s.lng),
                    title: s.name,
                    image: new kakao.maps.MarkerImage(
                      'https://cdn-icons-png.flaticon.com/512/190/190411.png',
                      new kakao.maps.Size(32, 32)
                    )
                  });
                });

                // 재난: 반투명 컬러 원을 CustomOverlay로 겹치기 표현
                disasters.forEach(d => {
                  const pos = new kakao.maps.LatLng(d.lat, d.lng);
                  const base = disasterColors[d.type] || '#808080';
                  const count = Math.max(1, Number(d.count||1));
                  // 강도 표현: 반경/투명도 스케일
                  const radiusPx = Math.min(8 + count * 2, 20); // 화면 픽셀 기반
                  const alpha = Math.min(0.15 + count * 0.05, 0.45);

                  // 원 엘리먼트
                  const el = document.createElement('div');
                  el.style.width = radiusPx*2 + 'px';
                  el.style.height = radiusPx*2 + 'px';
                  el.style.marginLeft = (-radiusPx) + 'px';
                  el.style.marginTop = (-radiusPx) + 'px';
                  el.style.borderRadius = '50%';
                  el.style.background = hexToRgba(base, alpha);
                  el.style.border = '1px solid rgba(0,0,0,0.15)';
                  el.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.6) inset';
                  el.style.pointerEvents = 'auto';

                  const overlay = new kakao.maps.CustomOverlay({
                    position: pos,
                    content: el,
                    xAnchor: 0.5,
                    yAnchor: 0.5,
                    zIndex: 2
                  });
                  overlay.setMap(map);

                  const infowindow = new kakao.maps.InfoWindow({
                    content: '<div style="padding:5px;"><strong>'+(d.type||'')+'</strong><br/>상태: '+(d.status||'-')+'<br/>건수: '+count+'</div>'
                  });
                  el.addEventListener('click', () => {
                    infowindow.getMap() ? infowindow.close() : infowindow.open(map, new kakao.maps.Marker({position:pos}));
                  });
                });

                window.ReactNativeWebView?.postMessage("지도 로딩 완료");
              });
            });
          </script>
        </body>
      </html>
    `;
  }, [latitude, longitude, shelters, disasters]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        javaScriptCanOpenWindowsAutomatically
        mixedContentMode="always"
        source={{ html: htmlContent }}
        style={{ flex: 1 }}
        onError={({ nativeEvent }) => {
          console.warn('WebView error: ', nativeEvent);
        }}
        onMessage={(event) => {
          console.log('WebView message:', event.nativeEvent.data);
        }}
      />
    </View>
  );
};

export default KakaoMapView;

const styles = StyleSheet.create({
  container: { flex: 1 },
});
