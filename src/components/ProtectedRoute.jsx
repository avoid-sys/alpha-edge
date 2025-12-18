import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { useNavigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const session = supabase.auth.session();
    if (!session) navigate("/login");
    else setLoading(false);
  }, []);

  if (loading) return null;
  return children;
}
