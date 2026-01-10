
import React, { useState, useCallback, useRef } from 'react';
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
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const mountedRef = useRef(true);

    React.useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const handleFile = useCallback(async (file: File) => {
        if (!mountedRef.current) return;
        
        setError(null);
        
        // Validação de tipo de arquivo
        if (!file.type.startsWith('image/')) {
            setError('Por favor, selecione uma imagem válida (JPG ou PNG).');
            return;
        }
        
        // Validação de tamanho
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
            setError('A imagem é muito grande. O limite é 5MB. Tente comprimir a imagem.');
                return;
            }
        
            try {
                const base64String = await toBase64(file);
                const base64Data = base64String.split(',')[1];
            
            if (!mountedRef.current) return;
            
                setPreview(base64String);
                onImageUpload(base64Data, file.type);
            } catch (err) {
            if (!mountedRef.current) return;
            console.error('Erro ao processar imagem:', err);
            setError('Não foi possível processar a imagem. Tente novamente com outra imagem.');
        }
    }, [onImageUpload]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            await handleFile(file);
        }
    }, [handleFile]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 
            'image/jpeg': ['.jpg', '.jpeg'], 
            'image/png': ['.png'],
            'image/webp': ['.webp']
        },
        maxFiles: 1,
        multiple: false,
        noClick: false,
        noKeyboard: false,
    });
    
    // Handler para input nativo (mobile)
    const handleInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await handleFile(file);
        }
        // Reset input para permitir selecionar a mesma imagem novamente
        if (e.target) {
            e.target.value = '';
        }
    }, [handleFile]);

    const handleRemoveImage = () => {
        setPreview(null);
        setError(null);
        onImageRemove();
    };

    return (
        <div className="w-full">
            {/* Input nativo para melhor suporte mobile (câmera) */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={handleInputChange}
                className="hidden"
                aria-label="Selecionar foto da refeição"
            />
            
            {preview ? (
                <div className="relative group">
                    <img 
                        src={preview} 
                        alt="Pré-visualização da refeição" 
                        className="w-full h-auto max-h-96 object-cover rounded-lg"
                        loading="lazy"
                    />
                    <button
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-black/90 text-white rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white touch-manipulation"
                        aria-label="Remover imagem"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
            ) : (
                <>
                <div
                    {...getRootProps()}
                        className={`flex flex-col items-center justify-center w-full min-h-[200px] sm:min-h-[256px] border-2 border-dashed rounded-lg cursor-pointer transition-colors touch-manipulation
                        ${isDragActive ? 'border-slate-500 bg-slate-100 dark:bg-slate-700/30' : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 bg-slate-50 dark:bg-slate-800/30 active:bg-slate-100 dark:active:bg-slate-700/30'}`}
                >
                    <input {...getInputProps()} />
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                            <CameraIcon className="w-10 h-10 sm:w-12 sm:h-12 mb-3 text-slate-500 dark:text-slate-400" />
                            <p className="mb-2 text-sm sm:text-base text-slate-700 dark:text-slate-300 font-medium">
                                <span className="text-slate-900 dark:text-slate-100">Toque para tirar foto</span> ou escolher da galeria
                        </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                PNG, JPG ou WEBP (máx. 5MB)
                            </p>
                        </div>
                    </div>
                    {/* Botão adicional para mobile com acesso direto à câmera */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-3 w-full py-3 px-4 bg-slate-600 hover:bg-slate-700 dark:bg-slate-500 dark:hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 touch-manipulation active:bg-slate-800 dark:active:bg-slate-700"
                        aria-label="Abrir câmera"
                    >
                        <div className="flex items-center justify-center gap-2">
                            <CameraIcon className="w-5 h-5" />
                            <span>📷 Tirar Foto com Câmera</span>
                        </div>
                    </button>
                </>
            )}
            {error && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}
        </div>
    );
};
