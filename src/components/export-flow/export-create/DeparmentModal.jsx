import React, { useState } from "react";
import { Modal, Input, List, Pagination } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";

const DeparmentModal = ({
  visible,
  title,
  data,
  onSelect,
  onCancel,
  placeholder = "Tìm kiếm...",
  pagination, // { current, pageSize, total, onChange }
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Nếu có search thì chỉ filter trên page hiện tại
  const filteredData =
    data?.filter((item) =>
      item?.name?.toLowerCase().includes(searchTerm?.toLowerCase())
    ) || [];

  return (
    <Modal
      open={visible}
      title={title}
      onCancel={onCancel}
      footer={null}
      centered={true}
    >
      <Input
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        prefix={<SearchOutlined />}
        style={{ marginBottom: 10 }}
      />
      <List
        dataSource={filteredData}
        renderItem={(item) => (
          <List.Item
            onClick={() => onSelect(item)}
            style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <span style={{ fontWeight: 600, color: "#222", marginRight: 8 }}>
              {item.name}
            </span>
            <span style={{ fontSize: 12, color: "#888" }}>
              Người đại diện: {item.departmentResponsible} - SĐT: {item.phone}
            </span>
          </List.Item>
        )}
        locale={{
          emptyText: "Không có dữ liệu",
        }}
      />
      {/* Hiển thị phân trang nếu có truyền props pagination */}
      {pagination && (
        <Pagination
          style={{ marginTop: 16, textAlign: "center", marginLeft: 330 }}
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onChange={pagination.onChange}
          showSizeChanger={false}
        />
      )}
    </Modal>
  );
};

DeparmentModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  pagination: PropTypes.shape({
    current: PropTypes.number.isRequired,
    pageSize: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
  }),
};

export default DeparmentModal;
