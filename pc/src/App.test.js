jest.mock('axios', () => {
  const mock = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    create: () => mock,
  };
  return { __esModule: true, default: mock, ...mock };
});

import { render, screen } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './context/AuthContext';

jest.mock('./api/auth/me', () => {
  return {
    __esModule: true,
    default: async () => ({ success: false, userInfo: null }),
  };
});

test('app renders header', () => {
  render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
  expect(screen.getByText('Messenger')).toBeInTheDocument();
});
