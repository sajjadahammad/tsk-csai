import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AlarmList } from '../../components/AlarmList';
import * as hooks from '../../hooks';
import { AlarmSeverity, AlarmStatus } from '../../types/models';

vi.mock('../../hooks', () => ({
    useWebSocket: vi.fn(),
}));

describe('Property-Based Test: AlarmList', () => {
    let mockOn: any;
    let mockEmit: any;

    beforeEach(() => {
        mockOn = vi.fn();
        mockEmit = vi.fn();
        (hooks.useWebSocket as any).mockReturnValue({
            isConnected: true,
            emit: mockEmit,
            on: mockOn,
            off: vi.fn(),
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('Property 6: Real-time Alarm Updates - UI reflects events immediately (100+ iterations)', async () => {
        const iterations = 100;

        for (let i = 0; i < iterations; i++) {
            // We'll simulate different sequences of events
            // But since we can't easily capture the callbacks in a standard way without rendering, 
            // we'll rely on the mock implementation capturing them.

            let newAlarmHandler: Function = () => { };
            mockOn.mockImplementation((event: string, handler: Function) => {
                if (event === 'alarm:new') {
                    newAlarmHandler = handler;
                }
            });

            const { unmount } = render(<AlarmList wsUrl="test" />);

            // Generate random alarm
            const alarmId = `alarm-${i}`;
            const alarmTitle = `Test Alarm ${i}`;
            const alarm = {
                id: alarmId,
                title: alarmTitle,
                description: 'Test description',
                severity: AlarmSeverity.HIGH,
                status: AlarmStatus.ACTIVE,
                timestamp: new Date().toISOString(),
                source: 'test',
            };

            // Simulate event
            await act(async () => {
                newAlarmHandler(alarm);
            });

            // Property: UI should show the new alarm (appears in both toast and card)
            expect(screen.getAllByText(alarmTitle).length).toBeGreaterThan(0);

            unmount();
        }
    });

    it('Property 7: Alarm List Management - Alarms are sorted by timestamp (100+ iterations)', async () => {
        const iterations = 100;

        for (let i = 0; i < iterations; i++) {
            let newAlarmHandler: Function = () => { };
            mockOn.mockImplementation((event: string, handler: Function) => {
                if (event === 'alarm:new') {
                    newAlarmHandler = handler;
                }
            });

            const { unmount } = render(<AlarmList wsUrl="test" />);

            // Generate 3 alarms with random timestamps
            const alarms = [1, 2, 3].map(id => ({
                id: `alarm-${i}-${id}`,
                title: `Alarm ${id}`,
                description: 'Desc',
                severity: AlarmSeverity.LOW,
                status: AlarmStatus.ACTIVE,
                timestamp: new Date(Date.now() - Math.floor(Math.random() * 10000)).toISOString(),
                source: 'test'
            }));

            // Ingest them in random order
            const shuffled = [...alarms].sort(() => Math.random() - 0.5);

            for (const alarm of shuffled) {
                await act(async () => {
                    newAlarmHandler(alarm);
                });
            }

            // Expected order: Newest first (descending timestamp)
            const sorted = [...alarms].sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            // Check if elements appear in correct order in the DOM
            // Note: getAllByText will match both toast and card elements, so we expect 6 total (3 alarms × 2 locations each)
            const alarmElements = screen.getAllByText(/Alarm \d/);
            expect(alarmElements.length).toBeGreaterThanOrEqual(3);

            // Filter to get only the card titles (h3 elements)
            const cardTitles = alarmElements.filter(el => el.tagName === 'H3');
            expect(cardTitles).toHaveLength(3);

            // We can check text content order
            // Note: getAllByText might return in DOM order.
            // Assuming Card renders Title text.

            // This check is slightly loose because 'Alarm 1' text might be inside a deeper node,
            // but getAllByText usually returns the node containing the text.
            // If sorting is correct, the first element should correspond to the newest alarm.

            // Actually, let's verify the first item is the newest.
            // Better approach: Get all cards and check their titles.
            // But since we don't have test-ids easily injected property test style without modifying component.
            // We'll rely on text.

            // Actually, let's verify the first item is the newest.
            expect(cardTitles[0]).toHaveTextContent(sorted[0].title);
            expect(cardTitles[1]).toHaveTextContent(sorted[1].title);
            expect(cardTitles[2]).toHaveTextContent(sorted[2].title);

            unmount();
        }
    });
});
