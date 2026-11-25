import React, { useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { errorMessage } from '@/api/client';
import { useReviewBooking } from '@/api/hooks';
import type { BookingDetail } from '@/api/types';
import { haptic } from '@/lib/haptics';
import { Banner, Button, Card, StarRating, Text, TextField, enter, layout, space, useToast } from '@/ui';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

export function ReviewForm({ booking }: { booking: BookingDetail }) {
  const review = useReviewBooking();
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const forHandyman = booking.role === 'client';

  const submit = async () => {
    setError(null);
    try {
      await review.mutateAsync({ id: booking._id, rating, text: text.trim() || undefined });
      haptic.success();
      toast('Thanks for your review');
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <Card style={{ gap: space.md }}>
      <Text variant="subheading">How was {forHandyman ? `${booking.other.firstName}'s work` : `working with ${booking.other.firstName}`}?</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <StarRating value={rating} onChange={setRating} size={34} />
        {rating > 0 && (
          <Animated.View key={rating} entering={enter.fade()}>
            <Text variant="label" tone="secondary">
              {LABELS[rating]}
            </Text>
          </Animated.View>
        )}
      </View>
      {rating > 0 && (
        <Animated.View entering={enter.up()} layout={layout()} style={{ gap: space.md }}>
          <TextField
            label={forHandyman ? 'Tell other clients about the job' : 'Anything to add?'}
            optional
            multiline
            value={text}
            onChangeText={setText}
            maxLength={1000}
            placeholder={forHandyman ? 'Was it done well and on time? Would you hire them again?' : 'Was the client clear and easy to work with?'}
          />
          <Banner tone="danger" message={error} />
          <Button title="Submit review" onPress={submit} loading={review.isPending} />
        </Animated.View>
      )}
    </Card>
  );
}
