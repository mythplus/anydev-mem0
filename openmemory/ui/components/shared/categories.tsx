import React, { useState } from "react";
import {
  Book,
  HeartPulse,
  BriefcaseBusiness,
  CircleHelp,
  Palette,
  Code,
  Settings,
  Users,
  Heart,
  Brain,
  MapPin,
  Globe,
  PersonStandingIcon,
} from "lucide-react";
import {
  FaLaptopCode,
  FaPaintBrush,
  FaBusinessTime,
  FaRegHeart,
  FaRegSmile,
  FaUserTie,
  FaMoneyBillWave,
  FaBriefcase,
  FaPlaneDeparture,
} from "react-icons/fa";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "../ui/badge";

type Category = string;

const defaultIcon = <CircleHelp className="w-4 h-4 mr-2" />;

const iconMap: Record<string, any> = {
  // Core themes
  health: <HeartPulse className="w-4 h-4 mr-2" />,
  wellness: <Heart className="w-4 h-4 mr-2" />,
  fitness: <HeartPulse className="w-4 h-4 mr-2" />,
  education: <Book className="w-4 h-4 mr-2" />,
  learning: <Book className="w-4 h-4 mr-2" />,
  school: <Book className="w-4 h-4 mr-2" />,
  coding: <FaLaptopCode className="w-4 h-4 mr-2" />,
  programming: <Code className="w-4 h-4 mr-2" />,
  development: <Code className="w-4 h-4 mr-2" />,
  tech: <Settings className="w-4 h-4 mr-2" />,
  design: <FaPaintBrush className="w-4 h-4 mr-2" />,
  art: <Palette className="w-4 h-4 mr-2" />,
  creativity: <Palette className="w-4 h-4 mr-2" />,
  psychology: <Brain className="w-4 h-4 mr-2" />,
  mental: <Brain className="w-4 h-4 mr-2" />,
  social: <Users className="w-4 h-4 mr-2" />,
  peronsal: <PersonStandingIcon className="w-4 h-4 mr-2" />,
  life: <Heart className="w-4 h-4 mr-2" />,

  // Work / Career
  business: <FaBusinessTime className="w-4 h-4 mr-2" />,
  work: <FaBriefcase className="w-4 h-4 mr-2" />,
  career: <FaUserTie className="w-4 h-4 mr-2" />,
  jobs: <BriefcaseBusiness className="w-4 h-4 mr-2" />,
  finance: <FaMoneyBillWave className="w-4 h-4 mr-2" />,
  money: <FaMoneyBillWave className="w-4 h-4 mr-2" />,

  // Preferences
  preference: <FaRegHeart className="w-4 h-4 mr-2" />,
  interest: <FaRegSmile className="w-4 h-4 mr-2" />,

  // Travel & Location
  travel: <FaPlaneDeparture className="w-4 h-4 mr-2" />,
  journey: <FaPlaneDeparture className="w-4 h-4 mr-2" />,
  location: <MapPin className="w-4 h-4 mr-2" />,
  trip: <Globe className="w-4 h-4 mr-2" />,
  places: <Globe className="w-4 h-4 mr-2" />,
};

const getClosestIcon = (label: string): any => {
  const normalized = label.toLowerCase().split(/[\s\-_.]+/);

  let bestMatch: string | null = null;
  let bestScore = 0;

  Object.keys(iconMap).forEach((key) => {
    const keyTokens = key.split(/[\s\-_.]+/);
    const matchScore = normalized.filter((word) =>
      keyTokens.some((token) => word.includes(token) || token.includes(word))
    ).length;

    if (matchScore > bestScore) {
      bestScore = matchScore;
      bestMatch = key;
    }
  });

  return bestMatch ? iconMap[bestMatch] : defaultIcon;
};

const getColor = (label: string): string => {
  const l = label.toLowerCase();
  if (l.includes("health") || l.includes("fitness"))
    return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  if (l.includes("education") || l.includes("school"))
    return "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
  if (
    l.includes("business") ||
    l.includes("career") ||
    l.includes("work") ||
    l.includes("finance")
  )
    return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  if (l.includes("design") || l.includes("art") || l.includes("creative"))
    return "text-pink-400 bg-pink-500/10 border-pink-500/20";
  if (l.includes("tech") || l.includes("code") || l.includes("programming"))
    return "text-purple-400 bg-purple-500/10 border-purple-500/20";
  if (l.includes("interest") || l.includes("preference"))
    return "text-rose-400 bg-rose-500/10 border-rose-500/20";
  if (
    l.includes("travel") ||
    l.includes("trip") ||
    l.includes("location") ||
    l.includes("place")
  )
    return "text-sky-400 bg-sky-500/10 border-sky-500/20";
  if (l.includes("personal") || l.includes("life"))
    return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
  return "text-blue-400 bg-blue-500/10 border-blue-500/20";
};

const Categories = ({
  categories,
  isPaused = false,
  concat = false,
}: {
  categories: Category[];
  isPaused?: boolean;
  concat?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // 过滤无效分类名（如 ——、--、null 等），并拆分复合分类（如 "ai, ml & technology" → ["ai", "ml", "technology"]）
  const validCategories = (categories || [])
    .flatMap((cat) => {
      // 先按逗号、&、and 等分隔符拆分
      return cat.split(/\s*[,，]\s*|\s*&\s*|\s+and\s+/i);
    })
    .map((c) => c.trim())
    .filter((cat) => {
      if (!cat) return false;
      const cleaned = cat.toLowerCase();
      if (['null', 'none', 'n/a', 'unknown', 'undefined', '无', '未知'].includes(cleaned)) return false;
      if (/^[^\w]+$/.test(cleaned)) return false;
      return true;
    })
    // 去重
    .filter((cat, index, self) => self.indexOf(cat) === index);

  const baseBadgeStyle =
    "backdrop-blur-sm transition-all duration-200 hover:bg-opacity-20 badge-hover cursor-default";
  const pausedStyle =
    "text-zinc-500 bg-zinc-800/40 border-zinc-700/40 hover:bg-zinc-800/60";

  // 没有有效分类时，默认显示 "null" 标签
  if (validCategories.length === 0) {
    return (
      <div className="flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className={`${
            isPaused
              ? pausedStyle
              : "text-zinc-400 bg-zinc-500/10 border-zinc-500/20"
          } ${baseBadgeStyle} italic`}
        >
          null
        </Badge>
      </div>
    );
  }

  if (concat) {
    const remainingCount = validCategories.length - 1;

    return (
      <div className="flex flex-wrap gap-2">
        {/* First category */}
        <Badge
          variant="outline"
          className={`${
            isPaused
              ? pausedStyle
              : `${getColor(validCategories[0])} ${baseBadgeStyle}`
          }`}
        >
          {validCategories[0]}
        </Badge>

        {/* Popover for remaining categories */}
        {remainingCount > 0 && (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger
              onMouseEnter={() => setIsOpen(true)}
              onMouseLeave={() => setIsOpen(false)}
            >
              <Badge
                variant="outline"
                className={
                  isPaused
                    ? pausedStyle
                    : "text-zinc-400 bg-zinc-500/10 border-zinc-500/20 hover:bg-zinc-500/20"
                }
              >
                +{remainingCount}
              </Badge>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-2 border bg-[#27272A] border-zinc-700/60 rounded-xl shadow-xl shadow-black/20"
              onMouseEnter={() => setIsOpen(true)}
              onMouseLeave={() => setIsOpen(false)}
              sideOffset={6}
            >
              <div className="flex flex-col gap-2">
                {validCategories.slice(1).map((cat, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className={`${
                      isPaused
                        ? pausedStyle
                        : `${getColor(cat)} ${baseBadgeStyle}`
                    }`}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  }

  // Default view
  return (
    <div className="flex flex-wrap gap-2">
      {validCategories?.map((cat, i) => (
        <Badge
          key={i}
          variant="outline"
          className={`${
            isPaused ? pausedStyle : `${getColor(cat)} ${baseBadgeStyle}`
          }`}
        >
          {cat}
        </Badge>
      ))}
    </div>
  );
};

export default Categories;
