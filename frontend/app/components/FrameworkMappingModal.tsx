import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { FrameworkMapping } from "./FrameworkMappingBadge";

interface FrameworkMappingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionId: string;
  organizationId: string;
  currentMappings: FrameworkMapping[];
  onMappingAdded: (mappings: FrameworkMapping[]) => void;
  onMappingRemoved: (mappings: FrameworkMapping[]) => void;
}

interface Framework {
  id: string;
  name: string;
  version: string;
}

export function FrameworkMappingModal({
  open,
  onOpenChange,
  questionId,
  organizationId,
  currentMappings,
  onMappingAdded,
  onMappingRemoved,
}: FrameworkMappingModalProps) {
  const fetcher = useFetcher();
  const [selectedFramework, setSelectedFramework] = useState("");
  const [provisionCode, setProvisionCode] = useState("");
  const [provisionName, setProvisionName] = useState("");
  const [frameworks, setFrameworks] = useState<Framework[]>([]);

  // Load frameworks when modal opens
  useEffect(() => {
    if (open && frameworks.length === 0) {
      fetch(`/api/frameworks/?org=${organizationId}`)
        .then((res) => res.json())
        .then((data) => {
          setFrameworks(Array.isArray(data) ? data : data.results || []);
        })
        .catch(console.error);
    }
  }, [open, organizationId, frameworks.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFramework) return;

    fetcher.submit(
      {
        intent: "add-mapping",
        question_id: questionId,
        framework_id: selectedFramework,
        provision_code: provisionCode,
        provision_name: provisionName,
      },
      { method: "post" }
    );

    resetForm();
    onOpenChange(false);
  };

  const handleRemove = (index: number) => {
    fetcher.submit(
      {
        intent: "remove-mapping",
        question_id: questionId,
        mapping_index: index.toString(),
      },
      { method: "post" }
    );
  };

  const resetForm = () => {
    setSelectedFramework("");
    setProvisionCode("");
    setProvisionName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Map to Framework</DialogTitle>
          <DialogDescription>
            Link this question to a provision in another framework. Answers will apply to all mapped frameworks.
          </DialogDescription>
        </DialogHeader>

        <fetcher.Form method="post" onSubmit={handleSubmit} className="space-y-4">
          {/* Current Mappings */}
          {currentMappings.length > 0 && (
            <div className="space-y-2">
              <Label>Current Mappings</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/50">
                {currentMappings.map((mapping, index) => (
                  <div
                    key={`${mapping.framework_id}-${mapping.provision_code}`}
                    className="flex items-center gap-2 bg-background border rounded-md px-3 py-1.5 text-sm"
                  >
                    <div>
                      <span className="font-medium">{mapping.framework_name}</span>
                      {mapping.provision_code && (
                        <span className="ml-1 text-muted-foreground">
                          {mapping.provision_code}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <span className="sr-only">Remove</span>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Mapping */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-medium">Add New Mapping</h4>

            <div className="space-y-2">
              <Label htmlFor="framework">Framework *</Label>
              <Select
                value={selectedFramework}
                onValueChange={(value) => setSelectedFramework(value ?? "")}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a framework" />
                </SelectTrigger>
                <SelectContent>
                  {frameworks.map((fw) => (
                    <SelectItem key={fw.id} value={fw.id}>
                      {fw.name} {fw.version && `(${fw.version})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provisionCode">Provision Code</Label>
              <Input
                id="provisionCode"
                value={provisionCode}
                onChange={(e) => setProvisionCode(e.target.value)}
                placeholder="e.g., P1.2.3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provisionName">Provision Name</Label>
              <Input
                id="provisionName"
                value={provisionName}
                onChange={(e) => setProvisionName(e.target.value)}
                placeholder="e.g., Environmental Policy"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedFramework}>
              Add Mapping
            </Button>
          </DialogFooter>
        </fetcher.Form>
      </DialogContent>
    </Dialog>
  );
}
