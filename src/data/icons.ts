import {
  Briefcase,
  Plane,
  GraduationCap,
  Coffee,
  ShoppingCart,
  Heart,
  Home,
  Music,
  BookOpen,
  Gamepad2,
  Utensils,
  MessageCircle,
  Globe,
  Lightbulb,
  Users,
  Dumbbell,
} from "lucide-react";

export interface IconOption {
  name: string;
  component: React.ComponentType<any>;
  color: string;
}

export const iconOptions: IconOption[] = [
  { name: "Briefcase", component: Briefcase, color: "from-blue-500 to-cyan-500" },
  { name: "Plane", component: Plane, color: "from-green-500 to-emerald-500" },
  { name: "GraduationCap", component: GraduationCap, color: "from-purple-500 to-violet-500" },
  { name: "Coffee", component: Coffee, color: "from-orange-500 to-amber-500" },
  { name: "ShoppingCart", component: ShoppingCart, color: "from-pink-500 to-rose-500" },
  { name: "Heart", component: Heart, color: "from-red-500 to-pink-500" },
  { name: "Home", component: Home, color: "from-amber-500 to-yellow-500" },
  { name: "Music", component: Music, color: "from-indigo-500 to-purple-500" },
  { name: "BookOpen", component: BookOpen, color: "from-teal-500 to-cyan-500" },
  { name: "Gamepad2", component: Gamepad2, color: "from-fuchsia-500 to-pink-500" },
  { name: "Utensils", component: Utensils, color: "from-orange-600 to-red-500" },
  { name: "MessageCircle", component: MessageCircle, color: "from-sky-500 to-blue-500" },
  { name: "Globe", component: Globe, color: "from-emerald-500 to-teal-500" },
  { name: "Lightbulb", component: Lightbulb, color: "from-yellow-500 to-orange-500" },
  { name: "Users", component: Users, color: "from-violet-500 to-purple-500" },
  { name: "Dumbbell", component: Dumbbell, color: "from-slate-500 to-gray-600" },
];

export const getIconComponent = (name: string) => {
  const icon = iconOptions.find((i) => i.name === name);
  return icon?.component || Briefcase;
};

export const getIconColor = (name: string) => {
  const icon = iconOptions.find((i) => i.name === name);
  return icon?.color || "from-gray-500 to-gray-600";
};

export const iconColorMap: Record<string, string> = {
  interview: "from-blue-500 to-cyan-500",
  travel: "from-green-500 to-emerald-500",
  classroom: "from-purple-500 to-violet-500",
  daily: "from-orange-500 to-amber-500",
};
