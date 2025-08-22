import { render, screen, fireEvent } from '@testing-library/react';
import LanguageDropdown from '../LanguageDropdown';

jest.mock('@heroicons/react/24/outline', () => ({ ChevronDownIcon: (p) => <svg data-testid="chev" {...p} /> }));

jest.mock('../../context/LanguageContext', () => {
  const changeFn = jest.fn();
  return {
    __esModule: true,
    useLanguage: () => ({
      currentLanguage: 'en',
      languages: [
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
      ],
      changeLanguage: changeFn,
      t: (k) => k,
    }),
    __mockChangeLanguage: changeFn,
  };
});

import { __mockChangeLanguage } from '../../context/LanguageContext';

describe('LanguageDropdown', () => {
  test('opens dropdown and selects language', () => {
    render(<LanguageDropdown />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    const fr = screen.getByText('Français');
    fireEvent.click(fr);
    expect(__mockChangeLanguage).toHaveBeenCalledWith('fr');
  });
});


