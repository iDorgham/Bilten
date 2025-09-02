const RegistrationService = require('../services/RegistrationService');
const UserAccount = require('../models/UserAccount');
const EmailService = require('../services/EmailService');
const { query } = require('../database/connection');
const bcrypt = require('bcryptjs');

// Mock dependencies
jest.mock('../models/UserAccount');
jest.mock('../services/EmailService');
jest.mock('../database/connection');
jest.mock('bcryptjs');
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => '1e0a7a7a055beba0ab59821e0b01e76e176de480983ecb59c4f36801854bd172')
  }))
}));

describe('RegistrationService', () => {
  let registrationService;
  let mockUserAccount;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    mockUserAccount = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    };
    UserAccount.mockImplementation(() => mockUserAccount);
    
    registrationService = new RegistrationService();
    
    // Mock bcrypt
    bcrypt.genSalt.mockResolvedValue('mock-salt');
    bcrypt.hash.mockResolvedValue('mock-hash');
    
    // Mock query function
    query.mockResolvedValue({ rows: [] });
  });

  describe('registerUser', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      first_name: 'John',
      last_name: 'Doe',
      timezone: 'UTC',
      locale: 'en'
    };

    it('should successfully register a new user', async () => {
      // Mock user doesn't exist
      mockUserAccount.findByEmail.mockResolvedValue(null);
      
      // Mock successful user creation
      const mockCreatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        status: 'pending_verification',
        email_verified: false,
        password_hash: 'mock-hash',
        password_salt: 'mock-salt'
      };
      mockUserAccount.create.mockResolvedValue(mockCreatedUser);
      
      // Mock email service
      EmailService.sendVerificationEmail.mockResolvedValue({ success: true });
      
      // Mock token generation and activity logging
      query.mockResolvedValueOnce({ rows: [] }); // For token insertion
      query.mockResolvedValueOnce({ rows: [] }); // For activity logging

      const result = await registrationService.registerUser(validUserData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('message');
      expect(result.user).not.toHaveProperty('password_hash');
      expect(result.user).not.toHaveProperty('password_salt');
      expect(mockUserAccount.findByEmail).toHaveBeenCalledWith('test@example.com', false);
      expect(mockUserAccount.create).toHaveBeenCalled();
    });

    it('should throw error if user already exists', async () => {
      // Mock existing user
      mockUserAccount.findByEmail.mockResolvedValue({ id: 'existing-user' });

      await expect(registrationService.registerUser(validUserData))
        .rejects.toThrow('User with this email already exists');
      
      expect(mockUserAccount.findByEmail).toHaveBeenCalledWith('test@example.com', false);
      expect(mockUserAccount.create).not.toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const invalidData = { email: 'test@example.com' };

      await expect(registrationService.registerUser(invalidData))
        .rejects.toThrow('Email, password, first name, and last name are required');
    });

    it('should validate email format', async () => {
      const invalidEmailData = {
        ...validUserData,
        email: 'invalid-email'
      };

      await expect(registrationService.registerUser(invalidEmailData))
        .rejects.toThrow('Invalid email format');
    });

    it('should validate password strength', async () => {
      const weakPasswordData = {
        ...validUserData,
        password: 'weak'
      };

      await expect(registrationService.registerUser(weakPasswordData))
        .rejects.toThrow('Password must be at least 8 characters long');
    });

    it('should validate name lengths', async () => {
      const invalidNameData = {
        ...validUserData,
        first_name: 'A'
      };

      await expect(registrationService.registerUser(invalidNameData))
        .rejects.toThrow('First name must be between 2 and 50 characters');
    });

    it('should handle email sending failure gracefully', async () => {
      // Mock user doesn't exist
      mockUserAccount.findByEmail.mockResolvedValue(null);
      
      // Mock successful user creation
      const mockCreatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        password_hash: 'mock-hash',
        password_salt: 'mock-salt'
      };
      mockUserAccount.create.mockResolvedValue(mockCreatedUser);
      
      // Mock email service failure
      EmailService.sendVerificationEmail.mockRejectedValue(new Error('Email service error'));
      
      // Mock token generation and activity logging
      query.mockResolvedValueOnce({ rows: [] }); // For token insertion
      query.mockResolvedValueOnce({ rows: [] }); // For activity logging

      const result = await registrationService.registerUser(validUserData);

      expect(result).toHaveProperty('user');
      expect(result.emailSent).toBe(false);
    });
  });

  describe('verifyEmail', () => {
    it('should successfully verify email with valid token', async () => {
      const mockTokenData = {
        id: 'token-123',
        user_id: 'user-123',
        email: 'test@example.com',
        first_name: 'John'
      };

      // Mock token validation
      query.mockResolvedValueOnce({ rows: [mockTokenData] });
      
      // Mock token update
      query.mockResolvedValueOnce({ rows: [] });
      
      // Mock activity logging
      query.mockResolvedValueOnce({ rows: [] });
      
      // Mock user update
      const mockUpdatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_verified: true,
        status: 'active'
      };
      mockUserAccount.update.mockResolvedValue(mockUpdatedUser);

      const result = await registrationService.verifyEmail('valid-token');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('message');
      expect(result.user.email_verified).toBe(true);
      expect(result.user.status).toBe('active');
    });

    it('should throw error for invalid token', async () => {
      // Mock no token found
      query.mockResolvedValueOnce({ rows: [] });

      await expect(registrationService.verifyEmail('invalid-token'))
        .rejects.toThrow('Invalid or expired verification token');
    });
  });

  describe('resendVerificationEmail', () => {
    it('should successfully resend verification email', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        email_verified: false,
        status: 'pending_verification'
      };

      // Mock user exists
      mockUserAccount.findByEmail.mockResolvedValue(mockUser);
      
      // Mock rate limiting check (no recent tokens)
      query.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      
      // Mock token invalidation
      query.mockResolvedValueOnce({ rows: [] });
      
      // Mock token generation
      query.mockResolvedValueOnce({ rows: [] });
      
      // Mock activity logging
      query.mockResolvedValueOnce({ rows: [] });
      
      // Mock email service
      EmailService.sendVerificationEmail.mockResolvedValue({ success: true });

      const result = await registrationService.resendVerificationEmail('test@example.com');

      expect(result).toHaveProperty('message');
      expect(EmailService.sendVerificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        'John',
        expect.any(String)
      );
    });

    it('should throw error if user not found', async () => {
      mockUserAccount.findByEmail.mockResolvedValue(null);

      await expect(registrationService.resendVerificationEmail('nonexistent@example.com'))
        .rejects.toThrow('User not found');
    });

    it('should throw error if email already verified', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_verified: true
      };

      mockUserAccount.findByEmail.mockResolvedValue(mockUser);

      await expect(registrationService.resendVerificationEmail('test@example.com'))
        .rejects.toThrow('Email is already verified');
    });

    it('should enforce rate limiting', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_verified: false,
        status: 'pending_verification'
      };

      mockUserAccount.findByEmail.mockResolvedValue(mockUser);
      
      // Mock rate limiting check (too many recent tokens)
      query.mockResolvedValueOnce({ rows: [{ count: '3' }] });

      await expect(registrationService.resendVerificationEmail('test@example.com'))
        .rejects.toThrow('Too many verification emails sent');
    });
  });

  describe('checkEmailAvailability', () => {
    it('should return available for new email', async () => {
      mockUserAccount.findByEmail.mockResolvedValue(null);

      const result = await registrationService.checkEmailAvailability('new@example.com');

      expect(result.available).toBe(true);
      expect(result.email).toBe('new@example.com');
      expect(mockUserAccount.findByEmail).toHaveBeenCalledWith('new@example.com', true, true);
    });

    it('should return unavailable for existing email', async () => {
      mockUserAccount.findByEmail.mockResolvedValue({ id: 'existing-user' });

      const result = await registrationService.checkEmailAvailability('existing@example.com');

      expect(result.available).toBe(false);
      expect(result.email).toBe('existing@example.com');
      expect(mockUserAccount.findByEmail).toHaveBeenCalledWith('existing@example.com', true, true);
    });

    it('should normalize email to lowercase', async () => {
      mockUserAccount.findByEmail.mockResolvedValue(null);

      const result = await registrationService.checkEmailAvailability('Test@Example.COM');

      expect(result.email).toBe('test@example.com');
      expect(mockUserAccount.findByEmail).toHaveBeenCalledWith('test@example.com', true, true);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept strong password', () => {
      expect(() => {
        registrationService.validatePasswordStrength('SecurePass123!');
      }).not.toThrow();
    });

    it('should reject short password', () => {
      expect(() => {
        registrationService.validatePasswordStrength('Short1!');
      }).toThrow('Password must be at least 8 characters long');
    });

    it('should reject password without uppercase', () => {
      expect(() => {
        registrationService.validatePasswordStrength('lowercase123!');
      }).toThrow('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase', () => {
      expect(() => {
        registrationService.validatePasswordStrength('UPPERCASE123!');
      }).toThrow('Password must contain at least one lowercase letter');
    });

    it('should reject password without number', () => {
      expect(() => {
        registrationService.validatePasswordStrength('NoNumbers!');
      }).toThrow('Password must contain at least one number');
    });

    it('should reject password without special character', () => {
      expect(() => {
        registrationService.validatePasswordStrength('NoSpecial123');
      }).toThrow('Password must contain at least one special character');
    });

    it('should reject common passwords', () => {
      expect(() => {
        registrationService.validatePasswordStrength('Password123!');
      }).toThrow('Password is too common');
    });

    it('should reject very long password', () => {
      const longPassword = 'A'.repeat(129) + '1!';
      expect(() => {
        registrationService.validatePasswordStrength(longPassword);
      }).toThrow('Password must be less than 128 characters');
    });
  });

  describe('validateRegistrationData', () => {
    it('should accept valid data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        first_name: 'John',
        last_name: 'Doe'
      };

      expect(() => {
        registrationService.validateRegistrationData(validData);
      }).not.toThrow();
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        email: 'test@example.com'
      };

      expect(() => {
        registrationService.validateRegistrationData(invalidData);
      }).toThrow('Email, password, first name, and last name are required');
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        first_name: 'John',
        last_name: 'Doe'
      };

      expect(() => {
        registrationService.validateRegistrationData(invalidData);
      }).toThrow('Invalid email format');
    });

    it('should reject names with invalid characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        first_name: 'John123',
        last_name: 'Doe'
      };

      expect(() => {
        registrationService.validateRegistrationData(invalidData);
      }).toThrow('Names can only contain letters, spaces, hyphens, apostrophes, and periods');
    });
  });

  describe('getRegistrationStats', () => {
    it('should return registration statistics', async () => {
      const mockStats = {
        total_registrations: '100',
        verified_users: '85',
        active_users: '80',
        pending_users: '15',
        verification_rate: '85.00'
      };

      query.mockResolvedValue({ rows: [mockStats] });

      const result = await registrationService.getRegistrationStats();

      expect(result).toEqual(mockStats);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(*) as total_registrations'),
        expect.any(Array),
        true
      );
    });
  });

  describe('generateEmailVerificationToken', () => {
    it('should generate and store verification token', async () => {
      query.mockResolvedValue({ rows: [] });

      const token = await registrationService.generateEmailVerificationToken('user-123');

      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes as hex = 64 characters
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO authentication.verification_tokens'),
        expect.arrayContaining(['user-123', token, 'email', expect.any(Date)])
      );
    });
  });
});