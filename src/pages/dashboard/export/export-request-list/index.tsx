import React, { useState, useEffect } from "react";
import { Table, Button, Input, Tabs, Select, Tooltip, TablePaginationConfig, Space } from "antd";
import { Link } from "react-router-dom";
import { SearchOutlined, PlusOutlined, EyeOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { ROUTES } from "@/constants/routes";
import useExportRequestService, { ExportRequestResponse } from "@/services/useExportRequestService";
import { useSelector } from "react-redux";
import StatusTag from "@/components/commons/StatusTag";
import { RootState } from "@/contexts/redux/store";
import dayjs from "dayjs";
import { LegendItem } from "@/components/commons/LegendItem";
import { ExportRequestFilterState, useExportRequestFilter } from "@/hooks/useExportRequestFilter";

// const tabStatusMap = {
//   ALL: null,
//   WAITING_CONFIRM: ["IN_PROGRESS", "COUNTED", "COUNT_CONFIRMED"],
//   WAITING_DELIVERY: ["WAITING_EXPORT", "EXTENDED"],
//   COMPLETED: ["COMPLETED"],
//   CANCELLED: ["CANCELLED"],
// };

const ExportRequestList = () => {
  // ========== FILTER STATES ==========
  const { filterState, updateFilter } = useExportRequestFilter();
  const {
    searchTerm,
    selectedExportType,
    selectedStatusFilter,
    pagination
  } = filterState as ExportRequestFilterState;

  // ========== DATA STATES ==========
  const [exportRequestsData, setExportRequestsData] = useState<ExportRequestResponse[]>([]);

  // ========== SERVICES ==========
  const { getAllExportRequests, loading } = useExportRequestService();


  // ========== UTILITY FUNCTIONS ==========
  const user = useSelector((state: RootState) => state.user);

  const getStatusRowClass = (status: string): string => {
    switch (status) {
      case 'IN_PROGRESS':
      case 'COUNTED':
      case 'COUNT_CONFIRMED':
        return 'bg-[rgba(59,130,246,0.06)]'; // Blue with opacity for waiting confirm
      case 'WAITING_EXPORT':
      case 'EXTENDED':
        return 'bg-[rgba(251,191,36,0.08)]'; // Yellow with opacity for waiting delivery
      case 'COMPLETED':
        return 'bg-[rgba(34,197,94,0.08)]'; // Green with opacity
      case 'CANCELLED':
        return 'bg-[rgba(107,114,128,0.12)]'; // Gray with opacity
      default:
        return 'no-bg-row';
    }
  };

  // ========== EFFECTS ==========
  useEffect((): void => {
    fetchExportRequests();
  }, []);

  const fetchExportRequests = async (): Promise<void> => {
    const response = await getAllExportRequests();
    setExportRequestsData(response.content);
  };


  // ========== EVENT HANDLERS ==========
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    updateFilter({
      searchTerm: e.target.value,
      pagination: {
        ...pagination,
        current: 1
      }
    });
  };

  const handleTableChange = (page: TablePaginationConfig): void => {
    updateFilter({
      pagination: {
        ...pagination,
        current: page.current,
        pageSize: page.pageSize,
      }
    });
  };

  const handleStatusFilterClick = (filterKey: string): void => {
    const newStatusFilter = selectedStatusFilter === filterKey ? null : filterKey;
    updateFilter({
      selectedStatusFilter: newStatusFilter,
      pagination: { ...pagination, current: 1 } // Reset về trang đầu khi filter thay đổi
    });
  };

  // ========== COMPUTED VALUES & RENDER LOGIC ==========
  const filteredItems = exportRequestsData?.filter((item) => {
    const idStr = item.exportRequestId ? item.exportRequestId.toString() : "";
    const matchesSearch = idStr
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    // Nếu tab là ALL thì không lọc status
    let matchesStatusFilter = true;
    switch (selectedStatusFilter) {
      case "WAITING_CONFIRM":
        matchesStatusFilter = item.status === "IN_PROGRESS" ||
          item.status === "COUNTED" ||
          item.status === "COUNT_CONFIRMED";
        break;
      case "WAITING_DELIVERY":
        matchesStatusFilter = item.status === "WAITING_EXPORT" ||
          item.status === "EXTENDED";
        break;
      case "COMPLETED":
        matchesStatusFilter = item.status === "COMPLETED";
        break;
      case "CANCELLED":
        matchesStatusFilter = item.status === "CANCELLED";
        break;
      default:
        matchesStatusFilter = true;
    }

    // Filter theo exportType
    const matchesExportType =
      selectedExportType === "ALL" ? true : selectedExportType.includes(item.type);

    return matchesSearch && matchesStatusFilter && matchesExportType;
  });

  const columns = [
    {
      title: "Mã phiếu xuất",
      dataIndex: "exportRequestId",
      key: "exportRequestId",
      render: (exportRequestId: string) => `#${exportRequestId}`,
      width: "15%",
    },
    {
      title: "Ngày xuất",
      dataIndex: "exportDate",
      key: "exportDate",
      render: (date: string) => dayjs(date).format("DD-MM-YYYY"),
    },
    {
      title: "Người lập phiếu",
      dataIndex: "createdBy",
      key: "createdBy",
    },
    {
      title: "Người nhận hàng",
      dataIndex: "receiverName",
      key: "receiverName",
    },
    {
      title: "Trạng thái phiếu",
      dataIndex: "status",
      key: "status",
      render: (status: string) => <StatusTag status={status} type="export" />,
    },
    {
      title: "Chi tiết",
      key: "detail",
      render: (text: string, record: ExportRequestResponse) => (
        <div className="flex gap-3 justify-center">
          <Tooltip title="Xem chi tiết phiếu xuất" placement="top">
            <Link to={ROUTES.PROTECTED.EXPORT.REQUEST.DETAIL(record.exportRequestId)}>
              <span className="inline-flex items-center justify-center rounded-full border-2 border-blue-900 text-blue-900 hover:bg-blue-100 hover:border-blue-700 hover:shadow-lg cursor-pointer" style={{ width: 32, height: 32 }}>
                <EyeOutlined style={{ fontSize: 20, fontWeight: 700 }} />
              </span>
            </Link>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Danh sách phiếu xuất</h1>
        {user?.role === "ROLE_DEPARTMENT" && (
          <Link to={ROUTES.PROTECTED.EXPORT.REQUEST.CREATE}>
            <Button
              type="primary"
              id="btn-create"
              icon={<PlusOutlined />}
            >
              Tạo Phiếu Xuất
            </Button>
          </Link>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="min-w-[300px]">
            <Input
              placeholder="Tìm theo mã phiếu xuất"
              value={searchTerm}
              onChange={handleSearchChange}
              prefix={<SearchOutlined />}
              className="!border-gray-400 [&_input::placeholder]:!text-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="mb-4 [&_.ant-tabs-nav]:!mb-0 [&_.ant-tabs-tab]:!bg-gray-200 [&_.ant-tabs-tab]:!transition-none [&_.ant-tabs-tab]:!font-bold [&_.ant-tabs-tab-active]:!bg-white [&_.ant-tabs-tab-active]:!border-1 [&_.ant-tabs-tab-active]:!border-gray-400 [&_.ant-tabs-tab-active]:!border-b-0 [&_.ant-tabs-tab-active]:!transition-none [&_.ant-tabs-tab-active]:!border-bottom-width-0 [&_.ant-tabs-tab-active]:!border-bottom-style-none [&_.ant-tabs-tab-active]:!font-bold [&_.ant-tabs-tab-active]:!text-[17px]">
        <div className="flex justify-between">
          <Tabs
            activeKey={selectedExportType}
            onChange={(key) => {
              updateFilter({
                selectedExportType: key,
                pagination: {
                  ...pagination,
                  current: 1
                }
              });
            }}
            type="card"
            size="middle"
            items={[
              {
                key: "SELLING",
                label: "Xuất bán",
              },
              {
                key: "PRODUCTION",
                label: "Xuất sản xuất",
              },
              {
                key: "BORROWING",
                label: "Xuất mượn",
              },
              {
                key: "RETURN",
                label: "Xuất trả nhà cung cấp",
              },
              {
                key: "LIQUIDATION",
                label: "Xuất thanh lý",
              },
              {
                key: "ALL",
                label: "Tất cả",
              }
            ]}
          />
          <Space size="large">
            <LegendItem
              color="rgba(59, 130, 246, 0.1)"
              borderColor="rgba(59, 130, 246, 0.5)"
              title="Chờ xác nhận"
              description="Phiếu xuất đang chờ xác nhận"
              clickable={true}
              isSelected={selectedStatusFilter === 'WAITING_CONFIRM'}
              onClick={() => handleStatusFilterClick('WAITING_CONFIRM')}
            />
            <LegendItem
              color="rgba(251, 191, 36, 0.1)"
              borderColor="rgba(251, 191, 36, 0.5)"
              title="Chờ xuất hàng"
              description="Phiếu xuất đang chờ xuất hàng"
              clickable={true}
              isSelected={selectedStatusFilter === 'WAITING_DELIVERY'}
              onClick={() => handleStatusFilterClick('WAITING_DELIVERY')}
            />
            <LegendItem
              color="rgba(34, 197, 94, 0.1)"
              borderColor="rgba(34, 197, 94, 0.5)"
              title="Đã hoàn tất"
              description="Phiếu xuất đã hoàn tất"
              clickable={true}
              isSelected={selectedStatusFilter === 'COMPLETED'}
              onClick={() => handleStatusFilterClick('COMPLETED')}
            />
            <LegendItem
              color="rgba(107, 114, 128, 0.1)"
              borderColor="rgba(107, 114, 128, 0.5)"
              title="Đã hủy"
              description="Phiếu xuất đã bị hủy"
              clickable={true}
              isSelected={selectedStatusFilter === 'CANCELLED'}
              onClick={() => handleStatusFilterClick('CANCELLED')}
            />
          </Space>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={filteredItems}
        rowKey="exportRequestId"
        className={`[&_.ant-table-cell]:!p-3 [&_.ant-table-thead_th.ant-table-column-has-sorters:hover]:!bg-transparent [&_.ant-table-thead_th.ant-table-column-has-sorters:active]:!bg-transparent [&_.ant-table-thead_th.ant-table-column-has-sorters]:!transition-none [&_.ant-table-tbody_td.ant-table-column-sort]:!bg-transparent ${exportRequestsData?.length > 0 ?
          '[&_.ant-table-tbody_tr:hover_td]:!bg-gray-100 [&_.ant-table-tbody_tr.no-bg-row:hover_td]:!bg-gray-100 ' +
          '[&_.ant-table-tbody_tr.status-blue:hover_td]:!bg-[rgba(59,130,246,0.08)] ' +
          '[&_.ant-table-tbody_tr.status-yellow:hover_td]:!bg-[rgba(251,191,36,0.10)] ' +
          '[&_.ant-table-tbody_tr.status-green:hover_td]:!bg-[rgba(34,197,94,0.08)] ' +
          '[&_.ant-table-tbody_tr.status-gray:hover_td]:!bg-[rgba(107,114,128,0.08)]'
          : ''} custom-table mb-4`}
        loading={loading}
        onChange={handleTableChange}
        rowClassName={(record) => {
          const statusClass = getStatusRowClass(record.status);

          // Priority: COMPLETED and CANCELLED > other status colors  
          if (record.status === 'COMPLETED') {
            return `${statusClass} status-green`;
          }

          if (record.status === 'CANCELLED') {
            return `${statusClass} status-gray`;
          }

          // Add status-specific class for hover effects
          if (statusClass !== 'no-bg-row') {
            const statusType =
              (record.status === 'IN_PROGRESS' || record.status === 'COUNTED' || record.status === 'COUNT_CONFIRMED')
                ? 'status-blue'
                : (record.status === 'WAITING_EXPORT' || record.status === 'EXTENDED')
                  ? 'status-yellow'
                  : '';
            return `${statusClass} ${statusType}`;
          }

          return 'no-bg-row';
        }}
        pagination={{
          ...pagination,
          total: filteredItems?.length,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          locale: {
            items_per_page: "/ trang"
          },
          showTotal: (total: number) => `Tổng cộng có ${total} phiếu xuất${selectedStatusFilter ? ' (đã lọc)' : ''}`,
        }}
      />
    </div>
  );
};

export default ExportRequestList;
