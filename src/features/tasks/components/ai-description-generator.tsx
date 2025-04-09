import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { TextareaWithCounter } from "@/components/text-area-with-counter";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AIDescriptionGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  onDescriptionGenerated: (description: string) => void;
}

export function AIDescriptionGenerator({
  open,
  onOpenChange,
  taskTitle,
  onDescriptionGenerated,
}: AIDescriptionGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt first");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          taskTitle,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate description");
      }

      const data = await response.json();
      onDescriptionGenerated(data.description);

      if (data.truncated) {
        toast.warning("Description was truncated due to length limits");
      } else {
        toast.success("Description generated successfully");
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error generating description:", error);
      toast.error("Failed to generate description");
    } finally {
      setIsLoading(false);
    }
  };

  const examplePrompts = [
    "Create a detailed onboarding plan for new team members",
    "Write steps to implement user authentication in our app",
    "Design a weekly meeting agenda template",
    "Outline QA testing process for the new feature",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Description Generator
          </DialogTitle>
          <DialogDescription>
            Enter a prompt describing what you need help with, and AI will
            create a detailed task description for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Alert className="bg-amber-50 text-amber-800 border-amber-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Task descriptions are limited to 2,000 characters. Longer
              descriptions will be truncated.
            </AlertDescription>
          </Alert>

          <TextareaWithCounter
            placeholder="What should this task description include? Be specific about details you want included."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={500}
            maxRows={8}
            className="min-h-[100px] resize-none"
          />

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Example prompts:</h4>
            <div className="grid grid-cols-1 gap-2">
              {examplePrompts.map((examplePrompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="h-auto py-2 px-3 justify-start text-left font-normal text-muted-foreground"
                  onClick={() => setPrompt(examplePrompt)}
                >
                  {examplePrompt}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
