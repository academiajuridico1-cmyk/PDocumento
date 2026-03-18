import React from 'react';

interface LandingPageProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onRegisterClick }) => {
  return (
    <div className="min-h-screen bg-[#f4f7fb] text-[#333] font-sans scroll-smooth">
      {/* NAVBAR */}
      <nav className="flex justify-between items-center bg-[#0d47a1] px-8 py-4 text-white sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2 font-bold text-xl">
          <span className="text-2xl">📄</span> Pdocumento
        </div>
        <div className="flex items-center gap-6">
          <a href="#funcionalidade" className="hover:underline font-medium transition-all">Funcionalidade</a>
          <a href="#sobre" className="hover:underline font-medium transition-all">Sobre</a>
          <button 
            onClick={onLoginClick}
            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-semibold transition-all"
          >
            Entrar
          </button>
        </div>
      </nav>

      {/* HERO */}
      <header className="bg-gradient-to-br from-[#0d47a1] to-[#1976d2] text-white text-center py-24 px-6">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">Sistema de Protocolo de Documento</h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90 mb-10">
          Saiba como os documentos são processados, tramitados e arquivados de forma segura.
        </p>
        <button 
          onClick={onRegisterClick}
          className="bg-[#ff9800] hover:bg-[#f57c00] text-white px-10 py-4 rounded-lg font-bold text-lg shadow-xl transform hover:scale-105 transition-all"
        >
          🚀 Começar Agora
        </button>
      </header>

      {/* FUNCIONALIDADE */}
      <section id="funcionalidade" className="max-w-6xl mx-auto py-20 px-6">
        <h2 className="text-3xl font-bold text-center text-[#0d47a1] mb-12">📌 Como é Tramitado?</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[
            { step: '1', title: 'Recebimento', desc: 'O documento é registrado no sistema, gerando um número único de protocolo.' },
            { step: '2', title: 'Classificação', desc: 'Encaminhamento para o departamento responsável conforme a categoria.' },
            { step: '3', title: 'Análise e Tramitação', desc: 'Os responsáveis avaliam e atualizam o status em tempo real.' },
            { step: '4', title: 'Parecer e Despachos', desc: 'Emissão de decisões e encaminhamentos administrativos.' },
            { step: '5', title: 'Conclusão / Arquivo', desc: 'Documento finalizado, arquivado ou devolvido ao solicitante.' },
          ].map((item) => (
            <div key={item.step} className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-50 text-[#1976d2] rounded-full flex items-center justify-center font-bold text-xl mb-4">
                {item.step}
              </div>
              <h3 className="font-bold text-[#1976d2] mb-3">{item.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="bg-white py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0d47a1] mb-6">📘 Sobre o Sistema</h2>
          <p className="text-lg font-semibold mb-4 text-gray-800">Protocolo de Documento</p>
          <p className="text-gray-600 leading-relaxed">
            Sistema completo de gestão documental para otimizar o processamento, tramitação e arquivamento de documentos. 
            Nossa plataforma garante transparência, agilidade e segurança em todos os processos administrativos.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0d47a1] text-white text-center py-8">
        <p className="text-sm opacity-80">
          © 2026 Pdocumento – Sistema de Protocolo de Documento
        </p>
      </footer>
    </div>
  );
};
