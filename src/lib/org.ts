// Реквизиты организации для правовых страниц и выходных данных.
// Значения по умолчанию — ПЛЕЙСХОЛДЕРЫ. Заполните через env (NEXT_PUBLIC_ORG_*)
// реальными данными и проверьте у юриста перед публикацией.
const DASH = "—"; // нейтральный плейсхолдер для незаполненных реквизитов (публично не пугает)
export const ORG = {
  name: process.env.NEXT_PUBLIC_ORG_NAME || "Asosiy Aktiv",
  founder: process.env.NEXT_PUBLIC_ORG_FOUNDER || DASH,
  editor: process.env.NEXT_PUBLIC_ORG_EDITOR || DASH,
  email: process.env.NEXT_PUBLIC_ORG_EMAIL || DASH,
  phone: process.env.NEXT_PUBLIC_ORG_PHONE || DASH,
  address: process.env.NEXT_PUBLIC_ORG_ADDRESS || DASH,
  smiCert: process.env.NEXT_PUBLIC_ORG_SMI_CERT || DASH,
  pdRegistry: process.env.NEXT_PUBLIC_ORG_PD_REGISTRY || DASH,
  age: process.env.NEXT_PUBLIC_ORG_AGE || "18+",
  // все обязательные реквизиты заполнены?
  filled: !!(process.env.NEXT_PUBLIC_ORG_FOUNDER && process.env.NEXT_PUBLIC_ORG_EDITOR && process.env.NEXT_PUBLIC_ORG_ADDRESS),
};
