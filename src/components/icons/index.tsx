import React from 'react';
import Svg, { Circle, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg';
import type { Theme } from '../../theme/types';

interface IconProps {
  color?: string;
  size?: number;
  strokeWidth?: number;
}

const defaultProps = (color?: string, size = 24, strokeWidth = 2) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: color ?? 'currentColor',
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export function AddIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Line x1="12" y1="5" x2="12" y2="19" />
      <Line x1="5" y1="12" x2="19" y2="12" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Polyline points="20 6 9 17 4 12" />
    </Svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Polyline points="3 6 5 6 21 6" />
      <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <Line x1="10" y1="11" x2="10" y2="17" />
      <Line x1="14" y1="11" x2="14" y2="17" />
    </Svg>
  );
}

export function EditIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </Svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Circle cx="12" cy="12" r="3" />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Svg>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Line x1="22" y1="2" x2="11" y2="13" />
      <Polygon points="22 2 15 22 11 13 2 9 22 2" />
    </Svg>
  );
}

export function BoardIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Rect x="3" y="3" width="7" height="7" rx="1" />
      <Rect x="14" y="3" width="7" height="7" rx="1" />
      <Rect x="3" y="14" width="7" height="7" rx="1" />
      <Rect x="14" y="14" width="7" height="7" rx="1" />
    </Svg>
  );
}

export function TodoIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Path d="M9 11l3 3L22 4" />
      <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </Svg>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Circle cx="12" cy="12" r="5" />
      <Line x1="12" y1="1" x2="12" y2="3" />
      <Line x1="12" y1="21" x2="12" y2="23" />
      <Line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <Line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <Line x1="1" y1="12" x2="3" y2="12" />
      <Line x1="21" y1="12" x2="23" y2="12" />
      <Line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <Line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </Svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </Svg>
  );
}

export function KeyIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </Svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Circle cx="12" cy="12" r="10" />
      <Line x1="2" y1="12" x2="22" y2="12" />
      <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </Svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Line x1="18" y1="6" x2="6" y2="18" />
      <Line x1="6" y1="6" x2="18" y2="18" />
    </Svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Circle cx="12" cy="12" r="10" />
      <Polyline points="12 6 12 12 16 14" />
    </Svg>
  );
}

export function PencilIcon(props: IconProps) {
  return <EditIcon {...props} />;
}

export function SparkleIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z" />
    </Svg>
  );
}

export function LogoIcon(props: IconProps) {
  return <SparkleIcon {...props} />;
}

export function MicIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <Line x1="12" y1="19" x2="12" y2="23" />
      <Line x1="8" y1="23" x2="16" y2="23" />
    </Svg>
  );
}

export function AlarmIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Circle cx="12" cy="13" r="8" />
      <Polyline points="12 9 12 13 14 15" />
      <Line x1="5" y1="2" x2="3" y2="4" />
      <Line x1="19" y1="2" x2="21" y2="4" />
    </Svg>
  );
}

export function CheckSquareIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Polyline points="9 11 12 14 22 4" />
      <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </Svg>
  );
}

export function HistoryIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Path d="M3 3v5h5" />
      <Path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
      <Polyline points="12 7 12 12 16 14" />
    </Svg>
  );
}

export function MergeIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Circle cx="6" cy="18" r="3" />
      <Circle cx="18" cy="6" r="3" />
      <Path d="M6 15c0-6 4-9 9-9" />
      <Path d="M15 15c-3 0-6-2-6-6" />
    </Svg>
  );
}

export function SummarizeIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Polyline points="4 6 20 6" />
      <Polyline points="4 10 20 10" />
      <Polyline points="4 14 10 14" />
      <Line x1="16" y1="14" x2="20" y2="14" />
      <Line x1="4" y1="18" x2="14" y2="18" />
    </Svg>
  );
}

export function QuestionIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Circle cx="12" cy="12" r="10" />
      <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <Line x1="12" y1="17" x2="12.01" y2="17" />
    </Svg>
  );
}

export function TimerIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Circle cx="12" cy="13" r="8" />
      <Polyline points="12 9 12 13 14.5 15.5" />
      <Line x1="9" y1="2" x2="15" y2="2" />
      <Line x1="12" y1="2" x2="12" y2="5" />
    </Svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Polygon points="6 3 20 12 6 21 6 3" />
    </Svg>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Line x1="9" y1="4" x2="9" y2="20" />
      <Line x1="15" y1="4" x2="15" y2="20" />
    </Svg>
  );
}

export function StopIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Rect x="5" y="5" width="14" height="14" rx="2" />
    </Svg>
  );
}

export function ResetIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <Path d="M3 3v5h5" />
    </Svg>
  );
}

export function FlagIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Line x1="5" y1="3" x2="5" y2="21" />
      <Path d="M5 6c4-2.5 8-2.5 12 0v8c-4-2.5-8-2.5-12 0" />
    </Svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Polyline points="6 9 12 15 18 9" />
    </Svg>
  );
}

export function FolderIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </Svg>
  );
}

export function LayersIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Polygon points="12 2 2 7 12 12 22 7 12 2" />
      <Polyline points="2 17 12 22 22 17" />
      <Polyline points="2 12 12 17 22 12" />
    </Svg>
  );
}

export function PlusCircleIcon(props: IconProps) {
  return (
    <Svg {...defaultProps(props.color, props.size, props.strokeWidth)}>
      <Circle cx="12" cy="12" r="10" />
      <Line x1="12" y1="8" x2="12" y2="16" />
      <Line x1="8" y1="12" x2="16" y2="12" />
    </Svg>
  );
}

export function getTabIcon(type: 'board' | 'todo' | 'chat' | 'settings' | 'alarms' | 'timer', color: string, size = 22) {
  switch (type) {
    case 'board':
      return <BoardIcon color={color} size={size} />;
    case 'todo':
      return <TodoIcon color={color} size={size} />;
    case 'chat':
      return <ChatIcon color={color} size={size} />;
    case 'alarms':
      return <AlarmIcon color={color} size={size} />;
    case 'timer':
      return <TimerIcon color={color} size={size} />;
    case 'settings':
      return <SettingsIcon color={color} size={size} />;
  }
}

export type { Theme };