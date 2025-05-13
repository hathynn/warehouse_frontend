import React from "react";
import { Card, Descriptions } from "antd";

export interface DetailInfoItem {
  label: React.ReactNode;
  value: React.ReactNode;
  span?: number;
}

interface DetailCardProps {
  title: string;
  items: DetailInfoItem[];
  children?: React.ReactNode;
  bordered?: boolean;
}

const DetailCard: React.FC<DetailCardProps> = ({ title, items, children, bordered = true }) => {
  return (
    <Card className="mb-6">
      <Descriptions title={title} bordered={bordered}>
        {items.map((item, idx) => (
          <Descriptions.Item key={idx} label={item.label} span={item.span || 1}>
            {item.value}
          </Descriptions.Item>
        ))}
      </Descriptions>
      {children}
    </Card>
  );
};

export default DetailCard; 