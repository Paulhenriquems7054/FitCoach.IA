
import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { ImageUploader } from '../components/ImageUploader';
import { editImageWithText } from '../services/geminiService';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Skeleton } from '../components/ui/Skeleton';
import { useI18n } from '../context/I18nContext';

const ImageEditorPage: React.FC = () => {
    const { t } = useI18n();
    const [originalImage, setOriginalImage] = useState<{ base64: string; mimeType: string } | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageUpload = (base64: string, mimeType: string) => {
        setOriginalImage({ base64, mimeType });
        setEditedImage(null);
        setError(null);
    };

    const handleImageRemove = () => {
        setOriginalImage(null);
        setEditedImage(null);
    };

    const handleEdit = async () => {
        if (!originalImage || !prompt.trim()) return;
        setIsLoading(true);
        setError(null);
        setEditedImage(null);
        try {
            const result = await editImageWithText(originalImage.base64, originalImage.mimeType, prompt);
            setEditedImage(result);
        } catch (err) {
            console.error(err);
            setError(t('image_editor.error.generic'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('image_editor.title')}</h1>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">{t('image_editor.subtitle')}</p>
            </div>

            <Card>
                <div className="p-6">
                    {!originalImage && <ImageUploader onImageUpload={handleImageUpload} onImageRemove={handleImageRemove} />}
                    {originalImage && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder={t('image_editor.prompt_placeholder')}
                                    className="flex-1 block w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm"
                                />
                                <Button onClick={handleEdit} isLoading={isLoading} size="lg" className="w-full sm:w-auto">
                                    <SparklesIcon className="w-5 h-5 mr-2" />
                                    {t('image_editor.button')}
                                </Button>
                            </div>
                             <Button onClick={handleImageRemove} variant="secondary" size="sm">{t('image_editor.remove_image')}</Button>
                        </div>
                    )}
                </div>
            </Card>

            <div className="mt-8">
                {error && <Alert type="error" title={t('image_editor.error.title')}>{error}</Alert>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {originalImage && (
                        <div>
                            <h2 className="text-xl font-bold mb-2">{t('image_editor.original_title')}</h2>
                            <Card>
                                <img src={`data:${originalImage.mimeType};base64,${originalImage.base64}`} alt="Original" className="rounded-xl w-full" />
                            </Card>
                        </div>
                    )}
                    {isLoading && (
                         <div>
                            <h2 className="text-xl font-bold mb-2">{t('image_editor.edited_title')}</h2>
                            <Card>
                                <Skeleton className="w-full aspect-square" />
                            </Card>
                        </div>
                    )}
                    {editedImage && (
                        <div>
                            <h2 className="text-xl font-bold mb-2">{t('image_editor.edited_title')}</h2>
                            <Card>
                                 <img src={`data:image/png;base64,${editedImage}`} alt="Edited" className="rounded-xl w-full" />
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageEditorPage;
