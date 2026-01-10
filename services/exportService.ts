/**
 * Serviço de Exportação e Compartilhamento
 * Sistema completo de exportação em múltiplos formatos e compartilhamento
 */

import { logger } from '../utils/logger';
import type { User } from '../types';
import { backupService } from './backupService';
// Importações dinâmicas para evitar problemas de bundle
let html2pdf: any = null;
let XLSX: any = null;

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'json' | 'csv';
  includeData: {
    profile?: boolean;
    workouts?: boolean;
    meals?: boolean;
    progress?: boolean;
    achievements?: boolean;
    ratings?: boolean;
  };
}

export interface ShareOptions {
  platform: 'whatsapp' | 'instagram' | 'facebook' | 'twitter' | 'link' | 'qr';
  content: 'progress' | 'achievement' | 'workout' | 'meal';
  data?: any;
}

class ExportService {
  /**
   * Exporta dados do usuário em PDF
   */
  async exportToPDF(user: User, options: ExportOptions): Promise<void> {
    try {
      // Importação dinâmica
      if (!html2pdf) {
        html2pdf = (await import('html2pdf.js')).default;
      }

      // Criar elemento HTML temporário
      const element = document.createElement('div');
      element.innerHTML = this.generatePDFContent(user, options);
      element.style.padding = '20px';
      element.style.fontFamily = 'Arial, sans-serif';

      // Configurações do PDF
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `fitcoach-relatorio-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      await html2pdf().set(opt).from(element).save();
      logger.info('PDF exportado com sucesso', 'exportService');
    } catch (error) {
      logger.error('Erro ao exportar PDF', 'exportService', error);
      throw error;
    }
  }

  /**
   * Exporta dados do usuário em Excel (CSV formatado como Excel)
   */
  async exportToExcel(user: User, options: ExportOptions): Promise<void> {
    try {
      // Usar CSV como alternativa (mais compatível sem biblioteca)
      const csv = await this.exportToCSV(user, options);
      
      // Criar blob e fazer download
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitcoach-relatorio-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      logger.info('Excel (CSV) exportado com sucesso', 'exportService');
    } catch (error) {
      logger.error('Erro ao exportar Excel', 'exportService', error);
      throw error;
    }
  }

  /**
   * Exporta dados do usuário em JSON
   */
  async exportToJSON(user: User, options: ExportOptions): Promise<string> {
    try {
      const backup = await backupService.createBackup(user, 'manual');
      return JSON.stringify(backup, null, 2);
    } catch (error) {
      logger.error('Erro ao exportar JSON', 'exportService', error);
      throw error;
    }
  }

  /**
   * Exporta dados do usuário em CSV
   */
  async exportToCSV(user: User, options: ExportOptions): Promise<string> {
    try {
      const rows: string[][] = [];

      if (options.includeData.profile) {
        rows.push(['Campo', 'Valor']);
        rows.push(['Nome', user.nome]);
        rows.push(['Idade', user.idade.toString()]);
        rows.push(['Gênero', user.genero]);
        rows.push(['Peso', user.peso.toString()]);
        rows.push(['Altura', user.altura.toString()]);
        rows.push(['Objetivo', user.objetivo]);
        rows.push([]);
      }

      if (options.includeData.progress && user.weightHistory) {
        rows.push(['Data', 'Peso (kg)']);
        user.weightHistory.forEach(entry => {
          rows.push([entry.date, entry.weight.toString()]);
        });
      }

      // Converter para CSV
      return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    } catch (error) {
      logger.error('Erro ao exportar CSV', 'exportService', error);
      throw error;
    }
  }

  /**
   * Gera conteúdo HTML para PDF
   */
  private generatePDFContent(user: User, options: ExportOptions): string {
    let html = `
      <div style="max-width: 800px; margin: 0 auto;">
        <h1 style="text-align: center; color: #10b981; margin-bottom: 30px;">
          FitCoach.IA - Relatório de Progresso
        </h1>
    `;

    if (options.includeData.profile) {
      html += `
        <div style="margin-bottom: 30px;">
          <h2 style="color: #334155; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
            Perfil
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; font-weight: bold;">Nome:</td><td style="padding: 8px;">${user.nome}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Idade:</td><td style="padding: 8px;">${user.idade} anos</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Gênero:</td><td style="padding: 8px;">${user.genero}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Peso:</td><td style="padding: 8px;">${user.peso} kg</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Altura:</td><td style="padding: 8px;">${user.altura} cm</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Objetivo:</td><td style="padding: 8px;">${user.objetivo}</td></tr>
          </table>
        </div>
      `;
    }

    if (options.includeData.progress && user.weightHistory && user.weightHistory.length > 0) {
      html += `
        <div style="margin-bottom: 30px;">
          <h2 style="color: #334155; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
            Histórico de Peso
          </h2>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0;">
            <thead>
              <tr style="background-color: #f1f5f9;">
                <th style="padding: 10px; text-align: left; border: 1px solid #e2e8f0;">Data</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #e2e8f0;">Peso (kg)</th>
              </tr>
            </thead>
            <tbody>
      `;

      user.weightHistory.forEach(entry => {
        html += `
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${new Date(entry.date).toLocaleDateString('pt-BR')}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${entry.weight} kg</td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
        </div>
      `;
    }

    html += `
        <div style="margin-top: 40px; text-align: center; color: #64748b; font-size: 12px;">
          <p>Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
          <p>FitCoach.IA - Seu assistente de treino inteligente</p>
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Compartilha progresso em redes sociais
   */
  async shareProgress(user: User, options: ShareOptions): Promise<void> {
    try {
      const shareData = this.generateShareContent(user, options);

      switch (options.platform) {
        case 'whatsapp':
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareData.text)}`;
          window.open(whatsappUrl, '_blank');
          break;

        case 'facebook':
          const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url || window.location.href)}`;
          window.open(facebookUrl, '_blank');
          break;

        case 'twitter':
          const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}`;
          window.open(twitterUrl, '_blank');
          break;

        case 'instagram':
          // Instagram não suporta compartilhamento direto via URL
          // Usuário precisa copiar a imagem e colar no Instagram
          logger.info('Compartilhamento Instagram requer ação manual', 'exportService');
          break;

        case 'link':
          // Copiar link para clipboard
          await navigator.clipboard.writeText(shareData.url || window.location.href);
          break;

        case 'qr':
          // Gerar QR Code (será implementado)
          logger.info('QR Code será implementado', 'exportService');
          break;
      }

      logger.info(`Progresso compartilhado via ${options.platform}`, 'exportService');
    } catch (error) {
      logger.error('Erro ao compartilhar progresso', 'exportService', error);
      throw error;
    }
  }

  /**
   * Gera conteúdo para compartilhamento
   */
  private generateShareContent(user: User, options: ShareOptions): { text: string; url?: string } {
    let text = '';

    switch (options.content) {
      case 'progress':
        const latestWeight = user.weightHistory && user.weightHistory.length > 0
          ? user.weightHistory[user.weightHistory.length - 1].weight
          : user.peso;
        text = `🏋️ Meu progresso no FitCoach.IA!\n\nPeso atual: ${latestWeight} kg\nObjetivo: ${user.objetivo}\n\n#FitCoachIA #Fitness #Progresso`;
        break;

      case 'achievement':
        text = `🏆 Conquistei uma nova conquista no FitCoach.IA!\n\n#FitCoachIA #Conquista #Fitness`;
        break;

      case 'workout':
        text = `💪 Acabei de completar um treino no FitCoach.IA!\n\n#FitCoachIA #Treino #Fitness`;
        break;

      case 'meal':
        text = `🍽️ Nova refeição registrada no FitCoach.IA!\n\n#FitCoachIA #Nutrição #Fitness`;
        break;
    }

    return {
      text,
      url: window.location.href,
    };
  }

  /**
   * Gera QR Code para compartilhamento
   */
  async generateQRCode(data: string): Promise<string> {
    // Em produção, usar biblioteca como qrcode.react ou similar
    // Por enquanto, retornar URL de API externa
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
    return qrUrl;
  }
}

// Instância singleton
export const exportService = new ExportService();

