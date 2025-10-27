
import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { useUser } from '../context/UserContext';
import { getFoodInfoFromBarcode } from '../services/geminiService';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Skeleton } from '../components/ui/Skeleton';
import type { FoodProductInfo } from '../types';
import { BarcodeIcon } from '../components/icons/BarcodeIcon';

const ScannerPage: React.FC = () => {
    const [productInfo, setProductInfo] = useState<FoodProductInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleScan = async () => {
        setIsLoading(true);
        setError(null);
        setProductInfo(null);
        try {
            // Simulate a barcode scan
            const mockBarcode = `7891000${Math.floor(Math.random() * 900000) + 100000}`;
            const result = await getFoodInfoFromBarcode(mockBarcode);
            setProductInfo(result);
        } catch (err) {
            setError("Ocorreu um erro ao buscar informações do produto.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="max-w-md mx-auto">
             <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Scanner de Alimentos</h1>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">Escaneie um código de barras para ver a análise da IA.</p>
            </div>
            
            <Card>
                <div className="p-6">
                    <Button onClick={handleScan} isLoading={isLoading} size="lg" className="w-full">
                        <BarcodeIcon className="w-6 h-6 mr-2" />
                        Escanear Produto (Simulação)
                    </Button>
                </div>
            </Card>

            <div className="mt-8">
                {isLoading && (
                    <Card><div className="p-6"><Skeleton className="h-48 w-full" /></div></Card>
                )}
                {error && <Alert type="error" title="Erro">{error}</Alert>}
                {productInfo && (
                    <Card>
                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{productInfo.marca}</p>
                                <h2 className="text-xl font-bold">{productInfo.nome_produto}</h2>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <h3 className="text-sm font-semibold mb-2">Informações Nutricionais (por 100g)</h3>
                                <div className="grid grid-cols-4 text-center text-xs">
                                    <div><p className="font-bold text-lg">{productInfo.calorias_por_100g}</p><p>kcal</p></div>
                                    <div><p className="font-bold text-lg">{productInfo.macros_por_100g.proteinas_g}g</p><p>Proteínas</p></div>
                                    <div><p className="font-bold text-lg">{productInfo.macros_por_100g.carboidratos_g}g</p><p>Carbs</p></div>
                                    <div><p className="font-bold text-lg">{productInfo.macros_por_100g.gorduras_g}g</p><p>Gorduras</p></div>
                                </div>
                            </div>
                            <div className="p-4 bg-sky-50 dark:bg-sky-900/30 rounded-lg">
                                <h3 className="font-semibold text-sky-800 dark:text-sky-300">Score de Saúde IA: <span className="text-2xl font-bold">{productInfo.health_score_ia}/10</span></h3>
                                <p className="text-sm text-sky-700 dark:text-sky-200 mt-1">{productInfo.avaliacao_ia}</p>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default ScannerPage;
