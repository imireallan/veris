import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { 
  FileText, 
  Lock, 
  Globe, 
  Building, 
  Copy, 
  MoreVertical,
  CheckCircle,
  Clock,
  Trash2,
  Edit
} from "lucide-react";

interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    slug: string;
    description: string;
    framework_name?: string;
    version: string;
    status: string;
    is_public: boolean;
    owner_org?: any;
    question_count?: number;
    instance_count?: number;
    created_at: string;
  };
  canEdit: boolean;
  onDuplicate: () => void;
  onPublish: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TemplateCard({
  template,
  canEdit,
  onDuplicate,
  onPublish,
  onEdit,
  onDelete,
}: TemplateCardProps) {
  const statusColors: Record<string, string> = {
    DRAFT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    PUBLISHED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    ARCHIVED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  };

  const statusIcons: Record<string, any> = {
    DRAFT: Clock,
    PUBLISHED: CheckCircle,
    ARCHIVED: Lock,
  };

  const StatusIcon = statusIcons[template.status] || Clock;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Template Info */}
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-3 flex-wrap">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">{template.name}</h3>
              <Badge variant="secondary" className="text-xs">
                v{template.version}
              </Badge>
              <Badge className={statusColors[template.status]}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {template.status}
              </Badge>
            </div>

            {/* Description */}
            {template.description && (
              <p className="text-sm text-muted-foreground">
                {template.description}
              </p>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
              {template.framework_name && (
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {template.framework_name}
                </span>
              )}
              {template.question_count !== undefined && (
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {template.question_count} questions
                </span>
              )}
              {template.instance_count !== undefined && (
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  {template.instance_count} instances
                </span>
              )}
            </div>

            {/* Visibility Badges */}
            <div className="flex items-center gap-2">
              {template.is_public ? (
                <Badge variant="outline" className="gap-1">
                  <Globe className="w-3 h-3" />
                  Public
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <Lock className="w-3 h-3" />
                  Private
                </Badge>
              )}
              {template.owner_org && (
                <Badge variant="outline" className="gap-1">
                  <Building className="w-3 h-3" />
                  {template.owner_org.name}
                </Badge>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          {canEdit && (
            <div className="flex items-center gap-2">
              {template.status === "DRAFT" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPublish}
                  className="text-green-600 hover:text-green-700"
                >
                  Publish
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onDuplicate}
              >
                <Copy className="w-4 h-4 mr-1" />
                Duplicate
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted transition-colors cursor-pointer">
                  <MoreVertical className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={onEdit}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem onClick={onDelete} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
