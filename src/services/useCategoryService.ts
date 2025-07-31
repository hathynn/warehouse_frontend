import useApi from "@/hooks/useApi";
import { toast } from "react-toastify";
import { ResponseDTO } from "@/utils/interfaces";

export interface CategoryResponse {
  id: number;
  name: string;
  description: string;
  itemIds: string[];
}

export interface CategoryListResponse {
  content: CategoryResponse[];
  details: string[];
  statusCode: number;
  metaDataDTO: null;
}

const useCategoryService = () => {
  const { callApi, loading } = useApi();

  const getAllCategories = async (): Promise<
    ResponseDTO<CategoryListResponse>
  > => {
    try {
      const response = await callApi("get", "/category");
      return response;
    } catch (error) {
      toast.error("Không thể lấy danh sách danh mục");
      throw error;
    }
  };

  const getCategoryById = async (
    categoryId: number
  ): Promise<ResponseDTO<CategoryResponse>> => {
    try {
      const response = await callApi("get", `/category/${categoryId}`);
      return response;
    } catch (error) {
      toast.error("Không thể lấy thông tin danh mục");
      throw error;
    }
  };

  return {
    getAllCategories,
    getCategoryById,
    loading,
  };
};

export default useCategoryService;
