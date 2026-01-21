"use client";

import * as React from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./card";

// Premium color palette that works in both light and dark mode
const COLORS = [
  "hsl(221.2, 83.2%, 53.3%)",  // Primary blue
  "hsl(262.1, 83.3%, 57.8%)",  // Purple
  "hsl(142.1, 76.2%, 36.3%)",  // Success green
  "hsl(38, 92%, 50%)",         // Warning amber
  "hsl(340, 75%, 55%)",        // Pink
  "hsl(199, 89%, 48%)",        // Info blue
  "hsl(24, 100%, 50%)",        // Orange
  "hsl(173, 58%, 39%)",        // Teal
  "hsl(291, 47%, 51%)",        // Violet
  "hsl(47, 100%, 50%)",        // Yellow
];

interface ChartDataItem {
  name: string;
  value: number;
}

interface PieChartProps {
  data: ChartDataItem[];
  title?: string;
  description?: string;
  className?: string;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  emptyMessage?: string;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-soft-lg">
        <p className="text-sm font-medium text-foreground">{payload[0].name}</p>
        <p className="text-lg font-bold text-primary">
          {payload[0].value.toLocaleString()} slabs
        </p>
        <p className="text-xs text-muted-foreground">
          {((payload[0].value / payload[0].payload.total) * 100).toFixed(1)}% of total
        </p>
      </div>
    );
  }
  return null;
};

// Custom legend component
const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-muted-foreground truncate max-w-[100px]">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export function PieChartCard({
  data,
  title = "Distribution",
  description,
  className,
  showLegend = true,
  innerRadius = 60,
  outerRadius = 100,
  emptyMessage = "No data available",
}: PieChartProps) {
  // Calculate total for percentage
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Add total to each item for tooltip percentage calculation
  const chartData = data.map((item) => ({ ...item, total }));

  const isEmpty = data.length === 0 || total === 0;

  return (
    <Card variant="default" className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
              <svg
                className="h-8 w-8 text-muted-foreground/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"
                />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Upload inventory data to see the chart
            </p>
          </div>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="45%"
                  innerRadius={innerRadius}
                  outerRadius={outerRadius}
                  paddingAngle={2}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="transparent"
                      className="transition-opacity hover:opacity-80 cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                {showLegend && <Legend content={<CustomLegend />} />}
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Summary stats */}
        {!isEmpty && (
          <div className="mt-4 flex items-center justify-center gap-6 border-t border-border/50 pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{total.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Slabs</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{data.length}</p>
              <p className="text-xs text-muted-foreground">Categories</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Simpler donut chart variant
export function DonutChart({
  data,
  className,
  size = 200,
}: {
  data: ChartDataItem[];
  className?: string;
  size?: number;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const chartData = data.map((item) => ({ ...item, total }));

  if (data.length === 0 || total === 0) {
    return (
      <div
        className={cn("flex items-center justify-center", className)}
        style={{ width: size, height: size }}
      >
        <div className="rounded-full border-4 border-dashed border-muted h-3/4 w-3/4" />
      </div>
    );
  }

  return (
    <div className={className} style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            paddingAngle={2}
            dataKey="value"
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
