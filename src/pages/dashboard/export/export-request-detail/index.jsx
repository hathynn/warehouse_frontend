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
import { ArrowLeftOutlined, UserAddOutlined } from "@ant-design/icons";
import useExportRequestService from "../../../../hooks/useExportRequestService";
import useExportRequestDetailService from "../../../../hooks/useExportRequestDetailService";
import useItemService from "../../../../hooks/useItemService";
import useRoleService from "../../../../hooks/useRoleService"; // Import thêm cho warehouse keeper
import { useSelector } from "react-redux";
import useAccountService from "@/hooks/useAccountService";

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

  // --- State và hooks cho phân công nhân viên kho ---
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [assigningStaff, setAssigningStaff] = useState(false);
  const [staffs, setStaffs] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [assignedStaff, setAssignedStaff] = useState(null);

  const { findAccountById } = useAccountService(); // Lấy chi tiết nhân viên đã phân công

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

  // --- Các hàm xử lý phân công ---
  const fetchActiveStaffs = async () => {
    try {
      setLoadingStaff(true);
      const accounts = await getAccountsByRole({ role: "STAFF" });
      setStaffs(accounts.filter((a) => a.status === "ACTIVE"));
    } catch (error) {
      message.error("Không thể lấy danh sách nhân viên kho");
      console.error("Error fetching active staffs:", error);
    } finally {
      setLoadingStaff(false);
    }
  };

  const openAssignModal = () => {
    setSelectedStaffId(null);
    fetchActiveStaffs();
    setAssignModalVisible(true);
  };

  const closeAssignModal = () => {
    setAssignModalVisible(false);
    setSelectedStaffId(null);
  };

  const handleSelectStaff = (id) => {
    setSelectedStaffId(id);
  };

  const handleConfirmAssign = async () => {
    if (!selectedStaffId || !exportRequest?.exportRequestId) {
      return message.warning("Vui lòng chọn nhân viên kho trước khi xác nhận");
    }
    try {
      setAssigningStaff(true);
      await assignWarehouseKeeper(
        exportRequest.exportRequestId,
        selectedStaffId
      );
      await fetchExportRequestData();
      message.success("Phân công nhân viên kho thành công");
      closeAssignModal();
    } catch {
      message.error("Phân công nhân viên kho thất bại");
    } finally {
      setAssigningStaff(false);
    }
  };

  // Lấy chi tiết nhân viên đã phân công (để hiển thị)
  const fetchAssignedStaff = useCallback(async () => {
    if (!exportRequest?.assignedWareHouseKeeperId) return;
    const account = await findAccountById(
      exportRequest.assignedWareHouseKeeperId
    );
    setAssignedStaff(account);
  }, [exportRequest?.assignedWareHouseKeeperId, findAccountById]);

  useEffect(() => {
    fetchExportRequestData();
  }, []);

  useEffect(() => {
    fetchDetails();
  }, []);

  useEffect(() => {
    if (exportRequest?.assignedWareHouseKeeperId) {
      fetchAssignedStaff();
    }
  }, [exportRequest?.assignedWareHouseKeeperId]);

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
        {assignedStaff?.fullName || "-"}
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
      title: "Số lượng đã đóng gói",
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
        {user?.role === "ROLE_WAREHOUSE_MANAGER" && (
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={openAssignModal}
          >
            Phân công nhân viên
          </Button>
        )}
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
        title="Phân công nhân viên kho"
        visible={assignModalVisible}
        onCancel={closeAssignModal}
        footer={[
          <Button key="cancel" onClick={closeAssignModal}>
            Đóng
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleConfirmAssign}
            loading={assigningStaff}
            disabled={!selectedStaffId}
          >
            Xác nhận
          </Button>,
        ]}
        width={700}
      >
        {loadingStaff ? (
          <div className="flex justify-center items-center py-8">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            dataSource={staffs}
            rowKey="id"
            pagination={false}
            columns={[
              { title: "Họ tên", dataIndex: "fullName", key: "fullName" },
              { title: "Số điện thoại", dataIndex: "phone", key: "phone" },
              {
                title: "Trạng thái",
                dataIndex: "status",
                key: "status",
                render: (status) => {
                  const map = {
                    ACTIVE: { color: "green", text: "Hoạt động" },
                    INACTIVE: { color: "red", text: "Không hoạt động" },
                  };
                  const info = map[status] || {
                    color: "default",
                    text: status,
                  };
                  return <Tag color={info.color}>{info.text}</Tag>;
                },
              },
              {
                title: "Thao tác",
                key: "action",
                render: (_, record) => (
                  <Button
                    type={selectedStaffId === record.id ? "primary" : "default"}
                    size="small"
                    onClick={() => handleSelectStaff(record.id)}
                  >
                    {selectedStaffId === record.id ? "Đã chọn" : "Chọn"}
                  </Button>
                ),
              },
            ]}
          />
        )}
      </Modal>
    </div>
  );
};

export default ExportRequestDetail;
