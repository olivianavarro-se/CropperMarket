export const passwordRequirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Lowercase letter (a-z)", test: (p: string) => /[a-z]/.test(p) },
  { label: "Uppercase letter (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Number (0-9)", test: (p: string) => /[0-9]/.test(p) },
  { label: "Special character (!@#$...)", test: (p: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|<>?,./`~]/.test(p) },
]

export function passwordMeetsAllRequirements(password: string) {
  return passwordRequirements.every(({ test }) => test(password))
}
