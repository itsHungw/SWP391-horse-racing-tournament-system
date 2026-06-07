export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

export function sanitizePhoneNumber(phone: string): string {
  let clean = phone.replace(/[\s().-]/g, "");
  if (clean.startsWith("+84")) {
    clean = "0" + clean.substring(3);
  } else if (clean.startsWith("84") && clean.length > 9) {
    clean = "0" + clean.substring(2);
  }
  return clean;
}

export function validateVietnamesePhone(phone: string): boolean {
  const clean = sanitizePhoneNumber(phone);
  const vnPhoneRegex = /^0(3|5|7|8|9)\d{8}$/;
  return vnPhoneRegex.test(clean);
}

export function validatePasswordStrength(password: string): boolean {
  if (password.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
}
