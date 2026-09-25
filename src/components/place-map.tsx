import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import type { LatLng } from '@/lib/geo';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  place: LatLng | null;
  radius: number;
  onPick: (place: LatLng) => void;
};

/**
 * Leaflet + OpenStreetMap tiles inside a WebView: free, no API key, and plain web code.
 * Tap the map to move the pin; the circle shows the geofence radius.
 */
export function PlaceMap({ place, radius, onPick }: Props) {
  const webView = useRef<WebView>(null);
  const loaded = useRef(false);
  const theme = useTheme();

  const push = () => {
    if (!loaded.current || !place) return;
    webView.current?.injectJavaScript(
      `window.setPlace(${place.latitude}, ${place.longitude}, ${radius}); true;`
    );
  };

  useEffect(push, [place, radius]);

  const onMessage = (event: WebViewMessageEvent) => {
    const { latitude, longitude } = JSON.parse(event.nativeEvent.data) as LatLng;
    onPick({ latitude, longitude });
  };

  return (
    <View style={[styles.container, { borderColor: theme.border }]}>
      <WebView
        ref={webView}
        originWhitelist={['*']}
        // A real origin so OpenStreetMap tile requests carry a Referer, as its usage policy asks.
        source={{ html: buildHtml(theme.tint), baseUrl: 'https://github.com/mardesnic/des-location-reminder' }}
        onLoadEnd={() => {
          loaded.current = true;
          push();
        }}
        onMessage={onMessage}
        scrollEnabled={false}
        nestedScrollEnabled
      />
    </View>
  );
}

function buildHtml(color: string) {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<style>html, body, #map { margin: 0; height: 100%; }</style>
</head>
<body>
<div id="map"></div>
<script>
  const map = L.map('map', { zoomControl: false }).setView([45.815, 15.982], 3);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(map);

  let marker = null;
  let circle = null;
  let hasCentered = false;

  window.setPlace = (lat, lng, radius) => {
    const point = [lat, lng];
    if (!marker) {
      marker = L.marker(point).addTo(map);
      circle = L.circle(point, { radius, color: '${color}', weight: 2, fillOpacity: 0.15 }).addTo(map);
    } else {
      marker.setLatLng(point);
      circle.setLatLng(point).setRadius(radius);
    }
    if (!hasCentered || !map.getBounds().contains(point)) {
      map.setView(point, 16);
      hasCentered = true;
    }
  };

  map.on('click', (e) => {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ latitude: e.latlng.lat, longitude: e.latlng.lng })
    );
  });
</script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  container: {
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
