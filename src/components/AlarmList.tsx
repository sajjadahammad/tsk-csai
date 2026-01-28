import { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks';
import type { Alarm } from '../types/models';
import { AlarmSeverity, AlarmStatus } from '../types/models';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle, Clock, Wifi, WifiOff, Bell } from 'lucide-react';
import { cn } from '../lib/utils';

interface AlarmListProps {
    wsUrl: string;
}

export const AlarmList = ({ wsUrl }: AlarmListProps) => {
    const { isConnected, on, off, emit } = useWebSocket({ url: wsUrl });
    const [alarms, setAlarms] = useState<Alarm[]>([]);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [latestAlarm, setLatestAlarm] = useState<Alarm | null>(null);

    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then((permission) => {
                setNotificationsEnabled(permission === 'granted');
            });
        } else if ('Notification' in window && Notification.permission === 'granted') {
            setNotificationsEnabled(true);
        }
    }, []);

    useEffect(() => {
        const handleNewAlarm = (alarm: Alarm) => {
            setAlarms((prev) => [alarm, ...prev]);
            setLatestAlarm(alarm);
            setShowToast(true);

            if (notificationsEnabled && 'Notification' in window) {
                new Notification(`${alarm.severity.toUpperCase()} Alarm`, {
                    body: alarm.title,
                    icon: '/vite.svg',
                    tag: alarm.id,
                });
            }

            setTimeout(() => setShowToast(false), 5000);
        };

        const handleUpdateAlarm = (updatedAlarm: Partial<Alarm> & { id: string }) => {
            setAlarms((prev) =>
                prev.map((alarm) =>
                    alarm.id === updatedAlarm.id ? { ...alarm, ...updatedAlarm } : alarm
                )
            );
        };

        on('alarm:new', handleNewAlarm);
        on('alarm:update', handleUpdateAlarm);

        return () => {
            off('alarm:new', handleNewAlarm);
            off('alarm:update', handleUpdateAlarm);
        };
    }, [on, off, notificationsEnabled]);

    const handleAcknowledge = (id: string) => {
        emit('alarm:acknowledge', { id });
        setAlarms((prev) =>
            prev.map((alarm) =>
                alarm.id === id ? { ...alarm, status: AlarmStatus.ACKNOWLEDGED } : alarm
            )
        );
    };

    const handleResolve = (id: string) => {
        emit('alarm:resolve', { id });
        setAlarms((prev) =>
            prev.map((alarm) =>
                alarm.id === id ? { ...alarm, status: AlarmStatus.RESOLVED } : alarm
            )
        );
    };

    const getSeverityColor = (severity: AlarmSeverity) => {
        switch (severity) {
            case AlarmSeverity.CRITICAL:
                return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
            case AlarmSeverity.HIGH:
                return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
            case AlarmSeverity.MEDIUM:
                return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
            case AlarmSeverity.LOW:
                return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getToastColor = (severity: AlarmSeverity) => {
        switch (severity) {
            case AlarmSeverity.CRITICAL:
                return 'bg-red-600 border-red-700';
            case AlarmSeverity.HIGH:
                return 'bg-orange-600 border-orange-700';
            case AlarmSeverity.MEDIUM:
                return 'bg-yellow-600 border-yellow-700';
            case AlarmSeverity.LOW:
                return 'bg-blue-600 border-blue-700';
            default:
                return 'bg-gray-600 border-gray-700';
        }
    };

    const sortedAlarms = [...alarms].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return (
        <div className="space-y-4">
            {/* Toast Notification */}
            {showToast && latestAlarm && (
                <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5">
                    <Card className={cn("border-2 shadow-lg", getToastColor(latestAlarm.severity))}>
                        <CardContent className="p-4 text-white">
                            <div className="flex items-start gap-3">
                                <Bell size={20} className="mt-0.5 shrink-0" />
                                <div className="flex-1">
                                    <div className="font-semibold text-sm mb-1">
                                        {latestAlarm.severity.toUpperCase()} ALARM
                                    </div>
                                    <div className="text-sm">{latestAlarm.title}</div>
                                    <div className="text-xs opacity-90 mt-1">{latestAlarm.description}</div>
                                </div>
                                <button
                                    onClick={() => setShowToast(false)}
                                    className="text-white hover:bg-white/20 rounded p-1"
                                >
                                    ✕
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold">Real-time Alarms</h2>
                <div className="flex items-center gap-4">
                    {notificationsEnabled && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Bell size={16} />
                            <span>Notifications On</span>
                        </div>
                    )}
                    {isConnected ? (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <Wifi size={20} />
                            <span className="text-sm font-medium">Connected</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <WifiOff size={20} />
                            <span className="text-sm font-medium">Disconnected</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid gap-4">
                {alarms.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                            <CheckCircle size={48} className="mb-4 opacity-20" />
                            <p>No active alarms</p>
                            <p className="text-xs mt-2">Alarms will appear here when received via WebSocket</p>
                        </CardContent>
                    </Card>
                ) : (
                    sortedAlarms.map((alarm) => (
                        <Card key={alarm.id} className={cn("transition-all duration-300", alarm.status === AlarmStatus.RESOLVED && "opacity-60 bg-muted/50")}>
                            <CardHeader className="p-4 pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", getSeverityColor(alarm.severity))}>
                                                {alarm.severity.toUpperCase()}
                                            </span>
                                            <CardTitle className="text-base">{alarm.title}</CardTitle>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{alarm.description}</p>
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock size={12} />
                                        {new Date(alarm.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-2 flex justify-end gap-2">
                                {alarm.status !== AlarmStatus.RESOLVED && (
                                    <>
                                        {alarm.status !== AlarmStatus.ACKNOWLEDGED && (
                                            <Button variant="outline" size="sm" onClick={() => handleAcknowledge(alarm.id)}>
                                                Acknowledge
                                            </Button>
                                        )}
                                        <Button variant="secondary" size="sm" onClick={() => handleResolve(alarm.id)}>
                                            Resolve
                                        </Button>
                                    </>
                                )}
                                {alarm.status === AlarmStatus.RESOLVED && (
                                    <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                                        <CheckCircle size={14} /> Resolved
                                    </span>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};
