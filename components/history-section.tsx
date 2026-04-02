"use client"

import { memo, useMemo } from "react"
import { Clock, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DailyEntry } from "@/hooks/use-spend-control"

interface HistorySectionProps {
  dailyEntries: DailyEntry[]
  dailyBudget: number
}

// Memoized history item to prevent unnecessary re-renders
const HistoryItem = memo(function HistoryItem({ 
  entry, 
  dailyBudget 
}: { 
  entry: DailyEntry
  dailyBudget: number 
}) {
  const isOverBudget = entry.expense > dailyBudget
  const time = new Date(entry.timestamp).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          isOverBudget ? "bg-danger/20" : "bg-success/20"
        )}>
          {isOverBudget ? (
            <TrendingDown className="w-4 h-4 text-danger" />
          ) : (
            <TrendingUp className="w-4 h-4 text-success" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Expense
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {time}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={cn(
          "text-sm font-semibold",
          isOverBudget ? "text-danger" : "text-foreground"
        )}>
          -₹{entry.expense.toLocaleString("en-IN")}
        </p>
        <p className="text-xs text-muted-foreground">
          RAPD: ₹{Math.round(entry.baseRapd).toLocaleString("en-IN")}
        </p>
      </div>
    </div>
  )
})

// Group entries by date
function groupEntriesByDate(entries: DailyEntry[] | undefined | null): Map<string, DailyEntry[]> {
  const grouped = new Map<string, DailyEntry[]>()
  
  // Handle undefined/null entries
  if (!entries || !Array.isArray(entries)) {
    return grouped
  }
  
  // Sort by timestamp descending (most recent first)
  const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp)
  
  for (const entry of sorted) {
    const existing = grouped.get(entry.date) || []
    grouped.set(entry.date, [...existing, entry])
  }
  
  return grouped
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (dateStr === today.toISOString().split("T")[0]) {
    return "Today"
  } else if (dateStr === yesterday.toISOString().split("T")[0]) {
    return "Yesterday"
  }
  
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

export const HistorySection = memo(function HistorySection({ 
  dailyEntries, 
  dailyBudget 
}: HistorySectionProps) {
  // Memoize grouped entries to prevent recalculation on every render
  const groupedEntries = useMemo(() => {
    return groupEntriesByDate(dailyEntries)
  }, [dailyEntries])

  if (!dailyEntries || dailyEntries.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-border p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          Expense History
        </h3>
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-secondary mx-auto mb-3 flex items-center justify-center">
            <Clock className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            No expenses recorded yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Add your first expense below
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Expense History
        </h3>
        <span className="text-xs text-muted-foreground">
          {dailyEntries.length} entries
        </span>
      </div>
      
      <div className="space-y-4 max-h-64 overflow-y-auto">
        {Array.from(groupedEntries.entries()).map(([date, entries]) => {
          const dayTotal = entries.reduce((sum, e) => sum + e.expense, 0)
          const isOverBudget = dayTotal > dailyBudget
          
          return (
            <div key={date}>
              {/* Date header */}
              <div className="flex items-center justify-between mb-2 sticky top-0 bg-card py-1">
                <span className="text-xs font-medium text-foreground">
                  {formatDateHeader(date)}
                </span>
                <span className={cn(
                  "text-xs font-medium",
                  isOverBudget ? "text-danger" : "text-success"
                )}>
                  ₹{dayTotal.toLocaleString("en-IN")}
                </span>
              </div>
              
              {/* Entries for this date */}
              <div className="bg-secondary/30 rounded-xl px-3">
                {entries.map((entry) => (
                  <HistoryItem 
                    key={entry.id} 
                    entry={entry} 
                    dailyBudget={dailyBudget}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})
