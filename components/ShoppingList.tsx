/**
 * Componente de Lista de Compras
 */

import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { recipeService, ShoppingListItem } from '../services/recipeService';
import { CheckIcon } from './icons/CheckIcon';
import { TrashIcon } from './icons/TrashIcon';
import { logger } from '../utils/logger';

export const ShoppingList: React.FC = () => {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [groupedItems, setGroupedItems] = useState<Map<string, ShoppingListItem[]>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShoppingList();
  }, []);

  const loadShoppingList = async () => {
    try {
      setLoading(true);
      const list = await recipeService.getShoppingList();
      const grouped = await recipeService.getGroupedShoppingList();
      setItems(list);
      setGroupedItems(grouped);
    } catch (error) {
      logger.error('Erro ao carregar lista de compras', 'ShoppingList', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    await recipeService.updateShoppingListItem(itemId, { checked: !item.checked });
    await loadShoppingList();
  };

  const removeItem = async (itemId: string) => {
    await recipeService.removeShoppingListItem(itemId);
    await loadShoppingList();
  };

  const clearChecked = async () => {
    const checkedItems = items.filter(item => item.checked);
    for (const item of checkedItems) {
      await recipeService.removeShoppingListItem(item.id);
    }
    await loadShoppingList();
  };

  const clearAll = async () => {
    if (window.confirm('Tem certeza que deseja limpar toda a lista de compras?')) {
      await recipeService.clearShoppingList();
      await loadShoppingList();
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <p className="text-slate-600 dark:text-slate-400">Carregando lista de compras...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Lista de Compras
          </h2>
          {items.length > 0 && (
            <div className="flex gap-2">
              {items.some(i => i.checked) && (
                <Button
                  variant="secondary"
                  onClick={clearChecked}
                  className="text-xs"
                >
                  Limpar Marcados
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={clearAll}
                className="text-xs bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300"
              >
                Limpar Tudo
              </Button>
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
            Sua lista de compras está vazia. Adicione ingredientes de receitas para começar!
          </p>
        ) : (
          <div className="space-y-4">
            {Array.from(groupedItems.entries()).map(([ingredientName, ingredientItems]) => {
              const allChecked = ingredientItems.every(item => item.checked);
              const totalAmount = ingredientItems.reduce((sum, item) => sum + item.ingredient.amount, 0);
              const firstItem = ingredientItems[0];

              return (
                <div
                  key={ingredientName}
                  className={`
                    p-3 rounded-lg border transition-colors
                    ${allChecked
                      ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => ingredientItems.forEach(item => toggleItem(item.id))}
                        className={`
                          w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                          ${allChecked
                            ? 'bg-primary-600 border-primary-600'
                            : 'border-slate-300 dark:border-slate-600'
                          }
                        `}
                      >
                        {allChecked && <CheckIcon className="w-3 h-3 text-white" />}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`
                            font-medium
                            ${allChecked
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-white'
                            }
                          `}>
                            {firstItem.ingredient.name}
                          </span>
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            {totalAmount} {firstItem.ingredient.unit}
                          </span>
                        </div>
                        {ingredientItems.length > 1 && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            De {ingredientItems.length} receita{ingredientItems.length > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => ingredientItems.forEach(item => removeItem(item.id))}
                      className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};

