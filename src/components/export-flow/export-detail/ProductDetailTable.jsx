import React from "react";
import { Table, Button, Tag } from "antd";
import { ExportStatus, AccountRole } from "@/utils/enums";
import PropTypes from "prop-types";
import { InfoCircleOutlined } from "@ant-design/icons";

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
}) => {
  const itemStatus = getItemStatus(exportRequestDetails);

  // Đếm số hàng đủ và thiếu
  const totalEnough = exportRequestDetails.filter(
    (d) => d.status !== "LACK"
  ).length;
  const totalLack = exportRequestDetails.filter(
    (d) => d.status === "LACK"
  ).length;

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
        columns={columns}
        dataSource={
          // Sắp xếp: Sản phẩm "LACK" lên đầu, sau đó các sản phẩm còn lại
          [...exportRequestDetails].sort((a, b) => {
            if (a.status === "LACK" && b.status !== "LACK") return -1;
            if (a.status !== "LACK" && b.status === "LACK") return 1;
            return 0;
          })
        }
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
};
export default ProductDetailTable;
