import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Card,
  Descriptions,
  Spin,
  message,
  Input,
  Modal,
  Tag,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import useExportRequestService from "@/hooks/useExportRequestService";
import useRoleService from "@/hooks/useRoleService";

// Giữ nguyên fake API cho chi tiết phiếu xuất
const simulateFetchExportRequestDetails = (id, page, pageSize) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const allItems = [
        {
          itemId: 1,
          itemName: "Laptop",
          requiredQuantity: 10,
          stockQuantity: 10,
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

const ExportRequestDetailManager = () => {
  const { exportRequestId } = useParams();
  const navigate = useNavigate();
  const { getExportRequestById, assignWarehouseKeeper } =
    useExportRequestService();
  const { getAccountsByRole } = useRoleService();

  const [exportRequest, setExportRequest] = useState(null);
  const [exportRequestDetails, setExportRequestDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // State cho Modal Warehouse Keeper
  const [warehouseKeeperModalVisible, setWarehouseKeeperModalVisible] =
    useState(false);
  const [warehouseKeeperSearch, setWarehouseKeeperSearch] = useState("");
  const [warehouseKeepers, setWarehouseKeepers] = useState([]);
  const [selectedWarehouseKeeper, setSelectedWarehouseKeeper] = useState(null);

  // Fetch thông tin phiếu xuất thật sử dụng service
  const fetchExportRequestData = useCallback(async () => {
    if (!exportRequestId) return;
    try {
      setLoading(true);
      const data = await getExportRequestById(parseInt(exportRequestId));
      setExportRequest(data);
    } catch (error) {
      console.error("Failed to fetch export request:", error);
      message.error("Không thể tải thông tin phiếu xuất");
    } finally {
      setLoading(false);
    }
  }, [exportRequestId, getExportRequestById]);

  // Fetch danh sách chi tiết phiếu xuất (vẫn dùng fake API)
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
  }, []);

  // Chỉ gọi lại fetchExportRequestDetails khi exportRequestId thay đổi
  useEffect(() => {
    fetchExportRequestDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hàm chuyển đổi exportType sang mô tả (chỉ xử lý USE)
  const getExportTypeText = (type) => {
    const typeMap = {
      USE: "Xuất sử dụng (nội bộ)",
    };
    return typeMap[type] || type;
  };

  // Render thông tin phiếu xuất cho loại USE
  const renderDescriptionItems = () => {
    if (!exportRequest) return null;
    const items = [
      <Descriptions.Item label="Mã phiếu xuất" key="exportId">
        #{exportRequest.exportRequestId}
      </Descriptions.Item>,
      <Descriptions.Item label="Loại phiếu xuất" key="exportType">
        {getExportTypeText(exportRequest.type)}
      </Descriptions.Item>,
      <Descriptions.Item label="Ngày xuất" key="exportDate">
        {exportRequest.exportDate
          ? new Date(exportRequest.exportDate).toLocaleDateString("vi-VN")
          : "-"}
      </Descriptions.Item>,
      <Descriptions.Item label="Người lập phiếu" key="createdBy">
        {exportRequest.createdBy || "-"}
      </Descriptions.Item>,
      <Descriptions.Item label="Người kiểm kho" key="assignedWareHouseKeeperId">
        {exportRequest.assignedWareHouseKeeperId || "-"}
      </Descriptions.Item>,
    ];

    // Vì hiện tại chỉ làm cho xuất USE
    if (exportRequest.type === "USE") {
      items.push(
        <Descriptions.Item label="Người nhận hàng" key="receiverName">
          {exportRequest.receiverName || "-"}
        </Descriptions.Item>,
        <Descriptions.Item label="Địa chỉ nhận hàng" key="receiverAddress">
          {exportRequest.receiverAddress || "-"}
        </Descriptions.Item>,
        <Descriptions.Item label="Số điện thoại nhận hàng" key="receiverPhone">
          {exportRequest.receiverPhone || "-"}
        </Descriptions.Item>,
        <Descriptions.Item label="Lý do xuất" key="exportReason">
          {exportRequest.exportReason || "-"}
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

  // Định nghĩa cột cho bảng chi tiết sản phẩm xuất
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

  // --- Các hàm liên quan đến Modal Warehouse Keeper ---
  const fetchWarehouseKeepers = async () => {
    try {
      const accounts = await getAccountsByRole({ role: "WAREHOUSE_KEEPER" });
      setWarehouseKeepers(accounts);
    } catch (error) {
      console.error("Error fetching warehouse keepers:", error);
      message.error("Không thể lấy danh sách nhân viên kho");
    }
  };

  const openWarehouseKeeperModal = () => {
    fetchWarehouseKeepers();
    setWarehouseKeeperSearch("");
    setWarehouseKeeperModalVisible(true);
  };

  const handleWarehouseKeeperSelect = (wk) => {
    setSelectedWarehouseKeeper(wk);
    setWarehouseKeeperModalVisible(false);
  };

  const filteredWarehouseKeepers = warehouseKeepers.filter(
    (wk) =>
      wk.fullName.toLowerCase().includes(warehouseKeeperSearch.toLowerCase()) ||
      wk.email.toLowerCase().includes(warehouseKeeperSearch.toLowerCase())
  );

  // Hàm gọi API phân công warehouse keeper
  const handleConfirmAssign = async () => {
    if (!selectedWarehouseKeeper || !exportRequest?.exportRequestId) {
      message.error("Vui lòng chọn nhân viên kho trước khi xác nhận");
      return;
    }
    try {
      const updatedRequest = await assignWarehouseKeeper(
        exportRequest.exportRequestId,
        selectedWarehouseKeeper.id
      );
      if (updatedRequest) {
        setExportRequest(updatedRequest);
      }
    } catch (error) {
      console.error("Error assigning warehouse keeper:", error);
    }
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
      <br />
      {/* Phân công người kiểm kho với modal và nút xác nhận */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">Phân công người kiểm kho:</h2>
          <Button type="default" onClick={openWarehouseKeeperModal}>
            Chọn nhân viên kho
          </Button>
          <Button
            type="primary"
            onClick={handleConfirmAssign}
            disabled={!selectedWarehouseKeeper}
          >
            Xác nhận
          </Button>
        </div>
        {selectedWarehouseKeeper && (
          <div className="mt-2">
            <Tag color="blue">{selectedWarehouseKeeper.fullName}</Tag>
          </div>
        )}
      </div>

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

      {/* Modal Warehouse Keeper */}
      <Modal
        title="Chọn Warehouse Keeper"
        visible={warehouseKeeperModalVisible}
        onCancel={() => setWarehouseKeeperModalVisible(false)}
        footer={null}
      >
        <Input
          placeholder="Tìm kiếm theo tên hoặc email"
          value={warehouseKeeperSearch}
          onChange={(e) => setWarehouseKeeperSearch(e.target.value)}
          style={{ marginBottom: 12 }}
        />
        {filteredWarehouseKeepers.map((wk) => (
          <div
            key={wk.id}
            className="cursor-pointer p-2 hover:bg-gray-100 border-b"
            onClick={() => handleWarehouseKeeperSelect(wk)}
          >
            <div className="font-semibold">{wk.fullName}</div>
            <div className="text-sm text-gray-500">{wk.email}</div>
          </div>
        ))}
      </Modal>
    </div>
  );
};

export default ExportRequestDetailManager;
// import React, { useState, useEffect, useCallback } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { Table, Button, Card, Descriptions, Tag, Spin, message } from "antd";
// import { ArrowLeftOutlined } from "@ant-design/icons";
// import useExportRequestService from "@/hooks/useExportRequestService";

// // Giữ nguyên fake API cho chi tiết phiếu xuất
// const simulateFetchExportRequestDetails = (id, page, pageSize) => {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       const allItems = [
//         {
//           itemId: 1,
//           itemName: "Laptop",
//           requiredQuantity: 10,
//           stockQuantity: 10,
//           unit: "cái",
//         },
//       ];
//       const total = allItems.length;
//       const startIndex = (page - 1) * pageSize;
//       const endIndex = startIndex + pageSize;
//       const content = allItems.slice(startIndex, endIndex);
//       resolve({
//         content,
//         metaDataDTO: {
//           page,
//           limit: pageSize,
//           total,
//         },
//       });
//     }, 500);
//   });
// };

// const ExportRequestDetailManager = () => {
//   const { exportRequestId } = useParams();
//   const navigate = useNavigate();
//   const { getExportRequestById } = useExportRequestService();
//   const [exportRequest, setExportRequest] = useState(null);
//   const [exportRequestDetails, setExportRequestDetails] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [detailsLoading, setDetailsLoading] = useState(false);
//   const [pagination, setPagination] = useState({
//     current: 1,
//     pageSize: 10,
//     total: 0,
//   });

//   // Fetch thông tin phiếu xuất thật sử dụng service
//   const fetchExportRequestData = useCallback(async () => {
//     if (!exportRequestId) return;
//     try {
//       setLoading(true);
//       const data = await getExportRequestById(parseInt(exportRequestId));
//       setExportRequest(data);
//     } catch (error) {
//       console.error("Failed to fetch export request:", error);
//       message.error("Không thể tải thông tin phiếu xuất");
//     } finally {
//       setLoading(false);
//     }
//   }, [exportRequestId, getExportRequestById]);

//   // Fetch danh sách chi tiết phiếu xuất (vẫn dùng fake API)
//   const fetchExportRequestDetails = async (
//     page = pagination.current,
//     pageSize = pagination.pageSize
//   ) => {
//     if (!exportRequestId) return;
//     try {
//       setDetailsLoading(true);
//       const response = await simulateFetchExportRequestDetails(
//         parseInt(exportRequestId),
//         page,
//         pageSize
//       );
//       if (response && response.content) {
//         setExportRequestDetails(response.content);
//         setPagination((prev) => {
//           if (
//             prev.total !== response.metaDataDTO.total ||
//             prev.current !== response.metaDataDTO.page ||
//             prev.pageSize !== response.metaDataDTO.limit
//           ) {
//             return {
//               current: response.metaDataDTO.page,
//               pageSize: response.metaDataDTO.limit,
//               total: response.metaDataDTO.total,
//             };
//           }
//           return prev;
//         });
//       }
//     } catch (error) {
//       console.error("Failed to fetch export request details:", error);
//       message.error("Không thể tải danh sách chi tiết phiếu xuất");
//     } finally {
//       setDetailsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchExportRequestData();
//   }, []);

//   // Chỉ gọi lại fetchExportRequestDetails khi exportRequestId thay đổi
//   useEffect(() => {
//     fetchExportRequestDetails();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // Hàm chuyển đổi exportType sang mô tả (chỉ xử lý USE)
//   const getExportTypeText = (type) => {
//     const typeMap = {
//       USE: "Xuất sử dụng (nội bộ)",
//     };
//     return typeMap[type] || type;
//   };

//   // Render thông tin phiếu xuất cho loại USE
//   const renderDescriptionItems = () => {
//     if (!exportRequest) return null;
//     const items = [
//       <Descriptions.Item label="Mã phiếu xuất" key="exportId">
//         #{exportRequest.exportRequestId}
//       </Descriptions.Item>,
//       <Descriptions.Item label="Loại phiếu xuất" key="exportType">
//         {getExportTypeText(exportRequest.type)}
//       </Descriptions.Item>,
//       <Descriptions.Item label="Ngày xuất" key="exportDate">
//         {exportRequest.exportDate
//           ? new Date(exportRequest.exportDate).toLocaleDateString("vi-VN")
//           : "-"}
//       </Descriptions.Item>,
//       <Descriptions.Item label="Người lập phiếu" key="createdBy">
//         {exportRequest.createdBy || "-"}
//       </Descriptions.Item>,
//     ];

//     // Vì hiện tại chỉ làm cho xuất USE
//     if (exportRequest.type === "USE") {
//       items.push(
//         <Descriptions.Item label="Người nhận hàng" key="receiverName">
//           {exportRequest.receiverName || "-"}
//         </Descriptions.Item>,
//         <Descriptions.Item label="Địa chỉ nhận hàng" key="receiverAddress">
//           {exportRequest.receiverAddress || "-"}
//         </Descriptions.Item>,
//         <Descriptions.Item label="Số điện thoại nhận hàng" key="receiverPhone">
//           {exportRequest.receiverPhone || "-"}
//         </Descriptions.Item>,
//         <Descriptions.Item label="Lý do xuất" key="exportReason">
//           {exportRequest.exportReason || "-"}
//         </Descriptions.Item>
//       );
//     }

//     items.push(
//       <Descriptions.Item label="Ghi chú" key="note" span={3}>
//         {exportRequest.note || "-"}
//       </Descriptions.Item>
//     );

//     return items;
//   };

//   // Định nghĩa cột cho bảng chi tiết sản phẩm xuất
//   const columns = [
//     {
//       title: "Mã sản phẩm",
//       dataIndex: "itemId",
//       key: "itemId",
//       render: (id) => `#${id}`,
//     },
//     {
//       title: "Tên sản phẩm",
//       dataIndex: "itemName",
//       key: "itemName",
//       ellipsis: true,
//     },
//     {
//       title: "Số lượng cần",
//       dataIndex: "requiredQuantity",
//       key: "requiredQuantity",
//     },
//     {
//       title: "Số lượng tồn kho",
//       dataIndex: "stockQuantity",
//       key: "stockQuantity",
//     },
//     {
//       title: "Số lượng dự tồn",
//       key: "projectedQuantity",
//       render: (_, record) => record.stockQuantity - record.requiredQuantity,
//     },
//     {
//       title: "Đơn vị tính",
//       dataIndex: "unit",
//       key: "unit",
//     },
//   ];

//   const handleTableChange = (pag) => {
//     setPagination({
//       ...pagination,
//       current: pag.current,
//       pageSize: pag.pageSize,
//     });
//     fetchExportRequestDetails(pag.current, pag.pageSize);
//   };

//   const handleBack = () => {
//     navigate(-1);
//   };

//   if (loading && !exportRequest) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <Spin size="large" />
//       </div>
//     );
//   }

//   return (
//     <div className="mx-auto p-5">
//       <div className="flex items-center mb-4">
//         <Button
//           icon={<ArrowLeftOutlined />}
//           onClick={handleBack}
//           className="mr-4"
//         >
//           Quay lại
//         </Button>
//         <h1 className="text-xl font-bold m-0">
//           Chi tiết phiếu xuất #{exportRequest?.exportRequestId}
//         </h1>
//       </div>
//       <Card className="mb-6">
//         <Descriptions title="Thông tin phiếu xuất" bordered>
//           {renderDescriptionItems()}
//         </Descriptions>
//       </Card>
//       <br />
//       <h2 className="text-lg font-semibold mb-4">Phân công người kiểm kho:</h2>

//       <h2 className="text-lg font-semibold mb-4">
//         Danh sách chi tiết sản phẩm xuất
//       </h2>
//       <Table
//         columns={columns}
//         dataSource={exportRequestDetails}
//         rowKey="itemId"
//         loading={detailsLoading}
//         onChange={handleTableChange}
//         pagination={{
//           ...pagination,
//           showSizeChanger: true,
//           pageSizeOptions: ["10", "50"],
//           showTotal: (total) => `Tổng cộng ${total} sản phẩm`,
//         }}
//       />
//     </div>
//   );
// };

// export default ExportRequestDetailManager;
