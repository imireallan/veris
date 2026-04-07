import * as React from "react"
import { cn } from "~/lib/utils"
import { Button } from "./button"
import { Edit3, Save, X } from "lucide-react"

interface EditModeToolbarProps {
  editMode: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  className?: string
  saveText?: string
  cancelText?: string
}

/** Edit/view toggle with Save/Cancel buttons. */
export function EditModeToolbar({
  editMode,
  onEdit,
  onSave,
  onCancel,
  className,
  saveText = "Save",
  cancelText = "Cancel",
}: EditModeToolbarProps) {
  if (!editMode) {
    return (
      <Button variant="outline" size="sm" onClick={onEdit} className={className}>
        <Edit3 className="w-3.5 h-3.5" /> Edit
      </Button>
    )
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button size="sm" onClick={onSave}>
        <Save className="w-3.5 h-3.5 mr-1.5" /> {saveText}
      </Button>
      <Button variant="outline" size="sm" onClick={onCancel}>
        <X className="w-3.5 h-3.5 mr-1.5" /> {cancelText}
      </Button>
    </div>
  )
}
