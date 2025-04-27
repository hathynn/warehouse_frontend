import React from "react";
import { Card, Table } from "antd";

interface TableSectionProps {
  title: string;
  columns: any[];
  data: any[];
  rowKey: string | ((record: any, index: number) => string | number);
  loading?: boolean;
  alertNode?: React.ReactNode;
  pagination?: any;
  emptyText?: React.ReactNode;
}

const TableSection: React.FC<TableSectionProps> = ({
  title,
  columns,
  data,
  rowKey,
  loading = false,
  alertNode,
  pagination,
  emptyText
}) => {
  return (
    <Card title={title}>
      {alertNode}
      {data.length > 0 ? (
        <Table
          columns={columns}
          dataSource={data}
          rowKey={rowKey}
          loading={loading}
          pagination={pagination}
          className="custom-table"
        />
      ) : (
        <div className="text-center py-10 text-gray-500">
          {emptyText || "Không có dữ liệu"}
        </div>
      )}
    </Card>
  );
};

export default TableSection; 