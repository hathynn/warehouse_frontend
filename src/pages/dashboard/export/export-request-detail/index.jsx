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
import useExportRequestService from "../../../../hooks/useExportRequestService";
import useExportRequestDetailService from "../../../../hooks/useExportRequestDetailService";
import useItemService from "../../../../hooks/useItemService";
import useRoleService from "../../../../hooks/useRoleService"; // Import thêm cho warehouse keeper
import { useSelector } from "react-redux";

const ExportRequestDetail = () => {
  const { exportRequestId } = useParams();
  const navigate = useNavigate();
  const { getExportRequestById, assignWarehouseKeeper } =
    useExportRequestService();
  const { getExportRequestDetails } = useExportRequestDetailService();
  const { getItemById } = useItemService();
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

  // --- Warehouse Keeper assignment state ---
  const [warehouseKeeperModalVisible, setWarehouseKeeperModalVisible] =
    useState(false);
  const [warehouseKeeperSearch, setWarehouseKeeperSearch] = useState("");
  const [warehouseKeepers, setWarehouseKeepers] = useState([]);
  const [selectedWarehouseKeeper, setSelectedWarehouseKeeper] = useState(null);

  // Hàm lấy thông tin phiếu xuất
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

  // Hàm "enrich" danh sách chi tiết sản phẩm bằng cách lấy itemName từ API
  const enrichDetails = async (details) => {
    const enriched = await Promise.all(
      details.map(async (detail) => {
        try {
          const res = await getItemById(detail.itemId);
          const itemName =
            res && res.content ? res.content.name : "Không xác định";
          return { ...detail, itemName };
        } catch (error) {
          console.error(`Error fetching item with id ${detail.itemId}:`, error);
          return { ...detail, itemName: "Không xác định" };
        }
      })
    );
    return enriched;
  };

  const fetchDetails = async (
    page = pagination.current,
    pageSize = pagination.pageSize
  ) => {
    if (!exportRequestId) return;
    try {
      setDetailsLoading(true);
      const response = await getExportRequestDetails(
        parseInt(exportRequestId),
        page,
        pageSize
      );
      if (response && response.content) {
        const enriched = await enrichDetails(response.content);
        setExportRequestDetails(enriched);
        const meta = response.metaDataDTO;
        setPagination({
          current: meta ? meta.page : page,
          pageSize: meta ? meta.limit : pageSize,
          total: meta ? meta.total : 0,
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

  useEffect(() => {
    fetchDetails();
  }, []);

  const getExportTypeText = (type) => {
    if (type === "PRODUCTION") return "Xuất sản xuất";
    return "";
  };

  const renderDescriptionItems = () => {
    if (!exportRequest) return null;
    const items = [
      <Descriptions.Item label="Mã phiếu xuất" key="exportId">
        #{exportRequest.exportRequestId}
      </Descriptions.Item>,
      <Descriptions.Item label="Ngày xuất" key="exportDate">
        {exportRequest.exportDate
          ? new Date(exportRequest.exportDate).toLocaleDateString("vi-VN")
          : "-"}
      </Descriptions.Item>,
      <Descriptions.Item label="Người lập phiếu" key="createdBy">
        {exportRequest.createdBy || "-"}
      </Descriptions.Item>,
    ];

    if (exportRequest.type === "PRODUCTION") {
      items.push(
        <Descriptions.Item label="Loại phiếu xuất" key="exportType">
          {getExportTypeText(exportRequest.type)}
        </Descriptions.Item>,
        <Descriptions.Item label="Phòng ban" key="receivingDepartment">
          {exportRequest.departmentId || "-"}
        </Descriptions.Item>,
        <Descriptions.Item label="Người nhận hàng" key="receiverName">
          {exportRequest.receiverName || "-"}
        </Descriptions.Item>,
        <Descriptions.Item label="Số điện thoại nhận hàng" key="receiverPhone">
          {exportRequest.receiverPhone || "-"}
        </Descriptions.Item>,
        <Descriptions.Item label="Lý do xuất" key="exportReason">
          {exportRequest.exportReason || "-"}
        </Descriptions.Item>
      );
    } else if (exportRequest.type === "BORROWING") {
      if (exportRequest.receiverAddress) {
        items.push(
          <Descriptions.Item label="Loại phiếu xuất" key="exportType">
            Xuất mượn (bên ngoài)
          </Descriptions.Item>,
          <Descriptions.Item label="Tên công ty/Người mượn" key="receiverName">
            {exportRequest.receiverName || "-"}
          </Descriptions.Item>,
          <Descriptions.Item label="Số điện thoại" key="receiverPhone">
            {exportRequest.receiverPhone || "-"}
          </Descriptions.Item>,
          <Descriptions.Item label="Địa chỉ" key="receiverAddress">
            {exportRequest.receiverAddress || "-"}
          </Descriptions.Item>,
          <Descriptions.Item label="Lý do mượn" key="exportReason">
            {exportRequest.exportReason || "-"}
          </Descriptions.Item>
        );
      } else {
        items.push(
          <Descriptions.Item label="Loại phiếu xuất" key="exportType">
            Xuất mượn (nội bộ)
          </Descriptions.Item>,
          <Descriptions.Item label="Người nhận hàng" key="receiverName">
            {exportRequest.receiverName || "-"}
          </Descriptions.Item>,
          <Descriptions.Item
            label="Số điện thoại nhận hàng"
            key="receiverPhone"
          >
            {exportRequest.receiverPhone || "-"}
          </Descriptions.Item>,
          <Descriptions.Item label="Lý do mượn" key="exportReason">
            {exportRequest.exportReason || "-"}
          </Descriptions.Item>
        );
      }
      if (exportRequest.expectedReturnDate) {
        items.push(
          <Descriptions.Item label="Ngày trả dự kiến" key="expectedReturnDate">
            {new Date(exportRequest.expectedReturnDate).toLocaleDateString(
              "vi-VN"
            )}
          </Descriptions.Item>
        );
      }
    }

    // Hiển thị thông tin nhân viên kho (nếu có)
    items.push(
      <Descriptions.Item label="Người kiểm kho" key="warehouseKeeper">
        {exportRequest.assignedWareHouseKeeperId || "-"}
      </Descriptions.Item>
    );

    items.push(
      <Descriptions.Item label="Ghi chú" key="note" span={3}>
        {exportRequest.note || "-"}
      </Descriptions.Item>
    );
    return items;
  };

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
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Số lượng đã kiểm đếm",
      dataIndex: "actualQuantity",
      key: "actualQuantity",
    },
    {
      title: "Quy cách",
      dataIndex: "measurementValue",
      key: "measurementValue",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => status || "-",
    },
  ];

  const handleTableChange = (pag) => {
    setPagination({
      ...pagination,
      current: pag.current,
      pageSize: pag.pageSize,
    });
    fetchDetails(pag.current, pag.pageSize);
  };

  const handleBack = () => {
    navigate(-1);
  };

  // --- Các hàm liên quan đến Warehouse Keeper ---
  const fetchWarehouseKeepers = async () => {
    try {
      const accounts = await getAccountsByRole({ role: "STAFF" });
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
        message.success("Phân công nhân viên kho thành công");
      }
    } catch (error) {
      console.error("Error assigning warehouse keeper:", error);
      message.error("Phân công nhân viên kho thất bại");
    }
  };

  const filteredWarehouseKeepers = warehouseKeepers.filter(
    (wk) =>
      wk.fullName.toLowerCase().includes(warehouseKeeperSearch.toLowerCase()) ||
      wk.email.toLowerCase().includes(warehouseKeeperSearch.toLowerCase())
  );

  const user = useSelector((state) => state.user);

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

      {/* Phần phân công Warehouse Keeper */}
      {user?.role === "ROLE_WAREHOUSE_MANAGER" && (
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
              <Tag color="blue">
                {selectedWarehouseKeeper.id} -{" "}
                {selectedWarehouseKeeper.fullName}
              </Tag>
            </div>
          )}
        </div>
      )}

      <h2 className="text-lg font-semibold mb-4">
        Danh sách chi tiết sản phẩm xuất
      </h2>
      <Table
        columns={columns}
        dataSource={exportRequestDetails}
        rowKey="id"
        loading={detailsLoading}
        onChange={handleTableChange}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ["10", "50"],
          showTotal: (total) => `Tổng cộng ${total} sản phẩm`,
        }}
      />

      {/* Modal chọn Warehouse Keeper */}
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

export default ExportRequestDetail;

// import React, { useState, useEffect, useCallback } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { Table, Button, Card, Descriptions, Spin, message } from "antd";
// import { ArrowLeftOutlined } from "@ant-design/icons";
// import useExportRequestService from "../../../../hooks/useExportRequestService";
// import useExportRequestDetailService from "../../../../hooks/useExportRequestDetailService";
// import useItemService from "../../../../hooks/useItemService";

// const ExportRequestDetail = () => {
//   const { exportRequestId } = useParams();
//   const navigate = useNavigate();
//   const { getExportRequestById } = useExportRequestService();
//   const { getExportRequestDetails } = useExportRequestDetailService();
//   const { getItemById } = useItemService();

//   const [exportRequest, setExportRequest] = useState(null);
//   const [exportRequestDetails, setExportRequestDetails] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [detailsLoading, setDetailsLoading] = useState(false);
//   const [pagination, setPagination] = useState({
//     current: 1,
//     pageSize: 10,
//     total: 0,
//   });

//   // Hàm lấy dữ liệu phiếu xuất từ API
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

//   // Hàm "enrich" danh sách chi tiết bằng cách lấy itemName từ API getItemById
//   const enrichDetails = async (details) => {
//     const enriched = await Promise.all(
//       details.map(async (detail) => {
//         try {
//           const res = await getItemById(detail.itemId);
//           const itemName =
//             res && res.content ? res.content.name : "Không xác định";
//           return { ...detail, itemName };
//         } catch (error) {
//           console.error(`Error fetching item with id ${detail.itemId}:`, error);
//           return { ...detail, itemName: "Không xác định" };
//         }
//       })
//     );
//     return enriched;
//   };

//   const fetchDetails = async (
//     page = pagination.current,
//     pageSize = pagination.pageSize
//   ) => {
//     if (!exportRequestId) return;
//     try {
//       setDetailsLoading(true);
//       const response = await getExportRequestDetails(
//         parseInt(exportRequestId),
//         page,
//         pageSize
//       );
//       if (response && response.content) {
//         const enriched = await enrichDetails(response.content);
//         setExportRequestDetails(enriched);
//         const meta = response.metaDataDTO;
//         setPagination({
//           current: meta ? meta.page : page,
//           pageSize: meta ? meta.limit : pageSize,
//           total: meta ? meta.total : 0,
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

//   useEffect(() => {
//     fetchDetails();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // Hàm chuyển đổi loại phiếu xuất sang mô tả hiển thị
//   const getExportTypeText = (type) => {
//     if (type === "PRODUCTION") return "Xuất sản xuất";
//     // Với BORROWING không hiển thị loại phiếu xuất
//     return "";
//   };

//   // Render thông tin phiếu xuất
//   const renderDescriptionItems = () => {
//     if (!exportRequest) return null;
//     const items = [
//       <Descriptions.Item label="Mã phiếu xuất" key="exportId">
//         #{exportRequest.exportRequestId}
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

//     if (exportRequest.type === "PRODUCTION") {
//       items.push(
//         <Descriptions.Item label="Loại phiếu xuất" key="exportType">
//           {getExportTypeText(exportRequest.type)}
//         </Descriptions.Item>,
//         <Descriptions.Item label="Phòng ban" key="receivingDepartment">
//           {exportRequest.departmentId || "-"}
//         </Descriptions.Item>,
//         <Descriptions.Item label="Người nhận hàng" key="receiverName">
//           {exportRequest.receiverName || "-"}
//         </Descriptions.Item>,
//         <Descriptions.Item label="Số điện thoại nhận hàng" key="receiverPhone">
//           {exportRequest.receiverPhone || "-"}
//         </Descriptions.Item>,
//         <Descriptions.Item label="Lý do xuất" key="exportReason">
//           {exportRequest.exportReason || "-"}
//         </Descriptions.Item>
//       );
//     } else if (exportRequest.type === "BORROWING") {
//       // Với phiếu xuất mượn, không hiển thị loại phiếu xuất
//       if (exportRequest.receiverAddress) {
//         // Mượn bên ngoài
//         items.push(
//           <Descriptions.Item label="Loại phiếu xuất" key="exportType">
//             Xuất muợn (bên ngoài)
//           </Descriptions.Item>,
//           <Descriptions.Item label="Tên công ty/Người mượn" key="receiverName">
//             {exportRequest.receiverName || "-"}
//           </Descriptions.Item>,
//           <Descriptions.Item label="Số điện thoại" key="receiverPhone">
//             {exportRequest.receiverPhone || "-"}
//           </Descriptions.Item>,
//           <Descriptions.Item label="Địa chỉ" key="receiverAddress">
//             {exportRequest.receiverAddress || "-"}
//           </Descriptions.Item>,
//           <Descriptions.Item label="Lý do mượn" key="exportReason">
//             {exportRequest.exportReason || "-"}
//           </Descriptions.Item>
//         );
//       } else {
//         // Mượn nội bộ
//         items.push(
//           <Descriptions.Item label="Loại phiếu xuất" key="exportType">
//             Xuất muợn (nội bộ)
//           </Descriptions.Item>,
//           <Descriptions.Item label="Người nhận hàng" key="receiverName">
//             {exportRequest.receiverName || "-"}
//           </Descriptions.Item>,
//           <Descriptions.Item
//             label="Số điện thoại nhận hàng"
//             key="receiverPhone"
//           >
//             {exportRequest.receiverPhone || "-"}
//           </Descriptions.Item>,
//           <Descriptions.Item label="Lý do mượn" key="exportReason">
//             {exportRequest.exportReason || "-"}
//           </Descriptions.Item>
//         );
//       }
//       if (exportRequest.expectedReturnDate) {
//         items.push(
//           <Descriptions.Item label="Ngày trả dự kiến" key="expectedReturnDate">
//             {new Date(exportRequest.expectedReturnDate).toLocaleDateString(
//               "vi-VN"
//             )}
//           </Descriptions.Item>
//         );
//       }
//     }

//     items.push(
//       <Descriptions.Item label="Ghi chú" key="note" span={3}>
//         {exportRequest.note || "-"}
//       </Descriptions.Item>
//     );
//     return items;
//   };

//   // Định nghĩa cột cho bảng chi tiết sản phẩm xuất (sử dụng itemName đã được enrich)
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
//       dataIndex: "quantity",
//       key: "quantity",
//     },
//     {
//       title: "Số lượng đã kiểm đếm",
//       dataIndex: "actualQuantity",
//       key: "actualQuantity",
//     },
//     {
//       title: "Quy cách",
//       dataIndex: "measurementValue",
//       key: "measurementValue",
//     },
//     {
//       title: "Trạng thái",
//       dataIndex: "status",
//       key: "status",
//       render: (status) => status || "-",
//     },
//   ];

//   const handleTableChange = (pag) => {
//     setPagination({
//       ...pagination,
//       current: pag.current,
//       pageSize: pag.pageSize,
//     });
//     fetchDetails(pag.current, pag.pageSize);
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

//       <h2 className="text-lg font-semibold mb-4">
//         Danh sách chi tiết sản phẩm xuất
//       </h2>
//       <Table
//         columns={columns}
//         dataSource={exportRequestDetails}
//         rowKey="id"
//         loading={detailsLoading}
//         onChange={handleTableChange}
//         pagination={{
//           current: pagination.current,
//           pageSize: pagination.pageSize,
//           total: pagination.total,
//           showSizeChanger: true,
//           pageSizeOptions: ["10", "50"],
//           showTotal: (total) => `Tổng cộng ${total} sản phẩm`,
//         }}
//       />
//     </div>
//   );
// };

// export default ExportRequestDetail;
