import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { ReloadOutlined } from "@ant-design/icons";
import useAccountService, {
  AccountResponse,
  RegisterRequest,
  UpdateAccountRequest,
} from "@/services/useAccountService";
import { AccountRoleForRequest } from "@/utils/enums";

const MANAGEABLE_ROLES = [
  AccountRoleForRequest.DEPARTMENT,
  AccountRoleForRequest.STAFF,
  AccountRoleForRequest.WAREHOUSE_MANAGER,
  AccountRoleForRequest.OTHER,
  AccountRoleForRequest.MANAGER,
] as const;

const ACCOUNT_STATUS_OPTIONS = [
  { label: "Đang hoạt động", value: "ACTIVE" },
  { label: "Không hoạt động", value: "INACTIVE" },
  { label: "Đang nghỉ", value: "ON_LEAVE" },
  { label: "Đã thôi việc", value: "TERMINATED" },
];

type ManageableRole = typeof MANAGEABLE_ROLES[number];

const ROLE_LABEL_MAP: Record<ManageableRole, string> = {
  [AccountRoleForRequest.DEPARTMENT]: "PHÒNG KẾ HOẠCH",
  [AccountRoleForRequest.STAFF]: "THỦ KHO",
  [AccountRoleForRequest.WAREHOUSE_MANAGER]: "TRƯỞNG KHO",
  [AccountRoleForRequest.MANAGER]: "QUẢN LÝ",
  [AccountRoleForRequest.OTHER]: "NHÂN VIÊN NỘI BỘ"
};

type RoleFilter = "ALL" | AccountRoleForRequest;

const ROLE_FILTER_OPTIONS: { label: string; value: RoleFilter }[] = [
  { label: "Tất cả vai trò", value: "ALL" },
  ...MANAGEABLE_ROLES.map((role) => ({
    label: ROLE_LABEL_MAP[role],
    value: role,
  })),
];

const sortAccountsByName = (list: AccountResponse[]) =>
  [...list].sort((a, b) =>
    (a.fullName ?? "").localeCompare(b.fullName ?? "", undefined, {
      sensitivity: "base",
    })
  );

const AccountList: React.FC = () => {
  const { getAccountsByRole, updateAccount, register } = useAccountService();

  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [loading, setLoading] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [updateSubmitting, setUpdateSubmitting] = useState(false);
  const [editingAccount, setEditingAccount] =
    useState<AccountResponse | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [updateForm] = Form.useForm<UpdateAccountRequest>();
  const [createForm] = Form.useForm<RegisterRequest>();

  const fetchAccounts = useCallback(
    async (role: RoleFilter) => {
      setLoading(true);
      const responses =
        role === "ALL"
          ? await Promise.all(MANAGEABLE_ROLES.map(getAccountsByRole))
          : [await getAccountsByRole(role)];
      setAccounts(sortAccountsByName(responses.flat()));
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    fetchAccounts(roleFilter);
  }, [fetchAccounts, roleFilter]);

  const filteredAccounts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return accounts;

    return accounts.filter((account) => {
      const idMatch = account.id?.toString().toLowerCase().includes(keyword);
      const usernameMatch = account.username?.toLowerCase().includes(keyword);
      const nameMatch = account.fullName?.toLowerCase().includes(keyword);
      const emailMatch = account.email?.toLowerCase().includes(keyword);
      const phoneMatch = account.phone?.toLowerCase().includes(keyword);

      return idMatch || usernameMatch || nameMatch || emailMatch || phoneMatch;
    });
  }, [accounts, searchTerm]);

  const openUpdateModal = (account: AccountResponse) => {
    setEditingAccount(account);
    setUpdateModalVisible(true);
  };

  const openCreateModal = () => {
    createForm.resetFields();
    setCreateModalVisible(true);
  };

  const closeUpdateModal = () => {
    setUpdateModalVisible(false);
    setEditingAccount(null);
    updateForm.resetFields();
  };

  const closeCreateModal = () => {
    setCreateModalVisible(false);
    createForm.resetFields();
  };

  useEffect(() => {
    if (!updateModalVisible || !editingAccount) {
      return;
    }
    updateForm.setFieldsValue({
      id: editingAccount.id,
      fullName: editingAccount.fullName,
      email: editingAccount.email,
      phone: editingAccount.phone,
      status: editingAccount.status as UpdateAccountRequest["status"],
      isEnable: editingAccount.isEnable,
    });
  }, [editingAccount, updateForm, updateModalVisible]);

  const handleUpdateAccount = async () => {
    try {
      const values = await updateForm.validateFields();
      setUpdateSubmitting(true);
      const trimmedPassword = values.password?.trim();
      await updateAccount({
        id: values.id,
        fullName: values.fullName?.trim(),
        email: values.email?.trim(),
        phone: values.phone?.trim(),
        status: values.status,
        isEnable: values.isEnable,
        password: trimmedPassword ? trimmedPassword : undefined,
      });
      closeUpdateModal();
      fetchAccounts(roleFilter);
    } catch (error: unknown) {
      const isValidationError =
        typeof error === "object" &&
        error !== null &&
        Reflect.has(error as object, "errorFields");
      if (!isValidationError) {
        message.error("Không thể cập nhật tài khoản");
      }
    } finally {
      setUpdateSubmitting(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      const values = await createForm.validateFields();
      setCreateSubmitting(true);
      await register({
        fullName: values.fullName.trim(),
        username: values.username.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        password: values.password.trim(),
        role: values.role,
      });
      closeCreateModal();
      fetchAccounts(roleFilter);
    } catch (error: unknown) {
      const isValidationError =
        typeof error === "object" &&
        error !== null &&
        Reflect.has(error as object, "errorFields");
      if (!isValidationError) {
        message.error("Không thể tạo tài khoản");
      }
    } finally {
      setCreateSubmitting(false);
    }
  };

  const columns: ColumnsType<AccountResponse> = [
    {
      title: "Tên đăng nhập",
      dataIndex: "username",
      key: "username",
      width: 160,
    },
    {
      title: "Họ và tên",
      dataIndex: "fullName",
      key: "fullName",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role: AccountRoleForRequest) => (
        <Tag color="purple">{ROLE_LABEL_MAP[role]}</Tag>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_: unknown, account) => (
        <Tag color={account.isEnable ? "green" : "gold"}>
          {account.isEnable ? "Đã kích hoạt" : "Chưa kích hoạt"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 120,
      render: (_: unknown, account) => (
        <Button type="link" onClick={() => openUpdateModal(account)}>
          Cập nhật
        </Button>
      ),
    },
  ];

  return (
    <div className="container p-5 mx-auto">
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <h1 className="m-0 text-xl font-bold">Danh sách tài khoản</h1>
        <Space size="middle" wrap>
          <Button type="primary" onClick={openCreateModal}>
            Tạo tài khoản
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchAccounts(roleFilter)}
            disabled={loading}
          >
            Tải lại
          </Button>
        </Space>
      </div>

      <div className="grid gap-4 mb-4 md:grid-cols-2">
        <Input
          placeholder="Tìm kiếm theo tên, tên đăng nhập, email hoặc số điện thoại"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          allowClear
        />
        <Select<RoleFilter>
          value={roleFilter}
          onChange={setRoleFilter}
          options={ROLE_FILTER_OPTIONS}
        />
      </div>

      <Table<AccountResponse>
        columns={columns}
        dataSource={filteredAccounts}
        rowKey={(record) => record.id}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: false }}
      />

      <Modal
        title="Cập nhật tài khoản"
        open={updateModalVisible}
        onCancel={closeUpdateModal}
        onOk={handleUpdateAccount}
        confirmLoading={updateSubmitting}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={updateForm} layout="vertical" preserve={false}>
          <Form.Item name="id" hidden rules={[{ required: true }]}>
            <Input type="hidden" />
          </Form.Item>
          <Form.Item label="Tên đăng nhập">
            <Input value={editingAccount?.username ?? ""} disabled />
          </Form.Item>
          <Form.Item
            label="Họ và tên"
            name="fullName"
            rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
          >
            <Input placeholder="Nhập họ và tên" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, type: "email", message: "Email không hợp lệ" }]}
          >
            <Input placeholder="Nhập email" />
          </Form.Item>
          <Form.Item
            label="Số điện thoại"
            name="phone"
            rules={[
              { required: true, message: "Vui lòng nhập số điện thoại" },
              {
                pattern: /^\+?[0-9]{10,12}$/,
                message: "Số điện thoại không hợp lệ",
              },
            ]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>
          <Form.Item
            label="Trạng thái"
            name="status"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
          >
            <Select
              options={ACCOUNT_STATUS_OPTIONS}
              placeholder="Chọn trạng thái"
            />
          </Form.Item>
          <Form.Item
            label="Kích hoạt"
            name="isEnable"
            valuePropName="checked"
            tooltip="Bật để cho phép tài khoản đăng nhập"
          >
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>
          <Form.Item
            label="Mật khẩu mới"
            name="password"
            rules={[{ min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" }]}
            tooltip="Để trống nếu không muốn đổi mật khẩu"
          >
            <Input.Password placeholder="Nhập mật khẩu mới" visibilityToggle />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Tạo tài khoản"
        open={createModalVisible}
        onCancel={closeCreateModal}
        onOk={handleCreateAccount}
        confirmLoading={createSubmitting}
        okText="Tạo"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" preserve={false}>
          <Form.Item
            label="Tên đăng nhập"
            name="username"
            rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập" }]}
          >
            <Input placeholder="Nhập tên đăng nhập" />
          </Form.Item>
          <Form.Item
            label="Họ và tên"
            name="fullName"
            rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
          >
            <Input placeholder="Nhập họ và tên" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, type: "email", message: "Email không hợp lệ" }]}
          >
            <Input placeholder="Nhập email" />
          </Form.Item>
          <Form.Item
            label="Số điện thoại"
            name="phone"
            rules={[
              { required: true, message: "Vui lòng nhập số điện thoại" },
              {
                pattern: /^\+?[0-9]{10,12}$/,
                message: "Số điện thoại không hợp lệ",
              },
            ]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>
          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu" },
              { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu" visibilityToggle />
          </Form.Item>
          <Form.Item
            label="Vai trò"
            name="role"
            rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
          >
            <Select
              options={MANAGEABLE_ROLES.map((role) => ({
                label: ROLE_LABEL_MAP[role],
                value: role,
              }))}
              placeholder="Chọn vai trò"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AccountList;
