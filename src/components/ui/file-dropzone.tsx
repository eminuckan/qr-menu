import * as React from "react"
import { useDropzone, DropzoneOptions } from "react-dropzone"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "./alert"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"

interface FileDropzoneProps extends DropzoneOptions {
  onDrop: (files: File[]) => void
  isUploading?: boolean
  maxSize?: number
  minWidth?: number
  minHeight?: number
  accept?: Record<string, string[]>
  multiple?: boolean
  className?: string
  children?: React.ReactNode
  fileType?: 'image' | 'animation'
}

export const FileDropzone = ({
  onDrop,
  isUploading = false,
  maxSize = 5 * 1024 * 1024, // 5MB default
  minWidth,
  minHeight,
  accept = {
    "image/*": [".jpeg", ".jpg", ".png"],
  },
  multiple = true,
  className,
  children,
  fileType = 'image'
}: FileDropzoneProps) => {

  const validateFile = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/') && minWidth && minHeight) {
        const img = new Image()
        img.src = URL.createObjectURL(file)

        img.onload = () => {
          URL.revokeObjectURL(img.src)
          if (img.width < minWidth || img.height < minHeight) {
            toast.error(`Fotoğraf boyutları minimum ${minWidth}x${minHeight} piksel olmalıdır.`);
            resolve(false)
          }
          resolve(true)
        }

        img.onerror = () => {
          URL.revokeObjectURL(img.src)
          toast.error("Fotoğraf yüklenirken bir hata oluştu.");
          resolve(false)
        }
      } else {
        resolve(true)
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
            const isValid = await validateFile(file)
            return isValid ? file : null
          })
        )

        const filteredFiles = validFiles.filter(Boolean) as File[]
        if (filteredFiles.length > 0) {
          await onDrop(filteredFiles)
        }
      }
    },
    onDropRejected: (fileRejections) => {
      fileRejections.forEach((rejection) => {
        const { errors } = rejection
        if (errors[0]?.code === "file-too-large") {
          toast.error(`Dosya boyutu ${(maxSize / 1024 / 1024).toFixed(0)}MB'dan küçük olmalıdır.`);
        }
      })
    },
    onError: () => {
      toast.error(fileType === 'animation' ? "Animasyon dosyası yüklenirken bir hata oluştu." : "Fotoğraf yüklenirken bir hata oluştu.");
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
          children || "Fotoğraf yüklemek için sürükleyin veya tıklayın"
        )}
      </div>
    </div>
  )
} 