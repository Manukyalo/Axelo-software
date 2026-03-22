import { addDays, format, subMonths } from 'date-fns';

export const initialData = {
  vehicles: [],
  drivers: [],
  packages: [
    {
      id: 'p1',
      name: '4 Days Masai Mara & Lake Nakuru',
      description: 'Experience the world-famous wildebeest migration and the flamingos of Lake Nakuru.',
      duration: 4,
      priceAdult: 120000,
      priceChild: 60000,
      destinations: ['Maasai Mara', 'Lake Nakuru'],
      included: ['Transport', 'Park Fees', 'Accommodation', 'Gamedrives'],
      image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 'p2',
      name: '7 Days Masai Mara, Nakuru & Amboseli',
      description: 'Stunning views of Mt. Kilimanjaro, large elephant herds, and the ultimate Mara experience.',
      duration: 7,
      priceAdult: 245000,
      priceChild: 120000,
      destinations: ['Amboseli', 'Lake Nakuru', 'Maasai Mara'],
      included: ['Transport', 'Park Fees', 'Full Board', 'Expert Guide'],
      image: 'https://images.unsplash.com/photo-1547471080-7cc2001d0138?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 'p3',
      name: '15 Days Kenya Classic Safari Tour',
      description: 'A comprehensive journey covering the best of Kenya\'s wildlife reserves and coastal beaches.',
      duration: 15,
      priceAdult: 450000,
      priceChild: 220000,
      destinations: ['Samburu', 'Nakuru', 'Mara', 'Diani'],
      included: ['Flight', 'Transfer', 'Half-board', 'Luxury Camps'],
      image: 'https://images.unsplash.com/photo-1589979482817-4fed7bb77050?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 'p4',
      name: '6 Days Mara, Nakuru, Amboseli & Tsavo',
      description: 'Action-packed safari connecting Nairobi and Mombasa through Kenya\'s prime parks.',
      duration: 6,
      priceAdult: 210000,
      priceChild: 100000,
      destinations: ['Amboseli', 'Tsavo West', 'Maasai Mara'],
      included: ['Transport', 'Park Fees', 'Accommodation', 'Gamedrives'],
      image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=80&w=800'
    }
  ],
  bookings: [],
  notifications: []
};
