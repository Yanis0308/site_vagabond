import { atom } from "jotai";

export interface DashboardDateRange {
  from: Date;
  to: Date;
}

function defaultRange(): DashboardDateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from, to };
}

export const dashboardDateRangeAtom = atom<DashboardDateRange>(defaultRange());
