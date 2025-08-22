import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggle from '../ThemeToggle';

// Mock LanguageContext to provide t()
jest.mock('../../context/LanguageContext', () => ({
  __esModule: true,
  useLanguage: () => ({ t: (k) => k })
}));

// Mock heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  SunIcon: (props) => <svg data-testid="sun" {...props} />,
  MoonIcon: (props) => <svg data-testid="moon" {...props} />,
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    // Reset environment
    document.documentElement.classList.remove('dark');
    localStorage.clear();
    // Force matchMedia to return false
    window.matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {} });
  });

  test('toggles theme and updates document class/localStorage', () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole('button');

    // Initially light
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');

    fireEvent.click(btn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');

    fireEvent.click(btn);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });
});


