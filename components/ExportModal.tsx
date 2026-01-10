/**
 * Modal de Exportação de Dados
 */

import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { exportService, ExportOptions } from '../services/exportService';
import { useUser } from '../context/UserContext';
import { logger } from '../utils/logger';
import { XIcon } from './icons/XIcon';
import { DownloadIcon } from './icons/DownloadIcon';

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useUser();
  const [format, setFormat] = useState<ExportOptions['format']>('pdf');
  const [includeData, setIncludeData] = useState<ExportOptions['includeData']>({
    profile: true,
    workouts: true,
    meals: true,
    progress: true,
    achievements: true,
    ratings: false,
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!user) return;

    setIsExporting(true);
    try {
      const options: ExportOptions = {
        format,
        includeData,
      };

      switch (format) {
        case 'pdf':
          await exportService.exportToPDF(user, options);
          break;
        case 'excel':
          await exportService.exportToExcel(user, options);
          break;
        case 'json':
          const json = await exportService.exportToJSON(user, options);
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `fitcoach-dados-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          break;
        case 'csv':
          const csv = await exportService.exportToCSV(user, options);
          const csvBlob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
          const csvUrl = URL.createObjectURL(csvBlob);
          const csvA = document.createElement('a');
          csvA.href = csvUrl;
          csvA.download = `fitcoach-dados-${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(csvA);
          csvA.click();
          document.body.removeChild(csvA);
          URL.revokeObjectURL(csvUrl);
          break;
      }

      onClose();
    } catch (error) {
      logger.error('Erro ao exportar dados', 'ExportModal', error);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleDataOption = (key: keyof ExportOptions['includeData']) => {
    setIncludeData(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DownloadIcon className="w-6 h-6" />
            Exportar Dados
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Formato */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Formato de Exportação
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['pdf', 'excel', 'json', 'csv'] as const).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${format === fmt
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }
                  `}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Dados a Incluir */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Dados a Incluir
            </label>
            <div className="space-y-2">
              {Object.entries(includeData).map(([key, value]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => toggleDataOption(key as keyof ExportOptions['includeData'])}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">
                    {key === 'profile' && 'Perfil'}
                    {key === 'workouts' && 'Treinos'}
                    {key === 'meals' && 'Refeições'}
                    {key === 'progress' && 'Progresso'}
                    {key === 'achievements' && 'Conquistas'}
                    {key === 'ratings' && 'Avaliações'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1"
            >
              {isExporting ? 'Exportando...' : 'Exportar'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

