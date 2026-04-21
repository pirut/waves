// app/(tabs)/create.tsx — stub route for the `create` tab entry. The tabPress
// listener in (tabs)/_layout.tsx prevents this from ever rendering, but Expo
// Router still requires a file to exist for a tab named `create`.
//
// If anything navigates here directly, bounce to the modal.

import { Redirect } from 'expo-router';

export default function CreateTabStub() {
  return <Redirect href="/create" />;
}
