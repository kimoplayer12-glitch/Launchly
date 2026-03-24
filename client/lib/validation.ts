/**
 * Utility functions for form validation
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Email validation
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Password validation (minimum 8 characters, at least one number and one letter)
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one letter" };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  return { valid: true };
}

/**
 * Business name validation
 */
export function validateBusinessName(name: string): { valid: boolean; message?: string } {
  if (name.length < 2) {
    return { valid: false, message: "Business name must be at least 2 characters" };
  }
  if (name.length > 100) {
    return { valid: false, message: "Business name must be less than 100 characters" };
  }
  return { valid: true };
}

/**
 * URL validation
 */
export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Phone number validation (basic)
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.length >= 10;
}

/**
 * Validate form fields
 */
export function validateFormFields(
  fields: Record<string, { value: string; validator?: (value: string) => boolean }>
): ValidationResult {
  const errors: ValidationError[] = [];

  Object.entries(fields).forEach(([field, { value, validator }]) => {
    if (!value || value.trim() === "") {
      errors.push({ field, message: `${field} is required` });
    } else if (validator && !validator(value)) {
      errors.push({ field, message: `${field} is invalid` });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get error message for a specific field
 */
export function getFieldError(errors: ValidationError[], field: string): string | null {
  const error = errors.find((e) => e.field === field);
  return error?.message || null;
}
