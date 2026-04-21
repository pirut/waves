// ActivityScreen.tsx — notifications feed with unread styling.
// Ported from screens-hub.jsx `NotificationsScreen`.

import { useMutation, useQuery } from 'convex/react';
import { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDistanceToNowStrict } from 'date-fns';
import { api } from '@/convex/_generated/api';
import { Avatar } from '@/src/components/Avatar';
import { Icon, type IconName } from '@/src/components/Icon';
import { FONTS, useTheme } from '@/src/theme/ThemeProvider';

// Return shape of notifications.listForMe. Declared here instead of
// importing from convex because the codegen `api` type is a generic stub
// until `npx convex dev` runs.
type ActivityNotification = {
  _id: string;
  _creationTime: number;
  kind: 'update' | 'reply' | 'reminder' | 'badge' | 'new' | 'thanks';
  body: string;
  unread: boolean;
  from: {
    _id: string;
    name: string;
    initials: string;
    tone: number;
  } | null;
  event: { _id: string; title: string } | null;
};

const KIND_ICON: Record<string, IconName> = {
  update: 'bell',
  reply: 'chat',
  reminder: 'clock',
  badge: 'ripple2',
  new: 'pin',
  thanks: 'heart',
};

export function ActivityScreen() {
  const { palette } = useTheme();
  const unreadCount = useQuery(api.notifications.unreadCount, {});
  const page = useQuery(api.notifications.listForMe, {
    paginationOpts: { numItems: 50, cursor: null },
  });
  const markAllRead = useMutation(api.notifications.markAllRead);

  // Mark all as read on mount — matches the prototype's "3 new" header clearing
  // when the user lands on the tab.
  useEffect(() => {
    void markAllRead({}).catch(() => {});
  }, [markAllRead]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
          <Text
            style={{
              fontFamily: FONTS.bodySemibold,
              fontSize: 12,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: palette.ink3,
            }}
          >
            Activity
          </Text>
          <Text
            style={{
              fontFamily: FONTS.display,
              fontSize: 32,
              color: palette.ink,
              letterSpacing: -0.4,
              marginTop: 4,
            }}
          >
            {(unreadCount ?? 0) > 0 ? `${unreadCount} new ripple${unreadCount === 1 ? '' : 's'}` : 'All caught up'}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 12 }}>
          {(page?.page ?? []).map((n: ActivityNotification) => {
            const iconName = KIND_ICON[n.kind] ?? 'bell';
            const relative = formatDistanceToNowStrict(new Date(n._creationTime), { addSuffix: false });
            return (
              <View
                key={n._id}
                style={{
                  flexDirection: 'row',
                  gap: 12,
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: n.unread ? palette.surface : 'transparent',
                  borderWidth: n.unread ? 0.5 : 0,
                  borderColor: palette.line,
                  marginBottom: 4,
                }}
              >
                {n.from ? (
                  <Avatar
                    user={{ initials: n.from.initials, tone: n.from.tone }}
                    size={36}
                  />
                ) : (
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: palette.wash,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name={iconName} size={18} color={palette.primary} />
                  </View>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 14,
                      color: palette.ink,
                      lineHeight: 20,
                    }}
                  >
                    {n.from && (
                      <Text style={{ fontFamily: FONTS.bodySemibold, color: palette.ink }}>
                        {n.from.name}{' '}
                      </Text>
                    )}
                    <Text style={{ color: palette.ink2 }}>{n.body}</Text>
                  </Text>
                  {n.event && (
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        backgroundColor: palette.surface2,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 10,
                        marginTop: 4,
                      }}
                    >
                      <Text
                        style={{ fontFamily: FONTS.body, fontSize: 12, color: palette.ink3 }}
                        numberOfLines={1}
                      >
                        {n.event.title}
                      </Text>
                    </View>
                  )}
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 11,
                      color: palette.ink3,
                      marginTop: 4,
                    }}
                  >
                    {relative} ago
                  </Text>
                </View>
                {n.unread && (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: palette.accent,
                      marginTop: 14,
                    }}
                  />
                )}
              </View>
            );
          })}
          {(page?.page?.length ?? 0) === 0 && (
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: 13,
                color: palette.ink3,
                textAlign: 'center',
                padding: 32,
              }}
            >
              Nothing new just yet.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
