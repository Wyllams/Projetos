import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import type { Proposal, ProposalTemplate, Lead, Client } from '../../types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import * as pdfjsLib from 'pdfjs-dist';

// Define the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PartnerProposalsTabProps {
  user: any;
  leads: Lead[];
  clients: Client[];
  showToast: (title: string, msg: string, type: 'error'|'success'|'info') => void;
}

export default function PartnerProposalsTab({ user, leads, clients, showToast }: PartnerProposalsTabProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeSubTab, setActiveSubTab] = useState<'proposals' | 'templates'>('proposals');

  // Modals state
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  
  // Forms
  const [templateForm, setTemplateForm] = useState({ id: '', name: '', content: '' });
  const [proposalForm, setProposalForm] = useState({ id: '', title: '', content: '', total_value: '', client_id: '', lead_id: '', template_id: '' });

  const fetchProposalsData = async () => {
    if (!user) return;
    setLoading(true);
    
    // Fetch Templates
    const { data: tData, error: tErr } = await supabase
      .from('proposal_templates')
      .select('*')
      .eq('partner_id', user.id)
      .order('created_at', { ascending: false });
      
    if (!tErr && tData) setTemplates(tData);

    // Fetch Proposals
    const { data: pData, error: pErr } = await supabase
      .from('proposals')
      .select('*, client:clients(*), lead:leads(*)')
      .eq('partner_id', user.id)
      .order('created_at', { ascending: false });
      
    if (!pErr && pData) setProposals(pData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchProposalsData();
  }, [user]);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast('Processando', 'Extraindo texto do PDF...', 'info');
      const fileReader = new FileReader();
      
      fileReader.onload = async function() {
        const typedarray = new Uint8Array(this.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '<br/><br/>';
        }
        
        setTemplateForm(prev => ({ ...prev, content: prev.content + fullText }));
        showToast('Sucesso', 'PDF extraído para o editor!', 'success');
      };
      
      fileReader.readAsArrayBuffer(file);
    } catch (err: any) {
      console.error(err);
      showToast('Erro', 'Falha ao extrair texto do PDF.', 'error');
    }
  };

  const saveTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.content.trim()) {
      showToast('Atenção', 'Nome e conteúdo são obrigatórios.', 'error');
      return;
    }
    
    try {
      if (templateForm.id) {
        // Update
        const { error } = await supabase.from('proposal_templates').update({
          name: templateForm.name,
          content: templateForm.content
        }).eq('id', templateForm.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from('proposal_templates').insert([{
          partner_id: user.id,
          name: templateForm.name,
          content: templateForm.content
        }]);
        if (error) throw error;
      }
      
      showToast('Sucesso', 'Template salvo com sucesso!', 'success');
      setIsTemplateModalOpen(false);
      setTemplateForm({ id: '', name: '', content: '' });
      fetchProposalsData();
    } catch (err: any) {
      showToast('Erro', err.message, 'error');
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja apagar este template?')) return;
    const { error } = await supabase.from('proposal_templates').delete().eq('id', id);
    if (!error) {
       showToast('Removido', 'Template deletado.', 'success');
       fetchProposalsData();
    }
  };

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tid = e.target.value;
    setProposalForm(prev => ({ ...prev, template_id: tid }));
    if (tid) {
      const selectedTpl = templates.find(t => t.id === tid);
      if (selectedTpl) {
        setProposalForm(prev => ({ ...prev, content: selectedTpl.content }));
      }
    }
  };

  const saveProposal = async () => {
    if (!proposalForm.title.trim() || !proposalForm.content.trim()) {
      showToast('Atenção', 'Título e conteúdo são obrigatórios.', 'error');
      return;
    }
    
    try {
      const payload: any = {
        title: proposalForm.title,
        content: proposalForm.content,
        total_value: proposalForm.total_value ? parseFloat(proposalForm.total_value) : null,
        client_id: proposalForm.client_id || null,
        lead_id: proposalForm.lead_id || null
      };

      if (proposalForm.id) {
        const { error } = await supabase.from('proposals').update(payload).eq('id', proposalForm.id);
        if (error) throw error;
      } else {
        payload.partner_id = user.id;
        const { error } = await supabase.from('proposals').insert([payload]);
        if (error) throw error;
      }
      
      showToast('Sucesso', 'Orçamento salvo com sucesso!', 'success');
      setIsProposalModalOpen(false);
      setProposalForm({ id: '', title: '', content: '', total_value: '', client_id: '', lead_id: '', template_id: '' });
      fetchProposalsData();
    } catch (err: any) {
      showToast('Erro', err.message, 'error');
    }
  };

  const deleteProposal = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja cancelar/apagar este orçamento?')) return;
    const { error } = await supabase.from('proposals').delete().eq('id', id);
    if (!error) {
       showToast('Removido', 'Orçamento removido.', 'success');
       fetchProposalsData();
    }
  };

  const copyPublicLink = (id: string) => {
    const link = `${window.location.origin}/quote/${id}`;
    navigator.clipboard.writeText(link);
    showToast('Copiado!', 'Link da proposta copiado para a área de transferência.', 'success');
  };

  return (
    <div className="page active">
      <div className="u-section-header">
        <div>
          <div className="u-mono-label-xs">{proposals.length} propostas | {templates.length} templates</div>
          <div className="u-syne-title u-mt-3">Orçamentos e Propostas</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn" style={{background: 'var(--bg2)', border: '1px solid var(--border)'}} onClick={() => { setTemplateForm({id:'', name:'', content: ''}); setIsTemplateModalOpen(true); }}>
             Criar Modelo (Template)
          </button>
          <button className="btn gold" onClick={() => { setProposalForm({ id: '', title: '', content: '', total_value: '', client_id: '', lead_id: '', template_id: '' }); setIsProposalModalOpen(true); }}>
             Novo Orçamento
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
         <button onClick={() => setActiveSubTab('proposals')} style={{ background: 'transparent', color: activeSubTab === 'proposals' ? 'var(--gold)' : 'var(--t2)', border: 'none', fontWeight: activeSubTab === 'proposals' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '1rem' }}>Orçamentos Ativos</button>
         <button onClick={() => setActiveSubTab('templates')} style={{ background: 'transparent', color: activeSubTab === 'templates' ? 'var(--gold)' : 'var(--t2)', border: 'none', fontWeight: activeSubTab === 'templates' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '1rem' }}>Meus Modelos (Templates)</button>
      </div>

      {loading ? (
         <div style={{ padding: '20px', textAlign: 'center' }}>Carregando orçamentos...</div>
      ) : activeSubTab === 'proposals' ? (
        <div style={{ display: 'grid', gap: '15px' }}>
          {proposals.length === 0 && <div className="empty-state" style={{padding: '20px', textAlign: 'center'}}>Nenhum orçamento encontrado.</div>}
          
          {proposals.map(p => (
            <div key={p.id} className="proj-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                 <div className="proj-name">{p.title}</div>
                 <div style={{ fontSize: '0.85rem', color: 'var(--t2)', marginTop: '5px' }}>
                   Criado em: {new Date(p.created_at || '').toLocaleDateString()} | 
                   Valor: {p.total_value ? `$${p.total_value.toLocaleString()}` : 'N/A'}
                 </div>
                 <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                   Status: <strong style={{color: p.status === 'signed' ? 'var(--green)' : p.status === 'viewed' ? 'var(--blue)' : 'var(--gold)'}}>{p.status.toUpperCase()}</strong>
                   {p.viewed_at && <span style={{marginLeft: '10px', color: 'var(--t3)'}}>(Visto: {new Date(p.viewed_at).toLocaleString()})</span>}
                   {p.signed_at && <span style={{marginLeft: '10px', color: 'var(--green)'}}>(Assinado: {new Date(p.signed_at).toLocaleString()})</span>}
                 </div>
               </div>
               <div style={{ display: 'flex', gap: '10px' }}>
                  {p.status === 'signed' && p.pdf_url && (
                     <a href={p.pdf_url} target="_blank" rel="noreferrer" className="btn" style={{background: 'var(--bg2)', padding: '5px 10px', fontSize: '0.85rem'}}>Ver PDF Assinado</a>
                  )}
                  <button className="btn" style={{background: 'var(--bg2)', padding: '5px 10px', fontSize: '0.85rem'}} onClick={() => copyPublicLink(p.id)}>Copiar Link Público</button>
                  <button className="btn" style={{background: 'var(--bg2)', padding: '5px 10px', fontSize: '0.85rem'}} onClick={() => { setProposalForm({ id: p.id, title: p.title, content: p.content, total_value: p.total_value?.toString() || '', client_id: p.client_id || '', lead_id: p.lead_id || '', template_id: '' }); setIsProposalModalOpen(true); }}>Editar</button>
                  <button className="btn" style={{background: 'transparent', color: 'var(--red)', padding: '5px 10px', fontSize: '1.2rem', minWidth: 'auto'}} onClick={() => deleteProposal(p.id)}>🗑️</button>
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {templates.length === 0 && <div className="empty-state" style={{padding: '20px', textAlign: 'center'}}>Nenhum template salvo. Crie um modelo para reaproveitar.</div>}
          
          {templates.map(t => (
            <div key={t.id} className="proj-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                 <div className="proj-name">{t.name}</div>
               </div>
               <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn" style={{background: 'var(--bg2)', padding: '5px 10px', fontSize: '0.85rem'}} onClick={() => { setTemplateForm({ id: t.id, name: t.name, content: t.content }); setIsTemplateModalOpen(true); }}>Editar</button>
                  <button className="btn" style={{background: 'transparent', color: 'var(--red)', padding: '5px 10px', fontSize: '1.2rem', minWidth: 'auto'}} onClick={() => deleteTemplate(t.id)}>🗑️</button>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: NOVO TEMPLATE */}
      {isTemplateModalOpen && (
        <div className="modal-overlay open" onClick={() => setIsTemplateModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
            <div className="modal-title">{templateForm.id ? 'Editar Modelo' : 'Criar Novo Modelo (Template)'}</div>
            <div style={{ marginBottom: '15px' }}>
               <label className="f-label">Nome do Modelo</label>
               <input type="text" className="f-inp" placeholder="Ex: Reforma Padrão VIP" value={templateForm.name} onChange={e => setTemplateForm(prev => ({...prev, name: e.target.value}))} />
            </div>
            
            <div style={{ marginBottom: '15px', background: 'var(--bg2)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)' }}>
               <strong style={{display: 'block', marginBottom: '10px', fontSize: '0.9rem'}}>Importar de um PDF:</strong>
               <input type="file" accept=".pdf" onChange={handlePdfUpload} className="f-inp" style={{padding: '5px'}}/>
               <small style={{display: 'block', marginTop: '5px', color: 'var(--t3)'}}>O sistema extrairá o texto puro do seu PDF e jogará no editor abaixo para você reconfigurar as margens e tabelas. (Imagens não serão importadas).</small>
            </div>

            <div style={{ marginBottom: '15px' }}>
               <label className="f-label" style={{display: 'flex', justifyContent: 'space-between'}}>
                 <span>Conteúdo do Modelo</span>
                 <span style={{color: 'var(--t3)', fontSize: '0.8rem'}}>Dica: Use [NOME_CLIENTE], [CPF], [VALOR_TOTAL] como variáveis.</span>
               </label>
               <div style={{ background: '#fff', color: '#000', borderRadius: '4px', height: '400px', overflowY: 'auto' }}>
                 <ReactQuill theme="snow" value={templateForm.content} onChange={(content) => setTemplateForm(prev => ({...prev, content}))} style={{ height: '350px' }} />
               </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-ghost" onClick={() => setIsTemplateModalOpen(false)}>Cancelar</button>
              <button className="btn gold" onClick={saveTemplate}>Salvar Modelo</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVO ORÇAMENTO */}
      {isProposalModalOpen && (
        <div className="modal-overlay open" onClick={() => setIsProposalModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
            <div className="modal-title">{proposalForm.id ? 'Editar Orçamento' : 'Gerar Orçamento / Proposta'}</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label className="f-label">Título da Proposta</label>
                <input type="text" className="f-inp" placeholder="Ex: Orçamento Pintura Residencial..." value={proposalForm.title} onChange={e => setProposalForm(prev => ({...prev, title: e.target.value}))} />
              </div>
              <div>
                <label className="f-label">Valor Total Estimado ($)</label>
                <input type="number" className="f-inp" placeholder="Ex: 5000" value={proposalForm.total_value} onChange={e => setProposalForm(prev => ({...prev, total_value: e.target.value}))} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label className="f-label">Vincular a um Cliente (Opcional)</label>
                <select className="f-inp" value={proposalForm.client_id} onChange={e => setProposalForm(prev => ({...prev, client_id: e.target.value}))}>
                   <option value="">-- Nenhum --</option>
                   {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="f-label">Vincular a um Lead (Opcional)</label>
                <select className="f-inp" value={proposalForm.lead_id} onChange={e => setProposalForm(prev => ({...prev, lead_id: e.target.value}))}>
                   <option value="">-- Nenhum --</option>
                   {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>

            {!proposalForm.id && (
              <div style={{ marginBottom: '15px', background: 'var(--bg2)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                 <label className="f-label">Usar um Modelo (Template) salvo:</label>
                 <select className="f-inp" value={proposalForm.template_id} onChange={handleTemplateSelect}>
                   <option value="">-- Selecione um modelo para preencher o editor abaixo --</option>
                   {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                 </select>
              </div>
            )}

            <div style={{ marginBottom: '15px' }}>
               <label className="f-label">Conteúdo do Orçamento (Personalize antes de enviar)</label>
               <div style={{ background: '#fff', color: '#000', borderRadius: '4px', height: '400px', overflowY: 'auto' }}>
                 <ReactQuill theme="snow" value={proposalForm.content} onChange={(content) => setProposalForm(prev => ({...prev, content}))} style={{ height: '350px' }} />
               </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-ghost" onClick={() => setIsProposalModalOpen(false)}>Cancelar</button>
              <button className="btn gold" onClick={saveProposal}>Salvar Orçamento</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
