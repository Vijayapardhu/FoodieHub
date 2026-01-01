"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, Clock } from "lucide-react"
import { format, addDays, addHours, startOfToday, setHours, setMinutes } from "date-fns"

interface OrderSchedulingProps {
  onScheduleChange: (scheduledTime: Date | null, timeSlot: string | null) => void
  canteenOperatingHours?: any
}

export function OrderScheduling({
  onScheduleChange,
  canteenOperatingHours,
}: OrderSchedulingProps) {
  const [orderType, setOrderType] = useState<"immediate" | "scheduled">("immediate")
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  )
  const [selectedTime, setSelectedTime] = useState<string>(
    format(addHours(new Date(), 1), "HH:mm")
  )

  const today = startOfToday()
  const maxDate = format(addDays(today, 7), "yyyy-MM-dd")

  // Generate time slots (every 15 minutes from 9 AM to 9 PM)
  const generateTimeSlots = () => {
    const slots: string[] = []
    const startHour = 9
    const endHour = 21

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        slots.push(timeStr)
      }
    }

    return slots
  }

  const timeSlots = generateTimeSlots()

  const handleScheduleChange = () => {
    if (orderType === "scheduled") {
      const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}`)
      // Check if scheduled time is in the future
      if (scheduledDateTime <= new Date()) {
        alert("Please select a future time for scheduled orders")
        return
      }
      onScheduleChange(scheduledDateTime, `${selectedDate} ${selectedTime}`)
    } else {
      onScheduleChange(null, null)
    }
  }

  const handleQuickSlot = (hoursFromNow: number) => {
    const quickTime = addHours(new Date(), hoursFromNow)
    setSelectedDate(format(quickTime, "yyyy-MM-dd"))
    setSelectedTime(format(quickTime, "HH:mm"))
    setOrderType("scheduled")
    setTimeout(() => {
      onScheduleChange(quickTime, format(quickTime, "yyyy-MM-dd HH:mm"))
    }, 100)
  }

  return (
    <Card className="border-2 border-orange-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          Order Timing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Button
            type="button"
            variant={orderType === "immediate" ? "default" : "outline"}
            onClick={() => {
              setOrderType("immediate")
              onScheduleChange(null, null)
            }}
            className={`flex-1 rounded-full ${orderType === "immediate" ? "bg-primary text-white" : ""}`}
          >
            Order Now
          </Button>
          <Button
            type="button"
            variant={orderType === "scheduled" ? "default" : "outline"}
            onClick={() => {
              setOrderType("scheduled")
              handleScheduleChange()
            }}
            className={`flex-1 rounded-full ${orderType === "scheduled" ? "bg-primary text-white" : ""}`}
          >
            Schedule Later
          </Button>
        </div>

        {orderType === "scheduled" && (
          <div className="space-y-4 rounded-lg bg-orange-50/50 p-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Select Date
              </label>
              <Input
                type="date"
                value={selectedDate}
                min={format(today, "yyyy-MM-dd")}
                max={maxDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value)
                  handleScheduleChange()
                }}
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                Select Time
              </label>
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => {
                  setSelectedTime(e.target.value)
                  handleScheduleChange()
                }}
                className="rounded-lg"
              />
            </div>

            {/* Quick time slots */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Quick Select</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSlot(1)}
                  className="rounded-full text-xs"
                >
                  +1 Hour
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSlot(2)}
                  className="rounded-full text-xs"
                >
                  +2 Hours
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSlot(3)}
                  className="rounded-full text-xs"
                >
                  +3 Hours
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSlot(6)}
                  className="rounded-full text-xs"
                >
                  +6 Hours
                </Button>
              </div>
            </div>

            {selectedDate && selectedTime && (
              <div className="rounded-lg bg-white p-3 text-center">
                <p className="text-xs text-muted-foreground">Scheduled for</p>
                <p className="font-semibold text-primary">
                  {format(new Date(`${selectedDate}T${selectedTime}`), "PPpp")}
                </p>
              </div>
            )}
          </div>
        )}

        {orderType === "immediate" && (
          <div className="rounded-lg bg-blue-50/50 p-3 text-center">
            <p className="text-sm text-muted-foreground">
              Your order will be prepared immediately upon confirmation
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


