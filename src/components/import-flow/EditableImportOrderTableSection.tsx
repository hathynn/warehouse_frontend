import React from "react";
import { Select, InputNumber, Input, Alert } from "antd";
import TableSection from "@/components/commons/TableSection";

export interface ImportOrderDetailRow {
  itemId: number;
  itemName: string;
  expectQuantity: number;
  orderedQuantity: number;
  plannedQuantity: number;
  importRequestProviderId: number;
  importOrderProviderId: number;
}

export interface ProviderOption {
  id: number;
  name: string;
}

interface EditableImportOrderTableSectionProps {
  data: ImportOrderDetailRow[];
  onChange: (rows: ImportOrderDetailRow[]) => void;
  loading?: boolean;
  title?: string;
  emptyText?: string;
  alertNode?: React.ReactNode;
  excelImported?: boolean;
}

const EditableImportOrderTableSection: React.FC<EditableImportOrderTableSectionProps> = ({
  data,
  onChange,
  loading,
  title,
  emptyText,
}) => {


  const handlePlannedQuantityChange = (value: number | null, record: ImportOrderDetailRow) => {
    const newData = data.map(row =>
      row.itemId === record.itemId ? { ...row, plannedQuantity: value ?? 0 } : row
    );
    onChange(newData);
  };

  const columns = [
    {
      title: "Mã hàng",
      dataIndex: "itemId",
      key: "itemId",
      width: "8%",
      render: (id: number) => `#${id}`,
      align: "right" as const,
    },
    {
      title: "Tên hàng",
      dataIndex: "itemName",
      key: "itemName",
      width: "30%",
    },

    {
      title: "Tổng dự nhập",
      dataIndex: "expectQuantity",
      key: "expectQuantity",
      align: "right" as const,
    },
    {
      title: "Tổng đã lên đơn",
      dataIndex: "orderedQuantity",
      key: "orderedQuantity",
      align: "right" as const,
    },
    {
      title: "Dự nhập đơn này",
      dataIndex: "plannedQuantity",
      key: "plannedQuantity",
      align: "right" as const,
      render: (_: any, record: ImportOrderDetailRow) => {
        const maxAllowed = record.expectQuantity - record.orderedQuantity;
        const isInvalid = record.plannedQuantity > maxAllowed;
        return (
          <Input
            inputMode="numeric"
            pattern="[0-9]*"
            min={1}
            max={maxAllowed}
            value={record.plannedQuantity}
            onChange={e => {
              const val = e.target.value.replace(/\D/g, '');
              handlePlannedQuantityChange(val ? Number(val) : 0, record);
            }}
            style={{ textAlign: 'right', width: 100, color: 'blue' }}
            status={isInvalid ? 'error' : undefined}
          />
        );
      },
    },
  ];

  // Tổng hợp lỗi
  const invalidRows = data
    .map((row, idx) => {
      const maxAllowed = row.expectQuantity - row.orderedQuantity;
      if (row.plannedQuantity > maxAllowed) {
        return `Dòng ${idx + 1}: Số lượng nhập vượt quá cho phép (tối đa ${maxAllowed})`;
      }

      if (row.plannedQuantity < 0) {
        return `Dòng ${idx + 1}: Số lượng nhập phải lớn hơn hoặc bằng 0`;
      }
      return null;
    })
    .filter(Boolean);

  const validationAlertNode = invalidRows.length > 0 ? (
    <Alert
      type="error"
      showIcon
      message="Có lỗi trong bảng nhập liệu:"
      description={
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {invalidRows.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ul>
      }
      style={{ marginBottom: 16 }}
    />
  ) : null;

  return (
    <TableSection
      title={title!}
      columns={columns}
      data={data}
      rowKey="itemId"
      loading={loading}
      alertNode={validationAlertNode}
      emptyText={emptyText}
    />
  );
};

export default EditableImportOrderTableSection;
