import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AlarmList } from '../../components/AlarmList';
import * as hooks from '../../hooks';
import { AlarmSeverity, AlarmStatus } from '../../types/models';

vi.mock('../../hooks', () => ({
    useWebSocket: vi.fn(),
}));

describe('AlarmList', () => {
    let mockOn: any;
    let mockEmit: any;
    let newAlarmHandler: Function;
    let updateAlarmHandler: Function;

    beforeEach(() => {
        mockEmit = vi.fn();
        mockOn = vi.fn((event, handler) => {
            if (event === 'alarm:new') newAlarmHandler = handler;
            if (event === 'alarm:update') updateAlarmHandler = handler;
        });

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

    it('should display connected status', () => {
        render(<AlarmList wsUrl="test" />);
        expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('should display disconnected status', () => {
        (hooks.useWebSocket as any).mockReturnValue({
            isConnected: false,
            emit: mockEmit,
            on: mockOn,
            off: vi.fn(),
        });
        render(<AlarmList wsUrl="test" />);
        expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });

    it('should display empty state', () => {
        render(<AlarmList wsUrl="test" />);
        expect(screen.getByText('No active alarms')).toBeInTheDocument();
    });

    it('should render incoming alarms', async () => {
        render(<AlarmList wsUrl="test" />);

        const alarm = {
            id: '1',
            title: 'New Alarm',
            description: 'Something happened',
            severity: AlarmSeverity.HIGH,
            status: AlarmStatus.ACTIVE,
            timestamp: new Date().toISOString(),
            source: 'test',
        };

        act(() => {
            newAlarmHandler(alarm);
        });

        // Alarm title appears in both toast and card
        expect(screen.getAllByText('New Alarm').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Something happened').length).toBeGreaterThan(0);
        expect(screen.getByText('HIGH')).toBeInTheDocument();
    });

    it('should handle alarm acknowledgement', () => {
        render(<AlarmList wsUrl="test" />);

        const alarm = {
            id: '1',
            title: 'Alarm 1',
            description: 'Desc',
            severity: AlarmSeverity.MEDIUM,
            status: AlarmStatus.ACTIVE,
            timestamp: new Date().toISOString(),
        };

        act(() => {
            newAlarmHandler(alarm);
        });

        const ackBtn = screen.getByText('Acknowledge');
        fireEvent.click(ackBtn);

        expect(mockEmit).toHaveBeenCalledWith('alarm:acknowledge', { id: '1' });
        // Should remove acknowledge button (optimistic update)
        expect(screen.queryByText('Acknowledge')).not.toBeInTheDocument();
    });

    it('should handle alarm resolution', () => {
        render(<AlarmList wsUrl="test" />);

        const alarm = {
            id: '1',
            title: 'Alarm 1',
            description: 'Desc',
            severity: AlarmSeverity.MEDIUM,
            status: AlarmStatus.ACTIVE,
            timestamp: new Date().toISOString(),
        };

        act(() => {
            newAlarmHandler(alarm);
        });

        const resolveBtn = screen.getByText('Resolve');
        fireEvent.click(resolveBtn);

        expect(mockEmit).toHaveBeenCalledWith('alarm:resolve', { id: '1' });
        // Should show resolved status
        expect(screen.getByText('Resolved')).toBeInTheDocument();
    });

    it('should handle alarm updates from server', () => {
        render(<AlarmList wsUrl="test" />);

        const alarm = {
            id: '1',
            title: 'Alarm 1',
            status: AlarmStatus.ACTIVE,
            timestamp: new Date().toISOString(),
            severity: AlarmSeverity.LOW
        };

        act(() => {
            newAlarmHandler(alarm);
        });

        expect(screen.getByText('Acknowledge')).toBeInTheDocument();

        // Update from server
        act(() => {
            updateAlarmHandler({ id: '1', status: AlarmStatus.ACKNOWLEDGED });
        });

        expect(screen.queryByText('Acknowledge')).not.toBeInTheDocument();
    });
});
