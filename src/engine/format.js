export function formatRupees(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return '₹0';
  const absolute = Math.abs(amount);
  if (absolute >= 1e12) return `₹${(amount / 1e12).toFixed(2)} Lakh Cr`;
  if (absolute >= 1e7) return `₹${(amount / 1e7).toFixed(2)} Cr`;
  if (absolute >= 1e5) return `₹${(amount / 1e5).toFixed(2)} Lakh`;
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}
