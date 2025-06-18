import React, { useState, useEffect } from "react";
import { Table, TablePaginationConfig, Tag, Space, Drawer, Descriptions, Timeline } from "antd";
import { ClockCircleOutlined, UserOutlined, FileTextOutlined, EyeOutlined } from "@ant-design/icons";
import useTransactionLogService from "@/services/useTransactionLogService";
import { ImportRequestTransactionLog, ImportOrderTransactionLog, TransactionLogResponse } from "@/utils/interfaces";
import { ImportOrderResponse } from "@/services/useImportOrderService";
import { ImportRequestResponse } from "@/services/useImportRequestService";
import dayjs from "dayjs";

// ========== INTERFACES ==========
interface ImportRequestSummary {
  key: string;
  importRequestId: string;
  createdDate: string;
  executorFullName: string;
  importReason?: string;
  importType?: string;
}

interface TransactionDetail {
  id: string;
  type: 'IMPORT_REQUEST' | 'IMPORT_ORDER';
  action: string;
  createdDate: string;
  executorFullName: string;
  // Import Request specific fields
  importRequestId?: string;
  importReason?: string;
  importType?: string;
  // Import Order specific fields
  importOrderId?: string;
  status?: string;
  note?: string;
}

const ImportTransactionHistory: React.FC = () => {
  // ========== DATA STATES ==========
  const [importRequestSummaries, setImportRequestSummaries] = useState<ImportRequestSummary[]>([]);
  const [allTransactionLogs, setAllTransactionLogs] = useState<TransactionLogResponse[]>([]);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // ========== DRAWER STATES ==========
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedImportRequestId, setSelectedImportRequestId] = useState<string | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<TransactionDetail[]>([]);

  // ========== SERVICES ==========
  const { loading, getAllTransactionLogs } = useTransactionLogService();

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'CREATE':
        return 'green';
      case 'EXTEND':
        return 'orange';
      case 'COMPLETE':
        return 'purple';
      case 'CANCEL':
        return 'red';
      default:
        return 'default';
    }
  };

  const getActionText = (action: string): string => {
    switch (action) {
      case 'CREATE':
        return 'Tạo mới';
      case 'EXTEND':
        return 'Gia hạn';
      case 'COMPLETE':
        return 'Hoàn thành';
      case 'CANCEL':
        return 'Hủy';
      default:
        return action;
    }
  };

  const getImportTypeText = (importType: string): string => {
    switch (importType) {
      case 'ORDER':
        return 'Nhập theo kế hoạch';
      case 'RETURN':
        return 'Nhập trả';
      default:
        return importType;
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return 'Chờ xử lý';
      case 'IN_PROGRESS':
        return 'Đang xử lý';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'EXTENDED':
        return 'Đã gia hạn';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return 'orange';
      case 'IN_PROGRESS':
        return 'blue';
      case 'COMPLETED':
        return 'green';
      case 'CANCELLED':
        return 'red';
      case 'EXTEND':
        return 'orange';
      case 'EXTENDED':
        return 'orange';
      default:
        return 'default';
    }
  };

  // ========== USE EFFECTS ==========
  useEffect(() => {
    fetchTransactionLogs();
  }, []);

  // ========== DATA FETCHING FUNCTIONS ==========
  const fetchTransactionLogs = async (): Promise<void> => {
    try {
      const response = await getAllTransactionLogs();
      const allLogs = response.content as TransactionLogResponse[];
      setAllTransactionLogs(allLogs);

      // Extract unique import requests with their creation info
      const importRequestMap = new Map<string, ImportRequestSummary>();

      allLogs.forEach((log) => {
        if (log.type === 'IMPORT_REQUEST') {
          const importRequestLog = log as ImportRequestTransactionLog;

          if (Array.isArray(importRequestLog.responseContent)) {
            importRequestLog.responseContent.forEach((importRequest: ImportRequestResponse) => {
              if (!importRequestMap.has(importRequest.importRequestId)) {
                importRequestMap.set(importRequest.importRequestId, {
                  key: importRequest.importRequestId,
                  importRequestId: importRequest.importRequestId,
                  createdDate: log.createdDate,
                  executorFullName: log.executorFullName,
                  importReason: importRequest.importReason,
                  importType: importRequest.importType,
                });
              }
            });
          } else if (importRequestLog.responseContent) {
            const importRequest = importRequestLog.responseContent as ImportRequestResponse;
            if (!importRequestMap.has(importRequest.importRequestId)) {
              importRequestMap.set(importRequest.importRequestId, {
                key: importRequest.importRequestId,
                importRequestId: importRequest.importRequestId,
                createdDate: log.createdDate,
                executorFullName: log.executorFullName,
                importReason: importRequest.importReason,
                importType: importRequest.importType,
              });
            }
          }
        }
      });

      const summaries = Array.from(importRequestMap.values()).sort((a, b) => {
        const dateA = dayjs(a.createdDate);
        const dateB = dayjs(b.createdDate);
        return dateB.isBefore(dateA) ? -1 : dateB.isAfter(dateA) ? 1 : 0;
      });

      setImportRequestSummaries(summaries);
      setPagination(prev => ({
        ...prev,
        total: summaries.length
      }));
    } catch (error) {
      console.error('Error fetching transaction logs:', error);
    }
  };

  // ========== EVENT HANDLERS ==========
  const handleTableChange = (newPagination: TablePaginationConfig): void => {
    setPagination({
      ...newPagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  const handleViewDetails = (importRequestId: string): void => {
    setSelectedImportRequestId(importRequestId);

    // Get all transactions related to this import request
    const relatedTransactions: TransactionDetail[] = [];

    allTransactionLogs.forEach((log) => {
      if (log.type === 'IMPORT_REQUEST') {
        const importRequestLog = log as ImportRequestTransactionLog;

        if (Array.isArray(importRequestLog.responseContent)) {
          importRequestLog.responseContent.forEach((importRequest: ImportRequestResponse) => {
            if (importRequest.importRequestId === importRequestId) {
              relatedTransactions.push({
                id: log.id.toString(),
                type: 'IMPORT_REQUEST',
                action: log.action,
                createdDate: log.createdDate,
                executorFullName: log.executorFullName,
                importRequestId: importRequest.importRequestId,
                importReason: importRequest.importReason,
                importType: importRequest.importType,
              });
            }
          });
        } else if (importRequestLog.responseContent) {
          const importRequest = importRequestLog.responseContent as ImportRequestResponse;
          if (importRequest.importRequestId === importRequestId) {
            relatedTransactions.push({
              id: log.id.toString(),
              type: 'IMPORT_REQUEST',
              action: log.action,
              createdDate: log.createdDate,
              executorFullName: log.executorFullName,
              importRequestId: importRequest.importRequestId,
              importReason: importRequest.importReason,
              importType: importRequest.importType,
            });
          }
        }
      } else if (log.type === 'IMPORT_ORDER') {
        const importOrderLog = log as ImportOrderTransactionLog;
        const importOrder = importOrderLog.responseContent as ImportOrderResponse;

        if (importOrder.importRequestId === importRequestId) {
          relatedTransactions.push({
            id: log.id.toString(),
            type: 'IMPORT_ORDER',
            action: log.action,
            createdDate: log.createdDate,
            executorFullName: log.executorFullName,
            importOrderId: importOrder.importOrderId,
            importRequestId: importOrder.importRequestId,
            status: importOrder.status,
            note: importOrder.note,
          });
        }
      }
    });

    // Sort by creation date
    relatedTransactions.sort((a, b) => {
      const dateA = dayjs(a.createdDate);
      const dateB = dayjs(b.createdDate);
      return dateA.isBefore(dateB) ? -1 : dateA.isAfter(dateB) ? 1 : 0;
    });

    setTransactionDetails(relatedTransactions);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = (): void => {
    setDrawerOpen(false);
    setSelectedImportRequestId(null);
    setTransactionDetails([]);
  };

  // ========== COLUMNS DEFINITION ==========
  const columns = [
    {
      title: "Mã phiếu nhập",
      dataIndex: "importRequestId",
      key: "importRequestId",
      width: "25%",
      render: (importRequestId: string) => (
        <div>
          <span className="text-lg">#{importRequestId}</span>
        </div>
      ),
    },
    {
      title: "Ngày giờ tạo",
      dataIndex: "createdDate",
      key: "createdDate",
      width: "20%",
      align: "center" as const,
      sorter: (a: ImportRequestSummary, b: ImportRequestSummary) => {
        const dateA = dayjs(a.createdDate);
        const dateB = dayjs(b.createdDate);
        return dateA.isBefore(dateB) ? -1 : dateA.isAfter(dateB) ? 1 : 0;
      },
      render: (createdDate: string) => (
        <div className="text-center">
          <div className="font-medium text-sm">
            {dayjs(createdDate).format("DD-MM-YYYY")}
          </div>
          <div className="text-sm text-gray-500">
            {dayjs(createdDate).format("HH:mm")}
          </div>
        </div>
      ),
    },
    {
      title: "Người tạo",
      dataIndex: "executorFullName",
      key: "executorFullName",
      width: "20%",
      align: "center" as const,
      render: (executorFullName: string) => (
        <div className="flex items-center justify-center gap-2">
          <UserOutlined className="text-blue-600" style={{ fontSize: 20 }} />
          <span className="font-medium text-lg">{executorFullName}</span>
        </div>
      ),
    },
    {
      title: "Loại nhập",
      dataIndex: "importType",
      key: "importType",
      width: "15%",
      align: "center" as const,
      render: (importType: string) => (
        importType ? (
          <Tag
            color={importType === 'ORDER' ? 'blue' : 'orange'}
            className="!text-sm !px-2 !py-1"
          >
            {getImportTypeText(importType)}
          </Tag>
        ) : (
          <span className="text-gray-500">-</span>
        )
      ),
    },
    {
      title: "Chi tiết",
      key: "actions",
      width: "20%",
      align: "center" as const,
      render: (_: unknown, record: ImportRequestSummary) => (
        <div className="flex justify-center">
          <span
            className="inline-flex items-center justify-center rounded-full border-2 border-blue-600 text-blue-600 hover:bg-blue-100 hover:border-blue-700 hover:shadow-lg cursor-pointer transition-all duration-200"
            style={{ width: 36, height: 36 }}
            onClick={() => handleViewDetails(record.importRequestId)}
            title="Xem chi tiết tất cả thao tác"
          >
            <EyeOutlined style={{ fontSize: 20 }} />
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto TransactionHistory">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lịch sử giao dịch - Phiếu nhập</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <ClockCircleOutlined />
          <span>Cập nhật: {dayjs().format("DD-MM-YYYY HH:mm")}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <div>
              <div className="text-sm text-blue-600">
                Nhấn vào nút <EyeOutlined /> để xem chi tiết lịch sử liên quan đến phiếu nhập.
              </div>
            </div>
          </div>
        </div>
      </div>

      <Table<ImportRequestSummary>
        columns={columns}
        dataSource={importRequestSummaries}
        rowKey="key"
        loading={loading}
        onChange={handleTableChange}
        className="[&_.ant-table-cell]:!p-4 [&_.ant-table-thead_th]:!bg-gray-50 [&_.ant-table-thead_th]:!font-semibold [&_.ant-table-tbody_tr:hover_td]:!bg-blue-50"
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          locale: {
            items_per_page: "/ trang"
          },
          showTotal: (total: number) => `Tổng cộng có ${total} phiếu nhập`,
        }}
      />

      {/* Detail Drawer */}
      <Drawer
        title={`Chi tiết lịch sử - Phiếu nhập #${selectedImportRequestId}`}
        placement="right"
        width={800}
        onClose={handleCloseDrawer}
        open={drawerOpen}
        className="[&_.ant-drawer-header]:!bg-blue-50 [&_.ant-drawer-title]:!text-blue-800 [&_.ant-drawer-title]:!font-bold [&_.ant-drawer-title]:!text-lg"
      >
        {transactionDetails.length > 0 && (
          <div className="space-y-6">
            <Timeline
              mode="left"
              items={transactionDetails.map((detail, index) => ({
                dot: detail.type === 'IMPORT_REQUEST' ? (
                  <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
                ) : (
                  <div className="w-4 h-4 bg-purple-500 rounded-full border-2 border-white shadow-lg"></div>
                ),
                children: (
                  <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-lg transition-all duration-200">
                    {/* Header với thời gian */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <Tag
                          color={detail.type === 'IMPORT_REQUEST' ? 'blue' : 'purple'}
                          className="!text-sm !px-3 !py-1 !font-medium"
                        >
                          {detail.type === 'IMPORT_REQUEST' ? 'Phiếu nhập' : 'Đơn nhập'}
                        </Tag>
                        <span className="text-lg font-bold text-gray-800">
                          {detail.type === 'IMPORT_REQUEST' ? (
                            <span className="text-blue-600">#{detail.importRequestId}</span>
                          ) : (
                            <span className="text-purple-600">#{detail.importOrderId}</span>
                          )}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-semibold text-gray-800">
                          Ngày: {dayjs(detail.createdDate).format("DD-MM-YYYY")}
                        </div>
                        <div className="text-sm text-gray-500">
                          Giờ: {dayjs(detail.createdDate).format("HH:mm")}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                      {/* Người thực hiện và hành động */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <UserOutlined className="text-blue-500" />
                          <span className="text-base font-medium text-gray-800">{detail.executorFullName}</span>
                        </div>
                        <div className="w-px h-5 bg-gray-300"></div>
                        <Tag color={getActionColor(detail.action)} className="!text-sm !px-3 !py-1 !font-medium">
                          {getActionText(detail.action)}
                        </Tag>
                      </div>

                      {/* Chi tiết theo loại */}
                      {detail.type === 'IMPORT_REQUEST' ? (
                        <div className="space-y-2 bg-blue-50 p-3 rounded-lg">
                          {detail.importReason && (
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-medium text-gray-600 min-w-fit">Lý do:</span>
                              <span className="text-sm text-gray-800">{detail.importReason}</span>
                            </div>
                          )}
                          {detail.importType && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-600">Loại nhập:</span>
                              <Tag
                                color={detail.importType === 'ORDER' ? 'blue' : 'orange'}
                                className="!text-sm !px-2 !py-1"
                              >
                                {getImportTypeText(detail.importType)}
                              </Tag>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2 bg-purple-50 p-3 rounded-lg">
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-medium text-gray-600 min-w-fit">Thuộc phiếu nhập:</span>
                            <span className="text-sm font-bold text-blue-600">#{detail.importRequestId}</span>
                          </div>
                          {detail.note && (
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-medium text-gray-600 min-w-fit">Ghi chú:</span>
                              <span className="text-sm text-gray-800">{detail.note}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ),
              }))}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default ImportTransactionHistory; 