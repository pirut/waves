// CommentsTab.tsx — paginated comments feed + composer.

import { useMutation, useQuery } from 'convex/react';
import { formatDistanceToNowStrict } from 'date-fns';
import { useState } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Avatar } from '@/src/components/Avatar';
import { Icon } from '@/src/components/Icon';
import { Skeleton } from '@/src/components/Skeleton';
import { FONTS, useTheme } from '@/src/theme/ThemeProvider';
import { UI } from '@/src/theme/layout';

type CommentsTabProps = {
  eventId: Id<'events'>;
};

type CommentRow = {
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

export function CommentsTab({ eventId }: CommentsTabProps) {
  const { palette } = useTheme();
  const [draft, setDraft] = useState('');
  const page = useQuery(api.comments.listByEvent, {
    eventId,
    paginationOpts: { numItems: 50, cursor: null },
  });
  const postComment = useMutation(api.comments.postComment);

  const canPost = draft.trim().length > 0;

  const onPost = async () => {
    if (!canPost) return;
    const body = draft.trim();
    setDraft('');
    try {
      await postComment({ eventId, body });
    } catch {
      // Restore draft on failure so the user can retry.
      setDraft(body);
    }
  };

  const loading = page === undefined;
  const comments = page?.page ?? [];
  const hasMore = page !== undefined && page.isDone === false;

  return (
    <View style={{ gap: 14, paddingTop: 4 }}>
      {loading && (
        <View style={{ gap: 14 }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
              <Skeleton width={32} height={32} radius={16} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="40%" height={10} />
                <Skeleton width="90%" height={12} />
                <Skeleton width="70%" height={12} />
              </View>
            </View>
          ))}
        </View>
      )}

      {!loading && comments.length === 0 && (
        <View
          style={{
            paddingVertical: 28,
            alignItems: 'center',
            gap: 8,
            borderRadius: UI.radius.md,
            borderWidth: 1,
            borderColor: palette.line,
            borderStyle: 'dashed',
            backgroundColor: 'transparent',
          }}
        >
          <Icon name="chat" size={20} color={palette.ink3} />
          <Text style={{ fontFamily: FONTS.bodySemibold, fontSize: 14, color: palette.ink2 }}>
            No comments yet
          </Text>
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 12,
              color: palette.ink3,
              textAlign: 'center',
              maxWidth: 240,
            }}
          >
            Be the first to ask a question or say hi.
          </Text>
        </View>
      )}

      {comments.map((c: CommentRow) =>
        c.author ? (
          <View key={c._id} style={{ flexDirection: 'row', gap: 10 }}>
            <Avatar user={{ initials: c.author.initials, tone: c.author.tone }} size={32} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
                <Text style={{ fontFamily: FONTS.bodySemibold, fontSize: 13, color: palette.ink }}>
                  {c.author.name}
                </Text>
                <Text style={{ fontFamily: FONTS.body, fontSize: 11, color: palette.ink3 }}>
                  {formatDistanceToNowStrict(new Date(c._creationTime), { addSuffix: false })} ago
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 14,
                  lineHeight: 21,
                  color: palette.ink2,
                }}
              >
                {c.body}
              </Text>
            </View>
          </View>
        ) : null,
      )}

      {hasMore && (
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: 12,
            color: palette.ink3,
            textAlign: 'center',
            paddingVertical: 8,
          }}
        >
          Showing the most recent {comments.length} · older comments archived
        </Text>
      )}

      {/* Composer */}
      <View
        style={{
          marginTop: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingLeft: 14,
          paddingRight: 8,
          paddingVertical: 8,
          borderRadius: 22,
          backgroundColor: palette.surface2,
          borderWidth: 1,
          borderColor: palette.line,
        }}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Ask a question or say hi…"
          placeholderTextColor={palette.ink3}
          style={{
            flex: 1,
            fontFamily: FONTS.body,
            fontSize: 14,
            color: palette.ink,
            paddingVertical: 0,
          }}
          returnKeyType="send"
          onSubmitEditing={onPost}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Post comment"
          accessibilityState={{ disabled: !canPost }}
          onPress={onPost}
          disabled={!canPost}
          hitSlop={6}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: canPost ? palette.primary : palette.line,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon
            name="arrowR"
            size={16}
            color={canPost ? palette.onPrimary : palette.ink3}
          />
        </Pressable>
      </View>
    </View>
  );
}
