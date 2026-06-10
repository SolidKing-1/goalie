"use client";

import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import * as THREE from "three";

// ─── Lottie floater config ────────────────────────────────────────────────────
// Free Lottiefiles JSONs. All tinted green via CSS filter.
// Swap any URL for your own Lottie JSON if preferred.
const LOTTIE_ITEMS = [
  {
    // Target / goal
    url: "https://assets10.lottiefiles.com/packages/lf20_touohxv0.json",
    style: { top: "8%", left: "5%", width: 110, height: 110 },
    phase: 0,
  },
  {
    // Calendar / renewal
    url: "https://assets4.lottiefiles.com/packages/lf20_w51pcehl.json",
    style: { top: "10%", right: "7%", width: 90, height: 90 },
    phase: 1.2,
  },
  {
    // Trophy
    url: "https://assets9.lottiefiles.com/packages/lf20_bdnjgvcd.json",
    style: { bottom: "12%", left: "6%", width: 100, height: 100 },
    phase: 2.4,
  },
  {
    // Wifi / streaming
    url: "https://assets3.lottiefiles.com/packages/lf20_qp1q7mct.json",
    style: { bottom: "9%", right: "8%", width: 85, height: 85 },
    phase: 0.6,
  },
  {
    // Bar chart / analytics
    url: "https://assets5.lottiefiles.com/packages/lf20_V9t630.json",
    style: { top: "44%", left: "2%", width: 78, height: 78 },
    phase: 1.8,
  },
  {
    // Clock / renewal timer
    url: "https://assets9.lottiefiles.com/packages/lf20_fcfjwiyb.json",
    style: { top: "36%", right: "3%", width: 88, height: 88 },
    phase: 3.0,
  },
];

// SVG fallbacks rendered if any Lottie URL fails to load
const SVG_FALLBACKS = [
  // Target
  `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" stroke="#b2de28" stroke-width="2.5" opacity="0.45"/>
    <circle cx="50" cy="50" r="30" stroke="#b2de28" stroke-width="2.5" opacity="0.65"/>
    <circle cx="50" cy="50" r="16" stroke="#b2de28" stroke-width="2.5" opacity="0.85"/>
    <circle cx="50" cy="50" r="6"  fill="#b2de28"/>
  </svg>`,
  // Calendar
  `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="20" width="80" height="70" rx="8" stroke="#b2de28" stroke-width="2.5" fill="rgba(178,222,40,0.05)"/>
    <line x1="10" y1="38" x2="90" y2="38" stroke="#b2de28" stroke-width="2" opacity="0.6"/>
    <line x1="30" y1="10" x2="30" y2="30" stroke="#b2de28" stroke-width="3" stroke-linecap="round"/>
    <line x1="70" y1="10" x2="70" y2="30" stroke="#b2de28" stroke-width="3" stroke-linecap="round"/>
    <circle cx="35" cy="58" r="4" fill="#b2de28" opacity="0.9"/>
    <circle cx="50" cy="58" r="4" fill="#b2de28" opacity="0.4"/>
    <circle cx="65" cy="58" r="4" fill="#b2de28" opacity="0.4"/>
    <circle cx="35" cy="74" r="4" fill="#b2de28" opacity="0.4"/>
    <circle cx="50" cy="74" r="4" fill="#b2de28" opacity="0.7"/>
  </svg>`,
  // Trophy
  `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M30 20 H70 V52 C70 68 30 68 30 52 Z" stroke="#b2de28" stroke-width="2.5" fill="rgba(178,222,40,0.07)" stroke-linejoin="round"/>
    <path d="M30 30 C20 30 15 38 20 46 C23 50 30 50 30 50" stroke="#b2de28" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M70 30 C80 30 85 38 80 46 C77 50 70 50 70 50" stroke="#b2de28" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <line x1="50" y1="68" x2="50" y2="80" stroke="#b2de28" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="35" y1="82" x2="65" y2="82" stroke="#b2de28" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M50 30 L52 36 L58 36 L53 40 L55 46 L50 42 L45 46 L47 40 L42 36 L48 36 Z" fill="#b2de28" opacity="0.8"/>
  </svg>`,
  // Wifi
  `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 45 C28 30 72 30 85 45" stroke="#b2de28" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.45"/>
    <path d="M25 57 C34 47 66 47 75 57" stroke="#b2de28" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.65"/>
    <path d="M35 69 C40 63 60 63 65 69" stroke="#b2de28" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.85"/>
    <circle cx="50" cy="80" r="5" fill="#b2de28"/>
  </svg>`,
  // Bar chart
  `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="55" width="16" height="30" rx="3" fill="rgba(178,222,40,0.35)" stroke="#b2de28" stroke-width="1.5"/>
    <rect x="34" y="38" width="16" height="47" rx="3" fill="rgba(178,222,40,0.5)"  stroke="#b2de28" stroke-width="1.5"/>
    <rect x="56" y="22" width="16" height="63" rx="3" fill="rgba(178,222,40,0.65)" stroke="#b2de28" stroke-width="1.5"/>
    <rect x="78" y="12" width="10" height="73" rx="3" fill="#b2de28" opacity="0.85"/>
    <line x1="8" y1="88" x2="94" y2="88" stroke="#b2de28" stroke-width="2" opacity="0.5"/>
  </svg>`,
  // Clock
  `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="38" stroke="#b2de28" stroke-width="2.5" fill="rgba(178,222,40,0.04)" opacity="0.8"/>
    <circle cx="50" cy="50" r="32" stroke="#b2de28" stroke-width="1" fill="none" opacity="0.2"/>
    <line x1="50" y1="50" x2="50" y2="24" stroke="#b2de28" stroke-width="3"   stroke-linecap="round"/>
    <line x1="50" y1="50" x2="66" y2="62" stroke="#b2de28" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="50" cy="50" r="3.5" fill="#b2de28"/>
  </svg>`,
];

// ─── Lottie floater component ─────────────────────────────────────────────────
function LottieFloater({
  url,
  style,
  phase,
  fallbackSvg,
  index,
}: {
  url: string;
  style: React.CSSProperties;
  phase: number;
  fallbackSvg: string;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // Gentle float + rotate animation via rAF
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tick = () => {
      const t = Date.now() / 1000;
      const y = Math.sin(t * 0.5 + phase) * 10;
      const r = Math.sin(t * 0.3 + phase) * 4;
      el.style.transform = `translateY(${y}px) rotate(${r}deg)`;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  // Load Lottie dynamically
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let anim: { destroy: () => void } | null = null;

    import("lottie-web").then((lottie) => {
      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          anim = lottie.default.loadAnimation({
            container: el,
            renderer: "svg",
            loop: true,
            autoplay: true,
            animationData: data,
          });
          // Green tint via CSS filter
          el.style.filter =
            "drop-shadow(0 0 10px rgba(178,222,40,0.38)) hue-rotate(60deg) saturate(1.3) brightness(0.92)";
        })
        .catch(() => {
          el.innerHTML = fallbackSvg;
          el.style.filter = "drop-shadow(0 0 10px rgba(178,222,40,0.38))";
        });
    });

    return () => {
      anim?.destroy();
    };
  }, [url, fallbackSvg]);

  return (
    <div
      ref={ref}
      className="absolute pointer-events-none"
      style={{ ...style, opacity: 0.82, zIndex: 5 }}
      aria-hidden
    />
  );
}

// ─── Main login page ──────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const mountRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Three.js ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const W = container.offsetWidth;
    const H = container.offsetHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0b0d10, 1);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0d10, 0.028);
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
    camera.position.set(0, 0, 30);

    // Lights — green only
    const keyLight = new THREE.PointLight(0xb2de28, 3.5, 80);
    keyLight.position.set(-5, 8, 15);
    scene.add(keyLight);
    scene.add(new THREE.AmbientLight(0xb2de28, 0.15));

    const G = 0xb2de28;
    const objects: THREE.Object3D[] = [];

    function phongMat(opacity: number) {
      return new THREE.MeshPhongMaterial({
        color: G,
        emissive: G,
        emissiveIntensity: 0.12,
        shininess: 140,
        specular: 0xeeffaa,
        transparent: true,
        opacity,
      });
    }
    function wireMat(opacity: number) {
      return new THREE.MeshBasicMaterial({
        color: G,
        wireframe: true,
        transparent: true,
        opacity,
      });
    }
    function lineMat(opacity: number) {
      return new THREE.LineBasicMaterial({
        color: G,
        transparent: true,
        opacity,
      });
    }

    function reg(
      obj: THREE.Object3D,
      opts: {
        rotXs?: number;
        rotYs?: number;
        rotZs?: number;
        floatA?: number;
        floatS?: number;
        phase?: number;
      } = {},
    ) {
      obj.userData = {
        rotXs: opts.rotXs ?? (Math.random() - 0.5) * 0.008,
        rotYs: opts.rotYs ?? (Math.random() - 0.5) * 0.012,
        rotZs: opts.rotZs ?? 0,
        floatA: opts.floatA ?? 0.06,
        floatS: opts.floatS ?? 0.5,
        phase: opts.phase ?? Math.random() * Math.PI * 2,
        baseY: (obj as THREE.Group).position.y,
      };
      objects.push(obj);
      scene.add(obj);
    }

    // 1. Icospheres
    function makeSphere(x: number, y: number, z: number, r = 1.2) {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), phongMat(0.1)));
      g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), wireMat(0.5)));
      g.position.set(x, y, z);
      reg(g, {
        rotXs: 0.004,
        rotYs: 0.007,
        floatA: 0.07,
        phase: Math.random() * Math.PI * 2,
      });
    }
    makeSphere(-14, 4, -6, 1.4);
    makeSphere(13, -5, -5, 1.1);
    makeSphere(-9, -9, -4, 0.9);

    // 2. Torus knots (subscription loop)
    function makeKnot(x: number, y: number, z: number, scale = 1) {
      const geo = new THREE.TorusKnotGeometry(
        0.7 * scale,
        0.22 * scale,
        80,
        12,
      );
      const g = new THREE.Group();
      g.add(new THREE.Mesh(geo, phongMat(0.14)));
      g.add(new THREE.Mesh(geo, wireMat(0.48)));
      g.position.set(x, y, z);
      reg(g, {
        rotXs: 0.007,
        rotYs: 0.01,
        floatA: 0.05,
        phase: Math.random() * Math.PI * 2,
      });
    }
    makeKnot(-13, 7, -7, 0.9);
    makeKnot(12, 6, -8, 0.75);
    makeKnot(2, -12, -5, 0.65);

    // 3. Bullseye rings (goal target)
    function makeRings(
      x: number,
      y: number,
      z: number,
      scale = 1,
      rx = 0,
      ry = 0,
    ) {
      const g = new THREE.Group();
      [1.5, 1.0, 0.55, 0.2].forEach((r, i) => {
        g.add(
          new THREE.Mesh(
            new THREE.TorusGeometry(r * scale, 0.042 * scale, 8, 52),
            new THREE.MeshPhongMaterial({
              color: G,
              emissive: G,
              emissiveIntensity: 0.2 + i * 0.12,
              shininess: 120,
              transparent: true,
              opacity: 0.28 + i * 0.18,
            }),
          ),
        );
      });
      g.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(0.12 * scale, 8, 8),
          new THREE.MeshPhongMaterial({
            color: G,
            emissive: G,
            emissiveIntensity: 0.9,
          }),
        ),
      );
      g.position.set(x, y, z);
      g.rotation.set(rx, ry, 0);
      reg(g, {
        rotXs: 0.005,
        rotYs: 0.009,
        floatA: 0.08,
        phase: Math.random() * Math.PI * 2,
      });
    }
    makeRings(-15, -2, -5, 1.1, 0.5, 0.3);
    makeRings(14, 3, -6, 0.9, -0.4, -0.2);
    makeRings(4, 10, -7, 0.75, 0.8, 0.4);

    // 4. Smooth tori
    function makeTorus(x: number, y: number, z: number, r = 1.1, tube = 0.3) {
      const geo = new THREE.TorusGeometry(r, tube, 16, 48);
      const g = new THREE.Group();
      g.add(new THREE.Mesh(geo, phongMat(0.11)));
      g.add(new THREE.Mesh(geo, wireMat(0.44)));
      g.position.set(x, y, z);
      reg(g, {
        rotXs: 0.006,
        rotYs: 0.011,
        floatA: 0.06,
        phase: Math.random() * Math.PI * 2,
      });
    }
    makeTorus(-11, -6, -4, 1.0, 0.28);
    makeTorus(10, 9, -6, 0.85, 0.24);

    // 5. Floating grid planes (receipt / card outline — no filled boxes)
    function makeGrid(
      x: number,
      y: number,
      z: number,
      w = 2.8,
      h = 1.8,
      ry = 0,
    ) {
      const g = new THREE.Group();

      // Outer edge frame
      const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, 0.02));
      g.add(new THREE.LineSegments(edges, lineMat(0.55)));

      // Horizontal dividers
      for (let i = 1; i < 3; i++) {
        const y2 = -h / 2 + (h / 3) * i;
        const pts = [
          new THREE.Vector3(-w / 2, y2, 0),
          new THREE.Vector3(w / 2, y2, 0),
        ];
        g.add(
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(pts),
            lineMat(0.18),
          ),
        );
      }
      // Vertical dividers
      for (let i = 1; i < 4; i++) {
        const x2 = -w / 2 + (w / 4) * i;
        const pts = [
          new THREE.Vector3(x2, -h / 2, 0),
          new THREE.Vector3(x2, h / 2, 0),
        ];
        g.add(
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(pts),
            lineMat(0.18),
          ),
        );
      }
      // Barely-visible fill
      g.add(
        new THREE.Mesh(
          new THREE.PlaneGeometry(w, h),
          new THREE.MeshBasicMaterial({
            color: G,
            transparent: true,
            opacity: 0.03,
            side: THREE.DoubleSide,
          }),
        ),
      );

      g.position.set(x, y, z);
      g.rotation.y = ry;
      reg(g, {
        rotXs: 0.003,
        rotYs: 0.006,
        floatA: 0.05,
        phase: Math.random() * Math.PI * 2,
      });
    }
    makeGrid(-13, 2, -3, 2.8, 1.8, 0.4);
    makeGrid(12, -3, -4, 2.4, 1.6, -0.35);
    makeGrid(0, -11, -5, 2.2, 1.5, 0.15);
    makeGrid(-4, 11, -7, 2.0, 1.4, -0.2);

    // 6. Ambient particles
    const ptCount = 160;
    const ptPos = new Float32Array(ptCount * 3);
    for (let i = 0; i < ptCount; i++) {
      const r = 12 + Math.random() * 14;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      ptPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      ptPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      ptPos[i * 3 + 2] = r * Math.cos(ph);
    }
    const ptGeo = new THREE.BufferGeometry();
    ptGeo.setAttribute("position", new THREE.BufferAttribute(ptPos, 3));
    const ptMesh = new THREE.Points(
      ptGeo,
      new THREE.PointsMaterial({
        color: G,
        size: 1.4,
        transparent: true,
        opacity: 0.4,
        sizeAttenuation: true,
      }),
    );
    scene.add(ptMesh);

    // Mouse
    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / W) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / H) * 2 + 1;
    };
    container.addEventListener("mousemove", onMouseMove);

    // Loop
    let frameId: number;
    let t = 0;
    const loop = () => {
      frameId = requestAnimationFrame(loop);
      t += 0.007;

      camera.position.x +=
        (mouseRef.current.x * 3.5 - camera.position.x) * 0.035;
      camera.position.y +=
        (mouseRef.current.y * 2.0 - camera.position.y) * 0.035;
      camera.lookAt(0, 0, 0);

      keyLight.position.x = Math.sin(t * 0.4) * 8;
      keyLight.position.y = Math.cos(t * 0.3) * 6 + 4;

      ptMesh.rotation.y = t * 0.018;
      ptMesh.rotation.x = Math.sin(t * 0.012) * 0.08;

      objects.forEach((obj) => {
        const d = obj.userData;
        obj.rotation.x += d.rotXs;
        obj.rotation.y += d.rotYs;
        obj.rotation.z += d.rotZs;
        obj.position.y = d.baseY + Math.sin(t * d.floatS + d.phase) * d.floatA;
      });

      renderer.render(scene, camera);
    };
    loop();

    // Resize
    const onResize = () => {
      const nW = container.offsetWidth;
      const nH = container.offsetHeight;
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameId);
      container.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      if (container.contains(renderer.domElement))
        container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  // ── Auth ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await signIn("credentials", { ...form, redirect: false });
      if (res?.error) setError("Invalid email or password");
      else router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  // ── Variants ──────────────────────────────────────────────────────────────
  const cardV = {
    hidden: { opacity: 0, y: 36, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
    },
  };
  const wrapV = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.25 } },
  };
  const itemV = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.38, ease: "easeOut" },
    },
  };

  const inputStyle: React.CSSProperties = {
    background: "rgba(178,222,40,0.04)",
    border: "1px solid rgba(178,222,40,0.1)",
    color: "#edf0e8",
  };
  const focusInput = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "rgba(178,222,40,0.5)";
    e.currentTarget.style.background = "rgba(178,222,40,0.06)";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(178,222,40,0.08)";
  };
  const blurInput = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "rgba(178,222,40,0.1)";
    e.currentTarget.style.background = "rgba(178,222,40,0.04)";
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0b0d10]">
      {/* Three.js canvas */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 0 }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 25%, rgba(11,13,16,0.8) 100%)",
          zIndex: 2,
        }}
      />

      {/* Lottie floaters */}
      {LOTTIE_ITEMS.map((item, i) => (
        <LottieFloater
          key={i}
          index={i}
          url={item.url}
          style={item.style}
          phase={item.phase}
          fallbackSvg={SVG_FALLBACKS[i]}
        />
      ))}

      {/* Card */}
      <motion.div
        variants={cardV}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-[360px] mx-4"
        style={{ zIndex: 20 }}
      >
        <motion.div
          animate={{ y: [0, -9, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="rounded-[22px]"
          style={{
            background: "rgba(13,16,12,0.78)",
            border: "1px solid rgba(178,222,40,0.2)",
            backdropFilter: "blur(22px)",
            WebkitBackdropFilter: "blur(22px)",
            boxShadow:
              "0 0 80px rgba(178,222,40,0.05), 0 20px 60px rgba(0,0,0,0.6)",
          }}
        >
          {/* Shimmer line */}
          <div
            className="absolute top-0 left-0 right-0 h-px rounded-t-[22px] overflow-hidden"
            style={{ zIndex: 1 }}
          >
            <motion.div
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
              className="h-full w-full"
              style={{
                background:
                  "linear-gradient(90deg,transparent,rgba(178,222,40,0.55),transparent)",
              }}
            />
          </div>

          <motion.div
            variants={wrapV}
            initial="hidden"
            animate="visible"
            className="p-9"
          >
            {/* Logo */}
            <motion.div
              variants={itemV}
              className="flex items-center gap-3 mb-8"
            >
              <motion.div
                whileHover={{ scale: 1.12, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  boxShadow: [
                    "0 0 18px rgba(178,222,40,0.35)",
                    "0 0 34px rgba(178,222,40,0.65)",
                    "0 0 18px rgba(178,222,40,0.35)",
                  ],
                }}
                transition={{
                  boxShadow: {
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
                className="w-11 h-11 rounded-[13px] flex items-center justify-center cursor-pointer flex-shrink-0"
                style={{ background: "#b2de28" }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="#0b0d10"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="10" cy="10" r="7" />
                  <circle cx="10" cy="10" r="2.5" />
                  <line x1="10" y1="1" x2="10" y2="3.5" />
                  <line x1="10" y1="16.5" x2="10" y2="19" />
                  <line x1="1" y1="10" x2="3.5" y2="10" />
                  <line x1="16.5" y1="10" x2="19" y2="10" />
                </svg>
              </motion.div>
              <div>
                <p
                  className="font-bold text-[15px] tracking-tight"
                  style={{ color: "#edf0e8" }}
                >
                  Project Goalie
                </p>
                <p
                  className="text-[11px] font-medium uppercase tracking-[1.3px]"
                  style={{ color: "rgba(178,222,40,0.6)" }}
                >
                  Subscription Manager
                </p>
              </div>
            </motion.div>

            {/* Heading */}
            <motion.div variants={itemV} className="mb-6">
              <h1
                className="text-[25px] font-bold tracking-tight mb-1"
                style={{ color: "#f2f5ed" }}
              >
                Welcome back
              </h1>
              <p
                className="text-[13px]"
                style={{ color: "rgba(200,210,190,0.5)" }}
              >
                Sign in to sync your active grids.
              </p>
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div variants={itemV} className="space-y-1.5">
                <label
                  className="text-[11px] font-semibold uppercase tracking-[1px] block"
                  style={{ color: "rgba(200,210,190,0.45)" }}
                >
                  Email
                </label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl px-4 py-3.5 text-[13px] outline-none transition-all"
                  style={inputStyle}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </motion.div>

              <motion.div variants={itemV} className="space-y-1.5">
                <label
                  className="text-[11px] font-semibold uppercase tracking-[1px] block"
                  style={{ color: "rgba(200,210,190,0.45)" }}
                >
                  Password
                </label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl px-4 py-3.5 text-[13px] outline-none transition-all"
                  style={inputStyle}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-[12px] font-medium"
                    style={{ color: "#f87171" }}
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.div variants={itemV} className="pt-2">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                  style={{
                    background: "#b2de28",
                    color: "#0b0d10",
                    boxShadow: "0 4px 22px rgba(178,222,40,0.28)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.boxShadow =
                      "0 8px 30px rgba(178,222,40,0.48)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.boxShadow =
                      "0 4px 22px rgba(178,222,40,0.28)")
                  }
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>
                    {loading ? "Verifying credentials…" : "Sign into Account"}
                  </span>
                </motion.button>
              </motion.div>
            </form>

            {/* Divider */}
            <motion.div variants={itemV} className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div
                  className="w-full"
                  style={{ borderTop: "1px solid rgba(178,222,40,0.08)" }}
                />
              </div>
              <div className="relative flex justify-center">
                <span
                  className="px-3 text-[11px] font-medium uppercase tracking-widest"
                  style={{
                    background: "rgba(13,16,12,0.78)",
                    color: "rgba(200,210,190,0.3)",
                  }}
                >
                  or
                </span>
              </div>
            </motion.div>

            {/* Google */}
            <motion.div variants={itemV} className="mt-4">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                className="w-full py-3.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2.5 transition-all"
                style={{
                  background: "rgba(178,222,40,0.04)",
                  border: "1px solid rgba(178,222,40,0.12)",
                  color: "#d8e0cc",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(178,222,40,0.08)";
                  e.currentTarget.style.borderColor = "rgba(178,222,40,0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(178,222,40,0.04)";
                  e.currentTarget.style.borderColor = "rgba(178,222,40,0.12)";
                }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </motion.button>
            </motion.div>

            {/* Footer */}
            <motion.p
              variants={itemV}
              className="text-center text-[12px] mt-8 font-medium"
              style={{ color: "rgba(200,210,190,0.35)" }}
            >
              Don&apos;t have an account?{" "}
              <a
                href="/auth/register"
                className="transition-all hover:underline"
                style={{
                  color: "#b2de28",
                  textDecorationColor: "rgba(178,222,40,0.4)",
                }}
              >
                Sign up for free
              </a>
            </motion.p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
