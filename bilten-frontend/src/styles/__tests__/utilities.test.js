import {
  cn,
  themeClass,
  pageClasses,
  cardClasses,
  buttonClasses,
  inputClasses,
  textClasses,
  loadingSpinnerClasses,
  errorClasses,
  errorTextClasses,
  successClasses,
  successTextClasses,
  iconClasses,
  containerClasses,
  sectionClasses,
  getValidationClasses,
  responsiveClasses,
  fadeInClasses,
  slideUpClasses,
  modalOverlayClasses,
  modalContentClasses,
  dropdownClasses,
  badgeClasses
} from '../utilities';

describe('styles/utilities', () => {
  test('cn joins truthy classes, normalizes spaces, trims', () => {
    expect(cn('a', false && 'b', 'c  d', null, undefined, '', 'e')).toBe('a c d e');
  });

  test('themeClass combines base, light, and dark classes', () => {
    expect(themeClass('base', 'light', 'dark')).toBe('base light dark:dark');
    expect(themeClass('base')).toBe('base');
  });

  test('responsiveClasses builds md and lg prefixes correctly', () => {
    expect(responsiveClasses('a', 'b', 'c')).toBe('a md:b lg:c');
    expect(responsiveClasses('a', '', 'c')).toBe('a lg:c');
  });

  test('containerClasses returns size plus shared paddings', () => {
    expect(containerClasses('sm')).toContain('max-w-2xl');
    expect(containerClasses('default')).toContain('max-w-7xl');
    expect(containerClasses('lg')).toContain('max-w-screen-xl');
    expect(containerClasses('full')).toContain('max-w-full');
    const shared = 'mx-auto px-4 sm:px-6 lg:px-8';
    expect(containerClasses('sm')).toContain(shared);
  });

  test('getValidationClasses toggles error class when touched+error', () => {
    const err = { email: 'Required' };
    const touched = { email: true };
    const ok = { email: null };
    const notTouched = { email: false };

    const withError = getValidationClasses('email', err, touched);
    expect(withError.error).toContain('text-red-600');
    expect(withError.input).toContain('border-red');

    const withoutError = getValidationClasses('email', ok, notTouched);
    expect(withoutError.error).toBe('hidden');
  });

  test('buttonClasses includes base button class and variant bits', () => {
    const primarySm = buttonClasses('primary', 'sm');
    expect(primarySm).toContain('inline-flex');
    expect(primarySm).toContain('text-white');
    expect(primarySm).toContain('px-3 py-1.5');
  });

  test('inputClasses toggles error classes', () => {
    expect(inputClasses(true)).toContain('border-red');
    expect(inputClasses(false)).toMatch(/border.*focus/);
  });

  test('textClasses returns defined variant or primary fallback', () => {
    expect(textClasses('secondary')).toContain('text-gray');
    expect(textClasses('unknown')).toContain('text-gray-900');
  });

  test('loading/error/success and icon utilities return expected fragments', () => {
    expect(loadingSpinnerClasses('lg')).toContain('h-12 w-12');
    expect(errorClasses()).toContain('rounded-lg');
    expect(errorTextClasses()).toContain('text-red');
    expect(successClasses()).toContain('rounded-lg');
    expect(successTextClasses()).toContain('text-green');
    expect(iconClasses('accent')).toContain('primary');
  });

  test('sectionClasses returns spacing token', () => {
    expect(sectionClasses('sm')).toBe('py-8');
    expect(sectionClasses('xl')).toBe('py-24');
  });

  test('pageClasses/cardClasses etc return strings', () => {
    expect(typeof pageClasses()).toBe('string');
    expect(typeof cardClasses()).toBe('string');
    expect(typeof modalOverlayClasses).toBe('string');
    expect(typeof modalContentClasses).toBe('string');
    expect(typeof dropdownClasses).toBe('string');
    expect(typeof badgeClasses()).toBe('string');
  });

  test('animation utility class names are exported', () => {
    expect(fadeInClasses).toBe('animate-fade-in');
    expect(slideUpClasses).toBe('animate-slide-up');
  });
});


