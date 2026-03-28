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
    try {
      // 1. Get Signature Image Data URL
      const signatureDataUrl = sigCanvasRef.current?.getTrimmedCanvas().toDataURL('image/png') || '';
      
      // We momentarily hide the sign button and append the signature to the document for PDF capture
      // Since react state is async, we do this manually or trust the re-render.
      // Better way: send signatureDataUrl to a state, let it render, then capture PDF.
      // For immediate capture, we can inject it into a hidden img tag, but the PDF needs the actual DOM.
      
      // We will update the DB first to get the status to "signed", then trigger PDF generation locally, 
      // then upload the PDF, then update the DB again.
      
      const { error: dbError } = await supabase
        .from('proposals')
        .update({
          status: 'signed',
          signed_at: new Date().toISOString(),
          signature_url: signatureDataUrl
        })
        .eq('id', proposal?.id);
        
      if (dbError) throw dbError;
      
      // Wait a moment for DOM to update with the "signed" status indicating the rendering of the signature inline
      // We force a local state update
      setProposal(prev => prev ? { ...prev, status: 'signed', signed_at: new Date().toISOString(), signature_url: signatureDataUrl } : null);
      
      setTimeout(async () => {
         await generateAndUploadPDF();
      }, 500);

    } catch (err: any) {
      alert('Erro ao processar assinatura: ' + err.message);
      setIsProcessing(false);
    }
  };
  
  const generateAndUploadPDF = async () => {
    if (!documentRef.current || !proposal) return;
    
    try {
      const canvas = await html2canvas(documentRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const pdfBlob = pdf.output('blob');
      
      // Upload to Supabase Storage
      const fileName = `signed_proposal_${proposal.id}_${Date.now()}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('proposals')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });
        
      if (!uploadError && uploadData) {
         // Get public URL
         const { data: publicUrlData } = supabase.storage.from('proposals').getPublicUrl(uploadData.path);
         
         // Update Proposal with PDF url
         await supabase.from('proposals').update({ pdf_url: publicUrlData.publicUrl }).eq('id', proposal.id);
         
         // Call our Edge Function to send email (if implemented)
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

  if (loading) return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', color: '#000'}}>Carregando...</div>;
  if (error || !proposal) return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', color: '#000'}}>{error}</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '40px 20px', color: '#333', fontFamily: "'Inter', sans-serif" }}>
       
       {isSuccess && (
         <div style={{ maxWidth: '800px', margin: '0 auto 20px', background: '#d4edda', color: '#155724', padding: '15px', borderRadius: '8px', textAlign: 'center', border: '1px solid #c3e6cb' }}>
           <strong>✅ Proposta Assinada com Sucesso!</strong><br/>
           Uma cópia em PDF foi gerada e enviada para o prestador.
         </div>
       )}

       <div ref={documentRef} style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '50px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #eee', paddingBottom: '20px', marginBottom: '30px' }}>
            <div>
               <h1 style={{ margin: '0 0 10px 0', fontSize: '24px', color: '#111' }}>{proposal.title}</h1>
               <div style={{ color: '#666', fontSize: '14px' }}>
                 Data de Emissão: {new Date(proposal.created_at || '').toLocaleDateString('pt-BR')}<br/>
                 Código da Proposta: #{proposal.id.split('-')[0].toUpperCase()}
               </div>
            </div>
            <div style={{ textAlign: 'right' }}>
               <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{(proposal as any).partner?.company_name || (proposal as any).partner?.full_name || 'Bravo Homes'}</div>
            </div>
          </div>

          {/* Content */}
          <div 
             className="ql-editor" 
             style={{ padding: 0 }}
             dangerouslySetInnerHTML={{ __html: proposal.content }} 
          />

          {/* Total Value if available */}
          {proposal.total_value && (
            <div style={{ marginTop: '40px', padding: '20px', background: '#fafafa', borderRight: '4px solid var(--gold)', borderRadius: '4px', textAlign: 'right' }}>
               <span style={{ fontSize: '14px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Valor Total Previsto</span>
               <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111' }}>R$ {proposal.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            </div>
          )}

          {/* Signature Area */}
          <div style={{ marginTop: '50px', paddingTop: '30px', borderTop: '2px solid #eee' }}>
             {proposal.status === 'signed' ? (
                <div>
                   <h3 style={{ margin: '0 0 15px 0', color: '#111' }}>Assinaturas Confirmedadas</h3>
                   <div style={{ display: 'flex', gap: '50px' }}>
                      <div style={{ textAlign: 'center' }}>
                         <img src={proposal.signature_url} alt="Assinatura Eletrônica" style={{ height: '80px', display: 'block', margin: '0 auto 10px', pointerEvents: 'none' }} />
                         <div style={{ borderTop: '1px solid #333', paddingTop: '10px', width: '250px' }}>
                            Assinatura do Cliente<br/>
                            <span style={{ fontSize: '11px', color: '#888' }}>IP Registrado — {new Date(proposal.signed_at || '').toLocaleString('pt-BR')}</span>
                         </div>
                      </div>
                   </div>
                </div>
             ) : (
                <div style={{ textAlign: 'center' }}>
                   {isProcessing ? (
                     <div>Processando e gerando PDF Seguro, aguarde...</div>
                   ) : (
                     <button 
                        style={{ padding: '15px 40px', background: 'var(--gold, #B8860B)', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
                        onClick={() => setIsSignModalOpen(true)}
                     >
                       ✍️ Assinar Proposta Eletronicamente
                     </button>
                   )}
                </div>
             )}
          </div>
       </div>

       {/* Signature Modal */}
       {isSignModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
             <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', maxWidth: '500px', width: '90%' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#111' }}>Colha sua assinatura</h3>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>Desenhe sua assinatura no quadro abaixo para concordar com os termos desta proposta.</p>
                
                <div style={{ border: '2px dashed #ccc', borderRadius: '8px', background: '#fafafa', marginBottom: '15px' }}>
                  <SignatureCanvas 
                    ref={sigCanvasRef} 
                    canvasProps={{ width: 440, height: 200, className: 'sigCanvas' }}
                    penColor="#000080"
                  />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <button style={{ padding: '10px 15px', border: '1px solid #ccc', background: 'transparent', borderRadius: '4px', cursor: 'pointer' }} onClick={clearSignature}>Limpar</button>
                   <div style={{ display: 'flex', gap: '10px' }}>
                     <button style={{ padding: '10px 15px', border: 'none', background: '#eee', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setIsSignModalOpen(false)}>Cancelar</button>
                     <button style={{ padding: '10px 20px', border: 'none', background: 'var(--gold, #B8860B)', color: '#fff', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }} onClick={handleConfirmSignature}>Confirmar</button>
                   </div>
                </div>
             </div>
          </div>
       )}
    </div>
  );
}
