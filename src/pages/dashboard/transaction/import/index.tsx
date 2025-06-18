import React, { useState, useEffect } from "react";
import { Table, TablePaginationConfig, Tag, Space } from "antd";
import { ClockCircleOutlined, UserOutlined, FileTextOutlined } from "@ant-design/icons";
import useTransactionLogService from "@/services/useTransactionLogService";
import { ImportRequestTransactionLog, TransactionLogResponse } from "@/utils/interfaces";
import dayjs from "dayjs";

const ImportTransactionHistory: React.FC = () => {
  // ========== DATA STATES ==========
  const [transactionLogsData, setTransactionLogsData] = useState<ImportRequestTransactionLog[]>([]);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // ========== SERVICES ==========
  const { loading, getAllTransactionLogs } = useTransactionLogService();

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'CREATE':
        return 'green';
      case 'UPDATE':
        return 'blue';
      default:
        return 'default';
    }
  };

  const getActionText = (action: string): string => {
    switch (action) {
      case 'CREATE':
        return 'Tạo mới';
      case 'UPDATE':
        return 'Cập nhật';
      default:
        return action;
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
      
      const formattedLogs = response.content as ImportRequestTransactionLog[];

      setTransactionLogsData(formattedLogs);
      
      setPagination(prev => ({
        ...prev,
        total: formattedLogs.length
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

  // ========== COMPUTED VALUES & RENDER LOGIC ==========
  const columns = [
    {
      title: "Thời gian",
      dataIndex: "createdDate",
      key: "createdDate",
      width: "20%",
      align: "center" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      sorter: (a: ImportRequestTransactionLog, b: ImportRequestTransactionLog) => {
        const dateA = dayjs(a.createdDate);
        const dateB = dayjs(b.createdDate);
        return dateA.isBefore(dateB) ? -1 : dateA.isAfter(dateB) ? 1 : 0;
      },
      showSorterTooltip: {
        title: 'Sắp xếp theo thời gian'
      },
      render: (createdDate: string) => (
        <div className="text-center">
          <div className="font-medium">
            {dayjs(createdDate).format("DD-MM-YYYY")}
          </div>
          <div className="text-sm text-gray-500">
            {dayjs(createdDate).format("HH:mm:ss")}
          </div>
        </div>
      ),
    },
    {
      title: "Người thực hiện",
      dataIndex: "executorFullName",
      key: "executorFullName",
      width: "15%",
      align: "center" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (executorFullName: string, record: ImportRequestTransactionLog) => (
        <div className="flex items-center justify-center gap-2">
          <UserOutlined className="!text-2xl" />
          <span className="text-lg font-medium">{record.executorFullName}</span>
        </div>
      ),
    },
    {
      title: "Hành động",
      dataIndex: "action",
      key: "action",
      width: "15%",
      align: "center" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (action: string, record: ImportRequestTransactionLog) => (
        <Space direction="vertical" size="small" className="w-full">
          <Tag color={getActionColor(record.action)} className="mx-auto !text-lg">
            {getActionText(record.action)}
          </Tag>
        </Space>
      ),
    },
    {
      title: "Chi tiết phiếu nhập",
      dataIndex: "responseContent",
      key: "responseContent",
      width: "30%",
      align: "center" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (responseContent: any, record: ImportRequestTransactionLog) => (
        // ✅ Bây giờ có full autocomplete cho responseContent
        <div className="text-left">
          <div><strong>ID:</strong> {record.responseContent.importRequestId}</div>
          <div><strong>Lý do:</strong> {record.responseContent.importReason}</div>
          <div><strong>Loại:</strong> {record.responseContent.importType}</div>
          <div><strong>Trạng thái:</strong> {record.responseContent.status}</div>
          <div><strong>Batch:</strong> {record.responseContent.batchCode}</div>
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
          <span>Cập nhật: {dayjs().format("DD-MM-YYYY HH:mm:ss")}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <div>
              <div className="font-medium text-blue-800">
                Lịch sử giao dịch phiếu nhập
              </div>
              <div className="text-sm text-blue-600">
                Hiển thị tất cả các hoạt động tạo, cập nhật, xóa phiếu nhập trong hệ thống
              </div>
            </div>
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={transactionLogsData}
        rowKey="id"
        loading={loading}
        onChange={handleTableChange}
        className="[&_.ant-table-cell]:!p-3 [&_.ant-table-thead_th.ant-table-column-has-sorters:hover]:!bg-transparent [&_.ant-table-thead_th.ant-table-column-has-sorters:active]:!bg-transparent [&_.ant-table-thead_th.ant-table-column-has-sorters]:!transition-none [&_.ant-table-tbody_td.ant-table-column-sort]:!bg-transparent [&_.ant-table-tbody_tr:hover_td]:!bg-blue-50"
        pagination={{
          ...pagination,
          total: transactionLogsData.length,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          locale: {
            items_per_page: "/ trang"
          },
          showTotal: (total: number) => `Tổng cộng có ${total} giao dịch`,
        }}
      />
    </div>
  );
};

export default ImportTransactionHistory; 