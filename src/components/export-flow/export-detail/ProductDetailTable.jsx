import React, { useState, useEffect, useRef } from "react";
import { Table, Button, Tag } from "antd";
import { InputNumber, Popconfirm, Tooltip } from "antd";
import { ExportStatus, AccountRole } from "@/utils/enums";
import PropTypes from "prop-types";
import { InfoCircleOutlined } from "@ant-design/icons";
import { DeleteOutlined } from "@ant-design/icons";

// Hàm getItemStatus nằm trong component này luôn
const getItemStatus = (details) => {
  if (!details || details.length === 0) return null;
  return details.some((d) => d.status === "LACK") ? "LACK" : "ENOUGH";
};

const ProductDetailTable = ({
  columns,
  exportRequestDetails,
  allExportRequestDetails,
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
  items,
}) => {
  const lastValidValuesRef = useRef({});
  const itemStatus = getItemStatus(allExportRequestDetails);

  const currentData = editMode ? editedDetails : allExportRequestDetails;
  const totalEnough = currentData.filter((d) => d.status !== "LACK").length;
  const totalLack = currentData.filter((d) => d.status === "LACK").length;
  const totalItems = currentData.length;

  const handleQuantityChange = (value, recordId) => {
    console.log(`Quantity changed for ${recordId}:`, value);

    setEditedDetails((prev) =>
      prev.map((item) => {
        if (item.id === recordId) {
          let error = "";
          const finalValue = value;

          // Chỉ validate khi có giá trị
          if (value !== null && value !== undefined && value !== "") {
            if (value <= 0) {
              error = "Phải lớn hơn 0";
            } else if (value > item.actualQuantity) {
              error = "Phải ≤ " + item.actualQuantity;
            } else {
              // ✅ Nếu giá trị hợp lệ, lưu vào ref
              lastValidValuesRef.current[recordId] = value;
            }
          }

          return { ...item, quantity: finalValue, error };
        }
        return item;
      })
    );
  };

  const handleInputBlur = (recordId) => {
    setEditedDetails((prev) =>
      prev.map((item) => {
        if (item.id === recordId) {
          // Kiểm tra nếu quantity không hợp lệ
          if (
            item.quantity == null ||
            item.quantity == undefined ||
            item.quantity == "" ||
            item.quantity <= 0 ||
            item.quantity > item.actualQuantity
          ) {
            // Khôi phục về lastValidValue nếu có, nếu không thì về actualQuantity
            const restoreValue =
              lastValidValuesRef.current[recordId] || item.actualQuantity;

            return {
              ...item,
              quantity: restoreValue,
              error: "",
            };
          }
          return item;
        }
        return item;
      })
    );
  };

  const handleMeasurementValueChange = (value, recordId) => {
    setEditedDetails((prev) =>
      prev.map((item) => {
        if (item.id === recordId) {
          let measurementError = "";
          const finalValue = value;

          // Validate measurementValue
          if (value !== null && value !== undefined && value !== "") {
            // ✅ SỬA: Sử dụng numberOfAvailableMeasurementValues và minimumStockQuantity
            const itemInfo = items.find(
              (i) => String(i.id) === String(item.itemId)
            );
            const measurementValue = itemInfo?.measurementValue || 0;
            const numberOfAvailableMeasurementValues =
              itemInfo?.numberOfAvailableMeasurementValues || 0;
            const minimumStockQuantity = itemInfo?.minimumStockQuantity || 0;

            const maxAllowed =
              numberOfAvailableMeasurementValues -
              minimumStockQuantity * measurementValue;

            if (value <= 0) {
              measurementError = "Phải lớn hơn 0";
            } else if (value > maxAllowed) {
              measurementError = `Phải ≤ ${maxAllowed}`;
            } else {
              // Lưu giá trị hợp lệ vào ref
              lastValidValuesRef.current[`measurement_${recordId}`] = value;
            }
          }

          return { ...item, measurementValue: finalValue, measurementError };
        }
        return item;
      })
    );
  };

  const handleMeasurementInputBlur = (recordId) => {
    setEditedDetails((prev) =>
      prev.map((item) => {
        if (item.id === recordId) {
          // ✅ SỬA: Sử dụng numberOfAvailableMeasurementValues và minimumStockQuantity
          const itemInfo = items.find(
            (i) => String(i.id) === String(item.itemId)
          );
          const measurementValue = itemInfo?.measurementValue || 0;
          const numberOfAvailableMeasurementValues =
            itemInfo?.numberOfAvailableMeasurementValues || 0;
          const minimumStockQuantity = itemInfo?.minimumStockQuantity || 0;

          const maxAllowed =
            numberOfAvailableMeasurementValues -
            minimumStockQuantity * measurementValue;

          // Kiểm tra nếu measurementValue không hợp lệ
          if (
            item.measurementValue == null ||
            item.measurementValue == undefined ||
            item.measurementValue == "" ||
            item.measurementValue <= 0 ||
            item.measurementValue > maxAllowed
          ) {
            // Khôi phục về lastValidValue nếu có
            const restoreValue =
              lastValidValuesRef.current[`measurement_${recordId}`] ||
              item.measurementValue;

            return {
              ...item,
              measurementValue: restoreValue,
              measurementError: "",
            };
          }
          return item;
        }
        return item;
      })
    );
  };

  const hasValidationError =
    editedDetails.length === 0 ||
    editedDetails.some((item) => {
      // Chỉ validate những item LACK với actualQuantity > 1 (những item có thể edit)
      if (item.status === "LACK" && item.actualQuantity > 1) {
        // Cho SELLING: validate quantity
        if (exportRequest?.type === "SELLING") {
          return (
            (item.error && item.error !== "") ||
            (item.quantity !== null &&
              item.quantity !== undefined &&
              item.quantity !== "" &&
              (item.quantity <= 0 || item.quantity > item.actualQuantity))
          );
        }

        // Cho PRODUCTION, LIQUIDATION: validate measurementValue
        if (["PRODUCTION", "LIQUIDATION"].includes(exportRequest?.type)) {
          //Sử dụng numberOfAvailableMeasurementValues và minimumStockQuantity
          const itemInfo = items.find(
            (i) => String(i.id) === String(item.itemId)
          );
          const measurementValue = itemInfo?.measurementValue || 0;
          const numberOfAvailableMeasurementValues =
            itemInfo?.numberOfAvailableMeasurementValues || 0;
          const minimumStockQuantity = itemInfo?.minimumStockQuantity || 0;

          const maxAllowed =
            numberOfAvailableMeasurementValues -
            minimumStockQuantity * measurementValue;

          return (
            (item.measurementError && item.measurementError !== "") ||
            (item.measurementValue !== null &&
              item.measurementValue !== undefined &&
              item.measurementValue !== "" &&
              (item.measurementValue <= 0 ||
                item.measurementValue > maxAllowed))
          );
        }
      }
      return false;
    });

  const handleDeleteRow = (recordId) => {
    setEditedDetails((prev) => prev.filter((item) => item.id !== recordId));
  };

  const actionColumn = {
    title: "Hành động",
    key: "action",
    align: "center",
    width: 80,
    render: (_, record) =>
      record.status === "LACK" ? ( // ✅ THÊM điều kiện actualQuantity > 1
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
    ...columns
      .map((col) => {
        // Xử lý column "Số lượng cần" cho SELLING
        if (
          editMode &&
          col.dataIndex === "quantity" &&
          exportRequest?.type === "SELLING"
        ) {
          return {
            ...col,
            render: (text, record) => {
              const isLackWithQuantityOne =
                record.status === "LACK" && record.actualQuantity === 1;
              const isEnough = record.status !== "LACK";

              if (isEnough || isLackWithQuantityOne) {
                return (
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontWeight: "600", fontSize: "18px" }}>
                      {text}
                    </span>{" "}
                    {record.unitType && (
                      <span className="text-gray-500">{record.unitType}</span>
                    )}
                  </div>
                );
              }

              return (
                <div style={{ textAlign: "center" }}>
                  <InputNumber
                    min={1}
                    max={record.actualQuantity}
                    value={record.quantity}
                    onChange={(val) => handleQuantityChange(val, record.id)}
                    onBlur={() => handleInputBlur(record.id)}
                    style={{ width: 100 }}
                  />
                  {record.error && (
                    <div
                      style={{
                        color: "#ff4d4f",
                        fontSize: 12,
                        fontWeight: "bold",
                        marginTop: 4,
                      }}
                    >
                      {record.error}
                    </div>
                  )}
                  {record.unitType && (
                    <div className="text-gray-500 text-xs mt-1">
                      {record.unitType}
                    </div>
                  )}
                </div>
              );
            },
          };
        }

        // Xử lý column "Giá trị cần xuất" cho PRODUCTION, LIQUIDATION
        if (
          editMode &&
          col.dataIndex === "measurementValue" &&
          ["PRODUCTION", "LIQUIDATION"].includes(exportRequest?.type)
        ) {
          return {
            ...col,
            render: (text, record) => {
              const isLackWithQuantityOne =
                record.status === "LACK" && record.actualQuantity === 1;
              const isEnough = record.status !== "LACK";

              if (isEnough || isLackWithQuantityOne) {
                return (
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontWeight: "600", fontSize: "18px" }}>
                      {text}
                    </span>{" "}
                    {record.measurementUnit && (
                      <span className="text-gray-500">
                        {record.measurementUnit}
                      </span>
                    )}
                  </div>
                );
              }

              // ✅ SỬA: Sử dụng numberOfAvailableMeasurementValues và minimumStockQuantity
              const itemInfo = items.find(
                (i) => String(i.id) === String(record.itemId)
              );
              const measurementValue = itemInfo?.measurementValue || 0;
              const numberOfAvailableMeasurementValues =
                itemInfo?.numberOfAvailableMeasurementValues || 0;
              const minimumStockQuantity = itemInfo?.minimumStockQuantity || 0;

              const maxAllowed =
                numberOfAvailableMeasurementValues -
                minimumStockQuantity * measurementValue;

              return (
                <div style={{ textAlign: "center" }}>
                  <InputNumber
                    min={1}
                    step={1}
                    max={maxAllowed} // ✅ SỬA
                    value={record.measurementValue}
                    onChange={(val) =>
                      handleMeasurementValueChange(val, record.id)
                    }
                    onBlur={() => handleMeasurementInputBlur(record.id)}
                    style={{ width: 120 }}
                  />
                  {record.measurementError && (
                    <div
                      style={{
                        color: "#ff4d4f",
                        fontSize: 12,
                        fontWeight: "bold",
                        marginTop: 4,
                      }}
                    >
                      {record.measurementError}
                    </div>
                  )}
                  {record.measurementUnit && (
                    <div className="text-gray-500 text-xs mt-1">
                      {record.measurementUnit}
                    </div>
                  )}
                </div>
              );
            },
          };
        }

        return col;
      })
      // Lọc bỏ cột "Trạng thái" và "Chi tiết" khi ở editMode
      .filter((col) => {
        // Ẩn cột "Trạng thái" và "Chi tiết" khi ở editMode
        if (editMode && (col.key === "status" || col.key === "detail")) {
          return false;
        }

        //Ẩn cột "Số lượng cần" cho PRODUCTION, LIQUIDATION khi ở editMode
        if (
          editMode &&
          col.dataIndex === "quantity" &&
          ["PRODUCTION", "LIQUIDATION"].includes(exportRequest?.type)
        ) {
          return false;
        }

        return true;
      }),
    ...(editMode ? [actionColumn] : []),
  ];

  const unexportableItems = allExportRequestDetails.filter(
    (item) => item.actualQuantity === 0
  );

  return (
    <>
      <h2 className="text-lg font-semibold mb-3 mt-[20px] flex items-center">
        <span className="mr-15">Danh sách chi tiết sản phẩm xuất</span>
        {userRole === AccountRole.WAREHOUSE_MANAGER &&
          exportRequest?.status === ExportStatus.COUNTED && (
            <>
              <Button
                type="primary"
                onClick={() => setConfirmModalVisible(true)}
              >
                Xác nhận số lượng đã đóng gói
              </Button>
            </>
          )}

        {!editMode &&
          userRole === AccountRole.DEPARTMENT &&
          exportRequest?.status === ExportStatus.COUNT_CONFIRMED &&
          exportRequest?.type === "SELLING" &&
          allExportRequestDetails.some((item) => item.status === "LACK") && (
            <Button
              type="primary"
              onClick={() => {
                setEditMode(true);

                // ✅ THÊM: Lọc các sản phẩm có actualQuantity > 0 VÀ maxAllowed > 0
                const filteredItems = allExportRequestDetails.filter((item) => {
                  if (item.actualQuantity === 0) return false;

                  // Kiểm tra thêm maxAllowed cho measurementValue types
                  if (
                    ["PRODUCTION", "LIQUIDATION"].includes(exportRequest?.type)
                  ) {
                    const itemInfo = items.find(
                      (i) => String(i.id) === String(item.itemId)
                    );
                    const measurementValue = itemInfo?.measurementValue || 0;
                    const numberOfAvailableMeasurementValues =
                      itemInfo?.numberOfAvailableMeasurementValues || 0;
                    const minimumStockQuantity =
                      itemInfo?.minimumStockQuantity || 0;

                    const maxAllowed =
                      numberOfAvailableMeasurementValues -
                      minimumStockQuantity * measurementValue;

                    if (maxAllowed <= 0) return false;
                  }

                  return true;
                });

                // Tách thành 3 nhóm...
                const lackItemsEditable = filteredItems.filter(
                  (item) => item.status === "LACK" && item.actualQuantity > 1
                );
                const lackItemsNotEditable = filteredItems.filter(
                  (item) => item.status === "LACK" && item.actualQuantity == 1
                );
                const enoughItems = filteredItems.filter(
                  (item) => item.status !== "LACK"
                );

                const sortedEditedDetails = [
                  ...lackItemsEditable,
                  ...lackItemsNotEditable,
                  ...enoughItems,
                ];

                lastValidValuesRef.current = {};
                sortedEditedDetails.forEach((item) => {
                  if (item.status === "LACK" && item.actualQuantity > 1) {
                    lastValidValuesRef.current[item.id] = item.actualQuantity;
                    if (
                      ["PRODUCTION", "LIQUIDATION"].includes(
                        exportRequest?.type
                      )
                    ) {
                      // ✅ SỬA: Sử dụng numberOfAvailableMeasurementValues và minimumStockQuantity
                      const itemInfo = items.find(
                        (i) => String(i.id) === String(item.itemId)
                      );
                      const measurementValue = itemInfo?.measurementValue || 0;
                      const numberOfAvailableMeasurementValues =
                        itemInfo?.numberOfAvailableMeasurementValues || 0;
                      const minimumStockQuantity =
                        itemInfo?.minimumStockQuantity || 0;

                      const maxMeasurementAllowed =
                        numberOfAvailableMeasurementValues -
                        minimumStockQuantity * measurementValue;
                      lastValidValuesRef.current[`measurement_${item.id}`] =
                        maxMeasurementAllowed;
                    }
                  }
                });

                setEditedDetails(
                  sortedEditedDetails.map((item) => {
                    // ✅ SỬA: Tính measurementValue hợp lệ lớn nhất
                    let validMeasurementValue = item.measurementValue;
                    if (
                      ["PRODUCTION", "LIQUIDATION"].includes(
                        exportRequest?.type
                      )
                    ) {
                      const itemInfo = items.find(
                        (i) => String(i.id) === String(item.itemId)
                      );
                      const measurementValue = itemInfo?.measurementValue || 0;
                      const numberOfAvailableMeasurementValues =
                        itemInfo?.numberOfAvailableMeasurementValues || 0;
                      const minimumStockQuantity =
                        itemInfo?.minimumStockQuantity || 0;

                      const maxMeasurementAllowed =
                        numberOfAvailableMeasurementValues -
                        minimumStockQuantity * measurementValue;

                      // Nếu measurementValue hiện tại > max cho phép, thì set về max
                      if (item.measurementValue > maxMeasurementAllowed) {
                        validMeasurementValue = maxMeasurementAllowed;
                      }
                    }

                    return {
                      ...item,
                      quantity: item.actualQuantity,
                      measurementValue: validMeasurementValue,
                      error: "",
                      measurementError: "",
                    };
                  })
                );
              }}
            >
              Tạo phiếu xuất mới
            </Button>
          )}

        {editMode && (
          <>
            <Button
              type="primary"
              loading={creating}
              style={{ marginRight: 8 }}
              onClick={onConfirmCreateExport}
              disabled={hasValidationError}
            >
              Xác nhận tạo phiếu
            </Button>
            <Button
              danger
              onClick={() => {
                onCancelCreateExport(); // Gọi prop từ parent
                lastValidValuesRef.current = {}; // Reset ref
              }}
              disabled={creating}
            >
              Hủy tạo phiếu
            </Button>
          </>
        )}
      </h2>

      {[
        ExportStatus.IN_PROGRESS,
        ExportStatus.COUNTED,
        ExportStatus.COUNT_CONFIRMED,
        ExportStatus.WAITING_EXPORT,
        ExportStatus.CONFIRMED,
        ExportStatus.COMPLETED,
        ExportStatus.CANCELLED,
      ].includes(exportRequest?.status) && (
        <>
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

            {exportRequest?.status === ExportStatus.COUNTED &&
              userRole === AccountRole.WAREHOUSE_MANAGER &&
              !editMode && ( // ✅ THÊM điều kiện !editMode
                <div className="mb-2">
                  <span className="ml-6 font-medium">Trạng thái hàng: </span>
                  {itemStatus === "LACK" ? (
                    <Tag color="error">Thiếu</Tag>
                  ) : itemStatus === "ENOUGH" ? (
                    <Tag color="success">Đủ</Tag>
                  ) : null}
                </div>
              )}

            <div className="flex gap-8 items-center">
              <span className="ml-6">
                Tổng số hàng: <span>{totalItems}</span>
              </span>

              {/* ✅ SỬA: Chỉ hiện chi tiết khi không ở editMode */}
              {!editMode &&
                [
                  ExportStatus.COUNTED,
                  ExportStatus.COUNT_CONFIRMED,
                  ExportStatus.WAITING_EXPORT,
                  ExportStatus.CONFIRMED,
                  ExportStatus.COMPLETED,
                ].includes(exportRequest?.status) &&
                !(
                  userRole === AccountRole.DEPARTMENT &&
                  [ExportStatus.IN_PROGRESS, ExportStatus.COUNTED].includes(
                    exportRequest?.status
                  )
                ) && (
                  <>
                    <span>
                      Tổng số hàng đủ: <span>{totalEnough}</span>
                    </span>
                    <span>
                      Tổng số hàng thiếu:{" "}
                      <span style={{ color: "#ff4d4f", fontWeight: 500 }}>
                        {totalLack}
                      </span>
                    </span>
                  </>
                )}
            </div>
          </div>

          {unexportableItems.length > 0 && editMode && (
            <div className="mb-4 text-red-600 font-semibold">
              Các sản phẩm không thể xuất do không đủ tồn kho:{" "}
              {unexportableItems.map((item) => `#${item.itemId}`).join(", ")}
            </div>
          )}
        </>
      )}

      <Table
        columns={editMode ? editableColumns : columns}
        dataSource={editMode ? editedDetails : exportRequestDetails} // ✅ SỬA: Bỏ logic sort ở đây
        rowKey="id"
        loading={detailsLoading}
        onChange={handleTableChange}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: editMode ? editedDetails.length : pagination.total, // ✅ SỬA
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
  allExportRequestDetails: PropTypes.array,
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
    type: PropTypes.string,
  }),
  setConfirmModalVisible: PropTypes.func.isRequired,
  editMode: PropTypes.bool,
  setEditMode: PropTypes.func,
  editedDetails: PropTypes.array,
  setEditedDetails: PropTypes.func,
  creating: PropTypes.bool,
  onCancelCreateExport: PropTypes.func,
  onConfirmCreateExport: PropTypes.func,
  items: PropTypes.array.isRequired,
};

export default ProductDetailTable;
