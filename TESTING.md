# Testing Guide

This project uses **Jest** and **React Testing Library** for testing React components and utilities.

## Setup

The testing setup is already configured. Dependencies include:
- `jest` - Testing framework
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Custom Jest matchers for DOM
- `@testing-library/user-event` - User interaction simulation
- `ts-jest` - TypeScript support for Jest
- `jest-environment-jsdom` - DOM environment for tests

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test File Structure

Tests should be placed in one of the following locations:
- `__tests__` folder next to the component/utility
- Same directory with `.test.ts` or `.test.tsx` extension
- Same directory with `.spec.ts` or `.spec.tsx` extension

Example:
```
src/
  components/
    ui/
      button.tsx
      __tests__/
        button.test.tsx
  lib/
    utils.ts
    __tests__/
      utils.test.ts
```

## Writing Tests

### Example: Testing a Utility Function

```typescript
import { cn } from '../utils';

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });
});
```

### Example: Testing a React Component

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Example: Testing a Context Provider

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from '../ThemeContext';

function TestComponent() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}

describe('ThemeContext', () => {
  it('should provide theme context', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
  });
});
```

## Testing Best Practices

1. **Test user behavior, not implementation details**
   - Focus on what users see and interact with
   - Use `getByRole`, `getByLabelText`, etc. instead of `getByTestId` when possible

2. **Use `userEvent` for interactions**
   - More realistic than `fireEvent`
   - Better simulates actual user behavior

3. **Keep tests isolated**
   - Each test should be independent
   - Use `beforeEach` to set up common test state

4. **Test accessibility**
   - Use semantic queries (`getByRole`, `getByLabelText`)
   - Verify ARIA attributes when relevant

5. **Mock external dependencies**
   - Mock API calls, localStorage, etc.
   - Use `jest.fn()` for function mocks

## Configuration

The Jest configuration is in `jest.config.cjs`. Key settings:
- Uses `ts-jest` for TypeScript support
- `jsdom` environment for DOM testing
- Path alias `@/` mapped to `src/`
- CSS and asset files are mocked
- Setup file: `src/setupTests.ts`

## Coverage

To generate a coverage report:
```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory. Open `coverage/index.html` in a browser to view the interactive report.

## Example Test Files

See the following example test files:
- `src/lib/__tests__/utils.test.ts` - Utility function tests
- `src/components/ui/__tests__/button.test.tsx` - Component tests
- `src/context/__tests__/ThemeContext.test.tsx` - Context provider tests

