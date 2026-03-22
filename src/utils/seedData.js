import { addDays, format, subMonths } from 'date-fns';

export const initialData = {
  vehicles: [
    {
      id: 'v1',
      name: 'Safari Toyota Land Cruiser',
      model: '70 Series',
      year: 2023,
      plate: 'KDJ 456X',
      capacity: 7,
      status: 'Active',
      insuranceProvider: 'Jubilee Insurance',
      insurancePolicy: 'POL-123456',
      insuranceExpiry: format(addDays(new Date(), 45), 'yyyy-MM-dd'),
      lastService: '2024-01-15',
      image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800',
      driverId: 'd1'
    },
    {
      id: 'v2',
      name: 'Nissan Patrol Safari',
      model: 'Y61',
      year: 2022,
      plate: 'KDL 123Y',
      capacity: 6,
      status: 'In Maintenance',
      insuranceProvider: 'Heritage Insurance',
      insurancePolicy: 'POL-789012',
      insuranceExpiry: format(addDays(new Date(), 12), 'yyyy-MM-dd'), // Expiring soon
      lastService: '2024-03-01',
      image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800',
      driverId: 'd2'
    },
    {
      id: 'v3',
      name: 'Overland Truck',
      model: 'Scania P360',
      year: 2021,
      plate: 'KDC 999S',
      capacity: 22,
      status: 'Active',
      insuranceProvider: 'ICEA Lion',
      insurancePolicy: 'POL-444555',
      insuranceExpiry: format(addDays(new Date(), -5), 'yyyy-MM-dd'), // EXPIRED
      lastService: '2023-11-20',
      image: 'https://images.unsplash.com/photo-1506015391300-4802dc7bbde2?auto=format&fit=crop&q=80&w=800'
    },
    {
        id: 'v4',
        name: 'Toyota Hiace Custom',
        model: 'Super GL',
        year: 2020,
        plate: 'KDA 777W',
        capacity: 9,
        status: 'Active',
        insuranceProvider: 'Britam',
        insurancePolicy: 'POL-666777',
        insuranceExpiry: format(addDays(new Date(), 90), 'yyyy-MM-dd'),
        lastService: '2024-02-10',
        image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800',
        driverId: 'd3'
    },
    {
        id: 'v5',
        name: 'Land Rover Defender',
        model: '110 HSE',
        year: 2024,
        plate: 'KDM 001A',
        capacity: 5,
        status: 'Active',
        insuranceProvider: 'Old Mutual',
        insurancePolicy: 'POL-999888',
        insuranceExpiry: format(addDays(new Date(), 365), 'yyyy-MM-dd'),
        lastService: '2024-03-15',
        image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=80&w=800',
        driverId: 'd4'
    }
  ],
  drivers: [
    {
      id: 'd1',
      name: 'John Kamau',
      phone: '+254 712 345 678',
      email: 'john.kamau@toursco.com',
      license: 'L-5566778',
      licenseExpiry: format(addDays(new Date(), 100), 'yyyy-MM-dd'),
      status: 'On Trip',
      trips: 145,
      rating: 4.8,
      languages: ['English', 'Swahili'],
      vehicleId: 'v1'
    },
    {
      id: 'd2',
      name: 'Sarah Wangari',
      phone: '+254 723 456 789',
      email: 'sarah.w@toursco.com',
      license: 'L-1122334',
      licenseExpiry: format(addDays(new Date(), 20), 'yyyy-MM-dd'), // Licenses expiring
      status: 'Available',
      trips: 89,
      rating: 4.9,
      languages: ['English', 'Swahili', 'French'],
      vehicleId: 'v2'
    },
    {
        id: 'd3',
        name: 'Michael Omondi',
        phone: '+254 734 567 890',
        email: 'michael.o@toursco.com',
        license: 'L-9988776',
        licenseExpiry: format(addDays(new Date(), 200), 'yyyy-MM-dd'),
        status: 'Available',
        trips: 210,
        rating: 4.7,
        languages: ['English', 'Swahili', 'German'],
        vehicleId: 'v4'
    },
    {
        id: 'd4',
        name: 'David Kiprotich',
        phone: '+254 745 678 901',
        email: 'david.k@toursco.com',
        license: 'L-4455667',
        licenseExpiry: format(addDays(new Date(), 150), 'yyyy-MM-dd'),
        status: 'Off Duty',
        trips: 120,
        rating: 4.6,
        languages: ['English', 'Swahili'],
        vehicleId: 'v5'
    },
    {
        id: 'd5',
        name: 'Grace Mutua',
        phone: '+254 756 789 012',
        email: 'grace.m@toursco.com',
        license: 'L-3322110',
        licenseExpiry: format(addDays(new Date(), -10), 'yyyy-MM-dd'), // EXPIRED
        status: 'On Leave',
        trips: 65,
        rating: 4.5,
        languages: ['English', 'Swahili', 'Chinese'],
    },
    {
        id: 'd6',
        name: 'Peter Musyoka',
        phone: '+254 767 890 123',
        email: 'peter.m@toursco.com',
        license: 'L-7788990',
        licenseExpiry: format(addDays(new Date(), 300), 'yyyy-MM-dd'),
        status: 'Available',
        trips: 178,
        rating: 4.9,
        languages: ['English', 'Swahili'],
    }
  ],
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
  bookings: [
    {
      id: 'TRP-2025-0001',
      clientName: 'James Wilson',
      clientEmail: 'james@example.com',
      clientPhone: '+44 7700 900001',
      packageId: 'p1',
      date: format(new Date(), 'yyyy-MM-dd'),
      pax: { adults: 2, children: 1, infants: 0 },
      vehicleId: 'v1',
      driverId: 'd1',
      status: 'On Trip',
      paymentStatus: 'Fully Paid',
      totalAmount: 115000,
      paidAmount: 115000,
      method: 'Card',
      createdById: 'admin'
    },
    {
      id: 'TRP-2025-0002',
      clientName: 'Elena Rodriguez',
      clientEmail: 'elena@example.com',
      clientPhone: '+34 600 000 000',
      packageId: 'p2',
      date: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
      pax: { adults: 2, children: 0, infants: 0 },
      vehicleId: 'v2',
      driverId: 'd2',
      status: 'Confirmed',
      paymentStatus: 'Partially Paid',
      totalAmount: 64000,
      paidAmount: 32000,
      method: 'Bank Transfer',
      createdById: 'res_agent'
    },
    {
        id: 'TRP-2025-0003',
        clientName: 'Kevin Smith',
        clientEmail: 'kevin@example.com',
        clientPhone: '+1 555 123 4567',
        packageId: 'p3',
        date: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
        pax: { adults: 2, children: 2, infants: 0 },
        vehicleId: null,
        driverId: null,
        status: 'Pending',
        paymentStatus: 'Unpaid',
        totalAmount: 200000,
        paidAmount: 0,
        method: 'M-Pesa',
        createdById: 'res_agent'
    },
    // Adding more for stats
    {
        id: 'TRP-2025-0004',
        clientName: 'Li Wei',
        clientEmail: 'li@example.com',
        clientPhone: '+86 10 1234 5678',
        packageId: 'p1',
        date: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
        pax: { adults: 4, children: 0, infants: 0 },
        vehicleId: 'v4',
        driverId: 'd3',
        status: 'Completed',
        paymentStatus: 'Fully Paid',
        totalAmount: 180000,
        paidAmount: 180000,
        method: 'Card',
        createdById: 'admin'
    }
  ],
  notifications: [
    {
      id: 'n1',
      type: 'CRITICAL',
      title: 'Expired Vehicle Insurance',
      message: 'Vehicle KDC 999S insurance has expired.',
      timestamp: new Date().toISOString(),
      read: false,
      link: '/admin/vehicles'
    },
    {
      id: 'n2',
      type: 'WARNING',
      title: 'Insurance Expiring Soon',
      message: 'Vehicle KDL 123Y insurance expires in 12 days.',
      timestamp: new Date().toISOString(),
      read: false,
      link: '/admin/vehicles'
    }
  ]
};
