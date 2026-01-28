export interface NavItem {
  path: string;
  label: string;
  color: 'blue' | 'purple' | 'green' | 'indigo' | 'orange' | 'red';
}

export const navItems: NavItem[] = [
  { path: '/', label: 'Paginated', color: 'blue' },
  { path: '/infinite', label: 'Infinite Scroll', color: 'purple' },
  { path: '/filters', label: 'With Filters', color: 'green' },
  { path: '/virtualized', label: 'Virtualized', color: 'indigo' },
  { path: '/alarms', label: 'Real-time Alarms', color: 'orange' },
  { path: '/bitmex', label: 'BitMEX OrderBook', color: 'red' },
];

export { Header } from './Header';
export { Footer } from './Footer';
