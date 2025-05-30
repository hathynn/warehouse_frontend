
import useApi from "../hooks/useApi";
import { toast } from "react-toastify";
import { ResponseDTO } from "@/utils/interfaces";

// Interface to match NotificationResponse.java
export interface NotificationResponse {
  id: number;
  receiverId: number;
  objectId: number;
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
      console.error("Error fetching notifications:", error);
      throw error;
    }
  };

  // Delete a notification by ID
  const deleteNotification = async (
    notificationId: number
  ): Promise<ResponseDTO<NotificationResponse>> => {
    try {
      const response = await callApi("delete", `/notification/${notificationId}`);
      return response;
    } catch (error) {
      toast.error("Không thể xóa thông báo");
      console.error("Error deleting notification:", error);
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
      console.error("Error marking notifications as viewed:", error);
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
      console.error("Error marking notification as clicked:", error);
      throw error;
    }
  };

  return {
    loading,
    getAllNotifications,
    deleteNotification,
    viewAllNotifications,
    clickNotification,
  };
};

export default useNotificationService;
