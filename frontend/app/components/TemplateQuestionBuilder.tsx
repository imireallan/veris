import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { FrameworkMappingBadge } from "./FrameworkMappingBadge";
import { FrameworkMappingModal } from "./FrameworkMappingModal";
import { useToast } from "~/hooks/use-toast";

interface Question {
  id?: string;
  text: string;
  order: number;
  category: string;
  is_required: boolean;
  scoring_criteria?: any;
  framework_mappings?: any[];
}

interface TemplateQuestionBuilderProps {
  templateId: string;
  organizationId: string;
  questions: Question[];
  onChange: (questions: Question[]) => void;
  canEdit: boolean;
}

export function TemplateQuestionBuilder({
  templateId,
  organizationId,
  questions,
  onChange,
  canEdit,
}: TemplateQuestionBuilderProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [mappingModalOpen, setMappingModalOpen] = useState(false);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      text: "",
      order: questions.length + 1,
      category: "",
      is_required: true,
      framework_mappings: [],
    };
    onChange([...questions, newQuestion]);
  };

  const handleUpdateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleDeleteQuestion = (index: number) => {
    if (!confirm("Delete this question?")) return;
    
    const updated = questions.filter((_, i) => i !== index);
    // Re-order
    updated.forEach((q, i) => (q.order = i + 1));
    onChange(updated);
    toastSuccess("Question deleted");
  };

  const handleMappingAdded = (index: number, newMappings: any[]) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], framework_mappings: newMappings };
    onChange(updated);
    toastSuccess("Mapping added");
  };

  const handleMappingRemoved = (index: number, newMappings: any[]) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], framework_mappings: newMappings };
    onChange(updated);
    toastSuccess("Mapping removed");
  };

  const openMappingModal = (index: number) => {
    setSelectedQuestionIndex(index);
    setMappingModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Questions List */}
      {questions.map((question, index) => (
        <div
          key={question.id || index}
          className="p-4 border rounded-lg space-y-3 bg-card"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
              <Badge variant="secondary">Q{question.order}</Badge>
            </div>
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteQuestion(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Question Text */}
          <div className="space-y-1">
            <Label>Question Text *</Label>
            {canEdit ? (
              <textarea
                value={question.text}
                onChange={(e) =>
                  handleUpdateQuestion(index, "text", e.target.value)
                }
                rows={2}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="Enter the question..."
              />
            ) : (
              <p className="text-sm">{question.text}</p>
            )}
          </div>

          {/* Category & Required */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Category</Label>
              {canEdit ? (
                <Input
                  value={question.category}
                  onChange={(e) =>
                    handleUpdateQuestion(index, "category", e.target.value)
                  }
                  placeholder="e.g., Environmental"
                />
              ) : (
                <p className="text-sm">{question.category || "—"}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Required</Label>
              {canEdit ? (
                <select
                  value={question.is_required ? "true" : "false"}
                  onChange={(e) =>
                    handleUpdateQuestion(index, "is_required", e.target.value === "true")
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              ) : (
                <p className="text-sm">{question.is_required ? "Yes" : "No"}</p>
              )}
            </div>
          </div>

          {/* Framework Mappings */}
          <div className="space-y-1">
            <Label>Framework Mappings</Label>
            <div className="flex items-center gap-2">
              <FrameworkMappingBadge
                mappings={question.framework_mappings || []}
                onAdd={canEdit ? () => openMappingModal(index) : undefined}
                canEdit={canEdit}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Add Question Button */}
      {canEdit && (
        <Button
          type="button"
          variant="outline"
          onClick={handleAddQuestion}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      )}

      {/* Mapping Modal */}
      {selectedQuestionIndex !== null && questions[selectedQuestionIndex] && (
        <FrameworkMappingModal
          open={mappingModalOpen}
          onOpenChange={setMappingModalOpen}
          questionId={questions[selectedQuestionIndex].id || ""}
          organizationId={organizationId}
          currentMappings={questions[selectedQuestionIndex].framework_mappings || []}
          onMappingAdded={(mappings) =>
            handleMappingAdded(selectedQuestionIndex, mappings)
          }
          onMappingRemoved={(mappings) =>
            handleMappingRemoved(selectedQuestionIndex, mappings)
          }
        />
      )}
    </div>
  );
}
