import React from "react";
import PropTypes from "prop-types";
import { Modal, Table, Tag, Checkbox } from "antd";

const StockCheckConfirmationModal = ({
  visible,
  onCancel,
  onConfirm,
  title,
  checkboxText,
  confirmChecked,
  setConfirmChecked,
  allStockCheckDetails,
  modalPagination,
  setModalPagination,
  viewedPages,
  setViewedPages,
  hasViewedAllPages,
  loading = false,
}) => {
  const getSortedProducts = () => {
    if (!allStockCheckDetails || allStockCheckDetails.length === 0) {
      return [];
    }

    // Tách riêng items LACK và MATCH/EXCESS
    const lackItems = allStockCheckDetails.filter(
      (item) => item.status === "LACK"
    );
    const enoughItems = allStockCheckDetails.filter(
      (item) => item.status !== "LACK"
    );

    return [...lackItems, ...enoughItems];
  };

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      onOk={onConfirm}
      title={<span style={{ fontWeight: 700, fontSize: "18px" }}>{title}</span>}
      okText="Xác nhận"
      cancelText="Quay lại"
      width={1000}
      centered
      okButtonProps={{
        disabled: !confirmChecked || !hasViewedAllPages(),
        loading: loading,
      }}
    >
      <div className="mb-1 font-semibold">
        Tổng đã kiểm kê: {allStockCheckDetails.length} sản phẩm
      </div>

      <div className="mb-4 font-semibold">
        Tổng thiếu:{" "}
        <span className="text-red-600">
          {allStockCheckDetails.filter((d) => d.status === "LACK").length}
        </span>{" "}
        sản phẩm
      </div>

      <div style={{ fontSize: "16px" }} className="mb-2 font-bold">
        Danh sách tất cả sản phẩm kiểm kê:
      </div>

      <Table
        dataSource={getSortedProducts()}
        rowKey="id"
        style={{ height: "500px", overflowY: "auto" }}
        pagination={
          allStockCheckDetails.length > 10
            ? {
                current: modalPagination.current,
                pageSize: modalPagination.pageSize,
                total: allStockCheckDetails.length,
                onChange: (page) => {
                  setModalPagination({
                    current: page,
                    pageSize: 10,
                    total: allStockCheckDetails.length,
                  });
                  setViewedPages((prev) => new Set([...prev, page]));
                },
                showSizeChanger: false,
                showQuickJumper: false,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} sản phẩm`,
              }
            : false
        }
        size="small"
        className="mb-4"
        columns={[
          {
            title: "Mã sản phẩm",
            dataIndex: "itemId",
            key: "itemId",
            width: "16%",
          },
          {
            title: "Số lượng cần kiểm",
            dataIndex: "quantity",
            key: "quantity",
            width: 140,
            align: "left",
            render: (text, record) => (
              <span>
                <span style={{ fontWeight: "600", fontSize: "16px" }}>
                  {text}
                </span>{" "}
                {record.unitType && (
                  <span className="text-gray-500">{record.unitType}</span>
                )}
              </span>
            ),
          },
          {
            title: "Số lượng đã kiểm",
            dataIndex: "actualQuantity",
            key: "actualQuantity",
            width: 150,
            align: "left",
            render: (text, record) => {
              const isLacking = text < record.quantity;
              const isExcess = text > record.quantity;

              return (
                <span
                  className={
                    isLacking
                      ? "text-red-600 font-semibold"
                      : isExcess
                      ? "text-orange-600 font-semibold"
                      : "text-green-600 font-semibold"
                  }
                >
                  <span style={{ fontWeight: "600", fontSize: "16px" }}>
                    {text}
                  </span>{" "}
                  {record.unitType && (
                    <span className="text-gray-500">{record.unitType}</span>
                  )}
                </span>
              );
            },
          },
          {
            title: "Tổng giá trị đo lường",
            dataIndex: "measurementValue",
            key: "measurementValue",
            width: 180,
            align: "left",
            render: (text, record) => (
              <span>
                <span style={{ fontWeight: "600", fontSize: "16px" }}>
                  {text}
                </span>{" "}
                {record.measurementUnit && (
                  <span className="text-gray-500">
                    {record.measurementUnit}
                  </span>
                )}
              </span>
            ),
          },
          {
            title: "Tổng giá trị đã kiểm",
            dataIndex: "actualMeasurementValue",
            key: "actualMeasurementValue",
            width: 180,
            align: "left",
            render: (text, record) => {
              const isLacking = text < record.measurementValue;
              const isExcess = text > record.measurementValue;

              return (
                <span
                  className={
                    isLacking
                      ? "text-red-600 font-semibold"
                      : isExcess
                      ? "text-orange-600 font-semibold"
                      : "text-green-600 font-semibold"
                  }
                >
                  <span style={{ fontWeight: "600", fontSize: "16px" }}>
                    {text}
                  </span>{" "}
                  {record.measurementUnit && (
                    <span className="text-gray-500">
                      {record.measurementUnit}
                    </span>
                  )}
                </span>
              );
            },
          },
          {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            width: 100,
            onHeaderCell: () => ({
              style: { textAlign: "center" },
            }),
            render: (status) => (
              <div style={{ textAlign: "center" }}>
                <Tag
                  color={
                    status === "LACK"
                      ? "error"
                      : status === "EXCESS"
                      ? "warning"
                      : "success"
                  }
                >
                  {status === "LACK"
                    ? "Thiếu"
                    : status === "EXCESS"
                    ? "Thừa"
                    : "Đủ"}
                </Tag>
              </div>
            ),
          },
        ]}
        rowClassName={(record) => (record.status === "LACK" ? "bg-red-50" : "")}
      />

      {!hasViewedAllPages() && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <span className="text-yellow-800 text-sm">
            ⚠️ Bạn cần xem qua tất cả các trang trước khi có thể xác nhận.
          </span>
        </div>
      )}

      <Checkbox
        className="mb-4"
        checked={confirmChecked}
        onChange={(e) => setConfirmChecked(e.target.checked)}
        style={{ fontWeight: "500" }}
        disabled={!hasViewedAllPages()}
      >
        {checkboxText}
      </Checkbox>
    </Modal>
  );
};

// PropTypes validation
StockCheckConfirmationModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  checkboxText: PropTypes.string.isRequired,
  confirmChecked: PropTypes.bool.isRequired,
  setConfirmChecked: PropTypes.func.isRequired,
  allStockCheckDetails: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      itemId: PropTypes.string.isRequired,
      quantity: PropTypes.number.isRequired,
      actualQuantity: PropTypes.number.isRequired,
      measurementValue: PropTypes.number,
      actualMeasurementValue: PropTypes.number,
      unitType: PropTypes.string,
      measurementUnit: PropTypes.string,
      status: PropTypes.oneOf(["LACK", "EXCESS", "MATCH"]).isRequired,
    })
  ).isRequired,
  modalPagination: PropTypes.shape({
    current: PropTypes.number.isRequired,
    pageSize: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
  }).isRequired,
  setModalPagination: PropTypes.func.isRequired,
  viewedPages: PropTypes.instanceOf(Set).isRequired,
  setViewedPages: PropTypes.func.isRequired,
  hasViewedAllPages: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

// Default props
StockCheckConfirmationModal.defaultProps = {
  loading: false,
};

export default StockCheckConfirmationModal;
