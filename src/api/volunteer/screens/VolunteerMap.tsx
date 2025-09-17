import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { styles } from '../styles/VolunteerPostDetailStyles.ts';
import { KAKAO_JS_API_KEY } from '@env';

interface Props {
  lat: number;
  lng: number;
}

const VolunteerMap: React.FC<Props> = ({ lat, lng }) => {
  const getMapHtml = (lat: number, lng: number) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_API_KEY}"></script>
      <style>
        html, body { margin: 0; padding: 0; height: 100%; }
        #map { width: 100%; height: 100%; border-radius: 12px; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = new kakao.maps.Map(document.getElementById('map'), {
          center: new kakao.maps.LatLng(${lat}, ${lng}),
          level: 3
        });
        new kakao.maps.Marker({
          position: new kakao.maps.LatLng(${lat}, ${lng}),
          map: map
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.mapContainer}>
      <WebView
         originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          cacheEnabled={false}
          scrollEnabled={true}
          nestedScrollEnabled={true}
        source={{ html: getMapHtml(lat, lng) }}
      />
    </View>
  );
};

export default VolunteerMap;
