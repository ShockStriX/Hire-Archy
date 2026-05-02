// Calculate working days between two dates excluding weekends and public holidays
export async function calculateWorkingDays(
  startDate: Date,
  endDate: Date,
): Promise<number> {
  const publicHolidays = await getPublicHolidays(
    startDate.getFullYear(),
    endDate.getFullYear(),
  );

  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    const dateString = current.toISOString().split("T")[0];

    // Skip weekends
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Skip public holidays
      if (!publicHolidays.includes(dateString)) {
        count++;
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return count;
}

// Fetch SA public holidays from Nager.Date API
async function getPublicHolidays(
  startYear: number,
  endYear: number,
): Promise<string[]> {
  const years = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => startYear + i,
  );

  const holidays: string[] = [];

  for (const year of years) {
    try {
      const res = await fetch(
        `https://date.nager.at/api/v3/PublicHolidays/${year}/ZA`,
      );
      const data = await res.json();
      holidays.push(...data.map((h: { date: string }) => h.date));
    } catch {
      console.error(`Failed to fetch public holidays for ${year}`);
    }
  }

  return holidays;
}

// Calculate pro-rated accrual for first month
export function calculateInitialAccrual(employmentDate: Date): number {
  const daysInMonth = new Date(
    employmentDate.getFullYear(),
    employmentDate.getMonth() + 1,
    0,
  ).getDate();

  const remainingDays = daysInMonth - employmentDate.getDate() + 1;
  const accrual = (remainingDays / daysInMonth) * 2;

  return Math.round(accrual * 100) / 100; // Round to 2 decimal places
}

// Calculate projected annual balance at a future date
export function calculateProjectedBalance(
  currentBalance: number,
  lastAccrualDate: Date,
  targetDate: Date,
): number {
  const monthsDiff =
    (targetDate.getFullYear() - lastAccrualDate.getFullYear()) * 12 +
    (targetDate.getMonth() - lastAccrualDate.getMonth());

  const projectedAccrual = Math.max(0, monthsDiff) * 2;
  return Math.round((currentBalance + projectedAccrual) * 100) / 100;
}

// Check if a date is in a new leave cycle (1 March)
export function isNewLeaveCycle(date: Date, lastAccrualDate: Date): boolean {
  const marchFirst = new Date(date.getFullYear(), 2, 1); // March 1st
  return date >= marchFirst && lastAccrualDate < marchFirst;
}
