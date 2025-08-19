"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function EditProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    about: "",
    skills: "",
    image: null,
  });


  // ✅ Fetch profile data
  useEffect(() => {
    if (status === "loading") return; // Wait until session is loaded

    if (!session?.user?.username) {
      router.push("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        toast.loading("Loading profile...");
        const res = await axios.get(`/api/user/me`);
        const { name, email, about, skills } = res.data;
        setForm({
          name: name || "",
          email: email || "",
          about: about || "",
          skills: skills ? skills.join(", ") : "",
          image: null,
        });
        toast.dismiss();
      } catch (err) {
        toast.dismiss();
        toast.error("Failed to load profile.");
        console.error(err);
      }
    };

    fetchProfile();
  }, [session, status, router]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Update profile
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    toast.loading("Saving changes...");

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("about", form.about);
      formData.append("skills", form.skills);
      if (form.image) {
        formData.append("image", form.image);
      }

      await axios.put(`/api/user/update`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.dismiss();
      toast.success("Profile updated successfully!");
      router.push(`/profile/${session.user.username}`);
    } catch (err) {
      toast.dismiss();
      toast.error(err?.response?.data?.message || "Failed to update profile.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(244,242,238)] py-8 text-black">
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          Edit Profile
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20"
      >
        <div className="mb-6">
          <label className="block mb-2 font-semibold text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md"
            placeholder="Enter your full name"
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-semibold text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md"
            placeholder="Enter your email address"
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-semibold text-gray-700">About</label>
          <textarea
            name="about"
            value={form.about}
            onChange={handleChange}
            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md resize-none"
            rows={4}
            placeholder="Tell us about yourself..."
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-semibold text-gray-700">
            Skills <span className="text-gray-500 text-sm font-normal">(comma-separated)</span>
          </label>
          <input
            type="text"
            name="skills"
            value={form.skills}
            onChange={handleChange}
            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md"
            placeholder="React, JavaScript, Node.js, etc."
          />
        </div>

        <div className="mb-8">
          <label className="block mb-2 font-semibold text-gray-700">Profile Image</label>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setForm({ ...form, image: e.target.files[0] })}
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gradient-to-r file:from-blue-500 file:to-blue-600 file:text-white hover:file:from-blue-600 hover:file:to-blue-700 file:cursor-pointer"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
            loading
              ? "bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Saving Changes...
            </div>
          ) : (
            "Save Changes"
          )}
        </button>
      </form>
    </div>
  </div>
  );
}
