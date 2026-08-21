export type DateValue = {
  year?: number;
  month?: number;
  day?: number;
};

const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function isValidDate(date: DateValue | undefined): boolean {
  const year = date?.year ?? 0;
  const month = date?.month ?? 0;
  const day = date?.day ?? 0;
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return false;
  }
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1) {
    return false;
  }
  const maxDay =
    month === 2 && isLeapYear(year) ? 29 : MONTH_LENGTHS[month - 1];
  return day <= maxDay;
}

export function dateInputValue(date: DateValue | undefined): string {
  if (!isValidDate(date)) return "";
  const year = String(date?.year ?? 0).padStart(4, "0");
  const month = String(date?.month ?? 0).padStart(2, "0");
  const day = String(date?.day ?? 0).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateLabel(date: DateValue | undefined): string {
  const value = dateInputValue(date);
  return value ? value.replaceAll("-", "/") : "";
}

export function toDateValue(value: string): DateValue | null {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!matched) return null;

  const date = {
    year: Number(matched[1]),
    month: Number(matched[2]),
    day: Number(matched[3]),
  };
  return isValidDate(date) ? date : null;
}

export const FISCAL_YEAR_START_MONTH = 4;

export function fiscalYear(date: DateValue | undefined): number | null {
  if (!isValidDate(date)) return null;
  const year = date?.year ?? 0;
  const month = date?.month ?? 0;
  return month >= FISCAL_YEAR_START_MONTH ? year : year - 1;
}

export function fiscalYearLabel(year: number): string {
  return `${year}年度`;
}

export function currentFiscalYear(): number {
  const now = new Date();
  const month = now.getMonth() + 1;
  return month >= FISCAL_YEAR_START_MONTH
    ? now.getFullYear()
    : now.getFullYear() - 1;
}

function dateInputValueOf(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function todayInputValue(): string {
  return dateInputValueOf(new Date());
}

export function ageOn(
  birthDate: DateValue | undefined,
  today: string,
): number | null {
  if (!isValidDate(birthDate)) return null;
  const birth = dateInputValue(birthDate);
  if (!birth || birth > today) return null;

  const age = Number(today.slice(0, 4)) - (birthDate?.year ?? 0);
  return today.slice(5) < birth.slice(5) ? age - 1 : age;
}

export function currentAge(birthDate: DateValue | undefined): number | null {
  return ageOn(birthDate, todayInputValue());
}

export const TIMEZONE_TOLERANCE_DAYS = 1;

export function isFutureDate(date: DateValue, toleranceDays = 0): boolean {
  const limit = new Date();
  limit.setDate(limit.getDate() + toleranceDays);
  return dateInputValue(date) > dateInputValueOf(limit);
}
