/**
 * Card de Receita
 */

import React from 'react';
import { Card } from './ui/Card';
import { Recipe } from '../services/recipeService';
import { RatingStars } from './RatingStars';

export interface RecipeCardProps {
  recipe: Recipe;
  onClick?: () => void;
  onAddToShoppingList?: () => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onClick,
  onAddToShoppingList,
}) => {
  const totalTime = recipe.prepTime + recipe.cookTime;

  const getDifficultyColor = (difficulty: Recipe['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    }
  };

  const getDifficultyLabel = (difficulty: Recipe['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'Fácil';
      case 'medium': return 'Médio';
      case 'hard': return 'Difícil';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      {recipe.imageUrl && (
        <div className="w-full h-48 bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            {recipe.title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
            {recipe.description}
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
          <span>⏱️ {totalTime} min</span>
          <span>👥 {recipe.servings} porções</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
            {getDifficultyLabel(recipe.difficulty)}
          </span>
        </div>

        {recipe.rating && (
          <div className="flex items-center gap-2">
            <RatingStars rating={recipe.rating} size="sm" showLabel />
            {recipe.ratingCount && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ({recipe.ratingCount})
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {recipe.dietaryTags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {recipe.nutrition.calories} kcal • {recipe.nutrition.protein}g proteína
          </div>
          {onAddToShoppingList && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToShoppingList();
              }}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
            >
              + Lista
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};

