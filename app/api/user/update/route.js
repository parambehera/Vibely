import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import cloudinary from "@/lib/cloudinary";

export async function PUT(req) {
  try {
    await connectToDB();

    const session = await getServerSession(authOptions);
    if (!session) return new Response("Unauthorized", { status: 401 });

    const formData = await req.formData();
    const name = formData.get("name");
    const email = formData.get("email");
    const about = formData.get("about");
    const skills = formData.get("skills")?.split(",").map(s => s.trim()) || [];
    const imageFile = formData.get("image");

    let imageUrl = session.user.image; // Keep old image if none uploaded

    if (imageFile && imageFile.size > 0) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());

      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "profiles" },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        ).end(buffer);
      });

      imageUrl = result.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { name, email, about, skills, image: imageUrl },
      { new: true }
    );

    return new Response(JSON.stringify(updatedUser), { status: 200 });
  } catch (err) {
    console.error("[USER_UPDATE_ERROR]", err);
    return new Response("Error updating profile", { status: 500 });
  }
}
