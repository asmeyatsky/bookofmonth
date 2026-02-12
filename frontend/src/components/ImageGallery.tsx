import React from 'react';
import { View, Image, StyleSheet, FlatList, Dimensions } from 'react-native';
import { spacing, borderRadius } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ImageGalleryProps {
  images: { url: string; caption?: string }[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  const renderItem = ({ item }: { item: { url: string; caption?: string } }) => (
    <View style={styles.imageContainer}>
      <Image source={{ uri: item.url }} style={styles.image} />
    </View>
  );

  return (
    <View style={styles.galleryContainer}>
      <FlatList
        data={images}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
      />
    </View>
  );
};

const styles = StyleSheet.create({
  galleryContainer: {
    marginBottom: spacing.lg,
  },
  imageContainer: {
    width: SCREEN_WIDTH - spacing.lg * 2,
    paddingRight: spacing.md,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
  },
});

export default ImageGallery;
