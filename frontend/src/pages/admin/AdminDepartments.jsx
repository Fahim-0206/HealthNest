import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { useToast } from "../../context/ToastContext";

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const { showToast } = useToast();

  const load = () => axiosClient.get("/departments").then((r) => setDepartments(r.data));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post("/departments", { name, description });
      showToast("Department added", "success");
      setName(""); setDescription("");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add department", "error");
    }
  };

  const remove = async (id) => {
    try {
      await axiosClient.delete(`/departments/${id}`);
      showToast("Department removed", "success");
      load();
    } catch {
      showToast("Failed to remove", "error");
    }
  };

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Departments</h1>
      <p className="text-gray-500 text-sm mb-6">Manage hospital departments doctors and patients select from.</p>

      <form onSubmit={create} className="bg-white rounded-xl shadow-sm border p-6 mb-6 flex gap-2 flex-wrap">
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Department name"
          className="flex-1 min-w-[180px] border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)"
          className="flex-1 min-w-[180px] border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
        <button className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-md">Add</button>
      </form>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search departments..."
        className="w-full border rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-teal-500"
      />

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr><th className="text-left px-4 py-3">Name</th><th className="text-left px-4 py-3">Description</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="px-4 py-3 font-medium text-gray-800">{d.name}</td>
                <td className="px-4 py-3 text-gray-600">{d.description}</td>
                <td className="px-4 py-3">
                  <button onClick={() => remove(d.id)} className="text-red-600 text-xs underline">Remove</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">No departments match your search.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}