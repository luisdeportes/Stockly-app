'use client' ;
import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// ============================================================
// ⚙️  CONFIGURACIÓN — SOLO TÚ EDITAS ESTO
// ============================================================
const CONFIG = {
  appName: "Stockly",
  ownerEmail: "admin@stockly.pe",      // Tu email de admin
  ownerPassword: "Stockly2026$",        // Tu contraseña de admin
  culqiPublicKey: "pk_test_TU_CLAVE",  // 👉 Reemplaza con tu clave de Culqi
  whatsapp: "51999999999",              // 👉 Tu WhatsApp para soporte
  plans: [
    { id: "basico",   name: "Básico",   price: 35,  priceId: "plan_basico",   color: "#10b981", features: ["Hasta 100 productos", "Alertas de stock", "1 usuario", "Soporte por WhatsApp"] },
    { id: "pro",      name: "Pro",      price: 99,  priceId: "plan_pro",      color: "#f59e0b", features: ["Productos ilimitados", "Reportes avanzados", "5 usuarios", "Exportar Excel", "Soporte prioritario"], popular: true },
    { id: "empresa",  name: "Empresa",  price: 279, priceId: "plan_empresa",  color: "#6366f1", features: ["Todo en Pro", "Usuarios ilimitados", "API access", "Soporte dedicado", "Capacitación incluida"] },
  ],
};

// ============================================================
// HELPERS
// ============================================================
const sol = (n) => `S/ ${Number(n).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const uid = () => Math.random().toString(36).slice(2, 10);
const CATS = ["Electrónica","Ropa","Alimentos","Hogar","Herramientas","Cosméticos","Otros"];
const PIE_COLORS = ["#10b981","#f59e0b","#6366f1","#f43f5e","#06b6d4","#84cc16","#a78bfa"];
const emptyForm = { name:"", sku:"", category:"Electrónica", stock:"", minStock:"", price:"", cost:"" };

// Storage helpers
const store = {
  async get(key, shared=true) {
    try { const r = await window.storage.get(key, shared); return r ? JSON.parse(r.value) : null; } catch { return null; }
  },
  async set(key, val, shared=true) {
    try { await window.storage.set(key, JSON.stringify(val), shared); } catch {}
  }
};

// ============================================================
// ESTILOS GLOBALES
// ============================================================
const G = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Fraunces:wght@700;900&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Outfit',sans-serif;background:#f6f5f1;color:#1a1a1a}
    input,select,textarea{background:#fff;border:1.5px solid #e5e7eb;color:#1a1a1a;border-radius:10px;padding:10px 14px;font-family:inherit;font-size:14px;outline:none;width:100%;transition:border-color .2s}
    input:focus,select:focus{border-color:#10b981}
    select option{background:#fff}
    .btn{padding:11px 22px;border-radius:11px;border:none;font-family:inherit;font-size:13px;cursor:pointer;font-weight:600;transition:all .18s;display:inline-flex;align-items:center;gap:6px}
    .btn-primary{background:#10b981;color:#fff}
    .btn-primary:hover{background:#059669;transform:translateY(-1px)}
    .btn-ghost{background:transparent;color:#6b7280;border:1.5px solid #e5e7eb}
    .btn-ghost:hover{background:#f3f4f6}
    .btn-danger{background:#fee2e2;color:#dc2626;border:none}
    .btn-sm{padding:7px 14px;font-size:12px;border-radius:9px}
    .card{background:#fff;border-radius:16px;padding:18px;box-shadow:0 1px 4px rgba(0,0,0,.07)}
    .chip{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700}
    .chip-green{background:#d1fae5;color:#065f46}
    .chip-red{background:#fee2e2;color:#b91c1c}
    .chip-yellow{background:#fef3c7;color:#92400e}
    .chip-blue{background:#dbeafe;color:#1d4ed8}
    .chip-gray{background:#f3f4f6;color:#374151}
    .chip-purple{background:#ede9fe;color:#5b21b6}
    .tab-bar{display:flex;background:#fff;border-top:1px solid #f3f4f6;position:fixed;bottom:0;left:0;right:0;z-index:50}
    .tab{display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 8px 8px;border:none;background:none;cursor:pointer;font-family:inherit;font-size:10px;color:#9ca3af;transition:color .2s;flex:1;position:relative;font-weight:600}
    .tab.active{color:#10b981}
    .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center;z-index:100;backdrop-filter:blur(4px)}
    .sheet{background:#fff;border-radius:24px 24px 0 0;padding:28px 20px 40px;width:100%;max-width:520px;max-height:92vh;overflow-y:auto}
    .handle{width:40px;height:4px;background:#e5e7eb;border-radius:2px;margin:0 auto 20px}
    .toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);padding:12px 22px;border-radius:12px;font-size:13px;font-weight:700;z-index:999;white-space:nowrap;animation:pop .22s ease;box-shadow:0 4px 20px rgba(0,0,0,.15)}
    @keyframes pop{from{transform:translateX(-50%) scale(.88);opacity:0}to{transform:translateX(-50%) scale(1);opacity:1}}
    .lbl{font-size:12px;color:#9ca3af;font-weight:600;display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em}
    ::-webkit-scrollbar{width:0}
    .hero-bg{background:linear-gradient(135deg,#0a0a0f 0%,#0f2030 50%,#0a1628 100%)}
    @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    .fade-up{animation:fadeUp .5s ease forwards}
  `}</style>
);

// ============================================================
// TOAST
// ============================================================
function Toast({ toast }) {
  if (!toast) return null;
  return <div className="toast" style={{ background: toast.ok ? "#d1fae5" : "#fee2e2", color: toast.ok ? "#065f46" : "#991b1b" }}>{toast.msg}</div>;
}

// ============================================================
// LANDING PAGE
// ============================================================
function Landing({ onLogin, onRegister }) {
  const [billingAnnual] = useState(false);
  return (
    <div style={{ fontFamily:"'Outfit',sans-serif", overflowX:"hidden" }}>
      {/* NAV */}
      <nav style={{ position:"sticky", top:0, zIndex:50, background:"rgba(10,10,15,.95)", backdropFilter:"blur(12px)", padding:"14px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid rgba(255,255,255,.06)" }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:"#fff" }}>
          Stockly<span style={{ color:"#10b981" }}>.</span>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button className="btn btn-ghost" style={{ color:"#9ca3af", borderColor:"rgba(255,255,255,.1)", fontSize:13, padding:"8px 16px" }} onClick={onLogin}>Ingresar</button>
          <button className="btn btn-primary" style={{ fontSize:13, padding:"8px 16px" }} onClick={onRegister}>Probar gratis</button>
        </div>
      </nav>

      {/* HERO */}
      <div className="hero-bg" style={{ padding:"70px 20px 80px", textAlign:"center" }}>
        <div style={{ display:"inline-block", background:"rgba(16,185,129,.12)", border:"1px solid rgba(16,185,129,.25)", borderRadius:20, padding:"5px 14px", fontSize:12, color:"#10b981", fontWeight:600, marginBottom:20, letterSpacing:".05em" }}>
          ✦ GESTOR DE INVENTARIO PARA NEGOCIOS PERUANOS
        </div>
        <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:"clamp(32px,8vw,56px)", fontWeight:900, color:"#fff", letterSpacing:"-0.03em", lineHeight:1.05, marginBottom:20, maxWidth:600, margin:"0 auto 20px" }}>
          Controla tu stock.<br/><span style={{ color:"#10b981" }}>Haz crecer tu negocio.</span>
        </h1>
        <p style={{ fontSize:16, color:"#94a3b8", maxWidth:440, margin:"0 auto 36px", lineHeight:1.6 }}>
          Gestiona tu inventario, recibe alertas de stock bajo y ve reportes en tiempo real. Todo desde tu celular.
        </p>
        <button className="btn btn-primary" style={{ fontSize:15, padding:"14px 32px", borderRadius:12 }} onClick={onRegister}>
          Comenzar gratis →
        </button>
        <div style={{ fontSize:12, color:"#475569", marginTop:12 }}>Sin tarjeta de crédito · Cancela cuando quieras</div>

        {/* MOCKUP */}
        <div style={{ marginTop:50, display:"flex", justifyContent:"center", gap:12, flexWrap:"wrap" }}>
          {[
            { emoji:"📦", label:"Productos ilimitados", sub:"según tu plan" },
            { emoji:"⚠️", label:"Alertas automáticas", sub:"stock bajo y agotado" },
            { emoji:"📊", label:"Reportes en tiempo real", sub:"valor e ingresos" },
          ].map(f => (
            <div key={f.label} style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.08)", borderRadius:16, padding:"18px 20px", minWidth:150, textAlign:"left" }}>
              <div style={{ fontSize:28, marginBottom:8 }}>{f.emoji}</div>
              <div style={{ color:"#fff", fontWeight:600, fontSize:14 }}>{f.label}</div>
              <div style={{ color:"#64748b", fontSize:12, marginTop:3 }}>{f.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PLANES */}
      <div style={{ padding:"60px 20px", background:"#f6f5f1" }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:32, fontWeight:900, letterSpacing:"-0.03em" }}>Precios simples y claros</h2>
          <p style={{ color:"#6b7280", marginTop:8, fontSize:15 }}>Paga en soles. Sin sorpresas.</p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14, maxWidth:500, margin:"0 auto" }}>
          {CONFIG.plans.map(plan => (
            <div key={plan.id} style={{ background:"#fff", borderRadius:18, padding:"20px 22px", border:`2px solid ${plan.popular?"#10b981":"#f3f4f6"}`, position:"relative" }}>
              {plan.popular && <div style={{ position:"absolute", top:-12, left:20, background:"#10b981", color:"#fff", fontSize:11, fontWeight:700, borderRadius:20, padding:"3px 12px", letterSpacing:".05em" }}>MÁS POPULAR</div>}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:17, marginBottom:6 }}>{plan.name}</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                    {plan.features.slice(0,3).map(f => <span key={f} className="chip chip-gray" style={{ fontSize:10 }}>{f}</span>)}
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0, marginLeft:12 }}>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:26, fontWeight:900, color:plan.color }}>S/{plan.price}</div>
                  <div style={{ fontSize:11, color:"#9ca3af" }}>/mes</div>
                </div>
              </div>
              <button className="btn btn-primary" style={{ width:"100%", marginTop:14, background:plan.popular?"#10b981":"transparent", color:plan.popular?"#fff":plan.color, border:`1.5px solid ${plan.color}`, justifyContent:"center" }} onClick={onRegister}>
                Elegir {plan.name}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ background:"#0a0a0f", padding:"30px 20px", textAlign:"center" }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:900, color:"#fff", marginBottom:8 }}>Stockly<span style={{ color:"#10b981" }}>.</span></div>
        <div style={{ fontSize:12, color:"#475569" }}>Hecho para negocios peruanos · {new Date().getFullYear()}</div>
        <div style={{ marginTop:16 }}>
          <button className="btn btn-ghost" style={{ color:"#9ca3af", borderColor:"rgba(255,255,255,.1)", fontSize:12, padding:"8px 16px" }} onClick={onLogin}>Ya tengo cuenta</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// AUTH (LOGIN / REGISTER)
// ============================================================
function Auth({ mode, onSuccess, onSwitch, onBack, showToast }) {
  const [form, setForm] = useState({ name:"", email:"", password:"", plan: CONFIG.plans[1].id });
  const [loading, setLoading] = useState(false);
  const isLogin = mode === "login";

  const handle = async () => {
    if (!form.email || !form.password) return showToast("Completa todos los campos", false);
    setLoading(true);

    // ¿Es el admin?
    if (form.email === CONFIG.ownerEmail && form.password === CONFIG.ownerPassword) {
      onSuccess({ id:"owner", name:"Administrador", email:CONFIG.ownerEmail, role:"owner" });
      setLoading(false); return;
    }

    const users = await store.get("stockly_users") || [];

    if (isLogin) {
      const user = users.find(u => u.email === form.email && u.password === form.password);
      if (!user) { showToast("Email o contraseña incorrectos", false); setLoading(false); return; }
      if (!user.active) { showToast("Tu licencia no está activa. Contacta al administrador.", false); setLoading(false); return; }
      onSuccess(user);
    } else {
      if (!form.name) { showToast("Ingresa tu nombre", false); setLoading(false); return; }
      if (users.find(u => u.email === form.email)) { showToast("Este email ya está registrado", false); setLoading(false); return; }
      const newUser = { id: uid(), name: form.name, email: form.email, password: form.password, plan: form.plan, active: false, registeredAt: new Date().toISOString(), role:"user" };
      await store.set("stockly_users", [...users, newUser]);
      onSuccess(newUser); // Pasa al pago
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f6f5f1", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"16px 20px", background:"#fff", borderBottom:"1px solid #f3f4f6", display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#6b7280" }}>←</button>
        <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:900 }}>Stockly<span style={{ color:"#10b981" }}>.</span></div>
      </div>
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
        <div style={{ width:"100%", maxWidth:380 }}>
          <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:28, fontWeight:900, letterSpacing:"-0.03em", marginBottom:6 }}>
            {isLogin ? "Bienvenido de vuelta" : "Crear cuenta"}
          </h2>
          <p style={{ color:"#9ca3af", fontSize:14, marginBottom:28 }}>
            {isLogin ? "Ingresa tus datos para continuar" : "Empieza a gestionar tu inventario"}
          </p>
          <div style={{ display:"grid", gap:14 }}>
            {!isLogin && (
              <div><label className="lbl">Tu nombre</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Juan Pérez"/></div>
            )}
            <div><label className="lbl">Email</label><input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="juan@ejemplo.com"/></div>
            <div><label className="lbl">Contraseña</label><input type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="Mínimo 6 caracteres"/></div>
            {!isLogin && (
              <div>
                <label className="lbl">Plan que te interesa</label>
                <select value={form.plan} onChange={e=>setForm(f=>({...f,plan:e.target.value}))}>
                  {CONFIG.plans.map(p=><option key={p.id} value={p.id}>{p.name} — S/{p.price}/mes</option>)}
                </select>
              </div>
            )}
          </div>
          <button className="btn btn-primary" style={{ width:"100%", marginTop:22, padding:14, fontSize:15, justifyContent:"center" }} onClick={handle} disabled={loading}>
            {loading ? "Cargando..." : isLogin ? "Ingresar" : "Continuar →"}
          </button>
          <div style={{ textAlign:"center", marginTop:18, fontSize:13, color:"#9ca3af" }}>
            {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
            {" "}
            <button onClick={onSwitch} style={{ background:"none", border:"none", color:"#10b981", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>
              {isLogin ? "Regístrate" : "Inicia sesión"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PAGO (CULQI)
// ============================================================
function Payment({ user, onSuccess, onLogout, showToast }) {
  const plan = CONFIG.plans.find(p=>p.id===user.plan) || CONFIG.plans[0];
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);

  const activateDemo = async () => {
    // Activa la cuenta (en producción real, Culqi confirma el pago a tu backend)
    setLoading(true);
    await new Promise(r=>setTimeout(r,1500));
    const users = await store.get("stockly_users") || [];
    const updated = users.map(u=>u.id===user.id?{...u,active:true,paidAt:new Date().toISOString()}:u);
    await store.set("stockly_users", updated);
    setPaid(true);
    setLoading(false);
    showToast("¡Pago confirmado! Bienvenido 🎉");
    setTimeout(()=>onSuccess({...user,active:true}),1500);
  };

  const openWhatsApp = () => {
    const msg = encodeURIComponent(`Hola, acabo de registrarme en Stockly con el email ${user.email} y quiero activar mi plan ${plan.name} (S/${plan.price}/mes). ¿Cómo procedo con el pago?`);
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${msg}`, "_blank");
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f6f5f1", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"16px 20px", background:"#fff", borderBottom:"1px solid #f3f4f6", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:900 }}>Stockly<span style={{ color:"#10b981" }}>.</span></div>
        <button onClick={onLogout} style={{ background:"none", border:"none", color:"#9ca3af", cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>Salir</button>
      </div>
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
        <div style={{ width:"100%", maxWidth:400 }}>
          {paid ? (
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
              <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:26, fontWeight:900, color:"#10b981" }}>¡Todo listo!</h2>
              <p style={{ color:"#6b7280", marginTop:8 }}>Accediendo a tu inventario...</p>
            </div>
          ) : (
            <>
              <div style={{ textAlign:"center", marginBottom:28 }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🔓</div>
                <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:26, fontWeight:900, letterSpacing:"-0.02em" }}>Activa tu plan</h2>
                <p style={{ color:"#9ca3af", fontSize:14, marginTop:6 }}>Hola {user.name}, un paso más</p>
              </div>

              <div className="card" style={{ marginBottom:16, border:`2px solid ${plan.color}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:16 }}>Plan {plan.name}</div>
                    <div style={{ fontSize:12, color:"#9ca3af", marginTop:4 }}>{plan.features.join(" · ")}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:"'Fraunces',serif", fontSize:24, fontWeight:900, color:plan.color }}>S/{plan.price}</div>
                    <div style={{ fontSize:11, color:"#9ca3af" }}>/mes</div>
                  </div>
                </div>
              </div>

              {/* OPCIÓN 1: Culqi */}
              <div className="card" style={{ marginBottom:12 }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>💳 Pagar con tarjeta</div>
                <div style={{ fontSize:12, color:"#9ca3af", marginBottom:12 }}>Visa, Mastercard, American Express</div>
                <button className="btn btn-primary" style={{ width:"100%", justifyContent:"center", padding:13 }} onClick={activateDemo} disabled={loading}>
                  {loading ? "Procesando..." : `Pagar S/${plan.price} con Culqi`}
                </button>
                <div style={{ fontSize:11, color:"#9ca3af", marginTop:8, textAlign:"center" }}>
                  🔒 Pago seguro · Cancela cuando quieras
                </div>
              </div>

              {/* OPCIÓN 2: WhatsApp */}
              <div className="card" style={{ background:"#f0fdf4", border:"1.5px solid #d1fae5" }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>📱 Pagar por Yape / transferencia</div>
                <div style={{ fontSize:12, color:"#6b7280", marginBottom:12 }}>Coordina el pago directamente por WhatsApp</div>
                <button className="btn" style={{ width:"100%", justifyContent:"center", padding:13, background:"#25d366", color:"#fff" }} onClick={openWhatsApp}>
                  Contactar por WhatsApp
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ADMIN PANEL (SOLO DUEÑO)
// ============================================================
function AdminPanel({ onLogout, showToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    store.get("stockly_users").then(u => { setUsers(u||[]); setLoading(false); });
  }, []);

  const toggleActive = async (userId) => {
    const updated = users.map(u=>u.id===userId?{...u,active:!u.active}:u);
    setUsers(updated);
    await store.set("stockly_users", updated);
    showToast("Estado actualizado");
  };

  const deleteUser = async (userId) => {
    const updated = users.filter(u=>u.id!==userId);
    setUsers(updated);
    await store.set("stockly_users", updated);
    // Borrar inventario del usuario
    await store.set(`inv_${userId}`, []);
    showToast("Usuario eliminado", false);
  };

  const totalMRR = users.filter(u=>u.active).reduce((s,u)=>{
    const plan = CONFIG.plans.find(p=>p.id===u.plan);
    return s+(plan?.price||0);
  },0);

  return (
    <div style={{ minHeight:"100vh", background:"#f6f5f1" }}>
      <div style={{ background:"#0a0a0f", padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:900, color:"#fff" }}>
            Stockly<span style={{ color:"#10b981" }}>.</span>
            <span style={{ fontSize:11, color:"#475569", fontFamily:"'Outfit',sans-serif", fontWeight:400, marginLeft:10 }}>Panel Admin</span>
          </div>
        </div>
        <button onClick={onLogout} style={{ background:"none", border:"1px solid rgba(255,255,255,.15)", color:"#9ca3af", cursor:"pointer", fontSize:12, fontFamily:"inherit", padding:"6px 14px", borderRadius:8 }}>Cerrar sesión</button>
      </div>

      <div style={{ padding:"20px 16px 40px", maxWidth:600, margin:"0 auto" }}>
        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:20 }}>
          {[
            { label:"Usuarios totales", val:users.length, color:"#6366f1" },
            { label:"Licencias activas", val:users.filter(u=>u.active).length, color:"#10b981" },
            { label:"MRR estimado", val:`S/${totalMRR}`, color:"#f59e0b" },
          ].map(s=>(
            <div key={s.label} className="card" style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:s.color }}>{s.val}</div>
              <div style={{ fontSize:11, color:"#9ca3af", marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          <div style={{ padding:"14px 16px", borderBottom:"1px solid #f3f4f6", fontWeight:700, fontSize:14 }}>
            Usuarios registrados {loading && <span style={{ color:"#9ca3af", fontWeight:400, fontSize:12 }}>cargando...</span>}
          </div>
          {users.length===0 && !loading && (
            <div style={{ padding:32, textAlign:"center", color:"#9ca3af", fontSize:14 }}>Aún no hay usuarios registrados</div>
          )}
          {users.map(u=>{
            const plan = CONFIG.plans.find(p=>p.id===u.plan);
            return (
              <div key={u.id} style={{ padding:"14px 16px", borderBottom:"1px solid #f9fafb", display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:38, height:38, borderRadius:10, background: u.active?"#d1fae5":"#f3f4f6", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                  {u.active?"✓":"⏳"}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.name}</div>
                  <div style={{ fontSize:11, color:"#9ca3af", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.email}</div>
                  <div style={{ marginTop:3, display:"flex", gap:5 }}>
                    <span className={`chip ${u.active?"chip-green":"chip-gray"}`}>{u.active?"Activo":"Pendiente"}</span>
                    {plan && <span className="chip chip-blue">{plan.name} S/{plan.price}</span>}
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:5, flexShrink:0 }}>
                  <button className="btn btn-sm" style={{ background: u.active?"#fee2e2":"#d1fae5", color: u.active?"#dc2626":"#065f46", border:"none", fontSize:11 }} onClick={()=>toggleActive(u.id)}>
                    {u.active?"Suspender":"Activar"}
                  </button>
                  <button className="btn btn-sm btn-danger" style={{ fontSize:11 }} onClick={()=>deleteUser(u.id)}>Eliminar</button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card" style={{ marginTop:14, background:"#fef3c7", border:"1.5px solid #fbbf24" }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:6 }}>📋 Cómo activar licencias</div>
          <div style={{ fontSize:13, color:"#6b7280", lineHeight:1.6 }}>
            1. Cuando un usuario pague, su cuenta aparece aquí como "Pendiente".<br/>
            2. Verifica el pago (Culqi / Yape / transferencia).<br/>
            3. Presiona <strong>Activar</strong> para darle acceso.<br/>
            4. El usuario podrá ingresar con su email y contraseña.
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// APP DE INVENTARIO (USUARIO)
// ============================================================
function InventoryApp({ user, onLogout, showToast }) {
  const [view, setView] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Todas");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveData, setMoveData] = useState({ productId:"", type:"entrada", qty:1, note:"" });
  const [showPlans, setShowPlans] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const plan = CONFIG.plans.find(p=>p.id===user.plan)||CONFIG.plans[0];

  // Cargar datos del usuario
  useEffect(()=>{
    Promise.all([
      store.get(`inv_prod_${user.id}`),
      store.get(`inv_mov_${user.id}`)
    ]).then(([p,m])=>{
      setProducts(p||[]);
      setMovements(m||[]);
      setLoaded(true);
    });
  },[user.id]);

  // Guardar productos
  useEffect(()=>{ if(loaded) store.set(`inv_prod_${user.id}`, products); },[products,loaded]);
  useEffect(()=>{ if(loaded) store.set(`inv_mov_${user.id}`, movements); },[movements,loaded]);

  const lowStock = products.filter(p=>p.stock>0&&p.stock<=p.minStock);
  const outOfStock = products.filter(p=>p.stock===0);
  const totalValue = products.reduce((s,p)=>s+p.stock*p.price,0);
  const totalCost = products.reduce((s,p)=>s+p.stock*p.cost,0);
  const margin = totalValue>0?(((totalValue-totalCost)/totalValue)*100).toFixed(0):0;
  const alertCount = lowStock.length+outOfStock.length;
  const catData = CATS.map(c=>({name:c,v:products.filter(p=>p.category===c).reduce((s,p)=>s+p.stock,0)})).filter(d=>d.v>0);

  const filtered = useMemo(()=>products.filter(p=>
    (p.name.toLowerCase().includes(search.toLowerCase())||p.sku.toLowerCase().includes(search.toLowerCase()))&&
    (filterCat==="Todas"||p.category===filterCat)
  ),[products,search,filterCat]);

  const openAdd = ()=>{ setForm(emptyForm); setEditProduct(null); setShowModal(true); };
  const openEdit = p=>{ setForm({name:p.name,sku:p.sku,category:p.category,stock:p.stock,minStock:p.minStock,price:p.price,cost:p.cost}); setEditProduct(p); setShowModal(true); };

  const saveProduct = ()=>{
    if(!form.name||!form.sku) return showToast("Nombre y SKU son obligatorios",false);
    const data={...form,stock:+form.stock,minStock:+form.minStock,price:+form.price,cost:+form.cost};
    if(editProduct){ setProducts(ps=>ps.map(p=>p.id===editProduct.id?{...p,...data}:p)); showToast("Producto actualizado"); }
    else { setProducts(ps=>[...ps,{id:uid(),...data}]); showToast("Producto agregado"); }
    setShowModal(false);
  };

  const deleteProduct = id=>{ setProducts(ps=>ps.filter(p=>p.id!==id)); showToast("Eliminado",false); };

  const saveMovement = ()=>{
    const prod=products.find(p=>p.id===moveData.productId);
    if(!prod) return showToast("Selecciona un producto",false);
    const qty=+moveData.qty;
    if(moveData.type==="salida"&&prod.stock<qty) return showToast("Stock insuficiente",false);
    setProducts(ps=>ps.map(p=>p.id===prod.id?{...p,stock:moveData.type==="entrada"?p.stock+qty:p.stock-qty}:p));
    const today=new Date();
    const d=`${String(today.getDate()).padStart(2,"0")}/${String(today.getMonth()+1).padStart(2,"0")}`;
    setMovements(ms=>[{id:uid(),date:d,product:prod.name,type:moveData.type,qty,note:moveData.note},...ms]);
    showToast("Movimiento registrado");
    setShowMoveModal(false);
    setMoveData({productId:"",type:"entrada",qty:1,note:""});
  };

  const catEmoji = c => ({"Electrónica":"⚡","Ropa":"👕","Alimentos":"🥑","Hogar":"🏠","Herramientas":"🔧","Cosméticos":"💄"}[c]||"📦");
  const tabs = [
    {id:"dashboard",label:"Inicio",icon:"⊞"},
    {id:"products",label:"Productos",icon:"◱"},
    {id:"movements",label:"Movimientos",icon:"⇅"},
    {id:"reports",label:"Reportes",icon:"◈"},
    {id:"alerts",label:"Alertas",icon:"◉",badge:alertCount},
  ];
  const modalBg={position:"fixed",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:100,backdropFilter:"blur(4px)"};
  const sheet={background:"#fff",borderRadius:"24px 24px 0 0",padding:"28px 20px 40px",width:"100%",maxWidth:520,maxHeight:"92vh",overflowY:"auto"};
  const handle={width:40,height:4,background:"#e5e7eb",borderRadius:2,margin:"0 auto 20px"};
  const lbl={fontSize:12,color:"#9ca3af",fontWeight:600,display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:".04em"};

  if(!loaded) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f6f5f1"}}><div style={{color:"#9ca3af",fontSize:14}}>Cargando tu inventario...</div></div>;

  return (
    <div style={{fontFamily:"'Outfit',sans-serif",background:"#f6f5f1",minHeight:"100vh",color:"#1a1a1a"}}>
      {/* HEADER */}
      <div style={{background:"#fff",padding:"14px 20px 0",borderBottom:"1px solid #f3f4f6",position:"sticky",top:0,zIndex:40}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"baseline",gap:1}}>
            <span style={{fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:900}}>Stockly<span style={{color:"#10b981"}}>.</span></span>
            <span className="chip chip-green" style={{marginLeft:8,fontSize:10}}>{plan.name}</span>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button className="btn btn-ghost" style={{fontSize:11,padding:"6px 12px"}} onClick={()=>setShowPlans(true)}>✦ Planes</button>
            <button onClick={onLogout} style={{background:"none",border:"none",color:"#9ca3af",cursor:"pointer",fontSize:20}}>⎋</button>
          </div>
        </div>
        <div style={{display:"flex"}}>
          {tabs.map(t=>(
            <button key={t.id} className={`tab ${view===t.id?"active":""}`} onClick={()=>setView(t.id)}>
              <span style={{fontSize:18}}>{t.icon}</span>
              <span style={{position:"relative"}}>
                {t.label}
                {t.badge>0&&<span style={{position:"absolute",top:-4,right:-10,background:"#f43f5e",color:"#fff",fontSize:9,fontWeight:700,borderRadius:20,padding:"1px 4px"}}>{t.badge}</span>}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:"20px 16px 90px",maxWidth:540,margin:"0 auto"}}>

        {/* DASHBOARD */}
        {view==="dashboard"&&<>
          <div style={{marginBottom:20}}>
            <h1 style={{fontFamily:"'Fraunces',serif",fontSize:26,fontWeight:900,letterSpacing:"-0.03em"}}>Hola, {user.name.split(" ")[0]} 👋</h1>
            <p style={{color:"#9ca3af",fontSize:13,marginTop:4}}>Resumen de tu negocio hoy</p>
          </div>
          {products.length===0?(
            <div className="card" style={{textAlign:"center",padding:48}}>
              <div style={{fontSize:48,marginBottom:12}}>📦</div>
              <div style={{fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:900,marginBottom:8}}>Tu inventario está vacío</div>
              <p style={{color:"#9ca3af",fontSize:14,marginBottom:20}}>Agrega tu primer producto para empezar</p>
              <button className="btn btn-primary" style={{justifyContent:"center"}} onClick={()=>{setView("products");setTimeout(openAdd,100);}}>+ Agregar producto</button>
            </div>
          ):(
            <>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                {[
                  {label:"Productos",val:products.length,sub:"en catálogo",color:"#10b981"},
                  {label:"Valor total",val:sol(totalValue),sub:`Margen ${margin}%`,color:"#f59e0b",small:true},
                  {label:"Stock bajo",val:lowStock.length,sub:"para reponer",color:"#f43f5e"},
                  {label:"Sin stock",val:outOfStock.length,sub:"agotados",color:"#6366f1"},
                ].map(s=>(
                  <div key={s.label} className="card">
                    <div style={{fontSize:11,color:"#9ca3af",fontWeight:600,textTransform:"uppercase",letterSpacing:".05em",marginBottom:6}}>{s.label}</div>
                    <div style={{fontFamily:"'Fraunces',serif",fontSize:s.small?16:26,fontWeight:900,color:s.color,letterSpacing:"-0.02em"}}>{s.val}</div>
                    <div style={{fontSize:11,color:"#d1d5db",marginTop:4}}>{s.sub}</div>
                  </div>
                ))}
              </div>
              {catData.length>0&&<div className="card" style={{marginBottom:12}}>
                <div style={{fontSize:12,color:"#9ca3af",fontWeight:600,textTransform:"uppercase",letterSpacing:".05em",marginBottom:14}}>Stock por categoría</div>
                <div style={{display:"flex",alignItems:"center",gap:16}}>
                  <PieChart width={100} height={100}><Pie data={catData} dataKey="v" cx={45} cy={45} outerRadius={44} innerRadius={24}>{catData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}</Pie></PieChart>
                  <div style={{flex:1}}>{catData.slice(0,5).map((c,i)=>(<div key={c.name} style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:12}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:2,background:PIE_COLORS[i%PIE_COLORS.length]}}/><span>{c.name}</span></div><span style={{color:"#9ca3af",fontWeight:600}}>{c.v}</span></div>))}</div>
                </div>
              </div>}
              {alertCount>0&&<div className="card" style={{borderLeft:"3px solid #f43f5e"}}>
                <div style={{fontSize:13,fontWeight:700,color:"#dc2626",marginBottom:10}}>⚠ Necesitan atención</div>
                {[...outOfStock,...lowStock].slice(0,4).map(p=>(
                  <div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid #f9fafb",fontSize:13}}>
                    <span>{p.name}</span>
                    <span className={`chip ${p.stock===0?"chip-red":"chip-yellow"}`}>{p.stock===0?"Agotado":`${p.stock} ud.`}</span>
                  </div>
                ))}
              </div>}
            </>
          )}
        </>}

        {/* PRODUCTOS */}
        {view==="products"&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h1 style={{fontFamily:"'Fraunces',serif",fontSize:26,fontWeight:900,letterSpacing:"-0.03em"}}>Productos</h1>
            <button className="btn btn-primary" onClick={openAdd} style={{padding:"9px 16px",fontSize:13}}>+ Nuevo</button>
          </div>
          <input placeholder="Buscar por nombre o SKU..." value={search} onChange={e=>setSearch(e.target.value)} style={{marginBottom:10}}/>
          <div style={{display:"flex",gap:7,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
            {["Todas",...CATS].map(c=>(
              <button key={c} onClick={()=>setFilterCat(c)} style={{whiteSpace:"nowrap",padding:"6px 14px",borderRadius:20,border:"1.5px solid",borderColor:filterCat===c?"#10b981":"#e5e7eb",background:filterCat===c?"#d1fae5":"#fff",color:filterCat===c?"#065f46":"#6b7280",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{c}</button>
            ))}
          </div>
          {filtered.length===0&&<div style={{textAlign:"center",color:"#9ca3af",padding:32,fontSize:14}}>{products.length===0?"Agrega tu primer producto":"Sin resultados"}</div>}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {filtered.map(p=>(
              <div key={p.id} className="card" style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:44,height:44,background:"#f3f4f6",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{catEmoji(p.category)}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                  <div style={{fontSize:12,color:"#9ca3af",marginTop:1}}>{p.sku}</div>
                  <div style={{fontSize:12,marginTop:3}}>
                    <span style={{color:"#10b981",fontWeight:700}}>{sol(p.price)}</span>
                    <span style={{color:"#e5e7eb",margin:"0 6px"}}>·</span>
                    <span style={{color:"#9ca3af"}}>costo {sol(p.cost)}</span>
                  </div>
                </div>
                <div style={{textAlign:"center",flexShrink:0}}>
                  <div style={{fontFamily:"'Fraunces',serif",fontSize:24,fontWeight:900,color:p.stock===0?"#dc2626":p.stock<=p.minStock?"#d97706":"#1a1a1a"}}>{p.stock}</div>
                  <div style={{fontSize:10,color:"#d1d5db"}}>unid.</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:5,flexShrink:0}}>
                  <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(p)}>Editar</button>
                  <button className="btn btn-danger btn-sm" onClick={()=>deleteProduct(p.id)}>Borrar</button>
                </div>
              </div>
            ))}
          </div>
        </>}

        {/* MOVIMIENTOS */}
        {view==="movements"&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h1 style={{fontFamily:"'Fraunces',serif",fontSize:26,fontWeight:900,letterSpacing:"-0.03em"}}>Movimientos</h1>
            <button className="btn btn-primary" onClick={()=>setShowMoveModal(true)} style={{padding:"9px 16px",fontSize:13}}>+ Nuevo</button>
          </div>
          {movements.length===0&&<div style={{textAlign:"center",color:"#9ca3af",padding:32,fontSize:14}}>Aún no hay movimientos registrados</div>}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {movements.map(m=>(
              <div key={m.id} className="card" style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:44,height:44,borderRadius:12,background:m.type==="entrada"?"#d1fae5":"#fee2e2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{m.type==="entrada"?"↑":"↓"}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.product}</div>
                  <div style={{fontSize:12,color:"#9ca3af",marginTop:1}}>{m.note||"—"}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:900,color:m.type==="entrada"?"#10b981":"#f43f5e"}}>{m.type==="entrada"?"+":"-"}{m.qty}</div>
                  <div style={{fontSize:11,color:"#d1d5db"}}>{m.date}</div>
                </div>
              </div>
            ))}
          </div>
        </>}

        {/* REPORTES */}
        {view==="reports"&&<>
          <h1 style={{fontFamily:"'Fraunces',serif",fontSize:26,fontWeight:900,letterSpacing:"-0.03em",marginBottom:18}}>Reportes</h1>
          <div className="card" style={{marginBottom:12,background:"linear-gradient(135deg,#ecfdf5,#d1fae5)",border:"none"}}>
            <div style={{fontSize:12,color:"#065f46",fontWeight:600,textTransform:"uppercase",letterSpacing:".05em",marginBottom:4}}>Valor de inventario</div>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:28,fontWeight:900,color:"#065f46",letterSpacing:"-0.02em"}}>{sol(totalValue)}</div>
            <div style={{fontSize:13,color:"#34d399",marginTop:4}}>Margen estimado: {margin}%</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <div className="card"><div style={{fontSize:11,color:"#9ca3af",fontWeight:600,textTransform:"uppercase",marginBottom:8}}>En stock</div><div style={{fontFamily:"'Fraunces',serif",fontSize:26,fontWeight:900,color:"#10b981"}}>{products.filter(p=>p.stock>0).length}</div></div>
            <div className="card"><div style={{fontSize:11,color:"#9ca3af",fontWeight:600,textTransform:"uppercase",marginBottom:8}}>Total unidades</div><div style={{fontFamily:"'Fraunces',serif",fontSize:26,fontWeight:900,color:"#f59e0b"}}>{products.reduce((s,p)=>s+p.stock,0)}</div></div>
          </div>
          {products.length>0&&<div className="card" style={{marginBottom:12}}>
            <div style={{fontSize:12,color:"#9ca3af",fontWeight:600,textTransform:"uppercase",letterSpacing:".05em",marginBottom:14}}>Top 5 por valor</div>
            {[...products].sort((a,b)=>(b.stock*b.price)-(a.stock*a.price)).slice(0,5).map((p,i)=>(
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderBottom:i<4?"1px solid #f9fafb":"none"}}>
                <span style={{fontFamily:"'Fraunces',serif",fontWeight:900,fontSize:18,color:"#e5e7eb",width:18}}>{i+1}</span>
                <span style={{flex:1,fontSize:13,color:"#374151"}}>{p.name}</span>
                <span style={{fontWeight:700,color:"#10b981",fontSize:13}}>{sol(p.stock*p.price)}</span>
              </div>
            ))}
          </div>}
          {plan.id==="basico"&&<div className="card" style={{background:"#fafafa",border:"1.5px dashed #e5e7eb"}}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:3}}>Exportar a Excel</div>
            <div style={{fontSize:13,color:"#9ca3af",marginBottom:14}}>Disponible desde el plan Pro (S/ 99/mes)</div>
            <button className="btn btn-primary" onClick={()=>setShowPlans(true)}>Ver planes →</button>
          </div>}
        </>}

        {/* ALERTAS */}
        {view==="alerts"&&<>
          <h1 style={{fontFamily:"'Fraunces',serif",fontSize:26,fontWeight:900,letterSpacing:"-0.03em",marginBottom:18}}>Alertas</h1>
          {outOfStock.length>0&&<>
            <div style={{fontSize:11,fontWeight:700,color:"#dc2626",textTransform:"uppercase",letterSpacing:".07em",marginBottom:10}}>Sin stock — urgente</div>
            {outOfStock.map(p=>(<div key={p.id} className="card" style={{marginBottom:8,display:"flex",alignItems:"center",gap:12,borderLeft:"3px solid #f43f5e"}}><div style={{fontSize:28,flexShrink:0}}>📦</div><div style={{flex:1}}><div style={{fontWeight:600,fontSize:14}}>{p.name}</div><div style={{fontSize:12,color:"#9ca3af"}}>{p.sku} · mín. {p.minStock} unid.</div></div><span className="chip chip-red">Agotado</span></div>))}
          </>}
          {lowStock.length>0&&<>
            <div style={{fontSize:11,fontWeight:700,color:"#d97706",textTransform:"uppercase",letterSpacing:".07em",margin:"16px 0 10px"}}>Stock bajo — reponer pronto</div>
            {lowStock.map(p=>(<div key={p.id} className="card" style={{marginBottom:8,display:"flex",alignItems:"center",gap:12,borderLeft:"3px solid #f59e0b"}}><div style={{fontSize:28,flexShrink:0}}>⚠️</div><div style={{flex:1}}><div style={{fontWeight:600,fontSize:14}}>{p.name}</div><div style={{fontSize:12,color:"#9ca3af"}}>{p.sku} · mín. {p.minStock} unid.</div></div><span className="chip chip-yellow">{p.stock} ud.</span></div>))}
          </>}
          {alertCount===0&&<div className="card" style={{textAlign:"center",padding:48}}><div style={{fontSize:48,marginBottom:12}}>✅</div><div style={{fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:900,color:"#10b981"}}>¡Todo en orden!</div><div style={{fontSize:13,color:"#9ca3af",marginTop:6}}>Todos los productos tienen stock suficiente</div></div>}
        </>}
      </div>

      {/* MODAL PRODUCTO */}
      {showModal&&<div style={modalBg} onClick={()=>setShowModal(false)}><div style={sheet} onClick={e=>e.stopPropagation()}>
        <div style={handle}/><h2 style={{fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:900,marginBottom:20}}>{editProduct?"Editar producto":"Nuevo producto"}</h2>
        <div style={{display:"grid",gap:14}}>
          <div><label style={lbl}>Nombre</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Nombre del producto"/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><label style={lbl}>SKU</label><input value={form.sku} onChange={e=>setForm(f=>({...f,sku:e.target.value}))} placeholder="ELEC-001"/></div>
            <div><label style={lbl}>Categoría</label><select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><label style={lbl}>Stock actual</label><input type="number" value={form.stock} onChange={e=>setForm(f=>({...f,stock:e.target.value}))} placeholder="0"/></div>
            <div><label style={lbl}>Stock mínimo</label><input type="number" value={form.minStock} onChange={e=>setForm(f=>({...f,minStock:e.target.value}))} placeholder="10"/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><label style={lbl}>Precio venta (S/)</label><input type="number" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} placeholder="0.00"/></div>
            <div><label style={lbl}>Costo (S/)</label><input type="number" value={form.cost} onChange={e=>setForm(f=>({...f,cost:e.target.value}))} placeholder="0.00"/></div>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:24}}><button className="btn btn-ghost" style={{flex:1}} onClick={()=>setShowModal(false)}>Cancelar</button><button className="btn btn-primary" style={{flex:2,justifyContent:"center"}} onClick={saveProduct}>Guardar</button></div>
      </div></div>}

      {/* MODAL MOVIMIENTO */}
      {showMoveModal&&<div style={modalBg} onClick={()=>setShowMoveModal(false)}><div style={sheet} onClick={e=>e.stopPropagation()}>
        <div style={handle}/><h2 style={{fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:900,marginBottom:20}}>Registrar movimiento</h2>
        <div style={{display:"grid",gap:14}}>
          <div><label style={lbl}>Producto</label><select value={moveData.productId} onChange={e=>setMoveData(m=>({...m,productId:e.target.value}))}><option value="">Seleccionar...</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} (stock: {p.stock})</option>)}</select></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><label style={lbl}>Tipo</label><select value={moveData.type} onChange={e=>setMoveData(m=>({...m,type:e.target.value}))}><option value="entrada">↑ Entrada</option><option value="salida">↓ Salida</option></select></div>
            <div><label style={lbl}>Cantidad</label><input type="number" min="1" value={moveData.qty} onChange={e=>setMoveData(m=>({...m,qty:e.target.value}))}/></div>
          </div>
          <div><label style={lbl}>Nota (opcional)</label><input value={moveData.note} onChange={e=>setMoveData(m=>({...m,note:e.target.value}))} placeholder="Venta, reposición, ajuste..."/></div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:24}}><button className="btn btn-ghost" style={{flex:1}} onClick={()=>setShowMoveModal(false)}>Cancelar</button><button className="btn btn-primary" style={{flex:2,justifyContent:"center"}} onClick={saveMovement}>Registrar</button></div>
      </div></div>}

      {/* MODAL PLANES */}
      {showPlans&&<div style={modalBg} onClick={()=>setShowPlans(false)}><div style={sheet} onClick={e=>e.stopPropagation()}>
        <div style={handle}/>
        <h2 style={{fontFamily:"'Fraunces',serif",fontSize:24,fontWeight:900,marginBottom:4}}>Mejora tu plan</h2>
        <p style={{fontSize:13,color:"#9ca3af",marginBottom:22}}>Cancela cuando quieras · Sin contratos</p>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {CONFIG.plans.map((p,i)=>(
            <div key={p.id} style={{background:p.id===plan.id?"#ecfdf5":"#f9fafb",border:`2px solid ${p.id===plan.id?p.color:"#e5e7eb"}`,borderRadius:14,padding:"16px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                {p.popular&&<div style={{fontSize:10,color:"#10b981",fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",marginBottom:4}}>✦ Más popular</div>}
                <div style={{fontWeight:700,fontSize:15}}>{p.name} {p.id===plan.id&&<span style={{fontSize:11,color:"#9ca3af",fontWeight:400}}>(tu plan)</span>}</div>
                <div style={{fontSize:12,color:"#9ca3af",marginTop:3}}>{p.features.slice(0,2).join(" · ")}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
                <div style={{fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:900,color:p.color}}>S/{p.price}</div>
                <div style={{fontSize:11,color:"#d1d5db"}}>/mes</div>
              </div>
            </div>
          ))}
        </div>
        <button className="btn btn-primary" style={{width:"100%",marginTop:18,padding:14,fontSize:14,justifyContent:"center"}} onClick={()=>{setShowPlans(false);window.open(`https://wa.me/${CONFIG.whatsapp}?text=Hola, quiero cambiar mi plan de Stockly`,"_blank");}}>Contactar para cambiar plan</button>
        <button className="btn btn-ghost" style={{width:"100%",marginTop:8,padding:12,fontSize:13,justifyContent:"center"}} onClick={()=>setShowPlans(false)}>Cerrar</button>
      </div></div>}
    </div>
  );
}

// ============================================================
// ROUTER PRINCIPAL
// ============================================================
export default function App() {
  const [screen, setScreen] = useState("landing"); // landing | auth | payment | app | admin
  const [authMode, setAuthMode] = useState("login");
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),2500); };

  const handleAuthSuccess = (u) => {
    if (u.role==="owner") { setUser(u); setScreen("admin"); return; }
    if (!u.active) { setUser(u); setScreen("payment"); return; }
    setUser(u); setScreen("app");
  };

  const handlePaymentSuccess = (u) => { setUser(u); setScreen("app"); };
  const logout = () => { setUser(null); setScreen("landing"); };

  return (
    <>
      <G/>
      {screen==="landing"&&<Landing onLogin={()=>{setAuthMode("login");setScreen("auth");}} onRegister={()=>{setAuthMode("register");setScreen("auth");}}/>}
      {screen==="auth"&&<Auth mode={authMode} onSuccess={handleAuthSuccess} onSwitch={()=>setAuthMode(m=>m==="login"?"register":"login")} onBack={()=>setScreen("landing")} showToast={showToast}/>}
      {screen==="payment"&&user&&<Payment user={user} onSuccess={handlePaymentSuccess} onLogout={logout} showToast={showToast}/>}
      {screen==="app"&&user&&<InventoryApp user={user} onLogout={logout} showToast={showToast}/>}
      {screen==="admin"&&<AdminPanel onLogout={logout} showToast={showToast}/>}
      <Toast toast={toast}/>
    </>
  );
}
