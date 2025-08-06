import React, { useState, useEffect } from "react";
import { Table, Button, Input, Tooltip, TablePaginationConfig, Space } from "antd";
import { Link } from "react-router-dom";
import { SearchOutlined, PlusOutlined, EyeOutlined } from "@ant-design/icons";
import { ROUTES } from "@/constants/routes";
import useStockCheckService, { StockCheckRequestResponse } from "@/services/useStockCheckService";
import useAccountService from "@/services/useAccountService";
import { useSelector } from "react-redux";
import StatusTag from "@/components/commons/StatusTag";
import { RootState } from "@/contexts/redux/store";
import dayjs from "dayjs";
import { LegendItem } from "@/components/commons/LegendItem";
import { StockCheckRequestFilterState, useStockCheckRequestFilter } from "@/hooks/useStockCheckRequestFilter";

const StockCheckRequestList: React.FC = () => {
    // ========== FILTER STATES ==========
    const { filterState, updateFilter } = useStockCheckRequestFilter();
    const {
        searchTerm,
        selectedStatusFilter,
        pagination
    } = filterState as StockCheckRequestFilterState;

    // ========== DATA STATES ==========
    const [stockCheckRequestsData, setStockCheckRequestsData] = useState<StockCheckRequestResponse[]>([]);
    const [warehouseKeeperNames, setWarehouseKeeperNames] = useState<Record<number, string>>({});

    // ========== SERVICES ==========
    const { getAllStockCheckRequests, loading } = useStockCheckService();
    const { findAccountById } = useAccountService();

    // ========== UTILITY FUNCTIONS ==========
    const user = useSelector((state: RootState) => state.user);

    const getStatusRowClass = (status: string): string => {
        switch (status) {
            case 'NOT_STARTED':
                return 'bg-[rgba(107,114,128,0.12)]'; // Gray with opacity
            case 'IN_PROGRESS':
            case 'COUNTED':
            case 'COUNT_CONFIRMED':
                return 'bg-[rgba(59,130,246,0.06)]'; // Blue with opacity for in progress
            case 'CONFIRMED':
                return 'bg-[rgba(251,191,36,0.08)]'; // Yellow with opacity for confirmed
            case 'COMPLETED':
                return 'bg-[rgba(34,197,94,0.08)]'; // Green with opacity
            case 'CANCELLED':
                return 'bg-[rgba(239,68,68,0.08)]'; // Red with opacity
            default:
                return 'no-bg-row';
        }
    };

    // ========== EFFECTS ==========
    useEffect((): void => {
        fetchStockCheckRequests();
    }, []);

    useEffect(() => {
        // Lấy các warehouseKeeperId khác null/undefined
        const warehouseKeeperIds = Array.from(
            new Set(
                stockCheckRequestsData
                    ?.map(r => r.assignedWareHouseKeeperId)
                    .filter(Boolean) as number[]
            )
        );

        const fetchWarehouseKeeperNames = async () => {
            const result: Record<number, string> = {};
            for (const id of warehouseKeeperIds) {
                try {
                    const res = await findAccountById(id);
                    result[id] = res?.fullName || "Không xác định";
                } catch {
                    result[id] = "Không xác định";
                }
            }
            setWarehouseKeeperNames(result);
        };

        if (warehouseKeeperIds.length) {
            fetchWarehouseKeeperNames();
        }
    }, [stockCheckRequestsData]);

    const fetchStockCheckRequests = async (): Promise<void> => {
        const response = await getAllStockCheckRequests();
        setStockCheckRequestsData(response.content);
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
    const filteredItems = stockCheckRequestsData?.filter((item) => {
        const idStr = item.id ? item.id.toString() : "";
        const matchesSearch = idStr
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        // Filter theo status
        let matchesStatusFilter = true;
        switch (selectedStatusFilter) {
            case "NOT_STARTED":
                matchesStatusFilter = item.status === "NOT_STARTED";
                break;
            case "IN_PROGRESS_GROUP":
                matchesStatusFilter = item.status === "IN_PROGRESS" ||
                    item.status === "COUNTED" ||
                    item.status === "COUNT_CONFIRMED";
                break;
            case "CONFIRMED":
                matchesStatusFilter = item.status === "CONFIRMED";
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

        return matchesSearch && matchesStatusFilter;
    });

    const columns = [
        {
            title: "Mã phiếu kiểm kho",
            dataIndex: "id",
            key: "id",
            render: (id: string) => `#${id}`,
            width: "15%",
        },
        {
            title: "Ngày tạo phiếu",
            dataIndex: "createdDate",
            key: "createdDate",
            align: "center" as "center",
            render: (date: string) => dayjs(date).format("DD-MM-YYYY"),
        },
        {
            title: "Ngày bắt đầu",
            width: "13%",
            dataIndex: "startDate",
            key: "startDate",
            align: "center" as "center",
            render: (date: string) => dayjs(date).format("DD-MM-YYYY"),
        },
        {
            title: "Ngày mong muốn hoàn thành",
            dataIndex: "expectedCompletedDate",
            key: "expectedCompletedDate",
            width: "17%",
            align: "center" as "center",
            render: (date: string) => dayjs(date).format("DD-MM-YYYY"),
        },
        {
            title: "Người kiểm kê",
            dataIndex: "assignedWareHouseKeeperId",
            key: "assignedWareHouseKeeperId",
            align: "center" as "center",
            render: (warehouseKeeperId: number) => {
                return warehouseKeeperId ? (warehouseKeeperNames[warehouseKeeperId] || "—") : "Chưa phân công";
            }
        },

        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            align: "center" as "center",
            width: 200,
            render: (status: string) => <StatusTag status={status} type="stockcheck" />,
        },
        {
            title: "Chi tiết",
            key: "detail",
            align: "center" as "center",
            render: (text: string, record: StockCheckRequestResponse) => (
                <div className="flex gap-3 justify-center">
                    <Tooltip title="Xem chi tiết phiếu kiểm kho" placement="top">
                        <Link to={ROUTES.PROTECTED.STOCK_CHECK.REQUEST.DETAIL(record.id)}>
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
                <h1 className="text-2xl font-bold">Danh sách phiếu kiểm kho</h1>
                {user?.role === "ROLE_DEPARTMENT" && (
                    <Link to={ROUTES.PROTECTED.STOCK_CHECK.REQUEST.CREATE}>
                        <Button
                            type="primary"
                            id="btn-create"
                            icon={<PlusOutlined />}
                        >
                            Tạo Phiếu Kiểm Kho
                        </Button>
                    </Link>
                )}
            </div>

            <div className="flex items-center justify-between mb-3">
                <div className="flex flex-wrap gap-2 items-center">
                    <div className="min-w-[300px]">
                        <Input
                            placeholder="Tìm theo mã phiếu kiểm kho"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            prefix={<SearchOutlined />}
                            className="!border-gray-400 [&_input::placeholder]:!text-gray-400"
                        />
                    </div>
                </div>
            </div>

            <div className="mb-4">
                <div className="flex justify-end">
                    <Space size="large">
                        <LegendItem
                            color="rgba(107, 114, 128, 0.1)"
                            borderColor="rgba(107, 114, 128, 0.5)"
                            title="Chưa bắt đầu"
                            description="Phiếu kiểm kho chưa bắt đầu"
                            clickable={true}
                            isSelected={selectedStatusFilter === 'NOT_STARTED'}
                            onClick={() => handleStatusFilterClick('NOT_STARTED')}
                        />
                        <LegendItem
                            color="rgba(59, 130, 246, 0.1)"
                            borderColor="rgba(59, 130, 246, 0.5)"
                            title="Đang tiến hành"
                            description="Phiếu kiểm kho đang được thực hiện"
                            clickable={true}
                            isSelected={selectedStatusFilter === 'IN_PROGRESS_GROUP'}
                            onClick={() => handleStatusFilterClick('IN_PROGRESS_GROUP')}
                        />
                        <LegendItem
                            color="rgba(251, 191, 36, 0.1)"
                            borderColor="rgba(251, 191, 36, 0.5)"
                            title="Đã xác nhận"
                            description="Phiếu kiểm kho đã được xác nhận"
                            clickable={true}
                            isSelected={selectedStatusFilter === 'CONFIRMED'}
                            onClick={() => handleStatusFilterClick('CONFIRMED')}
                        />
                        <LegendItem
                            color="rgba(34, 197, 94, 0.1)"
                            borderColor="rgba(34, 197, 94, 0.5)"
                            title="Đã hoàn tất"
                            description="Phiếu kiểm kho đã hoàn tất"
                            clickable={true}
                            isSelected={selectedStatusFilter === 'COMPLETED'}
                            onClick={() => handleStatusFilterClick('COMPLETED')}
                        />
                        <LegendItem
                            color="rgba(239, 68, 68, 0.1)"
                            borderColor="rgba(239, 68, 68, 0.5)"
                            title="Đã hủy"
                            description="Phiếu kiểm kho đã bị hủy"
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
                rowKey="id"
                className={`[&_.ant-table-cell]:!p-3 [&_.ant-table-thead_th.ant-table-column-has-sorters:hover]:!bg-transparent [&_.ant-table-thead_th.ant-table-column-has-sorters:active]:!bg-transparent [&_.ant-table-thead_th.ant-table-column-has-sorters]:!transition-none [&_.ant-table-tbody_td.ant-table-column-sort]:!bg-transparent ${stockCheckRequestsData?.length > 0 ?
                    '[&_.ant-table-tbody_tr:hover_td]:!bg-gray-100 [&_.ant-table-tbody_tr.no-bg-row:hover_td]:!bg-gray-100 ' +
                    '[&_.ant-table-tbody_tr.status-gray:hover_td]:!bg-[rgba(107,114,128,0.08)] ' +
                    '[&_.ant-table-tbody_tr.status-blue:hover_td]:!bg-[rgba(59,130,246,0.08)] ' +
                    '[&_.ant-table-tbody_tr.status-yellow:hover_td]:!bg-[rgba(251,191,36,0.10)] ' +
                    '[&_.ant-table-tbody_tr.status-green:hover_td]:!bg-[rgba(34,197,94,0.08)] ' +
                    '[&_.ant-table-tbody_tr.status-red:hover_td]:!bg-[rgba(239,68,68,0.08)]'
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
                        return `${statusClass} status-red`;
                    }

                    // Add status-specific class for hover effects
                    if (statusClass !== 'no-bg-row') {
                        const statusType =
                            record.status === 'NOT_STARTED'
                                ? 'status-gray'
                                : (record.status === 'IN_PROGRESS' || record.status === 'COUNTED' || record.status === 'COUNT_CONFIRMED')
                                    ? 'status-blue'
                                    : record.status === 'CONFIRMED'
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
                    showTotal: (total: number) => `Tổng cộng có ${total} phiếu kiểm kho${selectedStatusFilter ? ' (đã lọc)' : ''}`,
                }}
            />
        </div>
    );
};

export default StockCheckRequestList;