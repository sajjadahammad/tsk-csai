import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreatePostForm } from '../../components/CreatePostForm';
import * as hooks from '../../hooks/use-data-queries';

vi.mock('../../hooks/use-data-queries', () => ({
    useMutation: vi.fn(),
    useListQuery: vi.fn(),
}));

describe('CreatePostForm', () => {
    let mutateMock: any;

    beforeEach(() => {
        mutateMock = vi.fn();
        (hooks.useMutation as any).mockReturnValue({
            mutate: mutateMock,
            isLoading: false,
            isError: false,
            error: null,
            reset: vi.fn(),
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should render form fields', () => {
        render(<CreatePostForm />);
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create post/i })).toBeInTheDocument();
    });

    it('should validate inputs before submission', () => {
        render(<CreatePostForm />);
        const submitBtn = screen.getByRole('button', { name: /create post/i });

        fireEvent.click(submitBtn);

        expect(screen.getByText('Title and body are required.')).toBeInTheDocument();
        expect(mutateMock).not.toHaveBeenCalled();
    });

    it('should call mutate with form data on valid submission', () => {
        render(<CreatePostForm />);

        fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'My Title' } });
        fireEvent.change(screen.getByLabelText(/content/i), { target: { value: 'My Content' } });

        fireEvent.click(screen.getByRole('button', { name: /create post/i }));

        expect(mutateMock).toHaveBeenCalledWith({
            title: 'My Title',
            body: 'My Content',
            userId: 1,
        });
    });

    it('should display loading state', () => {
        (hooks.useMutation as any).mockReturnValue({
            mutate: mutateMock,
            isLoading: true,
            isError: false,
            error: null,
        });

        render(<CreatePostForm />);

        expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
        expect(screen.getByLabelText(/title/i)).toBeDisabled();
    });

    it('should display error message on failure', () => {
        (hooks.useMutation as any).mockReturnValue({
            mutate: mutateMock,
            isLoading: false,
            isError: true,
            error: { message: 'Network Error' },
        });

        render(<CreatePostForm />);

        expect(screen.getByText('Network Error')).toBeInTheDocument();
    });
});
