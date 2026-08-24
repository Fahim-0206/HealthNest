import { useState } from "react";
import axiosClient from "../api/axiosClient";
import { useToast } from "../context/ToastContext";

export default function PatientNameSearch({ onSelect }) {
  const [name, setName] = useState("");
  const [results, setResults] = useState(null);
  const { showToast } = useToast();

  const search = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosClient.get(`/patient/search?name=${encodeURIComponent(name)}`);
      setResults(res.data);
      if (res.data.length === 0) showToast("No patients found with that name", "error");
    } catch {
      showToast("Search failed", "error");
    }
  };

  return (
    <div>
      <form onSubmit={search} className="flex gap-2 mb-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Or search by patient name..."
          className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-md text-sm">Search</button>
      </form>

      {results && results.length > 0 && (
        <div className="border rounded-md divide-y mb-2">
          {results.map((p) => (
            <button
              key={p.patientId}
              onClick={() => { onSelect(p.healthId); setResults(null); setName(""); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex justify-between"
            >
              <span>{p.fullName}</span>
              <span className="text-gray-400 font-mono text-xs">{p.healthId}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}