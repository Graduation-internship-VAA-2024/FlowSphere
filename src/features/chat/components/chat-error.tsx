import React from "react";
import { Card } from "@/components/ui/card";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ChatErrorProps {
  title?: string;
  message: string;
  retry?: () => void;
}

export const ChatError: React.FC<ChatErrorProps> = ({
  title = "Error",
  message,
  retry,
}) => {
  return (
    <Card className="p-8">
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>

      {retry && (
        <div className="mt-4 text-center">
          <Button 
            onClick={retry} 
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      )}
    </Card>
  );
}; 