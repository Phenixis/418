export const passwordRules = [
  { label: "Au moins 8 caractères", test: (v: string) => v.length >= 8 },
  { label: "Au moins 1 majuscule", test: (v: string) => /[A-Z]/.test(v) },
  { label: "Au moins 1 minuscule", test: (v: string) => /[a-z]/.test(v) },
  { label: "Au moins 1 chiffre", test: (v: string) => /\d/.test(v) },
];