import useApi from "../hooks/useApi";
import { toast } from "react-toastify";
import { ResponseDTO } from "@/utils/interfaces";

// Interface to match NotificationResponse.java
export interface NotificationResponse {
  id: number;
  receiverId: number;
  objectId: number;
  eventType: string;
  content: string;
  createdDate: string;
  isViewed: boolean;
  isClicked: boolean;
}

// Interface to match NotificationRequest.java
export interface NotificationRequest {
  receiverId: number;
  objectId: number;
  content: string;
}

const useNotificationService = () => {
  const { callApi, loading } = useApi();

  // Get all notifications for a specific account
  const getAllNotifications = async (
    accountId: number
  ): Promise<ResponseDTO<NotificationResponse[]>> => {
    try {
      const response = await callApi(
        "get",
        `/notification?accountId=${accountId}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể lấy danh sách thông báo");
      throw error;
    }
  };

  // Delete a notification by ID
  const deleteNotification = async (
    notificationId: number
  ): Promise<ResponseDTO<NotificationResponse>> => {
    try {
      const response = await callApi(
        "delete",
        `/notification/${notificationId}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể xóa thông báo");
      throw error;
    }
  };

  const deleteAllNotifications = async (
    receiverId: number
  ): Promise<ResponseDTO<NotificationResponse[]>> => {
    try {
      const response = await callApi(
        "delete",
        `/notification/receiver/${receiverId}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể xóa toàn bộ thông báo");
      throw error;
    }
  };

  // Mark all notifications as viewed for a specific account
  const viewAllNotifications = async (
    accountId: number
  ): Promise<ResponseDTO<NotificationResponse[]>> => {
    try {
      const response = await callApi(
        "put",
        `/notification/view-all?accountId=${accountId}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể xem tất cả thông báo");
      throw error;
    }
  };

  // Mark a notification as clicked
  const clickNotification = async (
    notificationId: number
  ): Promise<ResponseDTO<NotificationResponse>> => {
    try {
      const response = await callApi(
        "put",
        `/notification/click?id=${notificationId}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể nhấn vào thông báo");
      throw error;
    }
  };

  return {
    loading,
    getAllNotifications,
    deleteNotification,
    viewAllNotifications,
    clickNotification,
    deleteAllNotifications,
  };
};

export default useNotificationService;
