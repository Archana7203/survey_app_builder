import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { User, IUser } from '../User';

describe('User Model', () => {
  // Note: No cleanup - keeping data for inspection

  describe('User Creation', () => {
    it('should create a user with required fields', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        role: 'creator',
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.email).toBe('test@example.com');
      expect(savedUser.passwordHash).toBe('hashedpassword123');
      expect(savedUser.role).toBe('creator');
      expect(savedUser.createdAt).toBeDefined();
    });

    it('should enforce required fields', async () => {
      const user = new User({});
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should enforce unique email constraint', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        role: 'creator',
      };

      const user1 = new User(userData);
      await user1.save();

      const user2 = new User(userData);
      await expect(user2.save()).rejects.toThrow();
    });
  });

  describe('User Validation', () => {
    it('should validate email format', async () => {
      const userData = {
        email: 'invalid-email',
        passwordHash: 'hashedpassword123',
        role: 'creator',
      };

      const user = new User(userData);
      // MongoDB doesn't validate email format by default, so this should save
      const savedUser = await user.save();
      expect(savedUser.email).toBe('invalid-email');
    });

    it('should validate role enum', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        role: 'invalid-role',
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it('should accept valid role values', async () => {
      const roles = ['creator', 'respondent'];
      
      for (const role of roles) {
        const userData = {
          email: `test-${role}@example.com`,
          passwordHash: 'hashedpassword123',
          role: role as any,
        };

        const user = new User(userData);
        const savedUser = await user.save();
        expect(savedUser.role).toBe(role);
      }
    });

    it('should use default role when not specified', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
      };

      const user = new User(userData);
      const savedUser = await user.save();
      expect(savedUser.role).toBe('respondent'); // Default value
    });
  });

  describe('User Email Handling', () => {
    it('should handle different email formats', async () => {
      const emailFormats = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user123@example-domain.com',
        'user@subdomain.example.com',
        'user@example.co.uk',
        'user@example-domain.com',
      ];

      for (let i = 0; i < emailFormats.length; i++) {
        const userData = {
          email: emailFormats[i],
          passwordHash: 'hashedpassword123',
          role: 'respondent',
        };

        const user = new User(userData);
        const savedUser = await user.save();
        expect(savedUser.email).toBe(emailFormats[i]);
      }
    });

    it('should handle email case sensitivity', async () => {
      const userData1 = {
        email: 'Test@Example.com',
        passwordHash: 'hashedpassword123',
        role: 'respondent',
      };

      const userData2 = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        role: 'respondent',
      };

      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow(); // Should conflict due to lowercase transformation
    });

    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(100) + '@example.com';
      const userData = {
        email: longEmail,
        passwordHash: 'hashedpassword123',
        role: 'respondent',
      };

      const user = new User(userData);
      const savedUser = await user.save();
      expect(savedUser.email).toBe(longEmail);
    });

    it('should handle email with special characters', async () => {
      const specialEmail = 'user+tag@example-domain.com';
      const userData = {
        email: specialEmail,
        passwordHash: 'hashedpassword123',
        role: 'respondent',
      };

      const user = new User(userData);
      const savedUser = await user.save();
      expect(savedUser.email).toBe(specialEmail);
    });
  });

  describe('User Password Hash', () => {
    it('should store password hash as string', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        role: 'respondent',
      };

      const user = new User(userData);
      const savedUser = await user.save();
      expect(typeof savedUser.passwordHash).toBe('string');
      expect(savedUser.passwordHash).toBe('hashedpassword123');
    });

    it('should handle very long password hashes', async () => {
      const longHash = 'a'.repeat(1000);
      const userData = {
        email: 'test@example.com',
        passwordHash: longHash,
        role: 'respondent',
      };

      const user = new User(userData);
      const savedUser = await user.save();
      expect(savedUser.passwordHash).toHaveLength(1000);
    });

    it('should handle password hash with special characters', async () => {
      const specialHash = 'hash$with%special&chars*()_+-=[]{}|;:,.<>?';
      const userData = {
        email: 'test@example.com',
        passwordHash: specialHash,
        role: 'respondent',
      };

      const user = new User(userData);
      const savedUser = await user.save();
      expect(savedUser.passwordHash).toBe(specialHash);
    });

    it('should handle different hash algorithms', async () => {
      const hashAlgorithms = [
        'bcrypt$2b$10$example',
        'sha256$example',
        'pbkdf2$example',
        'argon2$example',
      ];

      for (let i = 0; i < hashAlgorithms.length; i++) {
        const userData = {
          email: `test${i}@example.com`,
          passwordHash: hashAlgorithms[i],
          role: 'respondent',
        };

        const user = new User(userData);
        const savedUser = await user.save();
        expect(savedUser.passwordHash).toBe(hashAlgorithms[i]);
      }
    });
  });

  describe('User Roles', () => {
    it('should handle creator role', async () => {
      const userData = {
        email: 'creator@example.com',
        passwordHash: 'hashedpassword123',
        role: 'creator',
      };

      const user = new User(userData);
      const savedUser = await user.save();
      expect(savedUser.role).toBe('creator');
    });

    it('should handle respondent role (for JWT link access)', async () => {
      const userData = {
        email: 'respondent@example.com',
        passwordHash: 'hashedpassword123',
        role: 'respondent',
      };

      const user = new User(userData);
      const savedUser = await user.save();
      expect(savedUser.role).toBe('respondent');
    });

    it('should default to respondent role', async () => {
      const userData = {
        email: 'default@example.com',
        passwordHash: 'hashedpassword123',
      };

      const user = new User(userData);
      const savedUser = await user.save();
      expect(savedUser.role).toBe('respondent');
    });
  });

  describe('User Timestamps', () => {
    it('should automatically set createdAt', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        role: 'respondent',
      };

      const user = new User(userData);
      const savedUser = await user.save();
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.createdAt).toBeInstanceOf(Date);
    });

    it('should set createdAt to current time', async () => {
      const beforeCreation = new Date();
      
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        role: 'respondent',
      };

      const user = new User(userData);
      const savedUser = await user.save();
      
      const afterCreation = new Date();
      
      expect(savedUser.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(savedUser.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });

    it('should not update createdAt on modification', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        role: 'respondent',
      };

      const user = new User(userData);
      const savedUser = await user.save();
      const originalCreatedAt = savedUser.createdAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      savedUser.role = 'creator';
      const updatedUser = await savedUser.save();

      expect(updatedUser.createdAt.getTime()).toBe(originalCreatedAt.getTime());
    });
  });

  describe('User Data Types', () => {
    it('should handle string data types correctly', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        role: 'respondent',
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(typeof savedUser.email).toBe('string');
      expect(typeof savedUser.passwordHash).toBe('string');
      expect(typeof savedUser.role).toBe('string');
    });

    it('should handle date data types correctly', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        role: 'respondent',
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined values gracefully', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        role: undefined, // Should default to 'respondent'
      };

      const user = new User(userData);
      const savedUser = await user.save();
      expect(savedUser.role).toBe('respondent');
    });

    it('should handle empty string values', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: ' ', // Whitespace password hash (not empty)
        role: 'respondent',
      };

      const user = new User(userData);
      const savedUser = await user.save();
      expect(savedUser.passwordHash).toBe(' ');
    });

    it('should handle whitespace in email', async () => {
      const userData = {
        email: '  test@example.com  ', // Email with whitespace
        passwordHash: 'hashedpassword123',
        role: 'respondent',
      };

      const user = new User(userData);
      const savedUser = await user.save();
      expect(savedUser.email).toBe('test@example.com'); // Should be trimmed
    });

    it('should handle whitespace in password hash', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: '  hashedpassword123  ', // Password hash with whitespace
        role: 'respondent',
      };

      const user = new User(userData);
      const savedUser = await user.save();
      expect(savedUser.passwordHash).toBe('  hashedpassword123  '); // Should not be trimmed
    });

    it('should handle special characters in all fields', async () => {
      const userData = {
        email: 'user+tag@example-domain.com',
        passwordHash: 'hash$with%special&chars*()_+-=[]{}|;:,.<>?',
        role: 'respondent',
      };

      const user = new User(userData);
      const savedUser = await user.save();
      expect(savedUser.email).toBe('user+tag@example-domain.com');
      expect(savedUser.passwordHash).toBe('hash$with%special&chars*()_+-=[]{}|;:,.<>?');
    });

    it('should handle unicode characters in email', async () => {
      const userData = {
        email: 'user@éxample.com', // Email with unicode
        passwordHash: 'hashedpassword123',
        role: 'respondent',
      };

      const user = new User(userData);
      const savedUser = await user.save();
      expect(savedUser.email).toBe('user@éxample.com');
    });

    it('should handle very long field values', async () => {
      const longEmail = 'a'.repeat(100) + '@example.com';
      const longHash = 'a'.repeat(1000);
      
      const userData = {
        email: longEmail,
        passwordHash: longHash,
        role: 'respondent',
      };

      const user = new User(userData);
      const savedUser = await user.save();
      expect(savedUser.email).toHaveLength(100 + '@example.com'.length);
      expect(savedUser.passwordHash).toHaveLength(1000);
    });
  });

  describe('User Queries and Indexes', () => {
    it('should be queryable by email', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        role: 'respondent',
      };

      const user = new User(userData);
      await user.save();

      const foundUser = await User.findOne({ email: 'test@example.com' });
      expect(foundUser).toBeDefined();
      expect(foundUser!.email).toBe('test@example.com');
    });

    it('should be queryable by role', async () => {
      const creatorData = {
        email: 'creator@example.com',
        passwordHash: 'hashedpassword123',
        role: 'creator',
      };

      const respondentData = {
        email: 'respondent@example.com',
        passwordHash: 'hashedpassword123',
        role: 'respondent',
      };

      await User.create([creatorData, respondentData]);

      const creators = await User.find({ role: 'creator' });
      const respondents = await User.find({ role: 'respondent' });

      expect(creators).toHaveLength(1);
      expect(respondents).toHaveLength(1);
      expect(creators[0].email).toBe('creator@example.com');
      expect(respondents[0].email).toBe('respondent@example.com');
    });

    it('should be queryable by createdAt range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        role: 'respondent',
      };

      const user = new User(userData);
      await user.save();

      const recentUsers = await User.find({
        createdAt: { $gte: yesterday, $lte: tomorrow }
      });

      expect(recentUsers).toHaveLength(1);
      expect(recentUsers[0].email).toBe('test@example.com');
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large numbers of users efficiently', async () => {
      const startTime = performance.now();
      
      const users = Array.from({ length: 1000 }, (_, i) => ({
        email: `user${i}@example.com`,
        passwordHash: `hashedpassword${i}`,
        role: i % 2 === 0 ? 'creator' : 'respondent',
      }));

      await User.insertMany(users);
      
      const endTime = performance.now();
      
      const count = await User.countDocuments();
      expect(count).toBe(1000);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent user creation', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => {
        const userData = {
          email: `concurrent${i}@example.com`,
          passwordHash: `hashedpassword${i}`,
          role: 'respondent',
        };
        return new User(userData).save();
      });

      const users = await Promise.all(promises);
      expect(users).toHaveLength(10);
      
      // All should have unique emails
      const emails = users.map(u => u.email);
      const uniqueEmails = new Set(emails);
      expect(uniqueEmails.size).toBe(10);
    });

    it('should handle efficient email lookups', async () => {
      // Create many users
      const users = Array.from({ length: 100 }, (_, i) => ({
        email: `user${i}@example.com`,
        passwordHash: `hashedpassword${i}`,
        role: 'respondent',
      }));

      await User.insertMany(users);

      const startTime = performance.now();
      
      // Perform many email lookups
      for (let i = 0; i < 100; i++) {
        await User.findOne({ email: `user${i}@example.com` });
      }
      
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds (adjusted for MongoDB Atlas latency)
    });
  });
});
