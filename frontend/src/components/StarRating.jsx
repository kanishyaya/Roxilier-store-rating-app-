import { useState } from 'react';

export default function StarRating({ value = 0, onChange, readonly = false, size = 'md' }) {
  const [hovered, setHovered] = useState(0);

  const sizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' };

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => {
        const filled = star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={`${sizes[size]} transition-colors leading-none ${
              readonly ? 'cursor-default' : 'cursor-pointer'
            } ${filled ? 'text-amber-400' : 'text-gray-300'}`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
