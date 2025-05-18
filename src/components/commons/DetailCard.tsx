import React, { useState, useEffect } from "react";
import { Card, Descriptions, theme } from "antd";

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
    lg: 3,  // ≥992px
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
            span={item.span || 1}
            style={{ 
              wordBreak: 'break-word' 
            }}
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