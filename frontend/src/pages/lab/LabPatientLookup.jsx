import { useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import axiosClient from "../../api/axiosClient";
import { useToast } from "../../context/ToastContext";
import PatientNameSearch from "../../components/PatientNameSearch";

export default function LabPatientLookup() {
  const [healthId, setHealthId] = useState("");
  const [patient, setPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [uploadingId, setUploadingId] = useState(null);
  const [scanning, setScanning] = useState(false);
  const { showToast } = useToast();
  const scannerRef = useRef(null);

  const lookup = async (id) => {
    try {
      const pRes = await axiosClient.get(`/patient/lookup/${id}`);
      setPatient(pRes.data);
      const rxRes = await axiosClient.get(`/prescriptions/patient/${id}`);
      setPrescriptions(rxRes.data);
    } catch {
      showToast("No patient found with this Health ID", "error");
      setPatient(null);
      setPrescriptions([]);
    }
  };

  const handleManualLookup = (e) => {
    e.preventDefault();
    if (healthId) lookup(healthId);
  };

  const startScan = async () => {
    setScanning(true);
    setTimeout(async () => {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          async (decodedText) => {
            await scanner.stop();
            setScanning(false);
            setHealthId(decodedText);
            lookup(decodedText);
          }
        );
      } catch {
        showToast("Camera access failed. Enter Health ID manually instead.", "error");
        setScanning(false);
      }
    }, 200);
  };

  const stopScan = async () => {
    if (scannerRef.current) { try { await scannerRef.current.stop(); } catch {} }
    setScanning(false);
  };

  const handleFileUpload = async (prescriptionId, file) => {
    if (!file) return;
    setUploadingId(prescriptionId);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axiosClient.post(`/lab/prescriptions/${prescriptionId}/files`, formData);
      showToast("File attached successfully", "success");
      const rxRes = await axiosClient.get(`/prescriptions/patient/${healthId}`);
      setPrescriptions(rxRes.data);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to upload file", "error");
    } finally {
      setUploadingId(null);
    }
  };

  const download = async (fileId, fileName) => {
    const res = await axiosClient.get(`/files/${fileId}/download`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Patient Lookup</h1>
      <p className="text-gray-500 text-sm mb-6">Search a patient to attach lab reports to their prescriptions.</p>

      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <form onSubmit={handleManualLookup} className="flex gap-2 mb-3">
          <input
            required
            value={healthId}
            onChange={(e) => setHealthId(e.target.value)}
            placeholder="Enter Health ID"
            className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-md">Search</button>
        </form>

        {!scanning ? (
          <button onClick={startScan} className="text-sm text-teal-700 underline mb-3 block">
            Or scan QR code with camera
          </button>
        ) : (
          <div className="mb-3">
            <div id="qr-reader" className="w-full max-w-sm mx-auto" />
            <button onClick={stopScan} className="text-sm text-red-600 underline mt-2">Cancel scan</button>
          </div>
        )}

        <PatientNameSearch onSelect={(hid) => { setHealthId(hid); lookup(hid); }} />
      </div>

      {patient && (
        <>
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h2 className="font-semibold text-gray-800 mb-1">{patient.fullName}</h2>
            <p className="text-sm text-gray-500">Health ID: {patient.healthId} · Blood: {patient.bloodGroup}</p>
          </div>

          <h3 className="font-semibold text-gray-800 mb-3">Prescriptions</h3>
          {prescriptions.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-6 text-sm text-gray-400 text-center">
              This patient has no prescriptions yet.
            </div>
          )}
          {prescriptions.map((p) => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm border p-6 mb-4">
              <div className="flex justify-between mb-1">
                <p className="font-semibold text-gray-800">{p.diagnosis}</p>
                <p className="text-gray-400 text-xs">{p.createdAt}</p>
              </div>
              <p className="text-sm text-gray-500 mb-3">Dr. {p.doctorName}{p.cause ? ` — ${p.cause}` : ""}</p>

              <div className="mb-3">
                {p.files.length === 0 && <p className="text-xs text-gray-400 mb-2">No reports attached yet.</p>}
                {p.files.map((f) => (
                  <div key={f.id} className="flex justify-between items-center text-sm border-t py-2">
                    <span>📄 {f.fileName}</span>
                    <button onClick={() => download(f.id, f.fileName)} className="text-teal-700 text-xs underline">Download</button>
                  </div>
                ))}
              </div>

              <label className="inline-block bg-teal-700 hover:bg-teal-800 text-white text-sm px-4 py-2 rounded-md cursor-pointer">
                {uploadingId === p.id ? "Uploading..." : "Attach File"}
                <input
                  type="file"
                  className="hidden"
                  disabled={uploadingId === p.id}
                  onChange={(e) => handleFileUpload(p.id, e.target.files[0])}
                />
              </label>
            </div>
          ))}
        </>
      )}
    </div>
  );
}