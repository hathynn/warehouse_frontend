import React, { useEffect, useState } from "react";
import { Modal, Typography, Descriptions, Table, Checkbox } from "antd";
import { usePaginationViewTracker } from "@/hooks/usePaginationViewTracker";
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

// Tính rowSpan cho cell gộp (theo field, idx)
function calculateRowSpanForItemHaveSameCompareValue(data, field, idx) {
  if (!Array.isArray(data) || data.length === 0) return 1;
  const curValue = data[idx]?.[field];
  // Nếu không phải dòng đầu tiên của nhóm => rowSpan = 0 (ẩn)
  if (idx > 0 && data[idx - 1]?.[field] === curValue) return 0;
  // Đếm số dòng liên tiếp cùng value
  let rowSpan = 1;
  for (let i = idx + 1; i < data.length; ++i) {
    if (data[i][field] === curValue) rowSpan++;
    else break;
  }
  return rowSpan;
}

const ExportRequestConfirmModal = ({
  open,
  onOk,
  onCancel,
  confirmLoading,
  formData,
  details,
  providers,
}) => {
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: details.length,
  });

  const { allPagesViewed, markPageAsViewed, resetViewedPages } =
    usePaginationViewTracker(
      details.length,
      pagination.pageSize,
      pagination.current
    );

  const handleTableChange = (newPagination) => {
    setPagination({
      ...pagination,
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10,
    });
    if (newPagination.current) markPageAsViewed(newPagination.current);
  };

  useEffect(() => {
    if (!open) {
      setConfirmChecked(false);
      setPagination({ current: 1, pageSize: 10, total: details.length });
      resetViewedPages(1);
    }
  }, [open, details.length, resetViewedPages]);

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
    {
      title: "Giá trị đo lường",
      dataIndex: "totalMeasurementValue",
      key: "totalMeasurementValue",
      render: (text) => <div className="pl-12 text-right">{text}</div>,
    },
    {
      title: "Đơn vị tính",
      dataIndex: "measurementUnit",
      key: "measurementUnit",
    },
    // Quy cách
    ["PRODUCTION", "BORROWING", "LIQUIDATION"].includes(formData?.exportType)
      ? {
          title: "Quy cách",
          dataIndex: "measurementValue",
          key: "measurementValue",
        }
      : null,
    // Nhà cung cấp cho RETURN (group + rowSpan)
    formData?.exportType === "RETURN"
      ? {
          title: "Nhà cung cấp",
          dataIndex: "providerName",
          key: "providerName",
          render: (_, record) => (
            <span>{getProviderName(record, providers)}</span>
          ),
          onCell: (record, idx) => ({
            rowSpan: calculateRowSpanForItemHaveSameCompareValue(
              dataSource,
              "providerName",
              idx
            ),
          }),
        }
      : null,
  ].filter(Boolean);

  return (
    <Modal
      title={<Title level={4}>Xác nhận thông tin phiếu xuất</Title>}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText="Xác nhận tạo phiếu xuất"
      cancelText="Hủy"
      confirmLoading={confirmLoading}
      width={960}
      style={{ height: 700 }}
      maskClosable={false}
      okButtonProps={{ disabled: !confirmChecked || !allPagesViewed }}
    >
      <Descriptions
        bordered
        column={3}
        size="small"
        style={{ marginBottom: 24 }}
        className="[&_.ant-descriptions-view]:!border-gray-400 [&_.ant-descriptions-view_table]:!border-gray-400 [&_.ant-descriptions-view_table_th]:!border-gray-400 [&_.ant-descriptions-view_table_td]:!border-gray-400 [&_.ant-descriptions-row]:!border-gray-400"
      >
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
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey={(record, idx) =>
          formData.exportType === "RETURN"
            ? `${record.itemId}-${record.providerId}-${idx}`
            : String(record.itemId)
        }
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: dataSource.length,
          showTotal: (total) => `Tổng ${total} mục`,
        }}
        onChange={handleTableChange}
        size="small"
        bordered
        style={{ height: "490px", overflowY: "auto" }}
        className="[&_.ant-table-cell]:!border-gray-400 [&_.ant-table-thead>tr>th]:!border-gray-400 [&_.ant-table-tbody>tr>td]:!border-gray-400 [&_.ant-table-container]:!border-gray-400"
      />

      <Checkbox
        checked={confirmChecked}
        onChange={(e) => setConfirmChecked(e.target.checked)}
        disabled={!allPagesViewed}
        style={{ marginTop: 8, fontSize: 14, fontWeight: "bold" }}
      >
        Tôi xác nhận các thông tin trên phiếu xuất đã đúng.
        {!allPagesViewed && (
          <span style={{ color: "red", marginLeft: 8 }}>
            (Vui lòng xem tất cả các trang)
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
};

export default ExportRequestConfirmModal;
