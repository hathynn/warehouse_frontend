import React, { useEffect, useState } from "react";
import { Modal, Typography, Descriptions, Table, Checkbox } from "antd";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import { ImportRequestDetailRow } from "@/utils/interfaces";
import { calculateRowSpanForItemHaveSameCompareValue } from "@/utils/helpers";
import dayjs from "dayjs";
import { useScrollViewTracker } from "@/hooks/useScrollViewTracker";

interface ImportRequestOrderConfirmModalProps {
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

// Interface for the summary data
interface ProviderSummary {
  providerId: number;
  providerName: string;
  itemCount: number;
}

const ImportRequestOrderConfirmModal: React.FC<ImportRequestOrderConfirmModalProps> = ({
  open,
  onOk,
  onCancel,
  confirmLoading,
  formData,
  details,
  providers,
}) => {
  const [confirmCreateImportRequestChecked, setConfirmCreateImportRequestChecked] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // ===== OLD PAGINATION TRACKER CODE (COMMENTED) =====
  // const [pagination, setPagination] = useState({
  //   current: 1,
  //   pageSize: 10,
  //   total: details.length,
  // });

  // // Sort details on each render
  // const sortedDetails = [...details].sort((a, b) => a.providerId - b.providerId);

  // // Use the custom hook for page confirmation gating
  // const { allPagesViewed, markPageAsViewed, resetViewedPages } = usePaginationViewTracker(
  //   sortedDetails.length,
  //   pagination.pageSize,
  //   pagination.current
  // );

  // // Reset pagination và view tracker khi details thay đổi
  // useEffect(() => {
  //   setPagination({
  //     current: 1,
  //     pageSize: 10,
  //     total: sortedDetails.length,
  //   });
  //   resetViewedPages(1);
  // }, [sortedDetails.length, resetViewedPages]);

  // useEffect(() => {
  //   if (!open) {
  //     setPagination({
  //       current: 1,
  //       pageSize: 10,
  //       total: sortedDetails.length,
  //     });
  //     setConfirmCreateImportRequestChecked(false);
  //     resetViewedPages(1);
  //   }
  // }, [open, sortedDetails.length, resetViewedPages]);

  // const handleTableChange = (newPagination: TablePaginationConfig) => {
  //   setPagination({
  //     ...pagination,
  //     current: newPagination.current || 1,
  //     pageSize: newPagination.pageSize || 10,
  //   });

  //   // Mark this page as viewed
  //   if (newPagination.current) {
  //     markPageAsViewed(newPagination.current);
  //   }
  // };

  // // Get current page data - Không cần calculateRowSpanForCurrentPage nữa!
  // const startIndex = (pagination.current - 1) * pagination.pageSize;
  // const endIndex = startIndex + pagination.pageSize;
  // const currentPageData = sortedDetails.slice(startIndex, endIndex);
  // ===== END OLD PAGINATION TRACKER CODE =====

  // ===== NEW SCROLL TRACKER CODE =====
  const { scrollContainerRef, checkScrollPosition, hasScrolledToBottom, resetScrollTracking } = useScrollViewTracker(5);

  // Sort details on each render
  const sortedDetails = [...details].sort((a, b) => a.providerId - b.providerId);

  useEffect(() => {
    if (!open) {
      resetScrollTracking();
      setConfirmCreateImportRequestChecked(false);
      setShowSummaryModal(false);
    }
  }, [open, resetScrollTracking]);

  useEffect(() => {
    if (open && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      if (container.scrollHeight <= container.clientHeight) {
        setTimeout(() => checkScrollPosition(), 100);
      }
    }
  }, [open, details, checkScrollPosition]);

  // Function to group data by provider
  const getProviderSummary = (): ProviderSummary[] => {
    const providerMap = new Map<number, number>();
    
    sortedDetails.forEach(detail => {
      const currentCount = providerMap.get(detail.providerId) || 0;
      providerMap.set(detail.providerId, currentCount + 1);
    });

    return Array.from(providerMap.entries()).map(([providerId, itemCount]) => ({
      providerId,
      providerName: providers[providerId] || "Không xác định",
      itemCount
    }));
  };

  const handleConfirmClick = () => {
    setShowSummaryModal(true);
  };

  const handleCreateRequests = () => {
    setShowSummaryModal(false);
    onOk();
  };

  const handleCancelSummary = () => {
    setShowSummaryModal(false);
  };

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
        const rowSpan = calculateRowSpanForItemHaveSameCompareValue(sortedDetails, 'providerName', index || 0);
        return {
          rowSpan: rowSpan
        };
      },
      // ✅ Sử dụng render pattern
      render: (_: any, record: any, index?: number) => {
        const rowSpan = calculateRowSpanForItemHaveSameCompareValue(sortedDetails, 'providerName', index || 0);

        // Chỉ hiển thị nội dung cho cell đầu tiên của nhóm
        if (rowSpan === 0) {
          return null;
        }

        return providers[record.providerId] || "-";
      }
    },
  ];

  // Columns for summary table
  const summaryColumns = [
    {
      title: "Nhà cung cấp",
      dataIndex: "providerName",
      key: "providerName",
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    {
      title: "Số lượng mặt hàng",
      dataIndex: "itemCount",
      key: "itemCount",
      align: "center" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (count: number) => `${count} mặt hàng`
    },
  ];

  const providerSummaryData = getProviderSummary();

  return (
    <>
      <Modal
        title={<Typography.Title level={4}>Xác nhận thông tin phiếu nhập</Typography.Title>}
        open={open}
        onOk={handleConfirmClick}
        onCancel={onCancel}
        okText="Xác nhận"
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
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollPosition}
          style={{ height: "540px", overflowY: "auto" }}
        >
          <Table
            columns={columns}
            dataSource={sortedDetails}
            rowKey={(record, index) => `${record.itemId}-${record.providerId}-${index}`}
            pagination={false}
            size="small"
            bordered
            className="[&_.ant-table-cell]:!border-gray-400 [&_.ant-table-thead>tr>th]:!border-gray-400 [&_.ant-table-tbody>tr>td]:!border-gray-400 [&_.ant-table-container]:!border-gray-400"
          />
        </div>
        <Checkbox
          checked={confirmCreateImportRequestChecked}
          onChange={(e: CheckboxChangeEvent) => setConfirmCreateImportRequestChecked(e.target.checked)}
          style={{ marginTop: 8, fontSize: 14, fontWeight: "bold" }}
          disabled={!hasScrolledToBottom}
        >
          Tôi xác nhận thông tin phiếu nhập trên là đúng và đồng ý tạo.
          {!hasScrolledToBottom && <span style={{ color: 'red', marginLeft: 8 }}>(Vui lòng xem hết trang)</span>}
        </Checkbox>
      </Modal>

      {/* Summary Modal */}
      <Modal
        title={<Typography.Title level={4}>Danh sách phiếu nhập sẽ được tạo</Typography.Title>}
        open={showSummaryModal}
        onOk={handleCreateRequests}
        onCancel={handleCancelSummary}
        okText="Tạo những phiếu này"
        cancelText="Quay lại"
        confirmLoading={confirmLoading}
        width={600}
        maskClosable={false}
      >
        <Typography.Text style={{ marginBottom: 12, display: 'block', fontSize: 16 }}>
          Hệ thống sẽ tạo <strong>{providerSummaryData.length}</strong> phiếu nhập tương ứng với <strong>{providerSummaryData.length}</strong> nhà cung cấp:
        </Typography.Text>
        
        <Table
          columns={summaryColumns}
          dataSource={providerSummaryData}
          rowKey="providerId"
          pagination={false}
          size="small"
          bordered
          className="[&_.ant-table-cell]:!border-gray-400 [&_.ant-table-thead>tr>th]:!border-gray-400 [&_.ant-table-tbody>tr>td]:!border-gray-400 [&_.ant-table-container]:!border-gray-400"
        />
      </Modal>
    </>
  );
};

export default ImportRequestOrderConfirmModal;