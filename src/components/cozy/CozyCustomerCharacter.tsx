import React from 'react';

interface CozyCustomerCharacterProps {
  archetypeId: string;
  isSelected?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isPatienceLow?: boolean;
}

export const CozyCustomerCharacter: React.FC<CozyCustomerCharacterProps> = ({
  archetypeId,
  isSelected = false,
  size = 'md',
  isPatienceLow = false,
}) => {
  const width = size === 'sm' ? 68 : size === 'lg' ? 120 : 90;
  const height = size === 'sm' ? 85 : size === 'lg' ? 150 : 115;

  // Determine character style based on archetype
  const getCharacterTheme = () => {
    switch (archetypeId) {
      case 'student':
        // Orange tabby cat in teal hoodie
        return {
          furColor: '#F59E0B',
          earInner: '#FDE68A',
          stripes: '#D97706',
          clothingType: 'hoodie',
          clothesColor: '#0D9488', // Teal hoodie
          hoodieDrawstring: '#CCFBF1',
          eyeColor: '#1E293B',
          name: 'Mèo Cam Hoodie',
        };
      case 'office_worker':
        // Black cat in burgundy suit and necktie
        return {
          furColor: '#27272A',
          earInner: '#71717A',
          stripes: 'transparent',
          clothingType: 'suit',
          clothesColor: '#991B1B', // Burgundy jacket
          shirtColor: '#F8FAFC',
          tieColor: '#18181B',
          eyeColor: '#FBBF24', // Amber eyes
          name: 'Mèo Đen Công Sở',
        };
      case 'foodie':
        // White Siamese/Sphynx in brown trench coat
        return {
          furColor: '#FDF4E7',
          earInner: '#FBCFE8',
          stripes: '#E2E8F0',
          clothingType: 'trenchcoat',
          clothesColor: '#78350F', // Brown coat
          shirtColor: '#84CC16', // Olive knitwear
          eyeColor: '#0284C7', // Sky blue eyes
          name: 'Mèo Quý Tộc',
        };
      case 'gymer':
        // Golden athletic tiger/cat with red headband
        return {
          furColor: '#EA580C',
          earInner: '#FED7AA',
          stripes: '#7C2D12',
          clothingType: 'gymtank',
          clothesColor: '#1E293B', // Dark gym tank
          headband: '#EF4444',
          eyeColor: '#15803D', // Emerald eyes
          name: 'Cọp Gymer',
        };
      case 'difficult':
        // Grumpy grey cat with knitted scarf
        return {
          furColor: '#64748B',
          earInner: '#CBD5E1',
          stripes: '#334155',
          clothingType: 'scarf',
          clothesColor: '#B91C1C',
          eyeColor: '#E11D48',
          name: 'Mèo Khó Tính',
        };
      case 'loyal':
      default:
        // Cute Shiba Inu with starry eyes and green bandana
        return {
          furColor: '#D97706',
          earInner: '#FEF3C7',
          stripes: '#B45309',
          clothingType: 'bandana',
          clothesColor: '#059669', // Emerald bandana
          eyeColor: '#78350F',
          isDog: true,
          name: 'Cún Khách Quen',
        };
    }
  };

  const theme = getCharacterTheme();

  return (
    <div
      className={`relative select-none flex flex-col items-center transition-transform duration-300 ${
        isSelected ? 'scale-105 -translate-y-1' : 'opacity-90 hover:opacity-100'
      }`}
      style={{ width, height }}
    >
      <svg
        viewBox="0 0 100 130"
        className="w-full h-full drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shadow */}
        <ellipse cx="50" cy="124" rx="30" ry="5" fill="#000000" fillOpacity="0.15" />

        {/* Tail (for cats) */}
        {!theme.isDog && (
          <path
            d="M20 100 C10 110, 5 95, 12 85 C15 80, 20 86, 22 92"
            stroke={theme.furColor}
            strokeWidth="7"
            strokeLinecap="round"
          />
        )}

        {/* Body / Clothes */}
        {theme.clothingType === 'hoodie' && (
          <g>
            {/* Hoodie body */}
            <path
              d="M30 75 Q20 100 24 120 L76 120 Q80 100 70 75 Z"
              fill={theme.clothesColor}
            />
            {/* Hood rim */}
            <ellipse cx="50" cy="74" rx="26" ry="12" fill="#0F766E" />
            {/* Drawstrings */}
            <path d="M44 80 L43 96 M56 80 L57 96" stroke={theme.hoodieDrawstring} strokeWidth="2.5" strokeLinecap="round" />
            {/* Kangaroo pocket */}
            <path d="M38 102 Q50 100 62 102 L64 116 L36 116 Z" fill="#0F766E" opacity="0.6" />
          </g>
        )}

        {theme.clothingType === 'suit' && (
          <g>
            {/* White shirt base */}
            <path d="M32 75 L68 75 L74 120 L26 120 Z" fill={theme.shirtColor || '#FFF'} />
            {/* Burgundy jacket */}
            <path d="M26 75 L42 120 L24 120 Z" fill={theme.clothesColor} />
            <path d="M74 75 L58 120 L76 120 Z" fill={theme.clothesColor} />
            {/* Black Necktie */}
            <path d="M48 76 L52 76 L53 100 L50 106 L47 100 Z" fill={theme.tieColor || '#000'} />
            {/* Collar */}
            <path d="M38 74 L50 82 L42 86 Z" fill="#E2E8F0" />
            <path d="M62 74 L50 82 L58 86 Z" fill="#E2E8F0" />
          </g>
        )}

        {theme.clothingType === 'trenchcoat' && (
          <g>
            {/* Turtleneck */}
            <rect x="40" y="68" width="20" height="12" rx="4" fill={theme.shirtColor} />
            {/* Coat body */}
            <path d="M30 74 L70 74 L76 120 L24 120 Z" fill={theme.clothesColor} />
            {/* Lapels */}
            <path d="M30 74 L46 95 L34 95 Z" fill="#92400E" />
            <path d="M70 74 L54 95 L66 95 Z" fill="#92400E" />
            {/* Buttons */}
            <circle cx="50" cy="102" r="2" fill="#FEF3C7" />
            <circle cx="50" cy="112" r="2" fill="#FEF3C7" />
          </g>
        )}

        {theme.clothingType === 'gymtank' && (
          <g>
            {/* Fur shoulders */}
            <ellipse cx="50" cy="90" rx="24" ry="22" fill={theme.furColor} />
            {/* Dark tank */}
            <path d="M36 82 L64 82 L72 120 L28 120 Z" fill={theme.clothesColor} />
            {/* Muscle chest stripe */}
            <path d="M50 86 L50 106" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {theme.clothingType === 'bandana' && (
          <g>
            {/* Dog/Cat body fur */}
            <path d="M30 75 Q20 100 24 120 L76 120 Q80 100 70 75 Z" fill={theme.furColor} />
            {/* Emerald bandana */}
            <path d="M34 76 Q50 82 66 76 L50 96 Z" fill={theme.clothesColor} />
            <circle cx="50" cy="86" r="2" fill="#FEF08A" />
          </g>
        )}

        {theme.clothingType === 'scarf' && (
          <g>
            <path d="M30 75 Q20 100 24 120 L76 120 Q80 100 70 75 Z" fill={theme.furColor} />
            {/* Red knitted scarf */}
            <ellipse cx="50" cy="76" rx="22" ry="7" fill={theme.clothesColor} />
            <path d="M42 78 L42 102 L48 102 L48 78 Z" fill={theme.clothesColor} />
          </g>
        )}

        {/* Arms resting on counter */}
        <ellipse cx="32" cy="116" rx="6" ry="5" fill={theme.furColor} stroke="#000" strokeWidth="0.8" />
        <ellipse cx="68" cy="116" rx="6" ry="5" fill={theme.furColor} stroke="#000" strokeWidth="0.8" />

        {/* Ears */}
        {theme.isDog ? (
          // Floppy cute Shiba / Dog ears
          <g>
            <path d="M22 28 C18 10, 34 8, 38 24 Z" fill={theme.furColor} />
            <path d="M26 25 C24 14, 34 13, 36 23 Z" fill={theme.earInner} />
            <path d="M78 28 C82 10, 66 8, 62 24 Z" fill={theme.furColor} />
            <path d="M74 25 C76 14, 66 13, 64 23 Z" fill={theme.earInner} />
          </g>
        ) : (
          // Pointed Cat Ears
          <g>
            <path d="M22 36 L30 12 L44 32 Z" fill={theme.furColor} />
            <path d="M27 34 L32 17 L40 31 Z" fill={theme.earInner} />
            <path d="M78 36 L70 12 L56 32 Z" fill={theme.furColor} />
            <path d="M73 34 L68 17 L60 31 Z" fill={theme.earInner} />
          </g>
        )}

        {/* Head */}
        <ellipse cx="50" cy="46" rx="28" ry="24" fill={theme.furColor} />

        {/* Headband if Gymer */}
        {theme.headband && (
          <path d="M22 38 Q50 33 78 38 L78 44 Q50 39 22 44 Z" fill={theme.headband} />
        )}

        {/* Tabby Stripes (if any) */}
        {theme.stripes !== 'transparent' && (
          <g stroke={theme.stripes} strokeWidth="2.5" strokeLinecap="round">
            <path d="M50 24 L50 32" />
            <path d="M43 27 L46 34" />
            <path d="M57 27 L54 34" />
            {/* Cheek stripes */}
            <path d="M24 46 L30 48" />
            <path d="M24 51 L31 52" />
            <path d="M76 46 L70 48" />
            <path d="M76 51 L69 52" />
          </g>
        )}

        {/* Cheeks / Blush */}
        <circle cx="34" cy="53" r="5" fill="#FDA4AF" opacity="0.6" />
        <circle cx="66" cy="53" r="5" fill="#FDA4AF" opacity="0.6" />

        {/* Eyes */}
        {isPatienceLow ? (
          // Worried / Impatient eyes
          <g stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round">
            <path d="M35 44 L45 42" />
            <path d="M65 44 L55 42" />
            <circle cx="40" cy="47" r="3.5" fill="#1E293B" />
            <circle cx="60" cy="47" r="3.5" fill="#1E293B" />
          </g>
        ) : (
          // Sparkling cute expressive eyes
          <g>
            <ellipse cx="39" cy="45" rx="5" ry="6" fill={theme.eyeColor} />
            <ellipse cx="61" cy="45" rx="5" ry="6" fill={theme.eyeColor} />
            {/* Highlights */}
            <circle cx="37.5" cy="43" r="2" fill="#FFFFFF" />
            <circle cx="40.5" cy="47" r="1" fill="#FFFFFF" />
            <circle cx="59.5" cy="43" r="2" fill="#FFFFFF" />
            <circle cx="62.5" cy="47" r="1" fill="#FFFFFF" />
          </g>
        )}

        {/* Cute Nose */}
        <polygon points="50,52 47,49 53,49" fill="#F43F5E" />

        {/* Mouth */}
        {isPatienceLow ? (
          <path d="M46 59 Q50 56 54 59" stroke="#3D2619" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        ) : (
          <path
            d="M45 54 Q50 57 50 54 Q50 57 55 54"
            stroke="#3D2619"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* Whiskers */}
        <g stroke="#3D2619" strokeWidth="1.2" strokeLinecap="round" opacity="0.7">
          <line x1="28" y1="52" x2="16" y2="50" />
          <line x1="28" y1="55" x2="15" y2="57" />
          <line x1="72" y1="52" x2="84" y2="50" />
          <line x1="72" y1="55" x2="85" y2="57" />
        </g>
      </svg>
    </div>
  );
};
