import React, { useState } from "react";
import * as XLSX from "xlsx";
import "./index.scss";

const ImportExcel = () => {
  const [data, setData] = useState([]);
  const [fileName, setFileName] = useState("");

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setFileName(file.name);
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const ab = event.target.result;
        const wb = XLSX.read(ab, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(ws);
        console.log("json" + jsonData);
        setData(jsonData);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div className="app-container">
      <h1 id="create-report-order">Tạo phiếu nhập</h1>
      <div className="file-upload">
        <label htmlFor="excel-upload" className="upload-button">
          Nhập file excel
        </label>
        <input
          type="file"
          id="excel-upload"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />
        {fileName && <p className="file-name">{fileName}</p>}
      </div>
      <div className="main-content">
        <div className="form-container">
          <div className="input-fields">
            <div>
              <label htmlFor="ly-do" className="label">
                Lý do nhập kho
              </label>
              <input type="text" id="ly-do" placeholder="Nhập lý do" />
            </div>
            <div>
              <label htmlFor="ngay-giao" className="label">
                Ngày giao hàng dự kiến
              </label>
              <input type="date" id="ngay-giao" />
            </div>
            <div>
              <label htmlFor="nguoi-tao" className="label">
                Người tạo
              </label>
              <input
                type="text"
                id="nguoi-tao"
                placeholder="Nhập theo yêu cầu"
              />
            </div>
            <div>
              <label htmlFor="nha-cung-cap" className="label">
                Nhà cung cấp
              </label>
              <input type="text" id="nha-cung-cap" placeholder="Nhà cung cấp" />
            </div>
            <div>
              <label htmlFor="so-dien-thoai" className="label">
                Số điện thoại
              </label>
              <input
                type="text"
                id="so-dien-thoai"
                placeholder="Nhập số điện thoại"
              />
            </div>
            <button className="submit-btn">Xác nhận</button>
          </div>
        </div>
        <div className="data-list">
          <table className="table-excel">
            <thead>
              <tr>
                <th>Mã hàng</th>
                <th>Tên hàng</th>
                <th>Số lượng</th>
                <th>Đơn vị tính</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index}>
                  <td>{item["Mã hàng"]}</td>
                  <td>{item["Tên hàng"]}</td>
                  <td>{item["Số lượng"]}</td>
                  <td>{item["Đơn vị tính"]}</td>
                  <td>{item["Trạng thái"]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ImportExcel;
