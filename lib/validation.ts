export function validateEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address";
  }
  return null;
}

export function validatePassword(
  password: string,
  email: string,
): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one capital letter";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    return "Password must contain at least one special character";
  }

  const emailPrefix = email.split("@")[0].toLowerCase();
  if (password.toLowerCase().includes(emailPrefix)) {
    return "Password cannot contain your email username";
  }

  return null;
}

export function generateInitialPassword(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz"
  const upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const numbers = "0123456789"
  const special = "!@#$%^&*"

  const randomLower = chars[Math.floor(Math.random() * chars.length)]
  const randomUpper = upperChars[Math.floor(Math.random() * upperChars.length)]
  const randomNumber = numbers[Math.floor(Math.random() * numbers.length)]
  const randomSpecial = special[Math.floor(Math.random() * special.length)]
  const randomExtra = Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("")

  // Shuffle the password
  const password = (randomLower + randomUpper + randomNumber + randomSpecial + randomExtra)
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("")

  return password
}
