import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { useToast } from "../../context/ToastContext";

export default function AdminLabTechs() {
  const [labTechs, setLabTechs] = useState([]);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [newCreds, setNewCreds] = useState(null);
  const { showToast } = useToast();

  const load = () => {
    axiosClient.get("/admin/lab-technicians").then((r) => setLabTechs(r.data));
  };

  useEffect(load, []);

  const downloadCreds = (creds) => {
    const text = `HealthNest Lab Technician Login Credentials\n\nName: ${creds.fullName || ""}\nEmail: ${creds.email}\nTemporary Password: ${creds.temporaryPassword}\n\nPlease change this password after first login.`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${creds.email}-credentials.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addLabTech = async (e) => {
    e.preventDefault();
    setNewCreds(null);
    try {
      const res = await axiosClient.post("/admin/lab-technicians", { fullName: name, email });
      setNewCreds({ ...res.data, fullName: name });
      showToast("Lab technician account created", "success");
      setName(""); setEmail("");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create account", "error");
    }
  };

  const resetPassword = async (userId, email) => {
    try {
      const res = await axiosClient.post(`/admin/lab-technicians/${userId}/reset-password`);
      setNewCreds({ ...res.data, fullName: email });
      showToast("Password reset — download new credentials below", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reset password", "error");
    }
  };

  const filtered = labTechs.filter((l) => {
    const q = search.toLowerCase();
    return l.fullName.toLowerCase().includes(q) || l.email.toLowerCase().includes(q);
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Manage Lab Technicians</h1>
      <p className="text-gray-500 text-sm mb-6">Onboard lab staff who can attach reports to prescriptions.</p>

      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="font-semibold text-gray-800 mb-3">Add New Lab Technician</h2>

        {newCreds && (
          <div className="bg-teal-50 border border-teal-300 rounded-md p-3 mb-3 text-sm flex justify-between items-center flex-wrap gap-2">
            <div>
              Credentials ready — share securely:<br />
              <b>Email:</b> {newCreds.email}<br />
              <b>Temporary Password:</b> <code className="bg-white px-1 rounded">{newCreds.temporaryPassword}</code>
            </div>
            <button
              onClick={() => downloadCreds(newCreds)}
              className="bg-teal-700 hover:bg-teal-800 text-white text-xs px-3 py-1.5 rounded-md whitespace-nowrap"
            >
              Download as .txt
            </button>
          </div>
        )}

        <form onSubmit={addLabTech} className="flex gap-2 flex-wrap">
          <input required value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Full name" className="flex-1 min-w-[180px] border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email" className="flex-1 min-w-[180px] border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <button className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-md whitespace-nowrap">
            Create Account
          </button>
        </form>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email..."
        className="w-full border rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-teal-500"
      />

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Phone</th>
              <th className="text-left px-4 py-3">Location</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.userId} className="border-t">
                <td className="px-4 py-3 font-medium text-gray-800">{l.fullName}</td>
                <td className="px-4 py-3 text-gray-600">{l.email}</td>
                <td className="px-4 py-3 text-gray-600">{l.phone || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{l.location || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${l.profileCompleted ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {l.profileCompleted ? "Active" : "Pending setup"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => resetPassword(l.userId, l.email)} className="text-teal-700 text-xs underline">
                    Reset Password
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No lab technicians match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}