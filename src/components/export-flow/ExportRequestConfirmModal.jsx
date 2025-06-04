import React, { useEffect, useState } from "react";
import { Modal, Typography, Descriptions, Table, Checkbox } from "antd";
import { usePaginationViewTracker } from "@/hooks/usePaginationViewTracker";

const { Title } = Typography;

const ExportRequestConfirmModal = ({
  open,
  onOk,
  onCancel,
  confirmLoading,
  formData,
  details,
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

  const columns = [
    {
      title: "Mã hàng",
      dataIndex: "itemId",
      key: "itemId",
      render: (text) => <div>#{text}</div>,
    },
    { title: "Tên hàng hóa", dataIndex: "itemName", key: "itemName" },
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
    {
      title: "Quy cách",
      dataIndex: "measurementValue",
      key: "measurementValue",
    },
  ];

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
      >
        <Descriptions.Item label="Loại xuất">
          {formData.exportType === "PRODUCTION" ? "Sản xuất" : "Mượn"}
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
        <Descriptions.Item label="Thời gian nhận">
          {formData.exportTime || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Phòng ban">
          {formData.receivingDepartment?.name || "-"}
        </Descriptions.Item>
      </Descriptions>

      <Title level={5} style={{ marginBottom: 12 }}>
        Danh sách hàng hóa
      </Title>
      <Table
        columns={columns}
        dataSource={details}
        rowKey={(record) => `${record.itemId}`}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: details.length,
          showTotal: (total) => `Tổng ${total} mục`,
        }}
        onChange={handleTableChange}
        size="small"
        bordered
        style={{ height: "490px", overflowY: "auto" }}
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

import PropTypes from "prop-types";
import dayjs from "dayjs";

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
};
export default ExportRequestConfirmModal;
