import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../app/login';
import { FinanceContext } from '../hooks/FinanceContext';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));

const mockLogin    = jest.fn();
const mockRegister = jest.fn();

const mockCtx = {
  user: null, loading: false,
  txns: [], budgets: {}, goals: [], nw: { assets: [], liabilities: [] },
  recurring: [], currency: { code: 'INR', symbol: '₹', locale: 'en-IN' },
  login: mockLogin, register: mockRegister,
  logout: jest.fn(), addTxn: jest.fn(), editTxn: jest.fn(), deleteTxn: jest.fn(),
  setBudgets: jest.fn(), setGoals: jest.fn(), setNw: jest.fn(),
  setRecurring: jest.fn(), setCurrencyPref: jest.fn(),
  openAdd: jest.fn(), openEdit: jest.fn(), modalVisible: false, editItem: null, closeModal: jest.fn(),
};

function renderLogin() {
  return render(
    <FinanceContext.Provider value={mockCtx as any}>
      <LoginScreen />
    </FinanceContext.Provider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockLogin.mockResolvedValue(null);
  mockRegister.mockResolvedValue(null);
});

it('renders login form by default', () => {
  renderLogin();
  expect(screen.getByText('Welcome back')).toBeTruthy();
  expect(screen.getByPlaceholderText('Username')).toBeTruthy();
  expect(screen.getByPlaceholderText('Password')).toBeTruthy();
  expect(screen.getByText('Sign In')).toBeTruthy();
});

it('shows error when fields are empty', async () => {
  renderLogin();
  fireEvent.press(screen.getByText('Sign In'));
  await waitFor(() => {
    expect(screen.getByText('Please fill in all fields.')).toBeTruthy();
  });
});

it('calls login with username and password', async () => {
  renderLogin();
  fireEvent.changeText(screen.getByPlaceholderText('Username'), 'alice');
  fireEvent.changeText(screen.getByPlaceholderText('Password'), 'secret');
  fireEvent.press(screen.getByText('Sign In'));
  await waitFor(() => {
    expect(mockLogin).toHaveBeenCalledWith('alice', 'secret');
  });
});

it('shows error message returned by login', async () => {
  mockLogin.mockResolvedValue('Invalid username or password.');
  renderLogin();
  fireEvent.changeText(screen.getByPlaceholderText('Username'), 'alice');
  fireEvent.changeText(screen.getByPlaceholderText('Password'), 'wrong');
  fireEvent.press(screen.getByText('Sign In'));
  await waitFor(() => {
    expect(screen.getByText('Invalid username or password.')).toBeTruthy();
  });
});

it('switches to register mode', () => {
  renderLogin();
  fireEvent.press(screen.getByText("Don't have an account? Register"));
  expect(screen.getByText('Create account')).toBeTruthy();
  expect(screen.getByText('Register')).toBeTruthy();
});
