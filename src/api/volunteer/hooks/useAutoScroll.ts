import { useEffect, useRef } from 'react';
import type { FlatList } from 'react-native';

export const useAutoScroll = <T>(
  data: T[],
  highlightId: number | null,
  getId: (item: T) => number
) => {
  const flatListRef = useRef<FlatList<T>>(null);

  const scrollToItem = (id: number) => {
    const index = data.findIndex(item => getId(item) === id);
    if (index >= 0 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true });
    }
  };

  useEffect(() => {
    if (highlightId !== null && data.length > 0) {
      scrollToItem(highlightId);
    }
  }, [highlightId, data]);

  return { flatListRef, scrollToItem };
};
