import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock simple de elementos de Next.js si es necesario
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));
