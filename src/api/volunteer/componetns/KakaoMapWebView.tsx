import React from 'react';
import { View, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

interface Props {
  onLocationSelect: (data: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
}

const KakaoMapWebView = ({ onLocationSelect }: Props) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=31a31381a7d1acbd943f186a483e4194&libraries=services"></script>
      <style>
        html, body { margin: 0; padding: 0; height: 100%; }
        #map { width: 100%; height: 100%; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const container = document.getElementById('map');
        const map = new kakao.maps.Map(container, {
          center: new kakao.maps.LatLng(37.5665, 126.978),
          level: 3
        });

        const marker = new kakao.maps.Marker();
        const geocoder = new kakao.maps.services.Geocoder();

        kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
          const latlng = mouseEvent.latLng;
          marker.setMap(map);
          marker.setPosition(latlng);

          geocoder.coord2Address(latlng.getLng(), latlng.getLat(), function(result, status) {
            if (status === kakao.maps.services.Status.OK) {
              const address = result[0]?.road_address?.address_name || result[0]?.address?.address_name || '주소 없음';
              const payload = {
                type: 'location',
                latitude: latlng.getLat(),
                longitude: latlng.getLng(),
                address
              };
              window.ReactNativeWebView?.postMessage(JSON.stringify(payload));
            }
          });
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={{ height: 300, width: Dimensions.get('window').width - 32 }}>
      <WebView
        originWhitelist={['*']}
        javaScriptEnabled={true}
        source={{ html }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'location') {
              console.log('📩 WebView 메시지 수신:', data);
              onLocationSelect(data);
            } else {
              console.warn('⚠️ 알 수 없는 메시지 형식:', data);
            }
          } catch (e) {
            console.error('❌ JSON 파싱 실패:', e);
          }
        }}
      />
    </View>
  );
};

export default KakaoMapWebView;