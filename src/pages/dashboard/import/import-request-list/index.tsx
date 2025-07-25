import React, { useState, useEffect } from "react";
import { Table, Button, Input, TablePaginationConfig, DatePicker, Select, Tabs, Space } from "antd";
import StatusTag from "@/components/commons/StatusTag";
import { UnorderedListOutlined, EyeOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { Link } from "react-router-dom";
import useImportRequestService, { ImportRequestResponse } from "@/services/useImportRequestService";
import useProviderService from "@/services/useProviderService";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import { ROUTES } from "@/constants/routes";
import dayjs from "dayjs";
import { LegendItem } from "@/components/commons/LegendItem";
import { ImportRequestFilterState, useImportRequestFilter } from "@/hooks/useImportRequestFilter";
import { legendItems } from "@/constants/legendItems";
import { getStatusRowClass } from "@/utils/helpers";

export interface ImportRequestData extends ImportRequestResponse {
  totalExpectQuantityInRequest?: number;
  totalOrderedQuantityInRequest?: number;
  totalActualQuantityInRequest?: number;
  providerName: string;
}

const ImportRequestList: React.FC = () => {
  // ========== FILTER CONTEXT ==========
  const { filterState, updateFilter } = useImportRequestFilter();
  const {
    searchTerm,
    selectedDate,
    selectedImportType,
    selectedProvider,
    selectedStatusFilter,
    pagination
  } = filterState as ImportRequestFilterState;

  // ========== DATA STATES ==========
  const [importRequestsData, setImportRequestsData] = useState<ImportRequestData[]>([]);

  // ========== SERVICES ==========
  const {
    loading: importRequestLoading,
    getAllImportRequests
  } = useImportRequestService();

  const {
    loading: providerLoading,
    getAllProviders
  } = useProviderService();

  // ========== COMPUTED VALUES ==========
  const loading = importRequestLoading || providerLoading;

  // ========== UTILITY FUNCTIONS ==========
  const isNearEndDate = (endDate: string): boolean => {
    if (!endDate) return false;

    const endDateTime = dayjs(endDate);
    const now = dayjs();
    const diffInDays = endDateTime.diff(now, 'day');

    return diffInDays >= 0 && diffInDays <= 2; // Gần đến ngày hết hạn trong vòng 3 ngày
  };


  // ========== COMPUTED VALUES & FILTERING ==========
  const filteredItems = importRequestsData.filter((importRequest) => {
    const matchesSearch = importRequest.importRequestId.toString().toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = selectedDate ? selectedDate.format('YYYY-MM-DD') === importRequest.createdDate?.split('T')[0] : true;
    const matchesImportType = importRequest.importType === selectedImportType;
    const matchesProvider = selectedProvider.length > 0 ? selectedProvider.includes(importRequest.providerName) : true;

    // Filter logic based on selected status filter
    let matchesStatusFilter = true;
    if (selectedStatusFilter) {
      switch (selectedStatusFilter) {
        case 'near-time':
          matchesStatusFilter = isNearEndDate(importRequest.endDate) &&
          importRequest.status !== 'COMPLETED' &&
          importRequest.status !== 'CANCELLED';
          break;
        case 'in-progress':
          matchesStatusFilter = importRequest.status === 'IN_PROGRESS';
          break;
        case 'completed':
          matchesStatusFilter = importRequest.status === 'COMPLETED';
          break;
        case 'cancelled':
          matchesStatusFilter = importRequest.status === 'CANCELLED';
          break;
        default:
          matchesStatusFilter = true;
      }
    }

    return matchesSearch && matchesDate && matchesImportType && matchesProvider && matchesStatusFilter;
  });

  // Get unique providers from data
  const uniqueProviders = Array.from(new Set(importRequestsData.map(item => item.providerName))).filter(Boolean);

  // ========== USE EFFECTS ==========
  useEffect(() => {
    fetchImportRequests();
  }, []);

  // ========== DATA FETCHING FUNCTIONS ==========
  const fetchImportRequests = async (): Promise<void> => {
    const { content } = await getAllImportRequests();

    const { content: providerList = [] } = await getAllProviders();

    const formattedRequests: ImportRequestData[] = (content || []).map(request => {
      const importRequestDetails = request.importRequestDetails || [];

      // Tính tổng bằng reduce
      const totalExpectQuantityInRequest = importRequestDetails.reduce(
        (runningTotal, detail) => runningTotal + detail.expectQuantity,
        0
      );
      const totalOrderedQuantityInRequest = importRequestDetails.reduce(
        (runningTotal, detail) => runningTotal + detail.orderedQuantity,
        0
      );
      const totalActualQuantityInRequest = importRequestDetails.reduce(
        (runningTotal, detail) => runningTotal + detail.actualQuantity,
        0
      );

      // Tìm nhà cung cấp
      const provider = providerList.find(
        (provider) => provider.id === request.providerId
      );

      return {
        ...request,
        totalExpectQuantityInRequest,
        totalOrderedQuantityInRequest,
        totalActualQuantityInRequest,
        providerName: provider?.name || "",
      };
    });

    setImportRequestsData(formattedRequests);
  };

  // ========== EVENT HANDLERS ==========
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    updateFilter({ searchTerm: e.target.value });
  };

  const handleTableChange = (newPagination: TablePaginationConfig): void => {
    updateFilter({
      pagination: {
        ...newPagination,
        current: newPagination.current,
        pageSize: newPagination.pageSize,
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
  const columns = [
    {
      title: "Mã phiếu nhập",
      dataIndex: "importRequestId",
      key: "importRequestId",
      align: "left" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (importRequestId: string) => `#${importRequestId}`,
    },
    {
      title: "Ngày bắt đầu",
      dataIndex: "startDate",
      key: "startDate",
      align: "center" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      sorter: (a: ImportRequestData, b: ImportRequestData) => {
        const dateA = dayjs(a.startDate);
        const dateB = dayjs(b.startDate);
        return dateA.isBefore(dateB) ? -1 : dateA.isAfter(dateB) ? 1 : 0;
      },
      showSorterTooltip: {
        title: 'Sắp xếp theo ngày bắt đầu'
      },
      render: (startDate: string) => {
        const formattedStartDate = dayjs(startDate).format("DD-MM-YYYY");
        return <strong>{formattedStartDate}</strong>;
      },
    },
    {
      title: "Ngày hết hạn",
      dataIndex: "endDate",
      key: "endDate",
      align: "center" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      sorter: (a: ImportRequestData, b: ImportRequestData) => {
        if (!a.endDate && !b.endDate) return 0;
        if (!a.endDate) return 1; // null values go to end
        if (!b.endDate) return -1;
        const dateA = dayjs(a.endDate);
        const dateB = dayjs(b.endDate);
        return dateA.isBefore(dateB) ? -1 : dateA.isAfter(dateB) ? 1 : 0;
      },
      showSorterTooltip: {
        title: 'Sắp xếp theo ngày hết hạn'
      },
      render: (endDate: string) => {
        return endDate ? <strong>{dayjs(endDate).format("DD-MM-YYYY")}</strong> : <span className="text-gray-400">Không có</span>;
      },
    },
    {
      title: "Tổng dự nhập",
      dataIndex: "totalExpectQuantityInRequest",
      key: "totalExpectQuantityInRequest",
      align: "right" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (quantity: number) => <div className="text-base">{quantity || 0}</div>,
    },
    {
      title: "Tổng thực nhập",
      dataIndex: "totalActualQuantityInRequest",
      key: "totalActualQuantityInRequest",
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (actual: number, record: ImportRequestData) => {
        const expected = record.totalExpectQuantityInRequest || 0;
        const isEnough = actual >= expected;
        return (
          <div className="text-right">
            {actual === 0 ? (
              <span className="font-bold text-gray-600">Chưa nhập</span>
            ) : (
              <>
                <div className="text-base">{actual}</div>
                {/* {expected > 0 && (
                  <span className={`${isEnough ? 'text-green-600' : 'text-red-600'}`}>
                    {isEnough ? "" : `Thiếu ${expected - actual} trên dự nhập`}
                  </span>
                )} */}
              </>
            )}
          </div>
        );
      },
    },
    {
      title: "Tổng đã lên đơn",
      dataIndex: "totalOrderedQuantityInRequest",
      key: "totalOrderedQuantityInRequest",
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (ordered: number) => {
        return (
          <div className="text-right">
            {ordered === 0 ? (
              <span className="font-bold text-gray-600">Chưa lên đơn</span>
            ) : (
              <>
                <div className="text-base">{ordered}</div>
              </>
            )}
          </div>
        );
      },
    },
    {
      title: "Nhà cung cấp",
      dataIndex: "providerName",
      key: "providerName",
      align: "left" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      align: "center" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (status: string) => <StatusTag status={status} type="import" />,

    },
    {
      title: "Hành động",
      key: "action",
      align: "center" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (_: unknown, record: ImportRequestData) => (
        <div className="flex gap-3 justify-center">
          <Tooltip title="Xem chi tiết phiếu nhập" placement="top">
            <Link to={ROUTES.PROTECTED.IMPORT.REQUEST.DETAIL(record.importRequestId)}>
              <span className="inline-flex items-center justify-center rounded-full border-2 border-blue-900 text-blue-900 hover:bg-blue-100 hover:border-blue-700 hover:shadow-lg cursor-pointer" style={{ width: 32, height: 32 }}>
                <EyeOutlined style={{ fontSize: 20, fontWeight: 700 }} />
              </span>
            </Link>
          </Tooltip>
          <Tooltip title="Xem danh sách đơn nhập" placement="top">
            <Link to={ROUTES.PROTECTED.IMPORT.ORDER.LIST_FROM_REQUEST(record.importRequestId)}>
              <span className="inline-flex items-center justify-center rounded-full border-2 border-blue-900 bg-blue-900 text-white hover:bg-blue-700 hover:border-blue-700 hover:shadow-lg cursor-pointer" style={{ width: 32, height: 32 }}>
                <UnorderedListOutlined style={{ fontSize: 20, fontWeight: 700 }} />
              </span>
            </Link>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className={`mx-auto ImportRequestList`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Danh sách phiếu nhập</h1>
        <Link to={ROUTES.PROTECTED.IMPORT.REQUEST.CREATE}>
          <Button
            type="primary"
            id="btn-create"
            icon={<PlusOutlined />}
          >
            Tạo Phiếu Nhập
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="min-w-[240px]">
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
            onChange={(date) => updateFilter({
              selectedDate: date,
              pagination: { ...pagination, current: 1 }
            })}
            format="DD-MM-YYYY"
            className="min-w-[160px] !border-gray-400 [&_input::placeholder]:!text-gray-400"
            allowClear
          />

          <Select
            mode="multiple"
            placeholder="Tìm theo nhà cung cấp"
            className="min-w-[300px] text-black [&_.ant-select-selector]:!border-gray-400 [&_.ant-select-selection-placeholder]:!text-gray-400 [&_.ant-select-clear]:!text-lg [&_.ant-select-clear]:!flex [&_.ant-select-clear]:!items-center [&_.ant-select-clear]:!justify-center [&_.ant-select-clear_svg]:!w-5 [&_.ant-select-clear_svg]:!h-5"
            value={selectedProvider}
            onChange={(value) => updateFilter({
              selectedProvider: value,
              pagination: { ...pagination, current: 1 }
            })}
            allowClear
            maxTagCount="responsive"
            options={uniqueProviders.map(provider => ({ label: provider, value: provider }))}
          />
        </div>
      </div>

      <div className="mb-4 [&_.ant-tabs-nav]:!mb-0 [&_.ant-tabs-tab]:!bg-gray-200 [&_.ant-tabs-tab]:!transition-none [&_.ant-tabs-tab]:!font-bold [&_.ant-tabs-tab-active]:!bg-white [&_.ant-tabs-tab-active]:!border-1 [&_.ant-tabs-tab-active]:!border-gray-400 [&_.ant-tabs-tab-active]:!border-b-0 [&_.ant-tabs-tab-active]:!transition-none [&_.ant-tabs-tab-active]:!border-bottom-width-0 [&_.ant-tabs-tab-active]:!border-bottom-style-none [&_.ant-tabs-tab-active]:!font-bold [&_.ant-tabs-tab-active]:!text-[17px]">
        <div className="flex justify-between">
          <Tabs
            activeKey={selectedImportType}
            onChange={(value) => updateFilter({ selectedImportType: value })}
            type="card"
            size="middle"
            items={[
              {
                key: "ORDER",
                label: "Nhập hàng mới",
              },
              {
                key: "RETURN",
                label: "Nhập trả",
              }
            ]}
          />
          <Space size="large">
            {legendItems.filter(item => 
              ['near-time', 'in-progress', 'completed', 'cancelled'].includes(item.key)
            ).map((item) => (
              <LegendItem
                key={item.key}
                color={item.color}
                borderColor={item.borderColor}
                title={item.title}
                description={item.description}
                clickable={true}
                isSelected={selectedStatusFilter === item.key}
                onClick={() => handleStatusFilterClick(item.key)}
              />
            ))}
          </Space>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={filteredItems}
        rowKey="importRequestId"
        loading={loading}
        onChange={handleTableChange}
        rowClassName={(record) => {
          const isNearEnd = isNearEndDate(record.endDate) &&
            record.status !== 'COMPLETED' &&
            record.status !== 'CANCELLED';
          const statusClass = getStatusRowClass(record.status);

          // Priority: COMPLETED and CANCELLED > near end date > other status colors
          if (record.status === 'COMPLETED') {
            return `${statusClass} status-green`;
          }

          if (record.status === 'CANCELLED') {
            return `${statusClass} status-gray`;
          }

          if (isNearEnd) {
            return 'bg-[rgba(220,38,38,0.05)]';
          }

          // Add status-specific class for hover effects
          if (statusClass !== 'no-bg-row') {
            const statusType = record.status === 'NOT_STARTED'
              ? 'status-gray-light'
              : record.status === 'IN_PROGRESS'
                ? 'status-blue'
                : '';
            return `${statusClass} ${statusType}`;
          }

          return 'no-bg-row';
        }}
        className={`[&_.ant-table-cell]:!p-3 [&_.ant-table-thead_th.ant-table-column-has-sorters:hover]:!bg-transparent [&_.ant-table-thead_th.ant-table-column-has-sorters:active]:!bg-transparent [&_.ant-table-thead_th.ant-table-column-has-sorters]:!transition-none [&_.ant-table-tbody_td.ant-table-column-sort]:!bg-transparent ${importRequestsData.length > 0 ?
          '[&_.ant-table-tbody_tr:hover_td]:!bg-[rgba(220,38,38,0.08)] [&_.ant-table-tbody_tr.no-bg-row:hover_td]:!bg-gray-100 ' +
          '[&_.ant-table-tbody_tr.status-blue:hover_td]:!bg-[rgba(59,130,246,0.08)] ' +
          '[&_.ant-table-tbody_tr.status-gray-light:hover_td]:!bg-[rgba(107,114,128,0.10)] ' +
          '[&_.ant-table-tbody_tr.status-green:hover_td]:!bg-[rgba(34,197,94,0.08)] ' +
          '[&_.ant-table-tbody_tr.status-gray:hover_td]:!bg-[rgba(107,114,128,0.08)]'
          : ''}`}
        pagination={{
          ...pagination,
          total: filteredItems.length,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          locale: {
            items_per_page: "/ trang"
          },
          showTotal: (total: number) => `Tổng cộng có ${total} phiếu nhập${selectedStatusFilter ? ' (đã lọc)' : ''}`,
        }}
      />
    </div>
  );
};

export default ImportRequestList; 