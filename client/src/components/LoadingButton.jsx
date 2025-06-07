import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingButton = ({ 
  loading, 
  onClick, 
  disabled, 
  children, 
  loadingText, 
  className = '',
  icon: Icon,
  ...props 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`flex items-center gap-3 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          {loadingText}
        </>
      ) : (
        <>
          {Icon && <Icon className="w-5 h-5" />}
          {children}
        </>
      )}
    </button>
  );
};

export default LoadingButton;
