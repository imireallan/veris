import * as React from "react"
import { cn } from "~/lib/utils"
import { Badge } from "./badge"
import { Card, CardContent } from "./card"
import type { Task } from "~/types"
import { Calendar } from "lucide-react"

interface TaskCardProps {
  task: Task
  onStatusChange?: (id: string, status: string) => void
  className?: string
}

export function TaskCard({ task, onStatusChange, className }: TaskCardProps) {
  const priorityVariant = task.priority === "HIGH" || task.priority === "CRITICAL" ? "destructive" : task.priority === "MEDIUM" ? "secondary" : "default"
  const statusVariant = task.status === "COMPLETED" ? "default" : task.status === "IN_PROGRESS" ? "secondary" : "outline"

  return (
    <Card className={cn("hover:shadow-sm transition-shadow", className)}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">{task.title}</h4>
          <div className="flex gap-1.5">
            <Badge variant={priorityVariant} className="text-[10px]">{task.priority}</Badge>
            <Badge variant={statusVariant} className="text-[10px]">{task.status.replace(/_/g, " ")}</Badge>
          </div>
        </div>
        {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
        {task.due_date && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            Due: {new Date(task.due_date).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
