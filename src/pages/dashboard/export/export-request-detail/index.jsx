import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Table, Button, Card, Descriptions, Tag, Spin, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

// Hàm mô phỏng API lấy thông tin phiếu xuất theo id
const simulateFetchExportRequestById = (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Ví dụ: mô phỏng một phiếu xuất có exportType là "RETURN"
      resolve({
        exportRequestId: id,
        exportType: "RETURN", // có thể là "RETURN", "USE", "LOAN"
        exportDate: "2025-03-20T00:00:00Z",
        supplierReceiver: { id: 1, name: "Nhà cung cấp A" },
        returnManager: { id: 2, name: "Người phụ trách B" },
        importReference: { id: 1, name: "Phiếu nhập #1001" },
        returnReason: "Hỏng hóc, sai mẫu",
        receivingDepartment: null,
        receivingManager: null,
        productionOrder: null,
        usagePurpose: null,
        borrower: null,
        loanManager: null,
        loanExpiry: null,
        loanReason: null,
        note: "Ghi chú phiếu xuất trả nhà sản xuất",
      });
    }, 500);
  });
};

// Hàm mô phỏng API lấy danh sách chi tiết phiếu xuất (các sản phẩm)
const simulateFetchExportRequestDetails = (id, page, pageSize) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Dữ liệu giả cho các sản phẩm (vật liệu may mặc)
      const allItems = [
        {
          itemId: 1,
          itemName: "Vải cotton",
          requiredQuantity: 100,
          stockQuantity: 200,
          unit: "m",
        },
        {
          itemId: 2,
          itemName: "Chỉ may",
          requiredQuantity: 50,
          stockQuantity: 100,
          unit: "cuộn",
        },
        {
          itemId: 3,
          itemName: "Nút áo",
          requiredQuantity: 200,
          stockQuantity: 300,
          unit: "cái",
        },
      ];
      const total = allItems.length;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const content = allItems.slice(startIndex, endIndex);
      resolve({
        content,
        metaDataDTO: {
          page,
          limit: pageSize,
          total,
        },
      });
    }, 500);
  });
};

const ExportRequestDetail = () => {
  const { exportRequestId } = useParams();
  const navigate = useNavigate();
  const [exportRequest, setExportRequest] = useState(null);
  const [exportRequestDetails, setExportRequestDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Lấy thông tin phiếu xuất
  const fetchExportRequestData = useCallback(async () => {
    if (!exportRequestId) return;
    try {
      setLoading(true);
      const data = await simulateFetchExportRequestById(
        parseInt(exportRequestId)
      );
      setExportRequest(data);
    } catch (error) {
      console.error("Failed to fetch export request:", error);
      message.error("Không thể tải thông tin phiếu xuất");
    } finally {
      setLoading(false);
    }
  }, [exportRequestId]);

  // Hàm fetch danh sách chi tiết phiếu xuất không dùng pagination trong dependency
  const fetchExportRequestDetails = async (
    page = pagination.current,
    pageSize = pagination.pageSize
  ) => {
    if (!exportRequestId) return;
    try {
      setDetailsLoading(true);
      const response = await simulateFetchExportRequestDetails(
        parseInt(exportRequestId),
        page,
        pageSize
      );
      if (response && response.content) {
        setExportRequestDetails(response.content);
        // Cập nhật pagination nếu cần
        setPagination((prev) => {
          if (
            prev.total !== response.metaDataDTO.total ||
            prev.current !== response.metaDataDTO.page ||
            prev.pageSize !== response.metaDataDTO.limit
          ) {
            return {
              current: response.metaDataDTO.page,
              pageSize: response.metaDataDTO.limit,
              total: response.metaDataDTO.total,
            };
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Failed to fetch export request details:", error);
      message.error("Không thể tải danh sách chi tiết phiếu xuất");
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchExportRequestData();
  }, [fetchExportRequestData]);

  // Chỉ gọi fetchExportRequestDetails khi exportRequestId thay đổi (và gọi lại khi pagination thay đổi qua handleTableChange)
  useEffect(() => {
    fetchExportRequestDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportRequestId]);

  // Hàm chuyển đổi exportType sang mô tả
  const getExportTypeText = (type) => {
    const typeMap = {
      RETURN: "Xuất trả nhà sản xuất",
      USE: "Xuất nội bộ",
      LOAN: "Xuất mượn",
    };
    return typeMap[type] || type;
  };

  // Render thông tin phiếu xuất dựa vào exportType
  const renderDescriptionItems = () => {
    if (!exportRequest) return null;
    const items = [
      <Descriptions.Item label="Mã phiếu xuất" key="exportId">
        #{exportRequest.exportRequestId}
      </Descriptions.Item>,
      <Descriptions.Item label="Loại phiếu xuất" key="exportType">
        {getExportTypeText(exportRequest.exportType)}
      </Descriptions.Item>,
      <Descriptions.Item label="Ngày xuất" key="exportDate">
        {exportRequest.exportDate
          ? new Date(exportRequest.exportDate).toLocaleDateString("vi-VN")
          : "-"}
      </Descriptions.Item>,
    ];

    if (exportRequest.exportType === "RETURN") {
      items.push(
        <Descriptions.Item
          label="Nhà cung cấp nhận hàng trả về"
          key="supplierReceiver"
        >
          {exportRequest.supplierReceiver?.name || "-"}
        </Descriptions.Item>,
        <Descriptions.Item label="Người phụ trách trả hàng" key="returnManager">
          {exportRequest.returnManager?.name || "-"}
        </Descriptions.Item>,
        <Descriptions.Item label="Phiếu nhập tham chiếu" key="importReference">
          {exportRequest.importReference?.name || "-"}
        </Descriptions.Item>,
        <Descriptions.Item label="Lý do trả hàng" key="returnReason" span={2}>
          {exportRequest.returnReason || "-"}
        </Descriptions.Item>
      );
    } else if (exportRequest.exportType === "USE") {
      items.push(
        <Descriptions.Item
          label="Bộ phận/phân xưởng nhận hàng"
          key="receivingDepartment"
        >
          {exportRequest.receivingDepartment?.name || "-"}
        </Descriptions.Item>,
        <Descriptions.Item
          label="Người phụ trách nhận hàng"
          key="receivingManager"
        >
          {exportRequest.receivingManager || "-"}
        </Descriptions.Item>,
        <Descriptions.Item label="Lệnh sản xuất" key="productionOrder">
          {exportRequest.productionOrder || "-"}
        </Descriptions.Item>,
        <Descriptions.Item label="Mục đích sử dụng" key="usagePurpose" span={2}>
          {exportRequest.usagePurpose || "-"}
        </Descriptions.Item>
      );
    } else if (exportRequest.exportType === "LOAN") {
      items.push(
        <Descriptions.Item label="Người/Bộ phận mượn hàng" key="borrower">
          {exportRequest.borrower || "-"}
        </Descriptions.Item>,
        <Descriptions.Item label="Người phụ trách" key="loanManager">
          {exportRequest.loanManager?.name || "-"}
        </Descriptions.Item>,
        <Descriptions.Item label="Thời hạn mượn" key="loanExpiry">
          {exportRequest.loanExpiry
            ? new Date(exportRequest.loanExpiry).toLocaleDateString("vi-VN")
            : "-"}
        </Descriptions.Item>,
        <Descriptions.Item label="Lý do mượn" key="loanReason" span={2}>
          {exportRequest.loanReason || "-"}
        </Descriptions.Item>
      );
    }

    items.push(
      <Descriptions.Item label="Ghi chú" key="note" span={3}>
        {exportRequest.note || "-"}
      </Descriptions.Item>
    );

    return items;
  };

  // Định nghĩa các cột cho bảng chi tiết sản phẩm xuất
  const columns = [
    {
      title: "Mã sản phẩm",
      dataIndex: "itemId",
      key: "itemId",
      render: (id) => `#${id}`,
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "itemName",
      key: "itemName",
      ellipsis: true,
    },
    {
      title: "Số lượng cần",
      dataIndex: "requiredQuantity",
      key: "requiredQuantity",
    },
    {
      title: "Số lượng tồn kho",
      dataIndex: "stockQuantity",
      key: "stockQuantity",
    },
    {
      title: "Số lượng dự tồn",
      key: "projectedQuantity",
      render: (_, record) => record.stockQuantity - record.requiredQuantity,
    },
    {
      title: "Đơn vị tính",
      dataIndex: "unit",
      key: "unit",
    },
  ];

  const handleTableChange = (pag) => {
    setPagination({
      ...pagination,
      current: pag.current,
      pageSize: pag.pageSize,
    });
    fetchExportRequestDetails(pag.current, pag.pageSize);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading && !exportRequest) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="mx-auto p-5">
      <div className="flex items-center mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          className="mr-4"
        >
          Quay lại
        </Button>
        <h1 className="text-xl font-bold m-0">
          Chi tiết phiếu xuất #{exportRequest?.exportRequestId}
        </h1>
      </div>

      <Card className="mb-6">
        <Descriptions title="Thông tin phiếu xuất" bordered>
          {renderDescriptionItems()}
        </Descriptions>
      </Card>

      <h2 className="text-lg font-semibold mb-4">
        Danh sách chi tiết sản phẩm xuất
      </h2>
      <Table
        columns={columns}
        dataSource={exportRequestDetails}
        rowKey="itemId"
        loading={detailsLoading}
        onChange={handleTableChange}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ["10", "50"],
          showTotal: (total) => `Tổng cộng ${total} sản phẩm`,
        }}
      />
    </div>
  );
};

export default ExportRequestDetail;
