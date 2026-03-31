export const ACTIVITIES = {
  Adventure: [
    { id: 'a1', name: 'Cliffs of Id Rock Climbing', type: 'Rock Climbing', desc: 'Indoor and outdoor walls for all skill levels. The adrenaline is half the fun.', rating: '4.9', dist: '2.1 mi', tag: 'Great for first dates', popular: true, featured: true },
    { id: 'a2', name: 'LA Ice Arena', type: 'Ice Skating', desc: 'Classic rink with mood lighting — hold hands, fall down, laugh a lot.', rating: '4.7', dist: '3.4 mi', tag: 'Fun and interactive' },
    { id: 'a3', name: 'Griffith Trail Walk', type: 'Hiking Trail', desc: 'Iconic trail with panoramic LA views. Best at golden hour.', rating: '4.8', dist: '5.2 mi', tag: 'Popular with couples' },
    { id: 'a4', name: 'Top Golf Hollywood', type: 'Golf Experience', desc: 'Three-level driving range with food service. No experience needed.', rating: '4.6', dist: '4.0 mi', tag: 'Relaxed and social', sponsored: true },
  ],
  Chill: [
    { id: 'a5', name: 'Echo Park Lake Walk', type: 'Park Walk', desc: 'Peaceful lakeside path with pedal boats and food trucks nearby.', rating: '4.7', dist: '2.8 mi', tag: 'Cozy and quiet', popular: true, featured: true },
    { id: 'a6', name: 'The Landmark Westwood', type: 'Movies', desc: 'Boutique cinema with plush seats and real food. A step above the multiplex.', rating: '4.8', dist: '1.5 mi', tag: 'Perfect for downtime' },
    { id: 'a7', name: 'Verve Coffee Roasters', type: 'Coffee Lounge', desc: 'Stylish coffee bar built for slow afternoons and good conversations.', rating: '4.6', dist: '0.9 mi', tag: 'Great for first dates' },
    { id: 'a8', name: 'The Last Bookstore', type: 'Bookstore', desc: "LA's most photographed bookstore — quirky, cozy, genuinely magical.", rating: '4.9', dist: '3.1 mi', tag: 'Unique and memorable' },
  ],
  Romantic: [
    { id: 'a9', name: 'Perch Rooftop Lounge', type: 'Rooftop Wine Bar', desc: 'Stunning downtown views with craft cocktails. Perfect sunset timing.', rating: '4.8', dist: '3.6 mi', tag: 'Romantic atmosphere', popular: true, featured: true },
    { id: 'a10', name: 'Griffith Observatory Overlook', type: 'Sunset Spot', desc: 'The most romantic view in LA. Time your visit for golden hour.', rating: '4.9', dist: '5.5 mi', tag: 'Perfect for anniversaries' },
    { id: 'a11', name: 'Blue Whale Jazz Club', type: 'Jazz Lounge', desc: 'Intimate live jazz with craft cocktails. Reservations recommended.', rating: '4.7', dist: '2.2 mi', tag: 'Cozy and quiet' },
    { id: 'a12', name: 'Bestia', type: 'Fine Dining', desc: 'Award-winning Italian in the Arts District. Reserve well in advance.', rating: '4.9', dist: '4.0 mi', tag: 'Special occasion dining', sponsored: true },
  ],
  Fun: [
    { id: 'a13', name: 'Two Bit Circus', type: 'Micro-Amusement Park', desc: 'Arcade games, VR, and escape rooms all in one wild venue.', rating: '4.7', dist: '3.3 mi', tag: 'Fun and interactive', popular: true, featured: true },
    { id: 'a14', name: 'Puttshack', type: 'Mini Golf', desc: 'Tech-infused mini golf with a cocktail bar. Competitive but hilarious.', rating: '4.8', dist: '2.0 mi', tag: 'Great for laughs' },
    { id: 'a15', name: 'Bowlero Hollywood', type: 'Bowling', desc: 'Upscale lanes with glow bowling and a full bar. Great energy on weekends.', rating: '4.5', dist: '4.5 mi', tag: 'Lively and energetic' },
    { id: 'a16', name: 'NoBar Karaoke', type: 'Karaoke', desc: 'Private rooms for 2–10 people. Bring your top 10 duets.', rating: '4.6', dist: '1.8 mi', tag: 'Unforgettable' },
  ],
  Luxury: [
    { id: 'a17', name: 'Nobu Malibu Dinner', type: 'Fine Dining', desc: 'Oceanfront Japanese cuisine at its finest. Reserve far in advance.', rating: '4.9', dist: '18 mi', tag: 'Splurge-worthy', featured: true },
    { id: 'a18', name: 'Beverly Wilshire Spa', type: 'Couples Spa', desc: 'World-class couples massage packages in a Five-Star setting.', rating: '4.8', dist: '8.1 mi', tag: 'Ultimate relaxation', popular: true },
    { id: 'a19', name: 'Helicopter Tour LA', type: 'Aerial Tour', desc: 'See the city from above at sunset. A truly unforgettable 30 minutes.', rating: '4.9', dist: '12 mi', tag: 'Once in a lifetime' },
  ],
  Outdoor: [
    { id: 'a20', name: 'Temescal Canyon Hike', type: 'Hike', desc: 'Moderate canyon trail with a seasonal waterfall and ocean views.', rating: '4.7', dist: '9 mi', tag: 'Popular with couples', featured: true },
    { id: 'a21', name: 'Malibu Beach Walk', type: 'Beach Walk', desc: 'Wind down at golden hour on the shore with a coffee in hand.', rating: '4.8', dist: '20 mi', tag: 'Most scenic', popular: true },
    { id: 'a22', name: 'Kenneth Hahn Park Picnic', type: 'Park Picnic', desc: 'Peaceful park perfect for a picnic and a slow afternoon together.', rating: '4.6', dist: '7 mi', tag: 'Cozy and quiet' },
  ],
};

export const RESTAURANTS = {
  Adventure: [
    { id: 'r1', name: 'Seoul Flame Korean BBQ', cuisine: 'Korean BBQ', desc: 'Cook your own at the table — active, fun, and perfect after a big day.', rating: '4.8', dist: '0.4 mi from activity', price: '$$', note: 'Perfect after an active date', featured: true },
    { id: 'r2', name: 'Guerrilla Tacos', cuisine: 'Mexican Street Food', desc: 'Award-winning inventive tacos. Always a conversation starter.', rating: '4.7', dist: '1.1 mi', price: '$', note: 'Casual and adventurous' },
    { id: 'r3', name: 'The Misfit Bar', cuisine: 'American', desc: 'Rustic burgers and craft beers in a buzzy Silver Lake spot.', rating: '4.5', dist: '2.3 mi', price: '$$', note: 'Laid-back and fun' },
  ],
  Chill: [
    { id: 'r4', name: 'Olive & Thyme Bistro', cuisine: 'European Café', desc: 'Airy café with seasonal boards and a great wine selection.', rating: '4.8', dist: '0.8 mi from activity', price: '$$', note: 'Cozy and romantic', featured: true },
    { id: 'r5', name: 'Sqirl', cuisine: 'Californian', desc: 'Cult-favorite brunch spot with incredible rice bowls and jam toasts.', rating: '4.7', dist: '1.5 mi', price: '$', note: 'Relaxed and wholesome' },
    { id: 'r6', name: 'Manuela', cuisine: 'Southern American', desc: 'Farm-to-table comfort food in the Arts District. Gorgeous space.', rating: '4.6', dist: '2.0 mi', price: '$$$', note: 'Perfect for a slow dinner' },
  ],
  Romantic: [
    { id: 'r7', name: 'Luna Rooftop Dining', cuisine: 'Mediterranean', desc: 'Elevated plates under the stars with a curated natural wine list.', rating: '4.9', dist: '0.6 mi from activity', price: '$$$', note: 'Most romantic in the city', featured: true },
    { id: 'r8', name: 'Saffron Grill', cuisine: 'Middle Eastern', desc: 'Warm, candlelit space with fragrant dishes and mezze for two.', rating: '4.8', dist: '1.2 mi', price: '$$', note: 'Intimate atmosphere' },
    { id: 'r9', name: "Here's Looking at You", cuisine: 'International', desc: "Creative, thoughtful cooking. One of LA's best date-night restaurants.", rating: '4.8', dist: '2.5 mi', price: '$$$', note: 'Exceptional for anniversaries' },
  ],
  Fun: [
    { id: 'r10', name: 'Shake Shack DTLA', cuisine: 'American', desc: 'Great burgers and shakes. Casual, fast, always satisfying.', rating: '4.5', dist: '0.5 mi from activity', price: '$', note: 'Perfect after games', featured: true },
    { id: 'r11', name: 'Republique', cuisine: 'French Bistro', desc: "Stunning space in a historic building. One of LA's best brunches.", rating: '4.8', dist: '3.1 mi', price: '$$$', note: 'Elevated and relaxed' },
    { id: 'r12', name: 'Bavel', cuisine: 'Middle Eastern', desc: 'James Beard-nominated sibling of Bestia. Outstanding cocktails.', rating: '4.9', dist: '2.8 mi', price: '$$$', note: 'Great for celebrating', sponsored: true },
  ],
  Luxury: [
    { id: 'r13', name: 'Providence', cuisine: 'Seafood', desc: "Two Michelin stars. LA's most celebrated restaurant.", rating: '5.0', dist: '6.2 mi', price: '$$$$', note: 'The best meal of your life', featured: true },
    { id: 'r14', name: 'Spago Beverly Hills', cuisine: 'Californian', desc: "Wolfgang Puck's iconic flagship. Celeb-spotting and legendary food.", rating: '4.9', dist: '4.1 mi', price: '$$$$', note: 'Classic LA luxury' },
  ],
  Outdoor: [
    { id: 'r15', name: 'Nobu Malibu', cuisine: 'Japanese', desc: 'Oceanside deck with sushi as the sun sets.', rating: '4.8', dist: '2.1 mi from trail', price: '$$$$', note: 'Perfect sunset dining', featured: true },
    { id: 'r16', name: "Neptune's Net", cuisine: 'Seafood', desc: 'Legendary PCH shack for fish & chips. Cash only, zero pretension.', rating: '4.6', dist: '3.5 mi', price: '$', note: 'Iconic California stop' },
  ],
};

export const ADDONS = {
  flowers: [
    { id: 'f1', name: 'Petal Lane Florist', desc: 'Romantic hand-tied arrangements ready for same-day pickup.', rating: '4.9', dist: '1.2 mi', note: "Couples' favorite", featured: true },
    { id: 'f2', name: 'Bloom Theory', desc: 'Modern studio arrangements. Instagram-worthy every time.', rating: '4.8', dist: '2.0 mi', note: 'Trendy and beautiful' },
    { id: 'f3', name: 'Rose & Stem', desc: 'Classic florist with seasonal bouquets starting at $18.', rating: '4.7', dist: '0.8 mi', note: 'Best value nearby' },
  ],
  dessert: [
    { id: 'd1', name: 'Bottega Louie', desc: 'Macarons, cakes, and gelato in a stunning marble-clad patisserie.', rating: '4.8', dist: '1.5 mi', note: 'Most romantic dessert spot', featured: true },
    { id: 'd2', name: 'Salt & Straw', desc: 'Cult craft ice cream with wild seasonal flavors.', rating: '4.9', dist: '2.1 mi', note: 'Always worth the wait' },
    { id: 'd3', name: 'Republique Pastry Bar', desc: 'Late-night pastry bar attached to the main restaurant.', rating: '4.7', dist: '3.0 mi', note: 'Sweet end to the night' },
  ],
  scenic: [
    { id: 's1', name: 'Griffith Observatory Overlook', desc: 'The most iconic view of the LA skyline. Free, open late.', rating: '4.9', dist: '5.5 mi', note: 'Best photo spot in LA', featured: true },
    { id: 's2', name: 'Santa Monica Pier Sunset', desc: 'Walk the pier at golden hour. Classic LA moment.', rating: '4.8', dist: '11 mi', note: 'Iconic and unforgettable' },
    { id: 's3', name: 'Echo Park Lake Walk', desc: 'Tranquil evening lakeside walk with skyline views.', rating: '4.7', dist: '2.8 mi', note: 'Quiet and romantic' },
  ],
};

export const CITY_SUGGESTIONS = [
  { main: 'Los Angeles', sub: 'California', icon: '🌴' },
  { main: 'New York City', sub: 'New York', icon: '🗽' },
  { main: 'San Francisco', sub: 'California', icon: '🌉' },
  { main: 'Chicago', sub: 'Illinois', icon: '🏙️' },
  { main: 'Miami', sub: 'Florida', icon: '🌊' },
  { main: 'Austin', sub: 'Texas', icon: '🤠' },
  { main: 'Seattle', sub: 'Washington', icon: '☁️' },
  { main: 'Denver', sub: 'Colorado', icon: '🏔️' },
  { main: 'Nashville', sub: 'Tennessee', icon: '🎸' },
  { main: 'Portland', sub: 'Oregon', icon: '🌲' },
  { main: 'San Diego', sub: 'California', icon: '☀️' },
  { main: 'Las Vegas', sub: 'Nevada', icon: '🎰' },
  { main: 'Boston', sub: 'Massachusetts', icon: '🦞' },
  { main: 'Atlanta', sub: 'Georgia', icon: '🍑' },
  { main: 'Dallas', sub: 'Texas', icon: '⭐' },
  { main: 'New Orleans', sub: 'Louisiana', icon: '🎺' },
  { main: 'Santa Monica', sub: 'California', icon: '🎡' },
  { main: 'Beverly Hills', sub: 'California', icon: '💎' },
  { main: 'Malibu', sub: 'California', icon: '🌊' },
  { main: 'Silver Lake', sub: 'Los Angeles, CA', icon: '✨' },
];

export const SAMPLE_SAVED_PLANS = [
  { id: 'sp1', title: 'Griffith Adventure Date', dateDisplay: 'March 15, 2025', city: 'Los Angeles, CA', vibe: 'Adventure', items: ['🏔️ Rock Climbing at Cliffs of Id', '🍖 Seoul Flame Korean BBQ', '💐 Flowers from Petal Lane'], favorite: true },
  { id: 'sp2', title: 'Chill Sunday Vibes', dateDisplay: 'February 10, 2025', city: 'Los Angeles, CA', vibe: 'Chill', items: ['☕ The Last Bookstore', '🥗 Olive & Thyme Bistro'], favorite: false },
  { id: 'sp3', title: 'Romantic Rooftop Night', dateDisplay: 'January 5, 2025', city: 'Los Angeles, CA', vibe: 'Romantic', items: ['🌹 Perch Rooftop Lounge', '🍷 Luna Rooftop Dining', '🍰 Bottega Louie'], favorite: true },
];

export const VIBES = [
  { id: 'Adventure', emoji: '🏔️', desc: 'Active, exciting, and bold' },
  { id: 'Chill',     emoji: '☕', desc: 'Slow, cozy, and easy' },
  { id: 'Romantic',  emoji: '🌹', desc: 'Dreamy, intimate, and special' },
  { id: 'Fun',       emoji: '🎉', desc: 'Playful, loud, and joyful' },
  { id: 'Luxury',    emoji: '✨', desc: 'Premium, elevated, indulgent' },
  { id: 'Outdoor',   emoji: '🌿', desc: 'Fresh air, nature, views' },
];