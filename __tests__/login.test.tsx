import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Mock expo-web-browser
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

// Mock expo-auth-session/providers/google
const mockPromptAsync = jest.fn();
jest.mock('expo-auth-session/providers/google', () => ({
  useAuthRequest: jest.fn(() => [
    { url: 'https://accounts.google.com/...' }, // request (truthy = ready)
    null, // response (no response yet)
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
