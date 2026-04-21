// app/+not-found.tsx — fallback for unknown routes.

import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { FONTS, useTheme } from '@/src/theme/ThemeProvider';

export default function NotFoundScreen() {
  const { palette } = useTheme();
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={[styles.container, { backgroundColor: palette.bg }]}>
        <Text style={[styles.title, { color: palette.ink, fontFamily: FONTS.display }]}>
          Can't find that page.
        </Text>
        <Link href="/" style={[styles.link, { color: palette.primary, fontFamily: FONTS.bodySemibold }]}>
          Back to the map
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    letterSpacing: -0.3,
    marginBottom: 12,
    textAlign: 'center',
  },
  link: {
    fontSize: 14,
    marginTop: 8,
  },
});
