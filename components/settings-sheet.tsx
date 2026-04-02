"use client"

import { useState } from "react"
import { Settings, RotateCcw, IndianRupee, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface SettingsSheetProps {
  totalBudget: number
  onUpdateBudget: (budget: number) => void
  onReset: () => void
  currentDate: string
  dateOverride: { enabled: boolean; date: string } | null
  onSetDateOverride: (date: string | null) => void
  daysInMonth: number
}

export function SettingsSheet({ 
  totalBudget, 
  onUpdateBudget, 
  onReset,
  currentDate,
  dateOverride,
  onSetDateOverride,
  daysInMonth
}: SettingsSheetProps) {
  const [budgetValue, setBudgetValue] = useState(totalBudget.toString())
  const [open, setOpen] = useState(false)
  const [simulatedDay, setSimulatedDay] = useState(
    dateOverride?.date ? new Date(dateOverride.date).getDate().toString() : ""
  )

  const handleSaveBudget = () => {
    const budget = parseFloat(budgetValue)
    if (!isNaN(budget) && budget > 0) {
      onUpdateBudget(budget)
    }
  }

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all data? This cannot be undone.")) {
      onReset()
      setOpen(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
        >
          <Settings className="w-5 h-5" />
          <span className="sr-only">Settings</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="mb-6">
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Manage your monthly budget and app data
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Budget Setting */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">
              Monthly Budget
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <IndianRupee className="w-5 h-5" />
              </div>
              <input
                type="number"
                inputMode="decimal"
                value={budgetValue}
                onChange={(e) => setBudgetValue(e.target.value)}
                className={cn(
                  "w-full h-12 pl-12 pr-4 rounded-xl",
                  "bg-input border border-border",
                  "text-lg font-medium text-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                  "transition-all duration-200"
                )}
              />
            </div>
            <Button
              onClick={handleSaveBudget}
              className="w-full rounded-xl"
            >
              Update Budget
            </Button>
          </div>

          {/* Date Simulation for Testing */}
          <div className="space-y-3 pt-4 border-t border-border">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Simulate Day (Testing)
            </label>
            <p className="text-xs text-muted-foreground">
              Current: {currentDate} ({daysInMonth} days in month)
              {dateOverride?.enabled && " - SIMULATED"}
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max={daysInMonth}
                placeholder={`Day (1-${daysInMonth})`}
                value={simulatedDay}
                onChange={(e) => setSimulatedDay(e.target.value)}
                className={cn(
                  "flex-1 h-10 px-4 rounded-xl",
                  "bg-input border border-border",
                  "text-sm text-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                )}
              />
              <Button
                variant="secondary"
                onClick={() => {
                  const day = parseInt(simulatedDay)
                  if (day >= 1 && day <= daysInMonth) {
                    const now = new Date()
                    const simulatedDate = new Date(now.getFullYear(), now.getMonth(), day)
                    onSetDateOverride(simulatedDate.toISOString().split("T")[0])
                  }
                }}
                className="rounded-xl"
              >
                Set
              </Button>
              {dateOverride?.enabled && (
                <Button
                  variant="outline"
                  onClick={() => onSetDateOverride(null)}
                  className="rounded-xl"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Reset Data */}
          <div className="pt-4 border-t border-border">
            <Button
              variant="destructive"
              onClick={handleReset}
              className="w-full rounded-xl"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset All Data
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              This will clear all expenses and reset your budget
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
