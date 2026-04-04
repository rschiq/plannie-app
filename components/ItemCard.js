import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { colors, fonts, radius, shadow } from '../constants/theme';
import { Tag, SmallButton } from './UI';

export function ItemCard({ item, selected, onSelect, type = 'activity' }) {
  return (
    <TouchableOpacity
      onPress={() => onSelect(item)}
      activeOpacity={0.88}
      style={[styles.card, selected && styles.cardSelected, item.featured && styles.cardFeatured]}
    >
      {item.featured && (
        <View style={styles.featBadge}>
          {/* ✅ Explicit dark text on gold badge — colors.white is now dark surface */}
          <Text style={styles.featBadgeText}>✦ Featured Date Spot</Text>
        </View>
      )}
      {selected && (
        <View style={styles.checkCircle}>
          {/* ✅ Explicit warm white — colors.white is now dark */}
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
    </TouchableOpacity>
  );
}

export function AddonCard({ item, selected, onSelect }) {
  return (
    <TouchableOpacity
      onPress={() => onSelect(item)}
      activeOpacity={0.88}
      style={[styles.card, selected && styles.cardSelected, item.featured && styles.cardFeatured]}
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
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // ── Base card — dark elevated surface ──────────────────────
  card: {
    backgroundColor: colors.cream2,    // #181626 dark elevated
    borderRadius: radius.md,
    padding: 20,
    marginBottom: 13,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadow.sm,
  },

  // ✅ Selected — dark surface + rose gold border + glow
  // Was '#FFF9F8' light pink — now stays dark with rose gold accent
  cardSelected: {
    borderColor: colors.rose,
    backgroundColor: colors.cream3,    // #221F32 slightly lifted
    shadowColor: colors.rose,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },

  // Featured — gold top border
  cardFeatured: {
    borderTopWidth: 3,
    borderTopColor: colors.gold,
    paddingTop: 30,
  },

  // ── Featured badge ─────────────────────────────────────────
  featBadge: {
    position: 'absolute', top: 0, right: 16,
    backgroundColor: colors.gold,
    borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  // ✅ Dark text on gold badge — explicit, NOT colors.white (now dark surface)
  featBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 9,
    color: '#1C1628',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },

  // ── Check circle ───────────────────────────────────────────
  checkCircle: {
    position: 'absolute', top: 16, right: 16,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.rose,
    justifyContent: 'center', alignItems: 'center',
  },
  // ✅ Explicit warm white — NOT colors.white (now dark surface)
  checkText: { color: '#F2EDE8', fontSize: 13, fontFamily: fonts.bodySemiBold },

  // ── Card content ───────────────────────────────────────────
  cardTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.charcoal,     // #F2EDE8 warm white — correct on dark card
    marginBottom: 2,
    paddingRight: 32,
  },
  cardType: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.gray2,        // #7A7688 muted — readable on dark
    marginBottom: 8,
  },
  cardDesc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.gray,         // #9B99A8 — readable on dark
    lineHeight: 20,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.gold },
  popularText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.rose, marginBottom: 6 },
  sponsoredText: { fontFamily: fonts.body, fontSize: 10, color: colors.gray2, marginBottom: 4 },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray4,   // #2A2838 subtle dark divider
  },
});