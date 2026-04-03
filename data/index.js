// ─────────────────────────────────────────────────────────────
// PLANNIE — Structured Data by Vibe + Budget
// ─────────────────────────────────────────────────────────────

export const PLAN_DATA = {
  Adventure: {
    $: {
      activities: [
        { id: 'adv-b1-a1', name: 'Griffith Trail Walk', type: 'Hiking Trail', desc: 'Iconic trail with panoramic LA views. Best at golden hour — free and breathtaking.', rating: '4.8', dist: '5.2 mi', tag: 'Popular with couples', popular: true },
        { id: 'adv-b1-a2', name: 'Echo Park Lake Walk', type: 'Park Walk', desc: 'Peaceful lakeside loop with pedal boats and food trucks nearby.', rating: '4.7', dist: '2.8 mi', tag: 'Cozy and scenic' },
        { id: 'adv-b1-a3', name: 'Runyon Canyon Hike', type: 'Hike', desc: 'Popular Hollywood Hills trail with stunning city views and a great workout.', rating: '4.6', dist: '4.1 mi', tag: 'Great for active couples' },
        { id: 'adv-b1-a4', name: 'Kenneth Hahn Park Picnic', type: 'Outdoor Picnic', desc: 'Peaceful park with rolling hills — bring a blanket and snacks.', rating: '4.6', dist: '7.0 mi', tag: 'Relaxed and free' },
      ],
      restaurants: [
        { id: 'adv-b1-r1', name: 'Guerrilla Tacos', cuisine: 'Mexican Street Food', desc: 'Award-winning inventive tacos. Casual, fast, and always a conversation starter.', rating: '4.7', dist: '1.1 mi', price: '$', note: 'Casual and adventurous' },
        { id: 'adv-b1-r2', name: "In-N-Out Burger", cuisine: 'American Fast Food', desc: 'The classic California burger experience. Simple, delicious, and iconic.', rating: '4.6', dist: '0.8 mi', price: '$', note: 'Quick and satisfying' },
        { id: 'adv-b1-r3', name: 'Guisados', cuisine: 'Mexican Tacos', desc: 'Braised meat tacos made fresh daily. A local favorite with huge portions.', rating: '4.8', dist: '2.0 mi', price: '$', note: 'Local gem' },
      ],
      addons: [
        { id: 'adv-b1-ad1', name: 'Rose & Stem', type: 'flowers', desc: 'Classic florist with seasonal bouquets starting at $18.', rating: '4.7', dist: '0.8 mi', note: 'Best value nearby' },
        { id: 'adv-b1-ad2', name: 'Salt & Straw', type: 'dessert', desc: 'Cult craft ice cream with wild seasonal flavors — always worth it.', rating: '4.9', dist: '2.1 mi', note: 'Always worth the wait' },
        { id: 'adv-b1-ad3', name: 'Echo Park Lake Walk', type: 'scenic', desc: 'Tranquil evening lakeside stroll with skyline views.', rating: '4.7', dist: '2.8 mi', note: 'Quiet and romantic' },
      ],
    },
    $$: {
      activities: [
        { id: 'adv-b2-a1', name: 'Cliffs of Id Rock Climbing', type: 'Rock Climbing', desc: 'Indoor and outdoor walls for all skill levels. The adrenaline is half the fun.', rating: '4.9', dist: '2.1 mi', tag: 'Great for first dates', popular: true, featured: true },
        { id: 'adv-b2-a2', name: 'LA Ice Arena', type: 'Ice Skating', desc: 'Classic rink with mood lighting — hold hands, fall down, laugh a lot.', rating: '4.7', dist: '3.4 mi', tag: 'Fun and interactive' },
        { id: 'adv-b2-a3', name: 'Top Golf Hollywood', type: 'Golf Experience', desc: 'Three-level driving range with food service. No experience needed.', rating: '4.6', dist: '4.0 mi', tag: 'Relaxed and social' },
        { id: 'adv-b2-a4', name: 'Malibu Beach ATV Ride', type: 'ATV / Off-Road', desc: 'Guided ATV experience through scenic Malibu terrain. Thrilling and memorable.', rating: '4.8', dist: '18 mi', tag: 'Unforgettable adventure' },
        { id: 'adv-b2-a5', name: 'Axe Throwing LA', type: 'Axe Throwing', desc: 'Guided axe throwing lanes with coaching. Surprisingly addictive.', rating: '4.7', dist: '3.5 mi', tag: 'Unique and exciting' },
      ],
      restaurants: [
        { id: 'adv-b2-r1', name: 'Seoul Flame Korean BBQ', cuisine: 'Korean BBQ', desc: 'Cook your own at the table — active, fun, and perfect after a big day.', rating: '4.8', dist: '0.4 mi', price: '$$', note: 'Perfect after an active date', featured: true },
        { id: 'adv-b2-r2', name: 'The Misfit Bar', cuisine: 'American', desc: 'Rustic burgers and craft beers in a buzzy Silver Lake spot.', rating: '4.5', dist: '2.3 mi', price: '$$', note: 'Laid-back and fun' },
        { id: 'adv-b2-r3', name: 'Pitfire Artisan Pizza', cuisine: 'Pizza', desc: 'Wood-fired pizza with seasonal toppings in a lively, casual setting.', rating: '4.6', dist: '1.8 mi', price: '$$', note: 'Great after an active date' },
      ],
      addons: [
        { id: 'adv-b2-ad1', name: 'Bloom Theory', type: 'flowers', desc: 'Modern studio arrangements. Instagram-worthy every time.', rating: '4.8', dist: '2.0 mi', note: 'Trendy and beautiful' },
        { id: 'adv-b2-ad2', name: 'Bottega Louie', type: 'dessert', desc: 'Macarons, cakes, and gelato in a stunning marble-clad patisserie.', rating: '4.8', dist: '1.5 mi', note: 'Most romantic dessert spot', featured: true },
        { id: 'adv-b2-ad3', name: 'Griffith Observatory Overlook', type: 'scenic', desc: 'The most iconic view of the LA skyline. Free, open late.', rating: '4.9', dist: '5.5 mi', note: 'Best photo spot in LA', featured: true },
      ],
    },
    $$$: {
      activities: [
        { id: 'adv-b3-a1', name: 'Helicopter Tour LA', type: 'Aerial Tour', desc: 'See the city from above at sunset. A truly unforgettable 30 minutes.', rating: '4.9', dist: '12 mi', tag: 'Once in a lifetime', featured: true },
        { id: 'adv-b3-a2', name: 'Deep Sea Fishing Charter', type: 'Fishing Charter', desc: 'Private charter boat for two — reel in something big off the LA coast.', rating: '4.7', dist: '8 mi', tag: 'Adventurous and exclusive' },
        { id: 'adv-b3-a3', name: 'Skydiving Elsinore', type: 'Skydiving', desc: 'Tandem skydiving with stunning views over Southern California.', rating: '4.9', dist: '60 mi', tag: 'The ultimate rush' },
        { id: 'adv-b3-a4', name: 'Hot Air Balloon Temecula', type: 'Hot Air Balloon', desc: 'Float over wine country at sunrise. Champagne included.', rating: '4.9', dist: '80 mi', tag: 'Romantic and breathtaking' },
      ],
      restaurants: [
        { id: 'adv-b3-r1', name: 'Nobu Malibu', cuisine: 'Japanese', desc: 'Oceanside deck with world-class sushi as the sun sets.', rating: '4.8', dist: '18 mi', price: '$$$', note: 'Perfect sunset dining', featured: true },
        { id: 'adv-b3-r2', name: 'Mastros Ocean Club', cuisine: 'Steakhouse', desc: 'Upscale steakhouse with live music and ocean views in Malibu.', rating: '4.8', dist: '20 mi', price: '$$$', note: 'Celebratory and luxurious' },
      ],
      addons: [
        { id: 'adv-b3-ad1', name: 'Petal Lane Florist', type: 'flowers', desc: 'Romantic hand-tied premium arrangements, same-day pickup.', rating: '4.9', dist: '1.2 mi', note: "Couples' favorite", featured: true },
        { id: 'adv-b3-ad2', name: 'Republique Pastry Bar', type: 'dessert', desc: 'Late-night pastry bar with exquisite desserts.', rating: '4.7', dist: '3.0 mi', note: 'Sweet end to an epic night' },
        { id: 'adv-b3-ad3', name: 'Santa Monica Pier Sunset', type: 'scenic', desc: 'Walk the pier at golden hour. The classic LA moment.', rating: '4.8', dist: '11 mi', note: 'Iconic and unforgettable' },
      ],
    },
  },

  Chill: {
    $: {
      activities: [
        { id: 'chl-b1-a1', name: 'The Last Bookstore', type: 'Bookstore Date', desc: "LA's most photographed bookstore — quirky, cozy, and genuinely magical.", rating: '4.9', dist: '3.1 mi', tag: 'Unique and memorable', featured: true },
        { id: 'chl-b1-a2', name: 'Verve Coffee Roasters', type: 'Coffee Shop', desc: 'Stylish coffee bar built for slow afternoons and great conversation.', rating: '4.6', dist: '0.9 mi', tag: 'Great for first dates' },
        { id: 'chl-b1-a3', name: 'Echo Park Lake Walk', type: 'Park Walk', desc: 'Peaceful lakeside loop — grab coffee and stroll at your own pace.', rating: '4.7', dist: '2.8 mi', tag: 'Cozy and quiet', popular: true },
        { id: 'chl-b1-a4', name: 'Venice Beach Boardwalk', type: 'Beach Walk', desc: 'Walk the iconic boardwalk, watch street performers, soak in the vibe.', rating: '4.5', dist: '9 mi', tag: 'Classic LA experience' },
        { id: 'chl-b1-a5', name: 'Grand Central Market Browse', type: 'Food Market', desc: 'Historic market with dozens of stalls — explore, taste, and wander.', rating: '4.7', dist: '3.5 mi', tag: 'Relaxed and delicious' },
      ],
      restaurants: [
        { id: 'chl-b1-r1', name: 'Sqirl', cuisine: 'Californian', desc: 'Cult-favorite brunch with incredible rice bowls and jam toasts.', rating: '4.7', dist: '1.5 mi', price: '$', note: 'Relaxed and wholesome' },
        { id: 'chl-b1-r2', name: 'Eggslut', cuisine: 'Breakfast / Brunch', desc: 'Famous egg sandwiches in Grand Central Market. Lines are worth it.', rating: '4.6', dist: '3.5 mi', price: '$', note: 'Casual and iconic' },
        { id: 'chl-b1-r3', name: 'Cofax Coffee', cuisine: 'Coffee & Donuts', desc: 'Exceptional coffee and fresh donuts. The perfect chill morning.', rating: '4.7', dist: '2.0 mi', price: '$', note: 'Slow morning vibes' },
      ],
      addons: [
        { id: 'chl-b1-ad1', name: 'Rose & Stem', type: 'flowers', desc: 'Affordable seasonal bouquets — a small gesture that means a lot.', rating: '4.7', dist: '0.8 mi', note: 'Best value nearby' },
        { id: 'chl-b1-ad2', name: 'Salt & Straw', type: 'dessert', desc: 'Cult craft ice cream with wild seasonal flavors.', rating: '4.9', dist: '2.1 mi', note: 'Always worth the wait' },
        { id: 'chl-b1-ad3', name: 'Echo Park Lake Walk', type: 'scenic', desc: 'Tranquil evening lakeside walk with skyline views.', rating: '4.7', dist: '2.8 mi', note: 'Quiet and romantic' },
      ],
    },
    $$: {
      activities: [
        { id: 'chl-b2-a1', name: 'The Landmark Westwood', type: 'Cinema', desc: 'Boutique cinema with plush seats and real food. A step above the multiplex.', rating: '4.8', dist: '1.5 mi', tag: 'Perfect for downtime', featured: true },
        { id: 'chl-b2-a2', name: 'Soho House Screening Room', type: 'Cinema Lounge', desc: 'Private cinema experience with cocktails and a curated film selection.', rating: '4.7', dist: '2.0 mi', tag: 'Elevated and intimate' },
        { id: 'chl-b2-a3', name: 'Malibu Beach Walk', type: 'Beach Walk', desc: 'Wind down at golden hour on the shore with a coffee in hand.', rating: '4.8', dist: '20 mi', tag: 'Most scenic', popular: true },
        { id: 'chl-b2-a4', name: 'Spa Day at Burke Williams', type: 'Spa', desc: 'Couples massage and relaxation packages in a serene day spa setting.', rating: '4.7', dist: '3.0 mi', tag: 'Ultimate relaxation' },
        { id: 'chl-b2-a5', name: 'The Hollywood Bowl Picnic', type: 'Outdoor Concert', desc: 'Bring wine and cheese, watch a performance under the stars.', rating: '4.9', dist: '4.5 mi', tag: 'Romantic and memorable' },
      ],
      restaurants: [
        { id: 'chl-b2-r1', name: 'Olive & Thyme Bistro', cuisine: 'European Café', desc: 'Airy café with seasonal boards and a great wine selection.', rating: '4.8', dist: '0.8 mi', price: '$$', note: 'Cozy and romantic', featured: true },
        { id: 'chl-b2-r2', name: 'Manuela', cuisine: 'Southern American', desc: 'Farm-to-table comfort food in the Arts District. Gorgeous space.', rating: '4.6', dist: '2.0 mi', price: '$$', note: 'Perfect for a slow dinner' },
        { id: 'chl-b2-r3', name: 'Gjusta', cuisine: 'Californian Bakery', desc: 'Venice institution with exceptional pastries, salads, and sandwiches.', rating: '4.8', dist: '8 mi', price: '$$', note: 'Laid-back and delicious' },
      ],
      addons: [
        { id: 'chl-b2-ad1', name: 'Bloom Theory', type: 'flowers', desc: 'Modern studio arrangements. Instagram-worthy every time.', rating: '4.8', dist: '2.0 mi', note: 'Trendy and beautiful' },
        { id: 'chl-b2-ad2', name: 'Bottega Louie', type: 'dessert', desc: 'Macarons, cakes, and gelato in a stunning marble-clad patisserie.', rating: '4.8', dist: '1.5 mi', note: 'Most romantic dessert spot', featured: true },
        { id: 'chl-b2-ad3', name: 'Santa Monica Pier Sunset', type: 'scenic', desc: 'Walk the pier at golden hour. The classic LA moment.', rating: '4.8', dist: '11 mi', note: 'Iconic and unforgettable' },
      ],
    },
    $$$: {
      activities: [
        { id: 'chl-b3-a1', name: 'Shutters on the Beach Lounge', type: 'Hotel Lounge', desc: "Relax in Santa Monica's most iconic beachfront hotel with cocktails and ocean views.", rating: '4.8', dist: '9 mi', tag: 'Luxurious and relaxing', featured: true },
        { id: 'chl-b3-a2', name: 'Chateau Marmont Terrace', type: 'Hotel Bar', desc: 'Iconic Hollywood hotel terrace. Order cocktails and watch the world go by.', rating: '4.7', dist: '3.5 mi', tag: 'Legendary atmosphere' },
        { id: 'chl-b3-a3', name: 'Beverly Wilshire Spa', type: 'Couples Spa', desc: 'World-class couples massage packages in a Five-Star setting.', rating: '4.8', dist: '8.1 mi', tag: 'Ultimate relaxation', popular: true },
        { id: 'chl-b3-a4', name: 'Ace Hotel Rooftop Pool', type: 'Rooftop Lounge', desc: 'Rooftop pool and bar in downtown LA. Laid-back luxury at its finest.', rating: '4.6', dist: '4.0 mi', tag: 'Cool and relaxed' },
      ],
      restaurants: [
        { id: 'chl-b3-r1', name: 'n/naka', cuisine: 'Japanese Kaiseki', desc: 'Michelin-starred kaiseki experience. One of the most special dinners in LA.', rating: '4.9', dist: '5.0 mi', price: '$$$', note: 'Unforgettable dining', featured: true },
        { id: 'chl-b3-r2', name: 'Catch LA', cuisine: 'Seafood', desc: 'Rooftop seafood restaurant in West Hollywood with incredible views.', rating: '4.7', dist: '3.2 mi', price: '$$$', note: 'Stunning and delicious' },
      ],
      addons: [
        { id: 'chl-b3-ad1', name: 'Petal Lane Florist', type: 'flowers', desc: 'Premium hand-tied arrangements — delivered or ready for pickup.', rating: '4.9', dist: '1.2 mi', note: "Couples' favorite", featured: true },
        { id: 'chl-b3-ad2', name: 'Republique Pastry Bar', type: 'dessert', desc: 'Late-night pastry bar with exceptional French-inspired desserts.', rating: '4.7', dist: '3.0 mi', note: 'Sweet and sophisticated' },
        { id: 'chl-b3-ad3', name: 'Griffith Observatory Overlook', type: 'scenic', desc: 'Most iconic LA view. Perfect way to end a perfect day.', rating: '4.9', dist: '5.5 mi', note: 'Best view in LA', featured: true },
      ],
    },
  },

  Romantic: {
    $: {
      activities: [
        { id: 'rom-b1-a1', name: 'Griffith Observatory Overlook', type: 'Sunset Spot', desc: 'The most romantic free view in LA. Time your visit for golden hour.', rating: '4.9', dist: '5.5 mi', tag: 'Perfect for anniversaries', featured: true },
        { id: 'rom-b1-a2', name: 'Santa Monica Sunset Walk', type: 'Beach Walk', desc: 'Walk the pier and beach as the sun dips into the Pacific.', rating: '4.8', dist: '11 mi', tag: 'Iconic and romantic', popular: true },
        { id: 'rom-b1-a3', name: 'Echo Park Lake Picnic', type: 'Picnic', desc: 'Spread a blanket, bring snacks, and enjoy the peaceful lakeside views.', rating: '4.7', dist: '2.8 mi', tag: 'Sweet and simple' },
        { id: 'rom-b1-a4', name: 'Runyon Canyon Sunset Hike', type: 'Sunset Hike', desc: 'Time the hike to reach the top at golden hour for city views.', rating: '4.6', dist: '4.1 mi', tag: 'Romantic and active' },
      ],
      restaurants: [
        { id: 'rom-b1-r1', name: 'Saffron Grill', cuisine: 'Middle Eastern', desc: 'Warm, candlelit space with fragrant dishes and mezze for two.', rating: '4.8', dist: '1.2 mi', price: '$', note: 'Intimate atmosphere' },
        { id: 'rom-b1-r2', name: 'Guisados', cuisine: 'Mexican', desc: 'Braised meat tacos by candlelight at the outdoor patio.', rating: '4.8', dist: '2.0 mi', price: '$', note: 'Cozy and delicious' },
        { id: 'rom-b1-r3', name: 'Cofax Wine Bar Night', cuisine: 'Wine & Snacks', desc: 'Low-key wine bar with great natural wines and small plates.', rating: '4.6', dist: '2.5 mi', price: '$', note: 'Perfect for conversation' },
      ],
      addons: [
        { id: 'rom-b1-ad1', name: 'Rose & Stem', type: 'flowers', desc: 'Simple, beautiful bouquets starting at $18. She will love it.', rating: '4.7', dist: '0.8 mi', note: 'Best value nearby' },
        { id: 'rom-b1-ad2', name: 'Salt & Straw', type: 'dessert', desc: 'Share a scoop of something unexpected and delicious.', rating: '4.9', dist: '2.1 mi', note: 'Always worth the wait' },
        { id: 'rom-b1-ad3', name: 'Griffith Observatory Overlook', type: 'scenic', desc: 'End the night under the stars with the city below you.', rating: '4.9', dist: '5.5 mi', note: 'Most romantic view in LA', featured: true },
      ],
    },
    $$: {
      activities: [
        { id: 'rom-b2-a1', name: 'Perch Rooftop Lounge', type: 'Rooftop Wine Bar', desc: 'Stunning downtown views with craft cocktails. Perfect sunset timing.', rating: '4.8', dist: '3.6 mi', tag: 'Romantic atmosphere', popular: true, featured: true },
        { id: 'rom-b2-a2', name: 'Blue Whale Jazz Club', type: 'Jazz Lounge', desc: 'Intimate live jazz with craft cocktails. Reservations recommended.', rating: '4.7', dist: '2.2 mi', tag: 'Cozy and soulful' },
        { id: 'rom-b2-a3', name: 'The Edison Cocktail Bar', type: 'Cocktail Bar', desc: 'Underground vintage power plant turned atmospheric cocktail bar.', rating: '4.7', dist: '3.0 mi', tag: 'Unique and moody' },
        { id: 'rom-b2-a4', name: 'Descanso Gardens Night Walk', type: 'Garden Walk', desc: 'Beautiful botanical garden with enchanted forest lighting events.', rating: '4.8', dist: '12 mi', tag: 'Magical and romantic' },
        { id: 'rom-b2-a5', name: 'Wine Tasting at Malibu Winery', type: 'Wine Tasting', desc: 'Vineyard tasting room with gorgeous views and flights of local wines.', rating: '4.7', dist: '25 mi', tag: 'Scenic and indulgent' },
      ],
      restaurants: [
        { id: 'rom-b2-r1', name: "Here's Looking at You", cuisine: 'International', desc: "Creative, thoughtful cooking. One of LA's best date-night restaurants.", rating: '4.8', dist: '2.5 mi', price: '$$', note: 'Exceptional for anniversaries', featured: true },
        { id: 'rom-b2-r2', name: 'Bestia', cuisine: 'Italian', desc: 'Award-winning Italian in the Arts District. Reserve well in advance.', rating: '4.9', dist: '4.0 mi', price: '$$', note: 'Special occasion dining' },
        { id: 'rom-b2-r3', name: 'Tesse', cuisine: 'French', desc: 'Elegant French brasserie on Sunset Strip with excellent wine list.', rating: '4.7', dist: '3.5 mi', price: '$$', note: 'Sophisticated and romantic' },
      ],
      addons: [
        { id: 'rom-b2-ad1', name: 'Bloom Theory', type: 'flowers', desc: 'Stunning modern arrangements for the person who deserves the best.', rating: '4.8', dist: '2.0 mi', note: 'Trendy and beautiful' },
        { id: 'rom-b2-ad2', name: 'Bottega Louie', type: 'dessert', desc: 'Macarons, cakes, and gelato in a stunning marble-clad patisserie.', rating: '4.8', dist: '1.5 mi', note: 'Most romantic dessert spot', featured: true },
        { id: 'rom-b2-ad3', name: 'Santa Monica Pier Sunset', type: 'scenic', desc: 'Walk the pier as the sun sets. Timeless and beautiful.', rating: '4.8', dist: '11 mi', note: 'Iconic golden hour spot' },
      ],
    },
    $$$: {
      activities: [
        { id: 'rom-b3-a1', name: 'Hotel Stay at Shutters on the Beach', type: 'Hotel Stay', desc: "A night at Santa Monica's most romantic beachfront boutique hotel.", rating: '4.9', dist: '9 mi', tag: 'The ultimate romantic getaway', featured: true },
        { id: 'rom-b3-a2', name: 'Sunset Yacht Charter', type: 'Yacht Charter', desc: 'Private 2-hour sunset cruise along the LA coastline. Champagne included.', rating: '4.9', dist: '10 mi', tag: 'Once in a lifetime', popular: true },
        { id: 'rom-b3-a3', name: 'Nobu Malibu Dinner & Sunset', type: 'Fine Dining + Sunset', desc: 'Book a sunset table at Nobu Malibu — sushi, ocean views, pure romance.', rating: '4.9', dist: '18 mi', tag: 'The most romantic evening in LA' },
        { id: 'rom-b3-a4', name: 'Hot Air Balloon Temecula', type: 'Hot Air Balloon', desc: 'Float over wine country at sunrise with champagne toast at landing.', rating: '4.9', dist: '80 mi', tag: 'Unforgettable and breathtaking' },
      ],
      restaurants: [
        { id: 'rom-b3-r1', name: 'Luna Rooftop Dining', cuisine: 'Mediterranean', desc: 'Elevated plates under the stars with a curated natural wine list.', rating: '4.9', dist: '0.6 mi', price: '$$$', note: 'Most romantic in the city', featured: true },
        { id: 'rom-b3-r2', name: 'Providence', cuisine: 'Seafood', desc: "Two Michelin stars. LA's most celebrated fine dining experience.", rating: '5.0', dist: '6.2 mi', price: '$$$', note: 'The best meal of your life' },
        { id: 'rom-b3-r3', name: 'Spago Beverly Hills', cuisine: 'Californian', desc: "Wolfgang Puck's iconic flagship. Legendary food in an elegant setting.", rating: '4.9', dist: '4.1 mi', price: '$$$', note: 'Classic LA luxury' },
      ],
      addons: [
        { id: 'rom-b3-ad1', name: 'Petal Lane Florist', type: 'flowers', desc: 'Premium hand-tied arrangements — the kind that take her breath away.', rating: '4.9', dist: '1.2 mi', note: "Couples' favorite", featured: true },
        { id: 'rom-b3-ad2', name: 'Bottega Louie Private Cake', type: 'dessert', desc: 'Order a custom celebration cake or dessert board for the occasion.', rating: '4.8', dist: '1.5 mi', note: 'Make it extra special' },
        { id: 'rom-b3-ad3', name: 'Griffith Observatory Night', type: 'scenic', desc: 'End the evening stargazing from the most romantic viewpoint in LA.', rating: '4.9', dist: '5.5 mi', note: 'Stars above, city below', featured: true },
      ],
    },
  },

  Fun: {
    $: {
      activities: [
        { id: 'fun-b1-a1', name: 'NoBar Karaoke', type: 'Karaoke', desc: 'Private karaoke rooms for 2–10 people. Bring your top 10 duets.', rating: '4.6', dist: '1.8 mi', tag: 'Unforgettable', featured: true },
        { id: 'fun-b1-a2', name: 'Dave & Busters Arcade', type: 'Arcade', desc: 'Classic arcade games, skee-ball, and competitive fun for hours.', rating: '4.4', dist: '3.0 mi', tag: 'Fun and competitive' },
        { id: 'fun-b1-a3', name: 'Venice Beach Volleyball', type: 'Beach Sports', desc: 'Join a pickup game or rent a court on iconic Venice Beach.', rating: '4.5', dist: '9 mi', tag: 'Active and social' },
        { id: 'fun-b1-a4', name: 'Grand Central Market Food Tour', type: 'Food Tour', desc: 'Self-guided food adventure through LA\'s most vibrant market.', rating: '4.7', dist: '3.5 mi', tag: 'Delicious and fun' },
      ],
      restaurants: [
        { id: 'fun-b1-r1', name: 'Shake Shack DTLA', cuisine: 'American', desc: 'Great burgers and shakes. Casual, fast, always satisfying.', rating: '4.5', dist: '0.5 mi', price: '$', note: 'Perfect after games', featured: true },
        { id: 'fun-b1-r2', name: 'Howlin\' Rays', cuisine: 'Nashville Hot Chicken', desc: 'Legendary hot chicken with serious heat levels. Bring napkins.', rating: '4.8', dist: '4.0 mi', price: '$', note: 'Spicy and fun' },
        { id: 'fun-b1-r3', name: 'Guerrilla Tacos', cuisine: 'Mexican', desc: 'Award-winning inventive tacos. Always a conversation starter.', rating: '4.7', dist: '1.1 mi', price: '$', note: 'Casual and delicious' },
      ],
      addons: [
        { id: 'fun-b1-ad1', name: 'Rose & Stem', type: 'flowers', desc: 'A fun, cheerful bouquet to surprise them at the end of the night.', rating: '4.7', dist: '0.8 mi', note: 'Best value nearby' },
        { id: 'fun-b1-ad2', name: 'Salt & Straw', type: 'dessert', desc: 'Wild flavors and long lines — the perfect fun ending.', rating: '4.9', dist: '2.1 mi', note: 'Always worth the wait' },
        { id: 'fun-b1-ad3', name: 'Echo Park Lake Walk', type: 'scenic', desc: 'Wind down with a relaxed lakeside walk after all the excitement.', rating: '4.7', dist: '2.8 mi', note: 'Chill end to a fun night' },
      ],
    },
    $$: {
      activities: [
        { id: 'fun-b2-a1', name: 'Two Bit Circus', type: 'Micro-Amusement Park', desc: 'Arcade games, VR, and escape rooms all in one wild venue.', rating: '4.7', dist: '3.3 mi', tag: 'Fun and interactive', popular: true, featured: true },
        { id: 'fun-b2-a2', name: 'Puttshack', type: 'Mini Golf', desc: 'Tech-infused mini golf with a cocktail bar. Competitive but hilarious.', rating: '4.8', dist: '2.0 mi', tag: 'Great for laughs' },
        { id: 'fun-b2-a3', name: 'Bowlero Hollywood', type: 'Bowling', desc: 'Upscale lanes with glow bowling and a full bar. Great energy.', rating: '4.5', dist: '4.5 mi', tag: 'Lively and energetic' },
        { id: 'fun-b2-a4', name: 'Top Golf Hollywood', type: 'Golf', desc: 'Three-level driving range with drinks, food, and non-stop fun.', rating: '4.6', dist: '4.0 mi', tag: 'Competitive and social' },
        { id: 'fun-b2-a5', name: 'The Void VR Experience', type: 'Virtual Reality', desc: 'Full-body VR adventures that feel completely real. Mind-blowing.', rating: '4.7', dist: '5.0 mi', tag: 'Unique and exciting' },
      ],
      restaurants: [
        { id: 'fun-b2-r1', name: 'Republique', cuisine: 'French Bistro', desc: "Stunning space in a historic building. One of LA's best brunches.", rating: '4.8', dist: '3.1 mi', price: '$$', note: 'Elevated and relaxed' },
        { id: 'fun-b2-r2', name: 'Seoul Flame Korean BBQ', cuisine: 'Korean BBQ', desc: 'Cook your own at the table — active, fun, and social.', rating: '4.8', dist: '0.4 mi', price: '$$', note: 'Fun group-style dining' },
        { id: 'fun-b2-r3', name: 'Bavel', cuisine: 'Middle Eastern', desc: 'James Beard-nominated with outstanding cocktails and vibrant energy.', rating: '4.9', dist: '2.8 mi', price: '$$', note: 'Great for celebrating', sponsored: true },
      ],
      addons: [
        { id: 'fun-b2-ad1', name: 'Bloom Theory', type: 'flowers', desc: 'Fun, playful arrangements to surprise your date.', rating: '4.8', dist: '2.0 mi', note: 'Trendy and beautiful' },
        { id: 'fun-b2-ad2', name: 'Bottega Louie', type: 'dessert', desc: 'Macarons and gelato — the perfect sweet finale to a great night.', rating: '4.8', dist: '1.5 mi', note: 'Fun and indulgent', featured: true },
        { id: 'fun-b2-ad3', name: 'Griffith Observatory Overlook', type: 'scenic', desc: 'End the night with the best view in LA — free and stunning.', rating: '4.9', dist: '5.5 mi', note: 'Perfect way to wind down', featured: true },
      ],
    },
    $$$: {
      activities: [
        { id: 'fun-b3-a1', name: 'Racing Experience at Willow Springs', type: 'Race Track', desc: 'Drive a real race car on a real track with professional coaching.', rating: '4.9', dist: '60 mi', tag: 'The ultimate rush', featured: true },
        { id: 'fun-b3-a2', name: 'Private Escape Room Experience', type: 'Escape Room', desc: 'Book a private room at an upscale escape room venue — just the two of you.', rating: '4.7', dist: '3.0 mi', tag: 'Exciting and exclusive' },
        { id: 'fun-b3-a3', name: 'Topgolf VIP Suite', type: 'Golf + Dining', desc: 'Private suite at Topgolf with personal server, gourmet food, and games.', rating: '4.8', dist: '4.0 mi', tag: 'Luxury fun experience', popular: true },
        { id: 'fun-b3-a4', name: 'Gun Range + Instruction', type: 'Gun Range', desc: 'Professional shooting range with private instructor for two. Surprisingly fun.', rating: '4.6', dist: '8 mi', tag: 'Unique and memorable' },
      ],
      restaurants: [
        { id: 'fun-b3-r1', name: 'Craig\'s', cuisine: 'American', desc: "The Hollywood spot to see and be seen. Great food, amazing energy.", rating: '4.7', dist: '3.5 mi', price: '$$$', note: 'Buzzy and celebratory', featured: true },
        { id: 'fun-b3-r2', name: 'Catch LA Rooftop', cuisine: 'Seafood', desc: 'Rooftop restaurant with DJ, great food, and incredible West Hollywood views.', rating: '4.7', dist: '3.2 mi', price: '$$$', note: 'Vibrant and memorable' },
      ],
      addons: [
        { id: 'fun-b3-ad1', name: 'Petal Lane Florist', type: 'flowers', desc: 'Premium arrangements to make the night even more memorable.', rating: '4.9', dist: '1.2 mi', note: "Couples' favorite", featured: true },
        { id: 'fun-b3-ad2', name: 'Republique Pastry Bar', type: 'dessert', desc: 'Late-night pastries and desserts to cap off an epic night.', rating: '4.7', dist: '3.0 mi', note: 'Sweet and spectacular' },
        { id: 'fun-b3-ad3', name: 'Santa Monica Pier Sunset', type: 'scenic', desc: 'End the night at the pier — games, views, and good vibes.', rating: '4.8', dist: '11 mi', note: 'Fun right to the end' },
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────
// LEGACY FLAT EXPORTS (used by manual selection screens)
// ─────────────────────────────────────────────────────────────

export const ACTIVITIES = {
  Adventure: PLAN_DATA.Adventure.$$.activities,
  Chill: PLAN_DATA.Chill.$$.activities,
  Romantic: PLAN_DATA.Romantic.$$.activities,
  Fun: PLAN_DATA.Fun.$$.activities,
};

export const RESTAURANTS = {
  Adventure: PLAN_DATA.Adventure.$$.restaurants,
  Chill: PLAN_DATA.Chill.$$.restaurants,
  Romantic: PLAN_DATA.Romantic.$$.restaurants,
  Fun: PLAN_DATA.Fun.$$.restaurants,
};

export const ADDONS = {
  flowers: PLAN_DATA.Romantic.$$.addons.filter(a => a.type === 'flowers').concat(
    PLAN_DATA.Chill.$$.addons.filter(a => a.type === 'flowers')
  ).slice(0, 3),
  dessert: PLAN_DATA.Romantic.$$.addons.filter(a => a.type === 'dessert').concat(
    PLAN_DATA.Chill.$$.addons.filter(a => a.type === 'dessert')
  ).slice(0, 3),
  scenic: PLAN_DATA.Romantic.$$.addons.filter(a => a.type === 'scenic').concat(
    PLAN_DATA.Chill.$$.addons.filter(a => a.type === 'scenic')
  ).slice(0, 3),
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
  { id: 'sp1', title: 'Griffith Adventure Date', dateDisplay: 'March 15, 2025', city: 'Los Angeles, CA', vibe: 'Adventure', items: ['🎯 Cliffs of Id Rock Climbing', '🍽️ Seoul Flame Korean BBQ', '💐 Petal Lane Florist'], favorite: true },
  { id: 'sp2', title: 'Chill Sunday Vibes', dateDisplay: 'February 10, 2025', city: 'Los Angeles, CA', vibe: 'Chill', items: ['🎯 The Last Bookstore', '🍽️ Olive & Thyme Bistro'], favorite: false },
  { id: 'sp3', title: 'Romantic Rooftop Night', dateDisplay: 'January 5, 2025', city: 'Los Angeles, CA', vibe: 'Romantic', items: ['🎯 Perch Rooftop Lounge', '🍽️ Luna Rooftop Dining', '🍰 Bottega Louie'], favorite: true },
];

export const VIBES = [
  { id: 'Adventure', emoji: '🏔️', desc: 'Active, exciting, and bold' },
  { id: 'Chill',     emoji: '☕', desc: 'Slow, cozy, and easy' },
  { id: 'Romantic',  emoji: '🌹', desc: 'Dreamy, intimate, and special' },
  { id: 'Fun',       emoji: '🎉', desc: 'Playful, loud, and joyful' },
];