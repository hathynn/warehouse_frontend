import React, { useEffect, useState } from "react";
import { Input, Alert, TablePaginationConfig, Card, Table, Button, Modal } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { usePaginationViewTracker } from "@/hooks/usePaginationViewTracker";
import { MdOutlineDeleteForever } from "react-icons/md";

export interface ImportOrderDetailRow {
  itemId: string;
  itemName: string;
  expectQuantity: number;
  orderedQuantity: number;
  plannedQuantity: number;
  actualQuantity: number;
  measurementValue: number;
  inventoryItemId: string;
  importRequestProviderId: number;
  measurementUnit?: string;
  unitType?: string;
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
  setIsAllPagesViewed?: (value: boolean) => void;
  importType?: string;
}

const EditableImportOrderTableSection: React.FC<EditableImportOrderTableSectionProps> = ({
  data,
  onChange,
  loading,
  title,
  emptyText,
  setIsAllPagesViewed,
  importType,
}) => {

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: data.length,
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<ImportOrderDetailRow | null>(null);

  const { allPagesViewed } = usePaginationViewTracker(
    data.length,
    pagination.pageSize,
    pagination.current
  );

  useEffect(() => {
    if (allPagesViewed) {
      setIsAllPagesViewed?.(true);
    } else {
      setIsAllPagesViewed?.(false);
    }
  }, [allPagesViewed, setIsAllPagesViewed]);

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination({
      ...pagination,
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10,
    });
  };


  const handlePlannedQuantityChange = (value: number | null, record: ImportOrderDetailRow) => {
    const newData = data.map(row =>
      row.itemId === record.itemId ? { ...row, plannedQuantity: value ?? 0 } : row
    );
    onChange(newData);
  };

  const handlePlannedMeasurementValueChange = (value: number | null, record: ImportOrderDetailRow) => {
    const newData = data.map(row =>
      row.itemId === record.itemId ? { ...row, plannedMeasurementValue: value ?? 0 } : row
    );
    onChange(newData);
  };

  const handleDeleteRow = (record: ImportOrderDetailRow) => {
    setRecordToDelete(record);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (recordToDelete) {
      const newData = data.filter(row => row.itemId !== recordToDelete.itemId);
      onChange(newData);

      // Update pagination total
      setPagination(prev => ({
        ...prev,
        total: newData.length,
        // If current page becomes empty after deletion, go to previous page
        current: Math.ceil(newData.length / prev.pageSize) < prev.current
          ? Math.max(1, prev.current - 1)
          : prev.current
      }));
    }
    setIsDeleteModalOpen(false);
    setRecordToDelete(null);
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setRecordToDelete(null);
  };

  const getColumns = () => {
    const baseColumns: any[] = [
    ];

    if (importType === "RETURN") {
      // For RETURN type, show simplified columns
      baseColumns.push(
        {
          width: "35%",
          title: "Mã sản phẩm tồn kho",
          key: "inventoryItemId",
          align: "left" as const,
          onHeaderCell: () => ({
            style: { textAlign: 'center' as const }
          }),
          render: (_, record: ImportOrderDetailRow) => {
            // This would need item service to get inventory item IDs
            return `#${record.inventoryItemId}`; // Placeholder - you'll need proper inventory item ID mapping
          },
        },
        {
          width: "28%",
          title: "Tên sản phẩm",
          dataIndex: "itemName",
          key: "itemName",
          onHeaderCell: () => ({
            style: { textAlign: 'center' as const }
          }),
        },
        {
          title: "Giá trị đo lường",
          dataIndex: "measurementValue",
          key: "measurementValue",
          align: "right" as const,
          onHeaderCell: () => ({
            style: { textAlign: 'center' as const }
          }),
          render: (value: number, record: ImportOrderDetailRow) => {
            return (
              <div style={{ textAlign: "right" }}>
                <span style={{ fontWeight: "600", fontSize: "16px" }}>{value || 0}</span> {record?.measurementUnit || '-'}
              </div>
            );
          },
        },
        {
          title: "Số lượng cần nhập",
          key: "quantity",
          align: "center" as const,
          onHeaderCell: () => ({
            style: { textAlign: 'center' as const }
          }),
          render: (_, record: ImportOrderDetailRow) => {
            return (
              <div>
                <span style={{ fontWeight: "600", fontSize: "16px" }}>1</span>{" "}
                <span>{record?.unitType || '-'}</span>
              </div>
            );
          },
        }
      );
    } else {
      // For ORDER type, show quantities
      baseColumns.push(
        {
          width: "12%",
          title: "Mã hàng",
          dataIndex: "itemId",
          key: "itemId",
          render: (id: string) => `#${id}`,
          align: "left" as const,
          onHeaderCell: () => ({
            style: { textAlign: 'center' as const }
          }),
        },
        {
          width: "28%",
          title: "Tên hàng",
          dataIndex: "itemName",
          key: "itemName",
          onHeaderCell: () => ({
            style: { textAlign: 'center' as const }
          }),
        },
        {
          title: "Dự nhập theo phiếu",
          dataIndex: "expectQuantity",
          key: "expectQuantity",
          align: "right" as const,
          onHeaderCell: () => ({
            style: { textAlign: 'center' as const }
          }),
        },
        {
          title: "Đã lên đơn",
          dataIndex: "orderedQuantity",
          key: "orderedQuantity",
          align: "right" as const,
          onHeaderCell: () => ({
            style: { textAlign: 'center' as const }
          }),
        },
        {
          title: "Thực tế đã nhập",
          dataIndex: "actualQuantity",
          key: "actualQuantity",
          align: "right" as const,
          onHeaderCell: () => ({
            style: { textAlign: 'center' as const }
          }),
        },
        {
          title: "Dự nhập đơn này",
          dataIndex: "plannedQuantity",
          key: "plannedQuantity",
          align: "right" as const,
          onHeaderCell: () => ({
            style: { textAlign: 'center' as const }
          }),
          render: (_: any, record: ImportOrderDetailRow) => {
            let maxAllowed = 0;
            if (record.actualQuantity === 0) {
              maxAllowed = record.expectQuantity - record.orderedQuantity;
            }
            else {
              maxAllowed = record.expectQuantity - record.actualQuantity;
            }
            const isInvalid = record.plannedQuantity > maxAllowed;
            return (
              <Input
                inputMode="numeric"
                pattern="[0-9]*"
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
        }
      );
    }

    // Add action column
    baseColumns.push({
      title: "Hành động",
      key: "action",
      width: "10%",
      align: "center" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (_: any, record: ImportOrderDetailRow) => (
        <Button
          type="text"
          danger
          icon={<MdOutlineDeleteForever size={20} />}
          onClick={() => handleDeleteRow(record)}
          title="Xóa dòng"
        />
      ),
    });

    return baseColumns;
  };

  // Tổng hợp lỗi
  const invalidRows = data
    .map((row, idx) => {
      let maxAllowed = 0;
      if (row.actualQuantity === 0) {
        maxAllowed = row.expectQuantity - row.orderedQuantity;
      }
      else {
        maxAllowed = row.expectQuantity - row.actualQuantity;
      }
      if (row.plannedQuantity > maxAllowed) {
        return `Dòng ${idx + 1}: Số lượng nhập vượt quá cho phép (tối đa ${maxAllowed})`;
      }

      if (row.plannedQuantity <= 0) {
        return `Dòng ${idx + 1}: Số lượng nhập đang bằng 0. Vui lòng nhập số lượng lớn hơn 0 hoặc xóa dòng này.`;
      }

      return null;
    })
    .filter(Boolean);

  const validationAlertNode = invalidRows.length > 0 ? (
    <Alert
      type="error"
      showIcon
      message="Có vấn đề trong bảng nhập liệu:"
      description={
        <ul>
          {invalidRows.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ul>
      }
      style={{ marginBottom: 16 }}
    />
  ) : null;

  return (
    <Card title={title!}>
      {validationAlertNode}
      <Table
        columns={getColumns()}
        dataSource={data}
        rowKey="itemId"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20', '50'],
          locale: {
            items_per_page: "/ trang"
          },
          showTotal: (total: number) => `Tổng ${total} mục`,
          hideOnSinglePage: true,
        }}
        locale={{ emptyText: emptyText || "Không có dữ liệu" }}
        onChange={handleTableChange}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            Xác nhận xóa
          </div>
        }
        open={isDeleteModalOpen}
        onOk={confirmDelete}
        onCancel={cancelDelete}
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
        width={320}
      >
        {recordToDelete && (
          <div>
            <p><strong>Mã hàng:</strong> #{recordToDelete.itemId}</p>
            <p><strong>Tên hàng:</strong> {recordToDelete.itemName}</p>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default EditableImportOrderTableSection;
