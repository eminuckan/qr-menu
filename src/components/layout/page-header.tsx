"use client"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Edit2, X } from "lucide-react";
import { useRouter } from "nextjs-toploader/app";
import React from "react";

interface PageHeaderProps {
  title: string;
  onTitleChange?: (newTitle: string) => Promise<void>;
  isEditable?: boolean;
  showBackButton?: boolean;
  backPath?: string;
}

const PageHeader = ({
  title,
  onTitleChange,
  isEditable = false,
  showBackButton = true,
  backPath = "/dashboard",
}: PageHeaderProps) => {
  const router = useRouter();
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState(title);

  React.useEffect(() => {
    setEditedTitle(title);
  }, [title]);

  const handleTitleEdit = async () => {
    if (onTitleChange) {
      await onTitleChange(editedTitle);
      setIsEditingTitle(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {showBackButton && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push(backPath)}
          className="bg-black hover:bg-black/90 text-white hover:text-white border-0 !h-12 !w-12"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Button>
      )}

      <div className="flex items-center gap-2 min-h-[2.5rem] group w-full">
        {isEditable && isEditingTitle ? (
          <div className="flex items-center gap-2">
            <div className="w-fit">
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="text-4xl font-bold h-auto py-1 px-0 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                autoFocus
              />
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTitleEdit}
                className="h-auto p-1"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingTitle(false)}
                className="h-auto p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h2 className="text-4xl font-bold py-1">{title}</h2>
            {isEditable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditedTitle(title);
                  setIsEditingTitle(true);
                }}
                className="h-auto p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader; 