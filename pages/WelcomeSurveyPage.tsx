import React from 'react';
import WelcomeSurvey from '../components/WelcomeSurvey';
import { Logo } from '../components/Logo';

const WelcomeSurveyPage: React.FC = () => {
  const handleSurveyCompleted = () => {
    window.location.hash = '#/presentation';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-slate-900 to-slate-900">
      {/* Header com Logo e Nome do App */}
      <div className="pt-8 pb-4 px-4 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Logo size="lg" />
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight">
            <span className="text-emerald-400 drop-shadow-lg">Nutri</span>
            <span className="text-white drop-shadow-lg">.IA</span>
          </h1>
        </div>
        <p className="text-emerald-200 text-sm md:text-base mt-2">
          Seu Coach Nutricional Inteligente
        </p>
      </div>
      <WelcomeSurvey onCompleted={handleSurveyCompleted} />
    </div>
  );
};

export default WelcomeSurveyPage;


