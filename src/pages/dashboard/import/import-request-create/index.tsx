import React, { useState } from "react";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { ArrowLeftOutlined } from "@ant-design/icons";
import RequestTypeSelector, { ImportRequestType } from "@/components/commons/RequestTypeSelector";
import ImportRequestOrderTypeCreating from "@/components/import-flow/import-request/ImportRequestOrderTypeCreating";
import ImportRequestReturnTypeCreating from "@/components/import-flow/import-request/ImportRequestReturnTypeCreating";

const ImportRequestCreate: React.FC = () => {
  const navigate = useNavigate();
  const [importType, setImportType] = useState<ImportRequestType>("ORDER");
  const [currentStep, setCurrentStep] = useState<number>(0);

  const handleRequestTypeChange = (value: ImportRequestType) => {
    setImportType(value);
    setCurrentStep(0);
  };

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  const handleBack = () => {
    navigate(ROUTES.PROTECTED.IMPORT.REQUEST.LIST);
  };

  return (
    <div className="container p-3 pt-0 mx-auto">
      {currentStep === 0 && (
        <div className="flex items-center mb-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            className="mr-4"
          >
            Quay lại
          </Button>
        </div>
      )}
      <RequestTypeSelector
        requestType={importType}
        setRequestType={handleRequestTypeChange}
        mode="import"
      />
      {importType === "ORDER" && <ImportRequestOrderTypeCreating onStepChange={handleStepChange} />}
      {importType === "RETURN" && <ImportRequestReturnTypeCreating onStepChange={handleStepChange} />}
    </div>
  );
};

export default ImportRequestCreate;
