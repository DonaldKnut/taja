/**
 * Utility Functions Tests
 */

import { formatCurrency, formatDate, formatNumber, timeAgo, normalizeNigerianPhone, isValidNigerianPhone } from '@/lib/utils';

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('should format price with Naira symbol', () => {
      expect(formatCurrency(1000)).toBe('₦1,000');
      expect(formatCurrency(50000)).toBe('₦50,000');
      expect(formatCurrency(1500000)).toBe('₦1,500,000');
    });

    it('should handle decimal prices', () => {
      expect(formatCurrency(1000.5)).toBe('₦1,001');
      expect(formatCurrency(999.99)).toBe('₦1,000');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('₦0');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-03-15');
      expect(formatDate(date)).toMatch(/March 15, 2024/);
    });

    it('should handle string dates', () => {
      expect(formatDate('2024-03-15')).toMatch(/March 15, 2024/);
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with commas', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(5000000)).toBe('5,000,000');
    });

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('timeAgo', () => {
    it('should return just now for recent times', () => {
      const now = new Date();
      expect(timeAgo(now)).toBe('just now');
    });

    it('should return minutes ago', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(timeAgo(fiveMinutesAgo)).toBe('5m ago');
    });

    it('should return hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(timeAgo(twoHoursAgo)).toBe('2h ago');
    });

    it('should return days ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(timeAgo(threeDaysAgo)).toBe('3d ago');
    });
  });

  describe('normalizeNigerianPhone', () => {
    it('should remove spaces and dashes', () => {
      expect(normalizeNigerianPhone('+234 801 234 5678')).toBe('+2348012345678');
      expect(normalizeNigerianPhone('080-1234-5678')).toBe('08012345678');
    });

    it('should handle parentheses', () => {
      expect(normalizeNigerianPhone('(+234) 801 234 5678')).toBe('+2348012345678');
    });
  });

  describe('isValidNigerianPhone', () => {
    it('should validate correct phone numbers', () => {
      expect(isValidNigerianPhone('+2348012345678')).toBe(true);
      expect(isValidNigerianPhone('08012345678')).toBe(true);
      expect(isValidNigerianPhone('+234 801 234 5678')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidNigerianPhone('1234567890')).toBe(false);
      expect(isValidNigerianPhone('0801234567')).toBe(false);
      expect(isValidNigerianPhone('')).toBe(false);
    });
  });
});
