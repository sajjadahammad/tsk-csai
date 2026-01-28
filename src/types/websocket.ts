import type { Alarm } from './models';

export interface WebSocketEvent<T = any> {
  type: string;
  payload: T;
  timestamp: string;
  id: string;
}

export interface AlarmNewEvent extends WebSocketEvent<Alarm> {
  type: 'alarm:new';
}

export interface AlarmUpdateEvent extends WebSocketEvent<Partial<Alarm> & { id: string }> {
  type: 'alarm:update';
}

export interface AlarmResolveEvent extends WebSocketEvent<{ id: string }> {
  type: 'alarm:resolve';
}

export interface AlarmAcknowledgeEvent extends WebSocketEvent<{ id: string }> {
  type: 'alarm:acknowledge';
}

export interface ConnectionEventPayload {
  reason?: string;
  attempt?: number;
}

export interface ConnectionEvent extends WebSocketEvent<ConnectionEventPayload> {
  type: 'connect' | 'disconnect' | 'reconnect' | 'error';
}

export type AlarmEvent = AlarmNewEvent | AlarmUpdateEvent | AlarmResolveEvent | AlarmAcknowledgeEvent;

export type WebSocketEventType = AlarmEvent | ConnectionEvent;
