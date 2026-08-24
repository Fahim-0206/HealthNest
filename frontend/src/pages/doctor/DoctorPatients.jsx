import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import axiosClient from "../../api/axiosClient";
import { useToast } from "../../context/ToastContext";
import PrescriptionPager from "../../components/PrescriptionPager";
import PatientNameSearch from "../../components/PatientNameSearch";

export default function DoctorPatients() {
  const [searchParams] = useSearchParams();
  const [healthId, setHealthId] = useState("");
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [scanning, setScanning] = useState(false);
  const { showToast } = useToast();

  const [diagnosis, setDiagnosis] = useState("");
  const [cause, setCause] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ medicineName: "", dosage: "", durationDays: 5 }]);

  const scannerRef = useRef(null);

  const lookupPatient = async (id) => {
    try {
      const res = await axiosClient.get(`/patient/lookup/${id}`);
      setPatient(res.data);
      loadHistory(id);
    } catch {
      showToast("No patient found with this Health ID", "error");
      setPatient(null);
    }
  };

  const loadHistory = async (id) => {
    try {
      const res = await axiosClient.get(`/prescriptions/patient/${id}`);
      setHistory(res.data);
    } catch {
      setHistory([]);
    }
  };

  useEffect(() => {
    const paramHealthId = searchParams.get("healthId");
    if (paramHealthId) {
      setHealthId(paramHealthId);
      lookupPatient(paramHealthId);
    }
  }, []);

  const handleManualLookup = (e) => {
    e.preventDefault();
    if (healthId) lookupPatient(healthId);
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
            lookupPatient(decodedText);
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

  const updateItem = (idx, field, value) => {
    const updated = [...items];
    updated[idx][field] = value;
    setItems(updated);
  };

  const addItemRow = () => setItems([...items, { medicineName: "", dosage: "", durationDays: 5 }]);
  const removeItemRow = (idx) => setItems(items.filter((_, i) => i !== idx));

  const submitPrescription = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post("/prescriptions", {
        healthId: patient.healthId,
        diagnosis,
        cause,
        notes,
        items: items.map((it) => ({ ...it, durationDays: Number(it.durationDays) })),
      });
      showToast("Prescription created", "success");
      setDiagnosis(""); setCause(""); setNotes("");
      setItems([{ medicineName: "", dosage: "", durationDays: 5 }]);
      loadHistory(patient.healthId);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create prescription", "error");
    }
  };

  const isVerified = patient?.verificationStatus === "VERIFIED";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Patient Lookup</h1>
      <p className="text-gray-500 text-sm mb-6">Search by Health ID or scan a patient's QR code.</p>

      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
  <form onSubmit={handleManualLookup} className="flex gap-2 mb-3">
    <input
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

  <PatientNameSearch onSelect={(hid) => { setHealthId(hid); lookupPatient(hid); }} />
</div>

      {patient && (
        <>
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-semibold text-gray-800 mb-1">{patient.fullName}</h2>
                <p className="text-sm text-gray-500">
                  Health ID: {patient.healthId} · DOB {patient.dateOfBirth} · {patient.phone} · {patient.location} · Blood: {patient.bloodGroup}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                isVerified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
              }`}>
                {patient.verificationStatus}
              </span>
            </div>
          </div>

          {!isVerified ? (
            <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 text-sm text-yellow-800">
              This patient's registration hasn't been verified by an admin yet.
            </div>
          ) : (
            <>
              <form onSubmit={submitPrescription} className="bg-white rounded-xl shadow-sm border p-6 mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Diagnosis &amp; Prescription</h3>

                <div className="grid md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Diagnosis</label>
                    <input required value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="e.g. Viral fever" className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Cause</label>
                    <input value={cause} onChange={(e) => setCause(e.target.value)}
                      placeholder="e.g. Seasonal infection" className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                </div>

                <label className="block text-sm font-medium mb-1 text-gray-700">Notes (optional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                  className="w-full border rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-teal-500" />

                <label className="block text-sm font-medium mb-2 text-gray-700">Medicines</label>
                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-center">
                    <input required placeholder="Medicine name" value={it.medicineName}
                      onChange={(e) => updateItem(idx, "medicineName", e.target.value)}
                      className="col-span-5 border rounded-md px-2 py-1.5 text-sm" />
                    <input placeholder="Dosage (e.g. 1-0-1)" value={it.dosage}
                      onChange={(e) => updateItem(idx, "dosage", e.target.value)}
                      className="col-span-4 border rounded-md px-2 py-1.5 text-sm" />
                    <input required type="number" min={1} placeholder="Days" value={it.durationDays}
                      onChange={(e) => updateItem(idx, "durationDays", e.target.value)}
                      className="col-span-2 border rounded-md px-2 py-1.5 text-sm" />
                    <button type="button" onClick={() => removeItemRow(idx)} className="col-span-1 text-red-600 text-xs">✕</button>
                  </div>
                ))}
                <button type="button" onClick={addItemRow} className="text-sm text-teal-700 underline mb-4">+ Add medicine</button>

                <button className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-md w-full">
                  Save Prescription
                </button>
              </form>

                      <div>
          <h3 className="font-semibold text-gray-800 mb-3">Previous Prescriptions</h3>
          <PrescriptionPager prescriptions={history} />
        </div>
            </>
          )}
        </>
      )}
    </div>
  );
}