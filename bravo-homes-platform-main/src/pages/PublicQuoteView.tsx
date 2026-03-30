import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import SignatureCanvas from 'react-signature-canvas';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { Proposal } from '../types';

export default function PublicQuoteView() {
  const { id } = useParams();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const documentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchProposal(id);
    }
  }, [id]);

  const fetchProposal = async (proposalId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('proposals')
        .select('*, partner:profiles!partner_id(full_name, avatar_url, company_name), client:clients(name, email)')
        .eq('id', proposalId)
        .single();
        
      if (error) throw error;
      
      setProposal(data);
      
      // Update viewed_at if null and status is draft/sent
      if (!data.viewed_at && ['draft', 'sent'].includes(data.status)) {
        await supabase
          .from('proposals')
          .update({ viewed_at: new Date().toISOString(), status: 'viewed' })
          .eq('id', proposalId);
      }
    } catch (err: any) {
      setError('Orçamento não encontrado ou link inválido.');
    } finally {
      setLoading(false);
    }
  };

  const clearSignature = () => {
    sigCanvasRef.current?.clear();
  };

  const handleConfirmSignature = async () => {
    if (sigCanvasRef.current?.isEmpty()) {
      alert('Por favor, assine no quadro antes de confirmar.');
      return;
    }
    
    setIsProcessing(true);
    let signatureDataUrl = '';
    
    try {
      // Usar getCanvas() direto ao invés de getTrimmedCanvas() para evitar bug de canvas trimming do Vite dev server
      signatureDataUrl = sigCanvasRef.current?.getCanvas().toDataURL('image/png') || '';
    } catch(err: any) {
      alert("Erro ao ler o Canvas: " + err.message);
      setIsProcessing(false);
      return;
    }

    try {
      
      const { error: dbError } = await supabase
        .from('proposals')
        .update({
          status: 'signed',
          signed_at: new Date().toISOString(),
          signature_url: signatureDataUrl
        })
        .eq('id', proposal?.id);
        
      if (dbError) throw dbError;
      
      setProposal(prev => prev ? { ...prev, status: 'signed', signed_at: new Date().toISOString(), signature_url: signatureDataUrl } : null);
      
      setTimeout(async () => {
         await generateAndUploadPDF();
      }, 500);

    } catch (err: any) {
      console.error("DEBUG SIGNATURE ERROR:", err);
      alert('Erro ao processar assinatura: ' + err.message);
      setIsProcessing(false);
    }
  };
  
  const generateAndUploadPDF = async () => {
    if (!documentRef.current || !proposal) return;
    
    try {
      // Configure HTML2Canvas to match the beautiful new layout
      const canvas = await html2canvas(documentRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Cria o PDF com altura dinâmica para nunca cortar a proposta, gerando um documento longo contínuo
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: [pdfWidth, pdfHeight] });
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const pdfBlob = pdf.output('blob');
      
      const fileName = `signed_proposal_${proposal.id}_${Date.now()}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('proposals')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });
        
      if (!uploadError && uploadData) {
         const { data: publicUrlData } = supabase.storage.from('proposals').getPublicUrl(uploadData.path);
         await supabase.from('proposals').update({ pdf_url: publicUrlData.publicUrl }).eq('id', proposal.id);
         
         try {
            await supabase.functions.invoke('send-quote-email', {
               body: { 
                 proposal_id: proposal.id, 
                 pdf_url: publicUrlData.publicUrl,
                 client_email: (proposal as any).client?.email || null
               }
            });
         } catch(e) {
            console.warn('Edge function para email não implementada ou falhou', e);
         }
      }
      
      setIsSuccess(true);
      setIsProcessing(false);
      setIsSignModalOpen(false);
      
    } catch(err: any) {
       console.error("Erro ao gerar PDF:", err);
       alert("Erro ao arquivar cópia em PDF, mas a assinatura foi salva.");
       setIsSuccess(true);
       setIsProcessing(false);
       setIsSignModalOpen(false);
    }
  };

  if (loading) return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#0f172a'}}>Carregando...</div>;
  if (error || !proposal) return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#0f172a'}}>{error}</div>;

  const partnerName = (proposal as any).partner?.company_name || (proposal as any).partner?.full_name || 'Bravo';
  const clientName = (proposal as any).client?.name || 'Cliente';
  const services = (proposal as any).services || [];
  const terms = (proposal as any).terms || {};

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px', color: '#1e293b', fontFamily: "'Inter', sans-serif" }}>
       
       <div ref={documentRef} style={{ maxWidth: '850px', margin: '0 auto', background: '#fff', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          
          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '40px 50px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{display: 'flex', alignItems: 'center', gap: 15}}>
               <div style={{ width: 45, height: 45, background: '#1e293b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c9943a', fontWeight: 'bold', fontSize: '20px' }}>
                  {partnerName.charAt(0)}
               </div>
               <div>
                 <div style={{ fontWeight: 800, fontSize: '18px', color: '#0f172a' }}>{partnerName}</div>
                 <div style={{ fontSize: '13px', color: '#64748b' }}>Proposta Oficial</div>
               </div>
            </div>
            
            <div style={{ textAlign: 'right' }}>
               <h1 style={{ margin: '0 0 5px 0', fontSize: '22px', color: '#0f172a' }}>{proposal.title}</h1>
               <div style={{ color: '#64748b', fontSize: '14px' }}>
                 Para: <strong>{clientName}</strong>
               </div>
            </div>
          </div>

          <div style={{ padding: '50px' }}>
            
            {/* RICH TEXT CONTENT */}
            <div 
               className="ql-editor" 
               style={{ padding: 0, color: '#334155', fontSize: '15px', lineHeight: '1.7', marginBottom: '50px' }}
               dangerouslySetInnerHTML={{ __html: proposal.content }} 
            />

            {/* SERVICES & SCOPE */}
            {services.length > 0 && (
              <div style={{ marginBottom: '40px' }}>
                <h3 style={{ fontSize: '18px', color: '#0f172a', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>Investimento e Escopo</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   {services.filter((s:any)=>s.selected).map((svc: any) => (
                     <div key={svc.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#334155', fontWeight: 500 }}>
                           <span style={{color: '#c9943a'}}>✓</span> {svc.name}
                        </div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                           R$ {(svc.price || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            )}

            {/* TOTAL BLOCK */}
            <div style={{ background: '#0f172a', color: '#fff', borderRadius: '12px', padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', boxShadow: '0 10px 25px rgba(15,23,42,0.2)' }}>
               <div>
                 <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '5px' }}>Total do Investimento</div>
                 {terms.contract_time && <div style={{ fontSize: '12px', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '100px', display: 'inline-block' }}>{terms.contract_time}</div>}
               </div>
               <div style={{ fontSize: '36px', fontWeight: 800, color: '#fff' }}>
                 R$ {(proposal.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
               </div>
            </div>

            {/* SPECIAL CONDITIONS (YELLOW BLOCK) */}
            {terms.notes && (
              <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: '8px', padding: '20px', marginBottom: '40px' }}>
                 <strong style={{ display: 'block', color: '#854d0e', marginBottom: '8px', fontSize: '14px' }}>Condições Especiais:</strong>
                 <div style={{ color: '#a16207', fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                   {terms.notes}
                 </div>
              </div>
            )}

            {/* STATUS / SIGNATURE AREA */}
            <div style={{ marginTop: '50px' }}>
               {proposal.status === 'signed' ? (
                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '30px', textAlign: 'center' }}>
                     <div style={{ width: 50, height: 50, background: '#10b981', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 15px auto' }}>✓</div>
                     <h3 style={{ margin: '0 0 10px 0', color: '#065f46', fontSize: '20px' }}>Proposta Aceita!</h3>
                     <p style={{ color: '#047857', fontSize: '14px', marginBottom: '25px', margin: '0 auto 25px auto', maxWidth: 400 }}>Recebemos sua confirmação. Nossa equipe entrará em contato em breve para o onboarding/início do projeto.</p>
                     
                     <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', display: 'inline-block', border: '1px dashed #a7f3d0' }}>
                        <img src={proposal.signature_url} alt="Assinatura Eletrônica" style={{ height: '70px', display: 'block', margin: '0 auto 10px', pointerEvents: 'none' }} />
                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', width: '250px', fontSize: '12px', color: '#64748b' }}>
                           Assinatura Eletrônica Registrada<br/>
                           {new Date(proposal.signed_at || '').toLocaleString('pt-BR')}
                        </div>
                     </div>
                  </div>
               ) : (
                  <div style={{ textAlign: 'center', background: '#f8fafc', padding: '40px', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                     {isProcessing ? (
                       <div style={{ color: '#64748b' }}>Processando assinatura e gerando PDF Seguro, aguarde...</div>
                     ) : (
                       <div>
                         <h3 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>Pronto para fechar negócio?</h3>
                         <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '25px' }}>Ao assinar eletronicamente, você atesta o acordo com os serviços e valores listados.</p>
                         <button 
                            style={{ padding: '16px 40px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(15,23,42,0.3)', transition: 'transform 0.2s' }}
                            onClick={() => setIsSignModalOpen(true)}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                         >
                           Assinar Proposta Eletronicamente
                         </button>
                       </div>
                     )}
                  </div>
               )}
            </div>
          </div>
          
          <div style={{ background: '#f1f5f9', padding: '15px', textAlign: 'center', fontSize: '11px', color: '#94a3b8' }}>
             Gerado de forma inteligente e segura com a Bravo Homes Platform
          </div>
       </div>

       {/* Signature Modal */}
       {isSignModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
             <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', maxWidth: '500px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '10px', color: '#0f172a', fontSize: '20px' }}>Colha sua assinatura</h3>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '25px' }}>Desenhe sua rubrica no quadro abaixo para concordar com os termos da proposta.</p>
                
                <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', background: '#f8fafc', marginBottom: '20px' }}>
                  <SignatureCanvas 
                    ref={sigCanvasRef} 
                    canvasProps={{ width: 440, height: 200, className: 'sigCanvas' }}
                    penColor="#0f172a"
                  />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <button style={{ padding: '10px 15px', border: 'none', color: '#64748b', background: 'transparent', cursor: 'pointer', fontWeight: 500 }} onClick={clearSignature}>Limpar</button>
                   <div style={{ display: 'flex', gap: '10px' }}>
                     <button style={{ padding: '10px 20px', border: '1px solid #e2e8f0', color: '#475569', background: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }} onClick={() => setIsSignModalOpen(false)}>Cancelar</button>
                     <button style={{ padding: '10px 25px', border: 'none', background: '#c9943a', color: '#fff', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer' }} onClick={handleConfirmSignature}>Confirmar Aceite</button>
                   </div>
                </div>
             </div>
          </div>
       )}
    </div>
  );
}
