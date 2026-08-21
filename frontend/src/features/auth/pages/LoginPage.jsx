<<<<<<< HEAD
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Globe2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Smartphone,
  Users,
  UserRound,
  Building2,
  UserCog,
  LogIn,
  CheckCircle2,
} from "lucide-react";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import prayagrajImage from "../../../assets/prayagraj-temple.jpg";


/* =========================================================
   VALIDATION
========================================================= */

const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Email or phone number is required"),

  password: z
    .string()
    .min(6, "Password must contain at least 6 characters"),

  remember: z.boolean().optional(),
});


/* =========================================================
   ROLES
========================================================= */

const roles = [
  {
    id: "tourist",
    title: "Tourist",
    icon: UserRound,
  },
  {
    id: "authority",
    title: "Authority",
    icon: Building2,
  },
  {
    id: "admin",
    title: "Admin",
    icon: UserCog,
  },
];


/* =========================================================
   LOGIN PAGE
========================================================= */

export default function LoginPage() {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState("tourist");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
      remember: false,
    },
  });


  /* =======================================================
     SUBMIT
  ====================================================== */

  const onSubmit = async (data) => {
    setLoginError("");

    try {
      console.log({
        ...data,
        role: selectedRole,
      });

      if (selectedRole === "tourist") {
        navigate("/tourist/dashboard");
      } else {
        navigate("/authority/dashboard");
      }

    } catch (error) {
      console.error(error);

      setLoginError(
        "Unable to login. Please check your credentials."
      );
    }
  };


  return (
    <main className="h-screen w-screen overflow-hidden bg-[#f5f6f8] fixed inset-0">

      {/* =====================================================
         MAIN CONTAINER
      ====================================================== */}

      <div className="flex h-full w-full">


        {/* ===================================================
            LEFT IMAGE SECTION
        =================================================== */}

        <section className="relative hidden h-full w-1/2 overflow-hidden lg:block">

          {/* IMAGE */}

          <img
            src={prayagrajImage}
            alt="Prayagraj temple"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />


          {/* DARK OVERLAY */}

          <div className="absolute inset-0 bg-gradient-to-t from-[#06111f]/95 via-[#06111f]/30 to-transparent" />


          {/* SUBTLE RED TONE */}

          <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-transparent to-orange-400/10" />


          {/* =================================================
              BRAND
          ================================================== */}

          <div className="absolute left-8 top-6 z-10 flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/15 backdrop-blur-md">

              <ShieldCheck
                size={22}
                className="text-white"
              />

            </div>

            <div>

              <p className="text-[15px] font-semibold text-white">
                Smart Tourist Safety
              </p>

              <p className="text-xs text-red-200">
                Prayagraj
              </p>

            </div>

          </div>


          {/* =================================================
              HERO TEXT
          ================================================== */}

          <div className="absolute bottom-24 left-8 right-10 z-10">

            <div className="mb-3 flex items-center gap-2">

              <span className="h-2 w-2 rounded-full bg-emerald-400" />

              <span className="text-xs text-white/85">
                Your journey. Your safety. Our responsibility.
              </span>

            </div>


            <h1 className="max-w-xl text-3xl font-bold leading-[1.08] tracking-tight text-white xl:text-4xl">

              Explore Prayagraj
              <br />

              <span className="text-red-300">
                with confidence.
              </span>

            </h1>


            <p className="mt-3 max-w-lg text-xs leading-5 text-white/70">

              Stay connected with your group, access emergency
              assistance and travel safely through Prayagraj.

            </p>

          </div>


          {/* =================================================
              FEATURES
          ================================================== */}

          <div className="absolute bottom-4 left-6 right-6 z-10">

            <div className="rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 backdrop-blur-xl">

              <div className="grid grid-cols-3 divide-x divide-white/15">

                <Feature
                  icon={ShieldCheck}
                  title="Real-time Safety"
                  description="Live monitoring"
                />

                <Feature
                  icon={Users}
                  title="Group Safety"
                  description="Stay connected"
                />

                <Feature
                  icon={LockKeyhole}
                  title="Privacy First"
                  description="Protected data"
                />

              </div>

            </div>

          </div>

        </section>


        {/* ===================================================
            RIGHT LOGIN SECTION
        =================================================== */}

        <section className="flex h-full w-full flex-col bg-white lg:w-1/2">

          {/* =================================================
              TOP BAR
          ================================================== */}

          <div className="flex shrink-0 justify-end px-6 py-3 sm:px-10">

            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >

              <Globe2 size={14} />

              English

              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>

            </button>

          </div>


          {/* =================================================
              FORM SCROLL AREA
          ================================================== */}

          <div className="flex-1 flex flex-col justify-center overflow-hidden">

            <div className="mx-auto flex w-full max-w-[420px] flex-col px-6 py-2 sm:px-10">


              {/* =================================================
                  HEADER
              ================================================== */}

              <div className="mb-3 text-center">

                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">

                  <ShieldCheck
                    size={20}
                    className="text-red-600"
                  />

                </div>


                <h2 className="text-xl font-bold tracking-tight text-slate-900">

                  Welcome back!

                </h2>


                <p className="mt-0.5 text-xs text-slate-500">

                  Login to your account to continue safely.

                </p>

              </div>


              {/* =================================================
                  ROLE SELECTOR
              ================================================== */}

              <div className="mb-3 grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1">

                {roles.map((role) => {

                  const Icon = role.icon;

                  const active = selectedRole === role.id;

                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`
                        flex h-9 items-center justify-center gap-1.5
                        rounded-lg text-xs font-semibold transition truncate px-1
                        ${active
                          ? "bg-white text-red-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                        }
                      `}
                    >

                      <Icon size={14} className="shrink-0" />

                      <span className="truncate">
                        {role.title}
                      </span>

                    </button>
                  );

                })}

              </div>


              {/* =================================================
                  FORM
              ================================================== */}

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-2.5"
              >


                {/* EMAIL */}

                <div>

                  <label
                    htmlFor="identifier"
                    className="mb-1 block text-[11px] font-semibold text-slate-800"
                  >
                    Email or Phone Number
                  </label>


                  <div className="relative">

                    <Mail
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />


                    <input
                      id="identifier"
                      type="text"
                      placeholder="Enter email or phone number"
                      {...register("identifier")}
                      className={`
                        h-9 w-full rounded-xl border
                        bg-white pl-9 pr-3
                        text-xs text-slate-900
                        outline-none transition
                        placeholder:text-slate-400
                        focus:border-red-400
                        focus:ring-2
                        focus:ring-red-50
                        ${errors.identifier
                          ? "border-red-400"
                          : "border-slate-200"
                        }
                      `}
                    />

                  </div>


                  {errors.identifier && (
                    <p className="mt-0.5 text-[10px] text-red-500">
                      {errors.identifier.message}
                    </p>
                  )}

                </div>


                {/* PASSWORD */}

                <div>

                  <div className="mb-1 flex items-center justify-between">

                    <label
                      htmlFor="password"
                      className="text-[11px] font-semibold text-slate-800"
                    >
                      Password
                    </label>


                    <Link
                      to="/forgot-password"
                      className="text-[10px] font-semibold text-red-600 hover:text-red-700"
                    >
                      Forgot Password?
                    </Link>

                  </div>


                  <div className="relative">

                    <LockKeyhole
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />


                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      {...register("password")}
                      className={`
                        h-9 w-full rounded-xl border
                        bg-white pl-9 pr-9
                        text-xs text-slate-900
                        outline-none transition
                        placeholder:text-slate-400
                        focus:border-red-400
                        focus:ring-2
                        focus:ring-red-50
                        ${errors.password
                          ? "border-red-400"
                          : "border-slate-200"
                        }
                      `}
                    />


                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((prev) => !prev)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >

                      {showPassword ? (
                        <EyeOff size={15} />
                      ) : (
                        <Eye size={15} />
                      )}

                    </button>

                  </div>


                  {errors.password && (
                    <p className="mt-0.5 text-[10px] text-red-500">
                      {errors.password.message}
                    </p>
                  )}

                </div>


                {/* REMEMBER */}

                <label className="flex items-center gap-2 pt-0.5">

                  <input
                    type="checkbox"
                    {...register("remember")}
                    className="h-3.5 w-3.5 accent-red-600"
                  />

                  <span className="text-xs text-slate-500">
                    Remember me
                  </span>

                </label>


                {/* ERROR */}

                {loginError && (
                  <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                    {loginError}
                  </div>
                )}


                {/* LOGIN */}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-red-600 text-xs font-semibold text-white shadow-md shadow-red-600/20 transition hover:bg-red-700 disabled:opacity-60 mt-1"
                >

                  {isSubmitting ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn size={14} />

                      Login

                      <ArrowRight
                        size={14}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}

                </button>

              </form>


              {/* =================================================
                  DIVIDER
              ================================================== */}

              <div className="my-2.5 flex items-center gap-3">

                <div className="h-px flex-1 bg-slate-200" />

                <span className="text-[10px] text-slate-400">
                  or continue with
                </span>

                <div className="h-px flex-1 bg-slate-200" />

              </div>


              {/* =================================================
                  SOCIAL
              ================================================== */}

              <div className="grid grid-cols-2 gap-2">

                <button
                  type="button"
                  className="flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >

                  <span className="font-bold text-[#4285F4]">
                    G
                  </span>

                  Google

                </button>


                <button
                  type="button"
                  className="flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >

                  <Smartphone size={14} />

                  Mobile OTP

                </button>

              </div>


              {/* =================================================
                  REGISTER
              ================================================== */}

              <p className="mt-3 text-center text-xs text-slate-500">

                Don't have an account?

                <Link
                  to="/register"
                  className="ml-1 font-semibold text-red-600 hover:text-red-700"
                >
                  Register Now →
                </Link>

              </p>


              {/* =================================================
                  SECURITY
              ================================================== */}

              <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">

                <CheckCircle2
                  size={12}
                  className="text-emerald-500"
                />

                Secure login · Privacy protected

              </div>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}


/* =========================================================
   FEATURE
========================================================= */

function Feature({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="flex items-center gap-2 px-1.5">

      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10">

        <Icon
          size={14}
          className="text-white"
        />

      </div>

      <div className="min-w-0">

        <p className="truncate text-[10px] font-semibold text-white">
          {title}
        </p>

        <p className="truncate text-[9px] text-white/50">
          {description}
        </p>

      </div>

    </div>
  );
}
=======
import React from 'react';
import { Link } from 'react-router-dom';

export function LoginPage() {
  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
      <p className="text-center text-gray-500 mb-4">Form placeholder</p>
      <div className="flex justify-between mt-4 text-sm">
        <Link to="/" className="text-blue-500 hover:underline">Back Home</Link>
        <Link to="/register" className="text-blue-500 hover:underline">Create account</Link>
      </div>
      <div className="mt-8 pt-4 border-t flex flex-col gap-2 text-sm text-center">
        <p>Demo links:</p>
        <Link to="/tourist/dashboard" className="text-blue-500 hover:underline">Go to Tourist Dashboard</Link>
        <Link to="/authority/dashboard" className="text-blue-500 hover:underline">Go to Authority Dashboard</Link>
      </div>
    </div>
  );
}
>>>>>>> 49c12ff8e761bf868f772210a5186b9bb53cbbfe
