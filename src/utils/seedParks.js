/**
 * Park Coordinates Seeder
 * Run this once to populate the Firestore 'parks' collection with the
 * correct latitude/longitude coordinates for all Kenyan national parks.
 *
 * Usage: Import <SeedParks /> and render it temporarily in your Admin
 * Dashboard, or call seedParksToFirestore() directly from the browser console
 * after importing it. Remove after seeding.
 */
import { useEffect } from 'react';
import { db } from '../config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const PARKS = [
  { id: 'amboseli',     name: 'Amboseli',     latitude: -2.6527,  longitude: 37.2606 },
  { id: 'maasai-mara',  name: 'Maasai Mara',  latitude: -1.5054,  longitude: 35.1439 },
  { id: 'tsavo-east',   name: 'Tsavo East',   latitude: -2.9764,  longitude: 38.5681 },
  { id: 'tsavo-west',   name: 'Tsavo West',   latitude: -3.0675,  longitude: 38.0171 },
  { id: 'samburu',      name: 'Samburu',      latitude: 0.6031,   longitude: 37.5339 },
  { id: 'lake-nakuru',  name: 'Lake Nakuru',  latitude: -0.3576,  longitude: 36.0822 },
  { id: 'aberdare',     name: 'Aberdare',     latitude: -0.3833,  longitude: 36.7167 },
  { id: 'mount-kenya',  name: 'Mount Kenya',  latitude: -0.1521,  longitude: 37.3084 },
];

export const seedParksToFirestore = async () => {
  let seeded = 0;
  let skipped = 0;

  for (const park of PARKS) {
    try {
      const ref = doc(db, 'parks', park.id);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const existing = snap.data();
        // Only update coordinates if they're missing
        if (!existing.latitude || !existing.longitude) {
          await setDoc(ref, {
            ...existing,
            latitude: park.latitude,
            longitude: park.longitude,
          });
          console.log(`✅ Updated coordinates for: ${park.name}`);
          seeded++;
        } else {
          console.log(`⏭️  Skipped (already has coords): ${park.name}`);
          skipped++;
        }
      } else {
        // Create the park document fresh
        await setDoc(ref, {
          id: park.id,
          name: park.name,
          latitude: park.latitude,
          longitude: park.longitude,
          createdAt: new Date().toISOString(),
        });
        console.log(`🆕 Created park: ${park.name}`);
        seeded++;
      }
    } catch (err) {
      console.error(`❌ Failed to seed ${park.name}:`, err.message);
    }
  }

  console.log(`\n🌍 Park Seeding Complete: ${seeded} written, ${skipped} skipped.`);
  return { seeded, skipped };
};

/**
 * Drop-in React component to auto-seed on mount (remove after use!)
 */
export const SeedParks = () => {
  useEffect(() => {
    seedParksToFirestore().then(result => {
      console.log('Parks seeded:', result);
    });
  }, []);

  return null;
};
