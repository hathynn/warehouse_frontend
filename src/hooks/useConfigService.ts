// Temporary configuration service - will be replaced with API calls later
const useConfigService = () => {
  // This will be replaced with an API call in the future
  const getStaffWorkingHoursPerDay = (): string => {
    return "08:00:00"; // 8 hours in HH:mm:ss format
  };

  return {
    getStaffWorkingHoursPerDay
  };
};

export default useConfigService; 