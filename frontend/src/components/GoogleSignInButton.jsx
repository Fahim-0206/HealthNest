import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleSignInButton() {
  const ref = useRef(null);
  const { googleLogin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!window.google || !ref.current) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          const data = await googleLogin(response.credential);
          showToast("Signed in with Google", "success");
          if (data.role === "PATIENT" && !data.healthId) {
            navigate("/patient/complete-profile");
          } else {
            navigate("/dashboard");
          }
        } catch (err) {
          showToast(err.response?.data?.message || "Google sign-in failed", "error");
        }
      },
    });

    window.google.accounts.id.renderButton(ref.current, {
      theme: "outline",
      size: "large",
      width: "100%",
    });
  }, []);

  return <div ref={ref} className="flex justify-center" />;
}