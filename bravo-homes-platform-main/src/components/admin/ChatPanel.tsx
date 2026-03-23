import React, { useRef } from 'react';

interface ChatPanelProps {
  chatPartners: any[];
  selectedChatUser: any;
  setSelectedChatUser: (u: any) => void;
  messages: any[];
  setMessages: (fn: (prev: any[]) => any[]) => void;
  setAllChatMessages: (fn: (prev: any[]) => any[]) => void;
  user: any;
  newMessage: string;
  setNewMessage: (v: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  renderMessageContent: (msg: any) => React.ReactNode;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  showToast: (msg: string) => void;
  showConfirm: (msg: string, cb: () => void) => void;
  isRecording: boolean;
  recordingTime: number;
  formatTime: (t: number) => string;
  cancelRecording: () => void;
  stopRecordingAndSend: () => void;
  startRecording: () => void;
  isUploading: boolean;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  supabase: any;
}

export default function ChatPanel({
  chatPartners, selectedChatUser, setSelectedChatUser, messages, setMessages,
  setAllChatMessages, user, newMessage, setNewMessage, handleSendMessage,
  renderMessageContent, messagesEndRef, showToast, showConfirm,
  isRecording, recordingTime, formatTime, cancelRecording, stopRecordingAndSend,
  startRecording, isUploading, handleFileSelect, fileInputRef, supabase,
}: ChatPanelProps) {
  return (
    <div className="page active" style={{display: 'flex', gap: '16px', height: 'calc(100vh - 80px)'}}>
      <div className="card" style={{width: '300px', display: 'flex', flexDirection: 'column', height: '100%', padding: '0'}}>
         <div style={{padding: '16px', borderBottom: '1px solid var(--b)', fontWeight: 700}}>Parceiros (Chat)</div>
         <div style={{flex: 1, overflowY: 'auto'}}>
           {chatPartners.map(p => (
             <div key={p.id} onClick={() => setSelectedChatUser(p)} style={{padding: '12px 16px', borderBottom: '1px solid var(--b)', cursor: 'pointer', background: selectedChatUser?.id === p.id ? 'var(--bg3)' : 'transparent', display: 'flex', alignItems: 'center', gap: '10px'}}>
               <div className="av" style={{background: 'var(--gold)', color: '#000', width: '32px', height: '32px', fontSize: '0.8rem', fontWeight: 'bold'}}>{(p.full_name || p.name || 'PA').substring(0,2).toUpperCase()}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.full_name || p.name || 'Parceiro'}</div>
                </div>
                <button title="Apagar conversa" onClick={(e) => { e.stopPropagation(); showConfirm(`Deseja apagar toda a conversa com "${p.full_name || p.name || 'este parceiro'}"? Esta ação não pode ser desfeita.`, async () => {
                  await supabase.from('messages').delete().or(
                    `and(sender_id.eq.${user?.id},receiver_id.eq.${p.id}),and(sender_id.eq.${p.id},receiver_id.eq.${user?.id})`
                  );
                  setMessages(prev => prev.filter(m =>
                    !((m.sender_id === user?.id && m.receiver_id === p.id) ||
                      (m.sender_id === p.id && m.receiver_id === user?.id))
                  ));
                  setAllChatMessages(prev => prev.filter(m =>
                    !((m.sender_id === user?.id && m.receiver_id === p.id) ||
                      (m.sender_id === p.id && m.receiver_id === user?.id))
                  ));
                  if (selectedChatUser?.id === p.id) setSelectedChatUser(null);
                  showToast('Conversa apagada com sucesso!');
                }); }} style={{background:'transparent',border:'none',cursor:'pointer',fontSize:'0.85rem',padding:'4px',color:'var(--t3)',opacity:0.5,transition:'opacity .15s'}} onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}>🗑️</button>
             </div>
           ))}
           {chatPartners.length === 0 && <div style={{padding: '20px', color: 'var(--t3)', fontSize: '0.85rem', textAlign: 'center'}}>Nenhuma conversa ativa.</div>}
         </div>
      </div>
      <div className="card" style={{flex: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: '0'}}>
         {selectedChatUser ? (
           <>
             <div style={{padding: '16px', borderBottom: '1px solid var(--b)', display: 'flex', alignItems: 'center', gap: '10px'}}>
               <div className="av" style={{background: 'var(--gold)', color: '#000', width: '40px', height: '40px'}}>{(selectedChatUser.full_name || selectedChatUser.name || 'PA').substring(0,2).toUpperCase()}</div>
               <div>
                 <div style={{fontWeight: 700}}>{selectedChatUser.full_name || selectedChatUser.name || 'Parceiro'}</div>
                 <div style={{fontSize: '0.75rem', color: 'var(--t2)'}}>{selectedChatUser.specialty || 'Parceiro'}</div>
               </div>
             </div>
             <div style={{flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg)'}}>
                {messages.length === 0 ? (
                   <div style={{margin: 'auto', color: 'var(--t3)', fontStyle: 'italic', fontSize: '0.85rem'}}>Nenhuma mensagem ainda. Envie a primeira!</div>
                ) : (
                   messages.map(msg => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} style={{alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%', background: isMe ? 'var(--gold)' : 'var(--bg3)', color: isMe ? '#000' : 'var(--text)', padding: '10px 14px', borderRadius: isMe ? '12px 12px 0 12px' : '12px 12px 12px 0', fontSize: '0.9rem', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'}}>
                          {renderMessageContent(msg)}
                          <div style={{fontSize: '0.65rem', color: isMe ? 'rgba(0,0,0,0.6)' : 'var(--t3)', marginTop: '6px', textAlign: 'right'}}>{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </div>
                      );
                   })
                )}
                <div ref={messagesEndRef} />
             </div>
             <div style={{padding: '16px', borderTop: '1px solid var(--b)', display: 'flex', gap: '10px', background: 'var(--bg2)', alignItems: 'center'}}>
                {isRecording ? (
                  <div style={{flex: 1, display: 'flex', alignItems: 'center', gap: '15px', color: 'var(--red)', fontWeight: 600}}>
                    <div style={{fontSize: '1.2rem', animation: 'pulsing 1s infinite'}}>🔴</div>
                    <style dangerouslySetInnerHTML={{__html: `@keyframes pulsing { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }`}} />
                    <div>Gravando: {formatTime(recordingTime)}</div>
                    <div className="u-flex-1"></div>
                    <button type="button" className="btn ghost" style={{color: 'var(--red)'}} onClick={cancelRecording}>Cancelar</button>
                    <button type="button" className="btn gold" onClick={stopRecordingAndSend}>Enviar Áudio</button>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} style={{flex: 1, display: 'flex', gap: '10px'}}>
                    <input type="file" ref={fileInputRef} style={{display: 'none'}} onChange={handleFileSelect} />
                    <button type="button" className="btn ghost" style={{padding: '0 12px', fontSize: '1.2rem'}} onClick={() => fileInputRef.current?.click()} title="Anexar arquivo" disabled={isUploading}>📎</button>
                    
                    <input type="text" className="f-inp" placeholder={isUploading ? "Enviando arquivo..." : "Digite uma mensagem..."} value={newMessage} onChange={e => setNewMessage(e.target.value)} disabled={isUploading} style={{flex: 1, margin: 0}} />
                    
                    {newMessage.trim() === '' ? (
                      <button type="button" className="btn ghost" style={{padding: '0 12px', fontSize: '1.2rem', color: 'var(--gold)'}} disabled={isUploading} onClick={startRecording} title="Gravar Áudio">🎤</button>
                    ) : (
                      <button type="submit" className="btn gold" style={{padding: '0 20px'}} disabled={isUploading}>Enviar</button>
                    )}
                  </form>
                )}
             </div>
           </>
         ) : (
           <div style={{margin: 'auto', color: 'var(--t3)', textAlign: 'center'}}>
              <div style={{fontSize: '3rem', marginBottom: '10px'}}>💬</div>
              <div>Selecione um parceiro ao lado<br/>para iniciar o chat.</div>
           </div>
         )}
      </div>
    </div>
  );
}
