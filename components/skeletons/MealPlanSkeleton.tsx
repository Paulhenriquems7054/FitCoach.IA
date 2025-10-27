import React from 'react';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';

export const MealPlanSkeleton: React.FC = () => (
    <div className="space-y-8">
        {/* Dashboard Skeleton */}
        <Card>
            <div className="p-6">
                <Skeleton className="h-6 w-1/3 mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </div>
        </Card>
        {/* Meal Plan Skeleton */}
        <Card>
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-8 w-1/4" />
                </div>
                <div className="space-y-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                            <div className="flex justify-between items-baseline">
                                <Skeleton className="h-5 w-1/4" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                            <div className="mt-3 space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                            </div>
                             <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-4">
                                <Skeleton className="h-3 w-12" />
                                <Skeleton className="h-3 w-12" />
                                <Skeleton className="h-3 w-12" />
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    </div>
);