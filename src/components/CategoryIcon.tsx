import React from "react";
import {
  DrillIcon,
  CameraIcon,
  TentIcon,
  ScooterIcon,
  GamepadIcon,
  CartStrollerIcon,
  GlobeSportIcon,
  BoxIcon,
  IronIcon,
  PawIcon,
  SproutIcon,
  GiftIcon,
  MusicIcon,
  HangerIcon,
} from "./Icons";
import type { CategoryKey } from "../lib/categories";

type IconComponent = (p: { size?: number; className?: string }) => React.ReactElement;

const ICONS: Record<CategoryKey, IconComponent> = {
  repair: DrillIcon,
  home: IronIcon,
  tech: CameraIcon,
  tourism: TentIcon,
  transport: ScooterIcon,
  gaming: GamepadIcon,
  kids: CartStrollerIcon,
  pets: PawIcon,
  garden: SproutIcon,
  sport: GlobeSportIcon,
  events: GiftIcon,
  music: MusicIcon,
  fashion: HangerIcon,
};

interface Props {
  categoryKey: CategoryKey | string;
  size?: number;
  className?: string;
}

export const CategoryIcon = ({ categoryKey, size = 24, className = "" }: Props) => {
  const Icon = ICONS[categoryKey as CategoryKey] ?? BoxIcon;
  return <Icon size={size} className={className} />;
};
