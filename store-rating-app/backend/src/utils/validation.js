export const validateAuthInput = (data, isSignup = true) => {
  const errors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // Min 8, max 16, 1 uppercase, 1 special char
  const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,16}$/;

  if (isSignup) {
    if (!data.name || data.name.length < 20 || data.name.length > 60) {
      errors.name = "Name must be between 20 and 60 characters.";
    }
    if (!data.address || data.address.length > 400) {
      errors.address = "Address must not exceed 400 characters.";
    }
  }

  if (!data.email || !emailRegex.test(data.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!data.password || !passwordRegex.test(data.password)) {
    errors.password = "Password must be 8-16 chars, containing 1 uppercase letter and 1 special character.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
