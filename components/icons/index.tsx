import React from 'react';
import Svg, { Path, Rect, Circle, Line, Polyline, Polygon } from 'react-native-svg';

interface IconProps { size?: number; color?: string; }

export function GridIcon({ size = 20, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" fill="none" />
      <Rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" fill="none" />
      <Rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="2" fill="none" />
      <Rect x="14" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="2" fill="none" />
    </Svg>
  );
}

export function ListIcon({ size = 20, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="8" y1="6" x2="21" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="12" x2="21" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="18" x2="21" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="3" cy="6" r="1" fill={color} />
      <Circle cx="3" cy="12" r="1" fill={color} />
      <Circle cx="3" cy="18" r="1" fill={color} />
    </Svg>
  );
}

export function CalIcon({ size = 20, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" fill="none" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export function ChartIcon({ size = 20, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="18" y1="20" x2="18" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="20" x2="12" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="6" y1="20" x2="6" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="2" y1="20" x2="22" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function BudgetIcon({ size = 20, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke={color} strokeWidth="2" fill="none" />
      <Path d="M12 6v6l4 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function GoalIcon({ size = 20, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" />
      <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth="2" fill="none" />
      <Circle cx="12" cy="12" r="2" fill={color} />
    </Svg>
  );
}

export function NetWorthIcon({ size = 20, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 3h7v7H3z" stroke={color} strokeWidth="2" fill="none" />
      <Path d="M14 3h7v7h-7z" stroke={color} strokeWidth="2" fill="none" />
      <Path d="M14 14h7v7h-7z" stroke={color} strokeWidth="2" fill="none" />
      <Path d="M3 17.5h7M6.5 14v7" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function RecurIcon({ size = 20, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 1l4 4-4 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M3 11V9a4 4 0 0 1 4-4h14" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
      <Path d="M7 23l-4-4 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M21 13v2a4 4 0 0 1-4 4H3" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
    </Svg>
  );
}

export function MoreIcon({ size = 20, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="5" r="1.5" fill={color} />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
      <Circle cx="12" cy="19" r="1.5" fill={color} />
    </Svg>
  );
}

export function PlusIcon({ size = 20, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function LogoutIcon({ size = 20, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
      <Polyline points="16 17 21 12 16 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Line x1="21" y1="12" x2="9" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronLeftIcon({ size = 20, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 20, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export function TrashIcon({ size = 20, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="3 6 5 6 21 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
      <Path d="M10 11v6M14 11v6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
    </Svg>
  );
}

export function EditIcon({ size = 20, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export function UserIcon({ size = 20, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" fill="none" />
      <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
    </Svg>
  );
}
