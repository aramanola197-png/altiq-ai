import React, { useState } from 'react';

/**
 * The one place the ALTIQ AI mark is rendered anywhere in the app.
 *
 * Supports two logo files:
 *   - /altiq-logo.png       — the primary (dark/black) logo, used on
 *                              light backgrounds everywhere by default.
 *   - /altiq-second-logo.png — an optional light/white version, used
 *                              only where variant="light" is passed
 *                              (currently just the dark footer band).
 *                              If this file doesn't exist, it falls
 *                              back to the same primary logo rather
 *                              than breaking.
 *
 * A single black logo file can't read clearly on a dark background —
 * that's a real color-contrast limit of the image itself, not
 * something CSS can safely fix (filters/inversion on a raster PNG
 * tend to look wrong, especially with soft edges or anti-aliasing).
 * The correct fix is a second, light-colored export of the same
 * mark, referenced only where the background is dark.
 */
export default function Logo({ size = 32, showText = true, textClassName = '', className = '', variant = 'default' }) {
  const [imgFailed, setImgFailed] = useState(false);

  const src = variant === 'light' ? '/altiq-second-logo.png' : '/altiq-logo.png';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {!imgFailed ? (
        <img
          src={src}
          alt="ALTIQ AI"
          width={size}
          height={size}
          style={{ width: size, height: size }}
          className="rounded-full object-cover shrink-0"
          onError={(e) => {
            // If the light variant specifically is missing, quietly
            // fall back to the primary logo instead of the plain
            // circle, so the footer isn't worse off than before.
            if (variant === 'light' && e.currentTarget.src.includes('altiq-second-logo')) {
              e.currentTarget.src = '/altiq-logo.png';
              return;
            }
            setImgFailed(true);
          }}
        />
      ) : (
        <div
          style={{ width: size, height: size }}
          className={`rounded-full border flex items-center justify-center shrink-0 ${
            variant === 'light' ? 'border-white/40' : 'border-ash/40'
          }`}
          aria-hidden="true"
        >
          <div
            className={`rounded-full ${variant === 'light' ? 'bg-white/80' : 'bg-black/70'}`}
            style={{ width: size * 0.4, height: size * 0.4 }}
          />
        </div>
      )}
      {showText && (
        <span className={`font-heading font-bold tracking-wide whitespace-nowrap ${textClassName}`}>
          ALTIQ AI
        </span>
      )}
    </div>
  );
}
