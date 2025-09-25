"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth";
import { User } from "@/types/User";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
  });

  // 🔹 Fetch User
  useEffect(() => {
    const fetchData = async () => {
      if (!authService.isAuthenticated()) {
        router.push("/login");
        return;
      }

      const user = authService.getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }

      setCurrentUser(user);
      setFormData(user);
      setLoading(false);
    };

    fetchData();
  }, [router]);

  // 🔹 Logout
  const handleLogout = () => {
    authService.logout();
    router.push("/login");
  };

  // 🔹 Update Profile - PLACEHOLDER (endpoint doesn't exist yet)
  const handleUpdateProfile = async () => {
    if (!formData) return;

    // For now, just update localStorage since backend endpoint doesn't exist
    const { firstName, lastName, email } = formData;
    
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      alert("Please fill in all fields");
      return;
    }

    try {
      // Update local storage for now
      const updatedUser = {
        ...currentUser!,
        firstname: firstName.trim(),
        lastname: lastName.trim(),
        email: email.trim(),
      };
      
      // Update localStorage
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      setCurrentUser(updatedUser);
      setIsEditing(false);
      alert("Profile updated successfully! (Note: This is stored locally. Backend endpoint needed for persistent updates.)");
      
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update profile");
    }
  };

  // 🔹 Delete Account - FIXED: Use correct endpoint
  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;

    if (!currentUser?.id) {
      alert("User ID not found. Please logout and login again.");
      return;
    }

    try {
      const token = authService.getToken();
      
      if (!token) {
        alert("Authentication required. Please login again.");
        router.push("/login");
        return;
      }

      console.log("Deleting user with ID:", currentUser.id);

      // FIXED: Use the correct endpoint format
      const res = await fetch(`http://localhost:4000/api/users/${currentUser.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      console.log("Delete response status:", res.status);

      if (res.ok) {
        authService.logout();
        router.push("/signup");
        alert("Account deleted successfully!");
      } else {
        const errorData = await res.json().catch(() => null);
        console.error("Delete failed:", errorData);
        alert(errorData?.message || `Failed to delete account (Status: ${res.status})`);
      }
    } catch (err: any) {
      console.error("Delete error:", err);
      
      if (err.message.includes("Failed to fetch")) {
        alert("Cannot connect to server. Please check if the backend is running on http://localhost:4000");
      } else {
        alert("Failed to delete account. Please try again later.");
      }
    }
  };

  // 🔹 Change Password - PLACEHOLDER (endpoint doesn't exist yet)
  const handleChangePassword = async () => {
    if (!passwordData.oldPassword || !passwordData.newPassword) {
      alert("Please fill in both fields");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert("New password must be at least 6 characters long");
      return;
    }

    // Placeholder - this feature needs backend endpoint
    alert("Change password feature is not yet implemented on the backend. Please contact the administrator to add this endpoint: POST /api/auth/change-password");
    
    // Clear form
    setPasswordData({ oldPassword: "", newPassword: "" });
    setIsChangingPassword(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg font-medium text-gray-600 animate-pulse">
          Loading dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-purple-700 to-indigo-600 text-white p-6 shadow-xl">
        <h2 className="text-2xl font-bold mb-8">Dashboard</h2>
        <nav className="space-y-3">
          <button
            onClick={() => setIsEditing(true)}
            className="w-full py-2 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 font-medium shadow-md transition"
            title="Update profile locally (backend endpoint needed for persistence)"
          >
            Edit Profile
          </button>
          <button
            onClick={() => setIsChangingPassword(true)}
            className="w-full py-2 px-4 rounded-lg bg-yellow-500 hover:bg-yellow-600 font-medium shadow-md transition"
            title="Feature not yet implemented on backend"
          >
            Change Password
          </button>
          <button
            onClick={handleDeleteAccount}
            className="w-full py-2 px-4 rounded-lg bg-red-500 hover:bg-red-600 font-medium shadow-md transition"
            title="Permanently delete your account"
          >
            Delete Account
          </button>
          <button
            onClick={handleLogout}
            className="w-full py-2 px-4 rounded-lg bg-gray-800 hover:bg-black font-medium shadow-md transition"
          >
            Logout
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-10">
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold text-gray-800">
            Welcome, {currentUser?.firstName} {currentUser?.lastName}
          </h1>
          <p className="text-gray-600 mt-2">Manage your account below 👇</p>
        </header>

        {/* Profile Info */}
        <section className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-purple-700 mb-6">
            Profile Information
          </h2>

          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Profile updates are stored locally only. Backend endpoint needed for persistent updates.
                </p>
              </div>
              
              {["firstname", "lastname", "email"].map((key) => (
                <div key={key}>
                  <label className="font-semibold capitalize">
                    {key === "firstname" ? "First Name" : key === "lastname" ? "Last Name" : key}
                  </label>
                  <input
                    type={key === "email" ? "email" : "text"}
                    value={(formData as any)[key] || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, [key]: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg mt-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              ))}

              <div className="col-span-2 flex gap-4 mt-6">
                <button
                  onClick={handleUpdateProfile}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md transition duration-200"
                >
                  Save Changes (Local Only)
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(currentUser || {});
                  }}
                  className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg shadow-md transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : isChangingPassword ? (
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Feature Not Available:</strong> Change password endpoint not yet implemented on backend.
                </p>
              </div>
              
              <div>
                <label className="font-semibold">Current Password</label>
                <input
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      oldPassword: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded-lg mt-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled
                  placeholder="Feature not yet implemented"
                />
              </div>
              <div>
                <label className="font-semibold">New Password (min 6 characters)</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded-lg mt-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled
                  placeholder="Feature not yet implemented"
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleChangePassword}
                  className="px-4 py-2 bg-gray-400 text-white rounded-lg shadow-md cursor-not-allowed"
                  disabled
                >
                  Feature Not Available
                </button>
                <button
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordData({ oldPassword: "", newPassword: "" });
                  }}
                  className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg shadow-md transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
              <div>
                <p className="font-semibold">First Name</p>
                <p className="text-gray-900">{currentUser?.firstName}</p>
              </div>
              <div>
                <p className="font-semibold">Last Name</p>
                <p className="text-gray-900">{currentUser?.lastName}</p>
              </div>
              
              <div>
                <p className="font-semibold">Email</p>
                <p className="text-gray-900">{currentUser?.email}</p>
              </div>
              <div>
                <p className="font-semibold">User ID</p>
                <p className="text-gray-900">{currentUser?.id}</p>
              </div>
              <div>
                <p className="font-semibold">Member Since</p>
                <p className="text-gray-900">
                  {currentUser?.createdAt
                    ? new Date(currentUser.createdAt).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="font-semibold">Last Updated</p>
                <p className="text-gray-900">
                  {currentUser?.updatedAt
                    ? new Date(currentUser.updatedAt).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}