import { NextResponse } from 'next/server';
import { adminDb } from '@/firebaseAdmin';

const sampleEvents = [
  {
    title: 'Beach Cleanup at Palm Beach',
    description:
      'Join us for a community beach cleanup to keep our beautiful coastline pristine. All supplies provided!',
    category: 'Environmental',
    location: {
      lat: 26.7145,
      lng: -80.0549,
      address: 'Palm Beach, FL 33480',
    },
    date: '2025-01-15',
    time: '09:00',
    maxAttendees: 50,
    attendees: [],
    createdBy: 'system',
    createdAt: new Date().toISOString(),
  },
  {
    title: 'Community Garden Planting',
    description:
      'Help us plant vegetables and herbs in our community garden. Great for families and beginners!',
    category: 'Community Service',
    location: {
      lat: 26.7511,
      lng: -80.0989,
      address: 'West Palm Beach, FL 33401',
    },
    date: '2025-01-20',
    time: '10:00',
    maxAttendees: 30,
    attendees: [],
    createdBy: 'system',
    createdAt: new Date().toISOString(),
  },
  {
    title: 'Senior Center Tech Help',
    description:
      'Volunteer to help seniors learn how to use smartphones and tablets. Patience and basic tech knowledge required.',
    category: 'Senior Support',
    location: {
      lat: 26.7153,
      lng: -80.0534,
      address: 'Palm Beach Gardens, FL 33410',
    },
    date: '2025-01-25',
    time: '14:00',
    maxAttendees: 20,
    attendees: [],
    createdBy: 'system',
    createdAt: new Date().toISOString(),
  },
  {
    title: 'Animal Shelter Volunteer Day',
    description:
      'Spend time with our furry friends! Help with feeding, cleaning, and socializing animals.',
    category: 'Animal Welfare',
    location: {
      lat: 26.6595,
      lng: -80.059,
      address: 'Lake Worth, FL 33460',
    },
    date: '2025-01-30',
    time: '11:00',
    maxAttendees: 25,
    attendees: [],
    createdBy: 'system',
    createdAt: new Date().toISOString(),
  },
  {
    title: 'Youth Art Workshop',
    description:
      'Teach kids painting and drawing techniques. All art supplies provided. No experience required!',
    category: 'Arts & Culture',
    location: {
      lat: 26.8234,
      lng: -80.1385,
      address: 'Jupiter, FL 33458',
    },
    date: '2025-02-05',
    time: '15:00',
    maxAttendees: 15,
    attendees: [],
    createdBy: 'system',
    createdAt: new Date().toISOString(),
  },
];

export async function POST() {
  try {
    const batch = adminDb.batch();

    sampleEvents.forEach((event) => {
      const docRef = adminDb.collection('events').doc();
      batch.set(docRef, event);
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Added ${sampleEvents.length} sample events to the database`,
    });
  } catch (error) {
    console.error('Error seeding events:', error);
    return NextResponse.json({ success: false, error: 'Failed to seed events' }, { status: 500 });
  }
}
