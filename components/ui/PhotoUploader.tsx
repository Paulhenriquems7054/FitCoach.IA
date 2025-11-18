import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { CameraIcon } from '../icons/CameraIcon';
import { XIcon } from '../icons/XIcon';
import { Avatar } from './Avatar';
import { useToast } from './Toast';

interface PhotoUploaderProps {
  currentPhotoUrl?: string;
  userName: string;
  onPhotoChange: (photoUrl: string | null) => void;
  disabled?: boolean;
}

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = error => reject(error);
});

const compressImage = (file: File, maxWidth: number = 400, maxHeight: number = 400, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calcular novas dimensões mantendo proporção
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível criar contexto do canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Não foi possível comprimir a imagem'));
              return;
            }
            const compressedFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
  });
};

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ 
  currentPhotoUrl, 
  userName, 
  onPhotoChange, 
  disabled = false 
}) => {
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null);
  const { showError, showSuccess } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Atualizar preview quando currentPhotoUrl mudar
  useEffect(() => {
    setPreview(currentPhotoUrl || null);
  }, [currentPhotoUrl]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      // Comprimir imagem antes de converter para base64
      const compressedFile = await compressImage(file);
      const base64String = await toBase64(compressedFile);
      setPreview(base64String);
      onPhotoChange(base64String);
      showSuccess('Foto atualizada com sucesso!');
    } catch (err) {
      console.error('Erro ao processar imagem:', err);
      showError('Não foi possível processar a imagem. Tente novamente.');
    }
  }, [onPhotoChange, showError, showSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxFiles: 1,
    multiple: false,
    disabled,
  });

  const handleRemovePhoto = () => {
    setPreview(null);
    onPhotoChange(null);
    showSuccess('Foto removida com sucesso!');
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt={`Foto de perfil de ${userName}`}
              className="w-32 h-32 rounded-full object-cover border-4 border-slate-200 dark:border-slate-700 shadow-lg"
            />
            {!disabled && (
              <button
                onClick={handleRemovePhoto}
                className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label="Remover foto"
                type="button"
              >
                <XIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            <Avatar name={userName} size="xl" />
            {!disabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <CameraIcon className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
        )}
      </div>

      {!disabled && (
        <div className="w-full max-w-xs">
          <div
            {...getRootProps()}
            onClick={handleClick}
            className={`flex flex-col items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
              : 'border-slate-300 dark:border-slate-600 hover:border-primary-400 dark:hover:border-primary-600 bg-slate-50 dark:bg-slate-800/30'
            }`}
          >
            <input {...getInputProps()} ref={fileInputRef} />
            <div className="flex flex-col items-center justify-center text-center">
              <CameraIcon className="w-6 h-6 mb-2 text-slate-400 dark:text-slate-500" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-primary-600 dark:text-primary-400">
                  {preview ? 'Alterar foto' : 'Adicionar foto'}
                </span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                PNG ou JPG
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

