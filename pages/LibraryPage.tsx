import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { useUser } from '../context/UserContext';
import { searchRecipes } from '../services/geminiService';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Skeleton } from '../components/ui/Skeleton';
import type { Recipe } from '../types';
import { BookOpenIcon } from '../components/icons/BookOpenIcon';

const RecipeCard: React.FC<{ recipe: Recipe }> = ({ recipe }) => (
    <Card className="flex flex-col h-full">
        <div className="p-6">
            <h3 className="text-xl font-bold text-primary-700 dark:text-primary-400">{recipe.nome_receita}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{recipe.descricao}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Tempo de Preparo: {recipe.tempo_preparo_min} min</p>
        </div>
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex-grow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="font-semibold mb-2">Ingredientes</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-300">
                        {recipe.ingredientes.map((ing, i) => <li key={i}>{ing}</li>)}
                    </ul>
                </div>
                 <div>
                    <h4 className="font-semibold mb-2">Instruções</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 dark:text-slate-300">
                         {recipe.instrucoes.map((step, i) => <li key={i}>{step}</li>)}
                    </ol>
                </div>
            </div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 text-xs grid grid-cols-4 text-center">
            <div><span className="font-bold">{recipe.informacao_nutricional.calorias}</span> kcal</div>
            <div><span className="font-bold">{recipe.informacao_nutricional.proteinas_g}g</span> P</div>
            <div><span className="font-bold">{recipe.informacao_nutricional.carboidratos_g}g</span> C</div>
            <div><span className="font-bold">{recipe.informacao_nutricional.gorduras_g}g</span> G</div>
        </div>
    </Card>
);

const RecipeSkeleton: React.FC = () => (
     <Card className="flex flex-col h-full">
        <div className="p-6">
            <Skeleton className="h-7 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex-grow">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                     <Skeleton className="h-5 w-1/3 mb-3" />
                     <div className="space-y-2">
                         <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-5/6" />
                         <Skeleton className="h-4 w-full" />
                     </div>
                 </div>
                 <div>
                     <Skeleton className="h-5 w-1/3 mb-3" />
                     <div className="space-y-2">
                         <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-full" />
                     </div>
                 </div>
             </div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 grid grid-cols-4 gap-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
        </div>
    </Card>
);


const LibraryPage: React.FC = () => {
    const { user, addPoints } = useUser();
    const [query, setQuery] = useState('');
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        
        setIsLoading(true);
        setError(null);
        setRecipes([]);
        setSearched(true);
        try {
            const results = await searchRecipes(query, user);
            setRecipes(results);
            addPoints(10);
        } catch (err) {
            console.error(err);
            setError("Ocorreu um erro ao buscar as receitas. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Biblioteca Nutricional</h1>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">Encontre a receita perfeita para seu objetivo, gerada por IA.</p>
            </div>
            
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8 flex gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Ex: um café da manhã rico em proteínas"
                    className="flex-1 block w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                <Button type="submit" isLoading={isLoading} size="lg">
                    Buscar
                </Button>
            </form>

            <div className="space-y-6">
                {isLoading && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <RecipeSkeleton />
                        <RecipeSkeleton />
                    </div>
                )}
                {error && <Alert type="error" title="Erro na Busca">{error}</Alert>}
                {!isLoading && !error && recipes.length > 0 && (
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {recipes.map((recipe, index) => <RecipeCard key={index} recipe={recipe} />)}
                     </div>
                )}
                {!isLoading && searched && recipes.length === 0 && !error && (
                    <Card>
                        <div className="p-8 text-center">
                            <h3 className="text-xl font-semibold">Nenhuma receita encontrada</h3>
                            <p className="text-slate-500 dark:text-slate-400 mt-2">Tente uma busca diferente para que a IA possa criar algo para você.</p>
                        </div>
                    </Card>
                )}
                 {!isLoading && !searched && (
                    <Card>
                         <div className="flex flex-col items-center justify-center min-h-[300px] p-6 text-center">
                            <BookOpenIcon className="w-16 h-16 text-primary-500" />
                            <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">O que você quer cozinhar hoje?</h2>
                            <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-md">
                                Diga à Nutri.IA o que você procura, e ela criará receitas deliciosas e personalizadas para o seu objetivo.
                            </p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default LibraryPage;