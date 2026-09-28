import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useEconomyStore } from '../../stores/economyStore';
import { useShopStore } from '../../stores/shopStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { formatVND } from '../../utils/format';
import { audioService } from '../../services/AudioService';
import { SHOP_LEVELS } from '../../data/upgrades';
import { LargeOrderLobbyCard } from '../largeOrders/LargeOrderLobbyCard';
import { LargeOrderBanner } from '../largeOrders/LargeOrderBanner';
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
  Zap,
  Store
} from 'lucide-react';

interface CozyShopLobbyProps {
  onOpenKitchen: () => void;
}

export const CozyShopLobby: React.FC<CozyShopLobbyProps> = ({ onOpenKitchen }) => {
  const { 
    day, 
    phase,
    weather, 
    shopName, 
    setShopName, 
    managerName,
    managerAvatar,
    setManagerProfile,
    xp, 
    maxXp, 
    quests, 
    claimQuest, 
    setActiveTab, 
    openShopForDay,
    showNotification 
  } = useGameStore();

  const displayManagerName = managerName || 'Bé Bơ';
  const displayManagerAvatar = managerAvatar || '🥑';

  const cash = useEconomyStore((state) => state.cash);
  const currentShopLevel = useShopStore((state) => state.currentShopLevel);
  const cleanliness = useShopStore((state) => state.cleanliness);
  const cleanShop = useShopStore((state) => state.cleanShop);
  const ingredients = useInventoryStore((state) => state.ingredients);
  const buyIngredient = useInventoryStore((state) => state.buyIngredient);
  const deductCash = useEconomyStore((state) => state.deductCash);

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(shopName);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [tempManagerName, setTempManagerName] = useState(managerName);
  const [tempManagerAvatar, setTempManagerAvatar] = useState(managerAvatar);
  const [lobbySubTab, setLobbySubTab] = useState<'quests' | 'restock' | 'shortcuts'>('quests');

  const MANAGER_AVATAR_OPTIONS = [
    { icon: '🥑', label: 'Bé Bơ' },
    { icon: '🥭', label: 'Bé Xoài' },
    { icon: '🍓', label: 'Bé Dâu' },
    { icon: '🍉', label: 'Bé Dưa' },
    { icon: '🍌', label: 'Bé Chuối' },
    { icon: '🥥', label: 'Bé Dừa' },
    { icon: '🐱', label: 'Mèo Bán Nước' },
    { icon: '🐶', label: 'Cún Quản Lý' },
    { icon: '🦊', label: 'Cáo Phục Vụ' },
    { icon: '🐻', label: 'Gấu Pha Chế' },
    { icon: '🐰', label: 'Thỏ Mọng Nước' },
    { icon: '🦁', label: 'Sư Tử Sếp' },
  ];

  const handleSaveManagerProfile = () => {
    if (tempManagerName.trim()) {
      setManagerProfile(tempManagerName.trim(), tempManagerAvatar);
      setShowManagerModal(false);
      audioService.playClick();
      showNotification(`Đã cập nhật quản lý ${tempManagerAvatar} ${tempManagerName.trim()}!`, 'success');
    }
  };

  const currentLevelConfig = SHOP_LEVELS.find((cfg) => cfg.level === currentShopLevel) || SHOP_LEVELS[0];

  const handleSaveName = () => {
    if (tempName.trim()) {
      setShopName(tempName.trim());
      setIsEditingName(false);
      audioService.playClick();
      showNotification('Đã đổi tên quán thành công!', 'success');
    }
  };

  const handleCleanUp = () => {
    cleanShop();
    audioService.playCashRegister();
    showNotification('Đã lau dọn quầy hàng sạch sẽ 100%! ✨', 'success');
  };

  const weatherDetails: Record<string, { label: string; desc: string; icon: string; bgGradient: string; textCol: string }> = {
    sunny: {
      label: 'Trời nắng đẹp',
      desc: 'Nắng ấm nhẹ nhàng, khách thích ghé giải khát vỉa hè!',
      icon: '☀️',
      bgGradient: 'from-amber-500/15 via-orange-400/10 to-amber-100/5',
      textCol: 'text-amber-800',
    },
    heatwave: {
      label: 'Trời nắng gắt',
      desc: 'Thời tiết oi bức cực điểm! Khách đông hơn +35%.',
      icon: '🔥',
      bgGradient: 'from-orange-500/20 via-red-500/10 to-amber-100/10',
      textCol: 'text-orange-900',
    },
    rain: {
      label: 'Trời mưa rào',
      desc: 'Mưa rào vỉa hè, giảm -25% lượng khách vãng lai.',
      icon: '🌧️',
      bgGradient: 'from-blue-500/15 via-indigo-400/10 to-slate-200/10',
      textCol: 'text-blue-900',
    },
    storm: {
      label: 'Giông bão lớn',
      desc: 'Gió giật mạnh, nên mua thêm nguyên liệu dự trữ!',
      icon: '⛈️',
      bgGradient: 'from-slate-600/20 via-purple-900/15 to-slate-300/10',
      textCol: 'text-purple-950',
    },
  };

  const currentWeather = weatherDetails[weather] || weatherDetails.sunny;

  const quickTabs = [
    { id: 'inventory', label: 'Kho hàng', icon: <Package size={16} className="text-amber-600" /> },
    { id: 'recipes', label: 'Giá bán', icon: <BookOpen size={16} className="text-orange-600" /> },
    { id: 'upgrades', label: 'Nâng cấp', icon: <Wrench size={16} className="text-emerald-600" /> },
    { id: 'social', label: 'TrendTok', icon: <Share2 size={16} className="text-pink-600" /> },
    { id: 'reviews', label: 'Đánh giá', icon: <Star size={16} className="text-yellow-600" /> },
    { id: 'finance', label: 'Vốn & BĐS', icon: <Landmark size={16} className="text-blue-600" /> },
  ] as const;

  const handleQuickRestock = (ingId: string) => {
    const ing = ingredients.find((i) => i.id === ingId);
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

  const completedQuestsCount = quests.filter((q) => q.currentCount >= q.targetCount && !q.completed).length;

  // Mascot Speech Quotes
  const getMascotSpeech = () => {
    if (cleanliness < 50) return 'Quầy hàng hơi bẩn rồi sếp ơi, lau dọn ngay thôi! 🧹';
    if (weather === 'heatwave') return 'Trời nắng gắt thế này khách sẽ đông xỉu luôn! 🔥';
    if (weather === 'rain') return 'Trời mưa gió, làm ly sinh tố bơ ấm lòng nè! 🌧️';
    if (day === 1) return 'Chào mừng sếp mở tiệm sinh tố đầu tiên! 🥑✨';
    return 'Hôm nay Bơ chọn trái cây tươi ngon sẵn rồi sếp ơi! 🍹';
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto no-scrollbar p-2 sm:p-4 bg-gradient-to-b from-[#FDF8F2] via-[#FAF3EA] to-[#F5EAD9] text-[#3D2619] select-none">
      <div className="max-w-md md:max-w-4xl lg:max-w-5xl mx-auto flex flex-col md:flex-row gap-3 lg:gap-5 items-stretch justify-center">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: Storefront Facade & Interactive Street Scene */}
        {/* ========================================================= */}
        <div className="flex-1 flex flex-col gap-2.5 bg-[#FFFDF9] border border-[#F0D8C6] rounded-2xl p-3 shadow-md relative overflow-hidden">
          
          {/* Festive Scalloped Awning Top Header */}
          <div className="relative rounded-xl bg-gradient-to-r from-[#F26440] via-[#E8532F] to-[#D83C1A] text-white p-3 shadow-md overflow-hidden border border-[#C23315]">
            {/* Scalloped Awning Fringe */}
            <div className="absolute top-0 left-0 right-0 h-2.5 bg-white/20 flex justify-between px-1">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="w-3.5 h-2 bg-amber-200/40 rounded-b-full shadow-2xs" />
              ))}
            </div>

            {/* Glowing Festoon String Bulbs */}
            <div className="absolute top-2 left-2 right-2 flex justify-between px-3 pointer-events-none">
              {['#FDE047', '#38BDF8', '#4ADE80', '#FB7185', '#FDE047'].map((col, idx) => (
                <div
                  key={idx}
                  className="w-2.5 h-2.5 rounded-full shadow-sm animate-pulse"
                  style={{ backgroundColor: col, animationDelay: `${idx * 0.3}s` }}
                />
              ))}
            </div>

            {/* Shop Name & Leaderboard Row */}
            <div className="mt-2.5 flex items-center justify-between gap-2 relative z-10">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <Store size={18} className="text-amber-200 shrink-0" />
                {isEditingName ? (
                  <div className="flex items-center gap-1 bg-white/95 rounded-lg px-2 py-0.5 text-[#3D2619] max-w-full">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="text-xs font-bold w-28 sm:w-36 outline-none bg-transparent"
                      maxLength={20}
                    />
                    <button
                      onClick={handleSaveName}
                      className="text-[10px] bg-[#E05338] text-white px-2 py-0.5 rounded font-black hover:bg-[#D2442A] shrink-0"
                    >
                      Lưu
                    </button>
                  </div>
                ) : (
                  <h1 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-1 font-['Comfortaa',sans-serif] truncate">
                    <span className="truncate">{shopName}</span>
                    <button
                      onClick={() => {
                        setTempName(shopName);
                        setIsEditingName(true);
                        audioService.playClick();
                      }}
                      className="p-1 hover:bg-white/20 rounded-full transition-colors opacity-80 shrink-0"
                      title="Đổi tên quán"
                    >
                      <Edit3 size={11} />
                    </button>
                  </h1>
                )}
              </div>

              {/* Leaderboard Trophy Badge */}
              <button
                onClick={() => {
                  audioService.playClick();
                  showNotification(`Quán của bạn đang đứng TOP 1 khu phố ẩm thực! ⭐`, 'success');
                }}
                className="flex items-center gap-1 text-[10px] sm:text-[10.5px] font-black bg-white/20 hover:bg-white/30 text-white px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0 border border-white/30 shadow-xs"
              >
                <Trophy size={12} className="text-yellow-300" />
                <span>TOP 1 Khu Phố</span>
              </button>
            </div>

            {/* Dedicated Row 2: Level & XP Bar (Full Width, Never Overlaps) */}
            <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-white/15 relative z-10">
              <span className="text-[10px] font-black px-2 py-0.5 bg-black/25 rounded-full text-amber-200 shrink-0 border border-amber-300/30 truncate max-w-[170px] sm:max-w-none">
                Cấp {currentShopLevel} · {currentLevelConfig.title}
              </span>
              
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-16 sm:w-24 bg-black/30 h-2 rounded-full overflow-hidden shrink-0 border border-white/20">
                  <div
                    className="bg-gradient-to-r from-amber-300 to-amber-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((xp / maxXp) * 100))}%` }}
                  />
                </div>
                <span className="text-[9.5px] font-black text-white/90 tabular-nums shrink-0">
                  {xp}/{maxXp} XP
                </span>
              </div>
            </div>

            {/* Days Tracker Horizontal Strip */}
            <div className="mt-2.5 pt-2 border-t border-white/20 flex items-center justify-between">
              <div className="flex items-center gap-1 py-0.5 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-black text-white/90 mr-1 shrink-0">Hành trình:</span>
                {Array.from({ length: 8 }).map((_, i) => {
                  const dayNum = i + 1;
                  const isCurrent = dayNum === day;
                  const isPast = dayNum < day;
                  return (
                    <div
                      key={i}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 transition-all ${
                        isCurrent
                          ? 'bg-amber-300 text-[#3D2619] border-2 border-white shadow-md scale-105'
                          : isPast
                          ? 'bg-white/40 text-white'
                          : 'bg-white/20 text-white/60'
                      }`}
                    >
                      {dayNum}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive Shop Storefront Graphics & Fruit Crates Display */}
          <div className="relative rounded-2xl bg-gradient-to-b from-[#FFFDF9] via-[#FAF3EA] to-[#F5EAD9] p-3 border border-[#F0D5C3] shadow-inner flex flex-col justify-between min-h-[190px]">
            {/* Background Ambient Sunlight / Decor */}
            <div className="absolute top-2 right-2 text-3xl opacity-20 pointer-events-none select-none">
              🌿 🌴
            </div>

            {/* Chalkboard Menu Special */}
            <div className="flex items-center justify-between bg-[#26211E] text-amber-200 px-3 py-1.5 rounded-xl border-2 border-[#5C4538] shadow-sm mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm">📌</span>
                <span className="text-[11px] font-bold truncate">
                  Đặc sản hôm nay: <strong className="text-amber-300">Sinh Tố Bơ Dừa Béo</strong> (+15% giá)
                </span>
              </div>
              <span className="text-[9.5px] font-black bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30 shrink-0">
                Bán chạy!
              </span>
            </div>

            {/* Manager Mascot Card & Dialogue Bubble */}
            <div className="flex flex-col gap-1.5 my-1 bg-amber-50/90 border border-amber-200/80 p-2.5 rounded-2xl shadow-2xs">
              {/* Top Header Row: Manager Info on left, Clean Button on right */}
              <div className="flex items-center justify-between gap-2 w-full">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => {
                      setTempManagerName(displayManagerName);
                      setTempManagerAvatar(displayManagerAvatar);
                      setShowManagerModal(true);
                      audioService.playClick();
                    }}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-amber-400 to-amber-500 flex items-center justify-center text-2xl shadow-sm shrink-0 border border-white hover:scale-105 transition-transform cursor-pointer relative"
                    title="Chỉnh sửa quản lý & icon"
                  >
                    <span>{displayManagerAvatar}</span>
                    <span className="absolute -bottom-1 -right-1 bg-amber-600 text-white p-0.5 rounded-full text-[8px] shadow-xs">
                      <Edit3 size={8} />
                    </span>
                  </button>

                  <div className="min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-black text-[#3D2619] truncate">
                        {displayManagerName}
                      </span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded-full shrink-0">
                        Quản lý
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setTempManagerName(displayManagerName);
                        setTempManagerAvatar(displayManagerAvatar);
                        setShowManagerModal(true);
                        audioService.playClick();
                      }}
                      className="text-[10px] text-amber-800 hover:text-[#E05338] font-bold underline cursor-pointer text-left w-fit"
                    >
                      Đổi avatar & tên
                    </button>
                  </div>
                </div>

                {cleanliness < 100 && (
                  <button
                    onClick={handleCleanUp}
                    className="text-[10px] font-black bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded-xl shadow-xs transition-all flex items-center gap-1 active:scale-95 cursor-pointer shrink-0 border border-amber-400/40"
                  >
                    <span>🧹</span>
                    <span>Lau dọn ({cleanliness}%)</span>
                  </button>
                )}
              </div>

              {/* Bottom Quote Row */}
              <p className="text-[11px] font-bold text-amber-900 leading-snug pl-1 pt-0.5 border-t border-amber-200/50">
                "{getMascotSpeech()}"
              </p>
            </div>

            {/* Interactive Fruit Wooden Crates (Quick View Inventory) */}
            <div className="mt-1 pt-2 border-t border-[#EEDCC8]">
              <div className="text-[10.5px] font-black text-[#78513E] mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span>🧺</span>
                  <span>Kệ Trái Cây Tươi Ngon Của Tiệm</span>
                </span>
                <span className="text-[9.5px] text-amber-800 font-bold">Tồn kho live</span>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {ingredients
                  .filter((i) => ['avocado', 'mango', 'strawberry', 'banana', 'watermelon'].includes(i.id))
                  .map((ing) => (
                    <div
                      key={ing.id}
                      className="p-1.5 rounded-xl bg-white border border-[#F2DECC] flex flex-col items-center text-center shadow-2xs hover:border-amber-400 transition-all"
                    >
                      <span className="text-xl leading-none">{ing.icon}</span>
                      <span className="text-[9px] font-black text-[#3D2619] truncate w-full mt-0.5">
                        {ing.name.split(' ')[0]}
                      </span>
                      <span className="text-[8.5px] font-bold text-emerald-700 tabular-nums">
                        {ing.currentStock} {ing.unit}
                      </span>
                      <button
                        onClick={() => handleQuickRestock(ing.id)}
                        className="mt-1 w-full py-0.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-[9px] rounded-md shadow-2xs active:scale-95 cursor-pointer flex items-center justify-center gap-0.5"
                        title={`Mua +5 ${ing.unit}`}
                      >
                        <Plus size={9} />
                        <span>5</span>
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Operations, Weather & Interactive Hub */}
        {/* ========================================================= */}
        <div className="flex-1 flex flex-col gap-2.5 justify-between">
          
          {/* Active Large Order Production Banner if producing */}
          <LargeOrderBanner />

          {/* Large Order Business Challenge Lobby Card */}
          <LargeOrderLobbyCard onOpenKitchen={onOpenKitchen} />

          {/* Today's Weather & Customer Traffic Card */}
          <div className={`rounded-2xl p-3 border border-[#F0D5C3] shadow-xs bg-gradient-to-r ${currentWeather.bgGradient} transition-all`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentWeather.icon}</span>
                <div>
                  <h3 className={`text-xs sm:text-sm font-black ${currentWeather.textCol} flex items-center gap-1`}>
                    <span>{currentWeather.label}</span>
                    <span className="text-[10px] bg-white/80 font-black px-1.5 py-0.2 rounded-full border border-amber-300">
                      Ngày {day}
                    </span>
                  </h3>
                  <p className="text-[11px] font-bold text-stone-700 mt-0.5 leading-tight">
                    {currentWeather.desc}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Operations Hub */}
          <div className="bg-[#FFFDF9] border border-[#F0D8C6] rounded-2xl p-3 shadow-md flex-1 flex flex-col justify-between">
            {/* Sub Tabs Bar */}
            <div className="flex items-center p-1 bg-[#FAF0E6] rounded-xl gap-1 mb-2 border border-[#EEDCC8]">
              <button
                onClick={() => {
                  audioService.playClick();
                  setLobbySubTab('quests');
                }}
                className={`flex-1 py-1.5 text-xs font-black rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  lobbySubTab === 'quests'
                    ? 'bg-white text-[#E05338] shadow-xs'
                    : 'text-[#8C624D] hover:text-[#3D2619]'
                }`}
              >
                <Sparkles size={13} className={completedQuestsCount > 0 ? 'text-amber-500 animate-spin' : ''} />
                <span>Nhiệm vụ</span>
                {completedQuestsCount > 0 && (
                  <span className="w-4 h-4 bg-amber-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                    {completedQuestsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  audioService.playClick();
                  setLobbySubTab('restock');
                }}
                className={`flex-1 py-1.5 text-xs font-black rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  lobbySubTab === 'restock'
                    ? 'bg-white text-[#E05338] shadow-xs'
                    : 'text-[#8C624D] hover:text-[#3D2619]'
                }`}
              >
                <ShoppingBag size={13} />
                <span>Nhập nhanh</span>
              </button>

              <button
                onClick={() => {
                  audioService.playClick();
                  setLobbySubTab('shortcuts');
                }}
                className={`flex-1 py-1.5 text-xs font-black rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  lobbySubTab === 'shortcuts'
                    ? 'bg-white text-[#E05338] shadow-xs'
                    : 'text-[#8C624D] hover:text-[#3D2619]'
                }`}
              >
                <Zap size={13} />
                <span>Tiện ích</span>
              </button>
            </div>

            {/* Panel Tab Content */}
            <div className="flex-1 flex flex-col justify-start min-h-[140px]">
              {lobbySubTab === 'quests' && (
                <div className="flex flex-col gap-1.5">
                  {quests.map((q) => {
                    const isDone = q.currentCount >= q.targetCount;
                    const progressPct = Math.min(100, Math.round((q.currentCount / q.targetCount) * 100));
                    return (
                      <div
                        key={q.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-[#FFF9F2] border border-[#F2DECC] hover:border-amber-300 transition-all shadow-2xs"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="text-xs font-black text-[#3D2619] truncate">{q.title}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-amber-800 font-black">
                              +{formatVND(q.rewardCash)} · +{q.rewardXp} XP
                            </span>
                            {!q.completed && !isDone && (
                              <div className="w-16 bg-stone-200 h-1.5 rounded-full overflow-hidden shrink-0">
                                <div
                                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center">
                          {q.completed ? (
                            <span className="text-[9.5px] font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                              <CheckCircle2 size={10} /> Đã nhận
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
                              className="text-[10.5px] font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white px-2.5 py-1 rounded-lg shadow-xs active:scale-95 cursor-pointer ring-1 ring-amber-300 animate-pulse"
                            >
                              Nhận thưởng
                            </button>
                          ) : (
                            <span className="text-[10px] font-black text-[#8C624D] bg-[#FAF0E6] px-2 py-0.5 rounded-md tabular-nums border border-[#EEDCC8]">
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
                <div className="flex flex-col py-1">
                  <div className="text-[11px] text-[#8C624D] font-bold mb-2 flex items-center justify-between">
                    <span>Chạm +5 để mua nhanh nguyên liệu trước giờ mở quán:</span>
                    <button
                      onClick={() => setActiveTab('inventory')}
                      className="text-[#E05338] underline hover:text-[#C23315] font-black cursor-pointer"
                    >
                      Kho đầy đủ
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {ingredients
                      .filter((i) => ['avocado', 'mango', 'strawberry', 'banana', 'watermelon'].includes(i.id))
                      .map((ing) => (
                        <div
                          key={ing.id}
                          className="p-1.5 rounded-xl bg-[#FFF9F2] border border-[#F2DECC] flex flex-col items-center text-center shadow-2xs"
                        >
                          <span className="text-xl leading-none">{ing.icon}</span>
                          <span className="text-[9.5px] font-black text-[#3D2619] truncate w-full mt-0.5">
                            {ing.name.split(' ')[0]}
                          </span>
                          <span className="text-[8.5px] text-[#78513E] tabular-nums font-bold">
                            Tồn: {ing.currentStock}
                          </span>
                          <button
                            onClick={() => handleQuickRestock(ing.id)}
                            className="mt-1 w-full py-0.5 bg-amber-500 hover:bg-amber-400 text-white font-black text-[9.5px] rounded-md shadow-2xs active:scale-95 cursor-pointer flex items-center justify-center gap-0.5"
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
                <div className="grid grid-cols-3 gap-2 py-1 items-center">
                  {quickTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        audioService.playClick();
                        setActiveTab(tab.id);
                      }}
                      className="bg-[#FFF9F2] hover:bg-[#FFF4E8] border border-[#F0D5C3] p-2.5 rounded-xl flex flex-col items-center justify-center gap-1.5 text-center transition-all active:scale-95 cursor-pointer shadow-2xs hover:border-amber-400"
                    >
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-2xs border border-[#F2DECC]">
                        {tab.icon}
                      </div>
                      <span className="text-xs font-black text-[#42281D]">{tab.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Main Action CTA Button: Start Day & Enter Kitchen */}
            <div className="mt-3 pt-2 border-t border-[#EEDCC8]">
              {phase === 'prep' ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1 text-[11px] font-bold text-amber-900">
                    <span className="flex items-center gap-1">
                      <span>🕒</span>
                      <span>Giai đoạn chuẩn bị (Đang dừng giờ)</span>
                    </span>
                    <span className="text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
                      Sẵn sàng mở
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      audioService.playCashRegister();
                      openShopForDay();
                      onOpenKitchen();
                      showNotification(`🚀 Đã mở cửa tiệm Ngày ${day}! Chúc quán buôn may bán đắt!`, 'success');
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:brightness-105 active:scale-98 text-white font-black text-base sm:text-lg rounded-2xl shadow-lg border-2 border-emerald-400 flex items-center justify-center gap-2 cursor-pointer transition-all animate-pulse"
                  >
                    <span className="text-xl">🚪</span>
                    <span>MỞ CỬA BÁN HÀNG · NGÀY {day}</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    audioService.playClick();
                    onOpenKitchen();
                  }}
                  className="w-full py-3 bg-gradient-to-r from-[#F26440] via-[#E75434] to-[#D94222] hover:brightness-105 active:scale-98 text-white font-black text-base sm:text-lg rounded-2xl shadow-md border border-[#C23315] flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <span className="text-xl">🍹</span>
                  <span>Vào quầy pha chế (Đang mở cửa)</span>
                </button>
              )}

              <div className="text-center mt-1.5">
                <button
                  onClick={() => setShowHowToPlay(!showHowToPlay)}
                  className="text-xs text-[#9E735B] hover:text-[#E05338] font-bold underline cursor-pointer inline-flex items-center gap-1"
                >
                  <HelpCircle size={12} />
                  <span>Cách chơi tiệm sinh tố</span>
                </button>
              </div>
            </div>
          </div>

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

      {/* Manager Profile Customization Modal */}
      {showManagerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-[#FFFDF9] border-2 border-[#E05338] rounded-3xl p-4 max-w-sm w-full shadow-2xl text-[#3D2619] relative">
            <div className="flex items-center justify-between mb-3 border-b border-[#F0D5C3] pb-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-amber-400 flex items-center justify-center text-2xl shadow-inner border border-white">
                  {tempManagerAvatar}
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#3D2619] font-['Comfortaa']">
                    Đổi Quản Lý & Avatar Tiệm
                  </h3>
                  <p className="text-[10.5px] text-[#8C624D] font-bold">
                    Tùy chỉnh tên & linh vật của tiệm sinh tố
                  </p>
                </div>
              </div>
            </div>

            {/* Input Name */}
            <div className="mb-3">
              <label className="block text-xs font-black text-[#78513E] mb-1">
                Tên Quản Lý Tiệm:
              </label>
              <input
                type="text"
                value={tempManagerName}
                onChange={(e) => setTempManagerName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#F0D5C3] rounded-xl text-xs font-black text-[#3D2619] outline-none focus:border-[#E05338] shadow-2xs"
                placeholder="Nhập tên quản lý..."
                maxLength={18}
              />
            </div>

            {/* Avatar Grid Selection */}
            <div className="mb-4">
              <label className="block text-xs font-black text-[#78513E] mb-1.5">
                Chọn Avatar / Linh Vật Bán Nước:
              </label>
              <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto no-scrollbar p-1 bg-[#FAF0E6] rounded-2xl border border-[#EEDCC8]">
                {MANAGER_AVATAR_OPTIONS.map((opt) => {
                  const isSelected = tempManagerAvatar === opt.icon;
                  return (
                    <button
                      key={opt.icon}
                      onClick={() => {
                        setTempManagerAvatar(opt.icon);
                        audioService.playClick();
                      }}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400 border-[#E05338] text-white shadow-md scale-105 ring-2 ring-amber-300'
                          : 'bg-white border-[#F0D5C3] hover:bg-amber-50 text-[#3D2619]'
                      }`}
                    >
                      <span className="text-2xl">{opt.icon}</span>
                      <span className="text-[9px] font-black truncate w-full text-center">
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowManagerModal(false)}
                className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-black text-xs rounded-xl transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveManagerProfile}
                className="flex-1 py-2 bg-[#E05338] hover:bg-[#D2442A] text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
