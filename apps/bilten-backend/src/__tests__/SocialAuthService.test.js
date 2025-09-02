const SocialAuthService = require("../services/SocialAuthService");
const UserAccount = require("../models/UserAccount");
const { query } = require("../database/connection");
const axios = require("axios");
const jwt = require("jsonwebtoken");

// Mock dependencies
jest.mock("../models/UserAccount");
jest.mock("../database/connection");
jest.mock("axios");
jest.mock("jsonwebtoken");

describe("SocialAuthService", () => {
  let socialAuthService;
  let mockUserAccount;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock environment variables first
    process.env.GOOGLE_CLIENT_ID = "google-client-id";
    process.env.GOOGLE_CLIENT_SECRET = "google-client-secret";
    process.env.FACEBOOK_CLIENT_ID = "facebook-client-id";
    process.env.FACEBOOK_CLIENT_SECRET = "facebook-client-secret";
    process.env.APPLE_CLIENT_ID = "apple-client-id";
    process.env.APPLE_CLIENT_SECRET = "apple-client-secret";
    process.env.LINKEDIN_CLIENT_ID = "linkedin-client-id";
    process.env.LINKEDIN_CLIENT_SECRET = "linkedin-client-secret";
    process.env.API_BASE_URL = "https://api.example.com";

    mockUserAccount = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    UserAccount.mockImplementation(() => mockUserAccount);

    socialAuthService = new SocialAuthService();

    // Mock query function
    query.mockResolvedValue({ rows: [] });
  });

  describe("getAuthorizationUrl", () => {
    it("should generate Google authorization URL", () => {
      const url = socialAuthService.getAuthorizationUrl("google", "state123");

      expect(url).toContain("https://accounts.google.com/o/oauth2/v2/auth");
      expect(url).toContain("client_id=google-client-id");
      expect(url).toContain("state=state123");
      expect(url).toContain("scope=openid+email+profile");
    });

    it("should generate Facebook authorization URL", () => {
      const url = socialAuthService.getAuthorizationUrl("facebook", "state123");

      expect(url).toContain("https://www.facebook.com/v18.0/dialog/oauth");
      expect(url).toContain("client_id=facebook-client-id");
      expect(url).toContain("scope=email+public_profile");
    });

    it("should generate Apple authorization URL with response_mode", () => {
      const url = socialAuthService.getAuthorizationUrl("apple", "state123");

      expect(url).toContain("https://appleid.apple.com/auth/authorize");
      expect(url).toContain("response_mode=form_post");
    });

    it("should throw error for unsupported provider", () => {
      expect(() => {
        socialAuthService.getAuthorizationUrl("unsupported", "state123");
      }).toThrow("Unsupported OAuth provider: unsupported");
    });
  });

  describe("exchangeCodeForToken", () => {
    it("should exchange code for Google token", async () => {
      const mockTokenResponse = {
        data: {
          access_token: "access-token",
          token_type: "Bearer",
          expires_in: 3600,
        },
      };

      axios.post.mockResolvedValue(mockTokenResponse);

      const result = await socialAuthService.exchangeCodeForToken(
        "google",
        "auth-code"
      );

      expect(result).toEqual(mockTokenResponse.data);
      expect(axios.post).toHaveBeenCalledWith(
        "https://oauth2.googleapis.com/token",
        expect.objectContaining({
          client_id: "google-client-id",
          client_secret: "google-client-secret",
          code: "auth-code",
          grant_type: "authorization_code",
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/x-www-form-urlencoded",
          }),
        })
      );
    });

    it("should throw error when no access token received", async () => {
      axios.post.mockResolvedValue({ data: {} });

      await expect(
        socialAuthService.exchangeCodeForToken("google", "auth-code")
      ).rejects.toThrow("No access token received from provider");
    });

    it("should throw error for unsupported provider", async () => {
      await expect(
        socialAuthService.exchangeCodeForToken("unsupported", "auth-code")
      ).rejects.toThrow("Unsupported OAuth provider: unsupported");
    });
  });

  describe("getUserInfo", () => {
    it("should get Google user info", async () => {
      const mockGoogleUser = {
        id: "google-123",
        email: "user@gmail.com",
        given_name: "John",
        family_name: "Doe",
        name: "John Doe",
        picture: "https://example.com/avatar.jpg",
        verified_email: true,
      };

      axios.get.mockResolvedValue({ data: mockGoogleUser });

      const result = await socialAuthService.getUserInfo(
        "google",
        "access-token"
      );

      expect(result).toEqual({
        id: "google-123",
        email: "user@gmail.com",
        firstName: "John",
        lastName: "Doe",
        displayName: "John Doe",
        avatar: "https://example.com/avatar.jpg",
        emailVerified: true,
      });

      expect(axios.get).toHaveBeenCalledWith(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        expect.objectContaining({
          headers: { Authorization: "Bearer access-token" },
        })
      );
    });

    it("should get Facebook user info", async () => {
      const mockFacebookUser = {
        id: "facebook-123",
        email: "user@facebook.com",
        name: "Jane Smith",
        picture: {
          data: {
            url: "https://facebook.com/avatar.jpg",
          },
        },
      };

      axios.get.mockResolvedValue({ data: mockFacebookUser });

      const result = await socialAuthService.getUserInfo(
        "facebook",
        "access-token"
      );

      expect(result).toEqual({
        id: "facebook-123",
        email: "user@facebook.com",
        firstName: "Jane",
        lastName: "Smith",
        displayName: "Jane Smith",
        avatar: "https://facebook.com/avatar.jpg",
        emailVerified: true,
      });
    });

    it("should get Apple user info from ID token", async () => {
      const mockAppleToken = {
        sub: "apple-123",
        email: "user@icloud.com",
        email_verified: true,
        name: {
          firstName: "Bob",
          lastName: "Johnson",
        },
      };

      jwt.decode.mockReturnValue(mockAppleToken);

      const result = await socialAuthService.getUserInfo("apple", "id-token");

      expect(result).toEqual({
        id: "apple-123",
        email: "user@icloud.com",
        firstName: "Bob",
        lastName: "Johnson",
        displayName: "Bob Johnson",
        avatar: null,
        emailVerified: true,
      });
    });

    it("should throw error for unsupported provider", async () => {
      await expect(
        socialAuthService.getUserInfo("unsupported", "token")
      ).rejects.toThrow("Unsupported provider: unsupported");
    });
  });

  describe("findOrCreateUser", () => {
    const mockUserInfo = {
      id: "provider-123",
      email: "user@example.com",
      firstName: "John",
      lastName: "Doe",
      displayName: "John Doe",
      avatar: "https://example.com/avatar.jpg",
      emailVerified: true,
    };

    it("should return existing user with social account", async () => {
      const mockUser = {
        id: "user-123",
        email: "user@example.com",
        first_name: "John",
        last_name: "Doe",
      };

      const mockSocialAccount = {
        id: "social-123",
        user_id: "user-123",
        provider: "google",
        provider_id: "provider-123",
      };

      // Mock finding user by social account
      query.mockResolvedValueOnce({ rows: [mockUser] });

      // Mock updating social account
      query.mockResolvedValueOnce({ rows: [mockSocialAccount] });

      const result = await socialAuthService.findOrCreateUser(
        "google",
        mockUserInfo
      );

      expect(result.user).toEqual(mockUser);
      expect(result.socialAccount).toEqual(mockSocialAccount);
      expect(result.isNewUser).toBe(false);
    });

    it("should link social account to existing user by email", async () => {
      const mockUser = {
        id: "user-123",
        email: "user@example.com",
        first_name: "John",
        last_name: "Doe",
      };

      const mockSocialAccount = {
        id: "social-123",
        user_id: "user-123",
        provider: "google",
        provider_id: "provider-123",
      };

      // Mock no user found by social account
      query.mockResolvedValueOnce({ rows: [] });

      // Mock finding user by email
      mockUserAccount.findByEmail.mockResolvedValue(mockUser);

      // Mock creating social account
      query.mockResolvedValueOnce({ rows: [mockSocialAccount] });

      const result = await socialAuthService.findOrCreateUser(
        "google",
        mockUserInfo
      );

      expect(result.user).toEqual(mockUser);
      expect(result.socialAccount).toEqual(mockSocialAccount);
      expect(result.isNewUser).toBe(false);
    });

    it("should create new user and social account", async () => {
      const mockUser = {
        id: "user-123",
        email: "user@example.com",
        first_name: "John",
        last_name: "Doe",
        status: "active",
        email_verified: true,
      };

      const mockSocialAccount = {
        id: "social-123",
        user_id: "user-123",
        provider: "google",
        provider_id: "provider-123",
      };

      // Mock no user found by social account
      query.mockResolvedValueOnce({ rows: [] });

      // Mock no user found by email
      mockUserAccount.findByEmail.mockResolvedValue(null);

      // Mock creating user
      mockUserAccount.create.mockResolvedValue(mockUser);

      // Mock creating social account
      query.mockResolvedValueOnce({ rows: [mockSocialAccount] });

      const result = await socialAuthService.findOrCreateUser(
        "google",
        mockUserInfo
      );

      expect(result.user).toEqual(mockUser);
      expect(result.socialAccount).toEqual(mockSocialAccount);
      expect(result.isNewUser).toBe(true);

      expect(mockUserAccount.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "user@example.com",
          first_name: "John",
          last_name: "Doe",
          status: "active",
          email_verified: true,
          sso_provider: "google",
          sso_subject: "provider-123",
        })
      );
    });
  });

  describe("handleOAuthCallback", () => {
    it("should handle successful OAuth callback", async () => {
      const mockTokenData = { access_token: "access-token" };
      const mockUserInfo = {
        id: "provider-123",
        email: "user@example.com",
        firstName: "John",
        lastName: "Doe",
        displayName: "John Doe",
        emailVerified: true,
      };
      const mockUser = {
        id: "user-123",
        email: "user@example.com",
        first_name: "John",
        last_name: "Doe",
      };
      const mockSocialAccount = { id: "social-123" };

      // Mock token exchange
      axios.post.mockResolvedValue({ data: mockTokenData });

      // Mock getting user info
      axios.get.mockResolvedValue({
        data: {
          id: "provider-123",
          email: "user@example.com",
          given_name: "John",
          family_name: "Doe",
          name: "John Doe",
          verified_email: true,
        },
      });

      // Mock finding/creating user
      query.mockResolvedValueOnce({ rows: [mockUser] }); // findUserBySocialAccount
      query.mockResolvedValueOnce({ rows: [mockSocialAccount] }); // updateSocialAccount
      query.mockResolvedValueOnce({ rows: [] }); // logSocialAuthActivity

      const result = await socialAuthService.handleOAuthCallback(
        "google",
        "auth-code",
        "state123"
      );

      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("socialAccount");
      expect(result).toHaveProperty("isNewUser");
      expect(result).toHaveProperty("message");
    });
  });

  describe("linkSocialAccount", () => {
    const mockUserInfo = {
      id: "provider-123",
      email: "user@example.com",
      displayName: "John Doe",
      avatar: "https://example.com/avatar.jpg",
    };

    it("should link social account to user", async () => {
      const mockSocialAccount = {
        id: "social-123",
        user_id: "user-123",
        provider: "google",
        provider_id: "provider-123",
      };

      // Mock no existing account for this provider
      query.mockResolvedValueOnce({ rows: [] });

      // Mock no account linked to another user
      query.mockResolvedValueOnce({ rows: [] });

      // Mock creating social account
      query.mockResolvedValueOnce({ rows: [mockSocialAccount] });

      const result = await socialAuthService.linkSocialAccount(
        "user-123",
        "google",
        mockUserInfo
      );

      expect(result).toEqual(mockSocialAccount);
    });

    it("should throw error if account already linked to user", async () => {
      // Mock existing account for this provider
      query.mockResolvedValueOnce({ rows: [{ id: "existing-123" }] });

      await expect(
        socialAuthService.linkSocialAccount("user-123", "google", mockUserInfo)
      ).rejects.toThrow("google account is already linked to this user");
    });

    it("should throw error if account linked to another user", async () => {
      // Mock no existing account for this provider
      query.mockResolvedValueOnce({ rows: [] });

      // Mock account linked to another user
      query.mockResolvedValueOnce({ rows: [{ user_id: "other-user-123" }] });

      await expect(
        socialAuthService.linkSocialAccount("user-123", "google", mockUserInfo)
      ).rejects.toThrow(
        "This google account is already linked to another user"
      );
    });
  });

  describe("unlinkSocialAccount", () => {
    it("should unlink social account", async () => {
      const mockDeletedAccount = {
        id: "social-123",
        user_id: "user-123",
        provider: "google",
      };

      // Mock successful deletion
      query.mockResolvedValueOnce({ rows: [mockDeletedAccount] });

      // Mock activity logging
      query.mockResolvedValueOnce({ rows: [] });

      const result = await socialAuthService.unlinkSocialAccount(
        "user-123",
        "google"
      );

      expect(result).toEqual({
        success: true,
        message: "google account unlinked successfully",
      });
    });

    it("should throw error if no account to unlink", async () => {
      // Mock no account found
      query.mockResolvedValueOnce({ rows: [] });

      await expect(
        socialAuthService.unlinkSocialAccount("user-123", "google")
      ).rejects.toThrow("No google account found to unlink");
    });
  });

  describe("getConnectedAccounts", () => {
    it("should return connected social accounts", async () => {
      const mockAccounts = [
        {
          provider: "google",
          provider_id: "google-123",
          email: "user@gmail.com",
          display_name: "John Doe",
          avatar: "https://google.com/avatar.jpg",
          connected_at: new Date(),
        },
        {
          provider: "facebook",
          provider_id: "facebook-123",
          email: "user@facebook.com",
          display_name: "John Doe",
          avatar: "https://facebook.com/avatar.jpg",
          connected_at: new Date(),
        },
      ];

      query.mockResolvedValue({ rows: mockAccounts });

      const result = await socialAuthService.getConnectedAccounts("user-123");

      expect(result).toEqual(mockAccounts);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT provider, provider_id"),
        ["user-123"]
      );
    });
  });

  describe("isProviderSupported", () => {
    it("should return true for supported providers", () => {
      expect(socialAuthService.isProviderSupported("google")).toBe(true);
      expect(socialAuthService.isProviderSupported("facebook")).toBe(true);
      expect(socialAuthService.isProviderSupported("apple")).toBe(true);
      expect(socialAuthService.isProviderSupported("linkedin")).toBe(true);
    });

    it("should return false for unsupported providers", () => {
      expect(socialAuthService.isProviderSupported("twitter")).toBe(false);
      expect(socialAuthService.isProviderSupported("github")).toBe(false);
    });
  });

  describe("getProviderConfig", () => {
    it("should return provider configuration", () => {
      const config = socialAuthService.getProviderConfig("google");

      expect(config).toHaveProperty("clientId");
      expect(config).toHaveProperty("clientSecret");
      expect(config).toHaveProperty("authUrl");
      expect(config).toHaveProperty("tokenUrl");
      expect(config).toHaveProperty("scope");
    });

    it("should throw error for unsupported provider", () => {
      expect(() => {
        socialAuthService.getProviderConfig("unsupported");
      }).toThrow("Unsupported OAuth provider: unsupported");
    });
  });
});
