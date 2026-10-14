import React from 'react';
import { Card } from '../../types/summoner';
import { SafeImage } from '../common/SafeImage';
import { Shield, Swords, Crosshair, Feather, Sparkles, Wand2 } from 'lucide-react';

interface CardHandProps {
  hand: Card[];
  energy: number;
  onPlayCard: (card: Card, cardIndex: number) => void;
  selectedCardIndex: number | null;
  onSelectCard: (index: number | null) => void;
}

export const CardHand: React.FC<CardHandProps> = ({
  hand,
  energy,
  onPlayCard,
  selectedCardIndex,
  onSelectCard,
}) => {
  const getRoleIcon = (role: Card['role']) => {
    switch (role) {
      case 'tank':
        return <Shield size={12} className="text-amber-400" />;
      case 'dps':
        return <Swords size={12} className="text-rose-400" />;
      case 'ranged':
        return <Crosshair size={12} className="text-emerald-400" />;
      case 'flying':
        return <Feather size={12} className="text-sky-400" />;
      case 'support':
        return <Sparkles size={12} className="text-teal-300" />;
      case 'aoe':
        return <Wand2 size={12} className="text-purple-400" />;
    }
  };

  const getRoleLabel = (role: Card['role']) => {
    switch (role) {
      case 'tank': return 'Tanque';
      case 'dps': return 'Assalto';
      case 'ranged': return 'À Distância';
      case 'flying': return 'Voador';
      case 'support': return 'Suporte';
      case 'aoe': return 'Magia';
    }
  };

  return (
    <div className="w-full flex items-center justify-center gap-2 sm:gap-4 px-2 py-2 select-none">
      {hand.map((card, idx) => {
        const canAfford = energy >= card.cost;
        const isSelected = selectedCardIndex === idx;

        return (
          <div
            key={`${card.id}-${idx}`}
            onClick={() => {
              if (card.type === 'spell') {
                if (canAfford) {
                  onPlayCard(card, idx);
                }
              } else {
                onSelectCard(isSelected ? null : idx);
              }
            }}
            className={`relative flex flex-col justify-between w-28 sm:w-36 h-40 sm:h-48 rounded-xl p-2 cursor-pointer transition-all duration-150 border-2 ${
              isSelected
                ? 'border-emerald-400 -translate-y-3 shadow-[0_0_20px_rgba(52,211,153,0.4)] bg-emerald-950/60'
                : canAfford
                ? 'border-emerald-700/60 hover:border-emerald-400/80 hover:-translate-y-1 bg-slate-900/90 shadow-md'
                : 'border-slate-800 bg-slate-900/50 opacity-60 cursor-not-allowed'
            }`}
          >
            {/* Top Row: Mana Cost & Role */}
            <div className="flex items-center justify-between">
              {/* Mana Cost Badge */}
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-lg font-mono font-extrabold text-xs shadow-inner ${
                  canAfford
                    ? 'bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 shadow-emerald-400/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {card.cost}
              </div>

              {/* Role Indicator */}
              <div className="flex items-center gap-1 text-[10px] text-slate-300 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800">
                {getRoleIcon(card.role)}
                <span className="hidden sm:inline">{getRoleLabel(card.role)}</span>
              </div>
            </div>

            {/* Card Visual Artwork */}
            <div className="relative w-full h-16 sm:h-20 rounded-lg overflow-hidden my-1 bg-slate-950 border border-slate-800/80">
              <SafeImage
                src={card.image}
                alt={card.namePt}
                fallbackIcon={card.type === 'spell' ? '✨' : card.role === 'tank' ? '🛡️' : card.role === 'flying' ? '🦅' : '🐺'}
                className="w-full h-full object-cover object-center filter saturate-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
              {card.type === 'spell' && (
                <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-purple-600/90 text-[9px] font-bold text-white rounded">
                  FEITIÇO
                </div>
              )}
            </div>

            {/* Card Name */}
            <div className="text-center font-bold text-xs sm:text-sm text-slate-100 truncate">
              {card.namePt}
            </div>

            {/* Bottom Row: Stats (HP / ATK) or Spell Info */}
            <div className="pt-1 border-t border-slate-800/80 text-[10px] flex items-center justify-between text-slate-300 font-mono">
              {card.type === 'creature' ? (
                <>
                  <span className="text-emerald-400 flex items-center gap-0.5">
                    💚 {card.hp}
                  </span>
                  <span className="text-amber-400 flex items-center gap-0.5">
                    ⚔️ {card.attack}
                  </span>
                </>
              ) : (
                <span className="w-full text-center text-purple-300 font-sans text-[10px]">
                  Clique p/ Lançar
                </span>
              )}
            </div>

            {/* Selection Hint overlay */}
            {isSelected && card.type === 'creature' && (
              <div className="absolute inset-0 bg-emerald-500/10 rounded-xl pointer-events-none flex items-center justify-center">
                <span className="text-[11px] font-bold text-emerald-300 bg-slate-950/90 px-2 py-1 rounded border border-emerald-400/50 shadow">
                  Clique na Pista
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
