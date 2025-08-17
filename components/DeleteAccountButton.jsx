"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import axios from "axios";
import toast from "react-hot-toast";

export default function DeleteAccountButton({ userId }) {
  const router = useRouter();

  const handleDelete = () => {
    toast((t) => (
      <div className="text-center">
        <p className="font-medium">Delete your account?</p>
        <p className="text-sm text-gray-500">This action cannot be undone.</p>
        <div className="flex justify-center space-x-2 mt-3">
          {/* Yes button */}
          <button
            onClick={async () => {
              try {
                await axios.delete(`/api/user/${userId}`);
                toast.success("Account deleted successfully.");
                toast.dismiss(t.id);

                // Sign out the user
                await signOut({ redirect: false });

                // Redirect to homepage
                router.push("/");
              } catch (err) {
                console.error(err);
                toast.error("Failed to delete account.");
                toast.dismiss(t.id);
              }
            }}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Yes
          </button>

          {/* No button */}
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-300 text-black rounded hover:bg-gray-400"
          >
            No
          </button>
        </div>
      </div>
    ), { duration: 4000, position: "top-center" });
  };

  return (
    <button
      onClick={handleDelete}
      className="bg-gray-200 text-black px-4 py-2 rounded hover:bg-red-100 cursor-pointer"
    >
      Delete Account
    </button>
  );
}
