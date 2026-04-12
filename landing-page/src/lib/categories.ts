import {
  Paintbrush,
  Wrench,
  Zap,
  Scissors,
  Hammer,
  Trees,
  Snowflake,
  Sparkles,
  Camera,
  HardHat,
  Car,
  Utensils,
  type LucideIcon,
} from "lucide-react";

export interface BusinessCategory {
  id: string;
  labelKey: string;
  icon: LucideIcon;
  color: string;
}

export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  { id: "painter", labelKey: "painter", icon: Paintbrush, color: "text-emerald-500" },
  { id: "plumber", labelKey: "plumber", icon: Wrench, color: "text-blue-500" },
  { id: "electrician", labelKey: "electrician", icon: Zap, color: "text-yellow-500" },
  { id: "beauty", labelKey: "beauty", icon: Scissors, color: "text-pink-500" },
  { id: "carpenter", labelKey: "carpenter", icon: Hammer, color: "text-amber-600" },
  { id: "gardener", labelKey: "gardener", icon: Trees, color: "text-green-600" },
  { id: "ac_service", labelKey: "ac_service", icon: Snowflake, color: "text-cyan-500" },
  { id: "cleaning", labelKey: "cleaning", icon: Sparkles, color: "text-sky-500" },
  { id: "photographer", labelKey: "photographer", icon: Camera, color: "text-purple-500" },
  { id: "construction", labelKey: "construction", icon: HardHat, color: "text-orange-500" },
  { id: "mechanic", labelKey: "mechanic", icon: Car, color: "text-red-500" },
  { id: "catering", labelKey: "catering", icon: Utensils, color: "text-rose-500" },
];
