import React, { useState } from "react";
import { Table, Button, Tag } from "antd";
import { InputNumber, Popconfirm, Tooltip } from "antd";
import { ExportStatus, AccountRole } from "@/utils/enums";
import PropTypes from "prop-types";
import { InfoCircleOutlined } from "@ant-design/icons";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

// Hàm getItemStatus nằm trong component này luôn
const getItemStatus = (details = []) => {
  if (!details || details.length === 0) return null;
  return details.some((d) => d.status === "LACK") ? "LACK" : "ENOUGH";
};

const ProductDetailTable = ({
  columns,
  exportRequestDetails,
  detailsLoading,
  pagination,
  handleTableChange,
  userRole,
  exportRequest,
  setConfirmModalVisible,
  editMode,
  setEditMode,
  editedDetails,
  setEditedDetails,
  creating,
  onCancelCreateExport,
  onConfirmCreateExport,
}) => {
  const itemStatus = getItemStatus(exportRequestDetails);

  // Đếm số hàng đủ và thiếu
  const totalEnough = exportRequestDetails.filter(
    (d) => d.status !== "LACK"
  ).length;
  const totalLack = exportRequestDetails.filter(
    (d) => d.status === "LACK"
  ).length;

  const handleQuantityChange = (value, recordId) => {
    setEditedDetails((prev) =>
      prev.map((item) =>
        item.id === recordId ? { ...item, quantity: value } : item
      )
    );
  };

  const handleDeleteRow = (recordId) => {
    setEditedDetails((prev) => prev.filter((item) => item.id !== recordId));
  };

  const actionColumn = {
    title: "Hành động",
    key: "action",
    width: 80,
    render: (_, record) =>
      record.status === "LACK" ? (
        <Popconfirm
          title="Bạn có chắc muốn xoá dòng này không?"
          onConfirm={() => handleDeleteRow(record.id)}
          okText="Xoá"
          cancelText="Hủy"
        >
          <Tooltip title="Xoá dòng">
            <DeleteOutlined style={{ color: "#ff4d4f", cursor: "pointer" }} />
          </Tooltip>
        </Popconfirm>
      ) : null,
  };

  const editableColumns = [
    ...columns.map((col) => {
      if (editMode && col.dataIndex === "quantity") {
        return {
          ...col,
          render: (text, record) =>
            record.status === "LACK" ? (
              <InputNumber
                min={1}
                value={record.quantity}
                onChange={(val) => handleQuantityChange(val, record.id)}
                style={{ width: 80, textAlign: "right" }}
              />
            ) : (
              <div style={{ textAlign: "right" }}>{text}</div>
            ),
        };
      }
      return col;
    }),
    ...(editMode ? [actionColumn] : []),
  ];

  return (
    <>
      <h2 className="text-lg font-semibold mb-3 mt-[20px] flex items-center">
        <span className="mr-15">Danh sách chi tiết sản phẩm xuất</span>
        {userRole === AccountRole.WAREHOUSE_MANAGER &&
          exportRequest?.status === ExportStatus.COUNTED && (
            <Button type="primary" onClick={() => setConfirmModalVisible(true)}>
              Xác nhận kiểm đếm
            </Button>
          )}

        {/* Hiện nút "Tạo phiếu xuất mới" nếu có LACK và chưa ở chế độ edit */}
        {!editMode &&
          userRole === AccountRole.DEPARTMENT &&
          exportRequest?.status === ExportStatus.COUNT_CONFIRMED &&
          exportRequestDetails.some((item) => item.status === "LACK") && (
            <Button
              type="primary"
              onClick={() => {
                setEditMode(true);
                setEditedDetails(
                  exportRequestDetails.map((item) => ({ ...item }))
                );
              }}
            >
              Tạo phiếu xuất mới
            </Button>
          )}

        {/* Khi đang edit thì chỉ hiện 2 nút xác nhận/hủy */}
        {editMode && (
          <>
            <Button
              type="primary"
              loading={creating}
              style={{ marginRight: 8 }}
              onClick={onConfirmCreateExport}
            >
              Xác nhận tạo phiếu
            </Button>
            <Button danger onClick={onCancelCreateExport} disabled={creating}>
              Hủy tạo phiếu
            </Button>
          </>
        )}
      </h2>
      {[
        ExportStatus.COUNTED,
        ExportStatus.COUNT_CONFIRMED,
        ExportStatus.WAITING_EXPORT,
        ExportStatus.CONFIRMED,
        ExportStatus.COMPLETED,
        ExportStatus.CANCELLED,
      ].includes(exportRequest?.status) && (
        <div
          className="mb-4"
          style={{
            background: "#e6f7ff",
            border: "1px solid #91d5ff",
            borderRadius: 8,
            padding: "16px 24px",
            marginBottom: 24,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: 8 }}
          >
            <InfoCircleOutlined
              style={{ color: "#1890ff", fontSize: 17, marginRight: 8 }}
            />
            <span style={{ fontWeight: 600, fontSize: 15 }}>
              Thông tin sản phẩm xuất
            </span>
          </div>

          {/* Trạng thái hàng: chỉ hiện với WAREHOUSE_MANAGER ở status COUNTED */}
          {exportRequest?.status === ExportStatus.COUNTED &&
            userRole === AccountRole.WAREHOUSE_MANAGER && (
              <div className="mb-2">
                <span style={{ fontWeight: 500, marginRight: 8 }}>
                  Trạng thái hàng:{" "}
                </span>
                {itemStatus === "LACK" ? (
                  <Tag color="error">Thiếu</Tag>
                ) : itemStatus === "ENOUGH" ? (
                  <Tag color="success">Đủ</Tag>
                ) : null}
              </div>
            )}

          <div className="flex gap-8 items-center">
            <span>
              Tổng số hàng: <span>{exportRequestDetails.length}</span>
            </span>
            <span>
              Tổng số hàng đủ: <span>{totalEnough}</span>
            </span>
            <span>
              Tổng số hàng thiếu:{" "}
              <span style={{ color: "#ff4d4f", fontWeight: 500 }}>
                {totalLack}
              </span>
            </span>
          </div>
        </div>
      )}

      <Table
        columns={editMode ? editableColumns : columns}
        dataSource={(editMode ? editedDetails : exportRequestDetails)
          .slice()
          .sort((a, b) => {
            if (a.status === "LACK" && b.status !== "LACK") return -1;
            if (a.status !== "LACK" && b.status === "LACK") return 1;
            return 0;
          })}
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
    </>
  );
};

ProductDetailTable.propTypes = {
  columns: PropTypes.array.isRequired,
  exportRequestDetails: PropTypes.array.isRequired,
  detailsLoading: PropTypes.bool.isRequired,
  pagination: PropTypes.shape({
    current: PropTypes.number.isRequired,
    pageSize: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
  }).isRequired,
  handleTableChange: PropTypes.func.isRequired,
  userRole: PropTypes.string.isRequired,
  exportRequest: PropTypes.shape({
    status: PropTypes.string,
  }),
  setConfirmModalVisible: PropTypes.func.isRequired,
  editMode: PropTypes.bool,
  setEditMode: PropTypes.func,
  editedDetails: PropTypes.array,
  setEditedDetails: PropTypes.func,
  creating: PropTypes.bool,
  onCancelCreateExport: PropTypes.func,
  onConfirmCreateExport: PropTypes.func,
};

export default ProductDetailTable;
