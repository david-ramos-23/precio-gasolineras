import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'node',
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react' } }] },
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
};

export default createJestConfig(config);
