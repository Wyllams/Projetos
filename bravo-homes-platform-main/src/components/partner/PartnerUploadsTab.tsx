import React from 'react';

interface PartnerUploadsTabProps {
  projects: any[];
  uploadProjectId: string;
  setUploadProjectId: (id: string) => void;
  projectFiles: any[];
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (files: FileList | null) => void;
  deleteFile: (f: any) => void;
  getFileIcon: (type: string) => string;
}

export default function PartnerUploadsTab({
  projects, uploadProjectId, setUploadProjectId, projectFiles,
  isUploading, fileInputRef, handleFileUpload, deleteFile, getFileIcon,
}: PartnerUploadsTabProps) {
  return (
    <div className="page active">
      <div className="u-section-header">
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'1.05rem'}}>Fotos &amp; Documentos</div>
      </div>

      <div className="u-mb-14">
        <div className="ch"><span className="ct">📁 Selecionar Projeto</span></div>
        <div className="cb">
          <select
            style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--b)',borderRadius:6,padding:'10px 12px',color:'var(--text)',fontFamily:"'DM Sans',sans-serif",fontSize:'0.85rem',outline:'none'}}
            value={uploadProjectId}
            onChange={e => setUploadProjectId(e.target.value)}
          >
            <option value="" disabled>-- Selecione --</option>
            {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name} — {p.service_type}</option>)}
          </select>
        </div>
      </div>

      {uploadProjectId && (
        <>
          <div className="card u-mb-14">
            <div className="ch"><span className="ct">📸 Enviar Arquivos</span></div>
            <div className="cb">
              <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="u-hide" onChange={e => handleFileUpload(e.target.files)} />
              <div
                className="upload-zone"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--gold)'; }}
                onDragLeave={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--b)'; }}
                onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--b)'; handleFileUpload(e.dataTransfer.files); }}
                style={{cursor: isUploading ? 'wait' : 'pointer', opacity: isUploading ? 0.6 : 1}}
              >
                <div className="upload-icon">{isUploading ? '⏳' : '📸'}</div>
                <div className="upload-text">{isUploading ? 'Enviando arquivos...' : 'Clique ou arraste fotos/documentos aqui'}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',color:'var(--t3)',marginTop:6}}>JPG, PNG, PDF, DOC, XLS · Vários arquivos de uma vez</div>
              </div>
            </div>
          </div>

          {projectFiles.filter(f => f.file_type?.startsWith('image/')).length > 0 && (
            <div className="card u-mb-14">
              <div className="ch"><span className="ct">🖼️ Galeria de Fotos</span><span className="ca">{projectFiles.filter(f => f.file_type?.startsWith('image/')).length} fotos</span></div>
              <div className="cb">
                <div className="photo-grid">
                  {projectFiles.filter(f => f.file_type?.startsWith('image/')).map((f: any) => (
                    <div key={f.id} className="photo-thumb" style={{backgroundImage: `url(${f.file_url})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative'}}>
                      <div style={{position:'absolute',top:4,right:4,display:'flex',gap:4}}>
                        <a href={f.file_url} target="_blank" rel="noreferrer" style={{background:'rgba(0,0,0,0.6)',borderRadius:4,padding:'2px 6px',fontSize:'0.65rem',color:'#fff',textDecoration:'none'}} onClick={e => e.stopPropagation()}>🔍</a>
                        <button style={{background:'rgba(200,0,0,0.7)',border:'none',borderRadius:4,padding:'2px 6px',fontSize:'0.65rem',color:'#fff',cursor:'pointer'}} onClick={e => { e.stopPropagation(); deleteFile(f); }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="ch"><span className="ct">📄 Documentos do Projeto</span><span className="ca">{projectFiles.filter(f => !f.file_type?.startsWith('image/')).length} docs</span></div>
            <div className="cb" style={{padding: projectFiles.filter(f => !f.file_type?.startsWith('image/')).length === 0 ? undefined : 0}}>
              {projectFiles.filter(f => !f.file_type?.startsWith('image/')).length === 0 && (
                <div style={{padding:'20px',textAlign:'center',color:'var(--t3)',fontSize:'0.85rem'}}>Nenhum documento enviado ainda.</div>
              )}
              {projectFiles.filter(f => !f.file_type?.startsWith('image/')).map((f: any) => (
                <div key={f.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:'1px solid var(--b)'}}>
                  <span style={{fontSize:'1.4rem'}}>{getFileIcon(f.file_type)}</span>
                  <div className="u-flex-1-min">
                    <div style={{fontSize:'0.82rem',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{f.file_name}</div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',color:'var(--t3)',textTransform:'uppercase'}}>{f.file_type?.split('/').pop()} · {new Date(f.created_at).toLocaleDateString()}</div>
                  </div>
                  <a href={f.file_url} target="_blank" rel="noreferrer" className="btn ghost" style={{fontSize:'0.72rem',padding:'5px 12px',textDecoration:'none'}}>Ver</a>
                  <button className="btn ghost" style={{fontSize:'0.72rem',padding:'5px 10px',color:'var(--red)'}} onClick={() => deleteFile(f)}>🗑</button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!uploadProjectId && (
        <div className="card">
          <div className="cb" style={{padding:'30px',textAlign:'center',color:'var(--t3)'}}>
            <div className="u-emoji-icon">📁</div>
            <div style={{fontSize:'0.9rem'}}>Selecione um projeto acima para gerenciar fotos e documentos</div>
          </div>
        </div>
      )}
    </div>
  );
}
