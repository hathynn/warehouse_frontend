import React, { useEffect, useState } from "react";
import { Modal, Typography, Descriptions, Table, Checkbox } from "antd";
import { useScrollViewTracker } from "@/hooks/useScrollViewTracker";
import PropTypes from "prop-types";
import dayjs from "dayjs";

const { Title } = Typography;

const EXPORT_TYPE_LABELS = {
  PRODUCTION: "Sản xuất",
  BORROWING: "Mượn",
  SELLING: "Bán",
  RETURN: "Trả nhà cung cấp",
  LIQUIDATION: "Thanh lý",
};

// Group data theo itemId + providerId
function getConsolidatedData(data = []) {
  const grouped = {};
  data.forEach((row) => {
    const key = row.providerId
      ? `${row.itemId}-${row.providerId}`
      : `${row.itemId}`;
    if (grouped[key]) {
      grouped[key] = {
        ...grouped[key],
        quantity:
          Number(grouped[key].quantity || 0) + Number(row.quantity || 0),
      };
    } else {
      grouped[key] = { ...row };
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

  // Nếu loại RETURN thì sort và group trước
  if (formData.exportType === "RETURN") {
    dataSource = [...details];
    dataSource.sort((a, b) => {
      const pa = getProviderName(a, providers) || "";
      const pb = getProviderName(b, providers) || "";
      if (pa < pb) return -1;
      if (pa > pb) return 1;
      // Bạn có thể sort thêm theo tên hàng nếu muốn:
      const ia = a.itemName || "";
      const ib = b.itemName || "";
      return ia.localeCompare(ib);
    });
    dataSource = getConsolidatedData(dataSource);
  }

  const getItemInfo = (record, field) => {
    const itemMeta = items?.find((i) => String(i.id) === String(record.itemId));
    return record[field] || itemMeta?.[field] || "";
  };

  const columns = [
    {
      title: "Mã hàng",
      dataIndex: "itemId",
      key: "itemId",
      render: (text) => <div>{text}</div>,
    },
    { title: "Tên hàng", dataIndex: "itemName", key: "itemName" },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      render: (text) => <div className="pl-12 text-right">{text}</div>,
    },
    ["SELLING"].includes(formData?.exportType)
      ? {
          title: "Đơn vị tính",
          dataIndex: "unitType",
          key: "unitType",
          render: (_, record) => {
            const unitType = getItemInfo(record, "unitType");
            return <span>{unitType}</span>;
          },
        }
      : null,
    {
      width: "18%",
      title: <span className="font-semibold">Quy cách</span>,
      dataIndex: "specification",
      key: "specification",
      onHeaderCell: () => ({
        style: { textAlign: "center" },
      }),
      render: (_, record) => {
        const measurementValue = getItemInfo(record, "measurementValue");
        const measurementUnit = getItemInfo(record, "measurementUnit");
        const unitType = getItemInfo(record, "unitType");
        return (
          <span>
            {measurementValue} {measurementUnit} / {unitType}
          </span>
        );
      },
    },
    // Quy cách
    ["PRODUCTION", "BORROWING", "LIQUIDATION"].includes(formData?.exportType)
      ? {
          title: "Quy cách",
          dataIndex: "measurementValue",
          key: "measurementValue",
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
        {/* Descriptions Items giữ nguyên */}
        <Descriptions.Item label="Loại xuất">
          {EXPORT_TYPE_LABELS[formData.exportType] || formData.exportType}
        </Descriptions.Item>
        <Descriptions.Item label="Lý do xuất">
          <div className="max-h-[48px] overflow-y-auto leading-[24px]">
            {formData.exportReason}
          </div>
        </Descriptions.Item>
        <Descriptions.Item label="Ngày nhận">
          {formData.exportDate
            ? dayjs(formData.exportDate).format("DD-MM-YYYY")
            : "-"}
        </Descriptions.Item>
        {["SELLING", "PRODUCTION", "BORROWING", "LIQUIDATION"].includes(
          formData.exportType
        ) && (
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
          rowKey={(record, idx) =>
            formData.exportType === "RETURN"
              ? `${record.itemId}-${record.providerId}-${idx}`
              : String(record.itemId)
          }
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
