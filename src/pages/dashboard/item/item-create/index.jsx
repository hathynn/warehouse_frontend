import { useState, useEffect } from "react";
import useItemService from "@/services/useItemService";
import useProviderService from "@/services/useProviderService";
import { useNavigate } from "react-router-dom";
// Constants
import { ROUTES } from "@/constants/routes";
import { Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

const useCategoryService = () => ({
  getAllCategories: async () => ({
    content: [
      { id: 1, name: "Vải", description: "Các loại cuộn vải" },
      { id: 2, name: "Nút", description: "Nút may mặc" },
      { id: 3, name: "Chỉ may", description: "Chỉ may các loại" },
      { id: 4, name: "Kim may", description: "Kim may công nghiệp" },
      { id: 5, name: "Khóa kéo", description: "Khóa kéo các loại" },
    ],
  }),
  loading: false,
});

// Category mapping for default values
const categoryDefaults = {
  Vải: { measurementUnit: "mét", unitType: "cây" },
  Nút: { measurementUnit: "cái", unitType: "bịch" },
  "Chỉ may": { measurementUnit: "mét", unitType: "cuộn" },
  "Kim may": { measurementUnit: "cây", unitType: "hộp" },
  "Khóa kéo": { measurementUnit: "cái", unitType: "bịch" },
};

// Generate item ID based on category
const generateItemId = (categoryName) => {
  const prefixes = {
    Vải: "VAI",
    Nút: "NUT",
    "Chỉ may": "CHI",
    "Kim may": "KIM",
    "Khóa kéo": "KHO",
  };

  const prefix = prefixes[categoryName] || "ITM";
  const randomId = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `${prefix}-${randomId}`;
};

const ItemCreate = () => {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    provider: "",
    description: "",
    unitType: "",
    measurementUnit: "",
    measurementValue: "",
    minimumStockQuantity: 1,
    maximumStockQuantity: 1000,
    daysUntilDue: 1000,
    countingMinutes: 5,
  });
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [generatedId, setGeneratedId] = useState("");
  const [errors, setErrors] = useState({});
  const [showToast, setShowToast] = useState({
    show: false,
    message: "",
    type: "",
  });

  const { createItem, loading: itemLoading } = useItemService();
  const {
    providers,
    getAllProviders,
    loading: providerLoading,
  } = useProviderService();
  const { getAllCategories, loading: categoryLoading } = useCategoryService();

  const loading = itemLoading || providerLoading || categoryLoading;

  useEffect(() => {
    getAllProviders();
    loadCategories();
  }, []);

  useEffect(() => {
    if (showToast.show) {
      const timer = setTimeout(() => {
        setShowToast({ show: false, message: "", type: "" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast.show]);

  const showMessage = (message, type = "success") => {
    setShowToast({ show: true, message, type });
  };

  const loadCategories = async () => {
    try {
      const response = await getAllCategories();
      setCategories(response.content || []);
    } catch (error) {
      showMessage("Không thể tải danh mục!", "error");
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleCategoryChange = (categoryId) => {
    const category = categories.find((cat) => cat.id === parseInt(categoryId));
    if (category) {
      const defaults = categoryDefaults[category.name];
      if (defaults) {
        setFormData((prev) => ({
          ...prev,
          category: categoryId,
          measurementUnit: defaults.measurementUnit, // đơn vị đo lường (mét, cái, cây)
          unitType: defaults.unitType, // đơn vị tính (cây, bịch, cuộn, hộp)
        }));
      }
      setSelectedCategory(category);
      setGeneratedId(generateItemId(category.name));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || formData.name.length < 2) {
      newErrors.name = "Tên sản phẩm phải có ít nhất 2 ký tự";
    }
    if (!formData.category) {
      newErrors.category = "Vui lòng chọn danh mục";
    }
    if (!formData.provider) {
      newErrors.provider = "Vui lòng chọn nhà cung cấp";
    }
    if (!formData.description || formData.description.length < 10) {
      newErrors.description = "Mô tả phải có ít nhất 10 ký tự";
    }
    if (!formData.measurementValue || formData.measurementValue <= 0) {
      newErrors.measurementValue = "Vui lòng nhập giá trị đo lường hợp lệ";
    }
    if (formData.minimumStockQuantity < 0) {
      newErrors.minimumStockQuantity = "Số lượng tối thiểu phải >= 0";
    }
    if (formData.maximumStockQuantity <= 0) {
      newErrors.maximumStockQuantity = "Số lượng tối đa phải > 0";
    }
    if (formData.minimumStockQuantity >= formData.maximumStockQuantity) {
      newErrors.minimumStockQuantity = "Số lượng tối thiểu phải nhỏ hơn tối đa";
    }
    if (formData.countingMinutes <= 0) {
      newErrors.countingMinutes = "Thời gian kiểm đếm phải > 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setConfirmModalVisible(true);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleConfirm = async () => {
    try {
      // Construct proper API payload matching ItemRequest interface
      const itemRequest = {
        id: generatedId,
        name: formData.name,
        description: formData.description,
        measurementUnit: formData.measurementUnit, // string theo API spec
        measurementValue: parseFloat(formData.measurementValue) || 0, // number
        unitType: formData.unitType,
        daysUntilDue: parseInt(formData.daysUntilDue) || 1000,
        minimumStockQuantity: parseInt(formData.minimumStockQuantity) || 1,
        maximumStockQuantity: parseInt(formData.maximumStockQuantity) || 1000,
        countingMinutes: parseInt(formData.countingMinutes) || 5,
        categoryId: parseInt(formData.category),
        providerId: parseInt(formData.provider),
      };

      console.log("Sending to API:", itemRequest); // Debug log
      await createItem(itemRequest);

      navigate(ROUTES.PROTECTED.ITEM.LIST);

      // Reset form after success
      setFormData({
        name: "",
        category: "",
        provider: "",
        description: "",
        unitType: "",
        measurementUnit: "",
        measurementValue: "",
        minimumStockQuantity: 1,
        maximumStockQuantity: 1000,
        daysUntilDue: 1000,
        countingMinutes: 5,
      });
      setSelectedCategory(null);
      setGeneratedId("");
      setConfirmModalVisible(false);
    } catch (error) {
      showMessage("Không thể tạo sản phẩm. Vui lòng thử lại!", "error");
      console.error("Error creating product:", error);
    }
  };

  return (
    <div className=" bg-gray-50 p-6">
      {/* Toast Message */}
      {showToast.show && (
        <div
          className={`fixed top-5 right-5 z-50 px-6 py-3 rounded-lg text-white font-medium max-w-sm ${
            showToast.type === "error" ? "bg-red-500" : "bg-green-500"
          }`}
        >
          {showToast.message}
        </div>
      )}

      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          {/* Back button */}
          <div className="flex justify-start mb-4">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              className="mr-4"
            >
              Quay lại
            </Button>
          </div>

          <h1 className="text-3xl font-bold text-blue-600 mb-2">
            Thêm Hàng Hóa Mới
          </h1>
          <p className="text-gray-600">
            Điền thông tin chi tiết để thêm sản phẩm vào hệ thống
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center mb-6">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
            Đang tải...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Left Column - Basic Info */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-6 text-gray-800 border-b-2 border-blue-600 pb-2">
                Thông tin cơ bản
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên Hàng *
                  </label>
                  <input
                    type="text"
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Nhập tên hàng hóa"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Danh Mục Hàng Hóa *
                  </label>
                  <select
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.category ? "border-red-500" : "border-gray-300"
                    }`}
                    value={formData.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name} - {category.description}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.category}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nhà Cung Cấp *
                  </label>
                  <select
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.provider ? "border-red-500" : "border-gray-300"
                    }`}
                    value={formData.provider}
                    onChange={(e) =>
                      handleInputChange("provider", e.target.value)
                    }
                  >
                    <option value="">Chọn nhà cung cấp</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                  {errors.provider && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.provider}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô Tả *
                  </label>
                  <textarea
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                      errors.description ? "border-red-500" : "border-gray-300"
                    }`}
                    rows={4}
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Nhập mô tả chi tiết về sản phẩm"
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Technical Specs */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-6 text-gray-800 border-b-2 border-blue-600 pb-2">
                Thông số kỹ thuật
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Đơn Vị Đo Lường
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      value={formData.measurementUnit} // mét, cái, cây
                      disabled
                      placeholder="Chọn danh mục trước"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Đơn Vị Tính
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      value={formData.unitType} // cây, bịch, cuộn, hộp
                      disabled
                      placeholder="Chọn danh mục trước"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá Trị Đo Lường *{" "}
                    {formData.measurementUnit &&
                      `(${formData.measurementUnit})`}
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      className={`flex-1 p-3 border rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.measurementValue
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      value={formData.measurementValue}
                      onChange={(e) =>
                        handleInputChange("measurementValue", e.target.value)
                      }
                      placeholder="Nhập giá trị"
                      min="0"
                      step="0.01"
                    />
                    <div className="px-3 py-3 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-600">
                      {formData.measurementUnit || "đơn vị"}
                    </div>
                  </div>
                  {errors.measurementValue && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.measurementValue}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số Lượng Tối Thiểu{" "}
                      {formData.unitType && `(${formData.unitType})`}
                    </label>
                    <input
                      type="number"
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.minimumStockQuantity
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      value={formData.minimumStockQuantity}
                      onChange={(e) =>
                        handleInputChange(
                          "minimumStockQuantity",
                          e.target.value
                        )
                      }
                      placeholder="1"
                      min="0"
                    />
                    {errors.minimumStockQuantity && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.minimumStockQuantity}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số Lượng Tối Đa{" "}
                      {formData.unitType && `(${formData.unitType})`}
                    </label>
                    <input
                      type="number"
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.maximumStockQuantity
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      value={formData.maximumStockQuantity}
                      onChange={(e) =>
                        handleInputChange(
                          "maximumStockQuantity",
                          e.target.value
                        )
                      }
                      placeholder="1000"
                      min="1"
                    />
                    {errors.maximumStockQuantity && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.maximumStockQuantity}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số Ngày Hết Hạn
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.daysUntilDue}
                        onChange={(e) =>
                          handleInputChange("daysUntilDue", e.target.value)
                        }
                        placeholder="1000"
                        min="1"
                      />
                      <div className="px-3 py-3 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-600">
                        ngày
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thời Gian Kiểm Đếm
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        className={`flex-1 p-3 border rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.countingMinutes
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        value={formData.countingMinutes}
                        onChange={(e) =>
                          handleInputChange("countingMinutes", e.target.value)
                        }
                        placeholder="5"
                        min="1"
                      />
                      <div className="px-3 py-3 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-600">
                        phút
                      </div>
                    </div>
                    {errors.countingMinutes && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.countingMinutes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Generated ID Display */}
          {generatedId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center">
              <strong className="text-blue-800">
                Mã sản phẩm sẽ được tạo:{" "}
              </strong>
              <span className="font-mono text-lg font-bold text-blue-600 ml-2">
                {generatedId}
              </span>
            </div>
          )}

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors duration-200 min-w-48 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {itemLoading && (
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              Thêm Sản Phẩm
            </button>
          </div>
        </form>

        {/* Confirmation Modal */}
        {confirmModalVisible && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <span className="text-green-500 text-2xl mr-3">✅</span>
                  <h2 className="text-xl font-semibold">
                    Xác nhận thông tin sản phẩm
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-gray-700">Mã hàng:</p>
                      <p className="text-gray-600">{generatedId}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Tên hàng:</p>
                      <p className="text-gray-600">{formData.name}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Danh mục:</p>
                      <p className="text-gray-600">{selectedCategory?.name}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">
                        Nhà cung cấp:
                      </p>
                      <p className="text-gray-600">
                        {
                          providers.find(
                            (p) => p.id === parseInt(formData.provider)
                          )?.name
                        }
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">
                        Đơn vị tính:
                      </p>
                      <p className="text-gray-600">
                        {formData.measurementUnit}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-gray-700">
                        Giá trị đo lường:
                      </p>
                      <p className="text-gray-600">
                        {formData.measurementValue} {formData.measurementUnit}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">
                        Số lượng tối thiểu:
                      </p>
                      <p className="text-gray-600">
                        {formData.minimumStockQuantity} {formData.unitType}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">
                        Số lượng tối đa:
                      </p>
                      <p className="text-gray-600">
                        {formData.maximumStockQuantity} {formData.unitType}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">
                        Số ngày hết hạn:
                      </p>
                      <p className="text-gray-600">
                        {formData.daysUntilDue} ngày
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">
                        Thời gian kiểm đếm:
                      </p>
                      <p className="text-gray-600">
                        {formData.countingMinutes} phút
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="font-semibold text-gray-700 mb-2">Mô tả:</p>
                  <div className="bg-gray-50 p-3 rounded border text-gray-600">
                    {formData.description}
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    onClick={() => setConfirmModalVisible(false)}
                  >
                    Hủy
                  </button>
                  <button
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    onClick={handleConfirm}
                    disabled={itemLoading}
                  >
                    {itemLoading && (
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    )}
                    Xác nhận tạo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemCreate;
