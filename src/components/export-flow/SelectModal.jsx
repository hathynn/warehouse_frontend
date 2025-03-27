import React, { useState } from "react";
import { Modal, Input, List } from "antd";
import { SearchOutlined } from "@ant-design/icons";

const SelectModal = ({
  visible,
  title,
  data,
  onSelect,
  onCancel,
  placeholder = "Tìm kiếm...",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredData =
    data?.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  return (
    <Modal visible={visible} title={title} onCancel={onCancel} footer={null}>
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
            style={{ cursor: "pointer" }}
          >
            {item.name}
          </List.Item>
        )}
      />
    </Modal>
  );
};

import PropTypes from "prop-types";

SelectModal.propTypes = {
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
};
export default SelectModal;
