// YOUR PROMO CODES. Edit here only; they are checked on the server, so nobody can see the list.
// type 'percent' = percent off the estimate, 'amount' = dollars off. Codes are not case sensitive.
export const PROMOS = {
  WINDOW10: { type: 'percent', value: 10, label: '10% off' },
  // SPRING20: { type: 'amount', value: 20, label: '$20 off' },
};

export function findPromo(code) {
  const key = String(code || '').trim().toUpperCase();
  return Object.prototype.hasOwnProperty.call(PROMOS, key) ? { code: key, ...PROMOS[key] } : null;
}

export function discountFor(price, promo) {
  if (!promo) return 0;
  const d = promo.type === 'percent' ? Math.round(price * promo.value / 100) : promo.value;
  return Math.min(Math.max(d, 0), price);
}
