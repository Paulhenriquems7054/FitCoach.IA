/**
 * Página de Administração de Academia
 * Permite configurar branding, gerar QR code e gerenciar alunos
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import {
  createGym,
  loadGymConfig,
  saveGymBranding,
  loadGymBranding,
  generateGymQRCode,
  saveGymQRCode,
  getAppName,
} from '../services/gymConfigService';
import { QRCodeGenerator, useGymQRCode } from '../components/QRCodeGenerator';
import type { Gym, GymBranding } from '../types';
import { useGymBrandingContext } from '../components/GymBrandingProvider';

const GymAdminPage: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const { appName, colors } = useGymBrandingContext();
  const [gym, setGym] = useState<Gym | null>(null);
  const [branding, setBranding] = useState<GymBranding | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    appName: '',
    primaryColor: '#10b981',
    secondaryColor: '#059669',
    accentColor: '#34d399',
    logo: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
  });

  const { qrCodeDataUrl, isGenerating } = useGymQRCode(
    gym?.id || '',
    gym?.name || ''
  );

  useEffect(() => {
    const loadedGym = loadGymConfig();
    const loadedBranding = loadGymBranding();

    if (loadedGym) {
      setGym(loadedGym);
      setFormData({
        name: loadedGym.name,
        appName: loadedGym.appName || getAppName(),
        primaryColor: loadedGym.primaryColor || '#10b981',
        secondaryColor: loadedGym.secondaryColor || '#059669',
        accentColor: loadedGym.accentColor || '#34d399',
        logo: loadedGym.logo || '',
        contactEmail: loadedGym.contactEmail || '',
        contactPhone: loadedGym.contactPhone || '',
        website: loadedGym.website || '',
      });
    }

    if (loadedBranding) {
      setBranding(loadedBranding);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showError('Logo deve ter no máximo 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFormData((prev) => ({ ...prev, logo: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    try {
      let updatedGym: Gym;

      if (gym) {
        // Atualizar academia existente
        updatedGym = {
          ...gym,
          name: formData.name,
          appName: formData.appName,
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          accentColor: formData.accentColor,
          logo: formData.logo,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          website: formData.website,
          updatedAt: new Date().toISOString(),
        };
      } else {
        // Criar nova academia
        updatedGym = createGym({
          name: formData.name,
          appName: formData.appName,
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          accentColor: formData.accentColor,
          logo: formData.logo,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          website: formData.website,
          isActive: true,
        });
      }

      setGym(updatedGym);

      // Salvar branding
      const brandingData: GymBranding = {
        gymId: updatedGym.id,
        appName: formData.appName,
        logo: formData.logo,
        colors: {
          primary: formData.primaryColor,
          secondary: formData.secondaryColor,
          accent: formData.accentColor,
        },
      };

      saveGymBranding(brandingData);
      setBranding(brandingData);

      showSuccess('Configuração salva com sucesso!');
      setIsEditing(false);

      // Recarregar página para aplicar branding
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      showError('Erro ao salvar configuração');
      console.error(error);
    }
  };

  const handleGenerateQRCode = async () => {
    if (!gym) {
      showError('Configure a academia primeiro');
      return;
    }

    try {
      const qrCode = await generateGymQRCode(gym.id, gym.name);
      if (qrCode) {
        saveGymQRCode(gym.id, qrCode);
        showSuccess('QR Code gerado com sucesso!');
      }
    } catch (error) {
      showError('Erro ao gerar QR code');
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" style={{ color: colors.primary }}>
          Administração da Academia
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Configure o branding e gere QR codes para distribuição
        </p>
      </div>

      <div className="space-y-6">
        {/* Configuração da Academia */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Configuração da Academia</h2>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} style={{ backgroundColor: colors.primary }}>
                  Editar
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome da Academia *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Nome do App *</label>
                  <input
                    type="text"
                    name="appName"
                    value={formData.appName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ex: Academia XYZ - Nutri.IA"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Cor Primária</label>
                    <input
                      type="color"
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleInputChange}
                      className="w-full h-10 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Cor Secundária</label>
                    <input
                      type="color"
                      name="secondaryColor"
                      value={formData.secondaryColor}
                      onChange={handleInputChange}
                      className="w-full h-10 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Cor de Destaque</label>
                    <input
                      type="color"
                      name="accentColor"
                      value={formData.accentColor}
                      onChange={handleInputChange}
                      className="w-full h-10 border rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Logo (máx. 2MB)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  {formData.logo && (
                    <img
                      src={formData.logo}
                      alt="Logo preview"
                      className="mt-2 w-32 h-32 object-contain border rounded"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Email de Contato</label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Telefone</label>
                    <input
                      type="tel"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    style={{ backgroundColor: colors.primary }}
                  >
                    Salvar
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false);
                      // Recarregar dados
                      const loadedGym = loadGymConfig();
                      if (loadedGym) {
                        setFormData({
                          name: loadedGym.name,
                          appName: loadedGym.appName || getAppName(),
                          primaryColor: loadedGym.primaryColor || '#10b981',
                          secondaryColor: loadedGym.secondaryColor || '#059669',
                          accentColor: loadedGym.accentColor || '#34d399',
                          logo: loadedGym.logo || '',
                          contactEmail: loadedGym.contactEmail || '',
                          contactPhone: loadedGym.contactPhone || '',
                          website: loadedGym.website || '',
                        });
                      }
                    }}
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p><strong>Nome:</strong> {gym?.name || 'Não configurado'}</p>
                <p><strong>Nome do App:</strong> {appName}</p>
                <p><strong>Email:</strong> {gym?.contactEmail || 'Não informado'}</p>
                <p><strong>Telefone:</strong> {gym?.contactPhone || 'Não informado'}</p>
              </div>
            )}
          </div>
        </Card>

        {/* QR Code para Distribuição */}
        {gym && (
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">QR Code para Distribuição</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Compartilhe este QR code com seus alunos para que eles possam baixar o app
              </p>
              
              {qrCodeDataUrl ? (
                <div className="flex flex-col items-center">
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code da Academia"
                    className="w-64 h-64 border rounded-lg mb-4"
                  />
                  <Button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = qrCodeDataUrl;
                      link.download = `qrcode-${gym.name.replace(/\s+/g, '-')}.png`;
                      link.click();
                    }}
                    style={{ backgroundColor: colors.primary }}
                  >
                    Baixar QR Code
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500 mb-4">
                    {isGenerating ? 'Gerando QR code...' : 'QR code será gerado automaticamente'}
                  </p>
                  {!isGenerating && (
                    <Button
                      onClick={handleGenerateQRCode}
                      style={{ backgroundColor: colors.primary }}
                    >
                      Gerar QR Code
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GymAdminPage;

