/**
 * PlateAnalyzer - Componente para análise de fotos de comida
 * 
 * Como funciona:
 * - Usuário tira foto ou escolhe da galeria
 * - Imagem é redimensionada (max 800x800px)
 * - Envia para analyzeFoodImage() que usa Gemini 2.5 Flash com visão
 * - Identifica alimentos, estima porção
 * - Calcula calorias e macros
 * - Retorna JSON estruturado
 * - Resultado é exibido e pode ser adicionado ao diário
 * - Imagem é salva no histórico de scans
 */

import React, { useState, useRef } from 'react';
import { analyzeFoodImage } from '../services/geminiService';
import { saveMealAnalysis } from '../services/databaseService';
import type { MealAnalysisResponse } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Alert } from './ui/Alert';
import { CameraIcon } from '@heroicons/react/24/outline';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { useToast } from './ui/Toast';
import { logger } from '../utils/logger';
import { TrialAccessGate } from './TrialAccessGate';
import { AiAccessGate } from './AiAccessGate';

/**
 * Redimensiona imagem para max 800x800px mantendo proporção
 */
const resizeImage = (file: File, maxWidth: number = 800, maxHeight: number = 800): Promise<string> => {
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
        const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        // Remover prefixo data:image/jpeg;base64,
        const base64Data = resizedBase64.split(',')[1];
        resolve(base64Data);
      };
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
  });
};

interface PlateAnalyzerProps {
  onAnalysisComplete?: (analysis: MealAnalysisResponse) => void;
  onAddToDiary?: (analysis: MealAnalysisResponse) => void;
}

export const PlateAnalyzer: React.FC<PlateAnalyzerProps> = ({
  onAnalysisComplete,
  onAddToDiary,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<MealAnalysisResponse | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useToast();

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showError('Por favor, selecione uma imagem válida');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showError('A imagem é muito grande. O limite é 10MB.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);
      setAnalysis(null);

      // Criar preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Redimensionar imagem
      const resizedBase64 = await resizeImage(file);
      const mimeType = file.type || 'image/jpeg';

      // Analisar imagem
      const result = await analyzeFoodImage(resizedBase64, mimeType);

      setAnalysis(result);

      // Salvar no histórico de scans
      try {
        await saveMealAnalysis(result, resizedBase64);
        logger.info('Análise salva no histórico de scans', 'PlateAnalyzer');
      } catch (saveError) {
        logger.warn('Erro ao salvar análise no histórico', 'PlateAnalyzer', saveError);
      }

      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }

      showSuccess('Análise concluída com sucesso!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao analisar imagem';
      setError(errorMessage);
      showError(errorMessage);
      logger.error('Erro ao analisar imagem', 'PlateAnalyzer', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleAddToDiary = () => {
    if (analysis && onAddToDiary) {
      onAddToDiary(analysis);
      showSuccess('Refeição adicionada ao diário!');
    }
  };

  return (
    <TrialAccessGate feature="photo_analysis" fallbackMessage="Trial expirado. Assine um plano para continuar analisando fotos de comida.">
      <AiAccessGate feature="vision">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Análise de Refeição
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Tire uma foto da sua refeição e descubra as informações nutricionais
        </p>
      </div>

      <Card>
        <div className="p-6">
          {!preview && !isAnalyzing && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={handleCameraClick}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <CameraIcon className="w-5 h-5" />
                  Tirar Foto
                </Button>
                <Button
                  onClick={handleCameraClick}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <PhotoIcon className="w-5 h-5" />
                  Escolher da Galeria
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}

          {preview && (
            <div className="mb-4">
              <img
                src={preview}
                alt="Preview"
                className="w-full max-w-md mx-auto rounded-lg shadow-md"
              />
            </div>
          )}

          {isAnalyzing && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-slate-600 dark:text-slate-400">
                Analisando refeição...
              </p>
            </div>
          )}

          {error && (
            <Alert type="error" title="Erro">
              {error}
            </Alert>
          )}

          {analysis && (
            <div className="space-y-4 mt-6">
              <div>
                <h2 className="text-xl font-semibold mb-3">Alimentos Identificados</h2>
                <div className="space-y-2">
                  {analysis.alimentos_identificados.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <span className="font-medium">{item.alimento}</span>
                      <span className="text-slate-600 dark:text-slate-400">{item.quantidade_estimada}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">Informação Nutricional</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {analysis.estimativa_nutricional.total_calorias}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Calorias</div>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {analysis.estimativa_nutricional.total_proteinas_g}g
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Proteínas</div>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {analysis.estimativa_nutricional.total_carboidratos_g}g
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Carboidratos</div>
                  </div>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {analysis.estimativa_nutricional.total_gorduras_g}g
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Gorduras</div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">Avaliação</h2>
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line">
                  {analysis.avaliacao_geral}
                </p>
              </div>

              {onAddToDiary && (
                <div className="pt-4">
                  <Button onClick={handleAddToDiary} size="lg" className="w-full">
                    Adicionar ao Diário
                  </Button>
                </div>
              )}

              <div className="pt-4">
                <Button
                  onClick={() => {
                    setPreview(null);
                    setAnalysis(null);
                    setError(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Analisar Outra Refeição
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
      </AiAccessGate>
    </TrialAccessGate>
  );
};

export default PlateAnalyzer;

