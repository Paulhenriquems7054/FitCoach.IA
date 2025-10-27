
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CameraIcon } from './icons/CameraIcon';
import { XIcon } from './icons/XIcon';

interface ImageUploaderProps {
    onImageUpload: (base64: string, mimeType: string) => void;
    onImageRemove: () => void;
}

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, onImageRemove }) => {
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setError(null);
        const file = acceptedFiles[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('A imagem é muito grande. O limite é 5MB.');
                return;
            }
            try {
                const base64String = await toBase64(file);
                const base64Data = base64String.split(',')[1];
                setPreview(base64String);
                onImageUpload(base64Data, file.type);
            } catch (err) {
                setError('Não foi possível processar a imagem.');
            }
        }
    }, [onImageUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/jpeg': [], 'image/png': [] },
        maxFiles: 1,
        multiple: false,
    });

    const handleRemoveImage = () => {
        setPreview(null);
        setError(null);
        onImageRemove();
    };

    return (
        <div className="w-full">
            {preview ? (
                <div className="relative group">
                    <img src={preview} alt="Pré-visualização da refeição" className="w-full h-auto object-cover rounded-lg" />
                    <button
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white"
                        aria-label="Remover imagem"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
            ) : (
                <div
                    {...getRootProps()}
                    className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                    ${isDragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-primary-400 dark:hover:border-primary-600 bg-slate-50 dark:bg-slate-800/30'}`}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                        <CameraIcon className="w-10 h-10 mb-3 text-slate-400 dark:text-slate-500" />
                        <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                            <span className="font-semibold text-primary-600 dark:text-primary-400">Clique para enviar</span> ou arraste e solte
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">PNG ou JPG (MAX. 5MB)</p>
                    </div>
                </div>
            )}
            {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
    );
};
