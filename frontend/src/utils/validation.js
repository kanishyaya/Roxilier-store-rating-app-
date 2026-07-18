// Client-side validation mirroring the backend rules in
// backend/src/utils/validation.js. Runs before the API call so users get
// instant feedback and the server isn't hit with invalid submissions.

export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,16}$/;
export const EMAIL_REGEX    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignupForm({ name, email, address, password }) {
  const errors = {};

  if (!name || name.length < 20 || name.length > 60) {
    errors.name = 'Name must be between 20 and 60 characters.';
  }
  if (!address || address.length > 400) {
    errors.address = 'Address must not exceed 400 characters.';
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!password || !PASSWORD_REGEX.test(password)) {
    errors.password = 'Password must be 8–16 characters with at least 1 uppercase letter and 1 special character.';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateLoginForm({ email, password }) {
  const errors = {};
  if (!email || !EMAIL_REGEX.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!password) {
    errors.password = 'Password is required.';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validatePasswordChange({ newPassword, confirmPassword }) {
  const errors = {};
  if (!newPassword || !PASSWORD_REGEX.test(newPassword)) {
    errors.newPassword = 'New password must be 8–16 chars with at least 1 uppercase and 1 special character.';
  }
  if (newPassword !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}
