import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Chạy cleanup sau mỗi test case
afterEach(() => {
  cleanup();
});
