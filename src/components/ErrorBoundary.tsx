import type { ReactNode } from 'react';
import { ErrorBoundary as ReactErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { Button } from './ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onReset?: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <div className="space-y-2">
                <h2 className="text-xl font-bold text-red-700 dark:text-red-400">
                    Something went wrong
                </h2>
                <p className="text-sm text-red-600 dark:text-red-300 max-w-md">
                    {(error instanceof Error ? error.message : String(error)) || 'An unexpected error occurred. Please try again.'}
                </p>
            </div>
            <Button
                onClick={resetErrorBoundary}
                variant="destructive"
                size="sm"
            >
                Try Again
            </Button>
        </div>
    );
}

export function ErrorBoundary({ children, fallback, onReset }: Props) {
    const logError = (error: unknown, info: { componentStack?: string | null }) => {
        console.error('ErrorBoundary caught an error:', error, info);
    };

    return (
        <ReactErrorBoundary
            onReset={onReset}
            onError={logError}
            fallbackRender={(props) => {
                if (fallback) {
                    return <>{fallback}</>;
                }
                return <ErrorFallback {...props} />;
            }}
        >
            {children}
        </ReactErrorBoundary>
    );
}
