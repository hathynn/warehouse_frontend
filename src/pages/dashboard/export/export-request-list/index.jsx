import React, { useState, useEffect } from "react";
import { Table, Button, Input, Tabs, Select } from "antd";
import { Link } from "react-router-dom";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import { ROUTES } from "@/constants/routes";
import useExportRequestService from "../../../../hooks/useExportRequestService";
import { useSelector } from "react-redux";
import StatusTag from "@/components/commons/StatusTag";

const tabStatusMap = {
  ALL: null,
  WAITING_CONFIRM: ["IN_PROGRESS", "COUNTED", "COUNT_CONFIRMED"],
  WAITING_DELIVERY: ["WAITING_EXPORT", "EXTENDED"],
  COMPLETED: ["COMPLETED"],
  CANCELLED: ["CANCELLED"],
};

const exportTypeOptions = [
  { value: "PRODUCTION", label: "Xuất sản xuất" },
  { value: "BORROWING", label: "Xuất mượn" },
  { value: "RETURN", label: "Xuất trả nhà cung cấp" },
  { value: "LIQUIDATION", label: "Xuất thanh lý" },
  { value: "PARTIAL", label: "Xuất một phần" },
];

const ExportRequestList = () => {
  const [selectedExportTypes, setSelectedExportTypes] = useState([]); // Thêm dòng này
  const [exportRequests, setExportRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedStatusTab, setSelectedStatusTab] = useState("ALL");

  const { getExportRequestsByPage, loading } = useExportRequestService();
  const user = useSelector((state) => state.user);

  useEffect(() => {
    fetchExportRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize]);

  const fetchExportRequests = async () => {
    try {
      const response = await getExportRequestsByPage(
        pagination.current,
        pagination.pageSize
      );
      if (response && response.content) {
        let mappedRequests = response.content.map((item) => ({
          id: String(item.exportRequestId),
          exportDate: item.exportDate,
          createdBy: item.createdBy ? item.createdBy : "anonymousUser",
          receiverName: item.receiverName,
          exportType: item.type,
          status: item.status,
          createdDate: item.createdDate,
        }));
        mappedRequests = mappedRequests.sort(
          (a, b) => new Date(b.createdDate) - new Date(a.createdDate)
        );
        setExportRequests(mappedRequests);
      }
      if (response && response.metaDataDTO) {
        setPagination({
          current: response.metaDataDTO.page,
          pageSize: response.metaDataDTO.limit,
          total: response.metaDataDTO.total,
        });
      }
    } catch (error) {
      console.error("Failed to fetch export requests:", error);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (pag) => {
    setPagination({
      ...pagination,
      current: pag.current,
      pageSize: pag.pageSize,
    });
  };

  const getExportTypeText = (type) => {
    switch (type) {
      case "RETURN":
        return "Xuất trả nhà cung cấp";
      case "PRODUCTION":
        return "Xuất sản xuất";
      case "BORROWING":
        return "Xuất mượn";
      default:
        return type;
    }
  };

  // Lọc danh sách theo tab status và search
  const filteredItems = exportRequests.filter((item) => {
    const idStr = item.id ? item.id.toString() : "";
    const matchesSearch = idStr
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    // Nếu tab là ALL thì không lọc status
    const matchesStatus =
      selectedStatusTab === "ALL"
        ? true
        : tabStatusMap[selectedStatusTab]?.includes(item.status);

    // Filter theo exportType (nếu có chọn)
    const matchesExportType =
      selectedExportTypes.length === 0
        ? true
        : selectedExportTypes.includes(item.exportType);

    return matchesSearch && matchesStatus && matchesExportType;
  });

  const columns = [
    {
      title: "Mã phiếu xuất",
      dataIndex: "id",
      key: "id",
      render: (id) => `#${id}`,
      width: "15%",
    },
    {
      title: "Ngày xuất",
      dataIndex: "exportDate",
      key: "exportDate",
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
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
      title: "Loại xuất",
      dataIndex: "exportType",
      key: "exportType",
      render: (type) => getExportTypeText(type),
    },
    {
      title: "Trạng thái phiếu",
      dataIndex: "status",
      key: "status",
      render: (status) => <StatusTag status={status} type="export" />,
    },
    {
      title: "Chi tiết",
      key: "detail",
      render: (text, record) => (
        <Link to={ROUTES.PROTECTED.EXPORT.REQUEST.DETAIL(record.id)}>
          <Button
            id="btn-detail"
            className="!p-2 !text-white !font-bold !bg-blue-900 hover:!bg-blue-500"
            type="link"
          >
            Xem chi tiết
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="mx-auto">
      <h1 className="text-xl font-bold mb-4">Danh sách phiếu xuất</h1>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-3 items-center">
          <Input
            placeholder="Tìm kiếm theo mã phiếu xuất"
            value={searchTerm}
            onChange={handleSearchChange}
            prefix={<SearchOutlined />}
            className="w-64" // hoặc "min-w-[180px] max-w-xs"
          />
          <Select
            mode="multiple"
            placeholder="Loại xuất"
            className="w-64"
            value={selectedExportTypes}
            onChange={setSelectedExportTypes}
            allowClear
            maxTagCount="responsive"
            options={exportTypeOptions}
          />
        </div>
        {user?.role === "ROLE_DEPARTMENT" && (
          <Link to={ROUTES.PROTECTED.EXPORT.REQUEST.CREATE}>
            <Button type="primary" id="btn-create" icon={<PlusOutlined />}>
              Tạo Phiếu Xuất
            </Button>
          </Link>
        )}
      </div>

      <Tabs
        activeKey={selectedStatusTab}
        onChange={(key) => {
          setSelectedStatusTab(key);
          setPagination((prev) => ({ ...prev, current: 1 }));
        }}
        type="card"
        className="mb-4 [&_.ant-tabs-nav]:!mb-0 [&_.ant-tabs-tab]:!bg-gray-200 [&_.ant-tabs-tab]:!transition-none [&_.ant-tabs-tab]:!font-bold [&_.ant-tabs-tab-active]:!bg-white [&_.ant-tabs-tab-active]:!border-1 [&_.ant-tabs-tab-active]:!border-gray-400 [&_.ant-tabs-tab-active]:!border-b-0 [&_.ant-tabs-tab-active]:!transition-none [&_.ant-tabs-tab-active]:!border-bottom-width-0 [&_.ant-tabs-tab-active]:!border-bottom-style-none [&_.ant-tabs-tab-active]:!font-bold [&_.ant-tabs-tab-active]:!text-[17px]"
        items={[
          {
            key: "ALL",
            label: "Tất cả",
          },
          {
            key: "WAITING_CONFIRM",
            label: "Chờ xác nhận",
          },
          {
            key: "WAITING_DELIVERY",
            label: "Chờ giao hàng",
          },
          {
            key: "COMPLETED",
            label: "Đã xuất kho",
          },
          {
            key: "CANCELLED",
            label: "Đã hủy",
          },
        ]}
      />

      <Table
        columns={columns}
        dataSource={filteredItems}
        rowKey="id"
        className="custom-table mb-4"
        loading={loading}
        onChange={handleTableChange}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: filteredItems.length, // CHỈNH CHỖ NÀY!
          showSizeChanger: true,
          pageSizeOptions: ["10", "50"],
          showTotal: (total) =>
            total > 0 ? `Tổng cộng có ${total} phiếu xuất` : false,
        }}
      />
    </div>
  );
};

export default ExportRequestList;
