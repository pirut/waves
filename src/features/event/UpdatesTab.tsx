// UpdatesTab.tsx — host-posted updates feed.

import { formatDistanceToNowStrict } from 'date-fns';
import { Text, View } from 'react-native';
import { Avatar } from '@/src/components/Avatar';
import { EmptyState } from '@/src/components/EmptyState';
import { FONTS, useTheme } from '@/src/theme/ThemeProvider';

type Update = {
  _id: string;
  _creationTime: number;
  body: string;
  author: {
    _id: string;
    name: string;
    initials: string;
    tone: number;
  } | null;
};

type UpdatesTabProps = {
  updates: Update[];
};

export function UpdatesTab({ updates }: UpdatesTabProps) {
  const { palette } = useTheme();

  if (updates.length === 0) {
    return (
      <EmptyState
        icon="bell"
        text="No updates yet. The host will post here as the event gets closer."
      />
    );
  }

  return (
    <View style={{ gap: 16, paddingTop: 4 }}>
      {updates.map((u) => (
        <View
          key={u._id}
          style={{
            padding: 14,
            borderRadius: 14,
            backgroundColor: palette.surface2,
            borderLeftWidth: 3,
            borderLeftColor: palette.primary,
          }}
        >
          {u.author && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Avatar user={{ initials: u.author.initials, tone: u.author.tone }} size={26} />
              <Text style={{ fontFamily: FONTS.bodySemibold, fontSize: 13, color: palette.ink }}>
                {u.author.name}
              </Text>
              <Text style={{ fontFamily: FONTS.body, fontSize: 11, color: palette.ink3 }}>
                · Host · {formatDistanceToNowStrict(new Date(u._creationTime), { addSuffix: false })} ago
              </Text>
            </View>
          )}
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 14,
              lineHeight: 21,
              color: palette.ink,
            }}
          >
            {u.body}
          </Text>
        </View>
      ))}
    </View>
  );
}
