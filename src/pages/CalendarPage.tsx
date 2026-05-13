import { CalendarView } from '@/components/calendar/CalendarView'

export default function CalendarPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-sm font-semibold text-text-primary">Calendar</h1>
        <p className="text-xs text-text-muted mt-0.5">Manage time periods</p>
      </div>
      <div className="flex-1 overflow-hidden">
        <CalendarView />
      </div>
    </div>
  )
}
