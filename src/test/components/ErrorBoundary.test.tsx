import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { Button } from '../../components/ui/button';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
        throw new Error('Test Error');
    }
    return <div>Content</div>;
};

describe('ErrorBoundary', () => {
    // Suppress console.error for expected errors
    const originalConsoleError = console.error;
    beforeEach(() => {
        console.error = vi.fn();
    });

    afterEach(() => {
        console.error = originalConsoleError;
    });

    it('should render children when no error occurs', () => {
        render(
            <ErrorBoundary>
                <div>Safe Content</div>
            </ErrorBoundary>
        );
        expect(screen.getByText('Safe Content')).toBeInTheDocument();
    });

    it('should render fallback UI when an error occurs', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(screen.getByText('Test Error')).toBeInTheDocument();
    });

    it('should call onReset and reset state when "Try Again" is clicked', () => {
        const onReset = vi.fn();
        const TestComponent = () => {
            // We use a simpler approach to test reset:
            // Render a component that throws initially, but not after reset if we were to change props,
            // but ErrorBoundary reset just clears internal state.
            // We need the child to NOT throw on second render.
            // We can simulate this with a variable outside or just mocking.
            return <ThrowError shouldThrow={true} />;
        }

        // Actually, simply checking if onReset is called is enough for the prop.
        // But to verify it resets, we typically need a setup where the error condition is cleared.
        // Let's create a wrapped component that we can control.

        let shouldThrow = true;
        const ControllableThrow = () => {
            if (shouldThrow) {
                throw new Error('Test Error');
            }
            return <div>Recovered Content</div>;
        };

        const { rerender } = render(
            <ErrorBoundary onReset={() => { shouldThrow = false; onReset(); }}>
                <ControllableThrow />
            </ErrorBoundary>
        );

        expect(screen.getByText('Test Error')).toBeInTheDocument();

        const tryAgainButton = screen.getByRole('button', { name: /try again/i });
        fireEvent.click(tryAgainButton);

        expect(onReset).toHaveBeenCalled();
        // After reset, if we rerender, or if ErrorBoundary remounts children.
        // ErrorBoundary remounts children on reset safely.
        // Since we updated `shouldThrow` in onReset, it should render "Recovered Content".

        expect(screen.getByText('Recovered Content')).toBeInTheDocument();
    });

    it('should render custom fallback if provided', () => {
        render(
            <ErrorBoundary fallback={<div>Custom Fallback</div>}>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
        expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
});
