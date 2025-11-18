/**
 * Componente para gerar e exibir QR Code
 * Usado para distribuição de academias
 */

import React, { useEffect, useRef, useState } from 'react';
import { logger } from '../utils/logger';

interface QRCodeGeneratorProps {
  data: string; // Dados para codificar no QR code
  size?: number; // Tamanho do QR code em pixels
  className?: string;
  onGenerated?: (dataUrl: string) => void; // Callback quando QR code for gerado
}

/**
 * Componente simples de QR Code usando Canvas
 * Em produção, pode usar biblioteca como 'qrcode.react' ou 'react-qr-code'
 */
export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  data,
  size = 200,
  className = '',
  onGenerated,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        // Tentar usar biblioteca QR code se disponível
        // Por enquanto, vamos criar um QR code simples usando canvas
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Limpar canvas
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);

        // Gerar padrão simples (placeholder)
        // Em produção, usar biblioteca real de QR code
        ctx.fillStyle = '#000000';
        
        // Padrão básico (será substituído por biblioteca real)
        const cellSize = size / 25; // 25x25 grid
        
        // Desenhar padrão de teste (código real seria gerado por biblioteca)
        for (let i = 0; i < 25; i++) {
          for (let j = 0; j < 25; j++) {
            if ((i + j) % 3 === 0 || (i === 0 || i === 24 || j === 0 || j === 24)) {
              ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
            }
          }
        }

        // Adicionar texto dos dados (temporário)
        ctx.fillStyle = '#000000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR Code', size / 2, size / 2);
        ctx.fillText('(Placeholder)', size / 2, size / 2 + 15);

        // Converter para data URL
        const url = canvas.toDataURL('image/png');
        setDataUrl(url);
        
        if (onGenerated) {
          onGenerated(url);
        }
      } catch (err) {
        logger.error('Erro ao gerar QR code', 'QRCodeGenerator', err);
        setError('Erro ao gerar QR code');
      }
    };

    generateQRCode();
  }, [data, size, onGenerated]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="border border-slate-300 rounded-lg"
      />
      <p className="text-xs text-slate-500 mt-2 text-center max-w-xs">
        Escaneie este QR code para baixar o app da academia
      </p>
    </div>
  );
};

/**
 * Hook para gerar QR code de academia
 */
export const useGymQRCode = (gymId: string, gymName: string) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const generate = async () => {
      setIsGenerating(true);
      try {
        // Dados para o QR code
        const qrData = JSON.stringify({
          type: 'gym_install',
          gymId,
          gymName,
          timestamp: Date.now(),
        });

        // Por enquanto, criar canvas simples
        // Em produção, usar biblioteca real
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, 200, 200);
          ctx.fillStyle = '#000000';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('QR Code', 100, 90);
          ctx.fillText(gymName, 100, 110);
          ctx.fillText('(Placeholder)', 100, 130);
        }

        const dataUrl = canvas.toDataURL('image/png');
        setQrCodeDataUrl(dataUrl);
      } catch (error) {
        logger.error('Erro ao gerar QR code da academia', 'useGymQRCode', error);
      } finally {
        setIsGenerating(false);
      }
    };

    if (gymId && gymName) {
      generate();
    }
  }, [gymId, gymName]);

  return { qrCodeDataUrl, isGenerating };
};

