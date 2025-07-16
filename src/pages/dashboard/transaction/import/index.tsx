import React, { useState, useEffect } from "react";
import { Table, TablePaginationConfig, Tag, Drawer, Timeline, Input, DatePicker, Select } from "antd";
import { ClockCircleOutlined, UserOutlined, EyeOutlined, SearchOutlined, CheckCircleOutlined, PlusCircleOutlined, EditOutlined, StopOutlined, UserSwitchOutlined, RedoOutlined } from "@ant-design/icons";
import useTransactionLogService from "@/services/useTransactionLogService";
import useAccountService, { AccountResponse } from "@/services/useAccountService";
import { AccountRoleForRequest } from "@/utils/enums";
import { ImportRequestTransactionLog, ImportOrderTransactionLog, TransactionLogResponse } from "@/utils/interfaces";
import { ImportOrderResponse } from "@/services/useImportOrderService";
import { ImportRequestResponse } from "@/services/useImportRequestService";
import dayjs from "dayjs";
import { FilePlus, FilePlus2, WarehouseIcon } from "lucide-react";

// ========== INTERFACES ==========
interface ImportRequestSummary {
  key: string;
  importRequestId: string;
  createdDate: string;
  executorFullName: string;
  importReason?: string;
  importType?: string;
  importOrderCount?: number;
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
  assignedStaffId?: number;
  assignedStaffName?: string;
}

const ImportTransactionHistory: React.FC = () => {
  // ========== DATA STATES ==========
  const [importRequestSummaries, setImportRequestSummaries] = useState<ImportRequestSummary[]>([]);
  const [allTransactionLogs, setAllTransactionLogs] = useState<TransactionLogResponse[]>([]);
  const [staffList, setStaffList] = useState<AccountResponse[]>([]);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // ========== FILTER STATES ==========
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<string[]>([]);

  // ========== DRAWER STATES ==========
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedImportRequestId, setSelectedImportRequestId] = useState<string | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<TransactionDetail[]>([]);

  // ========== SERVICES ==========
  const { loading: transactionLoading, getAllTransactionLogs } = useTransactionLogService();
  const { loading: accountLoading, getAccountsByRole } = useAccountService();

  const loading = transactionLoading || accountLoading;

  // ========== UTILITY FUNCTIONS ==========
  const getStaffNameById = (staffId: number): string => {
    const staff = staffList.find(s => s.id === staffId);
    return staff ? staff.fullName : `Nhân viên ID: ${staffId}`;
  };

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'CREATE':
        return 'default';
      case 'ASSIGN_STAFF':
        return 'blue';
      case 'EXTEND':
      case 'REQUEST_COUNT_AGAIN':
        return 'orange';
      case 'COMPLETE':
      case 'UPDATE_STORED':
        return 'green';
      case 'CANCEL':
        return 'red';
      default:
        return 'default';
    }
  };

  const getActionIconColor = (action: string): string => {
    switch (action) {
      case 'CREATE':
        return '#6B7280'; // gray-500
      case 'ASSIGN_STAFF':
        return '#3B82F6'; // blue-500
      case 'EXTEND':
      case 'REQUEST_COUNT_AGAIN':
        return '#F97316'; // orange-500
      case 'COMPLETE':
      case 'UPDATE_STORED':
        return '#10B981'; // green-500
      case 'CANCEL':
        return '#EF4444'; // red-500
      default:
        return '#6B7280'; // gray-500
    }
  };

  const getActionIcon = (action: string, type: string) => {
    const iconProps = {
      style: { fontSize: '20px', color: getActionIconColor(action) }
    };

    switch (action) {
      case 'CREATE':
        return <FilePlus {...iconProps} />;
      case 'ASSIGN_STAFF':
        return <UserSwitchOutlined {...iconProps} />;
      case 'EXTEND':
        return <EditOutlined {...iconProps} />;
      case 'REQUEST_COUNT_AGAIN':
        return <RedoOutlined {...iconProps} />;
      case 'COMPLETE':
        return <CheckCircleOutlined {...iconProps} />;
      case 'CANCEL':
        return <StopOutlined {...iconProps} />;
      case 'UPDATE_STORED':
        return <WarehouseIcon {...iconProps} />;
      default:
        return <ClockCircleOutlined {...iconProps} />;
    }
  };

  const getActionText = (action: string): string => {
    switch (action) {
      case 'CREATE':
        return 'Tạo mới';
      case 'ASSIGN_STAFF':
        return 'Phân công';
      case 'EXTEND':
        return 'Gia hạn';
      case 'REQUEST_COUNT_AGAIN':
        return 'Kiểm đếm lại';
      case 'COMPLETE':
        return 'Hoàn thành';
      case 'UPDATE_STORED':
        return 'Đã lưu kho';
      case 'CANCEL':
        return 'Đã hủy';
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

  // ========== COMPUTED VALUES & FILTERING ==========
  const filteredItems = importRequestSummaries.filter((item) => {
    const matchesSearch = item.importRequestId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = selectedDate ? selectedDate.format('YYYY-MM-DD') === item.createdDate?.split('T')[0] : true;
    const matchesCreator = selectedCreator.length > 0 ? selectedCreator.includes(item.executorFullName) : true;

    return matchesSearch && matchesDate && matchesCreator;
  });

  // Get unique creators from data
  const uniqueCreators = Array.from(new Set(importRequestSummaries.map(item => item.executorFullName))).filter(Boolean);

  // ========== USE EFFECTS ==========
  useEffect(() => {
    fetchTransactionLogs();
    fetchStaffList();
  }, []);

  // Update pagination total when filtered items change
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      total: filteredItems.length,
      current: 1 // Reset to first page when filter changes
    }));
  }, [filteredItems.length]);

  // ========== DATA FETCHING FUNCTIONS ==========
  const fetchStaffList = async (): Promise<void> => {
    try {
      const response = await getAccountsByRole(AccountRoleForRequest.STAFF);
      setStaffList(response || []);
    } catch (error) {
      console.error('Error fetching staff list:', error);
    }
  };

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
                  importOrderCount: 0,
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
                importOrderCount: 0,
              });
            }
          }
        }
      });

      // Count unique import orders for each import request
      const importOrderCounts = new Map<string, Set<string>>();
      
      allLogs.forEach((log) => {
        if (log.type !== 'IMPORT_ORDER') return;
        
        const importOrderLog = log as ImportOrderTransactionLog;
        const importOrder = importOrderLog.responseContent as ImportOrderResponse;
        
        const requestId = importOrder.importRequestId;
        const orderId = importOrder.importOrderId;
        
        if (!requestId || !orderId) return;
        
        // Initialize set if not exists
        if (!importOrderCounts.has(requestId)) {
          importOrderCounts.set(requestId, new Set<string>());
        }
        
        // Add unique order ID to the set
        const orderSet = importOrderCounts.get(requestId);
        orderSet.add(orderId);
      });

      // Update import request summaries with order counts
      importRequestMap.forEach((summary, requestId) => {
        const orderSet = importOrderCounts.get(requestId);
        const orderCount = orderSet ? orderSet.size : 0;
        summary.importOrderCount = orderCount;
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
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleDateChange = (date: dayjs.Dayjs | null): void => {
    setSelectedDate(date);
  };

  const handleCreatorChange = (value: string[]): void => {
    setSelectedCreator(value);
  };

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
    const relatedTransactionDetails: TransactionDetail[] = [];

    allTransactionLogs.forEach((log) => {
      if (log.type === 'IMPORT_REQUEST') {
        const importRequestLog = log as ImportRequestTransactionLog;

        if (Array.isArray(importRequestLog.responseContent)) {
          importRequestLog.responseContent.forEach((importRequest: ImportRequestResponse) => {
            if (importRequest.importRequestId === importRequestId) {
              relatedTransactionDetails.push({
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
            relatedTransactionDetails.push({
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
      }
      else if (log.type === 'IMPORT_ORDER') {
        const importOrderLog = log as ImportOrderTransactionLog;
        const importOrder = importOrderLog.responseContent as ImportOrderResponse;

        if (importOrder.importRequestId === importRequestId) {
          relatedTransactionDetails.push({
            id: log.id.toString(),
            type: 'IMPORT_ORDER',
            action: log.action,
            createdDate: log.createdDate,
            executorFullName: log.executorFullName,
            importOrderId: importOrder.importOrderId,
            importRequestId: importOrder.importRequestId,
            status: importOrder.status,
            note: importOrder.note,
            assignedStaffId: importOrder.assignedStaffId,
            assignedStaffName: importOrder.assignedStaffId ? getStaffNameById(importOrder.assignedStaffId) : undefined,
          });
        }
      }
    });

    // Sort by creation date
    relatedTransactionDetails.sort((a, b) => {
      const dateA = dayjs(a.createdDate);
      const dateB = dayjs(b.createdDate);
      return dateB.isBefore(dateA) ? -1 : dateB.isAfter(dateA) ? 1 : 0;
    });

    setTransactionDetails(relatedTransactionDetails);
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
      width: "20%",
      align: "center" as const,
      render: (importRequestId: string) => (
        <div>
          <span className="text-base text-left">#{importRequestId}</span>
        </div>
      ),
    },
    {
      title: "Ngày giờ tạo",
      dataIndex: "createdDate",
      key: "createdDate",
      width: "15%",
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
          <span className="font-medium text-base">{executorFullName}</span>
        </div>
      ),
    },
    {
      title: "Loại nhập",
      dataIndex: "importType",
      key: "importType",
      width: "20%",
      align: "center" as const,
      render: (importType: string) => (
        importType ? (
          <span className="text-base text-left">{getImportTypeText(importType)}</span>
        ) : (
          <span className="text-gray-500">-</span>
        )
      ),
    },
    {
      title: "Số đơn nhập đã tạo",
      dataIndex: "importOrderCount",
      key: "importOrderCount",
      width: "15%",
      align: "center" as const,
      render: (importOrderCount: number) => (
        <div className="text-right text-base">{importOrderCount || 0}</div>
      ),
    },
    {
      title: "Chi tiết",
      key: "actions",
      width: "10%",
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
        <h1 className="text-2xl font-bold">Lịch sử của phiếu nhập</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <ClockCircleOutlined />
          <span>Cập nhật: {dayjs().format("DD-MM-YYYY HH:mm")}</span>
        </div>
      </div>

      {/* Filter Section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="min-w-[300px]">
            <Input
              placeholder="Tìm theo mã phiếu nhập"
              value={searchTerm}
              onChange={handleSearchChange}
              prefix={<SearchOutlined />}
              className="!border-gray-400 [&_input::placeholder]:!text-gray-400"
            />
          </div>

          <DatePicker
            placeholder="Tìm theo ngày tạo"
            value={selectedDate}
            onChange={handleDateChange}
            format="DD-MM-YYYY"
            className="min-w-[160px] !border-gray-400 [&_input::placeholder]:!text-gray-400"
            allowClear
          />

          <Select
            mode="multiple"
            placeholder="Tìm theo tên người tạo"
            className="min-w-[240px] text-black [&_.ant-select-selector]:!border-gray-400 [&_.ant-select-selection-placeholder]:!text-gray-400 [&_.ant-select-clear]:!text-lg [&_.ant-select-clear]:!flex [&_.ant-select-clear]:!items-center [&_.ant-select-clear]:!justify-center [&_.ant-select-clear_svg]:!w-5 [&_.ant-select-clear_svg]:!h-5"
            value={selectedCreator}
            onChange={handleCreatorChange}
            allowClear
            maxTagCount="responsive"
            options={uniqueCreators.map(creator => ({ label: creator, value: creator }))}
          />
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

      <Table
        columns={columns}
        dataSource={filteredItems}
        rowKey="key"
        loading={loading}
        onChange={handleTableChange}
        className="[&_.ant-table-cell]:!p-4 [&_.ant-table-thead_th]:!bg-gray-50 [&_.ant-table-thead_th]:!font-semibold [&_.ant-table-tbody_tr:hover_td]:!bg-blue-50"
        pagination={{
          ...pagination,
          total: filteredItems.length,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          locale: {
            items_per_page: "/ trang"
          },
          showTotal: (total: number) => `Tổng cộng có ${total} phiếu nhập${(searchTerm || selectedDate || selectedCreator.length > 0) ? ' (đã lọc)' : ''}`,
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
          <div className="m-4">
            <style>
              {`
                .timeline-vertical-center .ant-timeline-item-head {
                  top: 60px !important;
                }
                .timeline-vertical-center .ant-timeline-item-tail {
                  top: 72px !important;
                }
              `}
            </style>
            <Timeline
              mode="left"
              className="timeline-vertical-center"
              items={transactionDetails.map((detail, index) => ({
                dot: (
                  <div className="flex flex-col items-center">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2"
                      style={{
                        backgroundColor: 'transparent',
                        borderColor: getActionIconColor(detail.action)
                      }}
                    >
                      {getActionIcon(detail.action, detail.type)}
                    </div>
                    <div className="mt-2 text-center text-sm text-gray-600">
                      <div className="font-medium">
                        {dayjs(detail.createdDate).format("DD/MM")}
                      </div>
                      <div className="text-gray-500">
                        {dayjs(detail.createdDate).format("HH:mm")}
                      </div>
                    </div>
                  </div>
                ),
                children: (
                  <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-lg transition-all duration-200 ml-4">
                    {/* Header without time */}
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                      <Tag
                        color={detail.type === 'IMPORT_REQUEST' ? 'blue-inverse' : 'blue'}
                        className="!text-sm !px-3 !py-1 !font-medium"
                      >
                        {detail.type === 'IMPORT_REQUEST' ? 'PHIẾU NHẬP' : 'ĐƠN NHẬP'}
                      </Tag>
                      <span className="text-sm font-bold text-gray-800">
                        {detail.type === 'IMPORT_REQUEST' ? (
                          <span className="text-blue-600">#{detail.importRequestId}</span>
                        ) : (
                          <span className="text-blue-600">#{detail.importOrderId}</span>
                        )}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                      {/* Người thực hiện và hành động */}
                      {detail.action === 'CREATE' && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <UserOutlined className="!text-blue-800" />
                            <span className="text-base font-medium text-blue-800">{detail.executorFullName}</span>
                          </div>
                          <div className="w-px h-5 bg-gray-300"></div>
                          <Tag color={getActionColor(detail.action)} className="!text-sm !p-1 !font-medium !m-0">
                            {getActionText(detail.action)}
                          </Tag>
                        </div>
                      )}
                      {detail.action === 'ASSIGN_STAFF' && detail.assignedStaffName && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <UserOutlined className="!text-blue-800" />
                            <span className="text-base font-medium text-blue-800">{detail.assignedStaffName}</span>
                            <span className="text-base">đã được</span>
                          </div>
                          <div className="w-px h-5 bg-gray-300"></div>
                          <Tag color={getActionColor(detail.action)} className="!text-sm !p-1 !font-medium !m-0">
                            {getActionText(detail.action)}
                          </Tag>

                        </div>
                      )}
                      {detail.action === 'EXTEND' && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <UserOutlined className="!text-blue-800" />
                            <span className="text-base font-medium text-blue-800">{detail.executorFullName}</span>
                          </div>
                          <div className="w-px h-5 bg-gray-300"></div>
                          <Tag color={getActionColor(detail.action)} className="!text-sm !p-1 !font-medium !m-0">
                            {getActionText(detail.action)}
                          </Tag>
                        </div>
                      )}
                      {detail.action === 'REQUEST_COUNT_AGAIN' && detail.assignedStaffName && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <UserOutlined className="!text-blue-800" />
                            <span className="text-base font-medium text-blue-800">{detail.assignedStaffName}</span>
                            <span className="text-base">đã được yêu cầu</span>
                          </div>
                          <div className="w-px h-5 bg-gray-300"></div>
                          <Tag color={getActionColor(detail.action)} className="!text-sm !p-1 !font-medium !m-0">
                            {getActionText(detail.action)}
                          </Tag>
                        </div>
                      )}
                      {detail.action === 'COMPLETE' && detail.assignedStaffName && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <UserOutlined className="!text-blue-800" />
                            <span className="text-base font-medium text-blue-800">{detail.assignedStaffName}</span>
                          </div>
                          <div className="w-px h-5 bg-gray-300"></div>
                          <Tag color={getActionColor(detail.action)} className="!text-sm !p-1 !font-medium !m-0">
                            {getActionText(detail.action)}
                          </Tag>
                        </div>
                      )}
                      {detail.action === 'UPDATE_STORED' && detail.assignedStaffName && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <UserOutlined className="!text-blue-800" />
                            <span className="text-base font-medium text-blue-800">{detail.assignedStaffName}</span>
                          </div>
                          <div className="w-px h-5 bg-gray-300"></div>
                          <Tag color={getActionColor(detail.action)} className="!text-sm !p-1 !font-medium !m-0">
                            {getActionText(detail.action)}
                          </Tag>
                        </div>
                      )}
                      {detail.action === 'CANCEL' && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <UserOutlined className="!text-blue-800" />
                            <span className="text-base font-medium text-blue-800">{detail.executorFullName}</span>
                          </div>
                          <div className="w-px h-5 bg-gray-300"></div>
                          <Tag color={getActionColor(detail.action)} className="!text-sm !p-1 !font-medium !m-0">
                            {getActionText(detail.action)}
                          </Tag>
                        </div>
                      )}

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
                              <span className="text-sm text-blue-600">{getImportTypeText(detail.importType)}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          {detail.note && (
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-medium text-gray-600 min-w-fit">Ghi chú:</span>
                              <span className="text-sm text-gray-800">{detail.note}</span>
                            </div>
                          )}
                        </>
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