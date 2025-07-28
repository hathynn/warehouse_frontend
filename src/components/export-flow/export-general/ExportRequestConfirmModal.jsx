import React, { useEffect, useState } from "react";
import { Modal, Typography, Descriptions, Table, Checkbox } from "antd";
import { useScrollViewTracker } from "@/hooks/useScrollViewTracker";
import PropTypes from "prop-types";
import dayjs from "dayjs";

const { Title } = Typography;

const EXPORT_TYPE_LABELS = {
  PRODUCTION: "Nội bộ",
  BORROWING: "Mượn",
  SELLING: "Bán",
  RETURN: "Trả nhà cung cấp",
  LIQUIDATION: "Thanh lý",
};

function getConsolidatedData(data = [], exportType) {
  const grouped = {};

  data.forEach((row) => {
    // Group theo itemId cho tất cả loại xuất
    const key = row.providerId
      ? `${row.itemId}-${row.providerId}`
      : `${row.itemId}`;

    if (grouped[key]) {
      // Cộng quantity cho SELLING và RETURN
      if (row.quantity !== undefined) {
        grouped[key].quantity =
          Number(grouped[key].quantity || 0) + Number(row.quantity || 0);
      }
      // Cộng measurementValue cho PRODUCTION, BORROWING, LIQUIDATION
      if (row.measurementValue !== undefined && row.measurementValue !== "") {
        grouped[key].measurementValue =
          (Number(grouped[key].measurementValue) || 0) +
          Number(row.measurementValue || 0);
      }
    } else {
      grouped[key] = {
        ...row,
        quantity:
          row.quantity !== undefined ? Number(row.quantity || 0) : undefined,
        measurementValue:
          row.measurementValue !== undefined
            ? Number(row.measurementValue || 0)
            : undefined,
      };
    }
  });

  return Object.values(grouped);
}

const ExportRequestConfirmModal = ({
  open,
  onOk,
  onCancel,
  confirmLoading,
  formData,
  details,
  providers,
  items,
}) => {
  const [confirmChecked, setConfirmChecked] = useState(false);
  const {
    scrollContainerRef,
    checkScrollPosition,
    hasScrolledToBottom,
    resetScrollTracking,
  } = useScrollViewTracker(5);

  useEffect(() => {
    if (!open) {
      setConfirmChecked(false);
      resetScrollTracking();
    }
  }, [open]);

  // Hàm lấy tên nhà cung cấp
  const getProviderName = (record, providers) => {
    if (!record.providerId) return "";
    const foundProvider = (providers || []).find(
      (p) => String(p.id) === String(record.providerId)
    );
    return foundProvider?.name || record.providerName || "";
  };

  let dataSource = details;

  // Áp dụng consolidation cho tất cả loại xuất
  dataSource = getConsolidatedData(dataSource, formData.exportType);

  // Nếu loại RETURN thì sort theo provider
  if (formData.exportType === "RETURN") {
    dataSource.sort((a, b) => {
      const pa = getProviderName(a, providers) || "";
      const pb = getProviderName(b, providers) || "";
      if (pa < pb) return -1;
      if (pa > pb) return 1;
      const ia = a.itemName || "";
      const ib = b.itemName || "";
      return ia.localeCompare(ib);
    });
  }

  const getItemInfo = (record, field) => {
    const itemMeta = items?.find((i) => String(i.id) === String(record.itemId));
    return record[field] || itemMeta?.[field] || "";
  };

  // 3. Thay thế phần columns bằng columns mới giống ExcelDataTableAfter:
  const columns = [
    {
      width: "14%",
      title: "Mã hàng",
      dataIndex: "itemId",
      key: "itemId",
      onHeaderCell: () => ({
        style: { textAlign: "center" },
      }),
      render: (text) => <div>{text}</div>,
    },
    {
      width: "18%",
      title: "Tên hàng",
      dataIndex: "itemName",
      key: "itemName",
      onHeaderCell: () => ({
        style: { textAlign: "center" },
      }),
      render: (_, record) => {
        const itemName =
          record.itemName ||
          items?.find((i) => String(i.id) === String(record.itemId))?.name ||
          "Không xác định";
        return <span>{itemName}</span>;
      },
    },
    // Cột Số lượng cho SELLING
    ["SELLING"].includes(formData?.exportType)
      ? {
          title: "Số lượng",
          dataIndex: "quantity",
          key: "quantity",
          onHeaderCell: () => ({
            style: { textAlign: "center" },
          }),
          align: "center",
          width: "9%",
          render: (text) => (
            <div style={{ textAlign: "center" }}>{text || 0}</div>
          ),
        }
      : null,
    // Cột Giá trị cần xuất cho PRODUCTION, BORROWING, LIQUIDATION
    ["PRODUCTION", "BORROWING", "LIQUIDATION"].includes(formData?.exportType)
      ? {
          title: "Giá trị cần xuất",
          dataIndex: "measurementValue",
          key: "measurementValue",
          onHeaderCell: () => ({
            style: { textAlign: "center" },
          }),
          align: "center",
          width: "9%",
          render: (text) => (
            <div style={{ textAlign: "center" }}>{text || 0}</div>
          ),
        }
      : null,
    // Cột Đơn vị tính cho SELLING
    ["SELLING"].includes(formData?.exportType)
      ? {
          width: "10%",
          title: <span className="font-semibold">Đơn vị tính</span>,
          dataIndex: "unitType",
          key: "unitType",
          onHeaderCell: () => ({
            style: { textAlign: "center" },
          }),
          render: (_, record) => (
            <span style={{ display: "block", textAlign: "center" }}>
              {getItemInfo(record, "unitType")}
            </span>
          ),
        }
      : null,
    // Cột Đơn vị tính cho PRODUCTION, BORROWING, LIQUIDATION
    ["PRODUCTION", "BORROWING", "LIQUIDATION"].includes(formData?.exportType)
      ? {
          width: "10%",
          title: <span className="font-semibold">Đơn vị tính</span>,
          dataIndex: "measurementUnit",
          key: "measurementUnit",
          onHeaderCell: () => ({
            style: { textAlign: "center" },
          }),
          render: (_, record) => (
            <span style={{ display: "block", textAlign: "center" }}>
              {getItemInfo(record, "measurementUnit")}
            </span>
          ),
        }
      : null,
    // Cột Quy cách - LẤY từ database metadata
    {
      width: "12%",
      title: <span className="font-semibold">Quy cách</span>,
      dataIndex: "unitType",
      key: "unitType",
      align: "center",
      onHeaderCell: () => ({
        style: { textAlign: "center" },
      }),
      render: (_, record) => {
        // LẤY measurementValue từ item metadata (database), KHÔNG phải từ input
        const itemMeta = items?.find(
          (i) => String(i.id) === String(record.itemId)
        );
        const measurementValueFromDB = itemMeta?.measurementValue || "";
        const measurementUnit = getItemInfo(record, "measurementUnit");
        const unitType = getItemInfo(record, "unitType");

        return (
          <span>
            {measurementValueFromDB} {measurementUnit} / {unitType}
          </span>
        );
      },
    },
    // Cột Nhà cung cấp cho RETURN
    formData?.exportType === "RETURN"
      ? {
          width: "35%",
          title: "Nhà cung cấp",
          dataIndex: "providerName",
          key: "providerName",
          onHeaderCell: () => ({
            style: { textAlign: "center" },
          }),
          render: (_, record) => {
            // Lấy provider name từ record hoặc providers array
            const providerName =
              record.providerName ||
              providers?.find((p) => p.id === record.providerId)?.name ||
              "Không xác định";
            return <span>{providerName}</span>;
          },
        }
      : null,
  ].filter(Boolean);
  return (
    <Modal
      title={<Title level={4}>Xác nhận thông tin phiếu xuất mới</Title>}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText="Xác nhận tạo phiếu xuất"
      cancelText="Hủy"
      confirmLoading={confirmLoading}
      width={960}
      style={{ height: 700 }}
      maskClosable={false}
      okButtonProps={{ disabled: !confirmChecked || !hasScrolledToBottom }} // ✅ SỬA: thay allPagesViewed bằng hasScrolledToBottom
    >
      <Descriptions
        bordered
        column={3}
        size="small"
        style={{ marginBottom: 24 }}
        className="[&_.ant-descriptions-view]:!border-gray-400 [&_.ant-descriptions-view_table]:!border-gray-400 [&_.ant-descriptions-view_table_th]:!border-gray-400 [&_.ant-descriptions-view_table_td]:!border-gray-400 [&_.ant-descriptions-row]:!border-gray-400"
      >
        {/* Loại xuất - giữ nguyên */}
        <Descriptions.Item label="Loại xuất">
          {EXPORT_TYPE_LABELS[formData.exportType] || formData.exportType}
        </Descriptions.Item>

        {/* Lý do xuất - giữ nguyên */}
        <Descriptions.Item label="Lý do xuất">
          <div className="max-h-[48px] overflow-y-auto leading-[24px]">
            {formData.exportReason}
          </div>
        </Descriptions.Item>

        {/* Ngày nhận - giữ nguyên */}
        <Descriptions.Item label="Ngày nhận">
          {formData.exportDate
            ? dayjs(formData.exportDate).format("DD-MM-YYYY")
            : "-"}
        </Descriptions.Item>

        {/* Fields cho SELLING và RETURN - giữ nguyên */}
        {["SELLING", "RETURN"].includes(formData.exportType) && (
          <>
            <Descriptions.Item label="Người nhận">
              {formData.receiverName || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {formData.receiverPhone || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">
              {formData.receiverAddress || "-"}
            </Descriptions.Item>
          </>
        )}

        {/* Fields cho PRODUCTION, BORROWING, LIQUIDATION - mới */}
        {["PRODUCTION", "BORROWING", "LIQUIDATION"].includes(
          formData.exportType
        ) && (
          <>
            <Descriptions.Item label="Phòng ban">
              {formData.receivingDepartment?.name || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Người đại diện">
              {formData.departmentRepresentative || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {formData.departmentRepresentativePhone || "-"}
            </Descriptions.Item>
          </>
        )}
      </Descriptions>

      <Title level={5} style={{ marginBottom: 12 }}>
        Danh sách hàng hóa
      </Title>

      {/* ✅ THAY THẾ Table có pagination bằng scrollable container */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScrollPosition}
        style={{ height: "465px", overflowY: "auto" }}
      >
        <Table
          columns={columns}
          dataSource={dataSource}
          rowKey={(record) => {
            return record.providerId
              ? `${record.itemId}-${record.providerId}`
              : String(record.itemId);
          }}
          pagination={false}
          size="small"
          bordered
          className="[&_.ant-table-cell]:!border-gray-400 [&_.ant-table-thead>tr>th]:!border-gray-400 [&_.ant-table-tbody>tr>td]:!border-gray-400 [&_.ant-table-container]:!border-gray-400"
        />
      </div>

      <Checkbox
        checked={confirmChecked}
        onChange={(e) => setConfirmChecked(e.target.checked)}
        disabled={!hasScrolledToBottom} // ✅ SỬA: thay allPagesViewed bằng hasScrolledToBottom
        style={{ marginTop: 8, fontSize: 14, fontWeight: "bold" }}
      >
        Tôi xác nhận các thông tin trên phiếu xuất đã đúng.
        {!hasScrolledToBottom && ( // ✅ SỬA: thay allPagesViewed bằng hasScrolledToBottom
          <span style={{ color: "red", marginLeft: 8 }}>
            (Vui lòng xem hết trang)
          </span>
        )}
      </Checkbox>
    </Modal>
  );
};

ExportRequestConfirmModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOk: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  confirmLoading: PropTypes.bool.isRequired,
  formData: PropTypes.shape({
    exportReason: PropTypes.string,
    exportType: PropTypes.string,
    exportDate: PropTypes.string,
    exportTime: PropTypes.string,
    receiverName: PropTypes.string,
    receiverPhone: PropTypes.string,
    receiverAddress: PropTypes.string,
    receivingDepartment: PropTypes.shape({
      name: PropTypes.string,
    }),
    departmentRepresentative: PropTypes.string,
    departmentRepresentativePhone: PropTypes.string,
  }).isRequired,
  details: PropTypes.arrayOf(
    PropTypes.shape({
      itemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      itemName: PropTypes.string,
      quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      totalMeasurementValue: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
      measurementUnit: PropTypes.string,
    })
  ).isRequired,
  providers: PropTypes.array,
  items: PropTypes.array,
};

export default ExportRequestConfirmModal;
