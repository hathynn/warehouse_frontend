import React, { useEffect, useState } from "react";
import { Table, Input, Card, TablePaginationConfig, Alert } from "antd";
import { usePaginationViewTracker } from "@/hooks/usePaginationViewTracker";

interface ReturnImportDetailRow {
  inventoryItemId: string;
  measurementValue: number;
}

interface EditableImportRequestReturnTableProps {
  data: ReturnImportDetailRow[];
  setData: (data: ReturnImportDetailRow[]) => void;
  alertNode?: React.ReactNode;
  emptyText?: React.ReactNode;
  title?: string;
  setIsAllPagesViewed?: (isValid: boolean) => void;
}

const EditableImportRequestReturnTable: React.FC<EditableImportRequestReturnTableProps> = ({
  data,
  setData,
  alertNode,
  emptyText,
  title = "Danh sách hàng hóa trả từ file Excel",
  setIsAllPagesViewed,
}) => {

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: data.length,
  });

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

  // Tổng hợp lỗi validation
  const invalidRows = data
    .map((row, idx) => {
      if (row.measurementValue <= 0) {
        return `Dòng ${idx + 1}: Giá trị đang bằng 0. Nếu bạn tiếp tục, mã hàng này sẽ bị loại bỏ.`;
      }
      if (!row.inventoryItemId || row.inventoryItemId.trim() === '') {
        return `Dòng ${idx + 1}: Mã sản phẩm tồn kho không được để trống.`;
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

  const columns = [
    {
      width: "50%",
      title: <span className="font-semibold">Mã sản phẩm tồn kho</span>,
      dataIndex: "inventoryItemId",
      key: "inventoryItemId",
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (value: string, record: ReturnImportDetailRow) => (
        <Input
          value={value}
          onChange={e => handleCellChange(e.target.value, record, 'inventoryItemId')}
          style={{ width: '100%' }}
          placeholder="Nhập mã sản phẩm tồn kho"
        />
      ),
    },
    {
      width: "50%",
      title: <span className="font-semibold">Giá trị cần nhập</span>,
      dataIndex: "measurementValue",
      key: "measurementValue",
      align: "center" as const,
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
          style={{ textAlign: 'center', width: '100%' }}
          onWheel={e => e.currentTarget.blur()}
          placeholder="Nhập giá trị"
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
    </Card>
  );
};

export default EditableImportRequestReturnTable;