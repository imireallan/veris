import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Plus, X } from "lucide-react";

export interface FrameworkMapping {
  framework_id: string;
  framework_name: string;
  provision_code: string;
  provision_name: string;
}

interface FrameworkMappingBadgeProps {
  mappings: FrameworkMapping[];
  onAdd?: () => void;
  onRemove?: (index: number) => void;
  canEdit?: boolean;
}

export function FrameworkMappingBadge({
  mappings,
  onAdd,
  onRemove,
  canEdit = false,
}: FrameworkMappingBadgeProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!mappings || mappings.length === 0) {
    return canEdit ? (
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-muted-foreground hover:text-primary"
        onClick={onAdd}
      >
        <Plus className="w-3 h-3 mr-1" />
        Map Framework
      </Button>
    ) : null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {mappings.map((mapping, index) => (
        <div
          key={`${mapping.framework_id}-${mapping.provision_code}`}
          className="relative group"
          title={`${mapping.framework_name}${mapping.provision_code ? ` ${mapping.provision_code}` : ""}${mapping.provision_name ? ` — ${mapping.provision_name}` : ""}`}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <Badge
            variant="secondary"
            className="h-6 px-2 text-xs font-medium bg-secondary/80 hover:bg-secondary"
          >
            {mapping.framework_name}
            {mapping.provision_code && (
              <span className="ml-1 opacity-70">
                {mapping.provision_code}
              </span>
            )}
          </Badge>
          {canEdit && hoveredIndex === index && onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(index);
              }}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      ))}
      {canEdit && onAdd && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-muted-foreground hover:text-primary"
          onClick={onAdd}
        >
          <Plus className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}
