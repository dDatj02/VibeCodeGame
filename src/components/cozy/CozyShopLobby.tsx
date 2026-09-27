import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useEconomyStore } from '../../stores/economyStore';
import { useReviewStore } from '../../stores/reviewStore';
import { useShopStore } from '../../stores/shopStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { formatVND } from '../../utils/format';
import { audioService } from '../../services/AudioService';
import { 
  Sparkles, 
  Trophy, 
  Edit3, 
  Package, 
  BookOpen, 
  Wrench, 
  Star, 
  Landmark, 
  Share2, 
  CheckCircle2, 
  Plus,
  HelpCircle,
  ShoppingBag,
  Zap
} from 'lucide-react';

interface CozyShopLobbyProps {
  onOpenKitchen: () => void;
}

export const CozyShopLobby: React.FC<CozyShopLobbyProps> = ({ onOpenKitchen }) => {
  const { 
    day, 
    weather, 
    shopName, 
    setShopName, 
    xp, 
    maxXp, 
    quests, 
    claimQuest, 
    setActiveTab, 
    openShopForDay,
    showNotification 
  } = useGameStore();

  const cash = useEconomyStore((state) => state.cash);
  const currentShopLevel = useShopStore((state) => state.currentShopLevel);
  const ingredients = useInventoryStore((state) => state.ingredients);
  const buyIngredient = useInventoryStore((state) => state.buyIngredient);
  const deductCash = useEconomyStore((state) => state.deductCash);

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(shopName);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [lobbySubTab, setLobbySubTab] = useState<'quests' | 'restock' | 'shortcuts'>('quests');

  const handleSaveName = () => {
    if (tempName.trim()) {
      setShopName(tempName.trim());
      setIsEditingName(false);
      audioService.playClick();
      showNotification('Đã đổi tên quán thành công!', 'success');
    }
  };

  const weatherDetails: Record<string, { label: string; desc: string; icon: string }> = {
    sunny: {
      label: 'Trời nắng đẹp',
      desc: 'Thời tiết ấm áp lý tưởng, khách dạo phố thích ghé uống nước giải khát.',
      icon: '☀️',
    },
    heatwave: {
      label: 'Trời nắng gắt',
      desc: 'Nắng nóng gay gắt! Khách đông hơn +35%.',
      icon: '🔥',
    },
    rain: {
      label: 'Trời mưa rào',
      desc: 'Mưa tầm tã vỉa hè hơi ướt (-25% khách vãng lai).',
      icon: '🌧️',
    },
    storm: {
      label: 'Giông bão lớn',
      desc: 'Gió giật mạnh, nên chuẩn bị hàng kỹ.',
      icon: '⛈️',
    },
  };

  const currentWeather = weatherDetails[weather] || weatherDetails.sunny;

  const quickTabs = [
    { id: 'inventory', label: 'Kho hàng', icon: <Package size={16} className="text-amber-600" /> },
    { id: 'recipes', label: 'Giá bán', icon: <BookOpen size={16} className="text-orange-600" /> },
    { id: 'upgrades', label: 'Nâng cấp', icon: <Wrench size={16} className="text-emerald-600" /> },
    { id: 'social', label: 'TrendTok', icon: <Share2 size={16} className="text-pink-600" /> },
    { id: 'reviews', label: 'Đánh giá', icon: <Star size={16} className="text-yellow-600" /> },
    { id: 'finance', label: 'Sổ sách & Vay', icon: <Landmark size={16} className="text-blue-600" /> },
  ] as const;

  const handleQuickRestock = (ingId: string) => {
    const ing = ingredients.find(i => i.id === ingId);
    if (!ing) return;
    const cost = ing.basePrice * 5;
    if (cash < cost) {
      audioService.playDisappointed();
      showNotification('Không đủ tiền để nhập thêm!', 'error');
      return;
    }
    deductCash(cost);
    buyIngredient(ingId, 5);
    audioService.playCashRegister();
    showNotification(`Đã nhập +5 ${ing.unit} ${ing.name}!`, 'success');
  };

  const completedQuestsCount = quests.filter(q => q.currentCount >= q.targetCount && !q.completed).length;

  return (
    <div className="flex-1 h-full max-h-full w-full max-w-lg mx-auto flex flex-col justify-between p-2 select-none overflow-hidden bg-[#FBF7F0] text-[#3D2619]">
      {/* 1. Cozy Shop Facade Banner (Compact & Atmospheric) */}
      <div className="shrink-0 relative bg-gradient-to-b from-[#F26B50] to-[#E05338] text-white rounded-xl p-2.5 shadow-sm overflow-hidden border border-[#D2442A]">
        {/* Scalloped Awning Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-white/20 flex justify-between px-1">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="w-3 h-1.5 bg-white/30 rounded-b-full" />
          ))}
        </div>

        {/* Mascot & Shop Info Header */}
        <div className="flex items-center justify-between mt-0.5 relative z-10">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {isEditingName ? (
                <div className="flex items-center gap-1 bg-white/95 rounded-lg px-2 py-0.5 text-[#3D2619]">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="text-xs font-bold w-28 outline-none bg-transparent"
                    maxLength={20}
                  />
                  <button
                    onClick={handleSaveName}
                    className="text-[10px] bg-[#E05338] text-white px-1.5 py-0.5 rounded font-bold hover:bg-[#D2442A]"
                  >
                    Lưu
                  </button>
                </div>
              ) : (
                <h1 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-1 drop-shadow-xs font-['Comfortaa',sans-serif] truncate">
                  <span className="truncate">{shopName}</span>
                  <button
                    onClick={() => {
                      setTempName(shopName);
                      setIsEditingName(true);
                      audioService.playClick();
                    }}
                    className="p-0.5 hover:bg-white/20 rounded-full transition-colors opacity-80 shrink-0"
                    title="Đổi tên quán"
                  >
                    <Edit3 size={11} />
                  </button>
                </h1>
              )}
            </div>

            {/* Level & XP Bar */}
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-black/20 rounded-full text-amber-200 shrink-0">
                Cấp {currentShopLevel} · Tiệm nhỏ
              </span>
              <div className="w-20 bg-black/25 h-1.5 rounded-full overflow-hidden shrink-0">
                <div
                  className="bg-amber-300 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((xp / maxXp) * 100))}%` }}
                />
              </div>
              <span className="text-[9px] font-bold text-white/80 tabular-nums">
                {xp}/{maxXp} XP
              </span>
            </div>
          </div>

          {/* Cute Blushing Fruit Mascot */}
          <div className="flex items-center gap-1.5 shrink-0 pl-2">
            <div className="text-right">
              <span className="block text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-300 text-[#3D2619] shadow-xs">
                Bé Bơ 💚
              </span>
            </div>
            <div className="w-10 h-10 bg-white/25 rounded-xl flex items-center justify-center text-2xl shadow-inner border border-white/40">
              🥑
            </div>
          </div>
        </div>

        {/* Days Step Pills & Leaderboard */}
        <div className="mt-2 pt-1.5 border-t border-white/20 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 py-1 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-black text-white/90 mr-0.5 shrink-0">Ngày:</span>
            {Array.from({ length: 8 }).map((_, i) => {
              const dayNum = i + 1;
              const isCurrent = dayNum === day;
              const isPast = dayNum < day;
              return (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 transition-all ${
                    isCurrent
                      ? 'bg-amber-300 text-[#3D2619] border-2 border-white shadow-sm'
                      : isPast
                      ? 'bg-white/40 text-white'
                      : 'bg-white/20 text-white/70'
                  }`}
                >
                  {dayNum}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => {
              audioService.playClick();
              showNotification(`Quán của bạn đang đứng TOP 1 khu phố ẩm thực! ⭐`, 'success');
            }}
            className="flex items-center gap-0.5 text-[10px] font-bold bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded-full transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Trophy size={11} className="text-yellow-300" />
            <span>Xếp hạng</span>
          </button>
        </div>
      </div>

      {/* 2. Today's Weather & Forecast Micro-Strip */}
      <div className="shrink-0 my-1 bg-[#FFF9F2] border border-[#F2DECC] rounded-lg px-2.5 py-1 shadow-2xs flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 font-bold text-[#E05338] text-[11px] truncate">
          <span>{currentWeather.icon}</span>
          <span>{currentWeather.label}:</span>
          <span className="text-[#78513E] font-medium truncate text-[10px]">{currentWeather.desc}</span>
        </div>
      </div>

      {/* 3. Middle Interactive Hub (Segmented Panel - No page scroll) */}
      <div className="flex-1 min-h-0 flex flex-col justify-between bg-white border border-[#F0D5C3] rounded-xl p-2 shadow-2xs overflow-hidden">
        {/* Segment Tabs */}
        <div className="shrink-0 flex items-center p-0.5 bg-[#FAF0E6] rounded-lg gap-1 mb-1.5">
          <button
            onClick={() => {
              audioService.playClick();
              setLobbySubTab('quests');
            }}
            className={`flex-1 py-1 text-[11px] font-extrabold rounded-md flex items-center justify-center gap-1 transition-all ${
              lobbySubTab === 'quests'
                ? 'bg-white text-[#E05338] shadow-xs'
                : 'text-[#8C624D] hover:text-[#3D2619]'
            }`}
          >
            <Sparkles size={12} className={completedQuestsCount > 0 ? 'text-amber-500 animate-spin' : ''} />
            <span>Nhiệm vụ</span>
            {completedQuestsCount > 0 && (
              <span className="w-4 h-4 bg-amber-500 text-white text-[9px] rounded-full flex items-center justify-center">
                {completedQuestsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              audioService.playClick();
              setLobbySubTab('restock');
            }}
            className={`flex-1 py-1 text-[11px] font-extrabold rounded-md flex items-center justify-center gap-1 transition-all ${
              lobbySubTab === 'restock'
                ? 'bg-white text-[#E05338] shadow-xs'
                : 'text-[#8C624D] hover:text-[#3D2619]'
            }`}
          >
            <ShoppingBag size={12} />
            <span>Nhập nhanh</span>
          </button>

          <button
            onClick={() => {
              audioService.playClick();
              setLobbySubTab('shortcuts');
            }}
            className={`flex-1 py-1 text-[11px] font-extrabold rounded-md flex items-center justify-center gap-1 transition-all ${
              lobbySubTab === 'shortcuts'
                ? 'bg-white text-[#E05338] shadow-xs'
                : 'text-[#8C624D] hover:text-[#3D2619]'
            }`}
          >
            <Zap size={12} />
            <span>Tiện ích</span>
          </button>
        </div>

        {/* Panel Content Area */}
        <div className="flex-1 min-h-0 flex flex-col justify-center overflow-hidden">
          {lobbySubTab === 'quests' && (
            <div className="flex flex-col justify-around h-full gap-1">
              {quests.map((q) => {
                const isDone = q.currentCount >= q.targetCount;
                return (
                  <div
                    key={q.id}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-[#FFF9F2] border border-[#F2DECC]"
                  >
                    <div className="min-w-0 flex-1 pr-1">
                      <div className="text-[11px] font-bold text-[#3D2619] truncate">{q.title}</div>
                      <div className="text-[9px] text-amber-700 font-semibold leading-none mt-0.5">
                        Thưởng {formatVND(q.rewardCash)} · +{q.rewardXp} XP
                      </div>
                    </div>

                    <div className="shrink-0">
                      {q.completed ? (
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <CheckCircle2 size={10} /> Xong
                        </span>
                      ) : isDone ? (
                        <button
                          onClick={() => {
                            audioService.playFanfare();
                            claimQuest(q.id);
                            useEconomyStore.getState().addCash(q.rewardCash);
                            useGameStore.getState().addXp(q.rewardXp);
                            showNotification(`Nhận thưởng ${formatVND(q.rewardCash)} & +${q.rewardXp} XP!`, 'success');
                          }}
                          className="text-[10px] font-black bg-amber-500 hover:bg-amber-400 text-white px-2 py-0.5 rounded-md shadow-xs active:scale-95 cursor-pointer"
                        >
                          Nhận
                        </button>
                      ) : (
                        <span className="text-[10px] font-extrabold text-[#9E735B] tabular-nums">
                          {q.currentCount}/{q.targetCount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {lobbySubTab === 'restock' && (
            <div className="flex flex-col justify-around h-full">
              <div className="text-[10px] text-[#8C624D] font-bold mb-1 flex items-center justify-between">
                <span>Chạm +5 để mua nhanh nguyên liệu trước giờ mở quán:</span>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className="text-[#E05338] underline"
                >
                  Kho đầy đủ
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {ingredients.slice(0, 4).map((ing) => (
                  <div
                    key={ing.id}
                    className="p-1 rounded-lg bg-[#FFF9F2] border border-[#F2DECC] flex flex-col items-center text-center"
                  >
                    <span className="text-xl leading-none">{ing.icon}</span>
                    <span className="text-[9px] font-bold text-[#3D2619] truncate max-w-[55px] mt-0.5">
                      {ing.name.split(' ')[0]}
                    </span>
                    <span className="text-[8px] text-[#78513E] tabular-nums">
                      Tồn: {ing.currentStock}
                    </span>
                    <button
                      onClick={() => handleQuickRestock(ing.id)}
                      className="mt-1 w-full py-0.5 bg-amber-500 hover:bg-amber-400 text-white font-black text-[9px] rounded shadow-2xs active:scale-95 cursor-pointer flex items-center justify-center gap-0.5"
                      title={`Nhập 5 ${ing.unit}`}
                    >
                      <Plus size={9} />
                      <span>5</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lobbySubTab === 'shortcuts' && (
            <div className="grid grid-cols-3 gap-1.5 h-full items-center">
              {quickTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    audioService.playClick();
                    setActiveTab(tab.id);
                  }}
                  className="bg-[#FFF9F2] hover:bg-[#FFF4E8] border border-[#F0D5C3] p-1.5 rounded-lg flex flex-col items-center justify-center gap-0.5 text-center transition-all active:scale-95 cursor-pointer h-full"
                >
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-2xs">
                    {tab.icon}
                  </div>
                  <span className="text-[10px] font-bold text-[#42281D]">{tab.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Bottom Main Action CTA (Always 100% visible on screen without scrolling) */}
      <div className="shrink-0 pt-1.5">
        <button
          onClick={() => {
            audioService.playClick();
            openShopForDay();
            onOpenKitchen();
          }}
          className="w-full py-2.5 bg-gradient-to-r from-[#F26440] via-[#E75434] to-[#D94222] hover:brightness-105 active:scale-98 text-white font-black text-sm sm:text-base rounded-xl shadow-md border border-[#C23315] flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <span className="text-lg">🍹</span>
          <span>Vào quầy pha chế · Ngày {day}</span>
        </button>

        <div className="text-center mt-1">
          <button
            onClick={() => setShowHowToPlay(!showHowToPlay)}
            className="text-[11px] text-[#9E735B] hover:text-[#E05338] font-bold underline cursor-pointer inline-flex items-center gap-1"
          >
            <HelpCircle size={11} />
            <span>Cách chơi tiệm sinh tố</span>
          </button>
        </div>
      </div>

      {/* How To Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3">
          <div className="bg-white border-2 border-[#E05338] rounded-2xl p-4 max-w-xs w-full shadow-2xl">
            <h3 className="text-sm font-black text-[#E05338] mb-2 flex items-center gap-1 font-['Comfortaa']">
              <span>🍹</span>
              <span>Cách Chơi Tiệm Sinh Tố</span>
            </h3>
            <div className="space-y-1.5 text-[11px] text-[#5C3A21] leading-relaxed">
              <p><strong>1. Lấy ly:</strong> Chạm chồng ly để lấy 1 ly rỗng lên quầy.</p>
              <p><strong>2. Nguyên liệu:</strong> Thêm trái cây, đá và sữa theo yêu cầu của khách.</p>
              <p><strong>3. Xay sinh tố:</strong> Bấm "Bật máy xay" để xay nhuyễn trong vài giây.</p>
              <p><strong>4. Giao món:</strong> Giao ly sinh tố cho khách để nhận tiền và đánh giá 5 sao!</p>
              <p><strong>5. Mở rộng:</strong> Nhập hàng, mua máy xay xịn, nâng cấp tiệm để thành triệu phú!</p>
            </div>
            <button
              onClick={() => setShowHowToPlay(false)}
              className="w-full mt-3 py-1.5 bg-[#E05338] hover:bg-[#D2442A] text-white font-bold text-xs rounded-xl shadow active:scale-95 cursor-pointer"
            >
              Đã hiểu, vào tiệm thôi!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
