import * as React from "react"
import { useDropzone } from "react-dropzone"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "./alert"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface FileDropzoneProps {
  onDrop: (files: File[]) => Promise<void>
  isUploading?: boolean
  maxSize?: number
  minWidth?: number
  minHeight?: number
  accept?: Record<string, string[]>
  multiple?: boolean
  className?: string
  alertMessage?: string | null
}

export function FileDropzone({
  onDrop,
  isUploading = false,
  maxSize = 5 * 1024 * 1024, // 5MB default
  minWidth = 350,
  minHeight = 350,
  accept = {
    "image/*": [".jpeg", ".jpg", ".png"],
  },
  multiple = true,
  className
}: FileDropzoneProps) {
  const { toast } = useToast()

  const validateImageDimensions = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.src = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(img.src)
        if (img.width < minWidth || img.height < minHeight) {
          toast({
            variant: "destructive",
            title: "Hata",
            description: `Fotoğraf boyutları minimum ${minWidth}x${minHeight} piksel olmalıdır.`,
          })
          resolve(false)
        }
        resolve(true)
      }

      img.onerror = () => {
        URL.revokeObjectURL(img.src)
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Fotoğraf yüklenirken bir hata oluştu.",
        })
        resolve(false)
      }
    })
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxSize,
    multiple,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles?.length > 0) {
        const validFiles = await Promise.all(
          acceptedFiles.map(async (file) => {
            const isValid = await validateImageDimensions(file);
            return isValid ? file : null;
          })
        );

        const filteredFiles = validFiles.filter(Boolean) as File[];
        if (filteredFiles.length > 0) {
          await onDrop(filteredFiles);
        }
      }
    },
    onDropRejected: (fileRejections) => {
      fileRejections.forEach((rejection) => {
        const { errors } = rejection
        if (errors[0]?.code === "file-too-large") {
          toast({
            variant: "destructive",
            title: "Hata",
            description: `Dosya boyutu ${(maxSize / 1024 / 1024).toFixed(0)}MB'dan küçük olmalıdır.`,
          })
        }
      })
    },
  })

  return (
    <div className={cn("space-y-4", className)}>

      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/10" : "hover:border-primary",
          className
        )}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p>Yükleniyor...</p>
          </div>
        ) : (
          <p>Fotoğraf yüklemek için sürükleyin veya tıklayın</p>
        )}
      </div>
    </div>
  )
} 