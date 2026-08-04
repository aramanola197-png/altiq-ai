import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ className = '' }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      aria-label="Go back"
      className={`inline-flex items-center gap-1.5 text-xs font-medium text-dark-ash hover:text-black transition-colors duration-200 ${className}`}
    >
      <ArrowLeft size={14} />
      Back
    </button>
  );
}
