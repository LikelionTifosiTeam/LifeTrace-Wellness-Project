import React from 'react';
import {
  Flame,
  Wine,
  Dumbbell,
  FlaskConical,
  Sun,
  Hand,
  Snowflake,
  BedDouble,
  Beef,
  Droplets,
  Camera,
  CircleDot,
  type LucideIcon,
} from 'lucide-react';

/**
 * 프로토콜 규칙이 아이콘 이름을 문자열로 들고 있어(백엔드에서 그대로 내려올 값),
 * 허용 목록 방식으로만 매핑한다. 미지정 값은 기본 아이콘으로 안전하게 떨어진다.
 */
const iconMap: Record<string, LucideIcon> = {
  Flame,
  Wine,
  Dumbbell,
  FlaskConical,
  Sun,
  Hand,
  Snowflake,
  BedDouble,
  Beef,
  Droplets,
  Camera,
};

export const DynamicIcon: React.FC<{ name: string; className?: string }> = ({
  name,
  className,
}) => {
  const Icon = iconMap[name] ?? CircleDot;
  return <Icon className={className} />;
};
