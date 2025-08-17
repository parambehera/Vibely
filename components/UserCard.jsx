export default function UserCard({ user }) {
  return (
    <div className="bg-white p-4 rounded shadow space-y-2">
      <img src={user.image} alt="Profile" className="w-16 h-16 rounded-full" />
      <h2 className="text-xl font-semibold">{user.name}</h2>
      <p className="text-gray-500">@{user.username}</p>
      {/* Follow/Unfollow button will be added later */}
    </div>
  );
}
