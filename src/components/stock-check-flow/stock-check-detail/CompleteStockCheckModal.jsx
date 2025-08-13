import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Modal, Table, Tag, Checkbox, Divider } from "antd";

const CompleteStockCheckModal = ({
  visible,
  onCancel,
  onConfirm,
  confirmChecked,
  setConfirmChecked,
  allStockCheckDetails,
  selectedDetailIds,
  loading = false,
}) => {
  const [selectedPagination, setSelectedPagination] = useState({
    current: 1,
    pageSize: 5,
  });
  const [unselectedPagination, setUnselectedPagination] = useState({
    current: 1,
    pageSize: 5,
  });
  const [viewedSelectedPages, setViewedSelectedPages] = useState(new Set([1]));
  const [viewedUnselectedPages, setViewedUnselectedPages] = useState(
    new Set([1])
  );

  // Reset states khi modal mở
  useEffect(() => {
    if (visible) {
      setSelectedPagination({ current: 1, pageSize: 5 });
      setUnselectedPagination({ current: 1, pageSize: 5 });
      setViewedSelectedPages(new Set([1]));
      setViewedUnselectedPages(new Set([1]));
    }
  }, [visible]);

  // Chia data thành 2 phần: selected và unselected
  const selectedDetails = allStockCheckDetails.filter((detail) =>
    selectedDetailIds?.includes(detail.id)
  );
  const unselectedDetails = allStockCheckDetails.filter(
    (detail) => !selectedDetailIds?.includes(detail.id)
  );

  const showWarning = selectedDetailIds.length < allStockCheckDetails.length;

  // Kiểm tra đã xem hết tất cả trang chưa
  const hasViewedAllSelectedPages = () => {
    const totalSelectedPages = Math.ceil(selectedDetails.length / 5);
    return (
      totalSelectedPages <= 1 || viewedSelectedPages.size >= totalSelectedPages
    );
  };

  const hasViewedAllUnselectedPages = () => {
    const totalUnselectedPages = Math.ceil(unselectedDetails.length / 5);
    return (
      totalUnselectedPages <= 1 ||
      viewedUnselectedPages.size >= totalUnselectedPages
    );
  };

  const hasViewedAllPages = () => {
    return hasViewedAllSelectedPages() && hasViewedAllUnselectedPages();
  };

  const columns = [
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
          <span style={{ fontWeight: "600", fontSize: "16px" }}>{text}</span>{" "}
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
            <span style={{ fontWeight: "600", fontSize: "16px" }}>{text}</span>{" "}
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
          <span style={{ fontWeight: "600", fontSize: "16px" }}>{text}</span>{" "}
          {record.measurementUnit && (
            <span className="text-gray-500">{record.measurementUnit}</span>
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
            <span style={{ fontWeight: "600", fontSize: "16px" }}>{text}</span>{" "}
            {record.measurementUnit && (
              <span className="text-gray-500">{record.measurementUnit}</span>
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
            {status === "LACK" ? "Thiếu" : status === "EXCESS" ? "Thừa" : "Đủ"}
          </Tag>
        </div>
      ),
    },
  ];

  const handleSelectedPageChange = (page) => {
    setSelectedPagination({ current: page, pageSize: 5 });
    setViewedSelectedPages((prev) => new Set([...prev, page]));
  };

  const handleUnselectedPageChange = (page) => {
    setUnselectedPagination({ current: page, pageSize: 5 });
    setViewedUnselectedPages((prev) => new Set([...prev, page]));
  };

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      onOk={onConfirm}
      title={
        <span style={{ fontWeight: 700, fontSize: "18px" }}>
          Xác nhận và cập nhật số lượng hàng tồn kho
        </span>
      }
      okText="Xác nhận"
      cancelText="Quay lại"
      width={1200}
      centered
      okButtonProps={{
        disabled: !confirmChecked || !hasViewedAllPages(),
        loading: loading,
      }}
    >
      {/* Phần sản phẩm được cập nhật */}
      <div
        style={{ fontSize: "16px" }}
        className="mb-3 font-bold text-green-600"
      >
        Các sản phẩm sau đây sẽ được cập nhật: ({selectedDetails.length} sản
        phẩm)
      </div>

      <Table
        dataSource={selectedDetails}
        rowKey="id"
        pagination={
          selectedDetails.length > 5
            ? {
                current: selectedPagination.current,
                pageSize: 5,
                total: selectedDetails.length,
                onChange: handleSelectedPageChange,
                showSizeChanger: false,
                showQuickJumper: false,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} sản phẩm`,
                size: "small",
              }
            : false
        }
        size="small"
        className="mb-4"
        columns={columns}
        rowClassName={(record) => (record.status === "LACK" ? "bg-red-50" : "")}
      />

      {/* Phần sản phẩm không được cập nhật */}
      {unselectedDetails.length > 0 && (
        <>
          <Divider />
          <div
            style={{ fontSize: "16px" }}
            className="mb-3 font-bold text-red-600"
          >
            Các sản phẩm không được cập nhật tồn kho sau xác nhận: (
            {unselectedDetails.length} sản phẩm)
          </div>

          <Table
            dataSource={unselectedDetails}
            rowKey="id"
            pagination={
              unselectedDetails.length > 5
                ? {
                    current: unselectedPagination.current,
                    pageSize: 5,
                    total: unselectedDetails.length,
                    onChange: handleUnselectedPageChange,
                    showSizeChanger: false,
                    showQuickJumper: false,
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} của ${total} sản phẩm`,
                    size: "small",
                  }
                : false
            }
            size="small"
            className="mb-4"
            columns={columns}
            rowClassName="bg-gray-50"
          />
        </>
      )}

      {/* Cảnh báo nếu chưa xem hết tất cả trang */}
      {!hasViewedAllPages() && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <span className="text-yellow-800 text-sm">
            ⚠️ Bạn cần xem qua tất cả các trang trước khi có thể xác nhận.
          </span>
        </div>
      )}

      {/* Cảnh báo nếu có sản phẩm không được chọn */}
      {showWarning && (
        <div
          style={{
            backgroundColor: "#fff7e6",
            border: "1px solid #ffd591",
            borderRadius: "6px",
            padding: "12px",
            marginBottom: "16px",
            color: "#d46b08",
          }}
        >
          <strong>⚠️ Cảnh báo:</strong> Một số sản phẩm không được chọn sẽ không
          được cập nhật lại số lượng tồn kho, và có thể gây nên sai sót về dữ
          liệu thực tế trong kho.
        </div>
      )}

      <Checkbox
        className="mb-4"
        checked={confirmChecked}
        onChange={(e) => setConfirmChecked(e.target.checked)}
        style={{ fontWeight: "500" }}
        disabled={!hasViewedAllPages()}
      >
        Tôi xác nhận các thông tin về sản phẩm đã được kiểm kê và đồng ý cập
        nhật lại số lượng hàng tồn kho.
        {!hasViewedAllPages() && (
          <span style={{ color: "#d46b08" }}>
            {" "}
            (vui lòng coi hết tất cả các sản phẩm đã được kiểm kê)
          </span>
        )}
      </Checkbox>
    </Modal>
  );
};

CompleteStockCheckModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
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
  selectedDetailIds: PropTypes.array.isRequired,
  loading: PropTypes.bool,
};

CompleteStockCheckModal.defaultProps = {
  loading: false,
};

export default CompleteStockCheckModal;
