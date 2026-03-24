import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function useSocialMedia() {
  const [socialAccounts, setSocialAccounts] = useState<any[]>([]);
  const [socialPosts, setSocialPosts] = useState<any[]>([]);
  const [socialPostForm, setSocialPostForm] = useState({ content: '', image_url: '', facebook: true, instagram: false });
  const [socialPosting, setSocialPosting] = useState(false);

  const META_APP_ID = import.meta.env.VITE_META_APP_ID || '914191061529946';

  const loadSocialData = async () => {
    const [accts, posts] = await Promise.all([
      supabase.from('social_accounts').select('*').order('created_at', { ascending: false }),
      supabase.from('social_posts').select('*').order('created_at', { ascending: false })
    ]);
    if (accts.data) setSocialAccounts(accts.data);
    if (posts.data) setSocialPosts(posts.data);
  };

  const handleFbConnect = (showToast: (msg: string) => void) => {
    const redirectUri = window.location.origin + '/admin';
    const scope = 'pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish,public_profile';
    const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=token`;
    
    const popup = window.open(authUrl, 'fbAuth', 'width=600,height=700,scrollbars=yes');
    
    const interval = setInterval(async () => {
      try {
        if (!popup || popup.closed) { clearInterval(interval); return; }
        const popupUrl = popup.location.href;
        if (popupUrl.includes('access_token=')) {
          clearInterval(interval);
          const hash = popupUrl.split('#')[1];
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token');
          popup.close();
          
          if (!accessToken) { showToast('Erro: Token não encontrado.'); return; }
          
          const pagesRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`);
          const pagesData = await pagesRes.json();
          
          if (!pagesData.data || pagesData.data.length === 0) {
            showToast('Nenhuma Facebook Page encontrada na sua conta. Crie uma Page primeiro.');
            return;
          }
          
          const page = pagesData.data[0];
          const pageToken = page.access_token;
          const pageId = page.id;
          const pageName = page.name;
          
          const { error: fbErr } = await supabase.from('social_accounts').upsert({
            platform: 'facebook',
            page_id: pageId,
            page_name: pageName,
            access_token: pageToken,
          }, { onConflict: 'platform' });
          
          if (fbErr) console.error('FB save error:', fbErr);
          
          const igRes = await fetch(`https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`);
          const igData = await igRes.json();
          
          if (igData.instagram_business_account) {
            const igId = igData.instagram_business_account.id;
            await supabase.from('social_accounts').upsert({
              platform: 'instagram',
              page_id: pageId,
              page_name: pageName,
              access_token: pageToken,
              ig_business_id: igId,
            }, { onConflict: 'platform' });
            showToast(`✅ Facebook (${pageName}) e Instagram conectados!`);
          } else {
            showToast(`✅ Facebook (${pageName}) conectado! Instagram não detectado.`);
          }
          
          await loadSocialData();
        }
      } catch { /* cross-origin, still waiting */ }
    }, 500);
  };

  const handleSocialPublish = async (showToast: (msg: string) => void) => {
    if (!socialPostForm.content.trim()) return;
    setSocialPosting(true);
    
    try {
      const results: string[] = [];
      
      if (socialPostForm.facebook) {
        const fbAccount = socialAccounts.find(a => a.platform === 'facebook');
        if (fbAccount) {
          let fbUrl = `https://graph.facebook.com/v21.0/${fbAccount.page_id}`;
          const fbBody: Record<string, string> = { access_token: fbAccount.access_token };
          
          if (socialPostForm.image_url) {
            fbUrl += '/photos';
            fbBody.url = socialPostForm.image_url;
            fbBody.message = socialPostForm.content;
          } else {
            fbUrl += '/feed';
            fbBody.message = socialPostForm.content;
          }
          
          const fbRes = await fetch(fbUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fbBody) });
          const fbData = await fbRes.json();
          
          if (fbData.id || fbData.post_id) {
            const postId = fbData.id || fbData.post_id;
            await supabase.from('social_posts').insert({
              platform: 'facebook',
              content: socialPostForm.content,
              image_url: socialPostForm.image_url || null,
              post_id: postId,
              post_url: `https://www.facebook.com/${postId}`,
              status: 'published',
              published_at: new Date().toISOString()
            });
            results.push('Facebook ✅');
          } else {
            results.push(`Facebook ❌ (${fbData.error?.message || 'Erro'})`);
          }
        }
      }
      
      if (socialPostForm.instagram) {
        const igAccount = socialAccounts.find(a => a.platform === 'instagram');
        if (igAccount && igAccount.ig_business_id) {
          if (!socialPostForm.image_url) {
            results.push('Instagram ❌ (imagem obrigatória)');
          } else {
            const containerRes = await fetch(`https://graph.facebook.com/v21.0/${igAccount.ig_business_id}/media`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image_url: socialPostForm.image_url, caption: socialPostForm.content, access_token: igAccount.access_token })
            });
            const containerData = await containerRes.json();
            
            if (containerData.id) {
              const publishRes = await fetch(`https://graph.facebook.com/v21.0/${igAccount.ig_business_id}/media_publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ creation_id: containerData.id, access_token: igAccount.access_token })
              });
              const publishData = await publishRes.json();
              
              if (publishData.id) {
                await supabase.from('social_posts').insert({
                  platform: 'instagram',
                  content: socialPostForm.content,
                  image_url: socialPostForm.image_url,
                  post_id: publishData.id,
                  post_url: `https://www.instagram.com/p/${publishData.id}`,
                  status: 'published',
                  published_at: new Date().toISOString()
                });
                results.push('Instagram ✅');
              } else {
                results.push(`Instagram ❌ (${publishData.error?.message || 'Erro ao publicar'})`);
              }
            } else {
              results.push(`Instagram ❌ (${containerData.error?.message || 'Erro ao criar container'})`);
            }
          }
        }
      }
      
      showToast(`Publicação: ${results.join(' | ')}`);
      setSocialPostForm({ content: '', image_url: '', facebook: true, instagram: false });
      await loadSocialData();
    } catch (err: any) {
      showToast(`Erro: ${err.message}`);
    } finally {
      setSocialPosting(false);
    }
  };

  return {
    socialAccounts, setSocialAccounts,
    socialPosts, setSocialPosts,
    socialPostForm, setSocialPostForm,
    socialPosting, setSocialPosting,
    loadSocialData, handleFbConnect, handleSocialPublish,
  };
}
