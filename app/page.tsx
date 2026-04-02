"use client"

import { useSpendControl } from "@/hooks/use-spend-control"
import { SmartRapdCard } from "@/components/smart-rapd-card"
import { ProjectionCard } from "@/components/projection-card"
import { RealitySection } from "@/components/reality-section"
import { HistorySection } from "@/components/history-section"
import { ExpenseInput } from "@/components/expense-input"
import { SettingsSheet } from "@/components/settings-sheet"
import { Spinner } from "@/components/ui/spinner"

export default function SpendControlApp() {
  const {
    totalBudget,
    totalSpent,
    remainingAmount,
    remainingDays,
    daysInMonth,
    dayOfMonth,
    baseRapd,
    smartRapd,
    percentageChange,
    isImproving,
    projectedSavings,
    todayExpenses,
    dailyEntries,
    dailyBudget,
    addExpense,
    updateBudget,
    resetData,
    isLoaded,
    currentDate,
    dateOverride,
    setDateOverride,
  } = useSpendControl()

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="w-8 h-8 text-primary" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">SpendControl</h1>
            <p className="text-xs text-muted-foreground">
              Day {dayOfMonth} of {daysInMonth}
            </p>
          </div>
          <SettingsSheet
            totalBudget={totalBudget}
            onUpdateBudget={updateBudget}
            onReset={resetData}
            currentDate={currentDate}
            dateOverride={dateOverride}
            onSetDateOverride={setDateOverride}
            daysInMonth={daysInMonth}
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Budget Progress */}
        <div className="rounded-xl p-3 bg-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Budget Used</span>
            <span className="text-xs font-medium text-foreground">
              ₹{Math.round(totalSpent).toLocaleString("en-IN")} / ₹{Math.round(totalBudget).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Smart RAPD Hero Card */}
        <SmartRapdCard
          smartRapd={smartRapd}
          percentageChange={percentageChange}
          isImproving={isImproving}
        />

        {/* Projection Card */}
        <ProjectionCard projectedSavings={projectedSavings} />

        {/* Reality Section */}
        <RealitySection
          remainingAmount={remainingAmount}
          remainingDays={remainingDays}
          baseRapd={baseRapd}
        />

        {/* Expense History */}
        <HistorySection
          dailyEntries={dailyEntries}
          dailyBudget={dailyBudget}
        />
      </div>

      {/* Bottom Expense Input */}
      <ExpenseInput
        onAddExpense={addExpense}
        todayExpenses={todayExpenses}
      />
    </main>
  )
}
