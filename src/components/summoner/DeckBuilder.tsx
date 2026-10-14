import React, { useState } from 'react';
import { Card, SummonerUpgrades } from '../../types/summoner';
import { SafeImage } from '../common/SafeImage';
import { Plus, Minus, ArrowUpCircle, Lock, X } from 'lucide-react';
import { sound } from '../../utils/audio';

interface DeckBuilderProps {
  cards: Card[];
  deckCardIds: string[];
  onUpdateDeck: (newDeckIds: string[]) => void;
  onUpgradeCard: (cardId: string) => void;
  onUnlockCard: (cardId: string) => void;
  crystals: number;
  upgrades: SummonerUpgrades;
  onBuyUpgrade: (type: 'maxEnergy' | 'energyRegen' | 'sanctuaryHp') => void;
  onClose: () => void;
}

export const DeckBuilder: React.FC<DeckBuilderProps> = ({
  cards,
  deckCardIds,
  onUpdateDeck,
  onUpgradeCard,
  onUnlockCard,
  crystals,
  upgrades,
  onBuyUpgrade,
  onClose,
}) => {
  const [filterRole, setFilterRole] = useState<string>('all');
  const [inspectCard, setInspectCard] = useState<Card | null>(null);

  const activeDeckCards = deckCardIds
    .map((id) => cards.find((c) => c.id === id))
    .filter((c): c is Card => !!c);

  const avgMana = activeDeckCards.length > 0
    ? (activeDeckCards.reduce((acc, c) => acc + c.cost, 0) / activeDeckCards.length).toFixed(1)
    : '0.0';

  const toggleDeckCard = (card: Card) => {
    if (deckCardIds.includes(card.id)) {
      if (deckCardIds.length <= 4) {
        alert('O baralho deve ter pelo menos 4 cartas!');
        return;
      }
      onUpdateDeck(deckCardIds.filter((id) => id !== card.id));
      sound.playHit(300);
    } else {
      if (deckCardIds.length >= 8) {
        alert('O baralho suporta no máximo 8 cartas. Remova uma antes de adicionar outra.');
        return;
      }
      onUpdateDeck([...deckCardIds, card.id]);
      sound.playPowerup();
    }
  };

  const filteredCollection = cards.filter((c) => {
    if (filterRole === 'all') return true;
    return c.role === filterRole;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              🌿 Customizar Baralho da Natureza
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Escolha de 4 a 8 cartas para a batalha. Equilibre o custo de energia e funções de combate.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Crystal balance */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 font-mono text-sm font-bold shadow-inner">
              <span>💎</span> {crystals} Cristais
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Active Battle Deck Strip */}
          <div className="bg-slate-950/70 border border-emerald-900/40 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  Baralho Ativo ({deckCardIds.length} / 8 cartas)
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  Custo Médio: <strong>{avgMana} ⚡</strong>
                </span>
              </div>
              <span className="text-xs text-slate-400">Clique na carta para remover</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {activeDeckCards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => toggleDeckCard(card)}
                  className="group relative flex flex-col items-center bg-slate-900 border border-emerald-600/50 hover:border-rose-500 rounded-lg p-2 cursor-pointer transition-all duration-150 hover:-translate-y-1"
                >
                  <div className="absolute top-1 left-1 w-5 h-5 rounded bg-emerald-500 text-slate-950 font-mono font-bold text-[10px] flex items-center justify-center">
                    {card.cost}
                  </div>
                  <SafeImage
                    src={card.image}
                    alt={card.namePt}
                    fallbackIcon={card.type === 'spell' ? '✨' : card.role === 'tank' ? '🛡️' : '🐺'}
                    className="w-12 h-12 object-cover rounded mt-3 mb-1"
                  />
                  <span className="text-[11px] font-semibold text-slate-200 text-center truncate w-full">
                    {card.namePt}
                  </span>
                  <div className="absolute inset-0 bg-rose-950/80 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-rose-300 text-xs font-bold">
                    <Minus size={16} />
                  </div>
                </div>
              ))}

              {Array.from({ length: 8 - activeDeckCards.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-lg h-24 text-slate-600 text-xs text-center p-2"
                >
                  <Plus size={16} className="mb-1 opacity-50" />
                  <span>Vazio</span>
                </div>
              ))}
            </div>
          </div>

          {/* Filter Pills for Collection */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-semibold shrink-0">Filtrar:</span>
            {[
              { id: 'all', label: 'Todas as Cartas' },
              { id: 'tank', label: 'Tanques' },
              { id: 'dps', label: 'Assalto / Dano' },
              { id: 'ranged', label: 'À Distância' },
              { id: 'flying', label: 'Voadores' },
              { id: 'support', label: 'Suporte' },
              { id: 'aoe', label: 'Magias / Feitiços' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterRole(tab.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  filterRole === tab.id
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Full Card Collection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCollection.map((card) => {
              const inDeck = deckCardIds.includes(card.id);
              const upgradeCost = card.level * 60;
              const unlockCost = 120;

              return (
                <div
                  key={card.id}
                  className={`relative flex flex-col justify-between bg-slate-950/80 border rounded-xl p-4 transition-all ${
                    inDeck ? 'border-emerald-500/70 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'border-slate-800'
                  }`}
                >
                  <div className="flex gap-3 mb-2">
                    <div
                      className="w-16 h-16 rounded-lg overflow-hidden border border-slate-700 shrink-0 cursor-pointer hover:opacity-90"
                      onClick={() => setInspectCard(card)}
                    >
                      <SafeImage
                        src={card.image}
                        alt={card.namePt}
                        fallbackIcon={card.type === 'spell' ? '✨' : card.role === 'tank' ? '🛡️' : '🐺'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-white truncate">
                          {card.namePt}
                        </span>
                        <span className="w-6 h-6 rounded bg-emerald-500 text-slate-950 font-mono font-bold text-xs flex items-center justify-center">
                          {card.cost}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                        Nível {card.level} · {card.role.toUpperCase()}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                        {card.description}
                      </p>
                    </div>
                  </div>

                  {/* Card combat numbers */}
                  {card.type === 'creature' && (
                    <div className="flex justify-between items-center text-xs font-mono text-slate-300 py-1.5 px-2 bg-slate-900 rounded mb-3">
                      <span>HP: <strong className="text-emerald-400">{card.hp}</strong></span>
                      <span>ATK: <strong className="text-amber-400">{card.attack}</strong></span>
                      <span>ALCANCE: <strong className="text-sky-400">{card.range}px</strong></span>
                    </div>
                  )}

                  {/* Actions (Equip / Upgrade / Unlock) */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                    {!card.isUnlocked ? (
                      <button
                        onClick={() => onUnlockCard(card.id)}
                        disabled={crystals < unlockCost}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-amber-500/90 hover:bg-amber-400 disabled:opacity-40 text-slate-950 text-xs font-bold rounded-lg transition-colors"
                      >
                        <Lock size={12} /> Desbloquear ({unlockCost} 💎)
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => toggleDeckCard(card)}
                          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            inDeck
                              ? 'bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/50'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          {inDeck ? (
                            <>
                              <Minus size={13} /> No Baralho
                            </>
                          ) : (
                            <>
                              <Plus size={13} /> Adicionar
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => onUpgradeCard(card.id)}
                          disabled={crystals < upgradeCost}
                          className="flex items-center gap-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-amber-300 rounded-lg border border-amber-500/30 transition-colors"
                          title="Melhora vida e ataque em +15%"
                        >
                          <ArrowUpCircle size={13} />
                          +{card.level + 1} ({upgradeCost} 💎)
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sanctuary & Summoner Upgrades Section */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span>🏛️</span> Bençãos do Santuário e do Invocador
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-400">Energia Máxima</div>
                  <div className="text-lg font-mono font-bold text-white my-1">
                    {upgrades.maxEnergy} ⚡
                  </div>
                  <p className="text-[11px] text-slate-400">Aumenta o limite de mana acumulável.</p>
                </div>
                <button
                  onClick={() => onBuyUpgrade('maxEnergy')}
                  disabled={crystals < 80}
                  className="mt-3 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-xs font-bold text-white rounded transition-colors"
                >
                  Expandir (+2) · 80 💎
                </button>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-teal-400">Regeneração de Seiva</div>
                  <div className="text-lg font-mono font-bold text-white my-1">
                    +{upgrades.energyRegenRate.toFixed(1)}/s
                  </div>
                  <p className="text-[11px] text-slate-400">Gera mana mais rapidamente com o tempo.</p>
                </div>
                <button
                  onClick={() => onBuyUpgrade('energyRegen')}
                  disabled={crystals < 100}
                  className="mt-3 py-1.5 px-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-xs font-bold text-white rounded transition-colors"
                >
                  Acelerar (+0.2/s) · 100 💎
                </button>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-sky-400">Vida do Santuário</div>
                  <div className="text-lg font-mono font-bold text-white my-1">
                    {upgrades.summonerMaxHp} HP
                  </div>
                  <p className="text-[11px] text-slate-400">Aumenta a resistência a ataques dos mobs.</p>
                </div>
                <button
                  onClick={() => onBuyUpgrade('sanctuaryHp')}
                  disabled={crystals < 70}
                  className="mt-3 py-1.5 px-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-xs font-bold text-white rounded transition-colors"
                >
                  Fortalecer (+250 HP) · 70 💎
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex justify-between items-center">
          <span className="text-xs text-slate-400">
            Dica: Baralhos com custo médio entre 2.2 e 3.4 funcionam melhor contra hordas rápidas!
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-colors"
          >
            Salvar e Jogar
          </button>
        </div>
      </div>

      {/* Card Inspector Modal */}
      {inspectCard && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/60 rounded-2xl p-6 max-w-sm w-full relative shadow-2xl">
            <button
              onClick={() => setInspectCard(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
            <div className="w-full h-48 rounded-xl overflow-hidden mb-4 border border-slate-700">
              <SafeImage
                src={inspectCard.image}
                alt={inspectCard.namePt}
                fallbackIcon={inspectCard.type === 'spell' ? '✨' : inspectCard.role === 'tank' ? '🛡️' : '🐺'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-lg font-bold text-white">{inspectCard.namePt}</h3>
              <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold font-mono text-xs">
                Custo {inspectCard.cost} ⚡
              </span>
            </div>
            <p className="text-xs text-emerald-400 font-semibold mb-2">
              {inspectCard.name} · {inspectCard.role.toUpperCase()}
            </p>
            <p className="text-xs text-slate-300 mb-3">{inspectCard.description}</p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1">
              <div><strong className="text-emerald-400">Efeito Especial:</strong> {inspectCard.abilityDescription}</div>
              {inspectCard.type === 'creature' && (
                <div className="flex justify-between pt-1 text-slate-400">
                  <span>Vida: {inspectCard.hp}</span>
                  <span>Ataque: {inspectCard.attack}</span>
                  <span>Velocidade: {inspectCard.moveSpeed}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
