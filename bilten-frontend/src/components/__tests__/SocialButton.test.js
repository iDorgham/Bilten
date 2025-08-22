import { render, screen, fireEvent } from '@testing-library/react';
import SocialButton from '../SocialButton';

describe('SocialButton', () => {
  test('renders children and handles click', () => {
    const onClick = jest.fn();
    render(<SocialButton social="google" onClick={onClick}>Continue with Google</SocialButton>);
    expect(screen.getByText(/Continue with Google/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });

  test('applies disabled state', () => {
    render(<SocialButton social="facebook" disabled>Facebook</SocialButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});


