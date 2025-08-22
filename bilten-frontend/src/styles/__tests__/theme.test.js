import themeDefault, { components, getThemeClasses, colors, typography, spacing, borderRadius, shadows, breakpoints, animations, zIndex } from '../theme';

describe('styles/theme', () => {
  test('exports default and named tokens', () => {
    expect(themeDefault).toBeTruthy();
    expect(colors.primary[500]).toBeDefined();
    expect(typography.fontSizes.base).toBe('1rem');
    expect(spacing[4]).toBe('1rem');
    expect(borderRadius.md).toBeDefined();
    expect(shadows.base).toBeDefined();
    expect(breakpoints.md).toBe('768px');
    expect(animations.normal).toBe('300ms');
    expect(zIndex.modal).toBe(40);
  });

  test('getThemeClasses returns combined for known component object', () => {
    const cardCombined = getThemeClasses('card');
    expect(cardCombined).toContain('rounded');
    expect(cardCombined).toContain('border');
  });

  test('getThemeClasses respects variant when provided', () => {
    const inputFocus = getThemeClasses('input', 'focus');
    expect(inputFocus).toContain('focus:ring');
  });

  test('getThemeClasses returns empty string for unknown component', () => {
    expect(getThemeClasses('nonexistent')).toBe('');
  });

  test('components include expected keys', () => {
    expect(components).toHaveProperty('page');
    expect(components).toHaveProperty('card');
    expect(components).toHaveProperty('button');
    expect(components).toHaveProperty('input');
    expect(components).toHaveProperty('text');
  });
});


