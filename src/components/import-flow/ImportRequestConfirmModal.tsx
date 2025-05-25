import React, { useEffect, useState, useMemo } from "react";
import { Modal, Typography, Descriptions, Table, Checkbox, TablePaginationConfig, notification } from "antd";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import { usePaginationViewTracker } from "../../hooks/usePaginationViewTracker";
import { ImportRequestDetailRow } from "@/utils/interfaces";
import dayjs from "dayjs";

interface ImportRequestConfirmModalProps {
  open: boolean;
  onOk: () => void;
  onCancel: () => void;
  confirmLoading?: boolean;
  formData: {
    importReason: string;
    importType: string;
    startDate: string;
    endDate: string;
  };
  details: ImportRequestDetailRow[];
  providers: Record<number, string>;
}

// Helper function để tính rowSpan cho data hiện tại trên trang
function calculateRowSpanForCurrentPage(data: any[]) {
  if (!data || data.length === 0) return [];
  
  // Tính rowSpan cho từng providerId trong trang hiện tại
  const result = [];
  let i = 0;
  
  while (i < data.length) {
    const currentProviderId = data[i].providerId;
    let count = 0;
    
    // Đếm số dòng liên tiếp có cùng providerId
    for (let j = i; j < data.length && data[j].providerId === currentProviderId; j++) {
      count++;
    }
    
    // Gán rowSpan cho dòng đầu tiên của nhóm, các dòng khác có rowSpan = 0
    for (let k = 0; k < count; k++) {
      result.push({
        ...data[i + k],
        rowSpan: k === 0 ? count : 0,
      });
    }
    
    i += count;
  }
  return result;
}

const ImportRequestConfirmModal: React.FC<ImportRequestConfirmModalProps> = ({
  open,
  onOk,
  onCancel,
  confirmLoading,
  formData,
  details,
  providers,
}) => {
  const [confirmCreateImportRequestChecked, setConfirmCreateImportRequestChecked] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: details.length,
  });

  // Memoize sorted details để tránh re-sort không cần thiết
  const sortedDetails = useMemo(() => {
    return [...details].sort((a, b) => a.providerId - b.providerId);
  }, [details]);
  
  // Use the custom hook for page confirmation gating
  const { allPagesViewed, markPageAsViewed, resetViewedPages } = usePaginationViewTracker(
    sortedDetails.length,
    pagination.pageSize,
    pagination.current
  );

  // Reset pagination và view tracker khi details thay đổi
  useEffect(() => {
    setPagination({
      current: 1,
      pageSize: 10,
      total: sortedDetails.length,
    });
    resetViewedPages(1);
  }, [sortedDetails.length, resetViewedPages]);

  useEffect(() => {
    if (!open) {
      setPagination({
        current: 1,
        pageSize: 10,
        total: sortedDetails.length,
      });
      setConfirmCreateImportRequestChecked(false);
      resetViewedPages(1);
    }
  }, [open, sortedDetails.length, resetViewedPages]);

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination({
      ...pagination,
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10,
    });
    
    // Mark this page as viewed
    if (newPagination.current) {
      markPageAsViewed(newPagination.current);
    }
  };

  // Tính toán data cho trang hiện tại và rowSpan
  const currentPageData = useMemo(() => {
    // Lấy data cho trang hiện tại
    const startIndex = (pagination.current - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    const currentPageData = sortedDetails.slice(startIndex, endIndex);
    
    // Tính rowSpan cho data trong trang hiện tại (data đã được sắp xếp)
    return calculateRowSpanForCurrentPage(currentPageData);
  }, [sortedDetails, pagination.current, pagination.pageSize]);

  const columns = [
    { 
      title: "Tên hàng hóa", 
      dataIndex: "itemName", 
      key: "itemName",
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    { 
      title: "Số lượng", 
      dataIndex: "quantity", 
      key: "quantity", 
      align: "right" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }), 
    },
    { 
      title: "Giá trị đo lường", 
      dataIndex: "totalMeasurementValue", 
      key: "totalMeasurementValue", 
      align: "right" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }), 
    },
    { 
      title: "Đơn vị tính", 
      dataIndex: "measurementUnit", 
      key: "measurementUnit", 
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }), 
    },
    { 
      title: "Nhà cung cấp", 
      dataIndex: "providerId", 
      key: "providerId", 
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }), 
      render: (_: any, record: any) => {
        if (record.rowSpan > 0) {
          return {
            children: providers[record.providerId] || "-",
            props: { rowSpan: record.rowSpan }
          };
        }
        return {
          children: null,
          props: { rowSpan: 0 }
        };
      }
    },
  ];

  return (
    <Modal
      title={<Typography.Title level={4}>Xác nhận thông tin phiếu nhập</Typography.Title>}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText="Xác nhận tạo phiếu"
      cancelText="Hủy"
      confirmLoading={confirmLoading}
      width={960}
      maskClosable={false}
      okButtonProps={{ disabled: !confirmCreateImportRequestChecked, danger: false }}
    >
        <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }} labelStyle={{ width: "20%", fontWeight: "bold" }} className="[&_.ant-descriptions-view]:!border-gray-400 [&_.ant-descriptions-view_table]:!border-gray-400 [&_.ant-descriptions-view_table_th]:!border-gray-400 [&_.ant-descriptions-view_table_td]:!border-gray-400 [&_.ant-descriptions-row]:!border-gray-400">
          <Descriptions.Item label="Lý do nhập" span={2}>
            <div className="max-h-[48px] overflow-y-auto leading-[24px]">
              {formData.importReason}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="Loại nhập" span={2}>
            {formData.importType === "ORDER" ? "Nhập theo đơn" : "Nhập trả hàng"}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày có hiệu lực">
            {formData.startDate ? dayjs(formData.startDate).format("DD-MM-YYYY") : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày hết hạn">
            {formData.endDate ? dayjs(formData.endDate).format("DD-MM-YYYY") : "-"}
          </Descriptions.Item>
        </Descriptions>
        <Typography.Title level={5} style={{ marginBottom: 12 }}>Danh sách hàng hóa</Typography.Title>
        <Table
          columns={columns}
          dataSource={currentPageData}
          rowKey={(record, index) => `${record.itemId}-${record.providerId}-${index}`}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: sortedDetails.length,
            showTotal: (total) => `Tổng ${total} mục`,
          }}
          onChange={handleTableChange}
          size="small"
          bordered
          className="[&_.ant-table-cell]:!border-gray-400 [&_.ant-table-thead>tr>th]:!border-gray-400 [&_.ant-table-tbody>tr>td]:!border-gray-400 [&_.ant-table-container]:!border-gray-400"
          style={{ height: "540px", overflowY: "auto" }}
        />
        <Checkbox 
          checked={confirmCreateImportRequestChecked} 
          onChange={(e: CheckboxChangeEvent) => setConfirmCreateImportRequestChecked(e.target.checked)} 
          style={{ marginTop: 8, fontSize: 14, fontWeight: "bold"}}
          disabled={!allPagesViewed}
        >
          Tôi xác nhận thông tin phiếu nhập trên là đúng và đồng ý tạo.
          {!allPagesViewed && <span style={{ color: 'red', marginLeft: 8 }}>(Vui lòng xem tất cả các trang)</span>}
        </Checkbox>
    </Modal>
  );
};

export default ImportRequestConfirmModal;
