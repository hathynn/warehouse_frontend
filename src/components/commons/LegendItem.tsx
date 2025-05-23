import { Tooltip } from "antd";

export const LegendItem = ({ color, borderColor, title, description }: { color: string; borderColor: string; title: string; description: string }) => (
    <Tooltip title={description} placement="top">
      <div className="flex items-center gap-2 cursor-help">
        <div className="w-5 h-5 rounded-3xl border-1" style={{ backgroundColor: color, borderColor: borderColor }} />
        <span className="text-sm">{title}</span>
      </div>
    </Tooltip>
  );