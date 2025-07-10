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
    const shelterMarkers = shelters?.length
      ? shelters
          .map(
            (shelter) => `
              new kakao.maps.Marker({
                map: map,
                position: new kakao.maps.LatLng(${shelter.latitude}, ${shelter.longitude}),
                title: "${shelter.name}",
                image: new kakao.maps.MarkerImage(
                  'https://cdn-icons-png.flaticon.com/512/190/190411.png',
                  new kakao.maps.Size(32, 32)
                )
              });
            `
          )
          .join('\n')
      : '';

    const disasterMarkers = disasters?.length
      ? disasters
          .map(
            (disaster) => `
              new kakao.maps.Marker({
                map: map,
                position: new kakao.maps.LatLng(${disaster.latitude}, ${disaster.longitude}),
                title: "${disaster.disasterType}",
                image: new kakao.maps.MarkerImage(
                  'https://cdn-icons-png.flaticon.com/512/484/484167.png',
                  new kakao.maps.Size(32, 32)
                )
              });
            `
          )
          .join('\n')
      : '';

    return `
      <!DOCTYPE html>
      <html style="width:100%; height:100%;">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0" />
          <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_API_KEY}&autoload=false"></script>
        </head>
        <body style="margin:0; width:100%; height:100%;">
          <div id="map" style="width:100%;height:100%;"></div>
          <script>
            window.onerror = function(message, source, lineno, colno, error) {
              window.ReactNativeWebView?.postMessage("JS ERROR: " + message + " at " + lineno + ":" + colno);
            };

            document.addEventListener("DOMContentLoaded", function() {
              kakao.maps.load(function() {
                const mapContainer = document.getElementById('map');
                const mapOption = {
                  center: new kakao.maps.LatLng(${latitude}, ${longitude}),
                  level: 6
                };
                const map = new kakao.maps.Map(mapContainer, mapOption);

                new kakao.maps.Marker({
                  position: new kakao.maps.LatLng(${latitude}, ${longitude}),
                  map: map,
                  title: "현재 위치"
                });

                ${shelterMarkers}
                ${disasterMarkers}

                window.ReactNativeWebView?.postMessage("지도 로딩 완료");
              });
            });
          </script>
        </body>
      </html>
    `;
  }, [latitude, longitude, JSON.stringify(shelters), JSON.stringify(disasters)]);

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
  container: {
    flex: 1,
  },
});
