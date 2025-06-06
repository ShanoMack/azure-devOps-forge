
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkItem } from "@/types/azure-devops";
import { useSettings } from "@/contexts/SettingsContext";
import { createWorkItem } from "@/services/azure-devops-service";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function WorkItemForm() {
  const { settings, isConfigured, projectConfigs, selectedProjectConfig } = useSettings();
  const [loading, setLoading] = useState(false);
  const [projectConfigId, setProjectConfigId] = useState<string | undefined>(
    selectedProjectConfig?.id || undefined
  );
  const [formData, setFormData] = useState<WorkItem>({
    parentId: undefined,
    title: "",
    description: "",
    acceptanceCriteria: "",
    itemType: "PBI Feature" as WorkItem["itemType"],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleParentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      parentId: value ? parseInt(value, 10) : undefined,
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      itemType: value as WorkItem["itemType"],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConfigured) {
      toast.error("Please configure Azure DevOps settings first");
      return;
    }
    
    if (!formData.title) {
      toast.error("Title is required");
      return;
    }

    if (!projectConfigId) {
      toast.error("Please select a project");
      return;
    }

    const selectedConfig = projectConfigs.find(pc => pc.id === projectConfigId);
    if (!selectedConfig) {
      toast.error("Invalid project name");
      return;
    }
    
    setLoading(true);
    
    try {
      // Use the selected project config with the global PAT
      const configToUse = {
        personalAccessToken: settings.personalAccessToken,
        organization: selectedConfig.organization,
        project: selectedConfig.project
      };

      const result = await createWorkItem(
        configToUse,
        formData);
      
      toast.success(
        <div className="flex flex-col">
          <span>Work item created successfully!</span>
          <span className="text-sm text-muted-foreground">ID: {result.id}</span>
        </div>
      );
      
      // Reset form after successful submission
      setFormData({
        title: "",
        description: "",
        acceptanceCriteria: "",
        itemType: formData.itemType, // Keep the same item type for consecutive submissions
      });
    } catch (error: any) {
      toast.error(`Failed to create work item: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle>Create single backlog item</CardTitle>
        <CardDescription>
          Create a new work item in your selected project with added details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectConfig">Project Name</Label>
              <Select
                value={projectConfigId}
                onValueChange={setProjectConfigId}
              >
                <SelectTrigger id="projectConfig">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projectConfigs.map(config => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.name} ({config.organization}/{config.project})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                The board the work item will be created within
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="itemType">Work Item Type</Label>
              <Select 
                value={formData.itemType} 
                onValueChange={handleSelectChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select work item type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Epic">Epic</SelectItem>
                  <SelectItem value="Feature">Feature</SelectItem>
                  <SelectItem value="PBI Feature">PBI Feature</SelectItem>
                  <SelectItem value="PBI Spike">PBI Spike</SelectItem>
                  <SelectItem value="Task">Task</SelectItem>
                  <SelectItem value="Theme">Theme</SelectItem>
                  <SelectItem value="User Story">User Story</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentId">Parent ID (Optional)</Label>
              <Input
                id="parentId"
                name="parentId"
                value={formData.parentId}
                onChange={handleParentIdChange}
                placeholder="Enter parent work item ID"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Leave empty if you don't want to link to a parent
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter title"
              required
            />
          </div>
            
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="acceptanceCriteria">Acceptance Criteria</Label>
            <Textarea
              id="acceptanceCriteria"
              name="acceptanceCriteria"
              value={formData.acceptanceCriteria}
              onChange={handleInputChange}
              placeholder="Enter acceptance criteria"
              rows={5}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-azure hover:bg-azure-light" 
            disabled={loading || !isConfigured || !projectConfigId}
          >
            {loading ? "Creating..." : "Create Work Item"}
          </Button>
          
          {!isConfigured && (
            <p className="text-center text-sm text-muted-foreground">
              {!settings.personalAccessToken ? 
                "Please add your Personal Access Token in settings first." : 
                "Please add at least one project configuration first."}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
