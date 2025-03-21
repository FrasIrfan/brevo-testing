"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useDispatch } from "react-redux";
import { setUser } from "@/store/userSlice";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Generate verification link
      const verificationLink = `${window.location.origin}/verify?email=${email}`;

      // Send verification email
      await fetch("/api/sendVerification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, verificationLink }),
      });

      dispatch(setUser(email));
      alert("Account created! Check your email for verification.");
    } catch (error) {
      console.error("Error registering:", error);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-gray-100 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold">Register</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="p-2 border rounded"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="p-2 border rounded"
      />
      <button onClick={handleRegister} className="px-4 py-2 bg-blue-500 text-white rounded">
        Register
      </button>
    </div>
  );
};

export default Register;
