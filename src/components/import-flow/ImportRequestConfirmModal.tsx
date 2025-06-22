import React, { useEffect, useState } from "react";
import { Modal, Typography, Descriptions, Table, Checkbox, TablePaginationConfig } from "antd";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import { usePaginationViewTracker } from "../../hooks/usePaginationViewTracker";
import { ImportRequestDetailRow } from "@/utils/interfaces";
import { calculateRowSpanForItemHaveSameCompareValue } from "@/utils/helpers";
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

  // Sort details on each render
  const sortedDetails = [...details].sort((a, b) => a.providerId - b.providerId);
  
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

  // Get current page data - Không cần calculateRowSpanForCurrentPage nữa!
  const startIndex = (pagination.current - 1) * pagination.pageSize;
  const endIndex = startIndex + pagination.pageSize;
  const currentPageData = sortedDetails.slice(startIndex, endIndex);

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
      title: "Đơn vị", 
      dataIndex: "unitType", 
      key: "unitType", 
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }), 
    },
    {
      title: "Quy cách",
      dataIndex: "unitType",
      key: "unitType",
      align: "center" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (_: any, record: ImportRequestDetailRow) => {
        console.log(record)
        return record.measurementValue + " " + record.measurementUnit + " / " + record.unitType
      }
    },
    { 
      title: "Nhà cung cấp", 
      dataIndex: "providerId", 
      key: "providerId", 
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      // ✅ Sử dụng onCell pattern
      onCell: (record: any, index?: number) => {
        const rowSpan = calculateRowSpanForItemHaveSameCompareValue(currentPageData, 'providerName', index || 0);
        return {
          rowSpan: rowSpan
        };
      },
      // ✅ Sử dụng render pattern
      render: (_: any, record: any, index?: number) => {
        const rowSpan = calculateRowSpanForItemHaveSameCompareValue(currentPageData, 'providerName', index || 0);
        
        // Chỉ hiển thị nội dung cho cell đầu tiên của nhóm
        if (rowSpan === 0) {
          return null;
        }
        
        return providers[record.providerId] || "-";
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
            hideOnSinglePage: true,
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
