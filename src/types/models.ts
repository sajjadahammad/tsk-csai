export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

export interface Comment {
  id: number;
  postId: number;
  name: string;
  email: string;
  body: string;
}

export const AlarmSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type AlarmSeverity = typeof AlarmSeverity[keyof typeof AlarmSeverity];

export const AlarmStatus = {
  ACTIVE: 'active',
  ACKNOWLEDGED: 'acknowledged',
  RESOLVED: 'resolved',
} as const;

export type AlarmStatus = typeof AlarmStatus[keyof typeof AlarmStatus];

export interface Alarm {
  id: string;
  title: string;
  description: string;
  severity: AlarmSeverity;
  status: AlarmStatus;
  timestamp: string;
  source: string;
  metadata?: Record<string, any>;
}
