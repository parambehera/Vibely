import React from 'react'
import Image from "next/image";
import Link from "next/link";
const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col  bg-white">
    {/* Hero Section */}
    <main className="flex flex-1 flex-col lg:flex-row items-center justify-between px-8 lg:px-16 py-12 lg:py-20">
      {/* Left Section */}
      <div className="max-w-lg space-y-6">
        <h2 className="text-4xl font-bold text-gray-800 leading-tight">
          Welcome to your <br /> Social community
        </h2>
        <div className="space-y-3">
        <Link href="/login">
          <button className="w-full flex items-center justify-center px-4 py-2 border rounded bg-white hover:bg-gray-50 text-black cursor-pointer" >
            Get Started
          </button>
          </Link>
          <Link href="/register">
          <button className="w-full flex items-center justify-center px-4 py-2 border rounded bg-white hover:bg-gray-50 text-black cursor-pointer mt-1">
            Sign in with email
          </button>
          </Link>
        </div>
        <p className="text-sm text-gray-500">
          By clicking Continue to join or sign in, you agree to Vibely’s{" "}
          <Link href="#" className="text-blue-600 hover:underline">User Agreement</Link>,{" "}
          <Link href="#" className="text-blue-600 hover:underline">Privacy Policy</Link>, and{" "}
          <Link href="#" className="text-blue-600 hover:underline">Cookie Policy</Link>.
        </p>
        <p className="text-sm text-black">
          New to Vibely?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">Join now</Link>
        </p>
      </div>

      {/* Right Section */}
      <div className="mt-10 lg:mt-0 lg:ml-10">
        <Image
          src="/social.jpg"
          alt="Community"
          width={600}
          height={400}
          className="rounded-lg shadow-lg"
        />
      </div>
    </main>
  </div>
  )
}

export default Landing