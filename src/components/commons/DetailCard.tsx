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
  column?: number | { xs: number; sm: number; md: number; lg: number; xl: number; xxl: number };
}

const DetailCard: React.FC<DetailCardProps> = ({ 
  title, 
  items, 
  children, 
  bordered = true,
  column 
}) => {
  
  // Default responsive column settings if not provided
  const defaultColumn = {
    md: 2,  // ≥768px
    lg: 2,  // ≥992px
    xl: 3,  // ≥1200px
    xxl: 3, // ≥1600px
  };
  
  return (
    <Card 
      className="mb-6" 
      style={{ 
        overflowX: 'auto' 
      }}
    >
      <Descriptions 
        title={title} 
        className="[&_.ant-descriptions-view]:!border-gray-200 [&_.ant-descriptions-view_table]:!border-gray-200 [&_.ant-descriptions-view_table_th]:!border-gray-200 [&_.ant-descriptions-view_table_td]:!border-gray-200 [&_.ant-descriptions-row]:!border-gray-200"
        bordered={bordered}
        column={column || defaultColumn}
        layout={'horizontal'}
        style={{ 
          width: '100%',
        }}
      >
        {items.map((item, idx) => (
          <Descriptions.Item 
            key={idx} 
            label={item.label} 
            labelStyle={{ fontWeight: "bold" }}
            span={item.span || 1}
          >
            {item.value}
          </Descriptions.Item>
        ))}
      </Descriptions>
      {children}
    </Card>
  );
};

export default DetailCard; 