import React from 'react';
import WelcomeSurvey from '../components/WelcomeSurvey';

const WelcomeSurveyPage: React.FC = () => {
  const handleSurveyCompleted = () => {
    window.location.hash = '#/presentation';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-slate-900 to-slate-900">
      <WelcomeSurvey onCompleted={handleSurveyCompleted} />
    </div>
  );
};

export default WelcomeSurveyPage;


