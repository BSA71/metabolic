export function normalizePhone(from: string) {
  let phone = from.replace(/^whatsapp:/i, '').trim();
  if (phone && !phone.startsWith('+')) {
    phone = `+${phone}`;
  }
  return phone;
}

export function phoneDigits(phone: string) {
  return normalizePhone(phone).replace(/\D/g, '');
}
