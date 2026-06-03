import { setupMocks } from '@/mocks/mocks';

if (__DEV__) setupMocks();

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
