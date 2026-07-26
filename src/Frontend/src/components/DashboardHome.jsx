import { ArrowRight, ShieldCheck, Zap, Clock, BarChart2 } from 'lucide-react';

export default function DashboardHome({ onOpenRoleModal }) {
  const features = [
    { icon: ShieldCheck, title: 'Seguridad', desc: 'Información protegida y confidencial.', color: 'blue' },
    { icon: Zap, title: 'Eficiencia', desc: 'Procesos rápidos y automatizados.', color: 'green' },
    { icon: Clock, title: 'Productividad', desc: 'Ahorra tiempo y mejora la gestión de RR.HH.', color: 'yellow' },
    { icon: BarChart2, title: 'Control', desc: 'Reportes y métricas en tiempo real.', color: 'dark' },
  ];

  return (
    <div className="dashboard-content animate-fade">
      <div className="dashboard-background"></div>
      
      {/* Espaciador para el texto que ahora es parte de la imagen */}
      <div style={{ height: '140px' }}></div>

      <div className="cards-grid">
        <div className="module-card blue-card">
          <div className="card-swoosh dark-blue-swoosh"></div>
          <div className="card-left">
            <div className="card-icon-container">
               <div className="floating-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
               </div>
            </div>
            
            <div className="card-content">
              <h2 className="card-title">Firma de<br/>Contratos</h2>
              <p className="card-desc">
                Digitaliza, completa y genera contratos laborales de forma rápida, segura y eficiente.
              </p>
              <button className="card-btn" onClick={onOpenRoleModal}>
                Ir al módulo <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <div className="card-right">
             <img src="/contract_icon.png" alt="Contratos 3D" className="illustration-img float-img" />
          </div>
        </div>

        <div className="module-card green-card">
          <div className="card-swoosh dark-green-swoosh"></div>
          <div className="card-left">
            <div className="card-icon-container">
               <div className="floating-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
               </div>
            </div>
            
            <div className="card-content">
              <h2 className="card-title">Entrega de<br/>Boletas de Pago</h2>
              <p className="card-desc">
                Publica y entrega boletas de pago a los colaboradores de manera rápida y segura.
              </p>
              <button className="card-btn">
                Ir al módulo <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <div className="card-right">
             <img src="/payroll_icon.png" alt="Boletas 3D" className="illustration-img float-img" />
          </div>
        </div>
      </div>

      <div className="features-row">
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div key={idx} className="feature-item">
              <div className={`feature-icon-wrapper ${feat.color}`}>
                <Icon size={24} />
              </div>
              <div className="feature-text">
                <h4 className={`feature-title color-${feat.color}`}>{feat.title}</h4>
                <p className="feature-desc">{feat.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
