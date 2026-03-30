import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../lib/i18n';
import type { Proposal, ProposalTemplate, Lead, Client } from '../../types';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import * as pdfjsLib from 'pdfjs-dist';

// Define the worker source for PDF parsing
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PartnerProposalsTabProps {
  user: any;
  leads: Lead[];
  clients: Client[];
  showToast: (title: string, msg: string, type: 'error'|'success'|'info') => void;
}

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
    ['blockquote', 'link', 'image', 'video'],
    ['clean']
  ],
};

const quillFormats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'align', 'list', 'bullet', 'indent',
  'blockquote', 'link', 'image', 'video'
];

export default function PartnerProposalsTab({ user, leads, clients, showToast }: PartnerProposalsTabProps) {
  const { t, lang } = useLanguage();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeSubTab, setActiveSubTab] = useState<'proposals' | 'templates' | 'proposal_form' | 'template_form'>('proposals');
  const [wizardStep, setWizardStep] = useState<number>(1);
  const documentEditorRef = React.useRef<ReactQuill>(null);
  
  // Forms
  const [templateForm, setTemplateForm] = useState({ id: '', name: '', content: '' });
  
  const initialProposalState = { 
    id: '', title: '', content: '', total_value: '', client_id: '', lead_id: '', template_id: '',
    services: [] as { id: string, name: string, price: number, selected: boolean }[],
    terms: { contract_time: 'Serviço Único / Avulso', payment_method: 'Boleto Bancário / PIX', notes: '' }
  };
  const [proposalForm, setProposalForm] = useState(initialProposalState);
  
  // Real Estate / Construction Default Services (Removed Contabilidade reference per user request)
  const defaultServices = ["Projeto de Arquitetura", "Reforma Residencial Completa", "Gerenciamento de Obra", "Design de Interiores", "Consultoria Imobiliária", "Instalação Elétrica e Hidráulica", "Manutenção Predial", "Consultoria Técnica", "Projeção 3D Rendering"];

  const compileTags = (contentStr: string, justValue = false, specificTag = '') => {
    if (!contentStr && !justValue) return '';
    const clientName = clients.find(c => c.id === proposalForm.client_id)?.name || '[Cliente não vinculado]';
    const leadName = leads.find(l => l.id === proposalForm.lead_id)?.name || '[Lead não vinculado]';
    const valTotal = proposalForm.total_value ? `R$ ${parseFloat(proposalForm.total_value).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 'R$ 0,00';
    const dataProposta = new Date().toLocaleDateString('pt-BR');
    const prazo = proposalForm.terms.contract_time || '';
    const obs = proposalForm.terms.notes || '';
    const idProp = proposalForm.id || '[Nova]';
    
    if (justValue && specificTag) {
      if (specificTag === '[NOME_CLIENTE]') return clientName;
      if (specificTag === '[NOME_LEAD]') return leadName;
      if (specificTag === '[VALOR_TOTAL]') return valTotal;
      if (specificTag === '[DATA_PROPOSTA]') return dataProposta;
      if (specificTag === '[PRAZO_CONTRATO]') return prazo;
      if (specificTag === '[OBSERVACOES]') return obs;
      if (specificTag === '[CNPJ_CPF]') return '[Documento Omisso]';
      if (specificTag === '[ID_PROPOSTA]') return idProp;
      return specificTag;
    }

    return contentStr
      .split('[NOME_CLIENTE]').join(clientName)
      .split('[NOME_LEAD]').join(leadName)
      .split('[VALOR_TOTAL]').join(valTotal)
      .split('[DATA_PROPOSTA]').join(dataProposta)
      .split('[PRAZO_CONTRATO]').join(prazo)
      .split('[OBSERVACOES]').join(obs)
      .split('[CNPJ_CPF]').join('[Documento Omisso]')
      .split('[ID_PROPOSTA]').join(idProp);
  };

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

  // Recalculate total_value when services change
  useEffect(() => {
    if (activeSubTab === 'proposal_form') {
      const tot = proposalForm.services.filter(s => s.selected).reduce((acc, curr) => acc + (curr.price || 0), 0);
      setProposalForm(prev => ({ ...prev, total_value: tot.toString() }));
    }
  }, [proposalForm.services]);

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
        const { error } = await supabase.from('proposal_templates').update({
          name: templateForm.name,
          content: templateForm.content
        }).eq('id', templateForm.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('proposal_templates').insert([{
          partner_id: user.id,
          name: templateForm.name,
          content: templateForm.content
        }]);
        if (error) throw error;
      }
      
      showToast('Sucesso', 'Template salvo com sucesso!', 'success');
      setActiveSubTab('templates');
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

  const handleTemplateSelect = (tid: string) => {
    setProposalForm(prev => ({ ...prev, template_id: tid }));
    if (tid) {
      const selectedTpl = templates.find(t => t.id === tid);
      if (selectedTpl) {
        setProposalForm(prev => ({ ...prev, content: selectedTpl.content }));
      }
    }
  };

  const addService = (name: string = '') => {
    setProposalForm(prev => ({ 
      ...prev, 
      services: [...prev.services, { id: Math.random().toString(), name, price: 0, selected: true }] 
    }));
  };

  const removeService = (id: string) => {
    setProposalForm(prev => ({ 
      ...prev, 
      services: prev.services.filter(s => s.id !== id) 
    }));
  };

  const updateService = (id: string, field: 'name' | 'price' | 'selected', val: any) => {
    setProposalForm(prev => ({
      ...prev,
      services: prev.services.map(s => s.id === id ? { ...s, [field]: val } : s)
    }));
  };

  const saveProposal = async () => {
    if (!proposalForm.title.trim()) {
      showToast('Atenção', 'O Título da Proposta é obrigatório (Etapa 1).', 'error');
      setWizardStep(1); return;
    }
    
    try {
      const payload: any = {
        title: proposalForm.title,
        content: proposalForm.content,
        total_value: proposalForm.total_value ? parseFloat(proposalForm.total_value) : 0,
        client_id: proposalForm.client_id || null,
        lead_id: proposalForm.lead_id || null,
        services: proposalForm.services.filter(s => s.name.trim() !== ''),
        terms: proposalForm.terms
      };

      if (proposalForm.id) {
        const { error } = await supabase.from('proposals').update(payload).eq('id', proposalForm.id);
        if (error) throw error;
      } else {
        payload.partner_id = user.id;
        const { error } = await supabase.from('proposals').insert([payload]);
        if (error) throw error;
      }
      
      showToast('Sucesso!', 'Orçamento configurado e salvo.', 'success');
      setActiveSubTab('proposals');
      setProposalForm(initialProposalState);
      setWizardStep(1);
      fetchProposalsData();
    } catch (err: any) {
      showToast('Erro', err.message, 'error');
    }
  };

  const deleteProposal = async (id: string) => {
    if (!window.confirm('Certeza que deseja apagar este orçamento?')) return;
    const { error } = await supabase.from('proposals').delete().eq('id', id);
    if (!error) {
       showToast('Removido', 'Orçamento desfeito.', 'success');
       fetchProposalsData();
    }
  };

  const copyPublicLink = (id: string) => {
    const link = `${window.location.origin}/quote/${id}`;
    navigator.clipboard.writeText(link);
    showToast('Copiado!', 'Link da proposta pronto para enviar.', 'success');
  };

  // Document Builder UI (Used in both Template Form and Proposal Form Step 4)
  const renderDocumentBuilder = (value: string, onChange: (v: string) => void) => {
    const copyVar = (tag: string) => {
      const insertValue = activeSubTab === 'proposal_form' ? compileTags('', true, tag) : tag;
      
      if (documentEditorRef.current) {
        const editor = documentEditorRef.current.getEditor();
        const selection = editor.getSelection();
        const cursorPosition = selection ? selection.index : editor.getLength();
        editor.insertText(cursorPosition, insertValue);
      } else {
         // Fallback se perder a referência
         navigator.clipboard.writeText(tag);
         showToast('Copiado', `Variável ${tag} copiada com sucesso! Ctrl+V na folha.`, 'success');
      }
    };

    const injectClause = (text: string) => {
      onChange(value + `<p><br/></p><blockquote><strong>${text.split(':')[0]}:</strong> ${text.split(':')[1]}</blockquote>`);
    };

    return (
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* ESQUERDA: Canvas A4 */}
        <div style={{ flex: 1, background: '#cbd5e1', padding: '40px', borderRadius: '12px', display: 'flex', justifyContent: 'center', overflow: 'hidden', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ background: '#fff', width: '210mm', minHeight: '297mm', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', color: '#000', display: 'flex', flexDirection: 'column' }}>
             
             {/* The ReactQuill instance styled to look like Word/Docs inside the A4 */}
             <style>{`
               .document-canvas-editor .ql-toolbar {
                  border: none;
                  border-bottom: 1px solid #e2e8f0;
                  background: #f8fafc;
                  position: sticky;
                  top: 0;
                  z-index: 10;
                  padding: 12px;
               }
               .document-canvas-editor .ql-container {
                  border: none;
                  font-family: 'Inter', sans-serif;
                  font-size: 15px;
                  line-height: 1.6;
               }
               .document-canvas-editor .ql-editor {
                  padding: 40px;
                  min-height: 250mm;
               }
               .document-canvas-editor .ql-editor blockquote {
                  border-left: 4px solid #c9943a;
                  background: #fdfbf7;
                  padding: 10px 20px;
                  color: #334155;
               }
             `}</style>

             <ReactQuill 
               ref={documentEditorRef}
               theme="snow" 
               modules={quillModules} 
               formats={quillFormats}
               value={value} 
               onChange={onChange} 
               className="document-canvas-editor"
               style={{ flex: 1 }}
             />
          </div>
        </div>

        {/* DIREITA: Painel de Automação (Side Panel) */}
        <div style={{ width: '380px', position: 'sticky', top: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
           
           <div style={{ background: 'var(--bg2)', borderRadius: '12px', border: '1px solid var(--border)', padding: '20px' }}>
              <h4 style={{ margin: '0 0 5px 0', fontSize: '1rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{color: 'var(--gold)'}}>⚡</span> Smart Variables
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--t3)', marginBottom: '15px' }}>Clique em uma tag para inseri-la diretamente onde o cursor está na folha.</p>
              
              <style>{`
                 /* Custom scrollbar just for this grid to keep it clean */
                 .vars-grid::-webkit-scrollbar { width: 6px; }
                 .vars-grid::-webkit-scrollbar-track { background: var(--bg1); border-radius: 4px; }
                 .vars-grid::-webkit-scrollbar-thumb { background: var(--b); border-radius: 4px; }
                 .vars-grid::-webkit-scrollbar-thumb:hover { background: var(--t3); }
              `}</style>
              
              <div className="vars-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxHeight: '250px', overflowY: 'auto', paddingRight: '5px' }}>
                 <button className="badge" style={{justifyContent: 'center', background: 'var(--bg1)', color: 'var(--gold)', border: '1px solid var(--b)', cursor: 'pointer', padding: '12px 10px', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.5px'}} onClick={() => copyVar('[NOME_CLIENTE]')}>[NOME_CLIENTE]</button>
                 <button className="badge" style={{justifyContent: 'center', background: 'var(--bg1)', color: 'var(--gold)', border: '1px solid var(--b)', cursor: 'pointer', padding: '12px 10px', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.5px'}} onClick={() => copyVar('[CNPJ_CPF]')}>[CNPJ_CPF]</button>
                 <button className="badge" style={{justifyContent: 'center', background: 'var(--bg1)', color: 'var(--gold)', border: '1px solid var(--b)', cursor: 'pointer', padding: '12px 10px', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.5px'}} onClick={() => copyVar('[VALOR_TOTAL]')}>[VALOR_TOTAL]</button>
                 <button className="badge" style={{justifyContent: 'center', background: 'var(--bg1)', color: 'var(--gold)', border: '1px solid var(--b)', cursor: 'pointer', padding: '12px 10px', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.5px'}} onClick={() => copyVar('[DATA_PROPOSTA]')}>[DATA_PROPOSTA]</button>
                 <button className="badge" style={{justifyContent: 'center', background: 'var(--bg1)', color: 'var(--gold)', border: '1px solid var(--b)', cursor: 'pointer', padding: '12px 10px', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.5px'}} onClick={() => copyVar('[PRAZO_CONTRATO]')}>[PRAZO_CONTRATO]</button>
                 <button className="badge" style={{justifyContent: 'center', background: 'var(--bg1)', color: 'var(--gold)', border: '1px solid var(--b)', cursor: 'pointer', padding: '12px 10px', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.5px'}} onClick={() => copyVar('[NOME_LEAD]')}>[NOME_LEAD]</button>
                 <button className="badge" style={{justifyContent: 'center', background: 'var(--bg1)', color: 'var(--gold)', border: '1px solid var(--b)', cursor: 'pointer', padding: '12px 10px', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.5px'}} onClick={() => copyVar('[ID_PROPOSTA]')}>[ID_PROPOSTA]</button>
                 <button className="badge" style={{justifyContent: 'center', background: 'var(--bg1)', color: 'var(--gold)', border: '1px solid var(--b)', cursor: 'pointer', padding: '12px 10px', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.5px'}} onClick={() => copyVar('[OBSERVACOES]')}>[OBSERVACOES]</button>
              </div>
           </div>

           <div style={{ background: 'var(--bg2)', borderRadius: '12px', border: '1px solid var(--border)', padding: '20px' }}>
              <h4 style={{ margin: '0 0 5px 0', fontSize: '1rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{color: 'var(--gold)'}}>📜</span> Cláusulas Prontas
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--t3)', marginBottom: '15px' }}>Bloquinhos pré-fabricados de texto seguro. Clique para injetar no fim da folha.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 <button className="btn ghost" style={{justifyContent: 'flex-start', fontSize: '0.8rem', textAlign: 'left', border: '1px dashed var(--b)'}} onClick={() => injectClause('Confidencialidade: As partes concordam em manter o sigilo absoluto sobre informações prestadas, bem como detalhes da arquitetura de inteligência.')}>
                    Inserir "Confidencialidade"
                 </button>
                 <button className="btn ghost" style={{justifyContent: 'flex-start', fontSize: '0.8rem', textAlign: 'left', border: '1px dashed var(--b)'}} onClick={() => injectClause('Rescisão Motivada: O contrato pode ser interrompido sem multas caso não exista entrega do escopo combinado dentro de 60 dias úteis do kickoff.')}>
                    Inserir "Termos de Rescisão"
                 </button>
                 <button className="btn ghost" style={{justifyContent: 'flex-start', fontSize: '0.8rem', textAlign: 'left', border: '1px dashed var(--b)'}} onClick={() => injectClause('Foro Comercial: Fica eleito o foro da comarca da fornecedora para dirimir quaisquer litígios oriundos da interpretação deste documento documental.')}>
                    Inserir "Foro Legal"
                 </button>
              </div>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page active">
      {/* HEADER SECTION */}
      <div className="u-section-header">
        <div>
          <div className="u-mono-label-xs">{proposals.length} {t('activeProposalsCount')} | {templates.length} {t('templatesInLibrary')}</div>
          <div className="u-syne-title u-mt-3">{t('proposalsManagement')}</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn" style={{background: 'var(--bg2)', border: '1px solid var(--border)'}} onClick={() => { setTemplateForm({id:'', name:'', content: ''}); setActiveSubTab('template_form'); }}>
             {t('createTemplate')}
          </button>
          <button className="btn gold" onClick={() => { setProposalForm(initialProposalState); setWizardStep(1); setActiveSubTab('proposal_form'); }}>
             {t('newProposalBtn')}
          </button>
        </div>
      </div>

      {/* TABS SELECTOR */}
      {['proposals', 'templates'].includes(activeSubTab) && (
        <div style={{ display: 'flex', gap: '30px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
           <button onClick={() => setActiveSubTab('proposals')} style={{ background: 'transparent', color: activeSubTab === 'proposals' ? 'var(--gold)' : 'var(--t2)', border: 'none', fontWeight: activeSubTab === 'proposals' ? '700' : '500', cursor: 'pointer', fontSize: '1rem', paddingBottom: 10, borderBottom: activeSubTab === 'proposals' ? '2px solid var(--gold)' : '2px solid transparent', marginBottom: -12, transition: 'all 0.2s' }}>{t('activeProposals')}</button>
           <button onClick={() => setActiveSubTab('templates')} style={{ background: 'transparent', color: activeSubTab === 'templates' ? 'var(--gold)' : 'var(--t2)', border: 'none', fontWeight: activeSubTab === 'templates' ? '700' : '500', cursor: 'pointer', fontSize: '1rem', paddingBottom: 10, borderBottom: activeSubTab === 'templates' ? '2px solid var(--gold)' : '2px solid transparent', marginBottom: -12, transition: 'all 0.2s' }}>{t('templatesLibrary')}</button>
        </div>
      )}

      {loading ? (
         <div style={{ padding: '40px', textAlign: 'center', color: 'var(--t3)' }}>{t('syncing')}</div>
      ) : activeSubTab === 'proposals' ? (
        <div style={{ display: 'grid', gap: '15px' }}>
          {proposals.length === 0 && <div className="empty-state" style={{padding: '40px', textAlign: 'center'}}><span style={{fontSize:'3rem',opacity:0.6}}>📄</span><br/>{t('noProposals')}</div>}
          
          <div style={{ overflowX: 'auto', background: 'var(--bg2)', borderRadius: '12px' }}>
            <table style={{ minWidth: '1100px', width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--b)' }}>
                <tr>
                  <th style={{ padding: '16px', color: 'var(--t3)', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase' }}>{t('clientTitleProspect')}</th>
                  <th style={{ padding: '16px', color: 'var(--t3)', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase' }}>{t('totalValueObj')}</th>
                  <th style={{ padding: '16px', color: 'var(--t3)', fontWeight: 500, fontSize: '0.85rem', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>{t('dateRegistered')}</th>
                  <th style={{ padding: '16px', color: 'var(--t3)', fontWeight: 500, fontSize: '0.85rem', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>{t('viewedAt')}</th>
                  <th style={{ padding: '16px', color: 'var(--t3)', fontWeight: 500, fontSize: '0.85rem', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>{t('signedAt')}</th>
                  <th style={{ padding: '16px', color: 'var(--t3)', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase' }}>{t('status')}</th>
                  <th style={{ padding: '16px', color: 'var(--t3)', fontWeight: 500, fontSize: '0.85rem', textAlign: 'center', textTransform: 'uppercase' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--b)', background: 'var(--bg1)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.95rem' }}>{p.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--t2)', marginTop: 4 }}>
                        {p.client?.name || p.lead?.name || t('unlinkedClient')}
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontWeight: 700, fontFamily: "'DM Mono', monospace", color: 'var(--gold)' }}>
                      {t('currencySymbol')} {p.total_value ? p.total_value.toLocaleString(lang) : '0,00'}
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                      {new Date(p.created_at || '').toLocaleString(lang, { dateStyle: 'short', timeStyle: 'short' }).replace(',', ' -')}
                    </td>
                    <td style={{ padding: '16px', color: 'var(--t2)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                      {p.viewed_at ? new Date(p.viewed_at).toLocaleString(lang, { dateStyle: 'short', timeStyle: 'short' }).replace(',', ' -') : '--'}
                    </td>
                    <td style={{ padding: '16px', color: 'var(--t2)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                      {p.signed_at ? new Date(p.signed_at).toLocaleString(lang, { dateStyle: 'short', timeStyle: 'short' }).replace(',', ' -') : '--'}
                    </td>
                    <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                       {p.status === 'signed' ? <span className="badge" style={{background: 'rgba(52, 211, 153, 0.1)', color: '#34d399'}}>{t('statusSigned')}</span> : 
                        p.status === 'viewed' ? <span className="badge" style={{background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8'}}>{t('statusViewed')}</span> : 
                        p.status === 'rejected' ? <span className="badge" style={{background: 'rgba(248, 113, 113, 0.1)', color: '#f87171'}}>{t('statusRejected')}</span> : 
                        <span className="badge" style={{background: 'rgba(201,148,58,0.1)', color: 'var(--gold)'}}>{t('statusSent')}</span>}
                    </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      {p.status === 'signed' && p.pdf_url && (
                        <a href={p.pdf_url} target="_blank" rel="noreferrer" className="btn ghost" style={{padding: '6px 12px', fontSize: '0.8rem'}}>{t('pdfDownload')}</a>
                      )}
                      <button className="btn ghost" style={{padding: '6px 12px', fontSize: '0.8rem', border: '1px solid var(--b)'}} onClick={() => copyPublicLink(p.id)}>{t('link')}</button>
                      
                      <button className="btn ghost" style={{padding: '6px 12px', fontSize: '0.8rem'}} onClick={() => { 
                         setProposalForm({ id: p.id, title: p.title, content: p.content, total_value: p.total_value?.toString() || '0', client_id: p.client_id || '', lead_id: p.lead_id || '', template_id: '', services: (p as any).services || [], terms: (p as any).terms || { contract_time: 'Avulso', payment_method: 'Cartão de Crédito', notes: '' } }); 
                         setWizardStep(4); // Vai direto para revisar
                         setActiveSubTab('proposal_form'); 
                      }}>{t('edit')}</button>
                      <button className="btn ghost" style={{color: 'var(--red)', padding: '6px', fontSize: '1rem'}} onClick={() => deleteProposal(p.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      ) : activeSubTab === 'templates' ? (
        <div style={{}}>
          {templates.length === 0 && <div className="empty-state" style={{padding: '40px', textAlign: 'center'}}><span style={{fontSize:'3rem',opacity:0.6}}>📚</span><br/>{t('emptyTemplates')}</div>}
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {templates.map(tData => (
              <div key={tData.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                 <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--gold)' }}></div>
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                   <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(201,148,58,0.1)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📄</div>
                   <span className="badge" style={{background: 'var(--bg1)'}}>{t('templateBadge')}</span>
                 </div>
                 
                 <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '10px' }}>{tData.name}</div>
                 <div style={{ fontSize: '0.8rem', color: 'var(--t3)', flex: 1, marginBottom: '20px' }}>{t('templateDesc')}</div>
                 
                 <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--b)', paddingTop: '15px' }}>
                    <button className="btn ghost" style={{flex: 1, fontSize: '0.85rem', padding: '8px', justifyContent: 'center'}} onClick={() => { setTemplateForm({ id: tData.id, name: tData.name, content: tData.content }); setActiveSubTab('template_form'); }}>{t('editBtn2')}</button>
                    <button className="btn gold" style={{flex: 1, fontSize: '0.85rem', padding: '8px', justifyContent: 'center'}} onClick={() => { setProposalForm({...initialProposalState, template_id: tData.id, content: tData.content}); setWizardStep(1); setActiveSubTab('proposal_form'); }}>{t('useTemplate')}</button>
                    <button className="btn ghost" style={{padding: '8px', color: 'var(--red)'}} onClick={() => deleteTemplate(tData.id)}>🗑️</button>
                 </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* FORM: NOVO TEMPLATE */}
      {activeSubTab === 'template_form' && (
        <div style={{ marginTop: '20px', maxWidth: '1400px', margin: '20px auto 0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
            <button className="btn ghost" onClick={() => setActiveSubTab('templates')}>← Biblioteca</button>
            <div className="section-title" style={{ margin: 0 }}>{templateForm.id ? 'Modificando Layout' : 'Configurando Novo Modelo Contratual'}</div>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
             <label className="f-label">Denominação do Modelo (Padrão)</label>
             <input type="text" className="f-inp" placeholder="Ex: Contrato de Construção Predial V2" value={templateForm.name} onChange={e => setTemplateForm(prev => ({...prev, name: e.target.value}))} />
          </div>
          
          <div style={{ marginBottom: '20px', background: 'rgba(201,148,58,0.05)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 15 }}>
             <div style={{flex: 1}}>
               <strong style={{display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: 'var(--gold)'}}>Smart Import (Extrair de Arquivo PDF local):</strong>
               <small style={{display: 'block', color: 'var(--t3)'}}>O sistema removerá as imagens do seu PDF antigo e transcreverá as cláusulas para o editor abaixo, facilitando a portabilidade visual.</small>
             </div>
             <input type="file" accept=".pdf" onChange={handlePdfUpload} className="f-inp" style={{maxWidth: 250, padding: 8}}/>
          </div>

          <div style={{ marginBottom: '15px' }}>
             <label className="f-label" style={{display: 'flex', justifyContent: 'space-between', marginBottom: 10}}>
               <span style={{color: 'var(--text)'}}>Layout Documental / Construtor Base</span>
             </label>
             {renderDocumentBuilder(templateForm.content, (content) => setTemplateForm(prev => ({...prev, content})))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px', padding: '20px 0', borderTop: '1px solid var(--b)' }}>
            <button className="btn ghost" onClick={() => setActiveSubTab('templates')}>Descartar</button>
            <button className="btn gold" onClick={saveTemplate}>Gravar no Sistema</button>
          </div>
        </div>
      )}

      {/* FORM: NOVO ORÇAMENTO (WIZARD 4 STEPS) */}
      {activeSubTab === 'proposal_form' && (
        <div style={{ marginTop: '20px', maxWidth: wizardStep === 4 ? '1400px' : '1000px', margin: '20px auto 0 auto', transition: 'max-width 0.3s ease' }}>
          
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 30 }}>
            <button className="btn ghost" onClick={() => { setActiveSubTab('proposals'); setProposalForm(initialProposalState); }}>
               ← Sair / Voltar
            </button>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <h2 style={{fontSize: '1.8rem', fontFamily: "'Syne', sans-serif", margin: 0, color: 'var(--text)'}}>{proposalForm.id ? 'Editar Proposta Comercial' : 'Nova Proposta Comercial'}</h2>
              <p style={{color: 'var(--t2)', marginTop: 8}}>Preencha os dados estruturados para blindagem e envio comercial.</p>
            </div>
            <div style={{ width: '140px' }}></div> {/* Spacer to maintain perfect center alignment */}
          </div>

          {/* Stepper UI */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40, padding: '0 40px', position: 'relative', maxWidth: '1000px', margin: '0 auto 40px auto' }}>
            <div style={{position: 'absolute', top: 14, left: 70, right: 70, height: 2, background: 'var(--b)', zIndex: 0}}>
               <div style={{height: '100%', background: 'var(--gold)', transition: 'width 0.3s ease', width: `${((wizardStep-1)/3)*100}%`}}></div>
            </div>
            
            {[1, 2, 3, 4].map(num => (
              <div key={num} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                 <div onClick={() => { if(num < wizardStep || proposalForm.id) setWizardStep(num); }} style={{ width: 30, height: 30, borderRadius: '50%', background: wizardStep >= num ? 'var(--gold)' : 'var(--bg2)', border: wizardStep >= num ? '2px solid var(--gold)' : '2px solid var(--b)', color: wizardStep > num ? 'transparent' : (wizardStep === num ? '#000' : 'var(--t3)'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', cursor: (num < wizardStep || proposalForm.id) ? 'pointer' : 'default', transition: 'all 0.3s' }}>
                   {wizardStep > num ? <span style={{position:'absolute', color:'#000'}}>✓</span> : num}
                 </div>
                 <span style={{fontSize: '0.8rem', fontWeight: wizardStep >= num ? 600 : 400, color: wizardStep === num ? 'var(--gold)' : 'var(--text)'}}>
                   {num === 1 ? 'Prospect' : num === 2 ? 'Serviços' : num === 3 ? 'Termos' : 'Revisar e Gerar'}
                 </span>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--bg2)', borderRadius: '16px', padding: '30px', border: wizardStep === 4 ? 'none' : '1px solid var(--border)', minHeight: '400px', boxShadow: wizardStep === 4 ? 'none' : '0 10px 40px rgba(0,0,0,0.2)' }}>
            
            {/* STEP 1: PROSPECT */}
            {wizardStep === 1 && (
              <div className="anim-fade-in" style={{animation: 'fadeIn 0.3s'}}>
                <h3 style={{fontSize: '1.2rem', margin: '0 0 20px 0', borderBottom: '1px solid var(--b)', paddingBottom: 10}}>A. Identificação do Prospecto</h3>
                
                <div style={{ marginBottom: '20px' }}>
                  <label className="f-label">Slogan do Documento (Título da Proposta) <span style={{color:'var(--red)'}}>*</span></label>
                  <input type="text" className="f-inp" placeholder="Ex: Proposta de Arquitetura de Interiores - Apto 304..." value={proposalForm.title} onChange={e => setProposalForm(prev => ({...prev, title: e.target.value}))} style={{fontSize: '1.1rem'}}/>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label className="f-label">Vincular Cliente Base (CRM) (Opcional)</label>
                    <select className="f-inp" value={proposalForm.client_id} onChange={e => setProposalForm(prev => ({...prev, client_id: e.target.value}))}>
                       <option value="">-- Sem vínculo --</option>
                       {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="f-label">Vincular a uma Oportunidade (Lead) (Opcional)</label>
                    <select className="f-inp" value={proposalForm.lead_id} onChange={e => setProposalForm(prev => ({...prev, lead_id: e.target.value}))}>
                       <option value="">-- Sem vínculo --</option>
                       {leads.map(l => <option key={l.id} value={l.id}>{l.name} - Etapa: {l.status}</option>)}
                    </select>
                  </div>
                </div>

                {!proposalForm.id && (
                  <div style={{ marginTop: '30px', background: 'var(--bg1)', padding: '20px', borderRadius: '8px', border: '1px dashed var(--b)' }}>
                     <label className="f-label" style={{color: 'var(--gold)'}}>📚 Reutilizar um Modelo pré-aprovado:</label>
                     <p style={{fontSize: '0.85rem', color: 'var(--t3)', marginBottom: 15, marginTop: -5}}>Selecione a base do contrato. Suas variáveis serão mantidas para o Passo 4.</p>
                     <select className="f-inp" value={proposalForm.template_id} onChange={e => handleTemplateSelect(e.target.value)} style={{border: '1px solid var(--gold)'}}>
                       <option value="">-- Usar folha em branco --</option>
                       {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                     </select>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: SERVICES */}
            {wizardStep === 2 && (
              <div className="anim-fade-in" style={{animation: 'fadeIn 0.3s'}}>
                <h3 style={{fontSize: '1.2rem', margin: '0 0 5px 0'}}>B. Serviços e Valores</h3>
                <p style={{fontSize: '0.85rem', color: 'var(--t3)', marginBottom: 20}}>Selecione ou declare os novos serviços e custos atrelados à operação. Eles irão formatar o bloco principal.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {proposalForm.services.map((svc) => (
                    <div key={svc.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', background: svc.selected ? 'rgba(201,148,58,0.05)' : 'var(--bg1)', border: svc.selected ? '1px solid var(--gold)' : '1px solid var(--b)', padding: '15px', borderRadius: '8px', transition: 'all 0.2s' }}>
                      <input type="checkbox" checked={svc.selected} onChange={e => updateService(svc.id, 'selected', e.target.checked)} style={{width: 20, height: 20, cursor: 'pointer', accentColor: 'var(--gold)'}}/>
                      <input type="text" className="f-inp" placeholder="O que será executado? Ex: Demolição Inicial" value={svc.name} onChange={e => updateService(svc.id, 'name', e.target.value)} style={{flex: 1, border: 'none', background: 'transparent', padding: 0, fontSize: '1rem', color:'var(--text)'}} />
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', width: '220px' }}>
                        <span style={{color: 'var(--t3)'}}>R$</span>
                        <input type="number" className="f-inp" placeholder="0.00" value={svc.price || ''} onChange={e => updateService(svc.id, 'price', parseFloat(e.target.value) || 0)} style={{flex: 1, background: 'var(--bg2)', textAlign: 'right', fontWeight: 'bold'}} />
                        <button onClick={() => removeService(svc.id)} style={{background: 'none', border:'none', color:'var(--red)', cursor:'pointer', fontSize: '1.2rem', padding: '0 5px'}}>×</button>
                      </div>
                    </div>
                  ))}
                  {proposalForm.services.length === 0 && (
                    <div style={{padding: 20, textAlign: 'center', color: 'var(--t3)', border: '1px dashed var(--b)', borderRadius: 8}}>
                       Nenhum serviço ou etapa de obra adicionada.
                    </div>
                  )}
                </div>
                
                <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                   <button className="btn ghost" onClick={() => addService()} style={{border: '1px dashed var(--t3)', color: 'var(--t2)'}}>+ Adicionar Linha Vazia</button>
                   <select className="f-inp" style={{width: 250}} onChange={e => { if(e.target.value) { addService(e.target.value); e.target.value=''; } }}>
                      <option value="">Serviços Frequentes...</option>
                      {defaultServices.map(ds => <option key={ds} value={ds}>{ds}</option>)}
                   </select>
                </div>

                <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(0,0,0,0.3)', borderTop: '2px solid var(--b)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 20, borderRadius: '8px' }}>
                  <span style={{fontSize: '1.1rem', color: 'var(--t2)'}}>Total do Escopo Fechado:</span>
                  <span style={{fontSize: '1.8rem', fontWeight: 800, color: 'var(--gold)', fontFamily: "'DM Mono', monospace"}}>R$ {(parseFloat(proposalForm.total_value || '0')).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
              </div>
            )}

            {/* STEP 3: TERMS */}
            {wizardStep === 3 && (
              <div className="anim-fade-in" style={{animation: 'fadeIn 0.3s'}}>
                <h3 style={{fontSize: '1.2rem', margin: '0 0 20px 0', borderBottom: '1px solid var(--b)', paddingBottom: 10}}>C. Termos e Condições Comerciais</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label className="f-label">Duração Prevista (Mensal, Avulso, Anual)</label>
                    <select className="f-inp" value={proposalForm.terms?.contract_time || ''} onChange={e => setProposalForm(prev => ({...prev, terms: {...prev.terms, contract_time: e.target.value}}))}>
                      <option value="Serviço Único / Obra Avulsa">Serviço Único / Obra Avulsa</option>
                      <option value="Manutenção Mensal / Acompanhamento">Manutenção Mensal / Acompanhamento</option>
                      <option value="Contrato de 6 Meses">Contrato de 6 Meses</option>
                      <option value="Contrato de 12 Meses">Contrato de 12 Meses</option>
                      <option value="Contrato de 24 Meses">Contrato de 24 Meses</option>
                    </select>
                  </div>
                  <div>
                    <label className="f-label">Prazo de Pagamento Base</label>
                    <select className="f-inp" value={proposalForm.terms?.payment_method || ''} onChange={e => setProposalForm(prev => ({...prev, terms: {...prev.terms, payment_method: e.target.value}}))}>
                      <option value="Boleto Bancário / PIX (À vista)">Boleto Bancário / PIX (À vista)</option>
                      <option value="Entrada + Parcelas via Boleto">Entrada + Parcelas via Boleto</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Tabela de Medição (Construbase)">Tabela de Medição (Construbase)</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label className="f-label">Condições Especiais Diretas (Ficarão em destaque na proposta final)</label>
                  <textarea className="f-inp" rows={4} placeholder="Ex: Multa rescisória de 10% do material. Válido até dia 20 deste mês." value={proposalForm.terms?.notes || ''} onChange={e => setProposalForm(prev => ({...prev, terms: {...prev.terms, notes: e.target.value}}))} style={{resize: 'vertical', paddingTop: 10}}></textarea>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & CONTENT */}
            {wizardStep === 4 && (
              <div className="anim-fade-in" style={{animation: 'fadeIn 0.3s'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--b)', paddingBottom: 10, marginBottom: 20}}>
                   <h3 style={{fontSize: '1.2rem', margin: 0}}>D. Edição Profissional do Documento Base</h3>
                   {proposalForm.id && <button className="btn ghost" onClick={() => copyPublicLink(proposalForm.id)} style={{border: '1px solid var(--gold)', color: 'var(--gold)', padding: '5px 10px'}}>Copiar URL de Cliente</button>}
                </div>
                
                <p style={{fontSize: '0.85rem', color: 'var(--t3)', marginBottom: 20}}>
                  Analise o texto estruturado vindo do modelo escolhido, ajuste as Cláusulas ou injete Variáveis através da barra lateral inteligente. O sistema empacota o visual de {proposalForm.services.filter((s:any)=>s.selected).length} Serviços na URL pública automaticamente.
                </p>

                {renderDocumentBuilder(proposalForm.content, (content) => setProposalForm(prev => ({...prev, content})))}
              </div>
            )}

          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px', maxWidth: '1000px', margin: '30px auto 0 auto' }}>
            {wizardStep === 1 ? (
               <button className="btn ghost" onClick={() => { setActiveSubTab('proposals'); setProposalForm(initialProposalState); }}>✕ Desistir</button>
            ) : (
               <button className="btn ghost" onClick={() => setWizardStep(prev => prev - 1)}>← Voltar Etapa</button>
            )}

            {wizardStep === 4 ? (
               <button className="btn gold" onClick={saveProposal}>CONCLUIR PARCERIA ▶</button>
            ) : (
               <button className="btn gold" onClick={() => { 
                 if(!proposalForm.title.trim()) { showToast('Atenção', 'Preencha o Título / Identificação.', 'error'); return; } 
                 if(wizardStep === 3) { setProposalForm(prev => ({...prev, content: compileTags(prev.content)})); }
                 setWizardStep(prev => prev + 1)
               }}>Próxima Etapa →</button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
