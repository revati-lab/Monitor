"use client";

import { usePolling } from "./usePolling";

export interface DashboardStats {
  totalItems: number;
  totalVendors: number;
  totalQuantitySf: number;
  totalQuantitySlabs: number;
  brokenSlabs: number;
  consignment: {
    totalItems: number;
    totalQuantitySf: number;
    totalQuantitySlabs: number;
    brokenSlabs: number;
  };
  ownSlabs: {
    totalItems: number;
    totalQuantitySf: number;
    totalQuantitySlabs: number;
    brokenSlabs: number;
  };
}

export interface ChartDataItem {
  name: string;
  value: number;
}

export interface DashboardData {
  stats: DashboardStats;
  slabsByItem: ChartDataItem[];
  slabsByVendor: ChartDataItem[];
  consignmentBySlabName: ChartDataItem[];
  ownSlabsBySlabName: ChartDataItem[];
  vendorDetails: Array<{
    vendorName: string;
    slabCount: number;
    totalSf: number;
  }>;
  customerNames: string[];
}

interface UseDashboardStatsOptions {
  /** Polling interval in milliseconds (default: 10000 - 10 seconds) */
  interval?: number;
  /** Whether polling is enabled (default: true) */
  enabled?: boolean;
}

const defaultStats: DashboardStats = {
  totalItems: 0,
  totalVendors: 0,
  totalQuantitySf: 0,
  totalQuantitySlabs: 0,
  brokenSlabs: 0,
  consignment: { totalItems: 0, totalQuantitySf: 0, totalQuantitySlabs: 0, brokenSlabs: 0 },
  ownSlabs: { totalItems: 0, totalQuantitySf: 0, totalQuantitySlabs: 0, brokenSlabs: 0 },
};

const defaultData: DashboardData = {
  stats: defaultStats,
  slabsByItem: [],
  slabsByVendor: [],
  consignmentBySlabName: [],
  ownSlabsBySlabName: [],
  vendorDetails: [],
  customerNames: [],
};

async function fetchDashboardData(): Promise<DashboardData> {
  const response = await fetch("/api/dashboard");
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard data");
  }
  return response.json();
}

export function useDashboardStats(
  initialData: DashboardData = defaultData,
  options: UseDashboardStatsOptions = {}
) {
  const { interval = 10000, enabled = true } = options;

  return usePolling(fetchDashboardData, initialData, {
    interval,
    enabled,
  });
}
