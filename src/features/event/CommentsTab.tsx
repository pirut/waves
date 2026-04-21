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
import { FONTS, useTheme } from '@/src/theme/ThemeProvider';

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

  return (
    <View style={{ gap: 14, paddingTop: 4 }}>
      {(page?.page ?? []).map((c: CommentRow) =>
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
          onPress={onPost}
          disabled={!canPost}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: canPost ? palette.primary : palette.line,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon
            name="arrowR"
            size={16}
            color={canPost ? (palette.dark ? '#1a1a1a' : '#fff') : palette.ink3}
          />
        </Pressable>
      </View>
    </View>
  );
}
