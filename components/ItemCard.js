import { View, Text, StyleSheet, Alert } from 'react-native';
import { colors, fonts, radius, shadow } from '../constants/theme';
import { Tag, SmallButton } from './UI';
import { SelectableCard } from './SelectableCard';

export function ItemCard({ item, selected, onSelect, type = 'activity' }) {
  return (
    <SelectableCard
      selected={selected}
      onPress={() => onSelect(item)}
      style={[styles.cardOuter, item.featured && styles.cardFeatured]}
      innerStyle={styles.cardInner}
    >
      {item.featured && (
        <View style={styles.featBadge}>
          <Text style={styles.featBadgeText}>✦ Featured Date Spot</Text>
        </View>
      )}
      {selected && (
        <View style={styles.checkCircle}>
          <Text style={styles.checkText}>✓</Text>
        </View>
      )}
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardType}>{item.type || item.cuisine}</Text>
      <Text style={styles.cardDesc}>{item.desc}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.rating}>★ {item.rating}</Text>
        <Tag label={item.dist} />
        {type === 'food' && item.price && <Tag label={item.price} variant="gold" />}
        {item.tag && <Tag label={item.tag} variant="rose" />}
        {item.note && type === 'food' && <Tag label={item.note} variant="rose" />}
      </View>
      {item.popular && (
        <Text style={styles.popularText}>⭐  Popular with couples</Text>
      )}
      {item.sponsored && (
        <Text style={styles.sponsoredText}>Sponsored</Text>
      )}
      <View style={styles.cardActions}>
        <SmallButton
          label="View Details"
          onPress={() => Alert.alert('Coming Soon', 'Detailed business pages launching soon!')}
        />
        <SmallButton
          label={type === 'food' ? 'Book Now →' : 'Reserve →'}
          variant="active"
          onPress={() => Alert.alert('Coming Soon', 'Booking integration coming soon!')}
        />
      </View>
    </SelectableCard>
  );
}

export function AddonCard({ item, selected, onSelect }) {
  return (
    <SelectableCard
      selected={selected}
      onPress={() => onSelect(item)}
      style={[styles.cardOuter, item.featured && styles.cardFeatured]}
      innerStyle={styles.cardInner}
    >
      {item.featured && (
        <View style={styles.featBadge}>
          <Text style={styles.featBadgeText}>✦ Featured Spot</Text>
        </View>
      )}
      {selected && (
        <View style={styles.checkCircle}>
          <Text style={styles.checkText}>✓</Text>
        </View>
      )}
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardType}>{item.note}</Text>
      <Text style={styles.cardDesc}>{item.desc}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.rating}>★ {item.rating}</Text>
        <Tag label={item.dist} />
      </View>
    </SelectableCard>
  );
}

const styles = StyleSheet.create({
  // Outer layout — margin only, SelectableCard handles bg/border/shadow
  cardOuter:   { marginBottom: 13 },
  // Inner visual — padding inside the card
  cardInner:   { padding: 20 },
  cardFeatured: { paddingTop: 30, borderTopWidth: 3, borderTopColor: colors.gold },
  featBadge: {
    position: 'absolute', top: 0, right: 16,
    backgroundColor: colors.gold,
    borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  featBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 9,
    color: '#1C1628',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  checkCircle: {
    position: 'absolute', top: 16, right: 16,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.rose,
    justifyContent: 'center', alignItems: 'center',
  },
  checkText:     { color: '#F2EDE8', fontSize: 13, fontFamily: fonts.bodySemiBold },
  cardTitle:     { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.charcoal, marginBottom: 2, paddingRight: 32 },
  cardType:      { fontFamily: fonts.body, fontSize: 12, color: colors.gray2, marginBottom: 8 },
  cardDesc:      { fontFamily: fonts.body, fontSize: 13, color: colors.gray, lineHeight: 20, marginBottom: 10 },
  metaRow:       { flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 },
  rating:        { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.gold },
  popularText:   { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.rose, marginBottom: 6 },
  sponsoredText: { fontFamily: fonts.body, fontSize: 10, color: colors.gray2, marginBottom: 4 },
  cardActions:   { flexDirection: 'row', gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.gray4 },
});