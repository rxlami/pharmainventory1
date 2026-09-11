/**
 * Nigerian Currency and Clinical Formatting Utilities
 * Standardizes display of Nigerian Naira (₦) across community pharmacy modules.
 */

export const formatNaira = (amount: number | undefined | null, includeDecimals = true): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return includeDecimals ? '₦0.00' : '₦0';
  }

  return '₦' + amount.toLocaleString('en-NG', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  });
};

export const formatCurrency = (
  amount: number | undefined | null,
  symbol = '₦',
  includeDecimals = true
): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `${symbol}0.00`;
  }

  return (
    symbol +
    amount.toLocaleString('en-NG', {
      minimumFractionDigits: includeDecimals ? 2 : 0,
      maximumFractionDigits: includeDecimals ? 2 : 0,
    })
  );
};

export const formatQty = (qty: number | undefined | null): string => {
  if (qty === undefined || qty === null || isNaN(qty)) return '0';
  return qty.toLocaleString('en-NG');
};
