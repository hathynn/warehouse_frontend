import React, { useEffect, useState } from "react";
import { Table, Input, Card, TablePaginationConfig, Alert, Button, Modal } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { MdOutlineDeleteForever } from "react-icons/md";
import { usePaginationViewTracker } from "@/hooks/usePaginationViewTracker";
import { ItemResponse } from "@/services/useItemService";

interface ReturnImportDetailRow {
  inventoryItemId: string;
  measurementValue: number;
  unitType?: string;
  measurementUnit?: string;
}

interface EditableImportRequestReturnTableProps {
  data: ReturnImportDetailRow[];
  setData: (data: ReturnImportDetailRow[]) => void;
  relatedItemsData: ItemResponse[];
  alertNode?: React.ReactNode;
  emptyText?: React.ReactNode;
  title?: string;
  setIsAllPagesViewed?: (isValid: boolean) => void;
  onValidationChange?: (hasErrors: boolean) => void;
}

const EditableImportRequestReturnTable: React.FC<EditableImportRequestReturnTableProps> = ({
  data,
  setData,
  relatedItemsData,
  alertNode,
  emptyText,
  title = "Danh sách hàng hóa trả từ file Excel",
  setIsAllPagesViewed,
  onValidationChange,
}) => {

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: data.length,
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<ReturnImportDetailRow | null>(null);

  const { allPagesViewed, markPageAsViewed } = usePaginationViewTracker(
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
    markPageAsViewed(newPagination.current || 1);
  };

  const handleCellChange = (value: any, record: ReturnImportDetailRow, field: keyof ReturnImportDetailRow) => {
    setData(
      data.map(row => {
        if (row === record) {
          if (field === 'measurementValue') {
            return {
              ...row,
              measurementValue: value,
            };
          }
          if (field === 'inventoryItemId') {
            return {
              ...row,
              inventoryItemId: value,
            };
          }
        }
        return row;
      })
    );
  };

  const handleDeleteRow = (record: ReturnImportDetailRow) => {
    setRecordToDelete(record);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (recordToDelete) {
      const newData = data.filter(row => row.inventoryItemId !== recordToDelete.inventoryItemId);
      setData(newData);

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

  // Tổng hợp lỗi validation
  const invalidRows = data
    .map((row, idx) => {
      if (!row.inventoryItemId || row.inventoryItemId.trim() === '') {
        return `Dòng ${idx + 1}: Mã sản phẩm tồn kho không được để trống.`;
      }

      if (row.measurementValue <= 0) {
        return `Dòng ${idx + 1}: Giá trị dự kiến phải lớn hơn 0.`;
      }

      const mappedItem = relatedItemsData.find(item => item.inventoryItemIds.includes(row.inventoryItemId));
      if (mappedItem && mappedItem.measurementValue && row.measurementValue > mappedItem.measurementValue) {
        return `Dòng ${idx + 1}: Giá trị vượt quá tối đa cho phép (${mappedItem.measurementValue} ${mappedItem.measurementUnit}).`;
      }

      return null;
    })
    .filter(Boolean);

  useEffect(() => {
    onValidationChange?.(invalidRows.length > 0);
  }, [invalidRows.length, onValidationChange]);
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

  const columns = [
    {
      width: "40%",
      title: <span className="font-semibold">Mã sản phẩm tồn kho</span>,
      dataIndex: "inventoryItemId",
      key: "inventoryItemId",
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    {
      width: "20%",
      title: <span className="font-semibold">Giá trị dự kiến</span>,
      dataIndex: "measurementValue",
      key: "measurementValue",
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (value: number, record: ReturnImportDetailRow) => (
        <Input
          inputMode="numeric"
          pattern="[0-9]*[.,]?[0-9]*"
          value={value}
          onChange={e => {
            const val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
            const numVal = val === '' ? 0 : parseFloat(val);
            if (!isNaN(numVal)) {
              handleCellChange(numVal, record, 'measurementValue');
            }
          }}
          style={{ textAlign: 'right', width: '100%' }}
          onWheel={e => e.currentTarget.blur()}
          placeholder="Nhập giá trị"
        />
      ),
    },
    {
      width: "10%",
      title: <span className="font-semibold">Đơn vị</span>,
      dataIndex: "unitType",
      key: "unitType",
      align: "left" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (value: string, record: ReturnImportDetailRow) => {
        const mappedItem = relatedItemsData.find(item => item.inventoryItemIds.includes(record.inventoryItemId));
        return (
          <div>
            {mappedItem?.measurementUnit || '-'}
          </div>
        );
      },
    },
    {
      width: "20%",
      title: <span className="font-semibold">Tối đa cho phép</span>,
      dataIndex: "unitType",
      key: "unitType",
      align: "center" as const,
      render: (value: string, record: ReturnImportDetailRow) => {
        const mappedItem = relatedItemsData.find(item => item.inventoryItemIds.includes(record.inventoryItemId));
        return (
          <div>
            {mappedItem?.measurementValue || '-'} {mappedItem?.measurementUnit || '-'} / {mappedItem?.unitType || '-'}
          </div>
        );
      },
    },
    {
      width: "10%",
      title: <span className="font-semibold">Hành động</span>,
      key: "action",
      align: "center" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (_, record: ReturnImportDetailRow) => (
        <Button
          type="text"
          danger
          icon={<MdOutlineDeleteForever size={20} />}
          onClick={() => handleDeleteRow(record)}
          title="Xóa dòng"
        />
      ),
    },

  ];

  return (
    <Card title={title}>
      {validationAlertNode}
      {alertNode}
      <Table
        columns={columns}
        dataSource={data}
        rowKey={(record, index) => `${record.inventoryItemId}-${index}`}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total: number) => `Tổng ${total} mục`,
          pageSizeOptions: ['5', '10', '20', '50'],
          locale: {
            items_per_page: "/ trang"
          },
          hideOnSinglePage: true,
        }}
        onChange={handleTableChange}
        locale={{ emptyText: emptyText || "Không có dữ liệu" }}
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
            <p><strong>Mã sản phẩm tồn kho:</strong> #{recordToDelete.inventoryItemId}</p>
            <p><strong>Giá trị:</strong> {recordToDelete.measurementValue}</p>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default EditableImportRequestReturnTable;