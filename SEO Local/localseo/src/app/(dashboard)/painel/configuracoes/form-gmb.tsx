"use client";

import { useState, useEffect } from "react";
import { carregarDadosGMB, carregarLocaisGMB, salvarConfiguracaoGMB } from "./actions";

export function FormularioGmb() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [contas, setContas] = useState<any[]>([]);
  const [locais, setLocais] = useState<any[]>([]);
  
  const [contaSelecionada, setContaSelecionada] = useState("");
  const [localSelecionado, setLocalSelecionado] = useState("");
  
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  useEffect(() => {
    async function init() {
      const res = await carregarDadosGMB();
      if (res.erro) {
        setErro(res.erro);
      } else {
        setContas(res.accounts || []);
        if (res.contaAtual) {
          setContaSelecionada(res.contaAtual);
          carregarLojas(res.contaAtual);
        }
        if (res.localAtual) {
          setLocalSelecionado(res.localAtual);
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  async function carregarLojas(accountName: string) {
    const res = await carregarLocaisGMB(accountName);
    if (!res.erro && res.locais) {
      setLocais(res.locais);
    }
  }

  function onMudarConta(e: any) {
    const cc = e.target.value;
    setContaSelecionada(cc);
    setLocalSelecionado("");
    setLocais([]);
    if (cc) carregarLojas(cc);
  }

  async function salvar() {
    setSalvando(true);
    setMensagemSucesso("");
    setErro("");
    const res = await salvarConfiguracaoGMB(contaSelecionada, localSelecionado);
    if (res.sucesso) {
      setMensagemSucesso("Ponte de comunicação Google Meu Negócio conectada com sucesso!");
    } else {
      setErro(res.erro || "Erro ao salvar.");
    }
    setSalvando(false);
  }

  if (loading) return <div>Carregando conexão GMB...</div>;
  // REMOVI o "return" prematuro do erro para renderizar a interface inteira mesmo falhando a API


  return (
    <div className="flex flex-col gap-4 text-left">
      <p className="text-sm text-muted-foreground">
        Selecione abaixo a Conta e a Ficha da loja oficial do Google para permitir que a IA publique os posts.
      </p>

      {erro && <div className="text-red-500 text-sm">{erro}</div>}
      {mensagemSucesso && <div className="text-emerald-500 text-sm font-medium">{mensagemSucesso}</div>}

      <div className="grid gap-2">
        <label className="text-sm font-medium">Conta Google (Account)</label>
        <select 
          value={contaSelecionada} 
          onChange={onMudarConta} 
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Selecione sua conta...</option>
          {contas.map(c => (
             <option key={c.name} value={c.name}>{c.accountName}</option>
          ))}
        </select>
      </div>

      {locais.length > 0 && (
        <div className="grid gap-2">
          <label className="text-sm font-medium">Local / Loja (Location)</label>
          <select 
            value={localSelecionado} 
            onChange={e => setLocalSelecionado(e.target.value)} 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Selecione o local/loja...</option>
            {locais.map(l => (
               <option key={l.name} value={l.name}>{l.title}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <button onClick={salvar} disabled={!localSelecionado || salvando} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white disabled:pointer-events-none disabled:opacity-50 w-full sm:w-auto">
          {salvando ? "Salvando..." : "Conectar API Oficial"}
        </button>

        <button 
          onClick={async () => {
            setSalvando(true);
            const res = await salvarConfiguracaoGMB("accounts/sandbox-conta-123", "accounts/sandbox-conta-123/locations/sandbox-loja-456");
            if (res.sucesso) setMensagemSucesso("Modo Sandbox GMB Ativado com Sucesso! 🧪");
            else setErro(res.erro || "Erro");
            setSalvando(false);
          }} 
          disabled={salvando} 
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 w-full sm:w-auto"
        >
          {salvando ? "Ativando..." : "Bypass Sandbox"}
        </button>
      </div>
    </div>
  );
}
