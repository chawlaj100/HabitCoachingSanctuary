import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthScreen from './AuthScreen';

// 1. Mock the Firebase lib module entirely
vi.mock('../lib/firebase', () => {
  return {
    isFirebaseEnabled: false,
    signInWithGoogle: vi.fn(),
    signInWithEmail: vi.fn(),
    signUpWithEmail: vi.fn(),
    resetPassword: vi.fn(),
    signOutUser: vi.fn()
  };
});

// Import mocked functions to override their implementations inside tests
import { signInWithEmail, resetPassword } from '../lib/firebase';

describe('AuthScreen Component Tests', () => {
  const mockOnAuthSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the authentication portal with the Sign In tab active by default', () => {
    render(<AuthScreen onAuthSuccess={mockOnAuthSuccess} />);
    
    // Check main headings and default inputs
    expect(screen.getByText('Habit Coaching Sanctuary')).toBeDefined();
    expect(screen.getByRole('tab', { name: /sign in/i }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByLabelText(/^email address$/i)).toBeDefined();
    expect(screen.getByLabelText(/^password$/i)).toBeDefined();
    expect(screen.queryByLabelText(/^your name$/i)).toBeNull();
  });

  it('allows the user to toggle the password visibility display text', async () => {
    render(<AuthScreen onAuthSuccess={mockOnAuthSuccess} />);
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    const toggleButton = screen.getByLabelText(/show password/i);

    expect(passwordInput.getAttribute('type')).toBe('password');

    // Toggle to Show
    fireEvent.click(toggleButton);
    expect(passwordInput.getAttribute('type')).toBe('text');

    // Toggle back to Hide
    fireEvent.click(screen.getByLabelText(/hide password/i));
    expect(passwordInput.getAttribute('type')).toBe('password');
  });

  it('switches views smoothly to Sign Up when clicking the tab button', async () => {
    render(<AuthScreen onAuthSuccess={mockOnAuthSuccess} />);
    
    const signUpTab = screen.getByRole('tab', { name: /sign up/i });
    fireEvent.click(signUpTab);

    expect(signUpTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByLabelText(/^your name$/i)).toBeDefined();
    expect(screen.getByLabelText(/^email address$/i)).toBeDefined();
    expect(screen.getByLabelText(/^password$/i)).toBeDefined();
  });

  it('triggers live password strength indicator on registration tab', async () => {
    render(<AuthScreen onAuthSuccess={mockOnAuthSuccess} />);
    
    // Switch to Sign Up
    fireEvent.click(screen.getByRole('tab', { name: /sign up/i }));
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    
    // Enter a weak password
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    expect(screen.getByText(/Weak: Needs at least 8 characters/i)).toBeDefined();

    // Enter a strong password
    fireEvent.change(passwordInput, { target: { value: 'Secur3_Pa$$word' } });
    expect(screen.getByText(/Strong password!/i)).toBeDefined();
  });

  it('displays validation warning if email address format is invalid on blur', async () => {
    render(<AuthScreen onAuthSuccess={mockOnAuthSuccess} />);
    
    const emailInput = screen.getByLabelText(/^email address$/i);
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    expect(screen.getByText(/\* Please enter a valid email\./i)).toBeDefined();
  });

  it('submits successful Sign In, showing loader and calling onAuthSuccess', async () => {
    const fakeUser = { uid: 'u1', email: 'test@example.com', displayName: 'Alex' };
    vi.mocked(signInWithEmail).mockResolvedValueOnce(fakeUser);

    render(<AuthScreen onAuthSuccess={mockOnAuthSuccess} />);
    
    const emailInput = screen.getByLabelText(/^email address$/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(signInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockOnAuthSuccess).toHaveBeenCalledWith(fakeUser);
    });
  });

  it('displays custom friendly message if email/password login credentials fail', async () => {
    const error: any = new Error("auth/user-not-found");
    error.code = "auth/user-not-found";
    vi.mocked(signInWithEmail).mockRejectedValueOnce(error);

    render(<AuthScreen onAuthSuccess={mockOnAuthSuccess} />);
    
    const emailInput = screen.getByLabelText(/^email address$/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'missing@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/We couldn't find an account with that email. Would you like to sign up\?/i)).toBeDefined();
    });
  });

  it('renders and processes the Password Reset recovery request flow', async () => {
    vi.mocked(resetPassword).mockResolvedValueOnce(undefined);

    render(<AuthScreen onAuthSuccess={mockOnAuthSuccess} />);
    
    // Trigger forgot password view transition
    fireEvent.click(screen.getByRole('button', { name: /forgot password\?/i }));

    expect(screen.getByText(/recover password/i)).toBeDefined();
    
    const emailInput = screen.getByLabelText(/^email address$/i);
    const submitBtn = screen.getByRole('button', { name: /reset/i });

    fireEvent.change(emailInput, { target: { value: 'recover@example.com' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith('recover@example.com');
      // Should show success toast
      expect(screen.getByText(/A secure password recovery link has been dispatched/i)).toBeDefined();
    });
  });
});
