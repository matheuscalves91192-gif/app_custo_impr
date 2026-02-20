
import React, { useState } from 'react';
import { 
  Calculator, 
  BarChart3, 
  Wand2,
  CheckCircle2,
  Package,
  Ruler,
  Weight,
  User,
  Mail,
  Phone,
  Send,
  AlertCircle
} from 'lucide-react';
import { SimilarityRequest, SimilarityResponse } from './types';

const App: React.FC = () => {
  const [smartReq, setSmartReq] = useState<SimilarityRequest>({
    nome: '',
    email: '',
    telefone: '',
    tipo: 'chaveiro',
    tamanho_cm: 5,
    peso_g: 10,
    material: 'PLA',
    possuiSTL: true
  });
  
  const [smartResult, setSmartResult] = useState<SimilarityResponse & { notificado?: boolean } | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSmartEstimate = async () => {
    if (!smartReq.nome || !smartReq.email) {
      setError("Por favor, preencha seu nome e e-mail para receber o orçamento.");
      return;
    }
    
    setError(null);
    setIsEstimating(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smartReq)
      });

      if (!response.ok) throw new Error("Erro na comunicação com o servidor.");
      
      const result = await response.json();
      setSmartResult(result);
    } catch (err) {
      console.error(err);
      setError("Não foi possível conectar ao servidor de orçamentos. Verifique se o backend está rodando.");
      
      // Fallback para demonstração se o backend estiver offline
      const fallback = {
        valorMin: 25.0,
        valorMax: 35.0,
        peçasSimilaresEncontradas: 2,
        justificativa: "SISTEMA EM MODO DEMONSTRAÇÃO (Backend não detectado).",
        notificado: false
      };
      setSmartResult(fallback);
    } finally {
      setIsEstimating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 md:p-8">
      <header className="max-w-5xl w-full mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg">
            <Calculator className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Orçamento 3D Expresso</h1>
            <p className="text-slate-500 text-sm italic">Receba sua estimativa instantânea e atendimento via e-mail.</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formulário */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-blue-600 uppercase tracking-tight">
              <User size={18} /> Dados para Contato
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">NOME COMPLETO</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-300" size={16} />
                  <input 
                    className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Como podemos te chamar?"
                    value={smartReq.nome}
                    onChange={e => setSmartReq({...smartReq, nome: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">E-MAIL</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-300" size={16} />
                  <input 
                    type="email"
                    className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="seu@email.com"
                    value={smartReq.email}
                    onChange={e => setSmartReq({...smartReq, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="col-span-1 md:col-span-2 space-y-1">
                <label className="text-[11px] font-bold text-slate-400">WHATSAPP / TELEFONE</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-slate-300" size={16} />
                  <input 
                    type="tel"
                    className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="(00) 0 0000-0000"
                    value={smartReq.telefone}
                    onChange={e => setSmartReq({...smartReq, telefone: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-blue-600 uppercase tracking-tight border-t pt-6">
              <Package size={18} /> Informações da Peça
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">TIPO</label>
                <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={smartReq.tipo} onChange={e => setSmartReq({...smartReq, tipo: e.target.value})}>
                  <option value="chaveiro">Chaveiro</option>
                  <option value="boneco">Action Figure / Boneco</option>
                  <option value="peça técnica">Peça de Reposição / Técnica</option>
                  <option value="decoração">Item de Decoração</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">MATERIAL</label>
                <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={smartReq.material} onChange={e => setSmartReq({...smartReq, material: e.target.value})}>
                  <option value="PLA">PLA (Padrão)</option>
                  <option value="PETG">PETG (Resistente)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1"><Ruler size={12}/> TAMANHO (CM)</label>
                <input type="number" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={smartReq.tamanho_cm} onChange={e => setSmartReq({...smartReq, tamanho_cm: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1"><Weight size={12}/> PESO (G)</label>
                <input type="number" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={smartReq.peso_g} onChange={e => setSmartReq({...smartReq, peso_g: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                  <input type="checkbox" className="w-5 h-5 accent-blue-600" checked={smartReq.possuiSTL} onChange={e => setSmartReq({...smartReq, possuiSTL: e.target.checked})} />
                  <span className="text-sm font-semibold text-blue-900">Já possuo o modelo 3D (.STL)</span>
                </label>
              </div>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl flex items-center gap-2 border border-red-100">
                <AlertCircle size={18} /> {error}
              </div>
            )}

            <button 
              onClick={handleSmartEstimate}
              disabled={isEstimating}
              className="w-full mt-8 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {isEstimating ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <><Send size={18} /> Calcular e Enviar Orçamento</>
              )}
            </button>
          </div>
        </div>

        {/* Resultados */}
        <div className="lg:col-span-5">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 sticky top-8">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-700 uppercase tracking-tight">
              <BarChart3 size={18} /> Resumo do Cálculo
            </h2>

            {smartResult ? (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl text-white shadow-xl">
                  <p className="text-blue-100 text-xs font-semibold uppercase tracking-widest mb-1">Investimento Estimado</p>
                  <h3 className="text-4xl font-black">
                    R$ {smartResult.valorMin.toFixed(2)} <span className="text-xl font-normal opacity-60">a</span> R$ {smartResult.valorMax.toFixed(2)}
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Análise por Similaridade</h4>
                    <p className="text-slate-600 text-xs leading-relaxed">{smartResult.justificativa}</p>
                  </div>

                  <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                    <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-emerald-900 font-bold text-sm">Orçamento Recebido!</p>
                      <p className="text-emerald-700 text-xs mt-1">
                        Já recebemos seus dados em <strong>{smartResult.notificado ? 'matheusc.alves@hotmail.com' : 'nosso sistema'}</strong>. Entraremos em contato em breve para fechar o pedido.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-center opacity-30 grayscale">
                <Calculator size={64} className="text-slate-200 mb-4" />
                <p className="text-sm font-medium max-w-[200px]">Preencha o formulário para visualizar os valores.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-12 text-slate-400 text-[11px] font-medium tracking-wide pb-8">
        PLATAFORMA 3D PRO &bull; BACKEND INTEGRADO COM SMTP E GEMINI AI
      </footer>
    </div>
  );
};

export default App;
