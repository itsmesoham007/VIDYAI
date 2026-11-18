'use client';

import React from 'react';

export interface VidyAILogoProps {
  /** Size preset ('xs' | 'sm' | 'md' | 'lg' | 'xl') or exact numeric pixel size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Whether to render the brand name & subtitle next to the icon */
  showText?: boolean;
  /** Custom subtitle under VidyAI (defaults to "GSEB English Medium") */
  subtitle?: string;
  /** Custom CSS classes for the outer wrapper */
  className?: string;
  /** Custom CSS classes for the icon container / img */
  iconClassName?: string;
  /** Subtle pulsing animation */
  animated?: boolean;
  /** Accessible alt text */
  alt?: string;
  /** Invert text colors for dark backgrounds (e.g. video splash) */
  inverted?: boolean;
}

/**
 * The Single Official VidyAI Brand Icon:
 * Open GSEB Textbook with Claude AI Starburst & Radiating Accents
 */
export const VidyAIIcon: React.FC<{
  size?: number;
  className?: string;
  animated?: boolean;
  alt?: string;
}> = ({ size = 36, className = '', animated = false, alt = 'VidyAI Logo' }) => {
  return (
    <img
      src="/logo.png"
      alt={alt}
      width={size}
      height={size}
      loading="eager"
      decoding="async"
      className={`select-none shrink-0 object-contain ${animated ? 'animate-pulse' : ''} ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
};

/**
 * Unified VidyAI Brand Logo Component
 * - Displays the official VidyAI graphic mark across all modals, sidebar, chat, and headers
 * - Responsive sizes: 'xs' (20px), 'sm' (32px), 'md' (40px), 'lg' (56px), 'xl' (80px), or custom numeric px
 * - Optional brand text ('VidyAI' + 'GSEB English Medium')
 */
export const VidyAILogo: React.FC<VidyAILogoProps> = ({
  size = 'md',
  showText = false,
  subtitle = 'GSEB English Medium',
  className = '',
  iconClassName = '',
  animated = false,
  alt = 'VidyAI Logo',
  inverted = false
}) => {
  const getPixelSize = (): number => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'xs':
        return 20;
      case 'sm':
        return 32;
      case 'md':
        return 40;
      case 'lg':
        return 56;
      case 'xl':
        return 80;
      default:
        return 40;
    }
  };

  const getTextClasses = () => {
    if (typeof size === 'number') {
      if (size <= 24) return { title: 'text-xs', sub: 'text-[9px]' };
      if (size <= 36) return { title: 'text-sm', sub: 'text-[10px]' };
      if (size <= 50) return { title: 'text-base', sub: 'text-xs' };
      return { title: 'text-2xl', sub: 'text-sm' };
    }
    switch (size) {
      case 'xs':
        return { title: 'text-xs font-bold', sub: 'text-[9px]' };
      case 'sm':
        return { title: 'text-sm font-bold', sub: 'text-[10px]' };
      case 'md':
        return { title: 'text-base font-bold', sub: 'text-xs' };
      case 'lg':
        return { title: 'text-2xl font-bold tracking-tight', sub: 'text-sm' };
      case 'xl':
        return { title: 'text-3xl font-bold tracking-tight', sub: 'text-base' };
      default:
        return { title: 'text-sm font-bold', sub: 'text-[10px]' };
    }
  };

  const pixelSize = getPixelSize();
  const textStyles = getTextClasses();

  if (!showText) {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${className}`} title={alt}>
        <VidyAIIcon size={pixelSize} className={iconClassName} animated={animated} alt={alt} />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 shrink-0 ${className}`} title={alt}>
      <VidyAIIcon size={pixelSize} className={iconClassName} animated={animated} alt={alt} />
      <div className="flex flex-col justify-center leading-tight">
        <span
          className={`font-bold tracking-tight ${
            inverted ? 'text-white' : 'text-[#1F1E1D]'
          } ${textStyles.title}`}
        >
          VidyAI
        </span>
        {subtitle && (
          <span
            className={`font-medium ${
              inverted ? 'text-[#FAF9F5]/70' : 'text-[#6B6862]'
            } ${textStyles.sub}`}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};

export default VidyAILogo;
