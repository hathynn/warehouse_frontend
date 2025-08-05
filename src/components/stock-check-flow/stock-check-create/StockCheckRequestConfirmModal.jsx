import React, { useEffect, useState } from "react";
import { Modal, Typography, Descriptions, Table, Checkbox } from "antd";
import { useScrollViewTracker } from "@/hooks/useScrollViewTracker";
import PropTypes from "prop-types";
import dayjs from "dayjs";

const { Title } = Typography;

const StockCheckRequestConfirmModal = ({
  open,
  onOk,
  onCancel,
  confirmLoading,
  formData,
  details,
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

  const getItemInfo = (record, field) => {
    const itemMeta = items?.find((i) => String(i.id) === String(record.itemId));
    return record[field] || itemMeta?.[field] || "";
  };

  const columns = [
    {
      width: "15%",
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
    {
      width: "17%",
      title: <span className="font-semibold">Quy cách</span>,
      dataIndex: "measurementValue",
      key: "measurementValue",
      align: "center",
      onHeaderCell: () => ({
        style: { textAlign: "center" },
      }),
      render: (_, record) => {
        const itemMeta = items?.find(
          (i) => String(i.id) === String(record.itemId)
        );
        const measurementValueFromDB = itemMeta?.measurementValue || "";
        const measurementUnit = getItemInfo(record, "measurementUnit");
        const unitType = getItemInfo(record, "unitType");

        return (
          <span>
            <strong style={{ fontSize: "17px" }}>
              {measurementValueFromDB}
            </strong>{" "}
            {measurementUnit} / {unitType}
          </span>
        );
      },
    },
    {
      width: "22%",
      title: <span className="font-semibold">Tổng số lượng khả dụng</span>,
      dataIndex: "numberOfAvailableItems",
      key: "numberOfAvailableItems",
      onHeaderCell: () => ({
        style: { textAlign: "center" },
      }),
      render: (_, record) => {
        const itemMeta = items?.find(
          (i) => String(i.id) === String(record.itemId)
        );
        const numberOfAvailableItems = itemMeta?.numberOfAvailableItems || 0;
        const unitType = getItemInfo(record, "unitType");

        return (
          <span style={{ display: "block", textAlign: "center" }}>
            <strong style={{ fontSize: "17px" }}>
              {numberOfAvailableItems}
            </strong>{" "}
            {unitType}
          </span>
        );
      },
    },
    {
      width: "20%",
      title: <span className="font-semibold">Tổng giá trị khả dụng</span>,
      dataIndex: "numberOfAvailableMeasurementValues",
      key: "numberOfAvailableMeasurementValues",
      onHeaderCell: () => ({
        style: { textAlign: "center" },
      }),
      render: (_, record) => {
        const itemMeta = items?.find(
          (i) => String(i.id) === String(record.itemId)
        );
        const numberOfAvailableMeasurementValues =
          itemMeta?.numberOfAvailableMeasurementValues || 0;
        const measurementUnit = getItemInfo(record, "measurementUnit");

        return (
          <span style={{ display: "block", textAlign: "center" }}>
            <strong style={{ fontSize: "17px" }}>
              {numberOfAvailableMeasurementValues}
            </strong>{" "}
            {measurementUnit}
          </span>
        );
      },
    },
  ];

  return (
    <Modal
      title={<Title level={4}>Xác nhận thông tin phiếu kiểm kho mới</Title>}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText="Xác nhận tạo phiếu kiểm kho"
      cancelText="Hủy"
      confirmLoading={confirmLoading}
      width={960}
      style={{ height: 700 }}
      maskClosable={false}
      centered
      okButtonProps={{ disabled: !confirmChecked || !hasScrolledToBottom }}
    >
      <Descriptions
        bordered
        column={2}
        size="small"
        style={{ marginBottom: 24 }}
        className="[&_.ant-descriptions-view]:!border-gray-400 [&_.ant-descriptions-view_table]:!border-gray-400 [&_.ant-descriptions-view_table_th]:!border-gray-400 [&_.ant-descriptions-view_table_td]:!border-gray-400 [&_.ant-descriptions-row]:!border-gray-400"
      >
        {/* Loại kiểm kho */}
        <Descriptions.Item label="Loại kiểm kho">
          Kiểm kê theo yêu cầu
        </Descriptions.Item>

        {/* Ngày bắt đầu kiểm kê */}
        <Descriptions.Item label="Ngày bắt đầu">
          {formData.startDate
            ? dayjs(formData.startDate).format("DD-MM-YYYY")
            : "-"}
        </Descriptions.Item>
        {/* Ngày mong muốn hoàn tất */}
        <Descriptions.Item label="Ngày mong muốn hoàn tất">
          {formData.expectedCompletedDate
            ? dayjs(formData.expectedCompletedDate).format("DD-MM-YYYY")
            : "-"}
        </Descriptions.Item>
        {/* Lý do kiểm kho */}
        <Descriptions.Item label="Lý do kiểm kho">
          <div className="max-h-[48px] overflow-y-auto leading-[24px]">
            {formData.stockCheckReason}
          </div>
        </Descriptions.Item>
        {/* Ghi chú */}
        <Descriptions.Item label="Ghi chú" span={2}>
          <div className="max-h-[48px] overflow-y-auto leading-[24px]">
            {formData.note || "-"}
          </div>
        </Descriptions.Item>
      </Descriptions>

      <Title level={5} style={{ marginBottom: 12 }}>
        Danh sách hàng hóa cần kiểm kho
      </Title>

      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScrollPosition}
        style={{ height: "465px", overflowY: "auto" }}
      >
        <Table
          columns={columns}
          dataSource={details}
          rowKey={(record) => String(record.itemId)}
          pagination={false}
          size="small"
          bordered
          className="[&_.ant-table-cell]:!border-gray-400 [&_.ant-table-thead>tr>th]:!border-gray-400 [&_.ant-table-tbody>tr>td]:!border-gray-400 [&_.ant-table-container]:!border-gray-400"
        />
      </div>

      <Checkbox
        checked={confirmChecked}
        onChange={(e) => setConfirmChecked(e.target.checked)}
        disabled={!hasScrolledToBottom}
        style={{ marginTop: 8, fontSize: 14, fontWeight: "bold" }}
      >
        Tôi xác nhận các thông tin trên phiếu kiểm kho đã đúng.
        {!hasScrolledToBottom && (
          <span style={{ color: "red", marginLeft: 8 }}>
            (Vui lòng xem hết trang)
          </span>
        )}
      </Checkbox>
    </Modal>
  );
};

StockCheckRequestConfirmModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOk: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  confirmLoading: PropTypes.bool.isRequired,
  formData: PropTypes.shape({
    stockCheckReason: PropTypes.string,
    startDate: PropTypes.string,
    expectedCompletedDate: PropTypes.string,
    note: PropTypes.string,
  }).isRequired,
  details: PropTypes.arrayOf(
    PropTypes.shape({
      itemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      itemName: PropTypes.string,
      unitType: PropTypes.string,
      measurementUnit: PropTypes.string,
      totalMeasurementValue: PropTypes.string,
    })
  ).isRequired,
  items: PropTypes.array,
};

export default StockCheckRequestConfirmModal;
