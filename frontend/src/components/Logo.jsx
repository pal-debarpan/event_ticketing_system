import React from 'react';
import logoImg from '../assets/logo.png';

export default function Logo({
  className = "h-8 w-auto",
  showText = false,
  textClassName = "text-xl font-bold tracking-tight text-slate-900 dark:text-white",
  subtext = null,
}) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <img
        src={logoImg}
        alt="EventPass Logo"
        className={`object-contain transition-transform duration-200 group-hover:scale-105 shrink-0 dark:brightness-110 dark:drop-shadow-[0_0_10px_rgba(59,130,246,0.35)] ${className}`}
      />
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={textClassName}>EventPass</span>
          {subtext && (
            <span className="text-[10px] tracking-wide text-slate-500 dark:text-slate-400 font-medium">
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
