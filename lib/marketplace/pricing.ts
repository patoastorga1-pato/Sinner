import type { BookingMode, PriceEstimate, ReservationSelection } from "@/lib/types/marketplace";

export const DEFAULT_SERVICE_FEE_PERCENT = 11;

function serviceFeePercent() {
  const configured = Number(process.env.NEXT_PUBLIC_SINNER_SERVICE_FEE_PERCENT);
  return Number.isFinite(configured) && configured >= 0 && configured <= 50
    ? configured
    : DEFAULT_SERVICE_FEE_PERCENT;
}

export function formatMoney(value: number, currency = "MXN") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function getStartingPrice(prices: {
  hourlyPrice: number | null;
  overnightPrice: number | null;
  fullDayPrice: number | null;
}) {
  if (prices.hourlyPrice !== null) return { value: prices.hourlyPrice, unit: "/ hour" };
  if (prices.overnightPrice !== null) return { value: prices.overnightPrice, unit: "overnight" };
  if (prices.fullDayPrice !== null) return { value: prices.fullDayPrice, unit: "full day" };
  return null;
}

function rateForMode(
  mode: BookingMode,
  prices: { hourlyPrice: number | null; overnightPrice: number | null; fullDayPrice: number | null },
) {
  if (mode === "overnight") return prices.overnightPrice;
  if (mode === "full-day") return prices.fullDayPrice;
  return prices.hourlyPrice;
}

export function calculatePriceEstimate(
  prices: {
    hourlyPrice: number | null;
    overnightPrice: number | null;
    fullDayPrice: number | null;
    cleaningFee: number;
  },
  selection: Pick<ReservationSelection, "duration" | "mode">,
): PriceEstimate | null {
  const rate = rateForMode(selection.mode, prices);
  if (rate === null) return null;

  const baseAmount = selection.mode === "hourly" ? rate * selection.duration : rate;
  const percent = serviceFeePercent();
  const serviceFee = Math.round(((baseAmount + prices.cleaningFee) * (percent / 100)) / 10) * 10;

  return {
    rate,
    baseAmount,
    cleaningFee: prices.cleaningFee,
    serviceFee,
    total: baseAmount + prices.cleaningFee + serviceFee,
    serviceFeePercent: percent,
  };
}
