import { Tooltip } from "antd";

interface LegendItemProps {
  color: string;
  borderColor: string;
  title: string;
  description: string;
  isSelected?: boolean;
  onClick?: () => void;
  clickable?: boolean;
}

export const LegendItem = ({ 
  color, 
  borderColor, 
  title, 
  description, 
  isSelected = false, 
  onClick, 
  clickable = false 
}: LegendItemProps) => (
  <Tooltip title={description} placement="top">
    <div 
      className={`flex items-center gap-2 transition-all duration-200 ${
        clickable ? 'cursor-pointer hover:scale-105' : 'cursor-help'
      }`}
      onClick={clickable ? onClick : undefined}
    >
      <div 
        className={`rounded-full border-2 transition-all duration-200 ${
          isSelected ? 'w-6 h-6' : 'w-5 h-5'
        }`} 
        style={{ 
          backgroundColor: isSelected ? borderColor : color, 
          borderColor: borderColor 
        }} 
      />
      <span className={`text-sm transition-all duration-200 ${
        isSelected ? 'font-semibold' : ''
      }`}>
        {title}
      </span>
    </div>
  </Tooltip>
);