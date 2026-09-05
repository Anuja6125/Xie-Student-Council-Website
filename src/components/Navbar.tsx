import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Menu, X, ChevronDown, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [userRole, setUserRole] = useState<string | null>(null);
  const [userData, setUserData] = useState<any | null>(null);

  const navigate = useNavigate();
  const profileRef = useRef<HTMLDivElement | null>(null);

  const loadUserData = () => {
    const role = localStorage.getItem("userRole");
    const data = localStorage.getItem("userData");

    setUserRole(role);

    if (data) {
      try {
        setUserData(JSON.parse(data));
      } catch {
        setUserData(null);
      }
    } else {
      setUserData(null);
    }
  };

  useEffect(() => {
    loadUserData();

    const handleUserLogin = () => {
      setTimeout(loadUserData, 100);
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "userRole" || e.key === "userData") {
        loadUserData();
      }
    };

    window.addEventListener("userLogin", handleUserLogin);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("userLogin", handleUserLogin);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userData");

    setUserRole(null);
    setUserData(null);

    navigate("/");
  };

  const profileName =
    userData?.name ||
    userData?.email ||
    userData?.username ||
    "Profile";

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 py-3 transition-all",
        isScrolled ? "bg-white/80 backdrop-blur shadow-sm" : "bg-transparent"
      )}
    >
      <div className="container flex items-center justify-between px-6">

        <img src="/xiesc.png" className="h-14" />

        <nav className="hidden md:flex items-center space-x-8">

          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/gallery">Gallery</Link>
          <Link to="/events">Events</Link>

          {!userRole && (
            <>
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>

              <Link to="/signup">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}

          {userRole && (
            <div className="relative" ref={profileRef}>

              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2"
              >
                <User size={18} />
                {profileName}
                <ChevronDown size={16} />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow">

                  {userRole === "student" && (
                    <Link
                      to="/student-dashboard"
                      className="block px-4 py-2 hover:bg-gray-100"
                    >
                      Dashboard
                    </Link>
                  )}

                  {(userRole === "admin" || userRole === "super_admin") && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 hover:bg-gray-100"
                    >
                      Admin Dashboard
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>

                </div>
              )}
            </div>
          )}
        </nav>

        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
};

export default Navbar;