import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import * as Google from 'expo-auth-session/providers/google';
import { router } from 'expo-router';

// Mock expo-web-browser
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

// Mock expo-auth-session/providers/google
const mockPromptAsync = jest.fn();
jest.mock('expo-auth-session/providers/google', () => ({
  useAuthRequest: jest.fn(() => [
    { url: 'https://accounts.google.com/...' },
    null,
    mockPromptAsync,
  ]),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));

// Mock FinanceContext
const mockGoogleSignIn = jest.fn();
jest.mock('../hooks/FinanceContext', () => ({
  useFinance: () => ({
    googleSignIn: mockGoogleSignIn,
    user: null,
    loading: false,
    txns: [],
    budgets: {},
    goals: [],
    nw: { assets: [], liabilities: [] },
    recurring: [],
    currency: { code: 'INR', symbol: '₹', locale: 'en-IN' },
  }),
}));

import LoginScreen from '../app/login';

beforeEach(() => {
  jest.clearAllMocks();
  (Google.useAuthRequest as jest.Mock).mockReturnValue([
    { url: 'https://accounts.google.com/...' },
    null,
    mockPromptAsync,
  ]);
});

test('renders Sign in with Google button', () => {
  const { getByText } = render(<LoginScreen />);
  expect(getByText('Sign in with Google')).toBeTruthy();
});

test('renders Finance logo and welcome text', () => {
  const { getByText } = render(<LoginScreen />);
  expect(getByText('Finance')).toBeTruthy();
  expect(getByText('Welcome')).toBeTruthy();
});

test('tapping button calls promptAsync', () => {
  const { getByText } = render(<LoginScreen />);
  fireEvent.press(getByText('Sign in with Google'));
  expect(mockPromptAsync).toHaveBeenCalledTimes(1);
});

test('routes to /(tabs) on successful Google sign-in', async () => {
  mockGoogleSignIn.mockResolvedValue(null);
  (Google.useAuthRequest as jest.Mock).mockReturnValue([
    { url: 'https://accounts.google.com/...' },
    { type: 'success', authentication: { accessToken: 'tok123', expiresIn: 3600 } },
    mockPromptAsync,
  ]);
  render(<LoginScreen />);
  await waitFor(() => {
    expect(mockGoogleSignIn).toHaveBeenCalledWith('tok123', 3600);
    expect(router.replace).toHaveBeenCalledWith('/(tabs)');
  });
});

test('shows error when googleSignIn returns an error string', async () => {
  mockGoogleSignIn.mockResolvedValue('Failed to get user info from Google.');
  (Google.useAuthRequest as jest.Mock).mockReturnValue([
    { url: 'https://accounts.google.com/...' },
    { type: 'success', authentication: { accessToken: 'tok123', expiresIn: 3600 } },
    mockPromptAsync,
  ]);
  const { findByText } = render(<LoginScreen />);
  const errorMsg = await findByText('Failed to get user info from Google.');
  expect(errorMsg).toBeTruthy();
});
