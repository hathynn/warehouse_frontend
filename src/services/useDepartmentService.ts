import { useState } from "react";
import useApi from "../hooks/useApi";
import { toast } from "react-toastify";
import { ResponseDTO } from "@/utils/interfaces";

// Interface cho request (tạo/cập nhật phòng ban)
export interface DepartmentRequest {
  id?: number;
  departmentName: string;
  departmentResponsible: string;
  location: string;
  phone: string;
}

// Interface cho response (lấy phòng ban)
export interface DepartmentResponse {
  id: number;
  departmentName: string;
  departmentResponsible: string;
  location: string;
  phone: string;
}

const useDepartmentService = () => {
  const { callApi, loading } = useApi();
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);

  // Lấy danh sách phòng ban
  const getAllDepartments = async (
    page = 1,
    limit = 10
  ): Promise<ResponseDTO<DepartmentResponse[]>> => {
    try {
      const response = await callApi(
        "get",
        `/department?page=${page}&limit=${limit}`
      );
      if (response && response.content) {
        setDepartments(response.content);
      }
      return response;
    } catch (error) {
      toast.error("Không thể lấy danh sách phòng ban");
      throw error;
    }
  };

  // Lấy phòng ban theo ID
  const getDepartmentById = async (
    departmentId: number
  ): Promise<ResponseDTO<DepartmentResponse>> => {
    try {
      const response = await callApi("get", `/department/${departmentId}`);
      return response;
    } catch (error) {
      toast.error("Không thể lấy thông tin phòng ban");
      throw error;
    }
  };

  return {
    loading,
    departments,
    getAllDepartments,
    getDepartmentById,
  };
};

export default useDepartmentService;
