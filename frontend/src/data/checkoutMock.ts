import type { Branch } from '../types/checkout';

export const BRANCHES: Branch[] = [
  {
    id: 'antwerp',
    city: 'Antwerp',
    title: 'Antwerp — Klooster',
    address: 'Kloosterstraat 42, 2000 Antwerp',
    readyInfo: 'Ready today after 14:00 · Held for 3 days',
    hours: 'Tue–Sat, 10:00–19:00 · Sun, 11:00–17:00',
  },
  {
    id: 'brussels',
    city: 'Brussels',
    title: 'Brussels — Dansaert',
    address: 'Rue Antoine Dansaert 88, 1000 Brussels',
    readyInfo: 'Ready today after 15:30 · Held for 3 days',
    hours: 'Mon–Sat, 10:00–19:00',
  },
  {
    id: 'ghent',
    city: 'Ghent',
    title: 'Ghent — Brabantdam',
    address: 'Brabantdam 54, 9000 Ghent',
    readyInfo: 'Ready tomorrow from 10:00 · Held for 3 days',
    hours: 'Tue–Sat, 10:00–18:30',
  },
];